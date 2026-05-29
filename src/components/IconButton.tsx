import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;
type IconButtonVariant = 'ghost' | 'primary' | 'surface';

type IconButtonProps = PressableProps & {
  badgeCount?: number;
  icon: IconName;
  iconSize?: number;
  size?: number;
  style?: ViewStyle | ViewStyle[];
  variant?: IconButtonVariant;
};

export function IconButton({
  badgeCount,
  icon,
  iconSize = 20,
  size = 42,
  style,
  variant = 'surface',
  ...props
}: IconButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.button,
        variantStyles[variant],
        { borderRadius: size / 2, height: size, width: size },
        style,
      ]}
      {...props}
    >
      <Ionicons color={isPrimary ? colors.ink : colors.darkText} name={icon} size={iconSize} />
      {badgeCount && badgeCount > 0 ? (
        <View style={styles.badge}>
          <AppText align="center" tone="inverse" variant="caption" weight="900">
            {badgeCount > 9 ? '9+' : badgeCount}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: spacing.xxs,
    position: 'absolute',
    right: -4,
    top: -5,
  },
  button: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    position: 'relative',
  },
});

const variantStyles = StyleSheet.create({
  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.darkBorder,
  },
  primary: {
    backgroundColor: colors.neon,
    borderColor: colors.neon,
  },
  surface: {
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
  },
});
