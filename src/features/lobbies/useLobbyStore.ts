import { useMemo, useState } from 'react';

import {
  chatMessages as mockChatMessages,
  lobbies as mockLobbies,
  notifications as mockNotifications,
} from '../../data/mock';
import type { ChatMessage, Lobby, Notification, Player } from '../../types';
import {
  approveJoinRequest,
  joinGame as applyJoinGame,
  joinWaitlist as applyJoinWaitlist,
  leaveLobby as applyLeaveLobby,
  rejectJoinRequest as applyRejectJoinRequest,
  requestWaitlistApproval as applyRequestWaitlistApproval,
} from './lobbyActions';
import type { CreateLobbyDraft } from './lobbyCreateTypes';
import { getMinutesUntilLobbyStart } from './lobbyDateTime';
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
  const [lobbies, setLobbies] = useState<Lobby[]>(mockLobbies);
  const [verifiedPrivateLobbyIds, setVerifiedPrivateLobbyIds] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

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

  function shouldConfirmMoveToWaitlist(lobby: Lobby) {
    const participant = lobby.participants.find((candidate) => candidate.playerId === currentPlayer.id);
    const penaltyMinutes = lobby.cancellationPenaltyMinutes ?? defaultCancellationPenaltyMinutes;

    return Boolean(
      participant &&
        isJoinedParticipant(participant) &&
        getMinutesUntilLobbyStart(lobby.startsAt) < penaltyMinutes,
    );
  }

  function joinGame(lobby: Lobby): LobbyStoreActionResult {
    const result = applyJoinGame(lobby, currentPlayer, {
      accessCode: hasPrivateAccess(lobby.id) ? lobby.accessCode : undefined,
      allLobbies: lobbies,
    });

    if (result.success) {
      updateLobbyItem(result.lobby);
    }

    return {
      messages: result.messages,
      success: result.success,
    };
  }

  function joinWaitlist(lobby: Lobby): LobbyStoreActionResult {
    const participant = lobby.participants.find((candidate) => candidate.playerId === currentPlayer.id);
    const isActiveInRoom = participant && (participant.status === 'approved' || participant.status === 'attended');
    const result = applyJoinWaitlist(lobby, currentPlayer, {
      accessCode: hasPrivateAccess(lobby.id) ? lobby.accessCode : undefined,
      allLobbies: lobbies,
    });

    if (result.success) {
      updateLobbyItem(result.lobby);

      if (!isActiveInRoom) {
        addLobbyNotification({
          body: `You are now on the waitlist for ${lobby.title}.`,
          lobbyId: lobby.id,
          title: 'Joined waitlist',
          type: 'waitlist_update',
        });
      }
    }

    return {
      messages: result.messages,
      success: result.success,
    };
  }

  function requestWaitlistApproval(lobby: Lobby): LobbyStoreActionResult {
    const result = applyRequestWaitlistApproval(lobby, currentPlayer);

    if (result.success) {
      updateLobbyItem(result.lobby);
      const host = players.find((player) => player.id === lobby.adminId);

      addLobbyNotification({
        body: `You can keep viewing ${lobby.title} while ${host?.name ?? 'the host'} reviews your request.`,
        lobbyId: lobby.id,
        title: 'Request sent',
        type: 'waitlist_update',
      });
    }

    return {
      messages: result.messages,
      success: result.success,
    };
  }

  function approveWaitlistRequest(lobby: Lobby, playerId: string): LobbyStoreActionResult {
    const player = players.find((candidate) => candidate.id === playerId);

    if (!player) {
      return {
        messages: ['Could not find this player in the mock player list.'],
        success: false,
      };
    }

    const result = approveJoinRequest(lobby, player, 'waitlist', {
      allLobbies: lobbies,
    });

    updateLobbyItem(result.lobby);
    addLobbyNotification({
      body: `${player.name} was added to the waitlist for ${lobby.title}.`,
      lobbyId: lobby.id,
      title: 'Request approved',
      type: 'request_approved',
    });

    return {
      messages: result.messages.length > 0 ? result.messages : [`${player.name} approved to waitlist.`],
      success: true,
    };
  }

  function rejectJoinRequest(lobby: Lobby, playerId: string): LobbyStoreActionResult {
    const player = players.find((candidate) => candidate.id === playerId);

    updateLobbyItem(applyRejectJoinRequest(lobby, playerId));
    addLobbyNotification({
      body: `${player?.name ?? 'The player'} will see this as rejected when backend notifications are connected.`,
      lobbyId: lobby.id,
      title: 'Request rejected',
      type: 'request_rejected',
    });

    return {
      messages: [],
      success: true,
    };
  }

  function leaveLobby(lobby: Lobby): LobbyStoreActionResult {
    const participant = lobby.participants.find((candidate) => candidate.playerId === currentPlayer.id);

    if (!participant) {
      return {
        messages: [],
        success: false,
      };
    }

    updateLobbyItem(applyLeaveLobby(lobby, currentPlayer.id));
    addLobbyNotification({
      body: `You left ${lobby.title}.`,
      lobbyId: lobby.id,
      title: 'Left room',
      type: 'waitlist_update',
    });

    return {
      messages: [],
      success: true,
    };
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

  function sendLobbyChatMessage(lobby: Lobby, channelId: string, body: string) {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return;
    }

    setChatMessages((current) => [
      ...current,
      {
        body: trimmedBody,
        channelId,
        createdAt: new Date().toISOString(),
        id: `m-${lobby.id}-${channelId}-${Date.now()}`,
        lobbyId: lobby.id,
        playerId: currentPlayer.id,
      },
    ]);
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

  function createLobby(draft: CreateLobbyDraft) {
    const lobbyId = `lobby-${Date.now()}`;
    const selectedPlayerCounts = draft.playerCounts.length > 0 ? draft.playerCounts : [draft.maxPlayers];
    const nextLobby: Lobby = {
      adminId: currentPlayer.id,
      accessCode: draft.visibility === 'password' ? '4321' : undefined,
      ballNeeded: currentPlayer.hasBall,
      cancellationPenaltyMinutes: defaultCancellationPenaltyMinutes,
      capacityMode: selectedPlayerCounts.length > 1 ? 'flexible' : 'fixed',
      chatChannels: [
        {
          id: `${lobbyId}-all`,
          lobbyId,
          participantRoles: ['admin', 'joined', 'waitlist'],
          title: 'All lobby',
          type: 'all',
          unreadCount: 0,
        },
        {
          id: `${lobbyId}-active`,
          lobbyId,
          participantRoles: ['admin', 'joined'],
          title: 'Host and active players',
          type: 'admin_joined',
          unreadCount: 0,
        },
      ],
      competitiveLevel: 'balanced',
      courtMarksNeeded: currentPlayer.hasCourtMarks,
      exceptionRequestsEnabled: true,
      genderRule: draft.genderRule,
      id: lobbyId,
      joinRequests: [],
      location: {
        area: 'Central Israel',
        city: draft.locationCity,
        description: draft.meetingPoint,
        distanceKm: 2.4,
        id: `${lobbyId}-location`,
        name: draft.locationName,
      },
      locationDescription: draft.meetingPoint,
      maxPlayers: Math.max(...selectedPlayerCounts),
      minPlayers: Math.min(...selectedPlayerCounts),
      note: draft.visibility === 'password'
        ? `Private game. PIN: 4321. ${draft.meetingPoint}`
        : draft.meetingPoint,
      participants: [
        {
          bringsBall: currentPlayer.hasBall,
          bringsCourtMarks: currentPlayer.hasCourtMarks,
          playerId: currentPlayer.id,
          role: 'admin',
          status: 'approved',
        },
      ],
      rankExact: draft.rankExact,
      rankMax: draft.rankMax,
      rankMin: draft.rankMin,
      rankRuleType: draft.rankRuleType,
      startsAt: draft.startsAt,
      status: 'open',
      title: draft.title,
      visibility: draft.visibility,
      waitlistEnabled: true,
    };

    setLobbies((current) => [nextLobby, ...current]);
    setChatMessages((current) => [
      ...current,
      {
        body: 'Game created. Use this chat to coordinate with players.',
        channelId: `${lobbyId}-all`,
        createdAt: new Date().toISOString(),
        id: `${lobbyId}-welcome`,
        lobbyId,
        playerId: currentPlayer.id,
      },
    ]);
    addLobbyNotification({
      body: `${draft.title} is live and visible in Games.`,
      lobbyId,
      title: 'Game created',
      type: 'lobby_changed',
    });
    setVerifiedPrivateLobbyIds((current) => (draft.visibility === 'password' ? [...current, lobbyId] : current));

    return nextLobby;
  }

  function markAllNotificationsRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  function markNotificationRead(notificationId: string) {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  }

  function addLobbyNotification(notification: Omit<Notification, 'id' | 'read'>) {
    setNotifications((current) => [
      {
        ...notification,
        id: `n-${Date.now()}-${current.length}`,
        read: false,
      },
      ...current,
    ]);
  }

  function updateLobbyItem(nextLobby: Lobby) {
    setLobbies((current) => current.map((lobby) => (lobby.id === nextLobby.id ? nextLobby : lobby)));
  }

  return {
    approveWaitlistRequest,
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
