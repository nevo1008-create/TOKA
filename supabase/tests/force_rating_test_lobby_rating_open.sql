-- One-off test helper for the current rating-system QA session.
--
-- Purpose:
-- Move the lobby named "rating test" hosted by "Tal Hunga" into rating_open
-- so the post-game rating screens can be tested immediately.
--
-- Run this in the Supabase SQL editor only for the shared dev/test project.

begin;

alter table public.lobbies disable trigger lobbies_starts_in_future;

do $$
declare
  target_lobby_id uuid;
  joined_player_ids uuid[];
begin
  select lobbies.id
  into target_lobby_id
  from public.lobbies
  join public.players host_player on host_player.id = lobbies.host_player_id
  where lower(lobbies.title) = lower('rating test')
    and host_player.display_name = 'Tal Hunga'
  order by lobbies.created_at desc
  limit 1;

  if target_lobby_id is null then
    raise exception 'Could not find rating test lobby hosted by Tal Hunga.';
  end if;

  select coalesce(array_agg(player_id order by position nulls last, joined_at nulls last, created_at), array[]::uuid[])
  into joined_player_ids
  from public.lobby_memberships
  where lobby_id = target_lobby_id
    and status in ('joined', 'attended');

  if cardinality(joined_player_ids) < 4 then
    raise exception 'Rating test lobby needs at least 4 joined/attended players. Found %.', cardinality(joined_player_ids);
  end if;

  update public.lobbies
  set
    starts_at = now() - interval '2 hours',
    match_locked_at = coalesce(match_locked_at, now() - interval '2 hours'),
    match_participant_ids = joined_player_ids,
    status = 'rating_open'
  where id = target_lobby_id;

  perform public.sync_lobby_lifecycle(target_lobby_id);
end;
$$;

alter table public.lobbies enable trigger lobbies_starts_in_future;

commit;
