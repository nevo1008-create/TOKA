import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BeachGameVisual } from '../components/home/BeachGameVisual';
import { HomeHeader } from '../components/home/HomeHeader';
import { LobbyImageBadge } from '../components/LobbyImageBadge';
import { NearbyGameCard } from '../components/home/NearbyGameCard';
import { formatRankRange, getRankIndex, rankOptions, RankRangeBar } from '../components/RankRangeBar';
import { israelBeaches, israelLocations, israelPlaces } from '../data/israelPlaces';
import { formatLobbyStart, getEffectiveLobbyStatus, isEveningLobbyStart, isLobbyReadyForRatings } from '../features/lobbies/lobbyDateTime';
import { getLobbyMembershipBadgeLabel, getLobbyMembershipStatusLabel, isLobbyHost, lobbyLabels } from '../features/lobbies/lobbyLabels';
import { getAutoCancelCountdownLabel, getMatchParticipantIds } from '../features/lobbies/lobbyLifecycle';
import { useLifecycleClock } from '../features/lobbies/useLifecycleClock';
import { getJoinedParticipants, isJoinedParticipant } from '../features/lobbies/lobbyRules';
import { getRemainingRatingTargetIds, shouldShowRatingLobby } from '../features/ratings/ratingRules';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { Lobby, Location, Player, PlayerLevel, RatingTask } from '../types';

type GamesScreenProps = {
  currentPlayer: Player;
  initialSection?: GameSection;
  lobbies: Lobby[];
  notificationCount: number;
  onBack: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  hasPrivateAccess: (lobbyId: string) => boolean;
  onOpenLobby: (lobby: Lobby) => void;
  players: Player[];
  ratingTasks: RatingTask[];
  selectedFilter: string;
  onSectionChange: (section: GameSection) => void;
  setSelectedFilter: (filter: string) => void;
};

type FilterId = 'All Games' | 'Location' | 'Rank' | 'Gender';
type OpenFilterPanel = 'Location' | 'Rank' | 'Gender' | null;
type GenderFilter = 'Everyone' | 'Male' | 'Female';

type GameListItem = {
  actionLabel?: string;
  actionTone?: 'accent' | 'muted' | 'warning';
  audience: string;
  avatars: string[];
  badgeLabel?: string;
  badgeTone?: 'goldSoft' | 'lime';
  distance: string;
  gradient: readonly [string, string, string];
  level: string;
  lobbyId?: string;
  lobbyIndex: number;
  location: string;
  metaTag?: string;
  actionDisabled?: boolean;
  players: string;
  secondarySpotsLeft?: string;
  secondarySpotsTone?: 'green' | 'red' | 'yellow';
  spotsLeft: string;
  spotsTone?: 'green' | 'red' | 'yellow';
  startsAt: string;
  title: string;
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const filters: Array<{ id: FilterId; icon: keyof typeof Ionicons.glyphMap; suffix?: boolean }> = [
  { id: 'All Games', icon: 'football-outline' },
  { id: 'Location', icon: 'navigate-outline', suffix: true },
  { id: 'Rank', icon: 'options-outline', suffix: true },
  { id: 'Gender', icon: 'male-female-outline', suffix: true },
];

const levelOptions = rankOptions;
const genderOptions: GenderFilter[] = ['Everyone', 'Male', 'Female'];
const areaFilterLocations: Location[] = [
  { area: 'Central', city: 'Area', description: 'area_filter', id: 'area-central', name: 'Central' },
  { area: 'North', city: 'Area', description: 'area_filter', id: 'area-north', name: 'North' },
  { area: 'South', city: 'Area', description: 'area_filter', id: 'area-south', name: 'South' },
];

const gameSections = ['Find Games', 'My Games'] as const;
type GameSection = (typeof gameSections)[number];

export function getLobbyImageUrl(index: number) {
  return `gradient-placeholder-${index}`;
}

export function GamesScreen({
  currentPlayer,
  initialSection = 'Find Games',
  lobbies,
  notificationCount,
  hasPrivateAccess,
  onOpenMenu,
  onOpenNotifications,
  onOpenLobby,
  players,
  ratingTasks,
  selectedFilter,
  onSectionChange,
  setSelectedFilter,
}: GamesScreenProps) {
  useLifecycleClock();
  const [activeSection, setActiveSection] = useState<GameSection>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  function selectSection(section: GameSection) {
    setActiveSection(section);
    onSectionChange(section);
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.22, y: 0.72 }}
        style={styles.backgroundGlow}
      />
      <HomeHeader
        compact
        notificationCount={notificationCount}
        onMenuPress={onOpenMenu}
        onNotificationsPress={onOpenNotifications}
        player={currentPlayer}
      />

      <View style={styles.content}>
        <View style={styles.sectionTabs}>
          {gameSections.map((section) => {
            const isActive = activeSection === section;

            return (
              <Pressable
                accessibilityRole="button"
                key={section}
                onPress={() => selectSection(section)}
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
            currentPlayer={currentPlayer}
            lobbies={lobbies}
            hasPrivateAccess={hasPrivateAccess}
            onOpenLobby={onOpenLobby}
            players={players}
            selectedFilter={selectedFilter}
            setSelectedFilter={setSelectedFilter}
          />
        ) : (
          <MyGamesView
            currentPlayer={currentPlayer}
            lobbies={lobbies}
            onOpenLobby={onOpenLobby}
            players={players}
            ratingTasks={ratingTasks}
          />
        )}
      </View>
    </View>
  );
}

function SearchGamesView({
  currentPlayer,
  lobbies,
  hasPrivateAccess,
  onOpenLobby,
  players,
  selectedFilter,
  setSelectedFilter,
}: {
  currentPlayer: Player;
  lobbies: Lobby[];
  hasPrivateAccess: (lobbyId: string) => boolean;
  onOpenLobby: (lobby: Lobby) => void;
  players: Player[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
}) {
  const [openFilterPanel, setOpenFilterPanel] = useState<OpenFilterPanel>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [levelFromIndex, setLevelFromIndex] = useState(0);
  const [levelToIndex, setLevelToIndex] = useState(levelOptions.length - 1);
  const [genderFilter, setGenderFilter] = useState<GenderFilter | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const locationOptions = useMemo(() => getLocationOptions(lobbies), [lobbies]);
  const selectedLocation = selectedLocationId
    ? locationOptions.find((location) => location.id === selectedLocationId) ?? null
    : null;

  const hasLevelFilter = levelFromIndex !== 0 || levelToIndex !== levelOptions.length - 1;
  const isLocationActive = Boolean(selectedLocationId);
  const hasSearchQuery = Boolean(searchQuery.trim());
  const hasAnyFilter = hasSearchQuery || hasLevelFilter || Boolean(genderFilter) || isLocationActive;
  const levelLabel = hasLevelFilter ? formatLevelRange(levelFromIndex, levelToIndex) : 'Rank';
  const locationLabel = selectedLocation ? selectedLocation.name : 'Location';

  function resetFilters() {
    setSelectedFilter('All Games');
    setOpenFilterPanel(null);
    setSearchQuery('');
    setSelectedLocationId(null);
    setLevelFromIndex(0);
    setLevelToIndex(levelOptions.length - 1);
    setGenderFilter(null);
  }

  function handleFilterPress(filter: FilterId) {
    if (filter === 'All Games') {
      resetFilters();
      return;
    }

    if (filter === 'Location') {
      setSelectedFilter('Location');
      setOpenFilterPanel((current) => current === 'Location' ? null : 'Location');
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

    if (filter === 'Location') {
      return locationLabel;
    }

    return filter;
  }

  function getFilterActive(filter: FilterId) {
    if (filter === 'All Games') {
      return !hasAnyFilter;
    }

    if (filter === 'Location') {
      return openFilterPanel === 'Location' || isLocationActive;
    }

    if (filter === 'Rank') {
      return openFilterPanel === 'Rank' || hasLevelFilter;
    }

    return openFilterPanel === 'Gender' || Boolean(genderFilter);
  }

  const visibleGameCards = useMemo(
    () =>
      getUniqueLobbies(lobbies)
        .map((lobby, originalIndex) => ({ lobby, originalIndex }))
        .filter(({ lobby }) => isLobbyDiscoverable(lobby))
        .filter(({ lobby }) =>
          doesLobbyMatchDiscoveryFilters(
            lobby,
            {
              genderFilter,
              levelFromIndex,
              levelToIndex,
              searchQuery,
              selectedLocation,
              showPrivate,
              currentPlayerId: currentPlayer.id,
            },
            players,
          ),
        )
        .sort(
          (left, right) =>
            getFindGamesSortPriority(left.lobby, currentPlayer.id) -
              getFindGamesSortPriority(right.lobby, currentPlayer.id) ||
            getLobbyStartTime(left.lobby) - getLobbyStartTime(right.lobby) ||
            left.originalIndex - right.originalIndex,
        )
        .map(({ lobby, originalIndex }) => getGameCardFromLobby(lobby, originalIndex, currentPlayer.id, players)),
    [currentPlayer.id, genderFilter, levelFromIndex, levelToIndex, lobbies, players, searchQuery, selectedLocation, showPrivate],
  );

  function closeOpenFilterPanel() {
    setOpenFilterPanel(null);
  }

  return (
    <View style={styles.searchGamesBody}>
      <View style={styles.searchBox}>
        <Ionicons color={colors.accentSea} name="search" size={18} />
        <TextInput
          onFocus={closeOpenFilterPanel}
          onChangeText={setSearchQuery}
          placeholder="Search host, game, or match name"
          placeholderTextColor={colors.subtle}
          style={styles.searchInput}
          value={searchQuery}
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
              onClose={closeOpenFilterPanel}
              onFromChange={setLevelFromIndex}
              onReset={() => {
                setLevelFromIndex(0);
                setLevelToIndex(levelOptions.length - 1);
              }}
              onToChange={setLevelToIndex}
              toIndex={levelToIndex}
            />
          </View>
        ) : null}

        {openFilterPanel === 'Location' ? (
          <View style={styles.filterPopover}>
            <LocationFilterPanel
              currentPlayerArea={currentPlayer.area}
              locations={locationOptions}
              onSelect={(locationId) => {
                setSelectedLocationId(locationId);
                setSelectedFilter(locationId ? 'Location' : 'All Games');
                setOpenFilterPanel(null);
              }}
              selectedLocationId={selectedLocationId}
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

      {openFilterPanel ? (
        <Pressable
          accessibilityLabel="Close filter menu"
          accessibilityRole="button"
          onPress={closeOpenFilterPanel}
          style={styles.filterDismissLayer}
        />
      ) : null}

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
        {visibleGameCards.length > 0 ? visibleGameCards.map((game, index) => {
          const lobby = getGameLobby(lobbies, game);

          return (
            <GameCard
              currentPlayerId={currentPlayer.id}
              game={game}
              hasPrivateAccess={lobby ? hasPrivateAccess(lobby.id) : false}
              key={game.lobbyId ?? `${game.title}-${index}`}
              lobby={lobby}
              onPress={() => {
                if (lobby) {
                  onOpenLobby(lobby);
                }
              }}
            />
          );
        }) : (
          <EmptyState
            icon="search-outline"
            title="No matches yet"
            body={hasAnyFilter ? 'Try clearing a filter or searching another beach, host, or match.' : 'New open matches will appear here when hosts create them.'}
          />
        )}
      </View>
    </View>
  );
}

function isLobbyDiscoverable(lobby: Lobby) {
  const status = getEffectiveLobbyStatus(lobby);

  return lobby.participants.length > 0 && (status === 'open' || status === 'full' || status === 'closing_soon');
}

function getFindGamesSortPriority(lobby: Lobby, currentPlayerId: string) {
  const currentParticipant = getCurrentPlayerAnyParticipant(lobby, currentPlayerId);

  if (isLobbyHost(lobby, currentPlayerId, currentParticipant)) {
    return 0;
  }

  if (currentParticipant) {
    return 1;
  }

  if (lobby.joinRequests.some((request) => request.playerId === currentPlayerId && request.status === 'pending')) {
    return 2;
  }

  return 3;
}

function LevelRangePanel({
  fromIndex,
  onClose,
  onFromChange,
  onReset,
  onToChange,
  toIndex,
}: {
  fromIndex: number;
  onClose: () => void;
  onFromChange: (index: number) => void;
  onReset: () => void;
  onToChange: (index: number) => void;
  toIndex: number;
}) {
  const isAllRanks = fromIndex === 0 && toIndex === levelOptions.length - 1;

  return (
    <View style={[styles.filterPanel, styles.rankFilterPanel]}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.panelHeader}>
        <AppText tone="primary" variant="metadata" weight="800">
          Rank range
        </AppText>
        <AppText tone="muted" variant="metadata" weight="700">
          {formatRankRange(fromIndex, toIndex)}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isAllRanks }}
        onPress={() => {
          onReset();
          onClose();
        }}
        style={[styles.rankResetButton, isAllRanks && styles.rankResetButtonActive]}
      >
        <AppText tone={isAllRanks ? 'accent' : 'muted'} variant="caption" weight="800">
          All ranks
        </AppText>
      </Pressable>

      <RankRangeBar
        fromIndex={fromIndex}
        labelTapMode="exact"
        onFromChange={onFromChange}
        onToChange={onToChange}
        toIndex={toIndex}
      />
    </View>
  );
}

function GenderFilterPanel({
  onSelect,
  selected,
}: {
  onSelect: (option: GenderFilter | null) => void;
  selected: GenderFilter | null;
}) {
  return (
    <View style={[styles.filterPanel, styles.genderFilterPanel]}>
      <View style={styles.genderOptions}>
        {genderOptions.map((option) => {
          const isSelected = selected === option;

          return (
            <Pressable
              accessibilityRole="button"
              key={option}
              onPress={() => onSelect(isSelected ? null : option)}
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

function LocationFilterPanel({
  currentPlayerArea,
  locations,
  onSelect,
  selectedLocationId,
}: {
  currentPlayerArea: string;
  locations: Location[];
  onSelect: (locationId: string | null) => void;
  selectedLocationId: string | null;
}) {
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const trimmedQuery = locationSearchQuery.trim();
  const recommendedLocations = useMemo(
    () => getRecommendedLocationOptions(currentPlayerArea, locations, 5),
    [currentPlayerArea, locations],
  );
  const searchedLocations = useMemo(
    () => getSearchedLocationOptions(trimmedQuery, locations),
    [locations, trimmedQuery],
  );
  const visibleLocations = trimmedQuery ? searchedLocations : recommendedLocations;
  const sectionTitle = trimmedQuery ? 'Search results' : 'Recommended near your area';

  return (
    <View style={styles.filterPanel}>
      <View style={styles.locationOptions}>
        <View style={styles.locationSearchBox}>
          <Ionicons color={colors.accentSea} name="search" size={16} />
          <TextInput
            onChangeText={setLocationSearchQuery}
            placeholder="Search city, area, or beach"
            placeholderTextColor={colors.subtle}
            style={styles.locationSearchInput}
            value={locationSearchQuery}
          />
          {trimmedQuery ? (
            <Pressable
              accessibilityLabel="Clear location search"
              accessibilityRole="button"
              onPress={() => setLocationSearchQuery('')}
              style={styles.locationSearchClear}
            >
              <Ionicons color={colors.muted} name="close" size={14} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.areaFilterRow}>
          {areaFilterLocations.map((areaLocation) => {
            const isSelected = selectedLocationId === areaLocation.id;

            return (
              <Pressable
                accessibilityRole="button"
                key={areaLocation.id}
                onPress={() => onSelect(isSelected ? null : areaLocation.id)}
                style={[styles.areaFilterOption, isSelected && styles.areaFilterOptionActive]}
              >
                <AppText
                  style={isSelected && styles.locationOptionTextActive}
                  tone={isSelected ? 'accent' : 'muted'}
                  variant="caption"
                  weight="800"
                >
                  {areaLocation.name}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.locationSectionHeader}>
          <AppText tone="muted" variant="caption" weight="800">
            {sectionTitle}
          </AppText>
          {!trimmedQuery ? (
            <AppText tone="muted" variant="caption" weight="600">
              Top 5
            </AppText>
          ) : null}
        </View>

        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={visibleLocations.length > 4}
          style={styles.locationResultsList}
        >
          <View style={styles.locationResultsContent}>
            {visibleLocations.length > 0 ? visibleLocations.map((location) => {
              const isSelected = selectedLocationId === location.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={location.id}
                  onPress={() => onSelect(isSelected ? null : location.id)}
                  style={[styles.locationOption, isSelected && styles.locationOptionActive]}
                >
                  <AppText
                    style={isSelected && styles.locationOptionTextActive}
                    tone={isSelected ? 'accent' : 'primary'}
                    variant="chip"
                    weight="800"
                  >
                    {location.name}
                  </AppText>
                  <AppText tone="muted" variant="caption" weight="600">
                    {getLocationOptionSubtitle(location)}
                  </AppText>
                </Pressable>
              );
            }) : (
              <View style={styles.locationEmptyState}>
                <AppText tone="muted" variant="caption" weight="700">
                  No beaches found
                </AppText>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function MyGamesView({
  currentPlayer,
  lobbies,
  onOpenLobby,
  players,
  ratingTasks,
}: {
  currentPlayer: Player;
  lobbies: Lobby[];
  onOpenLobby: (lobby: Lobby) => void;
  players: Player[];
  ratingTasks: RatingTask[];
}) {
  const uniqueLobbies = getUniqueLobbies(lobbies);
  const activeGames = uniqueLobbies
    .filter((lobby) => isActiveLobbyVisibleToCurrentPlayer(lobby, currentPlayer.id))
    .sort((left, right) => getLobbyStartTime(left) - getLobbyStartTime(right))
    .map((lobby, index) => {
      const participant = getCurrentPlayerAnyParticipant(lobby, currentPlayer.id);
      const pendingRequest = getCurrentPlayerPendingRequest(lobby, currentPlayer.id);
      const imageBadgeLabel = pendingRequest && !participant
        ? lobbyLabels.accessRequested
        : getLobbyMembershipBadgeLabel(lobby, currentPlayer.id, participant);
      const secondarySpotsLeft = isPrivateLobby(lobby) && (participant || pendingRequest)
        ? 'Private'
        : undefined;

      return {
        ...getGameCardFromLobby(lobby, index, currentPlayer.id, players),
        actionLabel: getActiveGameActionLabel(lobby),
        imageBadgeLabel,
        requestStatusLabel: undefined,
        secondarySpotsLeft,
        statusLabel: getActiveGameStatusLabel(lobby, currentPlayer.id, participant),
        statusTone: getActiveGameStatusTone(lobby, participant),
      };
    });
  const finishedGames = uniqueLobbies
    .filter((lobby) => isFinishedLobbyVisibleToCurrentPlayer(lobby, currentPlayer.id))
    .sort((left, right) => getLobbyStartTime(right) - getLobbyStartTime(left))
    .map((lobby, index) => {
      const ratingState = getFinishedGameRatingState(lobby, currentPlayer.id, ratingTasks);

      return {
        ...getGameCardFromLobby(lobby, index, currentPlayer.id, players),
        actionDisabled: ratingState.actionDisabled,
        actionLabel: ratingState.actionLabel,
        statusLabel: ratingState.statusLabel,
        statusTone: ratingState.statusTone,
      };
    });

  return (
    <View style={styles.myGamesContent}>
      <GameHistorySection
        countLabel={`${activeGames.length} active`}
        games={activeGames}
        lobbies={lobbies}
        onOpenLobby={onOpenLobby}
        title="Joined Games"
      />

      <GameHistorySection
        countLabel={`${finishedGames.length} finished`}
        games={finishedGames}
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
  games: Array<GameListItem & { actionDisabled?: boolean; actionLabel: string; imageBadgeLabel?: string; requestStatusLabel?: string; secondarySpotsLeft?: string; statusLabel: string; statusTone: 'gold' | 'lime' | 'muted' }>;
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
        {games.length > 0 ? games.map((game, index) => {
          const lobby = getGameLobby(lobbies, game);

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
        }) : (
          <EmptyState
            icon={title === 'Joined Games' ? 'calendar-outline' : 'checkmark-done-outline'}
            title={title === 'Joined Games' ? 'No joined matches' : 'No finished matches'}
            body={title === 'Joined Games' ? 'Matches you host, join, or waitlist for will appear here.' : 'Completed matches and rating windows will appear here.'}
          />
        )}
      </View>
    </View>
  );
}

function GameCard({
  currentPlayerId,
  game,
  hasPrivateAccess: hasVerifiedPrivateAccess,
  lobby,
  onPress,
}: {
  currentPlayerId: string;
  game: GameListItem;
  hasPrivateAccess: boolean;
  lobby?: Lobby;
  onPress: () => void;
}) {
  const currentParticipant = lobby ? getCurrentPlayerAnyParticipant(lobby, currentPlayerId) : undefined;
  const pendingRequest = lobby?.joinRequests.find(
    (request) => request.playerId === currentPlayerId && request.status === 'pending',
  );
  const hasPrivateAccess = Boolean(
    lobby &&
      isPrivateLobby(lobby) &&
      (hasVerifiedPrivateAccess || currentParticipant || pendingRequest),
  );
  const isLockedPrivateLobby = Boolean(lobby && isPrivateLobby(lobby) && !hasPrivateAccess);
  const shouldShowPrivateBadge = Boolean(
    lobby && isPrivateLobby(lobby) && hasPrivateAccess,
  );
  const imageBadgeLabel = pendingRequest && !currentParticipant
    ? lobbyLabels.accessRequested
    : lobby
    ? getLobbyMembershipBadgeLabel(lobby, currentPlayerId, currentParticipant) ?? (isLockedPrivateLobby ? 'Private' : game.spotsLeft)
    : game.spotsLeft;
  const hasJoinedStatus = Boolean(currentParticipant);
  const statusBadgeTone = hasJoinedStatus ? 'green' : isLockedPrivateLobby ? 'red' : 'yellow';

  return (
    <NearbyGameCard
      actionLabel={isLockedPrivateLobby ? 'Enter PIN' : lobbyLabels.viewMatch}
      actionTone={isLockedPrivateLobby ? 'warning' : 'accent'}
      audience={game.audience}
      distance={game.distance}
      level={game.level}
      location={game.location}
      onActionPress={onPress}
      onPress={isLockedPrivateLobby ? undefined : onPress}
      players={formatPlayersCount(game.players)}
      requestStatusLabel={undefined}
      secondarySpotsLeft={shouldShowPrivateBadge ? 'Private' : undefined}
      secondarySpotsTone="red"
      spotsLeft={imageBadgeLabel}
      spotsTone={statusBadgeTone}
      status="Approval"
      time={formatLobbyStart(game.startsAt)}
      title={game.title}
      variant={getNearbyVariant(game)}
    />
  );
}

function EmptyState({
  body,
  icon,
  title,
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.primaryDark} name={icon} size={20} />
      </View>
      <View style={styles.emptyCopy}>
        <AppText align="center" tone="primary" variant="titleSmall" weight="800">
          {title}
        </AppText>
        <AppText align="center" style={styles.emptyText} tone="muted" variant="bodySmall" weight="600">
          {body}
        </AppText>
      </View>
    </View>
  );
}

function getGameLobby(lobbies: Lobby[], game: GameListItem) {
  return game.lobbyId
    ? lobbies.find((lobby) => lobby.id === game.lobbyId)
    : lobbies[game.lobbyIndex % Math.max(lobbies.length, 1)];
}

function getLobbyStartTime(lobby: Lobby) {
  const startsAtTime = new Date(lobby.startsAt).getTime();

  return Number.isNaN(startsAtTime) ? Number.MAX_SAFE_INTEGER : startsAtTime;
}

function getUniqueLobbies(lobbies: Lobby[]) {
  const lobbyKeys = new Set<string>();

  return lobbies.filter((lobby) => {
    const lobbyKey = getLobbyDedupeKey(lobby);

    if (lobbyKeys.has(lobbyKey)) {
      return false;
    }

    lobbyKeys.add(lobbyKey);
    return true;
  });
}

function getLobbyDedupeKey(lobby: Lobby) {
  return [
    normalizeSearchText(lobby.title),
    normalizeSearchText(lobby.location.name),
    normalizeSearchText(lobby.location.city),
    lobby.adminId,
  ].join('|');
}

function getLocationOptions(lobbies: Lobby[]) {
  const locationsByKey = new Map<string, Location>();

  areaFilterLocations.forEach((location) => locationsByKey.set(getLocationDedupeKey(location), location));
  israelPlaces.forEach((location) => locationsByKey.set(getLocationDedupeKey(location), location));
  lobbies.forEach((lobby) => {
    const locationKey = getLocationDedupeKey(lobby.location);

    if (!locationsByKey.has(locationKey)) {
      locationsByKey.set(locationKey, lobby.location);
    }
  });

  return Array.from(locationsByKey.values()).sort((left, right) =>
    `${left.city} ${left.name}`.localeCompare(`${right.city} ${right.name}`),
  );
}

function getLocationOptionSubtitle(location: Location) {
  return isAreaFilterLocation(location) ? `All ${location.area} games` : `${location.city}, ${location.area}`;
}

function getRecommendedLocationOptions(playerArea: string, locations: Location[], limit: number) {
  const playerCoordinates = getPlayerAreaCoordinates(playerArea);

  if (playerCoordinates) {
    return locations
      .map((location) => ({
        distanceKm: getLocationDistanceKm(location, playerCoordinates),
        location,
      }))
      .sort((left, right) =>
        left.distanceKm - right.distanceKm ||
        `${left.location.city} ${left.location.name}`.localeCompare(`${right.location.city} ${right.location.name}`),
      )
      .slice(0, limit)
      .map((item) => item.location);
  }

  const scoredLocations = locations
    .map((location) => ({
      location,
      score: getLocationRecommendationScore(location, playerArea),
    }))
    .sort((left, right) =>
      right.score - left.score ||
      `${left.location.city} ${left.location.name}`.localeCompare(`${right.location.city} ${right.location.name}`),
    );
  const preferredLocations = scoredLocations.filter((item) => item.score > 0).map((item) => item.location);
  const fallbackLocations = scoredLocations.filter((item) => item.score === 0).map((item) => item.location);

  return [...preferredLocations, ...fallbackLocations].slice(0, limit);
}

function getPlayerAreaCoordinates(playerArea: string): Coordinates | null {
  const normalizedPlayerArea = normalizeSearchText(playerArea);

  if (!normalizedPlayerArea) {
    return null;
  }

  const matchedLocation = israelLocations
    .map((location) => {
      const aliasScore = Math.max(
        ...getAreaSearchValues(location.area).map((alias) => getTextMatchScore(alias, normalizedPlayerArea)),
        ...location.aliases.map((alias) => getTextMatchScore(alias, normalizedPlayerArea)),
        0,
      );

      return {
        location,
        score: Math.max(
          getWeightedTextMatchScore(location.city, normalizedPlayerArea, 30),
          getWeightedTextMatchScore(location.displayName, normalizedPlayerArea, 20),
          getWeightedTextMatchScore(location.area, normalizedPlayerArea, 8),
          aliasScore,
        ),
      };
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.location.displayName.localeCompare(right.location.displayName))[0]?.location;

  return matchedLocation
    ? {
        latitude: matchedLocation.latitude,
        longitude: matchedLocation.longitude,
      }
    : null;
}

function getLocationDistanceKm(location: Location, fromCoordinates: Coordinates) {
  const locationCoordinates = getLocationCoordinates(location);

  return locationCoordinates ? getDistanceKm(fromCoordinates, locationCoordinates) : Number.MAX_SAFE_INTEGER;
}

function getLocationCoordinates(location: Location): Coordinates | null {
  if (isAreaFilterLocation(location)) {
    return null;
  }

  const normalizedName = normalizeSearchText(location.name);
  const normalizedCity = normalizeSearchText(location.city);
  const matchedBeach = israelBeaches.find((beach) =>
    beach.id === location.id ||
    (normalizeSearchText(beach.displayName) === normalizedName && normalizeSearchText(beach.city) === normalizedCity),
  );

  if (matchedBeach) {
    return {
      latitude: matchedBeach.latitude,
      longitude: matchedBeach.longitude,
    };
  }

  const matchedLocation = israelLocations.find((place) => normalizeSearchText(place.city) === normalizedCity);

  return matchedLocation
    ? {
        latitude: matchedLocation.latitude,
        longitude: matchedLocation.longitude,
      }
    : null;
}

function getDistanceKm(fromCoordinates: Coordinates, toCoordinates: Coordinates) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(toCoordinates.latitude - fromCoordinates.latitude);
  const longitudeDelta = toRadians(toCoordinates.longitude - fromCoordinates.longitude);
  const fromLatitude = toRadians(fromCoordinates.latitude);
  const toLatitude = toRadians(toCoordinates.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

function getSearchedLocationOptions(query: string, locations: Location[]) {
  if (!query.trim()) {
    return [];
  }

  return locations
    .map((location) => ({
      location,
      score: getLocationSearchMatchScore(location, query),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      `${left.location.city} ${left.location.name}`.localeCompare(`${right.location.city} ${right.location.name}`),
    )
    .map((result) => result.location);
}

function getLocationDedupeKey(location: Location) {
  if (isAreaFilterLocation(location)) {
    return location.id;
  }

  return [
    normalizeSearchText(location.name),
    normalizeSearchText(location.city),
  ].join('|');
}

function isAreaFilterLocation(location: Location) {
  return location.description === 'area_filter';
}

function getLocationRecommendationScore(location: Location, playerArea: string) {
  const normalizedPlayerArea = normalizeSearchText(playerArea);

  if (!normalizedPlayerArea) {
    return 0;
  }

  return Math.max(
    getWeightedTextMatchScore(location.city, normalizedPlayerArea, 30),
    getWeightedTextMatchScore(location.area, normalizedPlayerArea, 12),
    getTextMatchScore(location.name, normalizedPlayerArea),
    getAliasSearchScore(getLocationSearchAliases(location), normalizedPlayerArea),
  );
}

function getLocationSearchMatchScore(location: Location, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  return Math.max(
    getWeightedTextMatchScore(location.name, normalizedQuery, 30),
    getWeightedTextMatchScore(location.city, normalizedQuery, 20),
    getWeightedTextMatchScore(location.area, normalizedQuery, 10),
    getAliasSearchScore(getLocationSearchAliases(location), normalizedQuery),
  );
}

function getLocationSearchAliases(location: Location) {
  if (isAreaFilterLocation(location)) {
    return [
      `all ${location.area} games`,
      `${location.area} area`,
      ...getAreaSearchValues(location.area),
    ];
  }

  const normalizedName = normalizeSearchText(location.name);
  const normalizedCity = normalizeSearchText(location.city);
  const matchingBeach = israelBeaches.find((beach) =>
    beach.id === location.id ||
    (normalizeSearchText(beach.displayName) === normalizedName && normalizeSearchText(beach.city) === normalizedCity),
  );
  const matchingCity = israelLocations.find((place) => normalizeSearchText(place.city) === normalizedCity);

  return [
    ...(matchingBeach?.aliases ?? []),
    ...(matchingCity?.aliases ?? []),
    ...getAreaSearchValues(location.area),
  ];
}

function getAreaSearchValues(area: string) {
  const normalizedArea = normalizeSearchText(area);

  if (normalizedArea.includes('central') || normalizedArea.includes('center') || normalizedArea.includes('sharon')) {
    return ['central', 'center', 'sharon', '\u05de\u05e8\u05db\u05d6'];
  }

  if (normalizedArea.includes('north')) {
    return ['north', '\u05e6\u05e4\u05d5\u05df'];
  }

  if (normalizedArea.includes('south')) {
    return ['south', '\u05d3\u05e8\u05d5\u05dd'];
  }

  if (normalizedArea === 'central' || normalizedArea === 'center') {
    return ['central', 'center', 'מרכז'];
  }

  if (normalizedArea === 'north') {
    return ['north', 'צפון'];
  }

  if (normalizedArea === 'south') {
    return ['south', 'דרום'];
  }

  return [area];
}

function getAliasSearchScore(values: string[], normalizedQuery: string) {
  return values.reduce((bestScore, value) => Math.max(bestScore, getTextMatchScore(value, normalizedQuery)), 0);
}

function getWeightedTextMatchScore(value: string, normalizedQuery: string, boost: number) {
  const score = getTextMatchScore(value, normalizedQuery);

  return score > 0 ? score + boost : 0;
}

function getTextMatchScore(value: string, normalizedQuery: string) {
  const normalizedValue = normalizeSearchText(value);

  if (!normalizedValue || !normalizedQuery) {
    return 0;
  }

  if (normalizedValue === normalizedQuery) {
    return 100;
  }

  if (normalizedValue.startsWith(normalizedQuery) || normalizedQuery.startsWith(normalizedValue)) {
    return 80;
  }

  if (normalizedValue.includes(normalizedQuery) || normalizedQuery.includes(normalizedValue)) {
    return 65;
  }

  const valueWords = normalizedValue.split(' ').filter((word) => word.length > 2);
  const queryWords = normalizedQuery.split(' ').filter((word) => word.length > 2);
  const sharedWords = queryWords.filter((word) => valueWords.includes(word)).length;

  if (sharedWords >= 2) {
    return 50 + sharedWords;
  }

  if (sharedWords === 1) {
    return 28;
  }

  return 0;
}

function doesLobbyMatchDiscoveryFilters(
  lobby: Lobby,
  filtersState: {
    genderFilter: GenderFilter | null;
    levelFromIndex: number;
    levelToIndex: number;
    searchQuery: string;
    selectedLocation: Location | null;
    showPrivate: boolean;
    currentPlayerId: string;
  },
  players: Player[],
) {
  if (!filtersState.showPrivate && isPrivateLobby(lobby) && !isCurrentPlayerActiveOrPendingInLobby(lobby, filtersState.currentPlayerId)) {
    return false;
  }

  if (filtersState.selectedLocation && !doesLobbyMatchLocation(lobby, filtersState.selectedLocation)) {
    return false;
  }

  if (filtersState.genderFilter && !doesLobbyMatchGender(lobby, filtersState.genderFilter)) {
    return false;
  }

  if (
    (filtersState.levelFromIndex !== 0 || filtersState.levelToIndex !== levelOptions.length - 1) &&
    !doesLobbyRankOverlapFilter(lobby, filtersState.levelFromIndex, filtersState.levelToIndex)
  ) {
    return false;
  }

  if (filtersState.searchQuery.trim() && !doesLobbyMatchSearch(lobby, filtersState.searchQuery, players)) {
    return false;
  }

  return true;
}

function isPrivateLobby(lobby: Lobby) {
  return lobby.visibility === 'password' || lobby.visibility === 'invite_link';
}

function doesLobbyMatchLocation(lobby: Lobby, selectedLocation: Location) {
  if (isAreaFilterLocation(selectedLocation)) {
    return getLocationAreaGroup(lobby.location) === selectedLocation.area;
  }

  const selectedName = normalizeSearchText(selectedLocation.name);
  const selectedCity = normalizeSearchText(selectedLocation.city);
  const lobbyName = normalizeSearchText(lobby.location.name);
  const lobbyCity = normalizeSearchText(lobby.location.city);

  return (
    lobby.location.id === selectedLocation.id ||
    (lobbyName === selectedName && lobbyCity === selectedCity) ||
    (Boolean(selectedCity) && lobbyCity === selectedCity)
  );
}

function getLocationAreaGroup(location: Location) {
  const explicitAreaGroup = getAreaGroupFromText(location.area);

  if (explicitAreaGroup) {
    return explicitAreaGroup;
  }

  const cityAreaGroup = getAreaGroupFromText(location.city);

  if (cityAreaGroup) {
    return cityAreaGroup;
  }

  return getAreaGroupFromText(location.name);
}

function getAreaGroupFromText(value: string) {
  const normalizedValue = normalizeSearchText(value);

  if (
    normalizedValue.includes('south') ||
    normalizedValue.includes('ashdod') ||
    normalizedValue.includes('ashkelon') ||
    normalizedValue.includes('beersheba') ||
    normalizedValue.includes('\u05d3\u05e8\u05d5\u05dd') ||
    normalizedValue.includes('\u05d0\u05e9\u05d3\u05d5\u05d3') ||
    normalizedValue.includes('\u05d0\u05e9\u05e7\u05dc\u05d5\u05df')
  ) {
    return 'South';
  }

  if (
    normalizedValue.includes('north') ||
    normalizedValue.includes('haifa') ||
    normalizedValue.includes('caesarea') ||
    normalizedValue.includes('\u05e6\u05e4\u05d5\u05df') ||
    normalizedValue.includes('\u05d7\u05d9\u05e4\u05d4') ||
    normalizedValue.includes('\u05e7\u05d9\u05e1\u05e8\u05d9\u05d4')
  ) {
    return 'North';
  }

  if (
    normalizedValue.includes('central') ||
    normalizedValue.includes('center') ||
    normalizedValue.includes('sharon') ||
    normalizedValue.includes('tel aviv') ||
    normalizedValue.includes('yafo') ||
    normalizedValue.includes('bat yam') ||
    normalizedValue.includes('holon') ||
    normalizedValue.includes('rishon') ||
    normalizedValue.includes('herzliya') ||
    normalizedValue.includes('netanya') ||
    normalizedValue.includes('jerusalem') ||
    normalizedValue.includes('\u05de\u05e8\u05db\u05d6') ||
    normalizedValue.includes('\u05ea\u05dc \u05d0\u05d1\u05d9\u05d1') ||
    normalizedValue.includes('\u05d1\u05ea \u05d9\u05dd') ||
    normalizedValue.includes('\u05d7\u05d5\u05dc\u05d5\u05df') ||
    normalizedValue.includes('\u05d4\u05e8\u05e6\u05dc\u05d9\u05d4') ||
    normalizedValue.includes('\u05e0\u05ea\u05e0\u05d9\u05d4')
  ) {
    return 'Central';
  }

  return null;
}

function doesLobbyMatchGender(lobby: Lobby, genderFilter: GenderFilter) {
  if (genderFilter === 'Everyone') {
    return lobby.genderRule === 'everyone';
  }

  return lobby.genderRule === genderFilter.toLowerCase();
}

function doesLobbyRankOverlapFilter(lobby: Lobby, levelFromIndex: number, levelToIndex: number) {
  const lobbyRange = getLobbyLevelRangeIndexes(lobby);

  return lobbyRange.fromIndex <= levelToIndex && lobbyRange.toIndex >= levelFromIndex;
}

function getLobbyLevelRangeIndexes(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return {
      fromIndex: 0,
      toIndex: levelOptions.length - 1,
    };
  }

  if (lobby.rankRuleType === 'exact') {
    const exactIndex = getLevelIndex(lobby.rankExact);

    return {
      fromIndex: exactIndex,
      toIndex: exactIndex,
    };
  }

  const fromIndex = getLevelIndex(lobby.rankMin);
  const toIndex = getLevelIndex(lobby.rankMax);

  return {
    fromIndex: Math.min(fromIndex, toIndex),
    toIndex: Math.max(fromIndex, toIndex),
  };
}

function getLevelIndex(level?: PlayerLevel) {
  return level ? Math.max(getRankIndex(level), 0) : 0;
}

function doesLobbyMatchSearch(lobby: Lobby, searchQuery: string, players: Player[]) {
  const normalizedQuery = normalizeSearchText(searchQuery);
  const host = players.find((player) => player.id === lobby.adminId);
  const searchParts = [
    lobby.title,
    lobby.location.name,
    lobby.location.city,
    lobby.location.area,
    lobby.locationDescription,
    lobby.note,
    host?.name,
    getGenderAudience(lobby),
    getLobbyLevelLabel(lobby),
  ];

  return searchParts.some((part) => normalizeSearchText(part).includes(normalizedQuery));
}

function normalizeSearchText(value?: string) {
  return value?.trim().toLocaleLowerCase() ?? '';
}

function getGameCardFromLobby(lobby: Lobby, index: number, currentPlayerId: string, players: Player[]): GameListItem {
  const activeParticipants = lobby.participants.filter(isJoinedParticipant);
  const currentParticipant = getCurrentPlayerParticipant(lobby, currentPlayerId);
  const isHost = isLobbyHost(lobby, currentPlayerId, currentParticipant);
  const spotsLeft = Math.max(lobby.maxPlayers - activeParticipants.length, 0);
  const autoCancelLabel = getAutoCancelCountdownLabel(lobby);

  return {
    audience: getGenderAudience(lobby),
    avatars: activeParticipants.slice(0, 3).map((participant) => getPlayerInitials(participant.playerId, players)),
    badgeLabel: isHost ? lobbyLabels.host : undefined,
    badgeTone: isHost ? 'lime' : undefined,
    distance: lobby.location.distanceKm ? `${lobby.location.distanceKm.toFixed(1)} km` : 'New',
    gradient: index % 2 === 0 ? ['#FFF2BD', '#8EDBD2', '#24C45A'] : ['#EAF5EC', '#24C45A', '#1BB7A8'],
    level: getLobbyLevelLabel(lobby),
    lobbyId: lobby.id,
    lobbyIndex: index,
    location: `${lobby.location.name}, ${lobby.location.city}`,
    players: `${activeParticipants.length} / ${lobby.maxPlayers} players`,
    spotsLeft: autoCancelLabel ?? (spotsLeft === 0 ? '' : spotsLeft === 1 ? '1 spot left' : `${spotsLeft} spots left`),
    startsAt: lobby.startsAt,
    title: lobby.title,
  };
}

function getPlayerInitials(playerId: string, players: Player[]) {
  return players.find((player) => player.id === playerId)?.initials ?? 'PL';
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

function getLobbyLevelLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact';
  }

  return `${lobby.rankMin}/${lobby.rankMax}`;
}

function LegacyGameCard({ game, onPress }: { game: GameListItem; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.gameCard}>
      <BeachThumbnail game={game} />

      <View style={styles.cardBody}>
        <View style={styles.timeRow}>
          <View style={styles.liveDot} />
          <AppText style={styles.timeText} tone="muted" variant="caption" weight="700">
            {formatLobbyStart(game.startsAt)}
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
  game: GameListItem & { actionDisabled?: boolean; actionLabel: string; imageBadgeLabel?: string; requestStatusLabel?: string; secondarySpotsLeft?: string; statusLabel: string; statusTone: 'gold' | 'lime' | 'muted' };
  onPress: () => void;
}) {
  const isActionMuted = game.actionDisabled || game.statusTone === 'muted';

  return (
    <NearbyGameCard
      actionLabel={game.actionLabel}
      actionDisabled={game.actionDisabled}
      actionTone={isActionMuted ? 'muted' : game.actionLabel === 'Rate players' ? 'warning' : 'accent'}
      audience={game.audience}
      distance={game.distance}
      level={game.level}
      location={game.location}
      onPress={game.actionDisabled ? undefined : onPress}
      players={formatPlayersCount(game.players)}
      requestStatusLabel={game.requestStatusLabel}
      secondarySpotsLeft={game.secondarySpotsLeft}
      secondarySpotsTone="red"
      spotsLeft={game.imageBadgeLabel ?? (game.requestStatusLabel ? game.spotsLeft : game.statusLabel)}
      spotsTone={game.statusTone === 'lime' ? 'green' : game.statusTone === 'muted' ? 'muted' : 'yellow'}
      status={game.statusTone === 'muted' ? 'Closed' : 'Approval'}
      time={formatLobbyStart(game.startsAt)}
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
  const badgeImageTone = badgeTone === 'lime' ? 'green' : badgeTone === 'muted' ? 'muted' : 'yellow';

  return (
    <View style={styles.thumbnail}>
      <BeachGameVisual compact variant={game.audience === 'Women' ? 'sunset' : game.level === 'A+' ? 'morning' : 'aqua'} />
      <LobbyImageBadge label={visibleBadgeLabel} size="wide" tone={badgeImageTone} />
    </View>
  );
}

function getNearbyVariant(game: GameListItem): 'morning' | 'sunset' {
  return game.audience === 'Women' || isEveningLobbyStart(game.startsAt) ? 'sunset' : 'morning';
}

function formatPlayersCount(playersLabel: string) {
  return playersLabel.replace(/\s*players$/i, '').trim();
}

function getCurrentPlayerParticipant(lobby: Lobby, currentPlayerId: string) {
  return lobby.participants.find((participant) => participant.playerId === currentPlayerId && participant.status === 'approved');
}

function getCurrentPlayerAnyParticipant(lobby: Lobby, currentPlayerId: string) {
  return lobby.participants.find(
    (participant) =>
      participant.playerId === currentPlayerId &&
      (participant.status === 'approved' || participant.status === 'attended'),
  );
}

function isCurrentPlayerInLobby(lobby: Lobby, currentPlayerId: string) {
  return Boolean(getCurrentPlayerAnyParticipant(lobby, currentPlayerId));
}

function isCurrentPlayerFinalParticipant(lobby: Lobby, currentPlayerId: string) {
  return getMatchParticipantIds(lobby).includes(currentPlayerId);
}

function isActiveLobbyVisibleToCurrentPlayer(lobby: Lobby, currentPlayerId: string) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status === 'open' || status === 'full' || status === 'closing_soon') {
    return isCurrentPlayerActiveOrPendingInLobby(lobby, currentPlayerId);
  }

  if (status === 'in_progress') {
    return isCurrentPlayerFinalParticipant(lobby, currentPlayerId);
  }

  return false;
}

function isFinishedLobbyVisibleToCurrentPlayer(lobby: Lobby, currentPlayerId: string) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status === 'rating_open') {
    return shouldShowRatingLobby(lobby, currentPlayerId);
  }

  return status === 'completed' && isCurrentPlayerFinalParticipant(lobby, currentPlayerId);
}

function getFinishedGameRatingState(lobby: Lobby, currentPlayerId: string, ratingTasks: RatingTask[]) {
  if (!isLobbyReadyForRatings(lobby)) {
    return {
      actionDisabled: true,
      actionLabel: 'Finished',
      statusLabel: 'Finished',
      statusTone: 'muted' as const,
    };
  }

  const remainingRatings = getRemainingRatingTargetIds(ratingTasks, lobby, currentPlayerId).length;
  const hasRatedEveryone = remainingRatings === 0;

  return {
    actionDisabled: hasRatedEveryone,
    actionLabel: hasRatedEveryone ? 'Finished' : 'Rate players',
    statusLabel: hasRatedEveryone ? 'Finished' : 'Rating is open',
    statusTone: hasRatedEveryone ? 'muted' as const : 'gold' as const,
  };
}

function isCurrentPlayerActiveOrPendingInLobby(lobby: Lobby, currentPlayerId: string) {
  return isCurrentPlayerInLobby(lobby, currentPlayerId) || Boolean(getCurrentPlayerPendingRequest(lobby, currentPlayerId));
}

function getActiveGameActionLabel(lobby: Lobby) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status === 'cancelled') {
    return 'View cancelled';
  }

  if (status === 'full') {
    return lobbyLabels.viewMatch;
  }

  if (status === 'closing_soon') {
    return 'Join now';
  }

  if (status === 'in_progress') {
    return 'View match';
  }

  return lobbyLabels.viewMatch;
}

function getActiveGameStatusLabel(lobby: Lobby, currentPlayerId: string, participant?: Lobby['participants'][number]) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  if (status === 'full') {
    return 'Full';
  }

  if (status === 'closing_soon') {
    return getAutoCancelCountdownLabel(lobby) ?? 'Closing soon';
  }

  if (status === 'in_progress') {
    return 'In progress';
  }

  return getLobbyMembershipStatusLabel(lobby, currentPlayerId, participant);
}

function getActiveGameStatusTone(lobby: Lobby, participant?: Lobby['participants'][number]) {
  const status = getEffectiveLobbyStatus(lobby);

  if (status === 'cancelled') {
    return 'muted' as const;
  }

  if (status === 'full') {
    return 'lime' as const;
  }

  if (status === 'closing_soon') {
    return 'gold' as const;
  }

  if (status === 'in_progress') {
    return 'lime' as const;
  }

  return participant ? 'lime' as const : 'gold' as const;
}

function getCurrentPlayerPendingRequest(lobby: Lobby, currentPlayerId: string) {
  return lobby.joinRequests.find((request) => request.playerId === currentPlayerId && request.status === 'pending');
}

function formatLevelRange(fromIndex: number, toIndex: number) {
  return formatRankRange(fromIndex, toIndex);
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
  emptyCopy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 152,
    padding: spacing.lg,
    ...shadows.soft,
  },
  emptyText: {
    maxWidth: 260,
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
  filterDismissLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
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
  areaFilterOption: {
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
  areaFilterOptionActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  areaFilterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
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
    minHeight: 28,
    paddingHorizontal: spacing.xs,
  },
  genderOptionActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  genderOptionTextActive: {
    color: colors.accentLime,
  },
  genderFilterPanel: {
    alignSelf: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '82%',
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
  locationOption: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xxs,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  locationOptionActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  locationOptions: {
    gap: spacing.xs,
  },
  locationOptionTextActive: {
    color: colors.accentLime,
  },
  locationSearchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  locationSearchClear: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  locationSearchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 13,
    lineHeight: 17,
    padding: 0,
  },
  locationSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  locationResultsList: {
    maxHeight: 262,
  },
  locationResultsContent: {
    gap: spacing.xs,
    paddingBottom: 2,
  },
  locationEmptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
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
  rankFilterPanel: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  rankResetButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  rankResetButtonActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
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
  searchGamesBody: {
    gap: 14,
    position: 'relative',
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 14,
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
    width: 136,
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
