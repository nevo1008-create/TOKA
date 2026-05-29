import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import type { Lobby } from '../../types';
import { AppText } from '../AppText';
import { AvatarStack } from './AvatarStack';

type FeaturedGameCardProps = {
  lobby?: Lobby;
  onJoin: () => void;
  onOpenRoom: () => void;
};

export function FeaturedGameCard({ onJoin, onOpenRoom }: FeaturedGameCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onOpenRoom} style={styles.card}>
      <BeachVisual />
      <LinearGradient
        colors={[colors.darkBackgroundRaised, 'rgba(6, 20, 10, 0.94)', 'rgba(6, 20, 10, 0.18)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.overlay}
      />

      <View style={styles.content}>
        <View style={styles.topPillsRow}>
          <View style={styles.adminPill}>
            <AppText tone="accent" variant="caption" weight="800">
              Admin
            </AppText>
          </View>
          <View style={styles.countdownPill}>
            <Ionicons color={colors.accentGold} name="time-outline" size={15} />
            <AppText tone="warning" variant="bodySmall" weight="800">
              In 3h 20m
            </AppText>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <AppText style={styles.title} variant="display" weight="800">
            Tonight at Gordon
          </AppText>
          <View style={styles.locationRow}>
            <Ionicons color={colors.accentSea} name="location" size={20} />
            <AppText tone="muted" variant="titleSmall" weight="600">
              Gordon Beach
            </AppText>
          </View>
        </View>

        <View style={styles.infoRow}>
          <InfoCell icon="calendar-outline" label="Today" value="20:30" />
          <InfoCell icon="cellular" iconColor={colors.accentLime} label="Level" value="B to C+" />
          <InfoCell icon="people-outline" label="Joined" value="5/8" />
        </View>

        <View style={styles.genderPill}>
          <Ionicons color={colors.darkMuted} name="people-circle-outline" size={14} />
          <AppText tone="muted" variant="caption" weight="800">
            Everyone
          </AppText>
        </View>

        <AvatarStack initials={['NV', 'OM', 'MY', '+2']} />

        <View style={styles.actions}>
          <Pressable onPress={onOpenRoom} style={styles.openButton}>
            <AppText align="center" tone="accent" variant="body" weight="800">
              Open room
            </AppText>
          </Pressable>
          <Pressable onPress={onJoin} style={styles.joinPressable}>
            <View style={styles.joinedButton}>
              <AppText align="center" tone="muted" variant="body" weight="800">
                Joined
              </AppText>
              <Ionicons color={colors.darkMuted} name="checkmark" size={19} />
            </View>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function InfoCell({
  icon,
  iconColor = colors.darkMuted,
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
        <AppText style={styles.infoValueText} weight="700">
          {value}
        </AppText>
      </View>
      <AppText style={styles.infoLabelText} tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function BeachVisual() {
  return (
    <View style={styles.visual}>
      <LinearGradient
        colors={['#264B52', '#92753C', '#2C1808']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.sun} />
      <View style={styles.netPost} />
      <View style={[styles.netLine, styles.netLineTop]} />
      <View style={[styles.netLine, styles.netLineMiddle]} />
      <View style={[styles.netLine, styles.netLineBottom]} />
      <View style={styles.playerBody} />
      <View style={styles.playerArm} />
      <View style={styles.playerLegOne} />
      <View style={styles.playerLegTwo} />
      <LinearGradient colors={[colors.accentGold, colors.accentGoldDark]} style={styles.ball} />
      <View style={styles.palmOne} />
      <View style={styles.palmTwo} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  adminPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.10)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  ball: {
    borderColor: colors.ink,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 28,
    position: 'absolute',
    right: 78,
    top: 58,
    width: 28,
  },
  card: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: 26,
    borderWidth: 1,
    minHeight: 370,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    gap: 10,
    padding: 14,
    zIndex: 2,
  },
  countdownPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.16)',
    borderColor: 'rgba(255, 200, 61, 0.30)',
    borderWidth: 1,
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  genderPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
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
    borderTopColor: 'rgba(246, 247, 237, 0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: 294,
    paddingTop: spacing.sm,
  },
  infoLabelText: {
    color: 'rgba(215, 217, 208, 0.78)',
    fontSize: 12,
    lineHeight: 16,
  },
  infoValueText: {
    color: 'rgba(243, 244, 238, 0.9)',
    fontSize: 15,
    lineHeight: 20,
  },
  infoValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  joinButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
  },
  joinedButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.08)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
  },
  joinPressable: {
    flex: 1,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  netLine: {
    backgroundColor: 'rgba(246,247,237,0.48)',
    height: 1,
    position: 'absolute',
    right: 0,
    width: 230,
  },
  netLineBottom: {
    top: 194,
  },
  netLineMiddle: {
    top: 164,
  },
  netLineTop: {
    top: 134,
  },
  netPost: {
    backgroundColor: 'rgba(246,247,237,0.42)',
    bottom: 58,
    position: 'absolute',
    right: 148,
    top: 112,
    width: 2,
  },
  openButton: {
    alignItems: 'center',
    borderColor: colors.accentLime,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  palmOne: {
    backgroundColor: 'rgba(3,16,8,0.64)',
    height: 106,
    position: 'absolute',
    right: 8,
    top: 22,
    transform: [{ rotate: '18deg' }],
    width: 10,
  },
  palmTwo: {
    backgroundColor: 'rgba(3,16,8,0.46)',
    height: 66,
    position: 'absolute',
    right: 28,
    top: 30,
    transform: [{ rotate: '-42deg' }],
    width: 8,
  },
  playerArm: {
    backgroundColor: '#A36C32',
    borderRadius: radius.round,
    height: 62,
    position: 'absolute',
    right: 72,
    top: 96,
    transform: [{ rotate: '28deg' }],
    width: 10,
  },
  playerBody: {
    backgroundColor: '#1C140C',
    borderRadius: 18,
    height: 62,
    position: 'absolute',
    right: 88,
    top: 120,
    transform: [{ rotate: '-38deg' }],
    width: 26,
  },
  playerLegOne: {
    backgroundColor: '#B27A3A',
    borderRadius: radius.round,
    height: 76,
    position: 'absolute',
    right: 56,
    top: 156,
    transform: [{ rotate: '42deg' }],
    width: 10,
  },
  playerLegTwo: {
    backgroundColor: '#B27A3A',
    borderRadius: radius.round,
    height: 74,
    position: 'absolute',
    right: 118,
    top: 160,
    transform: [{ rotate: '-38deg' }],
    width: 10,
  },
  spotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sun: {
    backgroundColor: 'rgba(255,200,61,0.42)',
    borderRadius: radius.round,
    height: 58,
    position: 'absolute',
    right: 76,
    top: 174,
    width: 58,
  },
  title: {
    fontSize: 29,
    lineHeight: 34,
    maxWidth: 276,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  topPillsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  visual: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '60%',
  },
});
