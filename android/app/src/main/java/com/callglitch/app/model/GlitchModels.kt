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
            baseLatencyMs = 120,
            randomJitterMs = 30,
            packetLossPercent = 1.0,
            burstInterruptionEnabled = false,
            direction = ImpairmentDirection.BOTH,
            affectTcp = false
        )

        val MODERATE = GlitchConfig(
            profileType = GlitchProfileType.MODERATE,
            baseLatencyMs = 220,
            randomJitterMs = 90,
            packetLossPercent = 3.0,
            burstInterruptionEnabled = false,
            direction = ImpairmentDirection.BOTH,
            affectTcp = false
        )

        val SEVERE = GlitchConfig(
            profileType = GlitchProfileType.SEVERE,
            baseLatencyMs = 350,
            randomJitterMs = 160,
            packetLossPercent = 7.0,
            burstInterruptionEnabled = true,
            burstDurationMs = 1200,
            burstIntervalSeconds = 10,
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

