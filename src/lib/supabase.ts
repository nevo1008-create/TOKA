import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { setupURLPolyfill } from 'react-native-url-polyfill';

import { snackConfig } from './snackConfig';

if (Platform.OS !== 'web') {
  setupURLPolyfill();
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || snackConfig.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || snackConfig.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env.local or src/lib/snackConfig.ts.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
});
