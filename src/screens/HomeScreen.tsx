import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { FeaturedGameCard } from '../components/home/FeaturedGameCard';
import { HomeHeader } from '../components/home/HomeHeader';
import { NearbyGameCard } from '../components/home/NearbyGameCard';
import { PlayerStatusStrip } from '../components/home/ProgressCard';
import { QuickActionRow } from '../components/home/QuickActionRow';
import { colors, spacing } from '../theme';
import type { Lobby, Notification, Player } from '../types';

type HomeScreenProps = {
  currentPlayer: Player;
  lobbies: Lobby[];
  notifications: Notification[];
  onCreateGame: () => void;
  onInviteFriends: () => void;
  onOpenMenu: () => void;
  onOpenGames: () => void;
  onOpenLobby: (lobby: Lobby) => void;
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
}: HomeScreenProps) {
  const featuredLobby = lobbies[0];
  const nearbyLeagueLobby = lobbies[1] ?? featuredLobby;
  const nearbyWomenLobby = lobbies[2] ?? featuredLobby;
  const firstName = currentPlayer.name.split(' ')[0];
  const showNearbyLeagueLobby = nearbyLeagueLobby ? isLobbyDiscoverable(nearbyLeagueLobby) : false;
  const showNearbyWomenLobby = nearbyWomenLobby ? isLobbyDiscoverable(nearbyWomenLobby) : false;

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
      <HomeHeader notificationCount={notifications.length} onMenuPress={onOpenMenu} player={currentPlayer} />

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

        <PlayerStatusStrip />

        <View style={styles.nextGameHeader}>
          <AppText style={styles.nextGameTitle} variant="sectionHeading" weight="800">
            My next game
          </AppText>
        </View>

        <FeaturedGameCard
          lobby={featuredLobby}
          onOpenRoom={() => (featuredLobby ? onOpenLobby(featuredLobby) : onOpenGames())}
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
              <AppText tone="accent" variant="button" weight="800">
                See all
              </AppText>
              <Ionicons color={colors.accentLime} name="chevron-forward" size={20} />
            </Pressable>
          </View>

          <View style={styles.nearbyStack}>
            {showNearbyLeagueLobby ? (
              <NearbyGameCard
                audience="Everyone"
                distance="18.1 km"
                level="A+"
                location="Poleg Beach"
                onPress={() => (nearbyLeagueLobby ? onOpenLobby(nearbyLeagueLobby) : onOpenGames())}
                players="3 / 6"
                spotsLeft="3 spots left"
                status="Full"
                time="Sat 08:00"
                title="League morning"
                variant="morning"
              />
            ) : null}
            {showNearbyWomenLobby ? (
              <NearbyGameCard
                audience="Women"
                distance="49.5 km"
                level="C-D"
                location="Aqueduct Beach"
                onPress={() => (nearbyWomenLobby ? onOpenLobby(nearbyWomenLobby) : onOpenGames())}
                players="1 / 6"
                spotsLeft="5 spots left"
                status="Approval"
                time="Sun 19:00"
                title="Women evening"
                variant="sunset"
              />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
              Rate games
            </AppText>
          </View>

          <View style={styles.nearbyStack}>
            <NearbyGameCard
              actionLabel="Rate players"
              actionTone="warning"
              audience="Everyone"
              distance="18.1 km"
              level="A+"
              location="Poleg Beach"
              onPress={() => (nearbyLeagueLobby ? onOpenLobby(nearbyLeagueLobby) : onOpenGames())}
              players="3 / 6"
              spotsLeft="Rating open"
              status="Full"
              time="Sat 08:00"
              title="League morning"
              variant="morning"
            />
          </View>
        </View>

      </View>
    </View>
  );
}

function isLobbyDiscoverable(lobby: Lobby) {
  return lobby.status === 'open' || lobby.status === 'full';
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
  nextGameHeader: {
    marginBottom: -8,
    marginTop: 2,
  },
  nextGameTitle: {
    color: colors.ink,
    textTransform: 'uppercase',
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
  sectionTitle: {},
});
