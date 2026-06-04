import { mkdir, writeFile } from 'node:fs/promises';

const requiredEnv = ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]?.trim());

if (missingEnv.length > 0) {
  throw new Error(`Missing required Vercel auth page env: ${missingEnv.join(', ')}`);
}

const config = {
  appLoginUrl: process.env.TOCA_APP_LOGIN_URL?.trim() || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.trim(),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL.trim(),
};

await mkdir('public', { recursive: true });
await writeFile(
  'public/auth-config.js',
  `window.TOCA_AUTH_CONFIG = ${JSON.stringify(config)};\n`,
);

