import { supabase } from '../../lib/supabase';
import type { DbNotification } from '../../lib/database.types';
import type { Notification } from '../../types';
import { mapDbNotificationToNotification } from '../lobbies/lobbyMappers';

const notificationSelect = 'id,recipient_player_id,type,title,body,related_lobby_id,related_player_id,read_at,created_at';
const notificationPageSize = 50;

type CreateNotificationInput = {
  body: string;
  lobbyId?: string;
  playerId?: string;
  recipientPlayerId: string;
  title: string;
  type: Notification['type'];
};

export async function listNotifications(playerId: string): Promise<Notification[]> {
  if (!isUuid(playerId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(notificationSelect)
    .or(`recipient_player_id.eq.${playerId},recipient_player_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(notificationPageSize);

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbNotification[]).map(mapDbNotificationToNotification);
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null);

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
    .in('id', notificationIds)
    .is('read_at', null);

  if (error) {
    throw error;
  }
}

export async function createNotification({
  body,
  lobbyId,
  playerId,
  recipientPlayerId,
  title,
  type,
}: CreateNotificationInput): Promise<boolean> {
  if (!isUuid(recipientPlayerId)) {
    return false;
  }

  const { error } = await supabase
    .from('notifications')
    .insert(getNotificationInsert({ body, lobbyId, playerId, recipientPlayerId, title, type }));

  if (error) {
    if (isDuplicateNotificationError(error)) {
      return true;
    }

    throw error;
  }

  return true;
}

export async function createUniqueNotification(input: CreateNotificationInput): Promise<Notification | null> {
  if (!isUuid(input.recipientPlayerId)) {
    throw new Error('Notification recipient is not a valid player profile. Refresh players and try again.');
  }

  const existingNotification = await findMatchingUnreadNotification(input);

  if (existingNotification) {
    return existingNotification;
  }

  return createNotificationAndSelect(input);
}

async function findMatchingUnreadNotification(input: CreateNotificationInput) {
  let query = supabase
    .from('notifications')
    .select(notificationSelect)
    .eq('recipient_player_id', input.recipientPlayerId)
    .eq('type', input.type)
    .eq('title', input.title)
    .is('read_at', null);

  query = input.lobbyId
    ? query.eq('related_lobby_id', input.lobbyId)
    : query.is('related_lobby_id', null);

  query = input.playerId
    ? query.eq('related_player_id', input.playerId)
    : query.is('related_player_id', null);

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  const [notification] = (data ?? []) as DbNotification[];

  return notification ? mapDbNotificationToNotification(notification) : null;
}

async function createNotificationAndSelect({
  body,
  lobbyId,
  playerId,
  recipientPlayerId,
  title,
  type,
}: CreateNotificationInput): Promise<Notification | null> {
  if (!isUuid(recipientPlayerId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert(getNotificationInsert({ body, lobbyId, playerId, recipientPlayerId, title, type }))
    .select(notificationSelect)
    .single();

  if (error) {
    if (isDuplicateNotificationError(error)) {
      return findMatchingUnreadNotification({ body, lobbyId, playerId, recipientPlayerId, title, type });
    }

    throw error;
  }

  return mapDbNotificationToNotification(data as DbNotification);
}

function getNotificationInsert({
  body,
  lobbyId,
  playerId,
  recipientPlayerId,
  title,
  type,
}: CreateNotificationInput) {
  return {
    body,
    related_lobby_id: lobbyId,
    related_player_id: playerId,
    recipient_player_id: recipientPlayerId,
    title,
    type,
  };
}

function isDuplicateNotificationError(error: { code?: string; message?: string }) {
  return error.code === '23505' || Boolean(error.message?.toLowerCase().includes('duplicate key'));
}
