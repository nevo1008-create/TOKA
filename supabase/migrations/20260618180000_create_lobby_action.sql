create or replace function public.create_lobby(
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
returns public.lobbies
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player public.players;
  created_location public.locations;
  created_lobby public.lobbies;
begin
  select *
  into current_player
  from public.players
  where auth_user_id = auth.uid();

  if current_player.id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  if next_starts_at <= now() then
    raise exception 'Lobby start time must be in the future.';
  end if;

  if next_min_players <= 0 or next_max_players < next_min_players then
    raise exception 'Choose a valid player count.';
  end if;

  insert into public.locations (
    area,
    city,
    description,
    name
  )
  values (
    'Central Israel',
    next_location_city,
    next_location_description,
    next_location_name
  )
  returning *
  into created_location;

  insert into public.lobbies (
    ball_needed,
    capacity_mode,
    competitive_level,
    court_marks_needed,
    exception_requests_enabled,
    gender_rule,
    host_player_id,
    location_description,
    location_id,
    max_players,
    min_players,
    note,
    pin_code_hash,
    rank_exact,
    rank_max,
    rank_min,
    rank_rule_type,
    starts_at,
    status,
    title,
    visibility,
    waitlist_enabled
  )
  values (
    current_player.has_ball,
    next_capacity_mode,
    'balanced',
    current_player.has_court_marks,
    true,
    next_gender_rule,
    current_player.id,
    next_location_description,
    created_location.id,
    next_max_players,
    next_min_players,
    next_note,
    next_pin_code_hash,
    next_rank_exact,
    next_rank_max,
    next_rank_min,
    next_rank_rule_type,
    next_starts_at,
    'open',
    next_title,
    next_visibility,
    true
  )
  returning *
  into created_lobby;

  insert into public.lobby_memberships (
    brings_ball,
    brings_court_marks,
    joined_at,
    lobby_id,
    player_id,
    position,
    role,
    status
  )
  values (
    current_player.has_ball,
    current_player.has_court_marks,
    now(),
    created_lobby.id,
    current_player.id,
    1,
    'host',
    'joined'
  );

  insert into public.lobby_messages (
    body,
    channel,
    lobby_id,
    sender_player_id
  )
  values (
    'Game created. Use this chat to coordinate with players.',
    'all',
    created_lobby.id,
    current_player.id
  );

  return created_lobby;
end;
$function$;

revoke all on function public.create_lobby(
  text,
  timestamptz,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public, anon;
grant execute on function public.create_lobby(
  text,
  timestamptz,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to authenticated;
