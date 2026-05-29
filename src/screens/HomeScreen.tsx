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
  onOpenGames: () => void;
  onOpenLobby: (lobby: Lobby) => void;
};

export function HomeScreen({
  currentPlayer,
  lobbies,
  notifications,
  onCreateGame,
  onInviteFriends,
  onOpenGames,
  onOpenLobby,
}: HomeScreenProps) {
  const featuredLobby = lobbies[0];
  const nearbyLeagueLobby = lobbies[1] ?? featuredLobby;
  const nearbyWomenLobby = lobbies[2] ?? featuredLobby;
  const firstName = currentPlayer.name.split(' ')[0];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(76, 255, 90, 0.09)', colors.darkBackground, colors.darkBackground]}
        locations={[0, 0.34, 1]}
        style={styles.backgroundGlow}
      />
      <HomeHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroTitleRow}>
            <AppText style={styles.heroTitle} variant="display" weight="800">
              Good evening,
            </AppText>
            <AppText style={styles.heroTitle} tone="accent" variant="display" weight="800">
              {firstName}
            </AppText>
          </View>
        </View>

        <PlayerStatusStrip />

        <View style={styles.nextGameHeader}>
          <AppText style={styles.nextGameTitle} variant="label" weight="800">
            My next game
          </AppText>
        </View>

        <FeaturedGameCard
          lobby={featuredLobby}
          onJoin={() => (featuredLobby ? onOpenLobby(featuredLobby) : onOpenGames())}
          onOpenRoom={() => (featuredLobby ? onOpenLobby(featuredLobby) : onOpenGames())}
        />

        <QuickActionRow
          onCreateGame={onCreateGame}
          onFindGame={onOpenGames}
          onInviteFriends={onInviteFriends}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} variant="heading" weight="800">
              Nearby Games
            </AppText>
            <Pressable accessibilityRole="button" onPress={onOpenGames} style={styles.mapAction}>
              <AppText tone="accent" variant="titleSmall" weight="800">
                See all
              </AppText>
              <Ionicons color={colors.accentLime} name="chevron-forward" size={20} />
            </Pressable>
          </View>

          <View style={styles.nearbyStack}>
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
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} variant="heading" weight="800">
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

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 360,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
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
    fontSize: 29,
    lineHeight: 35,
  },
  mapAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingLeft: spacing.md,
  },
  nearbyStack: {
    gap: spacing.sm,
  },
  nextGameHeader: {
    marginBottom: -spacing.xs,
    marginTop: -spacing.xs,
  },
  nextGameTitle: {
    color: 'rgba(215, 217, 208, 0.78)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 23,
    lineHeight: 28,
  },
});
