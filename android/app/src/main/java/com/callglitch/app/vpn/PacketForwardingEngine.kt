package com.callglitch.app.vpn

import android.net.Network
import android.net.VpnService
import android.util.Log
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.ImpairmentDirection
import kotlinx.coroutines.*
import java.io.FileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

/**
 * User-space packet forwarding and impairment engine foundation.
 * 
 * Architecture Note:
 * This engine operates between the local TUN file descriptor and protected outbound sockets.
 * Incoming call packets from the TUN interface pass through a bounded delay queue and random loss filter,
 * then are dispatched through underlying direct sockets protected with VpnService.protect() to prevent routing loops.
 * 
 * Identified Limitations & Next Milestone Target:
 * General internet calls often require full stateful TCP/TLS signaling and dual-stack IPv4/IPv6 translation.
 * Milestone 2 integrates an embedded user-space TCP/IP stack (e.g. tun2socks / lwIP) to handle full
 * bidirectional TCP connection state machines alongside this impairment pipeline.
 */
class PacketForwardingEngine(
    private val vpnService: VpnService,
    private val tunFd: FileDescriptor,
    private var config: GlitchConfig,
    private val onStatsUpdate: (forwarded: Long, dropped: Long) -> Unit
) {
    private val isRunning = AtomicBoolean(false)
    private val lastHeartbeat = AtomicLong(System.currentTimeMillis())
    private val forwardedCount = AtomicLong(0)
    private val droppedCount = AtomicLong(0)

    private val engineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // UDP NAT session table: maps client (srcIp:srcPort -> dstIp:dstPort) to a protected DatagramSocket session
    private val udpSessions = ConcurrentHashMap<String, UdpSession>()

    // Bounded packet delay queue for outgoing & incoming impairment (Max 500 packets to prevent OOM)
    private val maxQueueCapacity = 500
    private val delayQueue = PriorityBlockingQueue<DelayedPacket>(maxQueueCapacity, compareBy { it.scheduledReleaseTime })

    // Tun streams
    private val tunIn = FileInputStream(tunFd)
    private val tunOut = FileOutputStream(tunFd)

    companion object {
        private const val TAG = "PacketForwardingEngine"
        private const val BUFFER_SIZE = 32767
    }

    fun start() {
        if (!isRunning.compareAndSet(false, true)) return

        // 1. Thread: TUN Packet Reader (Outgoing traffic from App)
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get()) {
                try {
                    val length = tunIn.read(buffer)
                    if (length > 0) {
                        lastHeartbeat.set(System.currentTimeMillis())
                        val packetData = buffer.copyOf(length)
                        handleOutgoingTunPacket(packetData)
                    }
                } catch (e: Exception) {
                    if (isRunning.get()) {
                        Log.e(TAG, "Error reading from TUN: ${e.message}")
                    }
                    break
                }
            }
        }

        // 2. Thread: Delay Queue Dispatcher (Releases impaired packets when their delay expires)
        engineScope.launch {
            while (isRunning.get()) {
                try {
                    val head = delayQueue.peek()
                    val now = System.currentTimeMillis()
                    if (head != null && head.scheduledReleaseTime <= now) {
                        val packet = delayQueue.poll()
                        if (packet != null) {
                            dispatchPacket(packet)
                        }
                    } else if (head != null) {
                        val waitTime = (head.scheduledReleaseTime - now).coerceAtLeast(1)
                        delay(waitTime)
                    } else {
                        delay(2)
                    }
                } catch (e: Exception) {
                    delay(5)
                }
            }
        }

        // 3. Periodic NAT Cleanup
        engineScope.launch {
            while (isRunning.get()) {
                delay(30000L)
                cleanStaleSessions()
            }
        }
    }

    fun updateConfig(newConfig: GlitchConfig) {
        this.config = newConfig
        Log.i(TAG, "Impairment configuration updated: ${newConfig.profileType.displayName}")
    }

    fun onUnderlyingNetworkChanged(network: Network) {
        // Re-protect open sockets on network migration
        udpSessions.values.forEach { session ->
            try {
                vpnService.protect(session.socket)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to re-protect socket: ${e.message}")
            }
        }
    }

    private fun handleOutgoingTunPacket(data: ByteArray) {
        if (data.isEmpty()) return
        val version = (data[0].toInt() shr 4) and 0x0F

        if (version != 4 && version != 6) return // Only IPv4 and IPv6

        val protocol = if (version == 4) data[9].toInt() and 0xFF else data[6].toInt() and 0xFF

        val isUdp = protocol == 17
        val isTcp = protocol == 6

        val shouldImpair = (isUdp || (isTcp && config.affectTcp)) &&
                (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.OUTGOING)

        if (shouldImpair) {
            // Apply packet loss check
            if (shouldDropPacket()) {
                val dropped = droppedCount.incrementAndGet()
                onStatsUpdate(forwardedCount.get(), dropped)
                return
            }

            // Apply latency + jitter
            val delayMs = calculateDelay()
            if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                val scheduledTime = System.currentTimeMillis() + delayMs
                delayQueue.offer(DelayedPacket(data, scheduledTime, isIncoming = false, protocol = protocol))
                return
            }
        }

        // Forward immediately if no delay
        forwardOutgoingDirect(data, protocol)
    }

    private fun forwardOutgoingDirect(data: ByteArray, protocol: Int) {
        if (protocol == 17) { // UDP
            forwardUdpPacket(data)
        } else {
            // Non-UDP pass-through
            forwardRawPacket(data)
        }
    }

    private fun forwardUdpPacket(packet: ByteArray) {
        try {
            val ipHeaderLen = (packet[0].toInt() and 0x0F) * 4
            val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
            val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

            val srcPort = ((packet[ipHeaderLen].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 1].toInt() and 0xFF)
            val dstPort = ((packet[ipHeaderLen + 2].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 3].toInt() and 0xFF)

            val udpPayload = packet.copyOfRange(ipHeaderLen + 8, packet.size)

            val sessionKey = "$srcIp:$srcPort->$dstIp:$dstPort"
            val session = udpSessions.computeIfAbsent(sessionKey) {
                createUdpSession(srcIp, srcPort, dstIp, dstPort)
            }

            session.lastActivity = System.currentTimeMillis()
            val datagram = DatagramPacket(udpPayload, udpPayload.size, dstIp, dstPort)
            session.socket.send(datagram)

            val forwarded = forwardedCount.incrementAndGet()
            if (forwarded % 20L == 0L) {
                onStatsUpdate(forwarded, droppedCount.get())
            }
        } catch (e: Exception) {
            Log.d(TAG, "UDP forward error: ${e.message}")
        }
    }

    private fun createUdpSession(srcIp: InetAddress, srcPort: Int, dstIp: InetAddress, dstPort: Int): UdpSession {
        val socket = DatagramSocket()
        // CRITICAL: Protect socket from VPN routing loops
        vpnService.protect(socket)

        val session = UdpSession(socket, srcIp, srcPort, dstIp, dstPort, System.currentTimeMillis())

        // Reverse listener for incoming UDP media packets from Internet
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get() && !socket.isClosed) {
                try {
                    val incoming = DatagramPacket(buffer, buffer.size)
                    socket.receive(incoming)
                    handleIncomingUdpPacket(session, incoming.data.copyOf(incoming.length))
                } catch (e: Exception) {
                    break
                }
            }
        }
        return session
    }

    private fun handleIncomingUdpPacket(session: UdpSession, payload: ByteArray) {
        val shouldImpair = (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.INCOMING)

        if (shouldImpair) {
            if (shouldDropPacket()) {
                val dropped = droppedCount.incrementAndGet()
                onStatsUpdate(forwardedCount.get(), dropped)
                return
            }

            val delayMs = calculateDelay()
            if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                val scheduledTime = System.currentTimeMillis() + delayMs
                val syntheticIpPacket = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
                delayQueue.offer(DelayedPacket(syntheticIpPacket, scheduledTime, isIncoming = true, protocol = 17))
                return
            }
        }

        val syntheticIpPacket = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
        writeToTun(syntheticIpPacket)
    }

    private fun synthesizeIpUdpPacket(srcIp: InetAddress, srcPort: Int, dstIp: InetAddress, dstPort: Int, payload: ByteArray): ByteArray {
        val ipLen = 20
        val udpLen = 8 + payload.size
        val totalLen = ipLen + udpLen
        val packet = ByteBuffer.allocate(totalLen)

        // IPv4 Header
        packet.put(0x45.toByte()) // Version 4, IHL 5
        packet.put(0x00.toByte()) // DSCP / ECN
        packet.putShort(totalLen.toShort())
        packet.putShort(Random.nextInt(65535).toShort()) // ID
        packet.putShort(0x4000.toShort()) // Flags: Don't Fragment
        packet.put(64.toByte()) // TTL
        packet.put(17.toByte()) // Protocol: UDP
        packet.putShort(0) // Checksum placeholder
        packet.put(srcIp.address)
        packet.put(dstIp.address)

        // UDP Header
        packet.putShort(srcPort.toShort())
        packet.putShort(dstPort.toShort())
        packet.putShort(udpLen.toShort())
        packet.putShort(0) // UDP Checksum

        // Payload
        packet.put(payload)

        return packet.array()
    }

    private fun writeToTun(data: ByteArray) {
        try {
            synchronized(tunOut) {
                tunOut.write(data)
                tunOut.flush()
            }
            forwardedCount.incrementAndGet()
        } catch (e: Exception) {
            Log.e(TAG, "Error writing to TUN: ${e.message}")
        }
    }

    private fun dispatchPacket(packet: DelayedPacket) {
        if (packet.isIncoming) {
            writeToTun(packet.data)
        } else {
            forwardOutgoingDirect(packet.data, packet.protocol)
        }
    }

    private fun forwardRawPacket(data: ByteArray) {
        forwardedCount.incrementAndGet()
    }

    private fun shouldDropPacket(): Boolean {
        // Burst drop simulation
        if (config.burstInterruptionEnabled) {
            val nowSeconds = (System.currentTimeMillis() / 1000) % config.burstIntervalSeconds
            if (nowSeconds < (config.burstDurationMs / 1000.0)) {
                return true
            }
        }

        // Statistical loss
        if (config.packetLossPercent <= 0.0) return false
        val roll = Random.nextDouble(100.0)
        return roll < config.packetLossPercent
    }

    private fun calculateDelay(): Long {
        val base = config.baseLatencyMs.toLong()
        val jitter = config.randomJitterMs
        if (jitter <= 0) return base
        val randomOffset = Random.nextInt(-jitter, jitter + 1)
        return (base + randomOffset).coerceAtLeast(0)
    }

    private fun cleanStaleSessions() {
        val now = System.currentTimeMillis()
        val it = udpSessions.entries.iterator()
        while (it.hasNext()) {
            val entry = it.next()
            if (now - entry.value.lastActivity > 60000L) { // 60s idle timeout
                try {
                    entry.value.socket.close()
                } catch (e: Exception) {}
                it.remove()
            }
        }
    }

    fun isHealthy(): Boolean {
        return (System.currentTimeMillis() - lastHeartbeat.get()) < 15000L
    }

    fun stop() {
        isRunning.set(false)
        delayQueue.clear()

        udpSessions.values.forEach { session ->
            try { session.socket.close() } catch (e: Exception) {}
        }
        udpSessions.clear()

        try { tunIn.close() } catch (e: Exception) {}
        try { tunOut.close() } catch (e: Exception) {}

        engineScope.cancel()
    }

    private data class DelayedPacket(
        val data: ByteArray,
        val scheduledReleaseTime: Long,
        val isIncoming: Boolean,
        val protocol: Int
    )

    private data class UdpSession(
        val socket: DatagramSocket,
        val srcIp: InetAddress,
        val srcPort: Int,
        val dstIp: InetAddress,
        val dstPort: Int,
        var lastActivity: Long
    )
}
