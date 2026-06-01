# Backend Data Plan

This document tracks the full backend-readiness roadmap for TOCA. It is not limited to the current branch. It should help another developer understand what has been decided, what is still open, and how to continue the work after each branch is merged.

## Current Branch

Branch: `feature/backend-ready-data-layer`

Purpose:

- Move the app away from screens being tightly coupled to mock data.
- Prepare the app structure for Supabase-backed data.
- Keep the current lobby flow UI behavior working while creating clean service boundaries.
- Document the backend model and branch-by-branch implementation path.

This branch should not try to finish the full backend. It should create the foundation that makes the next backend branches smaller and safer.

## Product Scope To Support

The backend needs to support:

- Players
- Lobbies
- Lobby participants
- Waitlist
- Host approval requests
- Private and PIN-protected lobbies
- Lobby chat
- Notifications
- Played or completed games
- Post-match ratings later
- Friends and invites later
- TOCA points later

Substitutes are no longer part of the current product plan and should not be included as a new backend concept unless the product direction changes.

## Confirmed Decisions

- Supabase is the intended backend.
- Auth is not part of the current foundation branch.
- A dev/current-player concept can be used until auth is added.
- Existing UI behavior should remain stable while backend structure is introduced.
- Chat and notifications can start as stored records. Realtime behavior can be added later.
- Created games are not a standalone UI category. They are backend/domain logic derived from lobby state and match lifecycle.
- A unified lobby membership model with statuses is preferred over separate tables for players, waitlist, and requests, unless implementation details later show a strong reason to split them.
- A player who has the correct PIN for a private lobby should not also need host approval. The PIN is treated as permission to enter the lobby flow.
- Lobbies should not be cancelled just because the host leaves, unless the host was the only remaining player and the lobby becomes empty.
- Hosting can be shared by multiple players. Co-hosts should have the same host panel permissions.
- If the only host leaves and other players remain, host ownership should transfer first to the next joined player in the players list. If there are no joined players, it should transfer to the next waitlisted player by join order.
- Lobby chat has two channels: an all-lobby channel and a joined-players-only channel.
- Waitlisted players can see only the all-lobby chat channel.
- Hosts can see the joined-players-only chat even if their current lobby status is waitlisted.
- Declined join requests should notify the requested player, then allow that player to apply again. They do not need to remain visible as host-facing history.

## Main Design Principle

Screens should not directly know whether data comes from mock data, Supabase, local state, or a future cache layer.

The app should move toward this shape:

```text
Screen
  -> feature hook or controller
    -> service function
      -> repository/data source
        -> mock data now, Supabase later
```

This allows the UI to keep working while the backing data source changes.

## Proposed Backend Entities

### players

Represents a TOCA user as a footvolley player.

Likely fields:

- `id`
- `display_name`
- `avatar_url`
- `level`
- `gender`
- `city`
- `toca_points`
- `created_at`
- `updated_at`

Later auth fields:

- `auth_user_id`
- `phone`
- `email`

Notes:

- Player level should match the app values in `src/types.ts`.
- Auth can be added later without changing most lobby logic if `players.id` is used consistently.

### lobbies

Represents a one-time match room.

Likely fields:

- `id`
- `host_player_id`
- `title`
- `location_name`
- `location_address`
- `starts_at`
- `ends_at`
- `max_players`
- `min_level`
- `max_level`
- `gender_policy`
- `is_private`
- `pin_code_hash` or protected PIN representation
- `requires_approval`
- `status`
- `notes`
- `created_at`
- `updated_at`

Possible `status` values:

- `draft`
- `open`
- `full`
- `locked`
- `in_progress`
- `completed`
- `cancelled`

Notes:

- The app can initially continue using mock lobby ids.
- PIN values should not be stored as plain text in a real backend.
- `host_player_id` can represent the original or primary host, but co-host support likely needs host role data on `lobby_memberships`.
- If the only host leaves, the backend/service should close the lobby when no players remain. Otherwise, it should promote the next joined player by `position`, falling back to the next waitlisted player if there are no joined players.

### lobby_memberships

Represents a player relationship to a lobby.

This should likely cover active players, waitlisted players, pending approval requests, declined requests, and removed/left players.

Important modeling note:

The current app type uses one `role` field for both list position and permission (`admin`, `joined`, `waitlist`). The backend should not keep that limitation. A real backend should separate:

- membership state: whether the player is joined, waitlisted, pending approval, declined, left, or removed
- permission role: whether the player is a member or host

This separation is needed because a waitlisted player can still be a host/co-host.

Likely fields:

- `id`
- `lobby_id`
- `player_id`
- `status`
- `role`
- `position`
- `requested_at`
- `joined_at`
- `left_at`
- `approved_at`
- `approved_by_player_id`
- `declined_at`
- `declined_by_player_id`
- `created_at`
- `updated_at`

Possible `status` values:

- `player`
- `waitlisted`
- `pending_approval`
- `declined`
- `left`
- `removed`

Possible `role` values:

- `member`
- `host`

Notes:

- This model avoids duplicating separate participant, waitlist, and request structures.
- `position` can preserve ordering for active players and waitlist.
- Host permissions should be represented here so multiple players can co-host the same lobby.
- Host chat and host panel access should check permission role, not only joined/waitlist status.
- Declined requests should create a notification for the requested player. The declined membership row can be updated, removed, or hidden from normal app queries as long as reapplying is allowed.
- Historical rows may be useful for analytics and TOCA points later, but declined requests do not need to remain visible in the normal host/player UI.

### lobby_messages

Represents lobby chat messages.

Likely fields:

- `id`
- `lobby_id`
- `sender_player_id`
- `channel`
- `body`
- `created_at`
- `deleted_at`

Possible `channel` values:

- `all`
- `players`

Notes:

- Current UI has two lobby chat channels: `all` for everyone connected to the lobby, and `players` for joined players and hosts only.
- Waitlisted players can read and send only in the `all` channel.
- Store-first is enough for the initial backend work.
- Realtime subscriptions can be added after persistence is stable.

### notifications

Represents notifications shown to a player.

Likely fields:

- `id`
- `recipient_player_id`
- `type`
- `title`
- `body`
- `related_lobby_id`
- `related_player_id`
- `read_at`
- `created_at`

Possible notification types:

- `join_request_received`
- `join_request_approved`
- `join_request_declined`
- `moved_to_players`
- `moved_to_waitlist`
- `lobby_cancelled`
- `host_left`
- `new_lobby_message`

Notes:

- Notifications should be persisted first.
- Push notifications can be a later layer.

### played_games

Represents a lobby that reached the business definition of a played game.

Likely fields:

- `id`
- `lobby_id`
- `host_player_id`
- `played_at`
- `completed_at`
- `player_count`
- `created_at`

Notes:

- This may be derived from completed lobby state instead of created manually.
- The current product rule is: when a created lobby reaches play time with enough players, it counts as a created/played game.
- The exact rule should be finalized before ratings and points are implemented.

### ratings

Future entity for post-match ratings.

Likely fields:

- `id`
- `played_game_id`
- `rater_player_id`
- `rated_player_id`
- `score`
- `comment`
- `created_at`

Notes:

- Not part of the first backend foundation.
- Should wait until played game lifecycle is defined.

### friendships

Future entity for friend relationships.

Likely fields:

- `id`
- `requester_player_id`
- `recipient_player_id`
- `status`
- `created_at`
- `updated_at`

Possible `status` values:

- `pending`
- `accepted`
- `blocked`

### invites

Future entity for lobby or friend invites.

Likely fields:

- `id`
- `sender_player_id`
- `recipient_player_id`
- `lobby_id`
- `status`
- `created_at`
- `responded_at`

Possible `status` values:

- `pending`
- `accepted`
- `declined`
- `expired`

## Service Layer Plan

The first service layer should focus on lobbies because that is where the current app has the most behavior.

Suggested app modules:

```text
src/features/lobbies/
  useLobbyStore.ts
  lobbyCreateTypes.ts
  lobbyRules.ts
  lobbyActions.ts
```

Possible direction:

- `lobbyRules.ts` keeps pure business-rule helpers.
- `lobbyActions.ts` keeps pure lobby mutations that can be tested without React.
- `useLobbyStore.ts` owns the current mock-backed lobby state and exposes user-facing actions like join, leave, approve, decline, create lobby, send message, and mark notifications read.
- Later, the store can call Supabase-backed repositories without rewriting screens.

Example service functions:

```text
listLobbies()
getLobbyById(lobbyId)
getMyLobbies(playerId)
joinLobby(lobbyId, playerId, options)
leaveLobby(lobbyId, playerId)
approveJoinRequest(lobbyId, hostPlayerId, requestedPlayerId)
declineJoinRequest(lobbyId, hostPlayerId, requestedPlayerId)
moveMemberToPlayers(lobbyId, hostPlayerId, playerId)
moveMemberToWaitlist(lobbyId, hostPlayerId, playerId)
sendLobbyMessage(lobbyId, senderPlayerId, channel, body)
```

Services should return typed results that can represent success and failure. This will make backend errors easier to show later.

## Branch Plan

### Branch 1: backend-ready data layer

Suggested branch:

`feature/backend-ready-data-layer`

Goals:

- Review current mock lobby flow.
- Add this backend plan.
- Identify current UI dependencies on mock data.
- Create the first service/data layer boundary.
- Keep mock data as the backing source.
- Run TypeScript.

Definition of done:

- Screens still work with mock data.
- Lobby operations can begin moving through service-style APIs.
- No Supabase network dependency is required yet.
- This plan clearly explains the next backend branches.

Completed in this branch:

- Added the backend roadmap and branch plan in this document.
- Added `src/features/lobbies/useLobbyStore.ts` as the first mock-backed lobby state/service boundary.
- Added `src/features/lobbies/lobbyCreateTypes.ts` so create-lobby input is owned by the lobby feature instead of the screen.
- Moved lobby, chat, private PIN access, notification, and create-lobby state ownership out of `App.tsx` and into the lobby store.
- Kept `App.tsx` as the temporary mock boundary for current player and player directory.
- Reduced direct mock imports from lobby-related screens and components.
- Added chat channel visibility helpers so waitlisted players see only all-lobby chat, while joined players and hosts can see players-only chat.
- Updated host-leave behavior so an empty lobby closes, otherwise host transfers first to the next joined player, then to the next waitlisted player.
- Updated declined join request behavior so declined requests are removed from normal lobby state after notification, allowing the player to reapply.
- Documented that the backend should split membership state from permission role so a player can be waitlisted and still be a host/co-host.

Remaining after this branch:

- Supabase is not installed or connected yet.
- No database schema, migrations, seed scripts, generated DB types, or RLS policies exist yet.
- Auth is still dev/current-player only.
- Co-host management UI is not built yet.
- The current app `LobbyParticipant.role` still combines permission and list position; the backend should not copy that limitation.
- Chat and notifications are still local/mock-backed and not realtime.
- Played-game completion, ratings persistence, and TOCA points rules are still future work.

### Branch 2: Supabase foundation

Suggested branch:

`feature/supabase-foundation`

Goals:

- Add Supabase client setup.
- Add environment variable structure.
- Add initial schema/migrations.
- Add seed data for local/dev testing.
- Add database types if generated types are used.
- Keep auth minimal or dev-only unless product direction changes.

Definition of done:

- Supabase can run in dev.
- Tables exist for players, lobbies, memberships, messages, notifications, and played games if included.
- Seed data can produce an app state similar to current mock data.
- The app can still run without production credentials.

### Branch 3: lobby persistence

Suggested branch:

`feature/lobby-persistence`

Goals:

- Connect lobby list and lobby details to Supabase-backed data.
- Persist join, leave, waitlist, and host management actions.
- Preserve current business rules.
- Keep private and PIN behavior compatible with backend storage.

Definition of done:

- Lobbies persist across reloads.
- Active players, waitlist, and pending requests are stored in the database.
- Host actions update persisted records.
- TypeScript passes.

### Branch 4: lobby chat and notifications

Suggested branch:

`feature/lobby-chat-notifications`

Goals:

- Persist lobby chat messages.
- Persist notifications.
- Wire screens to stored chat and notification records.
- Keep realtime optional.

Definition of done:

- Messages are stored and loaded by lobby/channel.
- Notifications are stored per player and can be marked read.
- Existing notification UI can work from backend-shaped data.

### Branch 5: realtime lobby updates

Suggested branch:

`feature/lobby-realtime-updates`

Goals:

- Add Supabase realtime subscriptions for lobby membership changes.
- Add realtime updates for chat.
- Add realtime notification updates if useful.

Definition of done:

- Two clients can see lobby/chat changes without manual refresh.
- Realtime logic is isolated from UI screens.
- Fallback loading still works without realtime.

### Branch 6: auth and player identity

Suggested branch:

`feature/player-auth`

Goals:

- Add Supabase auth.
- Connect authenticated users to player profiles.
- Replace dev/current-player with real current player identity.
- Prepare RLS policies around player ownership and lobby permissions.

Definition of done:

- A signed-in user maps to a player record.
- App actions use the authenticated player.
- Basic RLS policies are in place.

### Branch 7: played games, ratings, and TOCA points

Suggested branch:

`feature/match-results-ratings-points`

Goals:

- Finalize when a lobby becomes a played game.
- Add post-match rating flow.
- Add TOCA points rules.
- Persist ratings and points changes.

Definition of done:

- Completed matches are represented consistently.
- Ratings are stored.
- TOCA points can be calculated or updated predictably.

## Open Questions

These should be answered before the related implementation branch begins:

- What exact rule marks a lobby as completed or played?
- How long should notifications remain visible?
- Should TOCA points be calculated from event history or stored as a denormalized player field?
- Which fields are required before a player can create or join a lobby?
- What minimum RLS policies are required before using real users?

## Immediate Next Step

After `feature/backend-ready-data-layer` is merged, start the next branch:

`feature/supabase-foundation`

Recommended first task:

Create the Supabase foundation without wiring every screen yet. Add project env structure, client setup, initial schema/migration direction, local/dev seed strategy, and generated database type plan. Keep auth dev-only unless the product direction changes before that branch starts.
