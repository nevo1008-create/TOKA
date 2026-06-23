# Phase 4 QA Test Cases

This document starts Phase 4 from `v1-prep`. Phase 4 begins by proving realtime behavior with two logged-in users before deeper preview polish or query optimization.

Manual refresh can remain available as a fallback, but a case should not pass if refresh is required for the normal success path.

## Test Session Setup

- Branch: `phase4`
- Base branch: `v1-prep`
- App target: web preview for first pass, then real devices in Phase 5
- Supabase project/environment:
- Tester:  
- Date: 
- User A: host-capable player
- User B: joining player
- User C: optional extra player for full-lobby, waitlist, and rating edge cases

## Test Rules

- Use two separate sessions, such as two browsers, normal plus incognito, or two devices.
- Keep User A and User B visible side by side whenever possible.
- Do not manually refresh unless the test step explicitly says to verify fallback refresh.
- Wait up to 5 seconds for realtime updates before marking a realtime failure.
- Record the exact screen, user, action, expected result, actual result, and whether manual refresh fixed it.
- Watch for duplicate notification banners, duplicate unread items, stale buttons, stale participant rows, and wrong host permissions.

## Suggested Test Data

- User A should be able to create lobbies.
- User B should be eligible for at least one public lobby.
- User C should be available for filling lobbies and rating scenarios.
- Have at least one lobby with normal public access.
- Have at least one lobby with approval-required access.
- Have at least one constrained lobby where User B is blocked by level, gender, full capacity, or private access.
- Have one test lobby whose start time is already rating-eligible, or can become rating-eligible during testing.

## Status Values

- Pass: behavior works without manual refresh and has no obvious duplicate/stale state.
- Fail: behavior does not work, requires refresh, creates duplicates, or shows incorrect permissions/state.
- Blocked: test cannot run because setup, environment, auth, data, or Supabase state prevents it.
- Not run: not tested yet.

## TC-00: Baseline Smoke

Goal: confirm the branch is testable before realtime QA.

Steps:

1. Start the app.
2. Log in as User A in Session A.
3. Log in as User B in Session B.
4. Confirm both users reach the main app.
5. Open Home, Games, Community, Profile, and Notifications for both users.
6. Confirm there is no blank screen, infinite loading state, or auth loop.

Expected:

- Both users can navigate core screens.
- Existing lobbies load.
- Notification count loads.
- No repeated error alerts appear.

Result:

- Status: Passed
- Notes:

## TC-01: Realtime Connection Baseline

Goal: confirm realtime-driven refreshes do not create loops or obvious stale state.

Steps:

1. Keep Session A on Home.
2. Keep Session B on Games.
3. Let both sessions idle for 60 seconds.
4. Watch notification banners, lobby cards, and console output if available.
5. Navigate between Home and Games in both sessions.

Expected:

- No repeated live notification banner appears without a new event.
- No visible refresh loop or flickering list.
- No manual refresh is required for normal navigation.
- No obvious runaway network or console warning loop appears.

Result:

- Status: Passed
- Notes:

## TC-02: Friend Request Notification

Goal: prove user-to-user notifications arrive and stay deduped.

Steps:

1. In Session A, open Community.
2. Send User B a friend request.
3. In Session B, stay on Home or Notifications without refreshing.
4. Confirm User B receives a live notification/banner or notification count change.
5. Open Notifications as User B.
6. Accept the friend request.
7. In Session A, confirm the friend/request state updates without refresh.
8. Navigate away and back to Community in both sessions.

Expected:

- User B sees exactly one unread friend request notification.
- Accepting updates both users' relationship state.
- User A does not need to refresh to see accepted/friend state.
- Notification does not duplicate after navigation.

Failure notes to capture:

- Did the notification only appear after refresh?
- Did duplicate unread notifications appear?
- Did Community still show the old pending state?

Result:

- Status: Passed
- Notes:

## TC-03: Mark Notifications Read

Goal: prove notification read state persists and does not bounce back stale.

Steps:

1. Make sure User B has at least one unread notification.
2. Open Notifications as User B.
3. Mark one notification read, or use the available mark-all-read flow.
4. Navigate to Home.
5. Navigate back to Notifications.
6. Wait 5 seconds.
7. Repeat in Session A if User A has unread notifications.

Expected:

- Read notifications remain read.
- Notification count decreases and does not bounce back.
- No duplicate live banner appears after marking read.

Result:

- Status: Passed
- Notes:

## TC-04: Public Lobby Creation Appears For Other User

Goal: prove lobby list realtime after lobby creation.

Steps:

1. In Session A, create a public lobby with a unique title, such as `QA Public 001`.
2. Keep Session B on Games.
3. Do not refresh Session B.
4. Wait up to 5 seconds.
5. Search or scroll for `QA Public 001`.
6. Open the lobby from Session B.

Expected:

- User B sees the new lobby without manual refresh.
- Lobby card displays correct title, host, location, time, level/gender rule, and access state.
- Opening the card shows the same lobby details.

Result:

- Status: Passed
- Notes:

## TC-05: Lobby Settings Update Propagates

Goal: prove lobby updates reach list and detail views.

Steps:

1. User A opens the lobby created in TC-04.
2. User B opens the same lobby details.
3. User A changes one visible setting, such as title, location, notes, time, access, or max players.
4. Keep User B on the lobby details screen.
5. Wait up to 5 seconds.
6. User B navigates back to Games.
7. Check the lobby card.

Expected:

- User B sees updated lobby details without refresh.
- Games list/card also reflects the updated values.
- No old title/card remains duplicated next to the new one.

Result:

- Status: Passed
- Notes:

## TC-06: Eligible Player Joins Public Lobby

Goal: prove join flow, participants list, and notifications update both users.

Steps:

1. User A creates or opens a public lobby with open spots.
2. User B opens the lobby details.
3. User B taps Join game.
4. Keep User A on the same lobby details.
5. Wait up to 5 seconds.
6. Check participants in both sessions.
7. Check notifications for User A if join notifications are expected.

Expected:

- User B becomes an active participant.
- User A sees User B in the participant list without refresh.
- User B's CTA changes from Join game to the correct joined/leave state.
- No duplicate participant row appears.
- No duplicate notification appears.

Result:

- Status: Passed
- Notes:

## TC-07: Double-Tap Join Protection

Goal: prove duplicate client actions do not create duplicate rows or duplicate notifications.

Steps:

1. Use a lobby where User B is not yet joined.
2. User B quickly taps Join game twice, or taps once and immediately taps again if the button remains visible.
3. Wait for the action to complete.
4. Check User A's participant list.
5. Check notifications.

Expected:

- User B appears once.
- Only one success state is shown.
- No duplicate notification or duplicate participant row is created.
- If the second tap is blocked, the message is clear and not alarming.

Result:

- Status: Passed
- Notes:

## TC-08: Player Leaves Lobby

Goal: prove leave updates both sessions and closes stale states.

Steps:

1. Start with User B joined to User A's lobby.
2. User B taps Leave.
3. Keep User A on lobby details.
4. Wait up to 5 seconds.
5. User B returns to Games and opens the same lobby again if still visible.

Expected:

- User B is removed from participant list in both sessions.
- User B sees Join game or the correct next available action.
- User A does not see stale User B row.
- User B is not stuck inside a stale selected lobby state.

Result:

- Status: Passed
- Notes:

## TC-09: Full Lobby Blocks Join And Offers Waitlist

Goal: prove full-lobby state and waitlist behavior.

Steps:

1. Create a lobby with a small max player count.
2. Fill it with User A and other test participants until active spots are full.
3. User B opens lobby details.
4. Observe primary CTA and waitlist section.
5. User B attempts the available action.

Expected:

- User B cannot join active participants if the lobby is full.
- User B sees Join waitlist, Request approval, or a clear blocked reason based on lobby rules.
- The UI does not show a misleading Join game button.
- If User B joins waitlist, User A sees User B in waitlist without refresh.

Result:

- Status: Failed
- Notes
	1. User B can still see move to players button and its pressable. but a pop message says "cannot join player"
	2. when game become with status full, joined players dont receive a notification saying that their game is full

## TC-10: Approval-Required Lobby Request

Goal: prove pending approval state and host panel realtime.

Steps:

1. User A creates an approval-required lobby.
2. User B opens it.
3. User B taps Request approval.
4. Keep User A on lobby details or host panel.
5. Wait up to 5 seconds.
6. User B stays on lobby details.

Expected:

- User A sees User B in pending requests without refresh.
- User B sees pending approval state.
- User B can cancel the request if that action is available.
- Duplicate request taps do not create duplicate pending requests.

Result:

- Status: Not run
- Notes:

## TC-11: Host Rejects Approval Request

Goal: prove rejection updates the requester and avoids stale pending state.

Steps:

1. Start from TC-10 with User B pending.
2. User A rejects User B's request.
3. Keep User B on lobby details.
4. Wait up to 5 seconds.
5. Check User B notifications.
6. Check User A host panel.

Expected:

- User B no longer sees pending approval.
- User B sees rejected or blocked state with clear wording.
- User A no longer sees the request in pending list.
- User B receives at most one rejection notification.

Result:

- Status: Not run
- Notes:

## TC-12: Host Approves Approval Request

Goal: prove approval updates requester, host, participants/waitlist, and notifications.

Steps:

1. Create another pending request from User B.
2. User A approves the request.
3. Keep User B on lobby details.
4. Wait up to 5 seconds.
5. Check participant or waitlist section depending on the approval behavior.
6. Check User B notifications.

Expected:

- User B sees approved/joined/waitlisted state without refresh.
- User A sees User B in the correct section.
- User B receives at most one approval notification.
- Pending request disappears.

Result:

- Status: Not run
- Notes:

## TC-13: Request Cancellation

Goal: prove requester can cancel without stale host panel entries.

Steps:

1. User B requests approval.
2. User A keeps host panel open.
3. User B cancels the request.
4. Wait up to 5 seconds.
5. Check User A host panel.
6. User B checks lobby CTA.

Expected:

- User A no longer sees User B in pending requests.
- User B no longer sees pending approval.
- User B can request again only if product rules allow it.
- No cancellation duplicate notification is created unless expected by product behavior.

Result:

- Status: Not run
- Notes:

## TC-14: Move Active Player To Waitlist

Goal: prove host roster actions update both users.

Steps:

1. User B joins User A's lobby as an active participant.
2. User A opens participant actions for User B.
3. User A moves User B to waitlist.
4. Keep User B on lobby details.
5. Wait up to 5 seconds.

Expected:

- User B moves from active participants to waitlist in both sessions.
- User B's available actions reflect waitlist status.
- User A does not see User B in both active and waitlist sections.
- At most one notification/banner appears.

Result:

- Status: Not run
- Notes:

## TC-15: Kick Participant

Goal: prove kicked participant state closes or updates correctly.

Steps:

1. User B is joined to User A's lobby.
2. User A kicks User B.
3. Keep User B on lobby details.
4. Wait up to 5 seconds.
5. User B navigates back to Games and reopens the lobby if visible.

Expected:

- User B is removed from participants.
- User B no longer has joined-only actions or chat access.
- User B is not stuck in a stale lobby view.
- User A sees User B removed without refresh.

Result:

- Status: Not run
- Notes:

## TC-16: Transfer Host

Goal: prove host permissions move from User A to User B in realtime.

Steps:

1. User B is an active participant in User A's lobby.
2. User A transfers host to User B.
3. Keep both users on lobby details.
4. Wait up to 5 seconds.
5. User B opens host actions.
6. User A tries to access host-only actions.

Expected:

- User B sees host controls become available.
- User A sees host controls disappear or become disabled.
- The lobby shows User B as host.
- User A cannot approve/reject/move/kick/close after transfer.
- No stale host panel remains open for User A.

Result:

- Status: Not run
- Notes:

## TC-17: New Host Performs Host Action

Goal: prove transferred host authority works end to end.

Steps:

1. Continue from TC-16 where User B is host.
2. User B edits lobby settings, moves a participant, or closes the lobby.
3. User A observes the lobby details.
4. Wait up to 5 seconds.

Expected:

- User B's host action succeeds.
- User A sees the resulting state without refresh.
- No permission error appears for User B.
- User A cannot perform the same host action after transfer.

Result:

- Status: Not run
- Notes:

## TC-18: Close Or Cancel Lobby

Goal: prove closed/cancelled lobby state removes stale interaction paths.

Steps:

1. User A or current host opens lobby details.
2. User B also opens the same lobby.
3. Host closes or cancels the lobby.
4. Wait up to 5 seconds.
5. User B checks details, Games list, and notifications.

Expected:

- User B sees closed/cancelled state without refresh.
- Join/waitlist/invite/chat actions are disabled or hidden as appropriate.
- Games list updates according to current product behavior.
- No user remains in an actionable stale lobby state.

Result:

- Status: Not run
- Notes:

## TC-19: Lobby Chat Message Delivery

Goal: prove chat messages arrive without manual refresh.

Steps:

1. User A and User B are joined to the same lobby.
2. User A opens lobby chat.
3. User B keeps lobby details open with chat closed.
4. User A sends `QA chat A to B`.
5. User B opens chat after seeing unread count or waits for message appearance.
6. User B replies `QA chat B to A`.
7. User A checks chat.

Expected:

- Messages arrive in both sessions without manual refresh.
- Message order is correct.
- Sender names/timestamps are sensible.
- Unread count appears when chat is closed and clears after opening.

Result:

- Status: Not run
- Notes:

## TC-20: Chat Access By Participant Role

Goal: prove chat channel permissions match lobby role.

Steps:

1. Test as active participant.
2. Test as waitlisted player.
3. Test as non-member if the lobby is visible.
4. Try all-lobby and joined-player chat channels.
5. Change User B from active to waitlist, then re-check chat access.

Expected:

- Active participants can access expected joined chat.
- Waitlisted players can access only the channels allowed by product rules.
- Non-members cannot access restricted chat.
- Access updates after role changes without refresh.

Result:

- Status: Not run
- Notes:

## TC-21: Invite Friend To Lobby

Goal: prove invite side effects and notification dedupe.

Steps:

1. Make User A and User B friends.
2. User A opens a lobby and invites User B.
3. Keep User B on Home or Notifications.
4. Wait up to 5 seconds.
5. User B opens the invite notification.
6. User B joins or requests approval from the invite context.

Expected:

- User B receives one invite notification.
- Notification links to the intended lobby if supported.
- Invite context grants access where product rules allow.
- User B's join/request result updates User A without refresh.

Result:

- Status: Not run
- Notes:

## TC-22: Duplicate Invite Protection

Goal: prove repeated invite attempts do not create duplicate active unread notifications.

Steps:

1. User A invites User B to the same lobby.
2. User A immediately invites User B again if UI allows it, or repeats from another path.
3. User B checks notifications.
4. User B navigates away and back to Notifications.

Expected:

- User B has at most one active unread invite notification for the same logical invite.
- UI either blocks duplicate invite or backend dedupes it.
- No repeated live banner appears for the duplicate.

Result:

- Status: Not run
- Notes:

## TC-23: Private Lobby Access Code

Goal: prove private access state and blocked messaging.

Steps:

1. User A creates a password/private lobby.
2. User B opens or attempts to open it.
3. User B tries without access code.
4. User B enters a wrong code.
5. User B enters the correct code.
6. User B joins or requests approval if allowed.

Expected:

- Without access, User B sees clear locked/private wording.
- Wrong code is rejected clearly.
- Correct code unlocks the expected actions.
- Access state does not require manual refresh after entering the correct code.

Result:

- Status: Not run
- Notes:

## TC-24: Level Or Gender Rule Block

Goal: prove blocked join explanations are clear and no invalid write happens.

Steps:

1. Create a lobby whose level or gender rule excludes User B.
2. User B opens lobby details.
3. User B attempts the available action.
4. If approval exception is available, User B requests approval.
5. If exception is unavailable, record the blocked reason.

Expected:

- User B cannot directly join if rules block joining.
- UI explains the reason.
- No invalid participant row is created.
- If exception request is allowed, it appears in User A's host panel.

Result:

- Status: Not run
- Notes:

## TC-25: Rating Flow Opens After Lifecycle

Goal: prove rating eligibility appears when lobby lifecycle reaches rating state.

Steps:

1. Use a lobby that is rating-eligible or adjust test data to make it eligible.
2. User A and User B were active match participants.
3. Open Home and lobby details in both sessions.
4. Wait for lifecycle/realtime update or trigger the normal app path that syncs lifecycle.
5. Check for Rate players action.

Expected:

- Rating action appears only for eligible participants.
- Non-participants do not see rating action.
- Rating action does not require manual refresh once lifecycle updates.

Result:

- Status: Not run
- Notes:

## TC-26: Submit Player Rating

Goal: prove rating save and completed state.

Steps:

1. Continue from TC-25.
2. User A rates User B.
3. User A returns to lobby details.
4. User B rates User A.
5. Check Home rating cards and lobby detail actions in both sessions.

Expected:

- Rating saves successfully.
- Rated target no longer appears as pending for that rater.
- "Rate players" disappears or becomes completed after all targets are rated.
- No duplicate rating task appears.
- User/profile rating summary or TOCA points update after expected backend timing.

Result:

- Status: Not run
- Notes:

## TC-27: Duplicate Rating Submit Protection

Goal: prove double submit does not create duplicate ratings or duplicate points.

Steps:

1. Open rating modal for one target.
2. Submit rating and immediately tap submit again if possible.
3. Wait for completion.
4. Reopen rating flow if available.
5. Check rating task state.

Expected:

- Only one rating is saved for the same rater/target/lobby.
- The UI does not show the same target as still unrated.
- No duplicate TOCA points event is visible if points are shown.

Result:

- Status: Not run
- Notes:

## TC-28: Navigation Stale-State Regression

Goal: prove selected lobby and modal state resets correctly.

Steps:

1. User B opens a lobby details screen.
2. User A closes, cancels, kicks User B, or transfers host while User B is still there.
3. User B navigates Home -> Games -> Profile -> Games.
4. User B opens another lobby.
5. User B opens and closes chat, notifications, and any visible modal.

Expected:

- User B is not stuck on deleted/closed/stale lobby state.
- Old modals do not remain open for the wrong lobby.
- Chat sheet closes or updates when access is lost.
- New lobby details are correct.

Result:

- Status: Not run
- Notes:

## TC-29: Manual Refresh Fallback

Goal: confirm manual refresh still helps when realtime fails, without treating it as a pass for realtime.

Steps:

1. Pick one flow that failed realtime, if any.
2. Use the available manual refresh/navigation fallback.
3. Record whether refresh fixes state.

Expected:

- Manual refresh recovers latest backend state.
- The original realtime case remains failed if refresh was needed.
- Recovery does not create duplicate notifications or rows.

Result:

- Status: Not run
- Notes:

## TC-30: Query And Duplicate Smoke After QA Session

Goal: catch obvious database growth or duplicate side effects after normal use.

Steps:

1. After running the tests, inspect notifications for Users A and B.
2. Look for repeated identical unread notifications.
3. Inspect lobby participants for duplicate rows in the UI.
4. Inspect rating tasks for repeated pending/completed states.
5. If Supabase Query Performance is available, record top repeated reads/writes after the session.

Expected:

- No obvious duplicate active notifications.
- No duplicate participant rows.
- No repeated rating tasks.
- No obvious runaway query/write pattern after normal app use.

Result:

- Status: Not run
- Notes:

## Failure Report Template

Use this for every failed or suspicious case.

```text
Case:
User/session:
Screen:
Action:
Expected:
Actual:
Did it fix after manual refresh? Yes/No
Duplicate rows/notifications? Yes/No
Console or Supabase error:
Screenshot/video:
Severity: Blocker / High / Medium / Low
Suggested owner/next step:
```

## Phase 4 Mission 1 Exit

Mission 1 is complete when every test case above is either passed or has a documented issue with an owner and next step.

Do not start Phase 4 Mission 5 query optimization until realtime failures and duplicate-state bugs from Mission 1 are understood.
