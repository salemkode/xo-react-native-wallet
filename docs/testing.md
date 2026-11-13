# Testing

## Local checks

```sh
npm ci
npm run setup:native
npm test
npm run typecheck
npm run lint
```

Node exercises 12 receive, balance, review, cancellation, signature, broadcast,
lookup and spent-output checks against an injected deterministic Electrum fixture,
covering Mainnet and Chipnet configuration. Fixture keys are public BIP39 vectors;
**never fund them**. No fixture transaction is submitted to a real network.
Node uses upstream WASM, not the native runtime.

In a development native build, Settings → Run native wallet checks runs the same
12 scenarios through the real package entry and compiled C/JSI cryptography. The
RPC is explicitly injected by the development-only test harness; the live wallet
always uses WSS Electrum. Keep both checks so a passing mock does not hide a native
crypto failure.

## Native builds

```sh
cd ios
pod install
cd ..
xcodebuild -workspace ios/XOWallet.xcworkspace -scheme XOWallet \
  -configuration Debug -sdk iphonesimulator \
  -destination 'id=YOUR_SIMULATOR_UDID' -derivedDataPath artifacts/ios \
  CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=-
```

Signing matters for Keychain even in a simulator. For Android, set JDK 17 and
ANDROID_HOME, then:

```sh
cd android
./gradlew :app:assembleDebug -PreactNativeDevServerPort=8097 \
  -PreactNativeArchitectures=arm64-v8a
```

Use Argent to install/launch/inspect and replay on an owned device. Do not use
compiler commands as a substitute UI controller.

## UI regression contract

Baseline: dedicated account exists, Chipnet selected, no pending payment. New
account creation and secure-storage read/write are checked separately. Never
reset an existing meaningful account merely to run this flow.

| Action | Expected evidence | State effect |
| --- | --- | --- |
| Launch | Wallet and Chipnet badge | Read existing secure account |
| Receive | Receiving-address screen and prefixed address | None |
| Send | Send form, invalid amount/address rejected | No broadcast |
| Settings | Network controls | None |
| Select Mainnet, cancel | Chipnet still selected after re-entry | None |
| Select Mainnet, confirm | Mainnet badge; setting survives app restart | Preference only |
| Return to Chipnet | Chipnet badge and original receive address | Restore baseline |
| Run development checks | 12/12 native wallet checks passed | Offline test fixtures only |

Navigation gates must establish destination identity followed by readiness; known
controls use semantic test IDs. Saved flows and exact pass evidence are listed
below after verification. Do not treat screenshots or console messages as an
executable flow verdict.

Live funded-chain transfers need a dedicated Chipnet account and faucet funds.
The faucet linked by the app requires a human CAPTCHA; do not bypass it. Mainnet
QA is read-only. A signed fixture broadcast is not proof of a public-chain payment.

The first native proof exposed gaps that Node alone did not catch: missing
structuredClone, an eager integer exceeding Hermes' BigInt capacity, and Metro's
private-field lowering interacting with Object.freeze. The adapter supplies the
clone polyfill and lazy optional integer limits; the wallet protects public
identity fields without freezing internal state. The package repository now also
runs the real React Native Babel transform in a regression test.

## Verified development baseline

- Package repository: 40 tests, including the actual React Native Babel transform;
  isolated packed consumers for both supported libauth versions.
- This app: the published package tarballs run all 12 deterministic wallet scenarios
  in Node; the TypeScript usage check and ESLint pass.
- iOS simulator: both native compilation and the on-device 12/12 wallet scenario
  suite pass. Keychain writes and account reads across restarts work. Chipnet and
  Mainnet public Electrum reads, receive prefixes, switch cancellation and network
  persistence were exercised manually. No Mainnet broadcast was made.
- Android: arm64 debug build passes. Runtime behavior on an emulator/device is
  **not yet verified**.
- Live funded Chipnet transfer: iOS self-payment submitted and independently
  retrieved from the network; receipt/balance restored after restart. See below.

## Live Chipnet payment

On 2026-11-13, this template at commit `22d046f` used the published release
packages (`react-native-libauth` 0.2.0 and `react-native-xo` 0.1.0) on an iOS 26.4
simulator with React Native 0.81.5, React 19.1 and Hermes/New Architecture.

The user funded a dedicated, freshly generated Chipnet account with 1,017,000
satoshis. The receiving transaction was confirmed at height 332171. Through the
app's normal send/review/confirmation UI, the wallet signed and submitted a
1,000-satoshi self-payment with a 226-satoshi fee. No public fixture was funded,
no Mainnet transaction was submitted, and no recovery phrase was inspected.

Transaction:
[`f9137bf69ac64636b99fd96668336981775975d31e0e1141ea8c750a53cf2da3`](https://chipnet.chaingraph.cash/tx/f9137bf69ac64636b99fd96668336981775975d31e0e1141ea8c750a53cf2da3).
An independent Electrum read returned the transaction bytes, whose double SHA-256
matched this ID, and two wallet outputs of 1,000 and 1,015,774 satoshis. After an
app restart, the receipt remained visible and the balance was 0.01016774 BCH.
The outgoing transaction was visible in the mempool, **not yet confirmed**, when
checked. The [public verification record](https://github.com/salemkode/react-native-libauth/blob/HEAD/docs/chipnet-live-payment.json)
contains the raw public transaction and network response.

This proves one live manual iOS receive/sign/send/persist path. It is not Android
runtime proof, an automated full-flow pass, or a complete port of upstream tests.
The full Libauth/XO suite port and comparative native runtime trials remain
unfinished in the package project.

### Follow-up issues found during live verification

- After a long idle period, refreshing encountered a closed Electrum connection;
  restarting the app opened a fresh session and recovered the funded balance.
- With a receipt or connection error visible, reconnect/refresh controls can
  overlap the bottom navigation until the page is scrolled. Improve this layout
  and cover reconnect recovery before claiming those cases are verified.

### Saved replay limitation

The live walkthrough is retained in `.argent/e2e/qa-wallet-network-settings.yaml`
and `.argent/e2e/qa-native-wallet.yaml`. Semantic selector assertions and an isolated
Settings navigation pass, but full replay with Argent 0.32 reports a successful tap
without navigating after launch. The following Network identity assertion fails.
These files are **unverified regression artifacts**, not passing automation.
The native checks themselves pass when run through the UI. Do not delete or weaken
the failing navigation assertion to mark replay green. Fix the controller/replay
issue, then obtain two unchanged full passes with fresh scoped services before
claiming QA flow completion.

Examples for investigation on an explicitly owned simulator:

```sh
argent e2e run qa-native-wallet --platform ios --device YOUR_SIMULATOR_UDID
argent e2e run qa-wallet-network-settings --platform ios --device YOUR_SIMULATOR_UDID
```
