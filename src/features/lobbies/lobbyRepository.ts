import { supabase } from '../../lib/supabase';
import type { DbLobbyMembership, DbLobbyWithRelations } from '../../lib/database.types';
import type { Lobby, Player } from '../../types';
import type { CreateLobbyDraft } from './lobbyCreateTypes';
import { getCancellationStatus, getJoinGameDecision, getJoinWaitlistDecision, getRuleExceptionReasons } from './lobbyRules';
import { mapDbLobbyToLobby } from './lobbyMappers';

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
  const emptyRows = rows.filter((row) => !hasCurrentMembership(row));

  if (emptyRows.length > 0) {
    void Promise.all(emptyRows.map((row) => deleteLobbyCascade(row.id))).catch((cleanupError) => {
      console.warn('Could not delete empty lobbies.', cleanupError);
    });
  }

  const lobbies = activeRows.map(mapDbLobbyToLobby);
  const hostRepairs = activeRows
    .map((row, index) => ({ lobby: lobbies[index], row }))
    .filter(({ lobby, row }) => lobby.adminId !== row.host_player_id);

  if (hostRepairs.length > 0) {
    void Promise.all(hostRepairs.map(({ lobby, row }) => transferLobbyHost(row.id, lobby.adminId))).catch((repairError) => {
      console.warn('Could not repair lobby host ownership.', repairError);
    });
  }

  return lobbies;
}

export async function createLobby(draft: CreateLobbyDraft, currentPlayer: Player): Promise<Lobby> {
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

  await supabase.from('lobby_memberships').insert({
    brings_ball: currentPlayer.hasBall,
    brings_court_marks: currentPlayer.hasCourtMarks,
    joined_at: new Date().toISOString(),
    lobby_id: lobby.id,
    player_id: currentPlayer.id,
    position: 1,
    role: 'host',
    status: 'joined',
  });

  await supabase.from('lobby_messages').insert({
    body: 'Game created. Use this chat to coordinate with players.',
    channel: 'all',
    lobby_id: lobby.id,
    sender_player_id: currentPlayer.id,
  });

  const { data: createdLobbyRow, error: createdLobbyError } = await supabase
    .from('lobbies')
    .select('*, locations (*), lobby_memberships (*)')
    .eq('id', lobby.id)
    .single();

  if (createdLobbyError) {
    throw createdLobbyError;
  }

  const createdLobby = mapDbLobbyToLobby(createdLobbyRow as unknown as DbLobbyWithRelations);

  return createdLobby;
}

export async function joinGame(lobby: Lobby, player: Player, allLobbies: Lobby[], accessCode?: string) {
  const decision = getJoinGameDecision(player, lobby, { accessCode, allLobbies });

  if (!decision.canJoin) {
    return {
      messages: decision.reasons,
      success: false,
    };
  }

  await upsertMembership(lobby.id, player, 'joined');

  return {
    messages: [],
    success: true,
  };
}

export async function joinWaitlist(lobby: Lobby, player: Player, allLobbies: Lobby[], accessCode?: string) {
  const decision = getJoinWaitlistDecision(player, lobby, { accessCode, allLobbies });

  if (!decision.canJoinWaitlist) {
    return {
      messages: decision.reasons,
      success: false,
    };
  }

  await upsertMembership(lobby.id, player, 'waitlisted');

  return {
    messages: [],
    success: true,
  };
}

export async function requestWaitlistApproval(lobby: Lobby, player: Player) {
  if (!lobby.exceptionRequestsEnabled) {
    return {
      messages: ['This game does not accept exception requests.'],
      success: false,
    };
  }

  const reasons = getRuleExceptionReasons(player, lobby);

  if (lobby.visibility === 'password') {
    reasons.unshift('private_access');
  }

  await upsertMembership(lobby.id, player, 'pending_approval', {
    requestMessage: 'Requesting host approval to join the waitlist.',
    requestedReasons: reasons.length > 0 ? reasons : ['approval_required'],
  });

  await createNotification({
    body: `${player.name} requested approval for ${lobby.title}.`,
    lobbyId: lobby.id,
    playerId: player.id,
    recipientPlayerId: lobby.adminId,
    title: 'New join request',
    type: 'join_request_received',
  });

  return {
    messages: [],
    success: true,
  };
}

export async function approveWaitlistRequest(lobby: Lobby, player: Player, hostPlayerId: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('lobby_memberships')
    .update({
      approved_at: now,
      approved_by_player_id: hostPlayerId,
      brings_ball: player.hasBall,
      brings_court_marks: player.hasCourtMarks,
      joined_at: now,
      request_message: null,
      requested_at: null,
      requested_reasons: [],
      role: lobby.adminId === player.id ? 'host' : 'member',
      status: 'waitlisted',
    })
    .eq('lobby_id', lobby.id)
    .eq('player_id', player.id)
    .eq('status', 'pending_approval')
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      messages: ['This request is no longer pending.'],
      success: false,
    };
  }

  await createNotification({
    body: `You were added to the waitlist for ${lobby.title}.`,
    lobbyId: lobby.id,
    playerId: hostPlayerId,
    recipientPlayerId: player.id,
    title: 'Request approved',
    type: 'request_approved',
  });

  return {
    messages: [`${player.name} approved to waitlist.`],
    success: true,
  };
}

export async function rejectJoinRequest(lobby: Lobby, player: Player, hostPlayerId: string) {
  const { data, error } = await supabase
    .from('lobby_memberships')
    .update({
      declined_at: new Date().toISOString(),
      declined_by_player_id: hostPlayerId,
      request_message: null,
      requested_at: null,
      requested_reasons: [],
      status: 'declined',
    })
    .eq('lobby_id', lobby.id)
    .eq('player_id', player.id)
    .eq('status', 'pending_approval')
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      messages: ['This request is no longer pending.'],
      success: false,
    };
  }

  await createNotification({
    body: `Your request for ${lobby.title} was declined.`,
    lobbyId: lobby.id,
    playerId: hostPlayerId,
    recipientPlayerId: player.id,
    title: 'Request rejected',
    type: 'request_rejected',
  });

  return {
    messages: [],
    success: true,
  };
}

export async function cancelJoinRequest(lobby: Lobby, player: Player) {
  const pendingRequest = lobby.joinRequests.find(
    (request) => request.playerId === player.id && request.status === 'pending',
  );

  if (!pendingRequest) {
    return {
      messages: [],
      success: false,
    };
  }

  const { error } = await supabase
    .from('lobby_memberships')
    .update({
      left_at: new Date().toISOString(),
      request_message: null,
      requested_at: null,
      requested_reasons: [],
      status: 'left',
    })
    .eq('lobby_id', lobby.id)
    .eq('player_id', player.id)
    .eq('status', 'pending_approval');

  if (error) {
    throw error;
  }

  return {
    messages: [],
    success: true,
  };
}

export async function leaveLobby(lobby: Lobby, player: Player) {
  const participant = lobby.participants.find((candidate) => candidate.playerId === player.id);

  if (!participant) {
    if (lobby.adminId === player.id) {
      await transferOrCloseLobbyAfterHostLeaves(lobby, player.id).catch((error) => {
        console.warn('Could not finish host cleanup after stale leave.', error);
      });

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

  const remainingParticipants = lobby.participants.filter((candidate) => candidate.playerId !== player.id);
  const status = participant.role === 'waitlist' ? 'cancelled_on_time' : getCancellationStatus(lobby);

  await markMembershipLeft(lobby.id, player.id, status);

  if (lobby.adminId === player.id) {
    await transferOrCloseLobbyAfterHostLeaves(lobby, player.id).catch((error) => {
      console.warn('Could not finish host transfer after leaving.', error);
    });
  } else if (remainingParticipants.length === 0) {
    await closeAndDeleteLobbyBestEffort(lobby.id);
  }

  return {
    messages: [],
    success: true,
  };
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

async function transferOrCloseLobbyAfterHostLeaves(lobby: Lobby, leavingPlayerId: string) {
  const remainingParticipants = lobby.participants.filter((candidate) => candidate.playerId !== leavingPlayerId);

  if (remainingParticipants.length === 0) {
    await closeAndDeleteLobbyBestEffort(lobby.id);
    return;
  }

  await transferLobbyHost(lobby.id, getNextHostParticipant(remainingParticipants).playerId);
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

function getNextHostParticipant(participants: Lobby['participants'][number][]) {
  return participants.find((candidate) => candidate.role === 'joined') ?? participants[0];
}

async function transferLobbyHost(lobbyId: string, nextHostPlayerId: string) {
  const { error: demoteError } = await supabase
    .from('lobby_memberships')
    .update({ role: 'member' })
    .eq('lobby_id', lobbyId)
    .in('status', ['joined', 'waitlisted', 'attended'])
    .neq('player_id', nextHostPlayerId);

  if (demoteError) {
    throw demoteError;
  }

  const { error: roleError } = await supabase
    .from('lobby_memberships')
    .update({ role: 'host' })
    .eq('lobby_id', lobbyId)
    .eq('player_id', nextHostPlayerId);

  if (roleError) {
    throw roleError;
  }

  const { error: hostError } = await supabase
    .from('lobbies')
    .update({ host_player_id: nextHostPlayerId })
    .eq('id', lobbyId);

  if (hostError) {
    throw hostError;
  }
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

async function upsertMembership(
  lobbyId: string,
  player: Player,
  status: 'joined' | 'waitlisted' | 'pending_approval',
  options: {
    approvedByPlayerId?: string;
    requestedReasons?: string[];
    requestMessage?: string;
  } = {},
) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('lobby_memberships')
    .upsert({
      approved_at: status === 'pending_approval' ? undefined : now,
      approved_by_player_id: options.approvedByPlayerId,
      brings_ball: player.hasBall,
      brings_court_marks: player.hasCourtMarks,
      declined_at: null,
      declined_by_player_id: null,
      joined_at: status === 'joined' || status === 'waitlisted' ? now : null,
      left_at: null,
      lobby_id: lobbyId,
      player_id: player.id,
      request_message: options.requestMessage ?? null,
      requested_at: status === 'pending_approval' ? now : null,
      requested_reasons: options.requestedReasons ?? [],
      role: 'member',
      status,
    }, { onConflict: 'lobby_id,player_id' });

  if (error) {
    throw error;
  }
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
    throw error;
  }
}
