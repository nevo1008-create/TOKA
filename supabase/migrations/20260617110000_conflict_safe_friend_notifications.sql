create or replace function public.insert_notification_conflict_safe(
  target_recipient_player_id uuid,
  target_related_lobby_id uuid,
  target_related_player_id uuid,
  notification_type text,
  notification_title text,
  notification_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_player_id,
    related_lobby_id,
    related_player_id,
    type,
    title,
    body
  )
  values (
    target_recipient_player_id,
    target_related_lobby_id,
    target_related_player_id,
    notification_type,
    notification_title,
    notification_body
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.insert_notification_conflict_safe(uuid, uuid, uuid, text, text, text) from public, anon, authenticated;

create or replace function public.send_friend_request(target_player_id uuid)
returns public.friend_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid := public.get_current_player_id();
  current_player_name text;
  existing_reverse_request public.friend_requests;
  saved_request public.friend_requests;
begin
  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  if current_player_id = target_player_id then
    raise exception 'You cannot send a friend request to yourself.';
  end if;

  if not exists (select 1 from public.players where id = target_player_id) then
    raise exception 'Player not found.';
  end if;

  if exists (
    select 1 from public.players
    where id = current_player_id
      and target_player_id = any(friend_ids)
  ) then
    raise exception 'This player is already your friend.';
  end if;

  select *
  into existing_reverse_request
  from public.friend_requests
  where requester_player_id = target_player_id
    and recipient_player_id = current_player_id
    and status = 'pending'
  limit 1;

  if existing_reverse_request.id is not null then
    raise exception 'This player already sent you a friend request.';
  end if;

  insert into public.friend_requests (
    requester_player_id,
    recipient_player_id,
    status,
    responded_at
  )
  values (
    current_player_id,
    target_player_id,
    'pending',
    null
  )
  on conflict (requester_player_id, recipient_player_id) do update
  set
    status = 'pending',
    responded_at = null
  returning *
  into saved_request;

  select display_name
  into current_player_name
  from public.players
  where id = current_player_id;

  perform public.insert_notification_conflict_safe(
    target_player_id,
    null,
    current_player_id,
    'friend_request',
    'New friend request',
    current_player_name || ' wants to connect with you on TOCA.'
  );

  return saved_request;
end;
$$;

create or replace function public.accept_friend_request(target_request_id uuid)
returns public.friend_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid := public.get_current_player_id();
  current_player_name text;
  saved_request public.friend_requests;
begin
  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  update public.friend_requests
  set
    status = 'accepted',
    responded_at = now()
  where id = target_request_id
    and recipient_player_id = current_player_id
    and status = 'pending'
  returning *
  into saved_request;

  if saved_request.id is null then
    raise exception 'Friend request is no longer pending.';
  end if;

  update public.players
  set friend_ids = array(
    select distinct friend_id
    from unnest(friend_ids || saved_request.recipient_player_id) as friend_id
  )
  where id = saved_request.requester_player_id;

  update public.players
  set friend_ids = array(
    select distinct friend_id
    from unnest(friend_ids || saved_request.requester_player_id) as friend_id
  )
  where id = saved_request.recipient_player_id;

  select display_name
  into current_player_name
  from public.players
  where id = current_player_id;

  perform public.insert_notification_conflict_safe(
    saved_request.requester_player_id,
    null,
    current_player_id,
    'friend_accepted',
    'Friend request accepted',
    current_player_name || ' accepted your friend request.'
  );

  return saved_request;
end;
$$;

revoke all on function public.send_friend_request(uuid) from public;
grant execute on function public.send_friend_request(uuid) to authenticated;

revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;
