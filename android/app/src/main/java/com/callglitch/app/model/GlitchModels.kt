package com.callglitch.app.model

enum class GlitchProfileType(val displayName: String) {
    MILD("Mild"),
    MODERATE("Moderate"),
    SEVERE("Severe"),
    CUSTOM("Custom")
}

enum class ImpairmentDirection(val displayName: String) {
    BOTH("Both Directions"),
    INCOMING("Incoming Only"),
    OUTGOING("Outgoing Only")
}

enum class VpnLifecycleState(val label: String) {
    STOPPED("Stopped"),
    STARTING("Starting"),
    RUNNING("Running"),
    RECONFIGURING("Reconfiguring"),
    STOPPING("Stopping"),
    FAILED("Failed")
}

enum class ComponentHealthState(val label: String) {
    INACTIVE("Inactive"),
    STARTING("Starting"),
    RUNNING("Running"),
    FAILED("Failed"),
    STOPPED("Stopped")
}

data class DiagnosticsSnapshot(
    val vpnState: VpnLifecycleState = VpnLifecycleState.STOPPED,
    val tunnelState: ComponentHealthState = ComponentHealthState.INACTIVE,
    val proxyState: ComponentHealthState = ComponentHealthState.INACTIVE,
    val proxyPort: Int = 0,
    val activeTcpSessions: Int = 0,
    val activeUdpSessions: Int = 0,
    val forwardedUdpDatagrams: Long = 0L,
    val droppedUdpDatagrams: Long = 0L,
    val forwardedTcpBytes: Long = 0L,
    val delayedTcpWrites: Long = 0L,
    val throttledTcpEvents: Long = 0L,
    val tunnelTxPackets: Long = 0L,
    val tunnelTxBytes: Long = 0L,
    val tunnelRxPackets: Long = 0L,
    val tunnelRxBytes: Long = 0L,
    val lastError: String? = null,
    val lastErrorComponent: String? = null
) {
    val totalForwardedCount: Long
        get() = forwardedUdpDatagrams + delayedTcpWrites
}

data class GlitchConfig(
    val profileType: GlitchProfileType = GlitchProfileType.MODERATE,
    val baseLatencyMs: Int = 220,
    val randomJitterMs: Int = 90,
    val packetLossPercent: Double = 3.0,
    val burstInterruptionEnabled: Boolean = false,
    val burstDurationMs: Int = 800,
    val burstIntervalSeconds: Int = 12,
    val direction: ImpairmentDirection = ImpairmentDirection.BOTH,
    val affectTcp: Boolean = true,
    val tcpBandwidthKbps: Int = 0, // 0 means no explicit bandwidth cap (latency/jitter/pauses only)
    val timeoutSeconds: Int = 0 // 0 means no auto-timeout
) {
    companion object {
        val MILD = GlitchConfig(
            profileType = GlitchProfileType.MILD,
            baseLatencyMs = 280,
            randomJitterMs = 80,
            packetLossPercent = 10.0,
            burstInterruptionEnabled = false,
            direction = ImpairmentDirection.BOTH,
            affectTcp = true,
            tcpBandwidthKbps = 1200
        )

        val MODERATE = GlitchConfig(
            profileType = GlitchProfileType.MODERATE,
            baseLatencyMs = 750,
            randomJitterMs = 300,
            packetLossPercent = 35.0,
            burstInterruptionEnabled = false,
            direction = ImpairmentDirection.BOTH,
            affectTcp = true,
            tcpBandwidthKbps = 384
        )

        val SEVERE = GlitchConfig(
            profileType = GlitchProfileType.SEVERE,
            baseLatencyMs = 2000,
            randomJitterMs = 800,
            packetLossPercent = 75.0,
            burstInterruptionEnabled = true,
            burstDurationMs = 2500,
            burstIntervalSeconds = 6,
            direction = ImpairmentDirection.BOTH,
            affectTcp = true,
            tcpBandwidthKbps = 64
        )

        fun forType(type: GlitchProfileType, customFallback: GlitchConfig): GlitchConfig {
            return when (type) {
                GlitchProfileType.MILD -> MILD
                GlitchProfileType.MODERATE -> MODERATE
                GlitchProfileType.SEVERE -> SEVERE
                GlitchProfileType.CUSTOM -> customFallback.copy(profileType = GlitchProfileType.CUSTOM)
            }
        }
    }
}

data class InstalledAppInfo(
    val packageName: String,
    val appName: String,
    val isSystemApp: Boolean = false,
    val hasLauncher: Boolean = true
)
