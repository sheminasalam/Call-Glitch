import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');

const fileList = [
  { path: 'app/build.gradle.kts', lang: 'kotlin', desc: 'App module build configuration with Jetpack Compose and DataStore' },
  { path: 'build.gradle.kts', lang: 'kotlin', desc: 'Root build configuration defining plugins and repositories' },
  { path: 'settings.gradle.kts', lang: 'kotlin', desc: 'Gradle settings and dependency resolution repositories' },
  { path: 'gradle/libs.versions.toml', lang: 'properties', desc: 'Version catalog for Gradle, Kotlin, Compose, and AndroidX' },
  { path: 'gradle.properties', lang: 'properties', desc: 'Gradle properties configuring AndroidX, JVM heap, and Kotlin style' },
  { path: 'app/src/main/AndroidManifest.xml', lang: 'xml', desc: 'Android manifest with VpnService, TileService, and QUERY_ALL_PACKAGES' },
  { path: 'app/src/main/java/com/callglitch/app/CallGlitchApplication.kt', lang: 'kotlin', desc: 'Application class initializing notification channels and dependency singletons' },
  { path: 'app/src/main/java/com/callglitch/app/model/GlitchModels.kt', lang: 'kotlin', desc: 'Data models for profiles, impairment metrics, and installed application metadata' },
  { path: 'app/src/main/java/com/callglitch/app/data/AppDiscoveryRepository.kt', lang: 'kotlin', desc: 'Dynamically discovers installed apps via PackageManager with icon decoding' },
  { path: 'app/src/main/java/com/callglitch/app/data/GlitchSettingsRepository.kt', lang: 'kotlin', desc: 'Jetpack DataStore preferences repository for profile, apps, and timeout persistence' },
  { path: 'app/src/main/java/com/callglitch/app/vpn/CallGlitchVpnService.kt', lang: 'kotlin', desc: 'Core Android VpnService managing TUN lifecycle, per-app routing, and foreground service' },
  { path: 'app/src/main/java/com/callglitch/app/vpn/VpnSessionController.kt', lang: 'kotlin', desc: 'Serialized Mutex-guarded VPN/Tunnel/Proxy lifecycle state machine and health monitor' },
  { path: 'app/src/main/java/com/callglitch/app/vpn/TunnelEngine.kt', lang: 'kotlin', desc: 'TunnelEngine abstraction and HevTunnelEngine wrapping pinned heiher/hev-socks5-tunnel v2.20.0' },
  { path: 'app/src/main/java/com/callglitch/app/vpn/LocalSocks5ProxyServer.kt', lang: 'kotlin', desc: 'Loopback-only RFC 1928 SOCKS5 proxy (CONNECT + UDP ASSOCIATE, IPv4/IPv6/domain)' },
  { path: 'app/src/main/java/com/callglitch/app/vpn/ImpairmentController.kt', lang: 'kotlin', desc: 'Deterministic UDP loss/burst/delay engine and non-corrupting TCP latency/pacing/pause engine' },
  { path: 'app/src/main/java/com/callglitch/app/vpn/SocketProtector.kt', lang: 'kotlin', desc: 'Strict VpnService.protect() wrapper preventing outbound proxy routing loops' },
  { path: 'app/src/main/java/com/callglitch/app/tile/GlitchTileService.kt', lang: 'kotlin', desc: 'Android Quick Settings TileService for in-call 1-tap toggling without leaving calling apps' },
  { path: 'app/src/main/java/com/callglitch/app/ui/MainActivity.kt', lang: 'kotlin', desc: 'Single activity hosting Jetpack Compose UI, VPN intent launcher, and error dialogs' },
  { path: 'app/src/main/java/com/callglitch/app/ui/screens/MainScreen.kt', lang: 'kotlin', desc: 'Main Jetpack Compose screen with large tactile toggle, profile cards, and dynamic app selector' },
  { path: 'app/src/main/java/com/callglitch/app/ui/theme/GlitchTheme.kt', lang: 'kotlin', desc: 'Material3 dynamic color theme and typography definitions' },
  { path: 'app/src/test/java/com/callglitch/app/GlitchConfigTest.kt', lang: 'kotlin', desc: 'Unit tests verifying profile configuration parameters, TCP pacing, and timeout settings' },
  { path: 'app/src/test/java/com/callglitch/app/AppDiscoveryAndSelectionTest.kt', lang: 'kotlin', desc: 'Unit tests validating dynamic application selection, system filtering, and empty checks' },
  { path: 'app/src/test/java/com/callglitch/app/ImpairmentControllerTest.kt', lang: 'kotlin', desc: 'Deterministic tests for UDP loss, burst cycles, DNS exemption, and TCP pacing' },
  { path: 'app/src/test/java/com/callglitch/app/LocalSocks5ProxyServerTest.kt', lang: 'kotlin', desc: 'Integration tests for RFC 1928 TCP/UDP proxying, IPv4/IPv6, byte integrity, and protect() failures' },
  { path: 'app/src/test/java/com/callglitch/app/VpnSessionControllerLifecycleTest.kt', lang: 'kotlin', desc: 'Lifecycle tests for 25 start/stop cycles, partial startup rollback, and crash recovery' }
];

let tsContent = `export interface AndroidProjectFile {
  path: string;
  language: 'kotlin' | 'xml' | 'groovy' | 'markdown' | 'properties' | 'json';
  description: string;
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
`;

for (const f of fileList) {
  const fullPath = path.join(androidDir, f.path);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  // Escape backticks and ${} for template literals
  const escaped = content
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\${/g, '\\${');

  tsContent += `  {
    path: ${JSON.stringify(f.path)},
    language: ${JSON.stringify(f.lang)},
    description: ${JSON.stringify(f.desc)},
    content: \`${escaped}\`
  },
`;
}

tsContent += `];\n`;

const targetFile = path.join(projectRoot, 'src/android/projectFiles.ts');
fs.writeFileSync(targetFile, tsContent, 'utf-8');
console.log(`Successfully synced ${fileList.length} files to ${targetFile}`);
