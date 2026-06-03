insert into public.players (
  id,
  display_name,
  gender,
  level,
  rank_status,
  toca_points,
  games_played,
  preferred_foot,
  side,
  area,
  initials,
  has_ball,
  has_court_marks,
  friend_ids
) values
  ('00000000-0000-4000-8000-000000000001', 'Nevo', 'male', 'B+', 'stabilizing', 328, 12, 'right', 'both', 'Tel Aviv and central Israel', 'NV', true, false, array['00000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000004'::uuid]),
  ('00000000-0000-4000-8000-000000000002', 'Omer', 'male', 'C-', 'established', 514, 28, 'left', 'right', 'Herzliya', 'OM', false, true, array['00000000-0000-4000-8000-000000000001'::uuid]),
  ('00000000-0000-4000-8000-000000000003', 'Daniel', 'male', 'League', 'established', 904, 76, 'right', 'left', 'Haifa', 'DN', true, true, '{}'),
  ('00000000-0000-4000-8000-000000000004', 'Maya', 'female', 'B+', 'initial_rating', 271, 9, 'both', 'both', 'Netanya', 'MY', false, false, array['00000000-0000-4000-8000-000000000001'::uuid]),
  ('00000000-0000-4000-8000-000000000005', 'Roy', 'male', 'C', 'self_declared', 119, 3, 'right', 'left', 'Ashdod', 'RY', false, true, '{}')
on conflict (id) do update set
  display_name = excluded.display_name,
  gender = excluded.gender,
  level = excluded.level,
  rank_status = excluded.rank_status,
  toca_points = excluded.toca_points,
  games_played = excluded.games_played,
  preferred_foot = excluded.preferred_foot,
  side = excluded.side,
  area = excluded.area,
  initials = excluded.initials,
  has_ball = excluded.has_ball,
  has_court_marks = excluded.has_court_marks,
  friend_ids = excluded.friend_ids;

insert into public.locations (id, name, city, area, distance_km, description) values
  ('10000000-0000-4000-8000-000000000001', 'Gordon Beach', 'Tel Aviv', 'Central Israel', 2.4, 'Meet near the north court line.'),
  ('10000000-0000-4000-8000-000000000002', 'Poleg Beach', 'Netanya', 'Sharon', 18.1, null),
  ('10000000-0000-4000-8000-000000000003', 'Aqueduct Beach', 'Caesarea', 'North coast', 49.5, null),
  ('10000000-0000-4000-8000-000000000004', 'Hilton Beach', 'Tel Aviv', 'Central Israel', 3.1, null),
  ('10000000-0000-4000-8000-000000000005', 'Herzliya Beach', 'Herzliya', 'Sharon', 12.7, null)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  area = excluded.area,
  distance_km = excluded.distance_km,
  description = excluded.description;

insert into public.lobbies (
  id,
  host_player_id,
  location_id,
  title,
  location_description,
  starts_at,
  status,
  visibility,
  capacity_mode,
  min_players,
  max_players,
  rank_rule_type,
  rank_min,
  rank_max,
  rank_exact,
  gender_rule,
  competitive_level,
  waitlist_enabled,
  exception_requests_enabled,
  cancellation_penalty_minutes,
  ball_needed,
  court_marks_needed,
  note
) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Friday at Gordon', 'Use the court closest to the lifeguard station.', '2026-06-05T16:30:00+03:00', 'open', 'public', 'fixed', 4, 4, 'range', 'B', 'C+', null, 'everyone', 'balanced', true, true, 90, true, true, 'Fast but friendly match. Looking for one more active player.'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'League morning rotations', null, '2026-06-06T08:00:00+03:00', 'rating_open', 'approval_required', 'fixed', 6, 6, 'range', 'A+', 'League', null, 'everyone', 'competitive', true, true, 90, false, true, 'Six-player rotations. Waitlist is open for approved players.'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', 'Women evening game', 'אפשר להפגש ליד החניה הדרומית', '2026-06-07T19:00:00+03:00', 'open', 'public', 'flexible', 4, 6, 'range', 'C-', 'D', null, 'female', 'casual', true, true, 120, true, false, 'Public women-only lobby. Players outside the room rules can request host approval.'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 'Sunrise challenge', 'Meet by the north court before the first round.', '2026-06-07T07:30:00+03:00', 'open', 'public', 'fixed', 4, 6, 'range', 'C-', 'B+', null, 'everyone', 'balanced', true, true, 90, false, true, 'Early regular game. Nevo is a joined player, not the host.'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005', 'Monday night', null, '2026-06-08T18:00:00+03:00', 'completed', 'public', 'flexible', 4, 8, 'exact', null, null, 'B+', 'everyone', 'casual', true, true, 90, false, false, 'Finished mock game used for history and recap states.')
on conflict (id) do update set
  host_player_id = excluded.host_player_id,
  location_id = excluded.location_id,
  title = excluded.title,
  location_description = excluded.location_description,
  starts_at = excluded.starts_at,
  status = excluded.status,
  visibility = excluded.visibility,
  capacity_mode = excluded.capacity_mode,
  min_players = excluded.min_players,
  max_players = excluded.max_players,
  rank_rule_type = excluded.rank_rule_type,
  rank_min = excluded.rank_min,
  rank_max = excluded.rank_max,
  rank_exact = excluded.rank_exact,
  gender_rule = excluded.gender_rule,
  competitive_level = excluded.competitive_level,
  waitlist_enabled = excluded.waitlist_enabled,
  exception_requests_enabled = excluded.exception_requests_enabled,
  cancellation_penalty_minutes = excluded.cancellation_penalty_minutes,
  ball_needed = excluded.ball_needed,
  court_marks_needed = excluded.court_marks_needed,
  note = excluded.note;

insert into public.lobby_memberships (lobby_id, player_id, status, role, brings_ball, brings_court_marks, position, requested_reasons, request_message, requested_at) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'joined', 'host', true, false, 1, '{}', null, null),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'joined', 'member', false, true, 2, '{}', null, null),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'joined', 'member', false, false, 3, '{}', null, null),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', 'waitlisted', 'member', false, true, 4, '{}', null, null),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003', 'pending_approval', 'member', true, true, 5, array['level_exception'], 'I can help keep the rotations moving if you need another waitlist player.', now()),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'joined', 'host', true, true, 1, '{}', null, null),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'joined', 'member', true, false, 2, '{}', null, null),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'joined', 'member', false, true, 3, '{}', null, null),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005', 'pending_approval', 'member', false, true, 4, array['level_exception'], 'I know this is above my range, but I can join the waitlist if the game is full.', now()),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', 'joined', 'host', false, false, 1, '{}', null, null),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'waitlisted', 'member', false, true, 2, '{}', null, null),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'joined', 'host', false, true, 1, '{}', null, null),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001', 'joined', 'member', true, false, 2, '{}', null, null),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000004', 'joined', 'member', false, false, 3, '{}', null, null),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000004', 'attended', 'host', false, false, 1, '{}', null, null),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001', 'attended', 'member', true, false, 2, '{}', null, null),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000002', 'attended', 'member', false, true, 3, '{}', null, null),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', 'attended', 'member', true, true, 4, '{}', null, null)
on conflict (lobby_id, player_id) do update set
  status = excluded.status,
  role = excluded.role,
  brings_ball = excluded.brings_ball,
  brings_court_marks = excluded.brings_court_marks,
  position = excluded.position,
  requested_reasons = excluded.requested_reasons,
  request_message = excluded.request_message,
  requested_at = excluded.requested_at;

insert into public.lobby_messages (id, lobby_id, sender_player_id, channel, body, created_at) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'all', 'I can bring the court marks today.', '2026-06-05T10:12:00+03:00'),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'all', 'Great. I will bring a ball and we can start warmup at 16:15.', '2026-06-05T10:18:00+03:00'),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', 'admin_joined', 'If we stay four, let us rotate side every seven points.', '2026-06-05T11:05:00+03:00'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'all', 'Ratings are open. Please finish them before tomorrow evening.', '2026-06-06T10:30:00+03:00')
on conflict (id) do update set
  body = excluded.body,
  channel = excluded.channel,
  created_at = excluded.created_at;
