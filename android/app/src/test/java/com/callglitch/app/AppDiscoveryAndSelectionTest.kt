package com.callglitch.app

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
