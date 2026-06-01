# TOCA Codex Backend Handoff

This file is written for another Codex session or developer joining the project after `feature/backend-ready-data-layer`.

## Current Project State

TOCA is an English-first Expo React Native MVP for footvolley players in Israel. The app is still mock-backed, but the main lobby product flow and screen foundation are now in place.

Current branch:

`feature/backend-ready-data-layer`

Base:

Latest `main`, including `feature/lobby-flow-logic`.

## What Already Exists In Main

The branch `feature/lobby-flow-logic` was already merged into `main`.

That branch added the mock lobby product flow:

- Waitlist-first joining.
- Move between waitlist and players.
- Leave room.
- Host leave behavior.
- Host approvals and rejection.
- Private/PIN lobby behavior.
- Lobby chat with two channels.
- Created games appearing in `Games / My Games`.
- Create lobby wizard polish.
- UI cleanup around lobby details, games, host panel, notifications, and chat.

In short: the core lobby experience works with mock/local data.

## What This Branch Adds

The branch `feature/backend-ready-data-layer` prepares the app for a real backend without connecting Supabase yet.

Main changes:

- Added `docs/backend-data-plan.md`.
- Added `docs/CODEX_BACKEND_HANDOFF.md`.
- Added `src/features/lobbies/useLobbyStore.ts`.
- Added `src/features/lobbies/lobbyCreateTypes.ts`.
- Moved lobby state and actions out of `App.tsx` into the lobby feature store.
- Reduced direct mock-data imports from lobby-related screens.
- Kept mock data as the backing source for now.
- Kept `App.tsx` as the temporary boundary for current player and player directory.

The new lobby store owns:

- lobbies
- private PIN access
- chat messages
- notifications
- create lobby
- join players
- join waitlist
- request approval
- approve/reject request
- leave lobby
- mark chat read
- mark notifications read

## Important Product Decisions

Use these decisions when continuing backend work:

- Supabase is the planned backend.
- Auth is not part of this branch. Use a dev/current-player concept until the auth branch.
- PIN lobby access does not require host approval.
- If the host leaves and nobody remains, the lobby closes.
- If the only host leaves and players remain, host transfers first to the next joined player.
- If there are no joined players, host transfers to the next waitlisted player.
- Multiple co-hosts must be supported later.
- Hosts can see host/player tools even if future membership state is waitlisted.
- Lobby chat has two channels:
  - `all`: visible to everyone connected to the lobby.
  - `players only`: visible to joined players and hosts.
- Declined join requests should create a notification, disappear from normal lobby state, and allow the player to apply again.
- Substitutes are not part of the current product plan.

## Important Data Modeling Warning

The current app type `LobbyParticipant.role` combines two different concepts:

- player list position: `joined` or `waitlist`
- permission role: `admin`

The backend should not copy this limitation.

The real backend should separate:

- membership status: joined, waitlisted, pending approval, declined, left, removed
- permission role: member, host

This is required for co-host support, especially if a waitlisted player can still be a host.

## Files To Review First

Start here:

- `docs/backend-data-plan.md`
- `src/features/lobbies/useLobbyStore.ts`
- `src/features/lobbies/lobbyActions.ts`
- `src/features/lobbies/lobbyRules.ts`
- `src/types.ts`
- `src/data/mock.ts`
- `App.tsx`

## Branch Roadmap

### 1. `feature/backend-ready-data-layer`

Status: current branch.

Purpose:

- Prepare the mock lobby flow for real backend integration.
- Move lobby state/actions behind a feature-level store.
- Document backend data plan and next branch order.

Definition of done:

- TypeScript passes.
- App still works with mock data.
- Mock lobby behavior is less coupled to screens.
- Backend roadmap is documented.

### 2. `feature/supabase-foundation`

Recommended next branch.

Goal:

Create the Supabase foundation without wiring every UI flow yet.

Missions:

- Add Supabase client setup.
- Add environment variable structure.
- Decide local/dev Supabase workflow.
- Draft or add initial schema/migrations.
- Add seed/dev data strategy based on `src/data/mock.ts`.
- Decide generated database type workflow.
- Keep auth dev-only for now unless product direction changes.

Suggested tables to start with:

- `players`
- `lobbies`
- `lobby_memberships`
- `lobby_messages`
- `notifications`
- possibly `played_games`

Do not try to finish realtime, auth, ratings, or TOCA points in this branch.

### 3. `feature/lobby-persistence`

Goal:

Persist the existing lobby flow in Supabase.

Missions:

- Load lobby list/details from Supabase.
- Persist create lobby.
- Persist join waitlist.
- Persist move waitlist/player where supported.
- Persist approval/rejection.
- Persist leave lobby and host transfer.
- Keep current UI behavior as stable as possible.

### 4. `feature/lobby-chat-notifications`

Goal:

Persist chat and notifications.

Missions:

- Store lobby chat messages.
- Store notification records.
- Load messages by lobby/channel.
- Mark notifications read.
- Keep realtime optional.

### 5. `feature/lobby-realtime-updates`

Goal:

Add realtime behavior after persistence is stable.

Missions:

- Realtime lobby membership updates.
- Realtime chat updates.
- Realtime notification updates if needed.
- Keep non-realtime fallback behavior.

### 6. `feature/player-auth`

Goal:

Replace dev/current-player with real Supabase auth.

Missions:

- Add Supabase auth.
- Link auth users to `players`.
- Replace mock current player.
- Add basic RLS policies.
- Make sure lobby actions use authenticated player identity.

### 7. `feature/match-results-ratings-points`

Goal:

Finish post-match lifecycle and community scoring.

Missions:

- Define when a lobby becomes a played game.
- Persist played games.
- Persist ratings.
- Define TOCA points rules.
- Decide whether TOCA points are calculated from history or stored as denormalized values.

## Open Product Questions

These are still open and should be answered before the related branch:

- What exact rule marks a lobby as completed or played?
- How long should notifications remain visible?
- Should TOCA points be calculated from event history or stored as a denormalized player field?
- Which fields are required before a player can create or join a lobby?
- What minimum RLS policies are required before using real users?

## Guidance For The Next Codex

Do not restart the app architecture from scratch.

Preserve:

- `src/types.ts` as the shared domain type source.
- `src/theme.ts` for styling tokens.
- `src/features/lobbies/lobbyRules.ts` for pure decision helpers.
- `src/features/lobbies/lobbyActions.ts` for pure mock mutations.
- `src/features/lobbies/useLobbyStore.ts` as the current bridge from UI to data behavior.

Next Codex should start with `feature/supabase-foundation`, not full backend wiring.

The goal is to create the backend foundation safely, then connect feature flows branch by branch.
