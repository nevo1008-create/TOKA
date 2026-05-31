import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../../theme';

type BeachGameVisualVariant = 'aqua' | 'hero' | 'morning' | 'sunset';

type BeachGameVisualProps = {
  compact?: boolean;
  variant?: BeachGameVisualVariant;
};

const palettes: Record<BeachGameVisualVariant, readonly [string, string, string, string]> = {
  hero: ['#BFEDE6', '#DDF5F1', '#FFF1B8', '#F1C783'],
  morning: ['#CFF2EA', '#EAF5EC', '#FFF2BD', '#F6C945'],
  sunset: ['#FFE8B7', '#F8B577', '#F6C945', '#1BB7A8'],
  aqua: ['#DDF5F1', '#99E3D8', '#FFF2BD', '#F8D58D'],
};

export function BeachGameVisual({ compact = false, variant = 'hero' }: BeachGameVisualProps) {
  const palette = palettes[variant];

  return (
    <View style={styles.visual}>
      <LinearGradient
        colors={[palette[0], palette[1], palette[2], palette[3]]}
        locations={[0, 0.34, 0.7, 1]}
        start={{ x: 0.86, y: 0 }}
        end={{ x: 0.18, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.68)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.18, y: 0.72 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.seaBand, compact && styles.seaBandCompact]} />
      <View style={[styles.sunGlow, compact && styles.sunGlowCompact]} />
      <View style={[styles.netPost, compact && styles.netPostCompact]} />
      <View style={[styles.netLine, styles.netLineTop, compact && styles.netLineCompact]} />
      <View style={[styles.netLine, styles.netLineMid, compact && styles.netLineCompact]} />
      <View style={[styles.netLine, styles.netLineLow, compact && styles.netLineCompact]} />
      <View style={[styles.courtLine, styles.courtLineOne, compact && styles.courtLineCompact]} />
      <View style={[styles.courtLine, styles.courtLineTwo, compact && styles.courtLineCompact]} />
      <View style={[styles.ball, compact && styles.ballCompact]}>
        <View style={styles.ballCurveOne} />
        <View style={styles.ballCurveTwo} />
      </View>
      <View style={[styles.palmHint, styles.palmHintOne, compact && styles.palmHintCompact]} />
      <View style={[styles.palmHint, styles.palmHintTwo, compact && styles.palmHintCompact]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ball: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(18, 59, 42, 0.16)',
    borderRadius: radius.round,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    position: 'absolute',
    right: 74,
    top: 70,
    width: 36,
  },
  ballCompact: {
    height: 24,
    right: 16,
    top: 54,
    width: 24,
  },
  ballCurveOne: {
    backgroundColor: 'rgba(18, 59, 42, 0.18)',
    height: 2,
    transform: [{ rotate: '34deg' }],
    width: '80%',
  },
  ballCurveTwo: {
    backgroundColor: 'rgba(18, 59, 42, 0.14)',
    height: '78%',
    position: 'absolute',
    transform: [{ rotate: '-24deg' }],
    width: 2,
  },
  courtLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.50)',
    height: 2,
    position: 'absolute',
  },
  courtLineCompact: {
    opacity: 0.7,
  },
  courtLineOne: {
    bottom: 56,
    right: -12,
    transform: [{ rotate: '-16deg' }],
    width: 290,
  },
  courtLineTwo: {
    bottom: 104,
    right: 44,
    transform: [{ rotate: '62deg' }],
    width: 150,
  },
  netLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    height: 2,
    position: 'absolute',
    right: -12,
    width: 250,
  },
  netLineCompact: {
    right: -34,
    width: 124,
  },
  netLineLow: {
    top: 204,
  },
  netLineMid: {
    top: 170,
  },
  netLineTop: {
    top: 136,
  },
  netPost: {
    backgroundColor: 'rgba(18, 59, 42, 0.16)',
    bottom: 64,
    position: 'absolute',
    right: 142,
    top: 112,
    transform: [{ rotate: '4deg' }],
    width: 3,
  },
  netPostCompact: {
    bottom: 24,
    right: 52,
    top: 38,
    width: 2,
  },
  palmHint: {
    backgroundColor: 'rgba(18, 59, 42, 0.16)',
    borderRadius: radius.round,
    position: 'absolute',
    width: 8,
  },
  palmHintCompact: {
    opacity: 0.55,
    width: 4,
  },
  palmHintOne: {
    height: 104,
    right: 12,
    top: 16,
    transform: [{ rotate: '18deg' }],
  },
  palmHintTwo: {
    height: 68,
    right: 34,
    top: 24,
    transform: [{ rotate: '-42deg' }],
  },
  seaBand: {
    backgroundColor: 'rgba(27, 183, 168, 0.23)',
    height: 72,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 112,
  },
  seaBandCompact: {
    height: 34,
    top: 42,
  },
  sunGlow: {
    backgroundColor: 'rgba(246, 201, 69, 0.38)',
    borderRadius: radius.round,
    height: 104,
    position: 'absolute',
    right: 56,
    top: 145,
    width: 104,
  },
  sunGlowCompact: {
    height: 42,
    right: 48,
    top: 12,
    width: 42,
  },
  visual: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
