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
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});

const variantStyles = StyleSheet.create({
  flat: {},
  raised: {
    ...shadows.card,
    backgroundColor: colors.darkSurfaceHigh,
  },
  subtle: {
    backgroundColor: colors.darkSurfaceLow,
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
