import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import type { Player } from '../types';

type AvatarProps = {
  player: Player;
  size: number;
};

export function Avatar({ player, size }: AvatarProps) {
  return (
    <View style={[styles.avatar, { height: size, width: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{player.initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderColor: colors.surface,
    borderWidth: 2,
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.ink,
    fontWeight: '900',
  },
});
