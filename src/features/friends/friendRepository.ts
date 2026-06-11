import { supabase } from '../../lib/supabase';
import type { DbFriendRequest } from '../../lib/database.types';
import type { FriendRequest } from '../../types';
import { mapDbFriendRequestToFriendRequest } from '../lobbies/lobbyMappers';

export async function listFriendRequests(playerId: string): Promise<FriendRequest[]> {
  if (!isUuid(playerId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`requester_player_id.eq.${playerId},recipient_player_id.eq.${playerId}`)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbFriendRequest[]).map(mapDbFriendRequestToFriendRequest);
}

export async function sendFriendRequest(playerId: string): Promise<FriendRequest> {
  const { data, error } = await supabase.rpc('send_friend_request', { target_player_id: playerId });

  if (error) {
    throw new Error(error.message);
  }

  return mapDbFriendRequestToFriendRequest(data as DbFriendRequest);
}

export async function acceptFriendRequest(requestId: string): Promise<FriendRequest> {
  const { data, error } = await supabase.rpc('accept_friend_request', { target_request_id: requestId });

  if (error) {
    throw new Error(error.message);
  }

  return mapDbFriendRequestToFriendRequest(data as DbFriendRequest);
}

export async function declineFriendRequest(requestId: string): Promise<FriendRequest> {
  const { data, error } = await supabase.rpc('decline_friend_request', { target_request_id: requestId });

  if (error) {
    throw new Error(error.message);
  }

  return mapDbFriendRequestToFriendRequest(data as DbFriendRequest);
}

export async function cancelFriendRequest(requestId: string): Promise<FriendRequest> {
  const { data, error } = await supabase.rpc('cancel_friend_request', { target_request_id: requestId });

  if (error) {
    throw new Error(error.message);
  }

  return mapDbFriendRequestToFriendRequest(data as DbFriendRequest);
}

export async function removeFriend(playerId: string) {
  const { error } = await supabase.rpc('remove_friend', { target_player_id: playerId });

  if (error) {
    throw new Error(error.message);
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
