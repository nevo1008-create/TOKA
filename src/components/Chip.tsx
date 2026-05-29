import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;
type ChipTone = 'accent' | 'muted' | 'neutral' | 'warning';

type ChipProps = {
  icon?: IconName;
  label: string;
  style?: ViewStyle | ViewStyle[];
  tone?: ChipTone;
};

export function Chip({ icon, label, style, tone = 'neutral' }: ChipProps) {
  const iconColor = tone === 'accent' ? colors.neon : tone === 'warning' ? colors.accent : colors.darkMuted;

  return (
    <View style={[styles.chip, toneStyles[tone], style]}>
      {icon ? <Ionicons color={iconColor} name={icon} size={13} /> : null}
      <AppText tone={tone === 'accent' ? 'accent' : 'muted'} variant="label" weight="800">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
});

const toneStyles = StyleSheet.create({
  accent: {
    backgroundColor: 'rgba(93, 240, 92, 0.08)',
    borderColor: colors.neonMuted,
  },
  muted: {
    backgroundColor: colors.darkSurfaceLow,
    borderColor: colors.darkBorder,
  },
  neutral: {
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
  },
  warning: {
    backgroundColor: 'rgba(242, 180, 65, 0.1)',
    borderColor: 'rgba(242, 180, 65, 0.28)',
  },
});
