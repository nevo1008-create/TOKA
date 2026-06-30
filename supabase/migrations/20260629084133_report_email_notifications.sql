alter table public.player_reports
  add column if not exists email_notification_attempted_at timestamptz,
  add column if not exists email_notification_error text;

alter table public.player_reports
  alter column email_notification_status set default 'pending';

update public.player_reports
set email_notification_status = 'pending'
where email_notification_status = 'not_started';
