# TOCA Architecture

This document describes the shared project language and structure for TOCA.

## Product Summary

TOCA is a mobile app for footvolley players in Israel.
Players create and join one-time match lobbies based on level, gender rules, area, and availability.
After matches, players rate each other so playing levels and TOCA points become more accurate over time.

The MVP app UI is English-first and LTR. Hebrew and RTL support are planned later, and user-generated free text may contain Hebrew.

## Current Stage

The current app is an Expo + React Native MVP shell with mock data.
The goal is to validate screens and flows quickly, then connect Supabase without rewriting the app.

## Stack

- React Native
- Expo
- TypeScript
- Supabase later for auth, database, realtime chat, and storage

## Source Structure

Current and target structure:

```text
src/
  components/        Reusable UI components
  screens/           Main app screens
  features/          Feature-specific code
  data/              Mock data until Supabase is connected
  theme.ts           Colors, spacing, radii
  types.ts           Shared domain types
```

As the app grows, move logic out of `App.tsx` into screens and components.

Suggested feature folders:

```text
src/features/lobbies/
  LobbyListScreen.tsx
  LobbyDetailsScreen.tsx
  LobbyCard.tsx
  lobbyFilters.ts

src/features/createLobby/
  CreateLobbyScreen.tsx
  createLobbySteps.ts

src/features/profile/
  ProfileScreen.tsx
  PlayerStats.tsx

src/features/ratings/
  RatingScreen.tsx
  ratingLogic.ts
```

## Domain Model

### Player

A player is an app user.

Important fields:

- `id`
- `name`
- `level`
- `gamesPlayed`
- `preferredFoot`
- `area`
- `initials`

Future fields:

- `avatarUrl`
- `levelStatus`
- `tocaPointsTotal`
- `isAdmin`

### Player Level

The level scale is:

```text
A-, A, A+, B-, B, B+, C-, C, C+, D-, D, D+, E-, E, E+, League
```

`A-` is the lowest level. `League` is the highest level and behaves like every other rank.

Professional level should only be affected by level rating votes, not by attendance or friendliness.

### Lobby

A lobby represents one scheduled match.

Important fields:

- `id`
- `title`
- `location`
- `area`
- `startsAt`
- `levelRange`
- `capacity`
- `playerCount`
- `status`
- `waitlistCount`
- `note`
- `players`

Lobby status:

- `open`
- `locked`
- `full`

Future statuses:

- `in_progress`
- `rating_open`
- `completed`
- `closed`

### Participant Roles

Participant roles:

- `admin`
- `joined`
- `substitute`
- `waitlist`

A substitute is approved and attends the match.
A waitlist player waits before the match and is not rated unless promoted into the active game.

## MVP Screens

### Home

Shows:

- Upcoming matches
- Nearby lobbies
- History summary
- Persistent create action

### Lobbies

Shows:

- Lobby list
- Area and level filters
- Availability filter
- Open/locked/full state

### Create Lobby

Wizard flow:

1. Time and location
2. Level range and player count
3. Lobby rules, waitlist, password, equipment, note

### Profile

Shows:

- Player level
- Games played
- TOCA points
- Preferred foot
- Area
- Future history and friends

## Rating Model

After a match, each attending player rates all other attending players.

Questions:

1. Level relative to the player's current level:
   - `much_below`
   - `below`
   - `as_expected`
   - `above`
   - `much_above`

2. Punctuality:
   - `on_time`
   - `almost`
   - `late`

3. Play again:
   - `yes`
   - `maybe`
   - `no`

Level votes affect only professional level.
Punctuality and play-again answers affect TOCA points and trust signals.

## TOCA Points

TOCA points are a community and activity score, separate from playing level in MVP. Long term, TOCA points become part of the broader ranking system together with behavior and skill rank.

Possible point events:

- Match attended
- Rated others on time
- Other players chose "play again"
- Late cancellation
- No-show
- Rating overdue

The app should support:

- Total points on profile
- Weekly/monthly leaderboards later

## Supabase Direction

Expected future tables:

- `profiles`
- `matches`
- `match_participants`
- `join_requests`
- `match_messages`
- `match_ratings`
- `rating_tasks`
- `toca_points_events`
- `friendships`
- `notifications`
- `admin_actions`

Do not couple UI components directly to mock data shape in a way that will make these tables hard to connect later.

## UI System

Use `src/theme.ts` for:

- Colors
- Spacing
- Radii

Shared UI should eventually live in `src/components`.
Examples:

- `Button`
- `Screen`
- `Avatar`
- `LobbyCard`
- `SectionTitle`
- `BottomNav`

## Language Direction

- MVP UI copy should be English.
- MVP layout should use natural LTR flow.
- Hebrew/RTL support should remain possible later.
- Player names, lobby notes, and free-text location descriptions may contain Hebrew.

## Development Principles

- Keep features isolated.
- Prefer shared types and shared components.
- Keep mock data realistic.
- Avoid large unrelated refactors.
- Keep PRs small enough to review.
- Run TypeScript before merging.
