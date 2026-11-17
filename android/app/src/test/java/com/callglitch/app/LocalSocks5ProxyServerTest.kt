package com.callglitch.app

import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.vpn.ImpairmentController
import com.callglitch.app.vpn.LocalSocks5ProxyServer
import com.callglitch.app.vpn.RandomProvider
import com.callglitch.app.vpn.SocketProtector
import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.security.MessageDigest
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import kotlin.concurrent.thread

class LocalSocks5ProxyServerTest {

    private class RecordingSocketProtector(
        private val allowProtect: Boolean = true
    ) : SocketProtector {
        val tcpProtectCalls = AtomicInteger(0)
        val udpProtectCalls = AtomicInteger(0)

        override fun protect(socket: Socket): Boolean {
            tcpProtectCalls.incrementAndGet()
            return allowProtect
        }

        override fun protect(socket: DatagramSocket): Boolean {
            udpProtectCalls.incrementAndGet()
            return allowProtect
        }
    }

    private class DeterministicRandom(private val value: Double = 0.99) : RandomProvider {
        override fun nextDouble(): Double = value
        override fun nextSignedUnit(): Double = 0.0
    }

    @Test
    fun testSocks5TcpConnectIpv4AndDomainAndProtectsSocket() {
        val echoServer = startTcpEchoServer(InetAddress.getByName("127.0.0.1"))
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(
                profileType = GlitchProfileType.CUSTOM,
                baseLatencyMs = 0,
                randomJitterMs = 0,
                packetLossPercent = 0.0,
                affectTcp = false
            )
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            assertTrue(proxy.isRunning)
            assertTrue(port > 0)

            // 1. IPv4 CONNECT
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv4(out, byteArrayOf(127, 0, 0, 1), echoServer.localPort)
                readSocksReply(inp)

                val payload = "hello-ipv4-socks5".toByteArray()
                out.write(payload)
                out.flush()
                val echoed = ByteArray(payload.size)
                inp.readFully(echoed)
                assertArrayEquals(payload, echoed)
            }

            // 2. Domain name ("localhost") CONNECT
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectDomain(out, "localhost", echoServer.localPort)
                readSocksReply(inp)

                val payload = "hello-domain-socks5".toByteArray()
                out.write(payload)
                out.flush()
                val echoed = ByteArray(payload.size)
                inp.readFully(echoed)
                assertArrayEquals(payload, echoed)
            }

            assertTrue(protector.tcpProtectCalls.get() >= 2)
        } finally {
            proxy.stop()
            echoServer.close()
        }
    }

    @Test
    fun testSocks5TcpConnectIpv6WhenSupported() {
        val ipv6Loopback = InetAddress.getByName("::1")
        val echoServer = try {
            startTcpEchoServer(ipv6Loopback)
        } catch (_: Exception) {
            return // Host environment does not have IPv6 loopback enabled
        }
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(baseLatencyMs = 0, randomJitterMs = 0, packetLossPercent = 0.0, affectTcp = false)
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv6(out, ipv6Loopback.address, echoServer.localPort)
                val rep = readSocksReply(inp)
                assertEquals(0, rep)

                val payload = "hello-ipv6-socks5".toByteArray()
                out.write(payload)
                out.flush()
                val echoed = ByteArray(payload.size)
                inp.readFully(echoed)
                assertArrayEquals(payload, echoed)
            }
            assertTrue(protector.tcpProtectCalls.get() >= 1)
        } finally {
            proxy.stop()
            echoServer.close()
        }
    }

    @Test
    fun testSocks5UdpAssociateIpv4LossLatencyAndIntactDatagrams() {
        val udpEcho = startUdpEchoServer(InetAddress.getByName("127.0.0.1"))
        val protector = RecordingSocketProtector(allowProtect = true)
        // Alternate 0.1 (< 50% -> drop) and 0.9 (>= 50% -> forward)
        var toggle = 0
        val alternatingRng = object : RandomProvider {
            override fun nextDouble(): Double {
                toggle++
                return if (toggle % 2 == 1) 0.1 else 0.9
            }
            override fun nextSignedUnit(): Double = 0.0
        }
        val impairment = ImpairmentController(
            initialConfig = GlitchConfig(
                baseLatencyMs = 40,
                randomJitterMs = 0,
                packetLossPercent = 50.0,
                burstInterruptionEnabled = false
            ),
            randomProvider = alternatingRng
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { ctrl ->
                val out = ctrl.getOutputStream()
                val inp = DataInputStream(ctrl.getInputStream())
                socks5Handshake(out, inp)
                sendUdpAssociate(out)
                val (rep, relayPort) = readSocksReplyWithPort(inp)
                assertEquals(0, rep)
                assertTrue(relayPort > 0)

                DatagramSocket(0, InetAddress.getByName("127.0.0.1")).use { clientUdp ->
                    clientUdp.soTimeout = 1500
                    val payloads = (1..6).map { "rtp-frame-$it-intact-payload".toByteArray() }
                    for (p in payloads) {
                        val frame = encodeUdpFrameIpv4(byteArrayOf(127, 0, 0, 1), udpEcho.localPort, p)
                        clientUdp.send(DatagramPacket(frame, frame.size, InetAddress.getByName("127.0.0.1"), relayPort))
                    }

                    val received = mutableListOf<String>()
                    val recvBuf = ByteArray(4096)
                    val pkt = DatagramPacket(recvBuf, recvBuf.size)
                    while (true) {
                        try {
                            clientUdp.receive(pkt)
                            val body = decodeUdpFramePayload(recvBuf, pkt.length)
                            received.add(String(body))
                        } catch (_: Exception) {
                            break
                        }
                    }

                    // Verify partial loss happened AND every surviving datagram is 100% intact (never corrupted)
                    assertTrue("Expected some UDP datagrams dropped", received.size < payloads.size)
                    assertTrue("Expected some UDP datagrams forwarded", received.isNotEmpty())
                    for (item in received) {
                        assertTrue("Datagram payload corrupted: $item", item.startsWith("rtp-frame-") && item.endsWith("-intact-payload"))
                    }
                }
            }
            assertTrue(protector.udpProtectCalls.get() >= 1)
        } finally {
            proxy.stop()
            udpEcho.close()
        }
    }

    @Test
    fun testSocks5UdpAssociateIpv6WhenSupported() {
        val ipv6Loopback = InetAddress.getByName("::1")
        val udpEcho = try {
            startUdpEchoServer(ipv6Loopback)
        } catch (_: Exception) {
            return // Host lacks IPv6 loopback interface
        }
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(baseLatencyMs = 15, randomJitterMs = 0, packetLossPercent = 0.0, affectTcp = false)
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { ctrl ->
                val out = ctrl.getOutputStream()
                val inp = DataInputStream(ctrl.getInputStream())
                socks5Handshake(out, inp)
                sendUdpAssociate(out)
                val (rep, relayPort) = readSocksReplyWithPort(inp)
                assertEquals(0, rep)
                assertTrue(relayPort > 0)

                DatagramSocket(0, InetAddress.getByName("127.0.0.1")).use { clientUdp ->
                    clientUdp.soTimeout = 1500
                    val payload = "hello-ipv6-udp-rtp".toByteArray()
                    val frame = ByteArrayOutputStream().apply {
                        write(0); write(0); write(0); write(0x04)
                        write(ipv6Loopback.address)
                        write((udpEcho.localPort ushr 8) and 0xFF); write(udpEcho.localPort and 0xFF)
                        write(payload)
                    }.toByteArray()
                    clientUdp.send(DatagramPacket(frame, frame.size, InetAddress.getByName("127.0.0.1"), relayPort))

                    val recvBuf = ByteArray(4096)
                    val pkt = DatagramPacket(recvBuf, recvBuf.size)
                    try {
                        clientUdp.receive(pkt)
                        val body = decodeUdpFramePayload(recvBuf, pkt.length)
                        assertArrayEquals(payload, body)
                    } catch (_: SocketException) {
                        // Ignore if host JVM runs with IPv4-only outbound stack
                    }
                }
            }
        } finally {
            proxy.stop()
            udpEcho.close()
        }
    }

    @Test
    fun testTcpImpairmentThrottlingNeverCorruptsBytes() {
        val echoServer = startTcpEchoServer(InetAddress.getByName("127.0.0.1"))
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(
                profileType = GlitchProfileType.CUSTOM,
                baseLatencyMs = 60,
                randomJitterMs = 10,
                packetLossPercent = 80.0, // Must NOT drop TCP bytes!
                affectTcp = true,
                tcpBandwidthKbps = 640 // ~80 KB/s -> 24KB takes >= 240ms + latency
            ),
            randomProvider = DeterministicRandom(0.0)
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv4(out, byteArrayOf(127, 0, 0, 1), echoServer.localPort)
                assertEquals(0, readSocksReply(inp))

                val data = ByteArray(24 * 1024) { i -> ((i * 31 + 7) and 0xFF).toByte() }
                val startNs = System.nanoTime()
                out.write(data)
                out.flush()
                sock.shutdownOutput()

                val received = ByteArray(data.size)
                inp.readFully(received)
                val elapsedMs = (System.nanoTime() - startNs) / 1_000_000L

                assertArrayEquals("TCP stream bytes must never be dropped or corrupted", data, received)
                assertTrue("Expected measurable TCP delay/throttling (>= 150ms), got ${elapsedMs}ms", elapsedMs >= 150L)
            }
        } finally {
            proxy.stop()
            echoServer.close()
        }
    }

    @Test
    fun testProtectFailureAbortsTcpAndUdpCleanly() {
        val errors = CopyOnWriteArrayList<Pair<String, String>>()
        val protector = RecordingSocketProtector(allowProtect = false)
        val impairment = ImpairmentController(GlitchConfig())
        val proxy = LocalSocks5ProxyServer(
            impairmentController = impairment,
            socketProtector = protector,
            onError = { comp, msg -> errors.add(comp to msg) }
        )
        try {
            val port = proxy.start()

            // TCP CONNECT should fail cleanly when protect() returns false
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv4(out, byteArrayOf(127, 0, 0, 1), 65432)
                val rep = readSocksReply(inp)
                assertNotEquals(0, rep)
            }

            // UDP ASSOCIATE should fail cleanly when protect() returns false
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendUdpAssociate(out)
                val rep = readSocksReply(inp)
                assertNotEquals(0, rep)
            }

            assertEquals(1, protector.tcpProtectCalls.get())
            assertEquals(1, protector.udpProtectCalls.get())
            assertTrue(errors.any { it.first == "SocketProtector" })
        } finally {
            proxy.stop()
        }
    }

    private fun startTcpEchoServer(bindAddr: InetAddress): ServerSocket {
        val server = ServerSocket(0, 50, bindAddr)
        thread(isDaemon = true) {
            while (!server.isClosed) {
                try {
                    val client = server.accept()
                    thread(isDaemon = true) {
                        client.use { s ->
                            val buf = ByteArray(8192)
                            val ins = s.getInputStream()
                            val outs = s.getOutputStream()
                            while (true) {
                                val r = ins.read(buf)
                                if (r < 0) break
                                outs.write(buf, 0, r)
                                outs.flush()
                            }
                        }
                    }
                } catch (_: Exception) {
                    break
                }
            }
        }
        return server
    }

    private fun startUdpEchoServer(bindAddr: InetAddress): DatagramSocket {
        val sock = DatagramSocket(0, bindAddr)
        thread(isDaemon = true) {
            val buf = ByteArray(65535)
            val pkt = DatagramPacket(buf, buf.size)
            while (!sock.isClosed) {
                try {
                    pkt.length = buf.size
                    sock.receive(pkt)
                    sock.send(DatagramPacket(buf.copyOf(pkt.length), pkt.length, pkt.address, pkt.port))
                } catch (_: Exception) {
                    break
                }
            }
        }
        return sock
    }

    private fun socks5Handshake(out: java.io.OutputStream, inp: DataInputStream) {
        out.write(byteArrayOf(0x05, 0x01, 0x00))
        out.flush()
        val resp = ByteArray(2)
        inp.readFully(resp)
        assertEquals(0x05, resp[0].toInt() and 0xFF)
        assertEquals(0x00, resp[1].toInt() and 0xFF)
    }

    private fun sendConnectIpv4(out: java.io.OutputStream, ip4: ByteArray, port: Int) {
        val req = ByteArrayOutputStream().apply {
            write(0x05); write(0x01); write(0x00); write(0x01)
            write(ip4)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
        }.toByteArray()
        out.write(req)
        out.flush()
    }

    private fun sendConnectIpv6(out: java.io.OutputStream, ip6: ByteArray, port: Int) {
        val req = ByteArrayOutputStream().apply {
            write(0x05); write(0x01); write(0x00); write(0x04)
            write(ip6)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
        }.toByteArray()
        out.write(req)
        out.flush()
    }

    private fun sendConnectDomain(out: java.io.OutputStream, domain: String, port: Int) {
        val bytes = domain.toByteArray(Charsets.UTF_8)
        val req = ByteArrayOutputStream().apply {
            write(0x05); write(0x01); write(0x00); write(0x03)
            write(bytes.size); write(bytes)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
        }.toByteArray()
        out.write(req)
        out.flush()
    }

    private fun sendUdpAssociate(out: java.io.OutputStream) {
        out.write(byteArrayOf(0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0))
        out.flush()
    }

    private fun readSocksReply(inp: DataInputStream): Int {
        return readSocksReplyWithPort(inp).first
    }

    private fun readSocksReplyWithPort(inp: DataInputStream): Pair<Int, Int> {
        val head = ByteArray(4)
        inp.readFully(head)
        val rep = head[1].toInt() and 0xFF
        val atyp = head[3].toInt() and 0xFF
        val addrLen = when (atyp) {
            0x01 -> 4
            0x04 -> 16
            0x03 -> inp.readUnsignedByte()
            else -> 0
        }
        if (addrLen > 0) inp.readFully(ByteArray(addrLen))
        val port = inp.readUnsignedShort()
        return rep to port
    }

    private fun encodeUdpFrameIpv4(ip4: ByteArray, port: Int, payload: ByteArray): ByteArray {
        return ByteArrayOutputStream().apply {
            write(0); write(0); write(0); write(0x01)
            write(ip4)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
            write(payload)
        }.toByteArray()
    }

    private fun decodeUdpFramePayload(data: ByteArray, length: Int): ByteArray {
        val atyp = data[3].toInt() and 0xFF
        val addrLen = when (atyp) {
            0x01 -> 4
            0x04 -> 16
            0x03 -> 1 + (data[4].toInt() and 0xFF)
            else -> 0
        }
        val headerEnd = 4 + addrLen + 2
        return data.copyOfRange(headerEnd, length)
    }
}
