alter table public.players
  add column if not exists push_notifications_enabled boolean not null default false;
