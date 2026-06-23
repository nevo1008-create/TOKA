create or replace function public.request_lobby_waitlist_approval(target_lobby_id uuid)
returns table(success boolean, messages text[])
language plpgsql
security definer
set search_path = public
as $$
declare
  current_player public.players;
  target_lobby public.lobbies;
  relationship text;
  reasons text[];
  was_previously_declined boolean := false;
begin
  select *
  into current_player
  from public.players
  where auth_user_id = auth.uid();

  if current_player.id is null then
    return query select false, array['Player profile not found for current user.']::text[];
    return;
  end if;

  target_lobby := public.sync_lobby_lifecycle(target_lobby_id);

  if target_lobby.id is null then
    return query select false, array['Lobby not found.']::text[];
    return;
  end if;

  if target_lobby.status not in ('open', 'full', 'closing_soon') then
    return query select false, array['This game has already started, so lobby actions are closed.']::text[];
    return;
  end if;

  if not target_lobby.exception_requests_enabled then
    return query select false, array['This game does not accept exception requests.']::text[];
    return;
  end if;

  relationship := public.get_player_lobby_relationship(target_lobby.id, current_player.id);
  was_previously_declined := relationship = 'rejected';

  if relationship = 'pending_approval' then
    return query select false, array['Player already has a pending request for this game.']::text[];
    return;
  end if;

  if relationship in ('joined', 'waitlist', 'attended') then
    return query select false, array['Player is already committed to this game.']::text[];
    return;
  end if;

  reasons := public.get_lobby_rule_exception_reasons(current_player, target_lobby);

  if target_lobby.visibility = 'password' then
    reasons := array['private_access']::text[] || reasons;
  end if;

  if cardinality(reasons) = 0 then
    reasons := array['approval_required']::text[];
  end if;

  perform public.upsert_lobby_membership_from_action(
    target_lobby.id,
    current_player,
    'pending_approval',
    reasons,
    'Requesting host approval to join the waitlist.'
  );

  if not was_previously_declined then
    perform public.insert_notification_conflict_safe(
      target_lobby.host_player_id,
      target_lobby.id,
      current_player.id,
      'join_request_received',
      'New join request',
      current_player.display_name || ' requested approval for ' || target_lobby.title || '.'
    );
  end if;

  return query select true, array['Request sent to the host.']::text[];
end;
$$;

revoke all on function public.request_lobby_waitlist_approval(uuid) from public, anon;
grant execute on function public.request_lobby_waitlist_approval(uuid) to authenticated;
