create or replace function public.sync_player_rank_received_count(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_rank_state (player_id, skill_score)
  select players.id, public.rank_index(players.level)
  from public.players
  where players.id = target_player_id
  on conflict (player_id) do nothing;

  update public.player_rank_state
  set
    received_skill_rating_count = (
      select count(*)::integer
      from public.player_ratings
      where rated_player_id = target_player_id
    ),
    updated_at = now()
  where player_id = target_player_id;
end;
$$;

create or replace function public.update_rank_state_received_count_after_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_player_rank_received_count(new.rated_player_id);
  return new;
end;
$$;

drop trigger if exists player_ratings_sync_received_count on public.player_ratings;
create trigger player_ratings_sync_received_count
after insert on public.player_ratings
for each row execute function public.update_rank_state_received_count_after_rating();

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
  perform public.sync_player_rank_received_count(target_player_id);

  return inserted_rating;
exception
  when unique_violation then
    raise exception 'You already rated this player.';
end;
$$;

select public.sync_player_rank_received_count(players.id)
from public.players;

revoke all on function public.sync_player_rank_received_count(uuid) from public, anon, authenticated;
