create or replace function public.send_lobby_invites(
  target_lobby_id uuid,
  target_player_ids uuid[]
)
returns table(success boolean, messages text[], sent_count integer)
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player public.players;
  target_lobby public.lobbies;
  target_player_id uuid;
  eligible_count integer := 0;
begin
  select *
  into current_player
  from public.players
  where auth_user_id = auth.uid();

  if current_player.id is null then
    return query select false, array['Player profile not found for current user.']::text[], 0;
    return;
  end if;

  target_lobby := public.sync_lobby_lifecycle(target_lobby_id);

  if target_lobby.id is null then
    return query select false, array['Lobby not found.']::text[], 0;
    return;
  end if;

  if target_lobby.status not in ('open', 'full', 'closing_soon') then
    return query select false, array['This game is no longer open for invites.']::text[], 0;
    return;
  end if;

  if not exists (
    select 1
    from public.lobby_memberships
    where lobby_id = target_lobby.id
      and player_id = current_player.id
      and status in ('joined', 'waitlisted', 'pending_approval', 'attended')
  ) then
    return query select false, array['Only players in this lobby can invite others.']::text[], 0;
    return;
  end if;

  for target_player_id in
    select distinct requested_player_id
    from unnest(coalesce(target_player_ids, array[]::uuid[])) as requested_player_id
  loop
    if target_player_id = current_player.id then
      continue;
    end if;

    if not exists (select 1 from public.players where id = target_player_id) then
      continue;
    end if;

    if exists (
      select 1
      from public.lobby_memberships
      where lobby_id = target_lobby.id
        and player_id = target_player_id
        and status in ('joined', 'waitlisted', 'pending_approval', 'attended')
    ) then
      continue;
    end if;

    perform public.insert_notification_conflict_safe(
      target_player_id,
      target_lobby.id,
      current_player.id,
      'room_invite',
      'New invite request',
      current_player.display_name || ' invited you to ' || target_lobby.title || '.'
    );

    eligible_count := eligible_count + 1;
  end loop;

  if eligible_count = 0 then
    return query select false, array['No invite notification was sent. Refresh players and try again.']::text[], 0;
    return;
  end if;

  return query select true, array['Invite sent.']::text[], eligible_count;
end;
$function$;

revoke all on function public.send_lobby_invites(uuid, uuid[]) from public, anon;
grant execute on function public.send_lobby_invites(uuid, uuid[]) to authenticated;

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
as $function$
declare
  current_player_id uuid;
  canonical_host_id uuid;
  target_lobby public.lobbies;
  target_location public.locations;
  active_player_count integer;
  has_meaningful_edit boolean;
  recipient_player_id uuid;
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

  select *
  into target_lobby
  from public.lobbies
  where id = target_lobby_id;

  if target_lobby.id is null then
    raise exception 'Lobby not found.';
  end if;

  if target_lobby.starts_at <= now() then
    raise exception 'Host tools close when the match starts.';
  end if;

  if next_starts_at <= now() then
    raise exception 'Lobby start time must be in the future.';
  end if;

  select count(*)
  into active_player_count
  from public.lobby_memberships
  where lobby_id = target_lobby_id
    and status = 'joined';

  if next_max_players < active_player_count then
    raise exception 'Player limit cannot be lower than current joined players (%).', active_player_count;
  end if;

  select *
  into target_location
  from public.locations
  where id = target_lobby.location_id;

  has_meaningful_edit :=
    target_lobby.starts_at is distinct from next_starts_at
    or target_location.name is distinct from next_location_name
    or target_location.city is distinct from next_location_city
    or coalesce(target_lobby.location_description, '') is distinct from coalesce(next_location_description, '')
    or target_lobby.min_players is distinct from next_min_players
    or target_lobby.max_players is distinct from next_max_players;

  update public.locations
  set
    city = next_location_city,
    description = next_location_description,
    name = next_location_name
  where id = target_lobby.location_id;

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

  if has_meaningful_edit then
    for recipient_player_id in
      select distinct player_id
      from public.lobby_memberships
      where lobby_id = target_lobby_id
        and player_id <> current_player_id
        and status in ('joined', 'waitlisted', 'attended')
    loop
      perform public.insert_notification_conflict_safe(
        recipient_player_id,
        target_lobby_id,
        current_player_id,
        'lobby_changed',
        'Lobby updated',
        target_lobby.title || ' date, place, or player count was updated by the host.'
      );
    end loop;
  end if;
end;
$function$;

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
) from public, anon;
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

create or replace function public.sync_lobby_lifecycle(target_lobby_id uuid)
returns public.lobbies
language plpgsql
security definer
set search_path = public
as $function$
declare
  target_lobby public.lobbies;
  previous_status text;
  joined_player_ids uuid[];
  joined_player_count integer;
  next_match_participant_ids uuid[];
  next_match_locked_at timestamptz;
  next_status text;
  recipient_player_id uuid;
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

  previous_status := target_lobby.status;

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

  if previous_status <> 'cancelled' and next_status = 'cancelled' then
    for recipient_player_id in
      select distinct player_id
      from public.lobby_memberships
      where lobby_id = target_lobby_id
        and status in ('joined', 'waitlisted', 'attended')
    loop
      perform public.insert_notification_conflict_safe(
        recipient_player_id,
        target_lobby_id,
        target_lobby.host_player_id,
        'lobby_changed',
        'Lobby cancelled',
        target_lobby.title || ' was cancelled because fewer than 4 players joined before the room closed.'
      );
    end loop;
  end if;

  if target_lobby.status in ('rating_open', 'completed') then
    perform public.award_match_toca_points(target_lobby.id);
  end if;

  return target_lobby;
end;
$function$;

grant execute on function public.sync_lobby_lifecycle(uuid) to authenticated;
