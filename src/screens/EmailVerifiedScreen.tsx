import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';

export function EmailVerifiedScreen() {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.48, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.78 }}
        style={styles.backgroundGlow}
      />
      <View pointerEvents="none" style={styles.sunOrb} />

      <View style={styles.card}>
        <LinearGradient
          colors={[colors.surfaceMuted, colors.surfaceAqua]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.iconBadge}
        >
          <Ionicons color={colors.primaryDark} name="checkmark-circle" size={42} />
        </LinearGradient>

        <View style={styles.copy}>
          <AppText align="center" variant="heading" weight="800">
            Your email is verified.
          </AppText>
          <AppText align="center" tone="muted" variant="uiBody" weight="500">
            You can return to the TOCA app.
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGlow: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  copy: {
    gap: spacing.sm,
  },
  iconBadge: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 84,
    justifyContent: 'center',
    width: 84,
    ...shadows.soft,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl2,
  },
  sunOrb: {
    backgroundColor: 'rgba(246, 201, 69, 0.16)',
    borderRadius: 999,
    height: 210,
    position: 'absolute',
    right: -92,
    top: 70,
    width: 210,
  },
});
