import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import { currentPlayer, notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Player, PlayerLevel } from '../types';

type ConnectPlayer = {
  badge: 'shield' | 'star';
  id: string;
  initials: string;
  level: PlayerLevel;
  name: string;
  points: number;
  rating: string;
};

type CommunityPlayerCard = {
  badge: 'shield' | 'star';
  id: string;
  initials: string;
  level: PlayerLevel;
  name: string;
  points: number;
  rating: string;
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

const communityPages = ['Community', 'Leaderboard'] as const;
const friendViews = ['Friends', 'Friend requests'] as const;

const playerBubbleHeight = 144;
const playerBubbleWidth = 108;

type CommunityPage = (typeof communityPages)[number];
type FriendView = (typeof friendViews)[number];
type PlayerMenuVariant = 'connect' | 'friend' | 'request';

export function CommunityScreen() {
  const [activePage, setActivePage] = useState<CommunityPage>('Community');
  const [activeFriendView, setActiveFriendView] = useState<FriendView>('Friends');
  const [openPlayerMenuId, setOpenPlayerMenuId] = useState<string | null>(null);
  const [leaderboardScope, setLeaderboardScope] = useState<'All' | 'Friends' | 'Region'>('Friends');
  const friendPlayers = players.filter((player) => currentPlayer.friendIds.includes(player.id));
  const visibleFriends = [
    ...friendPlayers,
    ...players.filter((player) => player.id !== currentPlayer.id && !currentPlayer.friendIds.includes(player.id)),
  ].slice(0, 4);
  const friendCards: CommunityPlayerCard[] = visibleFriends.map((player, index) => ({
    badge: index % 3 === 2 ? 'shield' : 'star',
    id: player.id,
    initials: player.initials,
    level: player.level,
    name: player.name,
    points: player.tocaPoints,
    rating: player.id === currentPlayer.id ? '3.6' : index === 0 ? '3.2' : index === 1 ? '3.6' : index === 2 ? '4.0' : '3.3',
  }));
  const requestCards: CommunityPlayerCard[] = connectPlayers.slice(0, 4);
  const activeSocialCards = activeFriendView === 'Friends' ? friendCards : requestCards;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(76, 255, 90, 0.09)', colors.darkBackground, colors.darkBackground]}
        locations={[0, 0.34, 1]}
        style={styles.backgroundGlow}
      />
      <HomeHeader notificationCount={notifications.length} player={currentPlayer} rightAccessory="menu" />

      <View style={styles.content}>
        <View style={styles.pageTabs}>
          {communityPages.map((page) => {
            const isActive = activePage === page;

            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={page}
                onPress={() => setActivePage(page)}
                style={[styles.pageTab, isActive && styles.pageTabActive]}
              >
                <AppText
                  align="center"
                  style={[styles.pageTabText, isActive && styles.pageTabTextActive]}
                  tone={isActive ? 'accent' : 'muted'}
                  variant="bodySmall"
                  weight="800"
                >
                  {page}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {activePage === 'Community' ? (
          <>
            <View style={styles.section}>
              <View style={styles.friendMenuHeader}>
                <View style={styles.friendSegment}>
                  {friendViews.map((view) => {
                    const isActive = activeFriendView === view;

                    return (
                      <Pressable
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isActive }}
                        key={view}
                        onPress={() => setActiveFriendView(view)}
                        style={[styles.friendSegmentItem, isActive && styles.friendSegmentItemActive]}
                      >
                        <AppText
                          align="center"
                          tone={isActive ? 'warning' : 'muted'}
                          variant="label"
                          weight="800"
                        >
                          {view}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable accessibilityRole="button" style={styles.sectionAction}>
                  <AppText tone="accent" variant="label" weight="800">
                    Add friend
                  </AppText>
                  <Ionicons color={colors.accentLime} name="person-add-outline" size={15} />
                </Pressable>
              </View>

              {activeFriendView === 'Friends' ? (
                <View style={styles.friendSearchBox}>
                  <Ionicons color={colors.darkSubtle} name="search" size={16} />
                  <TextInput
                    placeholder="Search friends"
                    placeholderTextColor={colors.darkSubtle}
                    style={styles.friendSearchInput}
                  />
                </View>
              ) : (
                <View style={styles.requestHeader}>
                  <AppText style={styles.requestHeaderText} variant="titleSmall" weight="800">
                    Received
                  </AppText>
                </View>
              )}

              <ScrollView horizontal contentContainerStyle={styles.suggestionRow} showsHorizontalScrollIndicator={false}>
                {activeSocialCards.map((player) => {
                  const menuScope = activeFriendView === 'Friends' ? 'friend' : 'request-received';
                  const menuId = `${menuScope}-${player.id}`;

                  return (
                    <PlayerCard
                      isMenuOpen={openPlayerMenuId === menuId}
                      key={`${activeFriendView}-${player.id}`}
                      menuEnabled
                      menuVariant={activeFriendView === 'Friends' ? 'friend' : 'request'}
                      onPress={() => {
                        setOpenPlayerMenuId(openPlayerMenuId === menuId ? null : menuId);
                      }}
                      player={player}
                    />
                  );
                })}
                {activeFriendView === 'Friends' ? <MoreBubble label="Friends" value="24" /> : null}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <SectionHeader title={activeFriendView === 'Friend requests' ? 'Sent' : 'Connect nearby'} />
              <ScrollView horizontal contentContainerStyle={styles.suggestionRow} showsHorizontalScrollIndicator={false}>
                {connectPlayers.map((player) => (
                  <PlayerCard
                    isMenuOpen={openPlayerMenuId === `connect-${player.id}`}
                    key={player.id}
                    menuEnabled
                    menuVariant="connect"
                    onPress={() => {
                      const menuId = `connect-${player.id}`;
                      setOpenPlayerMenuId(openPlayerMenuId === menuId ? null : menuId);
                    }}
                    player={player}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.communitySummaryFooter}>
              <AppText style={styles.summaryFooterTitle} tone="muted" variant="label" weight="800">
                Community summary
              </AppText>
              <View style={styles.summaryStrip}>
                <SummaryItem footer="total" icon="people-outline" label="Friends" value="24" />
                <SummaryItem footer="players" icon="star-outline" label="Rated me" value="18" warning />
                <SummaryItem footer="players" icon="trophy-outline" label="I rated" value="12" />
              </View>
            </View>
          </>
        ) : (
          <>
            <MyStandingCard />

            <View style={styles.leaderboardPanel}>
              <View style={styles.panelHeader}>
                <View>
                  <AppText style={styles.sectionTitle} variant="heading" weight="800">
                    Leaderboard
                  </AppText>
                  <AppText tone="subtle" variant="label" weight="600">
                    Friends this month
                  </AppText>
                </View>
                <View style={styles.panelIcon}>
                  <Ionicons color={colors.accent} name="trophy-outline" size={18} />
                </View>
              </View>

              <View style={styles.tabs}>
                {(['Friends', 'All', 'Region'] as const).map((tab) => (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: leaderboardScope === tab }}
                    key={tab}
                    onPress={() => setLeaderboardScope(tab)}
                    style={[styles.tab, leaderboardScope === tab && styles.tabActive]}
                  >
                    <AppText
                      align="center"
                      tone={leaderboardScope === tab ? 'warning' : 'muted'}
                      variant="label"
                      weight="800"
                    >
                      {tab}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.leaderboardList}>
                {leaderboard.map((row) => (
                  <LeaderboardRow key={row.rank} row={row} />
                ))}
              </View>

              <Pressable accessibilityRole="button" style={styles.fullLeaderboardButton}>
                <AppText tone="accent" variant="bodySmall" weight="800">
                  View full leaderboard
                </AppText>
                <Ionicons color={colors.accentLime} name="chevron-forward" size={16} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function MyStandingCard() {
  const monthStartPoints = 922;
  const currentTotalPoints = 1250;
  const nextLevelPoints = 2000;
  const monthlyPoints = currentTotalPoints - monthStartPoints;
  const levelProgress = (currentTotalPoints - monthStartPoints) / (nextLevelPoints - monthStartPoints);

  return (
    <LinearGradient
      colors={['rgba(255, 200, 61, 0.12)', 'rgba(11, 29, 16, 0.66)', 'rgba(76, 255, 90, 0.07)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.standingCard}
    >
      <View style={styles.standingHeader}>
        <View style={styles.standingBadge}>
          <Ionicons color={colors.accent} name="flash-outline" size={15} />
        </View>
        <View style={styles.standingCopy}>
          <AppText tone="subtle" variant="caption" weight="700">
            TOCA pts this month
          </AppText>
          <AppText style={styles.standingPoints} tone="warning" variant="title" weight="800">
            +{monthlyPoints}
          </AppText>
        </View>

        <View style={styles.standingRankPill}>
          <AppText tone="warning" variant="caption" weight="800">
            Top 5
          </AppText>
        </View>
      </View>

      <View style={styles.standingScaleRow}>
        <View style={styles.standingScaleStart}>
          <AppText tone="subtle" variant="caption" weight="600">
            Start
          </AppText>
          <AppText variant="caption" weight="800">
            {monthStartPoints}
          </AppText>
        </View>
        <View style={styles.standingCurrentValue}>
          <AppText align="center" tone="warning" variant="caption" weight="800">
            {currentTotalPoints.toLocaleString()}
          </AppText>
          <AppText align="center" tone="subtle" variant="caption" weight="600">
            current
          </AppText>
        </View>
        <View style={styles.standingScaleEnd}>
          <AppText align="right" tone="subtle" variant="caption" weight="600">
            Next level
          </AppText>
          <AppText align="right" variant="caption" weight="800">
            {nextLevelPoints.toLocaleString()}
          </AppText>
        </View>
      </View>

      <View style={styles.standingMeterTrack}>
        <View style={[styles.standingMeterFill, { width: `${levelProgress * 100}%` }]} />
      </View>

      <View style={styles.standingFooter}>
        <StandingMetric icon="ribbon-outline" label="Grade" value={currentPlayer.level} />
        <StandingMetric icon="star" label="Rating" value="3.6" />
        <StandingMetric icon="trending-up-outline" label="To next" value={`+${nextLevelPoints - currentTotalPoints}`} />
      </View>
    </LinearGradient>
  );
}

function StandingMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.standingMetric}>
      <View style={styles.standingMetricHeader}>
        <Ionicons color={colors.accent} name={icon} size={12} />
        <AppText tone="primary" variant="bodySmall" weight="800">
          {value}
        </AppText>
      </View>
      <AppText align="center" tone="subtle" variant="caption" weight="600">
        {label}
      </AppText>
    </View>
  );
}

function SectionHeader({
  action,
  icon,
  title,
}: {
  action?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} variant="heading" weight="800">
        {title}
      </AppText>
      {action && icon ? (
        <Pressable accessibilityRole="button" style={styles.sectionAction}>
          <AppText tone="accent" variant="label" weight="800">
            {action}
          </AppText>
          <Ionicons color={colors.accentLime} name={icon} size={15} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryItem({
  footer,
  icon,
  label,
  value,
  warning = false,
}: {
  footer?: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
      <View style={styles.summaryItem}>
        <View style={[styles.summaryIcon, warning && styles.summaryIconGold]}>
        <Ionicons color={warning ? colors.accent : colors.accentLime} name={icon} size={13} />
      </View>
      <AppText style={styles.summaryValue} tone={warning ? 'warning' : 'primary'} variant="titleSmall" weight="800">
        {value}
      </AppText>
      <AppText style={styles.summaryLabel} tone="muted" variant="caption" weight="600">
        {label}
      </AppText>
      {footer ? (
        <AppText style={styles.summaryLabel} tone="subtle" variant="caption" weight="600">
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

function MoreBubble({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.moreCard}>
      <View style={styles.moreCircle}>
        <AppText align="center" tone="accent" variant="title" weight="800">
          {value}
        </AppText>
      </View>
      <AppText align="center" style={styles.personName} tone="muted" variant="caption" weight="700">
        {label}
      </AppText>
    </View>
  );
}

function PlayerCard({
  isMenuOpen = false,
  menuEnabled = false,
  menuVariant = 'friend',
  onPress,
  player,
}: {
  isMenuOpen?: boolean;
  menuEnabled?: boolean;
  menuVariant?: PlayerMenuVariant;
  onPress?: () => void;
  player: CommunityPlayerCard;
}) {
  const isShield = player.badge === 'shield';
  const isNearbyStar = menuVariant === 'connect' && !isShield;
  const hasLargeRequestMenu = menuVariant === 'request';
  const hasLargeTwoActionMenu = menuVariant !== 'request';
  const secondAction =
    menuVariant === 'connect'
      ? { icon: 'person-add-outline' as const, label: 'Add friend' }
      : { icon: 'person-remove-outline' as const, label: 'Remove' };

  if (menuEnabled && isMenuOpen) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={[styles.suggestionCard, styles.playerMenuCard]}>
        <View style={styles.playerMenuHeader}>
          <View style={styles.playerMenuAvatar}>
            <AppText align="center" variant="caption" weight="800">
              {player.initials}
            </AppText>
          </View>
          <View style={styles.playerMenuTitle}>
            <AppText numberOfLines={1} variant="bodySmall" weight="800">
              {player.name}
            </AppText>
          </View>
        </View>

        <View style={[styles.playerMenuRows, hasLargeTwoActionMenu && styles.playerMenuRowsLarge]}>
          {menuVariant === 'request' ? (
            <>
              <PlayerMenuRow accent comfortable={hasLargeRequestMenu} icon="checkmark" label="Approve" />
              <PlayerMenuRow comfortable={hasLargeRequestMenu} icon="person-circle-outline" label="Profile" />
              <PlayerMenuRow comfortable={hasLargeRequestMenu} icon="close" label="Deny" />
            </>
          ) : (
            <>
              <PlayerMenuRow expanded={hasLargeTwoActionMenu} icon="person-circle-outline" label="Profile" />
              <PlayerMenuRow expanded={hasLargeTwoActionMenu} icon={secondAction.icon} label={secondAction.label} />
            </>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole={menuEnabled ? 'button' : undefined}
      disabled={!menuEnabled}
      onPress={onPress}
      style={[styles.suggestionCard, menuEnabled && styles.suggestionCardPressable]}
    >
      <View style={styles.suggestedAvatar}>
        <AppText align="center" variant="titleSmall" weight="800">
          {player.initials}
        </AppText>
        <View style={[styles.suggestionBadge, isShield && styles.suggestionBadgeBlue, isNearbyStar && styles.suggestionBadgeGold]}>
          <Ionicons color={colors.ink} name={isShield ? 'shield-checkmark' : 'star'} size={11} />
        </View>
      </View>
      <AppText align="center" numberOfLines={1} style={styles.suggestionName} variant="bodySmall" weight="800">
        {player.name}
      </AppText>
      <View style={styles.suggestionMetaRow}>
        <MiniChip label={player.level} />
        <MiniChip icon="star" label={player.rating} warning />
      </View>
      <AppText align="center" tone="subtle" variant="caption" weight="600">
        {player.points} points
      </AppText>
    </Pressable>
  );
}

function PlayerMenuRow({
  accent = false,
  comfortable = false,
  danger = false,
  expanded = false,
  icon,
  label,
}: {
  accent?: boolean;
  comfortable?: boolean;
  danger?: boolean;
  expanded?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View
      style={[
        styles.playerMenuRow,
        comfortable && styles.playerMenuRowComfortable,
        expanded && styles.playerMenuRowLarge,
        accent && styles.playerMenuRowAccent,
      ]}
    >
      <View style={[styles.playerMenuRowIcon, danger && styles.playerMenuRowIconDanger]}>
        <Ionicons color={accent ? colors.accentLime : danger ? colors.danger : colors.darkMuted} name={icon} size={13} />
      </View>
      <AppText tone={accent ? 'accent' : danger ? 'subtle' : 'muted'} variant="caption" weight="800">
        {label}
      </AppText>
    </View>
  );
}

function ReceivedRequestCard({ index, player }: { index: number; player: CommunityPlayerCard }) {
  const requestNotes = ['2 mutual games', '3 mutual friends', 'Played at Gordon', 'Nearby player'];

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestMainRow}>
        <View style={styles.requestAvatar}>
          <AppText align="center" variant="bodySmall" weight="800">
            {player.initials}
          </AppText>
        </View>

        <View style={styles.requestCopy}>
          <View style={styles.requestNameRow}>
            <AppText numberOfLines={1} style={styles.requestName} variant="bodySmall" weight="800">
              {player.name}
            </AppText>
            <MiniChip label={player.level} />
            <MiniChip icon="star" label={player.rating} warning />
          </View>
          <AppText tone="subtle" variant="caption" weight="600">
            {requestNotes[index % requestNotes.length]} · {player.points} pts
          </AppText>
        </View>
      </View>

      <View style={styles.requestActions}>
        <Pressable accessibilityRole="button" style={[styles.requestActionButton, styles.requestApproveButton]}>
          <Ionicons color={colors.ink} name="checkmark" size={13} />
          <AppText tone="inverse" variant="caption" weight="800">
            Approve
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.requestActionButton}>
          <Ionicons color={colors.darkMuted} name="close" size={13} />
          <AppText tone="muted" variant="caption" weight="800">
            Deny
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.requestIconAction}>
          <Ionicons color={colors.darkMuted} name="person-circle-outline" size={14} />
          <AppText tone="muted" variant="caption" weight="800">
            Profile
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.requestIconAction}>
          <Ionicons color={colors.darkSubtle} name="ban-outline" size={14} />
          <AppText tone="subtle" variant="caption" weight="800">
            Block
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function MiniChip({
  icon,
  label,
  warning = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  warning?: boolean;
}) {
  return (
    <View style={[styles.miniChip, warning && styles.miniChipGold]}>
      {icon ? <Ionicons color={warning ? colors.accent : colors.darkMuted} name={icon} size={10} /> : null}
      <AppText tone={warning ? 'warning' : 'muted'} variant="caption" weight="800">
        {label}
      </AppText>
    </View>
  );
}

function LeaderboardRow({ row }: { row: (typeof leaderboard)[number] }) {
  return (
    <View style={[styles.leaderboardRow, row.isCurrent && styles.currentUserRow]}>
      <View style={[styles.rankBadge, row.rank <= 3 && styles.topRankBadge]}>
        <AppText align="center" tone={row.rank <= 3 ? 'warning' : 'muted'} variant="caption" weight="800">
          {row.rank}
        </AppText>
      </View>

      <View style={styles.leaderPlayer}>
        <View style={styles.leaderAvatar}>
          <AppText align="center" tone="inverse" variant="caption" weight="800">
            {row.initials}
          </AppText>
        </View>
        <View style={styles.leaderCopy}>
          <AppText
            numberOfLines={1}
            style={[styles.leaderName, row.isCurrent && styles.currentUserText]}
            variant="bodySmall"
            weight="800"
          >
            {row.name}
          </AppText>
          <AppText tone="subtle" variant="caption" weight="600">
            {row.games} games - {row.level} level - {row.rating} rating
          </AppText>
        </View>
      </View>

      <View style={styles.pointsBlock}>
        <AppText align="right" style={styles.pointsValue} tone="warning" variant="title" weight="800">
          {row.points}
        </AppText>
        <AppText align="right" tone="subtle" variant="caption" weight="700">
          TOCA pts
        </AppText>
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
  communitySummaryFooter: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  currentUserRow: {
    backgroundColor: 'rgba(255, 200, 61, 0.06)',
    borderColor: 'rgba(255, 200, 61, 0.20)',
  },
  currentUserText: {
    color: colors.accent,
  },
  fullLeaderboardButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 38,
  },
  friendMenuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  friendSegment: {
    borderBottomColor: 'rgba(246, 247, 237, 0.08)',
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 34,
  },
  friendSegmentItem: {
    alignItems: 'center',
    borderBottomColor: colors.transparent,
    borderBottomWidth: 2,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.xs,
  },
  friendSegmentItemActive: {
    borderBottomColor: colors.accent,
  },
  friendSearchBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.62)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  friendSearchInput: {
    color: colors.darkText,
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
    padding: 0,
  },
  leaderAvatar: {
    alignItems: 'center',
    backgroundColor: '#EEEED6',
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  leaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  leaderboardList: {
    gap: spacing.sm,
  },
  leaderboardPanel: {
    backgroundColor: 'rgba(11, 29, 16, 0.62)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  leaderboardRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.sm,
  },
  leaderName: {
    color: '#ECEDE6',
  },
  leaderPlayer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  miniChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 22,
    paddingHorizontal: 7,
  },
  miniChipGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  moreCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.70)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pageTab: {
    alignItems: 'center',
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  pageTabActive: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
  },
  pageTabs: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11, 29, 16, 0.48)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  pageTabText: {
    color: colors.darkMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  pageTabTextActive: {
    color: colors.accentLime,
  },
  personName: {
    maxWidth: 68,
  },
  playerMenuAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.07)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  playerMenuCard: {
    alignItems: 'stretch',
    backgroundColor: 'rgba(11, 29, 16, 0.86)',
    gap: 5,
    height: playerBubbleHeight,
    justifyContent: 'flex-start',
    padding: 7,
    width: playerBubbleWidth,
  },
  playerMenuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerMenuRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.07)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 26,
    paddingHorizontal: 6,
  },
  playerMenuRowComfortable: {
    minHeight: 31,
    paddingHorizontal: 7,
  },
  playerMenuRowLarge: {
    minHeight: 34,
    paddingHorizontal: 8,
  },
  playerMenuRowAccent: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
  },
  playerMenuRowIcon: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  playerMenuRowIconDanger: {
    opacity: 0.82,
  },
  playerMenuRows: {
    gap: 3,
  },
  playerMenuRowsLarge: {
    gap: 5,
  },
  playerMenuMetaRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 1,
  },
  playerMenuTitle: {
    flex: 1,
    minWidth: 0,
  },
  moreCard: {
    alignItems: 'center',
    gap: 6,
    minHeight: 144,
    padding: spacing.sm,
    width: 86,
  },
  rankBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.04)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  requestHeader: {
    alignSelf: 'flex-start',
    minHeight: 30,
    justifyContent: 'center',
  },
  requestHeaderText: {
    color: '#ECEDE6',
    fontSize: 18,
    lineHeight: 23,
  },
  requestActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.09)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  requestActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  requestApproveButton: {
    backgroundColor: colors.accentLime,
    borderColor: colors.accentLime,
    flex: 1,
  },
  requestAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.07)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  requestCard: {
    backgroundColor: 'rgba(11, 29, 16, 0.64)',
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 92,
    padding: spacing.sm,
  },
  requestCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  requestIconAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
    minHeight: 28,
    paddingHorizontal: 7,
  },
  requestList: {
    gap: spacing.xs,
  },
  requestMainRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  requestName: {
    color: '#ECEDE6',
    flexShrink: 1,
  },
  requestNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minWidth: 0,
  },
  requestPendingPill: {
    backgroundColor: 'rgba(255, 200, 61, 0.08)',
    borderColor: 'rgba(255, 200, 61, 0.22)',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pointsBlock: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  pointsValue: {
    fontSize: 20,
    lineHeight: 24,
  },
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  section: {
    gap: spacing.sm,
  },
  sectionAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingLeft: spacing.md,
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
  suggestionBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentLime,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: -1,
    height: 21,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    width: 21,
  },
  suggestionBadgeBlue: {
    backgroundColor: colors.accentSea,
  },
  suggestionBadgeGold: {
    backgroundColor: colors.accent,
  },
  suggestionCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 6,
    height: playerBubbleHeight,
    padding: spacing.sm,
    width: playerBubbleWidth,
  },
  suggestionCardPressable: {
    backgroundColor: 'rgba(11, 29, 16, 0.66)',
  },
  suggestedAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.06)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    position: 'relative',
    width: 58,
  },
  suggestionMetaRow: {
    flexDirection: 'row',
    gap: 4,
  },
  suggestionName: {
    maxWidth: 92,
  },
  suggestionRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl2,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.075)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    marginBottom: 1,
    width: 22,
  },
  summaryIconGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  summaryFooterTitle: {
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  summaryItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.025)',
    borderColor: 'rgba(246, 247, 237, 0.06)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.xs,
  },
  summaryLabel: {
    fontSize: 9,
    lineHeight: 11,
  },
  summaryStrip: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.42)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 64,
    padding: spacing.xs,
  },
  summaryValue: {
    fontSize: 17,
    lineHeight: 20,
  },
  standingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.12)',
    borderColor: 'rgba(255, 200, 61, 0.30)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  standingCard: {
    borderColor: 'rgba(255, 200, 61, 0.18)',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 86,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  standingCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  standingCurrentValue: {
    alignItems: 'center',
    flex: 1,
  },
  standingScaleEnd: {
    alignItems: 'flex-end',
    flex: 1,
  },
  standingScaleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  standingScaleStart: {
    flex: 1,
  },
  standingFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  standingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  standingMeterFill: {
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    height: '100%',
  },
  standingMeterTrack: {
    backgroundColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    height: 5,
    overflow: 'hidden',
  },
  standingMetric: {
    alignItems: 'center',
    gap: 1,
    minWidth: 78,
  },
  standingMetricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  standingPoints: {
    fontSize: 24,
    lineHeight: 27,
  },
  standingRankPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.26)',
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 24,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  tabs: {
    backgroundColor: 'rgba(3, 16, 8, 0.58)',
    borderBottomColor: colors.darkBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
  },
  tabActive: {
    backgroundColor: 'rgba(255, 200, 61, 0.06)',
    borderRadius: radius.lg,
  },
  topRankBadge: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
});
