import { supabase } from '../../lib/supabase';
import type { DbLobbyMessage } from '../../lib/database.types';
import type { ChatMessage } from '../../types';
import { getDbChannelFromChannelId, mapDbMessageToChatMessage } from '../lobbies/lobbyMappers';

export async function listLobbyMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('lobby_messages')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbLobbyMessage[]).map(mapDbMessageToChatMessage);
}

export async function sendLobbyMessage(lobbyId: string, channelId: string, playerId: string, body: string) {
  const { error } = await supabase.from('lobby_messages').insert({
    body,
    channel: getDbChannelFromChannelId(channelId),
    lobby_id: lobbyId,
    sender_player_id: playerId,
  });

  if (error) {
    throw error;
  }
}
