import type { Session } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

export type AuthResult = {
  needsEmailConfirmation: boolean;
  session: Session | null;
};

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signInOrSignUpWithEmail(email: string, password: string): Promise<AuthResult> {
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

  if (!isMissingAccountError(signInResult.error.message)) {
    throw signInResult.error;
  }

  const signUpResult = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (signUpResult.error) {
    throw signUpResult.error;
  }

  return {
    needsEmailConfirmation: !signUpResult.data.session,
    session: signUpResult.data.session,
  };
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
