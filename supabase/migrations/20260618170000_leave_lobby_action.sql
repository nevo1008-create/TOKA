create or replace function public.leave_lobby(target_lobby_id uuid)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player public.players;
  target_lobby public.lobbies;
  current_membership public.lobby_memberships;
  remaining_member_count integer;
  joined_player_count integer;
  next_status text;
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

  if target_lobby.status not in ('open', 'full', 'closing_soon', 'cancelled') then
    return query select false, array['This game has already started, so lobby actions are closed.']::text[];
    return;
  end if;

  select *
  into current_membership
  from public.lobby_memberships
  where lobby_id = target_lobby.id
    and player_id = current_player.id
    and status in ('joined', 'waitlisted', 'attended')
  order by updated_at desc
  limit 1;

  if current_membership.id is null then
    if target_lobby.host_player_id = current_player.id then
      perform public.sync_lobby_host(target_lobby.id);
      return query select true, array[]::text[];
      return;
    end if;

    return query select false, array[]::text[];
    return;
  end if;

  select count(*)::integer
  into joined_player_count
  from public.lobby_memberships
  where lobby_id = target_lobby.id
    and status in ('joined', 'attended');

  next_status := case
    when current_membership.status = 'waitlisted' then 'cancelled_on_time'
    when target_lobby.starts_at >= now()
      and target_lobby.starts_at <= now() + interval '60 minutes'
      and joined_player_count >= 4
      then 'cancelled_late'
    else 'cancelled_on_time'
  end;

  update public.lobby_memberships
  set
    left_at = now(),
    role = 'member',
    status = next_status
  where id = current_membership.id;

  select count(*)::integer
  into remaining_member_count
  from public.lobby_memberships
  where lobby_id = target_lobby.id
    and status in ('joined', 'waitlisted', 'attended');

  if remaining_member_count = 0 then
    update public.lobbies
    set status = 'closed'
    where id = target_lobby.id;

    delete from public.notifications
    where related_lobby_id = target_lobby.id;

    delete from public.lobby_messages
    where lobby_id = target_lobby.id;

    delete from public.lobby_memberships
    where lobby_id = target_lobby.id;

    delete from public.lobbies
    where id = target_lobby.id;

    return query select true, array[]::text[];
    return;
  end if;

  if target_lobby.host_player_id = current_player.id or current_membership.role = 'host' then
    perform public.sync_lobby_host(target_lobby.id);
  else
    perform public.sync_lobby_lifecycle(target_lobby.id);
  end if;

  return query select true, array[]::text[];
end;
$function$;

revoke all on function public.leave_lobby(uuid) from public, anon;
grant execute on function public.leave_lobby(uuid) to authenticated;
