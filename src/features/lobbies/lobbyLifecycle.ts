import type { Lobby, LobbyParticipant, LobbyStatus } from '../../types';

export const minimumMatchPlayers = 4;
export const lobbyCloseBeforeStartMinutes = 60;
export const autoCancelGraceMinutes = 5;
export const ratingOpenAfterStartMinutes = 90;
export const ratingWindowMinutes = 24 * 60;

type LifecycleLobby = Pick<Lobby, 'matchParticipantIds' | 'maxPlayers' | 'participants' | 'startsAt' | 'status'>;

export function getLobbyLifecycleStatus(lobby: LifecycleLobby, now = new Date()): LobbyStatus {
  if (lobby.status === 'draft' || lobby.status === 'cancelled') {
    return lobby.status;
  }

  const startTime = getTime(lobby.startsAt);

  if (startTime === null) {
    return lobby.status;
  }

  const nowTime = now.getTime();
  const joinedCount = getJoinedPlayerCount(lobby);
  const matchPlayerCount = getMatchParticipantIds(lobby).length;
  const autoCancelTime = startTime + minutesToMs(autoCancelGraceMinutes);
  const ratingOpenTime = startTime + minutesToMs(ratingOpenAfterStartMinutes);
  const ratingCloseTime = ratingOpenTime + minutesToMs(ratingWindowMinutes);

  if (nowTime < startTime) {
    return joinedCount >= lobby.maxPlayers ? 'full' : 'open';
  }

  if (matchPlayerCount < minimumMatchPlayers) {
    return nowTime < autoCancelTime ? 'closing_soon' : 'cancelled';
  }

  if (nowTime < ratingOpenTime) {
    return 'in_progress';
  }

  if (nowTime < ratingCloseTime) {
    return 'rating_open';
  }

  return 'completed';
}

export function applyLobbyLifecycle(lobby: Lobby, now = new Date()): Lobby {
  const status = getLobbyLifecycleStatus(lobby, now);
  const matchParticipantIds = getMatchParticipantIds(lobby);
  const shouldLockMatchParticipants =
    !lobby.matchLockedAt &&
    !lobby.matchParticipantIds?.length &&
    (status === 'in_progress' || status === 'rating_open' || status === 'completed');

  if (status === lobby.status && !shouldLockMatchParticipants) {
    return lobby;
  }

  return {
    ...lobby,
    matchLockedAt: shouldLockMatchParticipants ? now.toISOString() : lobby.matchLockedAt,
    matchParticipantIds: shouldLockMatchParticipants ? matchParticipantIds : lobby.matchParticipantIds,
    status,
  };
}

export function getJoinedPlayerCount(lobby: Pick<Lobby, 'participants'>) {
  return lobby.participants.filter(isMatchPlayerParticipant).length;
}

export function getMatchParticipantIds(lobby: Pick<Lobby, 'matchParticipantIds' | 'participants'>) {
  return lobby.matchParticipantIds?.length
    ? lobby.matchParticipantIds
    : lobby.participants.filter(isMatchPlayerParticipant).map((participant) => participant.playerId);
}

export function hasMinimumMatchPlayers(lobby: Pick<Lobby, 'participants'>) {
  return getJoinedPlayerCount(lobby) >= minimumMatchPlayers;
}

export function getAutoCancelCountdownLabel(lobby: LifecycleLobby, now = new Date()) {
  const startTime = getTime(lobby.startsAt);

  if (startTime === null || getLobbyLifecycleStatus(lobby, now) !== 'closing_soon') {
    return null;
  }

  const minutesRemaining = Math.max(Math.ceil((startTime + minutesToMs(autoCancelGraceMinutes) - now.getTime()) / 60000), 0);

  return minutesRemaining > 0 ? `Closes in ${minutesRemaining}m` : 'Closing now';
}

export function getAutoCancelMessage(lobby: LifecycleLobby, now = new Date()) {
  const countdown = getAutoCancelCountdownLabel(lobby, now);

  return countdown ? `${countdown} unless 4 players join.` : null;
}

export function isLobbyClosedForLateLeavePenalty(lobby: LifecycleLobby, now = new Date()) {
  const startTime = getTime(lobby.startsAt);

  if (startTime === null) {
    return false;
  }

  const minutesUntilStart = (startTime - now.getTime()) / 60000;

  return minutesUntilStart <= lobbyCloseBeforeStartMinutes && minutesUntilStart >= 0;
}

export function shouldApplyLateLeavePenalty(
  lobby: LifecycleLobby,
  participant: LobbyParticipant,
  now = new Date(),
) {
  return (
    isMatchPlayerParticipant(participant) &&
    isLobbyClosedForLateLeavePenalty(lobby, now) &&
    getJoinedPlayerCount(lobby) >= minimumMatchPlayers
  );
}

export function canJoinedPlayersRateLobby(lobby: LifecycleLobby, now = new Date()) {
  return getLobbyLifecycleStatus(lobby, now) === 'rating_open';
}

export function isLobbyStartedForParticipants(lobby: LifecycleLobby, now = new Date()) {
  const status = getLobbyLifecycleStatus(lobby, now);

  return status === 'in_progress' || status === 'rating_open' || status === 'completed';
}

export function isLobbyCancelled(lobby: LifecycleLobby, now = new Date()) {
  return getLobbyLifecycleStatus(lobby, now) === 'cancelled';
}

export function isMatchPlayerParticipant(participant: LobbyParticipant) {
  return (
    (participant.role === 'admin' || participant.role === 'joined') &&
    (participant.status === 'approved' || participant.status === 'attended')
  );
}

function getTime(value: string) {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? null : time;
}

function minutesToMs(minutes: number) {
  return minutes * 60 * 1000;
}
