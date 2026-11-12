package com.callglitch.app.tile

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
                Log.w(TAG, "Could not request tile listening state: ${e.message}")
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
                tile.subtitle = "${profile.displayName} Active"
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
