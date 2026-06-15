import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { formatTocaPoints, getTocaPointProgress } from '../../features/tocaPoints/tocaPointProgression';
import { colors, homeTypography, radius, shadows, spacing } from '../../theme';
import type { Player } from '../../types';
import { AppText } from '../AppText';
import { ProgressBar } from '../ProgressBar';

type ProgressProps = {
  player: Player;
  rating?: string;
  tocaPointGain?: {
    amount: number;
    from: number;
    id: number;
    to: number;
  } | null;
};

export function PlayerStatusStrip({ player, rating = '3.6', tocaPointGain }: ProgressProps) {
  const tocaProgress = getTocaPointProgress(player.tocaPoints);
  const animatedProgress = useRef(new Animated.Value(tocaProgress.progressToNextLevel)).current;
  const [isGainVisible, setIsGainVisible] = useState(false);

  useEffect(() => {
    if (!tocaPointGain) {
      animatedProgress.setValue(tocaProgress.progressToNextLevel);
      setIsGainVisible(false);
      return undefined;
    }

    const fromProgress = getTocaPointProgress(tocaPointGain.from);
    const toProgress = getTocaPointProgress(tocaPointGain.to);
    const startProgress = fromProgress.currentLevel === toProgress.currentLevel
      ? fromProgress.progressToNextLevel
      : 0;

    animatedProgress.stopAnimation();
    animatedProgress.setValue(startProgress);
    setIsGainVisible(true);

    Animated.timing(animatedProgress, {
      duration: 850,
      toValue: toProgress.progressToNextLevel,
      useNativeDriver: false,
    }).start();

    const hideTimer = setTimeout(() => {
      setIsGainVisible(false);
    }, 2000);

    return () => clearTimeout(hideTimer);
  }, [animatedProgress, tocaPointGain?.id, tocaProgress.progressToNextLevel]);

  const animatedWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
          {tocaProgress.currentLevel}
        </AppText>
      </LinearGradient>

      <View style={stripStyles.points}>
        <View style={stripStyles.pointsHeader}>
          <AppText style={stripStyles.pointsTitle} variant="uiBody" weight="800">
            TOCA Points
          </AppText>
          <AppText style={stripStyles.pointsCount} tone="primary" variant="metadata" weight="500">
            {formatTocaPoints(tocaProgress.totalTp)} / {formatTocaPoints(tocaProgress.nextLevelRequiredTp)}
          </AppText>
        </View>
        {isGainVisible && tocaPointGain ? (
          <View style={stripStyles.pointsGainBadge}>
            <AppText tone="warning" variant="caption" weight="900">
              +{formatTocaPoints(tocaPointGain.amount)}
            </AppText>
          </View>
        ) : null}
        <View style={stripStyles.animatedProgressTrack}>
          <Animated.View style={[stripStyles.animatedProgressFill, { width: animatedWidth }]} />
        </View>
      </View>

      <View style={stripStyles.metricPill}>
        <Ionicons color="rgba(255, 200, 61, 0.86)" name="star" size={13} />
        <AppText style={stripStyles.metricValue} variant="button" weight="800">
          {rating}
        </AppText>
      </View>

      <View style={stripStyles.metricPill}>
        <Ionicons color="rgba(255, 200, 61, 0.86)" name="ribbon-outline" size={14} />
        <AppText style={stripStyles.metricValue} variant="button" weight="800">
          {player.level}
        </AppText>
      </View>
    </View>
  );
}

export function ProgressCard({ player, rating = '3.6' }: ProgressProps) {
  const tocaProgress = getTocaPointProgress(player.tocaPoints);

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
          {tocaProgress.currentLevel}
        </AppText>
      </LinearGradient>

      <View style={styles.points}>
        <AppText variant="title" weight="800">
          TOCA Points
        </AppText>
        <AppText tone="muted" variant="body">
          {formatTocaPoints(tocaProgress.totalTp)} / {formatTocaPoints(tocaProgress.nextLevelRequiredTp)}
        </AppText>
        <ProgressBar fillColor={colors.accentGold} progress={tocaProgress.progressToNextLevel} style={styles.progress} />
      </View>

      <View style={styles.divider} />

      <View style={styles.rating}>
        <Ionicons color="rgba(255, 200, 61, 0.82)" name="star-outline" size={24} />
        <AppText variant="title" weight="800">
          {rating}
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
          {player.level}
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
    position: 'relative',
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
    width: 58,
  },
  levelLabel: {
    fontFamily: homeTypography.chipSmall.fontFamily,
    fontSize: 8,
    fontWeight: 'normal',
    lineHeight: 10,
  },
  levelNumber: {
    fontFamily: homeTypography.heroTitle.fontFamily,
    fontSize: 24,
    fontWeight: 'normal',
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
    ...homeTypography.button,
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
    fontFamily: homeTypography.cardTitle.fontFamily,
    fontWeight: 'normal',
    lineHeight: 22,
  },
  pointsCount: {
    ...homeTypography.metadata,
  },
  pointsGainBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.38)',
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 20,
    paddingHorizontal: 8,
    position: 'absolute',
    right: 0,
    top: 26,
    zIndex: 2,
  },
  animatedProgressFill: {
    backgroundColor: colors.accentGold,
    borderRadius: radius.round,
    height: '100%',
  },
  animatedProgressTrack: {
    backgroundColor: '#D9E8D8',
    borderRadius: radius.round,
    height: 6,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progress: {
    height: 6,
    marginTop: spacing.xs,
  },
});
