import type { Session } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

export type AuthResult = {
  needsEmailConfirmation: boolean;
  session: Session | null;
};

const sessionRestoreTimeoutMs = 8000;

export async function getCurrentSession() {
  const { data, error } = await withTimeout(
    supabase.auth.getSession(),
    sessionRestoreTimeoutMs,
    'Session restore timed out. Please log in again.',
  );

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInOrSignUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  return signInWithEmail(normalizedEmail, password).catch(async (error) => {
    if (!isMissingAccountError(error.message)) {
      throw error;
    }

    return signUpWithEmail(normalizedEmail, password);
  });
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const signInResult = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (!signInResult.error) {
    return {
      needsEmailConfirmation: false,
      session: signInResult.data.session,
    };
  }

  throw signInResult.error;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const emailRedirectTo = getEmailVerifiedRedirectUrl();
  const signUpResult = await supabase.auth.signUp({
    email: normalizedEmail,
    options: emailRedirectTo
      ? {
          emailRedirectTo,
        }
      : undefined,
    password,
  });

  if (signUpResult.error) {
    throw signUpResult.error;
  }

  if (Array.isArray(signUpResult.data.user?.identities) && signUpResult.data.user.identities.length === 0) {
    throw new Error('This email already has an account. Please log in.');
  }

  return {
    needsEmailConfirmation: !signUpResult.data.session,
    session: signUpResult.data.session,
  };
}

export async function resendSignupVerificationEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const emailRedirectTo = getEmailVerifiedRedirectUrl();
  const resendResult = await supabase.auth.resend({
    email: normalizedEmail,
    options: emailRedirectTo
      ? {
          emailRedirectTo,
        }
      : undefined,
    type: 'signup',
  });

  if (resendResult.error) {
    throw resendResult.error;
  }
}

export async function requestPasswordResetEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const passwordResetRedirectTo = getPasswordResetRedirectUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(
    normalizedEmail,
    passwordResetRedirectTo
      ? {
          redirectTo: passwordResetRedirectTo,
        }
      : undefined,
  );

  if (error) {
    throw error;
  }
}

export async function preparePasswordResetSession() {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    clearPasswordResetUrl();
    return;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const errorDescription = hashParams.get('error_description');

  if (errorDescription) {
    throw new Error(errorDescription);
  }

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    clearPasswordResetUrl();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('This reset link is missing or expired. Please request a new one.');
  }
}

export async function updateCurrentUserPassword(password: string) {
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCurrentUserAccount(feedback: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('Missing authenticated user.');
  }

  await deleteProfilePhotosForUser(user.id);

  const normalizedFeedback = feedback.trim();
  const { error } = await supabase.rpc('delete_current_user_account', {
    feedback_text: normalizedFeedback.length > 0 ? normalizedFeedback : null,
  });

  if (error) {
    throw error;
  }

  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}

async function deleteProfilePhotosForUser(authUserId: string) {
  const { data, error } = await supabase.storage.from('profile-photos').list(authUserId);

  if (error) {
    throw error;
  }

  const filePaths = (data ?? [])
    .filter((item) => item.name && !item.name.endsWith('/'))
    .map((item) => `${authUserId}/${item.name}`);

  if (filePaths.length === 0) {
    return;
  }

  const { error: removeError } = await supabase.storage.from('profile-photos').remove(filePaths);

  if (removeError) {
    throw removeError;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

function isMissingAccountError(message: string) {
  return message.toLowerCase().includes('invalid login credentials');
}

function getEmailVerifiedRedirectUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_EMAIL_VERIFIED_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}/email-verified`;
}

function getPasswordResetRedirectUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_PASSWORD_RESET_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  return `${window.location.origin}/reset-password`;
}

function clearPasswordResetUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState({}, document.title, `${window.location.origin}/reset-password`);
}

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_resolve, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}
