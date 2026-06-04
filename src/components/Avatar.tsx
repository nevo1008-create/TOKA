import { LinearGradient } from 'expo-linear-gradient';
import { Image, Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '../theme';
import type { Player } from '../types';
import { AppText } from './AppText';

type AvatarProps = {
  player: Player;
  size: number;
};

export function Avatar({ player, size }: AvatarProps) {
  const focusX = player.avatarFocusX ?? 50;
  const focusY = player.avatarFocusY ?? 50;

  return (
    <View style={[styles.avatarRing, { borderRadius: size / 2 + 2, height: size + 4, width: size + 4 }]}>
      {player.avatarUrl && Platform.OS === 'web' ? (
        <View
          style={[
            styles.avatarImage,
            {
              backgroundImage: `url("${player.avatarUrl}")`,
              backgroundPosition: `${focusX}% ${focusY}%`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              borderRadius: size / 2,
              height: size,
              width: size,
            } as ViewStyle,
          ]}
        />
      ) : player.avatarUrl ? (
        <Image resizeMode="cover" source={{ uri: player.avatarUrl }} style={[styles.avatarImage, { borderRadius: size / 2, height: size, width: size }]} />
      ) : (
        <LinearGradient
          colors={[colors.surfaceYellow, colors.surfaceAqua]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.avatar, { borderRadius: size / 2, height: size, width: size }]}
        >
          <AppText align="center" style={{ fontSize: size * 0.34, lineHeight: size * 0.42 }} tone="primary" weight="900">
            {player.initials}
          </AppText>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    backgroundColor: colors.surfaceMuted,
    resizeMode: 'cover',
  },
  avatarRing: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
