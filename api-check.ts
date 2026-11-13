import { createWallet, parseBch, formatBch } from 'react-native-xo';
async function application() {
  const wallet = await createWallet({
    mnemonic: 'loaded from secure storage',
    network: 'chipnet',
  });
  const balance = await wallet.refresh();
  const review = await wallet.prepareSend({
    address: wallet.address,
    amountBch: '0.0001',
  });
  wallet.cancelSend();
  wallet.close();
  return {
    balance: balance.balanceSatoshis,
    fee: review.feeBch,
    amount: formatBch(parseBch('0.01')),
  };
}
void application;
