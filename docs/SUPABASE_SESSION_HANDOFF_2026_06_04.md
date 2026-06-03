# Supabase Foundation Session Handoff

Date: 2026-06-04
Branch: `feature/supabase-foundation`

## Summary

This session introduced the first real Supabase foundation for TOCA.

The app moved from mock-only auth and lobby state toward:

- Supabase email/password authentication.
- Auth-linked player profiles.
- Supabase-backed lobby, membership, chat, and notification repositories.
- Real database schema for players, locations, lobbies, memberships, messages, and notifications.
- Seed data that mirrors the current mock MVP state.

The frontend remains mobile-first Expo/React Native. Existing screens were preserved as much as possible, with the new Supabase layer placed behind feature repositories and `useLobbyStore`.

## Supabase Project

Active project URL:

```text
https://czvcbfnkbmxzmdnvgqfn.supabase.co
```

Local Expo env values belong in ignored `.env.local`:

```text
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

Do not commit personal access tokens, database passwords, service role keys, or local env files.

## Dependencies Added

Added runtime dependencies:

- `@supabase/supabase-js`
- `@react-native-async-storage/async-storage`
- `react-native-url-polyfill`

Why:

- Supabase JS client handles auth and database calls.
- AsyncStorage persists Supabase auth sessions in React Native.
- URL polyfill is required by Supabase in React Native/Expo environments.

## App Auth Changes

Files:

- `App.tsx`
- `src/screens/AuthScreen.tsx`
- `src/features/auth/authRepository.ts`
- `src/features/auth/playerRepository.ts`
- `src/features/auth/playerMappers.ts`

What changed:

- `AuthScreen` now submits email/password credentials instead of immediately entering onboarding.
- `App.tsx` restores an existing Supabase session on boot.
- Existing auth users are mapped to `players.auth_user_id`.
- New auth users go through onboarding, then a `players` row is created/updated.
- Profile edits now persist through Supabase when an authenticated user exists.
- Social auth buttons remain placeholders.

Important behavior:

- If Supabase requires email confirmation, the app shows a check-email alert.
- The app still uses the existing onboarding UI, but the result is now saved to Supabase.

## Supabase Client

Files:

- `src/lib/supabase.ts`
- `src/lib/database.types.ts`
- `.env.example`

`src/lib/supabase.ts` creates the Supabase client using:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The app throws a clear error if either value is missing.

`database.types.ts` is a hand-written temporary database type file. It is good enough for current repository/mapping boundaries. Later, replace it with generated Supabase types once a type-generation workflow is added.

## Database Schema

Local migration file:

- `supabase/migrations/20260603120000_supabase_foundation.sql`

Remote project migrations applied through the Supabase connector:

- `foundation_tables`
- `foundation_indexes_triggers`
- `foundation_rls_policies`

Remote schema includes:

- `players`
- `locations`
- `lobbies`
- `lobby_memberships`
- `lobby_messages`
- `notifications`

Important modeling decision:

`lobby_memberships` separates:

- membership state: `joined`, `waitlisted`, `pending_approval`, `declined`, `left`, `removed`, `cancelled_on_time`, `cancelled_late`, `no_show`, `attended`
- permission role: `host`, `member`

This intentionally avoids copying the current app limitation where `LobbyParticipant.role` mixes list position and host permission.

## Seed Data

Seed file:

- `supabase/seed.sql`

Remote seed verification after applying:

```text
players: 5
locations: 5
lobbies: 5
memberships: 18
messages: 9
notifications: 0
```

The seed data mirrors the existing MVP mock state:

- Nevo, Omer, Daniel, Maya, Roy
- Five beach locations
- Five lobbies
- Joined, waitlisted, pending approval, rating-open, and completed states
- Initial lobby chat messages

## Lobby Store And Repositories

Files:

- `src/features/lobbies/useLobbyStore.ts`
- `src/features/lobbies/lobbyRepository.ts`
- `src/features/lobbies/lobbyMappers.ts`
- `src/features/chat/chatRepository.ts`
- `src/features/notifications/notificationRepository.ts`

What changed:

- `useLobbyStore` still exposes the same high-level screen API.
- Under the hood, it now loads lobbies, chat messages, and notifications from Supabase.
- Join, waitlist, request approval, approve/reject, leave, create lobby, and send chat message now persist through repositories.
- If Supabase load fails, the store logs the error and falls back to mock data so the UI remains reviewable.

Actions currently connected to Supabase:

- create lobby
- join game
- join waitlist
- request waitlist approval
- approve waitlist request
- reject join request
- leave lobby
- list/send lobby chat messages
- list/mark notifications read

## PIN Safety

File:

- `docs/SUPABASE_FOUNDATION.md`

The schema includes `lobbies.pin_code_hash`, but production-safe private PIN verification is not finished.

Before production private lobbies:

- Add a server-side RPC or Edge Function for PIN verification.
- Store hashed PINs only.
- Never expose stored PINs to the client.

Current private PIN behavior should be treated as MVP/dev scaffolding.

## What Was Not Finished

Still future work:

- Realtime lobby updates.
- Realtime chat.
- Push notifications.
- Rating persistence.
- TOCA points event persistence.
- Generated Supabase TypeScript types.
- Production-safe PIN verification.
- Stronger RLS for protected lobby visibility and protected chat visibility.
- Social auth providers.
- Automated tests for backend-backed lobby actions.

## Running Locally

Port `8080` was unavailable on the machine because it was owned by Windows `System`.

Use:

```powershell
npm run web -- --port 8081
```

Then open:

```text
http://localhost:8081
```

Be careful to run the command once. A previous failed command had the text pasted twice, which caused Expo to interpret `run` as a project root.

## Verification

Final local verification:

```powershell
npm run typecheck
```

Result:

```text
tsc --noEmit passed
```

Remote database verification:

- migrations listed successfully
- seeded row counts matched expected values

## Security Notes

Sensitive values were discussed during the session. They should not be committed.

Recommended cleanup:

- Rotate any database password or personal access token that was pasted into chat.
- Keep only publishable/anon client keys in `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Never put `service_role`, database connection strings, or personal access tokens in Expo public env variables.
