create or replace function public.upsert_lobby_membership_from_action(
  target_lobby_id uuid,
  target_player public.players,
  next_status text,
  next_request_reasons text[] default array[]::text[],
  next_request_message text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  next_position integer;
  now_at timestamptz := now();
begin
  select coalesce(max(position), 0) + 1
  into next_position
  from public.lobby_memberships
  where lobby_id = target_lobby_id
    and status in ('joined', 'waitlisted', 'attended');

  insert into public.lobby_memberships (
    lobby_id,
    player_id,
    status,
    role,
    brings_ball,
    brings_court_marks,
    position,
    requested_reasons,
    request_message,
    requested_at,
    joined_at,
    left_at,
    approved_at,
    approved_by_player_id,
    declined_at,
    declined_by_player_id
  )
  values (
    target_lobby_id,
    target_player.id,
    next_status,
    case
      when exists (
        select 1
        from public.lobbies
        where id = target_lobby_id
          and host_player_id = target_player.id
      ) then 'host'
      else 'member'
    end,
    target_player.has_ball,
    target_player.has_court_marks,
    next_position,
    next_request_reasons,
    next_request_message,
    case when next_status = 'pending_approval' then now_at else null end,
    case when next_status in ('joined', 'waitlisted') then now_at else null end,
    null,
    case when next_status = 'pending_approval' then null else now_at end,
    null,
    null,
    null
  )
  on conflict (lobby_id, player_id) do update
  set
    approved_at = case when next_status = 'pending_approval' then null else now_at end,
    approved_by_player_id = null,
    brings_ball = excluded.brings_ball,
    brings_court_marks = excluded.brings_court_marks,
    declined_at = null,
    declined_by_player_id = null,
    joined_at = case when next_status in ('joined', 'waitlisted') then now_at else null end,
    left_at = null,
    position = coalesce(public.lobby_memberships.position, excluded.position),
    request_message = next_request_message,
    requested_at = case when next_status = 'pending_approval' then now_at else null end,
    requested_reasons = next_request_reasons,
    role = case
      when public.lobby_memberships.role = 'host'
        or exists (
          select 1
          from public.lobbies
          where id = target_lobby_id
            and host_player_id = target_player.id
        )
      then 'host'
      else 'member'
    end,
    status = next_status;
end;
$function$;

create or replace function public.join_lobby(target_lobby_id uuid, access_code text default null)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player public.players;
  target_lobby public.lobbies;
  relationship text;
  joined_count integer;
  conflict_title text;
begin
  select *
  into current_player
  from public.players
  where auth_user_id = auth.uid();

  if current_player.id is null then
    return query select false, array['Player profile not found for current user.']::text[];
    return;
  end if;

  target_lobby := public.sync_lobby_lifecycle(target_lobby_id);

  if target_lobby.id is null then
    return query select false, array['Lobby not found.']::text[];
    return;
  end if;

  if target_lobby.status not in ('open', 'full', 'closing_soon') then
    return query select false, array['This game has already started, so lobby actions are closed.']::text[];
    return;
  end if;

  relationship := public.get_player_lobby_relationship(target_lobby.id, current_player.id);

  if relationship in ('joined', 'attended') then
    return query select false, array['Player is already committed to this game.']::text[];
    return;
  end if;

  if relationship = 'pending_approval' then
    return query select false, array['Host approval is still pending.']::text[];
    return;
  end if;

  if relationship <> 'waitlist' then
    return query select false, array['Player must join the waitlist before moving into players.']::text[];
    return;
  end if;

  if target_lobby.visibility = 'password'
    and target_lobby.host_player_id <> current_player.id
    and coalesce(access_code, '') <> coalesce(target_lobby.pin_code_hash, '')
  then
    return query select false, array['Enter the lobby PIN to join this private game.']::text[];
    return;
  end if;

  select count(*)
  into joined_count
  from public.lobby_memberships
  where lobby_id = target_lobby.id
    and status in ('joined', 'attended');

  if joined_count >= target_lobby.max_players then
    return query select false, array['This game has no open joined-player slots.']::text[];
    return;
  end if;

  select lobbies.title
  into conflict_title
  from public.lobby_memberships
  join public.lobbies on lobbies.id = lobby_memberships.lobby_id
  where lobby_memberships.player_id = current_player.id
    and lobby_memberships.lobby_id <> target_lobby.id
    and lobby_memberships.status in ('joined', 'attended')
    and lobbies.status in ('open', 'full', 'in_progress', 'rating_open')
    and abs(extract(epoch from (lobbies.starts_at - target_lobby.starts_at))) < 90 * 60
  order by lobbies.starts_at
  limit 1;

  if conflict_title is not null then
    return query select false, array['You already have a game near this time: ' || conflict_title || '. Choose another time or leave that game first.']::text[];
    return;
  end if;

  perform public.upsert_lobby_membership_from_action(target_lobby.id, current_player, 'joined');

  return query select true, array['You joined the players list.']::text[];
end;
$function$;

grant execute on function public.join_lobby(uuid, text) to authenticated;
