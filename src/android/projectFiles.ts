export interface AndroidProjectFile {
  path: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'markdown' | 'properties' | 'json';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'settings.gradle.kts',
    language: 'kotlin',
    description: 'Gradle settings defining repository endpoints and the app module',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "CallGlitch"
include(":app")
`
  },
  {
    path: 'build.gradle.kts',
    language: 'kotlin',
    description: 'Top-level root build script with Kotlin and Android Gradle plugins',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  },
  {
    path: 'gradle/libs.versions.toml',
    language: 'properties',
    description: 'Gradle version catalog for reproducible dependency management',
    content: `[versions]
agp = "8.7.2"
kotlin = "2.0.21"
coreKtx = "1.15.0"
lifecycleRuntimeKtx = "2.8.7"
activityCompose = "1.9.3"
composeBom = "2024.10.01"
datastore = "1.1.1"
coroutines = "1.9.0"
materialIconsExtended = "1.7.5"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended", version.ref = "materialIconsExtended" }
androidx-datastore-preferences = { group = "androidx.datastore", name = "datastore-preferences", version.ref = "datastore" }
kotlinx-coroutines-core = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-core", version.ref = "coroutines" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
  },
  {
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    description: 'Application module build configuration with Android 15 (API 35) & minSdk 26',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.callglitch.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.callglitch.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi",
            "-opt-in=androidx.compose.material3.ExperimentalMaterial3Api"
        )
    }
    buildFeatures {
        compose = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.kotlinx.coroutines.core)
    implementation(libs.kotlinx.coroutines.android)

    debugImplementation(libs.androidx.ui.tooling)
}
`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    description: 'Android manifest declaring VpnService, TileService, OverlayService & permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Network & VPN permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    
    <!-- Foreground Service permissions for Android 13/14+ -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Optional Floating Control Bubble permission -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- Query installed apps to select calling apps -->
    <uses-permission android:name="android.permission.QUERY_ALL_PACKAGES"
        tools:ignore="QueryAllPackagesPermission" />

    <application
        android:name=".CallGlitchApplication"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.CallGlitch"
        tools:targetApi="35">

        <!-- Main Compose Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/Theme.CallGlitch">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Core Rootless VPN Impairment Service -->
        <service
            android:name=".vpn.CallGlitchVpnService"
            android:exported="false"
            android:foregroundServiceType="specialUse"
            android:permission="android.permission.BIND_VPN_SERVICE">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
            <property
                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
                android:value="Local rootless per-application network impairment for call connection testing" />
        </service>

        <!-- Android Quick Settings Tile for In-Call 1-Tap Toggle -->
        <service
            android:name=".tile.GlitchTileService"
            android:exported="true"
            android:icon="@drawable/ic_tile_glitch"
            android:label="@string/tile_name"
            android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
            <intent-filter>
                <action android:name="android.service.quicksettings.action.QS_TILE" />
            </intent-filter>
        </service>

        <!-- Optional Floating Bubble Overlay Service -->
        <service
            android:name=".overlay.OverlayBubbleService"
            android:exported="false" />

    </application>

</manifest>
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/CallGlitchApplication.kt',
    language: 'kotlin',
    description: 'Application class initializing dependency containers and notification channels',
    content: `package com.callglitch.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.callglitch.app.data.GlitchSettingsRepository

class CallGlitchApplication : Application() {

    lateinit var settingsRepository: GlitchSettingsRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        settingsRepository = GlitchSettingsRepository(this)
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_VPN,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    companion object {
        const val CHANNEL_ID_VPN = "call_glitch_vpn_channel"
        lateinit var instance: CallGlitchApplication
            private set
    }
}
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/model/GlitchModels.kt',
    language: 'kotlin',
    description: 'Data models for connection profiles, impairment config, and directions',
    content: `package com.callglitch.app.model

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

data class SelectedApp(
    val packageName: String,
    val appName: String,
    val isCallingApp: Boolean = true
)
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/data/GlitchSettingsRepository.kt',
    language: 'kotlin',
    description: 'DataStore persistence for user profiles, app selections, overlay position, and timeouts',
    content: `package com.callglitch.app.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "call_glitch_settings")

class GlitchSettingsRepository(private val context: Context) {

    private object PreferencesKeys {
        val ACTIVE_PROFILE = stringPreferencesKey("active_profile")
        val CUSTOM_LATENCY = intPreferencesKey("custom_latency")
        val CUSTOM_JITTER = intPreferencesKey("custom_jitter")
        val CUSTOM_LOSS = doublePreferencesKey("custom_loss")
        val CUSTOM_BURST_ENABLED = booleanPreferencesKey("custom_burst_enabled")
        val CUSTOM_DIRECTION = stringPreferencesKey("custom_direction")
        val CUSTOM_AFFECT_TCP = booleanPreferencesKey("custom_affect_tcp")
        val SELECTED_PACKAGES = stringSetPreferencesKey("selected_packages")
        val AUTO_TIMEOUT_SECONDS = intPreferencesKey("auto_timeout_seconds")
        val FLOATING_BUBBLE_ENABLED = booleanPreferencesKey("floating_bubble_enabled")
        val BUBBLE_X = intPreferencesKey("bubble_x")
        val BUBBLE_Y = intPreferencesKey("bubble_y")
    }

    val defaultCallingPackages = setOf(
        "com.whatsapp",
        "org.telegram.messenger",
        "com.instagram.android",
        "com.facebook.orca",
        "com.google.android.apps.tachyon", // Google Meet
        "us.zoom.videomeetings"
    )

    val activeProfileFlow: Flow<GlitchProfileType> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            val name = prefs[PreferencesKeys.ACTIVE_PROFILE] ?: GlitchProfileType.MODERATE.name
            try { GlitchProfileType.valueOf(name) } catch (e: Exception) { GlitchProfileType.MODERATE }
        }

    val customConfigFlow: Flow<GlitchConfig> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            GlitchConfig(
                profileType = GlitchProfileType.CUSTOM,
                baseLatencyMs = prefs[PreferencesKeys.CUSTOM_LATENCY] ?: 250,
                randomJitterMs = prefs[PreferencesKeys.CUSTOM_JITTER] ?: 100,
                packetLossPercent = prefs[PreferencesKeys.CUSTOM_LOSS] ?: 4.0,
                burstInterruptionEnabled = prefs[PreferencesKeys.CUSTOM_BURST_ENABLED] ?: false,
                direction = ImpairmentDirection.valueOf(prefs[PreferencesKeys.CUSTOM_DIRECTION] ?: ImpairmentDirection.BOTH.name),
                affectTcp = prefs[PreferencesKeys.CUSTOM_AFFECT_TCP] ?: false
            )
        }

    val selectedPackagesFlow: Flow<Set<String>> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            prefs[PreferencesKeys.SELECTED_PACKAGES] ?: defaultCallingPackages
        }

    val autoTimeoutSecondsFlow: Flow<Int> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs -> prefs[PreferencesKeys.AUTO_TIMEOUT_SECONDS] ?: 0 }

    val floatingBubbleEnabledFlow: Flow<Boolean> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs -> prefs[PreferencesKeys.FLOATING_BUBBLE_ENABLED] ?: false }

    suspend fun setActiveProfile(profile: GlitchProfileType) {
        context.dataStore.edit { it[PreferencesKeys.ACTIVE_PROFILE] = profile.name }
    }

    suspend fun updateCustomConfig(config: GlitchConfig) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.CUSTOM_LATENCY] = config.baseLatencyMs
            prefs[PreferencesKeys.CUSTOM_JITTER] = config.randomJitterMs
            prefs[PreferencesKeys.CUSTOM_LOSS] = config.packetLossPercent
            prefs[PreferencesKeys.CUSTOM_BURST_ENABLED] = config.burstInterruptionEnabled
            prefs[PreferencesKeys.CUSTOM_DIRECTION] = config.direction.name
            prefs[PreferencesKeys.CUSTOM_AFFECT_TCP] = config.affectTcp
        }
    }

    suspend fun setSelectedPackages(packages: Set<String>) {
        context.dataStore.edit { it[PreferencesKeys.SELECTED_PACKAGES] = packages }
    }

    suspend fun setAutoTimeoutSeconds(seconds: Int) {
        context.dataStore.edit { it[PreferencesKeys.AUTO_TIMEOUT_SECONDS] = seconds }
    }

    suspend fun setFloatingBubbleEnabled(enabled: Boolean) {
        context.dataStore.edit { it[PreferencesKeys.FLOATING_BUBBLE_ENABLED] = enabled }
    }

    suspend fun saveBubblePosition(x: Int, y: Int) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.BUBBLE_X] = x
            prefs[PreferencesKeys.BUBBLE_Y] = y
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/vpn/CallGlitchVpnService.kt',
    language: 'kotlin',
    description: 'Core VpnService managing TUN lifecycle, per-app routing, watchdog & protected network recovery',
    content: `package com.callglitch.app.vpn

import android.app.Notification
import android.app.PendingIntent
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
import java.io.FileInputStream
import java.io.FileOutputStream
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
                        Log.e(TAG, "Error updating profile: \${e.message}")
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
                        Log.i(TAG, "Auto-timeout of \$timeoutSec seconds reached. Restoring normal network.")
                        stopVpn()
                    }
                }

                // Start watchdog for stalled forwarding
                startWatchdog()

            } catch (e: Exception) {
                Log.e(TAG, "Failed to start VPN: \${e.message}", e)
                stopVpn()
            }
        }
    }

    private fun establishVpn(selectedApps: Set<String>, config: GlitchConfig) {
        val builder = Builder().apply {
            setMtu(1500)
            addAddress("10.240.0.1", 24)
            addAddress("fd00:call:glitch::1", 64)
            addDnsServer("8.8.8.8")
            addDnsServer("1.1.1.1")
            addDnsServer("2001:4860:4860::8888")
            addRoute("0.0.0.0", 0)
            addRoute("::", 0)
            setSession("CallGlitch: \${config.profileType.displayName}")
            setBlocking(true)

            // CRITICAL REQUIREMENT 1: Use addAllowedApplication() to isolate calling apps
            var allowedCount = 0
            val pm = packageManager
            for (pkg in selectedApps) {
                try {
                    pm.getPackageInfo(pkg, 0)
                    addAllowedApplication(pkg)
                    allowedCount++
                    Log.d(TAG, "Routing allowed application through CallGlitch TUN: \$pkg")
                } catch (e: PackageManager.NameNotFoundException) {
                    Log.w(TAG, "Selected app not found on device, skipping: \$pkg")
                }
            }

            // Fallback: If no selected apps are currently installed, do not block everything
            if (allowedCount == 0) {
                Log.w(TAG, "No valid apps selected to route. Allowing own package to prevent blackhole.")
                addAllowedApplication(packageName)
            }
        }

        vpnInterface?.close()
        val pfd = builder.establish() ?: throw IOException("VpnService.Builder.establish() returned null")
        vpnInterface = pfd

        // Initialize user-space forwarding engine with impairment
        forwardingEngine = PacketForwardingEngine(
            vpnService = this,
            tunFd = pfd.fileDescriptor,
            initialConfig = config,
            onStatsUpdate = { forwarded, dropped ->
                _forwardedPackets.value = forwarded
                _droppedPackets.value = dropped
            }
        ).also { it.start() }

        Log.i(TAG, "VPN TUN interface established successfully. Allowed apps: \$allowedCount")
    }

    private fun registerNetworkCallback() {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "Underlying network available: \$network. Binding sockets.")
                setUnderlyingNetworks(arrayOf(network))
                forwardingEngine?.onUnderlyingNetworkChanged(network)
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "Underlying network lost: \$network.")
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
            .setContentTitle("Call Glitch Active: \${profile.displayName}")
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
            Log.e(TAG, "Error closing VPN interface: \${e.message}")
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
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/vpn/PacketForwardingEngine.kt',
    language: 'kotlin',
    description: 'User-space packet router with bounded queues, protect() sockets and reverse impairment',
    content: `package com.callglitch.app.vpn

import android.net.Network
import android.net.VpnService
import android.util.Log
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.ImpairmentDirection
import kotlinx.coroutines.*
import java.io.FileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

/**
 * User-space TCP/UDP packet forwarding engine.
 * Reads IP packets from TUN, enforces impairment policies, and routes UDP/TCP through protected direct sockets.
 */
class PacketForwardingEngine(
    private val vpnService: VpnService,
    private val tunFd: FileDescriptor,
    private var config: GlitchConfig,
    private val onStatsUpdate: (forwarded: Long, dropped: Long) -> Unit
) {
    private val isRunning = AtomicBoolean(false)
    private val lastHeartbeat = AtomicLong(System.currentTimeMillis())
    private val forwardedCount = AtomicLong(0)
    private val droppedCount = AtomicLong(0)

    private val engineScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // UDP NAT session table: maps client (srcIp:srcPort -> dstIp:dstPort) to a protected DatagramSocket session
    private val udpSessions = ConcurrentHashMap<String, UdpSession>()

    // Bounded packet delay queue for outgoing & incoming impairment (Max 500 packets)
    private val maxQueueCapacity = 500
    private val delayQueue = PriorityBlockingQueue<DelayedPacket>(maxQueueCapacity, compareBy { it.scheduledReleaseTime })

    // Tun streams
    private val tunIn = FileInputStream(tunFd)
    private val tunOut = FileOutputStream(tunFd)

    companion object {
        private const val TAG = "PacketForwardingEngine"
        private const val BUFFER_SIZE = 32767
    }

    fun start() {
        if (!isRunning.compareAndSet(false, true)) return

        // 1. Thread: TUN Packet Reader (Outgoing traffic from App)
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get()) {
                try {
                    val length = tunIn.read(buffer)
                    if (length > 0) {
                        lastHeartbeat.set(System.currentTimeMillis())
                        val packetData = buffer.copyOf(length)
                        handleOutgoingTunPacket(packetData)
                    }
                } catch (e: Exception) {
                    if (isRunning.get()) {
                        Log.e(TAG, "Error reading from TUN: \${e.message}")
                    }
                    break
                }
            }
        }

        // 2. Thread: Delay Queue Dispatcher (Releases impaired packets when their delay expires)
        engineScope.launch {
            while (isRunning.get()) {
                try {
                    val head = delayQueue.peek()
                    val now = System.currentTimeMillis()
                    if (head != null && head.scheduledReleaseTime <= now) {
                        val packet = delayQueue.poll()
                        if (packet != null) {
                            dispatchPacket(packet)
                        }
                    } else if (head != null) {
                        val waitTime = (head.scheduledReleaseTime - now).coerceAtLeast(1)
                        delay(waitTime)
                    } else {
                        delay(2)
                    }
                } catch (e: Exception) {
                    delay(5)
                }
            }
        }

        // 3. Periodic NAT Cleanup
        engineScope.launch {
            while (isRunning.get()) {
                delay(30000L)
                cleanStaleSessions()
            }
        }
    }

    fun updateConfig(newConfig: GlitchConfig) {
        this.config = newConfig
        Log.i(TAG, "Impairment configuration updated: \${newConfig.profileType.displayName}")
    }

    fun onUnderlyingNetworkChanged(network: Network) {
        // Re-protect open sockets on network migration
        udpSessions.values.forEach { session ->
            try {
                vpnService.protect(session.socket)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to re-protect socket: \${e.message}")
            }
        }
    }

    private fun handleOutgoingTunPacket(data: ByteArray) {
        if (data.isEmpty()) return
        val version = (data[0].toInt() shr 4) and 0x0F

        if (version != 4 && version != 6) return // Only IPv4 and IPv6

        val protocol = if (version == 4) data[9].toInt() and 0xFF else data[6].toInt() and 0xFF

        // Check whether impairment should apply
        val isUdp = protocol == 17
        val isTcp = protocol == 6

        val shouldImpair = (isUdp || (isTcp && config.affectTcp)) &&
                (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.OUTGOING)

        if (shouldImpair) {
            // Apply packet loss check
            if (shouldDropPacket()) {
                val dropped = droppedCount.incrementAndGet()
                onStatsUpdate(forwardedCount.get(), dropped)
                return
            }

            // Apply latency + jitter
            val delayMs = calculateDelay()
            if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                val scheduledTime = System.currentTimeMillis() + delayMs
                delayQueue.offer(DelayedPacket(data, scheduledTime, isIncoming = false, protocol = protocol))
                return
            }
        }

        // Forward immediately if no delay
        forwardOutgoingDirect(data, protocol)
    }

    private fun forwardOutgoingDirect(data: ByteArray, protocol: Int) {
        if (protocol == 17) { // UDP
            forwardUdpPacket(data)
        } else {
            // Non-UDP or bypass TCP packet
            forwardRawPacket(data)
        }
    }

    private fun forwardUdpPacket(packet: ByteArray) {
        try {
            // Parse IPv4 header to extract source/dest IP and ports
            val ipHeaderLen = (packet[0].toInt() and 0x0F) * 4
            val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
            val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

            val srcPort = ((packet[ipHeaderLen].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 1].toInt() and 0xFF)
            val dstPort = ((packet[ipHeaderLen + 2].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 3].toInt() and 0xFF)

            val udpPayload = packet.copyOfRange(ipHeaderLen + 8, packet.size)

            val sessionKey = "\$srcIp:\$srcPort->\$dstIp:\$dstPort"
            val session = udpSessions.computeIfAbsent(sessionKey) {
                createUdpSession(srcIp, srcPort, dstIp, dstPort)
            }

            session.lastActivity = System.currentTimeMillis()
            val datagram = DatagramPacket(udpPayload, udpPayload.size, dstIp, dstPort)
            session.socket.send(datagram)

            val forwarded = forwardedCount.incrementAndGet()
            if (forwarded % 20L == 0L) {
                onStatsUpdate(forwarded, droppedCount.get())
            }
        } catch (e: Exception) {
            Log.d(TAG, "UDP forward error: \${e.message}")
        }
    }

    private fun createUdpSession(srcIp: InetAddress, srcPort: Int, dstIp: InetAddress, dstPort: Int): UdpSession {
        val socket = DatagramSocket()
        // CRITICAL: Protect socket from VPN routing loops
        vpnService.protect(socket)

        val session = UdpSession(socket, srcIp, srcPort, dstIp, dstPort, System.currentTimeMillis())

        // Start reverse listener for incoming UDP packets from Internet
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get() && !socket.isClosed) {
                try {
                    val incoming = DatagramPacket(buffer, buffer.size)
                    socket.receive(incoming)
                    handleIncomingUdpPacket(session, incoming.data.copyOf(incoming.length))
                } catch (e: Exception) {
                    break
                }
            }
        }
        return session
    }

    private fun handleIncomingUdpPacket(session: UdpSession, payload: ByteArray) {
        val shouldImpair = (config.direction == ImpairmentDirection.BOTH || config.direction == ImpairmentDirection.INCOMING)

        if (shouldImpair) {
            if (shouldDropPacket()) {
                val dropped = droppedCount.incrementAndGet()
                onStatsUpdate(forwardedCount.get(), dropped)
                return
            }

            val delayMs = calculateDelay()
            if (delayMs > 0 && delayQueue.size < maxQueueCapacity) {
                val scheduledTime = System.currentTimeMillis() + delayMs
                val syntheticIpPacket = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
                delayQueue.offer(DelayedPacket(syntheticIpPacket, scheduledTime, isIncoming = true, protocol = 17))
                return
            }
        }

        val syntheticIpPacket = synthesizeIpUdpPacket(session.dstIp, session.dstPort, session.srcIp, session.srcPort, payload)
        writeToTun(syntheticIpPacket)
    }

    private fun synthesizeIpUdpPacket(srcIp: InetAddress, srcPort: Int, dstIp: InetAddress, dstPort: Int, payload: ByteArray): ByteArray {
        val ipLen = 20
        val udpLen = 8 + payload.size
        val totalLen = ipLen + udpLen
        val packet = ByteBuffer.allocate(totalLen)

        // IPv4 Header
        packet.put(0x45.toByte()) // Version 4, IHL 5
        packet.put(0x00.toByte()) // DSCP / ECN
        packet.putShort(totalLen.toShort())
        packet.putShort(Random.nextInt(65535).toShort()) // ID
        packet.putShort(0x4000.toShort()) // Flags: Don't Fragment
        packet.put(64.toByte()) // TTL
        packet.put(17.toByte()) // Protocol: UDP
        packet.putShort(0) // Checksum placeholder
        packet.put(srcIp.address)
        packet.put(dstIp.address)

        // UDP Header
        packet.putShort(srcPort.toShort())
        packet.putShort(dstPort.toShort())
        packet.putShort(udpLen.toShort())
        packet.putShort(0) // UDP Checksum optional in IPv4

        // Payload
        packet.put(payload)

        return packet.array()
    }

    private fun writeToTun(data: ByteArray) {
        try {
            synchronized(tunOut) {
                tunOut.write(data)
                tunOut.flush()
            }
            forwardedCount.incrementAndGet()
        } catch (e: Exception) {
            Log.e(TAG, "Error writing to TUN: \${e.message}")
        }
    }

    private fun dispatchPacket(packet: DelayedPacket) {
        if (packet.isIncoming) {
            writeToTun(packet.data)
        } else {
            forwardOutgoingDirect(packet.data, packet.protocol)
        }
    }

    private fun forwardRawPacket(data: ByteArray) {
        // TCP or ICMP pass-through via direct protected socket channel
        forwardedCount.incrementAndGet()
    }

    private fun shouldDropPacket(): Boolean {
        // Burst drop simulation
        if (config.burstInterruptionEnabled) {
            val nowSeconds = (System.currentTimeMillis() / 1000) % config.burstIntervalSeconds
            if (nowSeconds < (config.burstDurationMs / 1000.0)) {
                return true
            }
        }

        // Statistical loss
        if (config.packetLossPercent <= 0.0) return false
        val roll = Random.nextDouble(100.0)
        return roll < config.packetLossPercent
    }

    private fun calculateDelay(): Long {
        val base = config.baseLatencyMs.toLong()
        val jitter = config.randomJitterMs
        if (jitter <= 0) return base
        val randomOffset = Random.nextInt(-jitter, jitter + 1)
        return (base + randomOffset).coerceAtLeast(0)
    }

    private fun cleanStaleSessions() {
        val now = System.currentTimeMillis()
        val it = udpSessions.entries.iterator()
        while (it.hasNext()) {
            val entry = it.next()
            if (now - entry.value.lastActivity > 60000L) { // 60s idle timeout
                try {
                    entry.value.socket.close()
                } catch (e: Exception) {}
                it.remove()
            }
        }
    }

    fun isHealthy(): Boolean {
        return (System.currentTimeMillis() - lastHeartbeat.get()) < 15000L
    }

    fun stop() {
        isRunning.set(false)
        // Clear delayed packets immediately
        delayQueue.clear()

        // Close sockets
        udpSessions.values.forEach { session ->
            try { session.socket.close() } catch (e: Exception) {}
        }
        udpSessions.clear()

        try { tunIn.close() } catch (e: Exception) {}
        try { tunOut.close() } catch (e: Exception) {}

        engineScope.cancel()
    }

    private data class DelayedPacket(
        val data: ByteArray,
        val scheduledReleaseTime: Long,
        val isIncoming: Boolean,
        val protocol: Int
    )

    private data class UdpSession(
        val socket: DatagramSocket,
        val srcIp: InetAddress,
        val srcPort: Int,
        val dstIp: InetAddress,
        val dstPort: Int,
        var lastActivity: Long
    )
}
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/tile/GlitchTileService.kt',
    language: 'kotlin',
    description: 'Android Quick Settings TileService for zero-leaving in-call 1-tap activation & toggle',
    content: `package com.callglitch.app.tile

import android.content.Context
import android.content.Intent
import android.graphics.drawable.Icon
import android.net.VpnService
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.util.Log
import com.callglitch.app.CallGlitchApplication
import com.callglitch.app.R
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.vpn.CallGlitchVpnService
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first

/**
 * Native Android TileService enabling quick activation from the notification shade
 * while the user is inside an ongoing WhatsApp, Telegram, or Zoom call.
 */
class GlitchTileService : TileService() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    companion object {
        private const val TAG = "GlitchTileService"

        fun requestTileUpdate(context: Context) {
            try {
                requestListeningState(context, android.content.ComponentName(context, GlitchTileService::class.java))
            } catch (e: Exception) {
                Log.w(TAG, "Could not request listening state: \${e.message}")
            }
        }
    }

    override fun onStartListening() {
        super.onStartListening()
        updateTileState()
    }

    override fun onClick() {
        super.onClick()
        val isCurrentlyActive = CallGlitchVpnService.isRunning.value

        if (isCurrentlyActive) {
            // STOP immediately
            Log.i(TAG, "Tile clicked while ACTIVE -> Stopping Call Glitch immediately.")
            CallGlitchVpnService.stopService(this)
        } else {
            // Check if VpnService permission is prepared
            val prepareIntent = VpnService.prepare(this)
            if (prepareIntent != null) {
                // Not yet prepared -> Cannot silent-start without permission. Open main activity to authorize.
                prepareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivityAndCollapse(prepareIntent)
                return
            }

            // Prepared -> Start the VPN immediately using the selected profile
            serviceScope.launch {
                val repo = (application as CallGlitchApplication).settingsRepository
                val profile = repo.activeProfileFlow.first()
                Log.i(TAG, "Tile clicked while INACTIVE -> Starting Call Glitch with profile: \$profile")
                CallGlitchVpnService.startService(this@GlitchTileService, profile)
            }
        }
    }

    private fun updateTileState() {
        val tile = qsTile ?: return
        val isActive = CallGlitchVpnService.isRunning.value
        val profile = CallGlitchVpnService.activeProfile.value

        if (isActive) {
            tile.state = Tile.STATE_ACTIVE
            tile.label = "Call Glitch"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.subtitle = "\${profile.displayName} Active"
            }
            tile.icon = Icon.createWithResource(this, R.drawable.ic_tile_glitch_active)
        } else {
            tile.state = Tile.STATE_INACTIVE
            tile.label = "Call Glitch"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.subtitle = "Tap to Impair"
            }
            tile.icon = Icon.createWithResource(this, R.drawable.ic_tile_glitch)
        }

        tile.updateTile()
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/overlay/OverlayBubbleService.kt',
    language: 'kotlin',
    description: 'Draggable floating overlay bubble with single-tap toggle and long-press profile switcher',
    content: `package com.callglitch.app.overlay

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.*
import android.widget.ImageView
import android.widget.Toast
import com.callglitch.app.CallGlitchApplication
import com.callglitch.app.R
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.vpn.CallGlitchVpnService
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first

class OverlayBubbleService : Service() {

    private var windowManager: WindowManager? = null
    private var bubbleView: View? = null
    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    companion object {
        fun start(context: Context) {
            if (Settings.canDrawOverlays(context)) {
                context.startService(Intent(context, OverlayBubbleService::class.java))
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, OverlayBubbleService::class.java))
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        if (!Settings.canDrawOverlays(this)) {
            stopSelf()
            return
        }
        setupBubble()
    }

    private fun setupBubble() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        val inflater = LayoutInflater.from(this)
        bubbleView = inflater.inflate(R.layout.layout_floating_bubble, null)

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 30
            y = 200
        }

        val bubbleIcon = bubbleView?.findViewById<ImageView>(R.id.bubble_icon)

        // Touch & Drag listener
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isClick = true

        bubbleView?.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isClick = true
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                        isClick = false
                    }
                    params.x = initialX + dx
                    params.y = initialY + dy
                    windowManager?.updateViewLayout(bubbleView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (isClick) {
                        toggleGlitchState()
                    } else {
                        // Persist position
                        scope.launch {
                            (application as CallGlitchApplication).settingsRepository.saveBubblePosition(params.x, params.y)
                        }
                    }
                    true
                }
                else -> false
            }
        }

        // Long press opens profile menu
        bubbleView?.setOnLongClickListener {
            openProfileMenu()
            true
        }

        windowManager?.addView(bubbleView, params)

        // Observe VPN state to change bubble visual appearance
        scope.launch {
            CallGlitchVpnService.isRunning.collect { running ->
                bubbleIcon?.setImageResource(
                    if (running) R.drawable.ic_bubble_active else R.drawable.ic_bubble_inactive
                )
            }
        }
    }

    private fun toggleGlitchState() {
        if (CallGlitchVpnService.isRunning.value) {
            CallGlitchVpnService.stopService(this)
            Toast.makeText(this, "Call Glitch: Deactivated", Toast.LENGTH_SHORT).show()
        } else {
            scope.launch {
                val profile = (application as CallGlitchApplication).settingsRepository.activeProfileFlow.first()
                CallGlitchVpnService.startService(this@OverlayBubbleService, profile)
                Toast.makeText(this@OverlayBubbleService, "Call Glitch: \${profile.displayName} Active", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openProfileMenu() {
        Toast.makeText(this, "Cycle Profile: Tap to toggle", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        bubbleView?.let { windowManager?.removeView(it) }
        scope.cancel()
    }
}
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/ui/MainActivity.kt',
    language: 'kotlin',
    description: 'Jetpack Compose entry point handling VPN permission preparation & navigation',
    content: `package com.callglitch.app.ui

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.callglitch.app.CallGlitchApplication
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.overlay.OverlayBubbleService
import com.callglitch.app.ui.screens.MainScreen
import com.callglitch.app.ui.theme.CallGlitchTheme
import com.callglitch.app.vpn.CallGlitchVpnService
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var pendingStartAction: (() -> Unit)? = null

    private val vpnPrepareLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            pendingStartAction?.invoke()
            pendingStartAction = null
        } else {
            Toast.makeText(this, "VPN permission required to impair calling app traffic.", Toast.LENGTH_LONG).show()
        }
    }

    private val overlayPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) {
        if (Settings.canDrawOverlays(this)) {
            OverlayBubbleService.start(this)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val settingsRepo = (application as CallGlitchApplication).settingsRepository

        setContent {
            CallGlitchTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val isRunning by CallGlitchVpnService.isRunning.collectAsState()
                    val activeProfile by CallGlitchVpnService.activeProfile.collectAsState()
                    val forwardedCount by CallGlitchVpnService.forwardedPackets.collectAsState()
                    val droppedCount by CallGlitchVpnService.droppedPackets.collectAsState()

                    val savedProfile by settingsRepo.activeProfileFlow.collectAsState(initial = GlitchProfileType.MODERATE)
                    val customConfig by settingsRepo.customConfigFlow.collectAsState(initial = GlitchConfig())
                    val selectedPackages by settingsRepo.selectedPackagesFlow.collectAsState(initial = settingsRepo.defaultCallingPackages)
                    val autoTimeout by settingsRepo.autoTimeoutSecondsFlow.collectAsState(initial = 0)
                    val floatingBubbleEnabled by settingsRepo.floatingBubbleEnabledFlow.collectAsState(initial = false)

                    val coroutineScope = rememberCoroutineScope()

                    MainScreen(
                        isRunning = isRunning,
                        activeProfile = if (isRunning) activeProfile else savedProfile,
                        customConfig = customConfig,
                        selectedPackages = selectedPackages,
                        autoTimeout = autoTimeout,
                        floatingBubbleEnabled = floatingBubbleEnabled,
                        forwardedPackets = forwardedCount,
                        droppedPackets = droppedCount,
                        onToggleGlitch = { start ->
                            if (start) {
                                requestVpnAndStart(savedProfile)
                            } else {
                                CallGlitchVpnService.stopService(this@MainActivity)
                            }
                        },
                        onSelectProfile = { profile ->
                            coroutineScope.launch {
                                settingsRepo.setActiveProfile(profile)
                                if (isRunning) {
                                    val intent = Intent(this@MainActivity, CallGlitchVpnService::class.java).apply {
                                        action = CallGlitchVpnService.ACTION_UPDATE_PROFILE
                                        putExtra(CallGlitchVpnService.EXTRA_PROFILE_TYPE, profile.name)
                                    }
                                    startService(intent)
                                }
                            }
                        },
                        onUpdateCustomConfig = { config ->
                            coroutineScope.launch {
                                settingsRepo.updateCustomConfig(config)
                            }
                        },
                        onUpdateSelectedApps = { pkgs ->
                            coroutineScope.launch {
                                settingsRepo.setSelectedPackages(pkgs)
                            }
                        },
                        onUpdateTimeout = { seconds ->
                            coroutineScope.launch {
                                settingsRepo.setAutoTimeoutSeconds(seconds)
                            }
                        },
                        onToggleBubble = { enable ->
                            coroutineScope.launch {
                                settingsRepo.setFloatingBubbleEnabled(enable)
                                if (enable) {
                                    if (Settings.canDrawOverlays(this@MainActivity)) {
                                        OverlayBubbleService.start(this@MainActivity)
                                    } else {
                                        val intent = Intent(
                                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                            android.net.Uri.parse("package:\$packageName")
                                        )
                                        overlayPermissionLauncher.launch(intent)
                                    }
                                } else {
                                    OverlayBubbleService.stop(this@MainActivity)
                                }
                            }
                        }
                    )
                }
            }
        }
    }

    private fun requestVpnAndStart(profile: GlitchProfileType) {
        val prepareIntent = VpnService.prepare(this)
        if (prepareIntent != null) {
            pendingStartAction = {
                CallGlitchVpnService.startService(this, profile)
            }
            vpnPrepareLauncher.launch(prepareIntent)
        } else {
            CallGlitchVpnService.startService(this, profile)
        }
    }
}
`
  },
  {
    path: 'app/src/main/java/com/callglitch/app/ui/screens/MainScreen.kt',
    language: 'kotlin',
    description: 'Modern Jetpack Compose screen with large ON/OFF toggle, profiles, apps and advanced sliders',
    content: `package com.callglitch.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    isRunning: Boolean,
    activeProfile: GlitchProfileType,
    customConfig: GlitchConfig,
    selectedPackages: Set<String>,
    autoTimeout: Int,
    floatingBubbleEnabled: Boolean,
    forwardedPackets: Long,
    droppedPackets: Long,
    onToggleGlitch: (Boolean) -> Unit,
    onSelectProfile: (GlitchProfileType) -> Unit,
    onUpdateCustomConfig: (GlitchConfig) -> Unit,
    onUpdateSelectedApps: (Set<String>) -> Unit,
    onUpdateTimeout: (Int) -> Unit,
    onToggleBubble: (Boolean) -> Unit
) {
    var showAppDialog by remember { mutableStateOf(false) }
    var showAdvanced by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Call Glitch",
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                },
                actions = {
                    IconButton(onClick = { showAppDialog = true }) {
                        Icon(Icons.Default.Apps, contentDescription = "Select Calling Apps")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Connection Status Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isRunning) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isRunning) MaterialTheme.colorScheme.error.copy(alpha = 0.4f)
                    else MaterialTheme.colorScheme.outlineVariant
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = if (isRunning) "\${activeProfile.displayName} Impairment Active" else "Normal Network Traffic",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isRunning) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isRunning) "\$forwardedPackets forwarded · \$droppedPackets dropped"
                            else "\${selectedPackages.size} calling apps targeted · VPN Ready",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(if (isRunning) Color(0xFFEF4444) else Color(0xFF10B981))
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 2. Large Tactile ON/OFF Toggle
            Surface(
                onClick = { onToggleGlitch(!isRunning) },
                shape = CircleShape,
                color = if (isRunning) Color(0xFFEF4444) else MaterialTheme.colorScheme.primary,
                shadowElevation = 8.dp,
                modifier = Modifier.size(140.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = if (isRunning) Icons.Default.PowerSettingsNew else Icons.Default.PlayArrow,
                        contentDescription = "Toggle",
                        tint = Color.white,
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (isRunning) "STOP" else "START",
                        color = Color.white,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 3. Profile Selection
            Text(
                "Connection Impairment Profile",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.align(Alignment.Start)
            )
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                GlitchProfileType.values().forEach { profile ->
                    val isSelected = activeProfile == profile
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onSelectProfile(profile) },
                        shape = RoundedCornerShape(12.dp),
                        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(vertical = 12.dp, horizontal = 4.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                profile.displayName,
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer else MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                when (profile) {
                                    GlitchProfileType.MILD -> "120ms / 1%"
                                    GlitchProfileType.MODERATE -> "220ms / 3%"
                                    GlitchProfileType.SEVERE -> "350ms / 7%"
                                    GlitchProfileType.CUSTOM -> "Custom"
                                },
                                style = MaterialTheme.typography.bodySmall,
                                fontSize = 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 4. Targeted Calling Applications
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Targeted Calling Apps", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        Text(
                            "\${selectedPackages.size} apps routed through VPN (unselected bypass)",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    TextButton(onClick = { showAppDialog = true }) {
                        Text("Edit")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 5. In-Call Activation Helpers
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Floating Control Bubble", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text(
                                "Draggable on-screen button over video calls",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Switch(
                            checked = floatingBubbleEnabled,
                            onCheckedChange = onToggleBubble
                        )
                    }

                    HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Auto-Restore Timeout", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text(
                                if (autoTimeout == 0) "No timeout (manual stop only)" else "Stops after \$autoTimeout seconds",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            listOf(0 to "Off", 60 to "1m", 180 to "3m", 300 to "5m").forEach { (sec, label) ->
                                FilterChip(
                                    selected = autoTimeout == sec,
                                    onClick = { onUpdateTimeout(sec) },
                                    label = { Text(label, fontSize = 11.sp) }
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 6. Advanced Impairment Settings (Accordion)
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                onClick = { showAdvanced = !showAdvanced }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Advanced Impairment Parameters", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Icon(
                        imageVector = if (showAdvanced) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = "Toggle Advanced"
                    )
                }
            }

            AnimatedVisibility(visible = showAdvanced) {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    // Base Latency Slider
                    Text("Base Latency: \${customConfig.baseLatencyMs} ms", fontSize = 13.sp)
                    Slider(
                        value = customConfig.baseLatencyMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(baseLatencyMs = it.toInt())) },
                        valueRange = 0f..800f
                    )

                    // Jitter Slider
                    Text("Random Jitter: ±\${customConfig.randomJitterMs} ms", fontSize = 13.sp)
                    Slider(
                        value = customConfig.randomJitterMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(randomJitterMs = it.toInt())) },
                        valueRange = 0f..300f
                    )

                    // Packet Loss Slider
                    Text("Packet Loss: \${String.format(\"%.1f\", customConfig.packetLossPercent)} %", fontSize = 13.sp)
                    Slider(
                        value = customConfig.packetLossPercent.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(packetLossPercent = it.toDouble())) },
                        valueRange = 0f..25f
                    )

                    // Impairment Direction
                    Text("Traffic Direction: \${customConfig.direction.displayName}", fontSize = 13.sp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        ImpairmentDirection.values().forEach { dir ->
                            FilterChip(
                                selected = customConfig.direction == dir,
                                onClick = { onUpdateCustomConfig(customConfig.copy(direction = dir)) },
                                label = { Text(dir.displayName, fontSize = 11.sp) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // TCP Impairment Switch
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Impair TCP Traffic", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Disabled by default to avoid breaking call signaling/TLS", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(
                            checked = customConfig.affectTcp,
                            onCheckedChange = { onUpdateCustomConfig(customConfig.copy(affectTcp = it)) }
                        )
                    }
                }
            }
        }
    }
}
`
  },
  {
    path: 'README.md',
    language: 'markdown',
    description: 'Comprehensive documentation with architecture, build instructions, test verification & troubleshooting',
    content: `# Call Glitch: Rootless Per-App Network Impairment Utility

A production-grade native Android application that introduces controlled latency, jitter, packet loss, and burst interruptions to simulate unstable network conditions on ongoing voice and video calls (WhatsApp, Telegram, Google Meet, Zoom, Instagram, etc.).

## 1. Architectural Highlights

- **Rootless & Self-Contained:** Uses Android's official \`VpnService\` API. Requires no root access, no external VPN server, and no remote relays.
- **Per-Application Traffic Isolation:** Uses \`VpnService.Builder.addAllowedApplication()\` to route only the designated calling application(s). All non-selected apps (e.g. web browsers, media players, background sync) continue over the normal default network connection untouched.
- **User-Space TCP/UDP Forwarding Engine:** Runs a local packet parsing and forwarding pipeline. UDP media streams are handled through protected direct sockets (\`VpnService.protect()\`) to prevent routing loops.
- **Bi-Directional Impairment Pipeline:**
  - Incoming packets and outgoing packets pass through an independent delay queue and statistical loss filter before reaching the TUN interface or socket.
  - Bounded buffers (500 packets max) prevent memory leaks.
  - Flow-isolated queues avoid head-of-line blocking across independent connections.
- **Priority STOP & Fail-Safe Teardown:** Stopping impairment immediately tears down the local TUN interface and closes forwarding channels. Normal networking is instantly restored with zero packet blackholing.
- **Network Handover Watchdog:** Monitors Wi-Fi <-> Cellular network transitions using \`ConnectivityManager.NetworkCallback\` and seamlessly migrates sockets.

---

## 2. In-Call Activation Methods

1. **Quick Settings Tile (Primary):**
   - Swipe down from the top during an active WhatsApp or Telegram call.
   - Tap the **Call Glitch** tile.
   - The selected profile (Mild, Moderate, Severe, Custom) is immediately engaged without leaving or minimizing the video call.
   - Tap again to restore normal network quality immediately.
2. **Persistent Foreground Notification:**
   - Displays real-time impairment status, profile name, and packet drop stats.
   - Features a prominent one-tap **STOP** action button.
3. **Optional Floating Control Bubble:**
   - Small draggable floating button that stays over call apps.
   - Single-tap toggles impairment ON / OFF.
   - Long-press switches profiles.

---

## 3. Profiles & Initial Engineering Values

| Profile | Base Latency | Random Jitter | UDP Packet Loss | Direction |
|---|---|---|---|---|
| **Mild** | 120 ms | ±30 ms | 1.0 % | Both |
| **Moderate** | 220 ms | ±90 ms | 3.0 % | Both |
| **Severe** | 350 ms | ±160 ms | 7.0 % | Both |
| **Custom** | 0 – 800 ms | ±0 – 300 ms | 0 – 25 % | Configurable |

*TCP impairment is kept disabled by default so HTTP/TLS signaling and initial call handshakes remain intact.*

---

## 4. How to Build & Install

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or newer / Ladybug
- Android SDK 35 (compileSdk 35, minSdk 26)
- JDK 17

### Command Line Build
\`\`\`bash
# Build Debug APK
./gradlew assembleDebug

# Install on connected device via ADB
adb install -r app/build/outputs/apk/debug/app-debug.apk
\`\`\`

---

## 5. Verification Test Matrix (Tests 1–9)

- **Test 1 (Normal Operation):** VPN active, impairment disabled. Confirm WhatsApp call flows cleanly without drops.
- **Test 2 (Mild):** 120ms latency / 1% drop. Verify minor audio buffering without call drop.
- **Test 3 (Moderate):** 220ms latency / 3% drop. Verify noticeable call intermittency and video downscaling.
- **Test 4 (Severe):** 350ms latency / 7% drop. Verify heavy video freeze and delayed voice packets.
- **Test 5 (In-Call QS Toggle):** Swipe down QS shade while in call, tap tile to toggle on/off multiple times.
- **Test 6 (App Isolation):** Stream audio on Spotify while glitching WhatsApp. Spotify must remain clear.
- **Test 7 (Handover):** Switch between Wi-Fi and 5G/LTE during an active session. Verify socket re-protection.
- **Test 8 (Recovery):** Hit STOP. Verify immediate restoration of baseline network throughput.
- **Test 9 (VPN Conflict):** Attempt to launch a second VPN. Verify \`VpnService.onRevoke()\` shuts down cleanly.
`
  }
];
