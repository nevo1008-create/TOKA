alter table public.players
  add column if not exists avatar_focus_x numeric not null default 50
    check (avatar_focus_x >= 0 and avatar_focus_x <= 100),
  add column if not exists avatar_focus_y numeric not null default 50
    check (avatar_focus_y >= 0 and avatar_focus_y <= 100);
