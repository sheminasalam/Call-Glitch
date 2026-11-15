package com.callglitch.app.vpn

import android.net.Network
import android.net.VpnService
import android.util.Log
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.ImpairmentDirection
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import java.io.FileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

/**
 * Rootless, per-app dual-stack (IPv4 + IPv6) user-space packet forwarding and impairment engine.
 *
 * - Captures and impairs both IPv4 and IPv6 traffic so dual-stack VoIP/video calls
 *   (WhatsApp, Telegram, Google Meet, Zoom, Messenger, Chamet) cannot bypass the VPN.
 * - Uses Endpoint-Independent UDP NAT (keyed by local ip:port) so WebRTC ICE/STUN/TURN
 *   hole-punching and incoming media streams stay bound cleanly.
 * - Uses an ordered, MTU-chunked (1380B) user-space TCP proxy with RFC-compliant checksums
 *   so signaling, DNS, and TLS never break or silently blackhole.
 * - Runs socket I/O on a dedicated cached thread pool so open sockets never starve
 *   the TUN reader or delay-queue dispatcher.
 */
class PacketForwardingEngine(
    private val vpnService: VpnService,
    private val tunFd: FileDescriptor,
    config: GlitchConfig,
    private val onStatsUpdate: (forwarded: Long, dropped: Long) -> Unit
) {
    @Volatile
    private var activeConfig: GlitchConfig = config
    private val isRunning = AtomicBoolean(false)
    private val forwardedCount = AtomicLong(0)
    private val droppedCount = AtomicLong(0)

    private val socketExecutor = Executors.newCachedThreadPool()
    private val socketDispatcher = socketExecutor.asCoroutineDispatcher()
    private val engineScope = CoroutineScope(socketDispatcher + SupervisorJob())

    // Endpoint-independent UDP NAT table: keyed by (v4/v6:srcIp:srcPort)
    private val udpSessions = ConcurrentHashMap<String, UdpSession>()

    // TCP transparent proxy table: keyed by (v4/v6:srcIp:srcPort->dstIp:dstPort)
    private val tcpSessions = ConcurrentHashMap<String, TcpSession>()

    // Bounded packet delay queue for outgoing & incoming UDP impairment
    private val maxQueueCapacity = 8000
    private val delayQueue = PriorityBlockingQueue<DelayedPacket>(1024, compareBy { it.scheduledReleaseTime })

    // TUN streams
    private val tunIn = FileInputStream(tunFd)
    private val tunOut = FileOutputStream(tunFd)

    companion object {
        private const val TAG = "PacketForwardingEngine"
        private const val BUFFER_SIZE = 32767
        private const val MAX_TCP_PAYLOAD = 1380
    }

    fun start() {
        if (!isRunning.compareAndSet(false, true)) return

        // 1. TUN Packet Reader (Outgoing traffic from allowed apps)
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

        // 2. Delay Queue Dispatcher (Releases delayed packets accurately on schedule)
        engineScope.launch {
            while (isRunning.get()) {
                try {
                    var head = delayQueue.peek()
                    val now = System.currentTimeMillis()
                    if (head != null && head.scheduledReleaseTime <= now) {
                        while (head != null && head.scheduledReleaseTime <= System.currentTimeMillis() && isRunning.get()) {
                            val packet = delayQueue.poll() ?: break
                            dispatchDelayedPacket(packet)
                            head = delayQueue.peek()
                        }
                    } else if (head != null) {
                        val waitTime = (head.scheduledReleaseTime - now).coerceIn(1L, 5L)
                        delay(waitTime)
                    } else {
                        delay(2L)
                    }
                } catch (e: Exception) {
                    delay(5L)
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
        this.activeConfig = newConfig
        Log.i(
            TAG,
            "Impairment config updated: ${newConfig.profileType.displayName} " +
                "(latency=${newConfig.baseLatencyMs}ms, jitter=${newConfig.randomJitterMs}ms, " +
                "loss=${newConfig.packetLossPercent}%, burst=${newConfig.burstInterruptionEnabled}, affectTcp=${newConfig.affectTcp})"
        )
    }

    fun onUnderlyingNetworkChanged(network: Network) {
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
        if (packet.isEmpty()) return
        val version = (packet[0].toInt() shr 4) and 0x0F

        when (version) {
            4 -> handleIpv4Packet(packet)
            6 -> handleIpv6Packet(packet)
        }
    }

    private fun handleIpv4Packet(packet: ByteArray) {
        if (packet.size < 20) return
        val ipHeaderLen = (packet[0].toInt() and 0x0F) * 4
        if (ipHeaderLen < 20 || packet.size < ipHeaderLen) return

        val declaredTotalLen = ((packet[2].toInt() and 0xFF) shl 8) or (packet[3].toInt() and 0xFF)
        val packetLen = declaredTotalLen.coerceIn(ipHeaderLen, packet.size)
        val protocol = packet[9].toInt() and 0xFF

        val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
        val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

        when (protocol) {
            17 -> handleOutgoingUdp(packet, packetLen, ipHeaderLen, srcIp, dstIp, isIpv6 = false)
            6 -> handleOutgoingTcp(packet, packetLen, ipHeaderLen, srcIp, dstIp, isIpv6 = false)
            1 -> handleOutgoingIcmpV4(packet, packetLen, ipHeaderLen, srcIp, dstIp)
            else -> reportForwarded()
        }
    }

    private fun handleIpv6Packet(packet: ByteArray) {
        if (packet.size < 40) return
        val payloadLen = ((packet[4].toInt() and 0xFF) shl 8) or (packet[5].toInt() and 0xFF)
        val packetLen = (40 + payloadLen).coerceIn(40, packet.size)

        val srcIp = InetAddress.getByAddress(packet.copyOfRange(8, 24))
        val dstIp = InetAddress.getByAddress(packet.copyOfRange(24, 40))

        var nextHeader = packet[6].toInt() and 0xFF
        var offset = 40

        // Walk standard IPv6 extension headers if present
        while (offset < packetLen) {
            when (nextHeader) {
                0, 43, 60 -> { // Hop-by-Hop, Routing, Destination Options
                    if (offset + 2 > packetLen) return
                    nextHeader = packet[offset].toInt() and 0xFF
                    val extLen = ((packet[offset + 1].toInt() and 0xFF) + 1) * 8
                    offset += extLen
                }
                44 -> { // Fragment Header (8 bytes)
                    if (offset + 8 > packetLen) return
                    nextHeader = packet[offset].toInt() and 0xFF
                    offset += 8
                }
                else -> break
            }
        }

        if (offset > packetLen) return

        when (nextHeader) {
            17 -> handleOutgoingUdp(packet, packetLen, offset, srcIp, dstIp, isIpv6 = true)
            6 -> handleOutgoingTcp(packet, packetLen, offset, srcIp, dstIp, isIpv6 = true)
            58 -> handleOutgoingIcmpV6(packet, packetLen, offset, srcIp, dstIp)
            else -> reportForwarded()
        }
    }

    // -------------------------------------------------------------------------
    // UDP PROCESSING (VoIP audio/video RTP, STUN/TURN, QUIC, DNS)
    // -------------------------------------------------------------------------

    private fun handleOutgoingUdp(
        packet: ByteArray,
        packetLen: Int,
        transportOffset: Int,
        srcIp: InetAddress,
        dstIp: InetAddress,
        isIpv6: Boolean
    ) {
        if (packetLen < transportOffset + 8) return
        if (dstIp.isMulticastAddress || dstIp.isLinkLocalAddress) return

        val srcPort = ((packet[transportOffset].toInt() and 0xFF) shl 8) or (packet[transportOffset + 1].toInt() and 0xFF)
        val dstPort = ((packet[transportOffset + 2].toInt() and 0xFF) shl 8) or (packet[transportOffset + 3].toInt() and 0xFF)
        val udpLen = ((packet[transportOffset + 4].toInt() and 0xFF) shl 8) or (packet[transportOffset + 5].toInt() and 0xFF)

        val endPayload = (transportOffset + udpLen).coerceAtMost(packetLen)
        if (transportOffset + 8 > endPayload) return
        val payload = packet.copyOfRange(transportOffset + 8, endPayload)

        val isDns = dstPort == 53 || srcPort == 53
        if (isDns) {
            sendUdpToNetwork(srcIp, srcPort, dstIp, dstPort, payload, isIpv6, packet.copyOf(packetLen))
            return
        }

        val currentConfig = activeConfig
        val shouldImpair = (currentConfig.direction == ImpairmentDirection.BOTH || currentConfig.direction == ImpairmentDirection.OUTGOING)

        if (shouldImpair) {
            if (shouldDropPacket(currentConfig)) {
                reportDropped()
                return
            }

            val delayMs = calculateDelay(currentConfig)
            if (delayMs > 0) {
                if (delayQueue.size < maxQueueCapacity) {
                    delayQueue.offer(
                        DelayedPacket(
                            data = payload,
                            scheduledReleaseTime = System.currentTimeMillis() + delayMs,
                            isIncoming = false,
                            srcIp = srcIp,
                            srcPort = srcPort,
                            dstIp = dstIp,
                            dstPort = dstPort,
                            isIpv6 = isIpv6,
                            rawPacketForError = if (isIpv6) packet.copyOf(packetLen) else null
                        )
                    )
                } else {
                    // Tail-drop when congested (never bypass delay queue at 0ms)
                    reportDropped()
                }
                return
            }
        }

        sendUdpToNetwork(srcIp, srcPort, dstIp, dstPort, payload, isIpv6, if (isIpv6) packet.copyOf(packetLen) else null)
    }

    private fun sendUdpToNetwork(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray,
        isIpv6: Boolean,
        rawPacketForError: ByteArray?
    ) {
        val sessionKey = "${if (isIpv6) "v6" else "v4"}:${srcIp.hostAddress}:$srcPort"
        try {
            val session = udpSessions.computeIfAbsent(sessionKey) {
                createUdpSession(sessionKey, srcIp, srcPort, isIpv6)
            }
            session.lastActivity = System.currentTimeMillis()

            val datagram = DatagramPacket(payload, payload.size, dstIp, dstPort)
            session.socket.send(datagram)
            reportForwarded()
        } catch (e: Exception) {
            Log.d(TAG, "UDP send error ($dstIp:$dstPort): ${e.message}")
            if (isIpv6 && rawPacketForError != null) {
                // Immediately notify app IPv6 is unreachable so Happy Eyeballs/ICE falls back to IPv4
                val unreach = synthesizeIcmpV6Unreachable(dstIp, srcIp, rawPacketForError)
                writeToTun(unreach)
            }
        }
    }

    private fun createUdpSession(
        sessionKey: String,
        srcIp: InetAddress,
        srcPort: Int,
        isIpv6: Boolean
    ): UdpSession {
        val socket = DatagramSocket()
        vpnService.protect(socket)

        val session = UdpSession(sessionKey, socket, srcIp, srcPort, isIpv6, System.currentTimeMillis())

        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            try {
                while (isRunning.get() && !socket.isClosed) {
                    val incoming = DatagramPacket(buffer, buffer.size)
                    socket.receive(incoming)
                    session.lastActivity = System.currentTimeMillis()

                    val remoteIp = incoming.address ?: continue
                    val remotePort = incoming.port

                    // Ensure address family matches the local TUN interface address
                    if (!session.isIpv6 && remoteIp !is Inet4Address) continue
                    if (session.isIpv6 && remoteIp !is Inet6Address) continue

                    val payload = incoming.data.copyOf(incoming.length)
                    handleIncomingUdpPacket(session, remoteIp, remotePort, payload)
                }
            } catch (ignored: Exception) {
            } finally {
                udpSessions.remove(sessionKey, session)
                try { socket.close() } catch (ignored: Exception) {}
            }
        }
        return session
    }

    private fun handleIncomingUdpPacket(
        session: UdpSession,
        remoteIp: InetAddress,
        remotePort: Int,
        payload: ByteArray
    ) {
        val synth = if (session.isIpv6) {
            synthesizeIpv6UdpPacket(remoteIp, remotePort, session.srcIp, session.srcPort, payload)
        } else {
            synthesizeIpv4UdpPacket(remoteIp, remotePort, session.srcIp, session.srcPort, payload)
        }

        val isDns = remotePort == 53 || session.srcPort == 53
        if (isDns) {
            writeToTun(synth)
            return
        }

        val currentConfig = activeConfig
        val shouldImpair = (currentConfig.direction == ImpairmentDirection.BOTH || currentConfig.direction == ImpairmentDirection.INCOMING)

        if (shouldImpair) {
            if (shouldDropPacket(currentConfig)) {
                reportDropped()
                return
            }

            val delayMs = calculateDelay(currentConfig)
            if (delayMs > 0) {
                if (delayQueue.size < maxQueueCapacity) {
                    delayQueue.offer(
                        DelayedPacket(
                            data = synth,
                            scheduledReleaseTime = System.currentTimeMillis() + delayMs,
                            isIncoming = true,
                            srcIp = remoteIp,
                            srcPort = remotePort,
                            dstIp = session.srcIp,
                            dstPort = session.srcPort,
                            isIpv6 = session.isIpv6,
                            rawPacketForError = null
                        )
                    )
                } else {
                    reportDropped()
                }
                return
            }
        }

        writeToTun(synth)
    }

    // -------------------------------------------------------------------------
    // TCP PROCESSING (Call signaling, TLS, HTTPS, TURN-over-TCP)
    // -------------------------------------------------------------------------

    private fun handleOutgoingTcp(
        packet: ByteArray,
        packetLen: Int,
        transportOffset: Int,
        srcIp: InetAddress,
        dstIp: InetAddress,
        isIpv6: Boolean
    ) {
        if (packetLen < transportOffset + 20) return

        val srcPort = ((packet[transportOffset].toInt() and 0xFF) shl 8) or (packet[transportOffset + 1].toInt() and 0xFF)
        val dstPort = ((packet[transportOffset + 2].toInt() and 0xFF) shl 8) or (packet[transportOffset + 3].toInt() and 0xFF)

        val clientSeq = (((packet[transportOffset + 4].toLong() and 0xFF) shl 24) or
                ((packet[transportOffset + 5].toLong() and 0xFF) shl 16) or
                ((packet[transportOffset + 6].toLong() and 0xFF) shl 8) or
                (packet[transportOffset + 7].toLong() and 0xFF))

        val dataOffset = ((packet[transportOffset + 12].toInt() shr 4) and 0x0F) * 4
        if (dataOffset < 20 || packetLen < transportOffset + dataOffset) return

        val flags = packet[transportOffset + 13].toInt() and 0xFF
        val isSyn = (flags and 0x02) != 0
        val isAck = (flags and 0x10) != 0
        val isFin = (flags and 0x01) != 0
        val isRst = (flags and 0x04) != 0

        val payloadOffset = transportOffset + dataOffset
        val payloadLen = (packetLen - payloadOffset).coerceAtLeast(0)

        val sessionKey = "${if (isIpv6) "v6" else "v4"}:${srcIp.hostAddress}:$srcPort->${dstIp.hostAddress}:$dstPort"

        if (isRst) {
            tcpSessions.remove(sessionKey)?.close()
            return
        }

        if (isSyn && !isAck) {
            tcpSessions.remove(sessionKey)?.close()

            val initialServerSeq = (Random.nextLong(0x0FFFFFFF) + 1000L) and 0xFFFFFFFFL
            val session = TcpSession(
                sessionKey = sessionKey,
                isIpv6 = isIpv6,
                clientIp = srcIp,
                clientPort = srcPort,
                serverIp = dstIp,
                serverPort = dstPort,
                clientNextAck = (clientSeq + 1L) and 0xFFFFFFFFL,
                serverSeq = initialServerSeq
            )
            tcpSessions[sessionKey] = session

            val synAck = synthesizeTcpPacket(
                isIpv6 = isIpv6,
                srcIp = dstIp,
                srcPort = dstPort,
                dstIp = srcIp,
                dstPort = srcPort,
                seq = initialServerSeq,
                ack = session.clientNextAck,
                flags = 0x12 // SYN | ACK
            )
            session.serverSeq = (session.serverSeq + 1L) and 0xFFFFFFFFL
            writeToTun(synAck)

            session.start()
            return
        }

        val session = tcpSessions[sessionKey]
        if (session == null) {
            if (!isRst) {
                val rst = synthesizeTcpPacket(
                    isIpv6 = isIpv6,
                    srcIp = dstIp,
                    srcPort = dstPort,
                    dstIp = srcIp,
                    dstPort = srcPort,
                    seq = 0L,
                    ack = (clientSeq + payloadLen + (if (isSyn || isFin) 1L else 0L)) and 0xFFFFFFFFL,
                    flags = 0x14 // RST | ACK
                )
                writeToTun(rst)
            }
            return
        }

        session.lastActivity = System.currentTimeMillis()

        if (payloadLen > 0) {
            // Sequence-number deduplication (32-bit wrap-safe)
            val seqDiff = (clientSeq - session.clientNextAck).toInt()
            if (seqDiff == 0) {
                val payload = packet.copyOfRange(payloadOffset, packetLen)
                session.clientNextAck = (session.clientNextAck + payloadLen) and 0xFFFFFFFFL
                sendTcpAck(session)
                session.enqueueOutbound(payload)
            } else if (seqDiff < 0) {
                val overlap = -seqDiff
                if (overlap < payloadLen) {
                    val newSlice = packet.copyOfRange(payloadOffset + overlap, packetLen)
                    session.clientNextAck = (session.clientNextAck + newSlice.size) and 0xFFFFFFFFL
                    sendTcpAck(session)
                    session.enqueueOutbound(newSlice)
                } else {
                    // Pure retransmission: re-ACK without duplicating stream bytes
                    sendTcpAck(session)
                }
            } else {
                // Future out-of-order segment: re-ACK expected sequence so client retransmits cleanly
                sendTcpAck(session)
            }
        }

        if (isFin) {
            session.clientNextAck = (session.clientNextAck + 1L) and 0xFFFFFFFFL
            sendTcpAck(session)
            session.close()
            tcpSessions.remove(sessionKey, session)
        }
    }

    private fun sendTcpAck(session: TcpSession) {
        val ack = synthesizeTcpPacket(
            isIpv6 = session.isIpv6,
            srcIp = session.serverIp,
            srcPort = session.serverPort,
            dstIp = session.clientIp,
            dstPort = session.clientPort,
            seq = session.serverSeq,
            ack = session.clientNextAck,
            flags = 0x10 // ACK
        )
        writeToTun(ack)
    }

    // -------------------------------------------------------------------------
    // ICMPv4 / ICMPv6 HANDLERS
    // -------------------------------------------------------------------------

    private fun handleOutgoingIcmpV4(
        packet: ByteArray,
        packetLen: Int,
        ipHeaderLen: Int,
        srcIp: InetAddress,
        dstIp: InetAddress
    ) {
        if (packetLen < ipHeaderLen + 8) return
        val type = packet[ipHeaderLen].toInt() and 0xFF
        if (type == 8) { // Echo Request
            val echoReply = packet.copyOf(packetLen)
            System.arraycopy(dstIp.address, 0, echoReply, 12, 4)
            System.arraycopy(srcIp.address, 0, echoReply, 16, 4)
            echoReply[ipHeaderLen] = 0.toByte()
            echoReply[ipHeaderLen + 2] = 0
            echoReply[ipHeaderLen + 3] = 0
            val icmpCsum = ChecksumCalculator.computeChecksum(echoReply, ipHeaderLen, packetLen - ipHeaderLen)
            echoReply[ipHeaderLen + 2] = ((icmpCsum.toInt() shr 8) and 0xFF).toByte()
            echoReply[ipHeaderLen + 3] = (icmpCsum.toInt() and 0xFF).toByte()

            echoReply[10] = 0
            echoReply[11] = 0
            val ipCsum = ChecksumCalculator.computeIpChecksum(echoReply, 0, ipHeaderLen)
            echoReply[10] = ((ipCsum.toInt() shr 8) and 0xFF).toByte()
            echoReply[11] = (ipCsum.toInt() and 0xFF).toByte()

            writeToTun(echoReply)
        }
    }

    private fun handleOutgoingIcmpV6(
        packet: ByteArray,
        packetLen: Int,
        transportOffset: Int,
        srcIp: InetAddress,
        dstIp: InetAddress
    ) {
        if (packetLen < transportOffset + 8) return
        val type = packet[transportOffset].toInt() and 0xFF
        if (type == 128) { // ICMPv6 Echo Request
            val icmpLen = packetLen - transportOffset
            val reply = ByteArray(40 + icmpLen)
            val buf = ByteBuffer.wrap(reply)
            buf.put(0x60.toByte())
            buf.put(0x00.toByte())
            buf.putShort(0)
            buf.putShort(icmpLen.toShort())
            buf.put(58.toByte()) // Next Header: ICMPv6
            buf.put(64.toByte()) // Hop Limit
            buf.put(dstIp.address)
            buf.put(srcIp.address)
            System.arraycopy(packet, transportOffset, reply, 40, icmpLen)
            reply[40] = 129.toByte() // Echo Reply
            reply[42] = 0
            reply[43] = 0
            val csum = ChecksumCalculator.computeIpv6TransportChecksum(
                dstIp.address, srcIp.address, 58, reply, 40, icmpLen, 2
            )
            reply[42] = ((csum.toInt() shr 8) and 0xFF).toByte()
            reply[43] = (csum.toInt() and 0xFF).toByte()
            writeToTun(reply)
        }
    }

    private fun synthesizeIcmpV6Unreachable(
        srcIp: InetAddress,
        dstIp: InetAddress,
        originalPacket: ByteArray
    ): ByteArray {
        val quotedLen = originalPacket.size.coerceAtMost(1232)
        val icmpLen = 8 + quotedLen
        val reply = ByteArray(40 + icmpLen)
        val buf = ByteBuffer.wrap(reply)
        buf.put(0x60.toByte())
        buf.put(0x00.toByte())
        buf.putShort(0)
        buf.putShort(icmpLen.toShort())
        buf.put(58.toByte()) // ICMPv6
        buf.put(64.toByte())
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        reply[40] = 1.toByte() // Type 1: Destination Unreachable
        reply[41] = 0.toByte() // Code 0: No route to destination
        System.arraycopy(originalPacket, 0, reply, 48, quotedLen)

        val csum = ChecksumCalculator.computeIpv6TransportChecksum(
            srcIp.address, dstIp.address, 58, reply, 40, icmpLen, 2
        )
        reply[42] = ((csum.toInt() shr 8) and 0xFF).toByte()
        reply[43] = (csum.toInt() and 0xFF).toByte()
        return reply
    }

    // =========================================================================
    // DELAY QUEUE DISPATCHER & TUN WRITER
    // =========================================================================

    private fun dispatchDelayedPacket(packet: DelayedPacket) {
        if (packet.isIncoming) {
            writeToTun(packet.data)
        } else {
            sendUdpToNetwork(
                packet.srcIp,
                packet.srcPort,
                packet.dstIp,
                packet.dstPort,
                packet.data,
                packet.isIpv6,
                packet.rawPacketForError
            )
        }
    }

    private fun writeToTun(data: ByteArray) {
        if (!isRunning.get()) return
        try {
            synchronized(tunOut) {
                tunOut.write(data)
                tunOut.flush()
            }
            reportForwarded()
        } catch (e: Exception) {
            if (isRunning.get()) {
                Log.e(TAG, "Error writing to TUN (len=${data.size}): ${e.message}")
            }
        }
    }

    private fun reportForwarded() {
        val forwarded = forwardedCount.incrementAndGet()
        if (forwarded % 10L == 0L) {
            onStatsUpdate(forwarded, droppedCount.get())
        }
    }

    private fun reportDropped() {
        val dropped = droppedCount.incrementAndGet()
        onStatsUpdate(forwardedCount.get(), dropped)
    }

    // =========================================================================
    // PACKET SYNTHESIS (IPv4 & IPv6 with RFC Checksums)
    // =========================================================================

    private fun synthesizeIpv4UdpPacket(
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

        buf.put(0x45.toByte())
        buf.put(0x00.toByte())
        buf.putShort(totalLen.toShort())
        buf.putShort(Random.nextInt(65535).toShort())
        buf.putShort(0x4000.toShort())
        buf.put(64.toByte())
        buf.put(17.toByte())
        buf.putShort(0)
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putShort(udpLen.toShort())
        buf.putShort(0)
        buf.put(payload)

        val ipChecksum = ChecksumCalculator.computeIpChecksum(packet, 0, ipLen)
        packet[10] = ((ipChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum.toInt() and 0xFF).toByte()

        val udpChecksum = ChecksumCalculator.computeUdpChecksum(srcIp.address, dstIp.address, packet, ipLen, udpLen)
        packet[ipLen + 6] = ((udpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 7] = (udpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeIpv6UdpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray
    ): ByteArray {
        val ipLen = 40
        val udpLen = 8 + payload.size
        val totalLen = ipLen + udpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x60.toByte())
        buf.put(0x00.toByte())
        buf.putShort(0)
        buf.putShort(udpLen.toShort())
        buf.put(17.toByte()) // UDP
        buf.put(64.toByte())
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putShort(udpLen.toShort())
        buf.putShort(0)
        buf.put(payload)

        val udpChecksum = ChecksumCalculator.computeIpv6TransportChecksum(
            srcIp.address, dstIp.address, 17, packet, ipLen, udpLen, 6
        )
        packet[ipLen + 6] = ((udpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 7] = (udpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeTcpPacket(
        isIpv6: Boolean,
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
        return if (isIpv6) {
            synthesizeIpv6TcpPacket(srcIp, srcPort, dstIp, dstPort, seq, ack, flags, payload, windowSize)
        } else {
            synthesizeIpv4TcpPacket(srcIp, srcPort, dstIp, dstPort, seq, ack, flags, payload, windowSize)
        }
    }

    private fun synthesizeIpv4TcpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        seq: Long,
        ack: Long,
        flags: Int,
        payload: ByteArray,
        windowSize: Int
    ): ByteArray {
        val ipLen = 20
        val tcpLen = 20 + payload.size
        val totalLen = ipLen + tcpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x45.toByte())
        buf.put(0x00.toByte())
        buf.putShort(totalLen.toShort())
        buf.putShort(Random.nextInt(65535).toShort())
        buf.putShort(0x4000.toShort())
        buf.put(64.toByte())
        buf.put(6.toByte())
        buf.putShort(0)
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putInt((seq and 0xFFFFFFFFL).toInt())
        buf.putInt((ack and 0xFFFFFFFFL).toInt())
        buf.put(0x50.toByte())
        buf.put(flags.toByte())
        buf.putShort(windowSize.toShort())
        buf.putShort(0)
        buf.putShort(0)
        if (payload.isNotEmpty()) buf.put(payload)

        val ipChecksum = ChecksumCalculator.computeIpChecksum(packet, 0, ipLen)
        packet[10] = ((ipChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum.toInt() and 0xFF).toByte()

        val tcpChecksum = ChecksumCalculator.computeTcpChecksum(srcIp.address, dstIp.address, packet, ipLen, tcpLen)
        packet[ipLen + 16] = ((tcpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 17] = (tcpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeIpv6TcpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        seq: Long,
        ack: Long,
        flags: Int,
        payload: ByteArray,
        windowSize: Int
    ): ByteArray {
        val ipLen = 40
        val tcpLen = 20 + payload.size
        val totalLen = ipLen + tcpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x60.toByte())
        buf.put(0x00.toByte())
        buf.putShort(0)
        buf.putShort(tcpLen.toShort())
        buf.put(6.toByte()) // TCP
        buf.put(64.toByte())
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putInt((seq and 0xFFFFFFFFL).toInt())
        buf.putInt((ack and 0xFFFFFFFFL).toInt())
        buf.put(0x50.toByte())
        buf.put(flags.toByte())
        buf.putShort(windowSize.toShort())
        buf.putShort(0)
        buf.putShort(0)
        if (payload.isNotEmpty()) buf.put(payload)

        val tcpChecksum = ChecksumCalculator.computeIpv6TransportChecksum(
            srcIp.address, dstIp.address, 6, packet, ipLen, tcpLen, 16
        )
        packet[ipLen + 16] = ((tcpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 17] = (tcpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    // =========================================================================
    // IMPAIRMENT CALCULATORS
    // =========================================================================

    private fun shouldDropPacket(cfg: GlitchConfig): Boolean {
        if (cfg.burstInterruptionEnabled && cfg.burstIntervalSeconds > 0) {
            val nowMs = System.currentTimeMillis()
            val cycleMs = cfg.burstIntervalSeconds * 1000L
            val cyclePos = nowMs % cycleMs
            if (cyclePos < cfg.burstDurationMs) {
                return true
            }
        }

        if (cfg.packetLossPercent <= 0.0) return false
        val roll = Random.nextDouble(100.0)
        return roll < cfg.packetLossPercent
    }

    private fun calculateDelay(cfg: GlitchConfig): Long {
        val base = cfg.baseLatencyMs.toLong()
        val jitter = cfg.randomJitterMs
        if (jitter <= 0) return base
        val randomOffset = Random.nextInt(-jitter, jitter + 1)
        return (base + randomOffset).coerceAtLeast(0L)
    }

    // =========================================================================
    // HOUSEKEEPING & LIFECYCLE
    // =========================================================================

    private fun cleanStaleSessions() {
        val now = System.currentTimeMillis()

        val udpIt = udpSessions.entries.iterator()
        while (udpIt.hasNext()) {
            val entry = udpIt.next()
            if (now - entry.value.lastActivity > 90000L) {
                try { entry.value.socket.close() } catch (ignored: Exception) {}
                udpIt.remove()
            }
        }

        val tcpIt = tcpSessions.entries.iterator()
        while (tcpIt.hasNext()) {
            val entry = tcpIt.next()
            if (entry.value.isClosed.get() || now - entry.value.lastActivity > 90000L) {
                entry.value.close()
                tcpIt.remove()
            }
        }
    }

    fun isHealthy(): Boolean {
        return isRunning.get()
    }

    fun stop() {
        if (!isRunning.compareAndSet(true, false)) return
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
        socketExecutor.shutdownNow()
    }

    // =========================================================================
    // DATA STRUCTURES
    // =========================================================================

    private data class DelayedPacket(
        val data: ByteArray,
        val scheduledReleaseTime: Long,
        val isIncoming: Boolean,
        val srcIp: InetAddress,
        val srcPort: Int,
        val dstIp: InetAddress,
        val dstPort: Int,
        val isIpv6: Boolean,
        val rawPacketForError: ByteArray?
    )

    private data class UdpSession(
        val sessionKey: String,
        val socket: DatagramSocket,
        val srcIp: InetAddress,
        val srcPort: Int,
        val isIpv6: Boolean,
        @Volatile var lastActivity: Long
    )

    private inner class TcpSession(
        val sessionKey: String,
        val isIpv6: Boolean,
        val clientIp: InetAddress,
        val clientPort: Int,
        val serverIp: InetAddress,
        val serverPort: Int,
        @Volatile var clientNextAck: Long,
        @Volatile var serverSeq: Long
    ) {
        val socket = Socket()
        val isClosed = AtomicBoolean(false)
        @Volatile var lastActivity = System.currentTimeMillis()
        private val outboundChannel = Channel<ByteArray>(Channel.UNLIMITED)

        fun enqueueOutbound(data: ByteArray) {
            if (!isClosed.get()) {
                outboundChannel.trySend(data)
            }
        }

        fun start() {
            vpnService.protect(socket)
            engineScope.launch {
                try {
                    socket.tcpNoDelay = true
                    socket.connect(InetSocketAddress(serverIp, serverPort), 10000)

                    // Outbound FIFO writer coroutine (guarantees strict order & non-blocking TUN reads)
                    val writerJob = launch {
                        val outStream = socket.getOutputStream()
                        for (data in outboundChannel) {
                            if (isClosed.get() || !isRunning.get()) break
                            lastActivity = System.currentTimeMillis()

                            val cfg = activeConfig
                            val isDnsOrDot = serverPort == 53 || serverPort == 853
                            if (cfg.affectTcp && !isDnsOrDot &&
                                (cfg.direction == ImpairmentDirection.BOTH || cfg.direction == ImpairmentDirection.OUTGOING)
                            ) {
                                val delayMs = calculateDelay(cfg)
                                if (delayMs > 0) delay(delayMs)
                                // Simulate TCP retransmission stall safely without corrupting byte stream
                                if (shouldDropPacket(cfg)) {
                                    reportDropped()
                                    delay(350L)
                                }
                            }

                            outStream.write(data)
                            outStream.flush()
                            reportForwarded()
                        }
                    }

                    // Inbound reader coroutine (chunks responses to <= 1380 bytes so MTU 1500 is never exceeded)
                    val inStream = socket.getInputStream()
                    val buf = ByteArray(16384)
                    while (isRunning.get() && !isClosed.get()) {
                        val bytesRead = inStream.read(buf)
                        if (bytesRead == -1) break
                        lastActivity = System.currentTimeMillis()

                        val cfg = activeConfig
                        val isDnsOrDot = serverPort == 53 || serverPort == 853
                        if (cfg.affectTcp && !isDnsOrDot &&
                            (cfg.direction == ImpairmentDirection.BOTH || cfg.direction == ImpairmentDirection.INCOMING)
                        ) {
                            val delayMs = calculateDelay(cfg)
                            if (delayMs > 0) delay(delayMs)
                            if (shouldDropPacket(cfg)) {
                                reportDropped()
                                delay(350L)
                            }
                        }

                        var offset = 0
                        while (offset < bytesRead && isRunning.get() && !isClosed.get()) {
                            val chunkSize = minOf(MAX_TCP_PAYLOAD, bytesRead - offset)
                            val chunk = buf.copyOfRange(offset, offset + chunkSize)
                            val tcpPacket = synthesizeTcpPacket(
                                isIpv6 = isIpv6,
                                srcIp = serverIp,
                                srcPort = serverPort,
                                dstIp = clientIp,
                                dstPort = clientPort,
                                seq = serverSeq,
                                ack = clientNextAck,
                                flags = 0x18, // PSH | ACK
                                payload = chunk
                            )
                            serverSeq = (serverSeq + chunkSize) and 0xFFFFFFFFL
                            writeToTun(tcpPacket)
                            offset += chunkSize
                        }
                    }

                    writerJob.cancel()

                    if (!isClosed.get()) {
                        val finPacket = synthesizeTcpPacket(
                            isIpv6 = isIpv6,
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x11 // FIN | ACK
                        )
                        serverSeq = (serverSeq + 1L) and 0xFFFFFFFFL
                        writeToTun(finPacket)
                    }
                } catch (e: Exception) {
                    Log.d(TAG, "TCP session $clientPort->$serverIp:$serverPort closed: ${e.message}")
                    if (!isClosed.get()) {
                        val rst = synthesizeTcpPacket(
                            isIpv6 = isIpv6,
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x14 // RST | ACK
                        )
                        writeToTun(rst)
                    }
                } finally {
                    tcpSessions.remove(sessionKey, this@TcpSession)
                    close()
                }
            }
        }

        fun close() {
            if (isClosed.compareAndSet(false, true)) {
                outboundChannel.close()
                try { socket.close() } catch (ignored: Exception) {}
            }
        }
    }
}

/**
 * Standard RFC-compliant one's complement checksum engine for IPv4, IPv6, UDP, TCP, and ICMP/ICMPv6.
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
                i += 2
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
        sum += (((srcIp[0].toInt() and 0xFF) shl 8) or (srcIp[1].toInt() and 0xFF))
        sum += (((srcIp[2].toInt() and 0xFF) shl 8) or (srcIp[3].toInt() and 0xFF))
        sum += (((dstIp[0].toInt() and 0xFF) shl 8) or (dstIp[1].toInt() and 0xFF))
        sum += (((dstIp[2].toInt() and 0xFF) shl 8) or (dstIp[3].toInt() and 0xFF))
        sum += 6
        sum += tcpLen

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
        sum += (((srcIp[0].toInt() and 0xFF) shl 8) or (srcIp[1].toInt() and 0xFF))
        sum += (((srcIp[2].toInt() and 0xFF) shl 8) or (srcIp[3].toInt() and 0xFF))
        sum += (((dstIp[0].toInt() and 0xFF) shl 8) or (dstIp[1].toInt() and 0xFF))
        sum += (((dstIp[2].toInt() and 0xFF) shl 8) or (dstIp[3].toInt() and 0xFF))
        sum += 17
        sum += udpLen

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

    fun computeIpv6TransportChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        nextHeader: Int,
        packet: ByteArray,
        transportOffset: Int,
        transportLen: Int,
        checksumFieldOffset: Int
    ): Short {
        var sum = 0L
        var i = 0
        while (i < 16) {
            sum += (((srcIp[i].toInt() and 0xFF) shl 8) or (srcIp[i + 1].toInt() and 0xFF))
            i += 2
        }
        i = 0
        while (i < 16) {
            sum += (((dstIp[i].toInt() and 0xFF) shl 8) or (dstIp[i + 1].toInt() and 0xFF))
            i += 2
        }
        sum += ((transportLen ushr 16) and 0xFFFF)
        sum += (transportLen and 0xFFFF)
        sum += nextHeader

        i = 0
        while (i < transportLen - 1) {
            if (i == checksumFieldOffset) {
                i += 2
                continue
            }
            val word = ((packet[transportOffset + i].toInt() and 0xFF) shl 8) or (packet[transportOffset + i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < transportLen) {
            sum += ((packet[transportOffset + i].toInt() and 0xFF) shl 8)
        }
        while ((sum ushr 16) > 0L) {
            sum = (sum and 0xFFFFL) + (sum ushr 16)
        }
        val res = (sum.inv() and 0xFFFFL).toInt().toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }
}
