create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_player_id uuid not null references public.players(id) on delete cascade,
  recipient_player_id uuid not null references public.players(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_player_id <> recipient_player_id),
  unique (requester_player_id, recipient_player_id)
);

create index if not exists friend_requests_requester_idx
  on public.friend_requests(requester_player_id, status, created_at desc);

create index if not exists friend_requests_recipient_idx
  on public.friend_requests(recipient_player_id, status, created_at desc);

drop trigger if exists friend_requests_set_updated_at on public.friend_requests;
create trigger friend_requests_set_updated_at
before update on public.friend_requests
for each row execute function public.set_updated_at();

alter table public.friend_requests enable row level security;

drop policy if exists "players can read own friend requests" on public.friend_requests;
create policy "players can read own friend requests"
on public.friend_requests for select
to authenticated
using (
  exists (
    select 1 from public.players
    where players.auth_user_id = auth.uid()
      and (players.id = requester_player_id or players.id = recipient_player_id)
  )
);

create or replace function public.get_current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.players
  where auth_user_id = auth.uid()
  limit 1
$$;

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

  if not exists (
    select 1 from public.notifications
    where recipient_player_id = target_player_id
      and related_player_id = current_player_id
      and type = 'friend_request'
      and read_at is null
  ) then
    insert into public.notifications (
      recipient_player_id,
      related_player_id,
      type,
      title,
      body
    )
    values (
      target_player_id,
      current_player_id,
      'friend_request',
      'New friend request',
      current_player_name || ' wants to connect with you on TOCA.'
    );
  end if;

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

  insert into public.notifications (
    recipient_player_id,
    related_player_id,
    type,
    title,
    body
  )
  values (
    saved_request.requester_player_id,
    current_player_id,
    'friend_accepted',
    'Friend request accepted',
    current_player_name || ' accepted your friend request.'
  );

  return saved_request;
end;
$$;

create or replace function public.decline_friend_request(target_request_id uuid)
returns public.friend_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid := public.get_current_player_id();
  saved_request public.friend_requests;
begin
  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  update public.friend_requests
  set
    status = 'declined',
    responded_at = now()
  where id = target_request_id
    and recipient_player_id = current_player_id
    and status = 'pending'
  returning *
  into saved_request;

  if saved_request.id is null then
    raise exception 'Friend request is no longer pending.';
  end if;

  return saved_request;
end;
$$;

create or replace function public.cancel_friend_request(target_request_id uuid)
returns public.friend_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid := public.get_current_player_id();
  saved_request public.friend_requests;
begin
  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  update public.friend_requests
  set
    status = 'cancelled',
    responded_at = now()
  where id = target_request_id
    and requester_player_id = current_player_id
    and status = 'pending'
  returning *
  into saved_request;

  if saved_request.id is null then
    raise exception 'Friend request is no longer pending.';
  end if;

  return saved_request;
end;
$$;

create or replace function public.remove_friend(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid := public.get_current_player_id();
begin
  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  if current_player_id = target_player_id then
    raise exception 'You cannot remove yourself as a friend.';
  end if;

  update public.players
  set friend_ids = array_remove(friend_ids, target_player_id)
  where id = current_player_id;

  update public.players
  set friend_ids = array_remove(friend_ids, current_player_id)
  where id = target_player_id;
end;
$$;

revoke all on function public.get_current_player_id() from public;
grant execute on function public.get_current_player_id() to authenticated;

revoke all on function public.send_friend_request(uuid) from public;
grant execute on function public.send_friend_request(uuid) to authenticated;

revoke all on function public.accept_friend_request(uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;

revoke all on function public.decline_friend_request(uuid) from public;
grant execute on function public.decline_friend_request(uuid) to authenticated;

revoke all on function public.cancel_friend_request(uuid) from public;
grant execute on function public.cancel_friend_request(uuid) to authenticated;

revoke all on function public.remove_friend(uuid) from public;
grant execute on function public.remove_friend(uuid) to authenticated;
