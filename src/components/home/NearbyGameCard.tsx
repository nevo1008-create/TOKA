import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { AppText } from '../AppText';

type NearbyGameCardProps = {
  actionLabel?: string;
  actionTone?: 'accent' | 'warning';
  audience?: string;
  distance: string;
  level: string;
  location: string;
  onPress?: () => void;
  players: string;
  spotsLeft?: string;
  status: 'Approval' | 'Full';
  time: string;
  title: string;
  variant: 'morning' | 'sunset';
};

export function NearbyGameCard({
  actionLabel = 'Open room',
  actionTone = 'accent',
  audience = 'Everyone',
  distance,
  level,
  location,
  onPress,
  players,
  spotsLeft = '3 spots left',
  status,
  time,
  title,
  variant,
}: NearbyGameCardProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <BeachThumb badgeLabel={spotsLeft} variant={variant} />
      <View style={styles.copy}>
        <View style={styles.timeRow}>
          <View style={styles.liveDot} />
          <AppText style={styles.timeText} tone="muted" variant="caption" weight="700">
            {time}
          </AppText>
        </View>

        <AppText numberOfLines={1} style={styles.title} variant="title" weight="800">
          {title}
        </AppText>

        <View style={styles.locationRow}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText numberOfLines={1} style={styles.locationText} tone="muted" variant="bodySmall" weight="500">
            {location}
          </AppText>
        </View>

        <View style={styles.footer}>
          <View style={styles.chipRow}>
            <View style={styles.levelPill}>
              <AppText tone="muted" variant="caption" weight="800">
                {level}
              </AppText>
            </View>
            <View style={styles.genderPill}>
              <AppText tone="subtle" variant="caption" weight="800">
                {audience}
              </AppText>
            </View>
          </View>

          <View style={styles.actionStack}>
            <View style={styles.playersPill}>
              <Ionicons color={colors.darkMuted} name="people-outline" size={12} />
              <AppText style={styles.playersText} tone="muted" variant="caption" weight="800">
                {players} players
              </AppText>
            </View>
            <View style={styles.cardAction}>
              <AppText tone={actionTone} variant="caption" weight="800">
                {actionLabel}
              </AppText>
              <Ionicons
                color={actionTone === 'warning' ? colors.accent : colors.accentLime}
                name="chevron-forward"
                size={14}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function BeachThumb({ badgeLabel, variant }: { badgeLabel: string; variant: 'morning' | 'sunset' }) {
  const colorsForVariant: readonly [string, string, string] =
    variant === 'morning'
      ? ['#F7D58C', '#B87D35', '#2B1D0D']
      : ['#FCE7B5', '#70C6DC', '#0E4353'];

  return (
    <View style={styles.thumb}>
      <LinearGradient colors={colorsForVariant} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.thumbSun} />
      <View style={styles.thumbNetPost} />
      <View style={[styles.thumbNetLine, styles.thumbNetLineTop]} />
      <View style={[styles.thumbNetLine, styles.thumbNetLineBottom]} />
      <View style={styles.thumbPersonOne} />
      <View style={styles.thumbPersonTwo} />
      <View style={styles.thumbPalm} />
      <View style={styles.imageBadge}>
        <AppText tone="warning" variant="caption" weight="800">
          {badgeLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionStack: {
    alignItems: 'flex-end',
    gap: 3,
  },
  card: {
    backgroundColor: 'rgba(11, 29, 16, 0.70)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 122,
    overflow: 'hidden',
    padding: 9,
  },
  cardAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  copy: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  footer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  genderPill: {
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  imageBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    left: 7,
    minHeight: 22,
    paddingHorizontal: 8,
    paddingTop: 4,
    position: 'absolute',
    top: 7,
  },
  levelPill: {
    backgroundColor: 'rgba(246, 247, 237, 0.04)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  liveDot: {
    backgroundColor: colors.accentLime,
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
  playersPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.06)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 22,
    paddingHorizontal: 7,
  },
  playersText: {
    fontSize: 10,
    lineHeight: 13,
  },
  thumb: {
    borderRadius: 18,
    height: 100,
    overflow: 'hidden',
    position: 'relative',
    width: 100,
  },
  thumbNetLine: {
    backgroundColor: 'rgba(246,247,237,0.5)',
    height: 1,
    left: 22,
    position: 'absolute',
    right: 4,
  },
  thumbNetLineBottom: {
    top: 60,
  },
  thumbNetLineTop: {
    top: 48,
  },
  thumbNetPost: {
    backgroundColor: 'rgba(246,247,237,0.5)',
    bottom: 30,
    left: 52,
    position: 'absolute',
    top: 40,
    width: 1,
  },
  thumbPalm: {
    backgroundColor: 'rgba(3,16,8,0.58)',
    height: 58,
    left: 12,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '11deg' }],
    width: 6,
  },
  thumbPersonOne: {
    backgroundColor: '#2B1A0D',
    borderRadius: radius.round,
    bottom: 20,
    height: 23,
    left: 28,
    position: 'absolute',
    width: 8,
  },
  thumbPersonTwo: {
    backgroundColor: '#2B1A0D',
    borderRadius: radius.round,
    bottom: 20,
    height: 26,
    position: 'absolute',
    right: 24,
    width: 8,
  },
  thumbSun: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderRadius: radius.round,
    height: 32,
    left: 12,
    position: 'absolute',
    top: 15,
    width: 32,
  },
  title: {
    color: '#ECEDE6',
    fontSize: 17,
    lineHeight: 21,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  timeText: {
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
});
