import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { currentPlayer, lobbies, notifications, ratingTasks } from './src/data/mock';
import { CreateLobbyScreen } from './src/screens/CreateLobbyScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LobbyDetailsScreen } from './src/screens/LobbyDetailsScreen';
import { LobbiesScreen } from './src/screens/LobbiesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { colors, radius, spacing } from './src/theme';
import type { Lobby } from './src/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedFilter, setSelectedFilter] = useState('Nearby');
  const [selectedLobby, setSelectedLobby] = useState<Lobby | null>(null);
  const pendingRatings = ratingTasks.filter(
    (task) => task.playerId === currentPlayer.id && task.status === 'open',
  );
  const unreadNotifications = notifications.filter((notification) => !notification.read);

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

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setSelectedLobby(null);
  }

  function handleOpenLobby(lobby: Lobby) {
    setSelectedLobby(lobby);
    setActiveTab('lobbies');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <Header
          showBack={activeTab === 'lobbies' && Boolean(selectedLobby)}
          unreadCount={unreadNotifications.length}
          onBack={() => setSelectedLobby(null)}
        />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'home' && (
            <HomeScreen
              currentPlayer={currentPlayer}
              lobbies={filteredLobbies}
              pendingRatings={pendingRatings}
              notifications={unreadNotifications}
              onCreate={() => setActiveTab('create')}
              onOpenLobbies={() => setActiveTab('lobbies')}
            />
          )}
          {activeTab === 'lobbies' && selectedLobby ? (
            <LobbyDetailsScreen
              lobby={selectedLobby}
              currentPlayer={currentPlayer}
              onBack={() => setSelectedLobby(null)}
            />
          ) : null}
          {activeTab === 'lobbies' && !selectedLobby && (
            <LobbiesScreen
              lobbies={filteredLobbies}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              onOpenLobby={handleOpenLobby}
            />
          )}
          {activeTab === 'create' && <CreateLobbyScreen />}
          {activeTab === 'profile' && <ProfileScreen player={currentPlayer} />}
        </ScrollView>
        <BottomNav activeTab={activeTab} onChange={handleTabChange} />
      </View>
    </SafeAreaView>
  );
}

function Header({
  showBack,
  unreadCount,
  onBack,
}: {
  showBack: boolean;
  unreadCount: number;
  onBack: () => void;
}) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to lobbies"
          onPress={onBack}
          style={({ pressed }) => [styles.headerCircleButton, pressed && styles.pressed]}
        >
          <Text style={styles.headerCircleText}>‹</Text>
        </Pressable>
      ) : null}
      <View style={styles.brandMark}>
        <Text style={styles.brandBall}>T</Text>
      </View>
      <View style={styles.headerCopy}>
        <Text style={styles.brand}>TOCA</Text>
        <Text style={styles.subtleText}>Footvolley games by level, place, and trust</Text>
      </View>
      <View style={styles.headerActions}>
        <View style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>⌂</Text>
          {unreadCount > 0 ? (
            <View style={styles.notificationBubble}>
              <Text style={styles.notificationBubbleText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerCircleButton}>
          <Text style={styles.moreText}>•••</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    alignSelf: 'center',
    flex: 1,
    backgroundColor: colors.background,
    maxWidth: 480,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerCircleButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  headerCircleText: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '500',
    lineHeight: 36,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  brandBall: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  headerCopy: {
    flex: 1,
  },
  brand: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtleText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.round,
    borderColor: colors.border,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  notificationIcon: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  notificationBubble: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -4,
    width: 20,
  },
  notificationBubbleText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  moreText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  content: {
    paddingBottom: 132,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.72,
  },
});
