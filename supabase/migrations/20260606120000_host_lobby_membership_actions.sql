create or replace function public.sync_lobby_host(target_lobby_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  canonical_host_id uuid;
  next_host_id uuid;
begin
  select lobbies.host_player_id
  into canonical_host_id
  from public.lobbies
  where lobbies.id = target_lobby_id
  for update;

  if canonical_host_id is null then
    raise exception 'Lobby not found.';
  end if;

  if not exists (
    select 1
    from public.lobby_memberships
    where lobby_memberships.lobby_id = target_lobby_id
      and lobby_memberships.player_id = canonical_host_id
      and lobby_memberships.status in ('joined', 'waitlisted', 'attended')
  ) then
    select lobby_memberships.player_id
    into next_host_id
    from public.lobby_memberships
    where lobby_memberships.lobby_id = target_lobby_id
      and lobby_memberships.status in ('joined', 'waitlisted', 'attended')
    order by
      case lobby_memberships.status
        when 'joined' then 0
        when 'waitlisted' then 1
        else 2
      end,
      lobby_memberships.position nulls last,
      lobby_memberships.joined_at nulls last,
      lobby_memberships.created_at
    limit 1;

    if next_host_id is null then
      update public.lobbies
      set status = 'closed'
      where id = target_lobby_id;

      update public.lobby_memberships
      set role = 'member'
      where lobby_id = target_lobby_id;

      return canonical_host_id;
    end if;

    canonical_host_id := next_host_id;

    update public.lobbies
    set host_player_id = canonical_host_id
    where id = target_lobby_id;
  end if;

  update public.lobby_memberships
  set role = case
    when player_id = canonical_host_id and status in ('joined', 'waitlisted', 'attended') then 'host'
    else 'member'
  end
  where lobby_id = target_lobby_id;

  return canonical_host_id;
end;
$$;

create or replace function public.host_move_lobby_member_to_waitlist(
  target_lobby_id uuid,
  target_player_id uuid
)
returns public.lobby_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid;
  canonical_host_id uuid;
  updated_membership public.lobby_memberships;
begin
  select players.id
  into current_player_id
  from public.players
  where players.auth_user_id = auth.uid();

  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  canonical_host_id := public.sync_lobby_host(target_lobby_id);

  if canonical_host_id <> current_player_id then
    raise exception 'Only the host can manage this lobby.';
  end if;

  if target_player_id = current_player_id then
    raise exception 'Use the lobby action to move yourself to the waitlist.';
  end if;

  update public.lobby_memberships
  set
    approved_at = now(),
    approved_by_player_id = current_player_id,
    left_at = null,
    role = 'member',
    status = 'waitlisted'
  where lobby_id = target_lobby_id
    and player_id = target_player_id
    and status in ('joined', 'attended')
  returning *
  into updated_membership;

  if updated_membership.id is null then
    raise exception 'This player is not currently joined to this lobby.';
  end if;

  return updated_membership;
end;
$$;

create or replace function public.host_update_lobby_settings(
  target_lobby_id uuid,
  next_title text,
  next_starts_at timestamptz,
  next_location_name text,
  next_location_city text,
  next_location_description text,
  next_capacity_mode text,
  next_min_players integer,
  next_max_players integer,
  next_rank_rule_type text,
  next_rank_min text,
  next_rank_max text,
  next_rank_exact text,
  next_gender_rule text,
  next_visibility text,
  next_pin_code_hash text,
  next_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid;
  canonical_host_id uuid;
  target_location_id uuid;
  active_player_count integer;
begin
  select players.id
  into current_player_id
  from public.players
  where players.auth_user_id = auth.uid();

  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  canonical_host_id := public.sync_lobby_host(target_lobby_id);

  if canonical_host_id <> current_player_id then
    raise exception 'Only the host can manage this lobby.';
  end if;

  select count(*)
  into active_player_count
  from public.lobby_memberships
  where lobby_id = target_lobby_id
    and status = 'joined';

  if next_max_players < active_player_count then
    raise exception 'Player limit cannot be lower than current joined players (%).', active_player_count;
  end if;

  select lobbies.location_id
  into target_location_id
  from public.lobbies
  where lobbies.id = target_lobby_id;

  update public.locations
  set
    city = next_location_city,
    description = next_location_description,
    name = next_location_name
  where id = target_location_id;

  update public.lobbies
  set
    capacity_mode = next_capacity_mode,
    gender_rule = next_gender_rule,
    location_description = next_location_description,
    max_players = next_max_players,
    min_players = next_min_players,
    note = next_note,
    pin_code_hash = next_pin_code_hash,
    rank_exact = next_rank_exact,
    rank_max = next_rank_max,
    rank_min = next_rank_min,
    rank_rule_type = next_rank_rule_type,
    starts_at = next_starts_at,
    title = next_title,
    visibility = next_visibility
  where id = target_lobby_id;
end;
$$;

revoke all on function public.host_move_lobby_member_to_waitlist(uuid, uuid) from public;
grant execute on function public.host_move_lobby_member_to_waitlist(uuid, uuid) to authenticated;

revoke all on function public.sync_lobby_host(uuid) from public;
grant execute on function public.sync_lobby_host(uuid) to authenticated;

revoke all on function public.host_update_lobby_settings(
  uuid,
  text,
  timestamptz,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;
grant execute on function public.host_update_lobby_settings(
  uuid,
  text,
  timestamptz,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;

do $$
declare
  lobby_to_sync uuid;
begin
  for lobby_to_sync in
    select id
    from public.lobbies
    where status in ('open', 'full', 'in_progress')
  loop
    perform public.sync_lobby_host(lobby_to_sync);
  end loop;
end;
$$;
