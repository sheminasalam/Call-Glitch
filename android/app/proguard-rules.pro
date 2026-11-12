# Call Glitch Proguard & R8 Rules
-keepattributes *Annotation*
-keepclassmembers class * {
    @androidx.room.* *;
}
-keep class com.callglitch.app.vpn.** { *; }
-keep class com.callglitch.app.tile.** { *; }
-keep class com.callglitch.app.model.** { *; }
