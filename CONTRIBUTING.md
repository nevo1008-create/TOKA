# Contributing To TOKA

This guide explains how Nevo and collaborators should work together without stepping on each other's code.

## First-Time Setup

Clone the repository:

```powershell
git clone https://github.com/nevo1008-create/TOKA.git
cd TOKA
npm install
```

Run the app:

```powershell
npm run web
```

For Expo Go on a phone:

```powershell
npm start
```

## Daily Workflow

Always start from an updated `main`:

```powershell
git checkout main
git pull
```

Create a branch for your work:

```powershell
git checkout -b feature/lobby-list
```

Use branch names like:

```text
feature/create-lobby
feature/profile-screen
feature/ratings-flow
setup/project-guidelines
refactor/app-structure
fix/rtl-layout
```

## Before You Commit

Run TypeScript:

```powershell
npm run typecheck
```

If that script is missing:

```powershell
npx tsc --noEmit
```

Check what changed:

```powershell
git status
```

Commit:

```powershell
git add .
git commit -m "Build lobby list screen"
```

Push:

```powershell
git push -u origin feature/lobby-list
```

## Pull Requests

Every meaningful change should go through a Pull Request into `main`.

Before merging, check:

- The app still runs.
- TypeScript passes.
- The change uses shared types from `src/types.ts`.
- The change uses theme tokens from `src/theme.ts`.
- The branch does not include unrelated files.
- The code does not duplicate an existing component or type.

## Avoiding Conflicts

Try not to have two people edit the same large file at the same time.

Good split:

- One person works on lobbies.
- One person works on profile.
- One person works on rating flow.
- One person works on shared UI components.

If two branches need the same shared type or component, agree on the shape first and update the shared file in a small PR.

## Working With AI Agents

If using Codex or another coding agent:

- Tell the agent to read `AGENTS.md` first.
- Tell it which branch and feature it owns.
- Tell it which files it may edit.
- Ask it to run TypeScript before finishing.
- Review its changes before merging.

Example prompt:

```text
Read AGENTS.md first. Work only on the profile screen. Use existing types and theme tokens. Do not edit lobby code. Run typecheck when done.
```

## Main Branch Rule

`main` should always be usable.

Do not commit unfinished experiments directly to `main`.
Use a branch, then merge through a Pull Request.
