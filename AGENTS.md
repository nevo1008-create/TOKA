# TOKA Agent Guide

This file is the shared working contract for any AI coding agent working on TOKA.
Read it before changing code.

## Product Context

TOKA is a Hebrew-first, RTL, mobile-first React Native app built with Expo.
The product connects footvolley players in Israel through match lobbies, level-based joining, waitlists, chat, post-match ratings, and TOKA points.

The MVP currently uses mock data. Supabase will be connected later, so code should be written as if the data can become real without rewriting the UI.

## Tech Stack

- Expo
- React Native
- TypeScript
- Supabase later
- Hebrew UI, RTL-first

## Non-Negotiable Rules

- Keep `main` stable. Work on feature/setup/refactor branches.
- Do not invent duplicate domain types. Use or extend `src/types.ts`.
- Do not hardcode random colors, spacing, or radii. Use `src/theme.ts`.
- Do not put new large features directly into `App.tsx`. Extract screens, components, and feature modules.
- Keep UI copy in Hebrew unless a brand or technical term should stay in English.
- Keep the app mobile-first. Web support is only for quick local review.
- Run TypeScript before finishing work:

```powershell
npm run typecheck
```

If the script does not exist yet, run:

```powershell
npx tsc --noEmit
```

## Project Structure

Target structure:

```text
src/
  components/        Shared reusable UI
  screens/           Top-level app screens
  features/          Feature-specific modules
  data/              Temporary mock data
  types.ts           Shared domain types
  theme.ts           Shared visual tokens
```

Feature folders should be used when a product area grows:

```text
src/features/lobbies/
src/features/profile/
src/features/createLobby/
src/features/ratings/
```

## Naming Conventions

- Components: `PascalCase`, for example `LobbyCard`.
- Files with React components: `PascalCase.tsx`.
- Helpers and data files: `camelCase.ts`.
- Types: `PascalCase`, for example `Lobby`, `Player`, `PlayerLevel`.
- Booleans: readable names such as `isFull`, `canJoin`, `requiresApproval`.

## Shared Domain Language

Use these words consistently:

- `Player`: app user as a footvolley player.
- `Lobby` or `Match`: a one-time game room. Current UI uses `Lobby`.
- `Host`: the player who created and manages a lobby.
- `Waitlist`: players waiting before the match starts.
- `Substitute`: approved player who arrives and participates in rotations.
- `PlayerLevel`: one of `A-` through `E+`.
- `TOKA points`: community/activity score, separate from playing level.

## Data And Types

- Add new shared fields to `src/types.ts`.
- Update mock data in `src/data/mock.ts` when types change.
- Avoid local one-off shapes if the data represents a real domain object.
- Keep level values aligned with:

```text
A-, A, A+, B-, B, B+, C-, C, C+, D-, D, D+, E-, E, E+
```

## UI Rules

- Hebrew text should be right-aligned where natural.
- Keep layouts RTL-aware with `row-reverse` where needed.
- Use compact, practical mobile UI. This is an app, not a landing page.
- Avoid nested cards and decorative UI that does not serve a workflow.
- Buttons and controls should have stable dimensions and not shift layout.
- Prefer shared components once a UI pattern repeats twice.

## Git Workflow

Before work:

```powershell
git checkout main
git pull
git checkout -b feature/your-feature-name
```

Before finishing:

```powershell
npm run typecheck
git status
git add .
git commit -m "Clear commit message"
git push -u origin feature/your-feature-name
```

Open a Pull Request into `main`.

## When Unsure

- Prefer extending existing files and patterns over creating a parallel system.
- Ask before changing shared types in a way that affects multiple features.
- If touching a shared component, check all screens that use it.
- Keep changes small enough to review.
