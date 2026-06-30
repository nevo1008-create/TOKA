# TOCA V1 Production Blocker Roadmap

Last updated: 2026-06-30

This document tracks the blockers between the current MVP and a V1 release candidate for the Apple App Store and Google Play.

Use it as a working checklist. A blocker is `Done` only when the implementation, configuration, verification, and proof stages are complete.

## How To Use This Roadmap

Work one blocker at a time unless two blockers are clearly independent. For each blocker, move through the stages in order:

1. Read `Why it matters`.
2. Resolve open `Core Decisions`.
3. Complete the stage table from top to bottom.
4. Test every `Acceptance Criteria` item.
5. Run the listed `Verification Steps`.
6. Fill the `Daily Tracking Template`.
7. Merge only after the blocker is verified or explicitly deferred.

Do not mark a blocker `Done` because the code exists. Mark it `Done` only when the feature works in the app, Supabase or external-service configuration is confirmed, and the proof is recorded.

## Status Legend

- `Done`: implemented, verified, and no known release-blocking gap remains.
- `Needs verification`: implementation exists, but the full acceptance test has not been proven yet.
- `In progress`: currently being changed.
- `Not started`: no meaningful implementation or verification yet.
- `Deferred`: accepted as not required for V1.

## Branching Rule

- Stable branch: `main`.
- V1 integration branch: `v1-prep`.
- Use a short-lived branch from current `v1-prep` for each blocker.
- Before every PR, run:

```powershell
npm run typecheck
```

## Production Stages

These are the core stages for every blocker:

1. `Decision`: agree what V1 must support and what is out of scope.
2. `Implementation`: code, database, UI, and copy changes.
3. `Configuration`: dashboard, secrets, store console, DNS, build settings, or external services.
4. `Verification`: manual or automated proof that the behavior works.
5. `Documentation`: record how it works, how to retest it, and any remaining risk.
6. `PR/Merge`: commit, push, PR into `v1-prep`, resolve conflicts, and keep `v1-prep` green.

## Stage Exit Proof

| Stage | Exit Proof |
| --- | --- |
| Decision | The V1 behavior is written down, including what is intentionally out of scope. |
| Implementation | The app, database, function, or copy change exists on a branch. |
| Configuration | Required dashboard, DNS, secret, EAS, or store-console setup is confirmed. |
| Verification | The acceptance criteria were tested and the result is recorded. |
| Documentation | The roadmap or a related doc explains how to retest and what risk remains. |
| PR/Merge | Branch is pushed, reviewed or accepted, merged to `v1-prep`, and typecheck passes. |

## Blocker Overview

| ID | Blocker | Status | Risk | Current Stage | Next Action |
| --- | --- | --- | --- | --- | --- |
| B01 | Reports and support email | Done | High | Regression only | Keep as release regression test |
| B02 | Blocked players and moderation safety | Done | High | Regression only | Keep as release regression test |
| B03 | Account deletion | Done | High | Regression only | Keep as release regression test |
| B04 | Privacy policy and terms | Needs verification | High | Verification | Review against store answers |
| B05 | Production Supabase readiness | Needs verification | High | Verification | Confirm migrations, secrets, RLS, query health |
| B06 | Native app identity and EAS build setup | Not started | High | Decision | Choose final IDs and build path |
| B07 | Real-device QA | Not started | High | Decision | Choose test devices and build type |
| B08 | Store compliance metadata | Not started | High | Decision | Draft Apple/Google answers |
| B09 | Store assets and screenshots | Not started | Medium | Decision | Decide asset/screenshot set |
| B10 | Final core-flow regression | Not started | High | Waiting | Run after B02-B09 |
| B11 | Release candidate freeze | Not started | High | Waiting | Freeze after all blockers pass |

## Recommended Order

1. B02: Blocked players and moderation safety.
2. B03: Account deletion.
3. B04: Privacy policy and terms.
4. B05: Production Supabase readiness.
5. B06: Native identity and EAS setup.
6. B07: Real-device QA.
7. B08: Store compliance metadata.
8. B09: Store assets and screenshots.
9. B10: Final core-flow regression.
10. B11: Release candidate freeze.

## B01: Reports And Support Email

Status: `Done`

Why it matters:

The app has player interaction and user-generated content. V1 needs a working abuse/safety/problem reporting path and a support inbox.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Done | V1 supports general reports and player reports. |
| Implementation | Done | Report UI, Supabase table/RPC, report repository, player/general entry points. |
| Configuration | Done | Resend domain verified, Edge Function deployed, support secrets configured. |
| Verification | Done | Test report created and email arrived at `support@toca-ftv.com`. |
| Documentation | Done | Report flow and SQL checks documented here. |
| PR/Merge | Done | Merged into `v1-prep`; follow-up relaxed empty text/player-id blockers. |

### Acceptance Criteria

- Sidebar has `Report a problem`.
- Player surfaces have `Report player`.
- Empty report text is allowed.
- Report can submit even if reported player UUID is unresolved.
- Supabase row is created in `public.player_reports`.
- Support email arrives at `support@toca-ftv.com`.
- Email has readable client context.
- Email failure does not block report saving.

### Regression Test

1. Submit an empty general report.
2. Submit a player report.
3. Confirm email arrives.
4. Confirm newest rows:

```sql
select
  id,
  report_type,
  report_context,
  reported_player_id,
  message,
  email_notification_status,
  email_notification_error,
  email_notification_sent_at,
  created_at
from public.player_reports
order by created_at desc
limit 5;
```

Done means:

- `email_notification_status = sent` for new test reports.
- Empty report does not show any minimum-text error.
- Player report opens even if target UUID cannot be resolved.

## B02: Blocked Players And Moderation Safety

Status: `Done`

Why it matters:

Reports create a support workflow. Blocking gives the user immediate control after unwanted interaction.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Done | V1 hides blocked players from direct discovery, hides blocked-host lobbies, and keeps blocked players reportable. |
| Implementation | Done | Block action, blocked players screen, block repository, Supabase migrations, filtered surfaces, and blocked-list report action. |
| Configuration | Done | Block migrations and RPCs confirmed in production Supabase. |
| Verification | Done | Two-account block/unblock/report test and blocked-host lobby test passed. |
| Documentation | Done | Exact block behavior and proof recorded here. |
| PR/Merge | In progress | Merge B02 verification and blocked-list report action. |

### Core Decisions

1. Blocked players disappear from direct discovery and interaction surfaces.
2. Lobbies hosted by blocked players are hidden from the blocker.
3. Lobbies where a blocked player participates can still be opened with a warning instead of crashing.
4. Blocked players remain reportable from the blocked list.

### Acceptance Criteria

- User can block a player from Add Friends.
- User can block a player from Community.
- User can block a player from Profile.
- User can block a player from Lobby Details where relevant.
- User sees a confirmation before blocking.
- Blocked player appears in Blocked Players screen.
- User can unblock.
- After unblock, player can appear again where expected.
- Report player still works before and after blocking.
- No crash when a blocked player is in an existing lobby, friend request, invite, or notification.

### Verification Steps

1. Create or choose two test users: User A and User B.
2. Log in as User A.
3. Find User B in Community/Add Friends.
4. Block User B.
5. Confirm row exists:

```sql
select *
from public.player_blocks
order by created_at desc
limit 10;
```

6. Confirm User B is hidden from expected surfaces.
7. Open Blocked Players screen.
8. Unblock User B.
9. Confirm row is removed or inactive according to schema.
10. Confirm User B can appear again.
11. Repeat one path where User B is in a lobby.

Done means:

- The behavior matches the V1 decision.
- No broken screen or stale state appears.
- Any remaining edge case is documented and accepted.

### Verification Evidence - 2026-06-30

Production configuration proof:

- `public.block_player(target_player_id uuid)` exists and is executable by `authenticated`.
- `public.unblock_player(target_player_id uuid)` exists and is executable by `authenticated`.
- `public.list_my_player_blocks()` exists and is executable by `authenticated`.
- `public.can_current_user_read_lobby(target_lobby_id uuid)` exists and is executable by `authenticated`.
- `public.is_blocked_from_lobby_host(target_lobby public.lobbies, target_player_id uuid)` exists for server-side lobby checks.
- `public.player_blocks` exists with RLS enabled.
- Related checked tables have RLS enabled: `players`, `lobbies`, `lobby_memberships`, `notifications`, and `player_reports`.

Two-account proof:

- User A: `american pie` (`42db8fe3-d249-4f63-8474-01f9ee7f0ef8`).
- User B: `Nevonaya17 we` (`bace3b22-5f18-4c4e-bddb-ecf15bdc822c`).
- User A blocked User B; `public.player_blocks` row `5add56e8-de95-47ca-b8aa-e7cbb6b0ea89` was created.
- Blocked Players screen showed User B.
- Blocked Players screen report action submitted player report `a7d32b75-e29d-4905-8fbc-ea48ffb0d992`; email notification status was `sent`.
- User A unblocked User B; the block row was removed.

Blocked-host lobby proof:

- User B created open lobby `b02 -test` (`3c1255bb-577a-48e5-94c9-33453956f300`).
- User A saw the lobby before blocking User B.
- User A blocked User B; final block row `08d304a8-6173-42c0-a556-57b90847a75e` was confirmed.
- User A no longer saw `b02 -test` after blocking the host.

## B03: Account Deletion

Status: `Done`

Why it matters:

Apple and Google expect account deletion when account creation exists.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Done | V1 uses hard deletion for account/profile data, with limited anonymous feedback retention. |
| Implementation | Exists | Delete Account screen and Supabase RPC exist. |
| Configuration | Done | RPC exists in production Supabase. |
| Verification | Done | In-app deletion tested against a real login-backed account. |
| Documentation | Done | Final deletion behavior and verification evidence recorded here. |
| PR/Merge | In progress | Merge B03 documentation and profile-photo cleanup hardening. |

### Core Decisions

1. Player-created lobbies are deleted instead of cancelled or reassigned.
2. Chat messages sent by the deleted player are deleted.
3. Ratings and rank/TOCA point records tied to the deleted player are deleted by cascade.
4. Reports submitted by the deleted player are deleted; reports about the deleted player remain but lose the deleted player reference.
5. Optional deletion feedback is retained without player or auth identifiers in `public.account_deletion_feedback`.

### Acceptance Criteria

- User can open Delete Account from the side menu.
- Screen explains the action clearly.
- Deletion requires explicit confirmation.
- Auth user can no longer log in.
- App returns to auth screen after deletion.
- Personal profile data is removed or anonymized as decided.
- Related app data behaves consistently.
- No crash after deletion.

### Verification Steps

1. Create a disposable test account, or explicitly approve deletion of a real account.
2. Complete profile.
3. Create at least one app object if needed: lobby, friend request, notification, or report.
4. Use Delete Account from the side menu.
5. Confirm the app returns to auth/login.
6. Try logging in again if credentials are available.
7. Check Supabase:

```sql
select * from public.players where auth_user_id = '<auth-user-id>';
select * from public.notifications where recipient_player_id = '<player-id>';
select * from public.player_reports where reporter_player_id = '<player-id>';
select * from public.player_reports where reported_player_id = '<player-id>';
select * from public.lobbies where host_player_id = '<player-id>';
select * from public.lobby_messages where sender_player_id = '<player-id>';
select * from public.lobby_memberships where player_id = '<player-id>';
select * from public.player_ratings where rater_player_id = '<player-id>' or rated_player_id = '<player-id>';
select * from public.player_blocks where blocker_player_id = '<player-id>' or blocked_player_id = '<player-id>';
```

8. Confirm the app state after deletion is clean.

Done means:

- Disposable account cannot be used after deletion.
- DB behavior matches the V1 decision.
- Store reviewer can understand how deletion works.
- Profile photo storage is empty for the deleted auth user path in the `profile-photos` bucket.

### Verification Evidence - 2026-06-30

Test account:

- Display name: `Tal Hunga`
- Player ID: `564c93f5-8395-42e3-948c-4647852c6960`
- Auth user ID: `f7d3989a-c4a7-43fd-9ddc-c7026ee43e46`
- User explicitly approved permanent deletion before the test.

Pre-delete related data:

| Item | Count |
| --- | ---: |
| Hosted lobbies | 3 |
| Lobby memberships | 4 |
| Messages sent | 5 |
| Notifications received | 9 |
| Notifications related to player | 14 |
| Reports submitted | 7 |
| Reports about player | 0 |
| Ratings as rater | 3 |
| Ratings as rated | 0 |
| Blocks involving player | 2 |

Post-delete proof:

| Check | Result |
| --- | --- |
| `public.players` by player/auth ID | 0 rows |
| `auth.users` by auth ID | 0 rows |
| Hosted lobbies | 0 rows |
| Lobby memberships | 0 rows |
| Messages sent | 0 rows |
| Notifications as recipient/related player | 0 rows |
| Reports submitted/about player | 0 rows |
| Ratings as rater/rated | 0 rows |
| Blocks involving player | 0 rows |
| `storage.objects` under `profile-photos/<auth-user-id>/` | 0 rows |

Production configuration proof:

- `public.delete_current_user_account(feedback_text text default null)` exists.
- Function returns `void`.
- Function is `SECURITY DEFINER`.
- RLS is enabled on the checked related public tables: `account_deletion_feedback`, `players`, `lobbies`, `lobby_memberships`, `lobby_messages`, `notifications`, `player_reports`, `player_ratings`, and `player_blocks`.

## B04: Privacy Policy And Terms

Status: `Needs verification`

Why it matters:

Store forms must match what the app actually collects and does.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Done | V1 uses in-app Privacy/Terms screens and public store URLs on clean TOCA domain paths. |
| Implementation | Done | Privacy Policy and Terms screens exist; public static pages mirror the V1 copy at `/privacy` and `/terms`. |
| Configuration | In progress | Vercel rewrites are configured; final deployed domain/DNS and store listing fields still need confirmation. |
| Verification | Needs verification | In-app copy and link smoke passed; Apple/Google form answers still need final cross-check. |
| Documentation | Done | In-app data collection mapping recorded here. |
| PR/Merge | In progress | Merge copy alignment changes. |

### Acceptance Criteria

- Privacy policy covers account data.
- Privacy policy covers player profile data.
- Privacy policy covers lobbies, messages, ratings, reports, notifications, and support emails.
- Privacy policy describes account deletion.
- Terms describe player behavior expectations.
- Terms describe user-generated content responsibilities.
- Terms describe moderation/report/block behavior.
- Signup links work.
- Side menu links work.
- Store metadata answers match the policy.

### Verification Steps

1. Read Privacy Policy in app.
2. Read Terms in app.
3. Compare against the data actually stored in Supabase.
4. Draft Apple privacy nutrition answers.
5. Draft Google Data Safety answers.
6. Update copy if a mismatch appears.

Done means:

- There is no obvious mismatch between policy text, app behavior, and store answers.

### In-App Copy Review - 2026-06-30

Status: In-app Privacy Policy and Terms copy aligned to V1 app behavior.

Decision:

- V1 keeps Privacy Policy and Terms available inside signup and the side menu.
- Public Privacy/Terms URLs should use `https://toca-ftv.com/privacy` and `https://toca-ftv.com/terms` after production deployment/DNS is confirmed.
- Store metadata answers must match the in-app copy and final backend configuration.

Data mapping covered by Privacy Policy:

- Account data: email and account access.
- Player profile data: name, initials, preferred area/beaches, gender, preferred foot, preferred side, equipment, profile photo, avatar focus, rank, rating, TOCA Points, reliability signals, and push notification preference.
- Community data: lobbies, memberships, waitlists, invites, friend relationships and requests, blocked players, reports, support requests, notifications, ratings, and basic app interactions.
- Report/support data: report type, report context, related player/lobby, optional message, diagnostics opt-in, client context, contact preference, support email status, and support email snapshot.
- Account deletion: V1 hard deletion removes the auth account, player profile, profile photo files, hosted lobbies, memberships, messages, notifications, submitted reports, ratings, blocks, and related player app data where the hard-delete flow applies. Optional deletion feedback is retained without player/auth identifiers.

Terms mapping covered:

- Player behavior expectations and accurate profiles.
- User-generated content responsibility for profile details, lobby notes, reports, ratings, messages, and uploads.
- Community moderation through reports, blocking, warnings, restrictions, lobby removal, and account suspension.
- Account deletion from inside the app.

Link proof from code:

- Signup legal rows open `PrivacyPolicyScreen` and `TermsOfServiceScreen`.
- Side menu rows open `PrivacyPolicyScreen` and `TermsOfServiceScreen`.
- Both legal screens include a support/report entry point when opened outside signup.

Manual smoke proof:

- Signup Terms link opened Terms and returned to signup.
- Signup Privacy link opened Privacy and returned to signup.
- Side menu Privacy link opened updated Privacy copy.
- Side menu Terms link opened updated Terms copy.
- Legal screens no longer show user-facing draft wording.
- Terms no longer shows the removed payments section.
- Both screens show `Last updated: June 30, 2026`.

Remaining B04 risk:

- Public legal URL implementation exists in repo, but deployed `https://toca-ftv.com/privacy` and `https://toca-ftv.com/terms` still need production DNS/deployment verification.
- Apple privacy nutrition answers and Google Data Safety answers still need to be drafted and checked against the final store configuration.

## B05: Production Supabase Readiness

Status: `Needs verification`

Why it matters:

The app depends on Supabase for auth, data, reports, email, realtime, and account deletion. V1 cannot ship with unknown backend state.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Done | Supabase remains V1 backend. |
| Implementation | Mostly done | RPCs, RLS hardening, reports, blocks, realtime work exist. |
| Configuration | Needs verification | Production migrations/secrets/functions need checklist. |
| Verification | Not done | Fresh query/security check needed. |
| Documentation | Not done | Need production backend checklist. |
| PR/Merge | Not needed unless gaps found | Fix branch if migration or code gap exists. |

### Acceptance Criteria

- All required migrations are applied.
- RLS is enabled on exposed public tables.
- Public client writes are controlled by safe policies or RPCs.
- Edge Function `notify-report-support` is deployed.
- Secrets exist:
  - `RESEND_API_KEY`
  - `REPORT_SUPPORT_TO`
  - `REPORT_SUPPORT_FROM`
- Report email status is normally `sent`.
- Notification table is not growing unexpectedly.
- Query Performance shows no runaway loop.
- Realtime subscriptions are scoped and cleaned up.

### Verification Steps

1. Confirm latest migrations applied in Supabase dashboard.
2. Confirm Edge Function deployed from latest code.
3. Confirm secrets exist.
4. Submit a report and check email status.
5. Use the app normally for 10-15 minutes.
6. Check notification count:

```sql
select count(*) as notifications_count from public.notifications;
```

7. Check report email status:

```sql
select email_notification_status, count(*)
from public.player_reports
group by email_notification_status;
```

8. Review Supabase Query Performance for repeated reads/writes.

Done means:

- No known backend configuration gap remains.
- Query and table growth look stable after normal usage.

## B06: Native App Identity And EAS Build Setup

Status: `Not started`

Why it matters:

Store submission requires stable native identifiers and installable builds.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Not started | Choose final app name, bundle id, package name, versioning. |
| Implementation | Not started | Update `app.json`, add EAS config if needed. |
| Configuration | Not started | Expo/EAS project, credentials, environment variables. |
| Verification | Not started | Build and install internal apps. |
| Documentation | Not started | Record build commands and env setup. |
| PR/Merge | Not started | Merge build setup into `v1-prep`. |

### Acceptance Criteria

- Final app display name is chosen.
- iOS bundle identifier is chosen.
- Android package name is chosen.
- Version, iOS build number, and Android version code are set.
- EAS profiles exist for development/preview/production.
- Production env vars are documented.
- Android internal build succeeds.
- iOS build path is chosen and tested if possible.

### Verification Steps

1. Decide identifiers.
2. Update config.
3. Configure EAS.
4. Build Android.
5. Install Android build on a device.
6. Build iOS via TestFlight or development build path.
7. Install iOS build if possible.

Done means:

- At least one internal native build installs and opens.
- iOS path is either working or the Apple account blocker is documented.

## B07: Real-Device QA

Status: `Not started`

Why it matters:

Web preview does not prove native keyboard, scrolling, safe areas, auth persistence, realtime recovery, or device-specific behavior.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Not started | Choose devices and QA build. |
| Implementation | Waiting | Fix only issues found during QA. |
| Configuration | Waiting | Install builds and test accounts. |
| Verification | Not started | Run QA matrix. |
| Documentation | Not started | Record device results and bugs. |
| PR/Merge | Waiting | Merge fixes as needed. |

### Core QA Matrix

- Signup.
- Login.
- Profile completion.
- Browse lobbies.
- Create lobby.
- Join lobby.
- Request approval.
- Host approve/reject.
- Waitlist.
- Invite player.
- Friend request.
- Chat.
- Rating.
- Report problem.
- Report player.
- Block/unblock.
- Account deletion on disposable account.
- Logout/login recovery.
- Background/foreground recovery.

Done means:

- Android real-device test passes.
- iOS real-device test passes, or iOS blocker is documented.
- Release-blocking native issues are fixed.

## B08: Store Compliance Metadata

Status: `Not started`

Why it matters:

Apple and Google can reject or delay apps for incomplete privacy, support, account, or user-content answers.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Not started | Decide reviewer access, public URLs, and compliance answers. |
| Implementation | Not started | Add any missing support/legal URLs or app copy. |
| Configuration | Not started | Fill Apple and Google console forms. |
| Verification | Not started | Cross-check store answers against app behavior. |
| Documentation | Not started | Save final answers outside secrets. |
| PR/Merge | Waiting | Merge any app copy/config changes. |

### Acceptance Criteria

- Support email confirmed.
- Privacy policy location confirmed.
- Terms location confirmed.
- Apple privacy nutrition labels drafted.
- Google Data Safety answers drafted.
- UGC/moderation answers match report/block behavior.
- Demo reviewer account prepared if required.
- Account deletion instructions ready for reviewers.

Done means:

- Store forms can be submitted without guessing.

## B09: Store Assets And Screenshots

Status: `Not started`

Why it matters:

Store listings require production-ready assets.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Not started | Choose visual direction and screenshot set. |
| Implementation | Not started | Create icons, splash, screenshots, descriptions. |
| Configuration | Not started | Upload to App Store Connect and Play Console. |
| Verification | Not started | Check asset dimensions and store previews. |
| Documentation | Not started | Record final copy/assets. |
| PR/Merge | Waiting | Commit app config/assets if stored in repo. |

### Acceptance Criteria

- App icon.
- Android adaptive icon.
- Splash screen.
- Notification icon if push is used.
- App Store screenshots.
- Google Play screenshots.
- Short description.
- Full description.
- Category/keywords chosen.

Done means:

- Store listing can be previewed with no missing required asset.

## B10: Final Core-Flow Regression

Status: `Not started`

Why it matters:

Before freezing V1, the complete product path needs one clean pass with production-like backend configuration.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Waiting | Freeze checklist after B02-B09. |
| Implementation | Waiting | Only fix release-blocking bugs. |
| Configuration | Waiting | Use release backend/build setup. |
| Verification | Not started | Full regression pass. |
| Documentation | Not started | Record pass/fail and known issues. |
| PR/Merge | Waiting | Merge final release-blocking fixes. |

### Regression List

1. Signup.
2. Login.
3. Complete profile.
4. Browse lobbies.
5. Create lobby.
6. Join lobby.
7. Request approval.
8. Host approve/reject.
9. Join waitlist.
10. Invite player.
11. Accept/cancel friend request.
12. Use chat.
13. Submit rating.
14. Report problem.
15. Report player.
16. Block/unblock player.
17. Delete disposable account.
18. Logout and log back in.

Done means:

- No high-severity known bug remains.
- No blank screen, infinite loading state, duplicate-notification storm, or report/email failure remains.

## B11: Release Candidate Freeze

Status: `Not started`

Why it matters:

After QA, random feature changes reduce confidence. V1 needs a stable candidate.

### Stages

| Stage | Status | What It Covers |
| --- | --- | --- |
| Decision | Waiting | Decide freeze date and accepted known issues. |
| Implementation | Waiting | Release-blocking fixes only. |
| Configuration | Waiting | Final version/build numbers. |
| Verification | Not started | Internal build validation. |
| Documentation | Not started | Release notes and known issues. |
| PR/Merge | Waiting | Final merge/tag. |

### Acceptance Criteria

- B02-B10 are `Done` or explicitly `Deferred`.
- Release branch or tag exists.
- Version/build numbers finalized.
- Internal test builds submitted.
- Release notes drafted.
- Known issues list exists.
- Only release-blocking fixes are allowed after freeze.

Done means:

- The branch can become the V1 release candidate.

## Daily Tracking Template

Use this format at the end of each work session:

```text
Date:
Blocker:
Stage:
Branch/PR:
What changed:
How tested:
Evidence:
Remaining risk:
Next step:
```

## Current Recommendation

Start with B03: Account Deletion.

Reason:

- It is a hard store expectation.
- Implementation already exists.
- The next work is mostly verification.
- If verification fails, we will know exactly what to patch before native build work begins.

## Work Session Notes

### 2026-06-30 - B03 Account Deletion

Date: 2026-06-30
Blocker: B03 Account Deletion
Stage: Done
Branch/PR: `codex/b03-account-deletion`
What changed: documented the V1 hard-delete behavior and expanded the verification SQL. Hardened profile photo cleanup so deletion pages through the full `profile-photos/<auth-user-id>` folder and removes files in batches before deleting the auth user. Verified in-app deletion against a real login-backed account after explicit user approval.
How tested: `npm run typecheck`
Evidence: TypeScript passed locally. Supabase checks showed 0 rows for the deleted player/auth user, hosted lobbies, memberships, messages, notifications, reports, ratings, blocks, and profile-photo storage folder.
Remaining risk: Keep account deletion in final core-flow regression with a fresh disposable account.
Next step: Move to the next production blocker.
