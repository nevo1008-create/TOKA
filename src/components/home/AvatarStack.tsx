import { StyleSheet, View } from 'react-native';

import { colors, homeTypography, radius, spacing } from '../../theme';
import type { Player } from '../../types';
import { AppText } from '../AppText';
import { Avatar } from '../Avatar';

type AvatarStackProps = {
  initials: string[];
  players?: Player[];
  size?: number;
};

export function AvatarStack({ initials, players, size = 44 }: AvatarStackProps) {
  const entries = players?.length ? players : initials;

  return (
    <View style={styles.row}>
      {entries.map((entry, index) => {
        const initial = typeof entry === 'string' ? entry : entry.initials;
        const isExtra = typeof entry === 'string' && initial.startsWith('+');

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
            {typeof entry === 'string' ? (
              <AppText align="center" style={styles.avatarText} tone="primary" variant="body" weight="800">
                {initial}
              </AppText>
            ) : (
              <Avatar player={entry} size={size - 4} />
            )}
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
  avatarText: {
    ...homeTypography.chip,
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
