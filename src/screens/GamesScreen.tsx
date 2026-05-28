import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { currentPlayer, notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { GenderRule, Lobby, LobbyParticipant } from '../types';

type GamesScreenProps = {
  lobbies: Lobby[];
  onBack: () => void;
  onOpenLobby: (lobby: Lobby) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
};

const filters = [
  { id: 'All Games', icon: 'G' },
  { id: 'Nearby', icon: 'N' },
  { id: 'Level', icon: 'L', suffix: 'v' },
  { id: 'Time', icon: 'T', suffix: 'v' },
];

const gameImages = [
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1613918431703-aa50889e3be8?auto=format&fit=crop&w=360&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=360&q=80',
];

export function getLobbyImageUrl(index: number) {
  return gameImages[index % gameImages.length];
}

export function GamesScreen({
  lobbies,
  onBack,
  onOpenLobby,
  selectedFilter,
  setSelectedFilter,
}: GamesScreenProps) {
  return (
    <View style={styles.screen}>
      <AppHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.filtersSection}>
        <View>
          <Text style={styles.screenTitle}>Games</Text>
          <Text style={styles.screenSubtitle}>Find a game and join players near you</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>S</Text>
          <TextInput
            placeholder="Search for location or players..."
            placeholderTextColor={colors.darkMuted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.filterRow}
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => {
            const isActive = selectedFilter === filter.id;

            return (
              <Pressable
                key={filter.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <Text style={[styles.filterIcon, isActive && styles.filterIconActive]}>{filter.icon}</Text>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{filter.id}</Text>
                {filter.suffix ? <Text style={styles.filterSuffix}>{filter.suffix}</Text> : null}
              </Pressable>
            );
          })}
          <Pressable style={styles.tuneButton}>
            <Text style={styles.tuneText}>=</Text>
          </Pressable>
        </ScrollView>
      </View>

      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <View style={styles.listTitleRow}>
            <Text style={styles.listTitle}>Open Games</Text>
            <Text style={styles.availableCount}>{lobbies.length} games available</Text>
          </View>
          <Pressable style={styles.sortButton}>
            <Text style={styles.sortText}>Sort by: Nearest v</Text>
          </Pressable>
        </View>

        <View style={styles.cardStack}>
          {lobbies.map((lobby, index) => (
            <GameCard
              key={lobby.id}
              imageUrl={getLobbyImageUrl(index)}
              lobby={lobby}
              onPress={() => onOpenLobby(lobby)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function GameCard({
  lobby,
  imageUrl,
  onPress,
}: {
  lobby: Lobby;
  imageUrl: string;
  onPress: () => void;
}) {
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const visibleParticipants = activeParticipants.slice(0, 3);
  const extraParticipants = Math.max(activeParticipants.length - visibleParticipants.length, 0);
  const spotsLeft = Math.max(lobby.maxPlayers - activeParticipants.length, 0);

  return (
    <Pressable style={styles.gameCard} onPress={onPress}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUrl }} style={styles.gameImage} />
        <View style={styles.spotsBadge}>
          <Text style={styles.spotsText}>
            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left` : 'Full'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View>
          <View style={styles.timeRow}>
            <View style={[styles.timeDot, lobby.status === 'full' && styles.timeDotMuted]} />
            <Text style={styles.timeText}>{lobby.startsAt}</Text>
          </View>
          <Text style={styles.gameTitle} numberOfLines={1}>
            {lobby.title}
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {lobby.location.name}, {lobby.location.city}
          </Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailText}>Outdoor</Text>
            <Text style={styles.detailText}>{lobby.location.distanceKm ?? '0'} km</Text>
            <Text style={styles.detailText}>{getGenderLabel(lobby.genderRule)}</Text>
          </View>
        </View>

        <View style={styles.playersRow}>
          <View style={styles.avatarStack}>
            {visibleParticipants.map((participant) => {
              const player = players.find((candidate) => candidate.id === participant.playerId);

              return player ? (
                <View key={player.id} style={styles.stackedAvatar}>
                  <Avatar player={player} size={28} />
                </View>
              ) : null;
            })}
            {extraParticipants > 0 ? (
              <View style={styles.extraAvatar}>
                <Text style={styles.extraAvatarText}>+{extraParticipants}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.playersText}>
            {activeParticipants.length} / {lobby.maxPlayers} players
          </Text>
        </View>
      </View>

      <View style={styles.cardSide}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>{getLevelLabel(lobby)}</Text>
          <Text style={styles.levelCaption}>Level</Text>
        </View>
        <Text style={styles.chevron}>{'>'}</Text>
      </View>
    </Pressable>
  );
}

function isActiveParticipant(participant: LobbyParticipant) {
  return participant.role === 'admin' || participant.role === 'joined' || participant.role === 'substitute';
}

function getLevelLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact';
  }

  return `${lobby.rankMin}-${lobby.rankMax}`;
}

function getGenderLabel(genderRule: GenderRule) {
  if (genderRule === 'everyone') {
    return 'Everyone';
  }

  return genderRule === 'male' ? 'Men' : 'Women';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.darkBackground,
    flex: 1,
    minHeight: '100%',
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    borderBottomColor: colors.darkBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  iconButtonText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  logoText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  notificationDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 9,
    top: 8,
    width: 10,
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filtersSection: {
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  screenTitle: {
    color: colors.darkText,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  screenSubtitle: {
    color: colors.darkMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchIcon: {
    color: colors.darkMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  searchInput: {
    color: colors.darkText,
    flex: 1,
    fontSize: 14,
    minHeight: 48,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  filterChipActive: {
    backgroundColor: colors.darkBackground,
    borderColor: colors.neon,
  },
  filterIcon: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  filterIconActive: {
    color: colors.neon,
  },
  filterText: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.neon,
  },
  filterSuffix: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: '900',
  },
  tuneButton: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 40,
  },
  tuneText: {
    color: colors.darkMuted,
    fontSize: 18,
    fontWeight: '900',
  },
  listSection: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  availableCount: {
    color: colors.darkMuted,
    fontSize: 12,
  },
  sortButton: {
    flexShrink: 0,
  },
  sortText: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  cardStack: {
    gap: spacing.md,
  },
  gameCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 136,
    overflow: 'hidden',
    padding: spacing.md,
  },
  imageWrap: {
    borderRadius: radius.md,
    height: 112,
    overflow: 'hidden',
    position: 'relative',
    width: 112,
  },
  gameImage: {
    height: '100%',
    width: '100%',
  },
  spotsBadge: {
    backgroundColor: colors.darkOverlay,
    borderRadius: radius.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    position: 'absolute',
    top: spacing.sm,
  },
  spotsText: {
    color: colors.darkText,
    fontSize: 10,
    fontWeight: '900',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  timeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  timeDot: {
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 8,
    width: 8,
  },
  timeDotMuted: {
    backgroundColor: colors.darkMuted,
  },
  timeText: {
    color: colors.darkMuted,
    fontSize: 10,
    fontWeight: '900',
  },
  gameTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  locationText: {
    color: colors.darkMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  detailText: {
    color: colors.darkMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  playersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  avatarStack: {
    flexDirection: 'row',
  },
  stackedAvatar: {
    marginRight: -8,
  },
  extraAvatar: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkSurface,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  extraAvatarText: {
    color: colors.darkText,
    fontSize: 9,
    fontWeight: '900',
  },
  playersText: {
    color: colors.darkText,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '900',
  },
  cardSide: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  levelBox: {
    borderColor: colors.darkBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 62,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  levelText: {
    color: colors.darkText,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
  },
  levelCaption: {
    color: colors.darkMuted,
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  chevron: {
    color: colors.darkMuted,
    fontSize: 22,
    fontWeight: '900',
  },
});
