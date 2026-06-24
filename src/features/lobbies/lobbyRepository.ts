import { supabase } from '../../lib/supabase';
import type { DbLobbyMembership, DbLobbyWithRelations } from '../../lib/database.types';
import type { Lobby, Player } from '../../types';
import type { CreateLobbyDraft, LobbySettingsDraft } from './lobbyCreateTypes';
import { applyLobbyLifecycle, getEffectiveLobbyStatus, isFutureStartsAt } from './lobbyDateTime';
import {
  getJoinedParticipants,
} from './lobbyRules';
import { mapDbLobbyToLobby } from './lobbyMappers';

const lifecycleSyncKeysInFlight = new Set<string>();
const lifecycleSyncKeysCompleted = new Set<string>();

type LobbyActionRpcRow = {
  messages?: string[] | null;
  sent_count?: number | null;
  success?: boolean | null;
};

type LobbyActionRpcResult = {
  messages: string[];
  sentCount?: number;
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

  const lobbyEntries = activeRows.map((row) => ({
    lobby: applyLobbyLifecycle(mapDbLobbyToLobby(row)),
    row,
  }));

  const autoCancelledEntries = lobbyEntries.filter((entry) => entry.row.status !== 'cancelled' && entry.lobby.status === 'cancelled');

  if (autoCancelledEntries.length > 0) {
    await Promise.all(autoCancelledEntries.map((entry) => syncLobbyLifecycleBestEffort(entry.row, entry.lobby)));
  }

  const activeLobbyEntries = lobbyEntries.filter((entry) => entry.lobby.status !== 'cancelled');
  const lobbies = activeLobbyEntries.map((entry) => entry.lobby);

  void Promise.all(activeLobbyEntries.map((entry) => syncLobbyLifecycleBestEffort(entry.row, entry.lobby))).catch((syncError) => {
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
    | 'leave_lobby'
    | 'move_lobby_member_to_waitlist'
    | 'reject_lobby_waitlist_request'
    | 'request_lobby_waitlist_approval'
    | 'send_lobby_invites'
    | 'transfer_lobby_host',
  params: Record<string, string | string[] | null>,
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
    sentCount: typeof row?.sent_count === 'number' ? row.sent_count : undefined,
    success: Boolean(row?.success),
  };
}

export async function createLobby(draft: CreateLobbyDraft): Promise<Lobby> {
  const scheduleCheck = assertFutureSchedule(draft.startsAt);

  if (!scheduleCheck.success) {
    throw new Error(scheduleCheck.messages[0]);
  }

  const selectedPlayerCounts = draft.playerCounts.length > 0 ? draft.playerCounts : [draft.maxPlayers];
  const { data: createdLobby, error: createError } = await supabase.rpc('create_lobby', {
    next_capacity_mode: selectedPlayerCounts.length > 1 ? 'flexible' : 'fixed',
    next_gender_rule: draft.genderRule,
    next_location_city: draft.locationCity,
    next_location_description: draft.meetingPoint,
    next_location_name: draft.locationName,
    next_max_players: Math.max(...selectedPlayerCounts),
    next_min_players: Math.min(...selectedPlayerCounts),
    next_note: draft.visibility === 'password'
      ? `Private game. ${draft.meetingPoint}`
      : draft.meetingPoint,
    next_pin_code_hash: draft.accessCode ?? null,
    next_rank_exact: draft.rankRuleType === 'exact' ? draft.rankExact ?? null : null,
    next_rank_max: draft.rankRuleType === 'range' ? draft.rankMax ?? null : null,
    next_rank_min: draft.rankRuleType === 'range' ? draft.rankMin ?? null : null,
    next_rank_rule_type: draft.rankRuleType,
    next_starts_at: draft.startsAt,
    next_title: draft.title,
    next_visibility: draft.visibility,
  });

  if (createError) {
    throw createError;
  }

  const { data: lobby, error: loadError } = await supabase
    .from('lobbies')
    .select('*, locations (*), lobby_memberships (*)')
    .eq('id', createdLobby.id)
    .single();

  if (loadError) {
    throw loadError;
  }

  return mapDbLobbyToLobby(lobby as unknown as DbLobbyWithRelations);
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

  return {
    messages: ['Lobby settings updated.'],
    success: true,
  };
}

export async function sendLobbyInvites(lobby: Lobby, playerIds: string[]) {
  return callLobbyActionRpc('send_lobby_invites', {
    target_lobby_id: lobby.id,
    target_player_ids: playerIds,
  });
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
  return callLobbyActionRpc('leave_lobby', {
    target_lobby_id: lobby.id,
  });
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

function generatePrivateAccessCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
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

  try {
    const { error } = await supabase.rpc('sync_lobby_lifecycle', { target_lobby_id: lobby.id });

    if (error) {
      console.warn('Could not persist derived lobby lifecycle state.', error.message);
      return;
    }

    lifecycleSyncKeysCompleted.add(syncKey);
  } finally {
    lifecycleSyncKeysInFlight.delete(syncKey);
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

function hasCurrentMembership(lobby: DbLobbyWithRelations) {
  return (lobby.lobby_memberships ?? []).some(isCurrentMembership);
}

function isCurrentMembership(membership: DbLobbyMembership) {
  return membership.status === 'joined' || membership.status === 'waitlisted' || membership.status === 'attended';
}
