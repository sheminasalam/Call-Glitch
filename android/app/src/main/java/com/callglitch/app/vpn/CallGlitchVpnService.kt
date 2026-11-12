package com.callglitch.app.vpn

import android.app.Notification
import android.app.PendingIntent
import android.app.Service.STOP_FOREGROUND_REMOVE
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
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
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.tile.GlitchTileService
import com.callglitch.app.ui.MainActivity
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import java.io.IOException

class CallGlitchVpnService : VpnService() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var vpnInterface: ParcelFileDescriptor? = null
    private var forwardingEngine: PacketForwardingEngine? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private var timeoutJob: Job? = null
    private var watchdogJob: Job? = null

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
        registerNetworkCallback()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                Log.i(TAG, "Stop command received. Priority STOP teardown initiated.")
                stopVpn()
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
                            forwardingEngine?.updateConfig(config)
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
                if (_isRunning.value) {
                    serviceScope.launch {
                        try {
                            val repo = (application as CallGlitchApplication).settingsRepository
                            val selectedApps = repo.selectedPackagesFlow.first()
                            if (selectedApps.isEmpty()) {
                                Log.w(TAG, "All target applications deselected while active. Stopping VPN.")
                                stopVpn()
                                return@launch
                            }
                            val custom = repo.customConfigFlow.first()
                            val config = GlitchConfig.forType(_activeProfile.value, custom)
                            establishVpn(selectedApps, config)
                            Log.i(TAG, "Re-established VPN TUN with updated apps: $selectedApps")
                        } catch (e: Exception) {
                            Log.e(TAG, "Error updating apps on active VPN: ${e.message}", e)
                            stopVpn()
                        }
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

                startForeground(NOTIFICATION_ID, buildNotification(profile))
                startVpn(profile)
                return START_STICKY
            }
        }
        return START_NOT_STICKY
    }

    private fun startVpn(profile: GlitchProfileType) {
        serviceScope.launch {
            try {
                val repo = (application as CallGlitchApplication).settingsRepository
                val selectedApps = repo.selectedPackagesFlow.first()
                if (selectedApps.isEmpty()) {
                    Log.e(TAG, "Cannot start VPN: No target applications selected.")
                    stopVpn()
                    return@launch
                }
                val custom = repo.customConfigFlow.first()
                val config = GlitchConfig.forType(profile, custom)
                val timeoutSec = repo.autoTimeoutSecondsFlow.first()

                establishVpn(selectedApps, config)
                _isRunning.value = true
                GlitchTileService.requestTileUpdate(this@CallGlitchVpnService)

                // Schedule auto-timeout if configured
                if (timeoutSec > 0) {
                    timeoutJob?.cancel()
                    timeoutJob = serviceScope.launch {
                        delay(timeoutSec * 1000L)
                        Log.i(TAG, "Auto-timeout of $timeoutSec seconds reached. Restoring normal network.")
                        stopVpn()
                    }
                }

                // Start watchdog for stalled forwarding
                startWatchdog()

            } catch (e: Exception) {
                Log.e(TAG, "Failed to start VPN: ${e.message}", e)
                stopVpn()
            }
        }
    }

    private fun establishVpn(selectedApps: Set<String>, config: GlitchConfig) {
        if (selectedApps.isEmpty()) {
            throw IllegalStateException("No target applications selected. Please select at least one application.")
        }
        var allowedCount = 0
        val builder = Builder().apply {
            setMtu(1500)
            addAddress("10.240.0.1", 24)
            addAddress("fd00:call:glitch::1", 64)
            addDnsServer("8.8.8.8")
            addDnsServer("1.1.1.1")
            addDnsServer("2001:4860:4860::8888")
            addRoute("0.0.0.0", 0)
            addRoute("::", 0)
            setSession("CallGlitch: ${config.profileType.displayName}")
            setBlocking(true)

            // CRITICAL: Route ONLY selected applications via addAllowedApplication()
            val pm = packageManager
            for (pkg in selectedApps) {
                // Ensure we never route Call Glitch through its own VPN
                if (pkg == packageName) continue

                try {
                    pm.getPackageInfo(pkg, 0)
                    addAllowedApplication(pkg)
                    allowedCount++
                    Log.d(TAG, "Routing allowed application through CallGlitch TUN: $pkg")
                } catch (e: PackageManager.NameNotFoundException) {
                    Log.w(TAG, "Selected app not found on device, skipping: $pkg")
                }
            }
        }

        if (allowedCount == 0) {
            throw IllegalStateException("None of the selected applications are currently installed on this device.")
        }

        vpnInterface?.close()
        val pfd = builder.establish() ?: throw IOException("VpnService.Builder.establish() returned null")
        vpnInterface = pfd

        // Initialize user-space forwarding engine with impairment
        forwardingEngine = PacketForwardingEngine(
            vpnService = this,
            tunFd = pfd.fileDescriptor,
            config = config,
            onStatsUpdate = { forwarded, dropped ->
                _forwardedPackets.value = forwarded
                _droppedPackets.value = dropped
            }
        ).also { it.start() }

        Log.i(TAG, "VPN TUN interface established successfully. Allowed apps: $allowedCount")
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "Underlying network available: $network. Binding sockets.")
                setUnderlyingNetworks(arrayOf(network))
                forwardingEngine?.onUnderlyingNetworkChanged(network)
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "Underlying network lost: $network.")
            }

            override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                setUnderlyingNetworks(arrayOf(network))
            }
        }
        cm.registerNetworkCallback(request, networkCallback!!)
    }

    private fun startWatchdog() {
        watchdogJob?.cancel()
        watchdogJob = serviceScope.launch {
            while (isActive) {
                delay(5000L)
                val isAlive = forwardingEngine?.isHealthy() ?: false
                if (!isAlive && _isRunning.value) {
                    Log.e(TAG, "Watchdog detected stalled forwarding engine. Tearing down immediately to prevent blackholing.")
                    stopVpn()
                    break
                }
            }
        }
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
            .setContentText("Impairing call network. Normal network will restore on STOP.")
            .setSubText("Call Glitch")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(openIntent)
            .addAction(R.drawable.ic_stop, "STOP", stopIntent)
            .build()
    }

    private fun updateNotification(profile: GlitchProfileType) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(NOTIFICATION_ID, buildNotification(profile))
    }

    private fun stopVpn() {
        _isRunning.value = false
        timeoutJob?.cancel()
        watchdogJob?.cancel()

        try {
            // STOP priority: Immediately shutdown forwarding engine without waiting for queued packets
            forwardingEngine?.stop()
            forwardingEngine = null

            vpnInterface?.close()
            vpnInterface = null
        } catch (e: Exception) {
            Log.e(TAG, "Error closing VPN interface: ${e.message}")
        } finally {
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
            GlitchTileService.requestTileUpdate(this)
            Log.i(TAG, "Call Glitch VPN stopped. Ordinary networking completely restored.")
        }
    }

    override fun onRevoke() {
        Log.w(TAG, "VpnService.onRevoke() triggered by system. Failsafe shutdown.")
        stopVpn()
        super.onRevoke()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVpn()
        serviceScope.cancel()
        networkCallback?.let {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            cm.unregisterNetworkCallback(it)
        }
    }
}
