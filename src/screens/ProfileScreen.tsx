import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { HomeHeader } from '../components/home/HomeHeader';
import { PlayerActionSheet, type PlayerAction, type PlayerActionSheetPlayer } from '../components/PlayerActionSheet';
import { PlayerProfilePreview } from '../components/PlayerProfilePreview';
import {
  getPlayerCompletedGamesCount,
  getPlayerCompletedLobbies,
  getPlayerHostedGamesCount,
  getPlayerPreviewPlayingDetails,
  getPlayerPreviewTrustCues,
} from '../components/playerProfilePreviewDetails';
import { PlayerRow } from '../components/PlayerRow';
import { areFriends, getPendingSentFriendRequest } from '../features/friends/friendRules';
import { formatPlayerRating } from '../features/ratings/playerRatingSummary';
import { ProgressBar } from '../components/ProgressBar';
import { getTocaPointProgress } from '../features/tocaPoints/tocaPointProgression';
import { colors, radius, shadows, spacing } from '../theme';
import type { FriendRequest, Lobby, Player } from '../types';

type ProfileScreenProps = {
  currentPlayer: Player;
  friendRequests: FriendRequest[];
  lobbies: Lobby[];
  notificationCount: number;
  onBack?: () => void;
  onCancelFriendRequest: (requestId: string) => void;
  onEditProfile?: () => void;
  onInvitePlayer: (playerId: string) => void;
  onOpenMenu?: () => void;
  onOpenNotifications: () => void;
  onRemoveFriend: (playerId: string) => void;
  onSendFriendRequest: (playerId: string) => void;
  onViewPlayerProfile?: (player: Player) => void;
  player: Player;
  players: Player[];
};

export function ProfileScreen({
  currentPlayer,
  friendRequests,
  lobbies,
  notificationCount,
  onBack,
  onCancelFriendRequest,
  onEditProfile,
  onInvitePlayer,
  onOpenMenu,
  onOpenNotifications,
  onRemoveFriend,
  onSendFriendRequest,
  onViewPlayerProfile,
  player,
  players,
}: ProfileScreenProps) {
  const [actionSheetActions, setActionSheetActions] = useState<PlayerAction[]>([]);
  const [actionSheetPlayer, setActionSheetPlayer] = useState<PlayerActionSheetPlayer | null>(null);
  const [profilePreviewPlayer, setProfilePreviewPlayer] = useState<{
    context: 'friend' | 'recent';
    player: Player;
  } | null>(null);
  const profileStats = getProfileStats(player, lobbies);
  const friendPlayers = players.filter((candidate) => areFriends(player, candidate));
  const recentPlayers = getRecentPlayers(player, lobbies, players);

  function openActions(person: Player, context: 'friend' | 'recent') {
    const isFriend = areFriends(currentPlayer, person);
    const pendingRequest = getPendingSentFriendRequest(friendRequests, currentPlayer.id, person.id);
    const isRequested = Boolean(pendingRequest);

    setActionSheetPlayer({
      contextLabel: getProfilePlayerContext(person, context, isFriend),
      initials: person.initials,
      name: person.name,
    });
    setActionSheetActions(
      getProfilePlayerActions(
        context,
        isFriend,
        isRequested,
        () => openProfile(person, context),
        () => onInvitePlayer(person.id),
        () => requestFriend(person.id),
        pendingRequest ? () => onCancelFriendRequest(pendingRequest.id) : undefined,
        () => onRemoveFriend(person.id),
      ),
    );
  }

  function openProfile(person: Player, context: 'friend' | 'recent') {
    setProfilePreviewPlayer({ context, player: person });
  }

  function requestFriend(playerId: string) {
    onSendFriendRequest(playerId);
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
        onBack={onBack}
        onMenuPress={onOpenMenu}
        onNotificationsPress={onOpenNotifications}
        player={player}
      />

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Avatar player={player} size={72} />
            </View>

            <View style={styles.profileCopy}>
              <View style={styles.nameRow}>
                <AppText numberOfLines={1} style={styles.profileName} variant="sectionHeading" weight="800">
                  {player.name}
                </AppText>
                <View style={styles.verifiedPill}>
                  <Ionicons color={colors.accentSea} name="shield-checkmark" size={13} />
                </View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons color={colors.accentSea} name="location" size={14} />
                <AppText numberOfLines={1} tone="muted" variant="bodySmall" weight="600">
                  {player.area}
                </AppText>
              </View>
              <View style={styles.profileMetaRow}>
                <Ionicons color={colors.subtle} name="person-outline" size={13} />
                <AppText numberOfLines={1} tone="subtle" variant="caption" weight="600">
                  {capitalize(player.gender)}
                </AppText>
              </View>
            </View>

            {onEditProfile ? (
              <Pressable accessibilityRole="button" onPress={onEditProfile} style={styles.editButton}>
                <Ionicons color={colors.accentLime} name="pencil-outline" size={16} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.pointsCard}>
          <LinearGradient
            colors={[colors.accentGold, '#FFE889', colors.accentGoldDark]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.levelBadge}
          >
            <AppText align="center" tone="primary" style={styles.levelLabel} weight="800">
              Level
            </AppText>
            <AppText align="center" tone="primary" style={styles.levelNumber} weight="800">
              {profileStats.tocaLevel}
            </AppText>
          </LinearGradient>

          <View style={styles.pointsCopy}>
            <View style={styles.pointsHeader}>
              <View style={styles.pointsTitleBlock}>
                <AppText tone="muted" variant="metadata" weight="700">
                  TOCA Points
                </AppText>
                <AppText style={styles.pointsValue} variant="cardTitle" weight="900">
                  {player.tocaPoints.toLocaleString()} pts
                </AppText>
              </View>
              <View style={styles.nextLevelPill}>
                <AppText align="center" tone="warning" variant="caption" weight="800">
                  Level {profileStats.nextTocaLevel}
                </AppText>
                <AppText align="center" tone="muted" variant="caption" weight="700">
                  {profileStats.nextLevelPoints.toLocaleString()} pts
                </AppText>
              </View>
            </View>
            <ProgressBar fillColor={colors.accentGold} progress={profileStats.levelProgress} style={styles.progress} trackColor="#D9E8D8" />
            <AppText tone="muted" variant="metadata" weight="600">
              {profileStats.pointsToNextLevel.toLocaleString()} pts to next level
            </AppText>
          </View>
        </View>

        <View style={styles.summaryStrip}>
          <SummaryItem icon="ribbon-outline" label="Rank" value={player.level} />
          <View style={styles.summaryDivider} />
          <SummaryItem icon="star-outline" label="Rating" tone="rating" value={formatPlayerRating(player)} />
          <View style={styles.summaryDivider} />
          <SummaryItem icon="calendar-outline" label="Games" value={`${profileStats.completedGames}`} />
          <View style={styles.summaryDivider} />
          <SummaryItem icon="people-outline" label="Friends" tone="purple" value={`${friendPlayers.length}`} />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Playing profile" />
          <View style={styles.playingGrid}>
            <PlayingCell icon="walk-outline" label="Foot" value={capitalize(player.preferredFoot)} />
            <PlayingCell icon="swap-horizontal-outline" label="Side" value={capitalize(player.side)} />
            <GearCell hasBall={player.hasBall} hasCourtMarks={player.hasCourtMarks} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Trust & routine" />
          <View style={styles.trustGrid}>
            <TrustCue icon="calendar-outline" label="Completed games" value={`${profileStats.completedGames}`} />
            <TrustCue icon="flag-outline" label="Hosted games" value={`${profileStats.hostedGames}`} />
            <TrustCue icon="people-outline" label="Friends" value={`${friendPlayers.length}`} warning />
            <TrustCue icon="location" label="Preferred beaches" value={profileStats.preferredBeaches} sea />
          </View>
        </View>

        <PeopleSection
          action="See all"
          context="friend"
          onMore={openActions}
          onPressProfile={openProfile}
          ownerPlayer={player}
          players={friendPlayers}
          emptyBody="Friends will appear here after this player connects with others."
          emptyTitle="No friends yet"
          title="Friends"
        />
        <PeopleSection
          context="recent"
          onMore={openActions}
          onPressProfile={openProfile}
          ownerPlayer={player}
          players={recentPlayers}
          emptyBody="Completed match history will appear here."
          emptyTitle="No completed games yet"
          showRecency
          title="Recently played with"
        />

        <View style={styles.section}>
          <SectionHeader title="Badges & titles" />
          <ScrollView horizontal contentContainerStyle={styles.badgeRow} showsHorizontalScrollIndicator={false}>
            <BadgeCard icon="lock-closed-outline" title="Coming soon" description="Badges unlock after achievement rules are connected." muted />
            <BadgeCard icon="sunny-outline" title="Beach Player" description="Planned achievement" muted />
            <BadgeCard icon="heart-outline" title="Fair Player" description="Planned achievement" muted />
          </ScrollView>
        </View>
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
        context={
          profilePreviewPlayer
            ? getProfilePlayerContext(
                profilePreviewPlayer.player,
                profilePreviewPlayer.context,
                areFriends(currentPlayer, profilePreviewPlayer.player),
              )
            : undefined
        }
        initials={profilePreviewPlayer?.player.initials ?? ''}
        level={profilePreviewPlayer?.player.level}
        meta={profilePreviewPlayer ? `${profilePreviewPlayer.player.tocaPoints} TOCA points` : undefined}
        moreActions={
          profilePreviewPlayer
            ? getProfilePlayerActions(
                profilePreviewPlayer.context,
                areFriends(currentPlayer, profilePreviewPlayer.player),
                Boolean(getPendingSentFriendRequest(friendRequests, currentPlayer.id, profilePreviewPlayer.player.id)),
                () => undefined,
                () => onInvitePlayer(profilePreviewPlayer.player.id),
                () => requestFriend(profilePreviewPlayer.player.id),
                getPendingSentFriendRequest(friendRequests, currentPlayer.id, profilePreviewPlayer.player.id)
                  ? () => onCancelFriendRequest(
                      getPendingSentFriendRequest(friendRequests, currentPlayer.id, profilePreviewPlayer.player.id)?.id ?? '',
                    )
                  : undefined,
                () => onRemoveFriend(profilePreviewPlayer.player.id),
              )
            : undefined
        }
        name={profilePreviewPlayer?.player.name ?? ''}
        onClose={() => setProfilePreviewPlayer(null)}
        player={profilePreviewPlayer?.player}
        primaryAction={
          profilePreviewPlayer
            ? {
                label: 'View full profile',
                onPress: () => onViewPlayerProfile?.(profilePreviewPlayer.player),
              }
            : undefined
        }
        profileDetails={
          profilePreviewPlayer ? getPreviewPlayingDetails(profilePreviewPlayer.player) : undefined
        }
        secondaryAction={
          profilePreviewPlayer
            ? {
                disabled:
                  getProfilePreviewActionLabel(
                    profilePreviewPlayer.context,
                    areFriends(currentPlayer, profilePreviewPlayer.player),
                    Boolean(getPendingSentFriendRequest(friendRequests, currentPlayer.id, profilePreviewPlayer.player.id)),
                  ) === 'Requested',
                label: getProfilePreviewActionLabel(
                  profilePreviewPlayer.context,
                  areFriends(currentPlayer, profilePreviewPlayer.player),
                  Boolean(getPendingSentFriendRequest(friendRequests, currentPlayer.id, profilePreviewPlayer.player.id)),
                ),
                onPress: () => {
                  const actionLabel = getProfilePreviewActionLabel(
                    profilePreviewPlayer.context,
                    areFriends(currentPlayer, profilePreviewPlayer.player),
                    Boolean(getPendingSentFriendRequest(friendRequests, currentPlayer.id, profilePreviewPlayer.player.id)),
                  );

                  if (actionLabel === 'Invite' || actionLabel === 'Invite to game') {
                    onInvitePlayer(profilePreviewPlayer.player.id);
                  }

                  if (actionLabel === 'Add friend') {
                    requestFriend(profilePreviewPlayer.player.id);
                  }
                },
              }
            : undefined
        }
        trustCues={profilePreviewPlayer ? getPlayerPreviewTrustCues(profilePreviewPlayer.player, lobbies) : undefined}
        rating={profilePreviewPlayer ? formatPlayerRating(profilePreviewPlayer.player) : undefined}
        visible={Boolean(profilePreviewPlayer)}
      />
    </View>
  );
}

function SummaryItem({
  icon,
  label,
  tone,
  value,
  warning = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'purple' | 'rating' | 'sea';
  value: string;
  warning?: boolean;
}) {
  const accentColor =
    tone === 'sea'
      ? colors.accentSea
      : tone === 'purple'
        ? colors.accentPurple
        : tone === 'rating' || warning
          ? colors.accentGoldDark
          : colors.accentLime;

  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryIcon, (warning || tone === 'rating') && styles.summaryIconRating, tone === 'sea' && styles.summaryIconSea, tone === 'purple' && styles.summaryIconPurple]}>
        <Ionicons color={accentColor} name={icon} size={15} />
      </View>
      <AppText tone="primary" variant="cardTitle" weight="800">
        {value}
      </AppText>
      <AppText tone="muted" variant="metadata" weight="600">
        {label}
      </AppText>
    </View>
  );
}

function PlayingCell({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.playingCell}>
      <View style={styles.playingIconSlot}>
        <View style={styles.playingIcon}>
          <Ionicons color={colors.accentLime} name={icon} size={16} />
        </View>
      </View>
      <AppText align="center" style={styles.playingLabel} tone="muted" variant="metadata" weight="600">
        {label}
      </AppText>
      <AppText align="center" numberOfLines={1} style={styles.playingValue} variant="metadata" weight="800">
        {value}
      </AppText>
    </View>
  );
}

function GearCell({ hasBall, hasCourtMarks }: { hasBall: boolean; hasCourtMarks: boolean }) {
  const gearItems = [hasBall ? 'Ball' : null, hasCourtMarks ? 'Marks' : null].filter(Boolean).join('   ');

  return (
    <View style={styles.playingCell}>
      <View style={styles.playingIconSlot}>
        <View style={styles.gearIconRow}>
          <View style={[styles.gearIcon, hasBall && styles.gearIconActive, styles.gearIconOverlapRight]}>
            <Ionicons color={hasBall ? colors.accentLime : colors.subtle} name="football-outline" size={14} />
          </View>
          <View style={[styles.gearIcon, hasCourtMarks && styles.gearIconActive, styles.gearIconOverlapLeft]}>
            <Ionicons color={hasCourtMarks ? colors.accentLime : colors.subtle} name="flag-outline" size={14} />
          </View>
        </View>
      </View>
      <AppText align="center" style={styles.playingLabel} tone="muted" variant="metadata" weight="600">
        Equipment
      </AppText>
      <AppText align="center" numberOfLines={1} style={styles.playingValue} variant="metadata" weight="800">
        {gearItems || 'None'}
      </AppText>
    </View>
  );
}

function TrustCue({
  icon,
  label,
  sea = false,
  value,
  warning = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sea?: boolean;
  value: string;
  warning?: boolean;
}) {
  const iconColor = sea ? colors.accentSea : warning ? colors.accent : colors.primaryDark;

  return (
    <View style={styles.trustCue}>
      <View style={[styles.trustCueIcon, sea && styles.trustCueIconSea, warning && styles.trustCueIconGold]}>
        <Ionicons color={iconColor} name={icon} size={15} />
      </View>
      <View style={styles.trustCueCopy}>
        <AppText numberOfLines={1} variant="uiBody" weight="800">
          {value}
        </AppText>
        <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
          {label}
        </AppText>
      </View>
    </View>
  );
}

function PeopleSection({
  action,
  context,
  emptyBody,
  emptyTitle,
  onMore,
  onPressProfile,
  ownerPlayer,
  players: people,
  showRecency = false,
  title,
}: {
  action?: string;
  context: 'friend' | 'recent';
  emptyBody: string;
  emptyTitle: string;
  onMore: (player: Player, context: 'friend' | 'recent') => void;
  onPressProfile: (player: Player, context: 'friend' | 'recent') => void;
  ownerPlayer: Player;
  players: Player[];
  showRecency?: boolean;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader action={action} icon="chevron-down" title={title} />
      <View style={styles.playerRowStack}>
        {people.length > 0 ? people.map((person, index) => {
          const isFriend = areFriends(ownerPlayer, person);

          return (
            <PlayerRow
              context={getProfilePlayerContext(person, context, isFriend, showRecency ? index : undefined)}
              initials={person.initials}
              key={person.id}
              level={person.level}
              location={person.area}
              name={person.name}
              onMore={() => onMore(person, context)}
              onPressProfile={() => onPressProfile(person, context)}
              player={person}
              rating={formatPlayerRating(person)}
              statusIcon={person.id === 'p3' ? 'shield-checkmark' : 'star'}
            />
          );
        }) : (
          <ProfileEmptyState body={emptyBody} title={emptyTitle} />
        )}
      </View>
    </View>
  );
}

function ProfileEmptyState({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.accentSea} name="people-outline" size={18} />
      </View>
      <View style={styles.emptyCopy}>
        <AppText variant="bodySmall" weight="900">
          {title}
        </AppText>
        <AppText tone="muted" variant="caption" weight="700">
          {body}
        </AppText>
      </View>
    </View>
  );
}

function PlayerMiniCard({
  player,
  recency,
  variant = 'friend',
}: {
  player: Player;
  recency?: string;
  variant?: 'connect' | 'friend';
}) {
  const isShield = player.id === 'p3';
  const isConnectStar = variant === 'connect' && !isShield;

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerAvatar}>
        <AppText align="center" variant="titleSmall" weight="800">
          {player.initials}
        </AppText>
        <View style={[styles.playerBadge, isShield && styles.playerBadgeBlue, isConnectStar && styles.playerBadgeGold]}>
          <Ionicons color={colors.ink} name={isShield ? 'shield-checkmark' : 'star'} size={11} />
        </View>
      </View>
      <AppText align="center" numberOfLines={1} style={styles.playerName} variant="uiBody" weight="800">
        {player.name}
      </AppText>
      <View style={styles.playerMetaRow}>
        <MiniChip label={player.level} />
        <MiniChip icon="star" label={formatPlayerRating(player)} warning />
      </View>
      <AppText align="center" tone="muted" variant="metadata" weight="600">
        {recency ?? `${player.tocaPoints} points`}
      </AppText>
    </View>
  );
}

function MoreCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.moreCard}>
      <View style={styles.moreCircle}>
        <AppText align="center" tone="accent" variant="cardTitle" weight="800">
          {value}
        </AppText>
      </View>
      <AppText align="center" tone="muted" variant="caption" weight="700">
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
          <Ionicons color={colors.accentLime} name={icon} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
}

function BadgeCard({
  description,
  icon,
  muted = false,
  title,
  warning = false,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  muted?: boolean;
  title: string;
  warning?: boolean;
}) {
  return (
    <LinearGradient
      colors={muted ? [colors.surfaceRaised, colors.surface] : ['#FFFFFF', '#F7F1FF', '#FFF9EC']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.badgeCard, muted && styles.mutedCard]}
    >
      <View style={[styles.badgeIcon, warning && styles.badgeIconGold, muted && styles.badgeIconMuted]}>
        <Ionicons
          color={muted ? colors.subtle : warning ? colors.accentGoldDark : colors.accentPurple}
          name={icon}
          size={19}
        />
      </View>
      <AppText align="center" numberOfLines={2} style={styles.badgeTitle} variant="metadata" weight="900">
        {title}
      </AppText>
      <AppText align="center" numberOfLines={2} style={styles.badgeDescription} tone="muted" variant="caption" weight="600">
        {description}
      </AppText>
    </LinearGradient>
  );
}

function MiniChip({
  active = false,
  icon,
  label,
  warning = false,
}: {
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  warning?: boolean;
}) {
  return (
    <View style={[styles.miniChip, active && styles.miniChipActive, warning && styles.miniChipGold]}>
      {icon ? (
        <Ionicons
          color={warning ? colors.accentGoldDark : active ? colors.accentLime : colors.muted}
          name={icon}
          size={10}
        />
      ) : null}
      <AppText tone={active ? 'accent' : 'muted'} variant="chip" weight="800">
        {label}
      </AppText>
    </View>
  );
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function getProfileStats(player: Player, lobbies: Lobby[]) {
  const completedLobbies = getPlayerCompletedLobbies(player, lobbies);
  const preferredBeaches = getPreferredBeaches(completedLobbies);
  const tocaProgress = getTocaPointProgress(player.tocaPoints);

  return {
    completedGames: getPlayerCompletedGamesCount(player, lobbies),
    hostedGames: getPlayerHostedGamesCount(player, lobbies),
    levelProgress: tocaProgress.progressToNextLevel,
    nextLevelPoints: tocaProgress.nextLevelRequiredTp,
    nextTocaLevel: tocaProgress.nextLevel,
    pointsToNextLevel: tocaProgress.pointsToNextLevel,
    preferredBeaches,
    tocaLevel: tocaProgress.currentLevel,
  };
}

function getPreferredBeaches(lobbies: Lobby[]) {
  const beachCounts = new Map<string, number>();

  lobbies.forEach((lobby) => {
    beachCounts.set(lobby.location.name, (beachCounts.get(lobby.location.name) ?? 0) + 1);
  });

  const beaches = Array.from(beachCounts.entries())
    .sort((first, second) => second[1] - first[1])
    .slice(0, 2)
    .map(([name]) => name);

  return beaches.length > 0 ? beaches.join(', ') : 'No completed games yet';
}

function getRecentPlayers(player: Player, lobbies: Lobby[], players: Player[]) {
  const recentPlayerIds = new Set<string>();

  getPlayerCompletedLobbies(player, lobbies)
    .sort((first, second) => new Date(second.startsAt).getTime() - new Date(first.startsAt).getTime())
    .forEach((lobby) => {
      lobby.participants.forEach((participant) => {
        if (participant.playerId !== player.id && participant.status !== 'removed') {
          recentPlayerIds.add(participant.playerId);
        }
      });
    });

  return Array.from(recentPlayerIds)
    .map((playerId) => players.find((candidate) => candidate.id === playerId))
    .filter((candidate): candidate is Player => Boolean(candidate))
    .slice(0, 5);
}

function getRecentLabel(index: number) {
  return ['2d ago', '3d ago', '5d ago', '1w ago'][index] ?? '1w ago';
}

function getPreviewPlayingDetails(player: Player) {
  return getPlayerPreviewPlayingDetails(player);
}

function getProfilePlayerContext(
  player: Player,
  context: 'friend' | 'recent',
  isFriend: boolean,
  recencyIndex?: number,
) {
  if (context === 'friend') {
    return `${player.area} regular`;
  }

  const recency = typeof recencyIndex === 'number' ? getRecentLabel(recencyIndex) : 'Recently played';
  return isFriend ? `${recency} - friend` : `${recency} - add to crew`;
}

function getProfilePlayerActions(
  context: 'friend' | 'recent',
  isFriend: boolean,
  isRequested: boolean,
  onViewProfile: () => void,
  onInviteToGame: () => void,
  onAddFriend: () => void,
  onRemoveRequest?: () => void,
  onRemoveFriend?: () => void,
): PlayerAction[] {
  const viewProfileAction = {
    icon: 'person-circle-outline' as const,
    label: isFriend ? 'Show full profile' : 'View full profile',
    onPress: onViewProfile,
  };
  const inviteAction = { icon: 'paper-plane-outline' as const, label: 'Invite to game', onPress: onInviteToGame };
  const reportAction = { destructive: true, icon: 'ban-outline' as const, label: 'Report & block' };

  if (isRequested) {
    return [
      viewProfileAction,
      inviteAction,
      { icon: 'person-remove-outline' as const, label: 'Remove friend request', onPress: onRemoveRequest },
      reportAction,
    ];
  }

  if (isFriend || context === 'friend') {
    return [
      viewProfileAction,
      inviteAction,
      { destructive: true, icon: 'person-remove-outline', label: 'Remove friend', onPress: onRemoveFriend },
      reportAction,
    ];
  }

  return [
    viewProfileAction,
    { icon: 'person-add-outline' as const, label: 'Add friend', onPress: onAddFriend },
    inviteAction,
    reportAction,
  ];
}

function getProfilePreviewActionLabel(context: 'friend' | 'recent', isFriend: boolean, isRequested: boolean) {
  if (context === 'friend') {
    return 'Invite to game';
  }

  if (isRequested) {
    return 'Requested';
  }

  return isFriend ? 'Invite' : 'Add friend';
}

const styles = StyleSheet.create({
  avatarWrap: {
    position: 'relative',
  },
  backgroundGlow: {
    height: 430,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  badgeCard: {
    alignItems: 'center',
    borderColor: 'rgba(126, 122, 200, 0.22)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 5,
    minHeight: 126,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    width: 116,
    ...shadows.soft,
  },
  badgeIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(126, 122, 200, 0.12)',
    borderColor: 'rgba(126, 122, 200, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  badgeIconGold: {
    backgroundColor: 'rgba(126, 122, 200, 0.12)',
    borderColor: 'rgba(126, 122, 200, 0.28)',
  },
  badgeIconMuted: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  badgeRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl2,
  },
  badgeDescription: {
    maxWidth: 94,
  },
  badgeTitle: {
    color: colors.ink,
    maxWidth: 94,
    minHeight: 34,
  },
  content: {
    gap: 16,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
    ...shadows.soft,
  },
  emptyCopy: {
    flex: 1,
    gap: 2,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 74,
    padding: spacing.md,
  },
  levelBadge: {
    alignItems: 'center',
    borderRadius: 16,
    height: 62,
    justifyContent: 'center',
    width: 60,
  },
  levelLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  levelNumber: {
    fontSize: 26,
    lineHeight: 28,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
  },
  gearIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  gearIconActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  gearIconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 28,
    justifyContent: 'center',
    width: 48,
  },
  gearIconOverlapLeft: {
    marginLeft: -4,
  },
  gearIconOverlapRight: {
    marginRight: -4,
    zIndex: 1,
  },
  gearLabelRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 14,
    transform: [{ translateX: -14 }],
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
  miniChipActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  miniChipGold: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  moreCard: {
    alignItems: 'center',
    gap: 6,
    minHeight: 144,
    padding: spacing.sm,
    width: 86,
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
  mutedCard: {
    opacity: 0.58,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  peopleRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl2,
  },
  playerCard: {
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
  playerAvatar: {
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
  playerBadge: {
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
  playerBadgeBlue: {
    backgroundColor: colors.accentSea,
  },
  playerBadgeGold: {
    backgroundColor: colors.accent,
  },
  playerMetaRow: {
    flexDirection: 'row',
    gap: 4,
  },
  playerName: {
    maxWidth: 88,
  },
  playerRowStack: {
    gap: spacing.sm,
  },
  playingCell: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  playingGrid: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    ...shadows.soft,
  },
  playingIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  playingIconSlot: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: '100%',
  },
  playingLabel: {
    minHeight: 17,
  },
  playingValue: {
    minHeight: 17,
  },
  pointsCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  pointsCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pointsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  pointsValue: {
    color: colors.ink,
  },
  nextLevelPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 242, 189, 0.72)',
    borderColor: 'rgba(246, 201, 69, 0.34)',
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 78,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  profileName: {
    color: colors.ink,
    flexShrink: 1,
  },
  profileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  progress: {
    height: 6,
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
  summaryDivider: {
    backgroundColor: colors.border,
    height: 34,
    width: 1,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    marginBottom: 3,
    width: 26,
  },
  summaryIconRating: {
    backgroundColor: 'rgba(255, 249, 236, 0.92)',
    borderColor: 'rgba(246, 201, 69, 0.34)',
  },
  summaryIconPurple: {
    backgroundColor: 'rgba(244, 123, 95, 0.12)',
    borderColor: 'rgba(244, 123, 95, 0.36)',
  },
  summaryIconSea: {
    backgroundColor: 'rgba(39, 210, 196, 0.10)',
    borderColor: 'rgba(39, 210, 196, 0.34)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStrip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 78,
    paddingHorizontal: spacing.sm,
    ...shadows.soft,
  },
  trustCue: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    ...shadows.soft,
  },
  trustCueCopy: {
    flex: 1,
    minWidth: 0,
  },
  trustCueIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  trustCueIconGold: {
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.46)',
  },
  trustCueIconSea: {
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.34)',
  },
  trustGrid: {
    gap: spacing.sm,
  },
  verifiedPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(39, 210, 196, 0.10)',
    borderColor: 'rgba(39, 210, 196, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
