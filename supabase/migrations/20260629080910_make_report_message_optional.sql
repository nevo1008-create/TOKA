alter table public.player_reports
  alter column message set default '';

alter table public.player_reports
  drop constraint if exists player_reports_message_check;

alter table public.player_reports
  add constraint player_reports_message_check
  check (length(trim(message)) <= 2000);

create or replace function public.submit_player_report(
  submitted_report_type text,
  submitted_report_context text,
  submitted_message text,
  target_reported_player_id uuid default null,
  target_related_lobby_id uuid default null,
  include_diagnostics boolean default true,
  can_contact boolean default true,
  submitted_client_context jsonb default '{}'::jsonb
)
returns public.player_reports
language plpgsql
security definer
set search_path = public
as $function$
declare
  current_player_id uuid := public.get_current_player_id();
  saved_report public.player_reports;
  trimmed_message text := trim(coalesce(submitted_message, ''));
begin
  if current_player_id is null then
    raise exception 'Player profile not found for current user.';
  end if;

  if submitted_report_type not in ('app_bug', 'player', 'lobby', 'message', 'safety', 'account', 'other') then
    raise exception 'Choose a valid report type.';
  end if;

  if submitted_report_context not in ('general', 'lobby', 'player', 'profile') then
    raise exception 'Choose a valid report context.';
  end if;

  if length(trimmed_message) > 2000 then
    raise exception 'Report details must be 2000 characters or fewer.';
  end if;

  if target_reported_player_id is not null then
    if target_reported_player_id = current_player_id then
      raise exception 'You cannot report yourself.';
    end if;

    if not exists (select 1 from public.players where id = target_reported_player_id) then
      raise exception 'Reported player was not found.';
    end if;
  end if;

  if target_related_lobby_id is not null
    and not exists (select 1 from public.lobbies where id = target_related_lobby_id) then
    raise exception 'Related lobby was not found.';
  end if;

  insert into public.player_reports (
    reporter_player_id,
    reported_player_id,
    related_lobby_id,
    report_type,
    report_context,
    message,
    diagnostics_opt_in,
    contact_opt_in,
    client_context
  )
  values (
    current_player_id,
    target_reported_player_id,
    target_related_lobby_id,
    submitted_report_type,
    submitted_report_context,
    trimmed_message,
    coalesce(include_diagnostics, true),
    coalesce(can_contact, true),
    coalesce(submitted_client_context, '{}'::jsonb)
  )
  returning *
  into saved_report;

  return saved_report;
end;
$function$;

revoke all on function public.submit_player_report(text, text, text, uuid, uuid, boolean, boolean, jsonb)
  from public, anon;
grant execute on function public.submit_player_report(text, text, text, uuid, uuid, boolean, boolean, jsonb)
  to authenticated;
