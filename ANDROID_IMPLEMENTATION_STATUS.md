# Android implementation status

## Repository state

The default branch currently contains a Vite/React project that presents a simulator, architecture diagram, test runner, and a generated Android Studio project ZIP. It is not itself an Android Studio project.

## Critical implementation gap

The currently generated `PacketForwardingEngine.kt` must be treated as a non-functional prototype, not a working packet forwarder:

- It parses some IPv4 UDP packets, but does not correctly implement IPv6.
- It does not implement TCP forwarding. The current `forwardRawPacket()` method only increments a counter.
- It does not reconstruct correct reverse-flow transport/IP packet metadata for a general UDP flow.
- It does not implement a complete TCP/IP stack, UDP NAT semantics, fragmentation handling, checksums, ICMP handling, or robust DNS behaviour.
- The UI's simulated telemetry and `TestSuiteRunner` are synthetic. A simulated PASS is not evidence of a real Android test.

Do not ship this implementation as a functional VPN. Do not expose it as a real network impairment engine.

## Safe implementation sequence

1. Establish a genuine Android Studio Gradle project with reproducible wrapper files and a CI build.
2. Keep the VpnService lifecycle, Quick Settings tile, notification STOP action, settings and UI separate from the packet engine.
3. Select, pin and document a proven, licence-compatible user-space forwarding implementation with verified Android integration and actual TCP/UDP behaviour. Do not assume that a generic tun2socks binary supports direct internet forwarding: prove the chosen engine can operate with the intended local/direct backend.
4. Implement impairment only at a well-defined, tested forwarding boundary, preferably with per-flow bounded scheduling and explicit shutdown semantics.
5. Do not claim per-app isolation unless routes and app selection are verified on a real Android device.
6. Add instrumentation/unit tests for the engine and device tests for VPN permission, tile activation, notification STOP, app isolation and recovery.
7. Never report synthetic test results as measurements. Clearly label simulated UI data as simulated.

## In-call control requirement

The primary user flow is: while in an existing call, swipe down Android Quick Settings, tap the Call Glitch tile once to toggle the preconfigured mode, then tap again to stop. VPN permission and mandatory setup must be completed beforehand. The persistent notification must always provide a STOP action. An overlay button is optional and must not be required.

## Scope and safety

The feature is a local network-quality testing utility. It must affect only the user's own device and selected applications, never transmit radio interference, jam Wi-Fi, modify a router, or affect nearby devices. The fail-safe is to stop and release the VPN interface if the forwarding engine fails.

## Current confidence

No generated APK or real-device validation is established by the current web simulator. Build and device validation remain outstanding.
