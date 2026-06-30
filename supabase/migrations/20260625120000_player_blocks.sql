create table if not exists public.player_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_player_id uuid not null references public.players(id) on delete cascade,
  blocked_player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint player_blocks_no_self_block check (blocker_player_id <> blocked_player_id),
  constraint player_blocks_unique_pair unique (blocker_player_id, blocked_player_id)
);

create index if not exists player_blocks_blocker_player_id_idx
  on public.player_blocks(blocker_player_id, created_at desc);

create index if not exists player_blocks_blocked_player_id_idx
  on public.player_blocks(blocked_player_id);

alter table public.player_blocks enable row level security;

grant select, insert, delete on public.player_blocks to authenticated;
grant select, insert, update, delete on public.player_blocks to service_role;

drop policy if exists "Players can view their own blocked list" on public.player_blocks;
create policy "Players can view their own blocked list"
  on public.player_blocks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.id = player_blocks.blocker_player_id
        and players.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "Players can add to their own blocked list" on public.player_blocks;
create policy "Players can add to their own blocked list"
  on public.player_blocks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.players
      where players.id = player_blocks.blocker_player_id
        and players.auth_user_id = (select auth.uid())
    )
  );

drop policy if exists "Players can remove from their own blocked list" on public.player_blocks;
create policy "Players can remove from their own blocked list"
  on public.player_blocks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.id = player_blocks.blocker_player_id
        and players.auth_user_id = (select auth.uid())
    )
  );

create or replace function public.is_blocked_from_lobby_host(target_lobby public.lobbies, target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select exists (
    select 1
    from public.player_blocks
    where blocker_player_id = target_lobby.host_player_id
      and blocked_player_id = target_player_id
  );
$function$;

revoke all on function public.is_blocked_from_lobby_host(public.lobbies, uuid) from public, anon, authenticated;

create or replace function public.block_player(target_player_id uuid)
returns public.player_blocks
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player public.players;
  target_player public.players;
  next_block public.player_blocks;
begin
  select *
  into current_player
  from public.players
  where auth_user_id = auth.uid();

  if current_player.id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  if target_player_id = current_player.id then
    raise exception 'You cannot block yourself.';
  end if;

  select *
  into target_player
  from public.players
  where id = target_player_id;

  if target_player.id is null then
    raise exception 'Player not found.';
  end if;

  insert into public.player_blocks (blocker_player_id, blocked_player_id)
  values (current_player.id, target_player.id)
  on conflict (blocker_player_id, blocked_player_id) do update
  set blocked_player_id = excluded.blocked_player_id
  returning *
  into next_block;

  update public.lobby_memberships
  set
    status = 'removed',
    role = 'member',
    left_at = now()
  from public.lobbies
  where lobby_memberships.lobby_id = lobbies.id
    and lobbies.host_player_id = current_player.id
    and lobbies.status in ('open', 'full', 'closing_soon')
    and lobby_memberships.player_id = target_player.id
    and lobby_memberships.status in ('joined', 'waitlisted', 'pending_approval');

  return next_block;
end;
$function$;

revoke all on function public.block_player(uuid) from public, anon;
grant execute on function public.block_player(uuid) to authenticated;

create or replace function public.unblock_player(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player_id uuid;
begin
  select players.id
  into current_player_id
  from public.players
  where players.auth_user_id = auth.uid();

  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  delete from public.player_blocks
  where blocker_player_id = current_player_id
    and blocked_player_id = target_player_id;
end;
$function$;

revoke all on function public.unblock_player(uuid) from public, anon;
grant execute on function public.unblock_player(uuid) to authenticated;

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

  if public.is_blocked_from_lobby_host(target_lobby, current_player.id) then
    return query select false, array['This game is not available.']::text[];
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

create or replace function public.join_lobby_waitlist(target_lobby_id uuid, access_code text default null)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $function$
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

  if public.is_blocked_from_lobby_host(target_lobby, current_player.id) then
    return query select false, array['This game is not available.']::text[];
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
$function$;

create or replace function public.request_lobby_waitlist_approval(target_lobby_id uuid)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player public.players;
  target_lobby public.lobbies;
  relationship text;
  reasons text[];
  was_previously_declined boolean := false;
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

  if public.is_blocked_from_lobby_host(target_lobby, current_player.id) then
    return query select false, array['This game is not available.']::text[];
    return;
  end if;

  if not target_lobby.exception_requests_enabled then
    return query select false, array['This game does not accept exception requests.']::text[];
    return;
  end if;

  relationship := public.get_player_lobby_relationship(target_lobby.id, current_player.id);
  was_previously_declined := relationship = 'rejected';

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

  if not was_previously_declined then
    perform public.insert_notification_conflict_safe(
      target_lobby.host_player_id,
      target_lobby.id,
      current_player.id,
      'join_request_received',
      'New join request',
      current_player.display_name || ' requested approval for ' || target_lobby.title || '.'
    );
  end if;

  return query select true, array['Request sent to the host.']::text[];
end;
$function$;

revoke all on function public.join_lobby(uuid, text) from public, anon;
revoke all on function public.join_lobby_waitlist(uuid, text) from public, anon;
revoke all on function public.request_lobby_waitlist_approval(uuid) from public, anon;

grant execute on function public.join_lobby(uuid, text) to authenticated;
grant execute on function public.join_lobby_waitlist(uuid, text) to authenticated;
grant execute on function public.request_lobby_waitlist_approval(uuid) to authenticated;

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
  target_player_name text;
  eligible_count integer := 0;
  blocked_count integer := 0;
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

    select display_name
    into target_player_name
    from public.players
    where id = target_player_id;

    if target_player_name is null then
      continue;
    end if;

    if public.is_blocked_from_lobby_host(target_lobby, target_player_id) then
      blocked_count := blocked_count + 1;
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
    if blocked_count > 0 then
      return query select false, array['This player is blocked by the host and cannot be invited.']::text[], 0;
      return;
    end if;

    return query select false, array['No invite notification was sent. Refresh players and try again.']::text[], 0;
    return;
  end if;

  if blocked_count > 0 then
    return query select true, array['Invite sent. Some players were blocked by the host and were not invited.']::text[], eligible_count;
    return;
  end if;

  return query select true, array['Invite sent.']::text[], eligible_count;
end;
$function$;

revoke all on function public.send_lobby_invites(uuid, uuid[]) from public, anon;
grant execute on function public.send_lobby_invites(uuid, uuid[]) to authenticated;
