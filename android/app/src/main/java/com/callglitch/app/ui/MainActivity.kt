package com.callglitch.app.ui

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

                    val coroutineScope = rememberCoroutineScope()

                    MainScreen(
                        isRunning = isRunning,
                        activeProfile = if (isRunning) activeProfile else savedProfile,
                        customConfig = customConfig,
                        selectedPackages = selectedPackages,
                        autoTimeout = autoTimeout,
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
