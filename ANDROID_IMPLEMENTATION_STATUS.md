# Call Glitch — Android Implementation Status & Milestone Report

**Branch:** `fix/real-forwarding-foundation`  
**Date:** November 2026  
**Status:** Build Foundation Established · CI Configuration Fixed · Overlay Feature Removed · Dynamic App Selection Implemented

---

## 1. Summary of Actions Completed

### A. Dynamic Installed Application Selection (No Hardcoded Lists)
- **Eliminated Hardcoded Lists:** Completely removed `defaultCallingPackages` in `GlitchSettingsRepository.kt` and hardcoded `availableApps` in `MainScreen.kt`. Defaults to an empty selection (`emptySet()`).
- **Dynamic Discovery Engine:** Created `AppDiscoveryRepository.kt` that uses Android `PackageManager` to discover all installed applications on the device dynamically.
  - Queries `packageManager.getInstalledApplications()` with API 33+ `ApplicationInfoFlags` backward compatibility.
  - Filters out Call Glitch's own package (`context.packageName`) to prevent circular loops or self-routing blackholes.
  - Asynchronously loads application labels and icons off the main thread (`Dispatchers.IO`).
  - Sorts applications alphabetically by label (case-insensitive).
  - Distinguishes user-installed applications from system applications, providing a "System Apps" toggle.
- **Interactive Compose Selector:**
  - Full-featured `AppSelectionDialog` with real-time name and package search.
  - "Select All" and "Clear All" convenience actions.
  - Application icons rendered from system drawables via Compose `produceState` and `Bitmap.asImageBitmap()`.
  - System badge indicator for system-level packages.
  - Live selection counter (`X selected`).
- **Strict Empty Selection Validation:**
  - The VPN is forbidden from starting when no target applications are selected.
  - Removed old fallback that routed Call Glitch's own package name.
  - If a user tries to start without selected apps (from either the main UI or Quick Settings tile), Call Glitch halts, displays a clear prompt, and directs the user to select target apps.
- **Dynamic Runtime Tunnel Reconfiguration:**
  - Added `ACTION_UPDATE_APPS` to `CallGlitchVpnService` so modifications to target applications while the VPN is active immediately rebuild the TUN interface with the new set of allowed applications (or tear down safely if all apps were deselected).
- **Unit Testing:**
  - Added `AppDiscoveryAndSelectionTest.kt` verifying `InstalledAppInfo`, self-exclusion, empty selection guards, and alphabetical sorting.

### B. Repository Restructuring & Real Android Project
- The Android project has been moved from being an embedded TypeScript string array into a real, directly buildable Android Studio project in the **`android/`** directory.
- Android Studio can now directly open `android/` with full IDE support, code completion, and native Gradle tooling.

### C. Resolution of GitHub Actions CI Failures
- **Initial Failed Run:** Run ID `43164605355` (November 12, 2026).
  - *Root Cause:* Workflow executed `test -f settings.gradle.kts` at repository root where only web app files existed.
  - *Resolution:* Moved Android project into `android/` and updated `.github/workflows/android-build.yml`.
- **Subsequent Run Failure:** Run ID `43167498829` (Commit `b0365be7`).
  - *Root Cause:* Task `:app:checkDebugAarMetadata` failed with:
    `Configuration :app:debugRuntimeClasspath contains AndroidX dependencies, but the android.useAndroidX property is not enabled.`
  - *Resolution:* Created `android/gradle.properties` with `android.useAndroidX=true`.
- **Compiler Run Failure:** Run ID `43168806385` (Commit `e215f714`).
  - *Task:* `:app:compileDebugKotlin`.
  - *Root Causes in `CallGlitchVpnService.kt`:*
    1. `initialConfig = config` did not match constructor signature in `PacketForwardingEngine(vpnService, tunFd, config, onStatsUpdate)`.
    2. `allowedCount` was declared inside `Builder().apply { var allowedCount = 0 ... }` but referenced outside in `Log.i(TAG, "... Allowed apps: $allowedCount")`.
  - *Resolution:*
    1. Changed constructor invocation to `config = config`.
    2. Hoisted `var allowedCount = 0` outside the `apply` block so it is accessible in the logging statement.

### D. Official Gradle Wrapper Integration
- Replaced the previous makeshift script with the official Gradle **8.10.2** wrapper:
  - `android/gradle/wrapper/gradle-wrapper.jar` (43,583 bytes, official binary)
  - `android/gradle/wrapper/gradle-wrapper.properties` (distribution URL: `gradle-8.10.2-bin.zip`)
  - `android/gradlew` (POSIX shell script, `chmod +x`)
  - `android/gradlew.bat` (Windows batch script)
- Builds can now be executed on any clean machine with JDK 17 without requiring a globally pre-installed Gradle package.

### E. Complete Android Resource Generation
Added all previously missing Android XML resources referenced in code:
- Vector Drawables:
  - `ic_tile_glitch.xml` (inactive Quick Settings tile)
  - `ic_tile_glitch_active.xml` (active Quick Settings tile with lightning motif)
  - `ic_glitch_notification.xml` (persistent foreground notification icon)
  - `ic_stop.xml` (STOP action button icon)
  - `ic_launcher_foreground.xml` and `ic_launcher_background.xml`
- Mipmap Adaptive Icons:
  - `mipmap-anydpi-v26/ic_launcher.xml`
  - `mipmap-anydpi-v26/ic_launcher_round.xml`
- Values & XML:
  - `values/strings.xml`, `values/colors.xml`, `values/themes.xml`
  - `xml/data_extraction_rules.xml`, `xml/backup_rules.xml`

### F. Total Removal of Floating Overlay Feature
In strict adherence to requirements, the floating control bubble has been eradicated:
- **Deleted:** `OverlayBubbleService.kt`
- **Removed Permissions:** `android.permission.SYSTEM_ALERT_WINDOW` removed from `AndroidManifest.xml`
- **Removed Assets:** Floating bubble layouts and drawables omitted
- **Removed UI & State:** Floating bubble toggles, overlay permission launchers, and overlay coordinates removed from `MainActivity.kt`, `MainScreen.kt`, and `GlitchSettingsRepository.kt`.
- **Workbench Cleaned:** React simulator updated to remove bubble toggle and overlay elements.

### G. Quick Settings Tile: Sole Primary In-Call Control
- `GlitchTileService.kt` verified as a genuine native `TileService`.
- Tapping the tile directly starts or stops `CallGlitchVpnService` without opening the application.
- Updates tile state to `STATE_ACTIVE` or `STATE_INACTIVE` and synchronizes subtitle with the active profile on Android 10+.
- Integrated `StatusBarManager.requestAddTileService` prompt in `MainActivity.kt` for Android 13+ devices.
- Persistent foreground notification with prominent **STOP** button retained as secondary recovery control.

### H. Unified Single Source of Truth
- The files in `android/` are the authoritative source.
- `src/android/projectFiles.ts` mirrors the real project files.
- `src/utils/projectZip.ts` now bundles the real Gradle wrapper, binary JAR, vector resources, and Kotlin files.

---

## 2. Inventory of Files

### Created Files
- `android/settings.gradle.kts`
- `android/build.gradle.kts`
- `android/gradle/libs.versions.toml`
- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/gradle/wrapper/gradle-wrapper.jar`
- `android/gradlew`
- `android/gradlew.bat`
- `android/app/build.gradle.kts`
- `android/app/proguard-rules.pro`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/res/values/strings.xml`
- `android/app/src/main/res/values/colors.xml`
- `android/app/src/main/res/values/themes.xml`
- `android/app/src/main/res/xml/data_extraction_rules.xml`
- `android/app/src/main/res/xml/backup_rules.xml`
- `android/app/src/main/res/drawable/ic_tile_glitch.xml`
- `android/app/src/main/res/drawable/ic_tile_glitch_active.xml`
- `android/app/src/main/res/drawable/ic_glitch_notification.xml`
- `android/app/src/main/res/drawable/ic_stop.xml`
- `android/app/src/main/res/drawable/ic_launcher_foreground.xml`
- `android/app/src/main/res/drawable/ic_launcher_background.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- `android/app/src/main/java/com/callglitch/app/CallGlitchApplication.kt`
- `android/app/src/main/java/com/callglitch/app/model/GlitchModels.kt`
- `android/app/src/main/java/com/callglitch/app/data/GlitchSettingsRepository.kt`
- `android/app/src/main/java/com/callglitch/app/vpn/CallGlitchVpnService.kt`
- `android/app/src/main/java/com/callglitch/app/vpn/PacketForwardingEngine.kt`
- `android/app/src/main/java/com/callglitch/app/tile/GlitchTileService.kt`
- `android/app/src/main/java/com/callglitch/app/ui/MainActivity.kt`
- `android/app/src/main/java/com/callglitch/app/ui/screens/MainScreen.kt`
- `android/app/src/main/java/com/callglitch/app/ui/theme/GlitchTheme.kt`
- `android/app/src/test/java/com/callglitch/app/GlitchConfigTest.kt`
- `.github/workflows/android-build.yml`
- `README_ANDROID.md`
- `ANDROID_IMPLEMENTATION_STATUS.md`

### Modified Files
- `src/types/glitch.ts` (removed floating bubble types)
- `src/components/AndroidSimulator.tsx` (removed floating bubble overlay, focused on in-call QS shade toggle)
- `src/components/CodeExplorer.tsx` (updated project tree & descriptions)
- `src/android/projectFiles.ts` (synced with real `android/` source & resources, no overlay)
- `src/utils/projectZip.ts` (embeds real wrapper jar & vector drawables)

### Removed / Omitted Files
- `android/app/src/main/java/com/callglitch/app/overlay/OverlayBubbleService.kt` (deleted)
- `android/app/src/main/res/layout/layout_floating_bubble.xml` (deleted)
- `android/app/src/main/res/drawable/bg_bubble_circle.xml` (deleted)
- `android/app/src/main/res/drawable/ic_bubble_active.xml` (deleted)
- `android/app/src/main/res/drawable/ic_bubble_inactive.xml` (deleted)

---

## 3. Network Forwarding Engine: Current Limitations & Milestone 2 Plan

### Identified Technical Limitations in Current Packet Router
1. **TCP Stateful Connection Management:** The present loop does not implement full TCP state machines (SYN/ACK tracking, sequence/acknowledgment tracking, window scaling). TCP traffic cannot be transparently proxied over direct sockets without an intermediate user-space TCP stack.
2. **Dual-Stack IPv6 Media Streams:** Calling apps (such as WhatsApp and Google Meet) increasingly use IPv6 UDP flows. Current direct sockets only support partial IPv4 NAT translation.
3. **DNS Proxying & Signaling:** Calling apps require seamless DNS resolution (`addDnsServer`) during call setup.

### Next Implementation Milestone: Genuine Forwarding Engine
- **Target:** Integrate an embedded user-space TCP/IP stack (such as `tun2socks` with embedded `lwIP` or a pure Kotlin user-space TCP/IP packet router) that binds to protected sockets (`VpnService.protect()`).
- **Milestone 2 Workflow:**
  1. Establish normal TCP and UDP forwarding through the user-space stack with impairment parameters set to 0.
  2. Validate real internet browsing and WhatsApp voice call connectivity through the tunnel.
  3. Wire the bounded delay queue and statistical loss filter into the user-space packet handler.
  4. Perform physical-device in-call validation using the Quick Settings tile.
