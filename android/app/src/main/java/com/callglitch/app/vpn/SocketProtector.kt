package com.callglitch.app.vpn

import android.net.VpnService
import java.io.IOException
import java.net.DatagramSocket
import java.net.Socket

/**
 * Abstraction over Android's VpnService.protect() so outbound proxy sockets
 * bypass the VPN TUN interface (preventing routing loops) and can be
 * deterministically tested in JVM unit tests.
 */
interface SocketProtector {
    fun protect(socket: Socket): Boolean
    fun protect(socket: DatagramSocket): Boolean
}

class SocketProtectionException(message: String) : IOException(message)

class VpnServiceSocketProtector(
    private val vpnService: VpnService
) : SocketProtector {
    override fun protect(socket: Socket): Boolean = vpnService.protect(socket)
    override fun protect(socket: DatagramSocket): Boolean = vpnService.protect(socket)
}
