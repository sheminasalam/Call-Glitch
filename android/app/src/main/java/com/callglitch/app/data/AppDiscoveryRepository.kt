package com.callglitch.app.data

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
