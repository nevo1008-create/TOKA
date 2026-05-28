import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { currentPlayer, lobbies, notifications } from './src/data/mock';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { CreateLobbyScreen } from './src/screens/CreateLobbyScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LobbyDetailsScreen } from './src/screens/LobbyDetailsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { colors, radius, spacing } from './src/theme';
import type { Lobby } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedFilter, setSelectedFilter] = useState('All Games');
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const isHomeTab = activeTab === 'home';
  const isGamesTab = activeTab === 'games';
  const isCreateTab = activeTab === 'create';
  const isCommunityTab = activeTab === 'community';
  const isProfileTab = activeTab === 'profile';
  const isDarkScreen =
    activeTab === 'home' ||
    activeTab === 'games' ||
    activeTab === 'create' ||
    activeTab === 'community' ||
    activeTab === 'profile';
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
  }, [activeTab, selectedLobby?.id]);

  function handleTabChange(tab: Tab) {
    setSelectedLobby(null);
    setActiveTab(tab);
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        isGamesTab && styles.safeAreaDark,
        isCreateTab && styles.safeAreaDark,
        isHomeTab && styles.safeAreaPremium,
        isCommunityTab && styles.safeAreaDark,
        isProfileTab && styles.safeAreaDark,
      ]}
    >
      <StatusBar style={isDarkScreen ? 'light' : 'dark'} />
      <View
        style={[
          styles.appShell,
          isGamesTab && styles.appShellDark,
          isCreateTab && styles.appShellDark,
          isHomeTab && styles.appShellPremium,
          isCommunityTab && styles.appShellDark,
          isProfileTab && styles.appShellDark,
        ]}
      >
        {!isDarkScreen ? <Header unreadCount={unreadNotifications.length} /> : null}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, isDarkScreen && styles.contentFlush]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'home' && (
            <HomeScreen
              currentPlayer={currentPlayer}
              lobbies={filteredLobbies}
              notifications={unreadNotifications}
              onOpenGames={() => setActiveTab('games')}
              onOpenLobby={(lobby) => {
                setSelectedLobby(lobby);
                setActiveTab('games');
              }}
            />
          )}
          {activeTab === 'games' && (
            selectedLobby ? (
              <LobbyDetailsScreen
                lobby={selectedLobby}
                lobbyIndex={selectedLobbyIndex}
                onBack={() => setSelectedLobby(null)}
              />
            ) : (
              <GamesScreen
                lobbies={filteredLobbies}
                onBack={() => setActiveTab('home')}
                onOpenLobby={setSelectedLobby}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
              />
            )
          )}
          {activeTab === 'create' && <CreateLobbyScreen onCancel={() => setActiveTab('home')} />}
          {activeTab === 'community' && <CommunityScreen />}
          {activeTab === 'profile' && <ProfileScreen player={currentPlayer} />}
        </ScrollView>
        <BottomNav activeTab={activeTab} isDark={isDarkScreen} onChange={handleTabChange} />
      </View>
    </SafeAreaView>
  );
}

function Header({ unreadCount }: { unreadCount: number }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandMark}>
        <Text style={styles.brandBall}>T</Text>
      </View>
      <View style={styles.headerCopy}>
        <Text style={styles.brand}>TOCA</Text>
        <Text style={styles.subtleText}>Footvolley games by level, place, and trust</Text>
      </View>
      <View style={styles.notificationBadge}>
        <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeAreaDark: {
    backgroundColor: colors.darkBackground,
  },
  safeAreaPremium: {
    backgroundColor: colors.darkBackground,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShellDark: {
    backgroundColor: colors.darkBackground,
  },
  appShellPremium: {
    backgroundColor: colors.darkBackground,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandBall: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  headerCopy: {
    flex: 1,
  },
  brand: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtleText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  notificationBadgeText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  content: {
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
  },
  contentFlush: {
    paddingHorizontal: 0,
  },
});
