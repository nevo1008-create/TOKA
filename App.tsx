import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { NotificationPanel } from './src/components/NotificationPanel';
import { SideMenuDrawer } from './src/components/SideMenuDrawer';
import { currentPlayer as mockCurrentPlayer, players as mockPlayers } from './src/data/mock';
import { getCurrentSession, signInOrSignUpWithEmail } from './src/features/auth/authRepository';
import { getPlayerByAuthUserId, listPlayers, upsertPlayerForUser } from './src/features/auth/playerRepository';
import type { CreateLobbyDraft } from './src/features/lobbies/lobbyCreateTypes';
import { useLobbyStore } from './src/features/lobbies/useLobbyStore';
import { AddFriendsScreen } from './src/screens/AddFriendsScreen';
import { AboutUsScreen } from './src/screens/AboutUsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { CommunityGuidelinesScreen } from './src/screens/CommunityGuidelinesScreen';
import { CreateLobbyScreen } from './src/screens/CreateLobbyScreen';
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
  const [authEmail, setAuthEmail] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [profilePlayer, setProfilePlayer] = useState<Player>(mockCurrentPlayer);
  const [playersForInvite, setPlayersForInvite] = useState<Player[]>(mockPlayers);
  const lobbyStore = useLobbyStore(profilePlayer, playersForInvite);
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

  function showLobbyActionMessages(messages: string[]) {
    if (messages.length === 0) {
      return;
    }

    Alert.alert('Game update', messages.join('\n'));
  }

  async function handleJoinGame(lobby: Lobby) {
    try {
      const result = await lobbyStore.joinGame(lobby);
      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  function handleJoinWaitlist(lobby: Lobby) {
    const moveToWaitlist = async () => {
      try {
        const result = await lobbyStore.joinWaitlist(lobby);
        showLobbyActionMessages(result.messages);
      } catch (error) {
        showActionError(error);
      }
    };

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
      const result = await lobbyStore.requestWaitlistApproval(lobby);
      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleApproveWaitlistRequest(lobby: Lobby, playerId: string) {
    try {
      const result = await lobbyStore.approveWaitlistRequest(lobby, playerId);
      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleRejectJoinRequest(lobby: Lobby, playerId: string) {
    try {
      const result = await lobbyStore.rejectJoinRequest(lobby, playerId);
      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleCancelJoinRequest(lobby: Lobby) {
    try {
      const result = await lobbyStore.cancelJoinRequest(lobby);
      showLobbyActionMessages(result.messages);
    } catch (error) {
      showActionError(error);
    }
  }

  async function handleLeaveLobby(lobby: Lobby) {
    let result;

    try {
      result = await lobbyStore.leaveLobby(lobby);
    } catch (error) {
      showActionError(error);
      return;
    }

    if (!result.success) {
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
    try {
      const nextLobby = await lobbyStore.createLobby(draft);

      setSelectedLobbyId(nextLobby.id);
      setIsLobbyChatOpen(false);
      setActiveTab('games');
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

  async function continueAuth(credentials: { email: string; password: string }) {
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      const result = await signInOrSignUpWithEmail(credentials.email, credentials.password);

      if (result.needsEmailConfirmation || !result.session?.user) {
        Alert.alert('Check your email', 'Supabase requires email confirmation before you can enter TOCA.');
        return;
      }

      await continueWithAuthenticatedUser(result.session.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign in. Please try again.';

      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
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

  if (!homeFontsLoaded) {
    return null;
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
                onContinue={continueAuth}
              />
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
                    />
                  )}
                  {activeTab === 'games' && (
                    selectedLobby ? (
                      <LobbyDetailsScreen
                        currentPlayer={profilePlayer}
                        lobby={selectedLobby}
                        lobbyIndex={selectedLobbyIndex}
                        notificationCount={unreadNotificationCount}
                        allLobbies={lobbyStore.lobbies}
                        hasPrivateAccess={lobbyStore.hasPrivateAccess(selectedLobby.id)}
                        onBack={() => {
                          setIsLobbyChatOpen(false);
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
                        onLeaveLobby={() => handleLeaveLobby(selectedLobby)}
                        onOpenMenu={openSideMenu}
                        onOpenNotifications={openNotifications}
                        onApproveWaitlistRequest={(playerId) => handleApproveWaitlistRequest(selectedLobby, playerId)}
                        onRequestWaitlistApproval={() => handleRequestWaitlistApproval(selectedLobby)}
                        onRejectWaitlistRequest={(playerId) => handleRejectJoinRequest(selectedLobby, playerId)}
                        onViewPlayerProfile={openViewedProfile}
                        players={playersForInvite}
                      />
                    ) : (
                      <GamesScreen
                        currentPlayer={profilePlayer}
                        initialSection={gamesInitialSection}
                        lobbies={filteredLobbies}
                        notificationCount={unreadNotificationCount}
                        onBack={() => setActiveTab('home')}
                        onOpenMenu={openSideMenu}
                        onOpenNotifications={openNotifications}
                        onOpenLobby={openLobbyDetails}
                        players={playersForInvite}
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
                {activeTab === 'games' && selectedLobby && visibleSelectedLobby && selectedLobby.status !== 'rating_open' ? (
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
