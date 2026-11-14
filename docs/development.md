# Development guide

## How the pieces fit

The app imports `createWallet` from the installed `react-native-xo` package. That
initializes `react-native-libauth`, then derives a network-specific BIP44 key.
XO primitives validate private keys, integer amounts and transaction hashes.
Normal libauth constructs and verifies transactions; its crypto runs as generated
C through JSI on the phone. Electrum uses React Native's WebSocket implementation.

The app persists a generated/imported mnemonic in native secure storage. Only
public preferences, pending txids and the last submitted receipt use AsyncStorage.
`createWallet` returns an address before the first network refresh, so receive
remains available when connectivity fails. Reconnect opens a fresh session.

Settings saves the selected network, closes the previous session, clears forms,
and creates the new session. Mainnet and Chipnet derive different keys. No funds
are transferred by a setting change. An unresolved payment prevents switching.

## Dependencies and updates

The lockfile installs public GitHub release tarballs of the two reusable packages.
They are real independently packed npm packages, not workspace links. Their source
is at https://github.com/salemkode/react-native-libauth. Keep libauth pinned to
3.1.0-next.8 and XO primitives pinned to 0.0.5 until an update is separately tested.

To work on the packages locally, pack both from that repository, install their
absolute tarball paths here, and run `npm run setup:native`. Before publishing the
template, restore the public release URLs, regenerate the lockfile, and verify a
fresh clone. Never commit a developer-specific file path.

`npm ci` reapplies JavaScript compatibility patches. Run `npm run setup:native`
after installing dependencies and before a native build. Preserve existing
postinstall commands when embedding this setup into another project.

## Extending the UI

Navigation is intentionally a few screens. Change the theme in src/theme.js,
layout in src/styles.js, and app policy in App.jsx. Continue using the package's
immutable payment reviews. Hide sensitive recovery data when the app backgrounds.
Do not add analytics around phrases or signing data.

The starter does not include biometric app unlock, address rotation/discovery,
SPV chain validation, token support, transaction-history indexing, or an independent
security audit. Add and review these deliberately before building a production
wallet around it.

## Distribution and signing

Change `cash.xo.wallet` in both native projects and choose your iOS development
team before installing on hardware. Use your own application identity and release
signing keys. The included Android debug keystore is the standard public development
key; it is not suitable for publishing a release.

Public pull requests are the review boundary. Protected-branch rules leave all
merges and protected-branch creation to the maintainer.
