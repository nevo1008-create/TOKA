create or replace function public.process_rank_batch_after_rating_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_player_rank_received_count(new.rated_player_id);
  perform public.process_player_rank_batch(new.rated_player_id);
  perform public.sync_player_rank_received_count(new.rated_player_id);

  return new;
end;
$$;

drop trigger if exists player_ratings_sync_received_count on public.player_ratings;
drop trigger if exists player_ratings_process_rank_batch on public.player_ratings;
create trigger player_ratings_process_rank_batch
after insert on public.player_ratings
for each row execute function public.process_rank_batch_after_rating_insert();

do $$
declare
  target_player_id uuid;
  processed_batch_id uuid;
begin
  for target_player_id in
    select distinct rated_player_id
    from public.player_ratings
    where processed_rank_batch_id is null
  loop
    loop
      processed_batch_id := public.process_player_rank_batch(target_player_id);
      perform public.sync_player_rank_received_count(target_player_id);

      exit when processed_batch_id is null;
    end loop;
  end loop;
end;
$$;

revoke all on function public.process_rank_batch_after_rating_insert() from public, anon, authenticated;
