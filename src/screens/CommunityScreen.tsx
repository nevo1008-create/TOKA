import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import { PlayerActionSheet, type PlayerAction, type PlayerActionSheetPlayer } from '../components/PlayerActionSheet';
import { PlayerProfilePreview } from '../components/PlayerProfilePreview';
import { getFallbackPreviewPlayingDetails, getPlayerPreviewPlayingDetails } from '../components/playerProfilePreviewDetails';
import { PlayerRow, type PlayerRowAction } from '../components/PlayerRow';
import { currentPlayer, players } from '../data/mock';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { Player, PlayerLevel } from '../types';

type ConnectPlayer = {
  area: string;
  badge: 'shield' | 'star';
  id: string;
  initials: string;
  level: PlayerLevel;
  name: string;
  points: number;
  rating: string;
};

type CommunityPlayerCard = {
  area?: string;
  badge: 'shield' | 'star';
  id: string;
  initials: string;
  level: PlayerLevel;
  name: string;
  points: number;
  rating: string;
  sourcePlayerId?: string;
};

const connectPlayers: ConnectPlayer[] = [
  { id: 'c1', initials: 'AM', name: 'Amit', points: 290, rating: '3.5', level: 'B+', badge: 'star', area: 'Gordon Beach' },
  { id: 'c2', initials: 'YN', name: 'Yoni', points: 242, rating: '3.2', level: 'B', badge: 'star', area: 'Hilton Beach' },
  { id: 'c3', initials: 'TL', name: 'Tal', points: 471, rating: '4.0', level: 'A-', badge: 'shield', area: 'Polegy Beach' },
  { id: 'c4', initials: 'NM', name: 'Noam', points: 318, rating: '3.6', level: 'B+', badge: 'star', area: 'Frishman Beach' },
  { id: 'c5', initials: 'ID', name: 'Ido', points: 265, rating: '3.3', level: 'B', badge: 'shield', area: 'Aqueduct Beach' },
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

type CommunityPage = (typeof communityPages)[number];
type FriendView = (typeof friendViews)[number];
type PlayerMenuVariant = 'connect' | 'friend' | 'leaderboard' | 'request' | 'requested';
type ProfilePreviewPlayer = CommunityPlayerCard & {
  context: string;
  menuVariant: PlayerMenuVariant;
};

type CommunityScreenProps = {
  notificationCount: number;
  onAddFriend: () => void;
  onInvitePlayer: (playerId: string, source: 'community' | 'leaderboard') => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onViewPlayerProfile: (player: Player) => void;
};

export function CommunityScreen({
  notificationCount,
  onAddFriend,
  onInvitePlayer,
  onOpenMenu,
  onOpenNotifications,
  onViewPlayerProfile,
}: CommunityScreenProps) {
  const [activePage, setActivePage] = useState<CommunityPage>('Community');
  const [activeFriendView, setActiveFriendView] = useState<FriendView>('Friends');
  const [actionSheetPlayer, setActionSheetPlayer] = useState<PlayerActionSheetPlayer | null>(null);
  const [actionSheetActions, setActionSheetActions] = useState<PlayerAction[]>([]);
  const [profilePreviewPlayer, setProfilePreviewPlayer] = useState<ProfilePreviewPlayer | null>(null);
  const [leaderboardScope, setLeaderboardScope] = useState<'All' | 'Friends' | 'Region'>('Friends');
  const [cancelledRequestIds, setCancelledRequestIds] = useState<string[]>([]);
  const [requestedPlayerIds, setRequestedPlayerIds] = useState<string[]>([]);
  const friendPlayers = players.filter((player) => currentPlayer.friendIds.includes(player.id));
  const visibleFriends = [
    ...friendPlayers,
    ...players.filter((player) => player.id !== currentPlayer.id && !currentPlayer.friendIds.includes(player.id)),
  ].slice(0, 4);
  const friendCards: CommunityPlayerCard[] = visibleFriends.map((player, index) => ({
    area: player.area,
    badge: index % 3 === 2 ? 'shield' : 'star',
    id: player.id,
    initials: player.initials,
    level: player.level,
    name: player.name,
    points: player.tocaPoints,
    rating: player.id === currentPlayer.id ? '3.6' : index === 0 ? '3.2' : index === 1 ? '3.6' : index === 2 ? '4.0' : '3.3',
    sourcePlayerId: player.id,
  }));
  const requestCards: CommunityPlayerCard[] = connectPlayers.slice(0, 4);
  const activeSocialCards = activeFriendView === 'Friends' ? friendCards : requestCards;

  function openActions(player: CommunityPlayerCard, context: PlayerMenuVariant) {
    const playerId = player.sourcePlayerId ?? player.id;
    const isFriend = Boolean(player.sourcePlayerId && currentPlayer.friendIds.includes(player.sourcePlayerId));
    const isRequested = context === 'requested' || requestedPlayerIds.includes(playerId);

    setActionSheetPlayer({
      contextLabel: getCommunityContext(player, context),
      initials: player.initials,
      name: player.name,
    });
    setActionSheetActions(
      getPlayerActions(
        context,
        isFriend,
        isRequested,
        () => openProfile(player, context),
        player.sourcePlayerId
          ? () => onInvitePlayer(player.sourcePlayerId as string, context === 'leaderboard' ? 'leaderboard' : 'community')
          : undefined,
        () => requestFriend(playerId),
        () => cancelFriendRequest(playerId),
      ),
    );
  }

  function openProfile(player: CommunityPlayerCard, context: PlayerMenuVariant) {
    setProfilePreviewPlayer({ ...player, context: getCommunityContext(player, context), menuVariant: context });
  }

  function requestFriend(playerId: string) {
    setRequestedPlayerIds((current) => (current.includes(playerId) ? current : [...current, playerId]));
  }

  function cancelFriendRequest(playerId: string) {
    setRequestedPlayerIds((current) => current.filter((id) => id !== playerId));
    setCancelledRequestIds((current) => (current.includes(playerId) ? current : [...current, playerId]));
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
        rightAccessory="menu"
      />

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
                  variant="button"
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
                          tone={isActive ? 'accent' : 'muted'}
                          variant="chip"
                          weight="800"
                        >
                          {view}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable accessibilityRole="button" onPress={onAddFriend} style={styles.sectionAction}>
                  <AppText tone="accent" variant="button" weight="800">
                    Add friend
                  </AppText>
                  <Ionicons color={colors.accentLime} name="person-add-outline" size={15} />
                </Pressable>
              </View>

              {activeFriendView === 'Friends' ? (
                <View style={styles.friendSearchBox}>
                  <Ionicons color={colors.subtle} name="search" size={16} />
                  <TextInput
                    placeholder="Search friends"
                    placeholderTextColor={colors.subtle}
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

              <View style={styles.playerRowStack}>
                {activeSocialCards.map((player) => {
                  const context = activeFriendView === 'Friends' ? 'friend' : 'request';

                  return (
                    <PlayerRow
                      context={getCommunityContext(player, context)}
                      initials={player.initials}
                      key={`${activeFriendView}-${player.id}`}
                      level={player.level}
                      location={player.area}
                      name={player.name}
                      onMore={() => openActions(player, context)}
                      onPressProfile={() => openProfile(player, context)}
                      primaryAction={
                        context === 'request'
                          ? { label: 'Accept' }
                          : undefined
                      }
                      rating={player.rating}
                      secondaryAction={context === 'request' ? { label: 'Decline' } : undefined}
                      statusIcon={player.badge === 'shield' ? 'shield-checkmark' : 'star'}
                      style={context === 'request' ? styles.friendRequestPlayerRow : undefined}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <SectionHeader title={activeFriendView === 'Friend requests' ? 'Sent' : 'Connect nearby'} />
              <View style={styles.playerRowStack}>
                {(activeFriendView === 'Friend requests'
                  ? connectPlayers.filter((player) => !cancelledRequestIds.includes(player.id))
                  : connectPlayers
                ).map((player) => {
                  const isRequested = activeFriendView === 'Friend requests' || requestedPlayerIds.includes(player.id);

                  return (
                    <PlayerRow
                      context={getCommunityContext(player, 'connect')}
                      initials={player.initials}
                      key={player.id}
                      level={player.level}
                      location={player.area}
                      name={player.name}
                      onMore={() => openActions(player, isRequested ? 'requested' : 'connect')}
                      onPressProfile={() => openProfile(player, isRequested ? 'requested' : 'connect')}
                      primaryAction={
                        isRequested
                          ? getRelationshipAction({
                              isFriend: false,
                              isRequested,
                              onAdd: () => requestFriend(player.id),
                            })
                          : undefined
                      }
                      rating={player.rating}
                      statusIcon={player.badge === 'shield' ? 'shield-checkmark' : 'star'}
                    />
                  );
                })}
              </View>
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
                  <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
                    Leaderboard
                  </AppText>
                  <AppText tone="muted" variant="metadata" weight="600">
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
                      tone={leaderboardScope === tab ? 'accent' : 'muted'}
                      variant="chip"
                      weight="800"
                    >
                      {tab}
                    </AppText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.leaderboardList}>
                {leaderboard.map((row) => (
                  <LeaderboardRow
                    key={row.rank}
                    onMore={() => {
                      const player = rowToCommunityPlayer(row);
                      openActions(player, 'leaderboard');
                    }}
                    onPressProfile={() => openProfile(rowToCommunityPlayer(row), 'leaderboard')}
                    row={row}
                  />
                ))}
              </View>

              <Pressable accessibilityRole="button" style={styles.fullLeaderboardButton}>
                <AppText tone="accent" variant="button" weight="800">
                  View full leaderboard
                </AppText>
                <Ionicons color={colors.accentLime} name="chevron-forward" size={16} />
              </Pressable>

              <View style={styles.leaderboardInsight}>
                <Ionicons color={colors.accent} name="flash-outline" size={16} />
                <AppText style={styles.leaderboardInsightText} variant="uiBody" weight="800">
                  Rate your last game for +20 pts
                </AppText>
              </View>
            </View>
          </>
        )}
      </View>
      <PlayerActionSheet
        actions={actionSheetActions}
        contextLabel={actionSheetPlayer?.contextLabel}
        initials={actionSheetPlayer?.initials ?? ''}
        name={actionSheetPlayer?.name ?? ''}
        onClose={() => setActionSheetPlayer(null)}
        visible={Boolean(actionSheetPlayer)}
      />
      <PlayerProfilePreview
        context={profilePreviewPlayer?.context}
        initials={profilePreviewPlayer?.initials ?? ''}
        level={profilePreviewPlayer?.level}
        meta={profilePreviewPlayer ? `${profilePreviewPlayer.points} TOCA points` : undefined}
        moreActions={
          profilePreviewPlayer
            ? getPlayerActions(
                profilePreviewPlayer.menuVariant,
                Boolean(profilePreviewPlayer.sourcePlayerId && currentPlayer.friendIds.includes(profilePreviewPlayer.sourcePlayerId)),
                profilePreviewPlayer.menuVariant === 'requested' ||
                  requestedPlayerIds.includes(profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id),
                () => undefined,
                profilePreviewPlayer.sourcePlayerId
                  ? () =>
                      onInvitePlayer(
                        profilePreviewPlayer.sourcePlayerId as string,
                        profilePreviewPlayer.menuVariant === 'leaderboard' ? 'leaderboard' : 'community',
                      )
                  : undefined,
                () => requestFriend(profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id),
                () => cancelFriendRequest(profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id),
              )
            : undefined
        }
        name={profilePreviewPlayer?.name ?? ''}
        onClose={() => setProfilePreviewPlayer(null)}
        primaryAction={
          profilePreviewPlayer
            ? {
                label: 'View full profile',
                onPress: () => onViewPlayerProfile(getProfilePlayerFromCommunity(profilePreviewPlayer)),
              }
            : undefined
        }
        profileDetails={
          profilePreviewPlayer
            ? getCommunityPreviewDetails(
                profilePreviewPlayer.sourcePlayerId
                  ? players.find((candidate) => candidate.id === profilePreviewPlayer.sourcePlayerId)
                  : undefined,
              )
            : undefined
        }
        secondaryAction={
          profilePreviewPlayer
            ? {
                disabled:
                  getCommunityProfileActionState(
                    profilePreviewPlayer,
                    currentPlayer.friendIds.includes(profilePreviewPlayer.sourcePlayerId ?? ''),
                    profilePreviewPlayer.menuVariant === 'requested' ||
                      requestedPlayerIds.includes(profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id),
                  ).label === 'Requested',
                label: getCommunityProfileActionState(
                  profilePreviewPlayer,
                  currentPlayer.friendIds.includes(profilePreviewPlayer.sourcePlayerId ?? ''),
                  profilePreviewPlayer.menuVariant === 'requested' ||
                    requestedPlayerIds.includes(profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id),
                ).label,
                onPress: () => {
                  const actionState = getCommunityProfileActionState(
                    profilePreviewPlayer,
                    currentPlayer.friendIds.includes(profilePreviewPlayer.sourcePlayerId ?? ''),
                    profilePreviewPlayer.menuVariant === 'requested' ||
                      requestedPlayerIds.includes(profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id),
                  );
                  const playerId = profilePreviewPlayer.sourcePlayerId ?? profilePreviewPlayer.id;

                  if (actionState.kind === 'invite' && profilePreviewPlayer.sourcePlayerId) {
                    onInvitePlayer(
                      profilePreviewPlayer.sourcePlayerId,
                      profilePreviewPlayer.menuVariant === 'leaderboard' ? 'leaderboard' : 'community',
                    );
                  }

                  if (actionState.kind === 'add') {
                    requestFriend(playerId);
                  }
                },
              }
            : undefined
        }
        rating={profilePreviewPlayer?.rating}
        trustCues={
          profilePreviewPlayer
            ? getCommunityPreviewTrustCues(
                profilePreviewPlayer,
                profilePreviewPlayer.sourcePlayerId
                  ? players.find((candidate) => candidate.id === profilePreviewPlayer.sourcePlayerId)
                  : undefined,
              )
            : undefined
        }
        visible={Boolean(profilePreviewPlayer)}
      />
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
      colors={[colors.surfaceYellow, colors.surface, colors.surfaceMuted]}
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
          <AppText style={styles.standingPoints} tone="warning" variant="heroTitle" weight="800">
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
        <StandingMetric icon="ribbon-outline" label="Rank" value={currentPlayer.level} />
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
      <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
        {title}
      </AppText>
      {action && icon ? (
        <Pressable accessibilityRole="button" style={styles.sectionAction}>
          <AppText tone="accent" variant="button" weight="800">
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
        <AppText align="center" tone="accent" variant="cardTitle" weight="800">
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
            <AppText numberOfLines={1} variant="metadata" weight="800">
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
      <AppText align="center" numberOfLines={1} style={styles.suggestionName} variant="uiBody" weight="800">
        {player.name}
      </AppText>
      <View style={styles.suggestionMetaRow}>
        <MiniChip label={player.level} />
        <MiniChip icon="star" label={player.rating} warning />
      </View>
      <AppText align="center" tone="muted" variant="metadata" weight="600">
        {getCommunityContext(player, menuVariant)}
      </AppText>
    </Pressable>
  );
}

function getCommunityContext(player: CommunityPlayerCard, menuVariant: PlayerMenuVariant) {
  if (menuVariant === 'connect') {
    return player.level === 'A-' ? 'Usually Gordon evenings' : 'Available today';
  }

  if (menuVariant === 'requested') {
    return 'Friend request sent';
  }

  if (menuVariant === 'leaderboard') {
    return `${player.points} pts this month`;
  }

  if (menuVariant === 'request') {
    return 'Played at Gordon';
  }

  return player.points > 400 ? 'B+ regular' : 'Played together 4x';
}

function getCommunityPreviewTrustCues(player: CommunityPlayerCard, sourcePlayer?: Player) {
  return [
    {
      icon: 'checkmark-circle-outline' as const,
      label: 'Show-up rate',
      value: sourcePlayer
        ? sourcePlayer.rankStatus === 'established'
          ? '98%'
          : sourcePlayer.rankStatus === 'stabilizing'
            ? '94%'
            : 'New'
        : player.badge === 'shield'
          ? 'Verified'
          : 'Active',
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Games played',
      tone: 'aqua' as const,
      value: sourcePlayer ? `${sourcePlayer.gamesPlayed}` : player.points > 400 ? '20+' : '8+',
    },
  ];
}

function getCommunityPreviewDetails(sourcePlayer?: Player) {
  return sourcePlayer ? getPlayerPreviewPlayingDetails(sourcePlayer) : getFallbackPreviewPlayingDetails();
}

function getPlayerActions(
  context: PlayerMenuVariant,
  isFriend: boolean,
  isRequested: boolean,
  onViewProfile: () => void,
  onInviteToGame?: () => void,
  onAddFriend?: () => void,
  onRemoveRequest?: () => void,
): PlayerAction[] {
  const profileLabel = isFriend ? 'Show full profile' : 'View full profile';
  const viewProfileAction = { icon: 'person-circle-outline' as const, label: profileLabel, onPress: onViewProfile };
  const inviteAction = { icon: 'paper-plane-outline' as const, label: 'Invite to game', onPress: onInviteToGame };
  const reportAction = { destructive: true, icon: 'ban-outline' as const, label: 'Report & block' };

  if (isRequested || context === 'requested') {
    return [
      viewProfileAction,
      inviteAction,
      { icon: 'person-remove-outline' as const, label: 'Remove friend request', onPress: onRemoveRequest },
      reportAction,
    ];
  }

  if (context === 'friend') {
    return [
      viewProfileAction,
      inviteAction,
      { destructive: true, icon: 'person-remove-outline', label: 'Remove friend' },
      reportAction,
    ];
  }

  if (context === 'request') {
    return [
      viewProfileAction,
      { icon: 'checkmark' as const, label: 'Accept' },
      { icon: 'close' as const, label: 'Decline' },
      reportAction,
    ];
  }

  return [
    viewProfileAction,
    { icon: 'person-add-outline', label: 'Add friend', onPress: onAddFriend },
    inviteAction,
    reportAction,
  ];
}

function getCommunityProfileActionState(
  player: ProfilePreviewPlayer,
  isFriend: boolean,
  isRequested: boolean,
): { kind: 'accept' | 'add' | 'invite' | 'message' | 'requested'; label: string } {
  if (isRequested && player.menuVariant !== 'request') {
    return { kind: 'requested', label: 'Requested' };
  }

  if (!isFriend && player.menuVariant !== 'request') {
    return { kind: 'add', label: 'Add friend' };
  }

  return { kind: getProfilePreviewActionKind(player.menuVariant), label: getProfilePreviewActionLabel(player.menuVariant) };
}

function getProfilePreviewActionKind(context: PlayerMenuVariant) {
  if (context === 'friend') {
    return 'invite' as const;
  }

  if (context === 'request') {
    return 'accept' as const;
  }

  if (context === 'leaderboard') {
    return 'invite' as const;
  }

  return 'add' as const;
}

function getProfilePreviewActionLabel(context: PlayerMenuVariant) {
  if (context === 'friend') {
    return 'Invite to game';
  }

  if (context === 'request') {
    return 'Accept';
  }

  if (context === 'leaderboard') {
    return 'Invite to game';
  }

  return 'Add friend';
}

function getRelationshipAction({
  isFriend,
  isRequested,
  onAdd,
}: {
  isFriend: boolean;
  isRequested: boolean;
  onAdd: () => void;
}): PlayerRowAction | undefined {
  if (isFriend) {
    return undefined;
  }

  if (isRequested) {
    return {
      disabled: true,
      label: 'Requested',
      variant: 'muted',
    };
  }

  return {
    label: 'Add friend',
    onPress: onAdd,
  };
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
        <Ionicons color={accent ? colors.accentLime : danger ? colors.danger : colors.muted} name={icon} size={13} />
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
          <Ionicons color={colors.muted} name="close" size={13} />
          <AppText tone="muted" variant="caption" weight="800">
            Deny
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.requestIconAction}>
          <Ionicons color={colors.muted} name="person-circle-outline" size={14} />
          <AppText tone="muted" variant="caption" weight="800">
            Profile
          </AppText>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.requestIconAction}>
          <Ionicons color={colors.subtle} name="ban-outline" size={14} />
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
      {icon ? <Ionicons color={warning ? colors.accentGoldDark : colors.muted} name={icon} size={10} /> : null}
      <AppText tone="muted" variant="chip" weight="800">
        {label}
      </AppText>
    </View>
  );
}

function rowToCommunityPlayer(row: (typeof leaderboard)[number]): CommunityPlayerCard {
  const matchedPlayer = players.find((player) => player.initials === row.initials || player.name === row.name);

  return {
    area: matchedPlayer?.area ?? 'Tel Aviv beaches',
    badge: row.rank <= 3 ? 'star' : 'shield',
    id: `leader-${row.rank}`,
    initials: row.initials,
    level: row.level,
    name: row.name,
    points: row.points,
    rating: row.rating,
    sourcePlayerId: matchedPlayer?.id,
  };
}

function getProfilePlayerFromCommunity(player: ProfilePreviewPlayer): Player {
  const sourcePlayer = player.sourcePlayerId
    ? players.find((candidate) => candidate.id === player.sourcePlayerId)
    : undefined;

  if (sourcePlayer) {
    return sourcePlayer;
  }

  return {
    area: player.area ?? 'Nearby beaches',
    friendIds: [],
    gamesPlayed: player.points > 400 ? 28 : 8,
    gender: 'male',
    hasBall: false,
    hasCourtMarks: false,
    id: player.id,
    initials: player.initials,
    level: player.level,
    name: player.name,
    preferredFoot: 'right',
    rankStatus: player.badge === 'shield' ? 'established' : 'self_declared',
    side: 'both',
    tocaPoints: player.points,
  };
}

function LeaderboardRow({
  onMore,
  onPressProfile,
  row,
}: {
  onMore: () => void;
  onPressProfile: () => void;
  row: (typeof leaderboard)[number];
}) {
  return (
    <View style={[styles.leaderboardRow, row.isCurrent && styles.currentUserRow]}>
      <View style={[styles.rankBadge, row.rank <= 3 && styles.topRankBadge]}>
        <AppText align="center" tone={row.rank <= 3 ? 'warning' : 'muted'} variant="caption" weight="800">
          {row.rank}
        </AppText>
      </View>

      <Pressable accessibilityRole="button" onPress={onPressProfile} style={styles.leaderPlayer}>
        <View style={styles.leaderAvatar}>
          <AppText align="center" tone="inverse" variant="caption" weight="800">
            {row.initials}
          </AppText>
        </View>
        <View style={styles.leaderCopy}>
          <AppText
            numberOfLines={1}
            style={[styles.leaderName, row.isCurrent && styles.currentUserText]}
            variant="cardTitle"
            weight="800"
          >
            {row.name}
          </AppText>
          <AppText tone="subtle" variant="caption" weight="600">
            {row.games} games - {row.level} rank - {row.rating} rating
          </AppText>
        </View>
      </Pressable>

      <View style={styles.pointsBlock}>
        <AppText align="right" style={styles.pointsValue} tone="warning" variant="title" weight="800">
          {row.points}
        </AppText>
        <AppText align="right" tone="subtle" variant="caption" weight="700">
          TOCA pts
        </AppText>
      </View>

      <Pressable accessibilityRole="button" onPress={onMore} style={styles.leaderMoreButton}>
        <Ionicons color={colors.muted} name="ellipsis-horizontal" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 430,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    gap: 16,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
  },
  friendMenuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  friendSegment: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 2,
    minHeight: 36,
    padding: 3,
  },
  friendSegmentItem: {
    alignItems: 'center',
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  friendSegmentItemActive: {
    backgroundColor: colors.surfaceMuted,
  },
  friendSearchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  friendSearchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 13,
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
  leaderMoreButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  leaderboardList: {
    gap: spacing.sm,
  },
  leaderboardPanel: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  leaderboardInsight: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.46)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  leaderboardInsightText: {
    flex: 1,
  },
  leaderboardRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.sm,
    ...shadows.soft,
  },
  leaderName: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 22,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 22,
    paddingHorizontal: 7,
  },
  miniChipGold: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  moreCircle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
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
    minHeight: 34,
    paddingHorizontal: spacing.lg,
  },
  pageTabActive: {
    backgroundColor: colors.surfaceMuted,
  },
  pageTabs: {
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
  pageTabText: {
    color: colors.muted,
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
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  playerMenuCard: {
    alignItems: 'stretch',
    backgroundColor: colors.surfaceRaised,
    gap: 5,
    height: 144,
    justifyContent: 'flex-start',
    padding: 7,
    width: 108,
  },
  playerMenuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerMenuRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSoft,
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
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
  playerRowStack: {
    gap: spacing.sm,
  },
  friendRequestPlayerRow: {
    minHeight: 78,
    paddingVertical: spacing.sm,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.ink,
    fontSize: 18,
    lineHeight: 23,
  },
  requestActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  requestCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 92,
    padding: spacing.sm,
    ...shadows.soft,
  },
  requestCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  requestIconAction: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
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
    color: colors.ink,
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
    flexShrink: 0,
    width: 48,
  },
  pointsValue: {
    fontSize: 20,
    lineHeight: 24,
  },
  screen: {
    backgroundColor: colors.background,
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
    borderColor: colors.background,
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
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
    height: 144,
    padding: spacing.sm,
    width: 108,
    ...shadows.soft,
  },
  suggestionCardPressable: {
    backgroundColor: colors.surface,
  },
  suggestedAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
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
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
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
    backgroundColor: colors.surface,
    borderColor: colors.surfaceAqua,
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
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 64,
    padding: spacing.xs,
    ...shadows.soft,
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
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 86,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.card,
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
    backgroundColor: colors.border,
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
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
  },
  tabActive: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
  },
  topRankBadge: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
});
