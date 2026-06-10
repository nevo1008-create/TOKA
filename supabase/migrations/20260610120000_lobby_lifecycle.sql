alter table public.lobbies
  add column if not exists match_participant_ids uuid[] not null default '{}',
  add column if not exists match_locked_at timestamptz;

alter table public.lobbies
  drop constraint if exists lobbies_status_check;

alter table public.lobbies
  add constraint lobbies_status_check
  check (status in ('draft', 'open', 'full', 'closed', 'closing_soon', 'in_progress', 'rating_open', 'completed', 'cancelled'));

comment on column public.lobbies.match_participant_ids is
  'Joined player ids locked for the actual match when it starts. Waitlisted and pending players are excluded.';

comment on column public.lobbies.match_locked_at is
  'Timestamp when match_participant_ids was locked for lifecycle/rating eligibility.';

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

  return target_lobby;
end;
$$;

grant execute on function public.sync_lobby_lifecycle(uuid) to authenticated;

drop policy if exists "players can create own final-player ratings" on public.player_ratings;
create policy "players can create own final-player ratings"
on public.player_ratings for insert
with check (
  exists (
    select 1 from public.players
    where players.id = rater_player_id
      and players.auth_user_id = auth.uid()
  )
  and exists (
    select 1 from public.lobbies
    where lobbies.id = player_ratings.lobby_id
      and (
        (
          cardinality(lobbies.match_participant_ids) > 0
          and player_ratings.rater_player_id = any(lobbies.match_participant_ids)
          and player_ratings.rated_player_id = any(lobbies.match_participant_ids)
        )
        or (
          cardinality(lobbies.match_participant_ids) = 0
          and exists (
            select 1 from public.lobby_memberships
            where lobby_memberships.lobby_id = player_ratings.lobby_id
              and lobby_memberships.player_id = player_ratings.rater_player_id
              and lobby_memberships.status in ('joined', 'attended')
          )
          and exists (
            select 1 from public.lobby_memberships
            where lobby_memberships.lobby_id = player_ratings.lobby_id
              and lobby_memberships.player_id = player_ratings.rated_player_id
              and lobby_memberships.status in ('joined', 'attended')
          )
        )
      )
  )
);
