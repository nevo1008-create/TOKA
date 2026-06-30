create table if not exists public.player_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_player_id uuid not null references public.players(id) on delete cascade,
  reported_player_id uuid references public.players(id) on delete set null,
  related_lobby_id uuid references public.lobbies(id) on delete set null,
  report_type text not null check (
    report_type in ('app_bug', 'player', 'lobby', 'message', 'safety', 'account', 'other')
  ),
  report_context text not null default 'general' check (
    report_context in ('general', 'lobby', 'player', 'profile')
  ),
  message text not null default '' check (length(trim(message)) <= 2000),
  diagnostics_opt_in boolean not null default true,
  contact_opt_in boolean not null default true,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  email_notification_status text not null default 'pending' check (
    email_notification_status in ('not_started', 'pending', 'sent', 'failed')
  ),
  email_notification_attempted_at timestamptz,
  email_notification_sent_at timestamptz,
  email_notification_error text,
  support_email_snapshot text not null default 'support@toca-ftv.com',
  client_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_reports_no_self_report check (
    reported_player_id is null or reported_player_id <> reporter_player_id
  )
);

create index if not exists player_reports_reporter_created_at_idx
  on public.player_reports(reporter_player_id, created_at desc);

create index if not exists player_reports_reported_player_created_at_idx
  on public.player_reports(reported_player_id, created_at desc)
  where reported_player_id is not null;

create index if not exists player_reports_status_created_at_idx
  on public.player_reports(status, created_at desc);

create index if not exists player_reports_related_lobby_created_at_idx
  on public.player_reports(related_lobby_id, created_at desc)
  where related_lobby_id is not null;

drop trigger if exists player_reports_set_updated_at on public.player_reports;
create trigger player_reports_set_updated_at
before update on public.player_reports
for each row execute function public.set_updated_at();

alter table public.player_reports enable row level security;

revoke all on public.player_reports from anon;
grant select on public.player_reports to authenticated;
grant select, insert, update, delete on public.player_reports to service_role;

drop policy if exists "players can read own submitted reports" on public.player_reports;
create policy "players can read own submitted reports"
on public.player_reports for select
to authenticated
using (
  exists (
    select 1
    from public.players
    where players.id = player_reports.reporter_player_id
      and players.auth_user_id = auth.uid()
  )
);

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
