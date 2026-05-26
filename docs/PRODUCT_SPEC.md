# TOCA Product Specification

Version: 1.0 merged draft  
Status: Final working spec for MVP planning  
Product name: TOCA  
Initial UI language: English  
Future language support: Hebrew and English, with RTL support planned from the start  
Platform: React Native, Expo, TypeScript, Supabase later

## 1. Product Summary

TOCA is a mobile-first app for amateur footvolley players in Israel.

The core job of the product is:

> Help players find, create, join, and coordinate real-life footvolley games with the right people, at the right level, in the right place.

TOCA is not only a lobby list. It is a coordination and trust layer for real games. The MVP should make it easy to:

- Find nearby games.
- Understand whether a game fits the player's level and gender rules.
- Create a game quickly.
- Join, request access, or wait for a spot.
- Coordinate with other players in lobby chat.
- Manage substitutes, equipment, attendance, and post-game ratings.
- Build reliable long-term player reputation through skill rank, TOCA points, and behavior signals.

## 2. Product Principles

- Mobile first.
- English UI for the first MVP.
- Build with future Hebrew/RTL support in mind.
- Fast, practical workflows over decorative screens.
- Real-world coordination matters more than social feed behavior.
- Skill rank, behavior, and TOCA points are connected but not identical.
- MVP can use mock data first, but data structures should be ready for Supabase.

## 3. MVP Scope

Included in MVP:

- Authentication placeholder or simple login flow.
- Player profile.
- Lobby browsing.
- Lobby creation.
- Lobby details.
- Join flow.
- Join request flow for locked or out-of-filter players.
- Waitlist.
- Substitutes.
- Two lobby chat channels.
- Equipment coordination.
- Friends and invites.
- Internal notifications.
- Post-game rating popup.
- TOCA points foundation.
- Future reports infrastructure.
- Basic admin-ready data model.

Not included in first MVP:

- Payments.
- Full map experience.
- Real push notifications.
- Full reporting and blocking UX.
- Appeals.
- Full polished admin panel.
- School partnerships as an active feature.
- Advanced automatic ranking algorithm.

## 4. Users And Roles

### Player

A player can:

- Create a profile.
- Browse lobbies.
- Filter lobbies.
- Create a lobby.
- Join an eligible open lobby.
- Request to join a locked lobby.
- Request to join a lobby when outside level or gender filters.
- Join a waitlist.
- Become a substitute.
- Chat in lobby channels according to access.
- Mark equipment they bring.
- Invite friends.
- Leave or cancel participation.
- Rate other participants after a game.
- Earn or lose TOCA points.

### Lobby Admin

The lobby admin is the player who created the lobby.

Lobby admin can:

- Edit lobby details.
- Approve or reject join requests.
- Approve players outside level or gender filters.
- Move players between joined, substitute, and waitlist states.
- Remove players.
- Mark no-shows.
- Manage lobby chat moderation.
- Invite players.
- Share external invite links.

Lobby admin cannot:

- Cancel the game.

If the admin leaves, admin ownership should transfer according to a product rule. Default recommendation: transfer to another joined player. If no joined players remain, the lobby may be deleted or closed depending on implementation state.

### System Admin

System admins need future access to:

- Users.
- Lobbies.
- Participants.
- Ratings.
- TOCA points.
- Reports.
- Suspicious activity.
- Manual corrections.
- Admin action logs.

The MVP does not require a polished admin UI, but the data model must support admin review later.

## 5. Authentication And Onboarding

Preferred future auth:

- Phone verification.
- Google login may be added later.

MVP may start with simple/mock auth if needed.

Required onboarding fields:

- Name.
- Gender: male or female.
- Area or preferred locations.
- Skill rank or "I do not know my rank".
- Preferred foot: left, right, or both.

Recommended profile fields:

- Profile photos.
- Side: left, right, or both.
- Titles/free-text bio.
- Professional school badges, future-ready.
- Has ball.
- Has court marks.
- Friends.
- Games played.
- TOCA points.

After onboarding, players cannot freely change their own skill rank. Rank changes should come from ratings, admin correction, or future ranking logic.

## 6. Player Levels

Public skill levels:

```text
A-, A, A+, B-, B, B+, C-, C, C+, D-, D, D+, E-, E, E+, League
```

`A-` is the lowest level.  
`League` is the highest level and comes after `E+`.

Level is public because it is used for lobby quality and eligibility.

Level status values:

- `self_declared`: chosen by the player during onboarding.
- `initial_rating`: early rating data exists.
- `stabilizing`: enough games exist for the level to start becoming reliable.
- `established`: level is considered more reliable.

## 7. Ranking Philosophy

TOCA has three reputation layers:

- Skill rank: expert/playing level, from `A-` through `League`.
- TOCA points: community, activity, reliability, and contribution score.
- Behavior signals: no-shows, late cancellations, reports, and moderation events.

In MVP, these systems can be stored and displayed separately.

Long term, the overall ranking system should use all three:

- Skill rank for playing ability.
- TOCA points for positive community participation.
- Behavior signals for trust and reliability.

Skill rank should not be directly affected by punctuality, friendliness, cancellation behavior, or "play again" answers. Those belong to TOCA points and behavior.

## 8. Locations

TOCA supports both curated locations and free-text descriptions.

Location data should support:

- Country.
- City or area.
- Curated location name.
- Coordinates when available.
- Address when available.
- Meeting point.
- Optional court description.
- Free-text description bubble for extra instructions.
- Active/hidden flag.

Browse should prioritize upcoming games closest to the user when location data is available.

## 9. Lobby Definition

A lobby is a scheduled one-time real-life footvolley game.

Default game size is 4 players, but a lobby can support 4 to 6 players.

A lobby can include:

- Joined players.
- Substitutes.
- Waitlisted players.
- Pending join requests.
- Admins/co-admins in the future.

The lobby is used for coordination before and around the game. Ratings open one hour after the game start time.

## 10. Lobby Creation

Required fields:

- Lobby title.
- Location.
- Date.
- Start time.
- Capacity.
- Accepted level rule.
- Gender rule.
- Visibility or join policy.

Optional fields:

- Notes.
- Free-text location description bubble.
- Private code/password.
- Invite link.
- Competitive level.
- Waitlist enabled.
- Equipment needed: ball, court marks, none.

Creation window:

- Players can create lobbies up to one week in advance.

## 11. Lobby Visibility And Access

Lobby visibility/access types:

- Public open.
- Public but approval required.
- Private code/password.
- Invite link.

Eligibility filters:

- Skill level.
- Gender.
- Capacity.
- Private access requirements.

If a player is outside level or gender criteria:

- They cannot enter the full lobby directly.
- They cannot see protected lobby details.
- They can submit a join request.
- The lobby admin can approve the exception.

If approved by admin:

- The player can join or be assigned to joined/substitute/waitlist depending on capacity and admin choice.

## 12. Gender Rules

Player profile gender values:

- Male.
- Female.

Lobby gender rule values:

- Male.
- Female.
- Everyone.

If a player's gender does not match the lobby rule, they cannot enter the lobby directly, but they can submit an exception request for admin approval.

## 13. Level Rules

Lobby level rules:

- Exact level.
- Level range.
- Any level.

Examples:

- `D`
- `C-` to `E+`
- `B` to `League`
- Any level

If a player's skill rank does not match the lobby rule, they cannot enter the lobby directly, but they can submit an exception request for admin approval.

## 14. Capacity

Lobby capacity supports:

- Fixed capacity, for example exactly 4, 5, or 6 players.
- Flexible capacity, for example minimum 4 and maximum 6.

Status behavior:

- Below minimum: missing players.
- At or above minimum and below maximum: playable and still open.
- At maximum: full.
- When full: waitlist may remain open.

## 15. Joining And Requests

If the lobby is open, the player is eligible, and there is room:

- The player can join automatically.

If the lobby is full:

- The player can join the waitlist if enabled.

If the lobby is locked, private, or the player is outside gender/level filters:

- The player can submit a join request.
- The admin can approve or reject.
- Requests should show why approval is needed: locked lobby, gender exception, level exception, or multiple reasons.

No automatic waitlist promotion in MVP:

- When a spot opens, the lobby remains missing a player until the admin promotes someone or a player manually joins.

## 16. Waitlist And Substitutes

### Waitlist

A waitlisted player:

- Is waiting for an available spot.
- Does not count as an active participant.
- Does not rate or get rated unless moved into an active role.
- Can access the all-lobby chat channel.

### Substitute

A substitute:

- Is approved by the admin.
- Arrives at the game.
- Can participate in rotations.
- Counts as an active participant.
- Can rate and be rated after the game.
- Has access to both lobby chat channels.

## 17. Lobby Chat

Each lobby has two chat channels:

### All Channel

Visible to:

- Joined players.
- Substitutes.
- Waitlisted players.
- Admin.

Purpose:

- General coordination.
- Arrival details.
- Equipment updates.
- Last-minute logistics.

### Admin And Joined Channel

Visible to:

- Admin.
- Joined players.
- Substitutes.

Not visible to:

- Waitlisted players.

Purpose:

- Active participant coordination.
- More specific game logistics.

Locked, unapproved, or ineligible users cannot access either chat channel.

Chat closes after the game lifecycle closes. The exact retention period is an open decision.

## 18. Equipment

Lobby equipment supports:

- Ball.
- Court marks.

Players can mark:

- Bringing ball.
- Bringing court marks.
- Bringing both.
- Not bringing equipment.

Admin can mark whether a specific item is needed.

Equipment does not directly add TOCA points in MVP.

## 19. Friends And Invites

MVP includes friends and invites.

Capabilities:

- Add friends.
- Invite friends to a lobby.
- Show recently played-with players.
- Share external invite link, for example WhatsApp.

Invite behavior:

- Public/open lobby links can lead to the lobby preview or lobby.
- Private or protected lobbies may still require code, link validation, or admin approval.
- Out-of-filter invitees still require admin approval.

## 20. Attendance And Cancellations

Cancellation rules:

- Cancellation at least two hours before the game is on time.
- Cancellation less than two hours before the game is late.
- No-show is when a player does not cancel and does not arrive.

Default attendance:

- Approved active participants are assumed to have attended.

Exceptions:

- Admin marks no-show.
- Player cancelled before the game.
- Player was removed.
- Player was only waitlisted and never promoted.

Late cancellation and no-show affect TOCA points and behavior signals, not skill rank directly.

## 21. Game Lifecycle

Lifecycle statuses:

- `draft`
- `open`
- `full`
- `in_progress`
- `rating_open`
- `completed`
- `closed`

Admin cannot cancel the game.

Rules:

- Before start time, eligible users can join or request access.
- After start time, normal joining closes.
- Admin can still manually adjust active participants after start time.
- One hour after start time, rating tasks open.
- The next time a player opens the app, the rating popup should appear if they have pending rating tasks.

## 22. Post-Game Rating Popup

Post-game rating is shown as a popup the next time the player opens the app after rating tasks are available.

The player must handle every other active participant from that game.

For each other active participant, the player can:

- Submit a rating.
- Skip that player.

All active participants must be rated or skipped before the rating task is considered completed.

Only active participants rate and get rated:

- Joined players.
- Substitutes.

Not rated:

- Waitlisted players who were not promoted.
- No-shows.
- Removed players.

## 23. Rating Questions

For each rated player:

Skill question:

- Much below their current level.
- Below their current level.
- Matches their current level.
- Above their current level.
- Much above their current level.

Punctuality question:

- On time.
- Around on time.
- Late.

Play-again question:

- Yes.
- Maybe.
- No.

No free-text personal comments in MVP rating.

## 24. Rating Privacy

Players cannot see:

- Who rated them.
- Individual answers.
- Rating history per rater.

Players can see:

- Current skill rank.
- Level status.
- Games played.
- TOCA points.

Admins can see rating data for moderation, debugging, and manual correction.

## 25. TOCA Points

TOCA points are a community and reliability score.

They are separate from skill rank in MVP, but later they become part of the full TOCA ranking system.

TOCA points can be affected by:

- Playing games.
- Rating others.
- Being rated positively on play-again.
- Late cancellation.
- No-show.
- Not completing rating tasks.
- Future behavior reports.

TOCA points are not affected by:

- Pure skill rank vote.
- Bringing ball.
- Bringing court marks.

Exact point values are an open decision.

## 26. Reports And Safety

Full report and blocking UX is future scope.

MVP should still reserve infrastructure for:

- Reporting a player.
- Linking report to a lobby.
- Reason category.
- Free-text details.
- Admin review status.

Future report reasons may include:

- No-show.
- Wrong skill level.
- Bad behavior.
- Harassment.
- Spam.
- Other.

## 27. Main Screens

### Auth

- Phone or simple MVP login.
- Future Google support.

### Onboarding

Collect core profile fields and initial skill rank.

### Home

Shows:

- My upcoming games.
- Nearby games.
- Pending ratings.
- Important notifications.
- Primary create-game action.

### Browse Lobbies

Default sorting:

- Upcoming games closest to the user.

Filters:

- Location or distance.
- Date/time.
- Level.
- Gender.
- Open/approval/private.
- Available spots.
- Waitlist available.

Lobby card shows:

- Title.
- Location.
- Date/time.
- Level rule.
- Gender rule.
- Capacity.
- Joined count.
- Waitlist count.
- Admin name/photo.
- Lock/request state.

### Lobby Details

Visible only to approved users or users allowed into the full lobby.

Sections:

- Location and time.
- Rules.
- Capacity.
- Joined players.
- Substitutes.
- Waitlist.
- Equipment.
- All chat.
- Admin/joined chat.
- Notes.
- Admin controls.

### Create Lobby

Wizard:

- When and where.
- Game details.
- Access settings.
- Equipment and notes.

### Friends And Invites

- Friend list.
- Add friend.
- Invite to lobby.
- Recently played-with players.

### Notifications

Internal MVP notifications:

- Join request received.
- Join request approved.
- Join request rejected.
- Someone left.
- Waitlist promotion.
- Rating required.
- Time/location changed.
- Admin action.

### Profile

Self profile:

- Photos.
- Name.
- Gender.
- Area/preferred locations.
- Preferred foot.
- Side.
- Skill rank.
- Level status.
- Games played.
- TOCA points.
- Friends.
- Equipment flags.
- Titles.
- Future badges.

Public profile:

- Name.
- Photo.
- Area.
- Preferred foot.
- Skill rank.
- Level status.
- Games played.
- TOCA points, if enabled for public display.

Hidden from public:

- Individual ratings.
- Who rated the player.
- Private notes.
- Phone number.

## 28. Data Model Draft

### users

- `id`
- `phone`
- `email`
- `created_at`
- `last_login_at`
- `onboarding_completed`
- `role`

### player_profiles

- `user_id`
- `name`
- `gender`
- `area`
- `public_rank`
- `rank_status`
- `rank_source`
- `toca_points_total`
- `games_played`
- `titles`
- `side`
- `preferred_foot`
- `preferred_location_ids`
- `has_ball`
- `has_court_marks`
- `professional_school_badge_ids`
- `created_at`
- `updated_at`

### player_photos

- `id`
- `user_id`
- `storage_path`
- `sort_order`
- `created_at`

### locations

- `id`
- `country`
- `city`
- `area`
- `name`
- `address`
- `latitude`
- `longitude`
- `meeting_point`
- `description`
- `court_description`
- `is_active`

### lobbies

- `id`
- `created_by_user_id`
- `primary_admin_user_id`
- `title`
- `location_id`
- `location_description`
- `scheduled_at`
- `status`
- `visibility`
- `join_policy`
- `private_code_hash`
- `invite_link_token`
- `capacity_mode`
- `min_players`
- `max_players`
- `rank_rule_type`
- `rank_min`
- `rank_max`
- `gender_rule`
- `competitive_level`
- `notes`
- `waitlist_enabled`
- `ball_needed`
- `court_marks_needed`
- `created_at`
- `updated_at`

### lobby_participants

- `id`
- `lobby_id`
- `user_id`
- `role`: `admin`, `joined`, `substitute`, `waitlist`
- `status`: `pending`, `approved`, `rejected`, `removed`, `cancelled_on_time`, `cancelled_late`, `no_show`, `attended`
- `joined_at`
- `approved_by`
- `cancelled_at`
- `removed_by`
- `marked_no_show_by`
- `brings_ball`
- `brings_court_marks`

### join_requests

- `id`
- `lobby_id`
- `user_id`
- `requested_role`
- `status`
- `reason`: `locked`, `level_exception`, `gender_exception`, `private_access`, `other`
- `message`
- `created_at`
- `resolved_at`
- `resolved_by`

### lobby_chat_channels

- `id`
- `lobby_id`
- `type`: `all`, `admin_joined`
- `created_at`

### chat_messages

- `id`
- `channel_id`
- `lobby_id`
- `user_id`
- `body`
- `created_at`
- `deleted_at`

### chat_mutes

- `id`
- `lobby_id`
- `muted_user_id`
- `muted_by_user_id`
- `created_at`

### rating_tasks

- `id`
- `lobby_id`
- `user_id`
- `status`: `open`, `completed`, `overdue`
- `opened_at`
- `completed_at`
- `due_at`

### player_ratings

- `id`
- `lobby_id`
- `rating_task_id`
- `rated_by_user_id`
- `rated_user_id`
- `skill_vote`
- `punctuality_vote`
- `play_again_vote`
- `skipped`
- `created_at`

### rank_history

- `id`
- `user_id`
- `from_rank`
- `to_rank`
- `reason`
- `source_lobby_id`
- `created_at`

### toca_points_events

- `id`
- `user_id`
- `lobby_id`
- `type`
- `points_delta`
- `metadata`
- `created_at`

### friendships

- `id`
- `requester_id`
- `receiver_id`
- `status`
- `created_at`
- `accepted_at`

### notifications

- `id`
- `user_id`
- `type`
- `title`
- `body`
- `related_lobby_id`
- `read_at`
- `created_at`

### reports

- `id`
- `lobby_id`
- `reported_user_id`
- `reported_by_user_id`
- `reason`
- `details`
- `status`
- `created_at`

### admin_actions

- `id`
- `admin_id`
- `action_type`
- `target_type`
- `target_id`
- `metadata`
- `created_at`

### professional_school_badges

- `id`
- `label`
- `logo_url`
- `is_active`

## 29. Build Phases

### Phase 0: Project Foundation

- Expo, React Native, TypeScript.
- Repo guidelines.
- Architecture docs.
- Product spec.
- Shared types.
- Theme tokens.
- Mock data.
- Typecheck script.

### Phase 1: Local UI With Mock Data

- Home.
- Browse lobbies.
- Create lobby.
- Lobby details.
- Profile.
- Friends/invites placeholder.
- Rating popup.
- Internal notifications placeholder.

### Phase 2: Auth And Profiles

- Supabase setup.
- Auth.
- Profile table.
- Onboarding.
- Profile editing.
- Session persistence.

### Phase 3: Real Lobbies

- Lobbies.
- Participants.
- Join requests.
- Level and gender filters.
- Admin approval.
- Waitlist.
- Substitutes.

### Phase 4: Chat And Coordination

- Two chat channels.
- Equipment state.
- Internal notifications.
- Admin controls.
- Chat permissions.

### Phase 5: Post-Game And Ratings

- Rating tasks open one hour after start.
- Popup on next app open.
- Rate or skip each active participant.
- Store rating data.
- Basic rank history support.

### Phase 6: TOCA Points And Trust

- TOCA points events.
- Late cancellation.
- No-show.
- Missed rating tasks.
- Basic public display.

### Phase 7: Admin And Safety

- Admin data access.
- Reports infrastructure.
- Manual correction support.
- Admin action log.

### Phase 8: Pilot

- Real user test group.
- Validate lobby creation.
- Validate join/request/waitlist flows.
- Validate rating popup.
- Validate TOCA points assumptions.
- Collect feedback.

## 30. Open Decisions

These do not block the MVP spec, but they should be answered before backend implementation:

- Exact TOCA points values for each event.
- Whether TOCA points are public by default.
- Exact algorithm for converting ratings into skill rank movement.
- When rank status changes from `self_declared` to `initial_rating`, `stabilizing`, and `established`.
- Exact admin transfer behavior if lobby admin leaves.
- Exact chat retention period after game.
- Whether users can edit gender after onboarding or only through support/admin.
- Whether private invite links are single-use, reusable, or expiring.
- Exact first curated location list.

## 31. Current Product Decisions Resolved

- Product name is TOCA.
- MVP UI starts in English.
- Hebrew and RTL support come later, but architecture should not block them.
- `League` exists after `E+`.
- Gender exists and supports male/female lobby rules.
- Out-of-filter players cannot enter directly, but can request admin approval.
- Waitlisted players can access the all-lobby chat channel.
- A second chat channel is only for admin, joined players, and substitutes.
- TOCA points exist in MVP foundation and later help determine the broader ranking system.
- Friends and invites are in scope.
- Lobby admin cannot cancel games.
- Reports are future UX but MVP infrastructure should reserve space.
- Locations support curated entries plus free-text description.
- Ratings open one hour after game start and appear as a popup on next app open.
- Rating skips do not create a penalty, but submitting ratings gives TOCA points.

