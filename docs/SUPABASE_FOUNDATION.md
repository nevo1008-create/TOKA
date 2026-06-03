# Supabase Foundation

TOCA uses Supabase for authentication and persistence.

## Environment

Create a local `.env.local` file:

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Do not commit real keys. `.env`, `.env*.local`, and personal access tokens must stay out of Git.

## Current Scope

This foundation covers:

- Supabase client setup.
- Email/password auth.
- Player profile rows linked to `auth.users`.
- Lobbies, locations, memberships, lobby messages, and notifications.
- Seed data matching the mock MVP data.

Realtime, production push notifications, rating persistence, and TOCA points events are intentionally later steps.

## PIN Safety

The `lobbies.pin_code_hash` column exists so production PINs can be stored safely. The first app pass must not rely on plain-text PINs for production games.

Before production private games:

- Add a server-side RPC or Edge Function to verify PINs.
- Hash PINs with a suitable slow hash or a server-side secret strategy.
- Never expose stored PIN values to the client.

Until that work is done, private PIN behavior should be treated as dev/MVP scaffolding only.
