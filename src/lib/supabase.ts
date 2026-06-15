import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const shouldLogSupabaseTiming = process.env.EXPO_PUBLIC_SUPABASE_DEBUG_TIMING === 'true';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
  global: shouldLogSupabaseTiming
    ? {
        fetch: logSupabaseTiming,
      }
    : undefined,
});

async function logSupabaseTiming(input: RequestInfo | URL, init?: RequestInit) {
  const startedAt = Date.now();
  const method = getRequestMethod(input, init);
  const requestLabel = getRequestLabel(input);

  try {
    const response = await fetch(input, init);
    const elapsedMs = Date.now() - startedAt;

    console.info(`[supabase] ${method} ${requestLabel} -> ${response.status} in ${elapsedMs}ms`);
    return response;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;

    console.info(`[supabase] ${method} ${requestLabel} failed in ${elapsedMs}ms`);
    throw error;
  }
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method.toUpperCase();
  }

  return 'GET';
}

function getRequestLabel(input: RequestInfo | URL) {
  const url = getRequestUrl(input);

  if (!url) {
    return 'unknown-url';
  }

  try {
    const parsedUrl = new URL(url);

    return `${parsedUrl.pathname}${parsedUrl.search ? '?...' : ''}`;
  } catch {
    return 'unknown-url';
  }
}

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.url;
  }

  return null;
}
