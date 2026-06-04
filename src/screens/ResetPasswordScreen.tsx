import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';

type ResetPasswordScreenProps = {
  errorMessage?: string | null;
  isLoading: boolean;
  isReady: boolean;
  onBackToLogin: () => void;
  onPrepareReset: () => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  successMessage?: string | null;
};

export function ResetPasswordScreen({
  errorMessage,
  isLoading,
  isReady,
  onBackToLogin,
  onPrepareReset,
  onUpdatePassword,
  successMessage,
}: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const canSubmit = password.length >= 8 && confirmPassword.length >= 8 && !isLoading && isReady && !successMessage;

  useEffect(() => {
    void onPrepareReset();
  }, [onPrepareReset]);

  async function submitNewPassword() {
    if (!canSubmit) {
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setValidationError(null);
    await onUpdatePassword(password);
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
          <Ionicons color={colors.primaryDark} name="key-outline" size={30} />
        </LinearGradient>
        <View style={styles.headerCopy}>
          <AppText style={styles.logoText} variant="display" weight="800">
            Reset password
          </AppText>
          <AppText tone="muted" variant="uiBody" weight="600">
            Choose a new password for your TOCA account.
          </AppText>
        </View>
      </View>

      <View style={styles.card}>
        {!isReady && !errorMessage ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={colors.primaryDark} />
            <AppText align="center" tone="muted" variant="metadata" weight="700">
              Preparing secure reset link...
            </AppText>
          </View>
        ) : null}

        {isReady && !successMessage ? (
          <>
            <View style={styles.helpRow}>
              <Ionicons color={colors.accentSea} name="information-circle-outline" size={15} />
              <AppText tone="muted" variant="caption" weight="700">
                Use at least 8 letters or numbers.
              </AppText>
            </View>

            <PasswordInput
              onChangeText={(nextPassword) => {
                setPassword(nextPassword);
                setValidationError(null);
              }}
              onToggleVisibility={() => setIsPasswordVisible((current) => !current)}
              placeholder="New password"
              secureTextEntry={!isPasswordVisible}
              value={password}
              visible={isPasswordVisible}
            />
            <PasswordInput
              onChangeText={(nextConfirmPassword) => {
                setConfirmPassword(nextConfirmPassword);
                setValidationError(null);
              }}
              onToggleVisibility={() => setIsConfirmPasswordVisible((current) => !current)}
              placeholder="Confirm new password"
              secureTextEntry={!isConfirmPasswordVisible}
              value={confirmPassword}
              visible={isConfirmPasswordVisible}
            />

            {validationError ? (
              <AppText align="center" tone="danger" variant="metadata" weight="800">
                {validationError}
              </AppText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={submitNewPassword}
              style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
            >
              <AppText align="center" tone="inverse" variant="button" weight="800">
                {isLoading ? 'Saving...' : 'Save new password'}
              </AppText>
            </Pressable>
          </>
        ) : null}

        {successMessage ? (
          <View style={styles.resultBlock}>
            <View style={styles.resultIcon}>
              <Ionicons color={colors.primaryDark} name="checkmark-circle-outline" size={26} />
            </View>
            <AppText align="center" variant="cardTitle" weight="900">
              Password updated
            </AppText>
            <AppText align="center" tone="muted" variant="metadata" weight="700">
              {successMessage}
            </AppText>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBlock}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={18} />
            <AppText style={styles.errorText} tone="danger" variant="metadata" weight="800">
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={onBackToLogin} style={styles.secondaryButton}>
          <AppText align="center" tone="accent" variant="button" weight="800">
            Back to log in
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function PasswordInput({
  onChangeText,
  onToggleVisibility,
  placeholder,
  secureTextEntry,
  value,
  visible,
}: {
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
  placeholder: string;
  secureTextEntry: boolean;
  value: string;
  visible: boolean;
}) {
  return (
    <View style={styles.inputShell}>
      <Ionicons color={colors.accentSea} name="lock-closed-outline" size={18} />
      <TextInput
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
      />
      <Pressable accessibilityRole="button" hitSlop={8} onPress={onToggleVisibility} style={styles.inputIconButton}>
        <Ionicons color={colors.subtle} name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} />
      </Pressable>
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
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  errorBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.24)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  helpRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 24,
    paddingHorizontal: spacing.xs,
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
  inputIconButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
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
  loadingBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
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
  resultBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  resultIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    padding: spacing.xl2,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.md,
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
