drop policy if exists "authenticated users can create notifications" on public.notifications;
drop policy if exists "players can create own-origin notifications" on public.notifications;

revoke insert, update, delete on public.locations from anon, authenticated;
revoke insert, update, delete on public.lobbies from anon, authenticated;
revoke insert, update, delete on public.lobby_memberships from anon, authenticated;

revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;
