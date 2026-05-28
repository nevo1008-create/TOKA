import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Lobby, LobbyParticipant, Notification, Player } from '../types';
import { getLobbyImageUrl } from './GamesScreen';

type HomeScreenProps = {
  currentPlayer: Player;
  lobbies: Lobby[];
  notifications: Notification[];
  onOpenGames: () => void;
  onOpenLobby: (lobby: Lobby) => void;
};

export function HomeScreen({
  currentPlayer,
  lobbies,
  notifications,
  onOpenGames,
  onOpenLobby,
}: HomeScreenProps) {
  const upcomingLobby = lobbies[0];
  const nearbyLobbies = lobbies.slice(1, 4);
  const recentPlayers = players.filter((player) => player.id !== currentPlayer.id);

  return (
    <View style={styles.screen}>
      <AppHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.content}>
        <View>
          <Text style={styles.greeting}>
            Hello <Text style={styles.highlight}>{currentPlayer.name}</Text> <Text style={styles.wave}>!</Text>
          </Text>
          <Text style={styles.sectionKicker}>Your activity</Text>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.statsRow}>
            <StatItem accent="green" icon="P" label={`Games Played\nThis Month`} value={`${currentPlayer.gamesPlayed}`} />
            <StatItem accent="blue" icon="R" label={`Current Grade\nKeep it up!`} value={currentPlayer.level} />
            <StatItem accent="yellow" icon="*" isLast label="Average Rating" value="3.4" withStars />
          </View>

          <View style={styles.divider} />

          <Pressable style={styles.pointsRow}>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsBadgeText}>8</Text>
            </View>
            <View style={styles.pointsCopy}>
              <Text style={styles.pointsTitle}>TOCA Points</Text>
              <View style={styles.pointsMetaRow}>
                <Text style={styles.pointsMeta}>Level 8</Text>
                <Text style={styles.pointsMeta}>
                  <Text style={styles.highlight}>1,250</Text> / 2,000
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </Pressable>
        </View>

        {upcomingLobby ? (
          <View style={styles.section}>
            <SectionHeader title="Your Upcoming Game" action="View all" onPress={onOpenGames} />
            <UpcomingGameCard lobby={upcomingLobby} onPress={() => onOpenLobby(upcomingLobby)} />
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Nearby Games" action="See map" onPress={onOpenGames} />
          <View style={styles.nearbyStack}>
            {nearbyLobbies.map((lobby, index) => (
              <NearbyGameCard
                key={lobby.id}
                imageIndex={index + 1}
                lobby={lobby}
                onPress={() => onOpenLobby(lobby)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="People You Played With" action="View all" />
          <ScrollView horizontal contentContainerStyle={styles.peopleRow} showsHorizontalScrollIndicator={false}>
            {recentPlayers.map((player) => (
              <View key={player.id} style={styles.personItem}>
                <View style={styles.personAvatarWrap}>
                  <Avatar player={player} size={64} />
                  <View style={styles.personOnlineDot} />
                </View>
                <Text style={styles.personName}>{player.name}</Text>
              </View>
            ))}
            <View style={styles.personItem}>
              <View style={styles.morePeople}>
                <Text style={styles.morePeopleText}>+12</Text>
              </View>
              <Text style={styles.personName}>More</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function StatItem({
  accent,
  icon,
  label,
  value,
  isLast = false,
  withStars = false,
}: {
  accent: 'blue' | 'green' | 'yellow';
  icon: string;
  isLast?: boolean;
  label: string;
  value: string;
  withStars?: boolean;
}) {
  return (
    <View style={[styles.statItem, isLast && styles.statItemLast]}>
      <View style={styles.statIcon}>
        <Text style={[styles.statIconText, styles[`${accent}Text`]]}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {withStars ? (
        <View style={styles.starsRow}>
          <Text style={styles.starActive}>*</Text>
          <Text style={styles.starActive}>*</Text>
          <Text style={styles.starActive}>*</Text>
          <Text style={styles.starMuted}>*</Text>
          <Text style={styles.starMuted}>*</Text>
        </View>
      ) : null}
    </View>
  );
}

function SectionHeader({ action, onPress, title }: { action?: string; onPress?: () => void; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UpcomingGameCard({ lobby, onPress }: { lobby: Lobby; onPress: () => void }) {
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const visibleParticipants = activeParticipants.slice(0, 3);
  const extraParticipants = Math.max(activeParticipants.length - visibleParticipants.length, 0);

  return (
    <Pressable style={styles.upcomingCard} onPress={onPress}>
      <View style={styles.upcomingImageWrap}>
        <Image source={{ uri: getLobbyImageUrl(0) }} style={styles.upcomingImage} />
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>In 3h 20m</Text>
        </View>
      </View>
      <View style={styles.upcomingBody}>
        <View>
          <Text style={styles.upcomingTitle} numberOfLines={1}>
            {lobby.title}
          </Text>
          <Text style={styles.locationLine}>@ {lobby.location.name}</Text>
          <Text style={styles.metaLine}>
            {lobby.startsAt}  *  {getRankLabel(lobby)}  *  {activeParticipants.length}/{lobby.maxPlayers} Players
          </Text>
        </View>
        <View style={styles.upcomingFooter}>
          <View style={styles.avatarStack}>
            {visibleParticipants.map((participant) => {
              const player = players.find((candidate) => candidate.id === participant.playerId);

              return player ? (
                <View key={player.id} style={styles.stackedAvatar}>
                  <Avatar player={player} size={30} />
                </View>
              ) : null;
            })}
            {extraParticipants > 0 ? (
              <View style={styles.extraAvatar}>
                <Text style={styles.extraAvatarText}>+{extraParticipants}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.chevron}>{'>'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function NearbyGameCard({
  imageIndex,
  lobby,
  onPress,
}: {
  imageIndex: number;
  lobby: Lobby;
  onPress: () => void;
}) {
  const activeParticipants = lobby.participants.filter(isActiveParticipant);

  return (
    <Pressable style={styles.nearbyCard} onPress={onPress}>
      <Image source={{ uri: getLobbyImageUrl(imageIndex) }} style={styles.nearbyImage} />
      <View style={styles.nearbyCopy}>
        <Text style={styles.nearbyTitle} numberOfLines={1}>
          {lobby.title}
        </Text>
        <Text style={styles.locationLine} numberOfLines={1}>
          @ {lobby.location.name}
        </Text>
        <Text style={styles.metaLine} numberOfLines={1}>
          {lobby.startsAt}  *  {getRankLabel(lobby)}
        </Text>
      </View>
      <View style={styles.playersMini}>
        <Text style={styles.playersMiniValue}>
          {activeParticipants.length}/{lobby.maxPlayers}
        </Text>
        <Text style={styles.playersMiniLabel}>Players</Text>
      </View>
      <View style={styles.nearbyStatus}>
        <View style={styles.openBadge}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>{getStatusLabel(lobby)}</Text>
        </View>
        <Text style={styles.distanceText}>{lobby.location.distanceKm ?? '0'} km</Text>
      </View>
      <Text style={styles.nearbyChevron}>{'>'}</Text>
    </Pressable>
  );
}

function isActiveParticipant(participant: LobbyParticipant) {
  return participant.role === 'admin' || participant.role === 'joined' || participant.role === 'substitute';
}

function getRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact';
  }

  return `${lobby.rankMin} to ${lobby.rankMax}`;
}

function getStatusLabel(lobby: Lobby) {
  if (lobby.status === 'full') {
    return 'Full';
  }

  if (lobby.visibility === 'public') {
    return 'Open';
  }

  return 'Approval';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  logoText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: colors.darkMuted,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 238,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerIcon: {
    alignItems: 'center',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  headerIconText: {
    color: colors.darkMuted,
    fontSize: 16,
    fontWeight: '900',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -3,
    top: -5,
    width: 18,
  },
  notificationBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },
  content: {
    gap: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  greeting: {
    color: colors.darkText,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  highlight: {
    color: colors.neon,
  },
  wave: {
    color: colors.accent,
  },
  sectionKicker: {
    color: colors.darkMuted,
    fontSize: 18,
    marginTop: spacing.sm,
  },
  activityCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    borderRightColor: colors.darkBorder,
    borderRightWidth: 1,
    flex: 1,
    minHeight: 128,
    paddingHorizontal: spacing.sm,
  },
  statItemLast: {
    borderRightWidth: 0,
  },
  statIcon: {
    alignItems: 'center',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 48,
  },
  statIconText: {
    fontSize: 18,
    fontWeight: '900',
  },
  greenText: {
    color: colors.neon,
  },
  blueText: {
    color: colors.darkMuted,
  },
  yellowText: {
    color: colors.accent,
  },
  statValue: {
    color: colors.darkText,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.darkMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs,
  },
  starActive: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
  starMuted: {
    color: colors.darkBorder,
    fontSize: 11,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: colors.darkBorder,
    height: 1,
  },
  pointsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  pointsBadge: {
    alignItems: 'center',
    borderColor: colors.neon,
    borderRadius: radius.md,
    borderWidth: 3,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  pointsBadgeText: {
    color: colors.darkText,
    fontSize: 22,
    fontWeight: '900',
  },
  pointsCopy: {
    flex: 1,
  },
  pointsTitle: {
    color: colors.darkText,
    fontSize: 17,
    fontWeight: '900',
  },
  pointsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  pointsMeta: {
    color: colors.darkMuted,
    fontSize: 13,
  },
  progressTrack: {
    backgroundColor: colors.darkBorder,
    borderRadius: radius.round,
    height: 8,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: '100%',
    width: '62.5%',
  },
  chevron: {
    color: colors.darkMuted,
    fontSize: 26,
    fontWeight: '800',
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.darkText,
    fontSize: 24,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.neon,
    fontSize: 15,
    fontWeight: '700',
  },
  upcomingCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  upcomingImageWrap: {
    borderRadius: radius.md,
    height: 128,
    overflow: 'hidden',
    position: 'relative',
    width: 128,
  },
  upcomingImage: {
    height: '100%',
    width: '100%',
  },
  timeBadge: {
    backgroundColor: colors.darkOverlay,
    borderRadius: radius.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    top: spacing.sm,
  },
  timeBadgeText: {
    color: colors.neon,
    fontSize: 11,
    fontWeight: '900',
  },
  upcomingBody: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  upcomingTitle: {
    color: colors.darkText,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 25,
  },
  locationLine: {
    color: colors.darkMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  metaLine: {
    color: colors.darkMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  upcomingFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    marginRight: -8,
  },
  extraAvatar: {
    alignItems: 'center',
    backgroundColor: colors.darkBorder,
    borderColor: colors.darkSurface,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  extraAvatarText: {
    color: colors.darkText,
    fontSize: 11,
    fontWeight: '900',
  },
  nearbyStack: {
    gap: spacing.md,
  },
  nearbyCard: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.md,
  },
  nearbyImage: {
    borderRadius: radius.sm,
    height: 64,
    width: 64,
  },
  nearbyCopy: {
    flex: 1,
    minWidth: 0,
  },
  nearbyTitle: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '900',
  },
  playersMini: {
    alignItems: 'center',
    borderLeftColor: colors.darkBorder,
    borderLeftWidth: 1,
    minWidth: 52,
    paddingLeft: spacing.sm,
  },
  playersMiniValue: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '900',
  },
  playersMiniLabel: {
    color: colors.darkMuted,
    fontSize: 10,
  },
  nearbyStatus: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  openBadge: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  openDot: {
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  openText: {
    color: colors.darkText,
    fontSize: 10,
    fontWeight: '800',
  },
  distanceText: {
    color: colors.darkMuted,
    fontSize: 10,
  },
  nearbyChevron: {
    color: colors.darkMuted,
    fontSize: 18,
    fontWeight: '900',
  },
  peopleRow: {
    gap: spacing.xl,
    paddingBottom: spacing.sm,
  },
  personItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 72,
  },
  personAvatarWrap: {
    position: 'relative',
  },
  personOnlineDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 2,
    height: 16,
    position: 'absolute',
    right: 2,
    width: 16,
  },
  personName: {
    color: colors.darkText,
    fontSize: 14,
  },
  morePeople: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  morePeopleText: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
  },
});
