create or replace function public.award_match_toca_points(target_lobby_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_lobby public.lobbies;
  current_player_id uuid;
  current_teammate_id uuid;
  israel_week_start date;
  israel_next_week_start date;
  weekly_completed_count integer;
begin
  select *
  into target_lobby
  from public.lobbies
  where id = target_lobby_id;

  if target_lobby.id is null then
    raise exception 'Lobby not found.';
  end if;

  if target_lobby.status not in ('rating_open', 'completed') then
    return;
  end if;

  if cardinality(target_lobby.match_participant_ids) < 4 then
    return;
  end if;

  israel_week_start :=
    (target_lobby.starts_at at time zone 'Asia/Jerusalem')::date
    - extract(dow from (target_lobby.starts_at at time zone 'Asia/Jerusalem'))::integer;
  israel_next_week_start := israel_week_start + 7;

  foreach current_player_id in array target_lobby.match_participant_ids loop
    perform public.award_toca_points(
      current_player_id,
      'completed_match',
      100,
      target_lobby.id::text,
      target_lobby.id,
      null,
      jsonb_build_object('starts_at', target_lobby.starts_at)
    );

    foreach current_teammate_id in array target_lobby.match_participant_ids loop
      if current_teammate_id = current_player_id then
        continue;
      end if;

      if not exists (
        select 1
        from public.lobbies previous_lobby
        where previous_lobby.id <> target_lobby.id
          and previous_lobby.starts_at < target_lobby.starts_at
          and previous_lobby.status in ('rating_open', 'completed')
          and current_player_id = any(previous_lobby.match_participant_ids)
          and current_teammate_id = any(previous_lobby.match_participant_ids)
      ) then
        perform public.award_toca_points(
          current_player_id,
          'new_player_played_with',
          5,
          current_teammate_id::text,
          target_lobby.id,
          current_teammate_id,
          jsonb_build_object('starts_at', target_lobby.starts_at)
        );
      end if;
    end loop;

    select count(*)::integer
    into weekly_completed_count
    from public.lobbies weekly_lobby
    where weekly_lobby.status in ('rating_open', 'completed')
      and current_player_id = any(weekly_lobby.match_participant_ids)
      and (weekly_lobby.starts_at at time zone 'Asia/Jerusalem')::date >= israel_week_start
      and (weekly_lobby.starts_at at time zone 'Asia/Jerusalem')::date < israel_next_week_start;

    if weekly_completed_count >= 5 then
      perform public.award_toca_points(
        current_player_id,
        'weekly_five_match_bonus',
        100,
        israel_week_start::text,
        target_lobby.id,
        null,
        jsonb_build_object(
          'week_start', israel_week_start,
          'week_end', israel_next_week_start - 1,
          'completed_match_count', weekly_completed_count
        )
      );
    end if;
  end loop;
end;
$$;

create or replace function public.award_rating_toca_points(target_rating_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_rating public.player_ratings;
  target_lobby public.lobbies;
  required_target_count integer;
  submitted_target_count integer;
begin
  select *
  into target_rating
  from public.player_ratings
  where id = target_rating_id;

  if target_rating.id is null then
    return;
  end if;

  select *
  into target_lobby
  from public.lobbies
  where id = target_rating.lobby_id;

  if target_lobby.id is null then
    return;
  end if;

  perform public.award_toca_points(
    target_rating.rater_player_id,
    'rated_player',
    15,
    target_rating.id::text,
    target_rating.lobby_id,
    target_rating.rated_player_id,
    jsonb_build_object('rating_id', target_rating.id)
  );

  if cardinality(target_lobby.match_participant_ids) <= 1 then
    return;
  end if;

  required_target_count := cardinality(target_lobby.match_participant_ids) - 1;

  select count(distinct rated_player_id)::integer
  into submitted_target_count
  from public.player_ratings
  where lobby_id = target_rating.lobby_id
    and rater_player_id = target_rating.rater_player_id
    and rated_player_id = any(target_lobby.match_participant_ids);

  if submitted_target_count >= required_target_count
    and target_rating.created_at <= target_lobby.starts_at + interval '90 minutes' + interval '2 hours'
  then
    perform public.award_toca_points(
      target_rating.rater_player_id,
      'quick_rating_completion',
      10,
      target_rating.lobby_id::text,
      target_rating.lobby_id,
      null,
      jsonb_build_object('rating_id', target_rating.id)
    );
  end if;
end;
$$;

create or replace function public.sync_lobby_lifecycle(target_lobby_id uuid)
returns public.lobbies
language plpgsql
security definer
set search_path = public
as $$
declare
  target_lobby public.lobbies;
  joined_player_ids uuid[];
  joined_player_count integer;
  next_match_participant_ids uuid[];
  next_match_locked_at timestamptz;
  next_status text;
begin
  select *
  into target_lobby
  from public.lobbies
  where id = target_lobby_id
  for update;

  if target_lobby.id is null then
    raise exception 'Lobby not found.';
  end if;

  if target_lobby.status in ('draft', 'closed', 'cancelled') then
    return target_lobby;
  end if;

  select coalesce(array_agg(player_id order by position nulls last, joined_at nulls last, created_at), array[]::uuid[])
  into joined_player_ids
  from public.lobby_memberships
  where lobby_id = target_lobby_id
    and status in ('joined', 'attended');

  joined_player_count := cardinality(joined_player_ids);
  next_match_participant_ids := target_lobby.match_participant_ids;
  next_match_locked_at := target_lobby.match_locked_at;

  if now() < target_lobby.starts_at then
    if joined_player_count >= target_lobby.max_players then
      next_status := 'full';
    else
      next_status := 'open';
    end if;
  else
    if cardinality(next_match_participant_ids) = 0 and joined_player_count >= 4 then
      next_match_participant_ids := joined_player_ids;
      next_match_locked_at := now();
    end if;

    if cardinality(next_match_participant_ids) < 4 then
      if now() < target_lobby.starts_at + interval '5 minutes' then
        next_status := 'closing_soon';
      else
        next_status := 'cancelled';
      end if;
    elsif now() < target_lobby.starts_at + interval '90 minutes' then
      next_status := 'in_progress';
    elsif now() < target_lobby.starts_at + interval '1 day' + interval '90 minutes' then
      next_status := 'rating_open';
    else
      next_status := 'completed';
    end if;
  end if;

  update public.lobbies
  set
    match_locked_at = next_match_locked_at,
    match_participant_ids = next_match_participant_ids,
    status = next_status
  where id = target_lobby_id
  returning *
  into target_lobby;

  if target_lobby.status in ('rating_open', 'completed') then
    perform public.award_match_toca_points(target_lobby.id);
  end if;

  return target_lobby;
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

  perform public.award_rating_toca_points(inserted_rating.id);
  perform public.process_player_rank_batch(target_player_id);

  return inserted_rating;
exception
  when unique_violation then
    raise exception 'You already rated this player.';
end;
$$;

revoke all on function public.award_match_toca_points(uuid) from public, anon, authenticated;
revoke all on function public.award_rating_toca_points(uuid) from public, anon, authenticated;
grant execute on function public.sync_lobby_lifecycle(uuid) to authenticated;
grant execute on function public.submit_player_skill_rating(uuid, uuid, text, text, numeric) to authenticated;
