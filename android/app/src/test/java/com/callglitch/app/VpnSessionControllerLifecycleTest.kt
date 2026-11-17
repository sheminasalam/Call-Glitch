package com.callglitch.app

import com.callglitch.app.model.ComponentHealthState
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.VpnLifecycleState
import com.callglitch.app.vpn.SocketProtector
import com.callglitch.app.vpn.TunHandle
import com.callglitch.app.vpn.TunInterfaceProvider
import com.callglitch.app.vpn.TunnelConfig
import com.callglitch.app.vpn.TunnelEngine
import com.callglitch.app.vpn.TunnelStats
import com.callglitch.app.vpn.VpnSessionController
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import org.junit.Assert.*
import org.junit.Test
import java.io.File
import java.io.IOException
import java.net.DatagramSocket
import java.net.Socket
import java.util.concurrent.atomic.AtomicInteger

class VpnSessionControllerLifecycleTest {

    private class FakeTunHandle(override val fd: Int) : TunHandle {
        val closeCount = AtomicInteger(0)
        override fun close() {
            closeCount.incrementAndGet()
        }
    }

    private class FakeTunProvider(
        private val shouldFail: Boolean = false
    ) : TunInterfaceProvider {
        val createdHandles = mutableListOf<FakeTunHandle>()
        private var nextFd = 100

        override fun establish(selectedApps: Set<String>, config: GlitchConfig): TunHandle {
            if (shouldFail) throw IOException("Mock VpnService.Builder.establish() returned null")
            return FakeTunHandle(nextFd++).also { createdHandles.add(it) }
        }
    }

    private class FakeTunnelEngine(
        var failOnStart: Boolean = false,
        var dieImmediatelyAfterStart: Boolean = false
    ) : TunnelEngine {
        var running = false
        var startCalls = 0
        var stopCalls = 0
        var lastConfig: TunnelConfig? = null

        override fun start(config: TunnelConfig): Boolean {
            startCalls++
            lastConfig = config
            if (failOnStart) {
                running = false
                return false
            }
            running = !dieImmediatelyAfterStart
            return true
        }

        override fun stop(): Boolean {
            stopCalls++
            running = false
            return true
        }

        override fun isRunning(): Boolean = running

        override fun getStats(): TunnelStats = TunnelStats(10, 1024, 12, 2048)
    }

    private val allowAllProtector = object : SocketProtector {
        override fun protect(socket: Socket): Boolean = true
        override fun protect(socket: DatagramSocket): Boolean = true
    }

    @Test
    fun testRepeatedStartStopCyclesAndSingleTunFdClose() = runBlocking {
        val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        val tunProvider = FakeTunProvider()
        val tunnelEngine = FakeTunnelEngine()
        val confPath = File.createTempFile("hev-test-", ".yml").apply { deleteOnExit() }.absolutePath

        val controller = VpnSessionController(
            tunProvider = tunProvider,
            socketProtector = allowAllProtector,
            tunnelEngine = tunnelEngine,
            configFilePath = confPath,
            scope = scope,
            startupVerifyDelayMs = 0L,
            watchdogIntervalMs = 60_000L
        )

        try {
            val apps = setOf("com.whatsapp", "com.chamet")
            repeat(25) { cycle ->
                val res = controller.start(apps, GlitchConfig.MODERATE)
                assertTrue("Cycle $cycle failed to start: ${res.exceptionOrNull()}", res.isSuccess)
                assertEquals(VpnLifecycleState.RUNNING, controller.diagnostics.value.vpnState)
                assertEquals(ComponentHealthState.RUNNING, controller.diagnostics.value.tunnelState)
                assertEquals(ComponentHealthState.RUNNING, controller.diagnostics.value.proxyState)
                assertTrue(controller.diagnostics.value.proxyPort > 0)

                controller.stop()
                // Calling stop() a second time must be idempotent
                controller.stop()

                assertEquals(VpnLifecycleState.STOPPED, controller.diagnostics.value.vpnState)
                assertFalse(tunnelEngine.isRunning())
            }

            assertEquals(25, tunProvider.createdHandles.size)
            tunProvider.createdHandles.forEachIndexed { idx, handle ->
                assertEquals("Handle $idx must be closed exactly once", 1, handle.closeCount.get())
            }
        } finally {
            scope.cancel()
        }
    }

    @Test
    fun testPartialStartupRollbackWhenTunnelFails() = runBlocking {
        val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        val tunProvider = FakeTunProvider()
        val tunnelEngine = FakeTunnelEngine(failOnStart = true)
        val confPath = File.createTempFile("hev-fail-", ".yml").apply { deleteOnExit() }.absolutePath

        val controller = VpnSessionController(
            tunProvider = tunProvider,
            socketProtector = allowAllProtector,
            tunnelEngine = tunnelEngine,
            configFilePath = confPath,
            scope = scope,
            startupVerifyDelayMs = 0L,
            watchdogIntervalMs = 60_000L
        )

        try {
            val res = controller.start(setOf("com.whatsapp"), GlitchConfig.SEVERE)
            assertTrue(res.isFailure)
            assertEquals(VpnLifecycleState.FAILED, controller.diagnostics.value.vpnState)
            assertEquals("HevSocks5Tunnel", controller.diagnostics.value.lastErrorComponent)
            assertEquals(0, controller.diagnostics.value.proxyPort)
            assertEquals(1, tunProvider.createdHandles.size)
            assertEquals(1, tunProvider.createdHandles.first().closeCount.get())
        } finally {
            scope.cancel()
        }
    }

    @Test
    fun testPartialStartupWhenProxyBindFails() = runBlocking {
        val occupiedSocket = java.net.ServerSocket(0, 10, java.net.InetAddress.getByName("127.0.0.1"))
        val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        val tunProvider = FakeTunProvider()
        val tunnelEngine = FakeTunnelEngine()
        val confPath = File.createTempFile("hev-proxyfail-", ".yml").apply { deleteOnExit() }.absolutePath

        val controller = VpnSessionController(
            tunProvider = tunProvider,
            socketProtector = allowAllProtector,
            tunnelEngine = tunnelEngine,
            configFilePath = confPath,
            scope = scope,
            requestedProxyPort = occupiedSocket.localPort,
            startupVerifyDelayMs = 0L,
            watchdogIntervalMs = 60_000L
        )

        try {
            val res = controller.start(setOf("com.whatsapp"), GlitchConfig.MILD)
            assertTrue(res.isFailure)
            assertEquals(VpnLifecycleState.FAILED, controller.diagnostics.value.vpnState)
            assertEquals("LocalSocks5Proxy", controller.diagnostics.value.lastErrorComponent)
            assertEquals(0, tunProvider.createdHandles.size)
            assertEquals(0, tunnelEngine.startCalls)
            assertEquals(0, controller.diagnostics.value.proxyPort)
        } finally {
            occupiedSocket.close()
            scope.cancel()
        }
    }

    @Test
    fun testPartialStartupRollbackWhenTunEstablishFails() = runBlocking {
        val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        val tunProvider = FakeTunProvider(shouldFail = true)
        val tunnelEngine = FakeTunnelEngine()
        val confPath = File.createTempFile("hev-tunfail-", ".yml").apply { deleteOnExit() }.absolutePath

        val controller = VpnSessionController(
            tunProvider = tunProvider,
            socketProtector = allowAllProtector,
            tunnelEngine = tunnelEngine,
            configFilePath = confPath,
            scope = scope,
            startupVerifyDelayMs = 0L,
            watchdogIntervalMs = 60_000L
        )

        try {
            val res = controller.start(setOf("com.whatsapp"), GlitchConfig.MILD)
            assertTrue(res.isFailure)
            assertEquals(VpnLifecycleState.FAILED, controller.diagnostics.value.vpnState)
            assertEquals("VpnInterface", controller.diagnostics.value.lastErrorComponent)
            assertEquals(0, tunnelEngine.startCalls)
            assertEquals(0, controller.diagnostics.value.proxyPort)
        } finally {
            scope.cancel()
        }
    }

    @Test
    fun testUnexpectedTunnelTerminationTriggersCleanTeardown() = runBlocking {
        val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        val tunProvider = FakeTunProvider()
        val tunnelEngine = FakeTunnelEngine()
        val confPath = File.createTempFile("hev-crash-", ".yml").apply { deleteOnExit() }.absolutePath

        val controller = VpnSessionController(
            tunProvider = tunProvider,
            socketProtector = allowAllProtector,
            tunnelEngine = tunnelEngine,
            configFilePath = confPath,
            scope = scope,
            startupVerifyDelayMs = 0L,
            watchdogIntervalMs = 60_000L
        )

        try {
            assertTrue(controller.start(setOf("com.whatsapp"), GlitchConfig.MODERATE).isSuccess)
            assertEquals(VpnLifecycleState.RUNNING, controller.diagnostics.value.vpnState)

            // Simulate sudden native Hev worker crash
            tunnelEngine.running = false
            controller.checkHealthNow()

            assertEquals(VpnLifecycleState.FAILED, controller.diagnostics.value.vpnState)
            assertEquals("HevSocks5Tunnel", controller.diagnostics.value.lastErrorComponent)
            assertEquals(1, tunProvider.createdHandles.first().closeCount.get())
            assertEquals(0, controller.diagnostics.value.proxyPort)
        } finally {
            scope.cancel()
        }
    }

    @Test
    fun testLiveProfileAndSelectedAppReconfiguration() = runBlocking {
        val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
        val tunProvider = FakeTunProvider()
        val tunnelEngine = FakeTunnelEngine()
        val confPath = File.createTempFile("hev-live-", ".yml").apply { deleteOnExit() }.absolutePath

        val controller = VpnSessionController(
            tunProvider = tunProvider,
            socketProtector = allowAllProtector,
            tunnelEngine = tunnelEngine,
            configFilePath = confPath,
            scope = scope,
            startupVerifyDelayMs = 0L,
            watchdogIntervalMs = 60_000L
        )

        try {
            assertTrue(controller.start(setOf("com.whatsapp"), GlitchConfig.MILD).isSuccess)
            assertEquals(GlitchProfileType.MILD, controller.activeProfile.value)

            // Live profile update does not bounce TUN/tunnel
            controller.updateConfig(GlitchConfig.SEVERE)
            assertEquals(GlitchProfileType.SEVERE, controller.activeProfile.value)
            assertEquals(1, tunProvider.createdHandles.size)
            assertEquals(1, tunnelEngine.startCalls)

            // Live app update rebuilds TUN and restarts Hev cleanly
            val appUpdateRes = controller.updateSelectedApps(setOf("com.whatsapp", "org.telegram.messenger"))
            assertTrue(appUpdateRes.isSuccess)
            assertEquals(VpnLifecycleState.RUNNING, controller.diagnostics.value.vpnState)
            assertEquals(2, tunProvider.createdHandles.size)
            assertEquals(1, tunProvider.createdHandles[0].closeCount.get())
            assertEquals(0, tunProvider.createdHandles[1].closeCount.get())

            // Emptying apps stops VPN cleanly
            assertTrue(controller.updateSelectedApps(emptySet()).isSuccess)
            assertEquals(VpnLifecycleState.STOPPED, controller.diagnostics.value.vpnState)
            assertEquals(1, tunProvider.createdHandles[1].closeCount.get())
        } finally {
            scope.cancel()
        }
    }
}
