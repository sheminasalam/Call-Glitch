package com.callglitch.app.vpn

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import androidx.core.app.NotificationCompat
import com.callglitch.app.CallGlitchApplication
import com.callglitch.app.R
import com.callglitch.app.model.DiagnosticsSnapshot
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.VpnLifecycleState
import com.callglitch.app.tile.GlitchTileService
import com.callglitch.app.ui.MainActivity
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import java.io.File
import java.io.IOException
import java.util.concurrent.atomic.AtomicBoolean

class CallGlitchVpnService : VpnService(), TunInterfaceProvider {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var networkCallback: ConnectivityManager.NetworkCallback? = null

    private lateinit var sessionController: VpnSessionController

    companion object {
        private const val TAG = "CallGlitchVpnService"
        const val ACTION_START = "com.callglitch.app.ACTION_START"
        const val ACTION_STOP = "com.callglitch.app.ACTION_STOP"
        const val ACTION_UPDATE_PROFILE = "com.callglitch.app.ACTION_UPDATE_PROFILE"
        const val ACTION_UPDATE_APPS = "com.callglitch.app.ACTION_UPDATE_APPS"
        const val EXTRA_PROFILE_TYPE = "extra_profile_type"
        private const val NOTIFICATION_ID = 9001

        private val _isRunning = MutableStateFlow(false)
        val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()

        private val _activeProfile = MutableStateFlow(GlitchProfileType.MODERATE)
        val activeProfile: StateFlow<GlitchProfileType> = _activeProfile.asStateFlow()

        private val _droppedPackets = MutableStateFlow(0L)
        val droppedPackets: StateFlow<Long> = _droppedPackets.asStateFlow()

        private val _forwardedPackets = MutableStateFlow(0L)
        val forwardedPackets: StateFlow<Long> = _forwardedPackets.asStateFlow()

        private val _diagnostics = MutableStateFlow(DiagnosticsSnapshot())
        val diagnostics: StateFlow<DiagnosticsSnapshot> = _diagnostics.asStateFlow()

        private val _lastErrorMessage = MutableStateFlow<String?>(null)
        val lastErrorMessage: StateFlow<String?> = _lastErrorMessage.asStateFlow()

        fun clearLastError() {
            _lastErrorMessage.value = null
        }

        fun startService(context: Context, profile: GlitchProfileType = GlitchProfileType.MODERATE) {
            val intent = Intent(context, CallGlitchVpnService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_PROFILE_TYPE, profile.name)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, CallGlitchVpnService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        val confPath = File(cacheDir, "hev-socks5-tunnel.yml").absolutePath
        sessionController = VpnSessionController(
            tunProvider = this,
            socketProtector = VpnServiceSocketProtector(this),
            tunnelEngine = HevTunnelEngine(),
            configFilePath = confPath,
            scope = serviceScope,
            onStateChanged = { snapshot ->
                onDiagnosticsUpdated(snapshot)
            }
        )
        registerNetworkCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                Log.i(TAG, "Stop command received. Priority STOP teardown initiated.")
                serviceScope.launch {
                    sessionController.stop()
                    finishServiceShutdown()
                }
                return START_NOT_STICKY
            }
            ACTION_UPDATE_PROFILE -> {
                val profileName = intent.getStringExtra(EXTRA_PROFILE_TYPE)
                if (profileName != null) {
                    try {
                        val profile = GlitchProfileType.valueOf(profileName)
                        _activeProfile.value = profile
                        serviceScope.launch {
                            val repo = (application as CallGlitchApplication).settingsRepository
                            val custom = repo.customConfigFlow.first()
                            val config = GlitchConfig.forType(profile, custom)
                            sessionController.updateConfig(config)
                            updateNotification(profile)
                            GlitchTileService.requestTileUpdate(this@CallGlitchVpnService)
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error updating profile: ${e.message}")
                    }
                }
                return START_STICKY
            }
            ACTION_UPDATE_APPS -> {
                serviceScope.launch {
                    try {
                        val repo = (application as CallGlitchApplication).settingsRepository
                        val selectedApps = repo.selectedPackagesFlow.first()
                        val result = sessionController.updateSelectedApps(selectedApps)
                        if (selectedApps.isEmpty() || result.isFailure) {
                            finishServiceShutdown()
                        } else {
                            Log.i(TAG, "Updated VPN allowed applications: $selectedApps")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error updating apps on active VPN: ${e.message}", e)
                        sessionController.stop()
                        finishServiceShutdown()
                    }
                }
                return START_STICKY
            }
            ACTION_START, null -> {
                val profileName = intent?.getStringExtra(EXTRA_PROFILE_TYPE)
                val profile = profileName?.let {
                    try { GlitchProfileType.valueOf(it) } catch (e: Exception) { GlitchProfileType.MODERATE }
                } ?: GlitchProfileType.MODERATE
                _activeProfile.value = profile

                startForegroundSafely(profile)
                serviceScope.launch {
                    val repo = (application as CallGlitchApplication).settingsRepository
                    val selectedApps = repo.selectedPackagesFlow.first()
                    val custom = repo.customConfigFlow.first()
                    val config = GlitchConfig.forType(profile, custom)
                    val timeoutSec = repo.autoTimeoutSecondsFlow.first()

                    val result = sessionController.start(selectedApps, config, timeoutSec)
                    if (result.isFailure) {
                        Log.e(TAG, "Failed to start Call Glitch VPN: ${result.exceptionOrNull()?.message}")
                        finishServiceShutdown()
                    } else {
                        _lastErrorMessage.value = null
                        updateNotification(profile)
                    }
                }
                return START_STICKY
            }
        }
        return START_NOT_STICKY
    }

    override fun establish(selectedApps: Set<String>, config: GlitchConfig): TunHandle {
        if (selectedApps.isEmpty()) {
            throw IllegalStateException("No target applications selected. Please select at least one application.")
        }

        var allowedCount = 0
        val builder = Builder().apply {
            setMtu(1500)
            addAddress("10.240.0.1", 24)
            addDnsServer("8.8.8.8")
            addDnsServer("1.1.1.1")
            addRoute("0.0.0.0", 0)
            setSession("CallGlitch: ${config.profileType.displayName}")
            // HevSocks5Tunnel uses non-blocking TUN I/O (ioctl FIONBIO).
            setBlocking(false)

            // Capture IPv6 default route and IPv6 DNS so dual-stack calling apps cannot bypass impairment.
            try {
                addAddress("fd00:ca11:911c::1", 64)
                addDnsServer("2001:4860:4860::8888")
                addRoute("::", 0)
            } catch (e: Exception) {
                Log.w(TAG, "IPv6 TUN route unavailable on this device, continuing with IPv4: ${e.message}")
            }

            // Route ONLY selected target applications (never Call Glitch itself).
            val pm = packageManager
            for (pkg in selectedApps) {
                if (pkg == packageName) continue
                try {
                    pm.getPackageInfo(pkg, 0)
                    addAllowedApplication(pkg)
                    allowedCount++
                } catch (_: PackageManager.NameNotFoundException) {
                    Log.w(TAG, "Selected app not installed on device, skipping: $pkg")
                }
            }
        }

        if (allowedCount == 0) {
            throw IllegalStateException(
                "None of the selected applications (${selectedApps.joinToString()}) are currently installed on this device."
            )
        }

        val pfd = builder.establish()
            ?: throw IOException("VpnService.Builder.establish() returned null. Please verify VPN permission is approved.")

        Log.i(TAG, "Established VpnService TUN (fd=${pfd.fd}, allowedApps=$allowedCount)")
        return ParcelTunHandle(pfd)
    }

    private fun onDiagnosticsUpdated(snapshot: DiagnosticsSnapshot) {
        _diagnostics.value = snapshot
        _forwardedPackets.value = snapshot.totalForwardedCount
        _droppedPackets.value = snapshot.droppedUdpDatagrams

        val nowRunning = snapshot.vpnState == VpnLifecycleState.RUNNING
        val wasRunning = _isRunning.value
        _isRunning.value = nowRunning

        if (snapshot.lastError != null) {
            val componentPrefix = snapshot.lastErrorComponent?.let { "[$it] " } ?: ""
            _lastErrorMessage.value = "$componentPrefix${snapshot.lastError}"
        }

        if (wasRunning != nowRunning) {
            GlitchTileService.requestTileUpdate(this)
            if (!nowRunning && (snapshot.vpnState == VpnLifecycleState.STOPPED || snapshot.vpnState == VpnLifecycleState.FAILED)) {
                finishServiceShutdown()
            }
        }
    }

    private fun startForegroundSafely(profile: GlitchProfileType) {
        val notification = buildNotification(profile)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, 0)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed: ${e.message}", e)
            runCatching { startForeground(NOTIFICATION_ID, notification) }
        }
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "Underlying physical network available: $network")
                serviceScope.launch {
                    sessionController.onUnderlyingNetworkChanged(hasValidatedNetwork = true)
                }
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "Underlying physical network lost: $network")
                serviceScope.launch {
                    sessionController.onUnderlyingNetworkChanged(hasValidatedNetwork = false)
                }
            }

            override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                if (networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)) {
                    serviceScope.launch {
                        sessionController.onUnderlyingNetworkChanged(hasValidatedNetwork = true)
                    }
                }
            }
        }
        runCatching { cm.registerNetworkCallback(request, networkCallback!!) }
    }

    private fun buildNotification(profile: GlitchProfileType): Notification {
        val openIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, CallGlitchVpnService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CallGlitchApplication.CHANNEL_ID_VPN)
            .setSmallIcon(R.drawable.ic_glitch_notification)
            .setContentTitle("Call Glitch Active: ${profile.displayName}")
            .setContentText("Routing selected apps via HevSocks5Tunnel + local impairment proxy.")
            .setSubText("Call Glitch")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(openIntent)
            .addAction(R.drawable.ic_stop, "STOP", stopIntent)
            .build()
    }

    private fun updateNotification(profile: GlitchProfileType) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(profile))
    }

    private fun finishServiceShutdown() {
        _isRunning.value = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        GlitchTileService.requestTileUpdate(this)
    }

    override fun onRevoke() {
        Log.w(TAG, "VpnService.onRevoke() triggered by system. Failsafe shutdown.")
        serviceScope.launch {
            sessionController.stop()
            finishServiceShutdown()
        }
        super.onRevoke()
    }

    override fun onDestroy() {
        super.onDestroy()
        runBlocking {
            withTimeoutOrNull(3_000L) {
                sessionController.stop()
            }
        }
        serviceScope.cancel()
        networkCallback?.let {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            runCatching { cm.unregisterNetworkCallback(it) }
        }
        GlitchTileService.requestTileUpdate(this)
    }

    private class ParcelTunHandle(
        private val pfd: ParcelFileDescriptor
    ) : TunHandle {
        private val closed = AtomicBoolean(false)
        override val fd: Int get() = pfd.fd

        override fun close() {
            if (closed.compareAndSet(false, true)) {
                pfd.close()
            }
        }
    }
}
