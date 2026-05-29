import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { Player } from '../types';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { IconButton } from './IconButton';

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
        <IconButton icon="chevron-back" onPress={onBack} size={42} variant="ghost" />
      ) : null}

      <View style={styles.brandRow}>
        <LinearGradient colors={[colors.darkSurfaceHigh, colors.ink]} style={styles.logoMark}>
          <AppText tone="warning" variant="titleSmall" weight="900">
            T
          </AppText>
        </LinearGradient>
        <View style={styles.brandCopy}>
          <AppText variant="title" weight="900">
            TOCA
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="label">
            {subtitle}
          </AppText>
        </View>
      </View>

      <View style={styles.headerActions}>
        <IconButton badgeCount={notificationCount} icon="notifications-outline" size={42} />
        <Avatar player={player} size={42} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.transparent,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
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
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
