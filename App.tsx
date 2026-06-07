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
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { NotificationPanel } from './src/components/NotificationPanel';
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
import type { CreateLobbyDraft, LobbySettingsDraft } from './src/features/lobbies/lobbyCreateTypes';
import { hasLobbyStarted } from './src/features/lobbies/lobbyDateTime';
import { useLobbyStore } from './src/features/lobbies/useLobbyStore';
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
import { colors, spacing } from './src/theme';
import type { Lobby, Notification, Player } from './src/types';

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
  const lobbyStore = useLobbyStore(profilePlayer, playersForInvite, { enabled: authFlow === 'app' });
  const [viewedProfilePlayer, setViewedProfilePlayer] = useState<Player | null>(null);
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
  const [isHostManagementOpen, setIsHostManagementOpen] = useState(false);
  const [pendingLobbyActionKey, setPendingLobbyActionKey] = useState<string | null>(null);
  const pendingLobbyActionRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const unreadNotifications = lobbyStore.unreadNotifications;
  const unreadNotificationCount = lobbyStore.unreadNotificationCount;
  const selectedLobby = selectedLobbyId ? lobbyStore.getLobbyById(selectedLobbyId) : null;
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
      return undefined;
    }

    const intervalId = setInterval(() => {
      void lobbyStore.refreshLobbyData();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [authFlow, lobbyStore.refreshLobbyData]);

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

  async function continueWithAuthenticatedUser(user: User) {
    setAuthUser(user);
    setAuthEmail(user.email ?? '');

    const existingPlayer = await getPlayerByAuthUserId(user.id);

    if (existingPlayer) {
      setProfilePlayer(existingPlayer);
      await refreshPlayersDirectory(existingPlayer);
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
      await refreshPlayersDirectory(savedPlayer);
      setIsEditProfileOpen(false);
      setActiveTab('profile');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save profile changes.';

      Alert.alert('Profile update failed', message);
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
    setGamesInitialSection('Find Games');
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

      setSelectedLobbyId(nextLobby.id);
      setIsLobbyChatOpen(false);
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
    void lobbyStore.markAllNotificationsRead().catch(showActionError);
  }

  function handleNotificationPress(notification: Notification) {
    void lobbyStore.markNotificationRead(notification.id).catch(showActionError);
    setIsNotificationsOpen(false);

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
      await refreshPlayersDirectory(savedPlayer);
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
                      ratingTasks={lobbyStore.ratingTasks}
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
                          onApproveWaitlistRequest={(playerId) => handleApproveWaitlistRequest(selectedLobby, playerId)}
                          onRequestWaitlistApproval={() => handleRequestWaitlistApproval(selectedLobby)}
                          onRejectWaitlistRequest={(playerId) => handleRejectJoinRequest(selectedLobby, playerId)}
                          onSubmitPlayerRating={async ({ behaviorRating, rank, targetPlayerId }) => {
                            const result = await lobbyStore.submitPlayerRating(selectedLobby, targetPlayerId, { behaviorRating, rank });

                            return result.success;
                          }}
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
