create or replace function public.move_lobby_member_to_waitlist(
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
  target_player public.players;
  target_lobby public.lobbies;
  canonical_host_id uuid;
  updated_membership_id uuid;
begin
  select * into current_player from public.players where auth_user_id = auth.uid();

  if current_player.id is null then
    return query select false, array['Player profile not found for current user.']::text[];
    return;
  end if;

  target_lobby := public.sync_lobby_lifecycle(target_lobby_id);

  if target_lobby.id is null then
    return query select false, array['Lobby not found.']::text[];
    return;
  end if;

  if target_lobby.status not in ('open', 'full') then
    return query select false, array['Player and lobby settings can only be changed before the game starts.']::text[];
    return;
  end if;

  canonical_host_id := public.sync_lobby_host(target_lobby.id);

  if canonical_host_id <> current_player.id then
    return query select false, array['Only the host can manage this lobby.']::text[];
    return;
  end if;

  if target_player_id = current_player.id then
    return query select false, array['Use the lobby action to move yourself to the waitlist.']::text[];
    return;
  end if;

  select * into target_player from public.players where id = target_player_id;

  if target_player.id is null then
    return query select false, array['Could not find this player in the player list.']::text[];
    return;
  end if;

  update public.lobby_memberships
  set
    approved_at = now(),
    approved_by_player_id = current_player.id,
    left_at = null,
    role = 'member',
    status = 'waitlisted'
  where lobby_id = target_lobby.id
    and player_id = target_player.id
    and status in ('joined', 'attended')
  returning id into updated_membership_id;

  if updated_membership_id is null then
    return query select false, array['Only joined players can be moved to the waitlist.']::text[];
    return;
  end if;

  perform public.insert_notification_conflict_safe(
    target_player.id,
    target_lobby.id,
    current_player.id,
    'waitlist_update',
    'Moved to waitlist',
    'The host moved you to the waitlist for ' || target_lobby.title || '.'
  );

  return query select true, array[target_player.display_name || ' moved to waitlist.']::text[];
end;
$$;

create or replace function public.kick_lobby_participant(
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
  target_player public.players;
  target_lobby public.lobbies;
  canonical_host_id uuid;
  updated_membership_id uuid;
begin
  select * into current_player from public.players where auth_user_id = auth.uid();

  if current_player.id is null then
    return query select false, array['Player profile not found for current user.']::text[];
    return;
  end if;

  target_lobby := public.sync_lobby_lifecycle(target_lobby_id);

  if target_lobby.id is null then
    return query select false, array['Lobby not found.']::text[];
    return;
  end if;

  if target_lobby.status not in ('open', 'full') then
    return query select false, array['Player and lobby settings can only be changed before the game starts.']::text[];
    return;
  end if;

  canonical_host_id := public.sync_lobby_host(target_lobby.id);

  if canonical_host_id <> current_player.id then
    return query select false, array['Only the host can manage this lobby.']::text[];
    return;
  end if;

  if target_player_id = current_player.id then
    return query select false, array['Hosts cannot kick themselves. Use Leave game or Close lobby.']::text[];
    return;
  end if;

  select * into target_player from public.players where id = target_player_id;

  if target_player.id is null then
    return query select false, array['Could not find this player in the player list.']::text[];
    return;
  end if;

  update public.lobby_memberships
  set
    left_at = now(),
    role = 'member',
    status = 'removed'
  where lobby_id = target_lobby.id
    and player_id = target_player.id
    and status in ('joined', 'waitlisted', 'attended')
  returning id into updated_membership_id;

  if updated_membership_id is null then
    return query select false, array['This player is no longer in the lobby.']::text[];
    return;
  end if;

  perform public.insert_notification_conflict_safe(
    target_player.id,
    target_lobby.id,
    current_player.id,
    'waitlist_update',
    'Removed from lobby',
    'The host removed you from ' || target_lobby.title || '. You can join or request again later.'
  );

  return query select true, array[target_player.display_name || ' was removed from the lobby.']::text[];
end;
$$;

create or replace function public.transfer_lobby_host(
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
  target_player public.players;
  target_lobby public.lobbies;
  canonical_host_id uuid;
  updated_membership_id uuid;
begin
  select * into current_player from public.players where auth_user_id = auth.uid();

  if current_player.id is null then
    return query select false, array['Player profile not found for current user.']::text[];
    return;
  end if;

  target_lobby := public.sync_lobby_lifecycle(target_lobby_id);

  if target_lobby.id is null then
    return query select false, array['Lobby not found.']::text[];
    return;
  end if;

  if target_lobby.status not in ('open', 'full') then
    return query select false, array['Player and lobby settings can only be changed before the game starts.']::text[];
    return;
  end if;

  canonical_host_id := public.sync_lobby_host(target_lobby.id);

  if canonical_host_id <> current_player.id then
    return query select false, array['Only the host can manage this lobby.']::text[];
    return;
  end if;

  if target_player_id = current_player.id then
    return query select false, array['You are already the host.']::text[];
    return;
  end if;

  select * into target_player from public.players where id = target_player_id;

  if target_player.id is null then
    return query select false, array['Could not find this player in the player list.']::text[];
    return;
  end if;

  update public.lobby_memberships
  set
    approved_at = now(),
    approved_by_player_id = current_player.id,
    left_at = null,
    role = 'host',
    status = case
      when status = 'waitlisted' then 'waitlisted'
      else 'joined'
    end
  where lobby_id = target_lobby.id
    and player_id = target_player.id
    and status in ('joined', 'waitlisted', 'attended')
  returning id into updated_membership_id;

  if updated_membership_id is null then
    return query select false, array['Host can only be transferred to a joined or waitlisted player.']::text[];
    return;
  end if;

  update public.lobbies
  set host_player_id = target_player.id
  where id = target_lobby.id;

  update public.lobby_memberships
  set role = 'member'
  where lobby_id = target_lobby.id
    and player_id = current_player.id;

  perform public.insert_notification_conflict_safe(
    target_player.id,
    target_lobby.id,
    current_player.id,
    'lobby_changed',
    'Host transferred',
    'You are now the host for ' || target_lobby.title || '.'
  );

  return query select true, array[target_player.display_name || ' is now the host.']::text[];
end;
$$;

create or replace function public.close_lobby_by_host(target_lobby_id uuid)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_lobby public.lobbies;
  canonical_host_id uuid;
  recipient_player_id uuid;
begin
  select * into current_player from public.players where auth_user_id = auth.uid();

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

  for recipient_player_id in
    select distinct player_id
    from public.lobby_memberships
    where lobby_id = target_lobby.id
      and player_id <> current_player.id
      and status in ('joined', 'waitlisted', 'pending_approval', 'attended')
  loop
    perform public.insert_notification_conflict_safe(
      recipient_player_id,
      target_lobby.id,
      current_player.id,
      'lobby_changed',
      'Lobby closed',
      target_lobby.title || ' was closed by the host.'
    );
  end loop;

  update public.lobbies
  set status = 'closed'
  where id = target_lobby.id;

  update public.lobby_memberships
  set
    left_at = now(),
    status = 'removed'
  where lobby_id = target_lobby.id
    and status in ('joined', 'waitlisted', 'pending_approval', 'attended');

  return query select true, array['Lobby closed.']::text[];
end;
$$;

revoke all on function public.move_lobby_member_to_waitlist(uuid, uuid) from public, anon;
revoke all on function public.kick_lobby_participant(uuid, uuid) from public, anon;
revoke all on function public.transfer_lobby_host(uuid, uuid) from public, anon;
revoke all on function public.close_lobby_by_host(uuid) from public, anon;

grant execute on function public.move_lobby_member_to_waitlist(uuid, uuid) to authenticated;
grant execute on function public.kick_lobby_participant(uuid, uuid) to authenticated;
grant execute on function public.transfer_lobby_host(uuid, uuid) to authenticated;
grant execute on function public.close_lobby_by_host(uuid) to authenticated;
