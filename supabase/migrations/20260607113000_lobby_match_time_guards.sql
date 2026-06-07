create or replace function public.assert_lobby_starts_in_future()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or new.starts_at is distinct from old.starts_at)
    and new.starts_at <= now()
  then
    raise exception 'Lobby start time must be in the future.';
  end if;

  return new;
end;
$$;

drop trigger if exists lobbies_starts_in_future on public.lobbies;
create trigger lobbies_starts_in_future
before insert or update of starts_at on public.lobbies
for each row execute function public.assert_lobby_starts_in_future();

create or replace function public.host_update_lobby_settings(
  target_lobby_id uuid,
  next_title text,
  next_starts_at timestamptz,
  next_location_name text,
  next_location_city text,
  next_location_description text,
  next_capacity_mode text,
  next_min_players integer,
  next_max_players integer,
  next_rank_rule_type text,
  next_rank_min text,
  next_rank_max text,
  next_rank_exact text,
  next_gender_rule text,
  next_visibility text,
  next_pin_code_hash text,
  next_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player_id uuid;
  canonical_host_id uuid;
  target_location_id uuid;
  active_player_count integer;
  current_starts_at timestamptz;
begin
  select players.id
  into current_player_id
  from public.players
  where players.auth_user_id = auth.uid();

  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  canonical_host_id := public.sync_lobby_host(target_lobby_id);

  if canonical_host_id <> current_player_id then
    raise exception 'Only the host can manage this lobby.';
  end if;

  select lobbies.location_id, lobbies.starts_at
  into target_location_id, current_starts_at
  from public.lobbies
  where lobbies.id = target_lobby_id;

  if current_starts_at <= now() then
    raise exception 'Host tools close when the match starts.';
  end if;

  if next_starts_at <= now() then
    raise exception 'Lobby start time must be in the future.';
  end if;

  select count(*)
  into active_player_count
  from public.lobby_memberships
  where lobby_id = target_lobby_id
    and status = 'joined';

  if next_max_players < active_player_count then
    raise exception 'Player limit cannot be lower than current joined players (%).', active_player_count;
  end if;

  update public.locations
  set
    city = next_location_city,
    description = next_location_description,
    name = next_location_name
  where id = target_location_id;

  update public.lobbies
  set
    capacity_mode = next_capacity_mode,
    gender_rule = next_gender_rule,
    location_description = next_location_description,
    max_players = next_max_players,
    min_players = next_min_players,
    note = next_note,
    pin_code_hash = next_pin_code_hash,
    rank_exact = next_rank_exact,
    rank_max = next_rank_max,
    rank_min = next_rank_min,
    rank_rule_type = next_rank_rule_type,
    starts_at = next_starts_at,
    title = next_title,
    visibility = next_visibility
  where id = target_lobby_id;
end;
$$;
