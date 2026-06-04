import { supabase } from '../../lib/supabase';
import type { DbLobbyWithRelations } from '../../lib/database.types';
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

  return ((data ?? []) as unknown as DbLobbyWithRelations[]).map(mapDbLobbyToLobby);
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
        ? `Private game. Secure PIN verification is not production-ready yet. ${draft.meetingPoint}`
        : draft.meetingPoint,
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

  const nextLobbies = await listLobbies();
  const createdLobby = nextLobbies.find((candidate) => candidate.id === lobby.id) ?? mapDbLobbyToLobby(lobby as unknown as DbLobbyWithRelations);

  return createdLobby;
}

export async function joinGame(lobby: Lobby, player: Player, allLobbies: Lobby[]) {
  const decision = getJoinGameDecision(player, lobby, { allLobbies });

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

export async function joinWaitlist(lobby: Lobby, player: Player, allLobbies: Lobby[]) {
  const decision = getJoinWaitlistDecision(player, lobby, { allLobbies });

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
  await upsertMembership(lobby.id, player, 'waitlisted', {
    approvedByPlayerId: hostPlayerId,
  });

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
  const { error } = await supabase
    .from('lobby_memberships')
    .update({
      declined_at: new Date().toISOString(),
      declined_by_player_id: hostPlayerId,
      status: 'declined',
    })
    .eq('lobby_id', lobby.id)
    .eq('player_id', player.id);

  if (error) {
    throw error;
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
    return {
      messages: [],
      success: false,
    };
  }

  const status = participant.role === 'waitlist' ? 'cancelled_on_time' : getCancellationStatus(lobby);

  const { error } = await supabase
    .from('lobby_memberships')
    .update({
      left_at: new Date().toISOString(),
      status,
    })
    .eq('lobby_id', lobby.id)
    .eq('player_id', player.id);

  if (error) {
    throw error;
  }

  const remainingParticipants = lobby.participants.filter((candidate) => candidate.playerId !== player.id);

  if (remainingParticipants.length === 0) {
    const { error: closeError } = await supabase
      .from('lobbies')
      .update({ status: 'closed' })
      .eq('id', lobby.id);

    if (closeError) {
      throw closeError;
    }
  } else if (lobby.adminId === player.id) {
    const nextHost = remainingParticipants.find((candidate) => candidate.role === 'joined') ?? remainingParticipants[0];

    const { error: roleError } = await supabase
      .from('lobby_memberships')
      .update({ role: 'host' })
      .eq('lobby_id', lobby.id)
      .eq('player_id', nextHost.playerId);

    if (roleError) {
      throw roleError;
    }

    const { error: hostError } = await supabase
      .from('lobbies')
      .update({ host_player_id: nextHost.playerId })
      .eq('id', lobby.id);

    if (hostError) {
      throw hostError;
    }
  }

  return {
    messages: [],
    success: true,
  };
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
      joined_at: status === 'joined' || status === 'waitlisted' ? now : undefined,
      lobby_id: lobbyId,
      player_id: player.id,
      request_message: options.requestMessage,
      requested_at: status === 'pending_approval' ? now : undefined,
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
