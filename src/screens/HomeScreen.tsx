import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { FeaturedGameCard } from '../components/home/FeaturedGameCard';
import { HomeHeader } from '../components/home/HomeHeader';
import { NearbyGameCard } from '../components/home/NearbyGameCard';
import { PlayerStatusStrip } from '../components/home/ProgressCard';
import { QuickActionRow } from '../components/home/QuickActionRow';
import { formatLobbyStart, getEffectiveLobbyStatus, isEveningLobbyStart } from '../features/lobbies/lobbyDateTime';
import { getAutoCancelCountdownLabel } from '../features/lobbies/lobbyLifecycle';
import { useLifecycleClock } from '../features/lobbies/useLifecycleClock';
import { isJoinedParticipant } from '../features/lobbies/lobbyRules';
import { getRemainingRatingTargetIds, shouldShowRatingLobby } from '../features/ratings/ratingRules';
import { colors, homeTypography, spacing } from '../theme';
import type { Lobby, Notification, Player, RatingTask } from '../types';

type HomeScreenProps = {
  currentPlayer: Player;
  lobbies: Lobby[];
  notifications: Notification[];
  onCreateGame: () => void;
  onInviteFriends: () => void;
  onOpenMenu: () => void;
  onOpenGames: () => void;
  onOpenLobby: (lobby: Lobby) => void;
  onOpenNotifications: () => void;
  players: Player[];
  ratingTasks: RatingTask[];
  tocaPointGain?: {
    amount: number;
    from: number;
    id: number;
    to: number;
  } | null;
};

export function HomeScreen({
  currentPlayer,
  lobbies,
  notifications,
  onCreateGame,
  onInviteFriends,
  onOpenMenu,
  onOpenGames,
  onOpenLobby,
  onOpenNotifications,
  players,
  ratingTasks,
  tocaPointGain,
}: HomeScreenProps) {
  useLifecycleClock();
  const upcomingLobbies = lobbies.filter(isLobbyDiscoverable).sort((left, right) => getLobbyStartTime(left) - getLobbyStartTime(right));
  const joinedUpcomingLobbies = upcomingLobbies.filter((lobby) => isCurrentPlayerJoined(lobby, currentPlayer.id));
  const featuredLobby = joinedUpcomingLobbies[0];
  const nearbyLobbies = upcomingLobbies
    .filter((lobby) => lobby.id !== featuredLobby?.id && !isPrivateLobby(lobby))
    .slice(0, 2);
  const ratingLobbies = lobbies
    .filter((lobby) => shouldShowRatingLobby(lobby, currentPlayer.id))
    .filter((lobby) => getRemainingRatingTargetIds(ratingTasks, lobby, currentPlayer.id).length > 0)
    .sort((left, right) => getLobbyStartTime(right) - getLobbyStartTime(left))
    .slice(0, 2);
  const firstName = currentPlayer.name.split(' ')[0];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.22, y: 0.72 }}
        style={styles.sunWash}
      />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.34)', 'rgba(246, 238, 220, 0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topLight}
      />
      <View pointerEvents="none" style={styles.palmGlow}>
        <View style={[styles.palmFrond, styles.palmFrondOne]} />
        <View style={[styles.palmFrond, styles.palmFrondTwo]} />
        <View style={[styles.palmFrond, styles.palmFrondThree]} />
      </View>
      <HomeHeader
        notificationCount={notifications.length}
        onMenuPress={onOpenMenu}
        onNotificationsPress={onOpenNotifications}
        player={currentPlayer}
        useHomeTypography
      />

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <AppText style={styles.heroTitle} variant="displayGreeting" weight="900">
              Good evening,
            </AppText>
            <AppText style={styles.heroTitle} tone="accent" variant="displayGreeting" weight="900">
              {firstName}
            </AppText>
          </View>
        </View>

        <PlayerStatusStrip player={currentPlayer} tocaPointGain={tocaPointGain} />

        <View style={styles.nextGameHeader}>
          <AppText style={styles.nextGameTitle} variant="sectionHeading" weight="800">
            My next game
          </AppText>
        </View>

        <FeaturedGameCard
          currentPlayerId={currentPlayer.id}
          lobby={featuredLobby}
          onOpenRoom={() => (featuredLobby ? onOpenLobby(featuredLobby) : onOpenGames())}
          players={players}
        />

        <QuickActionRow
          onCreateGame={onCreateGame}
          onFindGame={onOpenGames}
          onInviteFriends={onInviteFriends}
        />

        <View style={[styles.section, styles.nearbySection]}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
              Nearby Games
            </AppText>
            <Pressable accessibilityRole="button" onPress={onOpenGames} style={styles.mapAction}>
              <AppText style={styles.sectionActionText} tone="accent" variant="button" weight="800">
                See all
              </AppText>
              <Ionicons color={colors.accentLime} name="chevron-forward" size={20} />
            </Pressable>
          </View>

          {nearbyLobbies.length > 0 ? (
            <View style={styles.nearbyStack}>
              {nearbyLobbies.map((lobby) => (
              <NearbyGameCard
                audience={getGenderAudience(lobby)}
                distance={getDistanceLabel(lobby)}
                key={lobby.id}
                level={getRankLabel(lobby)}
                location={lobby.location.name}
                onPress={() => onOpenLobby(lobby)}
                players={getPlayersLabel(lobby)}
                spotsLeft={getSpotsLabel(lobby)}
                status={lobby.visibility === 'public' ? 'Full' : 'Approval'}
                time={formatLobbyStart(lobby.startsAt)}
                title={lobby.title}
                variant={isEveningLobbyStart(lobby.startsAt) ? 'sunset' : 'morning'}
                useHomeTypography
              />
              ))}
            </View>
          ) : (
            <NearbyEmptyState onSeeAll={onOpenGames} />
          )}
        </View>

        {ratingLobbies.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
                Rate games
              </AppText>
            </View>

            <View style={styles.nearbyStack}>
              {ratingLobbies.map((lobby) => {
                const remainingRatings = getRemainingRatingTargetIds(ratingTasks, lobby, currentPlayer.id).length;
                const isRated = remainingRatings === 0;

                return (
                  <NearbyGameCard
                    actionDisabled={isRated}
                    actionLabel={isRated ? 'Finished' : 'Rate players'}
                    actionTone={isRated ? 'muted' : 'warning'}
                    audience={getGenderAudience(lobby)}
                    distance={getDistanceLabel(lobby)}
                    key={lobby.id}
                    level={getRankLabel(lobby)}
                    location={lobby.location.name}
                    onPress={() => onOpenLobby(lobby)}
                    players={getPlayersLabel(lobby)}
                    spotsLeft={isRated ? 'Finished' : 'Rating is open'}
                    spotsTone={isRated ? 'green' : 'yellow'}
                    status="Full"
                    time={formatLobbyStart(lobby.startsAt)}
                    title={lobby.title}
                    variant={isEveningLobbyStart(lobby.startsAt) ? 'sunset' : 'morning'}
                    useHomeTypography
                  />
                );
              })}
            </View>
          </View>
        ) : null}

      </View>
    </View>
  );
}

function isLobbyDiscoverable(lobby: Lobby) {
  const status = getEffectiveLobbyStatus(lobby);

  return lobby.participants.length > 0 && (status === 'open' || status === 'full' || status === 'closing_soon');
}

function isPrivateLobby(lobby: Lobby) {
  return lobby.visibility === 'password' || lobby.visibility === 'invite_link';
}

function isCurrentPlayerJoined(lobby: Lobby, currentPlayerId: string) {
  return lobby.participants.some((participant) => participant.playerId === currentPlayerId && isJoinedParticipant(participant));
}

function getActiveParticipants(lobby: Lobby) {
  return lobby.participants.filter(isJoinedParticipant);
}

function getPlayersLabel(lobby: Lobby) {
  return `${getActiveParticipants(lobby).length} / ${lobby.maxPlayers}`;
}

function getSpotsLabel(lobby: Lobby) {
  const autoCancelLabel = getAutoCancelCountdownLabel(lobby);

  if (autoCancelLabel) {
    return autoCancelLabel;
  }

  const spotsLeft = Math.max(lobby.maxPlayers - getActiveParticipants(lobby).length, 0);

  if (spotsLeft === 0) {
    return 'Full';
  }

  return spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`;
}

function getDistanceLabel(lobby: Lobby) {
  return lobby.location.distanceKm ? `${lobby.location.distanceKm.toFixed(1)} km` : 'New';
}

function getRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact';
  }

  return `${lobby.rankMin}/${lobby.rankMax}`;
}

function getGenderAudience(lobby: Lobby) {
  if (lobby.genderRule === 'male') {
    return 'Men';
  }

  if (lobby.genderRule === 'female') {
    return 'Women';
  }

  return 'Everyone';
}

function getLobbyStartTime(lobby: Lobby) {
  const startsAtTime = new Date(lobby.startsAt).getTime();

  return Number.isNaN(startsAtTime) ? Number.MAX_SAFE_INTEGER : startsAtTime;
}

function NearbyEmptyState({ onSeeAll }: { onSeeAll: () => void }) {
  return (
    <View style={styles.nearbyEmptyState}>
      <View style={styles.nearbyEmptyIcon}>
        <Ionicons color={colors.accentSea} name="location-outline" size={21} />
      </View>
      <View style={styles.nearbyEmptyCopy}>
        <AppText align="center" style={styles.nearbyEmptyTitle} variant="titleSmall" weight="900">
          No games found in your area
        </AppText>
        <AppText align="center" tone="muted" variant="metadata" weight="600">
          Check the full games list for other beaches and upcoming matches.
        </AppText>
      </View>
      <Pressable accessibilityRole="button" onPress={onSeeAll} style={styles.nearbyEmptyButton}>
        <AppText align="center" tone="accent" variant="button" weight="800">
          See all games
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  palmFrond: {
    backgroundColor: 'rgba(239, 165, 26, 0.08)',
    borderRadius: 999,
    height: 130,
    position: 'absolute',
    right: 26,
    top: -34,
    width: 10,
  },
  palmFrondOne: {
    transform: [{ rotate: '48deg' }],
  },
  palmFrondTwo: {
    right: 50,
    top: -28,
    transform: [{ rotate: '68deg' }],
  },
  palmFrondThree: {
    right: 5,
    top: -18,
    transform: [{ rotate: '28deg' }],
  },
  palmGlow: {
    height: 180,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 150,
  },
  sunWash: {
    height: 430,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topLight: {
    height: 190,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    gap: 15,
    paddingBottom: 170,
    paddingHorizontal: spacing.xl2,
    paddingTop: 18,
  },
  hero: {
    alignItems: 'flex-start',
  },
  heroTitleRow: {
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
  },
  heroTitle: {
    alignSelf: 'flex-start',
    ...homeTypography.greeting,
  },
  mapAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  nearbyStack: {
    gap: 12,
  },
  nearbySection: {
    marginTop: -10,
  },
  nearbyEmptyButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.xl,
  },
  nearbyEmptyCopy: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  nearbyEmptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  nearbyEmptyState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 156,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  nearbyEmptyTitle: {
    color: colors.ink,
  },
  nextGameHeader: {
    marginBottom: -8,
    marginTop: 2,
  },
  nextGameTitle: {
    color: colors.ink,
    textTransform: 'uppercase',
    ...homeTypography.eyebrow,
  },
  screen: {
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionActionText: {
    ...homeTypography.button,
  },
  sectionTitle: {
    ...homeTypography.sectionTitle,
  },
});
