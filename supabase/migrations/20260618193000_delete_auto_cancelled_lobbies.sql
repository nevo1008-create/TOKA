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

  if previous_status <> 'cancelled' and next_status = 'cancelled' then
    for recipient_player_id in
      select distinct player_id
      from public.lobby_memberships
      where lobby_id = target_lobby_id
        and status in ('joined', 'waitlisted', 'attended')
    loop
      perform public.insert_notification_conflict_safe(
        recipient_player_id,
        null,
        target_lobby.host_player_id,
        'lobby_changed',
        target_lobby.title || ' cancelled',
        target_lobby.title || ' was cancelled because fewer than 4 players joined before the room closed.'
      );
    end loop;

    delete from public.lobbies
    where id = target_lobby_id;

    target_lobby.status := 'cancelled';
    return target_lobby;
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
$function$;

grant execute on function public.sync_lobby_lifecycle(uuid) to authenticated;
