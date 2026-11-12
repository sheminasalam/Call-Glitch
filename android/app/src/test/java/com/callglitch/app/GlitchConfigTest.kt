package com.callglitch.app

import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection
import org.junit.Assert.*
import org.junit.Test

class GlitchConfigTest {

    @Test
    fun testMildProfileParameters() {
        val mild = GlitchConfig.MILD
        assertEquals(GlitchProfileType.MILD, mild.profileType)
        assertEquals(120, mild.baseLatencyMs)
        assertEquals(30, mild.randomJitterMs)
        assertEquals(1.0, mild.packetLossPercent, 0.001)
        assertFalse(mild.burstInterruptionEnabled)
        assertEquals(ImpairmentDirection.BOTH, mild.direction)
        assertFalse(mild.affectTcp)
    }

    @Test
    fun testModerateProfileParameters() {
        val moderate = GlitchConfig.MODERATE
        assertEquals(GlitchProfileType.MODERATE, moderate.profileType)
        assertEquals(220, moderate.baseLatencyMs)
        assertEquals(90, moderate.randomJitterMs)
        assertEquals(3.0, moderate.packetLossPercent, 0.001)
        assertFalse(moderate.burstInterruptionEnabled)
        assertEquals(ImpairmentDirection.BOTH, moderate.direction)
        assertFalse(moderate.affectTcp)
    }

    @Test
    fun testSevereProfileParameters() {
        val severe = GlitchConfig.SEVERE
        assertEquals(GlitchProfileType.SEVERE, severe.profileType)
        assertEquals(350, severe.baseLatencyMs)
        assertEquals(160, severe.randomJitterMs)
        assertEquals(7.0, severe.packetLossPercent, 0.001)
        assertTrue(severe.burstInterruptionEnabled)
        assertEquals(1200, severe.burstDurationMs)
        assertEquals(ImpairmentDirection.BOTH, severe.direction)
        assertFalse(severe.affectTcp)
    }

    @Test
    fun testCustomFallbackMapping() {
        val customFallback = GlitchConfig(
            profileType = GlitchProfileType.CUSTOM,
            baseLatencyMs = 450,
            randomJitterMs = 120,
            packetLossPercent = 12.0,
            direction = ImpairmentDirection.OUTGOING,
            affectTcp = true
        )

        val resolved = GlitchConfig.forType(GlitchProfileType.CUSTOM, customFallback)
        assertEquals(GlitchProfileType.CUSTOM, resolved.profileType)
        assertEquals(450, resolved.baseLatencyMs)
        assertEquals(120, resolved.randomJitterMs)
        assertEquals(12.0, resolved.packetLossPercent, 0.001)
        assertEquals(ImpairmentDirection.OUTGOING, resolved.direction)
        assertTrue(resolved.affectTcp)
    }
}
