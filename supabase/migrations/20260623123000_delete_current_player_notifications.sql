create or replace function public.delete_current_player_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid;
begin
  select id
  into current_player_id
  from public.players
  where auth_user_id = auth.uid();

  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  delete from public.notifications
  where recipient_player_id = current_player_id;
end;
$$;

revoke all on function public.delete_current_player_notifications() from public, anon;
grant execute on function public.delete_current_player_notifications() to authenticated;
