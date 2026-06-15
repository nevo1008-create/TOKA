# TOCA Skill Ranking System

This document captures the product and implementation decisions for TOCA's skill-rank system.
It is intended for future work by the product/development team when continuing the ranking feature.

## North Star

Skill rank is TOCA's estimate of a player's real-life footvolley level.

The ranking system is core to the product. If ranks are not accurate and trusted, players have little reason to schedule games through TOCA.

Skill rank must not feel like a game progression or grind. Moving up is not a reward, and moving down is not a punishment. Rank movement should align TOCA's public rank with the player's real-life level as quickly and reliably as possible.

## Separate Concepts

TOCA has multiple reputation-like concepts, but this system is only about skill rank.

- Skill rank: real playing ability, used for lobby fit and eligibility.
- TOCA points: community, activity, reliability, and contribution score.
- Behavior signals: no-shows, late cancellations, reports, moderation, and similar trust signals.
- Player rating stars: 1-5 behavior/experience score.

Behavior and stars must not directly change the rated player's skill rank.

Behavior may be used only as a small trust modifier for the rater. A player with stronger behavior history can have their skill votes trusted slightly more, but behavior does not prove skill-rating accuracy.

## Public Rank Scale

The public rank ladder is:

```text
A-, A, A+, B-, B, B+, C-, C, C+, D-, D, D+, E-, E, E+, League
```

`A-` is the lowest rank.
`League` is the highest rank.

The internal index mapping is:

```text
A- = 0
A = 1
A+ = 2
B- = 3
B = 4
B+ = 5
C- = 6
C = 7
C+ = 8
D- = 9
D = 10
D+ = 11
E- = 12
E = 13
E+ = 14
League = 15
```

## Rating UI Decision

The player rating screen should center the rated player's profile picture and show their current rank.

The rater can choose:

- Below: treated as current rank index - 1.
- Above: treated as current rank index + 1.
- Exact rank: a specific selected rank from the full `A-` to `League` scale.

Example:

```text
Maya current rank: B+ index 5
Below => B index 4
Above => C- index 6
Exact C => C index 7
```

Exact-rank votes are stronger than Above/Below votes because they represent a more specific judgment.

Players may choose any exact rank. Extreme votes are allowed, but the algorithm dampens them unless other raters confirm the same direction.

## Eligibility

Only active players from the same match can rate and be rated.

The host/admin has no special ranking power. If the host played, they rate and get rated like every other active player.

Waitlisted-only players, removed players, no-shows, and players who did not participate should not affect skill ranking.

## Rank Update Cadence

Ranks update after every 4 received skill ratings.

Reason: most TOCA games create roughly 3-5 possible raters per player. Four received ratings maps well to a normal match cycle and avoids waiting too long.

This is 4 received ratings, not 4 matches.

## Hidden Model

Public rank is only the displayed bucket.

The backend keeps hidden ranking state:

```text
skill_score: decimal score on the 0-15 rank index scale
rank_confidence: hidden confidence value
received_skill_rating_count
processed_skill_rating_count
rater_reliability
rater_bias
```

Example:

```text
Public rank: B+
Hidden skill score: 5.62
Rank confidence: hidden
```

## Public Rank Publishing

TOCA uses stable publishing, not simple rounding.

Simple rounding would publish `C-` as soon as a `B+` player crosses `5.50`.

Stable publishing waits for a clearer signal. For an established player, `B+` should become `C-` around `5.70`, not `5.50`.

Current V1 thresholds:

```text
self_declared: public rank change gate = 0.50
initial_rating: public rank change gate = 0.55
stabilizing: public rank change gate = 0.65
established: public rank change gate = 0.70
```

This avoids rank flicker while still allowing movement.

## Consensus-Based Flexibility

Rank flexibility is based on evidence, not on total games played.

One consensus equals one processed 4-rating batch.

Current V1 flexibility:

```text
self_declared: 0 consensuses, movement factor 0.95, no movement cap
initial_rating: 1 consensus, movement factor 0.80, no movement cap
stabilizing: 2-4 consensuses, movement factor 0.65, max 4 index steps per batch
established: 5+ consensuses, movement factor 0.45, max 3 index steps per batch
```

Why:

- Self-declared ranks have the least evidence, so TOCA should correct them quickly.
- Initial rating has one real signal, but still not enough evidence to cap movement.
- Stabilizing has repeated evidence, so movement becomes more controlled.
- Established still moves, but requires stronger repeated evidence to move far.

Example movement caps:

```text
B+ to C+ = 3 steps
D to E = 3 steps
B to C+ = 4 steps
```

## Vote Weighting

Each skill vote receives a weight:

```text
voteWeight =
  voteTypeWeight
  * raterReliability
  * behaviorTrustModifier
  * rankDistanceWeight
  * outlierModifier
```

### Vote Type Weight

```text
Above/Below = 1.0
Exact rank = 1.4
```

### Rater Reliability

All raters start neutral-low:

```text
starting rater reliability = 0.75
```

Reliability is hidden.

Reliability improves when a rater's skill votes are close to later consensus.
Reliability weakens when a rater's skill votes are often far from later consensus.

A strong player is not automatically a good rater. A reliable rater is someone whose judgments are usually confirmed by group evidence.

### Behavior Trust Modifier

Behavior is only a small trust modifier for the rater.

Current V1 range:

```text
risky behavior floor = 0.75
normal = 1.00
excellent behavior ceiling = 1.08
```

The current implementation stores this modifier but does not yet calculate it from a full behavior system.

### Rank Distance Weight

Raters close to the rated player's rank are trusted most for precise rank judgment.

Higher-rank raters are still useful, but gently reduced when far away.

Lower-rank raters are reduced more when far away, because it may be harder for them to precisely evaluate players much above them.

Current V1 logic:

```text
within 0-2 rank steps: 1.00
higher by 3-5 steps: 0.90
higher by 6+ steps: 0.80
lower by 3-5 steps: 0.75
lower by 6+ steps: 0.60
```

### Outlier Modifier

Extreme votes are allowed, but dampened.

Current V1 logic:

```text
vote within 0-2 steps from current hidden score: 1.00
within 3-4 steps: 0.85
within 5-6 steps: 0.65
more than 6 steps: 0.45
```

This protects against one strange vote while still allowing strong consensus to move a rank quickly.

## Batch Consensus

Every 4 received skill ratings, TOCA calculates a batch consensus.

V1 uses:

```text
consensus = 70% weighted median + 30% weighted average
```

Why:

- Weighted median protects against one extreme or malicious vote.
- Weighted average keeps the system responsive when several raters agree.

## Hidden Score Movement

The player moves toward the batch consensus.

Current V1 formula:

```text
newScore = currentScore + ((consensus - currentScore) * movementFactor)
```

Movement factors:

```text
self_declared: 0.95
initial_rating: 0.80
stabilizing: 0.65
established: 0.45
```

Movement caps:

```text
self_declared: none
initial_rating: none
stabilizing: 4 index steps per batch
established: 3 index steps per batch
```

## Rank Status

Existing public rank status values:

```text
self_declared
initial_rating
stabilizing
established
```

V1 backend behavior:

- `self_declared`: 0 consensuses have been calculated.
- `initial_rating`: 1 consensus has been calculated.
- `stabilizing`: 2-4 consensuses have been calculated.
- `established`: 5+ consensuses have been calculated.

Important: established does not mean locked. It means TOCA has enough evidence to dampen noisy single-batch movement.

## Backend Ownership

The backend must own ranking logic.

The React Native app should only:

- Show the rating UI.
- Submit the skill vote.
- Display the public rank and status.

Supabase should:

- Validate match eligibility.
- Store skill votes.
- Batch every 4 received ratings.
- Calculate rank movement.
- Update public `players.level` and `players.rank_status`.
- Store hidden state, batch audit data, and rank history.
- Update hidden rater reliability.

This prevents client-side manipulation and makes the ranking system auditable.

## Current Implementation

Migrations:

```text
supabase/migrations/20260614145119_skill_rank_engine.sql
supabase/migrations/20260615103000_rank_state_received_count_fix.sql
supabase/migrations/20260615110500_process_rank_batch_after_rating_insert.sql
supabase/migrations/20260615112500_consensus_based_rank_status.sql
```

Main backend objects:

```text
public.rank_index(rank_value text)
public.rank_label(rank_index integer)
public.player_rank_state
public.player_rater_reliability
public.player_rank_batches
public.player_rank_batch_ratings
public.player_rank_history
public.submit_player_skill_rating(...)
```

The app now calls:

```text
public.submit_player_skill_rating(...)
```

from:

```text
src/features/ratings/ratingRepository.ts
```

The rating UI submits:

```text
skillVoteType: 'above' | 'below' | 'exact'
```

## Security Notes

Hidden ranking tables use RLS and intentionally have no broad read policies.

The app should not directly read hidden rank confidence, hidden skill score, or rater reliability.

The public player table remains the display surface for:

```text
players.level
players.rank_status
```

## Current Limitations

This is a V1 algorithm foundation. It still needs scenario testing.

Known follow-up areas:

- Add scenario tests for rank movement.
- Tune constants using realistic footvolley examples.
- Decide how behavior score should calculate `behavior_trust_modifier`.
- Decide whether users can ever see high-level rank history without hidden confidence details.
- Prevent unrestricted client-side self-editing of `players.level` after onboarding.

## Scenario Testing Ideas

Use these cases to tune the algorithm:

1. New player self-declares much too low and receives 4 exact high-rank votes.
2. New player self-declares much too high and receives 4 low votes.
3. Established player gets one extreme vote and three normal votes.
4. Established player gets 4 consistent exact votes two ranks higher.
5. Lower-rank rater gives an extreme high-rank vote.
6. Higher-rank rater gives a precise mid-rank correction.
7. A rater repeatedly rates friends above consensus.
8. A rater is consistently strict by one rank step.

The goal of testing is not to make rank movement feel rewarding. The goal is to check whether TOCA's output matches what experienced footvolley players would consider true.
