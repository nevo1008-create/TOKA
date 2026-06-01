import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { NotificationPanel } from './src/components/NotificationPanel';
import { SideMenuDrawer } from './src/components/SideMenuDrawer';
import {
  chatMessages as mockChatMessages,
  currentPlayer,
  lobbies as mockLobbies,
  notifications,
  players as playersForInvite,
} from './src/data/mock';
import {
  approveJoinRequest,
  joinGame,
  joinWaitlist,
  leaveLobby,
  rejectJoinRequest,
  requestWaitlistApproval,
} from './src/features/lobbies/lobbyActions';
import { getMinutesUntilLobbyStart } from './src/features/lobbies/lobbyDateTime';
import { defaultCancellationPenaltyMinutes, isJoinedParticipant, isLobbyFull } from './src/features/lobbies/lobbyRules';
import { AddFriendsScreen } from './src/screens/AddFriendsScreen';
import { AboutUsScreen } from './src/screens/AboutUsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { CommunityGuidelinesScreen } from './src/screens/CommunityGuidelinesScreen';
import { CreateLobbyScreen, type CreateLobbyDraft } from './src/screens/CreateLobbyScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { HelpSupportScreen } from './src/screens/HelpSupportScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InviteComposerScreen, type InviteComposerParams } from './src/screens/InviteComposerScreen';
import { LobbyChatSheet, LobbyDetailsScreen, LobbyFloatingChatButton } from './src/screens/LobbyDetailsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { ReportProblemScreen } from './src/screens/ReportProblemScreen';
import { SignupWizardScreen } from './src/screens/SignupWizardScreen';
import { TermsOfServiceScreen } from './src/screens/TermsOfServiceScreen';
import { colors, spacing } from './src/theme';
import type { ChatMessage, Lobby, Notification, Player } from './src/types';

export default function App() {
  const [homeFontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [authFlow, setAuthFlow] = useState<'app' | 'auth' | 'onboarding'>('auth');
  const [authEmail, setAuthEmail] = useState('');
  const [profilePlayer, setProfilePlayer] = useState<Player>(currentPlayer);
  const [lobbyItems, setLobbyItems] = useState<Lobby[]>(mockLobbies);
  const [verifiedPrivateLobbyIds, setVerifiedPrivateLobbyIds] = useState<string[]>([]);
  const [chatMessageItems, setChatMessageItems] = useState<ChatMessage[]>(mockChatMessages);
  const [notificationItems, setNotificationItems] = useState<Notification[]>(notifications);
  const [viewedProfilePlayer, setViewedProfilePlayer] = useState<Player | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isCommunityGuidelinesOpen, setIsCommunityGuidelinesOpen] = useState(false);
  const [isHelpSupportOpen, setIsHelpSupportOpen] = useState(false);
  const [isReportProblemOpen, setIsReportProblemOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [legalScreen, setLegalScreen] = useState<'privacy' | 'terms' | null>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [gamesInitialSection, setGamesInitialSection] = useState<'Find Games' | 'My Games'>('Find Games');
  const [selectedFilter, setSelectedFilter] = useState('All Games');
  const [inviteParams, setInviteParams] = useState<InviteComposerParams | null>(null);
  const [isLobbyChatOpen, setIsLobbyChatOpen] = useState(false);
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const unreadNotifications = notificationItems.filter((notification) => !notification.read);
  const unreadNotificationCount = unreadNotifications.length;
  const selectedLobby = selectedLobbyId
    ? lobbyItems.find((lobby) => lobby.id === selectedLobbyId) ?? null
    : null;
  const selectedLobbyIndex = selectedLobby
    ? Math.max(
        lobbyItems.findIndex((lobby) => lobby.id === selectedLobby.id),
        0,
      )
    : 0;

  const filteredLobbies = useMemo(() => {
    if (selectedFilter === 'Has spots') {
      return lobbyItems.filter((lobby) => !isLobbyFull(lobby));
    }

    if (selectedFilter === 'Requests') {
      return lobbyItems.filter((lobby) => lobby.joinRequests.length > 0);
    }

    return lobbyItems;
  }, [lobbyItems, selectedFilter]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [
    activeTab,
    authFlow,
    inviteParams,
    isAddFriendsOpen,
    isAboutUsOpen,
    isCommunityGuidelinesOpen,
    isEditProfileOpen,
    isHelpSupportOpen,
    isNotificationsOpen,
    isReportProblemOpen,
    legalScreen,
    isSideMenuOpen,
    selectedLobbyId,
    viewedProfilePlayer?.id,
  ]);

  function handleTabChange(tab: Tab) {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setLegalScreen(null);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setActiveTab(tab);
  }

  function openGamesSearch() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setGamesInitialSection('Find Games');
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setLegalScreen(null);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setActiveTab('games');
  }

  function openCreateGame() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setLegalScreen(null);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setActiveTab('create');
  }

  function openCommunityFriends() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setInviteParams({
      source: 'community',
    });
  }

  function openAddFriends() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setInviteParams(null);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setIsAddFriendsOpen(true);
    setLegalScreen(null);
  }

  function openInviteComposer(params: InviteComposerParams) {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(params);
    setIsLobbyChatOpen(false);
    setLegalScreen(null);
  }

  function closeInviteComposer() {
    setInviteParams(null);
  }

  function closeAddFriends() {
    setIsAddFriendsOpen(false);
  }

  function openViewedProfile(player: Player) {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setInviteParams(null);
    setIsAddFriendsOpen(false);
    setIsEditProfileOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setSelectedLobbyId(null);
    setIsLobbyChatOpen(false);
    setViewedProfilePlayer(player);
    setLegalScreen(null);
  }

  function closeViewedProfile() {
    setViewedProfilePlayer(null);
  }

  function openEditProfile() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setInviteParams(null);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setSelectedLobbyId(null);
    setIsLobbyChatOpen(false);
    setIsEditProfileOpen(true);
    setLegalScreen(null);
  }

  function closeEditProfile() {
    setIsEditProfileOpen(false);
  }

  function saveProfile(nextPlayer: Player) {
    setProfilePlayer(nextPlayer);
    setIsEditProfileOpen(false);
    setActiveTab('profile');
  }

  function openCreateGameFromInvite() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobbyId(null);
    setIsLobbyChatOpen(false);
    setActiveTab('create');
    setLegalScreen(null);
  }

  function openLobbyDetails(lobby: Lobby) {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setGamesInitialSection('Find Games');
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(lobby.id);
    setActiveTab('games');
    setLegalScreen(null);
  }

  function openSideMenu() {
    setIsNotificationsOpen(false);
    setIsSideMenuOpen(true);
  }

  function closeSideMenu() {
    setIsSideMenuOpen(false);
  }

  function openProfileFromMenu() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobbyId(null);
    setIsLobbyChatOpen(false);
    setActiveTab('profile');
    setLegalScreen(null);
  }

  function openMyGamesFromMenu() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setGamesInitialSection('My Games');
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setActiveTab('games');
    setLegalScreen(null);
  }

  function openReportProblem() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setIsReportProblemOpen(true);
    setLegalScreen(null);
  }

  function closeReportProblem() {
    setIsReportProblemOpen(false);
  }

  function openAboutUs() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setIsAboutUsOpen(true);
    setLegalScreen(null);
  }

  function closeAboutUs() {
    setIsAboutUsOpen(false);
  }

  function openCommunityGuidelines() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setIsCommunityGuidelinesOpen(true);
    setLegalScreen(null);
  }

  function closeCommunityGuidelines() {
    setIsCommunityGuidelinesOpen(false);
  }

  function openHelpSupport() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setIsHelpSupportOpen(true);
    setLegalScreen(null);
  }

  function closeHelpSupport() {
    setIsHelpSupportOpen(false);
  }

  function openPrivacyPolicy() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setLegalScreen('privacy');
  }

  function openTermsOfService() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setLegalScreen('terms');
  }

  function closeLegalScreen() {
    setLegalScreen(null);
  }

  function openNotifications() {
    setIsSideMenuOpen(false);
    setIsLobbyChatOpen(false);
    setIsNotificationsOpen(true);
  }

  function updateLobbyItem(nextLobby: Lobby) {
    setLobbyItems((current) => current.map((lobby) => (lobby.id === nextLobby.id ? nextLobby : lobby)));
  }

  function showLobbyActionMessages(messages: string[]) {
    if (messages.length === 0) {
      return;
    }

    Alert.alert('Game update', messages.join('\n'));
  }

  function addLobbyNotification(notification: Omit<Notification, 'id' | 'read'>) {
    setNotificationItems((current) => [
      {
        ...notification,
        id: `n-${Date.now()}-${current.length}`,
        read: false,
      },
      ...current,
    ]);
  }

  function handleJoinGame(lobby: Lobby) {
    const result = joinGame(lobby, profilePlayer, {
      accessCode: verifiedPrivateLobbyIds.includes(lobby.id) ? lobby.accessCode : undefined,
      allLobbies: lobbyItems,
    });

    if (result.success) {
      updateLobbyItem(result.lobby);
      return;
    }

    showLobbyActionMessages(result.messages);
  }

  function handleJoinWaitlist(lobby: Lobby) {
    const participant = lobby.participants.find((candidate) => candidate.playerId === profilePlayer.id);
    const isActiveInRoom = participant && (participant.status === 'approved' || participant.status === 'attended');
    const penaltyMinutes = lobby.cancellationPenaltyMinutes ?? defaultCancellationPenaltyMinutes;
    const isLateMoveFromJoined =
      participant &&
      isJoinedParticipant(participant) &&
      getMinutesUntilLobbyStart(lobby.startsAt) < penaltyMinutes;

    const moveToWaitlist = () => {
      const result = joinWaitlist(lobby, profilePlayer, {
        accessCode: verifiedPrivateLobbyIds.includes(lobby.id) ? lobby.accessCode : undefined,
        allLobbies: lobbyItems,
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
        return;
      }

      showLobbyActionMessages(result.messages);
    };

    if (isLateMoveFromJoined) {
      Alert.alert(
        'Late change penalty',
        'Moving to waitlist now may apply a late-change penalty. Continue?',
        [
          { style: 'cancel', text: 'Cancel' },
          { onPress: moveToWaitlist, text: 'Continue' },
        ],
      );
      return;
    }

    moveToWaitlist();
  }

  function handleRequestWaitlistApproval(lobby: Lobby) {
    const result = requestWaitlistApproval(lobby, profilePlayer);

    if (result.success) {
      updateLobbyItem(result.lobby);
      const host = playersForInvite.find((player) => player.id === lobby.adminId);

      addLobbyNotification({
        body: `You can keep viewing ${lobby.title} while ${host?.name ?? 'the host'} reviews your request.`,
        lobbyId: lobby.id,
        title: 'Request sent',
        type: 'waitlist_update',
      });
      return;
    }

    showLobbyActionMessages(result.messages);
  }

  function handleApproveWaitlistRequest(lobby: Lobby, playerId: string) {
    const player = playersForInvite.find((candidate) => candidate.id === playerId);

    if (!player) {
      showLobbyActionMessages(['Could not find this player in the mock player list.']);
      return;
    }

    const result = approveJoinRequest(lobby, player, 'waitlist', {
      allLobbies: lobbyItems,
    });

    updateLobbyItem(result.lobby);
    addLobbyNotification({
      body: `${player.name} was added to the waitlist for ${lobby.title}.`,
      lobbyId: lobby.id,
      title: 'Request approved',
      type: 'request_approved',
    });
    showLobbyActionMessages(result.messages.length > 0 ? result.messages : [`${player.name} approved to waitlist.`]);
  }

  function handleRejectJoinRequest(lobby: Lobby, playerId: string) {
    const player = playersForInvite.find((candidate) => candidate.id === playerId);

    updateLobbyItem(rejectJoinRequest(lobby, playerId));
    addLobbyNotification({
      body: `${player?.name ?? 'The player'} will see this as rejected when backend notifications are connected.`,
      lobbyId: lobby.id,
      title: 'Request rejected',
      type: 'request_rejected',
    });
  }

  function handleLeaveLobby(lobby: Lobby) {
    const participant = lobby.participants.find((candidate) => candidate.playerId === profilePlayer.id);

    if (!participant) {
      return;
    }

    updateLobbyItem(leaveLobby(lobby, profilePlayer.id));
    addLobbyNotification({
      body: `You left ${lobby.title}.`,
      lobbyId: lobby.id,
      title: 'Left room',
      type: 'waitlist_update',
    });
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setGamesInitialSection('My Games');
    setActiveTab('games');
  }

  function handleEnterPrivatePin(lobby: Lobby, pin: string) {
    if (lobby.accessCode !== pin.trim()) {
      return false;
    }

    setVerifiedPrivateLobbyIds((current) => (current.includes(lobby.id) ? current : [...current, lobby.id]));
    return true;
  }

  function openLobbyChat(lobby: Lobby) {
    setIsLobbyChatOpen(true);
    setLobbyItems((current) =>
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

  function closeLobbyChat() {
    setIsLobbyChatOpen(false);
  }

  function sendLobbyChatMessage(lobby: Lobby, channelId: string, body: string) {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return;
    }

    setChatMessageItems((current) => [
      ...current,
      {
        body: trimmedBody,
        channelId,
        createdAt: new Date().toISOString(),
        id: `m-${lobby.id}-${channelId}-${Date.now()}`,
        lobbyId: lobby.id,
        playerId: profilePlayer.id,
      },
    ]);
  }

  function handleCreateLobby(draft: CreateLobbyDraft) {
    const lobbyId = `lobby-${Date.now()}`;
    const selectedPlayerCounts = draft.playerCounts.length > 0 ? draft.playerCounts : [draft.maxPlayers];
    const nextLobby: Lobby = {
      adminId: profilePlayer.id,
      accessCode: draft.visibility === 'password' ? '4321' : undefined,
      ballNeeded: profilePlayer.hasBall,
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
      courtMarksNeeded: profilePlayer.hasCourtMarks,
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
          bringsBall: profilePlayer.hasBall,
          bringsCourtMarks: profilePlayer.hasCourtMarks,
          playerId: profilePlayer.id,
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

    setLobbyItems((current) => [nextLobby, ...current]);
    setChatMessageItems((current) => [
      ...current,
      {
        body: 'Game created. Use this chat to coordinate with players.',
        channelId: `${lobbyId}-all`,
        createdAt: new Date().toISOString(),
        id: `${lobbyId}-welcome`,
        lobbyId,
        playerId: profilePlayer.id,
      },
    ]);
    addLobbyNotification({
      body: `${draft.title} is live and visible in Games.`,
      lobbyId,
      title: 'Game created',
      type: 'lobby_changed',
    });
    setVerifiedPrivateLobbyIds((current) => (draft.visibility === 'password' ? [...current, lobbyId] : current));
    setSelectedLobbyId(lobbyId);
    setIsLobbyChatOpen(false);
    setActiveTab('games');
  }

  function closeNotifications() {
    setIsNotificationsOpen(false);
  }

  function markAllNotificationsRead() {
    setNotificationItems((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  function handleNotificationPress(notification: Notification) {
    setNotificationItems((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    );
    setIsNotificationsOpen(false);

    if (notification.lobbyId) {
      const lobby = lobbyItems.find((candidate) => candidate.id === notification.lobbyId);

      if (lobby) {
        openLobbyDetails(lobby);
        return;
      }
    }

    Alert.alert(notification.title, 'This notification context will be connected in a later pass.');
  }

  function showDrawerPlaceholder(_action: string, label: string) {
    setIsSideMenuOpen(false);
    Alert.alert(label, `${label} will be connected in a later pass.`);
  }

  function startOnboarding(email: string) {
    setAuthEmail(email);
    setAuthFlow('onboarding');
  }

  function finishOnboarding(nextPlayer: Player) {
    setProfilePlayer(nextPlayer);
    setAuthFlow('app');
    setActiveTab('home');
  }

  if (!homeFontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SafeAreaView
          edges={['top', 'left', 'right']}
          style={styles.safeArea}
        >
          <StatusBar style="dark" />
          <View
            style={styles.appShell}
          >
            {authFlow === 'auth' ? (
              <AuthScreen onContinue={startOnboarding} />
            ) : authFlow === 'onboarding' ? (
              <SignupWizardScreen
                email={authEmail}
                onBack={() => setAuthFlow('auth')}
                onComplete={finishOnboarding}
                player={profilePlayer}
              />
            ) : (
              <>
            {viewedProfilePlayer ? (
              <>
                <ScrollView
                  ref={scrollRef}
                  contentContainerStyle={[styles.content, styles.contentFlush]}
                  showsVerticalScrollIndicator={false}
                >
                  <ProfileScreen
                    notificationCount={unreadNotificationCount}
                    onBack={closeViewedProfile}
                    onInvitePlayer={(playerId) => openInviteComposer({ inviteTargetPlayerId: playerId, source: 'profile' })}
                    onOpenMenu={openSideMenu}
                    onOpenNotifications={openNotifications}
                    onViewPlayerProfile={openViewedProfile}
                    player={viewedProfilePlayer}
                  />
                </ScrollView>
                <BottomNav activeTab={activeTab} onChange={handleTabChange} />
              </>
            ) : isEditProfileOpen ? (
              <EditProfileScreen onBack={closeEditProfile} onSave={saveProfile} player={profilePlayer} />
            ) : isAddFriendsOpen ? (
              <AddFriendsScreen onBack={closeAddFriends} onViewPlayerProfile={openViewedProfile} players={playersForInvite} />
            ) : isAboutUsOpen ? (
              <AboutUsScreen onBack={closeAboutUs} />
            ) : isCommunityGuidelinesOpen ? (
              <CommunityGuidelinesScreen onBack={closeCommunityGuidelines} onReportProblem={openReportProblem} />
            ) : isHelpSupportOpen ? (
              <HelpSupportScreen onBack={closeHelpSupport} onReportProblem={openReportProblem} />
            ) : isReportProblemOpen ? (
              <ReportProblemScreen onBack={closeReportProblem} />
            ) : legalScreen === 'privacy' ? (
              <PrivacyPolicyScreen onBack={closeLegalScreen} onReportProblem={openReportProblem} />
            ) : legalScreen === 'terms' ? (
              <TermsOfServiceScreen onBack={closeLegalScreen} onReportProblem={openReportProblem} />
            ) : inviteParams ? (
              <InviteComposerScreen
                lobbies={lobbyItems}
                onBack={closeInviteComposer}
                onCreateGame={openCreateGameFromInvite}
                params={inviteParams}
                players={playersForInvite}
              />
            ) : (
              <>
                <ScrollView
                  ref={scrollRef}
                  contentContainerStyle={[styles.content, styles.contentFlush]}
                  showsVerticalScrollIndicator={false}
                >
                  {activeTab === 'home' && (
                    <HomeScreen
                      currentPlayer={profilePlayer}
                      lobbies={filteredLobbies}
                      notifications={unreadNotifications}
                      onCreateGame={openCreateGame}
                      onInviteFriends={openCommunityFriends}
                      onOpenMenu={openSideMenu}
                      onOpenGames={openGamesSearch}
                      onOpenLobby={openLobbyDetails}
                      onOpenNotifications={openNotifications}
                    />
                  )}
                  {activeTab === 'games' && (
                    selectedLobby ? (
                      <LobbyDetailsScreen
                        lobby={selectedLobby}
                        lobbyIndex={selectedLobbyIndex}
                        notificationCount={unreadNotificationCount}
                        allLobbies={lobbyItems}
                        hasPrivateAccess={verifiedPrivateLobbyIds.includes(selectedLobby.id)}
                        onBack={() => {
                          setIsLobbyChatOpen(false);
                          setSelectedLobbyId(null);
                        }}
                        onEnterPrivatePin={(pin) => handleEnterPrivatePin(selectedLobby, pin)}
                        onInvite={() =>
                          openInviteComposer({
                            inviteTargetLobbyId: selectedLobby.id,
                            source: 'lobby',
                          })
                        }
                        onJoinGame={() => handleJoinGame(selectedLobby)}
                        onJoinWaitlist={() => handleJoinWaitlist(selectedLobby)}
                        onLeaveLobby={() => handleLeaveLobby(selectedLobby)}
                        onOpenMenu={openSideMenu}
                        onOpenNotifications={openNotifications}
                        onApproveWaitlistRequest={(playerId) => handleApproveWaitlistRequest(selectedLobby, playerId)}
                        onRequestWaitlistApproval={() => handleRequestWaitlistApproval(selectedLobby)}
                        onRejectWaitlistRequest={(playerId) => handleRejectJoinRequest(selectedLobby, playerId)}
                        onViewPlayerProfile={openViewedProfile}
                      />
                    ) : (
                      <GamesScreen
                        initialSection={gamesInitialSection}
                        lobbies={filteredLobbies}
                        notificationCount={unreadNotificationCount}
                        onBack={() => setActiveTab('home')}
                        onOpenMenu={openSideMenu}
                        onOpenNotifications={openNotifications}
                        onOpenLobby={openLobbyDetails}
                        selectedFilter={selectedFilter}
                        setSelectedFilter={setSelectedFilter}
                      />
                    )
                  )}
                  {activeTab === 'create' && (
                    <CreateLobbyScreen
                      notificationCount={unreadNotificationCount}
                      onCancel={() => setActiveTab('home')}
                      onCreateLobby={handleCreateLobby}
                      onOpenMenu={openSideMenu}
                      onOpenNotifications={openNotifications}
                    />
                  )}
                  {activeTab === 'community' && (
                    <CommunityScreen
                      notificationCount={unreadNotificationCount}
                      onAddFriend={openAddFriends}
                      onInvitePlayer={(playerId, source) => openInviteComposer({ inviteTargetPlayerId: playerId, source })}
                      onOpenMenu={openSideMenu}
                      onOpenNotifications={openNotifications}
                      onViewPlayerProfile={openViewedProfile}
                    />
                  )}
                  {activeTab === 'profile' && (
                    <ProfileScreen
                      notificationCount={unreadNotificationCount}
                      onEditProfile={openEditProfile}
                      onInvitePlayer={(playerId) => openInviteComposer({ inviteTargetPlayerId: playerId, source: 'profile' })}
                      onOpenMenu={openSideMenu}
                      onOpenNotifications={openNotifications}
                      onViewPlayerProfile={openViewedProfile}
                      player={profilePlayer}
                    />
                  )}
                </ScrollView>
                <BottomNav activeTab={activeTab} onChange={handleTabChange} />
                {activeTab === 'games' && selectedLobby && selectedLobby.status !== 'rating_open' ? (
                  <>
                    <LobbyFloatingChatButton lobby={selectedLobby} onPress={() => openLobbyChat(selectedLobby)} />
                    <LobbyChatSheet
                      lobby={selectedLobby}
                      messages={chatMessageItems.filter((message) => message.lobbyId === selectedLobby.id)}
                      onClose={closeLobbyChat}
                      onSendMessage={(channelId, body) => sendLobbyChatMessage(selectedLobby, channelId, body)}
                      visible={isLobbyChatOpen}
                    />
                  </>
                ) : null}
              </>
            )}
              </>
            )}
            {authFlow === 'app' ? (
              <>
            <SideMenuDrawer
              onClose={closeSideMenu}
              onAbout={openAboutUs}
              onCommunityGuidelines={openCommunityGuidelines}
              onEditProfile={openEditProfile}
              onHelpSupport={openHelpSupport}
              onInviteFriends={openAddFriends}
              onMyGames={openMyGamesFromMenu}
              onNotifications={openNotifications}
              onPrivacyPolicy={openPrivacyPolicy}
              onPlaceholderAction={showDrawerPlaceholder}
              onReportProblem={openReportProblem}
              onTermsOfService={openTermsOfService}
              onViewProfile={openProfileFromMenu}
              player={profilePlayer}
              visible={isSideMenuOpen}
            />
            <NotificationPanel
              lobbies={lobbyItems}
              notifications={notificationItems}
              onClose={closeNotifications}
              onMarkAllRead={markAllNotificationsRead}
              onNotificationPress={handleNotificationPress}
              visible={isNotificationsOpen}
            />
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 170,
    paddingHorizontal: spacing.lg,
  },
  contentFlush: {
    paddingHorizontal: 0,
  },
});
