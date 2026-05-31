import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { AppText } from '../AppText';

type StatusPillProps = {
  label: string;
  tone?: 'gold' | 'green' | 'muted';
};

export function StatusPill({ label, tone = 'green' }: StatusPillProps) {
  return (
    <View style={[styles.pill, toneStyles[tone]]}>
      <AppText tone={tone === 'gold' ? 'warning' : tone === 'green' ? 'accent' : 'muted'} variant="label" weight="700">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 26,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
});

const toneStyles = StyleSheet.create({
  gold: {
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(255, 200, 61, 0.34)',
  },
  green: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  muted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
});
