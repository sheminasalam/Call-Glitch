package com.callglitch.app.vpn

import hev.htproxy.TProxyService
import java.io.File

data class TunnelConfig(
    val tunFd: Int,
    val mtu: Int = 1500,
    val socks5Address: String = "127.0.0.1",
    val socks5Port: Int,
    val configFilePath: String
)

data class TunnelStats(
    val txPackets: Long = 0L,
    val txBytes: Long = 0L,
    val rxPackets: Long = 0L,
    val rxBytes: Long = 0L
)

/**
 * Adapter interface wrapping the native HevSocks5Tunnel engine so VPN lifecycle
 * management and failure recovery can be thoroughly unit-tested on the JVM.
 */
interface TunnelEngine {
    fun start(config: TunnelConfig): Boolean
    fun stop(): Boolean
    fun isRunning(): Boolean
    fun getStats(): TunnelStats
}

/**
 * Concrete TunnelEngine backed by pinned heiher/hev-socks5-tunnel v2.20.0 (hev.htproxy.TProxyService).
 *
 * FD ownership contract verified in upstream hev-socks5-tunnel.c (tunnel_init / tunnel_fini):
 * When given an external TUN FD, Hev never closes it. CallGlitchVpnService must keep the
 * ParcelFileDescriptor open while Hev is running, call stop() (which joins the worker thread),
 * and close the ParcelFileDescriptor once afterward.
 */
class HevTunnelEngine : TunnelEngine {

    override fun start(config: TunnelConfig): Boolean {
        val confFile = File(config.configFilePath)
        confFile.parentFile?.mkdirs()
        confFile.writeText(buildYamlConfig(config), Charsets.UTF_8)
        return TProxyService.TProxyStartService(confFile.absolutePath, config.tunFd)
    }

    override fun stop(): Boolean {
        return TProxyService.TProxyStopService()
    }

    override fun isRunning(): Boolean {
        return TProxyService.TProxyIsRunning()
    }

    override fun getStats(): TunnelStats {
        val raw = runCatching { TProxyService.TProxyGetStats() }.getOrNull() ?: return TunnelStats()
        if (raw.size < 4) return TunnelStats()
        return TunnelStats(
            txPackets = raw[0],
            txBytes = raw[1],
            rxPackets = raw[2],
            rxBytes = raw[3]
        )
    }

    companion object {
        fun buildYamlConfig(config: TunnelConfig): String {
            return buildString {
                appendLine("misc:")
                appendLine("  task-stack-size: 86016")
                appendLine("  udp-recv-buffer-size: 524288")
                appendLine("  udp-copy-buffer-nums: 10")
                appendLine("  connect-timeout: 10000")
                appendLine("  tcp-read-write-timeout: 300000")
                appendLine("  udp-read-write-timeout: 60000")
                appendLine("  log-level: warn")
                appendLine("tunnel:")
                appendLine("  mtu: ${config.mtu}")
                appendLine("  icmp: 'reply'")
                appendLine("socks5:")
                appendLine("  port: ${config.socks5Port}")
                appendLine("  address: '${config.socks5Address}'")
                appendLine("  udp: 'udp'")
                appendLine("  pipeline: false")
            }
        }
    }
}
