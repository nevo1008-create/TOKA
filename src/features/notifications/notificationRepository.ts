import { supabase } from '../../lib/supabase';
import type { DbNotification } from '../../lib/database.types';
import type { Notification } from '../../types';
import { mapDbNotificationToNotification } from '../lobbies/lobbyMappers';

export async function listNotifications(playerId: string): Promise<Notification[]> {
  if (!isUuid(playerId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`recipient_player_id.eq.${playerId},recipient_player_id.is.null`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbNotification[]).map(mapDbNotificationToNotification);
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    throw error;
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function markNotificationsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', notificationIds);

  if (error) {
    throw error;
  }
}
