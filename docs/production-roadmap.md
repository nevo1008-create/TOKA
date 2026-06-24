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
- Patch direct SQL notification inserts, especially `friend_accepted`, to ignore duplicate unread notifications safely
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
- substitute handling, if/when substitutes are added after MVP
- invite creation
- notification creation
- rating submission
- host approval or rejection
- TOCA points updates

MVP scope note: Phase 2 currently supports joined players, waitlisted players, pending approval, and host permissions. A substitute role exists only in product documentation for a future version; there is no active app or database substitute path to harden in this phase.

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

Phase 3 handoff note:

- The broad multi-device realtime QA pass remains required, but it is intentionally carried forward as Phase 4 Mission 1 so Phase 4 starts by proving the realtime work before deeper polish or optimization.

## Phase 4: App Quality Polish In Preview

Goal: clean and harden everything that can be confidently tested in preview before moving to real-device builds.

Mission 1 - Multi-device realtime QA gate:

- Status: Passed on June 24, 2026 after second-test confirmation of TC-09, TC-26, TC-27, and TC-30 on `v1-prep`
- Working checklist: `docs/phase4-qa-checklist.md`
- Use two real logged-in users on two browser sessions or devices
- Test the main realtime flows end to end without manual refresh as the normal success path
- Cover notifications, lobby list updates, lobby details, join/request/approve/reject/cancel/leave, waitlist movement, host transfer, chat, friends/community, and ratings/lifecycle
- Watch for stale state, duplicate banners, duplicate notifications, delayed state, confusing disabled buttons, and screens that require refresh
- Fix any stale-state edge cases found before starting the optimization missions below
- Keep manual refresh available as a fallback, but do not treat it as the normal expected behavior

Mission 2 - Copy, empty states, and errors:

- Review user-facing copy for clarity and consistency
- Polish loading states, empty states, error popups, and blocked-action messages
- Make confusing disabled buttons explain why an action is unavailable
- Clean notification wording where needed, without changing backend behavior unless required

Mission 3 - Preview layout and interaction polish:

- Check common screens in normal web preview and mobile-sized browser viewports
- Fix obvious overlap, clipped text, awkward spacing, and scroll issues
- Verify modals, sheets, chat, profile, community, lobby cards, and rating screens remain usable
- Keep mobile-first behavior as the source of truth, while remembering preview is not a replacement for real phones

Mission 4 - Stale-state and duplicate-state cleanup:

- Remove duplicate banners, duplicate notifications, repeated toasts, and stale local state
- Confirm leave/kick/host-transfer/lobby-delete/rating-complete states close or update the right screens
- Keep manual refresh as a fallback, but fix flows that normally require refresh

Mission 5 - Query and data optimization:

- Inspect the freshest Supabase Query Performance report after normal app usage
- Identify the biggest repeated reads and writes by screen or feature
- Separate historical noise from current behavior before changing code
- Replace broad `select('*')` calls with explicit columns where possible
- Add limits and pagination to list-style screens
- Avoid returning large text fields when a list only needs summary data
- Avoid fetching unrelated notifications, lobbies, players, ratings, or chat messages
- Keep realtime refetches targeted to the affected domain
- Confirm profile, community, chat, and rating screens do not over-fetch shared app data
- Add missing indexes for common filters and joins
- Verify RLS policies are not forcing expensive scans
- Re-check the query report after index or query changes

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

- Phase 4 Mission 1 realtime QA has passed or remaining issues are documented
- common confusing UI states are cleaned up
- preview and mobile-sized viewport checks do not show obvious layout breakage
- common screens use explicit fields and bounded queries
- fresh query report shows no obvious runaway query
- database indexes match the production access patterns

## Phase 5: Real Phone QA And Build Setup

Goal: run the app on real phones and fix issues that preview cannot honestly prove.

Work items:

- choose the first phone-testing path: Expo Go, Expo development build, internal Android build, or TestFlight/development iOS build
- add production bundle identifiers in `app.json`
- add Android package name
- add iOS build number and Android version code
- configure EAS build profiles
- verify environment variables for dev, preview, and production
- verify deep links or universal links if needed
- test real touch behavior, keyboard behavior, scrolling, safe areas, native modals, and screen sizes
- test realtime with two real phones or one phone plus one browser/device
- test app background/foreground behavior for realtime state recovery
- test on real iOS and Android devices
- remove web-only assumptions from core flows

Likely current gaps:

- native app identifiers need final values
- EAS build config needs to be added or confirmed
- device QA has not been completed yet

Exit criteria:

- internal Android build installs on a real device
- internal iOS build installs through TestFlight or development build
- app opens, logs in, and completes core flows on devices
- real-phone issues are fixed or documented before store preparation

## Phase 6: Production/App Store Preparation

Goal: make the app, backend, and store package ready for Apple App Store and Google Play review.

Work items:

- add app icon, adaptive Android icon, splash screen, and notification icon assets
- verify app permissions, native configuration, and production build settings
- verify production Supabase environment variables and security posture
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
- run final security and data-access checks for production Supabase

Exit criteria:

- no required app asset is missing
- production Supabase is stable and correctly configured
- Apple review requirements are covered
- Google Play policy requirements are covered
- store metadata and screenshots are ready
- reviewer can access the app without confusion

## Phase 7: Launch Candidate And Release

Goal: freeze the branch, prove the full V1 journey, and prepare the build that can go to testers or stores.

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

Work items:

- run final TypeScript check
- run final build checks
- create release candidate tag or branch
- submit internal test builds
- collect tester feedback
- fix release-blocking issues only
- submit to stores

Exit criteria:

- all core flows pass on real devices
- known bugs are either fixed or explicitly accepted
- V1 release notes are written
- production Supabase is stable
- native builds are installable
- store assets and compliance are ready
- no known release blocker remains

## Highest Priority Order

1. Stop runaway database activity
2. Clean and index Supabase tables
3. Move critical writes server-side
4. Add scoped realtime instead of polling
5. Polish preview-tested app quality and optimize expensive reads
6. Prepare native builds and complete real-phone QA
7. Finish store compliance and production setup
8. Release V1

## Simple Explanation

The MVP proved the app flow. V1 needs the same app to behave like a real production app: no runaway database writes, no expensive polling, no fragile client-only business logic, polished preview-tested UX, real native builds, store-ready assets, privacy/compliance coverage, and real-device QA.

The next smartest move is to finish the realtime branch, then start Phase 4 by proving realtime with two users before polishing UI states and optimizing expensive reads. After that, real-phone testing and native release work become much safer.
