import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';

type AuthScreenProps = {
  errorMessage?: string | null;
  isLoading?: boolean;
  onContinue: (credentials: { email: string; password: string }) => void;
};

type SocialProvider = 'Apple' | 'Facebook' | 'Google';

export function AuthScreen({ errorMessage, isLoading = false, onContinue }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const canContinue = email.trim().length > 0 && password.trim().length > 0;

  function continueWithEmail() {
    if (!canContinue) {
      return;
    }

    onContinue({
      email: email.trim(),
      password,
    });
  }

  function continueWithSocial(provider: SocialProvider) {
    Alert.alert(`${provider} sign in`, 'Social sign in will be connected later. Use email and password for now.');
  }

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

      <View style={styles.header}>
        <LinearGradient
          colors={[colors.surfaceYellow, colors.surfaceMuted]}
          start={{ x: 0.05, y: 0 }}
          end={{ x: 0.95, y: 1 }}
          style={styles.logoBall}
        >
          <Ionicons color={colors.primaryDark} name="football" size={32} />
        </LinearGradient>
        <View style={styles.brandCopy}>
          <AppText style={styles.logoText} variant="display" weight="800">
            TOCA
          </AppText>
          <AppText tone="accent" variant="label" weight="700">
            FOOTVOLLEY COMMUNITY
          </AppText>
        </View>
      </View>

      <View style={styles.heroCopy}>
        <AppText variant="displayGreeting" weight="800">
          Find your next beach game.
        </AppText>
        <AppText tone="muted" variant="uiBody" weight="500">
          Join local footvolley rooms, meet trusted players, and build your TOCA profile.
        </AppText>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldStack}>
          <AuthInput
            icon="mail-outline"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            value={email}
          />
          <AuthInput
            icon="lock-closed-outline"
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            value={password}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!canContinue || isLoading}
          onPress={continueWithEmail}
          style={[styles.primaryButton, (!canContinue || isLoading) && styles.primaryButtonDisabled]}
        >
          <AppText align="center" tone="inverse" variant="button" weight="700">
            {isLoading ? 'Connecting...' : 'Continue'}
          </AppText>
        </Pressable>

        {errorMessage ? (
          <AppText align="center" tone="danger" variant="metadata" weight="700">
            {errorMessage}
          </AppText>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <AppText tone="muted" variant="caption" weight="500">
            or
          </AppText>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialStack}>
          <SocialButton icon="logo-google" label="Continue with Google" onPress={() => continueWithSocial('Google')} />
          <SocialButton icon="logo-apple" label="Continue with Apple" onPress={() => continueWithSocial('Apple')} />
          <SocialButton icon="logo-facebook" label="Continue with Facebook" onPress={() => continueWithSocial('Facebook')} />
        </View>
      </View>

      <AppText align="center" style={styles.footerText} tone="muted" variant="metadata" weight="500">
        New players complete a quick setup after signing in.
      </AppText>
    </View>
  );
}

function AuthInput({
  icon,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputShell}>
      <Ionicons color={colors.accentSea} name={icon} size={18} />
      <TextInput
        {...props}
        autoCapitalize="none"
        placeholderTextColor={colors.subtle}
        style={styles.input}
      />
    </View>
  );
}

function SocialButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.socialButton}>
      <View style={styles.socialIcon}>
        <Ionicons color={colors.ink} name={icon} size={18} />
      </View>
      <AppText variant="button" weight="600">
        {label}
      </AppText>
      <Ionicons color={colors.subtle} name="chevron-forward" size={15} />
    </Pressable>
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
  brandCopy: {
    gap: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  divider: {
    backgroundColor: colors.borderSoft,
    flex: 1,
    height: 1,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldStack: {
    gap: spacing.sm,
  },
  footerText: {
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
    padding: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  logoBall: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
    ...shadows.soft,
  },
  logoText: {
    fontStyle: 'italic',
    transform: [{ skewX: '-10deg' }],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.soft,
  },
  primaryButtonDisabled: {
    opacity: 0.48,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    padding: spacing.xl2,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  socialIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  socialStack: {
    gap: spacing.sm,
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
