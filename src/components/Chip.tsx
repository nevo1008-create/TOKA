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
  const iconColor = tone === 'accent' ? colors.primaryDark : tone === 'warning' ? colors.accent : colors.muted;

  return (
    <View style={[styles.chip, toneStyles[tone], style]}>
      {icon ? <Ionicons color={iconColor} name={icon} size={13} /> : null}
      <AppText tone={tone === 'accent' ? 'accent' : tone === 'warning' ? 'warning' : 'muted'} variant="chip" weight="700">
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  muted: {
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
  },
  neutral: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  warning: {
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.46)',
  },
});
