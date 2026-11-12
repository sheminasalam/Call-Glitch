# Call Glitch — Native Android Studio Project

Call Glitch is a rootless, per-app network impairment utility designed to simulate unstable internet connections during ongoing voice and video calls (WhatsApp, Telegram, Google Meet, Zoom, etc.) via software-based traffic shaping.

The Android Studio project is located in the **`android/`** directory.

---

## 1. Prerequisites

- **IDE:** Android Studio Ladybug (2024.2+) or Hedgehog (2023.1.1+)
- **JDK:** OpenJDK 17 or Temurin 17
- **Android SDK:** Compile SDK 35, Target SDK 35, Minimum SDK 26 (Android 8.0 Oreo)
- **Gradle:** 8.10.2 (bundled via official Gradle wrapper)
- **Android Gradle Plugin (AGP):** 8.7.2
- **Kotlin:** 2.0.21 with Jetpack Compose Compiler plugin

---

## 2. Project Directory Structure

```
android/
├── build.gradle.kts                 # Root Gradle build script
├── settings.gradle.kts               # Gradle settings registering :app module
├── gradle/
│   ├── libs.versions.toml           # Version catalog (AGP, Kotlin, Compose, Coroutines)
│   └── wrapper/
│       ├── gradle-wrapper.jar       # Official Gradle 8.10.2 wrapper binary
│       └── gradle-wrapper.properties
├── gradlew                          # Linux / macOS wrapper script (chmod +x)
├── gradlew.bat                      # Windows wrapper script
└── app/
    ├── build.gradle.kts             # App module build configuration
    ├── proguard-rules.pro           # Optimization & R8 keep rules
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml  # VpnService and TileService declarations
        │   ├── java/com/callglitch/app/
        │   │   ├── CallGlitchApplication.kt
        │   │   ├── model/GlitchModels.kt
        │   │   ├── data/GlitchSettingsRepository.kt
        │   │   ├── vpn/CallGlitchVpnService.kt
        │   │   ├── vpn/PacketForwardingEngine.kt
        │   │   ├── tile/GlitchTileService.kt
        │   │   └── ui/
        │   │       ├── MainActivity.kt
        │   │       ├── screens/MainScreen.kt
        │   │       └── theme/GlitchTheme.kt
        │   └── res/
        │       ├── drawable/        # Vector icons (tile, notification, stop)
        │       ├── mipmap-anydpi-v26/ # Adaptive launcher icons
        │       ├── values/          # Strings, colors, themes
        │       └── xml/             # Backup & data extraction rules
        └── test/                    # JUnit unit tests
```

---

## 3. How to Build & Install

### Opening in Android Studio
1. Open Android Studio.
2. Select **Open** and choose the **`android/`** folder of this repository.
3. Allow Gradle sync to complete automatically.

### Command Line Build
```bash
# Navigate to the Android project folder
cd android

# Ensure wrapper script is executable (Linux / macOS)
chmod +x gradlew

# Run unit tests
./gradlew testDebugUnitTest

# Assemble Debug APK
./gradlew :app:assembleDebug
```

The output APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Installing via ADB
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 4. In-Call Activation via Quick Settings (Primary Control)

The application is operated using Android's native Quick Settings tile:

1. Launch **Call Glitch** once to authorize the Android VPN dialog (`VpnService.prepare()`).
2. Add the **Call Glitch** tile to your Quick Settings panel (use the in-app "Add to Quick Settings" button on Android 13+, or swipe down and tap the edit/pencil icon on older versions).
3. Start an ongoing video call (e.g. WhatsApp, Telegram).
4. Swipe down the Android status bar and tap **Call Glitch**:
   - The tile turns active and displays the active profile (e.g. `Moderate Active`).
   - Latency, jitter, and packet loss are applied immediately without leaving the call.
5. Tap the tile again to restore normal network quality immediately.

*Note: The floating overlay bubble has been removed entirely in accordance with user requirements. Quick Settings is the sole primary in-call control.*
