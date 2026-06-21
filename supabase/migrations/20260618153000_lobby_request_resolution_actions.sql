create or replace function public.approve_lobby_waitlist_request(
  target_lobby_id uuid,
  target_player_id uuid
)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  requested_player public.players;
  target_lobby public.lobbies;
  canonical_host_id uuid;
  now_at timestamptz := now();
  updated_membership_id uuid;
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

  canonical_host_id := public.sync_lobby_host(target_lobby.id);

  if canonical_host_id <> current_player.id then
    return query select false, array['Only the host can manage this lobby.']::text[];
    return;
  end if;

  select *
  into requested_player
  from public.players
  where id = target_player_id;

  if requested_player.id is null then
    return query select false, array['Could not find this player in the player list.']::text[];
    return;
  end if;

  update public.lobby_memberships
  set
    approved_at = now_at,
    approved_by_player_id = current_player.id,
    brings_ball = requested_player.has_ball,
    brings_court_marks = requested_player.has_court_marks,
    joined_at = now_at,
    left_at = null,
    request_message = null,
    requested_at = null,
    requested_reasons = array[]::text[],
    role = 'member',
    status = 'waitlisted'
  where lobby_id = target_lobby.id
    and player_id = requested_player.id
    and status = 'pending_approval'
  returning id
  into updated_membership_id;

  if updated_membership_id is null then
    return query select false, array['This request is no longer pending.']::text[];
    return;
  end if;

  perform public.insert_notification_conflict_safe(
    requested_player.id,
    target_lobby.id,
    current_player.id,
    'request_approved',
    'Request approved',
    'You were added to the waitlist for ' || target_lobby.title || '.'
  );

  return query select true, array[requested_player.display_name || ' approved to waitlist.']::text[];
end;
$$;

create or replace function public.reject_lobby_waitlist_request(
  target_lobby_id uuid,
  target_player_id uuid
)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  requested_player public.players;
  target_lobby public.lobbies;
  canonical_host_id uuid;
  updated_membership_id uuid;
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

  canonical_host_id := public.sync_lobby_host(target_lobby.id);

  if canonical_host_id <> current_player.id then
    return query select false, array['Only the host can manage this lobby.']::text[];
    return;
  end if;

  select *
  into requested_player
  from public.players
  where id = target_player_id;

  if requested_player.id is null then
    return query select false, array['Could not find this player in the player list.']::text[];
    return;
  end if;

  update public.lobby_memberships
  set
    declined_at = now(),
    declined_by_player_id = current_player.id,
    request_message = null,
    requested_at = null,
    requested_reasons = array[]::text[],
    status = 'declined'
  where lobby_id = target_lobby.id
    and player_id = requested_player.id
    and status = 'pending_approval'
  returning id
  into updated_membership_id;

  if updated_membership_id is null then
    return query select false, array['This request is no longer pending.']::text[];
    return;
  end if;

  perform public.insert_notification_conflict_safe(
    requested_player.id,
    target_lobby.id,
    current_player.id,
    'request_rejected',
    'Request rejected',
    'Your request for ' || target_lobby.title || ' was declined.'
  );

  return query select true, array[]::text[];
end;
$$;

create or replace function public.cancel_lobby_waitlist_request(target_lobby_id uuid)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_lobby public.lobbies;
  updated_membership_id uuid;
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

  update public.lobby_memberships
  set
    left_at = now(),
    request_message = null,
    requested_at = null,
    requested_reasons = array[]::text[],
    status = 'left'
  where lobby_id = target_lobby.id
    and player_id = current_player.id
    and status = 'pending_approval'
  returning id
  into updated_membership_id;

  if updated_membership_id is null then
    return query select false, array[]::text[];
    return;
  end if;

  return query select true, array[]::text[];
end;
$$;

revoke all on function public.approve_lobby_waitlist_request(uuid, uuid) from public, anon;
revoke all on function public.reject_lobby_waitlist_request(uuid, uuid) from public, anon;
revoke all on function public.cancel_lobby_waitlist_request(uuid) from public, anon;

grant execute on function public.approve_lobby_waitlist_request(uuid, uuid) to authenticated;
grant execute on function public.reject_lobby_waitlist_request(uuid, uuid) to authenticated;
grant execute on function public.cancel_lobby_waitlist_request(uuid) to authenticated;
