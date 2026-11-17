package com.callglitch.app.vpn

import com.callglitch.app.model.ComponentHealthState
import com.callglitch.app.model.DiagnosticsSnapshot
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.VpnLifecycleState
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.Closeable
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Represents an established TUN interface handle whose close() is strictly idempotent.
 */
interface TunHandle : Closeable {
    val fd: Int
}

interface TunInterfaceProvider {
    fun establish(selectedApps: Set<String>, config: GlitchConfig): TunHandle
}

/**
 * Serialized, atomic lifecycle orchestrator coordinating:
 * 1. Local loopback SOCKS5 proxy + impairment controller
 * 2. VpnService TUN interface establishment
 * 3. HevSocks5Tunnel start/stop and worker health monitoring
 *
 * All state transitions run sequentially under [lifecycleMutex], guaranteeing no partial startup leaks,
 * no double-closing of the TUN FD, safe repeated start/stop cycles, and clean rollback on errors.
 */
class VpnSessionController(
    private val tunProvider: TunInterfaceProvider,
    private val socketProtector: SocketProtector,
    private val tunnelEngine: TunnelEngine,
    private val configFilePath: String,
    private val scope: CoroutineScope,
    private val timeProvider: TimeProvider = SystemTimeProvider,
    private val randomProvider: RandomProvider = DefaultRandomProvider,
    private val requestedProxyPort: Int = 0,
    private val startupVerifyDelayMs: Long = 35L,
    private val watchdogIntervalMs: Long = 1_000L,
    private val onStateChanged: (DiagnosticsSnapshot) -> Unit = {}
) {
    private val lifecycleMutex = Mutex()

    private val _diagnostics = MutableStateFlow(DiagnosticsSnapshot())
    val diagnostics: StateFlow<DiagnosticsSnapshot> = _diagnostics.asStateFlow()

    private val _activeProfile = MutableStateFlow(GlitchProfileType.MODERATE)
    val activeProfile: StateFlow<GlitchProfileType> = _activeProfile.asStateFlow()

    private var impairmentController: ImpairmentController? = null
    private var proxyServer: LocalSocks5ProxyServer? = null
    private var currentTun: TunHandle? = null
    private val tunClosed = AtomicBoolean(true)
    private var tunnelStartAttempted: Boolean = false

    private var activeApps: Set<String> = emptySet()
    private var activeConfig: GlitchConfig = GlitchConfig()

    private var watchdogJob: Job? = null
    private var timeoutJob: Job? = null

    suspend fun start(
        selectedApps: Set<String>,
        config: GlitchConfig,
        timeoutSeconds: Int = 0
    ): Result<Unit> = lifecycleMutex.withLock {
        return startLocked(selectedApps, config, timeoutSeconds)
    }

    private suspend fun startLocked(
        selectedApps: Set<String>,
        config: GlitchConfig,
        timeoutSeconds: Int
    ): Result<Unit> {
        if (selectedApps.isEmpty()) {
            val err = "No target applications selected. Please select at least one application."
            publishFailure("Configuration", err)
            return Result.failure(IllegalArgumentException(err))
        }

        // Defensively tear down any prior resources cleanly before starting fresh.
        if (_diagnostics.value.vpnState == VpnLifecycleState.RUNNING ||
            currentTun != null ||
            proxyServer != null ||
            tunnelEngine.isRunning()
        ) {
            stopLocked(preserveFailure = false)
        }

        _activeProfile.value = config.profileType
        activeApps = selectedApps.toSet()
        activeConfig = config

        publishSnapshot(
            DiagnosticsSnapshot(
                vpnState = VpnLifecycleState.STARTING,
                tunnelState = ComponentHealthState.INACTIVE,
                proxyState = ComponentHealthState.STARTING
            )
        )

        val impairment = ImpairmentController(
            initialConfig = config,
            timeProvider = timeProvider,
            randomProvider = randomProvider
        )
        impairmentController = impairment

        // Step 1: Start local loopback SOCKS5 proxy and verify port readiness
        val proxy = LocalSocks5ProxyServer(
            impairmentController = impairment,
            socketProtector = socketProtector,
            requestedPort = requestedProxyPort,
            onError = { component, message ->
                handleComponentError(component, message)
            }
        )

        val boundPort = try {
            proxy.start()
        } catch (e: Exception) {
            runCatching { proxy.stop() }
            impairmentController = null
            val msg = "Local SOCKS5 proxy failed to start: ${e.message ?: "unknown error"}"
            publishFailure("LocalSocks5Proxy", msg)
            return Result.failure(IllegalStateException(msg, e))
        }

        if (!proxy.isRunning || boundPort !in 1..65535) {
            runCatching { proxy.stop() }
            impairmentController = null
            val msg = "Local SOCKS5 proxy failed readiness verification on 127.0.0.1"
            publishFailure("LocalSocks5Proxy", msg)
            return Result.failure(IllegalStateException(msg))
        }
        proxyServer = proxy

        publishSnapshot(
            _diagnostics.value.copy(
                proxyState = ComponentHealthState.RUNNING,
                proxyPort = boundPort,
                tunnelState = ComponentHealthState.STARTING
            )
        )

        // Step 2: Establish TUN interface for selected apps
        val tun = try {
            tunProvider.establish(selectedApps, config)
        } catch (e: Exception) {
            runCatching { proxy.stop() }
            proxyServer = null
            impairmentController = null
            val msg = e.message ?: "Failed to establish VpnService TUN interface"
            publishFailure("VpnInterface", msg)
            return Result.failure(e)
        }
        currentTun = tun
        tunClosed.set(false)

        // Step 3: Start HevSocks5Tunnel and verify the native worker stays alive
        tunnelStartAttempted = true
        val tunnelStarted = try {
            tunnelEngine.start(
                TunnelConfig(
                    tunFd = tun.fd,
                    mtu = 1500,
                    socks5Address = "127.0.0.1",
                    socks5Port = boundPort,
                    configFilePath = configFilePath
                )
            )
        } catch (e: Exception) {
            rollbackPartialStartup("HevSocks5Tunnel", "HevSocks5Tunnel threw on startup: ${e.message}")
            return Result.failure(e)
        }

        if (!tunnelStarted) {
            rollbackPartialStartup("HevSocks5Tunnel", "HevSocks5Tunnel failed to start native worker.")
            return Result.failure(IllegalStateException("HevSocks5Tunnel failed to start native worker."))
        }

        if (startupVerifyDelayMs > 0L) {
            delay(startupVerifyDelayMs)
        }

        if (!tunnelEngine.isRunning()) {
            rollbackPartialStartup(
                "HevSocks5Tunnel",
                "HevSocks5Tunnel terminated immediately after startup."
            )
            return Result.failure(IllegalStateException("HevSocks5Tunnel terminated immediately after startup."))
        }

        if (!proxy.isRunning) {
            rollbackPartialStartup(
                "LocalSocks5Proxy",
                "Local SOCKS5 proxy stopped unexpectedly during startup."
            )
            return Result.failure(IllegalStateException("Local SOCKS5 proxy stopped unexpectedly during startup."))
        }

        publishSnapshot(
            DiagnosticsSnapshot(
                vpnState = VpnLifecycleState.RUNNING,
                tunnelState = ComponentHealthState.RUNNING,
                proxyState = ComponentHealthState.RUNNING,
                proxyPort = boundPort
            )
        )

        startWatchdogLocked()
        scheduleTimeoutLocked(timeoutSeconds)
        return Result.success(Unit)
    }

    suspend fun stop(): Unit = lifecycleMutex.withLock {
        stopLocked(preserveFailure = false)
    }

    suspend fun updateConfig(newConfig: GlitchConfig): Unit = lifecycleMutex.withLock {
        activeConfig = newConfig
        _activeProfile.value = newConfig.profileType
        impairmentController?.updateConfig(newConfig)
    }

    suspend fun updateSelectedApps(newApps: Set<String>): Result<Unit> = lifecycleMutex.withLock {
        if (_diagnostics.value.vpnState != VpnLifecycleState.RUNNING) {
            activeApps = newApps.toSet()
            return@withLock Result.success(Unit)
        }

        if (newApps.isEmpty()) {
            stopLocked(preserveFailure = false)
            return@withLock Result.success(Unit)
        }

        val proxy = proxyServer
        if (proxy == null || !proxy.isRunning) {
            return@withLock startLocked(newApps, activeConfig, 0)
        }

        publishSnapshot(
            _diagnostics.value.copy(
                vpnState = VpnLifecycleState.RECONFIGURING,
                tunnelState = ComponentHealthState.STARTING
            )
        )

        // Stop Hev first so it releases the old TUN FD cleanly, then close old TUN FD once.
        if (tunnelStartAttempted || tunnelEngine.isRunning()) {
            runCatching { tunnelEngine.stop() }
            tunnelStartAttempted = false
        }
        closeCurrentTunOnce()
        proxy.resetActiveSessionsOnNetworkChange()

        val newTun = try {
            tunProvider.establish(newApps, activeConfig)
        } catch (e: Exception) {
            stopLocked(preserveFailure = false)
            val msg = e.message ?: "Failed to rebuild TUN interface for updated applications"
            publishFailure("VpnInterface", msg)
            return@withLock Result.failure(e)
        }
        currentTun = newTun
        tunClosed.set(false)
        activeApps = newApps.toSet()

        tunnelStartAttempted = true
        val started = runCatching {
            tunnelEngine.start(
                TunnelConfig(
                    tunFd = newTun.fd,
                    mtu = 1500,
                    socks5Address = "127.0.0.1",
                    socks5Port = proxy.port,
                    configFilePath = configFilePath
                )
            )
        }.getOrElse { false }

        if (startupVerifyDelayMs > 0L) {
            delay(startupVerifyDelayMs)
        }

        if (!started || !tunnelEngine.isRunning()) {
            rollbackPartialStartup(
                "HevSocks5Tunnel",
                "HevSocks5Tunnel failed to restart after target app reconfiguration."
            )
            return@withLock Result.failure(IllegalStateException("HevSocks5Tunnel failed to restart after app reconfiguration."))
        }

        publishSnapshot(
            _diagnostics.value.copy(
                vpnState = VpnLifecycleState.RUNNING,
                tunnelState = ComponentHealthState.RUNNING,
                proxyState = ComponentHealthState.RUNNING,
                lastError = null,
                lastErrorComponent = null
            )
        )
        return@withLock Result.success(Unit)
    }

    suspend fun onUnderlyingNetworkChanged(hasValidatedNetwork: Boolean) {
        lifecycleMutex.withLock {
            if (_diagnostics.value.vpnState == VpnLifecycleState.RUNNING) {
                // Closing stale outbound sockets forces clean re-creation bound to the active physical network.
                if (hasValidatedNetwork) {
                    proxyServer?.resetActiveSessionsOnNetworkChange()
                }
            }
        }
    }

    /**
     * Exposed so tests or internal monitors can trigger an immediate health evaluation cycle.
     */
    suspend fun checkHealthNow() {
        lifecycleMutex.withLock {
            evaluateHealthLocked()
        }
    }

    private suspend fun evaluateHealthLocked() {
        val current = _diagnostics.value
        if (current.vpnState != VpnLifecycleState.RUNNING) return

        val tunnelOk = runCatching { tunnelEngine.isRunning() }.getOrElse { false }
        val proxyOk = proxyServer?.isRunning == true

        if (!tunnelOk) {
            val msg = "HevSocks5Tunnel exited unexpectedly. Stopped VPN cleanly to restore normal networking."
            stopLocked(preserveFailure = true)
            publishFailure("HevSocks5Tunnel", msg)
            return
        }

        if (!proxyOk) {
            val msg = "Local SOCKS5 proxy stopped unexpectedly. Stopped VPN cleanly to restore normal networking."
            stopLocked(preserveFailure = true)
            publishFailure("LocalSocks5Proxy", msg)
            return
        }

        val imp = impairmentController?.snapshotMetrics()
        val tunStats = runCatching { tunnelEngine.getStats() }.getOrElse { TunnelStats() }
        val proxy = proxyServer

        publishSnapshot(
            current.copy(
                vpnState = VpnLifecycleState.RUNNING,
                tunnelState = ComponentHealthState.RUNNING,
                proxyState = ComponentHealthState.RUNNING,
                proxyPort = proxy?.port ?: 0,
                activeTcpSessions = proxy?.activeTcpSessions ?: 0,
                activeUdpSessions = proxy?.activeUdpSessions ?: 0,
                forwardedUdpDatagrams = imp?.forwardedUdpDatagrams ?: 0L,
                droppedUdpDatagrams = imp?.droppedUdpDatagrams ?: 0L,
                forwardedTcpBytes = imp?.forwardedTcpBytes ?: 0L,
                delayedTcpWrites = imp?.delayedTcpWrites ?: 0L,
                throttledTcpEvents = imp?.throttledTcpEvents ?: 0L,
                tunnelTxPackets = tunStats.txPackets,
                tunnelTxBytes = tunStats.txBytes,
                tunnelRxPackets = tunStats.rxPackets,
                tunnelRxBytes = tunStats.rxBytes
            )
        )
    }

    private fun handleComponentError(component: String, message: String) {
        val current = _diagnostics.value
        if (component == "SocketProtector") {
            scope.launch {
                lifecycleMutex.withLock {
                    if (_diagnostics.value.vpnState == VpnLifecycleState.RUNNING ||
                        _diagnostics.value.vpnState == VpnLifecycleState.STARTING
                    ) {
                        stopLocked(preserveFailure = true)
                        publishFailure(component, message)
                    }
                }
            }
        } else {
            publishSnapshot(
                current.copy(
                    lastError = message,
                    lastErrorComponent = component
                )
            )
        }
    }

    private fun rollbackPartialStartup(component: String, message: String) {
        stopLocked(preserveFailure = true)
        publishFailure(component, message)
    }

    private fun stopLocked(preserveFailure: Boolean) {
        watchdogJob?.cancel()
        watchdogJob = null
        timeoutJob?.cancel()
        timeoutJob = null

        val prior = _diagnostics.value
        publishSnapshot(
            prior.copy(
                vpnState = VpnLifecycleState.STOPPING,
                proxyPort = 0
            )
        )

        // 1. Stop HevSocks5Tunnel first (joins its worker thread so TUN FD is no longer used)
        if (tunnelStartAttempted || tunnelEngine.isRunning()) {
            runCatching { tunnelEngine.stop() }
            tunnelStartAttempted = false
        }

        // 2. Stop local loopback SOCKS5 proxy and clear all active sessions
        runCatching { proxyServer?.stop() }
        proxyServer = null
        impairmentController = null

        // 3. Close TUN FD exactly once after Hev has joined
        closeCurrentTunOnce()

        if (!preserveFailure) {
            publishSnapshot(
                DiagnosticsSnapshot(
                    vpnState = VpnLifecycleState.STOPPED,
                    tunnelState = ComponentHealthState.STOPPED,
                    proxyState = ComponentHealthState.STOPPED
                )
            )
        }
    }

    private fun closeCurrentTunOnce() {
        if (tunClosed.compareAndSet(false, true)) {
            runCatching { currentTun?.close() }
        }
        currentTun = null
    }

    private fun startWatchdogLocked() {
        watchdogJob?.cancel()
        watchdogJob = scope.launch {
            while (isActive) {
                delay(watchdogIntervalMs)
                lifecycleMutex.withLock {
                    if (_diagnostics.value.vpnState == VpnLifecycleState.RUNNING) {
                        evaluateHealthLocked()
                    } else {
                        cancel()
                    }
                }
            }
        }
    }

    private fun scheduleTimeoutLocked(timeoutSeconds: Int) {
        timeoutJob?.cancel()
        if (timeoutSeconds <= 0) return
        timeoutJob = scope.launch {
            delay(timeoutSeconds * 1000L)
            lifecycleMutex.withLock {
                if (_diagnostics.value.vpnState == VpnLifecycleState.RUNNING) {
                    stopLocked(preserveFailure = false)
                }
            }
        }
    }

    private fun publishFailure(component: String, message: String) {
        publishSnapshot(
            DiagnosticsSnapshot(
                vpnState = VpnLifecycleState.FAILED,
                tunnelState = if (component == "HevSocks5Tunnel") ComponentHealthState.FAILED else ComponentHealthState.STOPPED,
                proxyState = if (component == "LocalSocks5Proxy") ComponentHealthState.FAILED else ComponentHealthState.STOPPED,
                lastError = message,
                lastErrorComponent = component
            )
        )
    }

    private fun publishSnapshot(snapshot: DiagnosticsSnapshot) {
        _diagnostics.value = snapshot
        onStateChanged(snapshot)
    }
}
