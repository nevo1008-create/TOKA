import { supabase } from '../../lib/supabase';
import type { DbLobbyMembership, DbLobbyWithRelations } from '../../lib/database.types';
import type { Lobby, Player } from '../../types';
import type { CreateLobbyDraft, LobbySettingsDraft } from './lobbyCreateTypes';
import { applyLobbyLifecycle, getEffectiveLobbyStatus, isFutureStartsAt } from './lobbyDateTime';
import { getMatchParticipantIds } from './lobbyLifecycle';
import {
  getCancellationStatus,
  getJoinedParticipants,
} from './lobbyRules';
import { mapDbLobbyToLobby } from './lobbyMappers';

const lifecycleSyncKeysInFlight = new Set<string>();
const lifecycleSyncKeysCompleted = new Set<string>();

type LobbyActionRpcRow = {
  messages?: string[] | null;
  success?: boolean | null;
};

type LobbyActionRpcResult = {
  messages: string[];
  success: boolean;
};

export async function listLobbies(): Promise<Lobby[]> {
  const { data, error } = await supabase
    .from('lobbies')
    .select('*, locations (*), lobby_memberships (*)')
    .order('starts_at', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as unknown as DbLobbyWithRelations[];
  const activeRows = rows.filter(hasCurrentMembership);

  const hostRepairs = activeRows.filter(shouldSyncLobbyHost);

  if (hostRepairs.length > 0) {
    void Promise.all(hostRepairs.map((row) => syncLobbyHostBestEffort(row.id))).catch((repairError) => {
      console.warn('Could not repair lobby host ownership.', repairError);
    });
  }

  const lobbies = activeRows.map((row) => applyLobbyLifecycle(mapDbLobbyToLobby(row)));

  void Promise.all(lobbies.map((lobby, index) => syncLobbyLifecycleBestEffort(activeRows[index], lobby))).catch((syncError) => {
    console.warn('Could not sync lobby lifecycle state.', syncError);
  });

  return lobbies;
}

async function callLobbyActionRpc(
  functionName:
    | 'approve_lobby_waitlist_request'
    | 'cancel_lobby_waitlist_request'
    | 'close_lobby_by_host'
    | 'join_lobby'
    | 'join_lobby_waitlist'
    | 'kick_lobby_participant'
    | 'move_lobby_member_to_waitlist'
    | 'reject_lobby_waitlist_request'
    | 'request_lobby_waitlist_approval'
    | 'transfer_lobby_host',
  params: Record<string, string | null>,
): Promise<LobbyActionRpcResult> {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    throw error;
  }

  const row = Array.isArray(data)
    ? (data[0] as LobbyActionRpcRow | undefined)
    : (data as LobbyActionRpcRow | null | undefined);

  return {
    messages: row?.messages ?? [],
    success: Boolean(row?.success),
  };
}

export async function createLobby(draft: CreateLobbyDraft, currentPlayer: Player): Promise<Lobby> {
  const scheduleCheck = assertFutureSchedule(draft.startsAt);

  if (!scheduleCheck.success) {
    throw new Error(scheduleCheck.messages[0]);
  }

  const selectedPlayerCounts = draft.playerCounts.length > 0 ? draft.playerCounts : [draft.maxPlayers];
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .insert({
      area: 'Central Israel',
      city: draft.locationCity,
      description: draft.meetingPoint,
      name: draft.locationName,
    })
    .select()
    .single();

  if (locationError) {
    throw locationError;
  }

  const { data: lobby, error: lobbyError } = await supabase
    .from('lobbies')
    .insert({
      ball_needed: currentPlayer.hasBall,
      capacity_mode: selectedPlayerCounts.length > 1 ? 'flexible' : 'fixed',
      competitive_level: 'balanced',
      court_marks_needed: currentPlayer.hasCourtMarks,
      exception_requests_enabled: true,
      gender_rule: draft.genderRule,
      host_player_id: currentPlayer.id,
      location_description: draft.meetingPoint,
      location_id: location.id,
      max_players: Math.max(...selectedPlayerCounts),
      min_players: Math.min(...selectedPlayerCounts),
      note: draft.visibility === 'password'
        ? `Private game. ${draft.meetingPoint}`
        : draft.meetingPoint,
      pin_code_hash: draft.accessCode,
      rank_exact: draft.rankExact,
      rank_max: draft.rankMax,
      rank_min: draft.rankMin,
      rank_rule_type: draft.rankRuleType,
      starts_at: draft.startsAt,
      status: 'open',
      title: draft.title,
      visibility: draft.visibility,
      waitlist_enabled: true,
    })
    .select('*, locations (*), lobby_memberships (*)')
    .single();

  if (lobbyError) {
    throw lobbyError;
  }

  const { data: membership, error: membershipError } = await supabase
    .from('lobby_memberships')
    .insert({
      brings_ball: currentPlayer.hasBall,
      brings_court_marks: currentPlayer.hasCourtMarks,
      joined_at: new Date().toISOString(),
      lobby_id: lobby.id,
      player_id: currentPlayer.id,
      position: 1,
      role: 'host',
      status: 'joined',
    })
    .select()
    .single();

  if (membershipError) {
    throw membershipError;
  }

  void createInitialLobbyMessageBestEffort(lobby.id, currentPlayer.id);

  const createdLobby = mapDbLobbyToLobby({
    ...(lobby as unknown as DbLobbyWithRelations),
    lobby_memberships: [membership as DbLobbyMembership],
  });

  return createdLobby;
}

export async function joinGame(lobby: Lobby, player: Player, allLobbies: Lobby[], accessCode?: string) {
  return callLobbyActionRpc('join_lobby', {
    access_code: accessCode ?? null,
    target_lobby_id: lobby.id,
  });
}

export async function joinWaitlist(lobby: Lobby, player: Player, allLobbies: Lobby[], accessCode?: string) {
  return callLobbyActionRpc('join_lobby_waitlist', {
    access_code: accessCode ?? null,
    target_lobby_id: lobby.id,
  });
}

export async function requestWaitlistApproval(lobby: Lobby, player: Player) {
  return callLobbyActionRpc('request_lobby_waitlist_approval', {
    target_lobby_id: lobby.id,
  });
}

export async function approveWaitlistRequest(lobby: Lobby, player: Player, hostPlayerId: string) {
  return callLobbyActionRpc('approve_lobby_waitlist_request', {
    target_lobby_id: lobby.id,
    target_player_id: player.id,
  });
}

export async function rejectJoinRequest(lobby: Lobby, player: Player, hostPlayerId: string) {
  return callLobbyActionRpc('reject_lobby_waitlist_request', {
    target_lobby_id: lobby.id,
    target_player_id: player.id,
  });
}

export async function cancelJoinRequest(lobby: Lobby, player: Player) {
  return callLobbyActionRpc('cancel_lobby_waitlist_request', {
    target_lobby_id: lobby.id,
  });
}

export async function updateLobbySettings(lobby: Lobby, draft: LobbySettingsDraft, hostPlayerId: string) {
  const syncedLobby = await syncLobbyLifecycleForAction(lobby);

  const hostCheck = assertLobbyHost(syncedLobby, hostPlayerId);

  if (!hostCheck.success) {
    return hostCheck;
  }

  const timingCheck = assertLobbyOpenForHostRosterChanges(syncedLobby);

  if (!timingCheck.success) {
    return timingCheck;
  }

  const scheduleCheck = assertFutureSchedule(draft.startsAt);

  if (!scheduleCheck.success) {
    return scheduleCheck;
  }

  const activePlayerCount = getJoinedParticipants(syncedLobby).length;
  const selectedPlayerCounts = draft.playerCounts.length > 0 ? draft.playerCounts : [draft.maxPlayers];
  const nextMaxPlayers = Math.max(...selectedPlayerCounts);

  if (nextMaxPlayers < activePlayerCount) {
    return {
      messages: [`Player limit cannot be lower than current joined players (${activePlayerCount}).`],
      success: false,
    };
  }

  const accessCode = draft.visibility === 'password'
    ? draft.accessCode ?? syncedLobby.accessCode ?? generatePrivateAccessCode()
    : null;

  const { error } = await supabase.rpc('host_update_lobby_settings', {
    next_capacity_mode: selectedPlayerCounts.length > 1 ? 'flexible' : 'fixed',
    next_gender_rule: draft.genderRule,
    next_location_city: draft.locationCity,
    next_location_description: draft.meetingPoint,
    next_location_name: draft.locationName,
    next_max_players: nextMaxPlayers,
    next_min_players: Math.min(...selectedPlayerCounts),
    next_note: draft.visibility === 'password'
      ? `Private game. ${draft.meetingPoint}`
      : draft.meetingPoint,
    next_pin_code_hash: accessCode,
    next_rank_exact: draft.rankRuleType === 'exact' ? draft.rankExact ?? null : null,
    next_rank_max: draft.rankRuleType === 'range' ? draft.rankMax ?? null : null,
    next_rank_min: draft.rankRuleType === 'range' ? draft.rankMin ?? null : null,
    next_rank_rule_type: draft.rankRuleType,
    next_starts_at: draft.startsAt,
    next_title: draft.title,
    next_visibility: draft.visibility,
    target_lobby_id: syncedLobby.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (hasMeaningfulLobbyEdit(syncedLobby, draft, selectedPlayerCounts)) {
    await notifyCurrentLobbyMembers(syncedLobby, hostPlayerId, {
      body: `${syncedLobby.title} date, place, or player count was updated by the host.`,
      title: 'Lobby updated',
      type: 'lobby_changed',
    });
  }

  return {
    messages: ['Lobby settings updated.'],
    success: true,
  };
}

export async function moveLobbyParticipantToWaitlist(lobby: Lobby, player: Player, hostPlayerId: string) {
  return callLobbyActionRpc('move_lobby_member_to_waitlist', {
    target_lobby_id: lobby.id,
    target_player_id: player.id,
  });
}

export async function kickLobbyParticipant(lobby: Lobby, player: Player, hostPlayerId: string) {
  return callLobbyActionRpc('kick_lobby_participant', {
    target_lobby_id: lobby.id,
    target_player_id: player.id,
  });
}

export async function transferLobbyHost(lobby: Lobby, player: Player, hostPlayerId: string) {
  return callLobbyActionRpc('transfer_lobby_host', {
    target_lobby_id: lobby.id,
    target_player_id: player.id,
  });
}

export async function closeLobby(lobby: Lobby, hostPlayerId: string) {
  return callLobbyActionRpc('close_lobby_by_host', {
    target_lobby_id: lobby.id,
  });
}

export async function leaveLobby(lobby: Lobby, player: Player) {
  const syncedLobby = await syncLobbyLifecycleForAction(lobby);

  const timingCheck = assertLobbyAllowsLeave(syncedLobby);

  if (!timingCheck.success) {
    return timingCheck;
  }

  const participant = syncedLobby.participants.find((candidate) => candidate.playerId === player.id);

  if (!participant) {
    if (syncedLobby.adminId === player.id) {
      await syncLobbyHostBestEffort(syncedLobby.id);

      return {
        messages: [],
        success: true,
      };
    }

    return {
      messages: [],
      success: false,
    };
  }

  const remainingParticipants = syncedLobby.participants.filter((candidate) => candidate.playerId !== player.id);
  const status = participant.role === 'waitlist' ? 'cancelled_on_time' : getCancellationStatus(syncedLobby);

  await markMembershipLeft(syncedLobby.id, player.id, status);

  if (syncedLobby.adminId === player.id) {
    if (remainingParticipants.length === 0) {
      await closeAndDeleteLobbyBestEffort(syncedLobby.id);
    } else {
      await syncLobbyHostBestEffort(syncedLobby.id);
    }
  } else if (remainingParticipants.length === 0) {
    await closeAndDeleteLobbyBestEffort(syncedLobby.id);
  }

  return {
    messages: [],
    success: true,
  };
}

function assertLobbyHost(lobby: Lobby, hostPlayerId: string) {
  const hostParticipant = lobby.participants.find((participant) => participant.playerId === hostPlayerId);
  const isHost = lobby.adminId === hostPlayerId || hostParticipant?.role === 'admin';

  if (!isHost) {
    return {
      messages: ['Only the host can manage this lobby.'],
      success: false,
    };
  }

  return {
    messages: [],
    success: true,
  };
}

function assertFutureSchedule(startsAt: string) {
  if (!isFutureStartsAt(startsAt)) {
    return {
      messages: ['Choose a future match date and start time.'],
      success: false,
    };
  }

  return {
    messages: [],
    success: true,
  };
}

async function notifyCurrentLobbyMembers(
  lobby: Lobby,
  actorPlayerId: string | null,
  notification: {
    body: string;
    dedupe?: boolean;
    title: string;
    type: string;
  },
) {
  const recipientIds = Array.from(
    new Set(
      lobby.participants
        .map((participant) => participant.playerId)
        .filter((playerId) => (actorPlayerId ? playerId !== actorPlayerId : true)),
    ),
  );

  await Promise.all(
    recipientIds.map((recipientPlayerId) =>
      createNotificationBestEffort({
        ...notification,
        lobbyId: lobby.id,
        playerId: actorPlayerId ?? lobby.adminId,
        recipientPlayerId,
      }),
    ),
  );
}

async function createNotificationBestEffort(options: {
  body: string;
  dedupe?: boolean;
  lobbyId: string;
  playerId: string;
  recipientPlayerId: string;
  title: string;
  type: string;
}) {
  try {
    if (options.dedupe && await hasMatchingNotification(options)) {
      return;
    }

    await createNotification(options);
  } catch (error) {
    console.warn('Could not create lobby notification.', error);
  }
}

async function hasMatchingNotification(options: {
  lobbyId: string;
  playerId: string;
  recipientPlayerId: string;
  title: string;
  type: string;
}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('recipient_player_id', options.recipientPlayerId)
    .eq('related_lobby_id', options.lobbyId)
    .eq('related_player_id', options.playerId)
    .eq('type', options.type)
    .eq('title', options.title)
    .is('read_at', null)
    .limit(1);

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

function generatePrivateAccessCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function hasMeaningfulLobbyEdit(lobby: Lobby, draft: LobbySettingsDraft, selectedPlayerCounts: number[]) {
  const nextMinPlayers = Math.min(...selectedPlayerCounts);
  const nextMaxPlayers = Math.max(...selectedPlayerCounts);

  return (
    lobby.startsAt !== draft.startsAt ||
    lobby.location.name !== draft.locationName ||
    lobby.location.city !== draft.locationCity ||
    (lobby.locationDescription ?? '') !== draft.meetingPoint ||
    lobby.minPlayers !== nextMinPlayers ||
    lobby.maxPlayers !== nextMaxPlayers
  );
}

async function markMembershipLeft(
  lobbyId: string,
  playerId: string,
  status: ReturnType<typeof getCancellationStatus>,
) {
  const { error } = await supabase
    .from('lobby_memberships')
    .update({
      left_at: new Date().toISOString(),
      role: 'member',
      status,
    })
    .eq('lobby_id', lobbyId)
    .eq('player_id', playerId);

  if (error) {
    throw error;
  }
}

async function closeAndDeleteLobbyBestEffort(lobbyId: string) {
  const { error: closeError } = await supabase
    .from('lobbies')
    .update({ status: 'closed' })
    .eq('id', lobbyId);

  if (closeError) {
    console.warn('Could not mark empty lobby closed before cleanup.', closeError);
  }

  await deleteLobbyCascade(lobbyId).catch((error) => {
    console.warn('Could not delete empty lobby after last participant left.', error);
  });
}

function assertLobbyOpenForHostRosterChanges(lobby: Lobby) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status !== 'open' && status !== 'full') {
    return {
      messages: ['Player and lobby settings can only be changed before the game starts.'],
      success: false,
    };
  }

  return {
    messages: [],
    success: true,
  };
}

function assertLobbyAllowsLeave(lobby: Lobby) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status === 'open' || status === 'full' || status === 'closing_soon' || status === 'cancelled') {
    return {
      messages: [],
      success: true,
    };
  }

  return {
    messages: ['This game has already started, so lobby actions are closed.'],
    success: false,
  };
}

async function syncLobbyLifecycleBestEffort(row: DbLobbyWithRelations, lobby: Lobby) {
  const hasLifecycleStatusChanged = row.status !== lobby.status;
  const shouldPersistMatchLock = Boolean(
    lobby.matchLockedAt &&
      lobby.matchParticipantIds?.length &&
      (!row.match_locked_at || !areStringArraysEqual(row.match_participant_ids ?? [], lobby.matchParticipantIds)),
  );

  if (!hasLifecycleStatusChanged && !shouldPersistMatchLock) {
    return;
  }

  const syncKey = [
    lobby.id,
    row.status,
    lobby.status,
    row.match_locked_at ?? 'no-lock',
    lobby.matchLockedAt ?? 'no-lock',
    (row.match_participant_ids ?? []).join(','),
    (lobby.matchParticipantIds ?? []).join(','),
  ].join('|');

  if (lifecycleSyncKeysInFlight.has(syncKey) || lifecycleSyncKeysCompleted.has(syncKey)) {
    return;
  }

  lifecycleSyncKeysInFlight.add(syncKey);

  const update: Partial<{
    match_locked_at: string;
    match_participant_ids: string[];
    status: Lobby['status'];
  }> = {};

  if (hasLifecycleStatusChanged) {
    update.status = lobby.status;
  }

  if (shouldPersistMatchLock) {
    update.match_locked_at = lobby.matchLockedAt;
    update.match_participant_ids = getMatchParticipantIds(lobby);
  }

  let updateQuery = supabase
    .from('lobbies')
    .update(update)
    .eq('id', lobby.id);

  if (hasLifecycleStatusChanged && !shouldPersistMatchLock) {
    updateQuery = updateQuery.neq('status', lobby.status);
  }

  const { error } = await updateQuery;

  lifecycleSyncKeysInFlight.delete(syncKey);

  if (error) {
    console.warn('Could not persist derived lobby lifecycle state.', error.message);
    return;
  }

  lifecycleSyncKeysCompleted.add(syncKey);

  if (row.status !== 'cancelled' && lobby.status === 'cancelled') {
    await notifyCurrentLobbyMembers(lobby, null, {
      body: `${lobby.title} was cancelled because fewer than 4 players joined before the room closed.`,
      dedupe: true,
      title: 'Lobby cancelled',
      type: 'lobby_changed',
    });
  }
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function shouldSyncLobbyHost(row: DbLobbyWithRelations) {
  const memberships = row.lobby_memberships ?? [];
  const currentMemberships = memberships.filter(isCurrentMembership);
  const canonicalHostIsCurrent = currentMemberships.some((membership) => membership.player_id === row.host_player_id);
  const hasStaleHostRole = memberships.some((membership) =>
    membership.role === 'host' &&
    (membership.player_id !== row.host_player_id || !isCurrentMembership(membership)),
  );
  const canonicalHostRoleNeedsRepair = currentMemberships.some((membership) =>
    membership.player_id === row.host_player_id &&
    membership.role !== 'host',
  );

  return !canonicalHostIsCurrent || hasStaleHostRole || canonicalHostRoleNeedsRepair;
}

async function syncLobbyHostBestEffort(lobbyId: string) {
  const { error } = await supabase.rpc('sync_lobby_host', { target_lobby_id: lobbyId });

  if (error) {
    throw error;
  }
}

async function createInitialLobbyMessageBestEffort(lobbyId: string, playerId: string) {
  const { error } = await supabase.from('lobby_messages').insert({
    body: 'Game created. Use this chat to coordinate with players.',
    channel: 'all',
    lobby_id: lobbyId,
    sender_player_id: playerId,
  });

  if (error) {
    console.warn('Could not create initial lobby chat message.', error.message);
  }
}

async function syncLobbyLifecycleForAction(lobby: Lobby) {
  const { error: syncError } = await supabase.rpc('sync_lobby_lifecycle', { target_lobby_id: lobby.id });

  if (syncError) {
    console.warn('Could not sync lobby lifecycle via RPC.', syncError.message);
    return applyLobbyLifecycle(lobby);
  }

  const { data, error: loadError } = await supabase
    .from('lobbies')
    .select('*, locations (*), lobby_memberships (*)')
    .eq('id', lobby.id)
    .maybeSingle();

  if (loadError || !data) {
    console.warn('Could not reload lobby after lifecycle sync.', loadError?.message);
    return applyLobbyLifecycle(lobby);
  }

  return applyLobbyLifecycle(mapDbLobbyToLobby(data as unknown as DbLobbyWithRelations));
}

async function deleteLobbyCascade(lobbyId: string) {
  const { error: notificationError } = await supabase
    .from('notifications')
    .delete()
    .eq('related_lobby_id', lobbyId);

  if (notificationError) {
    throw notificationError;
  }

  const { error: messagesError } = await supabase
    .from('lobby_messages')
    .delete()
    .eq('lobby_id', lobbyId);

  if (messagesError) {
    throw messagesError;
  }

  const { error: membershipsError } = await supabase
    .from('lobby_memberships')
    .delete()
    .eq('lobby_id', lobbyId);

  if (membershipsError) {
    throw membershipsError;
  }

  const { error: lobbyError } = await supabase
    .from('lobbies')
    .delete()
    .eq('id', lobbyId);

  if (lobbyError) {
    throw lobbyError;
  }
}

function hasCurrentMembership(lobby: DbLobbyWithRelations) {
  return (lobby.lobby_memberships ?? []).some(isCurrentMembership);
}

function isCurrentMembership(membership: DbLobbyMembership) {
  return membership.status === 'joined' || membership.status === 'waitlisted' || membership.status === 'attended';
}

async function createNotification({
  body,
  lobbyId,
  playerId,
  recipientPlayerId,
  title,
  type,
}: {
  body: string;
  lobbyId: string;
  playerId: string;
  recipientPlayerId: string;
  title: string;
  type: string;
}) {
  const { error } = await supabase.from('notifications').insert({
    body,
    related_lobby_id: lobbyId,
    related_player_id: playerId,
    recipient_player_id: recipientPlayerId,
    title,
    type,
  });

  if (error) {
    if (isDuplicateNotificationError(error)) {
      return;
    }

    throw error;
  }
}

function isDuplicateNotificationError(error: { code?: string; message?: string }) {
  return error.code === '23505' || Boolean(error.message?.toLowerCase().includes('duplicate key'));
}
