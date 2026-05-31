import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
import { AppText } from '../AppText';

type AvatarStackProps = {
  initials: string[];
  size?: number;
};

export function AvatarStack({ initials, size = 44 }: AvatarStackProps) {
  return (
    <View style={styles.row}>
      {initials.map((initial, index) => {
        const isExtra = initial.startsWith('+');

        return (
          <View
            key={`${initial}-${index}`}
            style={[
              styles.avatar,
              isExtra && styles.extraAvatar,
              {
                borderRadius: size / 2,
                height: size,
                marginLeft: index === 0 ? 0 : -spacing.xs,
                width: size,
              },
            ]}
          >
            <AppText align="center" tone="primary" variant="body" weight="800">
              {initial}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: colors.surface,
    borderWidth: 2,
    justifyContent: 'center',
  },
  extraAvatar: {
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
