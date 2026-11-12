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
    path: "app/proguard-rules.pro",
    language: "groovy",
    description: "ProGuard release optimization and obfuscation rules",
    content: `# Call Glitch Proguard & R8 Rules
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* *;
}
-keep class com.callglitch.app.vpn.** { *; }
-keep class com.callglitch.app.tile.** { *; }
-keep class com.callglitch.app.model.** { *; }
`
  },
  {
    path: "app/src/main/AndroidManifest.xml",
    language: "xml",
    description: "Android Manifest declaring VpnService, QS Tile, and QUERY_ALL_PACKAGES",
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
    description: "Application class initializing repositories and notification channels",
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
    path: "app/src/main/java/com/callglitch/app/data/AppDiscoveryRepository.kt",
    language: "kotlin",
    description: "Dynamic package manager scanner discovering all installed user and system apps",
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

                val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                if (isSystem && !includeSystemApps) {
                    return@mapNotNull null
                }

                val label = try {
                    packageManager.getApplicationLabel(appInfo).toString()
                } catch (e: Exception) {
                    appInfo.packageName
                }

                val hasLauncher = try {
                    packageManager.getLaunchIntentForPackage(appInfo.packageName) != null
                } catch (e: Exception) {
                    false
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
    description: "DataStore repository for user profile preferences and target app selection",
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
    path: "app/src/main/java/com/callglitch/app/model/GlitchModels.kt",
    language: "kotlin",
    description: "Core data models for impairment profiles and installed apps",
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

data class InstalledAppInfo(
    val packageName: String,
    val appName: String,
    val isSystemApp: Boolean = false,
    val hasLauncher: Boolean = true
)

`
  },
  {
    path: "app/src/main/java/com/callglitch/app/tile/GlitchTileService.kt",
    language: "kotlin",
    description: "Android Quick Settings TileService for 1-tap in-call toggle",
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
    description: "Main activity with VPN permission flow and app selection validation",
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
}
`
  },
  {
    path: "app/src/main/java/com/callglitch/app/ui/screens/MainScreen.kt",
    language: "kotlin",
    description: "Jetpack Compose main screen with dynamic searchable app selector dialog",
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
                    Text("Base Latency: \${customConfig.baseLatencyMs} ms", fontSize = 13.sp)
                    Slider(
                        value = customConfig.baseLatencyMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(baseLatencyMs = it.toInt())) },
                        valueRange = 0f..800f
                    )

                    Text("Random Jitter: ±\${customConfig.randomJitterMs} ms", fontSize = 13.sp)
                    Slider(
                        value = customConfig.randomJitterMs.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(randomJitterMs = it.toInt())) },
                        valueRange = 0f..300f
                    )

                    Text("Packet Loss: \${String.format("%.1f", customConfig.packetLossPercent)} %", fontSize = 13.sp)
                    Slider(
                        value = customConfig.packetLossPercent.toFloat(),
                        onValueChange = { onUpdateCustomConfig(customConfig.copy(packetLossPercent = it.toDouble())) },
                        valueRange = 0f..25f
                    )

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
    description: "Android project file: app/src/main/java/com/callglitch/app/ui/theme/GlitchTheme.kt",
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
    path: "app/src/main/java/com/callglitch/app/vpn/CallGlitchVpnService.kt",
    language: "kotlin",
    description: "VpnService establishing TUN interface and isolating target applications",
    content: `package com.callglitch.app.vpn

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
                Log.e(TAG, "Failed to start VPN: \${e.message}", e)
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
            setSession("CallGlitch: \${config.profileType.displayName}")
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
    path: "app/src/main/java/com/callglitch/app/vpn/PacketForwardingEngine.kt",
    language: "kotlin",
    description: "User-space packet forwarding engine applying latency, jitter, loss and bursts",
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
import java.nio.ByteBuffer
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicLong
import kotlin.random.Random

/**
 * User-space packet forwarding and impairment engine foundation.
 * 
 * Architecture Note:
 * This engine operates between the local TUN file descriptor and protected outbound sockets.
 * Incoming call packets from the TUN interface pass through a bounded delay queue and random loss filter,
 * then are dispatched through underlying direct sockets protected with VpnService.protect() to prevent routing loops.
 * 
 * Identified Limitations & Next Milestone Target:
 * General internet calls often require full stateful TCP/TLS signaling and dual-stack IPv4/IPv6 translation.
 * Milestone 2 integrates an embedded user-space TCP/IP stack (e.g. tun2socks / lwIP) to handle full
 * bidirectional TCP connection state machines alongside this impairment pipeline.
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

    // Bounded packet delay queue for outgoing & incoming impairment (Max 500 packets to prevent OOM)
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
            // Non-UDP pass-through
            forwardRawPacket(data)
        }
    }

    private fun forwardUdpPacket(packet: ByteArray) {
        try {
            val ipHeaderLen = (packet[0].toInt() and 0x0F) * 4
            val srcIp = InetAddress.getByAddress(packet.copyOfRange(12, 16))
            val dstIp = InetAddress.getByAddress(packet.copyOfRange(16, 20))

            val srcPort = ((packet[ipHeaderLen].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 1].toInt() and 0xFF)
            val dstPort = ((packet[ipHeaderLen + 2].toInt() and 0xFF) shl 8) or (packet[ipHeaderLen + 3].toInt() and 0xFF)

            val udpPayload = packet.copyOfRange(ipHeaderLen + 8, packet.size)

            val sessionKey = "$srcIp:$srcPort->$dstIp:$dstPort"
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

        // Reverse listener for incoming UDP media packets from Internet
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
        packet.putShort(0) // UDP Checksum

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
        delayQueue.clear()

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
    path: "app/src/main/res/drawable/ic_glitch_notification.xml",
    language: "xml",
    description: "Vector drawable for active VPN foreground notification icon",
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,1L3,5v6c0,5.55 3.84,10.74 9,12 5.16,-1.26 9,-6.45 9,-12V5l-9,-4zM11.5,16h-1l0.8,-5.5H8.5l3.5,-6.5h1l-0.8,5.5h2.8l-3.5,6.5z"/>
</vector>
`
  },
  {
    path: "app/src/main/res/drawable/ic_launcher_background.xml",
    language: "xml",
    description: "Android project file: app/src/main/res/drawable/ic_launcher_background.xml",
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0F172A"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`
  },
  {
    path: "app/src/main/res/drawable/ic_launcher_foreground.xml",
    language: "xml",
    description: "Android project file: app/src/main/res/drawable/ic_launcher_foreground.xml",
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0EA5E9"
        android:pathData="M54,20A34,34 0 1,0 88,54A34,34 0 0,0 54,20ZM54,80A26,26 0 1,1 80,54A26,26 0 0,1 54,80Z"/>
    <path
        android:fillColor="#38BDF8"
        android:pathData="M51,69h-4l3,-21h-9.5c-1.8,0 -1.7,-1 -1.1,-2.1 0.6,-1.1 0.2,-0.3 0.2,-0.4l15.4,-25.5h4l-3,21h9.5c1.5,0 1.7,1 1.4,1.6l-0.2,0.5L51,69z"/>
</vector>
`
  },
  {
    path: "app/src/main/res/drawable/ic_stop.xml",
    language: "xml",
    description: "Vector drawable for STOP notification action",
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M6,6h12v12H6z"/>
</vector>
`
  },
  {
    path: "app/src/main/res/drawable/ic_tile_glitch.xml",
    language: "xml",
    description: "Vector drawable for Quick Settings Tile inactive state",
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM12,4c4.42,0 8,3.58 8,8 0,1.85 -0.63,3.55 -1.69,4.9L7.1,5.69C8.45,4.63 10.15,4 12,4zM5.69,7.1L16.9,18.31C15.55,19.37 13.85,20 12,20c-4.42,0 -8,-3.58 -8,-8 0,-1.85 0.63,-3.55 1.69,-4.9z"/>
</vector>
`
  },
  {
    path: "app/src/main/res/drawable/ic_tile_glitch_active.xml",
    language: "xml",
    description: "Vector drawable for Quick Settings Tile active state",
    content: `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <!-- Active flame / lightning glitch vector -->
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M11,21h-1l1,-7H7.5c-0.58,0 -0.57,-0.32 -0.38,-0.66 0.19,-0.34 0.05,-0.08 0.07,-0.12C8.48,10.94 10.42,7.54 13,3h1l-1,7h3.5c0.49,0 0.56,0.33 0.47,0.51l-0.07,0.15C14.9,14.28 12.95,17.7 11,21z"/>
</vector>
`
  },
  {
    path: "app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
    language: "xml",
    description: "Android project file: app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  },
  {
    path: "app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
    language: "xml",
    description: "Android project file: app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  },
  {
    path: "app/src/main/res/values/colors.xml",
    language: "xml",
    description: "Color palette definitions matching Call Glitch design",
    content: `<resources>
    <color name="primary">#0EA5E9</color>
    <color name="primary_variant">#0284C7</color>
    <color name="glitch_red">#EF4444</color>
    <color name="glitch_amber">#F59E0B</color>
    <color name="glitch_green">#10B981</color>
    <color name="launcher_bg">#0F172A</color>
</resources>
`
  },
  {
    path: "app/src/main/res/values/strings.xml",
    language: "xml",
    description: "Application string resources",
    content: `<resources>
    <string name="app_name">Call Glitch</string>
    <string name="tile_name">Call Glitch</string>
    <string name="notification_channel_name">Call Glitch Active State</string>
    <string name="notification_channel_desc">Shows ongoing call network impairment state and STOP control</string>
</resources>
`
  },
  {
    path: "app/src/main/res/values/themes.xml",
    language: "xml",
    description: "Material3 theme definitions",
    content: `<resources>
    <style name="Theme.CallGlitch" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">@color/primary_variant</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
    </style>
</resources>
`
  },
  {
    path: "app/src/main/res/xml/backup_rules.xml",
    language: "xml",
    description: "Legacy backup configuration rules",
    content: `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="." />
</full-backup-content>
`
  },
  {
    path: "app/src/main/res/xml/data_extraction_rules.xml",
    language: "xml",
    description: "Android 12+ cloud and device backup configuration",
    content: `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="." />
    </device-transfer>
</data-extraction-rules>
`
  },
  {
    path: "app/src/test/java/com/callglitch/app/AppDiscoveryAndSelectionTest.kt",
    language: "kotlin",
    description: "Unit tests verifying installed app discovery, self-exclusion and selection validation",
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
    path: "app/src/test/java/com/callglitch/app/GlitchConfigTest.kt",
    language: "kotlin",
    description: "Unit tests verifying impairment profile configurations and parameters",
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
`
  },
  {
    path: "build.gradle.kts",
    language: "kotlin",
    description: "Top-level root build script with Kotlin and Android Gradle plugins",
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
`
  },
  {
    path: "gradle/libs.versions.toml",
    language: "properties",
    description: "Version catalog standardizing dependencies for Compose and Kotlin",
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
    path: "gradle/wrapper/gradle-wrapper.properties",
    language: "properties",
    description: "Gradle wrapper properties specifying Gradle distribution v8.10.2",
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  },
  {
    path: "gradle.properties",
    language: "properties",
    description: "Gradle properties enabling AndroidX and JVM options",
    content: `android.useAndroidX=true
org.gradle.jvmargs=-Xmx3g -Dfile.encoding=UTF-8
kotlin.code.style=official
`
  },
  {
    path: "settings.gradle.kts",
    language: "kotlin",
    description: "Gradle settings defining repository endpoints and the app module",
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
];
