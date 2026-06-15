-- Smoke test for the TOCA skill-rank engine.
--
-- Run this in the Supabase SQL editor or psql after applying the
-- skill_rank_engine migration. It wraps all test data in a transaction
-- and rolls back at the end.

begin;

do $$
declare
  target_player_id uuid := '90000000-0000-4000-8000-000000000001';
  rater_one_id uuid := '90000000-0000-4000-8000-000000000002';
  rater_two_id uuid := '90000000-0000-4000-8000-000000000003';
  rater_three_id uuid := '90000000-0000-4000-8000-000000000004';
  rater_four_id uuid := '90000000-0000-4000-8000-000000000005';
  test_location_id uuid := '90000000-0000-4000-8000-000000000101';
  test_lobby_id uuid := '90000000-0000-4000-8000-000000000201';
  created_batch_id uuid;
  next_level text;
  next_score numeric;
  processed_count integer;
  history_count integer;
begin
  insert into public.players (
    id,
    display_name,
    gender,
    level,
    rank_status,
    toca_points,
    games_played,
    preferred_foot,
    side,
    area,
    initials
  ) values
    (target_player_id, 'Rank Target', 'male', 'B+', 'self_declared', 0, 3, 'right', 'both', 'Test', 'RT'),
    (rater_one_id, 'Close Rater', 'male', 'B+', 'established', 0, 18, 'right', 'both', 'Test', 'CR'),
    (rater_two_id, 'Nearby Rater', 'female', 'C-', 'established', 0, 20, 'right', 'both', 'Test', 'NR'),
    (rater_three_id, 'Higher Rater', 'male', 'D', 'established', 0, 25, 'right', 'both', 'Test', 'HR'),
    (rater_four_id, 'Lower Rater', 'female', 'A+', 'established', 0, 22, 'right', 'both', 'Test', 'LR');

  insert into public.locations (id, name, city, area)
  values (test_location_id, 'Rank Test Beach', 'Tel Aviv', 'Test');

  insert into public.lobbies (
    id,
    host_player_id,
    location_id,
    title,
    starts_at,
    status,
    min_players,
    max_players,
    rank_rule_type,
    gender_rule,
    match_participant_ids,
    match_locked_at
  ) values (
    test_lobby_id,
    rater_one_id,
    test_location_id,
    'Rank engine smoke test',
    now() - interval '2 hours',
    'rating_open',
    4,
    5,
    'any',
    'everyone',
    array[target_player_id, rater_one_id, rater_two_id, rater_three_id, rater_four_id],
    now() - interval '2 hours'
  );

  insert into public.player_ratings (
    lobby_id,
    rater_player_id,
    rated_player_id,
    rank_vote,
    behavior_rating,
    skill_vote_type,
    skill_vote_rank,
    implied_rank_index
  ) values
    (test_lobby_id, rater_one_id, target_player_id, 'D+', 4.5, 'exact', 'D+', public.rank_index('D+')),
    (test_lobby_id, rater_two_id, target_player_id, 'D+', 4.5, 'exact', 'D+', public.rank_index('D+')),
    (test_lobby_id, rater_three_id, target_player_id, 'D+', 4.5, 'exact', 'D+', public.rank_index('D+')),
    (test_lobby_id, rater_four_id, target_player_id, 'D+', 4.5, 'exact', 'D+', public.rank_index('D+'));

  created_batch_id := public.process_player_rank_batch(target_player_id);

  if created_batch_id is null then
    raise exception 'Expected a rank batch to be created.';
  end if;

  select players.level, rank_state.skill_score, rank_state.processed_skill_rating_count
  into next_level, next_score, processed_count
  from public.players
  join public.player_rank_state rank_state on rank_state.player_id = players.id
  where players.id = target_player_id;

  if processed_count <> 4 then
    raise exception 'Expected 4 processed skill ratings, got %.', processed_count;
  end if;

  if next_score <= public.rank_index('B+') then
    raise exception 'Expected hidden skill score to move above B+, got %.', next_score;
  end if;

  if next_level = 'B+' then
    raise exception 'Expected public level to move after four strong D+ votes.';
  end if;

  select count(*)
  into history_count
  from public.player_rank_history
  where batch_id = created_batch_id
    and player_id = target_player_id;

  if history_count <> 1 then
    raise exception 'Expected one rank history row, got %.', history_count;
  end if;

  raise notice 'Skill-rank smoke test passed. Batch %, public level %, hidden score %.',
    created_batch_id,
    next_level,
    next_score;
end;
$$;

rollback;
