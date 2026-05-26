import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LobbyCard } from '../components/LobbyCard';
import { SectionTitle } from '../components/SectionTitle';
import { colors, radius, spacing } from '../theme';
import type { Lobby, Notification, Player, RatingTask } from '../types';

type HomeScreenProps = {
  currentPlayer: Player;
  lobbies: Lobby[];
  pendingRatings: RatingTask[];
  notifications: Notification[];
  onCreate: () => void;
  onOpenLobbies: () => void;
};

export function HomeScreen({
  currentPlayer,
  lobbies,
  pendingRatings,
  notifications,
  onCreate,
  onOpenLobbies,
}: HomeScreenProps) {
  const upcomingLobby = lobbies[0];

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Find the right footvolley game</Text>
        <Text style={styles.heroText}>
          Join by level, gender rules, location, and admin approval when an exception makes sense.
        </Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={onCreate}>
            <Text style={styles.primaryButtonText}>Create lobby</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onOpenLobbies}>
            <Text style={styles.secondaryButtonText}>Browse</Text>
          </Pressable>
        </View>
      </View>

      {pendingRatings.length > 0 ? (
        <View style={styles.ratingPrompt}>
          <Text style={styles.rowTitle}>Rating popup ready</Text>
          <Text style={styles.subtleText}>
            Next app open should ask {currentPlayer.name} to rate or skip every active player.
          </Text>
        </View>
      ) : null}

      <SectionTitle title="My next game" action="Details" />
      {upcomingLobby ? <LobbyCard lobby={upcomingLobby} featured /> : null}

      <SectionTitle title="Nearby lobbies" action="Filter" />
      {lobbies.slice(1).map((lobby) => (
        <LobbyCard key={lobby.id} lobby={lobby} />
      ))}

      <SectionTitle title="Notifications" />
      <View style={styles.notificationPanel}>
        {notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationRow}>
            <Text style={styles.rowTitle}>{notification.title}</Text>
            <Text style={styles.subtleText}>{notification.body}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
  },
  heroText: {
    color: '#EAF4EC',
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#CDE5D5',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  ratingPrompt: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  notificationPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  notificationRow: {
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  subtleText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
