import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import type { Player } from '../types';
import { AppText } from './AppText';
import { Avatar } from './Avatar';

type PlayerProfilePreviewProps = {
  context?: string;
  initials: string;
  level?: string;
  meta?: string;
  moreActions?: PlayerPreviewAction[];
  name: string;
  onClose: () => void;
  player?: Player;
  profileDetails?: PlayerPreviewDetail[];
  primaryAction?: {
    disabled?: boolean;
    label: string;
    onPress?: () => void;
  };
  rating?: string;
  secondaryAction?: {
    disabled?: boolean;
    label: string;
    onPress?: () => void;
  };
  trustCues?: PlayerPreviewDetail[];
  visible: boolean;
};

export type PlayerPreviewDetail = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'aqua' | 'green' | 'yellow';
  value: string;
};

type PlayerPreviewAction = {
  destructive?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};

export function PlayerProfilePreview({
  initials,
  level,
  meta,
  moreActions = [],
  name,
  onClose,
  player,
  profileDetails = [],
  primaryAction,
  rating,
  secondaryAction,
  trustCues = [],
  visible,
}: PlayerProfilePreviewProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setIsMenuOpen(false);
              onClose();
            }}
            style={styles.closeButton}
          >
            <Ionicons color={colors.muted} name="close" size={17} />
          </Pressable>
          {moreActions.length ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsMenuOpen((current) => !current)}
              style={styles.moreButton}
            >
              <Ionicons color={colors.muted} name="ellipsis-horizontal" size={18} />
            </Pressable>
          ) : null}
          {isMenuOpen ? (
            <View style={styles.inlineMenu}>
              {moreActions.map((action) => (
                <Pressable
                  accessibilityRole="menuitem"
                  key={action.label}
                  onPress={() => {
                    action.onPress?.();
                    setIsMenuOpen(false);
                    onClose();
                  }}
                  style={styles.inlineMenuRow}
                >
                  <View style={[styles.inlineMenuIcon, action.destructive && styles.inlineMenuIconDanger]}>
                    <Ionicons
                      color={action.destructive ? colors.danger : colors.primaryDark}
                      name={action.icon}
                      size={15}
                    />
                  </View>
                  <AppText
                    numberOfLines={1}
                    style={action.destructive ? styles.inlineMenuDangerText : styles.inlineMenuText}
                    tone={action.destructive ? 'danger' : 'primary'}
                    variant="metadata"
                    weight="800"
                  >
                    {action.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.avatarWrap}>
            {player ? (
              <Avatar player={player} size={76} />
            ) : (
              <View style={styles.avatar}>
                <AppText align="center" variant="heroTitle" weight="900">
                  {initials}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.copy}>
            <AppText align="center" numberOfLines={1} variant="sectionHeading" weight="800">
              {name}
            </AppText>
          </View>

          <View style={styles.chipRow}>
            {level ? (
              <View style={styles.chip}>
                <AppText variant="chip" weight="800">
                  {level}
                </AppText>
              </View>
            ) : null}
            {rating ? (
              <View style={[styles.chip, styles.ratingChip]}>
                <Ionicons color={colors.accentGoldDark} name="star" size={11} />
                <AppText tone="primary" variant="chip" weight="800">
                  {rating} rating
                </AppText>
              </View>
            ) : null}
          </View>

          {meta ? (
            <View style={styles.pointsPill}>
              <Ionicons color={colors.accentGoldDark} name="flash-outline" size={14} />
              <AppText align="center" tone="warning" variant="metadata" weight="800">
                {meta}
              </AppText>
            </View>
          ) : null}

          {trustCues.length ? (
            <View style={styles.sectionBlock}>
              <AppText tone="primary" variant="metadata" weight="800">
                Profile snapshot
              </AppText>
              <View style={styles.detailGrid}>
                {trustCues.map((detail) => (
                  <PreviewDetailCard detail={detail} key={`${detail.label}-${detail.value}`} />
                ))}
              </View>
            </View>
          ) : null}

          {profileDetails.length ? (
            <View style={styles.sectionBlock}>
              <AppText tone="primary" variant="metadata" weight="800">
                Playing profile
              </AppText>
              <View style={styles.detailStack}>
                {profileDetails.map((detail) => (
                  <PreviewDetailRow detail={detail} key={`${detail.label}-${detail.value}`} />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.actionStack}>
            <Pressable
              accessibilityRole="button"
              disabled={primaryAction?.disabled}
              onPress={() => {
                primaryAction?.onPress?.();
                onClose();
              }}
              style={[styles.primaryButton, primaryAction?.disabled && styles.disabledButton]}
            >
              <AppText align="center" tone="inverse" variant="button" weight="800">
                {primaryAction?.label ?? 'View full profile'}
              </AppText>
            </Pressable>

            {secondaryAction ? (
              <Pressable
                accessibilityRole="button"
                disabled={secondaryAction.disabled}
                onPress={() => {
                  secondaryAction.onPress?.();
                  onClose();
                }}
                style={[styles.secondaryButton, secondaryAction.disabled && styles.disabledButton]}
              >
                <AppText align="center" tone="accent" variant="button" weight="800">
                  {secondaryAction.label}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PreviewDetailCard({ detail }: { detail: PlayerPreviewDetail }) {
  return (
    <View style={styles.detailCard}>
      <View style={[styles.detailIcon, getDetailToneStyle(detail.tone)]}>
        <Ionicons color={getDetailIconColor(detail.tone)} name={detail.icon} size={15} />
      </View>
      <View style={styles.detailCopy}>
        <AppText numberOfLines={1} variant="uiBody" weight="800">
          {detail.value}
        </AppText>
        <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
          {detail.label}
        </AppText>
      </View>
    </View>
  );
}

function PreviewDetailRow({ detail }: { detail: PlayerPreviewDetail }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.rowIcon, getDetailToneStyle(detail.tone)]}>
        <Ionicons color={getDetailIconColor(detail.tone)} name={detail.icon} size={14} />
      </View>
      <AppText style={styles.detailRowLabel} tone="muted" variant="metadata" weight="700">
        {detail.label}
      </AppText>
      <AppText align="right" numberOfLines={1} style={styles.detailRowValue} variant="metadata" weight="800">
        {detail.value}
      </AppText>
    </View>
  );
}

function getDetailIconColor(tone: PlayerPreviewDetail['tone'] = 'green') {
  if (tone === 'aqua') {
    return colors.accentSea;
  }

  if (tone === 'yellow') {
    return colors.accentGoldDark;
  }

  return colors.primaryDark;
}

function getDetailToneStyle(tone: PlayerPreviewDetail['tone'] = 'green') {
  if (tone === 'aqua') {
    return styles.detailIconAqua;
  }

  if (tone === 'yellow') {
    return styles.detailIconYellow;
  }

  return undefined;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  avatarWrap: {
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  backdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.16)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl2,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    ...shadows.hero,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  copy: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  detailCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 58,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  detailIconAqua: {
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.32)',
  },
  detailIconYellow: {
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.44)',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 32,
  },
  detailRowLabel: {
    flex: 1,
    minWidth: 0,
  },
  detailRowValue: {
    flex: 1,
    minWidth: 0,
  },
  detailStack: {
    gap: spacing.xs,
  },
  inlineMenu: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minWidth: 210,
    padding: spacing.xs,
    position: 'absolute',
    right: spacing.md,
    top: 52,
    zIndex: 4,
    ...shadows.card,
  },
  inlineMenuDangerText: {
    color: colors.danger,
  },
  inlineMenuIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  inlineMenuIconDanger: {
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
  },
  inlineMenuRow: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.xs,
  },
  inlineMenuText: {
    flex: 1,
  },
  actionStack: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    width: 34,
  },
  moreButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 34,
  },
  pointsPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.44)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
  },
  disabledButton: {
    opacity: 0.72,
  },
  ratingChip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  rowIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  sectionBlock: {
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
});
