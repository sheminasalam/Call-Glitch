package com.callglitch.app

import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection
import com.callglitch.app.vpn.ImpairmentController
import com.callglitch.app.vpn.RandomProvider
import com.callglitch.app.vpn.TimeProvider
import com.callglitch.app.vpn.TrafficDirection
import com.callglitch.app.vpn.UdpImpairmentDecision
import org.junit.Assert.*
import org.junit.Test

class ImpairmentControllerTest {

    private class FakeClock(var now: Long = 1000L) : TimeProvider {
        override fun nowMs(): Long = now
    }

    private class SequenceRandom(
        private val doubles: List<Double>,
        private val signed: List<Double> = listOf(0.0)
    ) : RandomProvider {
        private var dIdx = 0
        private var sIdx = 0

        override fun nextDouble(): Double {
            val v = doubles[dIdx % doubles.size]
            dIdx++
            return v
        }

        override fun nextSignedUnit(): Double {
            val v = signed[sIdx % signed.size]
            sIdx++
            return v
        }
    }

    @Test
    fun testDeterministicUdpPacketLossAndLatency() {
        val clock = FakeClock(10_000L)
        // Loss = 30%. Sequence: 0.10 (drop), 0.50 (fwd), 0.29 (drop), 0.30 (fwd)
        val rng = SequenceRandom(
            doubles = listOf(0.10, 0.50, 0.29, 0.30),
            signed = listOf(0.5, -0.5)
        )
        val cfg = GlitchConfig(
            profileType = GlitchProfileType.CUSTOM,
            baseLatencyMs = 200,
            randomJitterMs = 40,
            packetLossPercent = 30.0,
            burstInterruptionEnabled = false
        )
        val controller = ImpairmentController(cfg, clock, rng)

        assertEquals(UdpImpairmentDecision.Drop, controller.evaluateUdp(TrafficDirection.OUTGOING, isDns = false))
        assertEquals(UdpImpairmentDecision.Forward(220L), controller.evaluateUdp(TrafficDirection.OUTGOING, isDns = false))
        assertEquals(UdpImpairmentDecision.Drop, controller.evaluateUdp(TrafficDirection.INCOMING, isDns = false))
        assertEquals(UdpImpairmentDecision.Forward(180L), controller.evaluateUdp(TrafficDirection.INCOMING, isDns = false))

        val stats = controller.snapshotMetrics()
        assertEquals(2L, stats.droppedUdpDatagrams)
        assertEquals(2L, stats.forwardedUdpDatagrams)
    }

    @Test
    fun testBurstLossAndRecoveryPeriods() {
        val clock = FakeClock(0L)
        val rng = SequenceRandom(doubles = listOf(0.99), signed = listOf(0.0))
        val cfg = GlitchConfig(
            profileType = GlitchProfileType.CUSTOM,
            baseLatencyMs = 100,
            randomJitterMs = 0,
            packetLossPercent = 0.0,
            burstInterruptionEnabled = true,
            burstDurationMs = 2000,
            burstIntervalSeconds = 5
        )
        val controller = ImpairmentController(cfg, clock, rng)

        // [0..1999] -> burst cut active
        clock.now = 500L
        assertTrue(controller.isInBurstWindow())
        assertEquals(UdpImpairmentDecision.Drop, controller.evaluateUdp(TrafficDirection.OUTGOING, isDns = false))

        // [2000..4999] -> recovery window
        clock.now = 2500L
        assertFalse(controller.isInBurstWindow())
        assertEquals(UdpImpairmentDecision.Forward(100L), controller.evaluateUdp(TrafficDirection.OUTGOING, isDns = false))

        // [5000..6999] -> next burst cycle
        clock.now = 5500L
        assertTrue(controller.isInBurstWindow())
        assertEquals(UdpImpairmentDecision.Drop, controller.evaluateUdp(TrafficDirection.INCOMING, isDns = false))
    }

    @Test
    fun testDnsExemptionAndDirectionFiltering() {
        val clock = FakeClock(0L)
        val rng = SequenceRandom(doubles = listOf(0.0), signed = listOf(1.0))
        val cfg = GlitchConfig(
            profileType = GlitchProfileType.CUSTOM,
            baseLatencyMs = 1500,
            randomJitterMs = 500,
            packetLossPercent = 100.0,
            burstInterruptionEnabled = true,
            direction = ImpairmentDirection.INCOMING
        )
        val controller = ImpairmentController(cfg, clock, rng)

        // DNS is always forwarded with 0ms even under 100% loss & burst
        assertEquals(UdpImpairmentDecision.Forward(0L), controller.evaluateUdp(TrafficDirection.INCOMING, isDns = true))
        // Outgoing bypassed when direction == INCOMING
        assertEquals(UdpImpairmentDecision.Forward(0L), controller.evaluateUdp(TrafficDirection.OUTGOING, isDns = false))
        // Incoming impaired
        assertEquals(UdpImpairmentDecision.Drop, controller.evaluateUdp(TrafficDirection.INCOMING, isDns = false))
    }

    @Test
    fun testTcpImpairmentPlanLatencyPacingAndBurstPause() {
        val clock = FakeClock(1_000L)
        val rng = SequenceRandom(doubles = listOf(0.9), signed = listOf(0.0))
        val cfg = GlitchConfig(
            profileType = GlitchProfileType.CUSTOM,
            baseLatencyMs = 100,
            randomJitterMs = 0,
            packetLossPercent = 50.0,
            burstInterruptionEnabled = true,
            burstDurationMs = 1000,
            burstIntervalSeconds = 5,
            affectTcp = true,
            tcpBandwidthKbps = 800 // 100 bytes/ms -> 1000 bytes = 10ms
        )
        val controller = ImpairmentController(cfg, clock, rng)

        // During burst [1000..1999], TCP signals safe temporary pause (no drops)
        val burstPlan = controller.computeTcpWritePlan(TrafficDirection.OUTGOING, 1000, clock.now)
        assertTrue(burstPlan.inBurstPause)

        // During recovery [2000..5999], computes latency + bandwidth serialization
        clock.now = 2500L
        val plan1 = controller.computeTcpWritePlan(TrafficDirection.OUTGOING, 1000, clock.now)
        assertFalse(plan1.inBurstPause)
        assertTrue(plan1.appliedDelay)
        assertTrue(plan1.appliedThrottle)
        assertEquals(2600L, plan1.releaseAtMs) // now + 100ms
        assertEquals(2610L, plan1.nextAvailableAtMs) // + 10ms for 1000B @ 800Kbps

        // Immediate second chunk paces cleanly behind plan1.nextAvailableAtMs
        val plan2 = controller.computeTcpWritePlan(TrafficDirection.OUTGOING, 1000, plan1.nextAvailableAtMs)
        assertEquals(2610L, plan2.releaseAtMs)
        assertEquals(2620L, plan2.nextAvailableAtMs)
    }
}
