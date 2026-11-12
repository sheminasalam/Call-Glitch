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

data class GlitchConfig(
    val profileType: GlitchProfileType = GlitchProfileType.MODERATE,
    val baseLatencyMs: Int = 220,
    val randomJitterMs: Int = 90,
    val packetLossPercent: Double = 3.0,
    val burstInterruptionEnabled: Boolean = false,
    val burstDurationMs: Int = 800,
    val burstIntervalSeconds: Int = 12,
    val direction: ImpairmentDirection = ImpairmentDirection.BOTH,
    val affectTcp: Boolean = false,
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
            affectTcp = false
        )

        val MODERATE = GlitchConfig(
            profileType = GlitchProfileType.MODERATE,
            baseLatencyMs = 750,
            randomJitterMs = 300,
            packetLossPercent = 35.0,
            burstInterruptionEnabled = false,
            direction = ImpairmentDirection.BOTH,
            affectTcp = false
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
            affectTcp = false
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

