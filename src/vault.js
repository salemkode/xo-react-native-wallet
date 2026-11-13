import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeBip39Mnemonic, generateBip39Mnemonic } from '@bitauth/libauth';
import { initializeLibauth } from 'react-native-libauth';
import { z } from 'zod';

const service = 'cash.xo.wallet.mnemonic.v1';
const options = {
  service,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const networkSchema = z.enum(['chipnet', 'mainnet']);
const pendingSchema = z.object({
  network: networkSchema,
  txid: z.string().regex(/^[a-f0-9]{64}$/),
  amountBch: z.string(),
  address: z.string(),
});
const keys = {
  network: 'xo.network.v1',
  pending: 'xo.pending.v1',
  receipt: 'xo.receipt.v1',
};

export async function readMnemonic() {
  const entry = await Keychain.getGenericPassword(options);
  return entry ? entry.password : null;
}

export async function saveAccount(importedPhrase) {
  await initializeLibauth();
  if (await readMnemonic()) throw new Error('An account already exists.');
  const phrase = importedPhrase
    ? importedPhrase.trim().normalize('NFKD').split(/\s+/).join(' ')
    : generateBip39Mnemonic();
  const entropy = decodeBip39Mnemonic(phrase);
  if (typeof entropy === 'string')
    throw new Error('Invalid recovery phrase. Check its words and checksum.');
  entropy.fill(0);
  const saved = await Keychain.setGenericPassword('wallet', phrase, options);
  if (!saved) throw new Error('Secure storage could not save the account.');
}

export async function readPreferences() {
  const [network, pending, receipt] = await Promise.all(
    Object.values(keys).map(key => AsyncStorage.getItem(key)),
  );
  return {
    network: network ? networkSchema.parse(network) : 'chipnet',
    pending: pending ? pendingSchema.parse(JSON.parse(pending)) : null,
    receipt: receipt ? pendingSchema.parse(JSON.parse(receipt)) : null,
  };
}
export async function saveNetwork(network) {
  await AsyncStorage.setItem(keys.network, networkSchema.parse(network));
}
export async function savePending(payment) {
  await AsyncStorage.setItem(
    keys.pending,
    JSON.stringify(pendingSchema.parse(payment)),
  );
}
export async function completePayment(payment) {
  await AsyncStorage.setItem(
    keys.receipt,
    JSON.stringify(pendingSchema.parse(payment)),
  );
  await AsyncStorage.removeItem(keys.pending);
}

export async function clearUnsubmittedPayment() {
  await AsyncStorage.removeItem(keys.pending);
}
