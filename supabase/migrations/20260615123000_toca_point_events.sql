create table if not exists public.toca_point_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  lobby_id uuid references public.lobbies(id) on delete cascade,
  related_player_id uuid references public.players(id) on delete set null,
  type text not null check (
    type in (
      'completed_match',
      'rated_player',
      'quick_rating_completion',
      'weekly_five_match_bonus',
      'new_player_played_with'
    )
  ),
  points integer not null check (points > 0),
  dedupe_key text not null check (length(trim(dedupe_key)) > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (player_id, type, dedupe_key)
);

comment on table public.toca_point_events is
  'Append-only TOCA Points ledger. players.toca_points is the denormalized total for fast profile and leaderboard reads.';

comment on column public.toca_point_events.dedupe_key is
  'Stable event key used with player_id and type to prevent duplicate rewards when lifecycle/rating jobs retry.';

create index if not exists toca_point_events_player_created_at_idx
  on public.toca_point_events(player_id, created_at desc);

create index if not exists toca_point_events_lobby_idx
  on public.toca_point_events(lobby_id)
  where lobby_id is not null;

create index if not exists toca_point_events_related_player_idx
  on public.toca_point_events(related_player_id)
  where related_player_id is not null;

alter table public.toca_point_events enable row level security;

drop policy if exists "players can read own toca point events" on public.toca_point_events;
create policy "players can read own toca point events"
on public.toca_point_events for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = toca_point_events.player_id
      and players.auth_user_id = auth.uid()
  )
);

create or replace function public.award_toca_points(
  target_player_id uuid,
  event_type text,
  points_delta integer,
  event_dedupe_key text,
  target_lobby_id uuid default null,
  target_related_player_id uuid default null,
  event_metadata jsonb default '{}'::jsonb
)
returns public.toca_point_events
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_event public.toca_point_events;
begin
  if points_delta <= 0 then
    raise exception 'TOCA point awards must be positive.';
  end if;

  if length(trim(event_dedupe_key)) = 0 then
    raise exception 'TOCA point awards require a dedupe key.';
  end if;

  insert into public.toca_point_events (
    player_id,
    lobby_id,
    related_player_id,
    type,
    points,
    dedupe_key,
    metadata
  )
  values (
    target_player_id,
    target_lobby_id,
    target_related_player_id,
    event_type,
    points_delta,
    trim(event_dedupe_key),
    coalesce(event_metadata, '{}'::jsonb)
  )
  on conflict (player_id, type, dedupe_key) do nothing
  returning *
  into saved_event;

  if saved_event.id is null then
    select *
    into saved_event
    from public.toca_point_events
    where player_id = target_player_id
      and toca_point_events.type = event_type
      and toca_point_events.dedupe_key = trim(event_dedupe_key)
    limit 1;

    return saved_event;
  end if;

  update public.players
  set toca_points = toca_points + points_delta
  where id = target_player_id;

  return saved_event;
end;
$$;

revoke all on function public.award_toca_points(uuid, text, integer, text, uuid, uuid, jsonb) from public, anon, authenticated;
