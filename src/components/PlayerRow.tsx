import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import type { Player } from '../types';
import { AppText } from './AppText';
import { Avatar } from './Avatar';

type IconName = keyof typeof Ionicons.glyphMap;

export type PlayerRowAction = {
  disabled?: boolean;
  icon?: IconName;
  iconOnly?: boolean;
  label: string;
  onPress?: () => void;
  variant?: 'muted' | 'primary' | 'warning';
};

type PlayerRowProps = {
  context?: string;
  initials: string;
  level: string;
  location?: string;
  meta?: string;
  name: string;
  onMore?: () => void;
  onPressProfile?: () => void;
  player?: Player;
  primaryAction?: PlayerRowAction;
  rating?: string;
  secondaryAction?: PlayerRowAction;
  statusIcon?: IconName;
  style?: StyleProp<ViewStyle>;
};

export function PlayerRow({
  initials,
  level,
  location,
  meta,
  name,
  onMore,
  onPressProfile,
  player,
  primaryAction,
  rating,
  secondaryAction,
  statusIcon = 'star',
  style,
}: PlayerRowProps) {
  return (
    <View style={[styles.row, style]}>
      <Pressable accessibilityRole="button" onPress={onPressProfile} style={styles.infoArea}>
        <View style={styles.avatarWrap}>
          {player ? (
            <Avatar player={player} size={44} />
          ) : (
            <View style={styles.avatar}>
              <AppText align="center" variant="cardTitle" weight="700">
                {initials}
              </AppText>
            </View>
          )}
          <View style={styles.statusBadge}>
            <Ionicons color={colors.ink} name={statusIcon} size={10} />
          </View>
        </View>

        <View style={styles.copy}>
          <AppText numberOfLines={1} variant="titleSmall" weight="600">
            {name}
          </AppText>
          {location ? (
            <View style={styles.locationLine}>
              <Ionicons color={colors.accentSea} name="location" size={12} />
              <AppText numberOfLines={2} style={styles.locationText} tone="muted" variant="metadata" weight="500">
                {location}
              </AppText>
            </View>
          ) : null}
          <View style={styles.chipRow}>
            <View style={styles.levelChip}>
              <AppText tone="primary" variant="chip" weight="700">
                {level}
              </AppText>
            </View>
            {rating ? (
              <View style={styles.ratingChip}>
                <Ionicons color={colors.accentGoldDark} name="star" size={10} />
                <AppText tone="primary" variant="chip" weight="700">
                  {rating}
                </AppText>
              </View>
            ) : null}
            {meta ? (
              <View style={styles.metaChip}>
                <Ionicons color={colors.accentGoldDark} name="flash-outline" size={10} />
                <AppText numberOfLines={1} style={styles.metaChipText} tone="primary" variant="chip" weight="700">
                  {meta}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {primaryAction ? (
          <Pressable
            accessibilityLabel={primaryAction.label}
            accessibilityRole="button"
            disabled={primaryAction.disabled}
            onPress={primaryAction.onPress}
            style={[
              styles.primaryButton,
              primaryAction.iconOnly && styles.iconActionButton,
              primaryAction.variant === 'warning' && styles.warningPrimaryButton,
              (primaryAction.variant === 'muted' || primaryAction.disabled) && styles.mutedPrimaryButton,
            ]}
          >
            {primaryAction.icon ? (
              <Ionicons color={getActionIconColor(primaryAction)} name={primaryAction.icon} size={16} />
            ) : null}
            {primaryAction.iconOnly ? null : (
              <AppText
                align="center"
                numberOfLines={1}
                tone={getActionTextTone(primaryAction)}
                variant="metadata"
                weight="700"
              >
                {primaryAction.label}
              </AppText>
            )}
          </Pressable>
        ) : null}
        {secondaryAction ? (
          <Pressable
            accessibilityLabel={secondaryAction.label}
            accessibilityRole="button"
            onPress={secondaryAction.onPress}
            style={[styles.secondaryButton, secondaryAction.iconOnly && styles.iconActionButton]}
          >
            {secondaryAction.icon ? <Ionicons color={colors.muted} name={secondaryAction.icon} size={16} /> : null}
            {secondaryAction.iconOnly ? null : (
              <AppText align="center" tone="muted" variant="metadata" weight="600">
                {secondaryAction.label}
              </AppText>
            )}
          </Pressable>
        ) : null}
        {onMore ? (
          <Pressable accessibilityRole="button" onPress={onMore} style={styles.moreButton}>
            <Ionicons color={colors.muted} name="ellipsis-horizontal" size={18} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function getActionTextTone(action: PlayerRowAction) {
  if (action.variant === 'muted' || action.disabled) {
    return 'accent';
  }

  if (action.variant === 'warning') {
    return 'primary';
  }

  return 'inverse';
}

function getActionIconColor(action: PlayerRowAction) {
  if (action.variant === 'muted' || action.disabled) {
    return colors.primaryDark;
  }

  if (action.variant === 'warning') {
    return colors.ink;
  }

  return colors.textOnGreen;
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  avatarWrap: {
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  infoArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  iconActionButton: {
    height: 32,
    minHeight: 32,
    minWidth: 32,
    paddingHorizontal: 0,
    width: 32,
  },
  levelChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  locationLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    minWidth: 0,
  },
  locationText: {
    color: colors.accentSea,
    flex: 1,
    minWidth: 0,
  },
  metaChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.14)',
    borderColor: 'rgba(246, 201, 69, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  metaChipText: {
    flexShrink: 1,
    minWidth: 0,
  },
  moreButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  mutedPrimaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 31,
    minWidth: 76,
    paddingHorizontal: 10,
  },
  warningPrimaryButton: {
    backgroundColor: 'rgba(246, 201, 69, 0.34)',
    borderColor: 'rgba(239, 165, 26, 0.30)',
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: 9,
  },
  ratingChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 68,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    ...shadows.soft,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 36,
    paddingHorizontal: 7,
  },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: -1,
    height: 17,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    width: 17,
  },
});
