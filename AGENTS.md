# Agent guide

## Product and boundaries

This is a compact BCH send/receive template using the separately distributed
react-native-xo and react-native-libauth packages. Keep transaction construction,
key derivation and Electrum RPC in the package repository. Do not copy them into
screens or add mock-success production fallbacks. We use XO primitives, not its
full engine/invitation system. Default new installs to Chipnet.

Read README.md and docs/development.md before editing. Use exact dependency
versions and preserve the release tarball integrity entries in package-lock.json.
Run npm ci, npm run setup:native, npm test, npm run typecheck, and npm run lint.
Node checks use WASM, so native proof also needs the development check screen.

## Money and secrets

Recovery phrases belong only in Keychain/Keystore. AsyncStorage stores public
preferences, txids and pending-payment metadata. Never log, screenshot, commit,
or expose an actual phrase through debugger tools. Do not fund public test
vectors. Never broadcast a Mainnet transaction during QA. Use a dedicated Chipnet
account for live funding and sending.

A payment must show full address, amount, fee, total and network before confirmation.
Persist its pending record before calling broadcast. Never automatically retry an
ambiguous broadcast. Keep pending records across restarts and block new sends until
resolved. Do not bypass these checks for UI tests.

## Native tooling

Use Argent MCP and its relevant skills for all device UI. Keep the assigned
device/session, project and Metro port 8097; check claims first. Never bypass a
foreign device claim. Inspect before tapping, prefer semantic saved flows, bound
inspection, and verify outcomes. No simctl, agent-device, AXe, mobile-fast, or
alternate UI controllers. Do not enable T3 agent device access.

Build with xcodebuild or Gradle. Simulator builds must be signed for Keychain.
Use an owned device and explicit ids. Reuse development builds for JS-only edits;
regenerate native code and rebuild after changing native compatibility. Keep logs,
derived data and screenshots under ignored artifacts/. Never stop another task's
Metro or perform unscoped Argent cleanup. Refer to docs/testing.md.

## Git

main/master are permanently protected: never commit there, push any ref to them,
merge PRs, enable auto-merge, or bypass hooks. Use task branches and explicit
non-protected push destinations. Maintainers perform merges manually.
