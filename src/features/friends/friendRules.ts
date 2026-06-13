import type { FriendRequest, Player } from '../../types';

export function areFriends(player: Player, otherPlayer: Player) {
  return player.friendIds.includes(otherPlayer.id) || otherPlayer.friendIds.includes(player.id);
}

export function getPendingSentFriendRequest(
  friendRequests: FriendRequest[],
  currentPlayerId: string,
  playerId: string,
) {
  return friendRequests.find(
    (request) =>
      request.requesterPlayerId === currentPlayerId &&
      request.recipientPlayerId === playerId &&
      request.status === 'pending',
  );
}

export function getPendingFriendRequest(
  friendRequests: FriendRequest[],
  currentPlayerId: string,
  playerId: string,
) {
  return friendRequests.find(
    (request) =>
      ((request.requesterPlayerId === currentPlayerId && request.recipientPlayerId === playerId) ||
        (request.requesterPlayerId === playerId && request.recipientPlayerId === currentPlayerId)) &&
      request.status === 'pending',
  );
}
