import type { JoinRequest, Lobby, LobbyParticipant, Player } from '../../types';
import {
  getApprovalRoleDecision,
  getCancellationStatus,
  getJoinGameDecision,
  getJoinWaitlistDecision,
  getPlayerLobbyRelationship,
  getRuleExceptionReasons,
} from './lobbyRules';

type LobbyActionContext = {
  accessCode?: string;
  allLobbies?: Lobby[];
  hasInviteLink?: boolean;
  now?: Date;
};

type LobbyActionResult = {
  lobby: Lobby;
  messages: string[];
  success: boolean;
};

export function joinGame(lobby: Lobby, player: Player, context: LobbyActionContext = {}): LobbyActionResult {
  const decision = getJoinGameDecision(player, lobby, context);

  if (!decision.canJoin) {
    return {
      lobby,
      messages: decision.reasons,
      success: false,
    };
  }

  return {
    lobby: upsertParticipant(lobby, {
      bringsBall: player.hasBall,
      bringsCourtMarks: player.hasCourtMarks,
      playerId: player.id,
      role: 'joined',
      status: 'approved',
    }),
    messages: [],
    success: true,
  };
}

export function joinWaitlist(lobby: Lobby, player: Player, context: LobbyActionContext = {}): LobbyActionResult {
  const decision = getJoinWaitlistDecision(player, lobby, context);

  if (!decision.canJoinWaitlist) {
    return {
      lobby,
      messages: decision.reasons,
      success: false,
    };
  }

  return {
    lobby: upsertParticipant(lobby, {
      bringsBall: player.hasBall,
      bringsCourtMarks: player.hasCourtMarks,
      playerId: player.id,
      role: 'waitlist',
      status: 'approved',
    }),
    messages: [],
    success: true,
  };
}

export function requestLobbyApproval(lobby: Lobby, player: Player, message?: string): LobbyActionResult {
  const relationship = getPlayerLobbyRelationship(player.id, lobby);

  if (relationship === 'pending_approval') {
    return {
      lobby,
      messages: ['Player already has a pending request for this game.'],
      success: false,
    };
  }

  if (!lobby.exceptionRequestsEnabled) {
    return {
      lobby,
      messages: ['This game does not accept exception requests.'],
      success: false,
    };
  }

  const reasons = getRuleExceptionReasons(player, lobby);

  if (lobby.visibility === 'password') {
    reasons.unshift('private_access');
  }

  const request: JoinRequest = {
    id: `jr-${lobby.id}-${player.id}`,
    lobbyId: lobby.id,
    message,
    playerId: player.id,
    reasons,
    status: 'pending',
  };

  return {
    lobby: {
      ...lobby,
      joinRequests: [...lobby.joinRequests.filter((candidate) => candidate.playerId !== player.id), request],
    },
    messages: [],
    success: true,
  };
}

export function requestWaitlistApproval(lobby: Lobby, player: Player, message?: string): LobbyActionResult {
  return requestLobbyApproval(lobby, player, message ?? 'Requesting host approval to join the waitlist.');
}

export function approveJoinRequest(
  lobby: Lobby,
  player: Player,
  requestedRole: Extract<LobbyParticipant['role'], 'joined' | 'waitlist'>,
  context: LobbyActionContext = {},
): LobbyActionResult {
  const roleDecision = getApprovalRoleDecision(player, lobby, requestedRole, context);
  const nextParticipant: LobbyParticipant = {
    bringsBall: player.hasBall,
    bringsCourtMarks: player.hasCourtMarks,
    playerId: player.id,
    role: roleDecision.resolvedRole,
    status: 'approved',
  };

  return {
    lobby: {
      ...upsertParticipant(lobby, nextParticipant),
      joinRequests: lobby.joinRequests.map((request) =>
        request.playerId === player.id
          ? {
              ...request,
              adminDecisionRole: roleDecision.resolvedRole,
              status: 'approved',
            }
          : request,
      ),
    },
    messages: roleDecision.explanations,
    success: true,
  };
}

export function rejectJoinRequest(lobby: Lobby, playerId: string): Lobby {
  return {
    ...lobby,
    joinRequests: lobby.joinRequests.filter((request) => playerId !== request.playerId),
  };
}

export function cancelJoinRequest(lobby: Lobby, playerId: string): Lobby {
  return {
    ...lobby,
    joinRequests: lobby.joinRequests.filter(
      (request) => request.playerId !== playerId || request.status !== 'pending',
    ),
  };
}

export function leaveLobby(lobby: Lobby, playerId: string, now = new Date()): Lobby {
  const cancellationStatus = getCancellationStatus(lobby, now);
  const nextParticipants = lobby.participants.map((participant) =>
    participant.playerId === playerId
      ? {
          ...participant,
          status: participant.role === 'waitlist' ? 'cancelled_on_time' : cancellationStatus,
        }
      : participant,
  );
  const nextHost = lobby.adminId === playerId
    ? getNextHostParticipant(nextParticipants, playerId)
    : undefined;
  const hasCurrentParticipants = nextParticipants.some(
    (participant) => participant.playerId !== playerId && isParticipationCurrent(participant),
  );

  return {
    ...lobby,
    status: hasCurrentParticipants ? lobby.status : 'closed',
    adminId: nextHost?.playerId ?? lobby.adminId,
    participants: nextHost
      ? nextParticipants.map((participant) =>
          participant.playerId === nextHost.playerId
            ? {
                ...participant,
                role: 'admin',
              }
            : participant,
        )
      : nextParticipants,
  };
}

function getNextHostParticipant(participants: LobbyParticipant[], leavingPlayerId: string) {
  return (
    participants.find(
      (participant) =>
        participant.playerId !== leavingPlayerId &&
        participant.role === 'joined' &&
        isParticipationCurrent(participant),
    ) ??
    participants.find(
      (participant) =>
        participant.playerId !== leavingPlayerId &&
        participant.role === 'waitlist' &&
        isParticipationCurrent(participant),
    )
  );
}

function isParticipationCurrent(participant: LobbyParticipant) {
  return participant.status === 'approved' || participant.status === 'attended';
}

function upsertParticipant(lobby: Lobby, participant: LobbyParticipant): Lobby {
  const nextParticipants = lobby.participants.some((candidate) => candidate.playerId === participant.playerId)
    ? lobby.participants.map((candidate) => (candidate.playerId === participant.playerId ? participant : candidate))
    : [...lobby.participants, participant];

  return {
    ...lobby,
    joinRequests: lobby.joinRequests.filter(
      (request) => request.playerId !== participant.playerId || request.status !== 'pending',
    ),
    participants: nextParticipants,
  };
}
