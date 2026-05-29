import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';

import { colors, radius } from '../theme';

type ProgressBarProps = {
  fillColor?: string;
  progress: number;
  style?: ViewStyle | ViewStyle[];
  trackColor?: string;
};

export function ProgressBar({ fillColor = colors.neon, progress, style, trackColor = colors.darkBorder }: ProgressBarProps) {
  const width = `${Math.max(0, Math.min(progress, 1)) * 100}%` as DimensionValue;

  return (
    <View style={[styles.track, { backgroundColor: trackColor }, style]}>
      <View style={[styles.fill, { backgroundColor: fillColor, width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    borderRadius: radius.round,
    height: '100%',
  },
  track: {
    borderRadius: radius.round,
    height: 8,
    overflow: 'hidden',
  },
});
