import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

// Design tokens ported from Koydum.dc.html
export const colors = {
  appBg: '#F7F5F0',
  canvasBg: '#E7E3DA',
  card: '#ffffff',
  textPrimary: '#161616',
  textSecondary: '#6E6E73',
  textTertiary: '#A9A9AE',
  textWarm: '#8C867E',
  textWarm2: '#A9A29A',

  indigo: '#5556D9',
  indigoHover: '#4849C9',
  indigoLight: '#EEEEFF',
  indigoSoftDisabled: '#BFC0E8',

  // Default accent saved in the design's chat transcript.
  accent: '#2D7A59',

  neutralChip: '#EFEDE7',
  // Pressed-state tints and the inactive tab colour, kept here so no
  // component has to carry a raw hex.
  cardPressed: '#FBFAF7',
  neutralChipPressed: '#E7E3D8',
  tabInactive: '#9A968F',
  neutralChipText: '#4A4A4E',
  hairline: '#F1EFEA',
  hairlineStrong: '#ECE8E1',

  photoPlaceholderBg: '#EDEAE3',
  photoPlaceholderBorder: '#D3CEC3',

  favorite: '#A85E18',
  danger: '#C0392B',

  // Swipe action colors (spec-fixed hex values).
  swipeFavorite: '#FF8500',
  swipeDelete: '#FF3333',

  lost: '#C0392B',
  lostSoft: '#FBE7E4',
  success: '#2D7A59',

  paywallBg: '#161616',
  paywallCheck: '#8B8CEB',

  sheetScrim: 'rgba(22,22,22,.34)',
  voiceScrim: 'rgba(22,22,22,.3)',
  toastBg: '#161616',
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
};

// 8px-based spacing scale.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Semantic type scale. Screens should reach for these rather than inventing
// one-off font sizes, so the same role reads the same everywhere.
export const typography = {
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  title1: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.5 },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  title3: { fontSize: 19, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  subheadline: { fontSize: 14, lineHeight: 19, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  // All-caps section eyebrow (SETTINGS groups, "BULUNDUĞU YER", "NOT").
  overline: { fontSize: 11.5, lineHeight: 15, fontWeight: '600', letterSpacing: 0.6 },
} satisfies Record<string, TextStyle>;

// Motion tokens for UI transitions. The swipe gesture keeps its own tuned
// spring — it is deliberately not driven from here.
export const motion = {
  duration: {
    fast: 140,
    normal: 200,
    slow: 280,
  },
  spring: {
    damping: 24,
    stiffness: 260,
    mass: 0.9,
  },
} as const;

// Surface system. Premium comes from hierarchy, not from stacking shadows:
// ordinary list/settings rows separate with a hairline, and real elevation
// is reserved for heroes, sheets and toasts.
export const surfaces = {
  /** Default for list rows, settings groups, secondary cards. No shadow. */
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineStrong,
  },
  /** Search box, quick-add — the primary surface on a screen. */
  raised: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  /** Detail location hero. */
  hero: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
  },
} satisfies Record<string, ViewStyle>;

// Shared control metrics so the same kind of button is the same size on
// every screen.
export const controls = {
  primaryHeight: 54,
  secondaryHeight: 52,
  compactHeight: 40,
  iconButton: 44,
  fieldHeight: 56,
} as const;

export const FREE_ITEM_LIMIT = 20;
