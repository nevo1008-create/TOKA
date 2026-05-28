import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { Player } from '../types';
import { Avatar } from './Avatar';

const defaultSubtitle = 'Footvolley games by level, place, and trust';

type AppHeaderProps = {
  notificationCount?: number;
  onBack?: () => void;
  player: Player;
  subtitle?: string;
};

export function AppHeader({
  notificationCount = 0,
  onBack,
  player,
  subtitle = defaultSubtitle,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </Pressable>
      ) : null}

      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <View style={styles.brandCopy}>
          <Text style={styles.brandTitle}>TOCA</Text>
          <Text style={styles.brandSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <Pressable style={styles.headerIcon}>
          <Text style={styles.headerIconText}>!</Text>
          {notificationCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Avatar player={player} size={42} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backButtonText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  logoText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  brandTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: colors.darkMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerIcon: {
    alignItems: 'center',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  headerIconText: {
    color: colors.darkMuted,
    fontSize: 16,
    fontWeight: '900',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    top: -5,
    width: 18,
  },
  notificationBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },
});
