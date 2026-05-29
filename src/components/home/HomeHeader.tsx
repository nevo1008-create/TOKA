import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import type { Player } from '../../types';
import { AppText } from '../AppText';

type HomeHeaderProps = {
  notificationCount: number;
  onBack?: () => void;
  player: Player;
  rightAccessory?: 'avatar' | 'menu';
};

export function HomeHeader({ notificationCount, onBack, player, rightAccessory = 'menu' }: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        {onBack ? (
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Ionicons color={colors.darkText} name="chevron-back" size={22} />
          </Pressable>
        ) : null}
        <LinearGradient
          colors={[colors.accentLime, colors.darkSurfaceHigh]}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={styles.logoBall}
        >
          <Ionicons color={colors.ink} name="football" size={25} />
        </LinearGradient>
        <View>
          <AppText style={styles.logoText} variant="display" weight="800">
            TOCA
          </AppText>
          <AppText style={styles.subtitle} tone="accent" variant="label" weight="800">
            FOOTVOLLEY COMMUNITY
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={styles.bellButton}>
          <Ionicons color={colors.darkText} name="notifications-outline" size={24} />
          {notificationCount > 0 ? (
            <View style={styles.notificationBadge}>
              <AppText align="center" tone="inverse" variant="label" weight="800">
                {notificationCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
        {rightAccessory === 'menu' ? (
          <Pressable accessibilityRole="button" style={styles.menuRing}>
            <View style={styles.menuButton}>
              <Ionicons color={colors.darkText} name="menu-outline" size={26} />
            </View>
          </Pressable>
        ) : (
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <AppText align="center" tone="inverse" variant="heading" weight="800">
                {player.initials}
              </AppText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#EEEED6',
    borderRadius: radius.round,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  avatarRing: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.72)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  bellButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  logoBall: {
    alignItems: 'center',
    borderColor: colors.darkText,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  logoText: {
    fontSize: 28,
    fontStyle: 'italic',
    letterSpacing: 0,
    lineHeight: 30,
    transform: [{ skewX: '-10deg' }],
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.74)',
    borderRadius: radius.round,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  menuRing: {
    alignItems: 'center',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: radius.round,
    height: 26,
    justifyContent: 'center',
    minWidth: 26,
    position: 'absolute',
    right: -5,
    top: -2,
  },
  subtitle: {
    letterSpacing: 0.4,
    fontSize: 11,
    lineHeight: 13,
  },
});
