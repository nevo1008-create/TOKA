import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  chatMessages as mockChatMessages,
  lobbies as mockLobbies,
  notifications as mockNotifications,
  ratingTasks as mockRatingTasks,
} from '../../data/mock';
import { listLobbyMessages, sendLobbyMessage as persistLobbyMessage } from '../chat/chatRepository';
import {
  listNotifications,
  markNotificationRead as persistNotificationRead,
  markNotificationsRead,
} from '../notifications/notificationRepository';
import type { ChatMessage, JoinRequestReason, Lobby, LobbyParticipant, Notification, Player, RatingTask, SkillRankVoteType } from '../../types';
import {
  listSubmittedRatingTasks,
  submitPlayerRating as persistSubmitPlayerRating,
} from '../ratings/ratingRepository';
import { getRatingTargetIds, getRemainingRatingTargetIds } from '../ratings/ratingRules';
import type { CreateLobbyDraft, LobbySettingsDraft } from './lobbyCreateTypes';
import { applyLobbyLifecycle } from './lobbyDateTime';
import { getUniqueLobbies } from './lobbyListUtils';
import { shouldApplyLateLeavePenalty } from './lobbyLifecycle';
import {
  approveWaitlistRequest as persistApproveWaitlistRequest,
  cancelJoinRequest as persistCancelJoinRequest,
  closeLobby as persistCloseLobby,
  createLobby as persistCreateLobby,
  joinGame as persistJoinGame,
  joinWaitlist as persistJoinWaitlist,
  kickLobbyParticipant as persistKickLobbyParticipant,
  leaveLobby as persistLeaveLobby,
  listLobbies,
  moveLobbyParticipantToWaitlist as persistMoveLobbyParticipantToWaitlist,
  rejectJoinRequest as persistRejectJoinRequest,
  requestWaitlistApproval as persistRequestWaitlistApproval,
  transferLobbyHost as persistTransferLobbyHost,
  updateLobbySettings as persistUpdateLobbySettings,
} from './lobbyRepository';
import {
  getRuleExceptionReasons,
  getVisibleChatChannels,
  isLobbyFull,
} from './lobbyRules';

export type LobbyStoreActionResult = {
  messages: string[];
  success: boolean;
};

type LobbyStoreOptions = {
  enabled?: boolean;
};

export function useLobbyStore(currentPlayer: Player, players: Player[], options: LobbyStoreOptions = {}) {
  const isEnabled = options.enabled ?? true;
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [verifiedPrivateLobbyIds, setVerifiedPrivateLobbyIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ratingTasks, setRatingTasks] = useState<RatingTask[]>(mockRatingTasks);

  const refreshLobbyData = useCallback(async () => {
    if (!isEnabled) {
      return;
    }

    try {
      const nextLobbies = await listLobbies();

      setLobbies((current) => {
        if (nextLobbies.length === 0 && current.length > 0) {
          console.warn('Lobby refresh returned no rows; keeping the last loaded lobby list.');
          return current;
        }

        return getUniqueLobbies(nextLobbies);
      });

      try {
        const nextRatingTasks = await listSubmittedRatingTasks(currentPlayer.id, nextLobbies);

        setRatingTasks(nextRatingTasks);
      } catch (error) {
        console.warn('Could not load submitted player ratings.', error);
      }
    } catch (error) {
      console.warn('Falling back to mock lobby data after lobby load failed.', error);
      setLobbies((current) => current.length > 0 ? current : mockLobbies.map((lobby) => applyLobbyLifecycle(lobby)));
      setRatingTasks((current) => current.length > 0 ? current : mockRatingTasks);
    }

    try {
      setChatMessages(await listLobbyMessages());
    } catch (error) {
      console.warn('Falling back to mock chat data after Supabase load failed.', error);
      setChatMessages(mockChatMessages);
    }

    try {
      await refreshNotifications();
    } catch (error) {
      console.warn('Falling back to mock notification data after Supabase load failed.', error);
      setNotifications(mockNotifications);
    }
  }, [currentPlayer.id, isEnabled]);

  async function refreshNotifications() {
    const nextNotifications = await listNotifications(currentPlayer.id);

    setNotifications(nextNotifications);
    return nextNotifications;
  }

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    void refreshLobbyData();
  }, [isEnabled, refreshLobbyData]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );
  const unreadNotificationCount = unreadNotifications.length;

  function getFilteredLobbies(selectedFilter: string) {
    if (selectedFilter === 'Has spots') {
      return lobbies.filter((lobby) => !isLobbyFull(lobby));
    }

    if (selectedFilter === 'Requests') {
      return lobbies.filter((lobby) => lobby.joinRequests.some((request) => request.status === 'pending'));
    }

    return lobbies;
  }

  function getLobbyById(lobbyId: string) {
    return lobbies.find((lobby) => lobby.id === lobbyId) ?? null;
  }

  function getLobbyIndex(lobbyId: string) {
    return Math.max(
      lobbies.findIndex((lobby) => lobby.id === lobbyId),
      0,
    );
  }

  function hasPrivateAccess(lobbyId: string) {
    return verifiedPrivateLobbyIds.includes(lobbyId);
  }

  function enterPrivatePin(lobby: Lobby, pin: string) {
    if (lobby.accessCode !== pin.trim()) {
      return false;
    }

    setVerifiedPrivateLobbyIds((current) => (current.includes(lobby.id) ? current : [...current, lobby.id]));
    return true;
  }

  function revokePrivateAccess(lobbyId: string) {
    setVerifiedPrivateLobbyIds((current) => current.filter((id) => id !== lobbyId));
  }

  function shouldConfirmMoveToWaitlist(lobby: Lobby) {
    const participant = lobby.participants.find((candidate) => candidate.playerId === currentPlayer.id);

    return Boolean(
      participant &&
        shouldApplyLateLeavePenalty(lobby, participant),
    );
  }

  async function joinGame(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistJoinGame(lobby, currentPlayer, lobbies, getVerifiedPrivateAccessCode(lobby));

    if (result.success) {
      await refreshLobbyData();
    }

    return result;
  }

  async function joinWaitlist(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistJoinWaitlist(lobby, currentPlayer, lobbies, getVerifiedPrivateAccessCode(lobby));

    if (result.success) {
      await refreshLobbyData();
    }

    return result;
  }

  async function requestWaitlistApproval(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistRequestWaitlistApproval(lobby, currentPlayer);

    if (result.success) {
      setLobbies((current) =>
        current.map((candidate) =>
          candidate.id === lobby.id
            ? getOptimisticLobbyAfterWaitlistRequest(candidate, currentPlayer)
            : candidate,
        ),
      );
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after waitlist request.', error);
      });
    }

    return result;
  }

  async function approveWaitlistRequest(lobby: Lobby, playerId: string): Promise<LobbyStoreActionResult> {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      return {
        messages: ['Could not find this player in the player list.'],
        success: false,
      };
    }

    const result = await persistApproveWaitlistRequest(lobby, player, currentPlayer.id);

    if (result.success) {
      revokePrivateAccess(lobby.id);
      await refreshLobbyData();
    }

    return result;
  }

  async function rejectJoinRequest(lobby: Lobby, playerId: string): Promise<LobbyStoreActionResult> {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      return {
        messages: ['Could not find this player in the player list.'],
        success: false,
      };
    }

    const result = await persistRejectJoinRequest(lobby, player, currentPlayer.id);

    if (result.success) {
      await refreshLobbyData();
    }

    return result;
  }

  async function cancelJoinRequest(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistCancelJoinRequest(lobby, currentPlayer);

    if (result.success) {
      await refreshLobbyData();
    }

    return result;
  }

  async function leaveLobby(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const participant = lobby.participants.find((candidate) => candidate.playerId === currentPlayer.id);

    if (!participant) {
      revokePrivateAccess(lobby.id);

      return {
        messages: ['You are no longer in this room.'],
        success: true,
      };
    }

    const result = await persistLeaveLobby(lobby, currentPlayer);

    if (result.success) {
      revokePrivateAccess(lobby.id);
      setLobbies((current) =>
        current
          .map((candidate) =>
            candidate.id === lobby.id
              ? getOptimisticLobbyAfterLeave(candidate, currentPlayer.id)
              : candidate,
          )
          .filter((candidate): candidate is Lobby => Boolean(candidate)),
      );
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after leaving.', error);
      });
    }

    return result;
  }

  async function updateLobbySettings(lobby: Lobby, draft: LobbySettingsDraft): Promise<LobbyStoreActionResult> {
    const result = await persistUpdateLobbySettings(lobby, draft, currentPlayer.id);

    if (result.success) {
      setLobbies((current) =>
        current.map((candidate) => (candidate.id === lobby.id ? getOptimisticLobbyAfterSettingsUpdate(candidate, draft) : candidate)),
      );
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after settings update.', error);
      });
    }

    return result;
  }

  async function moveLobbyParticipantToWaitlist(lobby: Lobby, playerId: string): Promise<LobbyStoreActionResult> {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      return {
        messages: ['Could not find this player in the player list.'],
        success: false,
      };
    }

    const result = await persistMoveLobbyParticipantToWaitlist(lobby, player, currentPlayer.id);

    if (result.success) {
      setLobbies((current) =>
        current.map((candidate) => (candidate.id === lobby.id ? moveParticipantToWaitlistLocal(candidate, playerId) : candidate)),
      );
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after moving player.', error);
      });
    }

    return result;
  }

  async function kickLobbyParticipant(lobby: Lobby, playerId: string): Promise<LobbyStoreActionResult> {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      return {
        messages: ['Could not find this player in the player list.'],
        success: false,
      };
    }

    const result = await persistKickLobbyParticipant(lobby, player, currentPlayer.id);

    if (result.success) {
      setLobbies((current) =>
        current.map((candidate) => (candidate.id === lobby.id ? removeParticipantLocal(candidate, playerId) : candidate)),
      );
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after removing player.', error);
      });
    }

    return result;
  }

  async function transferLobbyHost(lobby: Lobby, playerId: string): Promise<LobbyStoreActionResult> {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      return {
        messages: ['Could not find this player in the player list.'],
        success: false,
      };
    }

    const result = await persistTransferLobbyHost(lobby, player, currentPlayer.id);

    if (result.success) {
      setLobbies((current) =>
        current.map((candidate) => (candidate.id === lobby.id ? transferHostLocal(candidate, currentPlayer.id, playerId) : candidate)),
      );
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after transferring host.', error);
      });
    }

    return result;
  }

  async function closeLobby(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistCloseLobby(lobby, currentPlayer.id);

    if (result.success) {
      setLobbies((current) => current.filter((candidate) => candidate.id !== lobby.id));
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after closing lobby.', error);
      });
    }

    return result;
  }

  function markLobbyChatRead(lobby: Lobby) {
    setLobbies((current) =>
      current.map((candidate) =>
        candidate.id === lobby.id
          ? {
              ...candidate,
              chatChannels: candidate.chatChannels.map((channel) => ({
                ...channel,
                unreadCount: 0,
              })),
            }
          : candidate,
      ),
    );
  }

  async function sendLobbyChatMessage(lobby: Lobby, channelId: string, body: string) {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return;
    }

    await persistLobbyMessage(lobby.id, channelId, currentPlayer.id, trimmedBody);
    setChatMessages(await listLobbyMessages());
  }

  function getLobbyMessages(lobbyId: string) {
    return chatMessages.filter((message) => message.lobbyId === lobbyId);
  }

  function getVisibleLobby(lobby: Lobby) {
    return {
      ...lobby,
      chatChannels: getVisibleChatChannels(lobby, currentPlayer.id),
    };
  }

  function getVisibleLobbyMessages(lobby: Lobby) {
    const visibleChannelIds = new Set(getVisibleChatChannels(lobby, currentPlayer.id).map((channel) => channel.id));

    return chatMessages.filter((message) => message.lobbyId === lobby.id && visibleChannelIds.has(message.channelId));
  }

  async function createLobby(draft: CreateLobbyDraft) {
    const nextLobby = await persistCreateLobby(draft);

    setLobbies((current) =>
      current.some((lobby) => lobby.id === nextLobby.id)
        ? current.map((lobby) => (lobby.id === nextLobby.id ? nextLobby : lobby))
        : getUniqueLobbies([nextLobby, ...current]),
    );
    setVerifiedPrivateLobbyIds((current) => (draft.visibility === 'password' ? [...current, nextLobby.id] : current));
    void refreshLobbyData();

    return nextLobby;
  }

  async function markAllNotificationsRead() {
    const unreadNotificationIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    await markNotificationsRead(unreadNotificationIds);
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  async function refreshAndMarkAllNotificationsRead() {
    const nextNotifications = await refreshNotifications();
    const unreadNotificationIds = nextNotifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    await markNotificationsRead(unreadNotificationIds);
    setNotifications(nextNotifications.map((notification) => ({
      ...notification,
      read: true,
    })));
  }

  async function markNotificationRead(notificationId: string) {
    await persistNotificationRead(notificationId);
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  }

  async function submitPlayerRating(
    lobby: Lobby,
    targetPlayerId: string,
    rating: { behaviorRating: number; rank: Player['level']; skillVoteType?: SkillRankVoteType },
  ): Promise<LobbyStoreActionResult> {
    const targetIds = getRatingTargetIds(lobby, currentPlayer.id);
    const remainingTargetIds = getRemainingRatingTargetIds(ratingTasks, lobby, currentPlayer.id);

    if (!targetIds.includes(targetPlayerId)) {
      return {
        messages: ['Only players from the final players list can rate this match.'],
        success: false,
      };
    }

    if (!remainingTargetIds.includes(targetPlayerId)) {
      return {
        messages: ['You already rated this player.'],
        success: false,
      };
    }

    try {
      const result = await persistSubmitPlayerRating({
        behaviorRating: rating.behaviorRating,
        lobby,
        rank: rating.rank,
        ratedPlayerId: targetPlayerId,
        raterPlayerId: currentPlayer.id,
        skillVoteType: rating.skillVoteType,
      });

      if (!result.success) {
        return result;
      }
    } catch (error) {
      return {
        messages: [error instanceof Error ? error.message : 'Rating could not be saved.'],
        success: false,
      };
    }

    setRatingTasks((current) => {
      const existingTask = current.find((task) => task.lobbyId === lobby.id && task.playerId === currentPlayer.id);
      const remainingPlayerIds = (existingTask?.remainingPlayerIds ?? targetIds).filter((playerId) => playerId !== targetPlayerId);
      const nextTask: RatingTask = {
        id: existingTask?.id ?? `local-rating-${lobby.id}-${currentPlayer.id}`,
        lobbyId: lobby.id,
        openedAt: existingTask?.openedAt ?? new Date().toISOString(),
        playerId: currentPlayer.id,
        remainingPlayerIds,
        skippedPlayerIds: existingTask?.skippedPlayerIds ?? [],
        status: remainingPlayerIds.length === 0 ? 'completed' : 'open',
      };

      return existingTask
        ? current.map((task) => (task.id === existingTask.id ? nextTask : task))
        : [nextTask, ...current];
    });

    return {
      messages: ['Rating saved.'],
      success: true,
    };
  }

  function getVerifiedPrivateAccessCode(lobby: Lobby) {
    return hasPrivateAccess(lobby.id) ? lobby.accessCode : undefined;
  }

  return {
    approveWaitlistRequest,
    cancelJoinRequest,
    closeLobby,
    createLobby,
    enterPrivatePin,
    getFilteredLobbies,
    getLobbyById,
    getLobbyIndex,
    getLobbyMessages,
    getVisibleLobby,
    getVisibleLobbyMessages,
    hasPrivateAccess,
    joinGame,
    joinWaitlist,
    kickLobbyParticipant,
    leaveLobby,
    lobbies,
    markAllNotificationsRead,
    markLobbyChatRead,
    markNotificationRead,
    refreshAndMarkAllNotificationsRead,
    notifications,
    moveLobbyParticipantToWaitlist,
    rejectJoinRequest,
    requestWaitlistApproval,
    refreshLobbyData,
    ratingTasks,
    sendLobbyChatMessage,
    shouldConfirmMoveToWaitlist,
    submitPlayerRating,
    transferLobbyHost,
    updateLobbySettings,
    unreadNotificationCount,
    unreadNotifications,
  };
}

function getOptimisticLobbyAfterSettingsUpdate(lobby: Lobby, draft: LobbySettingsDraft): Lobby {
  const selectedPlayerCounts = draft.playerCounts.length > 0 ? draft.playerCounts : [draft.maxPlayers];
  const visibilityChangedToPrivate = draft.visibility === 'password';

  return {
    ...lobby,
    accessCode: visibilityChangedToPrivate ? draft.accessCode ?? lobby.accessCode : undefined,
    capacityMode: selectedPlayerCounts.length > 1 ? 'flexible' : 'fixed',
    genderRule: draft.genderRule,
    location: {
      ...lobby.location,
      city: draft.locationCity,
      description: draft.meetingPoint,
      name: draft.locationName,
    },
    locationDescription: draft.meetingPoint,
    maxPlayers: Math.max(...selectedPlayerCounts),
    minPlayers: Math.min(...selectedPlayerCounts),
    note: draft.visibility === 'password'
      ? `Private game. ${draft.meetingPoint}`
      : draft.meetingPoint,
    rankExact: draft.rankRuleType === 'exact' ? draft.rankExact : undefined,
    rankMax: draft.rankRuleType === 'range' ? draft.rankMax : undefined,
    rankMin: draft.rankRuleType === 'range' ? draft.rankMin : undefined,
    rankRuleType: draft.rankRuleType,
    startsAt: draft.startsAt,
    title: draft.title,
    visibility: draft.visibility,
  };
}

function moveParticipantToWaitlistLocal(lobby: Lobby, playerId: string): Lobby {
  return {
    ...lobby,
    participants: lobby.participants.map((participant) =>
      participant.playerId === playerId
        ? {
            ...participant,
            role: 'waitlist',
          }
        : participant,
    ),
  };
}

function removeParticipantLocal(lobby: Lobby, playerId: string): Lobby {
  return {
    ...lobby,
    joinRequests: lobby.joinRequests.filter((request) => request.playerId !== playerId),
    participants: lobby.participants.filter((participant) => participant.playerId !== playerId),
  };
}

function transferHostLocal(lobby: Lobby, currentHostId: string, nextHostId: string): Lobby {
  return {
    ...lobby,
    adminId: nextHostId,
    participants: lobby.participants.map((participant) => {
      if (participant.playerId === nextHostId) {
        return {
          ...participant,
          role: 'admin',
          status: participant.status === 'attended' ? participant.status : 'approved',
        };
      }

      if (participant.playerId === currentHostId && participant.role === 'admin') {
        return {
          ...participant,
          role: 'joined',
        };
      }

      return participant;
    }),
  };
}

function getOptimisticLobbyAfterWaitlistRequest(lobby: Lobby, player: Player): Lobby {
  const reasons = getOptimisticJoinRequestReasons(lobby, player);
  const nextRequest = {
    id: `local-pending-${lobby.id}-${player.id}`,
    lobbyId: lobby.id,
    message: 'Requesting host approval to join the waitlist.',
    playerId: player.id,
    reasons,
    status: 'pending' as const,
  };

  return {
    ...lobby,
    joinRequests: lobby.joinRequests.some((request) => request.playerId === player.id)
      ? lobby.joinRequests.map((request) => (request.playerId === player.id ? nextRequest : request))
      : [...lobby.joinRequests, nextRequest],
  };
}

function getOptimisticJoinRequestReasons(lobby: Lobby, player: Player): JoinRequestReason[] {
  const reasons = getRuleExceptionReasons(player, lobby);

  if (lobby.visibility === 'password') {
    return ['private_access', ...reasons];
  }

  return reasons.length > 0 ? reasons : ['approval_required'];
}

function getOptimisticLobbyAfterLeave(lobby: Lobby, leavingPlayerId: string): Lobby | null {
  const remainingParticipants = lobby.participants.filter((participant) => participant.playerId !== leavingPlayerId);

  if (remainingParticipants.length === 0) {
    return null;
  }

  const nextHost = lobby.adminId === leavingPlayerId ? getNextHostParticipant(remainingParticipants) : undefined;

  return {
    ...lobby,
    adminId: nextHost?.playerId ?? lobby.adminId,
    joinRequests: lobby.joinRequests.filter((request) => request.playerId !== leavingPlayerId),
    participants: nextHost
      ? remainingParticipants.map((participant) =>
          participant.playerId === nextHost.playerId
            ? {
                ...participant,
                role: 'admin',
              }
            : participant,
        )
      : remainingParticipants,
    status: lobby.status,
  };
}

function getNextHostParticipant(participants: LobbyParticipant[]) {
  return (
    participants.find((participant) => participant.role === 'joined') ??
    participants.find((participant) => participant.role === 'waitlist')
  );
}
