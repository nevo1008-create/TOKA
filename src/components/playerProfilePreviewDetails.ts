import type { Lobby, Player } from '../types';
import { getEffectiveLobbyStatus } from '../features/lobbies/lobbyDateTime';
import type { PlayerPreviewDetail } from './PlayerProfilePreview';

export function getPlayerCompletedGamesCount(player: Player, lobbies: Lobby[] = []) {
  const completedLobbies = getPlayerCompletedLobbies(player, lobbies);

  return completedLobbies.length || player.gamesPlayed;
}

export function getPlayerHostedGamesCount(player: Player, lobbies: Lobby[] = []) {
  return lobbies.filter((lobby) => lobby.adminId === player.id && hasLobbyReachedRatingStage(lobby)).length;
}

export function getPlayerDisplayRating(player: Player, currentPlayerId?: string) {
  if (player.id === currentPlayerId || player.id === 'p4') {
    return '3.6';
  }

  if (player.id === 'p3') {
    return '4.0';
  }

  return '3.2';
}

export function getPlayerPreviewTrustCues(player: Player, lobbies: Lobby[] = []): PlayerPreviewDetail[] {
  return [
    {
      icon: 'calendar-outline',
      label: 'Completed games',
      tone: 'aqua',
      value: `${getPlayerCompletedGamesCount(player, lobbies)}`,
    },
    {
      icon: 'flag-outline',
      label: 'Hosted games',
      value: `${getPlayerHostedGamesCount(player, lobbies)}`,
    },
  ];
}

export function getPlayerCompletedLobbies(player: Player, lobbies: Lobby[]) {
  return lobbies.filter(
    (lobby) =>
      lobby.status === 'completed' &&
      lobby.participants.some((participant) => participant.playerId === player.id && participant.status !== 'removed'),
  );
}

function hasLobbyReachedRatingStage(lobby: Lobby) {
  const status = getEffectiveLobbyStatus(lobby);

  return status === 'rating_open' || status === 'completed';
}

export function getPlayerPreviewPlayingDetails(player: Player): PlayerPreviewDetail[] {
  return [
    {
      icon: 'location',
      label: 'Preferred location',
      tone: 'aqua',
      value: player.area,
    },
    {
      icon: 'walk-outline',
      label: 'Foot',
      value: capitalize(player.preferredFoot),
    },
    {
      icon: 'swap-horizontal-outline',
      label: 'Side',
      value: capitalize(player.side),
    },
  ];
}

export function getFallbackPreviewPlayingDetails(): PlayerPreviewDetail[] {
  return [
    {
      icon: 'location',
      label: 'Preferred location',
      tone: 'aqua',
      value: 'Profile not completed',
    },
    {
      icon: 'walk-outline',
      label: 'Foot',
      value: 'Profile not completed',
    },
    {
      icon: 'swap-horizontal-outline',
      label: 'Side',
      value: 'Profile not completed',
    },
  ];
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
