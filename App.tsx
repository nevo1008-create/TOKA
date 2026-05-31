import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { SideMenuDrawer } from './src/components/SideMenuDrawer';
import { currentPlayer, lobbies, notifications, players as playersForInvite } from './src/data/mock';
import { AddFriendsScreen } from './src/screens/AddFriendsScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { CreateLobbyScreen } from './src/screens/CreateLobbyScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { HelpSupportScreen } from './src/screens/HelpSupportScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InviteComposerScreen, type InviteComposerParams } from './src/screens/InviteComposerScreen';
import { LobbyDetailsScreen, LobbyFloatingChatButton } from './src/screens/LobbyDetailsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ReportProblemScreen } from './src/screens/ReportProblemScreen';
import { colors, spacing } from './src/theme';
import type { Lobby, Player } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [profilePlayer, setProfilePlayer] = useState<Player>(currentPlayer);
  const [viewedProfilePlayer, setViewedProfilePlayer] = useState<Player | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false);
  const [isHelpSupportOpen, setIsHelpSupportOpen] = useState(false);
  const [isReportProblemOpen, setIsReportProblemOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [gamesInitialSection, setGamesInitialSection] = useState<'Find Games' | 'My Games'>('Find Games');
  const [selectedFilter, setSelectedFilter] = useState('All Games');
  const [inviteParams, setInviteParams] = useState<InviteComposerParams | null>(null);
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const selectedLobbyIndex = selectedLobby
    ? Math.max(
        lobbies.findIndex((lobby) => lobby.id === selectedLobby.id),
        0,
      )
    : 0;

  const filteredLobbies = useMemo(() => {
    if (selectedFilter === 'Has spots') {
      return lobbies.filter(
        (lobby) =>
          lobby.participants.filter((participant) => participant.role !== 'waitlist').length <
          lobby.maxPlayers,
      );
    }

    if (selectedFilter === 'Requests') {
      return lobbies.filter((lobby) => lobby.joinRequests.length > 0);
    }

    return lobbies;
  }, [selectedFilter]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [
    activeTab,
    inviteParams,
    isAddFriendsOpen,
    isEditProfileOpen,
    isHelpSupportOpen,
    isReportProblemOpen,
    isSideMenuOpen,
    selectedLobby?.id,
    viewedProfilePlayer?.id,
  ]);

  function handleTabChange(tab: Tab) {
    setIsSideMenuOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setActiveTab(tab);
  }

  function openGamesSearch() {
    setIsSideMenuOpen(false);
    setGamesInitialSection('Find Games');
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setActiveTab('games');
  }

  function openCreateGame() {
    setIsSideMenuOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setActiveTab('create');
  }

  function openCommunityFriends() {
    setIsSideMenuOpen(false);
    setInviteParams({
      source: 'community',
    });
  }

  function openAddFriends() {
    setIsSideMenuOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setInviteParams(null);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setIsAddFriendsOpen(true);
  }

  function openInviteComposer(params: InviteComposerParams) {
    setIsSideMenuOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(params);
  }

  function closeInviteComposer() {
    setInviteParams(null);
  }

  function closeAddFriends() {
    setIsAddFriendsOpen(false);
  }

  function openViewedProfile(player: Player) {
    setIsSideMenuOpen(false);
    setInviteParams(null);
    setIsAddFriendsOpen(false);
    setIsEditProfileOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setSelectedLobby(null);
    setViewedProfilePlayer(player);
  }

  function closeViewedProfile() {
    setViewedProfilePlayer(null);
  }

  function openEditProfile() {
    setIsSideMenuOpen(false);
    setInviteParams(null);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setSelectedLobby(null);
    setIsEditProfileOpen(true);
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
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setActiveTab('create');
  }

  function openLobbyDetails(lobby: Lobby) {
    setIsSideMenuOpen(false);
    setGamesInitialSection('Find Games');
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(lobby);
    setActiveTab('games');
  }

  function openSideMenu() {
    setIsSideMenuOpen(true);
  }

  function closeSideMenu() {
    setIsSideMenuOpen(false);
  }

  function openProfileFromMenu() {
    setIsSideMenuOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setActiveTab('profile');
  }

  function openMyGamesFromMenu() {
    setIsSideMenuOpen(false);
    setGamesInitialSection('My Games');
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setActiveTab('games');
  }

  function openReportProblem() {
    setIsSideMenuOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsHelpSupportOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setIsReportProblemOpen(true);
  }

  function closeReportProblem() {
    setIsReportProblemOpen(false);
  }

  function openHelpSupport() {
    setIsSideMenuOpen(false);
    setViewedProfilePlayer(null);
    setIsEditProfileOpen(false);
    setIsAddFriendsOpen(false);
    setIsReportProblemOpen(false);
    setInviteParams(null);
    setSelectedLobby(null);
    setIsHelpSupportOpen(true);
  }

  function closeHelpSupport() {
    setIsHelpSupportOpen(false);
  }

  function showDrawerPlaceholder(_action: string, label: string) {
    setIsSideMenuOpen(false);
    Alert.alert(label, `${label} will be connected in a later pass.`);
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
            {viewedProfilePlayer ? (
              <>
                <ScrollView
                  ref={scrollRef}
                  contentContainerStyle={[styles.content, styles.contentFlush]}
                  showsVerticalScrollIndicator={false}
                >
                  <ProfileScreen
                    onBack={closeViewedProfile}
                    onInvitePlayer={(playerId) => openInviteComposer({ inviteTargetPlayerId: playerId, source: 'profile' })}
                    onOpenMenu={openSideMenu}
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
            ) : isHelpSupportOpen ? (
              <HelpSupportScreen onBack={closeHelpSupport} onReportProblem={openReportProblem} />
            ) : isReportProblemOpen ? (
              <ReportProblemScreen onBack={closeReportProblem} />
            ) : inviteParams ? (
              <InviteComposerScreen
                lobbies={lobbies}
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
                    />
                  )}
                  {activeTab === 'games' && (
                    selectedLobby ? (
                      <LobbyDetailsScreen
                        lobby={selectedLobby}
                        lobbyIndex={selectedLobbyIndex}
                        onBack={() => setSelectedLobby(null)}
                        onInvite={() =>
                          openInviteComposer({
                            inviteTargetLobbyId: selectedLobby.id,
                            source: 'lobby',
                          })
                        }
                        onOpenMenu={openSideMenu}
                        onViewPlayerProfile={openViewedProfile}
                      />
                    ) : (
                      <GamesScreen
                        initialSection={gamesInitialSection}
                        lobbies={filteredLobbies}
                        onBack={() => setActiveTab('home')}
                        onOpenMenu={openSideMenu}
                        onOpenLobby={setSelectedLobby}
                        selectedFilter={selectedFilter}
                        setSelectedFilter={setSelectedFilter}
                      />
                    )
                  )}
                  {activeTab === 'create' && <CreateLobbyScreen onCancel={() => setActiveTab('home')} onOpenMenu={openSideMenu} />}
                  {activeTab === 'community' && (
                    <CommunityScreen
                      onAddFriend={openAddFriends}
                      onInvitePlayer={(playerId, source) => openInviteComposer({ inviteTargetPlayerId: playerId, source })}
                      onOpenMenu={openSideMenu}
                      onViewPlayerProfile={openViewedProfile}
                    />
                  )}
                  {activeTab === 'profile' && (
                    <ProfileScreen
                      onEditProfile={openEditProfile}
                      onInvitePlayer={(playerId) => openInviteComposer({ inviteTargetPlayerId: playerId, source: 'profile' })}
                      onOpenMenu={openSideMenu}
                      onViewPlayerProfile={openViewedProfile}
                      player={profilePlayer}
                    />
                  )}
                </ScrollView>
                <BottomNav activeTab={activeTab} onChange={handleTabChange} />
                {activeTab === 'games' && selectedLobby && selectedLobby.status !== 'rating_open' ? (
                  <LobbyFloatingChatButton lobby={selectedLobby} />
                ) : null}
              </>
            )}
            <SideMenuDrawer
              onClose={closeSideMenu}
              onEditProfile={openEditProfile}
              onHelpSupport={openHelpSupport}
              onInviteFriends={openAddFriends}
              onMyGames={openMyGamesFromMenu}
              onPlaceholderAction={showDrawerPlaceholder}
              onReportProblem={openReportProblem}
              onViewProfile={openProfileFromMenu}
              player={profilePlayer}
              visible={isSideMenuOpen}
            />
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
    paddingBottom: 136,
    paddingHorizontal: spacing.lg,
  },
  contentFlush: {
    paddingHorizontal: 0,
  },
});
