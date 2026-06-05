import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  chatMessages as mockChatMessages,
  lobbies as mockLobbies,
  notifications as mockNotifications,
} from '../../data/mock';
import { listLobbyMessages, sendLobbyMessage as persistLobbyMessage } from '../chat/chatRepository';
import {
  listNotifications,
  markNotificationRead as persistNotificationRead,
  markNotificationsRead,
} from '../notifications/notificationRepository';
import type { ChatMessage, Lobby, LobbyParticipant, Notification, Player } from '../../types';
import type { CreateLobbyDraft } from './lobbyCreateTypes';
import { getMinutesUntilLobbyStart } from './lobbyDateTime';
import {
  approveWaitlistRequest as persistApproveWaitlistRequest,
  cancelJoinRequest as persistCancelJoinRequest,
  createLobby as persistCreateLobby,
  joinGame as persistJoinGame,
  joinWaitlist as persistJoinWaitlist,
  leaveLobby as persistLeaveLobby,
  listLobbies,
  rejectJoinRequest as persistRejectJoinRequest,
  requestWaitlistApproval as persistRequestWaitlistApproval,
} from './lobbyRepository';
import {
  defaultCancellationPenaltyMinutes,
  getVisibleChatChannels,
  isJoinedParticipant,
  isLobbyFull,
} from './lobbyRules';

export type LobbyStoreActionResult = {
  messages: string[];
  success: boolean;
};

export function useLobbyStore(currentPlayer: Player, players: Player[]) {
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [verifiedPrivateLobbyIds, setVerifiedPrivateLobbyIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refreshLobbyData = useCallback(async () => {
    try {
      const nextLobbies = await listLobbies();

      setLobbies(nextLobbies);
    } catch (error) {
      console.warn('Falling back to mock lobby data after lobby load failed.', error);
      setLobbies(mockLobbies);
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
  }, [currentPlayer.id]);

  useEffect(() => {
    void refreshLobbyData();
  }, [refreshLobbyData]);

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
    const penaltyMinutes = lobby.cancellationPenaltyMinutes ?? defaultCancellationPenaltyMinutes;

    return Boolean(
      participant &&
        isJoinedParticipant(participant) &&
        getMinutesUntilLobbyStart(lobby.startsAt) < penaltyMinutes,
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
    const participant = lobby.participants.find((candidate) => candidate.playerId === currentPlayer.id);
    const isActiveInRoom = participant && (participant.status === 'approved' || participant.status === 'attended');
    const result = await persistJoinWaitlist(lobby, currentPlayer, lobbies, getVerifiedPrivateAccessCode(lobby));

    if (result.success) {
      await refreshLobbyData();

      if (!isActiveInRoom) {
        addLobbyNotification({
          body: `You are now on the waitlist for ${lobby.title}.`,
          lobbyId: lobby.id,
          title: 'Joined waitlist',
          type: 'waitlist_update',
        });
      }
    }

    return result;
  }

  async function requestWaitlistApproval(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistRequestWaitlistApproval(lobby, currentPlayer);

    if (result.success) {
      await refreshLobbyData();
      const host = players.find((player) => player.id === lobby.adminId);

      addLobbyNotification({
        body: `You can keep viewing ${lobby.title} while ${host?.name ?? 'the host'} reviews your request.`,
        lobbyId: lobby.id,
        title: 'Request sent',
        type: 'waitlist_update',
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
      addLobbyNotification({
        body: `${player.name} was added to the waitlist for ${lobby.title}.`,
        lobbyId: lobby.id,
        title: 'Request approved',
        type: 'request_approved',
      });
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
      addLobbyNotification({
        body: `${player.name} will see this as rejected.`,
        lobbyId: lobby.id,
        title: 'Request rejected',
        type: 'request_rejected',
      });
    }

    return result;
  }

  async function cancelJoinRequest(lobby: Lobby): Promise<LobbyStoreActionResult> {
    const result = await persistCancelJoinRequest(lobby, currentPlayer);

    if (result.success) {
      await refreshLobbyData();
      addLobbyNotification({
        body: `Your request for ${lobby.title} was cancelled.`,
        lobbyId: lobby.id,
        title: 'Request cancelled',
        type: 'waitlist_update',
      });
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
      addLobbyNotification({
        body: `You left ${lobby.title}.`,
        lobbyId: lobby.id,
        title: 'Left room',
        type: 'waitlist_update',
      });
      void refreshLobbyData().catch((error) => {
        console.warn('Could not refresh lobby data after leaving.', error);
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

    await refreshLobbyData();
    setLobbies((current) =>
      current.some((lobby) => lobby.id === nextLobby.id)
        ? current.map((lobby) => (lobby.id === nextLobby.id ? nextLobby : lobby))
        : [nextLobby, ...current],
    );
    addLobbyNotification({
      body: `${draft.title} is live and visible in Games.`,
      lobbyId: nextLobby.id,
      title: 'Game created',
      type: 'lobby_changed',
    });
    setVerifiedPrivateLobbyIds((current) => (draft.visibility === 'password' ? [...current, nextLobby.id] : current));

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

  function addLobbyNotification(notification: Omit<Notification, 'id' | 'read'>) {
    setNotifications((current) => [
      {
        ...notification,
        id: `local-${Date.now()}-${current.length}`,
        read: false,
      },
      ...current,
    ]);
  }

  function getVerifiedPrivateAccessCode(lobby: Lobby) {
    return hasPrivateAccess(lobby.id) ? lobby.accessCode : undefined;
  }

  return {
    approveWaitlistRequest,
    cancelJoinRequest,
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
    leaveLobby,
    lobbies,
    markAllNotificationsRead,
    markLobbyChatRead,
    markNotificationRead,
    notifications,
    rejectJoinRequest,
    requestWaitlistApproval,
    sendLobbyChatMessage,
    shouldConfirmMoveToWaitlist,
    unreadNotificationCount,
    unreadNotifications,
  };
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
