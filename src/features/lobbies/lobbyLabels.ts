import type { Lobby, LobbyParticipant } from '../../types';

export const lobbyLabels = {
  accessRequested: 'Access requested',
  cancelRequest: 'Cancel request',
  host: 'Host',
  joined: 'Joined',
  joinWaitlist: 'Join waitlist',
  moveToPlayers: 'Move to players',
  moveToWaitlist: 'Move to waitlist',
  onWaitlist: 'On waitlist',
  requestWaitlist: 'Request waitlist',
  viewMatch: 'View match',
  waitingForHostApproval: 'Waiting for host approval',
} as const;

export function isLobbyHost(lobby: Lobby, playerId: string, participant?: LobbyParticipant) {
  return lobby.adminId === playerId || participant?.role === 'admin';
}

export function getLobbyMembershipBadgeLabel(lobby: Lobby, playerId: string, participant?: LobbyParticipant) {
  if (isLobbyHost(lobby, playerId, participant)) {
    return lobbyLabels.host;
  }

  return participant ? lobbyLabels.joined : undefined;
}

export function getLobbyMembershipStatusLabel(lobby: Lobby, playerId: string, participant?: LobbyParticipant) {
  if (isLobbyHost(lobby, playerId, participant)) {
    return lobbyLabels.host;
  }

  if (participant?.role === 'waitlist') {
    return lobbyLabels.onWaitlist;
  }

  return participant ? lobbyLabels.joined : lobbyLabels.accessRequested;
}
