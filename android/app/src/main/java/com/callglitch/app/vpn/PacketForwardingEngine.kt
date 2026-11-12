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
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

/**
 * Rootless, per-app user-space network forwarding and impairment engine.
 * 
 * Handles both UDP (VoIP/video call media, STUN/TURN, DNS) and TCP (call signaling, TLS, HTTP)
 * with transparent user-space socket proxying and RFC-compliant IPv4, UDP, and TCP checksum calculations.
 * 
 * Preserves DNS and call signaling so target applications maintain full, uninterrupted connectivity,
 * while applying precise latency, jitter, and packet loss to audio and video call streams.
 */
class PacketForwardingEngine(
    private val vpnService: VpnService,
    private val tunFd: FileDescriptor,
    private var config: GlitchConfig,
    private val onStatsUpdate: (forwarded: Long, dropped: Long) -> Unit
) {
    private val isRunning = AtomicBoolean(false)
    private val forwardedCount = AtomicLong(0)
    private val droppedCount = AtomicLong(0)

    private val engineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // UDP NAT session table: maps (clientPort -> dstIp:dstPort) to a protected DatagramSocket session
    private val udpSessions = ConcurrentHashMap<String, UdpSession>()

    // TCP transparent proxy session table: maps (clientPort -> dstIp:dstPort) to a protected Socket session
    private val tcpSessions = ConcurrentHashMap<String, TcpSession>()

    // Bounded packet delay queue for outgoing & incoming impairment (Max 3000 packets for up to 3000ms latency)
    private val maxQueueCapacity = 3000
    private val delayQueue = PriorityBlockingQueue<DelayedPacket>(maxQueueCapacity, compareBy { it.scheduledReleaseTime })

    // TUN streams
    private val tunIn = FileInputStream(tunFd)
    private val tunOut = FileOutputStream(tunFd)

    companion object {
        private const val TAG = "PacketForwardingEngine"
        private const val BUFFER_SIZE = 32767
    }

    fun start() {
        if (!isRunning.compareAndSet(false, true)) return

        // 1. Thread: TUN Packet Reader (Traffic from the allowed application)
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get()) {
                try {
                    val length = tunIn.read(buffer)
                    if (length > 0) {
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

        // 2. Thread: Delay Queue Dispatcher (Releases delayed packets when their delay expires)
        engineScope.launch {
            while (isRunning.get()) {
                try {
                    val head = delayQueue.peek()
                    val now = System.currentTimeMillis()
                    if (head != null && head.scheduledReleaseTime <= now) {
                        val packet = delayQueue.poll()
                        if (packet != null) {
                            dispatchDelayedPacket(packet)
                        }
                    } else if (head != null) {
                        val waitTime = (head.scheduledReleaseTime - now).coerceAtLeast(1)
                        delay(waitTime.coerceAtMost(10))
                    } else {
                        delay(2)
                    }
                } catch (e: Exception) {
                    delay(5)
                }
            }
        }

        // 3. Periodic Session Housekeeping (Every 30s)
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
        // Re-protect active sockets on Wi-Fi <-> LTE handover
        udpSessions.values.forEach { session ->
            try { vpnService.protect(session.socket) } catch (ignored: Exception) {}
        }
        tcpSessions.values.forEach { session ->
            try { vpnService.protect(session.socket) } catch (ignored: Exception) {}
        }
    }

    // =========================================================================
    // OUTGOING PACKET PROCESSING (From App through TUN)
    // =========================================================================

    private fun handleOutgoingTunPacket(packet: ByteArray) {
        if (packet.size < 20) return
        val version = (packet[0].toInt() shr 4) and 0x0F
        if (version != 4) return // Process IPv4 packets

        val ipHeaderLen = (packet[0].toInt() and 0x0F) * 4
        if (packet.size < ipHeaderLen) return

        val protocol = packet[9].toInt() and 0xFF

        when (protocol) {
            17 -> handleOutgoingUdp(packet, ipHeaderLen)
            6 -> handleOutgoingTcp(packet, ipHeaderLen)
            1 -> handleOutgoingIcmp(packet, ipHeaderLen)
            else -> {
                // Non-TCP/UDP traffic counted without processing
                forwardedCount.incrementAndGet()
            }
        }
    }

    // -------------------------------------------------------------------------
    // UDP PROCESSING (VoIP audio/video RTP, STUN/TURN, DNS)
    // -------------------------------------------------------------------------

    private fun handleOutgoingUdp(packet: ByteArray, ipHeaderLen: Int) {
        if (packet.size < ipHeaderLen + 8) return

        val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
        val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

        val srcPort = ((packet[ipHeaderLen].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 1].toInt() and 0xFF)
        val dstPort = ((packet[ipHeaderLen + 2].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 3].toInt() and 0xFF)
        val udpLen = ((packet[ipHeaderLen + 4].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 5].toInt() and 0xFF)

        val endPayload = (ipHeaderLen + udpLen).coerceAtMost(packet.size)
        if (ipHeaderLen + 8 > endPayload) return
        val payload = packet.copyOfRange(ipHeaderLen + 8, endPayload)

        val isDns = dstPort == 53 || srcPort == 53

        // CRITICAL RULE: DNS queries are NEVER dropped or delayed
        if (isDns) {
            sendUdpToNetwork(srcIp, srcPort, dstIp, dstPort, payload)
            return
        }

        val shouldImpair = (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.OUTGOING)

        if (shouldImpair) {
            // Check packet loss
            if (shouldDropPacket()) {
                val dropped = droppedCount.incrementAndGet()
                onStatsUpdate(forwardedCount.get(), dropped)
                return
            }

            // Check latency and jitter
            val delayMs = calculateDelay()
            if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                val scheduled = System.currentTimeMillis() + delayMs
                delayQueue.offer(DelayedPacket(
                    data = payload,
                    scheduledReleaseTime = scheduled,
                    isIncoming = false,
                    isTcp = false,
                    srcIp = srcIp,
                    srcPort = srcPort,
                    dstIp = dstIp,
                    dstPort = dstPort
                ))
                return
            }
        }

        // Direct forward without delay
        sendUdpToNetwork(srcIp, srcPort, dstIp, dstPort, payload)
    }

    private fun sendUdpToNetwork(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray
    ) {
        try {
            val sessionKey = "$srcPort->$dstIp:$dstPort"
            val session = udpSessions.computeIfAbsent(sessionKey) {
                createUdpSession(srcIp, srcPort, dstIp, dstPort)
            }
            session.lastActivity = System.currentTimeMillis()

            val datagram = DatagramPacket(payload, payload.size, dstIp, dstPort)
            session.socket.send(datagram)

            val forwarded = forwardedCount.incrementAndGet()
            if (forwarded % 25L == 0L) {
                onStatsUpdate(forwarded, droppedCount.get())
            }
        } catch (e: Exception) {
            Log.d(TAG, "UDP send error: ${e.message}")
        }
    }

    private fun createUdpSession(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int
    ): UdpSession {
        val socket = DatagramSocket()
        vpnService.protect(socket)

        val session = UdpSession(socket, srcIp, srcPort, dstIp, dstPort, System.currentTimeMillis())

        // Inbound UDP packet receiver from network -> return to TUN
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get() && !socket.isClosed) {
                try {
                    val incoming = DatagramPacket(buffer, buffer.size)
                    socket.receive(incoming)
                    session.lastActivity = System.currentTimeMillis()
                    val payload = incoming.data.copyOf(incoming.length)
                    handleIncomingUdpPacket(session, payload)
                } catch (e: Exception) {
                    break
                }
            }
        }
        return session
    }

    private fun handleIncomingUdpPacket(session: UdpSession, payload: ByteArray) {
        val isDns = session.dstPort == 53 || session.srcPort == 53

        // DNS responses never impaired
        if (isDns) {
            val synth = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
            writeToTun(synth)
            return
        }

        val shouldImpair = (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.INCOMING)

        if (shouldImpair) {
            if (shouldDropPacket()) {
                val dropped = droppedCount.incrementAndGet()
                onStatsUpdate(forwardedCount.get(), dropped)
                return
            }

            val delayMs = calculateDelay()
            if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                val scheduled = System.currentTimeMillis() + delayMs
                val synth = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
                delayQueue.offer(DelayedPacket(
                    data = synth,
                    scheduledReleaseTime = scheduled,
                    isIncoming = true,
                    isTcp = false,
                    srcIp = session.dstIp,
                    srcPort = session.dstPort,
                    dstIp = session.srcIp,
                    dstPort = session.srcPort
                ))
                return
            }
        }

        val synth = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
        writeToTun(synth)
    }

    // -------------------------------------------------------------------------
    // TCP PROCESSING (Call signaling, TLS, HTTP, messaging)
    // -------------------------------------------------------------------------

    private fun handleOutgoingTcp(packet: ByteArray, ipHeaderLen: Int) {
        if (packet.size < ipHeaderLen + 20) return

        val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
        val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

        val srcPort = ((packet[ipHeaderLen].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 1].toInt() and 0xFF)
        val dstPort = ((packet[ipHeaderLen + 2].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 3].toInt() and 0xFF)

        val clientSeq = (((packet[ipHeaderLen + 4].toLong() and 0xFF) shl 24) or
                ((packet[ipHeaderLen + 5].toLong() and 0xFF) shl 16) or
                ((packet[ipHeaderLen + 6].toLong() and 0xFF) shl 8) or
                (packet[ipHeaderLen + 7].toLong() and 0xFF))

        val dataOffset = ((packet[ipHeaderLen + 12].toInt() shr 4) and 0x0F) * 4
        if (dataOffset < 20 || packet.size < ipHeaderLen + dataOffset) return

        val flags = packet[ipHeaderLen + 13].toInt() and 0xFF
        val isSyn = (flags and 0x02) != 0
        val isAck = (flags and 0x10) != 0
        val isFin = (flags and 0x01) != 0
        val isRst = (flags and 0x04) != 0

        val payloadOffset = ipHeaderLen + dataOffset
        val payloadLen = (packet.size - payloadOffset).coerceAtLeast(0)
        val payload = if (payloadLen > 0) packet.copyOfRange(payloadOffset, packet.size) else ByteArray(0)

        val sessionKey = "$srcPort->$dstIp:$dstPort"

        if (isRst) {
            tcpSessions.remove(sessionKey)?.close()
            return
        }

        if (isSyn && !isAck) {
            // New outbound TCP connection handshake
            val initialServerSeq = (Random.nextLong(0x0FFFFFFF) + 1000L) and 0xFFFFFFFFL
            val session = TcpSession(
                clientIp = srcIp,
                clientPort = srcPort,
                serverIp = dstIp,
                serverPort = dstPort,
                clientNextAck = (clientSeq + 1L) and 0xFFFFFFFFL,
                serverSeq = initialServerSeq
            )
            tcpSessions[sessionKey] = session

            // Reply with SYN+ACK to client on TUN
            val synAck = synthesizeIpTcpPacket(
                srcIp = dstIp,
                srcPort = dstPort,
                dstIp = srcIp,
                dstPort = srcPort,
                seq = initialServerSeq,
                ack = session.clientNextAck,
                flags = 0x12, // SYN | ACK
                payload = ByteArray(0)
            )
            session.serverSeq = (session.serverSeq + 1L) and 0xFFFFFFFFL
            writeToTun(synAck)

            // Connect real socket to the destination host
            session.start()
            return
        }

        val session = tcpSessions[sessionKey]
        if (session == null) {
            // Unknown session packet: reset cleanly
            if (!isRst) {
                val rst = synthesizeIpTcpPacket(
                    srcIp = dstIp,
                    srcPort = dstPort,
                    dstIp = srcIp,
                    dstPort = srcPort,
                    seq = 0,
                    ack = (clientSeq + 1L) and 0xFFFFFFFFL,
                    flags = 0x14, // RST | ACK
                    payload = ByteArray(0)
                )
                writeToTun(rst)
            }
            return
        }

        session.lastActivity = System.currentTimeMillis()

        if (isFin) {
            session.clientNextAck = (session.clientNextAck + 1L) and 0xFFFFFFFFL
            val ack = synthesizeIpTcpPacket(
                srcIp = dstIp,
                srcPort = dstPort,
                dstIp = srcIp,
                dstPort = srcPort,
                seq = session.serverSeq,
                ack = session.clientNextAck,
                flags = 0x10, // ACK
                payload = ByteArray(0)
            )
            writeToTun(ack)
            session.close()
            tcpSessions.remove(sessionKey)
            return
        }

        if (payloadLen > 0) {
            session.clientNextAck = (session.clientNextAck + payloadLen) and 0xFFFFFFFFL

            // Immediate ACK back to client on TUN so its send window clears
            val ack = synthesizeIpTcpPacket(
                srcIp = dstIp,
                srcPort = dstPort,
                dstIp = srcIp,
                dstPort = srcPort,
                seq = session.serverSeq,
                ack = session.clientNextAck,
                flags = 0x10, // ACK
                payload = ByteArray(0)
            )
            writeToTun(ack)

            // Impairment logic for TCP data (only if affectTcp is explicitly enabled)
            if (config.affectTcp) {
                val shouldImpair = (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.OUTGOING)
                if (shouldImpair) {
                    if (shouldDropPacket()) {
                        droppedCount.incrementAndGet()
                        return
                    }
                    val delayMs = calculateDelay()
                    if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                        val scheduled = System.currentTimeMillis() + delayMs
                        delayQueue.offer(DelayedPacket(
                            data = payload,
                            scheduledReleaseTime = scheduled,
                            isIncoming = false,
                            isTcp = true,
                            srcIp = srcIp,
                            srcPort = srcPort,
                            dstIp = dstIp,
                            dstPort = dstPort
                        ))
                        return
                    }
                }
            }

            // Send payload to real destination socket
            session.sendData(payload)
            val forwarded = forwardedCount.incrementAndGet()
            if (forwarded % 25L == 0L) {
                onStatsUpdate(forwarded, droppedCount.get())
            }
        }
    }

    // -------------------------------------------------------------------------
    // ICMP ECHO REPLY (Ping generator for local TUN interface)
    // -------------------------------------------------------------------------

    private fun handleOutgoingIcmp(packet: ByteArray, ipHeaderLen: Int) {
        if (packet.size < ipHeaderLen + 8) return
        val type = packet[ipHeaderLen].toInt() and 0xFF
        if (type == 8) { // Echo Request
            val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
            val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))
            val echoReply = packet.copyOf()
            // Swap IP addresses
            System.arraycopy(dstIp.address, 0, echoReply, 12, 4)
            System.arraycopy(srcIp.address, 0, echoReply, 16, 4)
            // Type 0 = Echo Reply
            echoReply[ipHeaderLen] = 0.toByte()
            // Recalculate ICMP checksum
            echoReply[ipHeaderLen + 2] = 0
            echoReply[ipHeaderLen + 3] = 0
            val icmpLen = echoReply.size - ipHeaderLen
            val icmpCsum = ChecksumCalculator.computeChecksum(echoReply, ipHeaderLen, icmpLen)
            echoReply[ipHeaderLen + 2] = ((icmpCsum.toInt() shr 8) and 0xFF).toByte()
            echoReply[ipHeaderLen + 3] = (icmpCsum.toInt() and 0xFF).toByte()
            // Recalculate IP checksum
            echoReply[10] = 0
            echoReply[11] = 0
            val ipCsum = ChecksumCalculator.computeIpChecksum(echoReply, 0, ipHeaderLen)
            echoReply[10] = ((ipCsum.toInt() shr 8) and 0xFF).toByte()
            echoReply[11] = (ipCsum.toInt() and 0xFF).toByte()

            writeToTun(echoReply)
            forwardedCount.incrementAndGet()
        }
    }

    // =========================================================================
    // DELAY QUEUE DISPATCHER
    // =========================================================================

    private fun dispatchDelayedPacket(packet: DelayedPacket) {
        if (packet.isIncoming) {
            writeToTun(packet.data)
        } else {
            if (packet.isTcp) {
                val key = "${packet.srcPort}->${packet.dstIp}:${packet.dstPort}"
                tcpSessions[key]?.sendData(packet.data)
            } else {
                sendUdpToNetwork(packet.srcIp, packet.srcPort, packet.dstIp, packet.dstPort, packet.data)
            }
        }
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

    // =========================================================================
    // PACKET SYNTHESIS WITH RFC-COMPLIANT CHECKSUMS
    // =========================================================================

    private fun synthesizeIpUdpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray
    ): ByteArray {
        val ipLen = 20
        val udpLen = 8 + payload.size
        val totalLen = ipLen + udpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        // 1. IPv4 Header
        buf.put(0x45.toByte()) // Version 4, IHL 5
        buf.put(0x00.toByte()) // DSCP/ECN
        buf.putShort(totalLen.toShort())
        buf.putShort(Random.nextInt(65535).toShort()) // ID
        buf.putShort(0x4000.toShort()) // Flags: Don't Fragment
        buf.put(64.toByte()) // TTL
        buf.put(17.toByte()) // Protocol: UDP
        buf.putShort(0) // Checksum placeholder
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        // 2. UDP Header
        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putShort(udpLen.toShort())
        buf.putShort(0) // Checksum placeholder

        // 3. Payload
        buf.put(payload)

        // 4. Compute Checksums
        val ipChecksum = ChecksumCalculator.computeIpChecksum(packet, 0, ipLen)
        packet[10] = ((ipChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum.toInt() and 0xFF).toByte()

        val udpChecksum = ChecksumCalculator.computeUdpChecksum(srcIp.address, dstIp.address, packet, ipLen, udpLen)
        packet[ipLen + 6] = ((udpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 7] = (udpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeIpTcpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        seq: Long,
        ack: Long,
        flags: Int,
        payload: ByteArray = ByteArray(0),
        windowSize: Int = 65535
    ): ByteArray {
        val ipLen = 20
        val tcpLen = 20 + payload.size
        val totalLen = ipLen + tcpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        // 1. IPv4 Header
        buf.put(0x45.toByte())
        buf.put(0x00.toByte())
        buf.putShort(totalLen.toShort())
        buf.putShort(Random.nextInt(65535).toShort())
        buf.putShort(0x4000.toShort()) // Don't Fragment
        buf.put(64.toByte()) // TTL
        buf.put(6.toByte()) // Protocol: TCP
        buf.putShort(0) // Checksum placeholder
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        // 2. TCP Header
        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putInt((seq and 0xFFFFFFFFL).toInt())
        buf.putInt((ack and 0xFFFFFFFFL).toInt())
        buf.put(0x50.toByte()) // Data Offset: 5 (20 bytes)
        buf.put(flags.toByte()) // TCP Flags (SYN, ACK, PSH, FIN, RST)
        buf.putShort(windowSize.toShort())
        buf.putShort(0) // Checksum placeholder
        buf.putShort(0) // Urgent pointer

        // 3. Payload
        if (payload.isNotEmpty()) {
            buf.put(payload)
        }

        // 4. Compute Checksums
        val ipChecksum = ChecksumCalculator.computeIpChecksum(packet, 0, ipLen)
        packet[10] = ((ipChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum.toInt() and 0xFF).toByte()

        val tcpChecksum = ChecksumCalculator.computeTcpChecksum(srcIp.address, dstIp.address, packet, ipLen, tcpLen)
        packet[ipLen + 16] = ((tcpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 17] = (tcpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    // =========================================================================
    // IMPAIRMENT CALCULATORS
    // =========================================================================

    private fun shouldDropPacket(): Boolean {
        // Burst drop simulation: completely drops 100% of media packets during the burst cut window
        if (config.burstInterruptionEnabled && config.burstIntervalSeconds > 0) {
            val nowMs = System.currentTimeMillis()
            val cycleMs = config.burstIntervalSeconds * 1000L
            val cyclePos = nowMs % cycleMs
            if (cyclePos < config.burstDurationMs) {
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

    // =========================================================================
    // HOUSEKEEPING & LIFECYCLE
    // =========================================================================

    private fun cleanStaleSessions() {
        val now = System.currentTimeMillis()

        // UDP cleanup (idle > 60s)
        val udpIt = udpSessions.entries.iterator()
        while (udpIt.hasNext()) {
            val entry = udpIt.next()
            if (now - entry.value.lastActivity > 60000L) {
                try { entry.value.socket.close() } catch (ignored: Exception) {}
                udpIt.remove()
            }
        }

        // TCP cleanup (idle > 60s or closed)
        val tcpIt = tcpSessions.entries.iterator()
        while (tcpIt.hasNext()) {
            val entry = tcpIt.next()
            if (entry.value.isClosed.get() || now - entry.value.lastActivity > 60000L) {
                entry.value.close()
                tcpIt.remove()
            }
        }
    }

    fun isHealthy(): Boolean {
        return isRunning.get()
    }

    fun stop() {
        isRunning.set(false)
        delayQueue.clear()

        udpSessions.values.forEach { session ->
            try { session.socket.close() } catch (ignored: Exception) {}
        }
        udpSessions.clear()

        tcpSessions.values.forEach { session ->
            session.close()
        }
        tcpSessions.clear()

        try { tunIn.close() } catch (ignored: Exception) {}
        try { tunOut.close() } catch (ignored: Exception) {}

        engineScope.cancel()
    }

    // =========================================================================
    // INNER CLASSES & DATA STRUCTURES
    // =========================================================================

    private data class DelayedPacket(
        val data: ByteArray,
        val scheduledReleaseTime: Long,
        val isIncoming: Boolean,
        val isTcp: Boolean,
        val srcIp: InetAddress,
        val srcPort: Int,
        val dstIp: InetAddress,
        val dstPort: Int
    )

    private data class UdpSession(
        val socket: DatagramSocket,
        val srcIp: InetAddress,
        val srcPort: Int,
        val dstIp: InetAddress,
        val dstPort: Int,
        var lastActivity: Long
    )

    private inner class TcpSession(
        val clientIp: InetAddress,
        val clientPort: Int,
        val serverIp: InetAddress,
        val serverPort: Int,
        var clientNextAck: Long,
        var serverSeq: Long
    ) {
        val socket = Socket()
        val isConnected = AtomicBoolean(false)
        val isClosed = AtomicBoolean(false)
        var lastActivity = System.currentTimeMillis()
        val pendingOutbound = ArrayList<ByteArray>()

        fun start() {
            vpnService.protect(socket)
            engineScope.launch(Dispatchers.IO) {
                try {
                    socket.tcpNoDelay = true
                    socket.connect(InetSocketAddress(serverIp, serverPort), 10000)
                    isConnected.set(true)

                    // Flush any pending data buffered during handshake
                    synchronized(pendingOutbound) {
                        if (pendingOutbound.isNotEmpty()) {
                            val out = socket.getOutputStream()
                            for (data in pendingOutbound) {
                                out.write(data)
                            }
                            out.flush()
                            pendingOutbound.clear()
                        }
                    }

                    // Inbound receiver from network -> return to TUN
                    val inStream = socket.getInputStream()
                    val buf = ByteArray(16384)
                    while (isRunning.get() && !isClosed.get()) {
                        val bytesRead = inStream.read(buf)
                        if (bytesRead == -1) break
                        lastActivity = System.currentTimeMillis()
                        val data = buf.copyOf(bytesRead)

                        val tcpPacket = synthesizeIpTcpPacket(
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x18, // PSH | ACK
                            payload = data
                        )
                        serverSeq = (serverSeq + bytesRead) and 0xFFFFFFFFL

                        if (!config.affectTcp) {
                            writeToTun(tcpPacket)
                        } else {
                            val shouldImpair = (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.INCOMING)
                            if (shouldImpair) {
                                if (shouldDropPacket()) {
                                    droppedCount.incrementAndGet()
                                    continue
                                }
                                val delayMs = calculateDelay()
                                if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                                    val scheduled = System.currentTimeMillis() + delayMs
                                    delayQueue.offer(DelayedPacket(
                                        data = tcpPacket,
                                        scheduledReleaseTime = scheduled,
                                        isIncoming = true,
                                        isTcp = true,
                                        srcIp = serverIp,
                                        srcPort = serverPort,
                                        dstIp = clientIp,
                                        dstPort = clientPort
                                    ))
                                    continue
                                }
                            }
                            writeToTun(tcpPacket)
                        }
                    }

                    // Connection closed by server -> send FIN to client
                    if (!isClosed.get()) {
                        val finPacket = synthesizeIpTcpPacket(
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x11, // FIN | ACK
                            payload = ByteArray(0)
                        )
                        serverSeq = (serverSeq + 1) and 0xFFFFFFFFL
                        writeToTun(finPacket)
                    }
                } catch (e: Exception) {
                    Log.d(TAG, "TCP session $clientPort->$serverIp:$serverPort closed: ${e.message}")
                    if (!isClosed.get()) {
                        val rst = synthesizeIpTcpPacket(
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x14, // RST | ACK
                            payload = ByteArray(0)
                        )
                        writeToTun(rst)
                    }
                } finally {
                    close()
                }
            }
        }

        fun sendData(data: ByteArray) {
            lastActivity = System.currentTimeMillis()
            if (isConnected.get()) {
                try {
                    val out = socket.getOutputStream()
                    out.write(data)
                    out.flush()
                } catch (e: Exception) {
                    close()
                }
            } else {
                synchronized(pendingOutbound) {
                    if (pendingOutbound.size < 50) {
                        pendingOutbound.add(data)
                    }
                }
            }
        }

        fun close() {
            if (isClosed.compareAndSet(false, true)) {
                try { socket.close() } catch (ignored: Exception) {}
            }
        }
    }
}

/**
 * Standard RFC-compliant one's complement checksum engine for IPv4, UDP, and TCP.
 */
object ChecksumCalculator {
    fun computeChecksum(buffer: ByteArray, offset: Int, length: Int): Short {
        var sum = 0
        var i = offset
        val end = offset + length
        while (i < end - 1) {
            val word = ((buffer[i].toInt() and 0xFF) shl 8) or (buffer[i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < end) {
            sum += ((buffer[i].toInt() and 0xFF) shl 8)
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        val res = (sum.inv() and 0xFFFF).toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }

    fun computeIpChecksum(buffer: ByteArray, offset: Int, length: Int): Short {
        var sum = 0
        var i = offset
        val end = offset + length
        while (i < end) {
            if (i == offset + 10) {
                i += 2 // Skip checksum field in IPv4 header
                continue
            }
            val word = ((buffer[i].toInt() and 0xFF) shl 8) or (buffer[i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        return (sum.inv() and 0xFFFF).toShort()
    }

    fun computeTcpChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        packet: ByteArray,
        tcpOffset: Int,
        tcpLen: Int
    ): Short {
        var sum = 0
        // IPv4 Pseudo-Header
        sum += (((srcIp[0].toInt() and 0xFF) shl 8) or (srcIp[1].toInt() and 0xFF))
        sum += (((srcIp[2].toInt() and 0xFF) shl 8) or (srcIp[3].toInt() and 0xFF))
        sum += (((dstIp[0].toInt() and 0xFF) shl 8) or (dstIp[1].toInt() and 0xFF))
        sum += (((dstIp[2].toInt() and 0xFF) shl 8) or (dstIp[3].toInt() and 0xFF))
        sum += 6 // Protocol TCP
        sum += tcpLen // TCP Length

        // TCP Header + Payload (skipping checksum field at tcpOffset + 16)
        var i = 0
        while (i < tcpLen - 1) {
            if (i == 16) {
                i += 2
                continue
            }
            val word = ((packet[tcpOffset + i].toInt() and 0xFF) shl 8) or (packet[tcpOffset + i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < tcpLen) {
            sum += ((packet[tcpOffset + i].toInt() and 0xFF) shl 8)
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        val res = (sum.inv() and 0xFFFF).toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }

    fun computeUdpChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        packet: ByteArray,
        udpOffset: Int,
        udpLen: Int
    ): Short {
        var sum = 0
        // IPv4 Pseudo-Header
        sum += (((srcIp[0].toInt() and 0xFF) shl 8) or (srcIp[1].toInt() and 0xFF))
        sum += (((srcIp[2].toInt() and 0xFF) shl 8) or (srcIp[3].toInt() and 0xFF))
        sum += (((dstIp[0].toInt() and 0xFF) shl 8) or (dstIp[1].toInt() and 0xFF))
        sum += (((dstIp[2].toInt() and 0xFF) shl 8) or (dstIp[3].toInt() and 0xFF))
        sum += 17 // Protocol UDP
        sum += udpLen // UDP Length

        // UDP Header + Payload (skipping checksum field at udpOffset + 6)
        var i = 0
        while (i < udpLen - 1) {
            if (i == 6) {
                i += 2
                continue
            }
            val word = ((packet[udpOffset + i].toInt() and 0xFF) shl 8) or (packet[udpOffset + i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < udpLen) {
            sum += ((packet[udpOffset + i].toInt() and 0xFF) shl 8)
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        val res = (sum.inv() and 0xFFFF).toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }
}
