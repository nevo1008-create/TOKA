drop policy if exists "hosts can update lobbies" on public.lobbies;
create policy "hosts can update lobbies"
on public.lobbies for update
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = lobbies.host_player_id
      and players.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobby_memberships
    join public.players on players.id = lobby_memberships.player_id
    where lobby_memberships.lobby_id = lobbies.id
      and lobby_memberships.role = 'host'
      and lobby_memberships.status in ('joined', 'attended')
      and players.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.players
    where players.id = lobbies.host_player_id
      and players.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobby_memberships
    join public.players on players.id = lobby_memberships.player_id
    where lobby_memberships.lobby_id = lobbies.id
      and lobby_memberships.role = 'host'
      and lobby_memberships.status in ('joined', 'attended')
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "players or hosts can update memberships" on public.lobby_memberships;
create policy "players or hosts can update memberships"
on public.lobby_memberships for update
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = lobby_memberships.player_id
      and players.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobbies
    join public.players host_player on host_player.id = lobbies.host_player_id
    where lobbies.id = lobby_memberships.lobby_id
      and host_player.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobby_memberships host_membership
    join public.players host_player on host_player.id = host_membership.player_id
    where host_membership.lobby_id = lobby_memberships.lobby_id
      and host_membership.role = 'host'
      and host_membership.status in ('joined', 'attended')
      and host_player.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.players
    where players.id = lobby_memberships.player_id
      and players.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobbies
    join public.players host_player on host_player.id = lobbies.host_player_id
    where lobbies.id = lobby_memberships.lobby_id
      and host_player.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobby_memberships host_membership
    join public.players host_player on host_player.id = host_membership.player_id
    where host_membership.lobby_id = lobby_memberships.lobby_id
      and host_membership.role = 'host'
      and host_membership.status in ('joined', 'attended')
      and host_player.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated messages are readable" on public.lobby_messages;
drop policy if exists "lobby members can read lobby messages" on public.lobby_messages;
create policy "lobby members can read lobby messages"
on public.lobby_messages for select
to authenticated
using (
  exists (
    select 1
    from public.lobby_memberships
    join public.players on players.id = lobby_memberships.player_id
    where lobby_memberships.lobby_id = lobby_messages.lobby_id
      and lobby_memberships.status in ('joined', 'waitlisted', 'attended')
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated users can create notifications" on public.notifications;
drop policy if exists "players can create own-origin notifications" on public.notifications;
create policy "players can create own-origin notifications"
on public.notifications for insert
to authenticated
with check (
  recipient_player_id is not null
  and related_player_id is not null
  and exists (
    select 1
    from public.players sender
    where sender.id = notifications.related_player_id
      and sender.auth_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.players recipient
    where recipient.id = notifications.recipient_player_id
  )
  and (
    related_lobby_id is null
    or exists (
      select 1
      from public.lobbies
      where lobbies.id = notifications.related_lobby_id
        and lobbies.host_player_id = notifications.related_player_id
    )
    or exists (
      select 1
      from public.lobby_memberships
      where lobby_memberships.lobby_id = notifications.related_lobby_id
        and lobby_memberships.player_id = notifications.related_player_id
        and lobby_memberships.status in ('joined', 'waitlisted', 'pending_approval', 'attended')
    )
  )
);
