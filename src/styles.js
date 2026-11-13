import { Platform } from 'react-native';
import { colors as c } from './theme';
export const styles = {
  scrollContent: {
    padding: 24,
    paddingBottom: 36,
    flexGrow: 1,
  },
  label: {
    color: c.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 31,
    fontWeight: '700',
    color: c.ink,
    letterSpacing: -1,
    marginBottom: 12,
  },
  note: {
    padding: 16,
    backgroundColor: c.warning,
    borderRadius: 16,
    marginVertical: 12,
  },
  card: {
    backgroundColor: c.paper,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: c.border,
    padding: 22,
    gap: 14,
    marginBottom: 16,
  },
  field: {
    gap: 8,
    marginBottom: 20,
  },
  fieldLabel: {
    color: c.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: c.paper,
    borderColor: c.border,
    borderWidth: 1,
    padding: 17,
    borderRadius: 16,
    fontSize: 17,
    color: c.ink,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    backgroundColor: c.green,
    borderRadius: 12,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandGlyph: {
    color: c.paper,
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 19,
    fontWeight: '800',
    color: c.ink,
  },
  badgeLabel: {
    color: c.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  fill: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  muted: {
    color: c.muted,
  },
  welcome: {
    flex: 1,
    justifyContent: 'center',
  },
  welcomeMark: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: c.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  intro: {
    fontSize: 17,
    lineHeight: 26,
    color: c.muted,
    marginBottom: 28,
  },
  restoreLabel: {
    color: c.muted,
    marginTop: 30,
    marginBottom: 12,
    fontSize: 14,
  },
  transactionId: {
    fontSize: 12,
    color: c.muted,
    marginBottom: 12,
  },
  balanceSection: {
    paddingTop: 26,
    paddingBottom: 30,
  },
  balance: {
    fontSize: 49,
    letterSpacing: -2,
    fontWeight: '600',
    color: c.ink,
  },
  balanceUnit: {
    fontSize: 16,
    color: c.muted,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  cardHeading: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.ink,
  },
  body: {
    color: c.muted,
    lineHeight: 22,
  },
  link: {
    color: c.green,
    fontWeight: '700',
  },
  receiptTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: c.ink,
  },
  smallMuted: {
    color: c.muted,
    fontSize: 12,
  },
  emptyState: {
    color: c.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionGap: {
    marginTop: 24,
  },
  receiveIntro: {
    fontSize: 16,
    lineHeight: 24,
    color: c.muted,
    marginBottom: 24,
  },
  qr: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  address: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: c.ink,
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
  },
  availableBalance: {
    color: c.muted,
    fontSize: 15,
    marginBottom: 26,
  },
  hint: {
    color: c.muted,
    marginTop: 16,
    lineHeight: 21,
  },
  reviewAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: c.ink,
  },
  reviewAddress: {
    color: c.ink,
    fontSize: 14,
    lineHeight: 23,
  },
  total: {
    color: c.ink,
    fontWeight: '700',
  },
  buttonGap: {
    marginTop: 12,
  },
  sectionTitle: {
    color: c.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  networkOption: {
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  subtitle: {
    color: c.muted,
    marginTop: 4,
  },
  recoveryPhrase: {
    color: c.ink,
    fontSize: 18,
    lineHeight: 30,
  },
  finePrint: {
    color: c.muted,
    lineHeight: 21,
    fontSize: 13,
  },
  qaResult: {
    color: c.muted,
    marginTop: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: c.background,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
};
export function buttonTextStyle(secondary) {
  return {
    fontSize: 16,
    fontWeight: '700',
    color: secondary ? c.ink : c.paper,
  };
}
export function noteTextStyle(danger) {
  return {
    color: danger ? c.danger : c.warningInk,
    fontSize: 14,
    lineHeight: 21,
  };
}
export function networkBadgeStyle(network) {
  return {
    borderRadius: 30,
    backgroundColor: network === 'chipnet' ? c.mint : c.warning,
    paddingVertical: 8,
    paddingHorizontal: 13,
  };
}
export function tabTextStyle(selected) {
  return {
    fontSize: 11,
    fontWeight: selected ? '700' : '500',
    color: selected ? c.green : c.muted,
  };
}
