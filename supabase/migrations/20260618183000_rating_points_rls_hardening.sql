drop policy if exists "players can create own final-player ratings" on public.player_ratings;

revoke insert, update, delete on public.player_ratings from anon, authenticated;
grant select on public.player_ratings to authenticated;
grant execute on function public.submit_player_skill_rating(uuid, uuid, text, text, numeric) to authenticated;

revoke insert, update, delete on public.toca_point_events from anon, authenticated;
grant select on public.toca_point_events to authenticated;

revoke all on function public.award_toca_points(uuid, text, integer, text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.award_match_toca_points(uuid) from public, anon, authenticated;
revoke all on function public.award_rating_toca_points(uuid) from public, anon, authenticated;

revoke insert, update, delete on public.player_rank_state from anon, authenticated;
revoke insert, update, delete on public.player_rater_reliability from anon, authenticated;
revoke insert, update, delete on public.player_rank_batches from anon, authenticated;
revoke insert, update, delete on public.player_rank_batch_ratings from anon, authenticated;
revoke insert, update, delete on public.player_rank_history from anon, authenticated;

revoke insert, update on public.players from anon, authenticated;

grant insert (
  auth_user_id,
  display_name,
  gender,
  level,
  preferred_foot,
  side,
  area,
  initials,
  has_ball,
  has_court_marks,
  push_notifications_enabled,
  avatar_path,
  avatar_focus_x,
  avatar_focus_y
) on public.players to authenticated;

grant update (
  auth_user_id,
  display_name,
  gender,
  level,
  preferred_foot,
  side,
  area,
  initials,
  has_ball,
  has_court_marks,
  push_notifications_enabled,
  avatar_path,
  avatar_focus_x,
  avatar_focus_y
) on public.players to authenticated;
