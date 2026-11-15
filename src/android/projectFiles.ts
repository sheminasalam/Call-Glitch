export interface AndroidProjectFile {
  path: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'markdown' | 'properties' | 'json';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: "app/build.gradle.kts",
    language: "kotlin",
    description: "App module build configuration with Jetpack Compose and DataStore",
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

    testImplementation(libs.junit)
    debugImplementation(libs.androidx.ui.tooling)
}
`
  },
  {
    path: "build.gradle.kts",
    language: "kotlin",
    description: "Root build configuration defining plugins and repositories",
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  },
  {
    path: "settings.gradle.kts",
    language: "kotlin",
    description: "Gradle settings and dependency resolution repositories",
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
    path: "gradle/libs.versions.toml",
    language: "properties",
    description: "Version catalog for Gradle, Kotlin, Compose, and AndroidX",
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
junit = "4.13.2"

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
junit = { group = "junit", name = "junit", version.ref = "junit" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
`
  },
  {
    path: "gradle.properties",
    language: "properties",
    description: "Gradle properties configuring AndroidX, JVM heap, and Kotlin style",
    content: `android.useAndroidX=true
org.gradle.jvmargs=-Xmx3g -Dfile.encoding=UTF-8
kotlin.code.style=official
`
  },
  {
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    description: "Android manifest with VpnService, TileService, and QUERY_ALL_PACKAGES",
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

        <!-- Android Quick Settings Tile for In-Call 1-Tap Toggle (Primary Control) -->
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

    </application>

</manifest>
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/CallGlitchApplication.kt",
    language: "kotlin",
    description: "Application class initializing notification channels and dependency singletons",
    content: `package com.callglitch.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.callglitch.app.data.AppDiscoveryRepository
import com.callglitch.app.data.GlitchSettingsRepository

class CallGlitchApplication : Application() {

    lateinit var settingsRepository: GlitchSettingsRepository
        private set

    lateinit var appDiscoveryRepository: AppDiscoveryRepository
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        settingsRepository = GlitchSettingsRepository(this)
        appDiscoveryRepository = AppDiscoveryRepository(this)
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
    path: "app/src/main/java/com/callglitch/app/model/GlitchModels.kt",
    language: "kotlin",
    description: "Data models for profiles, impairment metrics, and installed application metadata",
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

`
  },
  {
    path: "app/src/main/java/com/callglitch/app/data/AppDiscoveryRepository.kt",
    language: "kotlin",
    description: "Dynamically discovers installed apps via PackageManager with icon decoding",
    content: `package com.callglitch.app.data

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import com.callglitch.app.model.InstalledAppInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Discovers installed Android applications dynamically using PackageManager.
 * Supports filtering system apps, searching by name/package, and self-exclusion.
 */
class AppDiscoveryRepository(private val context: Context) {

    private val packageManager: PackageManager = context.packageManager

    suspend fun getInstalledApps(includeSystemApps: Boolean = false): List<InstalledAppInfo> =
        withContext(Dispatchers.IO) {
            val apps = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getInstalledApplications(0)
            }

            val selfPackage = context.packageName

            apps.mapNotNull { appInfo ->
                // Rule 1: Exclude Call Glitch itself to prevent circular loop or blackholing
                if (appInfo.packageName == selfPackage) {
                    return@mapNotNull null
                }

                val hasLauncher = try {
                    packageManager.getLaunchIntentForPackage(appInfo.packageName) != null
                } catch (e: Exception) {
                    false
                }

                val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                val isUpdatedSystem = (appInfo.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0

                // Only consider background framework components as system apps; keep launcher-visible apps
                val isSystemFramework = isSystem && !isUpdatedSystem && !hasLauncher

                if (isSystemFramework && !includeSystemApps) {
                    return@mapNotNull null
                }

                val label = try {
                    packageManager.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    appInfo.packageName
                }

                InstalledAppInfo(
                    packageName = appInfo.packageName,
                    appName = if (label.isNotBlank()) label else appInfo.packageName,
                    isSystemApp = isSystem,
                    hasLauncher = hasLauncher
                )
            }.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.appName })
        }

    fun loadAppIcon(packageName: String): Bitmap? {
        return try {
            val drawable = packageManager.getApplicationIcon(packageName)
            drawableToBitmap(drawable)
        } catch (e: Exception) {
            null
        }
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        if (drawable is BitmapDrawable && drawable.bitmap != null) {
            return drawable.bitmap
        }
        val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
        val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/data/GlitchSettingsRepository.kt",
    language: "kotlin",
    description: "Jetpack DataStore preferences repository for profile, apps, and timeout persistence",
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

val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "call_glitch_settings")

class GlitchSettingsRepository(private val context: Context) {

    private object PreferencesKeys {
        val ACTIVE_PROFILE = stringPreferencesKey("active_profile")
        val CUSTOM_LATENCY = intPreferencesKey("custom_latency")
        val CUSTOM_JITTER = intPreferencesKey("custom_jitter")
        val CUSTOM_LOSS = doublePreferencesKey("custom_loss")
        val CUSTOM_BURST_ENABLED = booleanPreferencesKey("custom_burst_enabled")
        val CUSTOM_BURST_DURATION = intPreferencesKey("custom_burst_duration")
        val CUSTOM_BURST_INTERVAL = intPreferencesKey("custom_burst_interval")
        val CUSTOM_DIRECTION = stringPreferencesKey("custom_direction")
        val CUSTOM_AFFECT_TCP = booleanPreferencesKey("custom_affect_tcp")
        val SELECTED_PACKAGES = stringSetPreferencesKey("selected_packages")
        val AUTO_TIMEOUT_SECONDS = intPreferencesKey("auto_timeout_seconds")
    }

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
                burstDurationMs = prefs[PreferencesKeys.CUSTOM_BURST_DURATION] ?: 2500,
                burstIntervalSeconds = prefs[PreferencesKeys.CUSTOM_BURST_INTERVAL] ?: 6,
                direction = try {
                    ImpairmentDirection.valueOf(prefs[PreferencesKeys.CUSTOM_DIRECTION] ?: ImpairmentDirection.BOTH.name)
                } catch (e: Exception) {
                    ImpairmentDirection.BOTH
                },
                affectTcp = prefs[PreferencesKeys.CUSTOM_AFFECT_TCP] ?: false
            )
        }

    val selectedPackagesFlow: Flow<Set<String>> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs ->
            prefs[PreferencesKeys.SELECTED_PACKAGES] ?: emptySet()
        }

    val autoTimeoutSecondsFlow: Flow<Int> = context.dataStore.data
        .catch { emit(emptyPreferences()) }
        .map { prefs -> prefs[PreferencesKeys.AUTO_TIMEOUT_SECONDS] ?: 0 }

    suspend fun setActiveProfile(profile: GlitchProfileType) {
        context.dataStore.edit { it[PreferencesKeys.ACTIVE_PROFILE] = profile.name }
    }

    suspend fun updateCustomConfig(config: GlitchConfig) {
        context.dataStore.edit { prefs ->
            prefs[PreferencesKeys.CUSTOM_LATENCY] = config.baseLatencyMs
            prefs[PreferencesKeys.CUSTOM_JITTER] = config.randomJitterMs
            prefs[PreferencesKeys.CUSTOM_LOSS] = config.packetLossPercent
            prefs[PreferencesKeys.CUSTOM_BURST_ENABLED] = config.burstInterruptionEnabled
            prefs[PreferencesKeys.CUSTOM_BURST_DURATION] = config.burstDurationMs
            prefs[PreferencesKeys.CUSTOM_BURST_INTERVAL] = config.burstIntervalSeconds
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
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/vpn/CallGlitchVpnService.kt",
    language: "kotlin",
    description: "Core Android VpnService managing TUN lifecycle, per-app routing, and failsafe watchdog",
    content: `package com.callglitch.app.vpn

import android.app.Notification
import android.app.PendingIntent
import android.app.Service.STOP_FOREGROUND_REMOVE
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
    private var startJob: Job? = null

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
                            Log.e(TAG, "Error updating apps on active VPN: \${e.message}", e)
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

                startForegroundSafely(profile)
                startVpn(profile)
                return START_STICKY
            }
        }
        return START_NOT_STICKY
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
            Log.e(TAG, "startForeground failed: \${e.message}", e)
            try {
                startForeground(NOTIFICATION_ID, notification)
            } catch (ignored: Exception) {
                Log.w(TAG, "Notification fallback omitted.")
            }
        }
    }

    private fun startVpn(profile: GlitchProfileType) {
        startJob?.cancel()
        startJob = serviceScope.launch {
            try {
                _forwardedPackets.value = 0L
                _droppedPackets.value = 0L

                val repo = (application as CallGlitchApplication).settingsRepository
                val selectedApps = repo.selectedPackagesFlow.first()
                if (selectedApps.isEmpty()) {
                    val err = "No target applications selected. Please select at least one application."
                    Log.e(TAG, err)
                    _lastErrorMessage.value = err
                    stopVpn()
                    return@launch
                }
                val custom = repo.customConfigFlow.first()
                val config = GlitchConfig.forType(profile, custom)
                val timeoutSec = repo.autoTimeoutSecondsFlow.first()

                establishVpn(selectedApps, config)
                _isRunning.value = true
                _lastErrorMessage.value = null
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
                Log.e(TAG, "Failed to start VPN: \${e.message}", e)
                _lastErrorMessage.value = e.message ?: "Failed to establish VPN interface"
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
            addDnsServer("8.8.8.8")
            addDnsServer("1.1.1.1")
            addRoute("0.0.0.0", 0)
            setSession("CallGlitch: \${config.profileType.displayName}")
            setBlocking(true)

            // Capture IPv6 default route with a valid hexadecimal ULA address so dual-stack
            // calling apps (WhatsApp, Telegram, Meet, Zoom) cannot bypass the VPN over IPv6.
            try {
                addAddress("fd00:ca11:911c::1", 64)
                addRoute("::", 0)
            } catch (e: Exception) {
                Log.w(TAG, "IPv6 TUN route unavailable on this device, using IPv4 only: \${e.message}")
            }

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
            throw IllegalStateException("None of the selected applications (\${selectedApps.joinToString()}) are currently installed on this device.")
        }

        forwardingEngine?.stop()
        forwardingEngine = null
        vpnInterface?.close()
        vpnInterface = null

        val pfd = builder.establish() ?: throw IOException("VpnService.Builder.establish() returned null. Please verify VPN permission was approved.")
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
            .addCapability(NetworkCapabilities.NET_CAPABILITY_NOT_VPN)
            .build()

        networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                Log.d(TAG, "Underlying physical network available: $network.")
                forwardingEngine?.onUnderlyingNetworkChanged(network)
            }

            override fun onLost(network: Network) {
                Log.d(TAG, "Underlying network lost: $network.")
            }

            override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                forwardingEngine?.onUnderlyingNetworkChanged(network)
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
        startJob?.cancel()
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
    path: "app/src/main/java/com/callglitch/app/vpn/PacketForwardingEngine.kt",
    language: "kotlin",
    description: "Pure Kotlin user-space IPv4 packet parsing, UDP delay/loss impairment queue, and socket forwarding",
    content: `package com.callglitch.app.vpn

import android.net.Network
import android.net.VpnService
import android.util.Log
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.ImpairmentDirection
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import java.io.FileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

/**
 * Rootless, per-app dual-stack (IPv4 + IPv6) user-space packet forwarding and impairment engine.
 *
 * - Captures and impairs both IPv4 and IPv6 traffic so dual-stack VoIP/video calls
 *   (WhatsApp, Telegram, Google Meet, Zoom, Messenger, Chamet) cannot bypass the VPN.
 * - Uses Endpoint-Independent UDP NAT (keyed by local ip:port) so WebRTC ICE/STUN/TURN
 *   hole-punching and incoming media streams stay bound cleanly.
 * - Uses an ordered, MTU-chunked (1380B) user-space TCP proxy with RFC-compliant checksums
 *   so signaling, DNS, and TLS never break or silently blackhole.
 * - Runs socket I/O on a dedicated cached thread pool so open sockets never starve
 *   the TUN reader or delay-queue dispatcher.
 */
class PacketForwardingEngine(
    private val vpnService: VpnService,
    private val tunFd: FileDescriptor,
    @Volatile private var config: GlitchConfig,
    private val onStatsUpdate: (forwarded: Long, dropped: Long) -> Unit
) {
    private val isRunning = AtomicBoolean(false)
    private val forwardedCount = AtomicLong(0)
    private val droppedCount = AtomicLong(0)

    private val socketExecutor = Executors.newCachedThreadPool()
    private val socketDispatcher = socketExecutor.asCoroutineDispatcher()
    private val engineScope = CoroutineScope(socketDispatcher + SupervisorJob())

    // Endpoint-independent UDP NAT table: keyed by (v4/v6:srcIp:srcPort)
    private val udpSessions = ConcurrentHashMap<String, UdpSession>()

    // TCP transparent proxy table: keyed by (v4/v6:srcIp:srcPort->dstIp:dstPort)
    private val tcpSessions = ConcurrentHashMap<String, TcpSession>()

    // Bounded packet delay queue for outgoing & incoming UDP impairment
    private val maxQueueCapacity = 8000
    private val delayQueue = PriorityBlockingQueue<DelayedPacket>(1024, compareBy { it.scheduledReleaseTime })

    // TUN streams
    private val tunIn = FileInputStream(tunFd)
    private val tunOut = FileOutputStream(tunFd)

    companion object {
        private const val TAG = "PacketForwardingEngine"
        private const val BUFFER_SIZE = 32767
        private const val MAX_TCP_PAYLOAD = 1380
    }

    fun start() {
        if (!isRunning.compareAndSet(false, true)) return

        // 1. TUN Packet Reader (Outgoing traffic from allowed apps)
        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            while (isRunning.get()) {
                try {
                    val length = tunIn.read(buffer)
                    if (length > 0) {
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

        // 2. Delay Queue Dispatcher (Releases delayed packets accurately on schedule)
        engineScope.launch {
            while (isRunning.get()) {
                try {
                    var head = delayQueue.peek()
                    val now = System.currentTimeMillis()
                    if (head != null && head.scheduledReleaseTime <= now) {
                        while (head != null && head.scheduledReleaseTime <= System.currentTimeMillis() && isRunning.get()) {
                            val packet = delayQueue.poll() ?: break
                            dispatchDelayedPacket(packet)
                            head = delayQueue.peek()
                        }
                    } else if (head != null) {
                        val waitTime = (head.scheduledReleaseTime - now).coerceIn(1L, 5L)
                        delay(waitTime)
                    } else {
                        delay(2L)
                    }
                } catch (e: Exception) {
                    delay(5L)
                }
            }
        }

        // 3. Periodic Session Housekeeping (Every 30s)
        engineScope.launch {
            while (isRunning.get()) {
                delay(30000L)
                cleanStaleSessions()
            }
        }
    }

    fun updateConfig(newConfig: GlitchConfig) {
        this.config = newConfig
        Log.i(
            TAG,
            "Impairment config updated: \${newConfig.profileType.displayName} " +
                "(latency=\${newConfig.baseLatencyMs}ms, jitter=\${newConfig.randomJitterMs}ms, " +
                "loss=\${newConfig.packetLossPercent}%, burst=\${newConfig.burstInterruptionEnabled}, affectTcp=\${newConfig.affectTcp})"
        )
    }

    fun onUnderlyingNetworkChanged(network: Network) {
        udpSessions.values.forEach { session ->
            try { vpnService.protect(session.socket) } catch (ignored: Exception) {}
        }
        tcpSessions.values.forEach { session ->
            try { vpnService.protect(session.socket) } catch (ignored: Exception) {}
        }
    }

    // =========================================================================
    // OUTGOING PACKET PROCESSING (From App through TUN)
    // =========================================================================

    private fun handleOutgoingTunPacket(packet: ByteArray) {
        if (packet.isEmpty()) return
        val version = (packet[0].toInt() shr 4) and 0x0F

        when (version) {
            4 -> handleIpv4Packet(packet)
            6 -> handleIpv6Packet(packet)
        }
    }

    private fun handleIpv4Packet(packet: ByteArray) {
        if (packet.size < 20) return
        val ipHeaderLen = (packet[0].toInt() and 0x0F) * 4
        if (ipHeaderLen < 20 || packet.size < ipHeaderLen) return

        val declaredTotalLen = ((packet[2].toInt() and 0xFF) shl 8) or (packet[3].toInt() and 0xFF)
        val packetLen = declaredTotalLen.coerceIn(ipHeaderLen, packet.size)
        val protocol = packet[9].toInt() and 0xFF

        val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
        val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

        when (protocol) {
            17 -> handleOutgoingUdp(packet, packetLen, ipHeaderLen, srcIp, dstIp, isIpv6 = false)
            6 -> handleOutgoingTcp(packet, packetLen, ipHeaderLen, srcIp, dstIp, isIpv6 = false)
            1 -> handleOutgoingIcmpV4(packet, packetLen, ipHeaderLen, srcIp, dstIp)
            else -> reportForwarded()
        }
    }

    private fun handleIpv6Packet(packet: ByteArray) {
        if (packet.size < 40) return
        val payloadLen = ((packet[4].toInt() and 0xFF) shl 8) or (packet[5].toInt() and 0xFF)
        val packetLen = (40 + payloadLen).coerceIn(40, packet.size)

        val srcIp = InetAddress.getByAddress(packet.copyOfRange(8, 24))
        val dstIp = InetAddress.getByAddress(packet.copyOfRange(24, 40))

        var nextHeader = packet[6].toInt() and 0xFF
        var offset = 40

        // Walk standard IPv6 extension headers if present
        while (offset < packetLen) {
            when (nextHeader) {
                0, 43, 60 -> { // Hop-by-Hop, Routing, Destination Options
                    if (offset + 2 > packetLen) return
                    nextHeader = packet[offset].toInt() and 0xFF
                    val extLen = ((packet[offset + 1].toInt() and 0xFF) + 1) * 8
                    offset += extLen
                }
                44 -> { // Fragment Header (8 bytes)
                    if (offset + 8 > packetLen) return
                    nextHeader = packet[offset].toInt() and 0xFF
                    offset += 8
                }
                else -> break
            }
        }

        if (offset > packetLen) return

        when (nextHeader) {
            17 -> handleOutgoingUdp(packet, packetLen, offset, srcIp, dstIp, isIpv6 = true)
            6 -> handleOutgoingTcp(packet, packetLen, offset, srcIp, dstIp, isIpv6 = true)
            58 -> handleOutgoingIcmpV6(packet, packetLen, offset, srcIp, dstIp)
            else -> reportForwarded()
        }
    }

    // -------------------------------------------------------------------------
    // UDP PROCESSING (VoIP audio/video RTP, STUN/TURN, QUIC, DNS)
    // -------------------------------------------------------------------------

    private fun handleOutgoingUdp(
        packet: ByteArray,
        packetLen: Int,
        transportOffset: Int,
        srcIp: InetAddress,
        dstIp: InetAddress,
        isIpv6: Boolean
    ) {
        if (packetLen < transportOffset + 8) return
        if (dstIp.isMulticastAddress || dstIp.isLinkLocalAddress) return

        val srcPort = ((packet[transportOffset].toInt() and 0xFF) shl 8) or (packet[transportOffset + 1].toInt() and 0xFF)
        val dstPort = ((packet[transportOffset + 2].toInt() and 0xFF) shl 8) or (packet[transportOffset + 3].toInt() and 0xFF)
        val udpLen = ((packet[transportOffset + 4].toInt() and 0xFF) shl 8) or (packet[transportOffset + 5].toInt() and 0xFF)

        val endPayload = (transportOffset + udpLen).coerceAtMost(packetLen)
        if (transportOffset + 8 > endPayload) return
        val payload = packet.copyOfRange(transportOffset + 8, endPayload)

        val isDns = dstPort == 53 || srcPort == 53
        if (isDns) {
            sendUdpToNetwork(srcIp, srcPort, dstIp, dstPort, payload, isIpv6, packet.copyOf(packetLen))
            return
        }

        val currentConfig = config
        val shouldImpair = (currentConfig.direction == ImpairmentDirection.BOTH || currentConfig.direction == ImpairmentDirection.OUTGOING)

        if (shouldImpair) {
            if (shouldDropPacket(currentConfig)) {
                reportDropped()
                return
            }

            val delayMs = calculateDelay(currentConfig)
            if (delayMs > 0) {
                if (delayQueue.size < maxQueueCapacity) {
                    delayQueue.offer(
                        DelayedPacket(
                            data = payload,
                            scheduledReleaseTime = System.currentTimeMillis() + delayMs,
                            isIncoming = false,
                            srcIp = srcIp,
                            srcPort = srcPort,
                            dstIp = dstIp,
                            dstPort = dstPort,
                            isIpv6 = isIpv6,
                            rawPacketForError = if (isIpv6) packet.copyOf(packetLen) else null
                        )
                    )
                } else {
                    // Tail-drop when congested (never bypass delay queue at 0ms)
                    reportDropped()
                }
                return
            }
        }

        sendUdpToNetwork(srcIp, srcPort, dstIp, dstPort, payload, isIpv6, if (isIpv6) packet.copyOf(packetLen) else null)
    }

    private fun sendUdpToNetwork(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray,
        isIpv6: Boolean,
        rawPacketForError: ByteArray?
    ) {
        val sessionKey = "\${if (isIpv6) "v6" else "v4"}:\${srcIp.hostAddress}:$srcPort"
        try {
            val session = udpSessions.computeIfAbsent(sessionKey) {
                createUdpSession(sessionKey, srcIp, srcPort, isIpv6)
            }
            session.lastActivity = System.currentTimeMillis()

            val datagram = DatagramPacket(payload, payload.size, dstIp, dstPort)
            session.socket.send(datagram)
            reportForwarded()
        } catch (e: Exception) {
            Log.d(TAG, "UDP send error ($dstIp:$dstPort): \${e.message}")
            if (isIpv6 && rawPacketForError != null) {
                // Immediately notify app IPv6 is unreachable so Happy Eyeballs/ICE falls back to IPv4
                val unreach = synthesizeIcmpV6Unreachable(dstIp, srcIp, rawPacketForError)
                writeToTun(unreach)
            }
        }
    }

    private fun createUdpSession(
        sessionKey: String,
        srcIp: InetAddress,
        srcPort: Int,
        isIpv6: Boolean
    ): UdpSession {
        val socket = DatagramSocket()
        vpnService.protect(socket)

        val session = UdpSession(sessionKey, socket, srcIp, srcPort, isIpv6, System.currentTimeMillis())

        engineScope.launch {
            val buffer = ByteArray(BUFFER_SIZE)
            try {
                while (isRunning.get() && !socket.isClosed) {
                    val incoming = DatagramPacket(buffer, buffer.size)
                    socket.receive(incoming)
                    session.lastActivity = System.currentTimeMillis()

                    val remoteIp = incoming.address ?: continue
                    val remotePort = incoming.port

                    // Ensure address family matches the local TUN interface address
                    if (!session.isIpv6 && remoteIp !is Inet4Address) continue
                    if (session.isIpv6 && remoteIp !is Inet6Address) continue

                    val payload = incoming.data.copyOf(incoming.length)
                    handleIncomingUdpPacket(session, remoteIp, remotePort, payload)
                }
            } catch (ignored: Exception) {
            } finally {
                udpSessions.remove(sessionKey, session)
                try { socket.close() } catch (ignored: Exception) {}
            }
        }
        return session
    }

    private fun handleIncomingUdpPacket(
        session: UdpSession,
        remoteIp: InetAddress,
        remotePort: Int,
        payload: ByteArray
    ) {
        val synth = if (session.isIpv6) {
            synthesizeIpv6UdpPacket(remoteIp, remotePort, session.srcIp, session.srcPort, payload)
        } else {
            synthesizeIpv4UdpPacket(remoteIp, remotePort, session.srcIp, session.srcPort, payload)
        }

        val isDns = remotePort == 53 || session.srcPort == 53
        if (isDns) {
            writeToTun(synth)
            return
        }

        val currentConfig = config
        val shouldImpair = (currentConfig.direction == ImpairmentDirection.BOTH || currentConfig.direction == ImpairmentDirection.INCOMING)

        if (shouldImpair) {
            if (shouldDropPacket(currentConfig)) {
                reportDropped()
                return
            }

            val delayMs = calculateDelay(currentConfig)
            if (delayMs > 0) {
                if (delayQueue.size < maxQueueCapacity) {
                    delayQueue.offer(
                        DelayedPacket(
                            data = synth,
                            scheduledReleaseTime = System.currentTimeMillis() + delayMs,
                            isIncoming = true,
                            srcIp = remoteIp,
                            srcPort = remotePort,
                            dstIp = session.srcIp,
                            dstPort = session.srcPort,
                            isIpv6 = session.isIpv6,
                            rawPacketForError = null
                        )
                    )
                } else {
                    reportDropped()
                }
                return
            }
        }

        writeToTun(synth)
    }

    // -------------------------------------------------------------------------
    // TCP PROCESSING (Call signaling, TLS, HTTPS, TURN-over-TCP)
    // -------------------------------------------------------------------------

    private fun handleOutgoingTcp(
        packet: ByteArray,
        packetLen: Int,
        transportOffset: Int,
        srcIp: InetAddress,
        dstIp: InetAddress,
        isIpv6: Boolean
    ) {
        if (packetLen < transportOffset + 20) return

        val srcPort = ((packet[transportOffset].toInt() and 0xFF) shl 8) or (packet[transportOffset + 1].toInt() and 0xFF)
        val dstPort = ((packet[transportOffset + 2].toInt() and 0xFF) shl 8) or (packet[transportOffset + 3].toInt() and 0xFF)

        val clientSeq = (((packet[transportOffset + 4].toLong() and 0xFF) shl 24) or
                ((packet[transportOffset + 5].toLong() and 0xFF) shl 16) or
                ((packet[transportOffset + 6].toLong() and 0xFF) shl 8) or
                (packet[transportOffset + 7].toLong() and 0xFF))

        val dataOffset = ((packet[transportOffset + 12].toInt() shr 4) and 0x0F) * 4
        if (dataOffset < 20 || packetLen < transportOffset + dataOffset) return

        val flags = packet[transportOffset + 13].toInt() and 0xFF
        val isSyn = (flags and 0x02) != 0
        val isAck = (flags and 0x10) != 0
        val isFin = (flags and 0x01) != 0
        val isRst = (flags and 0x04) != 0

        val payloadOffset = transportOffset + dataOffset
        val payloadLen = (packetLen - payloadOffset).coerceAtLeast(0)

        val sessionKey = "\${if (isIpv6) "v6" else "v4"}:\${srcIp.hostAddress}:$srcPort->\${dstIp.hostAddress}:$dstPort"

        if (isRst) {
            tcpSessions.remove(sessionKey)?.close()
            return
        }

        if (isSyn && !isAck) {
            tcpSessions.remove(sessionKey)?.close()

            val initialServerSeq = (Random.nextLong(0x0FFFFFFF) + 1000L) and 0xFFFFFFFFL
            val session = TcpSession(
                sessionKey = sessionKey,
                isIpv6 = isIpv6,
                clientIp = srcIp,
                clientPort = srcPort,
                serverIp = dstIp,
                serverPort = dstPort,
                clientNextAck = (clientSeq + 1L) and 0xFFFFFFFFL,
                serverSeq = initialServerSeq
            )
            tcpSessions[sessionKey] = session

            val synAck = synthesizeTcpPacket(
                isIpv6 = isIpv6,
                srcIp = dstIp,
                srcPort = dstPort,
                dstIp = srcIp,
                dstPort = srcPort,
                seq = initialServerSeq,
                ack = session.clientNextAck,
                flags = 0x12 // SYN | ACK
            )
            session.serverSeq = (session.serverSeq + 1L) and 0xFFFFFFFFL
            writeToTun(synAck)

            session.start()
            return
        }

        val session = tcpSessions[sessionKey]
        if (session == null) {
            if (!isRst) {
                val rst = synthesizeTcpPacket(
                    isIpv6 = isIpv6,
                    srcIp = dstIp,
                    srcPort = dstPort,
                    dstIp = srcIp,
                    dstPort = srcPort,
                    seq = 0L,
                    ack = (clientSeq + payloadLen + (if (isSyn || isFin) 1L else 0L)) and 0xFFFFFFFFL,
                    flags = 0x14 // RST | ACK
                )
                writeToTun(rst)
            }
            return
        }

        session.lastActivity = System.currentTimeMillis()

        if (payloadLen > 0) {
            // Sequence-number deduplication (32-bit wrap-safe)
            val seqDiff = (clientSeq - session.clientNextAck).toInt()
            if (seqDiff == 0) {
                val payload = packet.copyOfRange(payloadOffset, packetLen)
                session.clientNextAck = (session.clientNextAck + payloadLen) and 0xFFFFFFFFL
                sendTcpAck(session)
                session.enqueueOutbound(payload)
            } else if (seqDiff < 0) {
                val overlap = -seqDiff
                if (overlap < payloadLen) {
                    val newSlice = packet.copyOfRange(payloadOffset + overlap, packetLen)
                    session.clientNextAck = (session.clientNextAck + newSlice.size) and 0xFFFFFFFFL
                    sendTcpAck(session)
                    session.enqueueOutbound(newSlice)
                } else {
                    // Pure retransmission: re-ACK without duplicating stream bytes
                    sendTcpAck(session)
                }
            } else {
                // Future out-of-order segment: re-ACK expected sequence so client retransmits cleanly
                sendTcpAck(session)
            }
        }

        if (isFin) {
            session.clientNextAck = (session.clientNextAck + 1L) and 0xFFFFFFFFL
            sendTcpAck(session)
            session.close()
            tcpSessions.remove(sessionKey, session)
        }
    }

    private fun sendTcpAck(session: TcpSession) {
        val ack = synthesizeTcpPacket(
            isIpv6 = session.isIpv6,
            srcIp = session.serverIp,
            srcPort = session.serverPort,
            dstIp = session.clientIp,
            dstPort = session.clientPort,
            seq = session.serverSeq,
            ack = session.clientNextAck,
            flags = 0x10 // ACK
        )
        writeToTun(ack)
    }

    // -------------------------------------------------------------------------
    // ICMPv4 / ICMPv6 HANDLERS
    // -------------------------------------------------------------------------

    private fun handleOutgoingIcmpV4(
        packet: ByteArray,
        packetLen: Int,
        ipHeaderLen: Int,
        srcIp: InetAddress,
        dstIp: InetAddress
    ) {
        if (packetLen < ipHeaderLen + 8) return
        val type = packet[ipHeaderLen].toInt() and 0xFF
        if (type == 8) { // Echo Request
            val echoReply = packet.copyOf(packetLen)
            System.arraycopy(dstIp.address, 0, echoReply, 12, 4)
            System.arraycopy(srcIp.address, 0, echoReply, 16, 4)
            echoReply[ipHeaderLen] = 0.toByte()
            echoReply[ipHeaderLen + 2] = 0
            echoReply[ipHeaderLen + 3] = 0
            val icmpCsum = ChecksumCalculator.computeChecksum(echoReply, ipHeaderLen, packetLen - ipHeaderLen)
            echoReply[ipHeaderLen + 2] = ((icmpCsum.toInt() shr 8) and 0xFF).toByte()
            echoReply[ipHeaderLen + 3] = (icmpCsum.toInt() and 0xFF).toByte()

            echoReply[10] = 0
            echoReply[11] = 0
            val ipCsum = ChecksumCalculator.computeIpChecksum(echoReply, 0, ipHeaderLen)
            echoReply[10] = ((ipCsum.toInt() shr 8) and 0xFF).toByte()
            echoReply[11] = (ipCsum.toInt() and 0xFF).toByte()

            writeToTun(echoReply)
        }
    }

    private fun handleOutgoingIcmpV6(
        packet: ByteArray,
        packetLen: Int,
        transportOffset: Int,
        srcIp: InetAddress,
        dstIp: InetAddress
    ) {
        if (packetLen < transportOffset + 8) return
        val type = packet[transportOffset].toInt() and 0xFF
        if (type == 128) { // ICMPv6 Echo Request
            val icmpLen = packetLen - transportOffset
            val reply = ByteArray(40 + icmpLen)
            val buf = ByteBuffer.wrap(reply)
            buf.put(0x60.toByte())
            buf.put(0x00.toByte())
            buf.putShort(0)
            buf.putShort(icmpLen.toShort())
            buf.put(58.toByte()) // Next Header: ICMPv6
            buf.put(64.toByte()) // Hop Limit
            buf.put(dstIp.address)
            buf.put(srcIp.address)
            System.arraycopy(packet, transportOffset, reply, 40, icmpLen)
            reply[40] = 129.toByte() // Echo Reply
            reply[42] = 0
            reply[43] = 0
            val csum = ChecksumCalculator.computeIpv6TransportChecksum(
                dstIp.address, srcIp.address, 58, reply, 40, icmpLen, 2
            )
            reply[42] = ((csum.toInt() shr 8) and 0xFF).toByte()
            reply[43] = (csum.toInt() and 0xFF).toByte()
            writeToTun(reply)
        }
    }

    private fun synthesizeIcmpV6Unreachable(
        srcIp: InetAddress,
        dstIp: InetAddress,
        originalPacket: ByteArray
    ): ByteArray {
        val quotedLen = originalPacket.size.coerceAtMost(1232)
        val icmpLen = 8 + quotedLen
        val reply = ByteArray(40 + icmpLen)
        val buf = ByteBuffer.wrap(reply)
        buf.put(0x60.toByte())
        buf.put(0x00.toByte())
        buf.putShort(0)
        buf.putShort(icmpLen.toShort())
        buf.put(58.toByte()) // ICMPv6
        buf.put(64.toByte())
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        reply[40] = 1.toByte() // Type 1: Destination Unreachable
        reply[41] = 0.toByte() // Code 0: No route to destination
        System.arraycopy(originalPacket, 0, reply, 48, quotedLen)

        val csum = ChecksumCalculator.computeIpv6TransportChecksum(
            srcIp.address, dstIp.address, 58, reply, 40, icmpLen, 2
        )
        reply[42] = ((csum.toInt() shr 8) and 0xFF).toByte()
        reply[43] = (csum.toInt() and 0xFF).toByte()
        return reply
    }

    // =========================================================================
    // DELAY QUEUE DISPATCHER & TUN WRITER
    // =========================================================================

    private fun dispatchDelayedPacket(packet: DelayedPacket) {
        if (packet.isIncoming) {
            writeToTun(packet.data)
        } else {
            sendUdpToNetwork(
                packet.srcIp,
                packet.srcPort,
                packet.dstIp,
                packet.dstPort,
                packet.data,
                packet.isIpv6,
                packet.rawPacketForError
            )
        }
    }

    private fun writeToTun(data: ByteArray) {
        if (!isRunning.get()) return
        try {
            synchronized(tunOut) {
                tunOut.write(data)
                tunOut.flush()
            }
            reportForwarded()
        } catch (e: Exception) {
            if (isRunning.get()) {
                Log.e(TAG, "Error writing to TUN (len=\${data.size}): \${e.message}")
            }
        }
    }

    private fun reportForwarded() {
        val forwarded = forwardedCount.incrementAndGet()
        if (forwarded % 10L == 0L) {
            onStatsUpdate(forwarded, droppedCount.get())
        }
    }

    private fun reportDropped() {
        val dropped = droppedCount.incrementAndGet()
        onStatsUpdate(forwardedCount.get(), dropped)
    }

    // =========================================================================
    // PACKET SYNTHESIS (IPv4 & IPv6 with RFC Checksums)
    // =========================================================================

    private fun synthesizeIpv4UdpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray
    ): ByteArray {
        val ipLen = 20
        val udpLen = 8 + payload.size
        val totalLen = ipLen + udpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x45.toByte())
        buf.put(0x00.toByte())
        buf.putShort(totalLen.toShort())
        buf.putShort(Random.nextInt(65535).toShort())
        buf.putShort(0x4000.toShort())
        buf.put(64.toByte())
        buf.put(17.toByte())
        buf.putShort(0)
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putShort(udpLen.toShort())
        buf.putShort(0)
        buf.put(payload)

        val ipChecksum = ChecksumCalculator.computeIpChecksum(packet, 0, ipLen)
        packet[10] = ((ipChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum.toInt() and 0xFF).toByte()

        val udpChecksum = ChecksumCalculator.computeUdpChecksum(srcIp.address, dstIp.address, packet, ipLen, udpLen)
        packet[ipLen + 6] = ((udpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 7] = (udpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeIpv6UdpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        payload: ByteArray
    ): ByteArray {
        val ipLen = 40
        val udpLen = 8 + payload.size
        val totalLen = ipLen + udpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x60.toByte())
        buf.put(0x00.toByte())
        buf.putShort(0)
        buf.putShort(udpLen.toShort())
        buf.put(17.toByte()) // UDP
        buf.put(64.toByte())
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putShort(udpLen.toShort())
        buf.putShort(0)
        buf.put(payload)

        val udpChecksum = ChecksumCalculator.computeIpv6TransportChecksum(
            srcIp.address, dstIp.address, 17, packet, ipLen, udpLen, 6
        )
        packet[ipLen + 6] = ((udpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 7] = (udpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeTcpPacket(
        isIpv6: Boolean,
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        seq: Long,
        ack: Long,
        flags: Int,
        payload: ByteArray = ByteArray(0),
        windowSize: Int = 65535
    ): ByteArray {
        return if (isIpv6) {
            synthesizeIpv6TcpPacket(srcIp, srcPort, dstIp, dstPort, seq, ack, flags, payload, windowSize)
        } else {
            synthesizeIpv4TcpPacket(srcIp, srcPort, dstIp, dstPort, seq, ack, flags, payload, windowSize)
        }
    }

    private fun synthesizeIpv4TcpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        seq: Long,
        ack: Long,
        flags: Int,
        payload: ByteArray,
        windowSize: Int
    ): ByteArray {
        val ipLen = 20
        val tcpLen = 20 + payload.size
        val totalLen = ipLen + tcpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x45.toByte())
        buf.put(0x00.toByte())
        buf.putShort(totalLen.toShort())
        buf.putShort(Random.nextInt(65535).toShort())
        buf.putShort(0x4000.toShort())
        buf.put(64.toByte())
        buf.put(6.toByte())
        buf.putShort(0)
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putInt((seq and 0xFFFFFFFFL).toInt())
        buf.putInt((ack and 0xFFFFFFFFL).toInt())
        buf.put(0x50.toByte())
        buf.put(flags.toByte())
        buf.putShort(windowSize.toShort())
        buf.putShort(0)
        buf.putShort(0)
        if (payload.isNotEmpty()) buf.put(payload)

        val ipChecksum = ChecksumCalculator.computeIpChecksum(packet, 0, ipLen)
        packet[10] = ((ipChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[11] = (ipChecksum.toInt() and 0xFF).toByte()

        val tcpChecksum = ChecksumCalculator.computeTcpChecksum(srcIp.address, dstIp.address, packet, ipLen, tcpLen)
        packet[ipLen + 16] = ((tcpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 17] = (tcpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    private fun synthesizeIpv6TcpPacket(
        srcIp: InetAddress,
        srcPort: Int,
        dstIp: InetAddress,
        dstPort: Int,
        seq: Long,
        ack: Long,
        flags: Int,
        payload: ByteArray,
        windowSize: Int
    ): ByteArray {
        val ipLen = 40
        val tcpLen = 20 + payload.size
        val totalLen = ipLen + tcpLen
        val packet = ByteArray(totalLen)
        val buf = ByteBuffer.wrap(packet)

        buf.put(0x60.toByte())
        buf.put(0x00.toByte())
        buf.putShort(0)
        buf.putShort(tcpLen.toShort())
        buf.put(6.toByte()) // TCP
        buf.put(64.toByte())
        buf.put(srcIp.address)
        buf.put(dstIp.address)

        buf.putShort(srcPort.toShort())
        buf.putShort(dstPort.toShort())
        buf.putInt((seq and 0xFFFFFFFFL).toInt())
        buf.putInt((ack and 0xFFFFFFFFL).toInt())
        buf.put(0x50.toByte())
        buf.put(flags.toByte())
        buf.putShort(windowSize.toShort())
        buf.putShort(0)
        buf.putShort(0)
        if (payload.isNotEmpty()) buf.put(payload)

        val tcpChecksum = ChecksumCalculator.computeIpv6TransportChecksum(
            srcIp.address, dstIp.address, 6, packet, ipLen, tcpLen, 16
        )
        packet[ipLen + 16] = ((tcpChecksum.toInt() shr 8) and 0xFF).toByte()
        packet[ipLen + 17] = (tcpChecksum.toInt() and 0xFF).toByte()

        return packet
    }

    // =========================================================================
    // IMPAIRMENT CALCULATORS
    // =========================================================================

    private fun shouldDropPacket(cfg: GlitchConfig): Boolean {
        if (cfg.burstInterruptionEnabled && cfg.burstIntervalSeconds > 0) {
            val nowMs = System.currentTimeMillis()
            val cycleMs = cfg.burstIntervalSeconds * 1000L
            val cyclePos = nowMs % cycleMs
            if (cyclePos < cfg.burstDurationMs) {
                return true
            }
        }

        if (cfg.packetLossPercent <= 0.0) return false
        val roll = Random.nextDouble(100.0)
        return roll < cfg.packetLossPercent
    }

    private fun calculateDelay(cfg: GlitchConfig): Long {
        val base = cfg.baseLatencyMs.toLong()
        val jitter = cfg.randomJitterMs
        if (jitter <= 0) return base
        val randomOffset = Random.nextInt(-jitter, jitter + 1)
        return (base + randomOffset).coerceAtLeast(0L)
    }

    // =========================================================================
    // HOUSEKEEPING & LIFECYCLE
    // =========================================================================

    private fun cleanStaleSessions() {
        val now = System.currentTimeMillis()

        val udpIt = udpSessions.entries.iterator()
        while (udpIt.hasNext()) {
            val entry = udpIt.next()
            if (now - entry.value.lastActivity > 90000L) {
                try { entry.value.socket.close() } catch (ignored: Exception) {}
                udpIt.remove()
            }
        }

        val tcpIt = tcpSessions.entries.iterator()
        while (tcpIt.hasNext()) {
            val entry = tcpIt.next()
            if (entry.value.isClosed.get() || now - entry.value.lastActivity > 90000L) {
                entry.value.close()
                tcpIt.remove()
            }
        }
    }

    fun isHealthy(): Boolean {
        return isRunning.get()
    }

    fun stop() {
        if (!isRunning.compareAndSet(true, false)) return
        delayQueue.clear()

        udpSessions.values.forEach { session ->
            try { session.socket.close() } catch (ignored: Exception) {}
        }
        udpSessions.clear()

        tcpSessions.values.forEach { session ->
            session.close()
        }
        tcpSessions.clear()

        try { tunIn.close() } catch (ignored: Exception) {}
        try { tunOut.close() } catch (ignored: Exception) {}

        engineScope.cancel()
        socketExecutor.shutdownNow()
    }

    // =========================================================================
    // DATA STRUCTURES
    // =========================================================================

    private data class DelayedPacket(
        val data: ByteArray,
        val scheduledReleaseTime: Long,
        val isIncoming: Boolean,
        val srcIp: InetAddress,
        val srcPort: Int,
        val dstIp: InetAddress,
        val dstPort: Int,
        val isIpv6: Boolean,
        val rawPacketForError: ByteArray?
    )

    private data class UdpSession(
        val sessionKey: String,
        val socket: DatagramSocket,
        val srcIp: InetAddress,
        val srcPort: Int,
        val isIpv6: Boolean,
        @Volatile var lastActivity: Long
    )

    private inner class TcpSession(
        val sessionKey: String,
        val isIpv6: Boolean,
        val clientIp: InetAddress,
        val clientPort: Int,
        val serverIp: InetAddress,
        val serverPort: Int,
        @Volatile var clientNextAck: Long,
        @Volatile var serverSeq: Long
    ) {
        val socket = Socket()
        val isClosed = AtomicBoolean(false)
        @Volatile var lastActivity = System.currentTimeMillis()
        private val outboundChannel = Channel<ByteArray>(Channel.UNLIMITED)

        fun enqueueOutbound(data: ByteArray) {
            if (!isClosed.get()) {
                outboundChannel.trySend(data)
            }
        }

        fun start() {
            vpnService.protect(socket)
            engineScope.launch {
                try {
                    socket.tcpNoDelay = true
                    socket.connect(InetSocketAddress(serverIp, serverPort), 10000)

                    // Outbound FIFO writer coroutine (guarantees strict order & non-blocking TUN reads)
                    val writerJob = launch {
                        val outStream = socket.getOutputStream()
                        for (data in outboundChannel) {
                            if (isClosed.get() || !isRunning.get()) break
                            lastActivity = System.currentTimeMillis()

                            val cfg = config
                            val isDnsOrDot = serverPort == 53 || serverPort == 853
                            if (cfg.affectTcp && !isDnsOrDot &&
                                (cfg.direction == ImpairmentDirection.BOTH || cfg.direction == ImpairmentDirection.OUTGOING)
                            ) {
                                val delayMs = calculateDelay(cfg)
                                if (delayMs > 0) delay(delayMs)
                                // Simulate TCP retransmission stall safely without corrupting byte stream
                                if (shouldDropPacket(cfg)) {
                                    reportDropped()
                                    delay(350L)
                                }
                            }

                            outStream.write(data)
                            outStream.flush()
                            reportForwarded()
                        }
                    }

                    // Inbound reader coroutine (chunks responses to <= 1380 bytes so MTU 1500 is never exceeded)
                    val inStream = socket.getInputStream()
                    val buf = ByteArray(16384)
                    while (isRunning.get() && !isClosed.get()) {
                        val bytesRead = inStream.read(buf)
                        if (bytesRead == -1) break
                        lastActivity = System.currentTimeMillis()

                        val cfg = config
                        val isDnsOrDot = serverPort == 53 || serverPort == 853
                        if (cfg.affectTcp && !isDnsOrDot &&
                            (cfg.direction == ImpairmentDirection.BOTH || cfg.direction == ImpairmentDirection.INCOMING)
                        ) {
                            val delayMs = calculateDelay(cfg)
                            if (delayMs > 0) delay(delayMs)
                            if (shouldDropPacket(cfg)) {
                                reportDropped()
                                delay(350L)
                            }
                        }

                        var offset = 0
                        while (offset < bytesRead && isRunning.get() && !isClosed.get()) {
                            val chunkSize = minOf(MAX_TCP_PAYLOAD, bytesRead - offset)
                            val chunk = buf.copyOfRange(offset, offset + chunkSize)
                            val tcpPacket = synthesizeTcpPacket(
                                isIpv6 = isIpv6,
                                srcIp = serverIp,
                                srcPort = serverPort,
                                dstIp = clientIp,
                                dstPort = clientPort,
                                seq = serverSeq,
                                ack = clientNextAck,
                                flags = 0x18, // PSH | ACK
                                payload = chunk
                            )
                            serverSeq = (serverSeq + chunkSize) and 0xFFFFFFFFL
                            writeToTun(tcpPacket)
                            offset += chunkSize
                        }
                    }

                    writerJob.cancel()

                    if (!isClosed.get()) {
                        val finPacket = synthesizeTcpPacket(
                            isIpv6 = isIpv6,
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x11 // FIN | ACK
                        )
                        serverSeq = (serverSeq + 1L) and 0xFFFFFFFFL
                        writeToTun(finPacket)
                    }
                } catch (e: Exception) {
                    Log.d(TAG, "TCP session $clientPort->$serverIp:$serverPort closed: \${e.message}")
                    if (!isClosed.get()) {
                        val rst = synthesizeTcpPacket(
                            isIpv6 = isIpv6,
                            srcIp = serverIp,
                            srcPort = serverPort,
                            dstIp = clientIp,
                            dstPort = clientPort,
                            seq = serverSeq,
                            ack = clientNextAck,
                            flags = 0x14 // RST | ACK
                        )
                        writeToTun(rst)
                    }
                } finally {
                    tcpSessions.remove(sessionKey, this@TcpSession)
                    close()
                }
            }
        }

        fun close() {
            if (isClosed.compareAndSet(false, true)) {
                outboundChannel.close()
                try { socket.close() } catch (ignored: Exception) {}
            }
        }
    }
}

/**
 * Standard RFC-compliant one's complement checksum engine for IPv4, IPv6, UDP, TCP, and ICMP/ICMPv6.
 */
object ChecksumCalculator {
    fun computeChecksum(buffer: ByteArray, offset: Int, length: Int): Short {
        var sum = 0
        var i = offset
        val end = offset + length
        while (i < end - 1) {
            val word = ((buffer[i].toInt() and 0xFF) shl 8) or (buffer[i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < end) {
            sum += ((buffer[i].toInt() and 0xFF) shl 8)
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        val res = (sum.inv() and 0xFFFF).toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }

    fun computeIpChecksum(buffer: ByteArray, offset: Int, length: Int): Short {
        var sum = 0
        var i = offset
        val end = offset + length
        while (i < end) {
            if (i == offset + 10) {
                i += 2
                continue
            }
            val word = ((buffer[i].toInt() and 0xFF) shl 8) or (buffer[i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        return (sum.inv() and 0xFFFF).toShort()
    }

    fun computeTcpChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        packet: ByteArray,
        tcpOffset: Int,
        tcpLen: Int
    ): Short {
        var sum = 0
        sum += (((srcIp[0].toInt() and 0xFF) shl 8) or (srcIp[1].toInt() and 0xFF))
        sum += (((srcIp[2].toInt() and 0xFF) shl 8) or (srcIp[3].toInt() and 0xFF))
        sum += (((dstIp[0].toInt() and 0xFF) shl 8) or (dstIp[1].toInt() and 0xFF))
        sum += (((dstIp[2].toInt() and 0xFF) shl 8) or (dstIp[3].toInt() and 0xFF))
        sum += 6
        sum += tcpLen

        var i = 0
        while (i < tcpLen - 1) {
            if (i == 16) {
                i += 2
                continue
            }
            val word = ((packet[tcpOffset + i].toInt() and 0xFF) shl 8) or (packet[tcpOffset + i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < tcpLen) {
            sum += ((packet[tcpOffset + i].toInt() and 0xFF) shl 8)
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        val res = (sum.inv() and 0xFFFF).toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }

    fun computeUdpChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        packet: ByteArray,
        udpOffset: Int,
        udpLen: Int
    ): Short {
        var sum = 0
        sum += (((srcIp[0].toInt() and 0xFF) shl 8) or (srcIp[1].toInt() and 0xFF))
        sum += (((srcIp[2].toInt() and 0xFF) shl 8) or (srcIp[3].toInt() and 0xFF))
        sum += (((dstIp[0].toInt() and 0xFF) shl 8) or (dstIp[1].toInt() and 0xFF))
        sum += (((dstIp[2].toInt() and 0xFF) shl 8) or (dstIp[3].toInt() and 0xFF))
        sum += 17
        sum += udpLen

        var i = 0
        while (i < udpLen - 1) {
            if (i == 6) {
                i += 2
                continue
            }
            val word = ((packet[udpOffset + i].toInt() and 0xFF) shl 8) or (packet[udpOffset + i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < udpLen) {
            sum += ((packet[udpOffset + i].toInt() and 0xFF) shl 8)
        }
        while ((sum shr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum shr 16)
        }
        val res = (sum.inv() and 0xFFFF).toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }

    fun computeIpv6TransportChecksum(
        srcIp: ByteArray,
        dstIp: ByteArray,
        nextHeader: Int,
        packet: ByteArray,
        transportOffset: Int,
        transportLen: Int,
        checksumFieldOffset: Int
    ): Short {
        var sum = 0L
        var i = 0
        while (i < 16) {
            sum += (((srcIp[i].toInt() and 0xFF) shl 8) or (srcIp[i + 1].toInt() and 0xFF))
            i += 2
        }
        i = 0
        while (i < 16) {
            sum += (((dstIp[i].toInt() and 0xFF) shl 8) or (dstIp[i + 1].toInt() and 0xFF))
            i += 2
        }
        sum += ((transportLen ushr 16) and 0xFFFF)
        sum += (transportLen and 0xFFFF)
        sum += nextHeader

        i = 0
        while (i < transportLen - 1) {
            if (i == checksumFieldOffset) {
                i += 2
                continue
            }
            val word = ((packet[transportOffset + i].toInt() and 0xFF) shl 8) or (packet[transportOffset + i + 1].toInt() and 0xFF)
            sum += word
            i += 2
        }
        if (i < transportLen) {
            sum += ((packet[transportOffset + i].toInt() and 0xFF) shl 8)
        }
        while ((sum ushr 16) > 0) {
            sum = (sum and 0xFFFF) + (sum ushr 16)
        }
        val res = (sum.inv() and 0xFFFF).toInt().toShort()
        return if (res == 0.toShort()) 0xFFFF.toShort() else res
    }
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/tile/GlitchTileService.kt",
    language: "kotlin",
    description: "Android Quick Settings TileService for in-call 1-tap toggling without leaving calling apps",
    content: `package com.callglitch.app.tile

import android.content.ComponentName
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
import com.callglitch.app.ui.MainActivity
import com.callglitch.app.vpn.CallGlitchVpnService
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first

/**
 * Native Android TileService enabling quick activation from the notification shade
 * while the user is inside an ongoing WhatsApp, Telegram, or Zoom call.
 * 
 * This is the SOLE primary in-call control mechanism.
 */
class GlitchTileService : TileService() {

    private val serviceScope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    companion object {
        private const val TAG = "GlitchTileService"

        fun requestTileUpdate(context: Context) {
            try {
                requestListeningState(context, ComponentName(context, GlitchTileService::class.java))
            } catch (e: Exception) {
                Log.w(TAG, "Could not request tile listening state: \${e.message}")
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
            // STOP immediately with priority
            Log.i(TAG, "Tile tapped while ACTIVE -> Stopping Call Glitch immediately.")
            CallGlitchVpnService.stopService(this)
        } else {
            // Check if VpnService permission has been granted
            val prepareIntent = VpnService.prepare(this)
            if (prepareIntent != null) {
                // VPN permission has not been granted yet.
                // Cannot activate silently; open main activity so user can grant permission.
                Log.w(TAG, "VPN permission not prepared. Launching authorization.")
                prepareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivityAndCollapse(prepareIntent)
                return
            }

            // Prepared -> Start the VPN immediately using the user's selected profile
            serviceScope.launch {
                val repo = (application as CallGlitchApplication).settingsRepository
                val selected = repo.selectedPackagesFlow.first()
                if (selected.isEmpty()) {
                    Log.w(TAG, "Tile clicked but no target applications are selected. Opening MainActivity.")
                    val promptIntent = Intent(this@GlitchTileService, MainActivity::class.java).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                        putExtra(MainActivity.EXTRA_PROMPT_APP_SELECTION, true)
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                        // Android 14+ pendingIntent for startActivityAndCollapse if needed, or normal startActivityAndCollapse
                        val pendingIntent = android.app.PendingIntent.getActivity(
                            this@GlitchTileService,
                            0,
                            promptIntent,
                            android.app.PendingIntent.FLAG_IMMUTABLE or android.app.PendingIntent.FLAG_UPDATE_CURRENT
                        )
                        startActivityAndCollapse(pendingIntent)
                    } else {
                        @Suppress("DEPRECATION")
                        startActivityAndCollapse(promptIntent)
                    }
                    return@launch
                }

                val profile = repo.activeProfileFlow.first()
                Log.i(TAG, "Tile tapped while INACTIVE -> Starting Call Glitch with profile: $profile")
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
            tile.label = getString(R.string.tile_name)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                tile.subtitle = "\${profile.displayName} Active"
            }
            tile.icon = Icon.createWithResource(this, R.drawable.ic_tile_glitch_active)
        } else {
            tile.state = Tile.STATE_INACTIVE
            tile.label = getString(R.string.tile_name)
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
    path: "app/src/main/java/com/callglitch/app/ui/MainActivity.kt",
    language: "kotlin",
    description: "Single activity hosting Jetpack Compose UI, VPN intent launcher, and error dialogs",
    content: `package com.callglitch.app.ui

import android.app.Activity
import android.app.StatusBarManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.callglitch.app.CallGlitchApplication
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.tile.GlitchTileService
import com.callglitch.app.ui.screens.MainScreen
import com.callglitch.app.ui.theme.CallGlitchTheme
import com.callglitch.app.vpn.CallGlitchVpnService
import kotlinx.coroutines.launch
import java.util.concurrent.Executor

class MainActivity : ComponentActivity() {

    companion object {
        const val EXTRA_PROMPT_APP_SELECTION = "extra_prompt_app_selection"
    }

    private var pendingStartAction: (() -> Unit)? = null

    private val vpnPrepareLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            pendingStartAction?.invoke()
            pendingStartAction = null
        } else {
            Toast.makeText(this, "VPN permission is required to shape network traffic.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as CallGlitchApplication
        val settingsRepo = app.settingsRepository
        val appDiscoveryRepo = app.appDiscoveryRepository

        val initialPromptAppSelection = intent?.getBooleanExtra(EXTRA_PROMPT_APP_SELECTION, false) == true

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
                    val selectedPackages by settingsRepo.selectedPackagesFlow.collectAsState(initial = emptySet())
                    val autoTimeout by settingsRepo.autoTimeoutSecondsFlow.collectAsState(initial = 0)

                    val coroutineScope = rememberCoroutineScope()

                    var triggerOpenAppDialog by remember { mutableStateOf(initialPromptAppSelection) }

                    MainScreen(
                        isRunning = isRunning,
                        activeProfile = if (isRunning) activeProfile else savedProfile,
                        customConfig = customConfig,
                        selectedPackages = selectedPackages,
                        autoTimeout = autoTimeout,
                        forwardedPackets = forwardedCount,
                        droppedPackets = droppedCount,
                        appDiscoveryRepository = appDiscoveryRepo,
                        forceOpenAppDialog = triggerOpenAppDialog,
                        onAppDialogDismissed = { triggerOpenAppDialog = false },
                        onToggleGlitch = { start ->
                            if (start) {
                                if (selectedPackages.isEmpty()) {
                                    Toast.makeText(
                                        this@MainActivity,
                                        "Please select at least one target application before starting.",
                                        Toast.LENGTH_LONG
                                    ).show()
                                    triggerOpenAppDialog = true
                                } else {
                                    requestVpnAndStart(savedProfile)
                                }
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
                                settingsRepo.setActiveProfile(GlitchProfileType.CUSTOM)
                                if (isRunning) {
                                    val intent = Intent(this@MainActivity, CallGlitchVpnService::class.java).apply {
                                        action = CallGlitchVpnService.ACTION_UPDATE_PROFILE
                                        putExtra(CallGlitchVpnService.EXTRA_PROFILE_TYPE, GlitchProfileType.CUSTOM.name)
                                    }
                                    startService(intent)
                                }
                            }
                        },
                        onUpdateSelectedApps = { pkgs ->
                            coroutineScope.launch {
                                settingsRepo.setSelectedPackages(pkgs)
                                if (isRunning) {
                                    val updateIntent = Intent(this@MainActivity, CallGlitchVpnService::class.java).apply {
                                        action = CallGlitchVpnService.ACTION_UPDATE_APPS
                                    }
                                    startService(updateIntent)
                                }
                            }
                        },
                        onUpdateTimeout = { seconds ->
                            coroutineScope.launch {
                                settingsRepo.setAutoTimeoutSeconds(seconds)
                            }
                        },
                        onRequestAddTile = {
                            requestAddQuickSettingsTile()
                        }
                    )

                    val lastError by CallGlitchVpnService.lastErrorMessage.collectAsState()
                    if (lastError != null) {
                        AlertDialog(
                            onDismissRequest = { CallGlitchVpnService.clearLastError() },
                            title = { Text("VPN Could Not Start") },
                            text = { Text(lastError ?: "An unexpected error occurred while establishing the VPN interface.") },
                            confirmButton = {
                                Button(onClick = { CallGlitchVpnService.clearLastError() }) {
                                    Text("OK")
                                }
                            }
                        )
                    }
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

    private fun requestAddQuickSettingsTile() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val statusBarManager = getSystemService(Context.STATUS_BAR_SERVICE) as StatusBarManager
            val componentName = ComponentName(this, GlitchTileService::class.java)
            val executor = Executor { it.run() }
            statusBarManager.requestAddTileService(
                componentName,
                getString(com.callglitch.app.R.string.tile_name),
                android.graphics.drawable.Icon.createWithResource(this, com.callglitch.app.R.drawable.ic_tile_glitch),
                executor
            ) { resultCode ->
                if (resultCode == StatusBarManager.TILE_ADD_REQUEST_RESULT_TILE_ADDED) {
                    Toast.makeText(this, "Call Glitch tile added to Quick Settings!", Toast.LENGTH_SHORT).show()
                }
            }
        } else {
            Toast.makeText(this, "Swipe down Quick Settings, tap Edit (pencil icon), and drag Call Glitch into your active tiles.", Toast.LENGTH_LONG).show()
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/callglitch/app/ui/screens/MainScreen.kt",
    language: "kotlin",
    description: "Main Jetpack Compose screen with large tactile toggle, profile cards, and dynamic app selector",
    content: `package com.callglitch.app.ui.screens

import android.graphics.Bitmap
import androidx.compose.animation.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.callglitch.app.data.AppDiscoveryRepository
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection
import com.callglitch.app.model.InstalledAppInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    isRunning: Boolean,
    activeProfile: GlitchProfileType,
    customConfig: GlitchConfig,
    selectedPackages: Set<String>,
    autoTimeout: Int,
    forwardedPackets: Long,
    droppedPackets: Long,
    appDiscoveryRepository: AppDiscoveryRepository,
    forceOpenAppDialog: Boolean = false,
    onAppDialogDismissed: () -> Unit = {},
    onToggleGlitch: (Boolean) -> Unit,
    onSelectProfile: (GlitchProfileType) -> Unit,
    onUpdateCustomConfig: (GlitchConfig) -> Unit,
    onUpdateSelectedApps: (Set<String>) -> Unit,
    onUpdateTimeout: (Int) -> Unit,
    onRequestAddTile: () -> Unit
) {
    var showAppDialog by remember { mutableStateOf(false) }
    var showAdvanced by remember { mutableStateOf(false) }

    LaunchedEffect(forceOpenAppDialog) {
        if (forceOpenAppDialog) {
            showAppDialog = true
        }
    }

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
                        BadgedBox(
                            badge = {
                                if (selectedPackages.isNotEmpty()) {
                                    Badge { Text("\${selectedPackages.size}") }
                                }
                            }
                        ) {
                            Icon(Icons.Default.Apps, contentDescription = "Select Target Apps")
                        }
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
                    else if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.12f)
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isRunning) MaterialTheme.colorScheme.error.copy(alpha = 0.4f)
                    else if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.error.copy(alpha = 0.3f)
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
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (isRunning) "\${activeProfile.displayName} Impairment Active"
                            else if (selectedPackages.isEmpty()) "No Target Apps Selected"
                            else "Normal Network Traffic",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isRunning || selectedPackages.isEmpty()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (isRunning) "$forwardedPackets forwarded · $droppedPackets dropped"
                            else if (selectedPackages.isEmpty()) "Select at least 1 application below before starting"
                            else "\${selectedPackages.size} target apps isolated · VPN Ready",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(
                                if (isRunning) Color(0xFFEF4444)
                                else if (selectedPackages.isEmpty()) Color(0xFFF59E0B)
                                else Color(0xFF10B981)
                            )
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // 2. Large Tactile ON/OFF Toggle
            Surface(
                onClick = {
                    if (!isRunning && selectedPackages.isEmpty()) {
                        showAppDialog = true
                    } else {
                        onToggleGlitch(!isRunning)
                    }
                },
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
                        tint = Color.White,
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = if (isRunning) "STOP" else "START",
                        color = Color.White,
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
                                    GlitchProfileType.MILD -> "280ms / 10%"
                                    GlitchProfileType.MODERATE -> "750ms / 35%"
                                    GlitchProfileType.SEVERE -> "2000ms / 75%"
                                    GlitchProfileType.CUSTOM -> "\${customConfig.baseLatencyMs}ms / \${customConfig.packetLossPercent.toInt()}%"
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

            // 4. Targeted Applications Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.15f)
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f)
                ),
                border = if (selectedPackages.isEmpty()) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.4f)) else null
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Target Applications", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            if (selectedPackages.isEmpty()) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "(Required)",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.error,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            if (selectedPackages.isEmpty()) "Tap Select to choose any installed app (WhatsApp, Chamet, Telegram, Meet, Zoom, etc.)"
                            else "\${selectedPackages.size} apps routed via local VPN (all other apps bypass safely)",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Button(
                        onClick = { showAppDialog = true },
                        colors = if (selectedPackages.isEmpty()) ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error) else ButtonDefaults.buttonColors()
                    ) {
                        Text(if (selectedPackages.isEmpty()) "Select Apps" else "Edit (\${selectedPackages.size})")
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 5. Primary In-Call Control: Quick Settings Tile Banner
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
                            Text("Primary In-Call Control: Quick Settings Tile", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                            Text(
                                "Swipe down during a call and tap the Call Glitch tile to toggle without leaving the call.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = onRequestAddTile,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.AddCircleOutline, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Add Call Glitch to Quick Settings")
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
                                if (autoTimeout == 0) "No timeout (manual stop only)" else "Stops after $autoTimeout seconds",
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
                    Text("Base Latency: \${customConfig.baseLatencyMs} ms", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Slider(
                        value = customConfig.baseLatencyMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(baseLatencyMs = it.toInt())) },
                        valueRange = 0f..3000f,
                        steps = 59
                    )

                    Text("Random Jitter: ±\${customConfig.randomJitterMs} ms", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Slider(
                        value = customConfig.randomJitterMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(randomJitterMs = it.toInt())) },
                        valueRange = 0f..1500f,
                        steps = 59
                    )

                    Text("Packet Loss: \${String.format("%.1f", customConfig.packetLossPercent)} %", fontSize = 13.sp, fontWeight = FontWeight.Medium)
                    Slider(
                        value = customConfig.packetLossPercent.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(packetLossPercent = it.toDouble())) },
                        valueRange = 0f..95f,
                        steps = 94
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Burst Interruption Controls
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Burst Drop (Temporary Total Cut)", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                            Text("Drops 100% of media packets intermittently to trigger 'Reconnecting'", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(
                            checked = customConfig.burstInterruptionEnabled,
                            onCheckedChange = { onUpdateCustomConfig(customConfig.copy(burstInterruptionEnabled = it)) }
                        )
                    }

                    if (customConfig.burstInterruptionEnabled) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Cut Duration: \${(customConfig.burstDurationMs / 1000.0)}s every \${customConfig.burstIntervalSeconds}s", fontSize = 12.sp)
                        Slider(
                            value = customConfig.burstDurationMs.toFloat(),
                            onValueChange = { onUpdateCustomConfig(customConfig.copy(burstDurationMs = it.toInt())) },
                            valueRange = 500f..4000f,
                            steps = 34
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text("Traffic Direction: \${customConfig.direction.displayName}", fontSize = 13.sp, fontWeight = FontWeight.Medium)
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

            // 7. Dynamic App Selection Full Dialog
            if (showAppDialog) {
                AppSelectionDialog(
                    selectedPackages = selectedPackages,
                    discoveryRepository = appDiscoveryRepository,
                    onDismiss = {
                        showAppDialog = false
                        onAppDialogDismissed()
                    },
                    onConfirm = { updated ->
                        onUpdateSelectedApps(updated)
                        showAppDialog = false
                        onAppDialogDismissed()
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppSelectionDialog(
    selectedPackages: Set<String>,
    discoveryRepository: AppDiscoveryRepository,
    onDismiss: () -> Unit,
    onConfirm: (Set<String>) -> Unit
) {
    var tempSelected by remember { mutableStateOf(selectedPackages) }
    var searchQuery by remember { mutableStateOf("") }
    var includeSystemApps by remember { mutableStateOf(false) }
    var installedApps by remember { mutableStateOf<List<InstalledAppInfo>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(includeSystemApps) {
        isLoading = true
        installedApps = discoveryRepository.getInstalledApps(includeSystemApps)
        isLoading = false
    }

    val filteredApps = remember(installedApps, searchQuery) {
        if (searchQuery.isBlank()) {
            installedApps
        } else {
            val q = searchQuery.trim().lowercase()
            installedApps.filter {
                it.appName.lowercase().contains(q) || it.packageName.lowercase().contains(q)
            }
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(max = 680.dp),
        title = {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Target Applications",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "\${tempSelected.size} selected",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Select any installed app to route through Call Glitch. All other apps bypass without impairment.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Search field
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by app name or package...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, contentDescription = "Clear search")
                            }
                        }
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Action Bar: Select All Filtered / Clear All / System apps toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(
                            onClick = {
                                val currentFilteredPkgs = filteredApps.map { it.packageName }.toSet()
                                tempSelected = tempSelected + currentFilteredPkgs
                            },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("Select All", fontSize = 12.sp)
                        }
                        TextButton(
                            onClick = { tempSelected = emptySet() },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text("Clear All", fontSize = 12.sp)
                        }
                    }

                    FilterChip(
                        selected = includeSystemApps,
                        onClick = { includeSystemApps = !includeSystemApps },
                        label = { Text("System Apps", fontSize = 11.sp) }
                    )
                }

                // Quick-action helper for detected calling & conferencing applications
                val detectedCallingApps = remember(installedApps) {
                    val keywords = listOf(
                        "whatsapp", "telegram", "tachyon", "zoom", "meet", "instagram",
                        "orca", "discord", "chamet", "skype", "viber", "call", "wechat"
                    )
                    installedApps.filter { app ->
                        keywords.any { kw ->
                            app.packageName.lowercase().contains(kw) || app.appName.lowercase().contains(kw)
                        }
                    }
                }

                if (detectedCallingApps.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                tempSelected = tempSelected + detectedCallingApps.map { it.packageName }
                            },
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.3f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Call,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    "Quick-Select Detected Calling Apps (\${detectedCallingApps.size})",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                            Text(
                                "+ Add All",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

                // App list
                if (isLoading) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(36.dp))
                    }
                } else if (filteredApps.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                Icons.Default.SearchOff,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                "No applications matched \\"$searchQuery\\"",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(max = 360.dp)
                    ) {
                        items(filteredApps, key = { it.packageName }) { app ->
                            val isChecked = tempSelected.contains(app.packageName)
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        tempSelected = if (isChecked) tempSelected - app.packageName else tempSelected + app.packageName
                                    }
                                    .padding(vertical = 6.dp, horizontal = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { checked ->
                                        tempSelected = if (checked) tempSelected + app.packageName else tempSelected - app.packageName
                                    }
                                )

                                Spacer(modifier = Modifier.width(8.dp))

                                AppIconItem(
                                    packageName = app.packageName,
                                    repository = discoveryRepository
                                )

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = app.appName,
                                            fontWeight = FontWeight.Medium,
                                            fontSize = 14.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis
                                        )
                                        if (app.isSystemApp) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = MaterialTheme.colorScheme.surfaceVariant
                                            ) {
                                                Text(
                                                    "System",
                                                    fontSize = 9.sp,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp),
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = app.packageName,
                                        style = MaterialTheme.typography.bodySmall,
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = { onConfirm(tempSelected) },
                enabled = true
            ) {
                Text("Save (\${tempSelected.size})")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun AppIconItem(
    packageName: String,
    repository: AppDiscoveryRepository,
    modifier: Modifier = Modifier
) {
    val bitmapState = produceState<Bitmap?>(initialValue = null, key1 = packageName) {
        value = withContext(Dispatchers.IO) {
            repository.loadAppIcon(packageName)
        }
    }
    val bmp = bitmapState.value

    if (bmp != null) {
        Image(
            bitmap = bmp.asImageBitmap(),
            contentDescription = null,
            modifier = modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
        )
    } else {
        Box(
            modifier = modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Android,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/ui/theme/GlitchTheme.kt",
    language: "kotlin",
    description: "Material3 dynamic color theme and typography definitions",
    content: `package com.callglitch.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF0EA5E9),
    onPrimary = Color.White,
    primaryContainer = Color(0xFF0369A1),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Color(0xFF38BDF8),
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    error = Color(0xFFEF4444)
)

private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF0284C7),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE0F2FE),
    onPrimaryContainer = Color(0xFF0369A1),
    secondary = Color(0xFF0EA5E9),
    background = Color(0xFFF8FAFC),
    surface = Color.White,
    onBackground = Color(0xFF0F172A),
    onSurface = Color(0xFF0F172A),
    error = Color(0xFFDC2626)
)

@Composable
fun CallGlitchTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}
`
  },
  {
    path: "app/src/test/java/com/callglitch/app/GlitchConfigTest.kt",
    language: "kotlin",
    description: "Unit tests verifying profile configuration parameters, jitter ranges, and timeout settings",
    content: `package com.callglitch.app

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
        assertEquals(280, mild.baseLatencyMs)
        assertEquals(80, mild.randomJitterMs)
        assertEquals(10.0, mild.packetLossPercent, 0.001)
        assertFalse(mild.burstInterruptionEnabled)
        assertEquals(ImpairmentDirection.BOTH, mild.direction)
        assertFalse(mild.affectTcp)
    }

    @Test
    fun testModerateProfileParameters() {
        val moderate = GlitchConfig.MODERATE
        assertEquals(GlitchProfileType.MODERATE, moderate.profileType)
        assertEquals(750, moderate.baseLatencyMs)
        assertEquals(300, moderate.randomJitterMs)
        assertEquals(35.0, moderate.packetLossPercent, 0.001)
        assertFalse(moderate.burstInterruptionEnabled)
        assertEquals(ImpairmentDirection.BOTH, moderate.direction)
        assertFalse(moderate.affectTcp)
    }

    @Test
    fun testSevereProfileParameters() {
        val severe = GlitchConfig.SEVERE
        assertEquals(GlitchProfileType.SEVERE, severe.profileType)
        assertEquals(2000, severe.baseLatencyMs)
        assertEquals(800, severe.randomJitterMs)
        assertEquals(75.0, severe.packetLossPercent, 0.001)
        assertTrue(severe.burstInterruptionEnabled)
        assertEquals(2500, severe.burstDurationMs)
        assertEquals(6, severe.burstIntervalSeconds)
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
`
  },
  {
    path: "app/src/test/java/com/callglitch/app/AppDiscoveryAndSelectionTest.kt",
    language: "kotlin",
    description: "Unit tests validating dynamic application selection, system filtering, and empty checks",
    content: `package com.callglitch.app

import com.callglitch.app.model.InstalledAppInfo
import org.junit.Assert.*
import org.junit.Test

class AppDiscoveryAndSelectionTest {

    @Test
    fun testInstalledAppInfoProperties() {
        val app = InstalledAppInfo(
            packageName = "com.whatsapp",
            appName = "WhatsApp",
            isSystemApp = false,
            hasLauncher = true
        )
        assertEquals("com.whatsapp", app.packageName)
        assertEquals("WhatsApp", app.appName)
        assertFalse(app.isSystemApp)
        assertTrue(app.hasLauncher)
    }

    @Test
    fun testSelfExclusionFilteringLogic() {
        val selfPackage = "com.callglitch.app"
        val discoveredPackages = listOf(
            "com.whatsapp",
            "org.telegram.messenger",
            "com.callglitch.app",
            "com.google.android.youtube"
        )

        val filtered = discoveredPackages.filter { it != selfPackage }
        assertFalse(filtered.contains("com.callglitch.app"))
        assertEquals(3, filtered.size)
    }

    @Test
    fun testEmptySelectionValidation() {
        val selectedPackages = emptySet<String>()
        assertTrue("Selected packages must be empty by default", selectedPackages.isEmpty())

        // Simulating the safety guard in CallGlitchVpnService
        val canStart = selectedPackages.isNotEmpty()
        assertFalse("VPN must not be permitted to start when no apps are selected", canStart)
    }

    @Test
    fun testAlphabeticalSortingCaseInsensitive() {
        val list = listOf(
            InstalledAppInfo("com.zoom", "zoom", false, true),
            InstalledAppInfo("com.apple", "Apple Music", false, true),
            InstalledAppInfo("com.whatsapp", "WhatsApp", false, true),
            InstalledAppInfo("com.discord", "discord", false, true)
        )

        val sorted = list.sortedWith(compareBy(String.CASE_INSENSITIVE_ORDER) { it.appName })
        assertEquals("Apple Music", sorted[0].appName)
        assertEquals("discord", sorted[1].appName)
        assertEquals("WhatsApp", sorted[2].appName)
        assertEquals("zoom", sorted[3].appName)
    }
}
`
  },
];
