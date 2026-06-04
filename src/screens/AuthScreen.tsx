import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';

type AuthScreenProps = {
  errorMessage?: string | null;
  isLoading?: boolean;
  onClearFeedback?: () => void;
  onContinue: (credentials: { email: string; mode: 'login' | 'signup'; password: string }) => void;
  onRequestPasswordReset: (email: string) => void;
  onResendVerification?: (email: string) => void;
  successMessage?: string | null;
};

type AuthMode = 'entry' | 'login' | 'reset' | 'signup';

export function AuthScreen({
  errorMessage,
  isLoading = false,
  onClearFeedback,
  onContinue,
  onRequestPasswordReset,
  onResendVerification,
  successMessage,
}: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('entry');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isEmailValid = isValidEmail(email);
  const isPasswordLongEnough = authMode !== 'signup' || password.length >= 8;
  const isConfirmPasswordLongEnough = authMode !== 'signup' || confirmPassword.length >= 8;
  const doPasswordsMatch = authMode !== 'signup' || password === confirmPassword;
  const isPasswordResetSent = authMode === 'reset' && Boolean(successMessage);
  const isSignupVerificationSent = authMode === 'signup' && Boolean(successMessage);
  const shouldShowDuplicateAccountLogin =
    authMode === 'signup' && errorMessage === 'This email already has an account. Please log in.';
  const shouldShowLoginSignupPrompt = authMode === 'login' && errorMessage === 'Email or password is incorrect.';
  const canContinue = authMode === 'reset'
    ? email.trim().length > 0
    : email.trim().length > 0 &&
      password.trim().length > 0 &&
      isPasswordLongEnough &&
      isConfirmPasswordLongEnough;

  function continueWithEmail() {
    if (!canContinue) {
      return;
    }

    if (!isEmailValid) {
      setValidationError('Email is not complete.');
      return;
    }

    if (authMode === 'reset') {
      setValidationError(null);
      onRequestPasswordReset(email.trim());
      return;
    }

    if (authMode === 'login' && password.length < 8) {
      setValidationError('Password must contain at least 8 letters or numbers.');
      return;
    }

    if (!isPasswordLongEnough) {
      setValidationError('Password must contain at least 8 letters or numbers.');
      return;
    }

    if (!doPasswordsMatch) {
      setValidationError('Passwords do not match.');
      return;
    }

    setValidationError(null);
    onContinue({
      email: email.trim(),
      mode: authMode === 'signup' ? 'signup' : 'login',
      password,
    });
  }

  function openLoginAfterVerification() {
    setValidationError(null);
    onClearFeedback?.();
    setAuthMode('login');
  }

  function openSignupFromLogin() {
    setValidationError(null);
    onClearFeedback?.();
    setPassword('');
    setConfirmPassword('');
    setAuthMode('signup');
  }

  function openPasswordReset() {
    setValidationError(null);
    onClearFeedback?.();
    setPassword('');
    setConfirmPassword('');
    setAuthMode('reset');
  }

  function openLoginFromReset() {
    setValidationError(null);
    onClearFeedback?.();
    setPassword('');
    setConfirmPassword('');
    setAuthMode('login');
  }

  function resendVerification() {
    if (!isEmailValid) {
      setValidationError('Email is not complete.');
      return;
    }

    setValidationError(null);
    onResendVerification?.(email.trim());
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
        {authMode === 'entry' ? (
          <View style={styles.choiceStack}>
            <AuthChoiceButton
              icon="log-in-outline"
              label="Login"
              onPress={() => {
                setValidationError(null);
                onClearFeedback?.();
                setAuthMode('login');
              }}
              variant="primary"
            />
            <AuthChoiceButton
              icon="person-add-outline"
              label="Sign up"
              onPress={() => {
                setValidationError(null);
                onClearFeedback?.();
                setAuthMode('signup');
              }}
              variant="secondary"
            />
          </View>
        ) : (
          <>
            <View style={styles.formHeader}>
              <Pressable
                accessibilityLabel="Back to auth options"
                accessibilityRole="button"
                onPress={() => {
                  setValidationError(null);
                  onClearFeedback?.();
                  setAuthMode('entry');
                }}
                style={styles.backButton}
              >
                <Ionicons color={colors.ink} name="chevron-back" size={18} />
              </Pressable>
              <View style={styles.formTitleCopy}>
                <AppText variant="cardTitle" weight="800">
                  {authMode === 'login' ? 'Login' : authMode === 'reset' ? 'Reset password' : 'Sign up'}
                </AppText>
                <AppText tone="muted" variant="metadata" weight="600">
                  {authMode === 'reset' ? 'We will email you a secure reset link.' : 'Use email and password for now.'}
                </AppText>
              </View>
            </View>

            <View style={styles.fieldStack}>
              <AuthInput
                icon="mail-outline"
                keyboardType="email-address"
                onChangeText={(nextEmail) => {
                  setEmail(nextEmail);
                  setValidationError(null);
                  onClearFeedback?.();
                }}
                placeholder="Email"
                value={email}
              />
              {authMode === 'signup' ? (
                <View style={styles.passwordHelpRow}>
                  <Ionicons color={colors.accentSea} name="information-circle-outline" size={15} />
                  <AppText tone="muted" variant="caption" weight="600">
                    Use at least 8 letters or numbers.
                  </AppText>
                </View>
              ) : null}
              {authMode !== 'reset' ? (
                <AuthInput
                  icon="lock-closed-outline"
                  onChangeText={(nextPassword) => {
                    setPassword(nextPassword);
                    setValidationError(null);
                    onClearFeedback?.();
                  }}
                  placeholder="Password"
                  rightAccessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                  rightIcon={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setIsPasswordVisible((current) => !current)}
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                />
              ) : null}
              {authMode === 'login' ? (
                <Pressable accessibilityRole="button" onPress={openPasswordReset} style={styles.forgotPasswordButton}>
                  <AppText align="right" tone="accent" variant="metadata" weight="800">
                    Forgot password?
                  </AppText>
                </Pressable>
              ) : null}
              {authMode === 'signup' ? (
                <AuthInput
                  icon="checkmark-circle-outline"
                  onChangeText={(nextConfirmPassword) => {
                    setConfirmPassword(nextConfirmPassword);
                    setValidationError(null);
                    onClearFeedback?.();
                  }}
                  placeholder="Confirm password"
                  rightAccessibilityLabel={isConfirmPasswordVisible ? 'Hide confirm password' : 'Show confirm password'}
                  rightIcon={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setIsConfirmPasswordVisible((current) => !current)}
                  secureTextEntry={!isConfirmPasswordVisible}
                  value={confirmPassword}
                />
              ) : null}
            </View>

            {validationError ? (
              <AppText align="center" tone="danger" variant="metadata" weight="700">
                {validationError}
              </AppText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={!canContinue || isLoading || isSignupVerificationSent || isPasswordResetSent}
              onPress={continueWithEmail}
              style={[
                styles.primaryButton,
                (!canContinue || isLoading || isSignupVerificationSent || isPasswordResetSent) && styles.primaryButtonDisabled,
              ]}
            >
              <AppText align="center" tone="inverse" variant="button" weight="700">
                {isLoading
                  ? 'Connecting...'
                  : authMode === 'login'
                    ? 'Login'
                    : authMode === 'reset'
                      ? 'Send reset link'
                      : 'Send verification to email'}
              </AppText>
            </Pressable>

            {successMessage && authMode === 'signup' ? (
              <AppText align="center" tone="accent" variant="metadata" weight="800">
                {successMessage}
              </AppText>
            ) : null}

            {successMessage && authMode === 'reset' ? (
              <View style={styles.resetNotice}>
                <Ionicons color={colors.primaryDark} name="mail-open-outline" size={18} />
                <AppText align="center" tone="accent" variant="metadata" weight="800">
                  {successMessage}
                </AppText>
              </View>
            ) : null}

            {isSignupVerificationSent ? (
              <View style={styles.verificationActionStack}>
                <Pressable
                  accessibilityRole="button"
                  onPress={openLoginAfterVerification}
                  style={styles.loginAfterVerificationButton}
                >
                  <AppText align="center" tone="accent" variant="button" weight="800">
                    Press to log in
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={isLoading || !onResendVerification}
                  onPress={resendVerification}
                  style={[styles.resendButton, (isLoading || !onResendVerification) && styles.resendButtonDisabled]}
                >
                  <AppText align="center" tone="primary" variant="metadata" weight="800">
                    Resend verification email
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {isPasswordResetSent ? (
              <Pressable
                accessibilityRole="button"
                onPress={openLoginFromReset}
                style={styles.loginAfterVerificationButton}
              >
                <AppText align="center" tone="accent" variant="button" weight="800">
                  Back to log in
                </AppText>
              </Pressable>
            ) : null}

            {errorMessage ? (
              <AppText align="center" tone="danger" variant="metadata" weight="700">
                {errorMessage}
              </AppText>
            ) : null}

            {shouldShowLoginSignupPrompt ? (
              <View style={styles.inlineActionStack}>
                <AppText align="center" tone="muted" variant="metadata" weight="700">
                  Please sign up if you do not have an account.
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={openSignupFromLogin}
                  style={styles.inlineTextButton}
                >
                  <AppText align="center" tone="accent" variant="metadata" weight="800">
                    Press to sign up
                  </AppText>
                </Pressable>
              </View>
            ) : null}

            {shouldShowDuplicateAccountLogin ? (
              <Pressable
                accessibilityRole="button"
                onPress={openLoginAfterVerification}
                style={styles.loginAfterVerificationButton}
              >
                <AppText align="center" tone="accent" variant="button" weight="800">
                  Press to log in
                </AppText>
              </Pressable>
            ) : null}
          </>
        )}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <AppText tone="muted" variant="caption" weight="500">
            or
          </AppText>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialStack}>
          <SocialButton icon="logo-google" label="Continue with Google" />
          <SocialButton icon="logo-apple" label="Continue with Apple" />
          <SocialButton icon="logo-facebook" label="Continue with Facebook" />
        </View>
      </View>

      <AppText align="center" style={styles.footerText} tone="muted" variant="metadata" weight="500">
        New players complete a quick setup after signing in.
      </AppText>
    </View>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function AuthChoiceButton({
  icon,
  label,
  onPress,
  variant,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.choiceButton, isPrimary ? styles.choiceButtonPrimary : styles.choiceButtonSecondary]}
    >
      <View style={[styles.choiceIcon, isPrimary ? styles.choiceIconPrimary : styles.choiceIconSecondary]}>
        <Ionicons color={isPrimary ? colors.primaryDark : colors.accentSea} name={icon} size={18} />
      </View>
      <AppText tone={isPrimary ? 'inverse' : 'primary'} variant="button" weight="800">
        {label}
      </AppText>
      <Ionicons color={isPrimary ? colors.surface : colors.subtle} name="chevron-forward" size={15} />
    </Pressable>
  );
}

function AuthInput({
  icon,
  onRightIconPress,
  rightAccessibilityLabel,
  rightIcon,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  rightAccessibilityLabel?: string;
  rightIcon?: keyof typeof Ionicons.glyphMap;
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
      {rightIcon ? (
        <Pressable
          accessibilityLabel={rightAccessibilityLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRightIconPress}
          style={styles.inputIconButton}
        >
          <Ionicons color={colors.subtle} name={rightIcon} size={19} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SocialButton({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={[styles.socialButton, styles.socialButtonDisabled]}
    >
      <View style={styles.socialIcon}>
        <Ionicons color={colors.ink} name={icon} size={18} />
      </View>
      <AppText variant="button" weight="600">
        {label}
      </AppText>
      <View style={styles.socialBadge}>
        <AppText tone="muted" variant="caption" weight="800">
          Coming soon
        </AppText>
      </View>
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
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  choiceButton: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  choiceButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.soft,
  },
  choiceButtonSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
  },
  choiceIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  choiceIconPrimary: {
    backgroundColor: colors.surfaceYellow,
  },
  choiceIconSecondary: {
    backgroundColor: colors.surfaceAqua,
  },
  choiceStack: {
    gap: spacing.sm,
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
  formHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formTitleCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    minHeight: 30,
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
  inputIconButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  inlineActionStack: {
    gap: spacing.xxs,
  },
  inlineTextButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  loginAfterVerificationButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
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
  passwordHelpRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 24,
    paddingHorizontal: spacing.xs,
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
  socialBadge: {
    marginLeft: 'auto',
  },
  socialButtonDisabled: {
    opacity: 0.72,
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
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
  },
  resendButtonDisabled: {
    opacity: 0.48,
  },
  resetNotice: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  verificationActionStack: {
    gap: spacing.xs,
  },
});
