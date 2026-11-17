package com.callglitch.app.vpn

import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import java.io.EOFException
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.nio.ByteBuffer
import java.util.PriorityQueue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * Local-only loopback SOCKS5 proxy (RFC 1928) executing inside Call Glitch.
 *
 * - Strictly bound to 127.0.0.1 (never exposed on Wi-Fi, cellular, or LAN interfaces).
 * - Supports NO AUTH (0x00), CONNECT (0x01), and UDP ASSOCIATE (0x03).
 * - Supports IPv4 (0x01), Domain Name (0x03), and IPv6 (0x04) target addressing.
 * - Enforces SocketProtector.protect() on every outbound TCP/UDP socket before connect/send.
 */
class LocalSocks5ProxyServer(
    private val impairmentController: ImpairmentController,
    private val socketProtector: SocketProtector,
    private val requestedPort: Int = 0,
    private val connectTimeoutMs: Int = 10_000,
    private val tcpBufferQueueCapacity: Int = 32,
    private val maxUdpQueuePerDirection: Int = 512,
    private val udpIdleTimeoutMs: Long = 120_000L,
    private val onError: (component: String, message: String) -> Unit = { _, _ -> }
) {
    private val running = AtomicBoolean(false)
    private val sessionSeq = AtomicLong(0)
    private val activeTcpCount = AtomicInteger(0)
    private val activeUdpCount = AtomicInteger(0)

    private var serverSocket: ServerSocket? = null
    private var executor = Executors.newCachedThreadPool()
    private var proxyDispatcher = executor.asCoroutineDispatcher()
    private var proxyScope = CoroutineScope(proxyDispatcher + SupervisorJob())
    private var acceptJob: Job? = null

    private val tcpSessions = ConcurrentHashMap<Long, TcpRelaySession>()
    private val udpSessions = ConcurrentHashMap<Long, UdpRelaySession>()

    @Volatile
    var port: Int = 0
        private set

    val isRunning: Boolean
        get() = running.get() && serverSocket?.isClosed == false && port > 0

    val activeTcpSessions: Int
        get() = activeTcpCount.get()

    val activeUdpSessions: Int
        get() = activeUdpCount.get()

    fun start(): Int {
        if (running.get()) {
            val existingPort = port
            if (existingPort > 0 && serverSocket?.isClosed == false) return existingPort
        }

        if (executor.isShutdown) {
            executor = Executors.newCachedThreadPool()
            proxyDispatcher = executor.asCoroutineDispatcher()
        }
        proxyScope = CoroutineScope(proxyDispatcher + SupervisorJob())

        val loopback = InetAddress.getByAddress(byteArrayOf(127, 0, 0, 1))
        val boundSocket = ServerSocket().apply {
            reuseAddress = true
            bind(InetSocketAddress(loopback, requestedPort), 128)
        }
        serverSocket = boundSocket
        port = boundSocket.localPort
        running.set(true)

        acceptJob = proxyScope.launch {
            while (running.get() && !boundSocket.isClosed) {
                try {
                    val client = boundSocket.accept()
                    val sessionId = sessionSeq.incrementAndGet()
                    proxyScope.launch {
                        handleClientConnection(sessionId, client)
                    }
                } catch (e: SocketException) {
                    if (running.get()) {
                        onError("LocalSocks5Proxy", "Accept loop socket error: ${e.message}")
                    }
                    break
                } catch (e: Exception) {
                    if (running.get()) {
                        onError("LocalSocks5Proxy", "Accept loop failure: ${e.message}")
                    }
                    break
                }
            }
        }
        return port
    }

    fun resetActiveSessionsOnNetworkChange() {
        tcpSessions.values.forEach { it.close() }
        udpSessions.values.forEach { it.close() }
    }

    fun stop() {
        if (!running.compareAndSet(true, false) && serverSocket == null) {
            return
        }
        try {
            serverSocket?.close()
        } catch (_: Exception) {
        } finally {
            serverSocket = null
            port = 0
        }

        acceptJob?.cancel()
        acceptJob = null

        tcpSessions.values.toList().forEach { it.close() }
        tcpSessions.clear()
        udpSessions.values.toList().forEach { it.close() }
        udpSessions.clear()

        proxyScope.cancel()
        executor.shutdownNow()
    }

    private suspend fun handleClientConnection(sessionId: Long, client: Socket) {
        try {
            client.tcpNoDelay = true
            client.soTimeout = 30_000

            val input = client.getInputStream()
            val output = client.getOutputStream()

            // 1. Method Negotiation: VER | NMETHODS | METHODS
            val ver = input.readByteUnsigned()
            if (ver != SOCKS_VERSION) {
                client.close()
                return
            }
            val nMethods = input.readByteUnsigned()
            val methods = input.readExact(nMethods)
            val supportsNoAuth = methods.any { (it.toInt() and 0xFF) == AUTH_NO_AUTH }
            if (!supportsNoAuth) {
                output.write(byteArrayOf(SOCKS_VERSION.toByte(), AUTH_NO_ACCEPTABLE.toByte()))
                output.flush()
                client.close()
                return
            }
            output.write(byteArrayOf(SOCKS_VERSION.toByte(), AUTH_NO_AUTH.toByte()))
            output.flush()

            // 2. Request: VER | CMD | RSV | ATYP | DST.ADDR | DST.PORT
            val reqHeader = input.readExact(4)
            if ((reqHeader[0].toInt() and 0xFF) != SOCKS_VERSION) {
                client.close()
                return
            }
            val cmd = reqHeader[1].toInt() and 0xFF
            val atyp = reqHeader[3].toInt() and 0xFF
            val target = readSocksAddress(input, atyp) ?: run {
                sendReply(output, REPLY_ADDRESS_TYPE_NOT_SUPPORTED, null, 0)
                client.close()
                return
            }

            when (cmd) {
                CMD_CONNECT -> handleTcpConnect(sessionId, client, input, output, target)
                CMD_UDP_ASSOCIATE -> handleUdpAssociate(sessionId, client, input, output)
                else -> {
                    sendReply(output, REPLY_COMMAND_NOT_SUPPORTED, null, 0)
                    client.close()
                }
            }
        } catch (_: EOFException) {
            runCatching { client.close() }
        } catch (_: SocketException) {
            runCatching { client.close() }
        } catch (e: Exception) {
            if (running.get()) {
                onError("LocalSocks5Proxy", "Client handshake error: ${e.message}")
            }
            runCatching { client.close() }
        }
    }

    private suspend fun handleTcpConnect(
        sessionId: Long,
        clientSocket: Socket,
        clientIn: InputStream,
        clientOut: OutputStream,
        target: SocksAddress
    ) {
        val targetAddr = try {
            withContext(Dispatchers.IO) {
                resolveTargetAddress(target)
            }
        } catch (e: Exception) {
            sendReply(clientOut, REPLY_HOST_UNREACHABLE, null, 0)
            runCatching { clientSocket.close() }
            return
        }

        val outbound = Socket()
        try {
            outbound.tcpNoDelay = true
            // Bind ephemeral wildcard endpoint matching target address family before protect()
            // so the native socket FD exists prior to VpnService.protect() and TCP SYN.
            val wildcardBind = if (targetAddr is Inet6Address) {
                InetSocketAddress(InetAddress.getByAddress(ByteArray(16)), 0)
            } else {
                InetSocketAddress(InetAddress.getByAddress(byteArrayOf(0, 0, 0, 0)), 0)
            }
            outbound.bind(wildcardBind)

            if (!socketProtector.protect(outbound)) {
                val msg = "VpnService.protect() rejected outbound TCP socket for ${targetAddr.hostAddress}:${target.port}"
                onError("SocketProtector", msg)
                outbound.close()
                sendReply(clientOut, REPLY_GENERAL_FAILURE, null, 0)
                clientSocket.close()
                throw SocketProtectionException(msg)
            }

            withContext(Dispatchers.IO) {
                outbound.connect(InetSocketAddress(targetAddr, target.port), connectTimeoutMs)
            }

            clientSocket.soTimeout = 0
            outbound.soTimeout = 0

            sendReply(clientOut, REPLY_SUCCEEDED, outbound.localAddress, outbound.localPort)
        } catch (e: SocketProtectionException) {
            runCatching { outbound.close() }
            runCatching { clientSocket.close() }
            return
        } catch (e: Exception) {
            runCatching { sendReply(clientOut, REPLY_HOST_UNREACHABLE, null, 0) }
            runCatching { outbound.close() }
            runCatching { clientSocket.close() }
            return
        }

        val session = TcpRelaySession(
            id = sessionId,
            clientSocket = clientSocket,
            outboundSocket = outbound
        )
        tcpSessions[sessionId] = session
        activeTcpCount.incrementAndGet()

        try {
            coroutineScope {
                val uplink = launch {
                    relayTcpStream(
                        srcIn = clientIn,
                        dstOut = outbound.getOutputStream(),
                        dstSocket = outbound,
                        direction = TrafficDirection.OUTGOING,
                        session = session
                    )
                }
                val downlink = launch {
                    relayTcpStream(
                        srcIn = outbound.getInputStream(),
                        dstOut = clientOut,
                        dstSocket = clientSocket,
                        direction = TrafficDirection.INCOMING,
                        session = session
                    )
                }
                joinAll(uplink, downlink)
            }
        } finally {
            session.close()
            tcpSessions.remove(sessionId)
            activeTcpCount.decrementAndGet()
        }
    }

    private suspend fun relayTcpStream(
        srcIn: InputStream,
        dstOut: OutputStream,
        dstSocket: Socket,
        direction: TrafficDirection,
        session: TcpRelaySession
    ) {
        val channel = Channel<ByteArray>(capacity = tcpBufferQueueCapacity)
        var nextAvailableTxMs = impairmentController.nowMs()

        try {
            coroutineScope {
                val reader = launch {
                    val buffer = ByteArray(8192)
                    try {
                        while (isActive && !session.isClosed && running.get()) {
                            val read = srcIn.read(buffer)
                            if (read < 0) break
                            if (read > 0) {
                                channel.send(buffer.copyOf(read))
                            }
                        }
                    } catch (_: Exception) {
                    } finally {
                        channel.close()
                    }
                }

                val writer = launch {
                    try {
                        for (chunk in channel) {
                            while (isActive && !session.isClosed && running.get()) {
                                val plan = impairmentController.computeTcpWritePlan(
                                    direction = direction,
                                    byteCount = chunk.size,
                                    nextAvailableTxMs = nextAvailableTxMs
                                )
                                if (plan.inBurstPause) {
                                    delay(50L)
                                    continue
                                }

                                val waitMs = plan.releaseAtMs - impairmentController.nowMs()
                                if (waitMs > 0L) {
                                    // Sleep in short slices while allowing burst window updates or cancellation
                                    var remaining = waitMs
                                    while (remaining > 0L && isActive && !session.isClosed && running.get()) {
                                        val step = remaining.coerceAtMost(50L)
                                        delay(step)
                                        remaining = plan.releaseAtMs - impairmentController.nowMs()
                                        if (impairmentController.currentConfig.affectTcp &&
                                            impairmentController.isInBurstWindow()
                                        ) {
                                            break
                                        }
                                    }
                                    if (impairmentController.currentConfig.affectTcp &&
                                        impairmentController.isInBurstWindow()
                                    ) {
                                        continue
                                    }
                                }

                                dstOut.write(chunk)
                                if (channel.isEmpty) {
                                    dstOut.flush()
                                }
                                nextAvailableTxMs = plan.nextAvailableAtMs
                                impairmentController.recordTcpWrite(
                                    byteCount = chunk.size,
                                    appliedDelay = plan.appliedDelay,
                                    appliedThrottle = plan.appliedThrottle
                                )
                                break
                            }
                        }
                        runCatching {
                            if (!dstSocket.isClosed && !dstSocket.isOutputShutdown) {
                                dstSocket.shutdownOutput()
                            }
                        }
                    } catch (_: Exception) {
                        session.close()
                    }
                }

                joinAll(reader, writer)
            }
        } finally {
            channel.close()
        }
    }

    private suspend fun handleUdpAssociate(
        sessionId: Long,
        ctrlSocket: Socket,
        ctrlIn: InputStream,
        ctrlOut: OutputStream
    ) {
        val loopback = InetAddress.getByAddress(byteArrayOf(127, 0, 0, 1))
        val clientRelaySocket = try {
            DatagramSocket(0, loopback)
        } catch (e: Exception) {
            sendReply(ctrlOut, REPLY_GENERAL_FAILURE, null, 0)
            runCatching { ctrlSocket.close() }
            return
        }

        val outboundUdpSocket = try {
            DatagramSocket()
        } catch (e: Exception) {
            runCatching { clientRelaySocket.close() }
            sendReply(ctrlOut, REPLY_GENERAL_FAILURE, null, 0)
            runCatching { ctrlSocket.close() }
            return
        }

        if (!socketProtector.protect(outboundUdpSocket)) {
            val msg = "VpnService.protect() rejected outbound UDP socket"
            onError("SocketProtector", msg)
            runCatching { outboundUdpSocket.close() }
            runCatching { clientRelaySocket.close() }
            runCatching { sendReply(ctrlOut, REPLY_GENERAL_FAILURE, null, 0) }
            runCatching { ctrlSocket.close() }
            return
        }

        try {
            ctrlSocket.soTimeout = 0
            sendReply(ctrlOut, REPLY_SUCCEEDED, loopback, clientRelaySocket.localPort)
        } catch (e: Exception) {
            runCatching { outboundUdpSocket.close() }
            runCatching { clientRelaySocket.close() }
            runCatching { ctrlSocket.close() }
            return
        }

        val session = UdpRelaySession(
            id = sessionId,
            ctrlSocket = ctrlSocket,
            clientRelaySocket = clientRelaySocket,
            outboundUdpSocket = outboundUdpSocket,
            lastActivityMs = impairmentController.nowMs()
        )
        udpSessions[sessionId] = session
        activeUdpCount.incrementAndGet()

        val dnsCache = ConcurrentHashMap<String, InetAddress>()
        val outgoingQueue = UdpScheduledQueue(maxUdpQueuePerDirection)
        val incomingQueue = UdpScheduledQueue(maxUdpQueuePerDirection)

        try {
            coroutineScope {
                // 1. Control TCP connection EOF monitor (RFC 1928: UDP association ends when TCP closes)
                val ctrlWatcher = launch {
                    try {
                        val b = ByteArray(64)
                        while (isActive && !session.isClosed && running.get()) {
                            val r = ctrlIn.read(b)
                            if (r < 0) break
                        }
                    } catch (_: Exception) {
                    } finally {
                        session.close()
                    }
                }

                // 2. Idle watchdog
                val idleWatcher = launch {
                    while (isActive && !session.isClosed && running.get()) {
                        delay(10_000L.coerceAtMost(udpIdleTimeoutMs / 2).coerceAtLeast(500L))
                        if (impairmentController.nowMs() - session.lastActivityMs > udpIdleTimeoutMs) {
                            session.close()
                            break
                        }
                    }
                }

                // 3. Client -> Outbound UDP Reader
                val uplinkReader = launch {
                    val buf = ByteArray(65535)
                    val packet = DatagramPacket(buf, buf.size)
                    while (isActive && !session.isClosed && running.get()) {
                        try {
                            packet.length = buf.size
                            clientRelaySocket.receive(packet)
                            val srcAddr = packet.address ?: continue
                            if (!srcAddr.isLoopbackAddress) continue

                            session.clientPeer = InetSocketAddress(srcAddr, packet.port)
                            session.lastActivityMs = impairmentController.nowMs()

                            val frame = parseSocks5UdpFrame(buf, packet.length) ?: continue
                            val resolvedDst = resolveSocksUdpDestination(frame.address, dnsCache) ?: continue
                            val isDns = frame.address.port == 53

                            when (val decision = impairmentController.evaluateUdp(TrafficDirection.OUTGOING, isDns)) {
                                UdpImpairmentDecision.Drop -> Unit
                                is UdpImpairmentDecision.Forward -> {
                                    if (decision.delayMs <= 0L) {
                                        val outPkt = DatagramPacket(
                                            frame.payload,
                                            frame.payload.size,
                                            resolvedDst,
                                            frame.address.port
                                        )
                                        outboundUdpSocket.send(outPkt)
                                    } else {
                                        val enqueued = outgoingQueue.enqueue(
                                            ScheduledUdpDatagram(
                                                releaseAtMs = impairmentController.nowMs() + decision.delayMs,
                                                payload = frame.payload,
                                                address = resolvedDst,
                                                port = frame.address.port
                                            )
                                        )
                                        if (!enqueued) {
                                            impairmentController.recordUdpQueueDrop()
                                        }
                                    }
                                }
                            }
                        } catch (_: Exception) {
                            if (session.isClosed || !running.get()) break
                        }
                    }
                }

                // 4. Outgoing delayed dispatcher
                val uplinkDispatcher = launch {
                    outgoingQueue.dispatchLoop(
                        isAlive = { isActive && !session.isClosed && running.get() },
                        nowProvider = { impairmentController.nowMs() },
                        sender = { item ->
                            runCatching {
                                outboundUdpSocket.send(
                                    DatagramPacket(item.payload, item.payload.size, item.address, item.port)
                                )
                            }
                        }
                    )
                }

                // 5. Outbound -> Client UDP Reader
                val downlinkReader = launch {
                    val buf = ByteArray(65535)
                    val packet = DatagramPacket(buf, buf.size)
                    while (isActive && !session.isClosed && running.get()) {
                        try {
                            packet.length = buf.size
                            outboundUdpSocket.receive(packet)
                            val peer = session.clientPeer ?: continue
                            val remoteAddr = packet.address ?: continue
                            val remotePort = packet.port
                            session.lastActivityMs = impairmentController.nowMs()

                            val rawPayload = buf.copyOf(packet.length)
                            val isDns = remotePort == 53

                            when (val decision = impairmentController.evaluateUdp(TrafficDirection.INCOMING, isDns)) {
                                UdpImpairmentDecision.Drop -> Unit
                                is UdpImpairmentDecision.Forward -> {
                                    val wrapped = encodeSocks5UdpFrame(remoteAddr, remotePort, rawPayload)
                                    if (decision.delayMs <= 0L) {
                                        clientRelaySocket.send(
                                            DatagramPacket(wrapped, wrapped.size, peer.address, peer.port)
                                        )
                                    } else {
                                        val enqueued = incomingQueue.enqueue(
                                            ScheduledUdpDatagram(
                                                releaseAtMs = impairmentController.nowMs() + decision.delayMs,
                                                payload = wrapped,
                                                address = peer.address,
                                                port = peer.port
                                            )
                                        )
                                        if (!enqueued) {
                                            impairmentController.recordUdpQueueDrop()
                                        }
                                    }
                                }
                            }
                        } catch (_: Exception) {
                            if (session.isClosed || !running.get()) break
                        }
                    }
                }

                // 6. Incoming delayed dispatcher
                val downlinkDispatcher = launch {
                    incomingQueue.dispatchLoop(
                        isAlive = { isActive && !session.isClosed && running.get() },
                        nowProvider = { impairmentController.nowMs() },
                        sender = { item ->
                            runCatching {
                                clientRelaySocket.send(
                                    DatagramPacket(item.payload, item.payload.size, item.address, item.port)
                                )
                            }
                        }
                    )
                }

                joinAll(ctrlWatcher, idleWatcher, uplinkReader, uplinkDispatcher, downlinkReader, downlinkDispatcher)
            }
        } finally {
            outgoingQueue.clear()
            incomingQueue.clear()
            session.close()
            udpSessions.remove(sessionId)
            activeUdpCount.decrementAndGet()
        }
    }

    private fun resolveTargetAddress(target: SocksAddress): InetAddress {
        return when (target.atyp) {
            ATYP_IPV4, ATYP_IPV6 -> InetAddress.getByAddress(target.rawAddress)
            ATYP_DOMAIN -> InetAddress.getByName(target.domain!!)
            else -> throw IOException("Unsupported ATYP: ${target.atyp}")
        }
    }

    private fun resolveSocksUdpDestination(
        addr: SocksAddress,
        dnsCache: ConcurrentHashMap<String, InetAddress>
    ): InetAddress? {
        return try {
            when (addr.atyp) {
                ATYP_IPV4, ATYP_IPV6 -> InetAddress.getByAddress(addr.rawAddress)
                ATYP_DOMAIN -> {
                    val host = addr.domain ?: return null
                    dnsCache[host] ?: InetAddress.getByName(host).also { dnsCache[host] = it }
                }
                else -> null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun sendReply(
        output: OutputStream,
        rep: Int,
        bindAddr: InetAddress?,
        bindPort: Int
    ) {
        val raw = bindAddr?.address
        val (atyp, addrBytes) = when {
            raw != null && raw.size == 16 -> ATYP_IPV6 to raw
            raw != null && raw.size == 4 -> ATYP_IPV4 to raw
            else -> ATYP_IPV4 to byteArrayOf(0, 0, 0, 0)
        }
        val packet = ByteArray(4 + addrBytes.size + 2)
        packet[0] = SOCKS_VERSION.toByte()
        packet[1] = rep.toByte()
        packet[2] = 0x00
        packet[3] = atyp.toByte()
        System.arraycopy(addrBytes, 0, packet, 4, addrBytes.size)
        packet[4 + addrBytes.size] = ((bindPort ushr 8) and 0xFF).toByte()
        packet[4 + addrBytes.size + 1] = (bindPort and 0xFF).toByte()
        output.write(packet)
        output.flush()
    }

    private fun readSocksAddress(input: InputStream, atyp: Int): SocksAddress? {
        return when (atyp) {
            ATYP_IPV4 -> {
                val addr = input.readExact(4)
                val port = input.readShortUnsigned()
                SocksAddress(atyp, addr, null, port)
            }
            ATYP_IPV6 -> {
                val addr = input.readExact(16)
                val port = input.readShortUnsigned()
                SocksAddress(atyp, addr, null, port)
            }
            ATYP_DOMAIN -> {
                val len = input.readByteUnsigned()
                val domainBytes = input.readExact(len)
                val port = input.readShortUnsigned()
                SocksAddress(atyp, ByteArray(0), String(domainBytes, Charsets.UTF_8), port)
            }
            else -> null
        }
    }

    private fun parseSocks5UdpFrame(data: ByteArray, length: Int): SocksUdpFrame? {
        if (length < 10) return null
        val frag = data[2].toInt() and 0xFF
        if (frag != 0) return null
        val atyp = data[3].toInt() and 0xFF

        var offset = 4
        val address: SocksAddress = when (atyp) {
            ATYP_IPV4 -> {
                if (offset + 4 + 2 > length) return null
                val raw = data.copyOfRange(offset, offset + 4)
                offset += 4
                val port = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
                offset += 2
                SocksAddress(atyp, raw, null, port)
            }
            ATYP_IPV6 -> {
                if (offset + 16 + 2 > length) return null
                val raw = data.copyOfRange(offset, offset + 16)
                offset += 16
                val port = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
                offset += 2
                SocksAddress(atyp, raw, null, port)
            }
            ATYP_DOMAIN -> {
                if (offset + 1 > length) return null
                val domainLen = data[offset].toInt() and 0xFF
                offset += 1
                if (offset + domainLen + 2 > length) return null
                val domain = String(data, offset, domainLen, Charsets.UTF_8)
                offset += domainLen
                val port = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
                offset += 2
                SocksAddress(atyp, ByteArray(0), domain, port)
            }
            else -> return null
        }

        val payload = data.copyOfRange(offset, length)
        return SocksUdpFrame(address, payload)
    }

    private fun encodeSocks5UdpFrame(addr: InetAddress, port: Int, payload: ByteArray): ByteArray {
        val rawAddr = addr.address
        val atyp = when (addr) {
            is Inet6Address -> ATYP_IPV6
            is Inet4Address -> ATYP_IPV4
            else -> if (rawAddr.size == 16) ATYP_IPV6 else ATYP_IPV4
        }
        val headerSize = 4 + rawAddr.size + 2
        val out = ByteBuffer.allocate(headerSize + payload.size)
        out.put(0x00)
        out.put(0x00)
        out.put(0x00)
        out.put(atyp.toByte())
        out.put(rawAddr)
        out.putShort(port.toShort())
        out.put(payload)
        return out.array()
    }

    private fun InputStream.readByteUnsigned(): Int {
        val v = read()
        if (v < 0) throw EOFException("Unexpected EOF")
        return v
    }

    private fun InputStream.readShortUnsigned(): Int {
        val hi = readByteUnsigned()
        val lo = readByteUnsigned()
        return (hi shl 8) or lo
    }

    private fun InputStream.readExact(count: Int): ByteArray {
        val buf = ByteArray(count)
        var offset = 0
        while (offset < count) {
            val read = read(buf, offset, count - offset)
            if (read < 0) throw EOFException("Unexpected EOF after $offset/$count bytes")
            offset += read
        }
        return buf
    }

    private data class SocksAddress(
        val atyp: Int,
        val rawAddress: ByteArray,
        val domain: String?,
        val port: Int
    )

    private data class SocksUdpFrame(
        val address: SocksAddress,
        val payload: ByteArray
    )

    private class TcpRelaySession(
        val id: Long,
        private val clientSocket: Socket,
        private val outboundSocket: Socket
    ) {
        private val closed = AtomicBoolean(false)
        val isClosed: Boolean get() = closed.get()

        fun close() {
            if (!closed.compareAndSet(false, true)) return
            runCatching { clientSocket.close() }
            runCatching { outboundSocket.close() }
        }
    }

    private class UdpRelaySession(
        val id: Long,
        private val ctrlSocket: Socket,
        private val clientRelaySocket: DatagramSocket,
        private val outboundUdpSocket: DatagramSocket,
        @Volatile var lastActivityMs: Long
    ) {
        @Volatile
        var clientPeer: InetSocketAddress? = null
        private val closed = AtomicBoolean(false)
        val isClosed: Boolean get() = closed.get()

        fun close() {
            if (!closed.compareAndSet(false, true)) return
            runCatching { clientRelaySocket.close() }
            runCatching { outboundUdpSocket.close() }
            runCatching { ctrlSocket.close() }
        }
    }

    private data class ScheduledUdpDatagram(
        val releaseAtMs: Long,
        val payload: ByteArray,
        val address: InetAddress,
        val port: Int,
        val seq: Long = seqGen.incrementAndGet()
    ) : Comparable<ScheduledUdpDatagram> {
        override fun compareTo(other: ScheduledUdpDatagram): Int {
            val cmp = releaseAtMs.compareTo(other.releaseAtMs)
            return if (cmp != 0) cmp else seq.compareTo(other.seq)
        }

        companion object {
            private val seqGen = AtomicLong(0)
        }
    }

    private class UdpScheduledQueue(private val maxCapacity: Int) {
        private val lock = Any()
        private val heap = PriorityQueue<ScheduledUdpDatagram>()
        private val wakeup = Channel<Unit>(Channel.CONFLATED)

        fun enqueue(item: ScheduledUdpDatagram): Boolean {
            synchronized(lock) {
                if (heap.size >= maxCapacity) {
                    return false
                }
                heap.add(item)
            }
            wakeup.trySend(Unit)
            return true
        }

        suspend fun dispatchLoop(
            isAlive: () -> Boolean,
            nowProvider: () -> Long,
            sender: (ScheduledUdpDatagram) -> Unit
        ) {
            while (isAlive()) {
                var nextWaitMs = 20L
                while (isAlive()) {
                    val itemToSend: ScheduledUdpDatagram?
                    synchronized(lock) {
                        val head = heap.peek()
                        if (head == null) {
                            nextWaitMs = 50L
                            itemToSend = null
                        } else {
                            val now = nowProvider()
                            if (head.releaseAtMs <= now) {
                                itemToSend = heap.poll()
                            } else {
                                nextWaitMs = (head.releaseAtMs - now).coerceIn(1L, 50L)
                                itemToSend = null
                            }
                        }
                    }
                    if (itemToSend != null) {
                        sender(itemToSend)
                    } else {
                        break
                    }
                }
                withTimeoutOrNull(nextWaitMs) {
                    wakeup.receive()
                }
            }
        }

        fun clear() {
            synchronized(lock) {
                heap.clear()
            }
            wakeup.close()
        }
    }

    companion object {
        private const val SOCKS_VERSION = 0x05
        private const val AUTH_NO_AUTH = 0x00
        private const val AUTH_NO_ACCEPTABLE = 0xFF

        private const val CMD_CONNECT = 0x01
        private const val CMD_UDP_ASSOCIATE = 0x03

        private const val ATYP_IPV4 = 0x01
        private const val ATYP_DOMAIN = 0x03
        private const val ATYP_IPV6 = 0x04

        private const val REPLY_SUCCEEDED = 0x00
        private const val REPLY_GENERAL_FAILURE = 0x01
        private const val REPLY_COMMAND_NOT_SUPPORTED = 0x07
        private const val REPLY_ADDRESS_TYPE_NOT_SUPPORTED = 0x08
        private const val REPLY_HOST_UNREACHABLE = 0x04
    }
}
