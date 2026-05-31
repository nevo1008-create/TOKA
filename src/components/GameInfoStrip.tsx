import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import { AppText } from './AppText';

type GameInfoStripItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
  wide?: boolean;
};

type GameInfoStripProps = {
  items: GameInfoStripItem[];
};

export function GameInfoStrip({ items }: GameInfoStripProps) {
  return (
    <View style={styles.strip}>
      {items.map((item) => (
        <View key={`${item.label}-${item.value}`} style={styles.cell}>
          <View style={styles.valueRow}>
            <Ionicons color={item.iconColor ?? colors.muted} name={item.icon} size={16} />
            <AppText
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              numberOfLines={1}
              style={styles.value}
              variant="bodySmall"
              weight="800"
            >
              {item.value}
            </AppText>
          </View>
          <AppText numberOfLines={1} style={styles.label} tone="muted" variant="caption" weight="600">
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    flexBasis: 0,
    gap: 3,
    minWidth: 0,
  },
  label: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 12,
  },
  strip: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  value: {
    color: colors.ink,
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    minWidth: 0,
  },
});
