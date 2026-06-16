# Production Roadmap

This roadmap tracks the path from the current MVP stabilization state to a publishable V1 release for the Apple App Store and Google Play.

The main rule for this branch is simple: make the app production ready before adding more product surface. Backend stability comes first, then native build readiness, then store release polish.

## Current Baseline

- Branch: `v1-prep`
- Base: updated from `main`
- MVP stabilization fixes are already merged into `main`
- The 5-second polling loop was removed
- Notification writes were reduced and deduped in code
- A Supabase migration exists for notification retention, indexes, cleanup, and dedupe
- TypeScript currently passes on the stabilized codebase

## Phase 0: Stabilize The Starting Point

Goal: make sure the new V1 branch starts from a clean, known-good state.

- Verify the branch is current with `main`
- Run TypeScript
- Confirm the app can start locally
- Confirm login, lobby browsing, lobby creation, join flows, invite flows, and notification flows still work
- Keep this branch focused on V1 readiness, not broad new features

Exit criteria:

- `npm run typecheck` passes
- No known runaway polling or notification write loop remains
- The branch is clean and pushed

## Phase 1: Supabase Cleanup And Quota Stabilization

Goal: stop database and egress waste before moving more features onto production data.

Immediate work:

- Confirm the `notifications` table is no longer bloated after manual cleanup
- Apply or re-apply the notification retention and dedupe migration when Supabase is stable enough
- Verify indexes exist for notification recipient lookups, unread lookups, related lobby lookups, and cleanup queries
- Add a safe scheduled or manual cleanup process for old notifications
- Re-check Supabase Query Performance after fresh app usage, not only historical data

Specific checks:

- `notifications` row count and table size
- top `SELECT`, `INSERT`, `UPDATE`, and `set_config` query counts
- whether notification reads are limited
- whether notification writes are idempotent
- whether lobby refresh or status refresh still creates notifications

Exit criteria:

- No large growth in `notifications`
- Query Performance no longer shows notification insert/update floods
- App usage does not quickly increase egress
- Cleanup query or function exists and is documented

## Phase 2: Move Sensitive Logic Server-Side

Goal: keep the client thin and prevent duplicate writes from multiple screens, refreshes, or devices.

Move or wrap these flows behind server-side RPC, edge functions, or trusted backend actions:

- joining a lobby
- leaving a lobby
- cancelling a lobby
- waitlist promotion
- substitute handling
- invite creation
- notification creation
- rating submission
- host approval or rejection
- TOCA points updates

Server-side rules should be idempotent. If the same client request is sent twice, it should not create duplicate rows or duplicate notifications.

Exit criteria:

- Critical writes go through one controlled backend path
- Notification creation is centralized
- Duplicate writes are blocked by database constraints or server-side checks
- The client no longer directly coordinates multi-step business logic

## Phase 3: Realtime Architecture

Goal: replace polling with focused realtime subscriptions that do not create feedback loops.

Realtime should be used for:

- lobby participant changes
- waitlist changes
- lobby status changes
- relevant unread notifications
- chat messages

Realtime should not be used to write back to the same table just because an update was received.

Implementation rules:

- subscribe only to the rows the current user or current lobby needs
- unsubscribe on screen exit
- never create notifications from a notification subscription event
- never refresh the whole app state from every realtime event
- use small targeted refetches when needed
- keep manual refresh available as a fallback

Exit criteria:

- No automatic 5-second polling loop
- Realtime subscriptions are scoped and cleaned up
- No subscription event triggers the same write path again
- Manual refresh still works

## Phase 4: Query And Data Optimization

Goal: reduce egress and make every common screen cheap to load.

Work items:

- replace broad `select('*')` calls with explicit columns where possible
- add limits and pagination to lists
- avoid returning large text fields when a list only needs summary data
- avoid fetching unrelated notifications, lobbies, players, ratings, or chat messages
- inspect the biggest Supabase Query Performance entries after the notification fix
- add missing indexes for common filters and joins
- verify RLS policies are not forcing expensive scans

Priority screens:

- home lobby list
- lobby detail
- notifications
- profile
- friends and invites
- chat
- rating flow

Exit criteria:

- common screens use explicit fields and bounded queries
- fresh query report shows no obvious runaway query
- database indexes match the production access patterns

## Phase 5: Native Build Readiness

Goal: make the Expo app ready for real iOS and Android builds.

Work items:

- add production bundle identifiers in `app.json`
- add Android package name
- add iOS build number and Android version code
- add app icon, adaptive Android icon, splash screen, and notification icon assets
- configure EAS build profiles
- verify environment variables for dev, preview, and production
- verify deep links or universal links if needed
- test on real iOS and Android devices
- remove web-only assumptions from core flows

Likely current gaps:

- native app identifiers need final values
- store-ready assets need to be verified
- EAS build config needs to be added or confirmed
- device QA has not been completed yet

Exit criteria:

- internal Android build installs on a real device
- internal iOS build installs through TestFlight or development build
- app opens, logs in, and completes core flows on devices
- no required app asset is missing

## Phase 6: Store Compliance And Production Policy

Goal: prepare for Apple App Store and Google Play review.

Work items:

- create privacy policy
- create support/contact page or support email
- complete Google Play Data Safety answers
- complete Apple privacy nutrition labels
- verify authentication and account handling
- decide whether account deletion is required in-app and implement if needed
- document user-generated content handling
- add report/block/moderation flows if needed for public user content
- prepare demo account for reviewers if login is required
- prepare screenshots, descriptions, and store metadata

Exit criteria:

- Apple review requirements are covered
- Google Play policy requirements are covered
- store metadata and screenshots are ready
- reviewer can access the app without confusion

## Phase 7: Product QA

Goal: prove the V1 product works through real user journeys, not just isolated screens.

Core flows to test:

- sign up
- log in
- complete player profile
- browse lobbies
- create lobby
- join lobby
- request exception approval
- approve or reject request as host
- use waitlist
- invite friend
- receive notification
- open notification target
- use lobby chat
- submit post-match rating
- update profile
- log out and log back in

Regression checks:

- no blank page on web preview
- no broken native screen
- no infinite loading state
- no duplicate notifications
- no runaway database writes
- no huge egress spike from normal use

Exit criteria:

- all core flows pass on real devices
- known bugs are either fixed or explicitly accepted
- V1 release notes are written

## Phase 8: Release Candidate

Goal: freeze the branch and prepare for release.

Work items:

- run final TypeScript check
- run final build checks
- create release candidate tag or branch
- submit internal test builds
- collect tester feedback
- fix release-blocking issues only
- submit to stores

Exit criteria:

- production Supabase is stable
- native builds are installable
- store assets and compliance are ready
- no known release blocker remains

## Highest Priority Order

1. Stop runaway database activity
2. Clean and index Supabase tables
3. Move critical writes server-side
4. Add scoped realtime instead of polling
5. Optimize expensive reads
6. Prepare native builds
7. Finish store compliance
8. Complete device QA
9. Release V1

## Simple Explanation

The MVP proved the app flow. V1 needs the same app to behave like a real production app: no runaway database writes, no expensive polling, no fragile client-only business logic, real native builds, store-ready assets, privacy/compliance coverage, and real-device QA.

The next smartest move is to make Supabase quiet and predictable first. After that, realtime and native release work become much safer.
