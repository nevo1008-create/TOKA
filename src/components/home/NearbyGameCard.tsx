import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows } from '../../theme';
import { AppText } from '../AppText';
import { BeachGameVisual } from './BeachGameVisual';

type NearbyGameCardProps = {
  actionLabel?: string;
  actionTone?: 'accent' | 'muted' | 'warning';
  audience?: string;
  disabled?: boolean;
  distance: string;
  level: string;
  location: string;
  onPress?: () => void;
  players: string;
  selected?: boolean;
  spotsTone?: 'green' | 'yellow';
  spotsLeft?: string;
  status: 'Approval' | 'Full';
  time: string;
  title: string;
  variant: 'morning' | 'sunset';
};

export function NearbyGameCard({
  actionLabel = 'Open game',
  actionTone = 'accent',
  audience = 'Everyone',
  disabled = false,
  distance,
  level,
  location,
  onPress,
  players,
  selected = false,
  spotsTone = 'yellow',
  spotsLeft = '3 spots left',
  status,
  time,
  title,
  variant,
}: NearbyGameCardProps) {
  const isWarningAction = actionTone === 'warning';
  const isMutedAction = actionTone === 'muted';
  const isLongAction = actionLabel.length > 7;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}
    >
      <BeachThumb badgeLabel={spotsLeft} tone={spotsTone} variant={variant} />
      <View style={styles.copy}>
        <View style={styles.timeRow}>
          <View style={styles.liveDot} />
          <AppText style={styles.timeText} tone="primary" variant="metadata" weight="600">
            {time}
          </AppText>
        </View>

        <AppText numberOfLines={1} style={styles.title} variant="cardTitle" weight="800">
          {title}
        </AppText>

        <View style={styles.locationRow}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText numberOfLines={1} style={styles.locationText} tone="primary" variant="metadata" weight="500">
            {location}
          </AppText>
        </View>

        <View style={styles.lowerRow}>
          <View style={styles.infoChipStack}>
            <View style={styles.levelPill}>
              <AppText tone="primary" variant="chip" weight="700">
                {level}
              </AppText>
            </View>
            <View style={styles.genderPill}>
              <AppText numberOfLines={1} tone="muted" variant="chip" weight="600">
                {audience}
              </AppText>
            </View>
          </View>

          <View style={styles.actionStack}>
            <View style={styles.playersPill}>
              <Ionicons color={colors.muted} name="people-outline" size={12} />
              <AppText style={styles.playersText} tone="muted" variant="metadata" weight="600">
                {players} players
              </AppText>
            </View>
            <View
              style={[
                styles.cardAction,
                isWarningAction && styles.cardActionWarning,
                isMutedAction && styles.cardActionMuted,
              ]}
            >
              <AppText
                align="center"
                numberOfLines={1}
                style={[styles.actionText, isLongAction && styles.actionTextLong]}
                tone={actionTone === 'accent' ? 'inverse' : actionTone === 'muted' ? 'muted' : 'primary'}
                variant="metadata"
                weight="900"
              >
                {actionLabel}
              </AppText>
              {isLongAction ? null : (
                <Ionicons
                  color={actionTone === 'accent' ? colors.textOnGreen : actionTone === 'muted' ? colors.muted : colors.ink}
                  name={isMutedAction ? 'checkmark' : 'chevron-forward'}
                  size={14}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function BeachThumb({
  badgeLabel,
  tone,
  variant,
}: {
  badgeLabel: string;
  tone: 'green' | 'yellow';
  variant: 'morning' | 'sunset';
}) {
  const isLongBadge = badgeLabel.length > 8;

  return (
    <View style={styles.thumb}>
      <BeachGameVisual compact variant={variant} />
      <View style={[styles.imageBadge, tone === 'green' && styles.imageBadgeGreen]}>
        <AppText
          numberOfLines={1}
          style={[styles.imageBadgeText, isLongBadge && styles.imageBadgeTextLong]}
          tone={tone === 'green' ? 'accent' : 'primary'}
          variant="chip"
          weight="800"
        >
          {badgeLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    alignItems: 'flex-end',
    gap: 5,
    width: 92,
  },
  actionText: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 17,
    maxWidth: 66,
  },
  actionTextLong: {
    fontSize: 12,
    lineHeight: 15,
    maxWidth: 84,
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 132,
    overflow: 'hidden',
    padding: 12,
    ...shadows.soft,
  },
  cardDisabled: {
    opacity: 0.58,
  },
  cardSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.42)',
  },
  cardAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 38,
    width: 92,
  },
  cardActionMuted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  cardActionWarning: {
    backgroundColor: colors.accent,
  },
  copy: {
    flex: 1,
    gap: 3,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  lowerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minHeight: 66,
    paddingTop: 2,
  },
  genderPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    maxWidth: 96,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imageBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    left: 7,
    minHeight: 28,
    paddingHorizontal: 10,
    paddingTop: 5,
    position: 'absolute',
    top: 7,
  },
  imageBadgeGreen: {
    backgroundColor: 'rgba(36, 196, 90, 0.14)',
    borderColor: 'rgba(36, 196, 90, 0.30)',
  },
  imageBadgeText: {
    lineHeight: 16,
  },
  imageBadgeTextLong: {
    fontSize: 10,
    lineHeight: 13,
  },
  levelPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  infoChipStack: {
    alignItems: 'flex-start',
    gap: 5,
    minWidth: 0,
  },
  playersPill: {
    alignItems: 'center',
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    borderRadius: radius.round,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 4,
    minHeight: 18,
    maxWidth: 92,
    paddingHorizontal: 0,
  },
  playersText: {
    flexShrink: 1,
    fontSize: 9,
    lineHeight: 13,
  },
  thumb: {
    borderRadius: 18,
    height: 106,
    overflow: 'hidden',
    position: 'relative',
    width: 104,
  },
  title: {
    color: colors.ink,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  timeText: {
    textTransform: 'uppercase',
  },
});
