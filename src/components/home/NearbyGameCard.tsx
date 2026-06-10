import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, homeTypography, radius, shadows } from '../../theme';
import { AppText } from '../AppText';
import { LobbyImageBadge } from '../LobbyImageBadge';
import { BeachGameVisual } from './BeachGameVisual';

type NearbyGameCardProps = {
  actionLabel?: string;
  actionDisabled?: boolean;
  actionTone?: 'accent' | 'muted' | 'warning';
  audience?: string;
  disabled?: boolean;
  distance: string;
  level: string;
  location: string;
  onActionPress?: () => void;
  onPress?: () => void;
  players: string;
  requestStatusLabel?: string;
  secondarySpotsLeft?: string;
  secondarySpotsTone?: 'green' | 'red' | 'yellow';
  selected?: boolean;
  spotsTone?: 'green' | 'red' | 'yellow';
  spotsLeft?: string;
  status: 'Approval' | 'Closed' | 'Full';
  time: string;
  title: string;
  useHomeTypography?: boolean;
  variant: 'morning' | 'sunset';
};

export function NearbyGameCard({
  actionLabel = 'View match',
  actionDisabled = false,
  actionTone = 'accent',
  audience = 'Everyone',
  disabled = false,
  distance,
  level,
  location,
  onActionPress,
  onPress,
  players,
  requestStatusLabel,
  secondarySpotsLeft,
  secondarySpotsTone = 'red',
  selected = false,
  spotsTone = 'yellow',
  spotsLeft = '3 spots left',
  status,
  time,
  title,
  useHomeTypography = false,
  variant,
}: NearbyGameCardProps) {
  const isWarningAction = actionTone === 'warning';
  const isMutedAction = actionTone === 'muted';
  const isLongAction = actionLabel.length > 7;

  const cardContent = (
    <>
      <BeachThumb
        badgeLabel={spotsLeft}
        secondaryBadgeLabel={secondarySpotsLeft}
        secondaryTone={secondarySpotsTone}
        tone={spotsTone}
        useHomeTypography={useHomeTypography}
        variant={variant}
      />
      <View style={styles.copy}>
        <View style={styles.timeRow}>
          <View style={styles.liveDot} />
          <AppText
            style={[styles.timeText, useHomeTypography && styles.homeMetadataText]}
            tone="primary"
            variant="metadata"
            weight="600"
          >
            {time}
          </AppText>
        </View>

        <AppText
          numberOfLines={1}
          style={[styles.title, useHomeTypography && styles.homeCardTitle]}
          variant="cardTitle"
          weight="800"
        >
          {title}
        </AppText>

        <View style={styles.locationRow}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText
            numberOfLines={1}
            style={[styles.locationText, useHomeTypography && styles.homeBodyText]}
            tone="primary"
            variant="metadata"
            weight="500"
          >
            {location}
          </AppText>
        </View>

        <View style={styles.lowerRow}>
          <View style={styles.infoChipStack}>
            <View style={styles.levelPill}>
              <AppText style={useHomeTypography && styles.homeChipText} tone="primary" variant="chip" weight="700">
                {level}
              </AppText>
            </View>
            <View style={styles.genderPill}>
              <AppText
                numberOfLines={1}
                style={useHomeTypography && styles.homeChipText}
                tone="muted"
                variant="chip"
                weight="600"
              >
                {audience}
              </AppText>
            </View>
          </View>

          <View style={styles.actionStack}>
            <View style={styles.playersPill}>
              <Ionicons color={colors.muted} name="people-outline" size={12} />
              <AppText
                style={[styles.playersText, useHomeTypography && styles.homePlayersText]}
                tone="muted"
                variant="metadata"
                weight="600"
              >
                {players} players
              </AppText>
            </View>
            {requestStatusLabel ? (
              <View style={styles.requestStatusPill}>
                <Ionicons color={colors.primaryDark} name="time-outline" size={11} />
                <AppText numberOfLines={1} style={styles.requestStatusText} variant="metadata" weight="800">
                  {requestStatusLabel}
                </AppText>
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={disabled || actionDisabled}
              onPress={onActionPress ?? onPress}
              style={[
                styles.cardAction,
                isWarningAction && styles.cardActionWarning,
                isMutedAction && styles.cardActionMuted,
                (disabled || actionDisabled) && styles.cardActionDisabled,
              ]}
            >
              <AppText
                align="center"
                numberOfLines={1}
                style={[
                  styles.actionText,
                  useHomeTypography && styles.homeActionText,
                  isLongAction && styles.actionTextLong,
                ]}
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
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}>
        {cardContent}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected, disabled && styles.cardDisabled]}
    >
      {cardContent}
    </Pressable>
  );
}

function BeachThumb({
  badgeLabel,
  secondaryBadgeLabel,
  secondaryTone,
  tone,
  variant,
}: {
  badgeLabel: string;
  secondaryBadgeLabel?: string;
  secondaryTone: 'green' | 'red' | 'yellow';
  tone: 'green' | 'red' | 'yellow';
  useHomeTypography: boolean;
  variant: 'morning' | 'sunset';
}) {
  return (
    <View style={styles.thumb}>
      <BeachGameVisual compact variant={variant} />
      <LobbyImageBadge label={badgeLabel} size="compact" tone={tone} />
      <LobbyImageBadge label={secondaryBadgeLabel} offset="after" size="compact" tone={secondaryTone} />
    </View>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    alignItems: 'flex-end',
    gap: 5,
    width: 112,
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
    alignSelf: 'flex-end',
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
  cardActionDisabled: {
    opacity: 0.58,
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
  homeActionText: {
    fontFamily: homeTypography.button.fontFamily,
    fontWeight: 'normal',
  },
  homeBodyText: {
    fontFamily: homeTypography.body.fontFamily,
    fontWeight: 'normal',
  },
  homeCardTitle: {
    ...homeTypography.cardTitle,
  },
  homeChipText: {
    ...homeTypography.chipSmall,
  },
  homeMetadataText: {
    ...homeTypography.metadata,
  },
  homePlayersText: {
    fontFamily: homeTypography.metadata.fontFamily,
    fontWeight: 'normal',
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
    alignSelf: 'flex-end',
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
  requestStatusPill: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(234, 245, 236, 0.82)',
    borderColor: 'rgba(36, 196, 90, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 18,
    paddingHorizontal: 4,
    width: 112,
  },
  requestStatusText: {
    color: colors.primaryDark,
    flexShrink: 1,
    fontSize: 8,
    lineHeight: 10,
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
