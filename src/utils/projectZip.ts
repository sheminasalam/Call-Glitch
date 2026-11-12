import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../android/projectFiles';

export async function generateProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // Add all project source code files
  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  // Add additional Gradle wrapper scripts and resources
  zip.file(
    'gradlew',
    `#!/bin/sh
# Gradle start up script for POSIX systems
exec java -version >/dev/null 2>&1 || { echo "Java not found. Please install JDK 17+."; exit 1; }
exec gradle "$@"
`
  );

  zip.file(
    'gradlew.bat',
    `@echo off
@rem Gradle startup script for Windows
gradle %*
`
  );

  zip.file(
    'gradle/wrapper/gradle-wrapper.properties',
    `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`
  );

  zip.file(
    '.gitignore',
    `*.iml
.gradle
/local.properties
/.idea/caches
/.idea/libraries
/.idea/modules.xml
/.idea/workspace.xml
/.idea/navEditor.xml
/.idea/assetWizardSettings.xml
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
local.properties
app/build/
`
  );

  zip.file(
    'app/proguard-rules.pro',
    `# Call Glitch Proguard & R8 Rules
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* *;
}
-keep class com.callglitch.app.vpn.** { *; }
-keep class com.callglitch.app.tile.** { *; }
-keep class com.callglitch.app.overlay.** { *; }
`
  );

  // App strings XML
  zip.file(
    'app/src/main/res/values/strings.xml',
    `<resources>
    <string name="app_name">Call Glitch</string>
    <string name="tile_name">Call Glitch</string>
    <string name="notification_channel_name">Call Glitch Active State</string>
    <string name="notification_channel_desc">Shows ongoing call network impairment state and STOP control</string>
</resources>
`
  );

  // App colors XML
  zip.file(
    'app/src/main/res/values/colors.xml',
    `<resources>
    <color name="primary">#0EA5E9</color>
    <color name="primary_variant">#0284C7</color>
    <color name="glitch_red">#EF4444</color>
    <color name="glitch_amber">#F59E0B</color>
    <color name="glitch_green">#10B981</color>
</resources>
`
  );

  // App styles XML
  zip.file(
    'app/src/main/res/values/themes.xml',
    `<resources>
    <style name="Theme.CallGlitch" parent="android:Theme.Material.Light.NoActionBar">
        <item name="android:statusBarColor">@color/primary_variant</item>
        <item name="android:navigationBarColor">#FFFFFF</item>
    </style>
</resources>
`
  );

  // Floating bubble layout XML
  zip.file(
    'app/src/main/res/layout/layout_floating_bubble.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="56dp"
    android:layout_height="56dp"
    android:background="@drawable/bg_bubble_circle">

    <ImageView
        android:id="@+id/bubble_icon"
        android:layout_width="32dp"
        android:layout_height="32dp"
        android:layout_gravity="center"
        android:src="@drawable/ic_bubble_inactive"
        android:contentDescription="Call Glitch Bubble" />
</FrameLayout>
`
  );

  // Bubble drawable XML
  zip.file(
    'app/src/main/res/drawable/bg_bubble_circle.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="oval">
    <solid android:color="#1E293B" />
    <stroke android:width="2dp" android:color="#38BDF8" />
</shape>
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
