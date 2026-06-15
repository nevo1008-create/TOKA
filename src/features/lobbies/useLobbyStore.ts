import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  chatMessages as mockChatMessages,
  lobbies as mockLobbies,
  notifications as mockNotifications,
  ratingTasks as mockRatingTasks,
} from '../../data/mock';
import { listLobbyMessages, sendLobbyMessage as persistLobbyMessage } from '../chat/chatRepository';
import {
  createUniqueNotification,
  listNotifications,
  markNotificationRead as persistNotificationRead,
  markNotificationsRead,
} from '../notifications/notificationRepository';
import type { ChatMessage, Lobby, LobbyParticipant, Notification, Player, RatingTask, SkillRankVoteType } from '../../types';
import {
  listSubmittedRatingTasks,
  submitPlayerRating as persistSubmitPlayerRating,
} from '../ratings/ratingRepository';
import { getRatingTargetIds, getRemainingRatingTargetIds } from '../ratings/ratingRules';
import type { CreateLobbyDraft, LobbySettingsDraft } from './lobbyCreateTypes';
import { applyLobbyLifecycle } from './lobbyDateTime';
import { ratingOpenAfterStartMinutes, ratingWindowMinutes, shouldApplyLateLeavePenalty } from './lobbyLifecycle';
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
  updateLobbySettings as persistUpdateLobbySettings,
} from './lobbyRepository';
import {
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

      setLobbies(nextLobbies);

      try {
        const nextRatingTasks = await listSubmittedRatingTasks(currentPlayer.id, nextLobbies);

        setRatingTasks(nextRatingTasks);
        void syncRatingNotifications(currentPlayer, nextLobbies, nextRatingTasks).then((createdNotifications) => {
          if (createdNotifications.length > 0) {
            setNotifications((current) => mergeNotifications(current, createdNotifications));
          }
        }).catch((notificationError) => {
          console.warn('Could not create rating notifications.', notificationError);
        });
      } catch (error) {
        console.warn('Could not load submitted player ratings.', error);
        setRatingTasks([]);
      }
    } catch (error) {
      console.warn('Falling back to mock lobby data after lobby load failed.', error);
      setLobbies(mockLobbies.map((lobby) => applyLobbyLifecycle(lobby)));
      setRatingTasks(mockRatingTasks);
    }

    try {
      setChatMessages(await listLobbyMessages());
    } catch (error) {
      console.warn('Falling back to mock chat data after Supabase load failed.', error);
      setChatMessages(mockChatMessages);
    }

    try {
      setNotifications(await listNotifications(currentPlayer.id));
    } catch (error) {
      console.warn('Falling back to mock notification data after Supabase load failed.', error);
      setNotifications(mockNotifications);
    }
  }, [currentPlayer.id, isEnabled]);

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
      await refreshLobbyData();
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
    const nextLobby = await persistCreateLobby(draft, currentPlayer);

    setLobbies((current) =>
      current.some((lobby) => lobby.id === nextLobby.id)
        ? current.map((lobby) => (lobby.id === nextLobby.id ? nextLobby : lobby))
        : [nextLobby, ...current],
    );
    setVerifiedPrivateLobbyIds((current) => (draft.visibility === 'password' ? [...current, nextLobby.id] : current));
    void refreshLobbyData();

    return nextLobby;
  }

  async function markAllNotificationsRead() {
    await markNotificationsRead(notifications.map((notification) => notification.id));
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
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

  async function syncRatingNotifications(player: Player, sourceLobbies: Lobby[], sourceRatingTasks: RatingTask[]) {
    const createdNotifications: Notification[] = [];

    for (const task of sourceRatingTasks) {
      if (task.playerId !== player.id || task.status !== 'open' || task.remainingPlayerIds.length === 0) {
        continue;
      }

      const lobby = sourceLobbies.find((candidate) => candidate.id === task.lobbyId);

      if (!lobby) {
        continue;
      }

      const ratingOpenNotification = await createUniqueNotification({
        body: `Rating is open for ${lobby.title}. Rate the players from your match.`,
        lobbyId: lobby.id,
        recipientPlayerId: player.id,
        title: 'Rating is open',
        type: 'rating_required',
      });

      if (ratingOpenNotification) {
        createdNotifications.push(ratingOpenNotification);
      }

      if (isRatingClosingSoon(lobby)) {
        const closingNotification = await createUniqueNotification({
          body: `Rating for ${lobby.title} closes in less than 2 hours.`,
          lobbyId: lobby.id,
          recipientPlayerId: player.id,
          title: 'Rating closes soon',
          type: 'rating_closing_soon',
        });

        if (closingNotification) {
          createdNotifications.push(closingNotification);
        }
      }
    }

    return createdNotifications;
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
    notifications,
    moveLobbyParticipantToWaitlist,
    rejectJoinRequest,
    requestWaitlistApproval,
    refreshLobbyData,
    ratingTasks,
    sendLobbyChatMessage,
    shouldConfirmMoveToWaitlist,
    submitPlayerRating,
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

function mergeNotifications(current: Notification[], incoming: Notification[]) {
  const existingIds = new Set(current.map((notification) => notification.id));

  return [
    ...incoming.filter((notification) => !existingIds.has(notification.id)),
    ...current,
  ];
}

function isRatingClosingSoon(lobby: Lobby, now = new Date()) {
  const startTime = new Date(lobby.startsAt).getTime();

  if (Number.isNaN(startTime)) {
    return false;
  }

  const ratingCloseTime = startTime + (ratingOpenAfterStartMinutes + ratingWindowMinutes) * 60000;
  const timeUntilClose = ratingCloseTime - now.getTime();

  return timeUntilClose > 0 && timeUntilClose <= 2 * 60 * 60000;
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
