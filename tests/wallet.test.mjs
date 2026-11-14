import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeNativeCrypto } from '@bitauth/libauth/build/lib/crypto/default-crypto-instances.js';
import { createWalletSession } from 'react-native-xo/core';
import { runWalletScenarios } from './wallet-scenarios.js';
await initializeNativeCrypto();
test('packed wallet package: receive, review, cancel, sign, broadcast and lookup on both networks', async () => {
  assert.equal((await runWalletScenarios(createWalletSession)).length, 12);
});
