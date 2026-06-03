create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  display_name text not null,
  gender text not null check (gender in ('male', 'female')),
  level text not null check (level in ('A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League')),
  rank_status text not null default 'self_declared' check (rank_status in ('self_declared', 'initial_rating', 'stabilizing', 'established')),
  toca_points integer not null default 0,
  games_played integer not null default 0,
  preferred_foot text not null default 'right' check (preferred_foot in ('left', 'right', 'both')),
  side text not null default 'both' check (side in ('left', 'right', 'both')),
  area text not null default '',
  initials text not null default '',
  has_ball boolean not null default false,
  has_court_marks boolean not null default false,
  friend_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  area text not null,
  distance_km numeric,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lobbies (
  id uuid primary key default gen_random_uuid(),
  host_player_id uuid not null references public.players(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  title text not null,
  location_description text,
  starts_at timestamptz not null,
  status text not null default 'open' check (status in ('draft', 'open', 'full', 'in_progress', 'rating_open', 'completed', 'closed')),
  visibility text not null default 'public' check (visibility in ('public', 'approval_required', 'password', 'invite_link')),
  capacity_mode text not null default 'fixed' check (capacity_mode in ('fixed', 'flexible')),
  min_players integer not null check (min_players > 0),
  max_players integer not null check (max_players >= min_players),
  rank_rule_type text not null default 'any' check (rank_rule_type in ('exact', 'range', 'any')),
  rank_min text check (rank_min is null or rank_min in ('A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League')),
  rank_max text check (rank_max is null or rank_max in ('A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League')),
  rank_exact text check (rank_exact is null or rank_exact in ('A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League')),
  gender_rule text not null default 'everyone' check (gender_rule in ('male', 'female', 'everyone')),
  competitive_level text check (competitive_level is null or competitive_level in ('casual', 'balanced', 'competitive')),
  waitlist_enabled boolean not null default true,
  exception_requests_enabled boolean not null default true,
  cancellation_penalty_minutes integer,
  pin_code_hash text,
  ball_needed boolean not null default false,
  court_marks_needed boolean not null default false,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.lobbies.pin_code_hash is
  'Production PINs must be hashed and verified server-side. The app may use seeded/dev PINs only before a secure RPC is added.';

create table if not exists public.lobby_memberships (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  status text not null check (status in ('joined', 'waitlisted', 'pending_approval', 'declined', 'left', 'removed', 'cancelled_on_time', 'cancelled_late', 'no_show', 'attended')),
  role text not null default 'member' check (role in ('host', 'member')),
  brings_ball boolean not null default false,
  brings_court_marks boolean not null default false,
  position integer,
  requested_reasons text[] not null default '{}',
  request_message text,
  requested_at timestamptz,
  joined_at timestamptz,
  left_at timestamptz,
  approved_at timestamptz,
  approved_by_player_id uuid references public.players(id),
  declined_at timestamptz,
  declined_by_player_id uuid references public.players(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lobby_id, player_id)
);

create table if not exists public.lobby_messages (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies(id) on delete cascade,
  sender_player_id uuid not null references public.players(id) on delete cascade,
  channel text not null check (channel in ('all', 'admin_joined')),
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_player_id uuid references public.players(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  related_lobby_id uuid references public.lobbies(id) on delete cascade,
  related_player_id uuid references public.players(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists players_auth_user_id_idx on public.players(auth_user_id);
create index if not exists lobbies_starts_at_idx on public.lobbies(starts_at);
create index if not exists lobby_memberships_lobby_id_idx on public.lobby_memberships(lobby_id);
create index if not exists lobby_memberships_player_id_idx on public.lobby_memberships(player_id);
create index if not exists lobby_messages_lobby_id_created_at_idx on public.lobby_messages(lobby_id, created_at);
create index if not exists notifications_recipient_player_id_idx on public.notifications(recipient_player_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists locations_set_updated_at on public.locations;
create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

drop trigger if exists lobbies_set_updated_at on public.lobbies;
create trigger lobbies_set_updated_at
before update on public.lobbies
for each row execute function public.set_updated_at();

drop trigger if exists lobby_memberships_set_updated_at on public.lobby_memberships;
create trigger lobby_memberships_set_updated_at
before update on public.lobby_memberships
for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.locations enable row level security;
alter table public.lobbies enable row level security;
alter table public.lobby_memberships enable row level security;
alter table public.lobby_messages enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "authenticated players are readable" on public.players;
create policy "authenticated players are readable"
on public.players for select
to authenticated
using (true);

drop policy if exists "users can insert own player profile" on public.players;
create policy "users can insert own player profile"
on public.players for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "users can update own player profile" on public.players;
create policy "users can update own player profile"
on public.players for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "authenticated locations are readable" on public.locations;
create policy "authenticated locations are readable"
on public.locations for select
to authenticated
using (true);

drop policy if exists "authenticated users can create locations" on public.locations;
create policy "authenticated users can create locations"
on public.locations for insert
to authenticated
with check (true);

drop policy if exists "authenticated lobbies are readable" on public.lobbies;
create policy "authenticated lobbies are readable"
on public.lobbies for select
to authenticated
using (true);

drop policy if exists "players can create hosted lobbies" on public.lobbies;
create policy "players can create hosted lobbies"
on public.lobbies for insert
to authenticated
with check (
  exists (
    select 1 from public.players
    where players.id = host_player_id
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "hosts can update lobbies" on public.lobbies;
create policy "hosts can update lobbies"
on public.lobbies for update
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = host_player_id
      and players.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.players
    where players.id = host_player_id
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated memberships are readable" on public.lobby_memberships;
create policy "authenticated memberships are readable"
on public.lobby_memberships for select
to authenticated
using (true);

drop policy if exists "players can create own memberships" on public.lobby_memberships;
create policy "players can create own memberships"
on public.lobby_memberships for insert
to authenticated
with check (
  exists (
    select 1 from public.players
    where players.id = player_id
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
    where players.id = player_id
      and players.auth_user_id = auth.uid()
  )
  or exists (
    select 1
    from public.lobbies
    join public.players host_player on host_player.id = lobbies.host_player_id
    where lobbies.id = lobby_memberships.lobby_id
      and host_player.auth_user_id = auth.uid()
  )
)
with check (true);

drop policy if exists "authenticated messages are readable" on public.lobby_messages;
create policy "authenticated messages are readable"
on public.lobby_messages for select
to authenticated
using (true);

drop policy if exists "members can insert lobby messages" on public.lobby_messages;
create policy "members can insert lobby messages"
on public.lobby_messages for insert
to authenticated
with check (
  exists (
    select 1
    from public.lobby_memberships
    join public.players on players.id = lobby_memberships.player_id
    where lobby_memberships.lobby_id = lobby_messages.lobby_id
      and lobby_memberships.player_id = lobby_messages.sender_player_id
      and lobby_memberships.status in ('joined', 'waitlisted', 'attended')
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
on public.notifications for select
to authenticated
using (
  recipient_player_id is null
  or exists (
    select 1 from public.players
    where players.id = recipient_player_id
      and players.auth_user_id = auth.uid()
  )
);

drop policy if exists "authenticated users can create notifications" on public.notifications;
create policy "authenticated users can create notifications"
on public.notifications for insert
to authenticated
with check (true);

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
on public.notifications for update
to authenticated
using (
  exists (
    select 1 from public.players
    where players.id = recipient_player_id
      and players.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.players
    where players.id = recipient_player_id
      and players.auth_user_id = auth.uid()
  )
);
