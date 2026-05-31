import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;
type StatTone = 'accent' | 'muted' | 'warning';

type StatCardProps = {
  children?: ReactNode;
  icon: IconName;
  label: string;
  style?: ViewStyle | ViewStyle[];
  tone?: StatTone;
  value: string;
};

export function StatCard({ children, icon, label, style, tone = 'accent', value }: StatCardProps) {
  const iconColor = tone === 'accent' ? colors.primaryDark : tone === 'warning' ? colors.accent : colors.muted;

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrap, tone === 'accent' && styles.accentBorder, tone === 'warning' && styles.warningBorder]}>
        <Ionicons color={iconColor} name={icon} size={19} />
      </View>
      <AppText align="center" variant="title" weight="900">
        {value}
      </AppText>
      <AppText align="center" tone="muted" variant="caption" weight="700">
        {label}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  accentBorder: {
    borderColor: colors.border,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 118,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 42,
  },
  warningBorder: {
    borderColor: 'rgba(242, 180, 65, 0.34)',
  },
});
