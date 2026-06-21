create or replace function public.get_player_lobby_relationship(
  target_lobby_id uuid,
  target_player_id uuid
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case
        when lobby_memberships.status = 'joined' then 'joined'
        when lobby_memberships.status = 'attended' then 'attended'
        when lobby_memberships.status = 'waitlisted' then 'waitlist'
        when lobby_memberships.status = 'pending_approval' then 'pending_approval'
        when lobby_memberships.status = 'declined' then 'rejected'
        else lobby_memberships.status
      end
      from public.lobby_memberships
      where lobby_memberships.lobby_id = target_lobby_id
        and lobby_memberships.player_id = target_player_id
      order by lobby_memberships.updated_at desc
      limit 1
    ),
    'none'
  )
$$;

create or replace function public.player_matches_lobby_rules(
  target_player public.players,
  target_lobby public.lobbies
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  player_rank_index integer;
  min_rank_index integer;
  max_rank_index integer;
begin
  if target_lobby.gender_rule <> 'everyone'
    and target_lobby.gender_rule <> target_player.gender
  then
    return false;
  end if;

  if target_lobby.rank_rule_type = 'any' then
    return true;
  end if;

  if target_lobby.rank_rule_type = 'exact' then
    return target_player.level = target_lobby.rank_exact;
  end if;

  player_rank_index := public.rank_index(target_player.level);
  min_rank_index := coalesce(public.rank_index(target_lobby.rank_min), 0);
  max_rank_index := coalesce(public.rank_index(target_lobby.rank_max), 15);

  return player_rank_index >= min_rank_index
    and player_rank_index <= max_rank_index;
end;
$$;

create or replace function public.get_lobby_rule_exception_reasons(
  target_player public.players,
  target_lobby public.lobbies
)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  reasons text[] := array[]::text[];
  player_rank_index integer;
  min_rank_index integer;
  max_rank_index integer;
  matches_level boolean := true;
begin
  if target_lobby.rank_rule_type = 'exact' then
    matches_level := target_player.level = target_lobby.rank_exact;
  elsif target_lobby.rank_rule_type = 'range' then
    player_rank_index := public.rank_index(target_player.level);
    min_rank_index := coalesce(public.rank_index(target_lobby.rank_min), 0);
    max_rank_index := coalesce(public.rank_index(target_lobby.rank_max), 15);
    matches_level := player_rank_index >= min_rank_index
      and player_rank_index <= max_rank_index;
  end if;

  if not matches_level then
    reasons := reasons || array['level_exception']::text[];
  end if;

  if target_lobby.gender_rule <> 'everyone'
    and target_lobby.gender_rule <> target_player.gender
  then
    reasons := reasons || array['gender_exception']::text[];
  end if;

  return reasons;
end;
$$;

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
as $$
declare
  now_at timestamptz := now();
  next_position integer;
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
    'member',
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
    role = 'member',
    status = next_status;
end;
$$;

create or replace function public.join_lobby(target_lobby_id uuid, access_code text default null)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
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
    and abs(extract(epoch from (lobbies.starts_at - target_lobby.starts_at))) < 90 * 60
  order by lobbies.starts_at
  limit 1;

  if conflict_title is not null then
    return query select false, array['Player is already joined to ' || conflict_title || ' within 90 minutes of this game.']::text[];
    return;
  end if;

  perform public.upsert_lobby_membership_from_action(target_lobby.id, current_player, 'joined');

  return query select true, array['You joined the players list.']::text[];
end;
$$;

create or replace function public.join_lobby_waitlist(target_lobby_id uuid, access_code text default null)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_lobby public.lobbies;
  relationship text;
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

  if relationship = 'waitlist' then
    return query select false, array['Player is already on the waitlist.']::text[];
    return;
  end if;

  if relationship = 'pending_approval' then
    return query select false, array['Host approval is still pending.']::text[];
    return;
  end if;

  if not target_lobby.waitlist_enabled then
    return query select false, array['This game does not have a waitlist.']::text[];
    return;
  end if;

  if target_lobby.visibility = 'password'
    and coalesce(access_code, '') <> coalesce(target_lobby.pin_code_hash, '')
  then
    return query select false, array['Enter the lobby PIN to join this private game.']::text[];
    return;
  end if;

  if not public.player_matches_lobby_rules(current_player, target_lobby) then
    if target_lobby.exception_requests_enabled then
      return query select false, array['This game requires host approval for your player details.']::text[];
    end if;

    return query select false, array['This game is locked for your player details.']::text[];
  end if;

  perform public.upsert_lobby_membership_from_action(target_lobby.id, current_player, 'waitlisted');

  return query select true, array['You joined the waitlist.']::text[];
end;
$$;

create or replace function public.request_lobby_waitlist_approval(target_lobby_id uuid)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_lobby public.lobbies;
  relationship text;
  reasons text[];
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

  if not target_lobby.exception_requests_enabled then
    return query select false, array['This game does not accept exception requests.']::text[];
    return;
  end if;

  relationship := public.get_player_lobby_relationship(target_lobby.id, current_player.id);

  if relationship = 'pending_approval' then
    return query select false, array['Player already has a pending request for this game.']::text[];
    return;
  end if;

  if relationship in ('joined', 'waitlist', 'attended') then
    return query select false, array['Player is already committed to this game.']::text[];
    return;
  end if;

  reasons := public.get_lobby_rule_exception_reasons(current_player, target_lobby);

  if target_lobby.visibility = 'password' then
    reasons := array['private_access']::text[] || reasons;
  end if;

  if cardinality(reasons) = 0 then
    reasons := array['approval_required']::text[];
  end if;

  perform public.upsert_lobby_membership_from_action(
    target_lobby.id,
    current_player,
    'pending_approval',
    reasons,
    'Requesting host approval to join the waitlist.'
  );

  perform public.insert_notification_conflict_safe(
    target_lobby.host_player_id,
    target_lobby.id,
    current_player.id,
    'join_request_received',
    'New join request',
    current_player.display_name || ' requested approval for ' || target_lobby.title || '.'
  );

  return query select true, array['Request sent to the host.']::text[];
end;
$$;

revoke all on function public.get_player_lobby_relationship(uuid, uuid) from public, anon, authenticated;
revoke all on function public.player_matches_lobby_rules(public.players, public.lobbies) from public, anon, authenticated;
revoke all on function public.get_lobby_rule_exception_reasons(public.players, public.lobbies) from public, anon, authenticated;
revoke all on function public.upsert_lobby_membership_from_action(uuid, public.players, text, text[], text) from public, anon, authenticated;

revoke all on function public.join_lobby(uuid, text) from public, anon;
revoke all on function public.join_lobby_waitlist(uuid, text) from public, anon;
revoke all on function public.request_lobby_waitlist_approval(uuid) from public, anon;

grant execute on function public.join_lobby(uuid, text) to authenticated;
grant execute on function public.join_lobby_waitlist(uuid, text) to authenticated;
grant execute on function public.request_lobby_waitlist_approval(uuid) to authenticated;
