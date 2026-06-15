create or replace function public.process_player_rank_batch(target_player_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_rating_ids uuid[];
  created_batch_id uuid;
  target_level text;
  previous_score numeric;
  previous_confidence numeric;
  previous_processed_count integer;
  previous_consensus_count integer;
  next_processed_count integer;
  next_consensus_count integer;
  weighted_average_score numeric;
  weighted_median_score numeric;
  consensus_score numeric;
  total_weight numeric;
  weighted_average_error numeric;
  batch_confidence numeric;
  next_confidence numeric;
  movement_factor numeric;
  movement_cap numeric;
  raw_next_score numeric;
  next_score numeric;
  current_public_index integer;
  normal_candidate_index integer;
  publication_gate numeric;
  next_level text;
  next_rank_status text;
begin
  select coalesce(array_agg(id order by created_at, id), array[]::uuid[])
  into pending_rating_ids
  from (
    select id, created_at
    from public.player_ratings
    where rated_player_id = target_player_id
      and processed_rank_batch_id is null
    order by created_at, id
    limit 4
  ) pending;

  if cardinality(pending_rating_ids) < 4 then
    return null;
  end if;

  insert into public.player_rank_state (player_id, skill_score)
  select players.id, public.rank_index(players.level)
  from public.players
  where players.id = target_player_id
  on conflict (player_id) do nothing;

  perform public.sync_player_rank_received_count(target_player_id);

  select players.level, state.skill_score, state.rank_confidence, state.processed_skill_rating_count
  into target_level, previous_score, previous_confidence, previous_processed_count
  from public.players
  join public.player_rank_state state on state.player_id = players.id
  where players.id = target_player_id
  for update;

  if target_level is null then
    raise exception 'Rated player not found.';
  end if;

  previous_consensus_count := floor(previous_processed_count::numeric / 4)::integer;

  with weighted_votes as (
    select
      ratings.id,
      ratings.rater_player_id,
      ratings.implied_rank_index::numeric as vote_score,
      (
        case when ratings.skill_vote_type = 'exact' then 1.4 else 1 end
        * coalesce(reliability.reliability_score, 0.75)
        * coalesce(reliability.behavior_trust_modifier, 1)
        * case
            when abs(public.rank_index(rater.level)::numeric - previous_score) <= 2 then 1
            when public.rank_index(rater.level)::numeric > previous_score and abs(public.rank_index(rater.level)::numeric - previous_score) <= 5 then 0.9
            when public.rank_index(rater.level)::numeric > previous_score then 0.8
            when public.rank_index(rater.level)::numeric < previous_score and abs(public.rank_index(rater.level)::numeric - previous_score) <= 5 then 0.75
            else 0.6
          end
        * case
            when abs(ratings.implied_rank_index::numeric - previous_score) <= 2 then 1
            when abs(ratings.implied_rank_index::numeric - previous_score) <= 4 then 0.85
            when abs(ratings.implied_rank_index::numeric - previous_score) <= 6 then 0.65
            else 0.45
          end
      )::numeric as vote_weight
    from public.player_ratings ratings
    join public.players rater on rater.id = ratings.rater_player_id
    left join public.player_rater_reliability reliability on reliability.player_id = ratings.rater_player_id
    where ratings.id = any(pending_rating_ids)
  )
  select
    sum(vote_score * vote_weight) / nullif(sum(vote_weight), 0),
    sum(vote_weight)
  into weighted_average_score, total_weight
  from weighted_votes;

  with weighted_votes as (
    select
      ratings.id,
      ratings.implied_rank_index::numeric as vote_score,
      (
        case when ratings.skill_vote_type = 'exact' then 1.4 else 1 end
        * coalesce(reliability.reliability_score, 0.75)
        * coalesce(reliability.behavior_trust_modifier, 1)
        * case
            when abs(public.rank_index(rater.level)::numeric - previous_score) <= 2 then 1
            when public.rank_index(rater.level)::numeric > previous_score and abs(public.rank_index(rater.level)::numeric - previous_score) <= 5 then 0.9
            when public.rank_index(rater.level)::numeric > previous_score then 0.8
            when public.rank_index(rater.level)::numeric < previous_score and abs(public.rank_index(rater.level)::numeric - previous_score) <= 5 then 0.75
            else 0.6
          end
        * case
            when abs(ratings.implied_rank_index::numeric - previous_score) <= 2 then 1
            when abs(ratings.implied_rank_index::numeric - previous_score) <= 4 then 0.85
            when abs(ratings.implied_rank_index::numeric - previous_score) <= 6 then 0.65
            else 0.45
          end
      )::numeric as vote_weight
    from public.player_ratings ratings
    join public.players rater on rater.id = ratings.rater_player_id
    left join public.player_rater_reliability reliability on reliability.player_id = ratings.rater_player_id
    where ratings.id = any(pending_rating_ids)
  ),
  ordered_votes as (
    select
      vote_score,
      sum(vote_weight) over (order by vote_score, id rows between unbounded preceding and current row) as running_weight,
      sum(vote_weight) over () as all_weight
    from weighted_votes
  )
  select vote_score
  into weighted_median_score
  from ordered_votes
  where running_weight >= all_weight / 2
  order by vote_score
  limit 1;

  consensus_score := (weighted_median_score * 0.7) + (weighted_average_score * 0.3);

  with weighted_votes as (
    select
      ratings.implied_rank_index::numeric as vote_score,
      (
        case when ratings.skill_vote_type = 'exact' then 1.4 else 1 end
        * coalesce(reliability.reliability_score, 0.75)
        * coalesce(reliability.behavior_trust_modifier, 1)
      )::numeric as vote_weight
    from public.player_ratings ratings
    left join public.player_rater_reliability reliability on reliability.player_id = ratings.rater_player_id
    where ratings.id = any(pending_rating_ids)
  )
  select sum(abs(vote_score - consensus_score) * vote_weight) / nullif(sum(vote_weight), 0)
  into weighted_average_error
  from weighted_votes;

  batch_confidence := greatest(0, least(1, 1 - (coalesce(weighted_average_error, 0) / 4)));
  next_confidence := least(1, greatest(0, (previous_confidence * 0.82) + (batch_confidence * 0.18) + 0.03));
  movement_factor := case
    when previous_consensus_count = 0 then 0.95
    when previous_consensus_count = 1 then 0.8
    when previous_consensus_count between 2 and 4 then 0.65
    else 0.45
  end;
  movement_cap := case
    when previous_consensus_count between 2 and 4 then 4
    when previous_consensus_count >= 5 then 3
    else null
  end;
  raw_next_score := previous_score + ((consensus_score - previous_score) * movement_factor);

  if movement_cap is not null then
    raw_next_score := least(greatest(raw_next_score, previous_score - movement_cap), previous_score + movement_cap);
  end if;

  next_score := round(least(greatest(raw_next_score, 0), 15), 2);
  current_public_index := public.rank_index(target_level);
  normal_candidate_index := least(greatest(round(next_score)::integer, 0), 15);
  publication_gate := case
    when previous_consensus_count = 0 then 0.5
    when previous_consensus_count = 1 then 0.55
    when previous_consensus_count between 2 and 4 then 0.65
    else 0.7
  end;
  next_level := target_level;

  if normal_candidate_index > current_public_index
    and next_score >= normal_candidate_index - 1 + publication_gate then
    next_level := public.rank_label(normal_candidate_index);
  elsif normal_candidate_index < current_public_index
    and next_score <= normal_candidate_index + 1 - publication_gate then
    next_level := public.rank_label(normal_candidate_index);
  end if;

  next_processed_count := previous_processed_count + 4;
  next_consensus_count := floor(next_processed_count::numeric / 4)::integer;
  next_rank_status := case
    when next_consensus_count >= 5 then 'established'
    when next_consensus_count between 2 and 4 then 'stabilizing'
    when next_consensus_count = 1 then 'initial_rating'
    else 'self_declared'
  end;

  insert into public.player_rank_batches (
    player_id,
    rating_ids,
    previous_level,
    next_level,
    previous_skill_score,
    next_skill_score,
    weighted_median_score,
    weighted_average_score,
    consensus_score,
    total_weight,
    movement_factor,
    confidence_before,
    confidence_after
  ) values (
    target_player_id,
    pending_rating_ids,
    target_level,
    next_level,
    previous_score,
    next_score,
    round(weighted_median_score, 2),
    round(weighted_average_score, 2),
    round(consensus_score, 2),
    round(total_weight, 4),
    movement_factor,
    previous_confidence,
    next_confidence
  )
  returning id into created_batch_id;

  insert into public.player_rank_batch_ratings (
    batch_id,
    rating_id,
    rater_player_id,
    vote_score,
    vote_weight,
    vote_error,
    rater_reliability_at_time,
    behavior_trust_modifier_at_time,
    rank_distance_weight_at_time,
    outlier_modifier_at_time
  )
  select
    created_batch_id,
    ratings.id,
    ratings.rater_player_id,
    ratings.implied_rank_index,
    round(weighted.vote_weight, 4),
    round(abs(ratings.implied_rank_index::numeric - consensus_score), 2),
    coalesce(reliability.reliability_score, 0.75),
    coalesce(reliability.behavior_trust_modifier, 1),
    weighted.rank_distance_weight,
    weighted.outlier_modifier
  from public.player_ratings ratings
  join public.players rater on rater.id = ratings.rater_player_id
  left join public.player_rater_reliability reliability on reliability.player_id = ratings.rater_player_id
  cross join lateral (
    select
      (case
        when abs(public.rank_index(rater.level)::numeric - previous_score) <= 2 then 1
        when public.rank_index(rater.level)::numeric > previous_score and abs(public.rank_index(rater.level)::numeric - previous_score) <= 5 then 0.9
        when public.rank_index(rater.level)::numeric > previous_score then 0.8
        when public.rank_index(rater.level)::numeric < previous_score and abs(public.rank_index(rater.level)::numeric - previous_score) <= 5 then 0.75
        else 0.6
      end)::numeric as rank_distance_weight,
      (case
        when abs(ratings.implied_rank_index::numeric - previous_score) <= 2 then 1
        when abs(ratings.implied_rank_index::numeric - previous_score) <= 4 then 0.85
        when abs(ratings.implied_rank_index::numeric - previous_score) <= 6 then 0.65
        else 0.45
      end)::numeric as outlier_modifier
  ) modifiers
  cross join lateral (
    select (
      case when ratings.skill_vote_type = 'exact' then 1.4 else 1 end
      * coalesce(reliability.reliability_score, 0.75)
      * coalesce(reliability.behavior_trust_modifier, 1)
      * modifiers.rank_distance_weight
      * modifiers.outlier_modifier
    )::numeric as vote_weight,
    modifiers.rank_distance_weight,
    modifiers.outlier_modifier
  ) weighted
  where ratings.id = any(pending_rating_ids);

  update public.player_ratings
  set processed_rank_batch_id = created_batch_id
  where id = any(pending_rating_ids);

  update public.player_rank_state
  set
    skill_score = next_score,
    rank_confidence = next_confidence,
    processed_skill_rating_count = next_processed_count,
    updated_at = now()
  where player_id = target_player_id;

  update public.players
  set
    level = next_level,
    rank_status = next_rank_status
  where id = target_player_id;

  insert into public.player_rank_history (
    batch_id,
    player_id,
    previous_level,
    next_level,
    previous_skill_score,
    next_skill_score
  ) values (
    created_batch_id,
    target_player_id,
    target_level,
    next_level,
    previous_score,
    next_score
  );

  insert into public.player_rater_reliability (player_id)
  select ratings.rater_player_id
  from public.player_ratings ratings
  where ratings.id = any(pending_rating_ids)
  on conflict (player_id) do nothing;

  update public.player_rater_reliability reliability
  set
    reliability_score = least(greatest(
      reliability.reliability_score
      + case
          when batch_rating.vote_error <= 0.75 then 0.03
          when batch_rating.vote_error <= 1.75 then 0.005
          when batch_rating.vote_error <= 3 then -0.015
          else -0.04
        end,
      0.45
    ), 1.5),
    accuracy_sample_count = reliability.accuracy_sample_count + 1,
    bias_score = round((reliability.bias_score * 0.9) + ((batch_rating.vote_score - consensus_score) * 0.1), 3),
    updated_at = now()
  from public.player_rank_batch_ratings batch_rating
  where batch_rating.batch_id = created_batch_id
    and reliability.player_id = batch_rating.rater_player_id;

  perform public.sync_player_rank_received_count(target_player_id);

  return created_batch_id;
end;
$$;

update public.players
set rank_status = case
  when floor(coalesce(rank_state.processed_skill_rating_count, 0)::numeric / 4)::integer >= 5 then 'established'
  when floor(coalesce(rank_state.processed_skill_rating_count, 0)::numeric / 4)::integer between 2 and 4
    and players.rank_status in ('self_declared', 'initial_rating') then 'stabilizing'
  when floor(coalesce(rank_state.processed_skill_rating_count, 0)::numeric / 4)::integer = 1
    and players.rank_status = 'self_declared' then 'initial_rating'
  else players.rank_status
end
from public.player_rank_state rank_state
where rank_state.player_id = players.id;
