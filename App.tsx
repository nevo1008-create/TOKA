import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomNav, type Tab } from './src/components/BottomNav';
import { currentPlayer, lobbies, notifications, ratingTasks } from './src/data/mock';
import { CreateLobbyScreen } from './src/screens/CreateLobbyScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { LobbiesScreen } from './src/screens/LobbiesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { colors, radius, spacing } from './src/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedFilter, setSelectedFilter] = useState('Nearby');
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <Header unreadCount={unreadNotifications.length} />
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
          {activeTab === 'lobbies' && (
            <LobbiesScreen
              lobbies={filteredLobbies}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
            />
          )}
          {activeTab === 'create' && <CreateLobbyScreen />}
          {activeTab === 'profile' && <ProfileScreen player={currentPlayer} />}
        </ScrollView>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
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
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
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
});
