create table if not exists public.player_ratings (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  rater_player_id uuid not null references public.players(id) on delete cascade,
  rated_player_id uuid not null references public.players(id) on delete cascade,
  rank_vote text not null check (rank_vote in ('A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League')),
  behavior_rating numeric(2, 1) not null check (
    behavior_rating >= 0.5
    and behavior_rating <= 5
    and behavior_rating * 2 = floor(behavior_rating * 2)
  ),
  created_at timestamptz not null default now(),
  unique (lobby_id, rater_player_id, rated_player_id),
  check (rater_player_id <> rated_player_id)
);

create index if not exists player_ratings_rater_player_id_idx on public.player_ratings(rater_player_id);
create index if not exists player_ratings_rated_player_id_idx on public.player_ratings(rated_player_id);
create index if not exists player_ratings_lobby_id_idx on public.player_ratings(lobby_id);

alter table public.player_ratings enable row level security;

drop policy if exists "players can read own submitted ratings" on public.player_ratings;
create policy "players can read own submitted ratings"
on public.player_ratings for select
using (
  exists (
    select 1 from public.players
    where players.id = rater_player_id
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "players can create own final-player ratings" on public.player_ratings;
create policy "players can create own final-player ratings"
on public.player_ratings for insert
with check (
  exists (
    select 1 from public.players
    where players.id = rater_player_id
      and players.auth_user_id = auth.uid()
  )
  and exists (
    select 1 from public.lobby_memberships
    where lobby_memberships.lobby_id = player_ratings.lobby_id
      and lobby_memberships.player_id = player_ratings.rater_player_id
      and lobby_memberships.status in ('joined', 'attended')
  )
  and exists (
    select 1 from public.lobby_memberships
    where lobby_memberships.lobby_id = player_ratings.lobby_id
      and lobby_memberships.player_id = player_ratings.rated_player_id
      and lobby_memberships.status in ('joined', 'attended')
  )
);
