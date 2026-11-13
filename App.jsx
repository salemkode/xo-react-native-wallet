import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { createWallet, NETWORKS } from 'react-native-xo';
import {
  readMnemonic,
  saveAccount,
  readPreferences,
  saveNetwork,
  savePending,
  completePayment,
  clearUnsubmittedPayment,
} from './src/vault';
import { colors as c } from './src/theme';
import {
  styles,
  buttonTextStyle,
  noteTextStyle,
  networkBadgeStyle,
  tabTextStyle,
} from './src/styles';
function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  testID,
  icon: Icon,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 18,
        backgroundColor: disabled ? c.disabled : secondary ? c.paper : c.green,
        borderWidth: secondary ? 1 : 0,
        borderColor: c.border,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {Icon ? <Icon size={20} color={secondary ? c.ink : c.paper} /> : null}
      <Text style={buttonTextStyle(secondary)}>{label}</Text>
    </Pressable>
  );
}
function Label({ children }) {
  return <Text style={styles.label}>{children}</Text>;
}
function Title({ children }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}
function Note({ children, danger = false }) {
  return (
    <View style={styles.note}>
      <Text style={noteTextStyle(danger)}>{children}</Text>
    </View>
  );
}
function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}
function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={c.muted}
        style={styles.input}
      />
    </View>
  );
}
function WalletApp() {
  const [account, setAccount] = useState({
    status: 'loading',
  });
  const [screen, setScreen] = useState('wallet');
  const [network, setNetwork] = useState('chipnet');
  const [balance, setBalance] = useState(null);
  const [activity, setActivity] = useState('idle');
  const [notice, setNotice] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [phraseInput, setPhraseInput] = useState('');
  const [recovery, setRecovery] = useState('');
  const [review, setReview] = useState(null);
  const [pending, setPending] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [qa, setQa] = useState('');
  const session = useRef(null);
  const generation = useRef(0);
  const operation = useRef(false);
  const activeNetwork = useRef('chipnet');
  const connect = useCallback(async selected => {
    const revision = ++generation.current;
    session.current?.close();
    session.current = null;
    setBalance(null);
    setNotice('');
    setConnectionError('');
    setActivity('connecting');
    try {
      const mnemonic = await readMnemonic();
      if (!mnemonic) {
        setAccount({
          status: 'new',
        });
        setActivity('idle');
        return;
      }
      const wallet = await createWallet({
        mnemonic,
        network: selected,
      });
      if (revision !== generation.current) {
        wallet.close();
        return;
      }
      session.current = wallet;
      setAccount({
        status: 'ready',
        address: wallet.address,
      });
      const snapshot = await wallet.refresh();
      if (revision === generation.current) setBalance(snapshot);
    } catch (error) {
      if (revision === generation.current) {
        setConnectionError(error.message);
        if (!session.current) setNotice(error.message);
        if (!session.current)
          setAccount({
            status: 'error',
          });
      }
    } finally {
      if (revision === generation.current) setActivity('idle');
    }
  }, []);
  const disconnect = useCallback(() => {
    generation.current++;
    session.current?.close();
    session.current = null;
  }, []);
  useEffect(() => {
    async function start() {
      try {
        const saved = await readPreferences();
        activeNetwork.current = saved.network;
        setNetwork(saved.network);
        setPending(saved.pending);
        setReceipt(saved.receipt);
        await connect(saved.network);
      } catch (error) {
        setAccount({
          status: 'error',
        });
        setNotice(error.message);
      }
    }
    start();
    return disconnect;
  }, [connect, disconnect]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') setRecovery('');
    });
    return () => subscription.remove();
  }, []);
  async function refresh() {
    if (operation.current) return;
    operation.current = true;
    setActivity('refreshing');
    setConnectionError('');
    try {
      if (!session.current) await connect(activeNetwork.current);
      else setBalance(await session.current.refresh());
    } catch (error) {
      setConnectionError(error.message);
    } finally {
      operation.current = false;
      setActivity('idle');
    }
  }
  async function setup(importing) {
    if (operation.current) return;
    operation.current = true;
    setActivity('saving');
    setNotice('');
    try {
      await saveAccount(importing ? phraseInput : undefined);
      setPhraseInput('');
      await connect(network);
    } catch (error) {
      setNotice(error.message);
    } finally {
      operation.current = false;
      setActivity('idle');
    }
  }
  async function changeNetwork(selected) {
    if (operation.current || review || pending || selected === network) return;
    operation.current = true;
    try {
      await saveNetwork(selected);
      activeNetwork.current = selected;
      setNetwork(selected);
      setRecipient('');
      setAmount('');
      setReceipt(null);
      setRecovery('');
      await connect(selected);
    } catch (error) {
      setNotice(error.message);
    } finally {
      operation.current = false;
    }
  }
  function chooseNetwork(selected) {
    if (selected === 'mainnet' && network !== 'mainnet') {
      Alert.alert(
        'Use real Bitcoin Cash?',
        'Mainnet uses real funds. Keep your recovery phrase safe. Chipnet funds cannot be moved to Mainnet.',
        [
          {
            text: 'Stay on Chipnet',
            style: 'cancel',
          },
          {
            text: 'Switch to Mainnet',
            onPress: () => changeNetwork(selected),
          },
        ],
      );
    } else changeNetwork(selected);
  }
  function navigate(next) {
    if (operation.current) return;
    session.current?.cancelSend();
    setReview(null);
    setRecovery('');
    setNotice('');
    setScreen(next);
  }
  async function prepare() {
    Keyboard.dismiss();
    if (operation.current || pending) return;
    operation.current = true;
    setActivity('preparing');
    setNotice('');
    try {
      if (!session.current) throw new Error('Connect the wallet first.');
      setReview(
        await session.current.prepareSend({
          address: recipient,
          amountBch: amount,
        }),
      );
    } catch (error) {
      setNotice(error.message);
    } finally {
      operation.current = false;
      setActivity('idle');
    }
  }
  async function send() {
    if (operation.current || !review || pending) return;
    operation.current = true;
    setActivity('sending');
    setNotice('');
    const payment = {
      network: review.network,
      address: review.address,
      amountBch: review.amountBch,
      txid: review.txid,
    };
    try {
      // Persist the txid before submission. A process death or lost response must
      // not turn into an automatic second payment on the next launch.
      await savePending(payment);
      setPending(payment);
      try {
        await session.current.broadcast(review.id);
      } catch (error) {
        // Only the package's submit-attempt error is ambiguous. Preflight
        // failures (expired, cancelled, spent inputs) never reach broadcast.
        if (error.name !== 'BroadcastUncertainError') {
          await clearUnsubmittedPayment();
          setPending(null);
        }
        throw error;
      }
      await completePayment(payment);
      setPending(null);
      setReceipt(payment);
      setReview(null);
      setRecipient('');
      setAmount('');
      setScreen('wallet');
      setBalance(await session.current.refresh());
    } catch (error) {
      setReview(null);
      setNotice(error.message);
    } finally {
      operation.current = false;
      setActivity('idle');
    }
  }
  async function checkPending() {
    if (operation.current || !pending || !session.current) return;
    operation.current = true;
    setActivity('checking');
    setNotice('');
    try {
      await session.current.lookupTransaction(pending.txid);
      await completePayment(pending);
      setReceipt(pending);
      setPending(null);
      setBalance(await session.current.refresh());
    } catch {
      setNotice(
        'The transaction is not visible yet. Keep its ID and check again later. No second payment has been sent.',
      );
    } finally {
      operation.current = false;
      setActivity('idle');
    }
  }
  async function showRecovery() {
    try {
      setRecovery(await readMnemonic());
    } catch (error) {
      setNotice(error.message);
    }
  }
  async function runQa() {
    setQa('Running native wallet checks');
    try {
      const { runNativeSuite } = require('./tests/native-suite');
      const result = await runNativeSuite();
      setQa(result);
      console.log('XO_NATIVE_QA', result);
    } catch (error) {
      setQa(`Native checks failed: ${error.message}`);
    }
  }
  const busy = activity !== 'idle';
  const config = NETWORKS[network];
  const tabs = [
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
    },
    {
      id: 'send',
      label: 'Send',
      icon: ArrowUpRight,
    },
    {
      id: 'receive',
      label: 'Receive',
      icon: ArrowDownLeft,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={c.background} />
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandGlyph}>₿</Text>
          </View>
          <Text style={styles.brandName}>xo wallet</Text>
        </View>
        <View testID={`network-${network}`} style={networkBadgeStyle(network)}>
          <Text style={styles.badgeLabel}>
            {config.label}
            {network === 'chipnet' ? ' · test funds' : ' · real BCH'}
          </Text>
        </View>
      </View>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            account.status === 'ready' ? (
              <RefreshControl
                refreshing={activity === 'refreshing'}
                onRefresh={refresh}
                tintColor={c.green}
              />
            ) : undefined
          }
        >
          {account.status === 'loading' ? (
            <View style={styles.loading}>
              <ActivityIndicator color={c.green} />
              <Text style={styles.muted}>Opening your wallet…</Text>
            </View>
          ) : null}
          {account.status === 'error' ? (
            <>
              <Title>Unable to open wallet</Title>
              <Note danger>{notice}</Note>
              <Button label="Try again" onPress={() => connect(network)} />
            </>
          ) : null}
          {account.status === 'new' ? (
            <View testID="welcome-screen" style={styles.welcome}>
              <View style={styles.welcomeMark}>
                <Wallet size={34} color={c.green} />
              </View>
              <Label>BITCOIN CASH, IN YOUR HANDS</Label>
              <Title>Cash, simply.</Title>
              <Text style={styles.intro}>
                A small wallet for sending and receiving Bitcoin Cash. Start on
                Chipnet with test funds.
              </Text>
              <Button
                label={busy ? 'Creating wallet…' : 'Create a wallet'}
                testID="create-wallet"
                disabled={busy}
                onPress={() => setup(false)}
              />
              <Text style={styles.restoreLabel}>
                Already have a recovery phrase?
              </Text>
              <Field
                label="Recovery phrase"
                testID="restore-phrase"
                value={phraseInput}
                onChangeText={setPhraseInput}
                multiline
                secureTextEntry={false}
                autoCorrect={false}
                autoCapitalize="none"
                placeholder="Enter your 12 or 24 words"
              />
              <Button
                label="Restore wallet"
                secondary
                disabled={busy || !phraseInput.trim()}
                onPress={() => setup(true)}
              />
              {notice ? <Note danger>{notice}</Note> : null}
            </View>
          ) : null}
          {account.status === 'ready' ? (
            <>
              {pending ? (
                <View testID="pending-payment">
                  <Note>
                    A payment needs checking before you send again. Its outcome
                    is saved on this device.
                  </Note>
                  <Text selectable style={styles.transactionId}>
                    {pending.txid}
                  </Text>
                  <Button
                    label="Check payment status"
                    disabled={busy}
                    onPress={checkPending}
                  />
                </View>
              ) : null}
              {screen === 'wallet' ? (
                <View testID="wallet-screen">
                  <View style={styles.balanceSection}>
                    <Label>
                      YOUR {network === 'chipnet' ? 'TEST ' : ''}BALANCE
                    </Label>
                    <Text
                      testID="balance"
                      adjustsFontSizeToFit
                      numberOfLines={1}
                      style={styles.balance}
                    >
                      {balance ? balance.balanceBch : '—'}
                    </Text>
                    <Text style={styles.balanceUnit}>
                      {network === 'chipnet'
                        ? 'tBCH · no monetary value'
                        : 'BCH · Bitcoin Cash'}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <View style={styles.fill}>
                      <Button
                        label="Send"
                        testID="home-send"
                        icon={ArrowUpRight}
                        disabled={busy || Boolean(pending)}
                        onPress={() => navigate('send')}
                      />
                    </View>
                    <View style={styles.fill}>
                      <Button
                        label="Receive"
                        testID="home-receive"
                        secondary
                        icon={ArrowDownLeft}
                        disabled={busy}
                        onPress={() => navigate('receive')}
                      />
                    </View>
                  </View>
                  <Card>
                    <View style={styles.cardHeading}>
                      <ShieldCheck color={c.green} size={25} />
                      <Text style={styles.cardTitle}>
                        Your keys stay with you
                      </Text>
                    </View>
                    <Text style={styles.body}>
                      Back up your recovery phrase in Settings. You need it to
                      restore access on another device.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => navigate('settings')}
                    >
                      <Text style={styles.link}>Open settings →</Text>
                    </Pressable>
                  </Card>
                  {receipt && receipt.network === network ? (
                    <Card>
                      <Check size={25} color={c.green} />
                      <Text testID="payment-sent" style={styles.receiptTitle}>
                        Payment submitted
                      </Text>
                      <Text style={styles.muted}>{receipt.amountBch} BCH</Text>
                      <Text selectable style={styles.smallMuted}>
                        {receipt.txid}
                      </Text>
                    </Card>
                  ) : (
                    <Text style={styles.emptyState}>
                      Ready when you are. Receive some{' '}
                      {network === 'chipnet' ? 'test BCH' : 'BCH'} to make your
                      first payment.
                    </Text>
                  )}
                  <View style={styles.sectionGap}>
                    <Button
                      label={busy ? 'Connecting…' : 'Refresh balance'}
                      secondary
                      disabled={busy}
                      onPress={refresh}
                    />
                  </View>
                </View>
              ) : null}
              {screen === 'receive' ? (
                <View testID="receive-screen">
                  <Label>RECEIVE BITCOIN CASH</Label>
                  <Title>Your receiving address</Title>
                  <Text style={styles.receiveIntro}>
                    Share this address to receive {config.label} BCH.
                  </Text>
                  <Card>
                    <View style={styles.qr}>
                      <QRCode
                        value={account.address}
                        size={210}
                        color={c.ink}
                        backgroundColor={c.paper}
                      />
                    </View>
                    <Text
                      testID="receive-address"
                      selectable
                      style={styles.address}
                    >
                      {account.address}
                    </Text>
                  </Card>
                  <Button
                    label="Share address"
                    icon={Copy}
                    onPress={() =>
                      Share.share({
                        message: account.address,
                      })
                    }
                  />
                  <Note>
                    {network === 'chipnet'
                      ? 'Only send Chipnet test BCH to this address. Test funds have no monetary value.'
                      : 'Only send Bitcoin Cash (BCH) on Mainnet to this address.'}
                  </Note>
                  {network === 'chipnet' ? (
                    <Button
                      label="Get test BCH from a faucet"
                      secondary
                      onPress={() =>
                        Linking.openURL('https://tbch.googol.cash/')
                      }
                    />
                  ) : null}
                </View>
              ) : null}
              {screen === 'send' && !review ? (
                <View testID="send-screen">
                  <Label>SEND BITCOIN CASH</Label>
                  <Title>A little goes a long way.</Title>
                  <Text style={styles.availableBalance}>
                    Available: {balance ? balance.balanceBch : '—'} BCH
                  </Text>
                  <Field
                    label={`${config.label} recipient`}
                    testID="recipient-input"
                    value={recipient}
                    onChangeText={setRecipient}
                    placeholder={`${config.prefix}:…`}
                    autoCorrect={false}
                    autoCapitalize="none"
                    multiline
                  />
                  <Field
                    label="Amount in BCH"
                    testID="amount-input"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00000000"
                    keyboardType="decimal-pad"
                  />
                  <Button
                    label={busy ? 'Preparing…' : 'Review payment'}
                    testID="review-payment"
                    disabled={busy || Boolean(pending)}
                    onPress={prepare}
                  />
                  <Text style={styles.hint}>
                    You’ll see the exact network fee before sending.
                  </Text>
                </View>
              ) : null}
              {screen === 'send' && review ? (
                <View testID="review-screen">
                  <Label>CHECK BEFORE YOU SEND</Label>
                  <Title>Review payment</Title>
                  <Card>
                    <Text style={styles.reviewAmount}>
                      {review.amountBch} BCH
                    </Text>
                    <Label>TO</Label>
                    <Text selectable style={styles.reviewAddress}>
                      {review.address}
                    </Text>
                    <Text style={styles.muted}>Network: {config.label}</Text>
                    <Text style={styles.muted}>
                      Network fee: {review.feeBch} BCH
                    </Text>
                    <Text style={styles.total}>
                      Total: {review.totalBch} BCH
                    </Text>
                  </Card>
                  <Note>
                    {network === 'mainnet'
                      ? 'This sends real BCH and cannot be undone. Confirm the address and amount.'
                      : 'This sends Chipnet test funds. The payment review expires after two minutes.'}
                  </Note>
                  <Button
                    label={
                      busy
                        ? 'Sending…'
                        : network === 'mainnet'
                        ? 'Confirm and send real BCH'
                        : 'Send test BCH'
                    }
                    testID="confirm-send"
                    disabled={busy}
                    onPress={send}
                  />
                  <View style={styles.buttonGap}>
                    <Button
                      label="Cancel payment"
                      secondary
                      disabled={busy}
                      onPress={() => {
                        session.current?.cancelSend();
                        setReview(null);
                      }}
                    />
                  </View>
                </View>
              ) : null}
              {screen === 'settings' ? (
                <View testID="settings-screen">
                  <Label>MAKE IT YOURS</Label>
                  <Title>Settings</Title>
                  <Card>
                    <Text style={styles.sectionTitle}>Network</Text>
                    <Text style={styles.body}>
                      Each network has its own address and balance. Switching
                      never moves funds.
                    </Text>
                    {Object.entries(NETWORKS).map(([id, value]) => (
                      <Pressable
                        key={id}
                        testID={`select-${id}`}
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: network === id,
                          disabled: busy || Boolean(pending),
                        }}
                        disabled={busy || Boolean(pending)}
                        onPress={() => chooseNetwork(id)}
                        style={styles.networkOption}
                      >
                        <View>
                          <Text style={styles.cardTitle}>{value.label}</Text>
                          <Text style={styles.subtitle}>
                            {id === 'chipnet'
                              ? 'Test funds · recommended for development'
                              : 'Real Bitcoin Cash'}
                          </Text>
                        </View>
                        {network === id ? (
                          <Check color={c.green} size={21} />
                        ) : (
                          <ChevronRight color={c.muted} size={21} />
                        )}
                      </Pressable>
                    ))}
                  </Card>
                  <Card>
                    <Text style={styles.sectionTitle}>Recovery phrase</Text>
                    <Text style={styles.body}>
                      Write it down somewhere private. Anyone with these words
                      can spend your funds.
                    </Text>
                    {recovery ? (
                      <>
                        <Text selectable style={styles.recoveryPhrase}>
                          {recovery}
                        </Text>
                        <Button
                          label="Hide recovery phrase"
                          secondary
                          onPress={() => setRecovery('')}
                        />
                      </>
                    ) : (
                      <Button
                        label="Show recovery phrase"
                        secondary
                        onPress={() =>
                          Alert.alert(
                            'Keep these words private',
                            'Make sure nobody can see your screen. Never share the phrase with a website or support agent.',
                            [
                              {
                                text: 'Cancel',
                                style: 'cancel',
                              },
                              {
                                text: 'Show phrase',
                                onPress: showRecovery,
                              },
                            ],
                          )
                        }
                      />
                    )}
                  </Card>
                  <Text style={styles.finePrint}>
                    Built with XO primitives and native libauth. This starter
                    uses one BIP44 address per network. It has not been
                    independently security audited.
                  </Text>
                  {__DEV__ ? (
                    <View style={styles.sectionGap}>
                      <Button
                        label="Run native wallet checks"
                        testID="run-wallet-checks"
                        secondary
                        onPress={runQa}
                      />
                      <Text testID="qa-result" style={styles.qaResult}>
                        {qa}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {notice ? (
                <View testID="wallet-error">
                  <Note danger>{notice}</Note>
                </View>
              ) : null}
              {connectionError ? (
                <View testID="connection-error">
                  <Note danger>{connectionError}</Note>
                  <Button
                    label="Reconnect"
                    secondary
                    disabled={busy || Boolean(pending)}
                    onPress={() => connect(network)}
                  />
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      {account.status === 'ready' ? (
        <View style={styles.tabBar}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <Pressable
              key={id}
              testID={`tab-${id}`}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{
                selected: screen === id,
                disabled: busy,
              }}
              disabled={busy}
              onPress={() => navigate(id)}
              style={styles.tab}
            >
              <Icon size={22} color={screen === id ? c.green : c.muted} />
              <Text style={tabTextStyle(screen === id)}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <WalletApp />
    </SafeAreaProvider>
  );
}
