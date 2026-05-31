import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { GameInfoStrip } from '../components/GameInfoStrip';
import { BeachGameVisual } from '../components/home/BeachGameVisual';
import { HomeHeader } from '../components/home/HomeHeader';
import { PlayerActionSheet, type PlayerAction, type PlayerActionSheetPlayer } from '../components/PlayerActionSheet';
import { PlayerProfilePreview } from '../components/PlayerProfilePreview';
import { getPlayerPreviewPlayingDetails } from '../components/playerProfilePreviewDetails';
import { PlayerRow } from '../components/PlayerRow';
import { RatePlayerWizard } from '../components/RatePlayerWizard';
import { currentPlayer, notifications, players } from '../data/mock';
import { colors, radius, shadows, spacing } from '../theme';
import type { GenderRule, Lobby, LobbyParticipant, LobbyVisibility, Player } from '../types';

type LobbyDetailsScreenProps = {
  lobby: Lobby;
  lobbyIndex: number;
  onBack: () => void;
  onInvite: () => void;
  onOpenMenu: () => void;
  onViewPlayerProfile: (player: Player) => void;
};

type LobbyProfilePreviewSelection = {
  participant?: LobbyParticipant;
  player: Player;
};

export function LobbyDetailsScreen({
  lobby,
  lobbyIndex,
  onBack,
  onInvite,
  onOpenMenu,
  onViewPlayerProfile,
}: LobbyDetailsScreenProps) {
  const admin = players.find((player) => player.id === lobby.adminId);
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const waitlistedParticipants = lobby.participants.filter((participant) => participant.role === 'waitlist');
  const currentParticipant = lobby.participants.find((participant) => participant.playerId === currentPlayer.id);
  const playerCount = `${activeParticipants.length} / ${lobby.maxPlayers}`;
  const [actionSheetActions, setActionSheetActions] = useState<PlayerAction[]>([]);
  const [actionSheetPlayer, setActionSheetPlayer] = useState<PlayerActionSheetPlayer | null>(null);
  const [profilePreviewSelection, setProfilePreviewSelection] = useState<LobbyProfilePreviewSelection | null>(null);
  const [ratingWizardPlayer, setRatingWizardPlayer] = useState<Player | null>(null);
  const [localFriendIds, setLocalFriendIds] = useState<string[]>([]);
  const profilePreviewPlayer = profilePreviewSelection?.player;
  const isCurrentUserAdmin = lobby.adminId === currentPlayer.id;
  const isRatingOpen = lobby.status === 'rating_open';

  function openProfile(player: Player, participant = lobby.participants.find((candidate) => candidate.playerId === player.id)) {
    setProfilePreviewSelection({ participant, player });
  }

  function openPlayerActions(player: Player) {
    const isFriend = currentPlayer.friendIds.includes(player.id);

    setActionSheetPlayer({
      contextLabel: `${player.level} rank`,
      initials: player.initials,
      name: player.name,
    });
    setActionSheetActions(getLobbyPlayerActions(player, isFriend, () => openProfile(player), onInvite, !isRatingOpen));
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
      <HomeHeader compact notificationCount={notifications.length} onMenuPress={onOpenMenu} player={currentPlayer} />

      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.wizardBackButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={20} />
        </Pressable>

        <RoomHeroCard
          admin={admin}
          currentParticipant={currentParticipant}
          lobby={lobby}
          lobbyIndex={lobbyIndex}
          onInvite={onInvite}
          playerCount={playerCount}
        />

        <GameInfoStrip
          items={[
            { icon: 'calendar-outline', label: 'Starts', value: lobby.startsAt, wide: true },
            { icon: 'cellular', iconColor: colors.accentLime, label: 'Rank', value: getCompactRankLabel(lobby), wide: true },
            { icon: 'people-outline', label: 'Players', value: formatCompactPlayerCount(playerCount) },
            { icon: 'people-circle-outline', iconColor: colors.accentSea, label: 'Gender', value: getGenderLabel(lobby.genderRule), wide: true },
          ]}
        />

        <ParticipantsSection
          actionLabel={isRatingOpen ? undefined : 'Invite'}
          count={activeParticipants.length}
          onOpenActions={openPlayerActions}
          onOpenProfile={openProfile}
          onRatePlayer={(player) => setRatingWizardPlayer(player)}
          onAction={onInvite}
          participants={activeParticipants}
          showRatingAction={lobby.status === 'rating_open'}
          title="Players"
        />

        <ParticipantsSection
          count={waitlistedParticipants.length}
          onOpenActions={openPlayerActions}
          onOpenProfile={openProfile}
          participants={waitlistedParticipants}
          title="Waitlist"
        />

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
        context={profilePreviewPlayer ? `${profilePreviewPlayer.level} rank` : undefined}
        initials={profilePreviewPlayer?.initials ?? ''}
        level={profilePreviewPlayer?.level}
        meta={profilePreviewPlayer ? `${profilePreviewPlayer.tocaPoints} TOCA points` : undefined}
        moreActions={
          profilePreviewPlayer
            ? getLobbyPlayerActions(
                profilePreviewPlayer,
                currentPlayer.friendIds.includes(profilePreviewPlayer.id),
                () => onViewPlayerProfile(profilePreviewPlayer),
                onInvite,
                !isRatingOpen,
              )
            : undefined
        }
        name={profilePreviewPlayer?.name ?? ''}
        onClose={() => setProfilePreviewSelection(null)}
        profileDetails={profilePreviewPlayer ? getLobbyPreviewDetails(profilePreviewPlayer) : undefined}
        primaryAction={
          profilePreviewSelection
            ? getLobbyProfilePreviewPrimaryAction(
                profilePreviewSelection,
                isCurrentUserAdmin,
                onViewPlayerProfile,
              )
            : undefined
        }
        rating={profilePreviewPlayer ? getPlayerRating(profilePreviewPlayer) : undefined}
        secondaryAction={
          profilePreviewSelection
            ? getLobbyProfilePreviewSecondaryAction(
                profilePreviewSelection,
                currentPlayer.friendIds.includes(profilePreviewSelection.player.id),
                isCurrentUserAdmin,
                onInvite,
                onViewPlayerProfile,
                !isRatingOpen,
              )
            : undefined
        }
        trustCues={profilePreviewPlayer ? getLobbyPreviewTrustCues(profilePreviewPlayer) : undefined}
        visible={Boolean(profilePreviewSelection)}
      />
      <RatePlayerWizard
        behaviorRating={ratingWizardPlayer ? Number(getPlayerRating(ratingWizardPlayer)) : undefined}
        currentRank={ratingWizardPlayer?.level ?? currentPlayer.level}
        isFriend={Boolean(
          ratingWizardPlayer &&
            (currentPlayer.friendIds.includes(ratingWizardPlayer.id) || localFriendIds.includes(ratingWizardPlayer.id)),
        )}
        onAddFriend={(player) => {
          setLocalFriendIds((current) => (current.includes(player.id) ? current : [...current, player.id]));
        }}
        onClose={() => setRatingWizardPlayer(null)}
        onViewProfile={onViewPlayerProfile}
        player={ratingWizardPlayer}
        visible={Boolean(ratingWizardPlayer)}
      />
    </View>
  );
}

function RoomHeroCard({
  admin,
  currentParticipant,
  lobby,
  lobbyIndex,
  onInvite,
  playerCount,
}: {
  admin?: Player;
  currentParticipant?: LobbyParticipant;
  lobby: Lobby;
  lobbyIndex: number;
  onInvite: () => void;
  playerCount: string;
}) {
  const primaryAction = getLobbyPrimaryAction(lobby, Boolean(currentParticipant && isActiveParticipant(currentParticipant)));
  const showShareAction = lobby.status !== 'rating_open';

  return (
    <View style={styles.heroCard}>
      <BeachGameVisual variant={lobbyIndex % 2 === 0 ? 'aqua' : 'sunset'} />
      <LinearGradient
        colors={['rgba(255, 249, 236, 0.98)', 'rgba(255, 249, 236, 0.88)', 'rgba(255, 249, 236, 0.30)']}
        start={{ x: 0, y: 0.22 }}
        end={{ x: 1, y: 0.72 }}
        style={styles.heroOverlay}
      />

      <View style={styles.heroContent}>
        <View style={styles.heroPills}>
          <StatusPill label={getStatusLabel(lobby)} tone="lime" />
          <StatusPill icon="time-outline" label={lobby.startsAt} tone="gold" />
        </View>

        <View style={styles.titleBlock}>
          <AppText numberOfLines={2} style={styles.lobbyTitle} variant="heroTitle" weight="900">
            {lobby.title}
          </AppText>
          <View style={styles.locationRow}>
            <Ionicons color={colors.accentSea} name="location" size={18} />
            <AppText numberOfLines={1} tone="primary" variant="uiBody" weight="600">
              {lobby.location.name}, {lobby.location.city}
            </AppText>
          </View>
        </View>

        {admin ? (
          <View style={styles.adminRow}>
            <Avatar player={admin} size={32} />
            <View style={styles.adminCopy}>
            <AppText tone="muted" variant="metadata" weight="600">
                Hosted by
              </AppText>
              <AppText numberOfLines={1} variant="uiBody" weight="800">
                {admin.name}
              </AppText>
            </View>
          </View>
        ) : null}

        {lobby.note ? (
          <AppText numberOfLines={2} style={styles.noteText} tone="muted" variant="metadata" weight="500">
            {lobby.note}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            disabled={primaryAction.disabled}
            style={[
              styles.primaryButton,
              primaryAction.tone === 'muted' && styles.joinedButton,
              primaryAction.tone === 'rating' && styles.ratingButton,
            ]}
          >
            <AppText
              align="center"
              tone={primaryAction.textTone}
              variant="button"
              weight="800"
            >
              {primaryAction.label}
            </AppText>
            <Ionicons color={primaryAction.iconColor} name={primaryAction.icon} size={17} />
          </Pressable>
          {showShareAction ? (
            <Pressable accessibilityRole="button" onPress={onInvite} style={styles.secondaryButton}>
              <Ionicons color={colors.accentLime} name="share-social-outline" size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ParticipantsSection({
  actionLabel,
  count,
  onAction,
  onOpenActions,
  onOpenProfile,
  onRatePlayer,
  participants,
  showRatingAction = false,
  title,
}: {
  actionLabel?: string;
  count: number;
  onAction?: () => void;
  onOpenActions: (player: Player) => void;
  onOpenProfile: (player: Player, participant: LobbyParticipant) => void;
  onRatePlayer?: (player: Player) => void;
  participants: LobbyParticipant[];
  showRatingAction?: boolean;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
            {title}
          </AppText>
          <AppText tone="muted" variant="metadata" weight="600">
            {count}
          </AppText>
        </View>
        {actionLabel ? (
          <Pressable accessibilityRole="button" onPress={onAction} style={styles.sectionAction}>
            <Ionicons color={colors.accentLime} name="person-add-outline" size={15} />
            <AppText tone="accent" variant="button" weight="800">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.participantList}>
        {participants.map((participant) => {
          const player = players.find((candidate) => candidate.id === participant.playerId);

          return player ? (
            <ParticipantRow
              key={`${participant.playerId}-${participant.role}`}
              onMore={() => onOpenActions(player)}
              onPressProfile={() => onOpenProfile(player, participant)}
              onRatePlayer={() => onRatePlayer?.(player)}
              participant={participant}
              player={player}
              showRatingAction={showRatingAction}
            />
          ) : null;
        })}
      </View>
    </View>
  );
}

function ParticipantRow({
  onMore,
  onPressProfile,
  onRatePlayer,
  participant,
  player,
  showRatingAction,
}: {
  onMore: () => void;
  onPressProfile: () => void;
  onRatePlayer?: () => void;
  participant: LobbyParticipant;
  player: Player;
  showRatingAction?: boolean;
}) {
  return (
    <PlayerRow
      context={participant.role}
      initials={player.initials}
      level={player.level}
      meta={`${player.tocaPoints} pts`}
      name={player.name}
      onMore={showRatingAction ? undefined : onMore}
      onPressProfile={onPressProfile}
      primaryAction={
        showRatingAction
          ? {
              label: 'Rate player',
              onPress: onRatePlayer,
              variant: 'warning',
            }
          : undefined
      }
      rating={getPlayerRating(player)}
      statusIcon={participant.role === 'admin' ? 'shield-checkmark' : 'star'}
    />
  );
}

export function LobbyFloatingChatButton({ lobby }: { lobby: Lobby }) {
  const unreadCount = lobby.chatChannels.reduce((total, channel) => total + channel.unreadCount, 0);

  return (
    <Pressable accessibilityRole="button" style={styles.floatingChatButton}>
      <Ionicons color={colors.textOnGreen} name="chatbubbles-outline" size={23} />
      {unreadCount > 0 ? (
        <View style={styles.floatingChatBadge}>
          <AppText align="center" tone="inverse" variant="caption" weight="800">
            {unreadCount}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

function StatusPill({
  icon,
  label,
  tone = 'neutral',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'gold' | 'lime' | 'neutral';
}) {
  const isLime = tone === 'lime';
  const isGold = tone === 'gold';

  return (
    <View style={[styles.pill, isLime && styles.limePill, isGold && styles.goldPill]}>
      {icon ? (
        <Ionicons
          color={isGold ? colors.accent : isLime ? colors.primaryDark : colors.muted}
          name={icon}
          size={13}
        />
      ) : null}
      <AppText tone={isGold ? 'warning' : isLime ? 'accent' : 'muted'} variant="caption" weight="800">
        {label}
      </AppText>
    </View>
  );
}

function RolePill({ role }: { role: LobbyParticipant['role'] }) {
  if (role === 'joined' || role === 'waitlist') {
    return null;
  }

  const isAdmin = role === 'admin';

  return (
    <View style={[styles.rolePill, isAdmin ? styles.rolePillLime : styles.rolePillGold]}>
      <AppText tone={isAdmin ? 'accent' : 'warning'} variant="caption" weight="800">
        {role === 'substitute' ? 'Sub' : 'Admin'}
      </AppText>
    </View>
  );
}

function EquipmentIcon({ active, icon }: { active: boolean; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.equipmentIcon, active && styles.equipmentIconActive]}>
      <Ionicons color={active ? colors.primaryDark : colors.subtle} name={icon} size={14} />
    </View>
  );
}

function PlayerMetaChip({
  icon,
  label,
  warning = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  warning?: boolean;
}) {
  return (
    <View style={[styles.playerMetaChip, warning && styles.playerMetaChipGold]}>
      {icon ? <Ionicons color={warning ? colors.accentGoldDark : colors.muted} name={icon} size={10} /> : null}
      <AppText tone={warning ? 'warning' : 'muted'} variant="chip" weight="800">
        {label}
      </AppText>
    </View>
  );
}

function BeachVisual({ seed }: { seed: number }) {
  const gradient = seed % 2 === 0
    ? ['#FFF2BD', '#8EDBD2', '#24C45A']
    : ['#DDF5F1', '#1BB7A8', '#F6C945'];

  return (
    <View style={styles.visual}>
      <LinearGradient
        colors={gradient as [string, string, string]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.sunGlow} />
      <View style={styles.netLine} />
      <View style={[styles.palmLine, styles.palmOne]} />
      <View style={[styles.palmLine, styles.palmTwo]} />
      <LinearGradient colors={[colors.accentGold, colors.accentGoldDark]} style={styles.ball} />
    </View>
  );
}

function isActiveParticipant(participant: LobbyParticipant) {
  return participant.role === 'admin' || participant.role === 'joined' || participant.role === 'substitute';
}

function formatCompactPlayerCount(playerCount: string) {
  return playerCount.replace(/\s+/g, '');
}

function getStatusLabel(lobby: Lobby) {
  if (lobby.status === 'full') {
    return 'Full';
  }

  if (lobby.status === 'rating_open') {
    return 'Rating open';
  }

  if (lobby.visibility === 'approval_required') {
    return 'Approval';
  }

  if (lobby.visibility === 'password' || lobby.visibility === 'invite_link') {
    return 'Protected';
  }

  return 'Open';
}

function getVisibilityLabel(visibility: LobbyVisibility) {
  if (visibility === 'public') {
    return 'Public';
  }

  if (visibility === 'approval_required') {
    return 'Approval';
  }

  return visibility === 'password' ? 'Password' : 'Invite';
}

function getGenderLabel(genderRule: GenderRule) {
  if (genderRule === 'everyone') {
    return 'Everyone';
  }

  return genderRule === 'male' ? 'Men' : 'Women';
}

function getRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact';
  }

  return `${lobby.rankMin} to ${lobby.rankMax}`;
}

function getCompactRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'range') {
    return `${lobby.rankMin}/${lobby.rankMax}`;
  }

  return getRankLabel(lobby);
}

function getPrimaryAction(lobby: Lobby) {
  if (lobby.status === 'full') {
    return lobby.waitlistEnabled ? 'Join waitlist' : 'View details';
  }

  if (lobby.visibility !== 'public') {
    return lobby.waitlistEnabled ? 'Join waitlist' : 'Request access';
  }

  return 'Join game';
}

function getLobbyPrimaryAction(lobby: Lobby, isJoined: boolean): {
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  textTone: 'accent' | 'danger' | 'inverse' | 'muted' | 'primary' | 'subtle' | 'warning';
  tone: 'green' | 'muted' | 'rating';
} {
  if (lobby.status === 'rating_open') {
    return {
      disabled: false,
      icon: 'star-outline',
      iconColor: colors.accentGoldDark,
      label: 'Rate players',
      textTone: 'primary',
      tone: 'rating',
    };
  }

  if (lobby.status === 'completed' || lobby.status === 'closed') {
    return {
      disabled: true,
      icon: 'checkmark',
      iconColor: colors.muted,
      label: 'Finished',
      textTone: 'muted',
      tone: 'muted',
    };
  }

  if (isJoined) {
    return {
      disabled: true,
      icon: 'checkmark',
      iconColor: colors.muted,
      label: 'Joined',
      textTone: 'muted',
      tone: 'muted',
    };
  }

  return {
    disabled: false,
    icon: 'chevron-forward',
    iconColor: colors.textOnGreen,
    label: getPrimaryAction(lobby) === 'Join game' ? 'Join' : getPrimaryAction(lobby),
    textTone: 'inverse',
    tone: 'green',
  };
}

function getPlayerRating(player: Player) {
  if (player.id === 'p3') {
    return '4.0';
  }

  if (player.id === 'p4' || player.id === currentPlayer.id) {
    return '3.6';
  }

  return '3.2';
}

function getLobbyPlayerActions(
  player: Player,
  isFriend: boolean,
  onViewProfile: () => void,
  onInvite: () => void,
  canInvite = true,
): PlayerAction[] {
  return [
    {
      icon: 'person-circle-outline',
      label: isFriend ? 'Show full profile' : 'View full profile',
      onPress: onViewProfile,
    },
    ...(isFriend && canInvite
      ? [{ icon: 'paper-plane-outline' as const, label: 'Invite to game', onPress: onInvite }]
      : isFriend
        ? []
        : [{ icon: 'person-add-outline' as const, label: 'Add friend' }]),
    ...(isFriend
      ? [{ destructive: true, icon: 'person-remove-outline' as const, label: 'Remove friend' }]
      : []),
    { destructive: true, icon: 'ban-outline', label: 'Report & block' },
  ];
}

function getLobbyProfilePreviewPrimaryAction(
  selection: LobbyProfilePreviewSelection,
  isCurrentUserAdmin: boolean,
  onViewPlayerProfile: (player: Player) => void,
) {
  if (!isCurrentUserAdmin || !selection.participant || selection.player.id === currentPlayer.id) {
    return {
      label: 'View full profile',
      onPress: () => onViewPlayerProfile(selection.player),
    };
  }

  return {
    label: selection.participant.role === 'waitlist' ? 'Move to players' : 'Move to waitlist',
    onPress: () => undefined,
  };
}

function getLobbyProfilePreviewSecondaryAction(
  selection: LobbyProfilePreviewSelection,
  isFriend: boolean,
  isCurrentUserAdmin: boolean,
  onInvite: () => void,
  onViewPlayerProfile: (player: Player) => void,
  canInvite = true,
) {
  if (selection.player.id === currentPlayer.id) {
    return undefined;
  }

  if (isCurrentUserAdmin && selection.participant) {
    return {
      label: isFriend ? 'View full profile' : 'Add friend',
      onPress: isFriend ? () => onViewPlayerProfile(selection.player) : () => undefined,
    };
  }

  if (!canInvite && isFriend) {
    return {
      label: 'View full profile',
      onPress: () => onViewPlayerProfile(selection.player),
    };
  }

  return {
    label: isFriend ? 'Invite to game' : 'Add friend',
    onPress: isFriend ? onInvite : undefined,
  };
}

function getLobbyPreviewTrustCues(player: Player) {
  return [
    {
      icon: 'checkmark-circle-outline' as const,
      label: 'Show-up rate',
      value: player.rankStatus === 'established' ? '98%' : player.rankStatus === 'stabilizing' ? '94%' : 'New',
    },
    {
      icon: 'calendar-outline' as const,
      label: 'Games played',
      tone: 'aqua' as const,
      value: `${player.gamesPlayed}`,
    },
  ];
}

function getLobbyPreviewDetails(player: Player) {
  return getPlayerPreviewPlayingDetails(player);
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  adminCopy: {
    flex: 1,
    minWidth: 0,
  },
  adminRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
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
  ball: {
    borderColor: colors.ink,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 24,
    position: 'absolute',
    right: 78,
    top: 64,
    width: 24,
  },
  content: {
    gap: 16,
    paddingBottom: 104,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.lg,
  },
  equipmentIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  equipmentIconActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  equipmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  floatingChatBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentGoldDark,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    minWidth: 22,
    position: 'absolute',
    right: -3,
    top: -5,
  },
  floatingChatButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 104,
    height: 58,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl2,
    width: 58,
    zIndex: 20,
    ...shadows.nav,
  },
  goldPill: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 266,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.hero,
  },
  heroContent: {
    gap: 8,
    padding: 13,
    zIndex: 2,
  },
  heroOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  heroPills: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  limePill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  lobbyTitle: {
    maxWidth: 278,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: 300,
  },
  netLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    bottom: 98,
    height: 2,
    left: 14,
    position: 'absolute',
    right: 8,
    transform: [{ rotate: '-7deg' }],
  },
  noteText: {
    color: colors.muted,
    maxWidth: 286,
  },
  onlineDot: {
    backgroundColor: colors.accentLime,
    borderColor: colors.surface,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 0,
    height: 13,
    position: 'absolute',
    right: 0,
    width: 13,
  },
  palmLine: {
    backgroundColor: 'rgba(18, 59, 42, 0.48)',
    borderRadius: radius.round,
    position: 'absolute',
    width: 7,
  },
  palmOne: {
    height: 92,
    right: 16,
    top: 22,
    transform: [{ rotate: '18deg' }],
  },
  palmTwo: {
    height: 60,
    right: 35,
    top: 30,
    transform: [{ rotate: '-42deg' }],
  },
  participantList: {
    gap: spacing.sm,
  },
  participantRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 26,
    paddingHorizontal: spacing.sm,
  },
  playerInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  playerName: {
    color: colors.ink,
    flexShrink: 1,
  },
  playerNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerMetaChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 22,
    paddingHorizontal: 7,
  },
  playerMetaChipGold: {
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.44)',
  },
  playerMetaChips: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 3,
  },
  playerText: {
    flex: 1,
    minWidth: 0,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.soft,
  },
  joinedButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
  },
  ratingButton: {
    backgroundColor: 'rgba(246, 201, 69, 0.28)',
    borderColor: 'rgba(239, 165, 26, 0.28)',
    borderWidth: 1,
  },
  rolePill: {
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rolePillGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  rolePillLime: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  screen: {
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    width: 48,
    ...shadows.soft,
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
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sunGlow: {
    backgroundColor: 'rgba(255, 200, 61, 0.55)',
    borderRadius: radius.round,
    height: 44,
    position: 'absolute',
    right: 42,
    top: 122,
    width: 44,
  },
  titleBlock: {
    gap: spacing.xs,
  },
  unreadPill: {
    alignItems: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: radius.round,
    height: 25,
    justifyContent: 'center',
    minWidth: 25,
  },
  visual: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '54%',
  },
  wizardBackButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
    ...shadows.soft,
  },
});
