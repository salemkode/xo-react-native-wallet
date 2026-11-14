import * as lib from '@bitauth/libauth';
import { initializeLibauth } from 'react-native-libauth';
import { benchmarkCrypto } from './performance-workload';
import { runNativeSuite } from './native-suite';

export function installBenchmark() {
  globalThis.__XO_NATIVE_CHECK__ = runNativeSuite;
  globalThis.__XO_BENCHMARK__ = async () => {
    await initializeLibauth();
    return {
      runtime: 'Hermes / Polygen C-JSI / iOS simulator / Debug',
      ...(await benchmarkCrypto(lib)),
    };
  };
}
