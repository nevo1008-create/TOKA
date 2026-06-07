import type {
  DbLobbyMembership,
  DbLobbyWithRelations,
  DbLobbyMessage,
  DbNotification,
} from '../../lib/database.types';
import type {
  ChatMessage,
  JoinRequest,
  JoinRequestReason,
  Lobby,
  LobbyParticipant,
  Notification,
  ParticipantStatus,
} from '../../types';

export function mapDbLobbyToLobby(row: DbLobbyWithRelations): Lobby {
  const memberships = row.lobby_memberships ?? [];
  const currentMemberships = memberships
    .filter(isCurrentMembership)
    .sort(sortMemberships);
  const adminId = getRenderableAdminId(row.host_player_id, currentMemberships);
  const participants = currentMemberships
    .map((membership) => mapMembershipToParticipant(membership, adminId));
  const joinRequests = memberships
    .filter(isPendingRequest)
    .sort(sortMemberships)
    .map(mapMembershipToJoinRequest);
  const status = participants.length > 0 ? row.status : 'closed';

  return {
    accessCode: row.pin_code_hash ?? undefined,
    adminId,
    ballNeeded: row.ball_needed,
    cancellationPenaltyMinutes: row.cancellation_penalty_minutes ?? undefined,
    capacityMode: row.capacity_mode,
    chatChannels: [
      {
        id: `${row.id}-all`,
        lobbyId: row.id,
        participantRoles: ['admin', 'joined', 'waitlist'],
        title: 'All lobby',
        type: 'all',
        unreadCount: 0,
      },
      {
        id: `${row.id}-active`,
        lobbyId: row.id,
        participantRoles: ['admin', 'joined'],
        title: 'Host and active players',
        type: 'admin_joined',
        unreadCount: 0,
      },
    ],
    competitiveLevel: row.competitive_level ?? undefined,
    courtMarksNeeded: row.court_marks_needed,
    exceptionRequestsEnabled: row.exception_requests_enabled,
    genderRule: row.gender_rule,
    id: row.id,
    joinRequests,
    location: {
      area: row.locations?.area ?? '',
      city: row.locations?.city ?? '',
      description: row.locations?.description ?? undefined,
      distanceKm: row.locations?.distance_km ?? undefined,
      id: row.location_id,
      name: row.locations?.name ?? 'Unknown beach',
    },
    locationDescription: row.location_description ?? undefined,
    maxPlayers: row.max_players,
    minPlayers: row.min_players,
    note: row.note,
    participants: participants.map((participant) =>
      participant.playerId === adminId && participant.role !== 'waitlist'
        ? {
            ...participant,
            role: 'admin',
          }
        : participant,
    ),
    rankExact: row.rank_exact ?? undefined,
    rankMax: row.rank_max ?? undefined,
    rankMin: row.rank_min ?? undefined,
    rankRuleType: row.rank_rule_type,
    startsAt: row.starts_at,
    status,
    title: row.title,
    visibility: row.visibility,
    waitlistEnabled: row.waitlist_enabled,
  };
}

export function mapDbMessageToChatMessage(row: DbLobbyMessage): ChatMessage {
  return {
    body: row.body,
    channelId: row.channel === 'all' ? `${row.lobby_id}-all` : `${row.lobby_id}-active`,
    createdAt: row.created_at,
    id: row.id,
    lobbyId: row.lobby_id,
    playerId: row.sender_player_id,
  };
}

export function getDbChannelFromChannelId(channelId: string) {
  return channelId.endsWith('-active') ? 'admin_joined' : 'all';
}

export function mapDbNotificationToNotification(row: DbNotification): Notification {
  return {
    body: row.body,
    id: row.id,
    lobbyId: row.related_lobby_id ?? undefined,
    read: Boolean(row.read_at),
    title: row.title,
    type: mapNotificationType(row.type),
  };
}

function mapMembershipToParticipant(membership: DbLobbyMembership, hostPlayerId: string): LobbyParticipant {
  return {
    bringsBall: membership.brings_ball,
    bringsCourtMarks: membership.brings_court_marks,
    playerId: membership.player_id,
    role: membership.status === 'waitlisted'
      ? 'waitlist'
      : membership.player_id === hostPlayerId
        ? 'admin'
        : 'joined',
    status: mapMembershipStatusToParticipantStatus(membership.status),
  };
}

function mapMembershipToJoinRequest(membership: DbLobbyMembership): JoinRequest {
  return {
    id: membership.id,
    lobbyId: membership.lobby_id,
    message: membership.request_message ?? undefined,
    playerId: membership.player_id,
    reasons: membership.requested_reasons.filter(isJoinRequestReason),
    status: 'pending',
  };
}

function mapMembershipStatusToParticipantStatus(status: DbLobbyMembership['status']): ParticipantStatus {
  if (status === 'cancelled_late' || status === 'cancelled_on_time' || status === 'no_show' || status === 'attended' || status === 'removed') {
    return status;
  }

  return 'approved';
}

function mapNotificationType(type: string): Notification['type'] {
  if (
    type === 'join_request' ||
    type === 'request_approved' ||
    type === 'request_rejected' ||
    type === 'room_invite' ||
    type === 'waitlist_update' ||
    type === 'rating_required' ||
    type === 'lobby_changed'
  ) {
    return type;
  }

  if (type === 'join_request_received') {
    return 'join_request';
  }

  if (type === 'join_request_approved') {
    return 'request_approved';
  }

  if (type === 'join_request_declined') {
    return 'request_rejected';
  }

  return 'lobby_changed';
}

function isCurrentMembership(membership: DbLobbyMembership) {
  return membership.status === 'joined' || membership.status === 'waitlisted' || membership.status === 'attended';
}

function getRenderableAdminId(savedAdminId: string, memberships: DbLobbyMembership[]) {
  const savedHostIsCurrent = memberships.some((membership) => membership.player_id === savedAdminId);

  if (savedHostIsCurrent) {
    return savedAdminId;
  }

  return (
    memberships.find((membership) => membership.status === 'joined')?.player_id ??
    memberships.find((membership) => membership.status === 'waitlisted')?.player_id ??
    memberships[0]?.player_id ??
    savedAdminId
  );
}

function isPendingRequest(membership: DbLobbyMembership) {
  return membership.status === 'pending_approval';
}

function sortMemberships(first: DbLobbyMembership, second: DbLobbyMembership) {
  return (first.position ?? 0) - (second.position ?? 0);
}

function isJoinRequestReason(reason: string): reason is JoinRequestReason {
  return reason === 'approval_required' || reason === 'level_exception' || reason === 'gender_exception' || reason === 'private_access';
}
