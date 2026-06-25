create or replace function public.list_my_player_blocks()
returns setof public.player_blocks
language sql
stable
security invoker
set search_path = public
as $function$
  select player_blocks.*
  from public.player_blocks
  join public.players
    on players.id = player_blocks.blocker_player_id
  where players.auth_user_id = (select auth.uid())
  order by player_blocks.created_at desc;
$function$;

revoke all on function public.list_my_player_blocks() from public, anon;
grant execute on function public.list_my_player_blocks() to authenticated;
