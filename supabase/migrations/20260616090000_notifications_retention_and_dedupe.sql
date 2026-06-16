-- Stop notification table growth from duplicate unread rows and old rows.
-- Keeps one newest/unread row for each logical notification.

with ranked_notifications as (
  select
    id,
    row_number() over (
      partition by
        coalesce(recipient_player_id, '00000000-0000-0000-0000-000000000000'::uuid),
        type,
        coalesce(related_lobby_id, '00000000-0000-0000-0000-000000000000'::uuid),
        coalesce(related_player_id, '00000000-0000-0000-0000-000000000000'::uuid),
        title
      order by
        (read_at is null) desc,
        created_at desc,
        id desc
    ) as duplicate_rank
  from public.notifications
)
delete from public.notifications as notifications
using ranked_notifications
where notifications.id = ranked_notifications.id
  and ranked_notifications.duplicate_rank > 1;

delete from public.notifications
where
  (read_at is not null and read_at < now() - interval '30 days')
  or
  (read_at is null and created_at < now() - interval '90 days');

create index if not exists notifications_recipient_unread_created_at_idx
  on public.notifications(recipient_player_id, created_at desc)
  where read_at is null;

create index if not exists notifications_dedupe_lookup_idx
  on public.notifications(
    recipient_player_id,
    type,
    related_lobby_id,
    related_player_id,
    title,
    created_at desc
  );

create index if not exists notifications_related_lobby_id_idx
  on public.notifications(related_lobby_id)
  where related_lobby_id is not null;

create index if not exists notifications_related_player_id_idx
  on public.notifications(related_player_id)
  where related_player_id is not null;

create index if not exists notifications_cleanup_idx
  on public.notifications(read_at, created_at);

create unique index if not exists notifications_active_dedupe_idx
  on public.notifications(
    coalesce(recipient_player_id, '00000000-0000-0000-0000-000000000000'::uuid),
    type,
    coalesce(related_lobby_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(related_player_id, '00000000-0000-0000-0000-000000000000'::uuid),
    title
  )
  where read_at is null;

create or replace function public.prune_notifications(
  read_retention_days integer default 30,
  unread_retention_days integer default 90
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.notifications
  where
    (
      read_at is not null
      and read_at < now() - make_interval(days => greatest(read_retention_days, 1))
    )
    or
    (
      read_at is null
      and created_at < now() - make_interval(days => greatest(unread_retention_days, 1))
    );

  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;

revoke all on function public.prune_notifications(integer, integer) from public, anon, authenticated;

analyze public.notifications;
