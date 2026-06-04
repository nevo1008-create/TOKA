create table if not exists public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  feedback text not null check (length(trim(feedback)) > 0 and length(feedback) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;

revoke all on public.account_deletion_feedback from anon, authenticated;

create or replace function public.delete_current_user_account(feedback_text text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid := auth.uid();
  current_player_id uuid;
  normalized_feedback text := nullif(trim(coalesce(feedback_text, '')), '');
begin
  if current_auth_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select id
    into current_player_id
  from public.players
  where auth_user_id = current_auth_user_id;

  if normalized_feedback is not null then
    insert into public.account_deletion_feedback (feedback)
    values (left(normalized_feedback, 1000));
  end if;

  if current_player_id is not null then
    update public.players
      set friend_ids = array_remove(friend_ids, current_player_id)
    where current_player_id = any(friend_ids);

    update public.lobby_memberships
      set approved_by_player_id = null
    where approved_by_player_id = current_player_id;

    update public.lobby_memberships
      set declined_by_player_id = null
    where declined_by_player_id = current_player_id;

    delete from public.notifications
    where recipient_player_id = current_player_id
      or related_player_id = current_player_id;

    delete from public.lobby_messages
    where sender_player_id = current_player_id;

    delete from public.lobby_memberships
    where player_id = current_player_id;

    delete from public.lobbies
    where host_player_id = current_player_id;

    delete from public.players
    where id = current_player_id;
  end if;

  delete from auth.users
  where id = current_auth_user_id;
end;
$$;

revoke all on function public.delete_current_user_account(text) from public;
grant execute on function public.delete_current_user_account(text) to authenticated;
