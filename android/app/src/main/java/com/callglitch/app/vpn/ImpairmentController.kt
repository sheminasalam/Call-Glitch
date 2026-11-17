package com.callglitch.app.vpn

import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.ImpairmentDirection
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

interface TimeProvider {
    fun nowMs(): Long
}

object SystemTimeProvider : TimeProvider {
    override fun nowMs(): Long = System.currentTimeMillis()
}

interface RandomProvider {
    /** Returns a double in [0.0, 1.0). */
    fun nextDouble(): Double

    /** Returns a signed double in [-1.0, 1.0]. */
    fun nextSignedUnit(): Double
}

object DefaultRandomProvider : RandomProvider {
    override fun nextDouble(): Double = Random.nextDouble()
    override fun nextSignedUnit(): Double = Random.nextDouble(-1.0, 1.0)
}

enum class TrafficDirection {
    OUTGOING,
    INCOMING
}

sealed class UdpImpairmentDecision {
    object Drop : UdpImpairmentDecision()
    data class Forward(val delayMs: Long) : UdpImpairmentDecision()
}

data class TcpWritePlan(
    val releaseAtMs: Long,
    val nextAvailableAtMs: Long,
    val inBurstPause: Boolean,
    val appliedDelay: Boolean,
    val appliedThrottle: Boolean
)

data class ImpairmentMetrics(
    val forwardedUdpDatagrams: Long,
    val droppedUdpDatagrams: Long,
    val forwardedTcpBytes: Long,
    val delayedTcpWrites: Long,
    val throttledTcpEvents: Long
)

/**
 * Thread-safe, deterministic network impairment policy engine used by the local SOCKS5 proxy.
 *
 * - UDP packets are evaluated per complete datagram (never fragmented or payload-corrupted).
 * - TCP streams are never arbitrarily dropped or corrupted; instead they experience safe
 *   latency, jitter, bandwidth pacing, temporary burst pauses, and backpressure.
 */
class ImpairmentController(
    initialConfig: GlitchConfig,
    private val timeProvider: TimeProvider = SystemTimeProvider,
    private val randomProvider: RandomProvider = DefaultRandomProvider
) {
    @Volatile
    var currentConfig: GlitchConfig = initialConfig
        private set

    private val epochMs = AtomicLong(timeProvider.nowMs())

    private val forwardedUdp = AtomicLong(0)
    private val droppedUdp = AtomicLong(0)
    private val forwardedTcpBytes = AtomicLong(0)
    private val delayedTcpWrites = AtomicLong(0)
    private val throttledTcpEvents = AtomicLong(0)

    fun updateConfig(newConfig: GlitchConfig) {
        currentConfig = newConfig
    }

    fun resetMetrics() {
        forwardedUdp.set(0)
        droppedUdp.set(0)
        forwardedTcpBytes.set(0)
        delayedTcpWrites.set(0)
        throttledTcpEvents.set(0)
        epochMs.set(timeProvider.nowMs())
    }

    fun nowMs(): Long = timeProvider.nowMs()

    fun isInBurstWindow(nowMs: Long = timeProvider.nowMs()): Boolean {
        val cfg = currentConfig
        if (!cfg.burstInterruptionEnabled || cfg.burstDurationMs <= 0) return false
        val intervalMs = (cfg.burstIntervalSeconds.coerceAtLeast(1) * 1000L)
            .coerceAtLeast(cfg.burstDurationMs.toLong())
        val elapsed = (nowMs - epochMs.get()).coerceAtLeast(0L)
        return (elapsed % intervalMs) < cfg.burstDurationMs.toLong()
    }

    fun directionApplies(configDir: ImpairmentDirection, trafficDir: TrafficDirection): Boolean {
        return when (configDir) {
            ImpairmentDirection.BOTH -> true
            ImpairmentDirection.OUTGOING -> trafficDir == TrafficDirection.OUTGOING
            ImpairmentDirection.INCOMING -> trafficDir == TrafficDirection.INCOMING
        }
    }

    fun evaluateUdp(direction: TrafficDirection, isDns: Boolean): UdpImpairmentDecision {
        val cfg = currentConfig
        if (isDns || !directionApplies(cfg.direction, direction)) {
            forwardedUdp.incrementAndGet()
            return UdpImpairmentDecision.Forward(0L)
        }

        val now = timeProvider.nowMs()
        if (isInBurstWindow(now)) {
            droppedUdp.incrementAndGet()
            return UdpImpairmentDecision.Drop
        }

        if (cfg.packetLossPercent > 0.0) {
            if (cfg.packetLossPercent >= 100.0 ||
                (randomProvider.nextDouble() * 100.0) < cfg.packetLossPercent
            ) {
                droppedUdp.incrementAndGet()
                return UdpImpairmentDecision.Drop
            }
        }

        val delayMs = computeJitteredDelayMs(cfg)
        forwardedUdp.incrementAndGet()
        return UdpImpairmentDecision.Forward(delayMs)
    }

    fun recordUdpQueueDrop() {
        droppedUdp.incrementAndGet()
    }

    /**
     * Computes a safe stream-preserving transmission schedule for an intact TCP chunk.
     * Never drops bytes.
     */
    fun computeTcpWritePlan(
        direction: TrafficDirection,
        byteCount: Int,
        nextAvailableTxMs: Long
    ): TcpWritePlan {
        val cfg = currentConfig
        val now = timeProvider.nowMs()
        if (!cfg.affectTcp || !directionApplies(cfg.direction, direction)) {
            return TcpWritePlan(
                releaseAtMs = now,
                nextAvailableAtMs = now,
                inBurstPause = false,
                appliedDelay = false,
                appliedThrottle = false
            )
        }

        if (isInBurstWindow(now)) {
            return TcpWritePlan(
                releaseAtMs = now,
                nextAvailableAtMs = maxOf(now, nextAvailableTxMs),
                inBurstPause = true,
                appliedDelay = true,
                appliedThrottle = false
            )
        }

        val latencyMs = computeJitteredDelayMs(cfg)
        val bps = if (cfg.tcpBandwidthKbps > 0) cfg.tcpBandwidthKbps.toLong() * 1000L else 0L
        val serializationMs = if (bps > 0L && byteCount > 0) {
            ((byteCount.toLong() * 8_000L) / bps).coerceAtLeast(1L)
        } else {
            0L
        }

        val targetStartMs = maxOf(now + latencyMs, nextAvailableTxMs)
        val nextAvailMs = targetStartMs + serializationMs
        val throttled = serializationMs > 0L || nextAvailableTxMs > (now + latencyMs)
        val delayed = targetStartMs > now

        return TcpWritePlan(
            releaseAtMs = targetStartMs,
            nextAvailableAtMs = nextAvailMs,
            inBurstPause = false,
            appliedDelay = delayed,
            appliedThrottle = throttled
        )
    }

    fun recordTcpWrite(byteCount: Int, appliedDelay: Boolean, appliedThrottle: Boolean) {
        forwardedTcpBytes.addAndGet(byteCount.toLong())
        if (appliedDelay) {
            delayedTcpWrites.incrementAndGet()
        }
        if (appliedThrottle) {
            throttledTcpEvents.incrementAndGet()
        }
    }

    fun snapshotMetrics(): ImpairmentMetrics {
        return ImpairmentMetrics(
            forwardedUdpDatagrams = forwardedUdp.get(),
            droppedUdpDatagrams = droppedUdp.get(),
            forwardedTcpBytes = forwardedTcpBytes.get(),
            delayedTcpWrites = delayedTcpWrites.get(),
            throttledTcpEvents = throttledTcpEvents.get()
        )
    }

    private fun computeJitteredDelayMs(cfg: GlitchConfig): Long {
        if (cfg.baseLatencyMs <= 0 && cfg.randomJitterMs <= 0) return 0L
        val jitter = if (cfg.randomJitterMs > 0) {
            (randomProvider.nextSignedUnit() * cfg.randomJitterMs).toLong()
        } else {
            0L
        }
        return (cfg.baseLatencyMs.toLong() + jitter).coerceAtLeast(0L)
    }
}
