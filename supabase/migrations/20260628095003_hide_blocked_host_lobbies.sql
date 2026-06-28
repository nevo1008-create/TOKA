create or replace function public.can_current_user_read_lobby(target_lobby_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $function$
declare
  current_player_id uuid;
  target_host_player_id uuid;
begin
  select players.id
  into current_player_id
  from public.players
  where players.auth_user_id = (select auth.uid());

  if current_player_id is null then
    return false;
  end if;

  select lobbies.host_player_id
  into target_host_player_id
  from public.lobbies
  where lobbies.id = target_lobby_id;

  if target_host_player_id is null then
    return false;
  end if;

  if target_host_player_id = current_player_id then
    return true;
  end if;

  return not exists (
    select 1
    from public.player_blocks
    where player_blocks.blocker_player_id = target_host_player_id
      and player_blocks.blocked_player_id = current_player_id
  );
end;
$function$;

revoke all on function public.can_current_user_read_lobby(uuid) from public, anon;
grant execute on function public.can_current_user_read_lobby(uuid) to authenticated;

drop policy if exists "authenticated lobbies are readable" on public.lobbies;
create policy "authenticated lobbies are readable"
on public.lobbies for select
to authenticated
using (public.can_current_user_read_lobby(id));

drop policy if exists "authenticated memberships are readable" on public.lobby_memberships;
create policy "authenticated memberships are readable"
on public.lobby_memberships for select
to authenticated
using (public.can_current_user_read_lobby(lobby_id));
