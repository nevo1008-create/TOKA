create or replace function public.rank_index(rank_value text)
returns integer
language sql
immutable
as $$
  select coalesce(array_position(
    array['A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League'],
    rank_value
  ) - 1, 0);
$$;

create or replace function public.rank_label(rank_index integer)
returns text
language sql
immutable
as $$
  select (array['A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League'])[
    least(greatest(rank_index, 0), 15) + 1
  ];
$$;

create table if not exists public.player_rank_state (
  player_id uuid primary key references public.players(id) on delete cascade,
  skill_score numeric(5, 2) not null,
  rank_confidence numeric(5, 4) not null default 0,
  received_skill_rating_count integer not null default 0 check (received_skill_rating_count >= 0),
  processed_skill_rating_count integer not null default 0 check (processed_skill_rating_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_rater_reliability (
  player_id uuid primary key references public.players(id) on delete cascade,
  reliability_score numeric(5, 4) not null default 0.75 check (reliability_score >= 0.45 and reliability_score <= 1.5),
  accuracy_sample_count integer not null default 0 check (accuracy_sample_count >= 0),
  bias_score numeric(6, 3) not null default 0,
  behavior_trust_modifier numeric(5, 4) not null default 1 check (behavior_trust_modifier >= 0.75 and behavior_trust_modifier <= 1.08),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_rank_batches (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  rating_ids uuid[] not null,
  previous_level text not null,
  next_level text not null,
  previous_skill_score numeric(5, 2) not null,
  next_skill_score numeric(5, 2) not null,
  weighted_median_score numeric(5, 2) not null,
  weighted_average_score numeric(5, 2) not null,
  consensus_score numeric(5, 2) not null,
  total_weight numeric(8, 4) not null,
  movement_factor numeric(5, 4) not null,
  confidence_before numeric(5, 4) not null,
  confidence_after numeric(5, 4) not null,
  created_at timestamptz not null default now(),
  check (cardinality(rating_ids) = 4)
);

create table if not exists public.player_rank_batch_ratings (
  batch_id uuid not null references public.player_rank_batches(id) on delete cascade,
  rating_id uuid not null references public.player_ratings(id) on delete cascade,
  rater_player_id uuid not null references public.players(id) on delete cascade,
  vote_score numeric(5, 2) not null,
  vote_weight numeric(8, 4) not null,
  vote_error numeric(5, 2) not null,
  rater_reliability_at_time numeric(5, 4) not null,
  behavior_trust_modifier_at_time numeric(5, 4) not null,
  rank_distance_weight_at_time numeric(5, 4) not null,
  outlier_modifier_at_time numeric(5, 4) not null,
  primary key (batch_id, rating_id)
);

create table if not exists public.player_rank_history (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.player_rank_batches(id) on delete set null,
  player_id uuid not null references public.players(id) on delete cascade,
  previous_level text not null,
  next_level text not null,
  previous_skill_score numeric(5, 2) not null,
  next_skill_score numeric(5, 2) not null,
  reason text not null default 'rating_batch',
  created_at timestamptz not null default now()
);

alter table public.player_ratings
  add column if not exists skill_vote_type text,
  add column if not exists skill_vote_rank text,
  add column if not exists implied_rank_index integer,
  add column if not exists processed_rank_batch_id uuid references public.player_rank_batches(id) on delete set null;

alter table public.player_ratings
  drop constraint if exists player_ratings_skill_vote_type_check,
  add constraint player_ratings_skill_vote_type_check
  check (skill_vote_type in ('below', 'above', 'exact'));

alter table public.player_ratings
  drop constraint if exists player_ratings_skill_vote_rank_check,
  add constraint player_ratings_skill_vote_rank_check
  check (
    skill_vote_rank is null
    or skill_vote_rank in ('A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League')
  );

alter table public.player_ratings
  drop constraint if exists player_ratings_implied_rank_index_check,
  add constraint player_ratings_implied_rank_index_check
  check (implied_rank_index is null or implied_rank_index between 0 and 15);

update public.player_ratings
set
  skill_vote_type = coalesce(skill_vote_type, 'exact'),
  skill_vote_rank = coalesce(skill_vote_rank, rank_vote),
  implied_rank_index = coalesce(implied_rank_index, public.rank_index(rank_vote))
where skill_vote_type is null
  or skill_vote_rank is null
  or implied_rank_index is null;

alter table public.player_ratings
  alter column skill_vote_type set default 'exact',
  alter column skill_vote_type set not null,
  alter column implied_rank_index set not null;

create index if not exists player_ratings_rank_batch_pending_idx
on public.player_ratings(rated_player_id, created_at)
where processed_rank_batch_id is null;

create index if not exists player_rank_batches_player_id_created_at_idx
on public.player_rank_batches(player_id, created_at desc);

create index if not exists player_rank_history_player_id_created_at_idx
on public.player_rank_history(player_id, created_at desc);

insert into public.player_rank_state (player_id, skill_score)
select players.id, public.rank_index(players.level)
from public.players
on conflict (player_id) do nothing;

insert into public.player_rater_reliability (player_id)
select players.id
from public.players
on conflict (player_id) do nothing;

create or replace function public.initialize_player_rank_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_rank_state (player_id, skill_score)
  values (new.id, public.rank_index(new.level))
  on conflict (player_id) do nothing;

  insert into public.player_rater_reliability (player_id)
  values (new.id)
  on conflict (player_id) do nothing;

  return new;
end;
$$;

drop trigger if exists players_initialize_rank_state on public.players;
create trigger players_initialize_rank_state
after insert on public.players
for each row execute function public.initialize_player_rank_state();

create or replace function public.normalize_player_skill_rating()
returns trigger
language plpgsql
as $$
begin
  new.skill_vote_type := coalesce(new.skill_vote_type, 'exact');

  if new.skill_vote_type = 'exact' then
    new.skill_vote_rank := coalesce(new.skill_vote_rank, new.rank_vote);
    new.implied_rank_index := coalesce(new.implied_rank_index, public.rank_index(new.skill_vote_rank));
    new.rank_vote := coalesce(new.rank_vote, new.skill_vote_rank);
  end if;

  if new.implied_rank_index is null then
    raise exception 'Skill vote must include an implied rank index.';
  end if;

  if new.rank_vote is null then
    new.rank_vote := public.rank_label(new.implied_rank_index);
  end if;

  return new;
end;
$$;

drop trigger if exists player_ratings_normalize_skill_vote on public.player_ratings;
create trigger player_ratings_normalize_skill_vote
before insert or update on public.player_ratings
for each row execute function public.normalize_player_skill_rating();

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
  target_rank_status text;
  target_games_played integer;
  previous_score numeric;
  previous_confidence numeric;
  previous_processed_count integer;
  next_processed_count integer;
  weighted_average_score numeric;
  weighted_median_score numeric;
  consensus_score numeric;
  total_weight numeric;
  weighted_average_error numeric;
  batch_confidence numeric;
  next_confidence numeric;
  movement_factor numeric;
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

  select players.level, players.rank_status, players.games_played, state.skill_score, state.rank_confidence, state.processed_skill_rating_count
  into target_level, target_rank_status, target_games_played, previous_score, previous_confidence, previous_processed_count
  from public.players
  join public.player_rank_state state on state.player_id = players.id
  where players.id = target_player_id
  for update;

  if target_level is null then
    raise exception 'Rated player not found.';
  end if;

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
  movement_factor := case when target_games_played < 10 then 0.9 else 0.55 end;
  raw_next_score := previous_score + ((consensus_score - previous_score) * movement_factor);

  if target_games_played >= 10 then
    raw_next_score := least(greatest(raw_next_score, previous_score - 3), previous_score + 3);
  end if;

  next_score := round(least(greatest(raw_next_score, 0), 15), 2);
  current_public_index := public.rank_index(target_level);
  normal_candidate_index := least(greatest(round(next_score)::integer, 0), 15);
  publication_gate := case when target_games_played < 10 then 0.55 else 0.7 end;
  next_level := target_level;

  if normal_candidate_index > current_public_index
    and next_score >= normal_candidate_index - 1 + publication_gate then
    next_level := public.rank_label(normal_candidate_index);
  elsif normal_candidate_index < current_public_index
    and next_score <= normal_candidate_index + 1 - publication_gate then
    next_level := public.rank_label(normal_candidate_index);
  end if;

  next_processed_count := previous_processed_count + 4;
  next_rank_status := case
    when target_games_played >= 10 and next_confidence >= 0.6 then 'established'
    when next_processed_count >= 8 then 'stabilizing'
    else 'initial_rating'
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
    received_skill_rating_count = received_skill_rating_count + 4,
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

  return created_batch_id;
end;
$$;

create or replace function public.submit_player_skill_rating(
  target_lobby_id uuid,
  target_player_id uuid,
  skill_vote_type text,
  exact_rank_vote text default null,
  submitted_behavior_rating numeric default null
)
returns public.player_ratings
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_player_id uuid;
  target_lobby public.lobbies;
  target_player public.players;
  implied_index integer;
  inserted_rating public.player_ratings;
begin
  if skill_vote_type not in ('below', 'above', 'exact') then
    raise exception 'Unsupported skill vote type.';
  end if;

  select id
  into acting_player_id
  from public.players
  where auth_user_id = auth.uid();

  if acting_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  if acting_player_id = target_player_id then
    raise exception 'Players cannot rate themselves.';
  end if;

  perform public.sync_lobby_lifecycle(target_lobby_id);

  select *
  into target_lobby
  from public.lobbies
  where id = target_lobby_id;

  if target_lobby.id is null then
    raise exception 'Lobby not found.';
  end if;

  if target_lobby.status not in ('rating_open', 'completed') then
    raise exception 'Ratings are not open for this lobby.';
  end if;

  select *
  into target_player
  from public.players
  where id = target_player_id;

  if target_player.id is null then
    raise exception 'Rated player not found.';
  end if;

  if cardinality(target_lobby.match_participant_ids) > 0 then
    if not (
      acting_player_id = any(target_lobby.match_participant_ids)
      and target_player_id = any(target_lobby.match_participant_ids)
    ) then
      raise exception 'Only final match participants can rate this lobby.';
    end if;
  else
    if not exists (
      select 1
      from public.lobby_memberships
      where lobby_id = target_lobby_id
        and player_id = acting_player_id
        and status in ('joined', 'attended')
    ) or not exists (
      select 1
      from public.lobby_memberships
      where lobby_id = target_lobby_id
        and player_id = target_player_id
        and status in ('joined', 'attended')
    ) then
      raise exception 'Only active match participants can rate this lobby.';
    end if;
  end if;

  implied_index := case skill_vote_type
    when 'below' then greatest(public.rank_index(target_player.level) - 1, 0)
    when 'above' then least(public.rank_index(target_player.level) + 1, 15)
    else public.rank_index(exact_rank_vote)
  end;

  if skill_vote_type = 'exact' and exact_rank_vote is null then
    raise exception 'Exact skill votes require an exact rank.';
  end if;

  insert into public.player_ratings (
    lobby_id,
    rater_player_id,
    rated_player_id,
    rank_vote,
    behavior_rating,
    skill_vote_type,
    skill_vote_rank,
    implied_rank_index
  ) values (
    target_lobby_id,
    acting_player_id,
    target_player_id,
    public.rank_label(implied_index),
    coalesce(submitted_behavior_rating, 3.5),
    skill_vote_type,
    case when skill_vote_type = 'exact' then exact_rank_vote else null end,
    implied_index
  )
  returning *
  into inserted_rating;

  perform public.process_player_rank_batch(target_player_id);

  return inserted_rating;
exception
  when unique_violation then
    raise exception 'You already rated this player.';
end;
$$;

alter table public.player_rank_state enable row level security;
alter table public.player_rater_reliability enable row level security;
alter table public.player_rank_batches enable row level security;
alter table public.player_rank_batch_ratings enable row level security;
alter table public.player_rank_history enable row level security;

revoke all on function public.process_player_rank_batch(uuid) from public, anon, authenticated;
grant execute on function public.submit_player_skill_rating(uuid, uuid, text, text, numeric) to authenticated;
grant select, insert, update on public.player_rank_state to authenticated;
grant select, insert, update on public.player_rater_reliability to authenticated;
grant select, insert on public.player_rank_batches to authenticated;
grant select, insert on public.player_rank_batch_ratings to authenticated;
grant select, insert on public.player_rank_history to authenticated;
