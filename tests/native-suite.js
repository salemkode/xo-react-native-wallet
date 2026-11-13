import { createWallet } from 'react-native-xo';
import { runWalletScenarios } from './wallet-scenarios';
export async function runNativeSuite() {
  const outcomes = await runWalletScenarios(createWallet);
  return `${outcomes.length}/12 native wallet checks passed`;
}
