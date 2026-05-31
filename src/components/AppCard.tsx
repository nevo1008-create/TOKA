import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radius, shadows, spacing } from '../theme';

type CardPadding = 'lg' | 'md' | 'sm' | 'xl';
type CardVariant = 'flat' | 'raised' | 'subtle';

type AppCardProps = PressableProps & {
  children: ReactNode;
  padding?: CardPadding;
  style?: ViewStyle | ViewStyle[];
  variant?: CardVariant;
};

export function AppCard({
  children,
  onPress,
  padding = 'lg',
  style,
  variant = 'flat',
  ...props
}: AppCardProps) {
  const cardStyle = [styles.card, variantStyles[variant], paddingStyles[padding], style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={cardStyle} {...props}>
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    ...shadows.card,
  },
});

const variantStyles = StyleSheet.create({
  flat: {},
  raised: {
    ...shadows.card,
    backgroundColor: colors.surfaceRaised,
  },
  subtle: {
    backgroundColor: colors.surfaceMuted,
  },
});

const paddingStyles = StyleSheet.create({
  lg: {
    padding: spacing.lg,
  },
  md: {
    padding: spacing.md,
  },
  sm: {
    padding: spacing.sm,
  },
  xl: {
    padding: spacing.xl,
  },
});
