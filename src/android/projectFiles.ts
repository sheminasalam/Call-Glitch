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
        minSdk = 29
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
    implementation(files("libs/hev-socks5-tunnel-2.20.0.aar"))
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

enum class VpnLifecycleState(val label: String) {
    STOPPED("Stopped"),
    STARTING("Starting"),
    RUNNING("Running"),
    RECONFIGURING("Reconfiguring"),
    STOPPING("Stopping"),
    FAILED("Failed")
}

enum class ComponentHealthState(val label: String) {
    INACTIVE("Inactive"),
    STARTING("Starting"),
    RUNNING("Running"),
    FAILED("Failed"),
    STOPPED("Stopped")
}

data class DiagnosticsSnapshot(
    val vpnState: VpnLifecycleState = VpnLifecycleState.STOPPED,
    val tunnelState: ComponentHealthState = ComponentHealthState.INACTIVE,
    val proxyState: ComponentHealthState = ComponentHealthState.INACTIVE,
    val proxyPort: Int = 0,
    val activeTcpSessions: Int = 0,
    val activeUdpSessions: Int = 0,
    val forwardedUdpDatagrams: Long = 0L,
    val droppedUdpDatagrams: Long = 0L,
    val forwardedTcpBytes: Long = 0L,
    val delayedTcpWrites: Long = 0L,
    val throttledTcpEvents: Long = 0L,
    val tunnelTxPackets: Long = 0L,
    val tunnelTxBytes: Long = 0L,
    val tunnelRxPackets: Long = 0L,
    val tunnelRxBytes: Long = 0L,
    val lastError: String? = null,
    val lastErrorComponent: String? = null
) {
    val totalForwardedCount: Long
        get() = forwardedUdpDatagrams + delayedTcpWrites
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
    val affectTcp: Boolean = true,
    val tcpBandwidthKbps: Int = 0, // 0 means no explicit bandwidth cap (latency/jitter/pauses only)
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
            affectTcp = true,
            tcpBandwidthKbps = 1200
        )

        val MODERATE = GlitchConfig(
            profileType = GlitchProfileType.MODERATE,
            baseLatencyMs = 750,
            randomJitterMs = 300,
            packetLossPercent = 35.0,
            burstInterruptionEnabled = false,
            direction = ImpairmentDirection.BOTH,
            affectTcp = true,
            tcpBandwidthKbps = 384
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
            affectTcp = true,
            tcpBandwidthKbps = 64
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
        val CUSTOM_TCP_BANDWIDTH_KBPS = intPreferencesKey("custom_tcp_bandwidth_kbps")
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
                affectTcp = prefs[PreferencesKeys.CUSTOM_AFFECT_TCP] ?: true,
                tcpBandwidthKbps = prefs[PreferencesKeys.CUSTOM_TCP_BANDWIDTH_KBPS] ?: 0
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
            prefs[PreferencesKeys.CUSTOM_TCP_BANDWIDTH_KBPS] = config.tcpBandwidthKbps
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
    description: "Core Android VpnService managing TUN lifecycle, per-app routing, and foreground service",
    content: `package com.callglitch.app.vpn

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
                        Log.e(TAG, "Error updating profile: \${e.message}")
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
                        Log.e(TAG, "Error updating apps on active VPN: \${e.message}", e)
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
                        Log.e(TAG, "Failed to start Call Glitch VPN: \${result.exceptionOrNull()?.message}")
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
            setSession("CallGlitch: \${config.profileType.displayName}")
            // HevSocks5Tunnel uses non-blocking TUN I/O (ioctl FIONBIO).
            setBlocking(false)

            // Capture IPv6 default route and IPv6 DNS so dual-stack calling apps cannot bypass impairment.
            try {
                addAddress("fd00:ca11:911c::1", 64)
                addDnsServer("2001:4860:4860::8888")
                addRoute("::", 0)
            } catch (e: Exception) {
                Log.w(TAG, "IPv6 TUN route unavailable on this device, continuing with IPv4: \${e.message}")
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
                "None of the selected applications (\${selectedApps.joinToString()}) are currently installed on this device."
            )
        }

        val pfd = builder.establish()
            ?: throw IOException("VpnService.Builder.establish() returned null. Please verify VPN permission is approved.")

        Log.i(TAG, "Established VpnService TUN (fd=\${pfd.fd}, allowedApps=$allowedCount)")
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
            _lastErrorMessage.value = "$componentPrefix\${snapshot.lastError}"
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
            Log.e(TAG, "startForeground failed: \${e.message}", e)
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
            .setContentTitle("Call Glitch Active: \${profile.displayName}")
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
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/vpn/VpnSessionController.kt",
    language: "kotlin",
    description: "Serialized Mutex-guarded VPN/Tunnel/Proxy lifecycle state machine and health monitor",
    content: `package com.callglitch.app.vpn

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
            val msg = "Local SOCKS5 proxy failed to start: \${e.message ?: "unknown error"}"
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
            rollbackPartialStartup("HevSocks5Tunnel", "HevSocks5Tunnel threw on startup: \${e.message}")
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
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/vpn/TunnelEngine.kt",
    language: "kotlin",
    description: "TunnelEngine abstraction and HevTunnelEngine wrapping pinned heiher/hev-socks5-tunnel v2.20.0",
    content: `package com.callglitch.app.vpn

import hev.htproxy.TProxyService
import java.io.File

data class TunnelConfig(
    val tunFd: Int,
    val mtu: Int = 1500,
    val socks5Address: String = "127.0.0.1",
    val socks5Port: Int,
    val configFilePath: String
)

data class TunnelStats(
    val txPackets: Long = 0L,
    val txBytes: Long = 0L,
    val rxPackets: Long = 0L,
    val rxBytes: Long = 0L
)

/**
 * Adapter interface wrapping the native HevSocks5Tunnel engine so VPN lifecycle
 * management and failure recovery can be thoroughly unit-tested on the JVM.
 */
interface TunnelEngine {
    fun start(config: TunnelConfig): Boolean
    fun stop(): Boolean
    fun isRunning(): Boolean
    fun getStats(): TunnelStats
}

/**
 * Concrete TunnelEngine backed by pinned heiher/hev-socks5-tunnel v2.20.0 (hev.htproxy.TProxyService).
 *
 * FD ownership contract verified in upstream hev-socks5-tunnel.c (tunnel_init / tunnel_fini):
 * When given an external TUN FD, Hev never closes it. CallGlitchVpnService must keep the
 * ParcelFileDescriptor open while Hev is running, call stop() (which joins the worker thread),
 * and close the ParcelFileDescriptor once afterward.
 */
class HevTunnelEngine : TunnelEngine {

    override fun start(config: TunnelConfig): Boolean {
        val confFile = File(config.configFilePath)
        confFile.parentFile?.mkdirs()
        confFile.writeText(buildYamlConfig(config), Charsets.UTF_8)
        return TProxyService.TProxyStartService(confFile.absolutePath, config.tunFd)
    }

    override fun stop(): Boolean {
        return TProxyService.TProxyStopService()
    }

    override fun isRunning(): Boolean {
        return TProxyService.TProxyIsRunning()
    }

    override fun getStats(): TunnelStats {
        val raw = runCatching { TProxyService.TProxyGetStats() }.getOrNull() ?: return TunnelStats()
        if (raw.size < 4) return TunnelStats()
        return TunnelStats(
            txPackets = raw[0],
            txBytes = raw[1],
            rxPackets = raw[2],
            rxBytes = raw[3]
        )
    }

    companion object {
        fun buildYamlConfig(config: TunnelConfig): String {
            return buildString {
                appendLine("misc:")
                appendLine("  task-stack-size: 86016")
                appendLine("  udp-recv-buffer-size: 524288")
                appendLine("  udp-copy-buffer-nums: 10")
                appendLine("  connect-timeout: 10000")
                appendLine("  tcp-read-write-timeout: 300000")
                appendLine("  udp-read-write-timeout: 60000")
                appendLine("  log-level: warn")
                appendLine("tunnel:")
                appendLine("  mtu: \${config.mtu}")
                appendLine("  icmp: 'reply'")
                appendLine("socks5:")
                appendLine("  port: \${config.socks5Port}")
                appendLine("  address: '\${config.socks5Address}'")
                appendLine("  udp: 'udp'")
                appendLine("  pipeline: false")
            }
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/vpn/LocalSocks5ProxyServer.kt",
    language: "kotlin",
    description: "Loopback-only RFC 1928 SOCKS5 proxy (CONNECT + UDP ASSOCIATE, IPv4/IPv6/domain)",
    content: `package com.callglitch.app.vpn

import kotlinx.coroutines.*
import kotlinx.coroutines.channels.Channel
import java.io.EOFException
import java.io.IOException
import java.io.InputStream
import java.io.OutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.nio.ByteBuffer
import java.util.PriorityQueue
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.atomic.AtomicLong

/**
 * Local-only loopback SOCKS5 proxy (RFC 1928) executing inside Call Glitch.
 *
 * - Strictly bound to 127.0.0.1 (never exposed on Wi-Fi, cellular, or LAN interfaces).
 * - Supports NO AUTH (0x00), CONNECT (0x01), and UDP ASSOCIATE (0x03).
 * - Supports IPv4 (0x01), Domain Name (0x03), and IPv6 (0x04) target addressing.
 * - Enforces SocketProtector.protect() on every outbound TCP/UDP socket before connect/send.
 */
class LocalSocks5ProxyServer(
    private val impairmentController: ImpairmentController,
    private val socketProtector: SocketProtector,
    private val requestedPort: Int = 0,
    private val connectTimeoutMs: Int = 10_000,
    private val tcpBufferQueueCapacity: Int = 32,
    private val maxUdpQueuePerDirection: Int = 512,
    private val udpIdleTimeoutMs: Long = 120_000L,
    private val onError: (component: String, message: String) -> Unit = { _, _ -> }
) {
    private val running = AtomicBoolean(false)
    private val sessionSeq = AtomicLong(0)
    private val activeTcpCount = AtomicInteger(0)
    private val activeUdpCount = AtomicInteger(0)

    private var serverSocket: ServerSocket? = null
    private var executor = Executors.newCachedThreadPool()
    private var proxyDispatcher = executor.asCoroutineDispatcher()
    private var proxyScope = CoroutineScope(proxyDispatcher + SupervisorJob())
    private var acceptJob: Job? = null

    private val tcpSessions = ConcurrentHashMap<Long, TcpRelaySession>()
    private val udpSessions = ConcurrentHashMap<Long, UdpRelaySession>()

    @Volatile
    var port: Int = 0
        private set

    val isRunning: Boolean
        get() = running.get() && serverSocket?.isClosed == false && port > 0

    val activeTcpSessions: Int
        get() = activeTcpCount.get()

    val activeUdpSessions: Int
        get() = activeUdpCount.get()

    fun start(): Int {
        if (running.get()) {
            val existingPort = port
            if (existingPort > 0 && serverSocket?.isClosed == false) return existingPort
        }

        if (executor.isShutdown) {
            executor = Executors.newCachedThreadPool()
            proxyDispatcher = executor.asCoroutineDispatcher()
        }
        proxyScope = CoroutineScope(proxyDispatcher + SupervisorJob())

        val loopback = InetAddress.getByAddress(byteArrayOf(127, 0, 0, 1))
        val boundSocket = ServerSocket().apply {
            reuseAddress = true
            bind(InetSocketAddress(loopback, requestedPort), 128)
        }
        serverSocket = boundSocket
        port = boundSocket.localPort
        running.set(true)

        acceptJob = proxyScope.launch {
            while (running.get() && !boundSocket.isClosed) {
                try {
                    val client = boundSocket.accept()
                    val sessionId = sessionSeq.incrementAndGet()
                    proxyScope.launch {
                        handleClientConnection(sessionId, client)
                    }
                } catch (e: SocketException) {
                    if (running.get()) {
                        onError("LocalSocks5Proxy", "Accept loop socket error: \${e.message}")
                    }
                    break
                } catch (e: Exception) {
                    if (running.get()) {
                        onError("LocalSocks5Proxy", "Accept loop failure: \${e.message}")
                    }
                    break
                }
            }
        }
        return port
    }

    fun resetActiveSessionsOnNetworkChange() {
        tcpSessions.values.forEach { it.close() }
        udpSessions.values.forEach { it.close() }
    }

    fun stop() {
        if (!running.compareAndSet(true, false) && serverSocket == null) {
            return
        }
        try {
            serverSocket?.close()
        } catch (_: Exception) {
        } finally {
            serverSocket = null
            port = 0
        }

        acceptJob?.cancel()
        acceptJob = null

        tcpSessions.values.toList().forEach { it.close() }
        tcpSessions.clear()
        udpSessions.values.toList().forEach { it.close() }
        udpSessions.clear()

        proxyScope.cancel()
        executor.shutdownNow()
    }

    private suspend fun handleClientConnection(sessionId: Long, client: Socket) {
        try {
            client.tcpNoDelay = true
            client.soTimeout = 30_000

            val input = client.getInputStream()
            val output = client.getOutputStream()

            // 1. Method Negotiation: VER | NMETHODS | METHODS
            val ver = input.readByteUnsigned()
            if (ver != SOCKS_VERSION) {
                client.close()
                return
            }
            val nMethods = input.readByteUnsigned()
            val methods = input.readExact(nMethods)
            val supportsNoAuth = methods.any { (it.toInt() and 0xFF) == AUTH_NO_AUTH }
            if (!supportsNoAuth) {
                output.write(byteArrayOf(SOCKS_VERSION.toByte(), AUTH_NO_ACCEPTABLE.toByte()))
                output.flush()
                client.close()
                return
            }
            output.write(byteArrayOf(SOCKS_VERSION.toByte(), AUTH_NO_AUTH.toByte()))
            output.flush()

            // 2. Request: VER | CMD | RSV | ATYP | DST.ADDR | DST.PORT
            val reqHeader = input.readExact(4)
            if ((reqHeader[0].toInt() and 0xFF) != SOCKS_VERSION) {
                client.close()
                return
            }
            val cmd = reqHeader[1].toInt() and 0xFF
            val atyp = reqHeader[3].toInt() and 0xFF
            val target = readSocksAddress(input, atyp) ?: run {
                sendReply(output, REPLY_ADDRESS_TYPE_NOT_SUPPORTED, null, 0)
                client.close()
                return
            }

            when (cmd) {
                CMD_CONNECT -> handleTcpConnect(sessionId, client, input, output, target)
                CMD_UDP_ASSOCIATE -> handleUdpAssociate(sessionId, client, input, output)
                else -> {
                    sendReply(output, REPLY_COMMAND_NOT_SUPPORTED, null, 0)
                    client.close()
                }
            }
        } catch (_: EOFException) {
            runCatching { client.close() }
        } catch (_: SocketException) {
            runCatching { client.close() }
        } catch (e: Exception) {
            if (running.get()) {
                onError("LocalSocks5Proxy", "Client handshake error: \${e.message}")
            }
            runCatching { client.close() }
        }
    }

    private suspend fun handleTcpConnect(
        sessionId: Long,
        clientSocket: Socket,
        clientIn: InputStream,
        clientOut: OutputStream,
        target: SocksAddress
    ) {
        val targetAddr = try {
            withContext(Dispatchers.IO) {
                resolveTargetAddress(target)
            }
        } catch (e: Exception) {
            sendReply(clientOut, REPLY_HOST_UNREACHABLE, null, 0)
            runCatching { clientSocket.close() }
            return
        }

        val outbound = Socket()
        try {
            outbound.tcpNoDelay = true
            // Bind ephemeral wildcard endpoint matching target address family before protect()
            // so the native socket FD exists prior to VpnService.protect() and TCP SYN.
            val wildcardBind = if (targetAddr is Inet6Address) {
                InetSocketAddress(InetAddress.getByAddress(ByteArray(16)), 0)
            } else {
                InetSocketAddress(InetAddress.getByAddress(byteArrayOf(0, 0, 0, 0)), 0)
            }
            outbound.bind(wildcardBind)

            if (!socketProtector.protect(outbound)) {
                val msg = "VpnService.protect() rejected outbound TCP socket for \${targetAddr.hostAddress}:\${target.port}"
                onError("SocketProtector", msg)
                outbound.close()
                sendReply(clientOut, REPLY_GENERAL_FAILURE, null, 0)
                clientSocket.close()
                throw SocketProtectionException(msg)
            }

            withContext(Dispatchers.IO) {
                outbound.connect(InetSocketAddress(targetAddr, target.port), connectTimeoutMs)
            }

            clientSocket.soTimeout = 0
            outbound.soTimeout = 0

            sendReply(clientOut, REPLY_SUCCEEDED, outbound.localAddress, outbound.localPort)
        } catch (e: SocketProtectionException) {
            runCatching { outbound.close() }
            runCatching { clientSocket.close() }
            return
        } catch (e: Exception) {
            runCatching { sendReply(clientOut, REPLY_HOST_UNREACHABLE, null, 0) }
            runCatching { outbound.close() }
            runCatching { clientSocket.close() }
            return
        }

        val session = TcpRelaySession(
            id = sessionId,
            clientSocket = clientSocket,
            outboundSocket = outbound
        )
        tcpSessions[sessionId] = session
        activeTcpCount.incrementAndGet()

        try {
            coroutineScope {
                val uplink = launch {
                    relayTcpStream(
                        srcIn = clientIn,
                        dstOut = outbound.getOutputStream(),
                        dstSocket = outbound,
                        direction = TrafficDirection.OUTGOING,
                        session = session
                    )
                }
                val downlink = launch {
                    relayTcpStream(
                        srcIn = outbound.getInputStream(),
                        dstOut = clientOut,
                        dstSocket = clientSocket,
                        direction = TrafficDirection.INCOMING,
                        session = session
                    )
                }
                joinAll(uplink, downlink)
            }
        } finally {
            session.close()
            tcpSessions.remove(sessionId)
            activeTcpCount.decrementAndGet()
        }
    }

    private suspend fun relayTcpStream(
        srcIn: InputStream,
        dstOut: OutputStream,
        dstSocket: Socket,
        direction: TrafficDirection,
        session: TcpRelaySession
    ) {
        val channel = Channel<ByteArray>(capacity = tcpBufferQueueCapacity)
        var nextAvailableTxMs = impairmentController.nowMs()

        try {
            coroutineScope {
                val reader = launch {
                    val buffer = ByteArray(8192)
                    try {
                        while (isActive && !session.isClosed && running.get()) {
                            val read = srcIn.read(buffer)
                            if (read < 0) break
                            if (read > 0) {
                                channel.send(buffer.copyOf(read))
                            }
                        }
                    } catch (_: Exception) {
                    } finally {
                        channel.close()
                    }
                }

                val writer = launch {
                    try {
                        for (chunk in channel) {
                            while (isActive && !session.isClosed && running.get()) {
                                val plan = impairmentController.computeTcpWritePlan(
                                    direction = direction,
                                    byteCount = chunk.size,
                                    nextAvailableTxMs = nextAvailableTxMs
                                )
                                if (plan.inBurstPause) {
                                    delay(50L)
                                    continue
                                }

                                val waitMs = plan.releaseAtMs - impairmentController.nowMs()
                                if (waitMs > 0L) {
                                    // Sleep in short slices while allowing burst window updates or cancellation
                                    var remaining = waitMs
                                    while (remaining > 0L && isActive && !session.isClosed && running.get()) {
                                        val step = remaining.coerceAtMost(50L)
                                        delay(step)
                                        remaining = plan.releaseAtMs - impairmentController.nowMs()
                                        if (impairmentController.currentConfig.affectTcp &&
                                            impairmentController.isInBurstWindow()
                                        ) {
                                            break
                                        }
                                    }
                                    if (impairmentController.currentConfig.affectTcp &&
                                        impairmentController.isInBurstWindow()
                                    ) {
                                        continue
                                    }
                                }

                                dstOut.write(chunk)
                                if (channel.isEmpty) {
                                    dstOut.flush()
                                }
                                nextAvailableTxMs = plan.nextAvailableAtMs
                                impairmentController.recordTcpWrite(
                                    byteCount = chunk.size,
                                    appliedDelay = plan.appliedDelay,
                                    appliedThrottle = plan.appliedThrottle
                                )
                                break
                            }
                        }
                        runCatching {
                            if (!dstSocket.isClosed && !dstSocket.isOutputShutdown) {
                                dstSocket.shutdownOutput()
                            }
                        }
                    } catch (_: Exception) {
                        session.close()
                    }
                }

                joinAll(reader, writer)
            }
        } finally {
            channel.close()
        }
    }

    private suspend fun handleUdpAssociate(
        sessionId: Long,
        ctrlSocket: Socket,
        ctrlIn: InputStream,
        ctrlOut: OutputStream
    ) {
        val loopback = InetAddress.getByAddress(byteArrayOf(127, 0, 0, 1))
        val clientRelaySocket = try {
            DatagramSocket(0, loopback)
        } catch (e: Exception) {
            sendReply(ctrlOut, REPLY_GENERAL_FAILURE, null, 0)
            runCatching { ctrlSocket.close() }
            return
        }

        val outboundUdpSocket = try {
            DatagramSocket()
        } catch (e: Exception) {
            runCatching { clientRelaySocket.close() }
            sendReply(ctrlOut, REPLY_GENERAL_FAILURE, null, 0)
            runCatching { ctrlSocket.close() }
            return
        }

        if (!socketProtector.protect(outboundUdpSocket)) {
            val msg = "VpnService.protect() rejected outbound UDP socket"
            onError("SocketProtector", msg)
            runCatching { outboundUdpSocket.close() }
            runCatching { clientRelaySocket.close() }
            runCatching { sendReply(ctrlOut, REPLY_GENERAL_FAILURE, null, 0) }
            runCatching { ctrlSocket.close() }
            return
        }

        try {
            ctrlSocket.soTimeout = 0
            sendReply(ctrlOut, REPLY_SUCCEEDED, loopback, clientRelaySocket.localPort)
        } catch (e: Exception) {
            runCatching { outboundUdpSocket.close() }
            runCatching { clientRelaySocket.close() }
            runCatching { ctrlSocket.close() }
            return
        }

        val session = UdpRelaySession(
            id = sessionId,
            ctrlSocket = ctrlSocket,
            clientRelaySocket = clientRelaySocket,
            outboundUdpSocket = outboundUdpSocket,
            lastActivityMs = impairmentController.nowMs()
        )
        udpSessions[sessionId] = session
        activeUdpCount.incrementAndGet()

        val dnsCache = ConcurrentHashMap<String, InetAddress>()
        val outgoingQueue = UdpScheduledQueue(maxUdpQueuePerDirection)
        val incomingQueue = UdpScheduledQueue(maxUdpQueuePerDirection)

        try {
            coroutineScope {
                // 1. Control TCP connection EOF monitor (RFC 1928: UDP association ends when TCP closes)
                val ctrlWatcher = launch {
                    try {
                        val b = ByteArray(64)
                        while (isActive && !session.isClosed && running.get()) {
                            val r = ctrlIn.read(b)
                            if (r < 0) break
                        }
                    } catch (_: Exception) {
                    } finally {
                        session.close()
                    }
                }

                // 2. Idle watchdog
                val idleWatcher = launch {
                    while (isActive && !session.isClosed && running.get()) {
                        delay(10_000L.coerceAtMost(udpIdleTimeoutMs / 2).coerceAtLeast(500L))
                        if (impairmentController.nowMs() - session.lastActivityMs > udpIdleTimeoutMs) {
                            session.close()
                            break
                        }
                    }
                }

                // 3. Client -> Outbound UDP Reader
                val uplinkReader = launch {
                    val buf = ByteArray(65535)
                    val packet = DatagramPacket(buf, buf.size)
                    while (isActive && !session.isClosed && running.get()) {
                        try {
                            packet.length = buf.size
                            clientRelaySocket.receive(packet)
                            val srcAddr = packet.address ?: continue
                            if (!srcAddr.isLoopbackAddress) continue

                            session.clientPeer = InetSocketAddress(srcAddr, packet.port)
                            session.lastActivityMs = impairmentController.nowMs()

                            val frame = parseSocks5UdpFrame(buf, packet.length) ?: continue
                            val resolvedDst = resolveSocksUdpDestination(frame.address, dnsCache) ?: continue
                            val isDns = frame.address.port == 53

                            when (val decision = impairmentController.evaluateUdp(TrafficDirection.OUTGOING, isDns)) {
                                UdpImpairmentDecision.Drop -> Unit
                                is UdpImpairmentDecision.Forward -> {
                                    if (decision.delayMs <= 0L) {
                                        val outPkt = DatagramPacket(
                                            frame.payload,
                                            frame.payload.size,
                                            resolvedDst,
                                            frame.address.port
                                        )
                                        outboundUdpSocket.send(outPkt)
                                    } else {
                                        val enqueued = outgoingQueue.enqueue(
                                            ScheduledUdpDatagram(
                                                releaseAtMs = impairmentController.nowMs() + decision.delayMs,
                                                payload = frame.payload,
                                                address = resolvedDst,
                                                port = frame.address.port
                                            )
                                        )
                                        if (!enqueued) {
                                            impairmentController.recordUdpQueueDrop()
                                        }
                                    }
                                }
                            }
                        } catch (_: Exception) {
                            if (session.isClosed || !running.get()) break
                        }
                    }
                }

                // 4. Outgoing delayed dispatcher
                val uplinkDispatcher = launch {
                    outgoingQueue.dispatchLoop(
                        isAlive = { isActive && !session.isClosed && running.get() },
                        nowProvider = { impairmentController.nowMs() },
                        sender = { item ->
                            runCatching {
                                outboundUdpSocket.send(
                                    DatagramPacket(item.payload, item.payload.size, item.address, item.port)
                                )
                            }
                        }
                    )
                }

                // 5. Outbound -> Client UDP Reader
                val downlinkReader = launch {
                    val buf = ByteArray(65535)
                    val packet = DatagramPacket(buf, buf.size)
                    while (isActive && !session.isClosed && running.get()) {
                        try {
                            packet.length = buf.size
                            outboundUdpSocket.receive(packet)
                            val peer = session.clientPeer ?: continue
                            val remoteAddr = packet.address ?: continue
                            val remotePort = packet.port
                            session.lastActivityMs = impairmentController.nowMs()

                            val rawPayload = buf.copyOf(packet.length)
                            val isDns = remotePort == 53

                            when (val decision = impairmentController.evaluateUdp(TrafficDirection.INCOMING, isDns)) {
                                UdpImpairmentDecision.Drop -> Unit
                                is UdpImpairmentDecision.Forward -> {
                                    val wrapped = encodeSocks5UdpFrame(remoteAddr, remotePort, rawPayload)
                                    if (decision.delayMs <= 0L) {
                                        clientRelaySocket.send(
                                            DatagramPacket(wrapped, wrapped.size, peer.address, peer.port)
                                        )
                                    } else {
                                        val enqueued = incomingQueue.enqueue(
                                            ScheduledUdpDatagram(
                                                releaseAtMs = impairmentController.nowMs() + decision.delayMs,
                                                payload = wrapped,
                                                address = peer.address,
                                                port = peer.port
                                            )
                                        )
                                        if (!enqueued) {
                                            impairmentController.recordUdpQueueDrop()
                                        }
                                    }
                                }
                            }
                        } catch (_: Exception) {
                            if (session.isClosed || !running.get()) break
                        }
                    }
                }

                // 6. Incoming delayed dispatcher
                val downlinkDispatcher = launch {
                    incomingQueue.dispatchLoop(
                        isAlive = { isActive && !session.isClosed && running.get() },
                        nowProvider = { impairmentController.nowMs() },
                        sender = { item ->
                            runCatching {
                                clientRelaySocket.send(
                                    DatagramPacket(item.payload, item.payload.size, item.address, item.port)
                                )
                            }
                        }
                    )
                }

                joinAll(ctrlWatcher, idleWatcher, uplinkReader, uplinkDispatcher, downlinkReader, downlinkDispatcher)
            }
        } finally {
            outgoingQueue.clear()
            incomingQueue.clear()
            session.close()
            udpSessions.remove(sessionId)
            activeUdpCount.decrementAndGet()
        }
    }

    private fun resolveTargetAddress(target: SocksAddress): InetAddress {
        return when (target.atyp) {
            ATYP_IPV4, ATYP_IPV6 -> InetAddress.getByAddress(target.rawAddress)
            ATYP_DOMAIN -> InetAddress.getByName(target.domain!!)
            else -> throw IOException("Unsupported ATYP: \${target.atyp}")
        }
    }

    private fun resolveSocksUdpDestination(
        addr: SocksAddress,
        dnsCache: ConcurrentHashMap<String, InetAddress>
    ): InetAddress? {
        return try {
            when (addr.atyp) {
                ATYP_IPV4, ATYP_IPV6 -> InetAddress.getByAddress(addr.rawAddress)
                ATYP_DOMAIN -> {
                    val host = addr.domain ?: return null
                    dnsCache[host] ?: InetAddress.getByName(host).also { dnsCache[host] = it }
                }
                else -> null
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun sendReply(
        output: OutputStream,
        rep: Int,
        bindAddr: InetAddress?,
        bindPort: Int
    ) {
        val raw = bindAddr?.address
        val (atyp, addrBytes) = when {
            raw != null && raw.size == 16 -> ATYP_IPV6 to raw
            raw != null && raw.size == 4 -> ATYP_IPV4 to raw
            else -> ATYP_IPV4 to byteArrayOf(0, 0, 0, 0)
        }
        val packet = ByteArray(4 + addrBytes.size + 2)
        packet[0] = SOCKS_VERSION.toByte()
        packet[1] = rep.toByte()
        packet[2] = 0x00
        packet[3] = atyp.toByte()
        System.arraycopy(addrBytes, 0, packet, 4, addrBytes.size)
        packet[4 + addrBytes.size] = ((bindPort ushr 8) and 0xFF).toByte()
        packet[4 + addrBytes.size + 1] = (bindPort and 0xFF).toByte()
        output.write(packet)
        output.flush()
    }

    private fun readSocksAddress(input: InputStream, atyp: Int): SocksAddress? {
        return when (atyp) {
            ATYP_IPV4 -> {
                val addr = input.readExact(4)
                val port = input.readShortUnsigned()
                SocksAddress(atyp, addr, null, port)
            }
            ATYP_IPV6 -> {
                val addr = input.readExact(16)
                val port = input.readShortUnsigned()
                SocksAddress(atyp, addr, null, port)
            }
            ATYP_DOMAIN -> {
                val len = input.readByteUnsigned()
                val domainBytes = input.readExact(len)
                val port = input.readShortUnsigned()
                SocksAddress(atyp, ByteArray(0), String(domainBytes, Charsets.UTF_8), port)
            }
            else -> null
        }
    }

    private fun parseSocks5UdpFrame(data: ByteArray, length: Int): SocksUdpFrame? {
        if (length < 10) return null
        val frag = data[2].toInt() and 0xFF
        if (frag != 0) return null
        val atyp = data[3].toInt() and 0xFF

        var offset = 4
        val address: SocksAddress = when (atyp) {
            ATYP_IPV4 -> {
                if (offset + 4 + 2 > length) return null
                val raw = data.copyOfRange(offset, offset + 4)
                offset += 4
                val port = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
                offset += 2
                SocksAddress(atyp, raw, null, port)
            }
            ATYP_IPV6 -> {
                if (offset + 16 + 2 > length) return null
                val raw = data.copyOfRange(offset, offset + 16)
                offset += 16
                val port = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
                offset += 2
                SocksAddress(atyp, raw, null, port)
            }
            ATYP_DOMAIN -> {
                if (offset + 1 > length) return null
                val domainLen = data[offset].toInt() and 0xFF
                offset += 1
                if (offset + domainLen + 2 > length) return null
                val domain = String(data, offset, domainLen, Charsets.UTF_8)
                offset += domainLen
                val port = ((data[offset].toInt() and 0xFF) shl 8) or (data[offset + 1].toInt() and 0xFF)
                offset += 2
                SocksAddress(atyp, ByteArray(0), domain, port)
            }
            else -> return null
        }

        val payload = data.copyOfRange(offset, length)
        return SocksUdpFrame(address, payload)
    }

    private fun encodeSocks5UdpFrame(addr: InetAddress, port: Int, payload: ByteArray): ByteArray {
        val rawAddr = addr.address
        val atyp = when (addr) {
            is Inet6Address -> ATYP_IPV6
            is Inet4Address -> ATYP_IPV4
            else -> if (rawAddr.size == 16) ATYP_IPV6 else ATYP_IPV4
        }
        val headerSize = 4 + rawAddr.size + 2
        val out = ByteBuffer.allocate(headerSize + payload.size)
        out.put(0x00)
        out.put(0x00)
        out.put(0x00)
        out.put(atyp.toByte())
        out.put(rawAddr)
        out.putShort(port.toShort())
        out.put(payload)
        return out.array()
    }

    private fun InputStream.readByteUnsigned(): Int {
        val v = read()
        if (v < 0) throw EOFException("Unexpected EOF")
        return v
    }

    private fun InputStream.readShortUnsigned(): Int {
        val hi = readByteUnsigned()
        val lo = readByteUnsigned()
        return (hi shl 8) or lo
    }

    private fun InputStream.readExact(count: Int): ByteArray {
        val buf = ByteArray(count)
        var offset = 0
        while (offset < count) {
            val read = read(buf, offset, count - offset)
            if (read < 0) throw EOFException("Unexpected EOF after $offset/$count bytes")
            offset += read
        }
        return buf
    }

    private data class SocksAddress(
        val atyp: Int,
        val rawAddress: ByteArray,
        val domain: String?,
        val port: Int
    )

    private data class SocksUdpFrame(
        val address: SocksAddress,
        val payload: ByteArray
    )

    private class TcpRelaySession(
        val id: Long,
        private val clientSocket: Socket,
        private val outboundSocket: Socket
    ) {
        private val closed = AtomicBoolean(false)
        val isClosed: Boolean get() = closed.get()

        fun close() {
            if (!closed.compareAndSet(false, true)) return
            runCatching { clientSocket.close() }
            runCatching { outboundSocket.close() }
        }
    }

    private class UdpRelaySession(
        val id: Long,
        private val ctrlSocket: Socket,
        private val clientRelaySocket: DatagramSocket,
        private val outboundUdpSocket: DatagramSocket,
        @Volatile var lastActivityMs: Long
    ) {
        @Volatile
        var clientPeer: InetSocketAddress? = null
        private val closed = AtomicBoolean(false)
        val isClosed: Boolean get() = closed.get()

        fun close() {
            if (!closed.compareAndSet(false, true)) return
            runCatching { clientRelaySocket.close() }
            runCatching { outboundUdpSocket.close() }
            runCatching { ctrlSocket.close() }
        }
    }

    private data class ScheduledUdpDatagram(
        val releaseAtMs: Long,
        val payload: ByteArray,
        val address: InetAddress,
        val port: Int,
        val seq: Long = seqGen.incrementAndGet()
    ) : Comparable<ScheduledUdpDatagram> {
        override fun compareTo(other: ScheduledUdpDatagram): Int {
            val cmp = releaseAtMs.compareTo(other.releaseAtMs)
            return if (cmp != 0) cmp else seq.compareTo(other.seq)
        }

        companion object {
            private val seqGen = AtomicLong(0)
        }
    }

    private class UdpScheduledQueue(private val maxCapacity: Int) {
        private val lock = Any()
        private val heap = PriorityQueue<ScheduledUdpDatagram>()
        private val wakeup = Channel<Unit>(Channel.CONFLATED)

        fun enqueue(item: ScheduledUdpDatagram): Boolean {
            synchronized(lock) {
                if (heap.size >= maxCapacity) {
                    return false
                }
                heap.add(item)
            }
            wakeup.trySend(Unit)
            return true
        }

        suspend fun dispatchLoop(
            isAlive: () -> Boolean,
            nowProvider: () -> Long,
            sender: (ScheduledUdpDatagram) -> Unit
        ) {
            while (isAlive()) {
                var nextWaitMs = 20L
                while (isAlive()) {
                    val itemToSend: ScheduledUdpDatagram?
                    synchronized(lock) {
                        val head = heap.peek()
                        if (head == null) {
                            nextWaitMs = 50L
                            itemToSend = null
                        } else {
                            val now = nowProvider()
                            if (head.releaseAtMs <= now) {
                                itemToSend = heap.poll()
                            } else {
                                nextWaitMs = (head.releaseAtMs - now).coerceIn(1L, 50L)
                                itemToSend = null
                            }
                        }
                    }
                    if (itemToSend != null) {
                        sender(itemToSend)
                    } else {
                        break
                    }
                }
                withTimeoutOrNull(nextWaitMs) {
                    wakeup.receive()
                }
            }
        }

        fun clear() {
            synchronized(lock) {
                heap.clear()
            }
            wakeup.close()
        }
    }

    companion object {
        private const val SOCKS_VERSION = 0x05
        private const val AUTH_NO_AUTH = 0x00
        private const val AUTH_NO_ACCEPTABLE = 0xFF

        private const val CMD_CONNECT = 0x01
        private const val CMD_UDP_ASSOCIATE = 0x03

        private const val ATYP_IPV4 = 0x01
        private const val ATYP_DOMAIN = 0x03
        private const val ATYP_IPV6 = 0x04

        private const val REPLY_SUCCEEDED = 0x00
        private const val REPLY_GENERAL_FAILURE = 0x01
        private const val REPLY_COMMAND_NOT_SUPPORTED = 0x07
        private const val REPLY_ADDRESS_TYPE_NOT_SUPPORTED = 0x08
        private const val REPLY_HOST_UNREACHABLE = 0x04
    }
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/vpn/ImpairmentController.kt",
    language: "kotlin",
    description: "Deterministic UDP loss/burst/delay engine and non-corrupting TCP latency/pacing/pause engine",
    content: `package com.callglitch.app.vpn

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
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/vpn/SocketProtector.kt",
    language: "kotlin",
    description: "Strict VpnService.protect() wrapper preventing outbound proxy routing loops",
    content: `package com.callglitch.app.vpn

import android.net.VpnService
import java.io.IOException
import java.net.DatagramSocket
import java.net.Socket

/**
 * Abstraction over Android's VpnService.protect() so outbound proxy sockets
 * bypass the VPN TUN interface (preventing routing loops) and can be
 * deterministically tested in JVM unit tests.
 */
interface SocketProtector {
    fun protect(socket: Socket): Boolean
    fun protect(socket: DatagramSocket): Boolean
}

class SocketProtectionException(message: String) : IOException(message)

class VpnServiceSocketProtector(
    private val vpnService: VpnService
) : SocketProtector {
    override fun protect(socket: Socket): Boolean = vpnService.protect(socket)
    override fun protect(socket: DatagramSocket): Boolean = vpnService.protect(socket)
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
                    val diagnostics by CallGlitchVpnService.diagnostics.collectAsState()

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
                        diagnostics = diagnostics,
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
import com.callglitch.app.model.DiagnosticsSnapshot
import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.model.ImpairmentDirection
import com.callglitch.app.model.InstalledAppInfo
import com.callglitch.app.model.VpnLifecycleState
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
    diagnostics: DiagnosticsSnapshot,
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
            // 1. Connection Status & Truthful Diagnostics Card
            val hasFailure = diagnostics.vpnState == VpnLifecycleState.FAILED && diagnostics.lastError != null
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isRunning || hasFailure) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.2f)
                    else if (selectedPackages.isEmpty()) MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.12f)
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                ),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    if (isRunning || hasFailure) MaterialTheme.colorScheme.error.copy(alpha = 0.4f)
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
                            text = when {
                                hasFailure -> "Fault (\${diagnostics.lastErrorComponent ?: "VPN"})"
                                diagnostics.vpnState == VpnLifecycleState.STARTING -> "Starting Hev Tunnel & Proxy..."
                                diagnostics.vpnState == VpnLifecycleState.RECONFIGURING -> "Updating Target Apps..."
                                isRunning -> "\${activeProfile.displayName} Impairment Active"
                                selectedPackages.isEmpty() -> "No Target Apps Selected"
                                else -> "Normal Network Traffic"
                            },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isRunning || hasFailure || selectedPackages.isEmpty()) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        val forwardedKb = diagnostics.forwardedTcpBytes / 1024L
                        Text(
                            text = when {
                                hasFailure -> diagnostics.lastError ?: "Unexpected tunnel failure"
                                isRunning -> "Tunnel: \${diagnostics.tunnelState.label} · Proxy 127.0.0.1:\${diagnostics.proxyPort} (\${diagnostics.activeTcpSessions} TCP / \${diagnostics.activeUdpSessions} UDP)"
                                selectedPackages.isEmpty() -> "Select at least 1 application below before starting"
                                else -> "\${selectedPackages.size} target apps isolated · Hev + SOCKS5 Ready"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (isRunning) {
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "UDP: \${diagnostics.forwardedUdpDatagrams} fwd / \${diagnostics.droppedUdpDatagrams} drop · TCP: \${forwardedKb} KB (\${diagnostics.delayedTcpWrites} paced)",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .clip(CircleShape)
                            .background(
                                when {
                                    isRunning || hasFailure -> Color(0xFFEF4444)
                                    selectedPackages.isEmpty() -> Color(0xFFF59E0B)
                                    else -> Color(0xFF10B981)
                                }
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
                            Text("Applies safe latency, jitter, pacing, and pauses without corrupting bytes", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(
                            checked = customConfig.affectTcp,
                            onCheckedChange = { onUpdateCustomConfig(customConfig.copy(affectTcp = it)) }
                        )
                    }

                    if (customConfig.affectTcp) {
                        Spacer(modifier = Modifier.height(6.dp))
                        val bwLabel = if (customConfig.tcpBandwidthKbps <= 0) "Uncapped (delay/jitter only)" else "\${customConfig.tcpBandwidthKbps} Kbps"
                        Text("TCP Bandwidth Pace: $bwLabel", fontSize = 12.sp, fontWeight = FontWeight.Medium)
                        Slider(
                            value = customConfig.tcpBandwidthKbps.toFloat(),
                            onValueChange = { onUpdateCustomConfig(customConfig.copy(tcpBandwidthKbps = it.toInt())) },
                            valueRange = 0f..2000f,
                            steps = 39
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
    description: "Unit tests verifying profile configuration parameters, TCP pacing, and timeout settings",
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
        assertTrue(mild.affectTcp)
        assertEquals(1200, mild.tcpBandwidthKbps)
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
        assertTrue(moderate.affectTcp)
        assertEquals(384, moderate.tcpBandwidthKbps)
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
        assertTrue(severe.affectTcp)
        assertEquals(64, severe.tcpBandwidthKbps)
    }

    @Test
    fun testCustomFallbackMapping() {
        val customFallback = GlitchConfig(
            profileType = GlitchProfileType.CUSTOM,
            baseLatencyMs = 450,
            randomJitterMs = 120,
            packetLossPercent = 12.0,
            direction = ImpairmentDirection.OUTGOING,
            affectTcp = true,
            tcpBandwidthKbps = 256
        )

        val resolved = GlitchConfig.forType(GlitchProfileType.CUSTOM, customFallback)
        assertEquals(GlitchProfileType.CUSTOM, resolved.profileType)
        assertEquals(450, resolved.baseLatencyMs)
        assertEquals(120, resolved.randomJitterMs)
        assertEquals(12.0, resolved.packetLossPercent, 0.001)
        assertEquals(ImpairmentDirection.OUTGOING, resolved.direction)
        assertTrue(resolved.affectTcp)
        assertEquals(256, resolved.tcpBandwidthKbps)
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
  {
    path: "app/src/test/java/com/callglitch/app/ImpairmentControllerTest.kt",
    language: "kotlin",
    description: "Deterministic tests for UDP loss, burst cycles, DNS exemption, and TCP pacing",
    content: `package com.callglitch.app

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
`
  },
  {
    path: "app/src/test/java/com/callglitch/app/LocalSocks5ProxyServerTest.kt",
    language: "kotlin",
    description: "Integration tests for RFC 1928 TCP/UDP proxying, IPv4/IPv6, byte integrity, and protect() failures",
    content: `package com.callglitch.app

import com.callglitch.app.model.GlitchConfig
import com.callglitch.app.model.GlitchProfileType
import com.callglitch.app.vpn.ImpairmentController
import com.callglitch.app.vpn.LocalSocks5ProxyServer
import com.callglitch.app.vpn.RandomProvider
import com.callglitch.app.vpn.SocketProtector
import org.junit.Assert.*
import org.junit.Test
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.ServerSocket
import java.net.Socket
import java.net.SocketException
import java.security.MessageDigest
import java.util.concurrent.CopyOnWriteArrayList
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger
import kotlin.concurrent.thread

class LocalSocks5ProxyServerTest {

    private class RecordingSocketProtector(
        private val allowProtect: Boolean = true
    ) : SocketProtector {
        val tcpProtectCalls = AtomicInteger(0)
        val udpProtectCalls = AtomicInteger(0)

        override fun protect(socket: Socket): Boolean {
            tcpProtectCalls.incrementAndGet()
            return allowProtect
        }

        override fun protect(socket: DatagramSocket): Boolean {
            udpProtectCalls.incrementAndGet()
            return allowProtect
        }
    }

    private class DeterministicRandom(private val value: Double = 0.99) : RandomProvider {
        override fun nextDouble(): Double = value
        override fun nextSignedUnit(): Double = 0.0
    }

    @Test
    fun testSocks5TcpConnectIpv4AndDomainAndProtectsSocket() {
        val echoServer = startTcpEchoServer(InetAddress.getByName("127.0.0.1"))
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(
                profileType = GlitchProfileType.CUSTOM,
                baseLatencyMs = 0,
                randomJitterMs = 0,
                packetLossPercent = 0.0,
                affectTcp = false
            )
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            assertTrue(proxy.isRunning)
            assertTrue(port > 0)

            // 1. IPv4 CONNECT
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv4(out, byteArrayOf(127, 0, 0, 1), echoServer.localPort)
                readSocksReply(inp)

                val payload = "hello-ipv4-socks5".toByteArray()
                out.write(payload)
                out.flush()
                val echoed = ByteArray(payload.size)
                inp.readFully(echoed)
                assertArrayEquals(payload, echoed)
            }

            // 2. Domain name ("localhost") CONNECT
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectDomain(out, "localhost", echoServer.localPort)
                readSocksReply(inp)

                val payload = "hello-domain-socks5".toByteArray()
                out.write(payload)
                out.flush()
                val echoed = ByteArray(payload.size)
                inp.readFully(echoed)
                assertArrayEquals(payload, echoed)
            }

            assertTrue(protector.tcpProtectCalls.get() >= 2)
        } finally {
            proxy.stop()
            echoServer.close()
        }
    }

    @Test
    fun testSocks5TcpConnectIpv6WhenSupported() {
        val ipv6Loopback = InetAddress.getByName("::1")
        val echoServer = try {
            startTcpEchoServer(ipv6Loopback)
        } catch (_: Exception) {
            return // Host environment does not have IPv6 loopback enabled
        }
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(baseLatencyMs = 0, randomJitterMs = 0, packetLossPercent = 0.0, affectTcp = false)
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv6(out, ipv6Loopback.address, echoServer.localPort)
                val rep = readSocksReply(inp)
                assertEquals(0, rep)

                val payload = "hello-ipv6-socks5".toByteArray()
                out.write(payload)
                out.flush()
                val echoed = ByteArray(payload.size)
                inp.readFully(echoed)
                assertArrayEquals(payload, echoed)
            }
            assertTrue(protector.tcpProtectCalls.get() >= 1)
        } finally {
            proxy.stop()
            echoServer.close()
        }
    }

    @Test
    fun testSocks5UdpAssociateIpv4LossLatencyAndIntactDatagrams() {
        val udpEcho = startUdpEchoServer(InetAddress.getByName("127.0.0.1"))
        val protector = RecordingSocketProtector(allowProtect = true)
        // Alternate 0.1 (< 50% -> drop) and 0.9 (>= 50% -> forward)
        var toggle = 0
        val alternatingRng = object : RandomProvider {
            override fun nextDouble(): Double {
                toggle++
                return if (toggle % 2 == 1) 0.1 else 0.9
            }
            override fun nextSignedUnit(): Double = 0.0
        }
        val impairment = ImpairmentController(
            initialConfig = GlitchConfig(
                baseLatencyMs = 40,
                randomJitterMs = 0,
                packetLossPercent = 50.0,
                burstInterruptionEnabled = false
            ),
            randomProvider = alternatingRng
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { ctrl ->
                val out = ctrl.getOutputStream()
                val inp = DataInputStream(ctrl.getInputStream())
                socks5Handshake(out, inp)
                sendUdpAssociate(out)
                val (rep, relayPort) = readSocksReplyWithPort(inp)
                assertEquals(0, rep)
                assertTrue(relayPort > 0)

                DatagramSocket(0, InetAddress.getByName("127.0.0.1")).use { clientUdp ->
                    clientUdp.soTimeout = 1500
                    val payloads = (1..6).map { "rtp-frame-$it-intact-payload".toByteArray() }
                    for (p in payloads) {
                        val frame = encodeUdpFrameIpv4(byteArrayOf(127, 0, 0, 1), udpEcho.localPort, p)
                        clientUdp.send(DatagramPacket(frame, frame.size, InetAddress.getByName("127.0.0.1"), relayPort))
                    }

                    val received = mutableListOf<String>()
                    val recvBuf = ByteArray(4096)
                    val pkt = DatagramPacket(recvBuf, recvBuf.size)
                    while (true) {
                        try {
                            clientUdp.receive(pkt)
                            val body = decodeUdpFramePayload(recvBuf, pkt.length)
                            received.add(String(body))
                        } catch (_: Exception) {
                            break
                        }
                    }

                    // Verify partial loss happened AND every surviving datagram is 100% intact (never corrupted)
                    assertTrue("Expected some UDP datagrams dropped", received.size < payloads.size)
                    assertTrue("Expected some UDP datagrams forwarded", received.isNotEmpty())
                    for (item in received) {
                        assertTrue("Datagram payload corrupted: $item", item.startsWith("rtp-frame-") && item.endsWith("-intact-payload"))
                    }
                }
            }
            assertTrue(protector.udpProtectCalls.get() >= 1)
        } finally {
            proxy.stop()
            udpEcho.close()
        }
    }

    @Test
    fun testSocks5UdpAssociateIpv6WhenSupported() {
        val ipv6Loopback = InetAddress.getByName("::1")
        val udpEcho = try {
            startUdpEchoServer(ipv6Loopback)
        } catch (_: Exception) {
            return // Host lacks IPv6 loopback interface
        }
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(baseLatencyMs = 15, randomJitterMs = 0, packetLossPercent = 0.0, affectTcp = false)
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { ctrl ->
                val out = ctrl.getOutputStream()
                val inp = DataInputStream(ctrl.getInputStream())
                socks5Handshake(out, inp)
                sendUdpAssociate(out)
                val (rep, relayPort) = readSocksReplyWithPort(inp)
                assertEquals(0, rep)
                assertTrue(relayPort > 0)

                DatagramSocket(0, InetAddress.getByName("127.0.0.1")).use { clientUdp ->
                    clientUdp.soTimeout = 1500
                    val payload = "hello-ipv6-udp-rtp".toByteArray()
                    val frame = ByteArrayOutputStream().apply {
                        write(0); write(0); write(0); write(0x04)
                        write(ipv6Loopback.address)
                        write((udpEcho.localPort ushr 8) and 0xFF); write(udpEcho.localPort and 0xFF)
                        write(payload)
                    }.toByteArray()
                    clientUdp.send(DatagramPacket(frame, frame.size, InetAddress.getByName("127.0.0.1"), relayPort))

                    val recvBuf = ByteArray(4096)
                    val pkt = DatagramPacket(recvBuf, recvBuf.size)
                    try {
                        clientUdp.receive(pkt)
                        val body = decodeUdpFramePayload(recvBuf, pkt.length)
                        assertArrayEquals(payload, body)
                    } catch (_: SocketException) {
                        // Ignore if host JVM runs with IPv4-only outbound stack
                    }
                }
            }
        } finally {
            proxy.stop()
            udpEcho.close()
        }
    }

    @Test
    fun testTcpImpairmentThrottlingNeverCorruptsBytes() {
        val echoServer = startTcpEchoServer(InetAddress.getByName("127.0.0.1"))
        val protector = RecordingSocketProtector(allowProtect = true)
        val impairment = ImpairmentController(
            GlitchConfig(
                profileType = GlitchProfileType.CUSTOM,
                baseLatencyMs = 60,
                randomJitterMs = 10,
                packetLossPercent = 80.0, // Must NOT drop TCP bytes!
                affectTcp = true,
                tcpBandwidthKbps = 640 // ~80 KB/s -> 24KB takes >= 240ms + latency
            ),
            randomProvider = DeterministicRandom(0.0)
        )
        val proxy = LocalSocks5ProxyServer(impairment, protector)
        try {
            val port = proxy.start()
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv4(out, byteArrayOf(127, 0, 0, 1), echoServer.localPort)
                assertEquals(0, readSocksReply(inp))

                val data = ByteArray(24 * 1024) { i -> ((i * 31 + 7) and 0xFF).toByte() }
                val startNs = System.nanoTime()
                out.write(data)
                out.flush()
                sock.shutdownOutput()

                val received = ByteArray(data.size)
                inp.readFully(received)
                val elapsedMs = (System.nanoTime() - startNs) / 1_000_000L

                assertArrayEquals("TCP stream bytes must never be dropped or corrupted", data, received)
                assertTrue("Expected measurable TCP delay/throttling (>= 150ms), got \${elapsedMs}ms", elapsedMs >= 150L)
            }
        } finally {
            proxy.stop()
            echoServer.close()
        }
    }

    @Test
    fun testProtectFailureAbortsTcpAndUdpCleanly() {
        val errors = CopyOnWriteArrayList<Pair<String, String>>()
        val protector = RecordingSocketProtector(allowProtect = false)
        val impairment = ImpairmentController(GlitchConfig())
        val proxy = LocalSocks5ProxyServer(
            impairmentController = impairment,
            socketProtector = protector,
            onError = { comp, msg -> errors.add(comp to msg) }
        )
        try {
            val port = proxy.start()

            // TCP CONNECT should fail cleanly when protect() returns false
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendConnectIpv4(out, byteArrayOf(127, 0, 0, 1), 65432)
                val rep = readSocksReply(inp)
                assertNotEquals(0, rep)
            }

            // UDP ASSOCIATE should fail cleanly when protect() returns false
            Socket("127.0.0.1", port).use { sock ->
                val out = sock.getOutputStream()
                val inp = DataInputStream(sock.getInputStream())
                socks5Handshake(out, inp)
                sendUdpAssociate(out)
                val rep = readSocksReply(inp)
                assertNotEquals(0, rep)
            }

            assertEquals(1, protector.tcpProtectCalls.get())
            assertEquals(1, protector.udpProtectCalls.get())
            assertTrue(errors.any { it.first == "SocketProtector" })
        } finally {
            proxy.stop()
        }
    }

    private fun startTcpEchoServer(bindAddr: InetAddress): ServerSocket {
        val server = ServerSocket(0, 50, bindAddr)
        thread(isDaemon = true) {
            while (!server.isClosed) {
                try {
                    val client = server.accept()
                    thread(isDaemon = true) {
                        client.use { s ->
                            val buf = ByteArray(8192)
                            val ins = s.getInputStream()
                            val outs = s.getOutputStream()
                            while (true) {
                                val r = ins.read(buf)
                                if (r < 0) break
                                outs.write(buf, 0, r)
                                outs.flush()
                            }
                        }
                    }
                } catch (_: Exception) {
                    break
                }
            }
        }
        return server
    }

    private fun startUdpEchoServer(bindAddr: InetAddress): DatagramSocket {
        val sock = DatagramSocket(0, bindAddr)
        thread(isDaemon = true) {
            val buf = ByteArray(65535)
            val pkt = DatagramPacket(buf, buf.size)
            while (!sock.isClosed) {
                try {
                    pkt.length = buf.size
                    sock.receive(pkt)
                    sock.send(DatagramPacket(buf.copyOf(pkt.length), pkt.length, pkt.address, pkt.port))
                } catch (_: Exception) {
                    break
                }
            }
        }
        return sock
    }

    private fun socks5Handshake(out: java.io.OutputStream, inp: DataInputStream) {
        out.write(byteArrayOf(0x05, 0x01, 0x00))
        out.flush()
        val resp = ByteArray(2)
        inp.readFully(resp)
        assertEquals(0x05, resp[0].toInt() and 0xFF)
        assertEquals(0x00, resp[1].toInt() and 0xFF)
    }

    private fun sendConnectIpv4(out: java.io.OutputStream, ip4: ByteArray, port: Int) {
        val req = ByteArrayOutputStream().apply {
            write(0x05); write(0x01); write(0x00); write(0x01)
            write(ip4)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
        }.toByteArray()
        out.write(req)
        out.flush()
    }

    private fun sendConnectIpv6(out: java.io.OutputStream, ip6: ByteArray, port: Int) {
        val req = ByteArrayOutputStream().apply {
            write(0x05); write(0x01); write(0x00); write(0x04)
            write(ip6)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
        }.toByteArray()
        out.write(req)
        out.flush()
    }

    private fun sendConnectDomain(out: java.io.OutputStream, domain: String, port: Int) {
        val bytes = domain.toByteArray(Charsets.UTF_8)
        val req = ByteArrayOutputStream().apply {
            write(0x05); write(0x01); write(0x00); write(0x03)
            write(bytes.size); write(bytes)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
        }.toByteArray()
        out.write(req)
        out.flush()
    }

    private fun sendUdpAssociate(out: java.io.OutputStream) {
        out.write(byteArrayOf(0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0))
        out.flush()
    }

    private fun readSocksReply(inp: DataInputStream): Int {
        return readSocksReplyWithPort(inp).first
    }

    private fun readSocksReplyWithPort(inp: DataInputStream): Pair<Int, Int> {
        val head = ByteArray(4)
        inp.readFully(head)
        val rep = head[1].toInt() and 0xFF
        val atyp = head[3].toInt() and 0xFF
        val addrLen = when (atyp) {
            0x01 -> 4
            0x04 -> 16
            0x03 -> inp.readUnsignedByte()
            else -> 0
        }
        if (addrLen > 0) inp.readFully(ByteArray(addrLen))
        val port = inp.readUnsignedShort()
        return rep to port
    }

    private fun encodeUdpFrameIpv4(ip4: ByteArray, port: Int, payload: ByteArray): ByteArray {
        return ByteArrayOutputStream().apply {
            write(0); write(0); write(0); write(0x01)
            write(ip4)
            write((port ushr 8) and 0xFF); write(port and 0xFF)
            write(payload)
        }.toByteArray()
    }

    private fun decodeUdpFramePayload(data: ByteArray, length: Int): ByteArray {
        val atyp = data[3].toInt() and 0xFF
        val addrLen = when (atyp) {
            0x01 -> 4
            0x04 -> 16
            0x03 -> 1 + (data[4].toInt() and 0xFF)
            else -> 0
        }
        val headerEnd = 4 + addrLen + 2
        return data.copyOfRange(headerEnd, length)
    }
}
`
  },
  {
    path: "app/src/test/java/com/callglitch/app/VpnSessionControllerLifecycleTest.kt",
    language: "kotlin",
    description: "Lifecycle tests for 25 start/stop cycles, partial startup rollback, and crash recovery",
    content: `package com.callglitch.app

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
                assertTrue("Cycle $cycle failed to start: \${res.exceptionOrNull()}", res.isSuccess)
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
`
  },
];
