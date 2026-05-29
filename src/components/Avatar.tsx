import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';
import type { Player } from '../types';
import { AppText } from './AppText';

type AvatarProps = {
  player: Player;
  size: number;
};

export function Avatar({ player, size }: AvatarProps) {
  return (
    <View style={[styles.avatarRing, { borderRadius: size / 2 + 2, height: size + 4, width: size + 4 }]}>
      <LinearGradient
        colors={[colors.sand, '#B9D6A8']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}
      >
        <AppText align="center" style={{ fontSize: size * 0.34, lineHeight: size * 0.42 }} tone="inverse" weight="900">
          {player.initials}
        </AppText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    alignItems: 'center',
    backgroundColor: colors.darkBorderStrong,
    justifyContent: 'center',
  },
});
