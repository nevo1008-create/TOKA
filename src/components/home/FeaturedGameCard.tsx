import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';
import type { Lobby } from '../../types';
import { AppText } from '../AppText';
import { AvatarStack } from './AvatarStack';
import { BeachGameVisual } from './BeachGameVisual';

type FeaturedGameCardProps = {
  lobby?: Lobby;
  onOpenRoom: () => void;
};

export function FeaturedGameCard({ onOpenRoom }: FeaturedGameCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpenRoom} style={styles.card}>
      <BeachGameVisual variant="hero" />
      <LinearGradient
        colors={['rgba(255, 249, 236, 0.98)', 'rgba(255, 249, 236, 0.86)', 'rgba(255, 249, 236, 0.30)']}
        start={{ x: 0, y: 0.22 }}
        end={{ x: 1, y: 0.72 }}
        style={styles.overlay}
      />

      <View style={styles.content}>
        <View style={styles.topPillsRow}>
          <View style={styles.adminPill}>
            <AppText tone="accent" variant="chip" weight="700">
              Joined
            </AppText>
          </View>
          <View style={styles.countdownPill}>
            <Ionicons color={colors.accentGoldDark} name="time-outline" size={15} />
            <AppText style={styles.countdownText} variant="chip" weight="700">
              In 3h 20m
            </AppText>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <AppText style={styles.title} variant="heroTitle" weight="900">
            Tonight at Gordon
          </AppText>
          <View style={styles.locationRow}>
            <Ionicons color={colors.accentSea} name="location" size={20} />
            <AppText tone="primary" variant="uiBody" weight="600">
              Gordon Beach
            </AppText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <InfoCell icon="calendar-outline" label="Today" value="20:30" />
          <InfoCell icon="cellular" iconColor={colors.accentLime} label="Rank" value="B to C+" />
          <InfoCell icon="people-outline" label="Joined" value="5/8" />
        </View>

        <View style={styles.genderPill}>
            <Ionicons color={colors.muted} name="people-circle-outline" size={14} />
            <AppText tone="muted" variant="chip" weight="700">
            Everyone
          </AppText>
        </View>

        <AvatarStack initials={['NV', 'OM', 'MY', '+2']} />

        <View style={styles.actions}>
          <Pressable onPress={onOpenRoom} style={styles.openButton}>
            <AppText align="center" tone="inverse" variant="button" weight="800">
              Open game
            </AppText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function InfoCell({
  icon,
  iconColor = colors.muted,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCell}>
      <View style={styles.infoValueRow}>
        <Ionicons color={iconColor} name={icon} size={18} />
        <AppText style={styles.infoValueText} variant="uiBody" weight="700">
          {value}
        </AppText>
      </View>
      <AppText style={styles.infoLabelText} tone="muted" variant="metadata" weight="500">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  adminPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(234, 245, 236, 0.90)',
    borderColor: 'rgba(36, 196, 90, 0.22)',
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 360,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.hero,
  },
  content: {
    gap: 10,
    padding: 16,
    zIndex: 2,
  },
  countdownPill: {
    alignItems: 'center',
    backgroundColor: '#FFF0B0',
    borderColor: 'rgba(239, 165, 26, 0.22)',
    borderWidth: 1,
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  countdownText: {
    color: colors.accentGoldDark,
  },
  genderPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(221, 245, 241, 0.78)',
    borderColor: 'rgba(27, 183, 168, 0.20)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 26,
    paddingHorizontal: spacing.sm,
  },
  infoCell: {
    flex: 1,
    gap: spacing.xs,
  },
  infoRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoLabelText: {
    color: colors.muted,
  },
  infoValueText: {
    color: colors.ink,
  },
  infoValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  openButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    width: 170,
    ...shadows.soft,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  spotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    maxWidth: 294,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  topPillsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
