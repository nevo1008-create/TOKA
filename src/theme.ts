export const colors = {
  background: '#F8F1E3',
  backgroundAlt: '#F6EEDC',
  surface: '#FFF9EC',
  surfaceRaised: '#FFFFFF',
  surfaceMuted: '#EAF5EC',
  surfaceAqua: '#DDF5F1',
  surfaceYellow: '#FFF2BD',
  ink: '#123B2A',
  muted: '#5E7668',
  subtle: '#7D9185',
  border: '#D8E8D4',
  borderSoft: 'rgba(216, 232, 212, 0.70)',
  primary: '#24C45A',
  primaryDark: '#159947',
  accent: '#F6C945',
  accentGold: '#F6C945',
  accentGoldDark: '#EFA51A',
  accentLime: '#24C45A',
  accentLimeDark: '#159947',
  accentSand: '#F6EEDC',
  accentSea: '#1BB7A8',
  accentPurple: '#7E7AC8',
  coral: '#F47B5F',
  danger: '#D94A3A',
  sand: '#F6EEDC',
  white: '#FFFFFF',
  textOnGreen: '#FFFFFF',
  transparent: 'transparent',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl2: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  round: 999,
};

export const fontFamilies = {
  manrope: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extrabold: 'Manrope_800ExtraBold',
  },
};

export const typography = {
  caption: {
    fontFamily: fontFamilies.manrope.regular,
    fontSize: 11,
    fontWeight: 'normal' as const,
    lineHeight: 15,
  },
  label: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  bodySmall: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 13,
    fontWeight: 'normal' as const,
    lineHeight: 18,
  },
  body: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  titleSmall: {
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 21,
  },
  title: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 19,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  heading: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 24,
    fontWeight: 'normal' as const,
    lineHeight: 30,
  },
  display: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 32,
    fontWeight: 'normal' as const,
    lineHeight: 38,
  },
  displayGreeting: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 32,
    fontWeight: 'normal' as const,
    lineHeight: 38,
  },
  heroTitle: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 30,
    fontWeight: 'normal' as const,
    lineHeight: 36,
  },
  sectionHeading: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 23,
    fontWeight: 'normal' as const,
    lineHeight: 29,
  },
  cardTitle: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 20,
    fontWeight: 'normal' as const,
    lineHeight: 25,
  },
  uiBody: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 23,
  },
  metadata: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 13,
    fontWeight: 'normal' as const,
    lineHeight: 17,
  },
  button: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 21,
  },
  chip: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 13,
    fontWeight: 'normal' as const,
    lineHeight: 17,
  },
  navLabel: {
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 11,
    fontWeight: 'normal' as const,
    lineHeight: 14,
  },
};

export const homeTypography = {
  greeting: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 34,
    fontWeight: 'normal' as const,
    lineHeight: 40,
  },
  heroTitle: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 31,
    fontWeight: 'normal' as const,
    lineHeight: 38,
  },
  sectionTitle: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 24,
    fontWeight: 'normal' as const,
    lineHeight: 30,
  },
  eyebrow: {
    fontFamily: fontFamilies.manrope.extrabold,
    fontSize: 15,
    fontWeight: 'normal' as const,
    letterSpacing: 0.8,
    lineHeight: 20,
  },
  cardTitle: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 20,
    fontWeight: 'normal' as const,
    lineHeight: 25,
  },
  body: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 15,
    fontWeight: 'normal' as const,
    lineHeight: 21,
  },
  metadata: {
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 22,
  },
  chip: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 13,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  chipSmall: {
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  navLabel: {
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 11,
    fontWeight: 'normal' as const,
    lineHeight: 15,
  },
};

export const shadows = {
  card: {
    elevation: 4,
    shadowColor: '#123B2A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
  },
  hero: {
    elevation: 8,
    shadowColor: '#123B2A',
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
  },
  soft: {
    elevation: 2,
    shadowColor: '#123B2A',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  nav: {
    elevation: 10,
    shadowColor: '#123B2A',
    shadowOffset: { height: -8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
  },
};
