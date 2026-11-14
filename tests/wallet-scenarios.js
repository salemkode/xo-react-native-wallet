import {
  binToHex,
  cashAddressToLockingBytecode,
  createVirtualMachineBCH,
  decodeTransaction,
  encodeTransaction,
  hashTransaction,
  hexToBin,
} from '@bitauth/libauth';
import headers from './checkpoint-headers.js';

// Public BIP39 test vector, used only with the in-memory RPC below. No live funds.
const mnemonic =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
function check(condition, message) {
  if (!condition) throw new Error(message);
}

export async function runWalletScenarios(createWallet) {
  const outcomes = [];
  for (const network of ['chipnet', 'mainnet']) {
    const data = { unspent: [], transactions: new Map(), broadcasts: 0 };
    const client = {
      async request(method, params) {
        if (method === 'server.version') return ['offline fixture', '1.4'];
        if (method === 'blockchain.block.header') return headers[network];
        if (method === 'blockchain.scripthash.listunspent') return data.unspent;
        if (method === 'blockchain.transaction.get')
          return data.transactions.get(params[0]);
        if (method === 'blockchain.transaction.broadcast') {
          data.broadcasts++;
          const bytes = hexToBin(params[0]);
          const transaction = decodeTransaction(bytes);
          const sourceOutputs = data.unspent.map(
            item =>
              decodeTransaction(hexToBin(data.transactions.get(item.tx_hash)))
                .outputs[item.tx_pos],
          );
          check(
            createVirtualMachineBCH().verify({ transaction, sourceOutputs }) ===
              true,
            'Native signed transaction failed VM verification',
          );
          const txid = hashTransaction(bytes);
          data.transactions.set(txid, params[0]);
          data.unspent = [];
          return txid;
        }
        throw new Error('Unexpected offline RPC');
      },
      close() {},
    };
    const wallet = await createWallet({ mnemonic, network, client });
    try {
      check(
        wallet.address.startsWith(
          network === 'chipnet' ? 'bchtest:' : 'bitcoincash:',
        ),
        'Wrong address network',
      );
      outcomes.push(`${network}: receive address`);
      const source = {
        version: 2,
        locktime: 0,
        inputs: [
          {
            outpointTransactionHash: new Uint8Array(32).fill(1),
            outpointIndex: 0,
            sequenceNumber: 0xffffffff,
            unlockingBytecode: new Uint8Array(),
          },
        ],
        outputs: [
          {
            lockingBytecode: cashAddressToLockingBytecode(wallet.address)
              .bytecode,
            valueSatoshis: 100000n,
          },
        ],
      };
      const bytes = encodeTransaction(source);
      const txid = hashTransaction(bytes);
      data.transactions.set(txid, binToHex(bytes));
      data.unspent.push({ tx_hash: txid, tx_pos: 0, height: 1, value: 100000 });
      check(
        (await wallet.refresh()).balanceSatoshis === '100000',
        'Wrong received balance',
      );
      outcomes.push(`${network}: receive balance`);
      const cancelled = await wallet.prepareSend({
        address: wallet.address,
        amountBch: '0.0005',
      });
      wallet.cancelSend();
      try {
        await wallet.broadcast(cancelled.id);
        throw new Error('Cancelled payment was accepted');
      } catch (error) {
        check(
          error.message.includes('expired'),
          'Cancel must invalidate payment',
        );
      }
      check(data.broadcasts === 0, 'Cancellation broadcast unexpectedly');
      outcomes.push(`${network}: cancel prevents broadcast`);
      const draft = await wallet.prepareSend({
        address: wallet.address,
        amountBch: '0.0005',
      });
      check(
        draft.amountBch === '0.00050000' &&
          Number(draft.feeSatoshis) >= draft.byteLength,
        'Wrong payment review',
      );
      outcomes.push(`${network}: signed review and fee`);
      const result = await wallet.broadcast(draft.id);
      check(
        result.txid === draft.txid && data.broadcasts === 1,
        'Wrong broadcast',
      );
      outcomes.push(`${network}: native signature and broadcast`);
      check(
        (await wallet.lookupTransaction(result.txid)).found,
        'Transaction lookup failed',
      );
      check(
        (await wallet.refresh()).balanceSatoshis === '0',
        'Spent balance did not update',
      );
      outcomes.push(`${network}: transaction lookup and spent balance`);
    } finally {
      wallet.close();
    }
  }
  return outcomes;
}
