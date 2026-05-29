import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
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
        <AppText align="center" tone="inverse" style={stripStyles.levelLabel} weight="800">
          Level
        </AppText>
        <AppText align="center" tone="inverse" style={stripStyles.levelNumber} weight="800">
          8
        </AppText>
      </LinearGradient>

      <View style={stripStyles.points}>
        <View style={stripStyles.pointsHeader}>
          <AppText style={stripStyles.pointsTitle} variant="bodySmall" weight="800">
            TOCA Points
          </AppText>
          <AppText tone="muted" variant="caption" weight="600">
            1,250 / 2,000
          </AppText>
        </View>
        <ProgressBar fillColor={colors.accentGold} progress={0.625} style={stripStyles.progress} trackColor="rgba(246,247,237,0.11)" />
      </View>

      <View style={stripStyles.metricPill}>
        <Ionicons color="rgba(255, 200, 61, 0.86)" name="star" size={13} />
        <AppText style={stripStyles.metricValue} weight="800">
          3.6
        </AppText>
      </View>

      <View style={stripStyles.metricPill}>
        <Ionicons color="rgba(255, 200, 61, 0.86)" name="ribbon-outline" size={14} />
        <AppText style={stripStyles.metricValue} weight="800">
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
        <AppText align="center" tone="inverse" variant="label" weight="700">
          Level
        </AppText>
        <AppText align="center" tone="inverse" style={styles.levelNumber} weight="800">
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
        <ProgressBar fillColor={colors.accentGold} progress={0.625} style={styles.progress} trackColor="rgba(246,247,237,0.12)" />
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
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: 'rgba(76, 255, 90, 0.12)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 96,
    padding: 6,
  },
  divider: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(246,247,237,0.12)',
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
    backgroundColor: 'rgba(11, 29, 16, 0.48)',
    borderColor: 'rgba(76, 255, 90, 0.12)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  levelBadge: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 48,
  },
  levelLabel: {
    fontSize: 9,
    lineHeight: 11,
  },
  levelNumber: {
    fontSize: 20,
    lineHeight: 22,
  },
  metricPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.07)',
    borderColor: 'rgba(255, 200, 61, 0.20)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 30,
    paddingHorizontal: 7,
  },
  metricValue: {
    color: colors.darkText,
    fontSize: 13,
    lineHeight: 16,
  },
  points: {
    flex: 1,
    minWidth: 0,
  },
  pointsHeader: {
    gap: 1,
  },
  pointsTitle: {
    color: '#ECEDE6',
    fontSize: 13,
    lineHeight: 16,
  },
  progress: {
    height: 5,
    marginTop: spacing.xs,
  },
});
