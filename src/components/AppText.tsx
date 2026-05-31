import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '../theme';

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
  return (
    <Text
      {...props}
      style={[
        styles.base,
        typography[variant],
        toneStyles[tone],
        weight ? { fontWeight: weight } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
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
