import { playerLevels, type JoinRequestReason, type Lobby, type LobbyParticipant, type Player } from '../../types';
import { getMinutesBetweenLobbyStarts, getMinutesUntilLobbyStart } from './lobbyDateTime';

export const commitmentConflictWindowMinutes = 90;
export const defaultCancellationPenaltyMinutes = 90;

export type LobbyRelationship =
  | 'none'
  | 'joined'
  | 'waitlist'
  | 'pending_approval'
  | 'rejected'
  | 'cancelled_on_time'
  | 'cancelled_late'
  | 'no_show'
  | 'attended';

export type LobbyAccessDecision =
  | {
      canEnterLobby: true;
      kind: 'can_enter';
      label: 'Open game';
      reasons: JoinRequestReason[];
    }
  | {
      canEnterLobby: false;
      kind: 'request_approval';
      label: 'Request approval';
      reasons: JoinRequestReason[];
    }
  | {
      canEnterLobby: false;
      kind: 'requires_password';
      label: 'Enter password';
      reasons: JoinRequestReason[];
    }
  | {
      canEnterLobby: false;
      kind: 'locked';
      label: 'Locked';
      reasons: JoinRequestReason[];
    }
  | {
      canEnterLobby: false;
      kind: 'pending_approval';
      label: 'Request pending';
      reasons: JoinRequestReason[];
    };

export type LobbyJoinDecision =
  | {
      canJoin: true;
      kind: 'join_game';
      label: string;
    }
  | {
      canJoin: false;
      kind:
        | 'already_joined'
        | 'closed'
        | 'commitment_conflict'
        | 'full_join_waitlist'
        | 'locked'
        | 'pending_approval'
        | 'waitlist_only';
      label: string;
      reasons: string[];
    };

export type LobbyWaitlistDecision =
  | {
      canJoinWaitlist: true;
      kind: 'join_waitlist';
      label: string;
    }
  | {
      canJoinWaitlist: false;
      kind: 'already_joined' | 'already_waitlisted' | 'closed' | 'locked' | 'pending_approval' | 'waitlist_disabled';
      label: string;
      reasons: string[];
    };

export type ApprovalRoleDecision = {
  explanations: string[];
  requestedRole: Extract<LobbyParticipant['role'], 'joined' | 'waitlist'>;
  resolvedRole: Extract<LobbyParticipant['role'], 'joined' | 'waitlist'>;
};

type LobbyDecisionContext = {
  accessCode?: string;
  allLobbies?: Lobby[];
  hasInviteLink?: boolean;
  ignorePendingApproval?: boolean;
  now?: Date;
};

export function isJoinedParticipant(participant: LobbyParticipant) {
  return (participant.role === 'admin' || participant.role === 'joined') && isParticipationCurrent(participant);
}

export function isWaitlistParticipant(participant: LobbyParticipant) {
  return participant.role === 'waitlist' && isParticipationCurrent(participant);
}

export function getJoinedParticipants(lobby: Lobby) {
  return lobby.participants.filter(isJoinedParticipant);
}

export function getWaitlistParticipants(lobby: Lobby) {
  return lobby.participants.filter(isWaitlistParticipant);
}

export function getLobbySpotsRemaining(lobby: Lobby) {
  return Math.max(lobby.maxPlayers - getJoinedParticipants(lobby).length, 0);
}

export function isLobbyFull(lobby: Lobby) {
  return getLobbySpotsRemaining(lobby) === 0;
}

export function getPlayerParticipant(lobby: Lobby, playerId: string) {
  return lobby.participants.find((participant) => participant.playerId === playerId);
}

export function getPlayerLobbyRelationship(playerId: string, lobby: Lobby): LobbyRelationship {
  const participant = getPlayerParticipant(lobby, playerId);

  if (participant) {
    if (participant.status === 'cancelled_late') {
      return 'cancelled_late';
    }

    if (participant.status === 'cancelled_on_time' || participant.status === 'removed') {
      return 'cancelled_on_time';
    }

    if (participant.status === 'no_show') {
      return 'no_show';
    }

    if (participant.status === 'attended') {
      return 'attended';
    }

    if (participant.role === 'waitlist') {
      return 'waitlist';
    }

    return 'joined';
  }

  const request = lobby.joinRequests.find((candidate) => candidate.playerId === playerId);

  if (request?.status === 'pending') {
    return 'pending_approval';
  }

  if (request?.status === 'rejected') {
    return 'rejected';
  }

  return 'none';
}

export function getRuleExceptionReasons(player: Player, lobby: Lobby): JoinRequestReason[] {
  const reasons: JoinRequestReason[] = [];

  if (!doesPlayerMatchLevelRule(player, lobby)) {
    reasons.push('level_exception');
  }

  if (!doesPlayerMatchGenderRule(player, lobby)) {
    reasons.push('gender_exception');
  }

  return reasons;
}

export function getLobbyAccessDecision(player: Player, lobby: Lobby, context: LobbyDecisionContext = {}): LobbyAccessDecision {
  const relationship = getContextualRelationship(player.id, lobby, context);
  const exceptionReasons = getRuleExceptionReasons(player, lobby);
  const hasPrivateAccess = hasLobbyPrivateAccess(lobby, context);

  if (relationship !== 'none' && relationship !== 'rejected' && relationship !== 'pending_approval') {
    return {
      canEnterLobby: true,
      kind: 'can_enter',
      label: 'Open game',
      reasons: [],
    };
  }

  if (lobby.visibility === 'password' && !hasPrivateAccess) {
    return {
      canEnterLobby: false,
      kind: 'requires_password',
      label: 'Enter password',
      reasons: ['private_access', ...exceptionReasons],
    };
  }

  if (lobby.visibility === 'password' && hasPrivateAccess) {
    return {
      canEnterLobby: true,
      kind: 'can_enter',
      label: 'Open game',
      reasons: [],
    };
  }

  if (relationship === 'pending_approval') {
    return {
      canEnterLobby: false,
      kind: 'pending_approval',
      label: 'Request pending',
      reasons: exceptionReasons,
    };
  }

  if (context.hasInviteLink && lobby.visibility !== 'password') {
    return {
      canEnterLobby: true,
      kind: 'can_enter',
      label: 'Open game',
      reasons: [],
    };
  }

  if (exceptionReasons.length > 0) {
    return lobby.exceptionRequestsEnabled
      ? {
          canEnterLobby: false,
          kind: 'request_approval',
          label: 'Request approval',
          reasons: exceptionReasons,
        }
      : {
          canEnterLobby: false,
          kind: 'locked',
          label: 'Locked',
          reasons: exceptionReasons,
        };
  }

  return {
    canEnterLobby: true,
    kind: 'can_enter',
    label: 'Open game',
    reasons: [],
  };
}

export function getJoinGameDecision(player: Player, lobby: Lobby, context: LobbyDecisionContext = {}): LobbyJoinDecision {
  const relationship = getContextualRelationship(player.id, lobby, context);

  if (relationship === 'joined' || relationship === 'attended') {
    return {
      canJoin: false,
      kind: 'already_joined',
      label: 'Joined',
      reasons: ['Player is already committed to this game.'],
    };
  }

  if (relationship === 'pending_approval') {
    return {
      canJoin: false,
      kind: 'pending_approval',
      label: 'Request pending',
      reasons: ['Host approval is still pending.'],
    };
  }

  if (isLobbyClosedForJoining(lobby)) {
    return {
      canJoin: false,
      kind: 'closed',
      label: 'Closed',
      reasons: ['This game is not open for new commitments.'],
    };
  }

  const access = getLobbyAccessDecision(player, lobby, context);

  if (!access.canEnterLobby) {
    return {
      canJoin: false,
      kind: 'locked',
      label: access.label,
      reasons: access.reasons,
    };
  }

  if (isLobbyFull(lobby)) {
    return {
      canJoin: false,
      kind: 'full_join_waitlist',
      label: lobby.waitlistEnabled ? 'Join waitlist' : 'Full',
      reasons: ['This game has no open joined-player slots.'],
    };
  }

  const conflict = getJoinedCommitmentConflict(player.id, lobby, context.allLobbies ?? []);

  if (conflict) {
    return {
      canJoin: false,
      kind: 'commitment_conflict',
      label: 'Join waitlist',
      reasons: [`Player is already joined to ${conflict.title} within 90 minutes of this game.`],
    };
  }

  if (relationship === 'waitlist') {
    return {
      canJoin: true,
      kind: 'join_game',
      label: 'Move to joined players',
    };
  }

  return {
    canJoin: false,
    kind: 'waitlist_only',
    label: 'Join waitlist',
    reasons: ['Player must join the waitlist before moving into players.'],
  };
}

export function getJoinWaitlistDecision(player: Player, lobby: Lobby, context: LobbyDecisionContext = {}): LobbyWaitlistDecision {
  const relationship = getContextualRelationship(player.id, lobby, context);

  if (relationship === 'waitlist') {
    return {
      canJoinWaitlist: false,
      kind: 'already_waitlisted',
      label: 'On waitlist',
      reasons: ['Player is already on the waitlist.'],
    };
  }

  if (relationship === 'joined' || relationship === 'attended') {
    return {
      canJoinWaitlist: true,
      kind: 'join_waitlist',
      label: 'Move to waitlist',
    };
  }

  if (relationship === 'pending_approval') {
    return {
      canJoinWaitlist: false,
      kind: 'pending_approval',
      label: 'Request pending',
      reasons: ['Host approval is still pending.'],
    };
  }

  if (!lobby.waitlistEnabled) {
    return {
      canJoinWaitlist: false,
      kind: 'waitlist_disabled',
      label: 'Waitlist closed',
      reasons: ['This game does not have a waitlist.'],
    };
  }

  if (isLobbyClosedForJoining(lobby)) {
    return {
      canJoinWaitlist: false,
      kind: 'closed',
      label: 'Closed',
      reasons: ['This game is not open for waitlist joins.'],
    };
  }

  const access = getLobbyAccessDecision(player, lobby, context);

  if (!access.canEnterLobby) {
    return {
      canJoinWaitlist: false,
      kind: 'locked',
      label: access.label,
      reasons: access.reasons,
    };
  }

  return {
    canJoinWaitlist: true,
    kind: 'join_waitlist',
    label: 'Join waitlist',
  };
}

export function getApprovalRoleDecision(
  player: Player,
  lobby: Lobby,
  requestedRole: Extract<LobbyParticipant['role'], 'joined' | 'waitlist'>,
  context: LobbyDecisionContext = {},
): ApprovalRoleDecision {
  if (requestedRole === 'waitlist') {
    return {
      explanations: [],
      requestedRole,
      resolvedRole: 'waitlist',
    };
  }

  const joinDecision = getJoinGameDecision(player, lobby, {
    ...context,
    hasInviteLink: true,
    ignorePendingApproval: true,
  });

  if (joinDecision.canJoin) {
    return {
      explanations: [],
      requestedRole,
      resolvedRole: 'joined',
    };
  }

  return {
    explanations: joinDecision.reasons,
    requestedRole,
    resolvedRole: 'waitlist',
  };
}

export function getCancellationStatus(lobby: Lobby, now = new Date()): Extract<LobbyParticipant['status'], 'cancelled_late' | 'cancelled_on_time'> {
  const penaltyMinutes = lobby.cancellationPenaltyMinutes ?? defaultCancellationPenaltyMinutes;

  return getMinutesUntilLobbyStart(lobby.startsAt, now) < penaltyMinutes ? 'cancelled_late' : 'cancelled_on_time';
}

export function getJoinedCommitmentConflict(playerId: string, targetLobby: Lobby, allLobbies: Lobby[]) {
  return allLobbies.find((lobby) => {
    if (lobby.id === targetLobby.id) {
      return false;
    }

    return (
      lobby.participants.some((participant) => participant.playerId === playerId && isJoinedParticipant(participant)) &&
      getMinutesBetweenLobbyStarts(lobby.startsAt, targetLobby.startsAt) < commitmentConflictWindowMinutes
    );
  });
}

function doesPlayerMatchLevelRule(player: Player, lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return true;
  }

  if (lobby.rankRuleType === 'exact') {
    return player.level === lobby.rankExact;
  }

  const playerIndex = playerLevels.indexOf(player.level);
  const minIndex = lobby.rankMin ? playerLevels.indexOf(lobby.rankMin) : 0;
  const maxIndex = lobby.rankMax ? playerLevels.indexOf(lobby.rankMax) : playerLevels.length - 1;

  return playerIndex >= minIndex && playerIndex <= maxIndex;
}

function getContextualRelationship(playerId: string, lobby: Lobby, context: LobbyDecisionContext) {
  const relationship = getPlayerLobbyRelationship(playerId, lobby);

  if (relationship === 'pending_approval' && (context.ignorePendingApproval || hasLobbyPrivateAccess(lobby, context))) {
    return 'none';
  }

  return relationship;
}

function doesPlayerMatchGenderRule(player: Player, lobby: Lobby) {
  return lobby.genderRule === 'everyone' || lobby.genderRule === player.gender;
}

function hasLobbyPrivateAccess(lobby: Lobby, context: LobbyDecisionContext) {
  if (lobby.visibility !== 'password') {
    return true;
  }

  return Boolean(context.hasInviteLink || (context.accessCode && lobby.accessCode === context.accessCode));
}

function isParticipationCurrent(participant: LobbyParticipant) {
  return participant.status === 'approved' || participant.status === 'attended';
}

function isLobbyClosedForJoining(lobby: Lobby) {
  return lobby.status === 'completed' || lobby.status === 'closed' || lobby.status === 'in_progress' || lobby.status === 'rating_open';
}
