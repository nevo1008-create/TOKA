import type { Lobby, RatingTask } from '../../types';
import { isLobbyReadyForRatings } from '../lobbies/lobbyDateTime';
import { getJoinedParticipants } from '../lobbies/lobbyRules';

export function getRatingParticipantIds(lobby: Lobby) {
  return getJoinedParticipants(lobby).map((participant) => participant.playerId);
}

export function canPlayerRateLobby(lobby: Lobby, playerId: string) {
  return isLobbyReadyForRatings(lobby) && getRatingParticipantIds(lobby).includes(playerId);
}

export function getRatingTargetIds(lobby: Lobby, playerId: string) {
  if (!canPlayerRateLobby(lobby, playerId)) {
    return [];
  }

  return getRatingParticipantIds(lobby).filter((targetPlayerId) => targetPlayerId !== playerId);
}

export function getRatingTaskForLobby(ratingTasks: RatingTask[], lobby: Lobby, playerId: string) {
  return ratingTasks.find((task) => task.lobbyId === lobby.id && task.playerId === playerId) ?? null;
}

export function getRemainingRatingTargetIds(ratingTasks: RatingTask[], lobby: Lobby, playerId: string) {
  const targetIds = getRatingTargetIds(lobby, playerId);
  const task = getRatingTaskForLobby(ratingTasks, lobby, playerId);

  if (!task) {
    return targetIds;
  }

  if (task.status === 'completed') {
    return [];
  }

  return task.remainingPlayerIds.filter((targetPlayerId) => targetIds.includes(targetPlayerId));
}

export function canRatePlayer(ratingTasks: RatingTask[], lobby: Lobby, playerId: string, targetPlayerId: string) {
  return getRemainingRatingTargetIds(ratingTasks, lobby, playerId).includes(targetPlayerId);
}

export function hasCompletedLobbyRatings(ratingTasks: RatingTask[], lobby: Lobby, playerId: string) {
  const targetIds = getRatingTargetIds(lobby, playerId);

  return targetIds.length > 0 && getRemainingRatingTargetIds(ratingTasks, lobby, playerId).length === 0;
}

export function shouldShowRatingLobby(lobby: Lobby, playerId: string) {
  return canPlayerRateLobby(lobby, playerId);
}
