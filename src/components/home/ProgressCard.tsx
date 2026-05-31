import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';
import { AppText } from '../AppText';
import { ProgressBar } from '../ProgressBar';

export function PlayerStatusStrip() {
  return (
    <View style={stripStyles.card}>
      <LinearGradient
        colors={[colors.accentGold, '#FFE889', colors.accentGoldDark]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={stripStyles.levelBadge}
      >
        <AppText align="center" tone="primary" style={stripStyles.levelLabel} weight="800">
          Level
        </AppText>
        <AppText align="center" tone="primary" style={stripStyles.levelNumber} weight="800">
          8
        </AppText>
      </LinearGradient>

      <View style={stripStyles.points}>
        <View style={stripStyles.pointsHeader}>
          <AppText style={stripStyles.pointsTitle} variant="uiBody" weight="800">
            TOCA Points
          </AppText>
          <AppText tone="primary" variant="metadata" weight="500">
            1,250 / 2,000
          </AppText>
        </View>
        <ProgressBar fillColor={colors.accentGold} progress={0.625} style={stripStyles.progress} />
      </View>

      <View style={stripStyles.metricPill}>
        <Ionicons color="rgba(255, 200, 61, 0.86)" name="star" size={13} />
        <AppText style={stripStyles.metricValue} variant="button" weight="800">
          3.6
        </AppText>
      </View>

      <View style={stripStyles.metricPill}>
        <Ionicons color="rgba(255, 200, 61, 0.86)" name="ribbon-outline" size={14} />
        <AppText style={stripStyles.metricValue} variant="button" weight="800">
          B+
        </AppText>
      </View>
    </View>
  );
}

export function ProgressCard() {
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[colors.accentGold, '#FFE889', colors.accentGoldDark]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.levelBadge}
      >
        <AppText align="center" tone="primary" variant="label" weight="700">
          Level
        </AppText>
        <AppText align="center" tone="primary" style={styles.levelNumber} weight="800">
          8
        </AppText>
      </LinearGradient>

      <View style={styles.points}>
        <AppText variant="title" weight="800">
          TOCA Points
        </AppText>
        <AppText tone="muted" variant="body">
          1,250 / 2,000
        </AppText>
        <ProgressBar fillColor={colors.accentGold} progress={0.625} style={styles.progress} />
      </View>

      <View style={styles.divider} />

      <View style={styles.rating}>
        <Ionicons color="rgba(255, 200, 61, 0.82)" name="star-outline" size={24} />
        <AppText variant="title" weight="800">
          3.6
        </AppText>
        <View style={styles.starsRow}>
          {[0, 1, 2, 3, 4].map((index) => (
            <Ionicons
              key={index}
              color={index < 4 ? 'rgba(255, 200, 61, 0.82)' : 'rgba(138, 150, 131, 0.58)'}
              name={index < 4 ? 'star' : 'star-outline'}
              size={12}
            />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.level}>
        <Ionicons color="rgba(255, 200, 61, 0.82)" name="ribbon-outline" size={25} />
        <AppText variant="title" weight="800">
          B+
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall">
          Current level
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 96,
    padding: 6,
  },
  divider: {
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    width: 1,
  },
  level: {
    alignItems: 'center',
    width: 56,
  },
  levelBadge: {
    alignItems: 'center',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    width: 58,
  },
  levelNumber: {
    fontSize: 26,
    lineHeight: 29,
  },
  points: {
    flex: 1,
    minWidth: 0,
  },
  progress: {
    height: 8,
    marginTop: spacing.xs,
  },
  rating: {
    alignItems: 'center',
    width: 58,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: spacing.xxs,
  },
});

const stripStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 7,
    ...shadows.card,
  },
  levelBadge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 52,
  },
  levelLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  levelNumber: {
    fontSize: 24,
    lineHeight: 26,
  },
  metricPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 32,
    paddingHorizontal: 9,
  },
  metricValue: {
    color: colors.ink,
  },
  points: {
    flex: 1,
    minWidth: 0,
  },
  pointsHeader: {
    gap: 1,
  },
  pointsTitle: {
    color: colors.ink,
  },
  progress: {
    height: 6,
    marginTop: spacing.xs,
  },
});
