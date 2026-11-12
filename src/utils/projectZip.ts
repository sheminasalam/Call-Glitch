import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../android/projectFiles';
import { GRADLE_WRAPPER_JAR_B64 } from '../android/gradleWrapperB64';

export async function generateProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  // 1. Add all project source code files
  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  // 2. Add real official Gradle 8.10.2 binary wrapper jar from base64
  zip.file('gradle/wrapper/gradle-wrapper.jar', GRADLE_WRAPPER_JAR_B64, { base64: true });

  // 3. Add official Gradle wrapper shell & batch scripts
  zip.file(
    'gradlew',
    `#!/bin/sh

#
# Copyright © 2015-2021 the original authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

warn () {
    echo "$*"
} >&2

die () {
    echo
    echo "$*"
    echo
    exit 1
} >&2

# OS specific support (must be 'true' or 'false').
cygwin=false
msys=false
darwin=false
nonstop=false
case "\`uname\`" in
  CYGWIN* ) cygwin=true ;;
  Darwin* ) darwin=true ;;
  MINGW* ) msys=true ;;
  NONSTOP* ) nonstop=true ;;
esac

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
    if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
        JAVACMD=$JAVA_HOME/jre/sh/java
    else
        JAVACMD=$JAVA_HOME/bin/java
    fi
    if [ ! -x "$JAVACMD" ] ; then
        die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
    fi
else
    JAVACMD=java
    if ! command -v java >/dev/null 2>&1
    then
        die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
    fi
fi

exec "$JAVACMD" "-Dorg.gradle.appname=gradlew" -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`,
    { unixPermissions: '755' }
  );

  zip.file(
    'gradlew.bat',
    `@rem
@rem Copyright 2015 the original authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%"=="" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

if defined JAVA_HOME goto findJavaFromJavaHome

set JAVACMD=java.exe
%JAVACMD% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVACMD=%JAVA_HOME%\\bin\\java.exe

if exist "%JAVACMD%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
goto fail

:execute
set CLASSPATH=%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar

"%JAVACMD%" "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:fail
exit /b 1
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
-keep class com.callglitch.app.model.** { *; }
`
  );

  // 4. Android XML resources
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

  zip.file(
    'app/src/main/res/values/colors.xml',
    `<resources>
    <color name="primary">#0EA5E9</color>
    <color name="primary_variant">#0284C7</color>
    <color name="glitch_red">#EF4444</color>
    <color name="glitch_amber">#F59E0B</color>
    <color name="glitch_green">#10B981</color>
    <color name="launcher_bg">#0F172A</color>
</resources>
`
  );

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

  zip.file(
    'app/src/main/res/xml/data_extraction_rules.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<data-extraction-rules>
    <cloud-backup>
        <exclude domain="sharedpref" path="." />
    </cloud-backup>
    <device-transfer>
        <exclude domain="sharedpref" path="." />
    </device-transfer>
</data-extraction-rules>
`
  );

  zip.file(
    'app/src/main/res/xml/backup_rules.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<full-backup-content>
    <exclude domain="sharedpref" path="." />
</full-backup-content>
`
  );

  // Vector icons
  zip.file(
    'app/src/main/res/drawable/ic_tile_glitch.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM12,4c4.42,0 8,3.58 8,8 0,1.85 -0.63,3.55 -1.69,4.9L7.1,5.69C8.45,4.63 10.15,4 12,4zM5.69,7.1L16.9,18.31C15.55,19.37 13.85,20 12,20c-4.42,0 -8,-3.58 -8,-8 0,-1.85 0.63,-3.55 1.69,-4.9z"/>
</vector>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_tile_glitch_active.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M11,21h-1l1,-7H7.5c-0.58,0 -0.57,-0.32 -0.38,-0.66 0.19,-0.34 0.05,-0.08 0.07,-0.12C8.48,10.94 10.42,7.54 13,3h1l-1,7h3.5c0.49,0 0.56,0.33 0.47,0.51l-0.07,0.15C14.9,14.28 12.95,17.7 11,21z"/>
</vector>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_glitch_notification.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M12,1L3,5v6c0,5.55 3.84,10.74 9,12 5.16,-1.26 9,-6.45 9,-12V5l-9,-4zM11.5,16h-1l0.8,-5.5H8.5l3.5,-6.5h1l-0.8,5.5h2.8l-3.5,6.5z"/>
</vector>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_stop.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M6,6h12v12H6z"/>
</vector>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_launcher_background.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#0F172A"
        android:pathData="M0,0h108v108h-108z"/>
</vector>
`
  );

  zip.file(
    'app/src/main/res/drawable/ic_launcher_foreground.xml',
    `<vector xmlns:android="http://schemas.android.com/apk/res/android"
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
  );

  zip.file(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  );

  zip.file(
    'app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`
  );

  return await zip.generateAsync({ type: 'blob' });
}
