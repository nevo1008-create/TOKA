import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fontFamilies, typography } from '../theme';

type TextTone = 'accent' | 'danger' | 'inverse' | 'muted' | 'primary' | 'subtle' | 'warning';
type TextVariant = keyof typeof typography;

type AppTextProps = TextProps & {
  align?: TextStyle['textAlign'];
  tone?: TextTone;
  variant?: TextVariant;
  weight?: TextStyle['fontWeight'];
};

export function AppText({
  align,
  children,
  style,
  tone = 'primary',
  variant = 'body',
  weight,
  ...props
}: AppTextProps) {
  const flattenedStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const weightedFontFamily =
    flattenedStyle?.fontFamily ??
    getFontFamilyForWeight(weight ?? flattenedStyle?.fontWeight) ??
    typography[variant].fontFamily;

  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography[variant],
        toneStyles[tone],
        align ? { textAlign: align } : null,
        style,
        { fontFamily: weightedFontFamily, fontWeight: 'normal' },
      ]}
    >
      {children}
    </Text>
  );
}

function getFontFamilyForWeight(weight?: TextStyle['fontWeight']) {
  const normalizedWeight = String(weight ?? '');

  if (normalizedWeight === '800' || normalizedWeight === '900' || normalizedWeight === 'bold') {
    return fontFamilies.manrope.extrabold;
  }

  if (normalizedWeight === '700') {
    return fontFamilies.manrope.bold;
  }

  if (normalizedWeight === '600') {
    return fontFamilies.manrope.semibold;
  }

  if (normalizedWeight === '500') {
    return fontFamilies.manrope.medium;
  }

  if (normalizedWeight === '400' || normalizedWeight === 'normal') {
    return fontFamilies.manrope.regular;
  }

  return undefined;
}

const styles = StyleSheet.create({
  base: {
    letterSpacing: 0,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    color: colors.primaryDark,
  },
  danger: {
    color: colors.danger,
  },
  inverse: {
    color: colors.textOnGreen,
  },
  muted: {
    color: colors.muted,
  },
  primary: {
    color: colors.ink,
  },
  subtle: {
    color: colors.subtle,
  },
  warning: {
    color: colors.accent,
  },
});
