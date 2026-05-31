import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '../theme';
import { AppText } from './AppText';

type SectionHeaderProps = {
  action?: string;
  onPress?: () => void;
  subtitle?: string;
  title: string;
};

export function SectionHeader({ action, onPress, subtitle, title }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <AppText variant="heading" weight="900">
          {title}
        </AppText>
        {subtitle ? (
          <AppText tone="muted" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={onPress} style={styles.action}>
          <AppText tone="accent" variant="bodySmall" weight="800">
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flexShrink: 0,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  copy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
