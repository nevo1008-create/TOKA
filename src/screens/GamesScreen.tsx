import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import { currentPlayer, notifications } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Lobby } from '../types';

type GamesScreenProps = {
  lobbies: Lobby[];
  onBack: () => void;
  onOpenLobby: (lobby: Lobby) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
};

type FilterId = 'All Games' | 'Location' | 'Level' | 'Gender';

type GameListItem = {
  audience: string;
  avatars: string[];
  badgeLabel?: string;
  badgeTone?: 'goldSoft' | 'lime';
  distance: string;
  gradient: readonly [string, string, string];
  level: string;
  lobbyIndex: number;
  location: string;
  metaTag?: string;
  players: string;
  spotsLeft: string;
  startsAt: string;
  title: string;
};

const filters: Array<{ id: FilterId; icon: keyof typeof Ionicons.glyphMap; suffix?: boolean }> = [
  { id: 'All Games', icon: 'football-outline' },
  { id: 'Location', icon: 'navigate-outline' },
  { id: 'Level', icon: 'options-outline', suffix: true },
  { id: 'Gender', icon: 'male-female-outline', suffix: true },
];

const gameSections = ['Search Games', 'My Games'] as const;
type GameSection = (typeof gameSections)[number];

const gameCards: GameListItem[] = [
  {
    audience: 'Everyone',
    avatars: ['NV', 'OM', 'MY'],
    badgeLabel: 'Admin',
    badgeTone: 'lime',
    distance: '2.4 km',
    gradient: ['#173E24', '#27644A', '#D99A00'],
    level: 'B-C+',
    lobbyIndex: 0,
    location: 'Gordon Beach, Tel Aviv',
    players: '3 / 4 players',
    spotsLeft: '1 spot left',
    startsAt: 'Fri 16:30',
    title: 'Friday at Gordon',
  },
  {
    audience: 'Everyone',
    avatars: ['DN', 'NV', 'OM'],
    distance: '18.1 km',
    gradient: ['#11321D', '#315A3A', '#F2D38A'],
    level: 'A+',
    lobbyIndex: 1,
    location: 'Poleg Beach, Netanya',
    players: '3 / 6 players',
    spotsLeft: '3 spots left',
    startsAt: 'Sat 08:00',
    title: 'League morning',
  },
  {
    audience: 'Women',
    avatars: ['MY'],
    distance: '49.5 km',
    gradient: ['#0B2730', '#218678', '#FFD78E'],
    level: 'C-D',
    lobbyIndex: 2,
    location: 'Aqueduct Beach, Caesarea',
    metaTag: 'Women',
    players: '1 / 6 players',
    spotsLeft: '5 spots left',
    startsAt: 'Sun 19:00',
    title: 'Women evening',
  },
  {
    audience: 'Everyone',
    avatars: ['NV', 'OM', 'LB', '+1'],
    badgeLabel: 'Joined',
    badgeTone: 'lime',
    distance: '3.1 km',
    gradient: ['#112C1A', '#244F32', '#27D2C4'],
    level: 'B',
    lobbyIndex: 0,
    location: 'Hilton Beach, Tel Aviv',
    players: '3 / 6 players',
    spotsLeft: '2 spots left',
    startsAt: 'Sun 07:30',
    title: 'Sunrise challenge',
  },
  {
    audience: 'Everyone',
    avatars: ['OM', 'MY', 'ES', '+2'],
    distance: '12.7 km',
    gradient: ['#0C2414', '#2B5A34', '#FFC83D'],
    level: 'B+',
    lobbyIndex: 1,
    location: 'Herzliya Beach, Herzliya',
    players: '5 / 8 players',
    spotsLeft: '4 spots left',
    startsAt: 'Mon 18:00',
    title: 'Monday night',
  },
];

export function getLobbyImageUrl(index: number) {
  return `gradient-placeholder-${index}`;
}

export function GamesScreen({
  lobbies,
  onOpenLobby,
  selectedFilter,
  setSelectedFilter,
}: GamesScreenProps) {
  const [activeSection, setActiveSection] = useState<GameSection>('Search Games');

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(76, 255, 90, 0.09)', colors.darkBackground, colors.darkBackground]}
        locations={[0, 0.34, 1]}
        style={styles.backgroundGlow}
      />
      <HomeHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.content}>
        <View style={styles.sectionTabs}>
          {gameSections.map((section) => {
            const isActive = activeSection === section;

            return (
              <Pressable
                accessibilityRole="button"
                key={section}
                onPress={() => setActiveSection(section)}
                style={[styles.sectionTab, isActive && styles.sectionTabActive]}
              >
                <AppText
                  align="center"
                  style={[styles.sectionTabText, isActive && styles.sectionTabTextActive]}
                  tone={isActive ? 'accent' : 'muted'}
                  variant="bodySmall"
                  weight="800"
                >
                  {section}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {activeSection === 'Search Games' ? (
          <SearchGamesView
            lobbies={lobbies}
            onOpenLobby={onOpenLobby}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
          />
        ) : (
          <MyGamesView lobbies={lobbies} onOpenLobby={onOpenLobby} />
        )}
      </View>
    </View>
  );
}

function SearchGamesView({
  lobbies,
  onOpenLobby,
  selectedFilter,
  setSelectedFilter,
}: {
  lobbies: Lobby[];
  onOpenLobby: (lobby: Lobby) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
}) {
  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons color={colors.darkSubtle} name="search" size={18} />
        <TextInput
          placeholder="Search by name or ID"
          placeholderTextColor={colors.darkSubtle}
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => {
          const isActive = selectedFilter === filter.id || (selectedFilter === 'Nearby' && filter.id === 'Location');

          return (
            <Pressable
              key={filter.id}
              accessibilityRole="button"
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Ionicons
                color={isActive ? colors.accentLime : colors.darkSubtle}
                name={filter.icon}
                size={15}
              />
              <AppText
                style={[styles.filterText, isActive && styles.filterTextActive]}
                tone={isActive ? 'accent' : 'muted'}
                variant="bodySmall"
                weight="700"
              >
                {filter.id}
              </AppText>
              {filter.suffix ? (
                <Ionicons color={colors.darkSubtle} name="chevron-down" size={13} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHeader}>
        <View style={styles.listTitleRow}>
          <AppText style={styles.listTitle} variant="title" weight="800">
            Open Games
          </AppText>
          <AppText tone="subtle" variant="label" weight="600">
            8 games available
          </AppText>
        </View>
        <Pressable accessibilityRole="button" style={styles.privateButton}>
          <Ionicons color={colors.darkMuted} name="lock-closed-outline" size={12} />
          <AppText tone="muted" variant="label" weight="700">
            Show private
          </AppText>
        </Pressable>
      </View>

      <View style={styles.cardStack}>
        {gameCards.map((game, index) => {
          const lobby = lobbies[game.lobbyIndex % Math.max(lobbies.length, 1)];

          return (
            <GameCard
              game={game}
              key={`${game.title}-${index}`}
              onPress={() => {
                if (lobby) {
                  onOpenLobby(lobby);
                }
              }}
            />
          );
        })}
      </View>
    </>
  );
}

function MyGamesView({ lobbies, onOpenLobby }: { lobbies: Lobby[]; onOpenLobby: (lobby: Lobby) => void }) {
  return (
    <View style={styles.myGamesContent}>
      <GameHistorySection
        countLabel="2 active"
        games={[
          { ...gameCards[0], actionLabel: 'Open room', imageBadgeLabel: 'Admin', statusLabel: 'Admin', statusTone: 'lime' },
          { ...gameCards[3], actionLabel: 'Open room', imageBadgeLabel: 'Player', statusLabel: 'Waitlist', statusTone: 'gold' },
        ]}
        lobbies={lobbies}
        onOpenLobby={onOpenLobby}
        title="Joined Games"
      />

      <GameHistorySection
        countLabel="7 finished"
        games={[
          { ...gameCards[1], actionLabel: 'Rate players', statusLabel: 'Rating open', statusTone: 'gold' },
          { ...gameCards[2], actionLabel: 'View recap', statusLabel: 'Finished', statusTone: 'muted' },
          { ...gameCards[4], actionLabel: 'View recap', statusLabel: 'Finished', statusTone: 'muted' },
        ]}
        lobbies={lobbies}
        onOpenLobby={onOpenLobby}
        title="Finished Games"
      />
    </View>
  );
}

function GameHistorySection({
  countLabel,
  games,
  lobbies,
  onOpenLobby,
  title,
}: {
  countLabel: string;
  games: Array<GameListItem & { actionLabel: string; imageBadgeLabel?: string; statusLabel: string; statusTone: 'gold' | 'lime' | 'muted' }>;
  lobbies: Lobby[];
  onOpenLobby: (lobby: Lobby) => void;
  title: string;
}) {
  return (
    <View style={styles.historySection}>
      <View style={styles.listHeader}>
        <View style={styles.listTitleRow}>
          <AppText style={styles.listTitle} variant="title" weight="800">
            {title}
          </AppText>
          <AppText tone="subtle" variant="label" weight="600">
            {countLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.cardStack}>
        {games.map((game, index) => {
          const lobby = lobbies[game.lobbyIndex % Math.max(lobbies.length, 1)];

          return (
            <MyGameCard
              game={game}
              key={`${title}-${game.title}-${index}`}
              onPress={() => {
                if (lobby) {
                  onOpenLobby(lobby);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function GameCard({ game, onPress }: { game: GameListItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.myGameCard}>
      <BeachThumbnail badgeLabel={game.badgeLabel} badgeTone={game.badgeTone} game={game} />

      <View style={styles.myCardBody}>
        <View style={styles.timeRow}>
          <View style={styles.liveDot} />
          <AppText style={styles.timeText} tone="muted" variant="caption" weight="700">
            {game.startsAt}
          </AppText>
        </View>

        <AppText numberOfLines={1} style={styles.gameTitle} variant="title" weight="800">
          {game.title}
        </AppText>

        <View style={styles.locationRow}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText numberOfLines={1} style={styles.locationText} tone="muted" variant="bodySmall" weight="500">
            {game.location}
          </AppText>
        </View>

        <View style={styles.myCardFooter}>
          <View style={styles.myChipRow}>
            <View style={styles.myLevelPill}>
              <AppText tone="muted" variant="caption" weight="800">
                {game.level}
              </AppText>
            </View>
            <View style={styles.genderPill}>
              <AppText tone="subtle" variant="caption" weight="800">
                {game.audience}
              </AppText>
            </View>
          </View>

          <View style={styles.myActionStack}>
            <View style={styles.myPlayersPill}>
              <Ionicons color={colors.darkMuted} name="people-outline" size={12} />
              <AppText style={styles.myPlayersText} tone="muted" variant="caption" weight="800">
                {game.players}
              </AppText>
            </View>
            <View style={styles.myCardAction}>
              <AppText tone="accent" variant="caption" weight="800">
                Open room
              </AppText>
              <Ionicons color={colors.accentLime} name="chevron-forward" size={14} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function LegacyGameCard({ game, onPress }: { game: GameListItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.gameCard}>
      <BeachThumbnail game={game} />

      <View style={styles.cardBody}>
        <View style={styles.timeRow}>
          <View style={styles.liveDot} />
          <AppText style={styles.timeText} tone="muted" variant="caption" weight="700">
            {game.startsAt}
          </AppText>
        </View>

        <AppText numberOfLines={1} style={styles.gameTitle} variant="title" weight="800">
          {game.title}
        </AppText>

        <View style={styles.locationRow}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText numberOfLines={1} style={styles.locationText} tone="muted" variant="bodySmall" weight="500">
            {game.location}
          </AppText>
        </View>

        <AppText numberOfLines={1} style={styles.metaText} tone="subtle" variant="label" weight="600">
          Outdoor · {game.distance}
          {game.metaTag ? ` · ${game.metaTag}` : ''}
        </AppText>

        <View style={styles.cardFooter}>
          <View style={styles.avatarRow}>
            {game.avatars.map((initial, index) => (
              <View
                key={`${game.title}-${initial}-${index}`}
                style={[styles.smallAvatar, initial.startsWith('+') && styles.extraAvatar, index > 0 && styles.avatarOverlap]}
              >
                <AppText align="center" tone={initial.startsWith('+') ? 'primary' : 'inverse'} variant="caption" weight="800">
                  {initial}
                </AppText>
              </View>
            ))}
          </View>

          <View style={styles.playersPill}>
            <Ionicons color={colors.darkMuted} name="people-outline" size={12} />
            <AppText style={styles.playersText} tone="muted" variant="caption" weight="700">
              {game.players}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.cardSide}>
        <View style={styles.levelBadge}>
          <AppText align="center" style={styles.levelText} tone="warning" variant="caption" weight="800">
            {game.level}
          </AppText>
        </View>
        <AppText style={styles.audienceText} tone="subtle" variant="caption" weight="600">
          {game.audience}
        </AppText>
        <Ionicons color={colors.darkMuted} name="chevron-forward" size={19} />
      </View>
    </Pressable>
  );
}

function MyGameCard({
  game,
  onPress,
}: {
  game: GameListItem & { actionLabel: string; imageBadgeLabel?: string; statusLabel: string; statusTone: 'gold' | 'lime' | 'muted' };
  onPress: () => void;
}) {
  const actionIsOpenRoom = game.actionLabel === 'Open room';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.myGameCard}>
      <BeachThumbnail
        badgeLabel={game.imageBadgeLabel ?? game.statusLabel}
        badgeTone={game.statusTone === 'gold' ? 'goldSoft' : game.statusTone}
        game={game}
      />

      <View style={styles.myCardBody}>
        <View style={styles.myCardTopRow}>
          <View style={styles.timeRow}>
            <View style={[styles.liveDot, game.statusTone === 'muted' && styles.finishedDot]} />
            <AppText style={styles.timeText} tone="muted" variant="caption" weight="700">
              {game.startsAt}
            </AppText>
          </View>
        </View>

        <AppText numberOfLines={1} style={styles.gameTitle} variant="title" weight="800">
          {game.title}
        </AppText>

        <View style={styles.locationRow}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText numberOfLines={1} style={styles.locationText} tone="muted" variant="bodySmall" weight="500">
            {game.location}
          </AppText>
        </View>

        <View style={styles.myCardFooter}>
          <View style={styles.myChipRow}>
            <View style={styles.myLevelPill}>
              <AppText tone="muted" variant="caption" weight="800">
                {game.level}
              </AppText>
            </View>
            <View style={styles.genderPill}>
              <AppText tone="subtle" variant="caption" weight="800">
                {game.audience}
              </AppText>
            </View>
          </View>
          <View style={styles.myActionStack}>
            <View style={styles.myPlayersPill}>
              <Ionicons color={colors.darkMuted} name="people-outline" size={12} />
              <AppText style={styles.myPlayersText} tone="muted" variant="caption" weight="800">
                {game.players}
              </AppText>
            </View>
            <View style={styles.myCardAction}>
              <AppText tone={actionIsOpenRoom ? 'accent' : game.statusTone === 'muted' ? 'muted' : 'warning'} variant="caption" weight="800">
                {game.actionLabel}
              </AppText>
              <Ionicons
                color={actionIsOpenRoom ? colors.accentLime : game.statusTone === 'muted' ? colors.darkMuted : colors.accent}
                name="chevron-forward"
                size={14}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function BeachThumbnail({
  badgeLabel,
  badgeTone = 'goldSoft',
  game,
}: {
  badgeLabel?: string;
  badgeTone?: 'gold' | 'goldSoft' | 'lime' | 'muted';
  game: GameListItem;
}) {
  const visibleBadgeLabel = badgeLabel ?? game.spotsLeft;
  const badgeStyle =
    badgeTone === 'lime'
      ? styles.spotsBadgeLime
      : badgeTone === 'muted'
        ? styles.spotsBadgeMuted
        : badgeTone === 'goldSoft'
          ? styles.spotsBadgeGoldSoft
          : styles.spotsBadgeGold;
  const badgeTextTone =
    badgeTone === 'muted'
      ? 'muted'
      : badgeTone === 'lime'
        ? 'accent'
        : badgeTone === 'goldSoft'
          ? 'warning'
          : 'inverse';

  return (
    <LinearGradient
      colors={game.gradient}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={styles.thumbnail}
    >
      <LinearGradient
        colors={['rgba(3, 16, 8, 0.08)', 'rgba(3, 16, 8, 0.70)']}
        end={{ x: 0.6, y: 1 }}
        start={{ x: 0.6, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.sunGlow} />
      <View style={styles.netLine} />
      <View style={[styles.palmLine, styles.palmLineLeft]} />
      <View style={[styles.palmLine, styles.palmLineRight]} />
      <View style={[styles.spotsBadge, badgeStyle]}>
        <AppText style={styles.spotsText} tone={badgeTextTone} variant="caption" weight="800">
          {visibleBadgeLabel}
        </AppText>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  audienceText: {
    maxWidth: 54,
  },
  backgroundGlow: {
    height: 360,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  avatarOverlap: {
    marginLeft: -7,
  },
  avatarRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
    paddingRight: spacing.xs,
  },
  cardFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
  },
  cardSide: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: 42,
  },
  cardStack: {
    gap: 7,
  },
  content: {
    gap: 11,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  extraAvatar: {
    backgroundColor: 'rgba(3, 16, 8, 0.62)',
    borderColor: colors.darkBorder,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.66)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 34,
    paddingHorizontal: 7,
  },
  filterChipActive: {
    backgroundColor: 'rgba(76, 255, 90, 0.07)',
    borderColor: colors.neonMuted,
  },
  filterRow: {
    gap: 5,
    minWidth: '100%',
  },
  filterText: {
    color: colors.darkMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  filterTextActive: {
    color: colors.accentLime,
  },
  gameCard: {
    backgroundColor: 'rgba(11, 29, 16, 0.74)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 142,
    overflow: 'hidden',
    padding: 9,
  },
  gameTitle: {
    color: '#ECEDE6',
    fontSize: 17,
    lineHeight: 21,
  },
  genderPill: {
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  finishedDot: {
    backgroundColor: colors.darkSubtle,
  },
  historySection: {
    gap: spacing.sm,
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.11)',
    borderColor: 'rgba(255, 200, 61, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    minWidth: 39,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  levelText: {
    fontSize: 10,
    lineHeight: 13,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listTitle: {
    color: '#ECEDE6',
    fontSize: 19,
    lineHeight: 24,
  },
  listTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  liveDot: {
    backgroundColor: colors.accentLime,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  myCardAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  myActionStack: {
    alignItems: 'flex-end',
    gap: 3,
  },
  myCardBody: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  myCardFooter: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  myCardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  myChipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  myGameCard: {
    backgroundColor: 'rgba(11, 29, 16, 0.70)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 122,
    overflow: 'hidden',
    padding: 9,
  },
  myGamesContent: {
    gap: spacing.md,
  },
  myMetaText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
  },
  myLevelPill: {
    backgroundColor: 'rgba(246, 247, 237, 0.04)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  myPlayersPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.06)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 22,
    paddingHorizontal: 7,
  },
  myPlayersText: {
    fontSize: 10,
    lineHeight: 13,
  },
  netLine: {
    backgroundColor: 'rgba(246, 247, 237, 0.26)',
    bottom: 35,
    height: 2,
    left: 12,
    position: 'absolute',
    right: 12,
    transform: [{ rotate: '-7deg' }],
  },
  palmLine: {
    backgroundColor: 'rgba(3, 16, 8, 0.62)',
    borderRadius: radius.round,
    position: 'absolute',
    width: 3,
  },
  palmLineLeft: {
    height: 44,
    right: 24,
    top: 14,
    transform: [{ rotate: '14deg' }],
  },
  palmLineRight: {
    height: 34,
    right: 14,
    top: 20,
    transform: [{ rotate: '-12deg' }],
  },
  playersPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.05)',
    borderColor: 'rgba(246, 247, 237, 0.09)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 24,
    paddingHorizontal: 7,
  },
  playersText: {
    fontSize: 10,
    lineHeight: 13,
  },
  privateButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.52)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 28,
    paddingHorizontal: 8,
  },
  screen: {
    backgroundColor: colors.darkBackground,
    flex: 1,
    minHeight: '100%',
  },
  sectionTab: {
    alignItems: 'center',
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  sectionTabActive: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
  },
  sectionTabs: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11, 29, 16, 0.48)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  sectionTabText: {
    color: colors.darkMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTabTextActive: {
    color: colors.accentLime,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.78)',
    borderColor: colors.darkBorder,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 47,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.darkText,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    padding: 0,
  },
  searchActionStack: {
    alignItems: 'flex-end',
    gap: 3,
  },
  searchChipRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  searchFooterLeft: {
    gap: 5,
  },
  searchJoinAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  smallAvatar: {
    alignItems: 'center',
    backgroundColor: '#EEEED6',
    borderColor: colors.darkSurface,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  sortButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  spotsBadge: {
    borderRadius: radius.round,
    left: 7,
    minHeight: 22,
    paddingHorizontal: 8,
    paddingTop: 4,
    position: 'absolute',
    top: 7,
  },
  spotsBadgeGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderWidth: 1,
  },
  spotsBadgeGoldSoft: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderWidth: 1,
  },
  spotsBadgeLime: {
    backgroundColor: 'rgba(76, 255, 90, 0.12)',
    borderColor: colors.neonMuted,
    borderWidth: 1,
  },
  spotsBadgeMuted: {
    backgroundColor: 'rgba(246, 247, 237, 0.08)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderWidth: 1,
  },
  spotsText: {
    fontSize: 10,
    lineHeight: 13,
  },
  statusBadge: {
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusBadgeGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.32)',
  },
  statusBadgeLime: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
  },
  statusBadgeMuted: {
    backgroundColor: 'rgba(246, 247, 237, 0.04)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
  },
  statusBadgeText: {
    fontSize: 10,
    lineHeight: 13,
  },
  sunGlow: {
    backgroundColor: 'rgba(255, 200, 61, 0.62)',
    borderRadius: radius.round,
    height: 28,
    position: 'absolute',
    right: 17,
    top: 17,
    width: 28,
  },
  thumbnail: {
    borderRadius: 18,
    height: 100,
    overflow: 'hidden',
    position: 'relative',
    width: 100,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  timeText: {
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  tuneButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.66)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    width: 38,
  },
});
