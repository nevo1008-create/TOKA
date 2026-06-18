alter table public.players
  add column if not exists rating_average numeric(3, 2),
  add column if not exists rating_count integer not null default 0;

alter table public.players
  drop constraint if exists players_rating_average_check,
  add constraint players_rating_average_check
  check (rating_average is null or (rating_average >= 0 and rating_average <= 5));

alter table public.players
  drop constraint if exists players_rating_count_check,
  add constraint players_rating_count_check
  check (rating_count >= 0);

alter table public.players
  drop constraint if exists players_rating_summary_consistency_check,
  add constraint players_rating_summary_consistency_check
  check (
    (rating_count = 0 and rating_average is null)
    or (rating_count > 0 and rating_average is not null)
  );

create or replace function public.sync_player_rating_summary(target_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_rating_average numeric(3, 2);
  next_rating_count integer;
begin
  select
    round(avg(behavior_rating)::numeric, 1),
    count(*)::integer
  into next_rating_average, next_rating_count
  from public.player_ratings
  where rated_player_id = target_player_id;

  update public.players
  set
    rating_average = case when next_rating_count > 0 then next_rating_average else null end,
    rating_count = next_rating_count
  where id = target_player_id;
end;
$$;

create or replace function public.update_player_rating_summary_after_rating_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_player_rating_summary(old.rated_player_id);
    return old;
  end if;

  perform public.sync_player_rating_summary(new.rated_player_id);

  if tg_op = 'UPDATE' and old.rated_player_id <> new.rated_player_id then
    perform public.sync_player_rating_summary(old.rated_player_id);
  end if;

  return new;
end;
$$;

drop trigger if exists player_ratings_update_player_rating_summary on public.player_ratings;
create trigger player_ratings_update_player_rating_summary
after insert or update or delete on public.player_ratings
for each row execute function public.update_player_rating_summary_after_rating_change();

select public.sync_player_rating_summary(players.id)
from public.players;

revoke all on function public.sync_player_rating_summary(uuid) from public, anon, authenticated;
revoke all on function public.update_player_rating_summary_after_rating_change() from public, anon, authenticated;
