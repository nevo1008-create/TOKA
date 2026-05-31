import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';
import type { Player } from '../../types';
import { AppText } from '../AppText';

type HomeHeaderProps = {
  compact?: boolean;
  notificationCount: number;
  onBack?: () => void;
  onMenuPress?: () => void;
  player: Player;
  rightAccessory?: 'avatar' | 'menu';
};

export function HomeHeader({
  compact = false,
  notificationCount,
  onBack,
  onMenuPress,
  player,
  rightAccessory = 'menu',
}: HomeHeaderProps) {
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.brandRow}>
        {onBack ? (
          <Pressable accessibilityRole="button" onPress={onBack} style={[styles.backButton, compact && styles.backButtonCompact]}>
            <Ionicons color={colors.ink} name="chevron-back" size={compact ? 20 : 22} />
          </Pressable>
        ) : null}
        <LinearGradient
          colors={[colors.surfaceYellow, colors.surfaceMuted]}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={[styles.logoBall, compact && styles.logoBallCompact]}
        >
          <Ionicons color={colors.primaryDark} name="football" size={compact ? 21 : 25} />
        </LinearGradient>
        <View>
          <AppText style={[styles.logoText, compact && styles.logoTextCompact]} variant="display" weight="800">
            TOCA
          </AppText>
          <AppText style={[styles.subtitle, compact && styles.subtitleCompact]} tone="accent" variant="label" weight="800">
            FOOTVOLLEY COMMUNITY
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" style={[styles.bellButton, compact && styles.bellButtonCompact]}>
            <Ionicons color={colors.ink} name="notifications-outline" size={compact ? 21 : 24} />
          {notificationCount > 0 ? (
            <View style={[styles.notificationBadge, compact && styles.notificationBadgeCompact]}>
              <AppText align="center" tone="inverse" variant="label" weight="800">
                {notificationCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
        {rightAccessory === 'menu' ? (
          <Pressable
            accessibilityRole="button"
            onPress={onMenuPress}
            style={[styles.menuRing, compact && styles.menuRingCompact]}
          >
            <View style={[styles.menuButton, compact && styles.menuButtonCompact]}>
              <Ionicons color={colors.ink} name="menu-outline" size={compact ? 23 : 26} />
            </View>
          </Pressable>
        ) : (
          <View style={[styles.avatarRing, compact && styles.avatarRingCompact]}>
            <View style={[styles.avatar, compact && styles.avatarCompact]}>
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
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#EEEED6',
    borderRadius: radius.round,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  avatarCompact: {
    height: 42,
    width: 42,
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
  avatarRingCompact: {
    height: 48,
    width: 48,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    height: 38,
    justifyContent: 'center',
    width: 38,
    ...shadows.soft,
  },
  backButtonCompact: {
    height: 34,
    width: 34,
  },
  bellButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
    ...shadows.soft,
  },
  bellButtonCompact: {
    height: 38,
    width: 38,
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl2,
    paddingTop: 22,
  },
  headerCompact: {
    paddingTop: 10,
  },
  logoBall: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft,
  },
  logoBallCompact: {
    height: 36,
    width: 36,
  },
  logoText: {
    fontSize: 28,
    fontStyle: 'italic',
    letterSpacing: 0,
    lineHeight: 30,
    transform: [{ skewX: '-10deg' }],
  },
  logoTextCompact: {
    fontSize: 23,
    lineHeight: 25,
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    height: 52,
    justifyContent: 'center',
    width: 52,
    ...shadows.soft,
  },
  menuButtonCompact: {
    height: 42,
    width: 42,
  },
  menuRing: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  menuRingCompact: {
    height: 42,
    width: 42,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 26,
    justifyContent: 'center',
    minWidth: 26,
    position: 'absolute',
    right: -5,
    top: -2,
  },
  notificationBadgeCompact: {
    height: 22,
    minWidth: 22,
    right: -4,
    top: -3,
  },
  subtitle: {
    letterSpacing: 0.4,
    fontSize: 11,
    lineHeight: 13,
  },
  subtitleCompact: {
    fontSize: 9,
    lineHeight: 11,
  },
});
