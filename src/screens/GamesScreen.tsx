import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '../components/AppText';
import { BeachGameVisual } from '../components/home/BeachGameVisual';
import { HomeHeader } from '../components/home/HomeHeader';
import { NearbyGameCard } from '../components/home/NearbyGameCard';
import { currentPlayer, notifications } from '../data/mock';
import { colors, radius, shadows, spacing } from '../theme';
import type { Lobby } from '../types';

type GamesScreenProps = {
  initialSection?: GameSection;
  lobbies: Lobby[];
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenLobby: (lobby: Lobby) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
};

type FilterId = 'All Games' | 'Location' | 'Rank' | 'Gender';
type OpenFilterPanel = 'Rank' | 'Gender' | null;
type GenderFilter = 'Everyone' | 'Male' | 'Female';

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
  { id: 'Rank', icon: 'options-outline', suffix: true },
  { id: 'Gender', icon: 'male-female-outline', suffix: true },
];

const levelOptions = ['A-', 'A', 'A+', 'B-', 'B', 'B+', 'C-', 'C', 'C+', 'D-', 'D', 'D+', 'E-', 'E', 'E+', 'League'];
const genderOptions: GenderFilter[] = ['Everyone', 'Male', 'Female'];

const gameSections = ['Find Games', 'My Games'] as const;
type GameSection = (typeof gameSections)[number];

const gameCards: GameListItem[] = [
  {
    audience: 'Everyone',
    avatars: ['NV', 'OM', 'MY'],
    badgeLabel: 'Admin',
    badgeTone: 'lime',
    distance: '2.4 km',
    gradient: ['#FFF2BD', '#8EDBD2', '#24C45A'],
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
    gradient: ['#F8F1E3', '#F6C945', '#8FCFBC'],
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
    gradient: ['#DDF5F1', '#1BB7A8', '#F6C945'],
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
    gradient: ['#EAF5EC', '#24C45A', '#1BB7A8'],
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
    gradient: ['#FFF9EC', '#F6C945', '#24C45A'],
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
  initialSection = 'Find Games',
  lobbies,
  onOpenMenu,
  onOpenLobby,
  selectedFilter,
  setSelectedFilter,
}: GamesScreenProps) {
  const [activeSection, setActiveSection] = useState<GameSection>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.22, y: 0.72 }}
        style={styles.backgroundGlow}
      />
      <HomeHeader compact notificationCount={notifications.length} onMenuPress={onOpenMenu} player={currentPlayer} />

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
                  variant="button"
                  weight="800"
                >
                  {section}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {activeSection === 'Find Games' ? (
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
  const [openFilterPanel, setOpenFilterPanel] = useState<OpenFilterPanel>(null);
  const [levelFromIndex, setLevelFromIndex] = useState(0);
  const [levelToIndex, setLevelToIndex] = useState(levelOptions.length - 1);
  const [genderFilter, setGenderFilter] = useState<GenderFilter | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);

  const hasLevelFilter = levelFromIndex !== 0 || levelToIndex !== levelOptions.length - 1;
  const isLocationActive = selectedFilter === 'Location' || selectedFilter === 'Nearby';
  const hasAnyFilter = hasLevelFilter || Boolean(genderFilter) || isLocationActive || showPrivate;
  const levelLabel = hasLevelFilter ? formatLevelRange(levelFromIndex, levelToIndex) : 'Rank';

  function resetFilters() {
    setSelectedFilter('All Games');
    setOpenFilterPanel(null);
    setLevelFromIndex(0);
    setLevelToIndex(levelOptions.length - 1);
    setGenderFilter(null);
    setShowPrivate(false);
  }

  function handleFilterPress(filter: FilterId) {
    if (filter === 'All Games') {
      resetFilters();
      return;
    }

    if (filter === 'Location') {
      setSelectedFilter(isLocationActive ? 'All Games' : 'Location');
      setOpenFilterPanel(null);
      return;
    }

    setSelectedFilter(filter);
    setOpenFilterPanel((current) => current === filter ? null : filter);
  }

  function getFilterLabel(filter: FilterId) {
    if (filter === 'Rank') {
      return levelLabel;
    }

    if (filter === 'Gender') {
      return genderFilter ?? 'Gender';
    }

    return filter;
  }

  function getFilterActive(filter: FilterId) {
    if (filter === 'All Games') {
      return !hasAnyFilter;
    }

    if (filter === 'Location') {
      return isLocationActive;
    }

    if (filter === 'Rank') {
      return openFilterPanel === 'Rank' || hasLevelFilter;
    }

    return openFilterPanel === 'Gender' || Boolean(genderFilter);
  }

  const visibleGameCards = gameCards.filter((game) => {
    const lobby = lobbies[game.lobbyIndex % Math.max(lobbies.length, 1)];

    return lobby ? isLobbyDiscoverable(lobby) : true;
  });

  return (
    <>
      <View style={styles.searchBox}>
        <Ionicons color={colors.accentSea} name="search" size={18} />
        <TextInput
          placeholder="Search beach, host, or game"
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterArea}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => {
            const isActive = getFilterActive(filter.id);

            return (
              <Pressable
                key={filter.id}
                accessibilityRole="button"
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleFilterPress(filter.id)}
              >
                <Ionicons
                  color={isActive ? colors.primaryDark : colors.muted}
                  name={filter.icon}
                  size={15}
                />
                <AppText
                  style={[styles.filterText, isActive && styles.filterTextActive]}
                  tone={isActive ? 'accent' : 'muted'}
                  variant="chip"
                  weight="700"
                >
                  {getFilterLabel(filter.id)}
                </AppText>
                {filter.suffix ? (
                  <Ionicons color={isActive ? colors.primaryDark : colors.muted} name="chevron-down" size={13} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {openFilterPanel === 'Rank' ? (
          <View style={styles.filterPopover}>
            <LevelRangePanel
              fromIndex={levelFromIndex}
              onFromChange={setLevelFromIndex}
              onToChange={setLevelToIndex}
              toIndex={levelToIndex}
            />
          </View>
        ) : null}

        {openFilterPanel === 'Gender' ? (
          <View style={[styles.filterPopover, styles.genderPopover]}>
            <GenderFilterPanel
              onSelect={(option) => {
                setGenderFilter(option);
                setOpenFilterPanel(null);
              }}
              selected={genderFilter}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.listHeader}>
        <View style={styles.listTitleRow}>
          <AppText style={styles.listTitle} variant="sectionHeading" weight="800">
            Open Games
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: showPrivate }}
          onPress={() => {
            setShowPrivate((current) => !current);
            setOpenFilterPanel(null);
          }}
          style={[styles.privateButton, showPrivate && styles.privateButtonActive]}
        >
          <Ionicons color={showPrivate ? colors.primaryDark : colors.muted} name="lock-closed-outline" size={12} />
          <AppText
            style={showPrivate && styles.privateButtonTextActive}
            tone={showPrivate ? 'accent' : 'muted'}
            variant="metadata"
            weight="700"
          >
            Show private
          </AppText>
        </Pressable>
      </View>

      <View style={styles.cardStack}>
        {visibleGameCards.map((game, index) => {
          const lobby = lobbies[game.lobbyIndex % Math.max(lobbies.length, 1)];

          return (
            <GameCard
              game={game}
              key={`${game.title}-${index}`}
              lobby={lobby}
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

function isLobbyDiscoverable(lobby: Lobby) {
  return lobby.status === 'open' || lobby.status === 'full';
}

function LevelRangePanel({
  fromIndex,
  onFromChange,
  onToChange,
  toIndex,
}: {
  fromIndex: number;
  onFromChange: (index: number) => void;
  onToChange: (index: number) => void;
  toIndex: number;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const currentFromIndex = useRef(fromIndex);
  const currentToIndex = useRef(toIndex);
  const trackWidthRef = useRef(trackWidth);
  const dragStartFromIndex = useRef(fromIndex);
  const dragStartToIndex = useRef(toIndex);
  const fromPercent = getLevelPercent(fromIndex);
  const toPercent = getLevelPercent(toIndex);
  currentFromIndex.current = fromIndex;
  currentToIndex.current = toIndex;
  trackWidthRef.current = trackWidth;
  const fromResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartFromIndex.current = currentFromIndex.current;
        },
        onPanResponderMove: (_event, gestureState) => {
          const availableTrackWidth = trackWidthRef.current;

          if (!availableTrackWidth) {
            return;
          }

          const stepWidth = availableTrackWidth / (levelOptions.length - 1);
          const nextIndex = clampLevelIndex(
            dragStartFromIndex.current + Math.round(gestureState.dx / stepWidth),
            0,
            currentToIndex.current,
          );

          if (nextIndex !== currentFromIndex.current) {
            onFromChange(nextIndex);
          }
        },
      }),
    [onFromChange],
  );
  const toResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartToIndex.current = currentToIndex.current;
        },
        onPanResponderMove: (_event, gestureState) => {
          const availableTrackWidth = trackWidthRef.current;

          if (!availableTrackWidth) {
            return;
          }

          const stepWidth = availableTrackWidth / (levelOptions.length - 1);
          const nextIndex = clampLevelIndex(
            dragStartToIndex.current + Math.round(gestureState.dx / stepWidth),
            currentFromIndex.current,
            levelOptions.length - 1,
          );

          if (nextIndex !== currentToIndex.current) {
            onToChange(nextIndex);
          }
        },
      }),
    [onToChange],
  );

  function handleTrackLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.filterPanel}>
      <View style={styles.panelHeader}>
        <AppText tone="primary" variant="metadata" weight="800">
          Rank range
        </AppText>
        <AppText tone="muted" variant="metadata" weight="700">
          {formatLevelRange(fromIndex, toIndex)}
        </AppText>
      </View>

      <View onLayout={handleTrackLayout} style={styles.levelBar}>
        <View style={styles.levelTrackLine} />
        <View pointerEvents="none" style={styles.levelTicks}>
          {levelOptions.map((level) => (
            <View key={level} style={styles.levelTick} />
          ))}
        </View>
        <View
          style={[
            styles.levelTrackFill,
            {
              left: `${fromPercent}%`,
              right: `${100 - toPercent}%`,
            },
          ]}
        />
        <View {...fromResponder.panHandlers} style={[styles.levelThumbTouchArea, { left: `${fromPercent}%` }]}>
          <View style={styles.levelThumb} />
        </View>
        <View {...toResponder.panHandlers} style={[styles.levelThumbTouchArea, { left: `${toPercent}%` }]}>
          <View style={[styles.levelThumb, styles.levelThumbRight]} />
        </View>
      </View>
    </View>
  );
}

function GenderFilterPanel({
  onSelect,
  selected,
}: {
  onSelect: (option: GenderFilter) => void;
  selected: GenderFilter | null;
}) {
  return (
    <View style={styles.filterPanel}>
      <View style={styles.genderOptions}>
        {genderOptions.map((option) => {
          const isSelected = selected === option;

          return (
            <Pressable
              accessibilityRole="button"
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.genderOption, isSelected && styles.genderOptionActive]}
            >
              <AppText
                align="center"
                style={isSelected && styles.genderOptionTextActive}
                tone={isSelected ? 'accent' : 'primary'}
                variant="chip"
                weight="800"
              >
                {option}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MyGamesView({ lobbies, onOpenLobby }: { lobbies: Lobby[]; onOpenLobby: (lobby: Lobby) => void }) {
  return (
    <View style={styles.myGamesContent}>
      <GameHistorySection
        countLabel="2 active"
        games={[
          { ...gameCards[0], actionLabel: 'Open game', imageBadgeLabel: 'Admin', statusLabel: 'Admin', statusTone: 'lime' },
          { ...gameCards[3], actionLabel: 'Open game', imageBadgeLabel: 'Player', statusLabel: 'Waitlist', statusTone: 'gold' },
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
          <AppText style={styles.listTitle} variant="sectionHeading" weight="800">
            {title}
          </AppText>
          <AppText tone="muted" variant="metadata" weight="600">
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

function GameCard({ game, lobby, onPress }: { game: GameListItem; lobby?: Lobby; onPress: () => void }) {
  const currentParticipant = lobby ? getCurrentPlayerParticipant(lobby) : undefined;
  const statusBadgeLabel =
    currentParticipant?.role === 'admin'
      ? 'Admin'
      : currentParticipant && isActiveLobbyParticipant(currentParticipant)
        ? 'Joined'
        : game.spotsLeft;
  const statusBadgeTone = currentParticipant && isActiveLobbyParticipant(currentParticipant) ? 'green' : 'yellow';

  return (
    <NearbyGameCard
      actionLabel="Open game"
      audience={game.audience}
      distance={game.distance}
      level={game.level}
      location={game.location}
      onPress={onPress}
      players={formatPlayersCount(game.players)}
      spotsLeft={statusBadgeLabel}
      spotsTone={statusBadgeTone}
      status="Approval"
      time={game.startsAt}
      title={game.title}
      variant={getNearbyVariant(game)}
    />
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
                <AppText align="center" tone="primary" variant="caption" weight="800">
                  {initial}
                </AppText>
              </View>
            ))}
          </View>

          <View style={styles.playersPill}>
            <Ionicons color={colors.muted} name="people-outline" size={12} />
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
        <Ionicons color={colors.muted} name="chevron-forward" size={19} />
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
  const isFinished = game.statusTone === 'muted';

  return (
    <NearbyGameCard
      actionLabel={isFinished ? 'Finished' : game.actionLabel}
      actionTone={isFinished ? 'muted' : game.actionLabel === 'Rate players' ? 'warning' : 'accent'}
      audience={game.audience}
      distance={game.distance}
      level={game.level}
      location={game.location}
      onPress={isFinished ? undefined : onPress}
      players={formatPlayersCount(game.players)}
      spotsLeft={game.imageBadgeLabel ?? game.statusLabel}
      status={game.statusTone === 'muted' ? 'Full' : 'Approval'}
      time={game.startsAt}
      title={game.title}
      variant={getNearbyVariant(game)}
    />
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
          : 'primary';

  return (
    <View style={styles.thumbnail}>
      <BeachGameVisual compact variant={game.audience === 'Women' ? 'sunset' : game.level === 'A+' ? 'morning' : 'aqua'} />
      <View style={[styles.spotsBadge, badgeStyle]}>
        <AppText style={styles.spotsText} tone={badgeTextTone} variant="chip" weight="800">
          {visibleBadgeLabel}
        </AppText>
      </View>
    </View>
  );
}

function getNearbyVariant(game: GameListItem): 'morning' | 'sunset' {
  return game.audience === 'Women' || game.startsAt.toLowerCase().includes('19:') ? 'sunset' : 'morning';
}

function formatPlayersCount(playersLabel: string) {
  return playersLabel.replace(/\s*players$/i, '').trim();
}

function getCurrentPlayerParticipant(lobby: Lobby) {
  return lobby.participants.find((participant) => participant.playerId === currentPlayer.id && participant.status === 'approved');
}

function isActiveLobbyParticipant(participant: Lobby['participants'][number]) {
  return participant.role === 'admin' || participant.role === 'joined' || participant.role === 'substitute';
}

function formatLevelRange(fromIndex: number, toIndex: number) {
  const from = levelOptions[fromIndex];
  const to = levelOptions[toIndex];

  return from === to ? from : `${from}/${to}`;
}

function getLevelPercent(index: number) {
  return (index / (levelOptions.length - 1)) * 100;
}

function clampLevelIndex(index: number, min: number, max: number) {
  return Math.min(Math.max(index, min), max);
}

const styles = StyleSheet.create({
  audienceText: {
    maxWidth: 54,
  },
  backgroundGlow: {
    height: 430,
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
    gap: 12,
  },
  content: {
    gap: 14,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  extraAvatar: {
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
  },
  filterArea: {
    position: 'relative',
    zIndex: 20,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 34,
    paddingHorizontal: 6,
  },
  filterChipActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  filterRow: {
    gap: 4,
    justifyContent: 'space-between',
    minWidth: '100%',
  },
  filterText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  filterTextActive: {
    color: colors.accentLime,
  },
  filterPanel: {
    backgroundColor: 'rgba(234, 245, 236, 0.9)',
    borderColor: 'rgba(36, 196, 90, 0.18)',
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    shadowColor: '#123B2A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 4,
  },
  filterPopover: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 42,
    zIndex: 30,
  },
  gameCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 142,
    overflow: 'hidden',
    padding: 9,
  },
  gameTitle: {
    color: colors.ink,
  },
  genderPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  finishedDot: {
    backgroundColor: colors.subtle,
  },
  genderOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  genderOptionActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderOptionTextActive: {
    color: colors.accentLime,
  },
  genderPopover: {
    left: 0,
    right: 0,
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
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  listTitle: {
    color: colors.ink,
  },
  listTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelBar: {
    height: 34,
    justifyContent: 'center',
    marginHorizontal: 11,
    position: 'relative',
  },
  levelThumb: {
    backgroundColor: colors.primary,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  levelThumbRight: {
    backgroundColor: colors.accentGoldDark,
  },
  levelThumbTouchArea: {
    alignItems: 'center',
    cursor: 'pointer',
    height: 34,
    justifyContent: 'center',
    marginLeft: -17,
    position: 'absolute',
    width: 34,
    zIndex: 3,
  },
  levelTick: {
    backgroundColor: 'rgba(21, 153, 71, 0.26)',
    borderRadius: radius.round,
    height: 8,
    width: 2,
  },
  levelTicks: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 12,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  levelTrackFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 5,
    position: 'absolute',
    zIndex: 1,
  },
  levelTrackLine: {
    backgroundColor: 'rgba(216, 232, 212, 0.9)',
    borderRadius: radius.round,
    height: 5,
  },
  liveDot: {
    backgroundColor: colors.primary,
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
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  myCardActionMuted: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  myCardActionWarning: {
    backgroundColor: colors.accent,
  },
  myActionStack: {
    alignItems: 'stretch',
    gap: 6,
    width: '100%',
  },
  myCardBody: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  myCardFooter: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: 8,
    minHeight: 70,
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
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.74)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 156,
    overflow: 'hidden',
    padding: 12,
    ...shadows.soft,
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  myPlayersPill: {
    alignItems: 'center',
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    borderRadius: radius.round,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 4,
    minHeight: 22,
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  myPlayersText: {
    fontSize: 10,
    lineHeight: 13,
  },
  netLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    bottom: 35,
    height: 2,
    left: 12,
    position: 'absolute',
    right: 12,
    transform: [{ rotate: '-7deg' }],
  },
  palmLine: {
    backgroundColor: 'rgba(18, 59, 42, 0.48)',
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
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    borderRadius: radius.round,
    borderWidth: 0,
    flexDirection: 'row',
    gap: 4,
    minHeight: 24,
    paddingHorizontal: 0,
  },
  playersText: {
    fontSize: 10,
    lineHeight: 13,
  },
  privateButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    flexShrink: 0,
    minHeight: 28,
    paddingHorizontal: 8,
  },
  privateButtonActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  privateButtonTextActive: {
    color: colors.accentLime,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    minHeight: '100%',
  },
  sectionTab: {
    alignItems: 'center',
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.lg,
  },
  sectionTabActive: {
    backgroundColor: colors.surfaceMuted,
  },
  sectionTabs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    ...shadows.soft,
  },
  sectionTabText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTabTextActive: {
    color: colors.accentLime,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 47,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  searchInput: {
    color: colors.ink,
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
    borderColor: colors.surface,
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
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderWidth: 1,
  },
  spotsBadgeGoldSoft: {
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderWidth: 1,
  },
  spotsBadgeLime: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  spotsBadgeMuted: {
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  statusBadgeMuted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    height: 106,
    overflow: 'hidden',
    position: 'relative',
    width: 104,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 35,
    justifyContent: 'center',
    width: 38,
  },
});
