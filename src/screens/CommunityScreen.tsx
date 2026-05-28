import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { currentPlayer, notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Player, PlayerLevel } from '../types';

type ConnectPlayer = {
  id: string;
  initials: string;
  name: string;
  points: number;
  rating: string;
  level: PlayerLevel;
  badge: 'shield' | 'star';
};

const connectPlayers: ConnectPlayer[] = [
  { id: 'c1', initials: 'AM', name: 'Amit', points: 290, rating: '3.5', level: 'B+', badge: 'star' },
  { id: 'c2', initials: 'YN', name: 'Yoni', points: 242, rating: '3.2', level: 'B', badge: 'star' },
  { id: 'c3', initials: 'TL', name: 'Tal', points: 471, rating: '4.0', level: 'A-', badge: 'shield' },
  { id: 'c4', initials: 'NM', name: 'Noam', points: 318, rating: '3.6', level: 'B+', badge: 'star' },
  { id: 'c5', initials: 'ID', name: 'Ido', points: 265, rating: '3.3', level: 'B', badge: 'shield' },
];

const leaderboard = [
  { rank: 1, name: 'Itay Levi', initials: 'IL', level: 'A', rating: '4.2', games: 24, points: 512, isCurrent: false },
  { rank: 2, name: 'Yonatan Sh.', initials: 'YS', level: 'A-', rating: '4.0', games: 22, points: 471, isCurrent: false },
  { rank: 3, name: 'Aviad M.', initials: 'AM', level: 'B+', rating: '3.8', games: 18, points: 389, isCurrent: false },
  { rank: 4, name: 'Maya Cohen', initials: 'MC', level: 'B+', rating: '3.6', games: 19, points: 328, isCurrent: false },
  { rank: 5, name: 'Nevo Cohen', initials: currentPlayer.initials, level: currentPlayer.level, rating: '3.6', games: 12, points: 328, isCurrent: true },
] as const;

export function CommunityScreen() {
  const friendPlayers = players.filter((player) => currentPlayer.friendIds.includes(player.id));
  const visibleFriends = [
    ...friendPlayers,
    ...players.filter((player) => player.id !== currentPlayer.id && !currentPlayer.friendIds.includes(player.id)),
  ].slice(0, 4);

  return (
    <View style={styles.screen}>
      <AppHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.content}>
        <View style={styles.section}>
          <SectionHeader action="Add Friends" title="Friends" />
          <ScrollView horizontal contentContainerStyle={styles.peopleRow} showsHorizontalScrollIndicator={false}>
            {visibleFriends.map((player) => (
              <PlayerBubble key={player.id} player={player} />
            ))}
            <View style={styles.personItem}>
              <View style={styles.moreCircle}>
                <Text style={styles.moreCircleText}>24</Text>
              </View>
              <Text style={styles.personNameMuted}>Friends</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Connect with other players" withChevron />
          <ScrollView horizontal contentContainerStyle={styles.peopleRow} showsHorizontalScrollIndicator={false}>
            {connectPlayers.map((player) => (
              <ConnectBubble key={player.id} player={player} />
            ))}
            <View style={styles.personItem}>
              <View style={styles.moreCircle}>
                <Text style={styles.moreCircleText}>20+</Text>
              </View>
              <Text style={styles.personNameMuted}>More</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.leaderboardPanel}>
          <Text style={styles.leaderboardTitle}>Leaderboard</Text>
          <View style={styles.tabs}>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Friends</Text>
            </View>
            <View style={styles.tab}>
              <Text style={styles.tabText}>All</Text>
            </View>
            <View style={styles.tab}>
              <Text style={styles.tabText}>Region</Text>
            </View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.rankCol]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.playerCol]}>Player</Text>
            <Text style={[styles.tableHeaderText, styles.rankSkillCol]}>Skill</Text>
            <Text style={[styles.tableHeaderText, styles.ratingCol]}>Rating</Text>
            <Text style={[styles.tableHeaderText, styles.gamesCol]}>Games</Text>
            <Text style={[styles.tableHeaderText, styles.pointsCol]}>Points</Text>
          </View>

          <View style={styles.leaderboardList}>
            {leaderboard.map((row) => (
              <LeaderboardRow key={row.rank} row={row} />
            ))}
          </View>

          <Pressable style={styles.fullLeaderboardButton}>
            <Text style={styles.fullLeaderboardText}>View full leaderboard</Text>
            <Text style={styles.chevron}>{'>'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  action,
  title,
  withChevron = false,
}: {
  action?: string;
  title: string;
  withChevron?: boolean;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
      {withChevron ? <Text style={styles.headerChevron}>{'>'}</Text> : null}
    </View>
  );
}

function PlayerBubble({ player }: { player: Player }) {
  return (
    <View style={styles.personItem}>
      <View style={styles.personAvatarWrap}>
        <Avatar player={player} size={56} />
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.personName}>{player.name}</Text>
    </View>
  );
}

function ConnectBubble({ player }: { player: ConnectPlayer }) {
  return (
    <View style={styles.personItem}>
      <View style={styles.suggestedAvatar}>
        <Text style={styles.suggestedAvatarText}>{player.initials}</Text>
        <View style={[styles.suggestionBadge, player.badge === 'shield' && styles.suggestionBadgeShield]}>
          <Text style={styles.suggestionBadgeText}>{player.badge === 'shield' ? 'S' : '*'}</Text>
        </View>
      </View>
      <Text style={styles.personName}>{player.name}</Text>
      <Text style={styles.connectMeta}>
        {player.level} • {player.rating} • {player.points}
      </Text>
    </View>
  );
}

function LeaderboardRow({ row }: { row: (typeof leaderboard)[number] }) {
  return (
    <View style={[styles.leaderboardRow, row.isCurrent && styles.currentUserRow]}>
      <View style={styles.rankCol}>
        <View style={[styles.rankBadge, row.rank === 1 && styles.goldBadge, row.rank === 2 && styles.silverBadge, row.rank === 3 && styles.bronzeBadge]}>
          <Text style={styles.rankBadgeText}>{row.rank}</Text>
        </View>
      </View>
      <View style={[styles.playerCol, styles.leaderPlayer]}>
        <View style={styles.leaderAvatar}>
          <Text style={styles.leaderAvatarText}>{row.initials}</Text>
        </View>
        <Text style={[styles.leaderName, row.isCurrent && styles.currentUserText]} numberOfLines={2}>
          {row.name}
        </Text>
      </View>
      <View style={styles.rankSkillCol}>
        <Text style={styles.skillChip}>{row.level}</Text>
      </View>
      <Text style={[styles.rowText, styles.ratingCol]}>{row.rating} *</Text>
      <Text style={[styles.rowMuted, styles.gamesCol]}>{row.games}</Text>
      <Text style={[styles.rowText, styles.pointsCol]}>{row.points}</Text>
    </View>
  );
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
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
    fontSize: 10,
    lineHeight: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  headerIconText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -4,
    width: 18,
  },
  notificationText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.darkText,
    flex: 1,
    fontSize: 21,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.neon,
    fontSize: 14,
    fontWeight: '800',
  },
  headerChevron: {
    color: colors.darkMuted,
    fontSize: 24,
    fontWeight: '900',
  },
  peopleRow: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  personItem: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 68,
  },
  personAvatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 2,
    height: 14,
    position: 'absolute',
    right: 2,
    width: 14,
  },
  personName: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  personNameMuted: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  moreCircle: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  moreCircleText: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
  },
  suggestedAvatar: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 56,
    justifyContent: 'center',
    position: 'relative',
    width: 56,
  },
  suggestedAvatarText: {
    color: colors.darkText,
    fontSize: 17,
    fontWeight: '900',
  },
  suggestionBadge: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: -1,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    width: 20,
  },
  suggestionBadgeShield: {
    backgroundColor: colors.accent,
  },
  suggestionBadgeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },
  connectMeta: {
    color: colors.darkMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
  },
  leaderboardPanel: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    marginHorizontal: spacing.xl,
    minHeight: 500,
    padding: spacing.xl,
  },
  leaderboardTitle: {
    color: colors.darkText,
    fontSize: 24,
    fontWeight: '900',
  },
  tabs: {
    backgroundColor: colors.darkBackground,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  tabActive: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    flex: 1,
    paddingVertical: spacing.md,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    paddingVertical: spacing.md,
  },
  tabActiveText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  tabText: {
    color: colors.darkMuted,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  tableHeaderText: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  leaderboardList: {
    gap: spacing.xs,
  },
  leaderboardRow: {
    alignItems: 'center',
    borderBottomColor: colors.darkBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingVertical: spacing.sm,
  },
  currentUserRow: {
    backgroundColor: colors.darkBackground,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
  },
  rankCol: {
    alignItems: 'center',
    width: 34,
  },
  rankBadge: {
    alignItems: 'center',
    borderColor: colors.darkMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  goldBadge: {
    borderColor: colors.accent,
  },
  silverBadge: {
    borderColor: colors.darkMuted,
  },
  bronzeBadge: {
    borderColor: colors.accent,
  },
  rankBadgeText: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '900',
  },
  playerCol: {
    flex: 1,
    minWidth: 92,
  },
  leaderPlayer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  leaderAvatar: {
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  leaderAvatarText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  leaderName: {
    color: colors.darkText,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  currentUserText: {
    color: colors.neon,
  },
  rankSkillCol: {
    alignItems: 'center',
    width: 48,
  },
  ratingCol: {
    textAlign: 'center',
    width: 52,
  },
  gamesCol: {
    textAlign: 'center',
    width: 46,
  },
  pointsCol: {
    textAlign: 'right',
    width: 58,
  },
  skillChip: {
    backgroundColor: colors.darkSurfaceHigh,
    borderRadius: radius.sm,
    color: colors.neon,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rowText: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '800',
  },
  rowMuted: {
    color: colors.darkMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  fullLeaderboardButton: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  fullLeaderboardText: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '900',
  },
  chevron: {
    color: colors.darkMuted,
    fontSize: 20,
    fontWeight: '900',
  },
});
