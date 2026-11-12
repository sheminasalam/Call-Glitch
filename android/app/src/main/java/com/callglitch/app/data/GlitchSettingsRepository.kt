package com.callglitch.app.data

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
