package com.callglitch.app

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
