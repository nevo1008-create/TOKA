import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { formatLobbyStart, getMinutesUntilLobbyStart } from '../../features/lobbies/lobbyDateTime';
import { getAutoCancelCountdownLabel } from '../../features/lobbies/lobbyLifecycle';
import { isJoinedParticipant } from '../../features/lobbies/lobbyRules';
import { colors, homeTypography, radius, shadows, spacing } from '../../theme';
import type { Lobby } from '../../types';
import { AppText } from '../AppText';
import { AvatarStack } from './AvatarStack';
import { BeachGameVisual } from './BeachGameVisual';

type FeaturedGameCardProps = {
  lobby?: Lobby;
  onOpenRoom: () => void;
};

export function FeaturedGameCard({ lobby, onOpenRoom }: FeaturedGameCardProps) {
  if (!lobby) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Ionicons color={colors.accentLime} name="calendar-outline" size={22} />
        </View>
        <AppText align="center" style={styles.emptyTitle} variant="sectionHeading" weight="900">
          No scheduled games yet
        </AppText>
        <Pressable accessibilityRole="button" onPress={onOpenRoom} style={styles.emptyButton}>
          <AppText align="center" tone="accent" variant="button" weight="800">
            Find games
          </AppText>
        </Pressable>
      </View>
    );
  }

  const activeParticipants = lobby?.participants.filter(isJoinedParticipant) ?? [];
  const startLabel = lobby ? formatLobbyStart(lobby.startsAt) : 'Choose a game';
  const [dateLabel, timeLabel] = splitStartLabel(startLabel);

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
            <AppText style={styles.chipText} tone="accent" variant="chip" weight="700">
              {lobby ? 'Joined' : 'Ready'}
            </AppText>
          </View>
          <View style={styles.countdownPill}>
            <Ionicons color={colors.accentGoldDark} name="time-outline" size={15} />
            <AppText style={[styles.countdownText, styles.chipText]} variant="chip" weight="700">
              {lobby ? getFeaturedCountdownLabel(lobby) : 'Find games'}
            </AppText>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <AppText style={styles.title} variant="heroTitle" weight="900">
            {lobby.title}
          </AppText>
          <View style={styles.locationRow}>
            <Ionicons color={colors.accentSea} name="location" size={20} />
            <AppText style={styles.locationText} tone="primary" variant="uiBody" weight="600">
              {lobby.location.name}
            </AppText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <InfoCell icon="calendar-outline" label={dateLabel} value={timeLabel} />
          <InfoCell icon="cellular" iconColor={colors.accentLime} label="Rank" value={lobby ? getRankLabel(lobby) : '-'} />
          <InfoCell icon="people-outline" label="Joined" value={lobby ? `${activeParticipants.length}/${lobby.maxPlayers}` : '-'} />
        </View>

        <View style={styles.genderPill}>
            <Ionicons color={colors.muted} name="people-circle-outline" size={14} />
            <AppText style={styles.chipText} tone="muted" variant="chip" weight="700">
            {lobby ? getGenderAudience(lobby) : 'Everyone'}
          </AppText>
        </View>

        <AvatarStack initials={activeParticipants.map((participant) => participant.playerId.slice(0, 2).toUpperCase())} />

        <View style={styles.actions}>
          <Pressable onPress={onOpenRoom} style={styles.openButton}>
            <AppText align="center" style={styles.buttonText} tone="inverse" variant="button" weight="800">
              View match
            </AppText>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function splitStartLabel(label: string) {
  const [dateLabel, timeLabel] = label.split(',').map((part) => part.trim());

  return [dateLabel ?? 'Date', timeLabel ?? label] as const;
}

function formatCountdown(startsAt: string) {
  const minutes = Math.max(Math.ceil(getMinutesUntilLobbyStart(startsAt)), 0);

  if (minutes < 60) {
    return `In ${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `In ${hours}h ${remainingMinutes}m` : `In ${hours}h`;
}

function getFeaturedCountdownLabel(lobby: Lobby) {
  return getAutoCancelCountdownLabel(lobby) ?? formatCountdown(lobby.startsAt);
}

function getRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact';
  }

  return `${lobby.rankMin}/${lobby.rankMax}`;
}

function getGenderAudience(lobby: Lobby) {
  if (lobby.genderRule === 'male') {
    return 'Men';
  }

  if (lobby.genderRule === 'female') {
    return 'Women';
  }

  return 'Everyone';
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
  buttonText: {
    ...homeTypography.button,
  },
  chipText: {
    ...homeTypography.chipSmall,
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
  emptyButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.xl,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 150,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    ...shadows.soft,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(234, 245, 236, 0.92)',
    borderColor: 'rgba(36, 196, 90, 0.22)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  emptyTitle: {
    color: colors.ink,
    ...homeTypography.sectionTitle,
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
    ...homeTypography.metadata,
  },
  infoValueText: {
    color: colors.ink,
    ...homeTypography.body,
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
  locationText: {
    ...homeTypography.body,
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
    ...homeTypography.heroTitle,
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
