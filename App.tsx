import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from './src/components/AppText';
import { BottomNav, type Tab } from './src/components/BottomNav';
import { NotificationPanel } from './src/components/NotificationPanel';
import { PlayerProfilePreview } from './src/components/PlayerProfilePreview';
import {
  getPlayerDisplayRating,
  getPlayerPreviewPlayingDetails,
  getPlayerPreviewTrustCues,
} from './src/components/playerProfilePreviewDetails';
import { SideMenuDrawer } from './src/components/SideMenuDrawer';
import { currentPlayer as mockCurrentPlayer, players as mockPlayers } from './src/data/mock';
import {
  deleteCurrentUserAccount,
  getCurrentSession,
  preparePasswordResetSession,
  requestPasswordResetEmail,
  resendSignupVerificationEmail,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateCurrentUserPassword,
} from './src/features/auth/authRepository';
import { uploadProfilePhoto } from './src/features/auth/profilePhotoRepository';
import { getPlayerByAuthUserId, listPlayers, upsertPlayerForUser } from './src/features/auth/playerRepository';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  listFriendRequests,
  removeFriend,
  sendFriendRequest,
} from './src/features/friends/friendRepository';
import type { CreateLobbyDraft, LobbySettingsDraft } from './src/features/lobbies/lobbyCreateTypes';
import { hasLobbyStarted } from './src/features/lobbies/lobbyDateTime';
import { useLobbyStore } from './src/features/lobbies/useLobbyStore';
import { createNotification } from './src/features/notifications/notificationRepository';
import { getTocaLevel } from './src/features/tocaPoints/tocaPointProgression';
import { AddFriendsScreen } from './src/screens/AddFriendsScreen';
import { AboutUsScreen } from './src/screens/AboutUsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { CommunityGuidelinesScreen } from './src/screens/CommunityGuidelinesScreen';
import { CreateLobbyScreen } from './src/screens/CreateLobbyScreen';
import { DeleteAccountScreen } from './src/screens/DeleteAccountScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { EmailVerifiedScreen } from './src/screens/EmailVerifiedScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { HelpSupportScreen } from './src/screens/HelpSupportScreen';
import { HostLobbyManagementScreen } from './src/screens/HostLobbyManagementScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InviteComposerScreen, type InviteComposerParams } from './src/screens/InviteComposerScreen';
import { LobbyChatSheet, LobbyDetailsScreen, LobbyFloatingChatButton } from './src/screens/LobbyDetailsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PrivacyPolicyScreen } from './src/screens/PrivacyPolicyScreen';
import { ReportProblemScreen } from './src/screens/ReportProblemScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { SignupWizardScreen } from './src/screens/SignupWizardScreen';
import { TermsOfServiceScreen } from './src/screens/TermsOfServiceScreen';
import { colors, radius, shadows, spacing } from './src/theme';
import type { FriendRequest, Lobby, Notification, Player } from './src/types';

type HomeTocaPointGain = {
  amount: number;
  from: number;
  id: number;
  to: number;
};

const LEVEL_UP_BURST_CONFETTI = [
  { color: colors.accentGold, height: 16, rotate: '22deg', width: 7, x: -178, y: -318 },
  { color: colors.primary, height: 10, rotate: '-34deg', width: 12, x: -112, y: -360 },
  { color: colors.primaryDark, height: 14, rotate: '68deg', width: 6, x: -34, y: -322 },
  { color: colors.accentGoldDark, height: 10, rotate: '-18deg', width: 16, x: 68, y: -372 },
  { color: colors.danger, height: 14, rotate: '41deg', width: 7, x: 146, y: -302 },
  { color: colors.primary, height: 9, rotate: '-62deg', width: 14, x: 190, y: -194 },
  { color: colors.accentGold, height: 15, rotate: '-26deg', width: 7, x: 184, y: -42 },
  { color: colors.primaryDark, height: 10, rotate: '32deg', width: 16, x: 148, y: 116 },
  { color: colors.accentGoldDark, height: 13, rotate: '-48deg', width: 6, x: 86, y: 292 },
  { color: colors.primary, height: 10, rotate: '58deg', width: 14, x: -28, y: 342 },
  { color: colors.danger, height: 14, rotate: '-12deg', width: 7, x: -142, y: 258 },
  { color: colors.primaryDark, height: 9, rotate: '74deg', width: 16, x: -196, y: 74 },
  { color: colors.accentGold, height: 9, rotate: '12deg', width: 18, x: -172, y: -146 },
  { color: colors.primary, height: 17, rotate: '-76deg', width: 6, x: -62, y: -214 },
  { color: colors.danger, height: 9, rotate: '36deg', width: 14, x: 24, y: -244 },
  { color: colors.accentGoldDark, height: 15, rotate: '-28deg', width: 7, x: 132, y: -128 },
  { color: colors.primaryDark, height: 9, rotate: '82deg', width: 16, x: 164, y: 50 },
  { color: colors.accentGold, height: 16, rotate: '-38deg', width: 7, x: 74, y: 210 },
  { color: colors.primary, height: 9, rotate: '52deg', width: 14, x: -82, y: 218 },
  { color: colors.accentGoldDark, height: 13, rotate: '-58deg', width: 6, x: -162, y: 18 },
];

const LEVEL_UP_FALL_CONFETTI = [
  { color: colors.accentGold, drift: 28, height: 12, rotate: '18deg', width: 7, x: -182 },
  { color: colors.primary, drift: -18, height: 8, rotate: '-42deg', width: 14, x: -132 },
  { color: colors.danger, drift: 22, height: 14, rotate: '61deg', width: 6, x: -76 },
  { color: colors.accentGoldDark, drift: -30, height: 9, rotate: '-16deg', width: 16, x: -18 },
  { color: colors.primaryDark, drift: 16, height: 13, rotate: '34deg', width: 7, x: 42 },
  { color: colors.primary, drift: -24, height: 8, rotate: '-70deg', width: 14, x: 102 },
  { color: colors.accentGold, drift: 30, height: 14, rotate: '28deg', width: 7, x: 162 },
  { color: colors.danger, drift: -14, height: 9, rotate: '-30deg', width: 16, x: 204 },
];

export default function App() {
  const [homeFontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [authFlow, setAuthFlow] = useState<'app' | 'auth' | 'loading' | 'onboarding'>('loading');
  const [isEmailVerifiedRoute] = useState(isEmailVerifiedPath);
  const [isPasswordResetRoute] = useState(isPasswordResetPath);
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  const [isResetPasswordReady, setIsResetPasswordReady] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordNotice, setResetPasswordNotice] = useState<string | null>(null);
  const [profilePlayer, setProfilePlayer] = useState<Player>(mockCurrentPlayer);
  const [playersForInvite, setPlayersForInvite] = useState<Player[]>(mockPlayers);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<{
    body: string;
    title: string;
  } | null>(null);
  const [homeTocaPointGain, setHomeTocaPointGain] = useState<HomeTocaPointGain | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{
    fromLevel: number;
    toLevel: number;
  } | null>(null);
  const [pendingFriendRemovalId, setPendingFriendRemovalId] = useState<string | null>(null);
  const lobbyStore = useLobbyStore(profilePlayer, playersForInvite, { enabled: authFlow === 'app' });
  const [viewedProfilePlayer, setViewedProfilePlayer] = useState<Player | null>(null);
  const [previewProfilePlayer, setPreviewProfilePlayer] = useState<Player | null>(null);
  const [communityInitialFriendView, setCommunityInitialFriendView] = useState<'Friends' | 'Friend requests'>('Friends');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [isCommunityGuidelinesOpen, setIsCommunityGuidelinesOpen] = useState(false);
  const [isHelpSupportOpen, setIsHelpSupportOpen] = useState(false);
  const [isReportProblemOpen, setIsReportProblemOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [legalScreen, setLegalScreen] = useState<'privacy' | 'terms' | null>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [gamesInitialSection, setGamesInitialSection] = useState<'Find Games' | 'My Games'>('Find Games');
  const [selectedFilter, setSelectedFilter] = useState('All Games');
  const [inviteParams, setInviteParams] = useState<InviteComposerParams | null>(null);
  const [isLobbyChatOpen, setIsLobbyChatOpen] = useState(false);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [selectedLobbyId, setSelectedLobbyId] = useState<string | null>(null);
  const [pendingCreatedLobby, setPendingCreatedLobby] = useState<Lobby | null>(null);
  const [isHostManagementOpen, setIsHostManagementOpen] = useState(false);
  const [pendingLobbyActionKey, setPendingLobbyActionKey] = useState<string | null>(null);
  const lastHomeTocaPlayerIdRef = useRef<string | null>(null);
  const lastHomeTocaPointsRef = useRef<number | null>(null);
  const pendingLobbyActionRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const unreadNotifications = lobbyStore.unreadNotifications;
  const unreadNotificationCount = lobbyStore.unreadNotificationCount;
  const selectedLobby = selectedLobbyId
    ? lobbyStore.getLobbyById(selectedLobbyId) ?? (pendingCreatedLobby?.id === selectedLobbyId ? pendingCreatedLobby : null)
    : null;
  const visibleSelectedLobby = selectedLobby ? lobbyStore.getVisibleLobby(selectedLobby) : null;
  const selectedLobbyIndex = selectedLobby ? lobbyStore.getLobbyIndex(selectedLobby.id) : 0;
  const filteredLobbies = lobbyStore.getFilteredLobbies(selectedFilter);

  useEffect(() => {
    async function bootstrapSession() {
      try {
        const session = await getCurrentSession();

        if (!session?.user) {
          setAuthFlow('auth');
          return;
        }

        await continueWithAuthenticatedUser(session.user);
      } catch (error) {
        console.warn('Could not restore Supabase session.', error);
        setAuthFlow('auth');
      }
    }

    void bootstrapSession();
  }, []);

  useEffect(() => {
    if (authFlow !== 'app') {
      lastHomeTocaPlayerIdRef.current = null;
      lastHomeTocaPointsRef.current = null;
      setHomeTocaPointGain(null);
      return;
    }

    if (lastHomeTocaPlayerIdRef.current !== profilePlayer.id) {
      lastHomeTocaPlayerIdRef.current = profilePlayer.id;
      lastHomeTocaPointsRef.current = profilePlayer.tocaPoints;
      setHomeTocaPointGain(null);
      return;
    }

    if (activeTab !== 'home') {
      return;
    }

    const previousTocaPoints = lastHomeTocaPointsRef.current;

    if (previousTocaPoints === null) {
      lastHomeTocaPointsRef.current = profilePlayer.tocaPoints;
      return;
    }

    if (profilePlayer.tocaPoints > previousTocaPoints) {
      const previousLevel = getTocaLevel(previousTocaPoints);
      const nextLevel = getTocaLevel(profilePlayer.tocaPoints);

      setHomeTocaPointGain({
        amount: profilePlayer.tocaPoints - previousTocaPoints,
        from: previousTocaPoints,
        id: Date.now(),
        to: profilePlayer.tocaPoints,
      });

      if (nextLevel > previousLevel) {
        setLevelUpModal({
          fromLevel: previousLevel,
          toLevel: nextLevel,
        });
      }
    } else if (profilePlayer.tocaPoints < previousTocaPoints) {
      setHomeTocaPointGain(null);
    }

    lastHomeTocaPointsRef.current = profilePlayer.tocaPoints;
  }, [activeTab, authFlow, profilePlayer.id, profilePlayer.tocaPoints]);

  useEffect(() => {
    if (!homeTocaPointGain) {
      return undefined;
    }

    const clearTimer = setTimeout(() => {
      setHomeTocaPointGain((currentGain) => (
        currentGain?.id === homeTocaPointGain.id ? null : currentGain
      ));
    }, 2400);

    return () => clearTimeout(clearTimer);
  }, [homeTocaPointGain?.id]);

  useEffect(() => {
    if (pendingCreatedLobby && lobbyStore.getLobbyById(pendingCreatedLobby.id)) {
      setPendingCreatedLobby(null);
    }
  }, [lobbyStore, pendingCreatedLobby]);

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
    isHostManagementOpen,
    isNotificationsOpen,
    isReportProblemOpen,
    isDeleteAccountOpen,
    legalScreen,
    isSideMenuOpen,
    selectedLobbyId,
    viewedProfilePlayer?.id,
    previewProfilePlayer?.id,
  ]);

  async function refreshPlayersDirectory(currentPlayerOverride?: Player) {
    try {
      const nextPlayers = await listPlayers();
      const current = currentPlayerOverride ?? profilePlayer;
      const hasCurrentPlayer = nextPlayers.some((player) => player.id === current.id);

      setPlayersForInvite(hasCurrentPlayer ? nextPlayers : [current, ...nextPlayers]);
    } catch (error) {
      console.warn('Could not load Supabase player directory.', error);
      setPlayersForInvite(mockPlayers);
    }
  }

  async function refreshFriendRequests(currentPlayerOverride?: Player) {
    const current = currentPlayerOverride ?? profilePlayer;

    try {
      setFriendRequests(await listFriendRequests(current.id));
    } catch (error) {
      console.warn('Could not load friend requests.', error);
      setFriendRequests([]);
    }
  }

  async function refreshSocialData(currentPlayerOverride?: Player) {
    await Promise.all([
      refreshPlayersDirectory(currentPlayerOverride),
      refreshFriendRequests(currentPlayerOverride),
    ]);
  }

  async function continueWithAuthenticatedUser(user: User) {
    setAuthUser(user);
    setAuthEmail(user.email ?? '');

    const existingPlayer = await getPlayerByAuthUserId(user.id);

    if (existingPlayer) {
      setProfilePlayer(existingPlayer);
      await refreshSocialData(existingPlayer);
      setAuthFlow('app');
      setActiveTab('home');
      return;
    }

    setProfilePlayer(getOnboardingFallbackPlayer(user));
    setAuthFlow('onboarding');
  }

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
    setIsDeleteAccountOpen(false);
    setLegalScreen(null);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setIsHostManagementOpen(false);
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
    setIsHostManagementOpen(false);
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
    setCommunityInitialFriendView('Friends');
    setInviteParams(null);
    setIsAddFriendsOpen(false);
    setSelectedLobbyId(null);
    setViewedProfilePlayer(null);
    setActiveTab('community');
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

  async function saveProfile(nextPlayer: Player) {
    if (!authUser) {
      setProfilePlayer(nextPlayer);
      setIsEditProfileOpen(false);
      setActiveTab('profile');
      return;
    }

    try {
      const savedPlayer = await upsertPlayerForUser(authUser, nextPlayer);

      setProfilePlayer(savedPlayer);
      setIsEditProfileOpen(false);
      setActiveTab('profile');
      void refreshSocialData(savedPlayer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save profile changes.';

      Alert.alert('Profile update failed', message);
    }
  }

  async function refreshCurrentPlayerProfileOnly() {
    if (!authUser) {
      return profilePlayer;
    }

    const nextPlayer = await getPlayerByAuthUserId(authUser.id);

    if (!nextPlayer) {
      return profilePlayer;
    }

    setProfilePlayer(nextPlayer);
    return nextPlayer;
  }

  async function refreshCurrentPlayer() {
    const nextPlayer = await refreshCurrentPlayerProfileOnly();

    await refreshSocialData(nextPlayer);
    return nextPlayer;
  }

  async function handleSendFriendRequest(playerId: string) {
    try {
      const request = await sendFriendRequest(playerId);

      setFriendRequests((current) => upsertFriendRequest(current, request));
      await refreshFriendRequests();
      setConfirmationModal({
        body: 'Your friend request was sent.',
        title: 'Friend request sent',
      });
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleAcceptFriendRequest(requestId: string) {
    try {
      const request = await acceptFriendRequest(requestId);

      setFriendRequests((current) => upsertFriendRequest(current, request));
      await refreshCurrentPlayer();
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleDeclineFriendRequest(requestId: string) {
    try {
      const request = await declineFriendRequest(requestId);

      setFriendRequests((current) => upsertFriendRequest(current, request));
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleCancelFriendRequest(requestId: string) {
    try {
      const request = await cancelFriendRequest(requestId);

      setFriendRequests((current) => upsertFriendRequest(current, request));
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleRemoveFriend(playerId: string) {
    setPendingFriendRemovalId(playerId);
  }

  async function confirmRemoveFriend() {
    if (!pendingFriendRemovalId) {
      return;
    }

    const playerId = pendingFriendRemovalId;
    const removedPlayer = playersForInvite.find((candidate) => candidate.id === playerId);

    setPendingFriendRemovalId(null);

    try {
      await removeFriend(playerId);
      await refreshCurrentPlayer();
      setConfirmationModal({
        body: `${removedPlayer?.name ?? 'This player'} was removed from your friends list.`,
        title: 'Friend removed',
      });
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleSendLobbyInvites(lobby: Lobby, playerIds: string[]) {
    try {
      const inviteResults = await Promise.all(
        playerIds.map((playerId) =>
          createNotification({
            body: `${profilePlayer.name} invited you to ${lobby.title}.`,
            lobbyId: lobby.id,
            playerId: profilePlayer.id,
            recipientPlayerId: playerId,
            title: 'New invite request',
            type: 'room_invite',
          }),
        ),
      );
      const sentCount = inviteResults.filter(Boolean).length;

      if (sentCount === 0) {
        throw new Error('No invite notification was sent. Refresh players and try again.');
      }

      await lobbyStore.refreshLobbyData();
      Alert.alert(
        sentCount === 1 ? 'Invite sent' : 'Invites sent',
        sentCount === 1
          ? `Your invite to ${lobby.title} was sent.`
          : `${sentCount} invites to ${lobby.title} were sent.`,
      );
    } catch (error) {
      showActionError(error);
      throw error;
    }
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
    setIsHostManagementOpen(false);
    setActiveTab('create');
    setLegalScreen(null);
  }

  function openLobbyDetails(lobby: Lobby) {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    if (activeTab !== 'games') {
      setGamesInitialSection('Find Games');
    }
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setIsHostManagementOpen(false);
    setSelectedLobbyId(lobby.id);
    setActiveTab('games');
    setLegalScreen(null);
  }

  function openHostManagement() {
    if (selectedLobby && hasLobbyStarted(selectedLobby.startsAt)) {
      Alert.alert('Game started', 'Host tools close when the match starts.');
      return;
    }

    setIsLobbyChatOpen(false);
    setIsHostManagementOpen(true);
  }

  function closeHostManagement() {
    setIsHostManagementOpen(false);
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

  function openDeleteAccount() {
    setIsSideMenuOpen(false);
    setIsNotificationsOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setSelectedLobbyId(null);
    setIsLobbyChatOpen(false);
    setInviteParams(null);
    setLegalScreen(null);
    setDeleteAccountError(null);
    setIsDeleteAccountOpen(true);
  }

  function closeDeleteAccount() {
    if (!isDeletingAccount) {
      setIsDeleteAccountOpen(false);
    }
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
    markAllNotificationsRead();
  }

  function showLobbyActionMessages(messages: string[]) {
    if (messages.length === 0) {
      return;
    }

    Alert.alert('Game update', messages.join('\n'));
  }

  async function runLobbyAction<T>(actionKey: string, action: () => Promise<T>) {
    if (pendingLobbyActionRef.current) {
      return null;
    }

    pendingLobbyActionRef.current = actionKey;
    setPendingLobbyActionKey(actionKey);

    try {
      return await action();
    } finally {
      pendingLobbyActionRef.current = null;
      setPendingLobbyActionKey(null);
    }
  }

  async function handleJoinGame(lobby: Lobby) {
    try {
      const result = await runLobbyAction(`join-game:${lobby.id}`, () => lobbyStore.joinGame(lobby));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  function handleJoinWaitlist(lobby: Lobby) {
    const moveToWaitlist = async () => {
      try {
        const result = await runLobbyAction(`join-waitlist:${lobby.id}`, () => lobbyStore.joinWaitlist(lobby));

        if (!result) {
          return;
        }

        showLobbyActionMessages(result.messages);
      } catch (error) {
        showActionError(error);
      }
    };

    if (pendingLobbyActionRef.current) {
      return;
    }

    if (lobbyStore.shouldConfirmMoveToWaitlist(lobby)) {
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

  async function handleRequestWaitlistApproval(lobby: Lobby) {
    try {
      const result = await runLobbyAction(`request-waitlist:${lobby.id}`, () => lobbyStore.requestWaitlistApproval(lobby));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleApproveWaitlistRequest(lobby: Lobby, playerId: string) {
    try {
      const result = await runLobbyAction(`approve-waitlist:${lobby.id}:${playerId}`, () => lobbyStore.approveWaitlistRequest(lobby, playerId));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleRejectJoinRequest(lobby: Lobby, playerId: string) {
    try {
      const result = await runLobbyAction(`reject-request:${lobby.id}:${playerId}`, () => lobbyStore.rejectJoinRequest(lobby, playerId));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleCancelJoinRequest(lobby: Lobby) {
    try {
      const result = await runLobbyAction(`cancel-request:${lobby.id}`, () => lobbyStore.cancelJoinRequest(lobby));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleLeaveLobby(lobby: Lobby) {
    let result;

    try {
      result = await runLobbyAction(`leave-lobby:${lobby.id}`, () => lobbyStore.leaveLobby(lobby));
    } catch (error) {
      showActionError(error);
      return;
    }

    if (!result?.success) {
      return;
    }

    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
    setGamesInitialSection('Find Games');
    setActiveTab('games');
  }

  function showActionError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';

    Alert.alert('Game update failed', message);
  }

  function handleEnterPrivatePin(lobby: Lobby, pin: string) {
    return lobbyStore.enterPrivatePin(lobby, pin);
  }

  function openLobbyChat(lobby: Lobby) {
    setIsLobbyChatOpen(true);
    lobbyStore.markLobbyChatRead(lobby);
  }

  function closeLobbyChat() {
    setIsLobbyChatOpen(false);
  }

  function sendLobbyChatMessage(lobby: Lobby, channelId: string, body: string) {
    void lobbyStore.sendLobbyChatMessage(lobby, channelId, body).catch(showActionError);
  }

  async function handleCreateLobby(draft: CreateLobbyDraft) {
    if (isCreatingLobby) {
      return;
    }

    setIsCreatingLobby(true);

    try {
      const nextLobby = await lobbyStore.createLobby(draft);

      setPendingCreatedLobby(nextLobby);
      setSelectedLobbyId(nextLobby.id);
      setIsLobbyChatOpen(false);
      setGamesInitialSection('My Games');
      setActiveTab('games');
    } catch (error) {
      showActionError(error);
    } finally {
      setIsCreatingLobby(false);
    }
  }

  async function handleUpdateLobbySettings(lobby: Lobby, draft: LobbySettingsDraft) {
    try {
      const result = await runLobbyAction(`update-lobby:${lobby.id}`, () => lobbyStore.updateLobbySettings(lobby, draft));

      if (!result) {
        return;
      }

      if (result.success) {
        setIsHostManagementOpen(false);
        Alert.alert('Lobby saved', 'Your changes were saved.', [
          {
            text: 'OK',
          },
        ]);
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleMoveLobbyParticipantToWaitlist(lobby: Lobby, playerId: string) {
    try {
      const result = await runLobbyAction(`move-waitlist:${lobby.id}:${playerId}`, () =>
        lobbyStore.moveLobbyParticipantToWaitlist(lobby, playerId),
      );

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleKickLobbyParticipant(lobby: Lobby, playerId: string) {
    try {
      const result = await runLobbyAction(`kick-player:${lobby.id}:${playerId}`, () => lobbyStore.kickLobbyParticipant(lobby, playerId));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleTransferLobbyHost(lobby: Lobby, playerId: string) {
    try {
      const result = await runLobbyAction(`transfer-host:${lobby.id}:${playerId}`, () => lobbyStore.transferLobbyHost(lobby, playerId));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleCloseLobby(lobby: Lobby) {
    try {
      const result = await runLobbyAction(`close-lobby:${lobby.id}`, () => lobbyStore.closeLobby(lobby));

      if (!result) {
        return;
      }

      showLobbyActionMessages(result.messages);

      if (result.success) {
        setIsHostManagementOpen(false);
        setIsLobbyChatOpen(false);
        setSelectedLobbyId(null);
        setGamesInitialSection('Find Games');
        setActiveTab('games');
      }
    } catch (error) {
      showActionError(error);
    }
  }

  function closeNotifications() {
    setIsNotificationsOpen(false);
  }

  function markAllNotificationsRead() {
    void lobbyStore.refreshAndMarkAllNotificationsRead().catch(showActionError);
  }

  function handleNotificationPress(notification: Notification) {
    void lobbyStore.markNotificationRead(notification.id).catch(showActionError);
    setIsNotificationsOpen(false);

    if (notification.type === 'friend_request') {
      setCommunityInitialFriendView('Friend requests');
      setViewedProfilePlayer(null);
      setPreviewProfilePlayer(null);
      setInviteParams(null);
      setSelectedLobbyId(null);
      setIsAddFriendsOpen(false);
      setActiveTab('community');
      return;
    }

    if (notification.type === 'friend_accepted' && notification.playerId) {
      const player = playersForInvite.find((candidate) => candidate.id === notification.playerId);

      if (player) {
        setPreviewProfilePlayer(player);
        return;
      }
    }

    if (notification.lobbyId) {
      const lobby = lobbyStore.getLobbyById(notification.lobbyId);

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

  function resetAppNavigationState() {
    setActiveTab('home');
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsAboutUsOpen(false);
    setIsCommunityGuidelinesOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setIsDeleteAccountOpen(false);
    setDeleteAccountError(null);
    setIsNotificationsOpen(false);
    setLegalScreen(null);
    setIsSideMenuOpen(false);
    setGamesInitialSection('Find Games');
    setSelectedFilter('All Games');
    setInviteParams(null);
    setIsLobbyChatOpen(false);
    setSelectedLobbyId(null);
  }

  async function handleLogOut() {
    setIsSideMenuOpen(false);

    try {
      await signOut();
      resetAppNavigationState();
      setAuthUser(null);
      setAuthEmail('');
      setAuthError(null);
      setAuthNotice(null);
      setProfilePlayer(mockCurrentPlayer);
      setPlayersForInvite(mockPlayers);
      setAuthFlow('auth');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not log out.';

      Alert.alert('Log out failed', message);
    }
  }

  async function handleDeleteAccount(feedback: string) {
    setDeleteAccountError(null);
    setIsDeletingAccount(true);

    try {
      await deleteCurrentUserAccount(feedback);
      resetAppNavigationState();
      setAuthUser(null);
      setAuthEmail('');
      setAuthError(null);
      setAuthNotice(null);
      setProfilePlayer(mockCurrentPlayer);
      setPlayersForInvite(mockPlayers);
      setAuthFlow('auth');
      Alert.alert('Account deleted', 'Your TOCA account and data have been deleted.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete your account.';

      setDeleteAccountError(message);
      Alert.alert('Delete account failed', message);
    } finally {
      setIsDeletingAccount(false);
    }
  }

  function clearAuthFeedback() {
    setAuthError(null);
    setAuthNotice(null);
  }

  async function continueAuth(credentials: { email: string; mode: 'login' | 'signup'; password: string }) {
    setAuthError(null);
    setAuthNotice(null);
    setIsAuthLoading(true);

    try {
      const result = credentials.mode === 'login'
        ? await signInWithEmail(credentials.email, credentials.password)
        : await signUpWithEmail(credentials.email, credentials.password);

      if (result.needsEmailConfirmation || !result.session?.user) {
        setAuthNotice('Verification sent to email.');
        return;
      }

      await continueWithAuthenticatedUser(result.session.user);
    } catch (error) {
      const message = getAuthErrorMessage(error, credentials.mode);

      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function resendAuthVerification(email: string) {
    setAuthError(null);
    setAuthNotice(null);
    setIsAuthLoading(true);

    try {
      await resendSignupVerificationEmail(email);
      setAuthNotice('Verification sent to email.');
    } catch (error) {
      const message = getAuthErrorMessage(error, 'signup');

      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function requestAuthPasswordReset(email: string) {
    setAuthError(null);
    setAuthNotice(null);
    setIsAuthLoading(true);

    try {
      await requestPasswordResetEmail(email);
      setAuthNotice('Password reset link sent. Check your email.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not send reset link.';

      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  }

  const prepareResetPasswordRoute = useCallback(async () => {
    setIsResetPasswordLoading(true);
    setResetPasswordError(null);
    setResetPasswordNotice(null);

    try {
      await preparePasswordResetSession();
      setIsResetPasswordReady(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not prepare this reset link.';

      setIsResetPasswordReady(false);
      setResetPasswordError(message);
    } finally {
      setIsResetPasswordLoading(false);
    }
  }, []);

  const updatePasswordFromResetRoute = useCallback(async (password: string) => {
    setIsResetPasswordLoading(true);
    setResetPasswordError(null);

    try {
      await updateCurrentUserPassword(password);
      await signOut().catch(() => undefined);
      setResetPasswordNotice('Your password was saved. You can now log in with your new password.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update your password.';

      setResetPasswordError(message);
    } finally {
      setIsResetPasswordLoading(false);
    }
  }, []);

  function returnToLoginFromPasswordReset() {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  async function finishOnboarding(nextPlayer: Player) {
    if (!authUser) {
      setAuthError('Missing authenticated user. Please sign in again.');
      setAuthFlow('auth');
      return;
    }

    try {
      const savedPlayer = await upsertPlayerForUser(authUser, {
        ...nextPlayer,
        id: profilePlayer.id,
      });

      setProfilePlayer(savedPlayer);
      await refreshSocialData(savedPlayer);
      setAuthFlow('app');
      setActiveTab('home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save your profile.';

      Alert.alert('Profile setup failed', message);
    }
  }

  async function uploadOnboardingProfilePhoto(imageUri: string) {
    if (!authUser) {
      throw new Error('Missing authenticated user. Please sign in again.');
    }

    return uploadProfilePhoto(authUser.id, imageUri);
  }

  if (!homeFontsLoaded) {
    return null;
  }

  if (isEmailVerifiedRoute) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <SafeAreaView
            edges={['top', 'left', 'right']}
            style={styles.safeArea}
          >
            <StatusBar style="dark" />
            <EmailVerifiedScreen />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (isPasswordResetRoute) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <SafeAreaView
            edges={['top', 'left', 'right']}
            style={styles.safeArea}
          >
            <StatusBar style="dark" />
            <ResetPasswordScreen
              errorMessage={resetPasswordError}
              isLoading={isResetPasswordLoading}
              isReady={isResetPasswordReady}
              onBackToLogin={returnToLoginFromPasswordReset}
              onPrepareReset={prepareResetPasswordRoute}
              onUpdatePassword={updatePasswordFromResetRoute}
              successMessage={resetPasswordNotice}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (authFlow === 'loading') {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <SafeAreaView
            edges={['top', 'left', 'right']}
            style={styles.safeArea}
          >
            <StatusBar style="dark" />
            <LoadingScreen />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
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
              <AuthScreen
                errorMessage={authError}
                isLoading={isAuthLoading}
                onClearFeedback={clearAuthFeedback}
                onContinue={continueAuth}
                onRequestPasswordReset={requestAuthPasswordReset}
                onResendVerification={resendAuthVerification}
                successMessage={authNotice}
              />
            ) : authFlow === 'onboarding' ? (
              <SignupWizardScreen
                email={authEmail}
                onBack={() => setAuthFlow('auth')}
                onComplete={finishOnboarding}
                onUploadProfilePhoto={uploadOnboardingProfilePhoto}
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
                    currentPlayer={profilePlayer}
                    friendRequests={friendRequests}
                    lobbies={lobbyStore.lobbies}
                    notificationCount={unreadNotificationCount}
                    onBack={closeViewedProfile}
                    onCancelFriendRequest={handleCancelFriendRequest}
                    onInvitePlayer={(playerId) => openInviteComposer({ inviteTargetPlayerId: playerId, source: 'profile' })}
                    onOpenMenu={openSideMenu}
                    onOpenNotifications={openNotifications}
                    onRemoveFriend={handleRemoveFriend}
                    onSendFriendRequest={handleSendFriendRequest}
                    onViewPlayerProfile={openViewedProfile}
                    players={playersForInvite}
                    player={viewedProfilePlayer}
                  />
                </ScrollView>
                <BottomNav activeTab={activeTab} onChange={handleTabChange} />
              </>
            ) : isEditProfileOpen ? (
              <EditProfileScreen
                onBack={closeEditProfile}
                onSave={saveProfile}
                onUploadProfilePhoto={uploadOnboardingProfilePhoto}
                player={profilePlayer}
              />
            ) : isAddFriendsOpen ? (
              <AddFriendsScreen
                currentPlayer={profilePlayer}
                friendRequests={friendRequests}
                lobbies={lobbyStore.lobbies}
                onBack={closeAddFriends}
                onSendFriendRequest={handleSendFriendRequest}
                onViewPlayerProfile={openViewedProfile}
                players={playersForInvite}
              />
            ) : isAboutUsOpen ? (
              <AboutUsScreen onBack={closeAboutUs} />
            ) : isCommunityGuidelinesOpen ? (
              <CommunityGuidelinesScreen onBack={closeCommunityGuidelines} onReportProblem={openReportProblem} />
            ) : isHelpSupportOpen ? (
              <HelpSupportScreen onBack={closeHelpSupport} onReportProblem={openReportProblem} />
            ) : isReportProblemOpen ? (
              <ReportProblemScreen onBack={closeReportProblem} />
            ) : isDeleteAccountOpen ? (
              <DeleteAccountScreen
                errorMessage={deleteAccountError}
                isDeleting={isDeletingAccount}
                onBack={closeDeleteAccount}
                onDeleteAccount={handleDeleteAccount}
              />
            ) : legalScreen === 'privacy' ? (
              <PrivacyPolicyScreen onBack={closeLegalScreen} onReportProblem={openReportProblem} />
            ) : legalScreen === 'terms' ? (
              <TermsOfServiceScreen onBack={closeLegalScreen} onReportProblem={openReportProblem} />
            ) : inviteParams ? (
              <InviteComposerScreen
                currentPlayer={profilePlayer}
                lobbies={lobbyStore.lobbies}
                onBack={closeInviteComposer}
                onCreateGame={openCreateGameFromInvite}
                onInvitesSent={openLobbyDetails}
                onSendInvites={handleSendLobbyInvites}
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
                      players={playersForInvite}
                      ratingTasks={lobbyStore.ratingTasks}
                      tocaPointGain={homeTocaPointGain}
                    />
                  )}
                  {activeTab === 'games' && (
                    selectedLobby ? (
                      isHostManagementOpen ? (
                        <HostLobbyManagementScreen
                          currentPlayer={profilePlayer}
                          isActionPending={Boolean(pendingLobbyActionKey)}
                          lobby={selectedLobby}
                          notificationCount={unreadNotificationCount}
                          onBack={closeHostManagement}
                          onCloseLobby={() => handleCloseLobby(selectedLobby)}
                          onOpenMenu={openSideMenu}
                          onOpenNotifications={openNotifications}
                          onSaveSettings={(draft) => handleUpdateLobbySettings(selectedLobby, draft)}
                        />
                      ) : (
                        <LobbyDetailsScreen
                          currentPlayer={profilePlayer}
                          lobby={selectedLobby}
                          lobbyIndex={selectedLobbyIndex}
                          notificationCount={unreadNotificationCount}
                          allLobbies={lobbyStore.lobbies}
                          hasPrivateAccess={lobbyStore.hasPrivateAccess(selectedLobby.id)}
                          isActionPending={Boolean(pendingLobbyActionKey)}
                          onBack={() => {
                            setIsLobbyChatOpen(false);
                            setIsHostManagementOpen(false);
                            setSelectedLobbyId(null);
                          }}
                          onEnterPrivatePin={(pin) => handleEnterPrivatePin(selectedLobby, pin)}
                          onCancelJoinRequest={() => handleCancelJoinRequest(selectedLobby)}
                          onInvite={() =>
                            openInviteComposer({
                              inviteTargetLobbyId: selectedLobby.id,
                              source: 'lobby',
                            })
                          }
                          onJoinGame={() => handleJoinGame(selectedLobby)}
                          onJoinWaitlist={() => handleJoinWaitlist(selectedLobby)}
                          onKickPlayer={(playerId) => handleKickLobbyParticipant(selectedLobby, playerId)}
                          onLeaveLobby={() => handleLeaveLobby(selectedLobby)}
                          onMovePlayerToWaitlist={(playerId) => handleMoveLobbyParticipantToWaitlist(selectedLobby, playerId)}
                          onOpenHostManagement={openHostManagement}
                          onOpenMenu={openSideMenu}
                          onOpenNotifications={openNotifications}
                          onRemoveFriend={handleRemoveFriend}
                          onApproveWaitlistRequest={(playerId) => handleApproveWaitlistRequest(selectedLobby, playerId)}
                          onRequestWaitlistApproval={() => handleRequestWaitlistApproval(selectedLobby)}
                          onRejectWaitlistRequest={(playerId) => handleRejectJoinRequest(selectedLobby, playerId)}
                          onSendFriendRequest={handleSendFriendRequest}
                          onSubmitPlayerRating={async ({ behaviorRating, rank, skillVoteType, targetPlayerId }) => {
                            const result = await lobbyStore.submitPlayerRating(selectedLobby, targetPlayerId, { behaviorRating, rank, skillVoteType });

                            if (result.success) {
                              void refreshCurrentPlayer().catch((error) => {
                                console.warn('Could not refresh player after rating.', error);
                              });
                            } else if (result.messages.length > 0) {
                              Alert.alert('Rating not saved', result.messages.join('\n'));
                            }

                            return result.success;
                          }}
                          onTransferHost={(playerId) => handleTransferLobbyHost(selectedLobby, playerId)}
                          onViewPlayerProfile={openViewedProfile}
                          players={playersForInvite}
                          ratingTasks={lobbyStore.ratingTasks}
                        />
                      )
                    ) : (
                      <GamesScreen
                        currentPlayer={profilePlayer}
                        hasPrivateAccess={lobbyStore.hasPrivateAccess}
                        initialSection={gamesInitialSection}
                        lobbies={filteredLobbies}
                        notificationCount={unreadNotificationCount}
                        onBack={() => setActiveTab('home')}
                        onOpenMenu={openSideMenu}
                        onOpenNotifications={openNotifications}
                        onOpenLobby={openLobbyDetails}
                        onSectionChange={setGamesInitialSection}
                        players={playersForInvite}
                        ratingTasks={lobbyStore.ratingTasks}
                        selectedFilter={selectedFilter}
                        setSelectedFilter={setSelectedFilter}
                      />
                    )
                  )}
                  {activeTab === 'create' && (
                    <CreateLobbyScreen
                      isCreating={isCreatingLobby}
                      notificationCount={unreadNotificationCount}
                      onCancel={() => setActiveTab('home')}
                      onCreateLobby={handleCreateLobby}
                      onOpenMenu={openSideMenu}
                      onOpenNotifications={openNotifications}
                      player={profilePlayer}
                    />
                  )}
                  {activeTab === 'community' && (
                    <CommunityScreen
                      currentPlayer={profilePlayer}
                      friendRequests={friendRequests}
                      initialFriendView={communityInitialFriendView}
                      lobbies={lobbyStore.lobbies}
                      notificationCount={unreadNotificationCount}
                      onAddFriend={openAddFriends}
                      onAcceptFriendRequest={handleAcceptFriendRequest}
                      onCancelFriendRequest={handleCancelFriendRequest}
                      onDeclineFriendRequest={handleDeclineFriendRequest}
                      onInvitePlayer={(playerId, source) => openInviteComposer({ inviteTargetPlayerId: playerId, source })}
                      onOpenMenu={openSideMenu}
                      onOpenNotifications={openNotifications}
                      onRemoveFriend={handleRemoveFriend}
                      onSendFriendRequest={handleSendFriendRequest}
                      onViewPlayerProfile={openViewedProfile}
                      players={playersForInvite}
                      ratingTasks={lobbyStore.ratingTasks}
                    />
                  )}
                  {activeTab === 'profile' && (
                    <ProfileScreen
                      currentPlayer={profilePlayer}
                      friendRequests={friendRequests}
                      lobbies={lobbyStore.lobbies}
                      notificationCount={unreadNotificationCount}
                      onEditProfile={openEditProfile}
                      onInvitePlayer={(playerId) => openInviteComposer({ inviteTargetPlayerId: playerId, source: 'profile' })}
                      onCancelFriendRequest={handleCancelFriendRequest}
                      onOpenMenu={openSideMenu}
                      onOpenNotifications={openNotifications}
                      onRemoveFriend={handleRemoveFriend}
                      onSendFriendRequest={handleSendFriendRequest}
                      onViewPlayerProfile={openViewedProfile}
                      players={playersForInvite}
                      player={profilePlayer}
                    />
                  )}
                </ScrollView>
                <BottomNav activeTab={activeTab} onChange={handleTabChange} />
                {activeTab === 'games' && selectedLobby && visibleSelectedLobby && !isHostManagementOpen && !hasLobbyStarted(selectedLobby.startsAt) ? (
                  <>
                    <LobbyFloatingChatButton lobby={visibleSelectedLobby} onPress={() => openLobbyChat(selectedLobby)} />
                    <LobbyChatSheet
                      currentPlayer={profilePlayer}
                      lobby={visibleSelectedLobby}
                      messages={lobbyStore.getVisibleLobbyMessages(selectedLobby)}
                      onClose={closeLobbyChat}
                      onSendMessage={(channelId, body) => sendLobbyChatMessage(selectedLobby, channelId, body)}
                      players={playersForInvite}
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
              onDeleteAccount={openDeleteAccount}
              onEditProfile={openEditProfile}
              onHelpSupport={openHelpSupport}
              onInviteFriends={openAddFriends}
              onLogOut={handleLogOut}
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
              lobbies={lobbyStore.lobbies}
              notifications={lobbyStore.notifications}
              onClose={closeNotifications}
              onNotificationPress={handleNotificationPress}
              visible={isNotificationsOpen}
            />
            <PlayerProfilePreview
              context={previewProfilePlayer ? `${previewProfilePlayer.area} regular` : undefined}
              initials={previewProfilePlayer?.initials ?? ''}
              level={previewProfilePlayer?.level}
              meta={previewProfilePlayer ? `${previewProfilePlayer.tocaPoints} TOCA points` : undefined}
              name={previewProfilePlayer?.name ?? ''}
              onClose={() => setPreviewProfilePlayer(null)}
              player={previewProfilePlayer ?? undefined}
              primaryAction={
                previewProfilePlayer
                  ? {
                      label: 'View full profile',
                      onPress: () => {
                        const player = previewProfilePlayer;

                        setPreviewProfilePlayer(null);
                        openViewedProfile(player);
                      },
                    }
                  : undefined
              }
              profileDetails={previewProfilePlayer ? getPlayerPreviewPlayingDetails(previewProfilePlayer) : undefined}
              rating={previewProfilePlayer ? getPlayerDisplayRating(previewProfilePlayer, profilePlayer.id) : undefined}
              trustCues={previewProfilePlayer ? getPlayerPreviewTrustCues(previewProfilePlayer, lobbyStore.lobbies) : undefined}
              visible={Boolean(previewProfilePlayer)}
            />
            <SimpleConfirmationModal
              body={confirmationModal?.body ?? ''}
              onClose={() => setConfirmationModal(null)}
              title={confirmationModal?.title ?? ''}
              visible={Boolean(confirmationModal)}
            />
            <ActionConfirmationModal
              body={`Remove ${playersForInvite.find((player) => player.id === pendingFriendRemovalId)?.name ?? 'this player'} from your friends list?`}
              confirmLabel="Remove"
              onCancel={() => setPendingFriendRemovalId(null)}
              onConfirm={confirmRemoveFriend}
              title="Remove friend?"
              visible={Boolean(pendingFriendRemovalId)}
            />
            <LevelUpModal
              fromLevel={levelUpModal?.fromLevel ?? 1}
              onClose={() => setLevelUpModal(null)}
              toLevel={levelUpModal?.toLevel ?? 1}
              visible={Boolean(levelUpModal)}
            />
              </>
            ) : null}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function isEmailVerifiedPath() {
  return typeof window !== 'undefined' && window.location.pathname === '/email-verified';
}

function isPasswordResetPath() {
  return typeof window !== 'undefined' && window.location.pathname === '/reset-password';
}

function getAuthErrorMessage(error: unknown, mode: 'login' | 'signup') {
  const message = error instanceof Error ? error.message : 'Could not continue. Please try again.';
  const normalizedMessage = message.toLowerCase();

  if (mode === 'login' && normalizedMessage.includes('invalid login credentials')) {
    return 'Email or password is incorrect.';
  }

  if (mode === 'login' && normalizedMessage.includes('email not confirmed')) {
    return 'Please verify your email before logging in.';
  }

  if (
    mode === 'signup' &&
    (normalizedMessage.includes('already has an account') ||
      normalizedMessage.includes('already registered') ||
      normalizedMessage.includes('already exists') ||
      normalizedMessage.includes('user already registered'))
  ) {
    return 'This email already has an account. Please log in.';
  }

  return message;
}

function getOnboardingFallbackPlayer(user: User): Player {
  const emailName = user.email?.split('@')[0] ?? 'Player';
  const name = emailName
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Player';

  return {
    ...mockCurrentPlayer,
    area: '',
    friendIds: [],
    gamesPlayed: 0,
    id: user.id,
    initials: name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'PL',
    name,
    rankStatus: 'self_declared',
    tocaPoints: 0,
  };
}

function SimpleConfirmationModal({
  body,
  onClose,
  title,
  visible,
}: {
  body: string;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.confirmationRoot}>
        <Pressable accessibilityLabel="Close confirmation" accessibilityRole="button" onPress={onClose} style={styles.confirmationBackdrop} />
        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <AppText align="center" tone="accent" variant="titleSmall" weight="900">
              Sent
            </AppText>
          </View>
          <AppText align="center" variant="cardTitle" weight="900">
            {title}
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall" weight="700">
            {body}
          </AppText>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.confirmationButton}>
            <AppText align="center" tone="inverse" variant="button" weight="900">
              Close
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingRoot}>
      <View style={styles.loadingMark}>
        <AppText align="center" tone="accent" variant="titleSmall" weight="900">
          TOCA
        </AppText>
      </View>
      <View style={styles.loadingCopy}>
        <AppText align="center" variant="cardTitle" weight="900">
          Loading TOCA
        </AppText>
        <AppText align="center" tone="muted" variant="bodySmall" weight="700">
          Getting your games ready...
        </AppText>
      </View>
    </View>
  );
}

function LevelUpModal({
  fromLevel,
  onClose,
  toLevel,
  visible,
}: {
  fromLevel: number;
  onClose: () => void;
  toLevel: number;
  visible: boolean;
}) {
  const bubbleAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;
  const confettiFallAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      bubbleAnimation.setValue(0);
      confettiAnimation.setValue(0);
      confettiFallAnimation.setValue(0);
      return undefined;
    }

    bubbleAnimation.setValue(0);
    confettiAnimation.setValue(0);
    confettiFallAnimation.setValue(0);

    Animated.spring(bubbleAnimation, {
      friction: 7,
      tension: 90,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    const confettiLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(confettiAnimation, {
          duration: 1450,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnimation, {
          duration: 0,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const fallLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(confettiFallAnimation, {
          duration: 2100,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(confettiFallAnimation, {
          duration: 0,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    confettiLoop.start();
    fallLoop.start();

    return () => {
      confettiLoop.stop();
      fallLoop.stop();
    };
  }, [bubbleAnimation, confettiAnimation, confettiFallAnimation, visible]);

  const bubbleScale = bubbleAnimation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.72, 1.06, 1],
  });

  const bubbleOpacity = bubbleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const pulseScale = bubbleAnimation.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0.3, 1.28, 1.55],
  });
  const pulseOpacity = bubbleAnimation.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0.38, 0],
  });

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.confirmationRoot}>
        <Pressable accessibilityLabel="Close level up" accessibilityRole="button" onPress={onClose} style={styles.confirmationBackdrop} />
        <View pointerEvents="box-none" style={styles.levelUpStage}>
          <View pointerEvents="none" style={styles.levelUpConfettiLayer}>
            {LEVEL_UP_BURST_CONFETTI.map((piece, index) => {
              const delay = Math.max((index / LEVEL_UP_BURST_CONFETTI.length) * 0.38, 0.01);
              const progress = confettiAnimation.interpolate({
                inputRange: [0, delay, Math.min(delay + 0.4, 0.95), 1],
                outputRange: [0, 0, 1, 0],
              });
              const translateX = confettiAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [piece.x * 0.18, piece.x],
              });
              const translateY = confettiAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [piece.y * 0.18, piece.y],
              });

              return (
                <Animated.View
                  key={`burst-${piece.x}-${piece.y}`}
                  style={[
                    styles.levelUpConfettiPiece,
                    {
                      backgroundColor: piece.color,
                      height: piece.height,
                      opacity: progress,
                      transform: [
                        { translateX },
                        { translateY },
                        { rotate: piece.rotate },
                      ],
                      width: piece.width,
                    },
                  ]}
                />
              );
            })}
            {LEVEL_UP_FALL_CONFETTI.map((piece, index) => {
              const delay = Math.max((index / LEVEL_UP_FALL_CONFETTI.length) * 0.32, 0.01);
              const opacity = confettiFallAnimation.interpolate({
                inputRange: [0, delay, Math.min(delay + 0.24, 0.72), 1],
                outputRange: [0, 0, 1, 0],
              });
              const translateX = confettiFallAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [piece.x, piece.x + piece.drift],
              });
              const translateY = confettiFallAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-430, 430],
              });

              return (
                <Animated.View
                  key={`fall-${piece.x}`}
                  style={[
                    styles.levelUpConfettiPiece,
                    {
                      backgroundColor: piece.color,
                      height: piece.height,
                      opacity,
                      transform: [
                        { translateX },
                        { translateY },
                        { rotate: piece.rotate },
                      ],
                      width: piece.width,
                    },
                  ]}
                />
              );
            })}
          </View>
          <Animated.View
            style={[
              styles.levelUpCard,
              {
                opacity: bubbleOpacity,
                transform: [{ scale: bubbleScale }],
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.levelUpPulse,
                {
                  opacity: pulseOpacity,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <View style={styles.levelUpGlow}>
              <View style={styles.levelUpIcon}>
                <AppText align="center" tone="primary" variant="titleSmall" weight="900">
                  UP
                </AppText>
              </View>
            </View>
            <AppText align="center" style={styles.levelUpTitle} variant="cardTitle" weight="900">
              Congratulations!
            </AppText>
            <AppText align="center" tone="muted" variant="bodySmall" weight="700">
              TOCA level up
            </AppText>
            <AppText align="center" tone="primary" variant="bodySmall" weight="900">
              Level {fromLevel} -&gt; Level {toLevel}
            </AppText>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.confirmationButton}>
              <AppText align="center" tone="inverse" variant="button" weight="900">
                Close
              </AppText>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

function ActionConfirmationModal({
  body,
  confirmLabel,
  onCancel,
  onConfirm,
  title,
  visible,
}: {
  body: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.confirmationRoot}>
        <Pressable accessibilityLabel="Cancel action" accessibilityRole="button" onPress={onCancel} style={styles.confirmationBackdrop} />
        <View style={styles.confirmationCard}>
          <View style={styles.confirmationIcon}>
            <AppText align="center" tone="danger" variant="titleSmall" weight="900">
              !
            </AppText>
          </View>
          <AppText align="center" variant="cardTitle" weight="900">
            {title}
          </AppText>
          <AppText align="center" tone="muted" variant="bodySmall" weight="700">
            {body}
          </AppText>
          <View style={styles.confirmationActionRow}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.confirmationSecondaryButton}>
              <AppText align="center" tone="accent" variant="button" weight="900">
                Cancel
              </AppText>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.confirmationDangerButton}>
              <AppText align="center" tone="inverse" variant="button" weight="900">
                {confirmLabel}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function upsertFriendRequest(requests: FriendRequest[], request: FriendRequest) {
  return requests.some((candidate) => candidate.id === request.id)
    ? requests.map((candidate) => (candidate.id === request.id ? request : candidate))
    : [request, ...requests];
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
  confirmationBackdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  confirmationButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmationActionRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmationCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 360,
    padding: spacing.xl,
    ...shadows.hero,
  },
  confirmationIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: spacing.md,
  },
  levelUpIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentGold,
    borderColor: 'rgba(239, 165, 26, 0.42)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  levelUpCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: 'rgba(246, 201, 69, 0.72)',
    borderRadius: 34,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 350,
    overflow: 'visible',
    padding: spacing.xl,
    position: 'relative',
    shadowColor: colors.accentGoldDark,
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 38,
  },
  levelUpConfettiLayer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  levelUpConfettiPiece: {
    borderRadius: 4,
    position: 'absolute',
  },
  levelUpGlow: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 201, 69, 0.2)',
    borderColor: 'rgba(246, 201, 69, 0.32)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  levelUpPulse: {
    backgroundColor: 'rgba(246, 201, 69, 0.28)',
    borderColor: 'rgba(246, 201, 69, 0.38)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 150,
    position: 'absolute',
    top: 16,
    width: 150,
  },
  levelUpStage: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: spacing.xl2,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  levelUpTitle: {
    letterSpacing: 0,
  },
  confirmationDangerButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmationRoot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl2,
  },
  confirmationSecondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  content: {
    paddingBottom: 170,
    paddingHorizontal: spacing.lg,
  },
  contentFlush: {
    paddingHorizontal: 0,
  },
  loadingCopy: {
    gap: spacing.xs,
  },
  loadingMark: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    width: 74,
    ...shadows.soft,
  },
  loadingRoot: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl2,
  },
});
