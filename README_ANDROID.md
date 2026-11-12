# Call Glitch — Android implementation

This repository currently includes a React/Vite development workbench and generated Android project source. The React simulator is not the Android app and its simulated telemetry is not real network telemetry.

## Android project

The Android Studio project is generated from `src/android/projectFiles.ts` by the web workbench. To use it:

1. Open the repository web workbench and use **Download Android Project**.
2. Extract the ZIP.
3. Open the extracted project root in Android Studio.
4. Let Gradle sync, then run the debug variant on a physical Android device.

The generated project must not yet be treated as a production-ready network impairment VPN. See [ANDROID_IMPLEMENTATION_STATUS.md](ANDROID_IMPLEMENTATION_STATUS.md) for known blockers.

## Build validation

The Android CI workflow expects a checked-in Gradle project with a Gradle wrapper at repository root. At present, the Android project is embedded as generated source rather than committed as a directly buildable Gradle project. The workflow is deliberately a project-presence gate; it will fail until the actual Android project is promoted to the repository root (or the workflow is adapted to generate it before building).

## Essential warning

The original generated packet engine is incomplete and must not be used as a real VPN forwarder. In particular, TCP forwarding is not implemented. Never rely on the simulator's test-suite PASS indicators as proof of packet forwarding or Android device behaviour.
