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
      <StatusBar style="light" />
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
          <Text style={styles.headerCircleText}>{'<'}</Text>
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
          <Text style={styles.notificationIcon}>B</Text>
          {unreadCount > 0 ? (
            <View style={styles.notificationBubble}>
              <Text style={styles.notificationBubbleText}>{unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerCircleButton}>
          <Text style={styles.moreText}>...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#07101D',
  },
  appShell: {
    alignSelf: 'center',
    flex: 1,
    backgroundColor: '#07101D',
    maxWidth: 430,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 88,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  headerCircleButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  headerCircleText: {
    color: '#F5F7FA',
    fontSize: 26,
    fontWeight: '500',
    lineHeight: 28,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#101A2B',
    borderColor: 'rgba(125,255,107,0.32)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  brandBall: {
    color: '#FFC857',
    fontSize: 27,
    fontWeight: '700',
  },
  headerCopy: {
    flex: 1,
  },
  brand: {
    color: '#F5F7FA',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 0,
  },
  subtleText: {
    color: '#A7B0C0',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.round,
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  notificationIcon: {
    color: '#F5F7FA',
    fontSize: 21,
    fontWeight: '500',
  },
  notificationBubble: {
    alignItems: 'center',
    backgroundColor: '#7DFF6B',
    borderRadius: radius.round,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -4,
    width: 20,
  },
  notificationBubbleText: {
    color: '#07101D',
    fontSize: 11,
    fontWeight: '700',
  },
  moreText: {
    color: '#F5F7FA',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  content: {
    paddingBottom: 140,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
