import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, type LayoutChangeEvent } from 'react-native';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { GameInfoStrip } from '../components/GameInfoStrip';
import { BeachGameVisual } from '../components/home/BeachGameVisual';
import { HomeHeader } from '../components/home/HomeHeader';
import { PlayerActionSheet, type PlayerAction, type PlayerActionSheetPlayer } from '../components/PlayerActionSheet';
import { PlayerProfilePreview } from '../components/PlayerProfilePreview';
import { getPlayerPreviewPlayingDetails, getPlayerPreviewTrustCues } from '../components/playerProfilePreviewDetails';
import { PlayerRow } from '../components/PlayerRow';
import { RatePlayerWizard } from '../components/RatePlayerWizard';
import { formatLobbyStart, getEffectiveLobbyStatus, isLobbyReadyForRatings } from '../features/lobbies/lobbyDateTime';
import { isLobbyHost, lobbyLabels } from '../features/lobbies/lobbyLabels';
import { getAutoCancelCountdownLabel, getAutoCancelMessage } from '../features/lobbies/lobbyLifecycle';
import { useLifecycleClock } from '../features/lobbies/useLifecycleClock';
import {
  getJoinGameDecision,
  getJoinWaitlistDecision,
  getJoinedParticipants,
  getLobbyAccessDecision,
  getPlayerLobbyRelationship,
  getWaitlistParticipants,
  isJoinedParticipant,
} from '../features/lobbies/lobbyRules';
import { canPlayerRateLobby, canRatePlayer, getRemainingRatingTargetIds } from '../features/ratings/ratingRules';
import { formatPlayerRating, getInitialBehaviorRating } from '../features/ratings/playerRatingSummary';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { ChatChannel, ChatMessage, GenderRule, Lobby, LobbyParticipant, LobbyVisibility, Player, RatingTask, SkillRankVoteType } from '../types';

type LobbyDetailsScreenProps = {
  allLobbies: Lobby[];
  blockedPlayerIds?: string[];
  currentPlayer: Player;
  hasPrivateAccess: boolean;
  lobby: Lobby;
  lobbyIndex: number;
  notificationCount: number;
  onApproveWaitlistRequest: (playerId: string) => void;
  onBack: () => void;
  onBlockPlayer: (playerId: string) => Promise<void> | void;
  onCancelJoinRequest: () => void;
  onInvite: () => void;
  onJoinGame: () => void;
  onJoinWaitlist: () => void;
  onKickPlayer: (playerId: string) => Promise<void> | void;
  onLeaveLobby: () => void;
  onMovePlayerToWaitlist: (playerId: string) => Promise<void> | void;
  onOpenHostManagement: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onRemoveFriend: (playerId: string) => void;
  onReportPlayer: () => void;
  onRequestWaitlistApproval: () => void;
  onRejectWaitlistRequest: (playerId: string) => void;
  onSendFriendRequest: (playerId: string) => void;
  onSubmitPrivatePin: (pin: string) => Promise<{ messages: string[]; success: boolean }>;
  onSubmitPlayerRating: (rating: { behaviorRating: number; rank: Player['level']; skillVoteType: SkillRankVoteType; targetPlayerId: string }) => boolean | Promise<boolean>;
  onTransferHost: (playerId: string) => Promise<void> | void;
  onViewPlayerProfile: (player: Player) => void;
  players: Player[];
  ratingTasks: RatingTask[];
  isActionPending?: boolean;
};

type LobbyProfilePreviewSelection = {
  participant?: LobbyParticipant;
  player: Player;
};

type LobbyPrimaryAction = {
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress?: () => void;
  textTone: 'accent' | 'danger' | 'inverse' | 'muted' | 'primary' | 'subtle' | 'warning';
  tone: 'green' | 'muted' | 'rating';
};

type LobbySectionAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type RoomMembershipWaitlistAction = Pick<LobbyPrimaryAction, 'disabled' | 'icon' | 'iconColor' | 'label' | 'onPress' | 'textTone' | 'tone'>;

const pendingApprovalReason = 'Host approval is still pending.';

export function LobbyDetailsScreen({
  allLobbies,
  blockedPlayerIds = [],
  currentPlayer,
  hasPrivateAccess,
  lobby,
  lobbyIndex,
  notificationCount,
  onApproveWaitlistRequest,
  onBack,
  onBlockPlayer,
  onCancelJoinRequest,
  onInvite,
  onJoinGame,
  onJoinWaitlist,
  onKickPlayer,
  onLeaveLobby,
  onMovePlayerToWaitlist,
  onOpenHostManagement,
  onOpenMenu,
  onOpenNotifications,
  onRemoveFriend,
  onReportPlayer,
  onRequestWaitlistApproval,
  onRejectWaitlistRequest,
  onSendFriendRequest,
  onSubmitPrivatePin,
  onSubmitPlayerRating,
  onTransferHost,
  onViewPlayerProfile,
  players,
  ratingTasks,
  isActionPending = false,
}: LobbyDetailsScreenProps) {
  useLifecycleClock();
  const admin = players.find((player) => player.id === lobby.adminId);
  const activeParticipants = getJoinedParticipants(lobby);
  const waitlistedParticipants = getWaitlistParticipants(lobby);
  const currentParticipant = lobby.participants.find(
    (participant) =>
      participant.playerId === currentPlayer.id &&
      (participant.status === 'approved' || participant.status === 'attended'),
  );
  const pendingRequests = lobby.joinRequests.filter((request) => request.status === 'pending');
  const currentPendingRequest = pendingRequests.find((request) => request.playerId === currentPlayer.id);
  const playerCount = `${activeParticipants.length} / ${lobby.maxPlayers}`;
  const [actionSheetActions, setActionSheetActions] = useState<PlayerAction[]>([]);
  const [actionSheetPlayer, setActionSheetPlayer] = useState<PlayerActionSheetPlayer | null>(null);
  const [profilePreviewSelection, setProfilePreviewSelection] = useState<LobbyProfilePreviewSelection | null>(null);
  const [ratingWizardPlayer, setRatingWizardPlayer] = useState<Player | null>(null);
  const [localFriendIds, setLocalFriendIds] = useState<string[]>([]);
  const [isPinEntryOpen, setIsPinEntryOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [blockedJoinReasons, setBlockedJoinReasons] = useState<string[] | null>(null);
  const profilePreviewPlayer = profilePreviewSelection?.player;
  const isCurrentUserAdmin = isLobbyHost(lobby, currentPlayer.id, currentParticipant);
  const lifecycleStatus = getEffectiveLobbyStatus(lobby);
  const arePreStartActionsOpen = lifecycleStatus === 'open' || lifecycleStatus === 'full' || lifecycleStatus === 'closing_soon';
  const canManageLobbyPlayers = arePreStartActionsOpen;
  const canLeaveRoomAfterCancellation = lifecycleStatus === 'cancelled';
  const isRatingOpen = isLobbyReadyForRatings(lobby);
  const autoCancelMessage = getAutoCancelMessage(lobby);
  const canCurrentPlayerRateLobby = canPlayerRateLobby(lobby, currentPlayer.id);
  const hasRatedEveryPlayer = canCurrentPlayerRateLobby && getRemainingRatingTargetIds(ratingTasks, lobby, currentPlayer.id).length === 0;
  const primaryAction = getLobbyPrimaryAction({
    allLobbies,
    canCurrentPlayerRateLobby,
    currentParticipant,
    currentPlayer,
    hasRatedEveryPlayer,
    hasPrivateAccess,
    lobby,
    onJoinGame,
    onJoinWaitlist,
    onOpenPinEntry: () => {
      setPinError(null);
      setIsPinEntryOpen(true);
    },
    onRequestWaitlistApproval,
    onShowJoinBlockedReasons: setBlockedJoinReasons,
  });
  const playerSectionAction = getPlayerSectionAction({
    allLobbies,
    currentPlayer,
    hasPrivateAccess,
    lobby,
    onJoinGame,
    onShowJoinBlockedReasons: setBlockedJoinReasons,
  });
  const waitlistSectionAction = getWaitlistSectionAction({
    allLobbies,
    currentPlayer,
    hasPrivateAccess,
    lobby,
    onJoinWaitlist,
  });
  const canLeaveRoom =
    currentParticipant &&
    (currentParticipant.status === 'approved' || currentParticipant.status === 'attended') &&
    (arePreStartActionsOpen || canLeaveRoomAfterCancellation);

  function openProfile(player: Player, participant = lobby.participants.find((candidate) => candidate.playerId === player.id)) {
    setProfilePreviewSelection({ participant, player });
  }

  function openPlayerActions(player: Player) {
    const isFriend = currentPlayer.friendIds.includes(player.id);
    const participant = lobby.participants.find((candidate) => candidate.playerId === player.id);

    setActionSheetPlayer({
      contextLabel: `${player.level} rank`,
      initials: player.initials,
      name: player.name,
    });
    setActionSheetActions(
      getLobbyPlayerActions({
        canManageLobby: canManageLobbyPlayers,
        currentPlayer,
        isCurrentUserAdmin,
        isFriend,
        onKickPlayer,
        onRemoveFriend: (targetPlayer) => onRemoveFriend(targetPlayer.id),
        onReportPlayer,
        onSendFriendRequest: (targetPlayer) => onSendFriendRequest(targetPlayer.id),
        onBlockPlayer: (targetPlayer) => onBlockPlayer(targetPlayer.id),
        onTransferHost: (targetPlayer) => onTransferHost(targetPlayer.id),
        onMovePlayerToWaitlist: (targetPlayer) => onMovePlayerToWaitlist(targetPlayer.id),
        onViewProfile: () => openProfile(player, participant),
        participant,
        player,
      }),
    );
  }

  async function submitPin() {
    const result = await onSubmitPrivatePin(pinCode);

    if (result.success) {
      setPinCode('');
      setPinError(null);
      setIsPinEntryOpen(false);
      return;
    }

    setPinError(result.messages[0] ?? 'That PIN does not match this private game.');
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
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.wizardBackButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={20} />
        </Pressable>

        <RoomHeroCard
          admin={admin}
          currentParticipant={currentParticipant}
          isActionPending={isActionPending}
          isHost={isCurrentUserAdmin}
          lobby={lobby}
          lobbyIndex={lobbyIndex}
          onInvite={onInvite}
          onOpenHostManagement={onOpenHostManagement}
          playerCount={playerCount}
          primaryAction={primaryAction}
        />

        <GameInfoStrip
          items={[
            { icon: 'calendar-outline', label: 'Starts', value: formatLobbyStart(lobby.startsAt), wide: true },
            { icon: 'cellular', iconColor: colors.accentLime, label: 'Rank', value: getCompactRankLabel(lobby), wide: true },
            { icon: 'people-outline', label: 'Players', value: formatCompactPlayerCount(playerCount) },
            { icon: 'people-circle-outline', iconColor: colors.accentSea, label: 'Gender', value: getGenderLabel(lobby.genderRule), wide: true },
          ]}
        />

        {autoCancelMessage ? (
          <AutoCancelPanel message={autoCancelMessage} />
        ) : null}

        {canLeaveRoom ? (
          <RoomMembershipPanel
            disabled={isActionPending}
            isHost={isCurrentUserAdmin}
            isLobbyCancelled={lifecycleStatus === 'cancelled'}
            participant={currentParticipant}
            onLeave={onLeaveLobby}
            waitlistAction={
              currentParticipant.role === 'waitlist' &&
              arePreStartActionsOpen &&
              (primaryAction.label === lobbyLabels.moveToPlayers || primaryAction.label === 'Players full')
                ? {
                    disabled: isActionPending || primaryAction.disabled,
                    icon: primaryAction.icon,
                    iconColor: primaryAction.iconColor,
                    label: primaryAction.label,
                    onPress: primaryAction.onPress,
                    textTone: primaryAction.textTone,
                    tone: primaryAction.tone,
                  }
                : undefined
            }
          />
        ) : null}

        {currentPendingRequest && !currentParticipant ? (
          <PendingApprovalPanel disabled={isActionPending} onCancel={onCancelJoinRequest} />
        ) : null}

        {currentParticipant && isPrivateLobby(lobby) && lobby.accessCode ? (
          <HostPrivatePinPanel pin={lobby.accessCode} />
        ) : null}

        {isCurrentUserAdmin && arePreStartActionsOpen ? (
          <HostPanel
            currentPlayerId={currentPlayer.id}
            isActionPending={isActionPending}
            onApproveWaitlistRequest={onApproveWaitlistRequest}
            onRejectWaitlistRequest={onRejectWaitlistRequest}
            pendingRequests={pendingRequests}
            players={players}
          />
        ) : null}

        {isPinEntryOpen ? (
          <PrivatePinPanel
            disabled={isActionPending}
            error={pinError}
            onChangePin={(value) => {
              setPinCode(value.replace(/\D/g, '').slice(0, 4));
              setPinError(null);
            }}
            onSubmit={submitPin}
            pin={pinCode}
          />
        ) : null}

        <ParticipantsSection
          actionIcon={playerSectionAction?.icon}
          actionLabel={arePreStartActionsOpen ? playerSectionAction?.label : undefined}
          count={activeParticipants.length}
          onOpenActions={openPlayerActions}
          onOpenProfile={openProfile}
          onRatePlayer={(player) => setRatingWizardPlayer(player)}
          onAction={playerSectionAction?.onPress}
          emptyLabel="Approved players will appear here."
          currentPlayerId={currentPlayer.id}
          blockedPlayerIds={blockedPlayerIds}
          lobby={lobby}
          participants={activeParticipants}
          players={players}
          ratingTasks={ratingTasks}
          showRatingAction={canCurrentPlayerRateLobby}
          title="Players"
        />

        <ParticipantsSection
          actionIcon={waitlistSectionAction?.icon}
          actionLabel={arePreStartActionsOpen ? waitlistSectionAction?.label : undefined}
          count={waitlistedParticipants.length}
          onAction={waitlistSectionAction?.onPress}
          onOpenActions={openPlayerActions}
          onOpenProfile={openProfile}
          emptyLabel="Players waiting for a spot will appear here."
          currentPlayerId={currentPlayer.id}
          blockedPlayerIds={blockedPlayerIds}
          lobby={lobby}
          participants={waitlistedParticipants}
          players={players}
          ratingTasks={ratingTasks}
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
        name={profilePreviewPlayer?.name ?? ''}
        onClose={() => setProfilePreviewSelection(null)}
        player={profilePreviewPlayer}
        profileDetails={profilePreviewPlayer ? getLobbyPreviewDetails(profilePreviewPlayer) : undefined}
        primaryAction={
          profilePreviewSelection
            ? getLobbyProfilePreviewPrimaryAction(
                profilePreviewSelection,
                currentPlayer,
                onViewPlayerProfile,
              )
            : undefined
        }
        rating={profilePreviewPlayer ? formatPlayerRating(profilePreviewPlayer) : undefined}
        secondaryAction={
          profilePreviewSelection
            ? getLobbyProfilePreviewSecondaryAction(
                profilePreviewSelection,
                currentPlayer,
                currentPlayer.friendIds.includes(profilePreviewSelection.player.id),
                onRemoveFriend,
                onSendFriendRequest,
              )
            : undefined
        }
        trustCues={profilePreviewPlayer ? getPlayerPreviewTrustCues(profilePreviewPlayer, allLobbies) : undefined}
        visible={Boolean(profilePreviewSelection)}
      />
      <RatePlayerWizard
        behaviorRating={ratingWizardPlayer ? getInitialBehaviorRating(ratingWizardPlayer) : undefined}
        currentRank={ratingWizardPlayer?.level ?? currentPlayer.level}
        isFriend={Boolean(
          ratingWizardPlayer &&
            (currentPlayer.friendIds.includes(ratingWizardPlayer.id) || localFriendIds.includes(ratingWizardPlayer.id)),
        )}
        onAddFriend={(player) => {
          setLocalFriendIds((current) => (current.includes(player.id) ? current : [...current, player.id]));
        }}
        onClose={() => setRatingWizardPlayer(null)}
        onSubmitRating={({ behaviorRating, rank, skillVoteType, targetPlayer }) => onSubmitPlayerRating({
          behaviorRating,
          rank,
          skillVoteType,
          targetPlayerId: targetPlayer.id,
        })}
        onViewProfile={onViewPlayerProfile}
        player={ratingWizardPlayer}
        visible={Boolean(ratingWizardPlayer)}
      />
      <JoinBlockedModal
        onClose={() => setBlockedJoinReasons(null)}
        reasons={blockedJoinReasons ?? []}
        visible={Boolean(blockedJoinReasons)}
      />
    </View>
  );
}

function RoomHeroCard({
  admin,
  currentParticipant,
  isActionPending,
  isHost,
  lobby,
  lobbyIndex,
  onInvite,
  onOpenHostManagement,
  playerCount,
  primaryAction,
}: {
  admin?: Player;
  currentParticipant?: LobbyParticipant;
  isActionPending: boolean;
  isHost: boolean;
  lobby: Lobby;
  lobbyIndex: number;
  onInvite: () => void;
  onOpenHostManagement: () => void;
  playerCount: string;
  primaryAction: LobbyPrimaryAction;
}) {
  const lifecycleStatus = getEffectiveLobbyStatus(lobby);
  const areLobbyActionsOpen = lifecycleStatus === 'open' || lifecycleStatus === 'full' || lifecycleStatus === 'closing_soon';
  const showShareAction = areLobbyActionsOpen;

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
          <StatusPill label={getStatusLabel(lobby, isHost)} tone={isPrivateLobby(lobby) ? 'red' : 'lime'} />
          <StatusPill icon="time-outline" label={formatLobbyStart(lobby.startsAt)} tone="gold" />
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
            disabled={primaryAction.disabled || isActionPending}
            onPress={primaryAction.onPress}
            style={[
              styles.primaryButton,
              primaryAction.tone === 'muted' && styles.joinedButton,
              primaryAction.tone === 'rating' && styles.ratingButton,
              isActionPending && styles.actionButtonDisabled,
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
          {isHost && areLobbyActionsOpen ? (
            <Pressable accessibilityRole="button" onPress={onOpenHostManagement} style={styles.secondaryButton}>
              <Ionicons color={colors.primaryDark} name="settings-outline" size={18} />
            </Pressable>
          ) : null}
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

function PrivatePinPanel({
  disabled,
  error,
  onChangePin,
  onSubmit,
  pin,
}: {
  disabled: boolean;
  error: string | null;
  onChangePin: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  pin: string;
}) {
  return (
    <View style={styles.pinPanel}>
      <View style={styles.pinHeader}>
        <View style={styles.pinIcon}>
          <Ionicons color={colors.primaryDark} name="lock-closed-outline" size={15} />
        </View>
        <View style={styles.pinCopy}>
          <AppText variant="uiBody" weight="800">
            Private game PIN
          </AppText>
          <AppText tone="muted" variant="metadata" weight="600">
            Enter the 4-digit code from the host or invite.
          </AppText>
        </View>
      </View>

      <View style={styles.pinRow}>
        <TextInput
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={onChangePin}
          placeholder="0000"
          placeholderTextColor={colors.subtle}
          style={styles.pinInput}
          value={pin}
        />
        <Pressable
          accessibilityRole="button"
          disabled={disabled || pin.length !== 4}
          onPress={onSubmit}
          style={[styles.pinSubmit, (disabled || pin.length !== 4) && styles.pinSubmitDisabled]}
        >
          <AppText align="center" tone="inverse" variant="button" weight="800">
            {disabled ? 'Joining' : 'Unlock'}
          </AppText>
        </Pressable>
      </View>
      {error ? (
        <AppText tone="danger" variant="metadata" weight="700">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

function AutoCancelPanel({ message }: { message: string }) {
  return (
    <View style={styles.autoCancelPanel}>
      <View style={styles.autoCancelIcon}>
        <Ionicons color={colors.accentGoldDark} name="timer-outline" size={17} />
      </View>
      <View style={styles.autoCancelCopy}>
        <AppText variant="uiBody" weight="900">
          This room will close soon
        </AppText>
        <AppText tone="muted" variant="metadata" weight="700">
          {message}
        </AppText>
      </View>
    </View>
  );
}

function PendingApprovalPanel({
  disabled,
  onCancel,
}: {
  disabled: boolean;
  onCancel: () => void;
}) {
  return (
    <View style={styles.pendingApprovalPanel}>
      <View style={styles.pendingApprovalIcon}>
        <Ionicons color={colors.primaryDark} name="time-outline" size={16} />
      </View>
      <View style={styles.pendingApprovalCopy}>
        <AppText variant="uiBody" weight="800">
          {lobbyLabels.waitingForHostApproval}
        </AppText>
        <AppText tone="muted" variant="metadata" weight="600">
          Your access request was sent. You can keep viewing this match or cancel the request.
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onCancel}
        style={[styles.cancelRequestButton, disabled && styles.actionButtonDisabled]}
      >
        <AppText align="center" tone="danger" variant="button" weight="800">
          Cancel
        </AppText>
      </Pressable>
    </View>
  );
}

function JoinBlockedModal({
  onClose,
  reasons,
  visible,
}: {
  onClose: () => void;
  reasons: string[];
  visible: boolean;
}) {
  const formattedReasons = reasons.length > 0
    ? reasons.map(formatJoinBlockedReason)
    : ['This game is not available for joining right now.'];
  const isPendingApprovalMessage = formattedReasons.length === 1 && formattedReasons[0] === pendingApprovalReason;

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.joinBlockedOverlay}>
        <Pressable accessibilityLabel="Close join blocked message" accessibilityRole="button" onPress={onClose} style={styles.joinBlockedBackdrop} />
        <View style={styles.joinBlockedCard}>
          <View style={styles.joinBlockedIcon}>
            <Ionicons color={isPendingApprovalMessage ? colors.primaryDark : colors.danger} name={isPendingApprovalMessage ? 'time-outline' : 'alert-circle-outline'} size={22} />
          </View>
          <AppText align="center" variant="titleSmall" weight="900">
            {isPendingApprovalMessage ? lobbyLabels.accessRequested : 'Cannot join players'}
          </AppText>
          <View style={styles.joinBlockedReasonList}>
            {formattedReasons.map((reason) => (
              <AppText key={reason} align="center" tone="muted" variant="uiBody" weight="600">
                {reason}
              </AppText>
            ))}
          </View>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.joinBlockedButton}>
            <AppText align="center" tone="inverse" variant="button" weight="900">
              OK
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function HostPrivatePinPanel({ pin }: { pin: string }) {
  return (
    <View style={styles.hostPinPanel}>
      <View style={styles.hostPinIcon}>
        <Ionicons color={colors.danger} name="lock-closed-outline" size={16} />
      </View>
      <View style={styles.hostPinCopy}>
        <AppText variant="uiBody" weight="800">
          Private lobby PIN
        </AppText>
        <AppText tone="muted" variant="metadata" weight="600">
          Share this code with players you want to invite.
        </AppText>
      </View>
      <View style={styles.hostPinCode}>
        <AppText align="center" tone="danger" variant="button" weight="900">
          {pin}
        </AppText>
      </View>
    </View>
  );
}

function RoomMembershipPanel({
  disabled,
  isHost,
  isLobbyCancelled,
  onLeave,
  participant,
  waitlistAction,
}: {
  disabled: boolean;
  isHost: boolean;
  isLobbyCancelled: boolean;
  onLeave: () => void;
  participant: LobbyParticipant;
  waitlistAction?: RoomMembershipWaitlistAction;
}) {
  const statusLabel = isHost
    ? participant.role === 'waitlist'
      ? 'You are host, on waitlist.'
      : 'You are the host.'
    : participant.role === 'waitlist'
      ? 'You are on the waitlist.'
      : 'You are in players.';
  const buttonLabel = isHost ? 'Leave game' : 'Leave';
  const helperText = isLobbyCancelled
    ? 'This game was cancelled. Leave to remove it from My Games.'
    : 'Leave the room completely when your plans change.';

  return (
    <View style={styles.membershipPanel}>
      <View style={styles.membershipCopy}>
        <View style={styles.membershipIcon}>
          <Ionicons color={colors.primaryDark} name={participant.role === 'waitlist' ? 'time-outline' : 'checkmark-circle-outline'} size={15} />
        </View>
        <View style={styles.membershipText}>
          <AppText numberOfLines={1} variant="uiBody" weight="800">
            {statusLabel}
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
            {helperText}
          </AppText>
        </View>
      </View>
      <View style={styles.membershipActions}>
        {waitlistAction ? (
          <Pressable
            accessibilityRole="button"
            disabled={waitlistAction.disabled}
            onPress={waitlistAction.onPress}
            style={[
              styles.moveToPlayersButton,
              waitlistAction.tone === 'muted' && styles.moveToPlayersButtonMuted,
              waitlistAction.disabled && styles.actionButtonDisabled,
            ]}
          >
            <Ionicons color={waitlistAction.iconColor} name={waitlistAction.icon} size={16} />
            <AppText tone={waitlistAction.textTone} variant="button" weight="800">
              {waitlistAction.label}
            </AppText>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onLeave}
          style={[styles.leaveRoomButton, disabled && styles.actionButtonDisabled]}
        >
          <Ionicons color={colors.danger} name="exit-outline" size={16} />
          <AppText tone="danger" variant="button" weight="800">
            {buttonLabel}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ParticipantsSection({
  actionIcon,
  actionLabel,
  count,
  currentPlayerId,
  blockedPlayerIds,
  emptyLabel,
  onAction,
  onOpenActions,
  onOpenProfile,
  onRatePlayer,
  lobby,
  participants,
  players,
  ratingTasks,
  showRatingAction = false,
  title,
}: {
  actionIcon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  count: number;
  currentPlayerId: string;
  blockedPlayerIds: string[];
  emptyLabel: string;
  onAction?: () => void;
  onOpenActions: (player: Player) => void;
  onOpenProfile: (player: Player, participant: LobbyParticipant) => void;
  onRatePlayer?: (player: Player) => void;
  lobby: Lobby;
  participants: LobbyParticipant[];
  players: Player[];
  ratingTasks: RatingTask[];
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
            <Ionicons color={colors.accentLime} name={actionIcon ?? 'log-in-outline'} size={15} />
            <AppText tone="accent" variant="button" weight="800">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.participantList}>
        {participants.length > 0 ? (
          participants.map((participant) => {
            const player = players.find((candidate) => candidate.id === participant.playerId);

            return player ? (
              <ParticipantRow
                key={`${participant.playerId}-${participant.role}`}
                onMore={() => onOpenActions(player)}
                onPressProfile={() => onOpenProfile(player, participant)}
                onRatePlayer={() => onRatePlayer?.(player)}
                currentPlayerId={currentPlayerId}
                isBlockedByCurrentPlayer={blockedPlayerIds.includes(player.id)}
                lobby={lobby}
                participant={participant}
                player={player}
                ratingTasks={ratingTasks}
                rating={formatPlayerRating(player)}
                showRatingAction={showRatingAction}
              />
            ) : null;
          })
        ) : (
          <View style={styles.participantEmptyState}>
            <Ionicons color={colors.subtle} name="people-outline" size={15} />
            <AppText tone="muted" variant="metadata" weight="700">
              {emptyLabel}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

function ParticipantRow({
  onMore,
  onPressProfile,
  onRatePlayer,
  currentPlayerId,
  isBlockedByCurrentPlayer,
  lobby,
  participant,
  player,
  ratingTasks,
  rating,
  showRatingAction,
}: {
  onMore: () => void;
  onPressProfile: () => void;
  onRatePlayer?: () => void;
  currentPlayerId: string;
  isBlockedByCurrentPlayer: boolean;
  lobby: Lobby;
  participant: LobbyParticipant;
  player: Player;
  ratingTasks: RatingTask[];
  rating: string;
  showRatingAction?: boolean;
}) {
  const isRatingTarget = showRatingAction && player.id !== currentPlayerId;
  const canRateTarget = isRatingTarget && canRatePlayer(ratingTasks, lobby, currentPlayerId, player.id);

  return (
    <PlayerRow
      context={participant.role}
      extraChips={
        isBlockedByCurrentPlayer
          ? [{ icon: 'ban-outline', label: 'Blocked', tone: 'danger' }]
          : undefined
      }
      initials={player.initials}
      level={player.level}
      meta={`${player.tocaPoints} pts`}
      name={player.name}
      onMore={showRatingAction || player.id === currentPlayerId ? undefined : onMore}
      onPressProfile={onPressProfile}
      player={player}
      primaryAction={
        isRatingTarget
          ? {
              disabled: !canRateTarget,
              icon: canRateTarget ? undefined : 'checkmark-circle',
              label: canRateTarget ? 'Rate player' : 'Rated',
              onPress: canRateTarget ? onRatePlayer : undefined,
              variant: canRateTarget ? 'warning' : 'muted',
            }
          : undefined
      }
      rating={rating}
      statusIcon={participant.role === 'admin' ? 'shield-checkmark' : 'star'}
    />
  );
}

function HostPanel({
  currentPlayerId,
  isActionPending,
  onApproveWaitlistRequest,
  onRejectWaitlistRequest,
  pendingRequests,
  players,
}: {
  currentPlayerId: string;
  isActionPending: boolean;
  onApproveWaitlistRequest: (playerId: string) => void;
  onRejectWaitlistRequest: (playerId: string) => void;
  pendingRequests: Lobby['joinRequests'];
  players: Player[];
}) {
  return (
    <View style={styles.hostPanel}>
      <View style={styles.hostPanelHeader}>
        <View style={styles.hostPanelTitleRow}>
          <View style={styles.hostPanelIcon}>
            <Ionicons color={colors.primaryDark} name="shield-checkmark-outline" size={16} />
          </View>
          <View style={styles.hostPanelCopy}>
            <AppText variant="uiBody" weight="800">
              Host panel
            </AppText>
            <AppText tone="muted" variant="metadata" weight="600">
              Approvals go to the waitlist first.
            </AppText>
          </View>
        </View>
        <View style={styles.requestCountPill}>
          <AppText align="center" tone="accent" variant="caption" weight="800">
            {pendingRequests.length}
          </AppText>
        </View>
      </View>

      {pendingRequests.length > 0 ? (
        <View style={styles.requestList}>
          {pendingRequests.map((request) => {
            const player = players.find((candidate) => candidate.id === request.playerId);

            return player ? (
              <View key={request.id} style={styles.requestCard}>
                <HostRequestRow
                  currentPlayerId={currentPlayerId}
                  disabled={isActionPending}
                  onApprove={() => onApproveWaitlistRequest(request.playerId)}
                  onReject={() => onRejectWaitlistRequest(request.playerId)}
                  player={player}
                />
                <View style={styles.requestReasonLine}>
                  <Ionicons color={colors.accentSea} name="information-circle-outline" size={13} />
                  <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
                    {formatRequestReasons(request.reasons)} request
                  </AppText>
                </View>
              </View>
            ) : null;
          })}
        </View>
      ) : (
        <AppText tone="muted" variant="metadata" weight="600">
          No pending waitlist requests.
        </AppText>
      )}
    </View>
  );
}

function HostRequestRow({
  currentPlayerId,
  disabled,
  onApprove,
  onReject,
  player,
}: {
  currentPlayerId: string;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
  player: Player;
}) {
  return (
    <View style={styles.hostRequestRow}>
      <View style={styles.hostRequestInfo}>
        <View style={styles.hostRequestAvatar}>
          <Avatar player={player} size={38} />
          <View style={styles.hostRequestStatusBadge}>
            <Ionicons color={colors.ink} name="hourglass" size={9} />
          </View>
        </View>

        <View style={styles.hostRequestCopy}>
          <AppText numberOfLines={1} variant="titleSmall" weight="800">
            {player.name}
          </AppText>
          <View style={styles.hostRequestChips}>
            <View style={styles.hostRequestChip}>
              <AppText tone="primary" variant="caption" weight="800">
                {player.level}
              </AppText>
            </View>
            <View style={styles.hostRequestChip}>
              <Ionicons color={colors.accentGoldDark} name="star" size={9} />
              <AppText tone="primary" variant="caption" weight="800">
                {formatPlayerRating(player)}
              </AppText>
            </View>
            <View style={[styles.hostRequestChip, styles.hostRequestPointsChip]}>
              <Ionicons color={colors.accentGoldDark} name="flash-outline" size={9} />
              <AppText numberOfLines={1} tone="primary" variant="caption" weight="800">
                {player.tocaPoints} pts
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.hostRequestActions}>
        <Pressable
          accessibilityLabel="Reject request"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onReject}
          style={[styles.hostRequestIconButton, disabled && styles.actionButtonDisabled]}
        >
          <Ionicons color={colors.muted} name="close" size={16} />
        </Pressable>
        <Pressable
          accessibilityLabel="Approve request"
          accessibilityRole="button"
          disabled={disabled}
          onPress={onApprove}
          style={[styles.hostRequestIconButton, styles.hostRequestApproveButton, disabled && styles.actionButtonDisabled]}
        >
          <Ionicons color={colors.textOnGreen} name="checkmark" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

export function LobbyFloatingChatButton({ lobby, onPress }: { lobby: Lobby; onPress: () => void }) {
  const unreadCount = lobby.chatChannels.reduce((total, channel) => total + channel.unreadCount, 0);

  return (
    <Pressable accessibilityLabel="Open lobby chat" accessibilityRole="button" onPress={onPress} style={styles.floatingChatButton}>
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

export function LobbyChatSheet({
  currentPlayer,
  lobby,
  messages,
  onClose,
  onReadChannel,
  onSendMessage,
  players,
  visible,
}: {
  currentPlayer: Player;
  lobby: Lobby;
  messages: ChatMessage[];
  onClose: () => void;
  onReadChannel: (channelId: string) => void;
  onSendMessage: (channelId: string, body: string) => void;
  players: Player[];
  visible: boolean;
}) {
  const [activeChannelId, setActiveChannelId] = useState(lobby.chatChannels[0]?.id ?? '');
  const [draft, setDraft] = useState('');
  const [firstUnreadMessageByChannelId, setFirstUnreadMessageByChannelId] = useState<Record<string, string | null>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const openLobbyIdRef = useRef<string | null>(null);
  const messageYByIdRef = useRef<Record<string, number>>({});
  const skipNextActiveReadRef = useRef(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const activeChannel = lobby.chatChannels.find((channel) => channel.id === activeChannelId) ?? lobby.chatChannels[0];
  const channelMessages = activeChannel
    ? messages.filter((message) => message.channelId === activeChannel.id)
    : [];
  const firstUnreadMessageId = activeChannel ? firstUnreadMessageByChannelId[activeChannel.id] : null;

  function readChannel(channelId: string) {
    const channel = lobby.chatChannels.find((candidate) => candidate.id === channelId);

    if (!channel) {
      return;
    }

    const firstUnreadMessageIdForChannel = getFirstUnreadMessageId(
      messages.filter((message) => message.channelId === channel.id),
      currentPlayer.id,
      channel.unreadCount,
    );

    if (firstUnreadMessageIdForChannel) {
      setFirstUnreadMessageByChannelId((current) => ({
        ...current,
        [channel.id]: firstUnreadMessageIdForChannel,
      }));
    }

    onReadChannel(channel.id);
  }

  useEffect(() => {
    if (!visible) {
      openLobbyIdRef.current = null;
      return;
    }

    if (openLobbyIdRef.current === lobby.id) {
      return;
    }

    const nextChannelId = lobby.chatChannels[0]?.id ?? '';

    openLobbyIdRef.current = lobby.id;
    skipNextActiveReadRef.current = true;
    setActiveChannelId(nextChannelId);
    setDraft('');
    setFirstUnreadMessageByChannelId({});
    setIsExpanded(false);

    if (nextChannelId) {
      readChannel(nextChannelId);
    }
  }, [lobby.id, visible]);

  useEffect(() => {
    const channelIds = lobby.chatChannels.map((channel) => channel.id);
    const hasActiveChannel = channelIds.includes(activeChannelId);

    if (!hasActiveChannel) {
      setActiveChannelId(lobby.chatChannels[0]?.id ?? '');
    }
  }, [activeChannelId, lobby.chatChannels]);

  useEffect(() => {
    if (!visible || !activeChannel) {
      return;
    }

    if (skipNextActiveReadRef.current) {
      skipNextActiveReadRef.current = false;
      return;
    }

    readChannel(activeChannel.id);
  }, [visible, activeChannel?.id, channelMessages.length]);

  useEffect(() => {
    if (!visible || !firstUnreadMessageId) {
      return;
    }

    const scrollTimeout = setTimeout(() => {
      const messageY = messageYByIdRef.current[firstUnreadMessageId];

      if (typeof messageY === 'number') {
        chatScrollRef.current?.scrollTo({ animated: false, y: Math.max(messageY - 8, 0) });
      }
    }, 50);

    return () => clearTimeout(scrollTimeout);
  }, [visible, activeChannel?.id, firstUnreadMessageId, channelMessages.length]);

  function sendMessage() {
    if (!activeChannel || !draft.trim()) {
      return;
    }

    onSendMessage(activeChannel.id, draft);
    setDraft('');
  }

  function switchChannel(channelId: string) {
    setActiveChannelId(channelId);
    readChannel(channelId);
  }

  function recordMessageLayout(messageId: string, event: LayoutChangeEvent) {
    messageYByIdRef.current[messageId] = event.nativeEvent.layout.y;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={[styles.chatModalRoot, isExpanded && styles.chatModalRootExpanded]}>
        <Pressable accessibilityLabel="Close lobby chat" accessibilityRole="button" onPress={onClose} style={styles.chatBackdrop} />

        <View style={[styles.chatSheet, isExpanded && styles.chatSheetExpanded]}>
          {!isExpanded ? <View style={styles.chatHandle} /> : null}

          <View style={styles.chatHeader}>
            <View style={styles.chatTitleWrap}>
              <View style={styles.chatIcon}>
                <Ionicons color={colors.primaryDark} name="chatbubbles-outline" size={17} />
              </View>
              <View style={styles.chatTitleCopy}>
                <AppText numberOfLines={1} variant="titleSmall" weight="900">
                  Lobby chat
                </AppText>
                <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
                  {lobby.title}
                </AppText>
              </View>
            </View>

            <View style={styles.chatHeaderActions}>
              <Pressable
                accessibilityLabel={isExpanded ? 'Collapse chat' : 'Expand chat'}
                accessibilityRole="button"
                onPress={() => setIsExpanded((current) => !current)}
                style={styles.chatIconButton}
              >
                <Ionicons color={colors.ink} name={isExpanded ? 'contract-outline' : 'expand-outline'} size={17} />
              </Pressable>
              <Pressable accessibilityLabel="Close chat" accessibilityRole="button" onPress={onClose} style={styles.chatIconButton}>
                <Ionicons color={colors.ink} name="close" size={17} />
              </Pressable>
            </View>
          </View>

          <View style={styles.chatTabs}>
            {lobby.chatChannels.map((channel) => {
              const isActive = channel.id === activeChannel?.id;
              const unreadCount = channel.unreadCount;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={channel.id}
                  onPress={() => switchChannel(channel.id)}
                  style={[styles.chatTab, isActive && styles.chatTabActive]}
                >
                  <AppText align="center" tone={isActive ? 'accent' : 'muted'} variant="caption" weight="900">
                    {getChatChannelLabel(channel)}
                  </AppText>
                  {unreadCount > 0 ? (
                    <View style={styles.chatTabBadge}>
                      <AppText align="center" tone="inverse" variant="caption" weight="900">
                        {unreadCount}
                      </AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            contentContainerStyle={[styles.chatMessageList, isExpanded && styles.chatMessageListExpanded]}
            ref={chatScrollRef}
            showsVerticalScrollIndicator={false}
            style={[styles.chatMessageScroller, isExpanded && styles.chatMessageScrollerExpanded]}
          >
            {channelMessages.length > 0 ? (
              channelMessages.map((message) => (
                <View key={message.id} onLayout={(event) => recordMessageLayout(message.id, event)}>
                  {message.id === firstUnreadMessageId ? <NewMessagesDivider /> : null}
                  <ChatMessageBubble currentPlayer={currentPlayer} message={message} players={players} />
                </View>
              ))
            ) : (
              <View style={styles.chatEmptyState}>
                <Ionicons color={colors.accentSea} name="chatbox-ellipses-outline" size={24} />
                <AppText align="center" tone="muted" variant="metadata" weight="600">
                  No messages in this channel yet.
                </AppText>
              </View>
            )}
          </ScrollView>

          <View style={styles.chatComposer}>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Write a message"
              placeholderTextColor={colors.subtle}
              style={styles.chatInput}
              value={draft}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!draft.trim()}
              onPress={sendMessage}
              style={[styles.chatSendButton, !draft.trim() && styles.chatSendButtonDisabled]}
            >
              <Ionicons color={colors.textOnGreen} name="send" size={16} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ChatMessageBubble({
  currentPlayer,
  message,
  players,
}: {
  currentPlayer: Player;
  message: ChatMessage;
  players: Player[];
}) {
  const player = players.find((candidate) => candidate.id === message.playerId);
  const isMine = message.playerId === currentPlayer.id;

  return (
    <View style={[styles.chatBubbleRow, isMine && styles.chatBubbleRowMine]}>
      {!isMine && player ? <Avatar player={player} size={30} /> : null}
      <View style={[styles.chatBubble, isMine && styles.chatBubbleMine]}>
        <View style={styles.chatBubbleMeta}>
          <AppText numberOfLines={1} tone={isMine ? 'inverse' : 'primary'} variant="caption" weight="900">
            {isMine ? 'You' : player?.name ?? 'Player'}
          </AppText>
          <AppText tone={isMine ? 'inverse' : 'subtle'} variant="caption" weight="700">
            {formatChatTime(message.createdAt)}
          </AppText>
        </View>
        <AppText tone={isMine ? 'inverse' : 'primary'} variant="bodySmall" weight="600">
          {message.body}
        </AppText>
      </View>
    </View>
  );
}

function NewMessagesDivider() {
  return (
    <View style={styles.chatNewMessagesDivider}>
      <View style={styles.chatNewMessagesLine} />
      <AppText align="center" tone="warning" variant="caption" weight="900">
        New messages
      </AppText>
      <View style={styles.chatNewMessagesLine} />
    </View>
  );
}

function getChatChannelLabel(channel: ChatChannel) {
  return channel.type === 'admin_joined' ? 'Players only' : 'All lobby';
}

function getFirstUnreadMessageId(messages: ChatMessage[], currentPlayerId: string, unreadCount: number) {
  if (unreadCount <= 0) {
    return null;
  }

  const unreadMessages = messages
    .filter((message) => message.playerId !== currentPlayerId)
    .slice(-unreadCount);

  return unreadMessages[0]?.id ?? null;
}

function formatChatTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusPill({
  icon,
  label,
  tone = 'neutral',
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'gold' | 'lime' | 'neutral' | 'red';
}) {
  const isLime = tone === 'lime';
  const isGold = tone === 'gold';
  const isRed = tone === 'red';

  return (
    <View style={[styles.pill, isLime && styles.limePill, isGold && styles.goldPill, isRed && styles.redPill]}>
      {icon ? (
        <Ionicons
          color={isGold ? colors.accent : isLime ? colors.primaryDark : isRed ? colors.danger : colors.muted}
          name={icon}
          size={13}
        />
      ) : null}
      <AppText tone={isGold ? 'warning' : isLime ? 'accent' : isRed ? 'danger' : 'muted'} variant="caption" weight="800">
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
        Host
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
  return isJoinedParticipant(participant);
}

function formatCompactPlayerCount(playerCount: string) {
  return playerCount.replace(/\s+/g, '');
}

function getStatusLabel(lobby: Lobby, isHost = false) {
  if (isLobbyReadyForRatings(lobby)) {
    return 'Rating open';
  }

  const status = getEffectiveLobbyStatus(lobby);
  const autoCancelLabel = getAutoCancelCountdownLabel(lobby);

  if (autoCancelLabel) {
    return autoCancelLabel;
  }

  if (status === 'cancelled') {
    return 'Cancelled';
  }

  if (status === 'completed') {
    return 'Finished';
  }

  if (status === 'full') {
    return 'Full';
  }

  if (status === 'in_progress') {
    return 'Started';
  }

  if (status === 'closed') {
    return 'Closed';
  }

  if (lobby.visibility === 'approval_required') {
    return 'Approval';
  }

  if (lobby.visibility === 'password' || lobby.visibility === 'invite_link') {
    return isHost ? 'Private Host' : 'Private';
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

function isPrivateLobby(lobby: Lobby) {
  return lobby.visibility === 'password' || lobby.visibility === 'invite_link';
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

  return `${lobby.rankMin}/${lobby.rankMax}`;
}

function getCompactRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'range') {
    return `${lobby.rankMin}/${lobby.rankMax}`;
  }

  return getRankLabel(lobby);
}

function getLobbyPrimaryAction({
  allLobbies,
  canCurrentPlayerRateLobby,
  currentParticipant,
  currentPlayer,
  hasRatedEveryPlayer,
  hasPrivateAccess,
  lobby,
  onJoinGame,
  onJoinWaitlist,
  onOpenPinEntry,
  onRequestWaitlistApproval,
  onShowJoinBlockedReasons,
}: {
  allLobbies: Lobby[];
  canCurrentPlayerRateLobby: boolean;
  currentParticipant?: LobbyParticipant;
  currentPlayer: Player;
  hasRatedEveryPlayer: boolean;
  hasPrivateAccess: boolean;
  lobby: Lobby;
  onJoinGame: () => void;
  onJoinWaitlist: () => void;
  onOpenPinEntry: () => void;
  onRequestWaitlistApproval: () => void;
  onShowJoinBlockedReasons: (reasons: string[]) => void;
}): LobbyPrimaryAction {
  const lifecycleStatus = getEffectiveLobbyStatus(lobby);

  if (lifecycleStatus === 'rating_open') {
    if (!canCurrentPlayerRateLobby || hasRatedEveryPlayer) {
      return {
        disabled: true,
        icon: 'checkmark',
        iconColor: colors.muted,
        label: 'Finished',
        textTone: 'muted',
        tone: 'muted',
      };
    }

    return {
      disabled: false,
      icon: 'star-outline',
      iconColor: colors.accentGoldDark,
      label: 'Rate players',
      textTone: 'primary',
      tone: 'rating',
    };
  }

  if (lifecycleStatus === 'completed') {
    return {
      disabled: true,
      icon: 'checkmark',
      iconColor: colors.muted,
      label: 'Finished',
      textTone: 'muted',
      tone: 'muted',
    };
  }

  if (lifecycleStatus === 'cancelled') {
    return {
      disabled: true,
      icon: 'close-circle-outline',
      iconColor: colors.muted,
      label: 'Cancelled',
      textTone: 'muted',
      tone: 'muted',
    };
  }

  if (lifecycleStatus === 'in_progress') {
    return {
      disabled: true,
      icon: 'time-outline',
      iconColor: colors.muted,
      label: 'Started',
      textTone: 'muted',
      tone: 'muted',
    };
  }

  if (isLobbyHost(lobby, currentPlayer.id, currentParticipant) && currentParticipant?.role !== 'waitlist') {
    return {
      disabled: true,
      icon: 'shield-checkmark',
      iconColor: colors.muted,
      label: lobbyLabels.host,
      textTone: 'muted',
      tone: 'muted',
    };
  }

  const accessContext = {
    accessCode: hasPrivateAccess ? lobby.accessCode : undefined,
    allLobbies,
  };
  const accessDecision = getLobbyAccessDecision(currentPlayer, lobby, accessContext);
  const relationship = getPlayerLobbyRelationship(currentPlayer.id, lobby);

  if (accessDecision.kind === 'requires_password') {
    return {
      disabled: false,
      icon: 'keypad-outline',
      iconColor: colors.textOnGreen,
      label: 'Enter PIN',
      onPress: onOpenPinEntry,
      textTone: 'inverse',
      tone: 'green',
    };
  }

  if (relationship === 'pending_approval' && !hasPrivateAccess) {
    return {
      disabled: false,
      icon: 'time-outline',
      iconColor: colors.muted,
      label: lobbyLabels.accessRequested,
      onPress: () => onShowJoinBlockedReasons([pendingApprovalReason]),
      textTone: 'muted',
      tone: 'muted',
    };
  }

  if (relationship === 'joined' || relationship === 'attended') {
    return {
      disabled: true,
      icon: 'checkmark',
      iconColor: colors.muted,
      label: lobbyLabels.joined,
      textTone: 'muted',
      tone: 'muted',
    };
  }

  if (accessDecision.kind === 'request_approval') {
    return {
      disabled: false,
      icon: 'mail-outline',
      iconColor: colors.textOnGreen,
      label: lobbyLabels.requestWaitlist,
      onPress: onRequestWaitlistApproval,
      textTone: 'inverse',
      tone: 'green',
    };
  }

  if (accessDecision.kind === 'locked') {
    return {
      disabled: false,
      icon: 'lock-closed-outline',
      iconColor: colors.muted,
      label: 'Locked',
      onPress: () => onShowJoinBlockedReasons(accessDecision.reasons),
      textTone: 'muted',
      tone: 'muted',
    };
  }

  const waitlistDecision = getJoinWaitlistDecision(currentPlayer, lobby, accessContext);
  const joinDecision = getJoinGameDecision(currentPlayer, lobby, accessContext);

  if (relationship === 'waitlist') {
    const isFullWaitlistMove = joinDecision.kind === 'full_join_waitlist';

    return joinDecision.canJoin
      ? {
          disabled: false,
          icon: 'log-in-outline',
          iconColor: colors.textOnGreen,
          label: joinDecision.label,
          onPress: onJoinGame,
          textTone: 'inverse',
          tone: 'green',
        }
      : {
          disabled: isFullWaitlistMove,
          icon: isFullWaitlistMove ? 'people-outline' : 'alert-circle-outline',
          iconColor: colors.muted,
          label: isFullWaitlistMove ? 'Players full' : lobbyLabels.moveToPlayers,
          onPress: isFullWaitlistMove ? undefined : () => onShowJoinBlockedReasons(joinDecision.reasons),
          textTone: 'muted',
          tone: 'muted',
        };
  }

  if (waitlistDecision.canJoinWaitlist) {
    return {
      disabled: false,
      icon: 'hourglass-outline',
      iconColor: colors.textOnGreen,
      label: waitlistDecision.label,
      onPress: onJoinWaitlist,
      textTone: 'inverse',
      tone: 'green',
    };
  }

  if (joinDecision.canJoin) {
    return {
      disabled: false,
      icon: 'log-in-outline',
      iconColor: colors.textOnGreen,
      label: joinDecision.label,
      onPress: onJoinGame,
      textTone: 'inverse',
      tone: 'green',
    };
  }

  return {
    disabled: false,
    icon: 'close-circle-outline',
    iconColor: colors.muted,
    label: joinDecision.label,
    onPress: () => onShowJoinBlockedReasons(joinDecision.reasons),
    textTone: 'muted',
    tone: 'muted',
  };
}

function formatJoinBlockedReason(reason: string) {
  if (reason === 'level_exception') {
    return 'Your rank is outside this game range.';
  }

  if (reason === 'gender_exception') {
    return 'This game is limited by gender settings.';
  }

  if (reason === 'private_access') {
    return 'This is a private game. Enter the PIN first.';
  }

  if (reason === 'This game has no open joined-player slots.') {
    return 'The players list is full. Stay on the waitlist until a spot opens.';
  }

  if (reason === 'Player must join the waitlist before moving into players.') {
    return 'Join the waitlist first. The host or an open spot can move you into players.';
  }

  if (reason === 'This game is not open for new commitments.') {
    return 'This game has already started, closed, or moved to ratings.';
  }

  if (reason === 'This game is not open for waitlist joins.') {
    return 'The waitlist is closed for this game.';
  }

  if (reason === 'This game does not have a waitlist.') {
    return 'This game does not use a waitlist.';
  }

  return reason;
}

function getPlayerSectionAction({
  allLobbies,
  currentPlayer,
  hasPrivateAccess,
  lobby,
  onJoinGame,
  onShowJoinBlockedReasons,
}: {
  allLobbies: Lobby[];
  currentPlayer: Player;
  hasPrivateAccess: boolean;
  lobby: Lobby;
  onJoinGame: () => void;
  onShowJoinBlockedReasons: (reasons: string[]) => void;
}): LobbySectionAction | undefined {
  const relationship = getPlayerLobbyRelationship(currentPlayer.id, lobby);
  const activeCurrentParticipant = getActiveCurrentParticipant(lobby, currentPlayer.id);
  const lifecycleStatus = getEffectiveLobbyStatus(lobby);

  if (
    (lifecycleStatus !== 'open' && lifecycleStatus !== 'full' && lifecycleStatus !== 'closing_soon') ||
    activeCurrentParticipant?.role === 'admin' ||
    relationship === 'joined' ||
    relationship === 'attended'
  ) {
    return undefined;
  }

  const joinDecision = getJoinGameDecision(currentPlayer, lobby, {
    accessCode: hasPrivateAccess ? lobby.accessCode : undefined,
    allLobbies,
  });

  return joinDecision.canJoin
    ? {
        icon: 'log-in-outline',
        label: joinDecision.label,
        onPress: onJoinGame,
      }
    : relationship === 'waitlist'
      ? {
          icon: 'alert-circle-outline',
          label: lobbyLabels.moveToPlayers,
          onPress: () => onShowJoinBlockedReasons(joinDecision.reasons),
        }
      : undefined;
}

function getWaitlistSectionAction({
  allLobbies,
  currentPlayer,
  hasPrivateAccess,
  lobby,
  onJoinWaitlist,
}: {
  allLobbies: Lobby[];
  currentPlayer: Player;
  hasPrivateAccess: boolean;
  lobby: Lobby;
  onJoinWaitlist: () => void;
}): LobbySectionAction | undefined {
  const relationship = getPlayerLobbyRelationship(currentPlayer.id, lobby);
  const lifecycleStatus = getEffectiveLobbyStatus(lobby);

  if ((lifecycleStatus !== 'open' && lifecycleStatus !== 'full' && lifecycleStatus !== 'closing_soon') || relationship === 'waitlist') {
    return undefined;
  }

  const waitlistDecision = getJoinWaitlistDecision(currentPlayer, lobby, {
    accessCode: hasPrivateAccess ? lobby.accessCode : undefined,
    allLobbies,
  });

  return waitlistDecision.canJoinWaitlist
    ? {
        icon: 'hourglass-outline',
        label: waitlistDecision.label,
        onPress: onJoinWaitlist,
      }
    : undefined;
}

function getActiveCurrentParticipant(lobby: Lobby, currentPlayerId: string) {
  return lobby.participants.find(
    (participant) =>
      participant.playerId === currentPlayerId &&
      (participant.status === 'approved' || participant.status === 'attended'),
  );
}

function formatRequestReasons(reasons: Lobby['joinRequests'][number]['reasons']) {
  if (reasons.length === 0) {
    return 'Waitlist approval';
  }

  return reasons
    .map((reason) => {
      if (reason === 'gender_exception') {
        return 'Gender';
      }

      if (reason === 'level_exception') {
        return 'Rank';
      }

      if (reason === 'private_access') {
        return 'Private game';
      }

      return 'Approval';
    })
    .join(' / ');
}

function getLobbyPlayerActions({
  canManageLobby = true,
  currentPlayer,
  isCurrentUserAdmin,
  isFriend,
  onKickPlayer,
  onBlockPlayer,
  onRemoveFriend,
  onReportPlayer,
  onSendFriendRequest,
  onMovePlayerToWaitlist,
  onTransferHost,
  onViewProfile,
  participant,
  player,
}: {
  canManageLobby?: boolean;
  currentPlayer: Player;
  isCurrentUserAdmin: boolean;
  isFriend: boolean;
  onKickPlayer: (playerId: string) => Promise<void> | void;
  onBlockPlayer?: (player: Player) => Promise<void> | void;
  onRemoveFriend?: (player: Player) => void;
  onReportPlayer?: () => void;
  onSendFriendRequest?: (player: Player) => void;
  onMovePlayerToWaitlist: (player: Player) => Promise<void> | void;
  onTransferHost?: (player: Player) => Promise<void> | void;
  onViewProfile: () => void;
  participant?: LobbyParticipant;
  player: Player;
}): PlayerAction[] {
  const isSelf = player.id === currentPlayer.id;
  const canTransferHost = Boolean(participant);
  const hostActions: PlayerAction[] =
    canManageLobby && isCurrentUserAdmin && participant && !isSelf
      ? [
          ...(canTransferHost
            ? [
                {
                  confirmation: {
                    body: `${player.name} will become the host and will manage this lobby.`,
                    confirmLabel: 'Transfer',
                    title: 'Transfer host?',
                  },
                  icon: 'shield-checkmark-outline' as const,
                  label: 'Transfer host',
                  onPress: () => onTransferHost?.(player),
                },
              ]
            : []),
          ...(participant.role !== 'waitlist'
            ? [
                {
                  icon: 'swap-horizontal-outline' as const,
                  label: lobbyLabels.moveToWaitlist,
                  onPress: () => onMovePlayerToWaitlist(player),
                },
              ]
            : []),
          {
            confirmation: {
              body: `${player.name} will be removed from this lobby, but can join or request again later.`,
              confirmLabel: 'Remove',
              title: 'Remove player?',
            },
            destructive: true,
            icon: 'remove-circle-outline' as const,
            label: 'Kick from lobby',
            onPress: () => onKickPlayer(player.id),
          },
        ]
      : [];

  return [
    {
      icon: 'person-circle-outline',
      label: isFriend ? 'Show full profile' : 'View full profile',
      onPress: onViewProfile,
    },
    ...hostActions,
    ...(isFriend
      ? [{ destructive: true, icon: 'person-remove-outline' as const, label: 'Remove friend', onPress: () => onRemoveFriend?.(player) }]
      : [{ icon: 'person-add-outline' as const, label: 'Add friend', onPress: () => onSendFriendRequest?.(player) }]),
    { destructive: true, icon: 'flag-outline', label: 'Report player', onPress: onReportPlayer },
    {
      confirmation: {
        body: `${player.name} will be hidden from your discovery surfaces and kept out of games you host.`,
        confirmLabel: 'Block',
        title: 'Block player?',
      },
      destructive: true,
      icon: 'ban-outline',
      label: 'Block player',
      onPress: () => onBlockPlayer?.(player),
    },
  ];
}

function getLobbyProfilePreviewPrimaryAction(
  selection: LobbyProfilePreviewSelection,
  currentPlayer: Player,
  onViewPlayerProfile: (player: Player) => void,
) {
  return {
    label: selection.player.id === currentPlayer.id ? 'View your profile' : 'View full profile',
    onPress: () => onViewPlayerProfile(selection.player),
  };
}

function getLobbyProfilePreviewSecondaryAction(
  selection: LobbyProfilePreviewSelection,
  currentPlayer: Player,
  isFriend: boolean,
  onRemoveFriend: (playerId: string) => void,
  onSendFriendRequest: (playerId: string) => void,
) {
  if (selection.player.id === currentPlayer.id) {
    return undefined;
  }

  return {
    label: isFriend ? 'Remove friend' : 'Add friend',
    onPress: () => {
      if (isFriend) {
        onRemoveFriend(selection.player.id);
        return;
      }

      onSendFriendRequest(selection.player.id);
    },
  };
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
  autoCancelCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  autoCancelIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.40)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  autoCancelPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 246, 215, 0.92)',
    borderColor: 'rgba(239, 165, 26, 0.26)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  cancelRequestButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 232, 0.88)',
    borderColor: 'rgba(221, 71, 54, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexShrink: 0,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.md,
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
  actionButtonDisabled: {
    opacity: 0.56,
  },
  joinBlockedBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  joinBlockedButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  joinBlockedCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(221, 71, 54, 0.22)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 340,
    padding: spacing.xl,
    width: '86%',
    ...shadows.soft,
  },
  joinBlockedIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 232, 0.92)',
    borderColor: 'rgba(221, 71, 54, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  joinBlockedOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 34, 32, 0.42)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: spacing.xl,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  joinBlockedReasonList: {
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
  chatBackdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chatBubble: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderTopLeftRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
    gap: spacing.xs,
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chatBubbleMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  chatBubbleMine: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 8,
  },
  chatBubbleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chatBubbleRowMine: {
    justifyContent: 'flex-end',
  },
  chatComposer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
  },
  chatEmptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  chatHandle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 4,
    width: 42,
  },
  chatHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  chatHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chatIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  chatIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  chatInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 14,
    letterSpacing: 0,
    maxHeight: 88,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chatMessageList: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chatMessageListExpanded: {
    flexGrow: 1,
    paddingBottom: spacing.md,
  },
  chatNewMessagesDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  chatNewMessagesLine: {
    backgroundColor: colors.accentGold,
    flex: 1,
    height: 1,
  },
  chatMessageScroller: {
    flexShrink: 1,
    minHeight: 0,
  },
  chatMessageScrollerExpanded: {
    flex: 1,
    minHeight: 0,
  },
  chatModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  chatModalRootExpanded: {
    justifyContent: 'flex-start',
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  chatSendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  chatSendButtonDisabled: {
    opacity: 0.46,
  },
  chatSheet: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 26,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: 500,
    padding: spacing.lg,
    ...shadows.hero,
  },
  chatSheetExpanded: {
    borderRadius: 0,
    bottom: 0,
    left: 0,
    maxHeight: '100%',
    paddingBottom: spacing.xl,
    paddingTop: spacing.xxl,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chatTab: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    position: 'relative',
  },
  chatTabActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  chatTabBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentGoldDark,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -4,
    top: -6,
  },
  chatTabs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  chatTitleCopy: {
    flex: 1,
    minWidth: 0,
  },
  chatTitleWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  goldPill: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  redPill: {
    backgroundColor: 'rgba(255, 235, 232, 0.88)',
    borderColor: 'rgba(221, 71, 54, 0.34)',
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
  hostPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  hostPanelCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  hostPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  hostPanelIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  hostPinCode: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 232, 0.88)',
    borderColor: 'rgba(221, 71, 54, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 64,
    paddingHorizontal: spacing.sm,
  },
  hostPinCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  hostPinIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 235, 232, 0.72)',
    borderColor: 'rgba(221, 71, 54, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  hostPinPanel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(221, 71, 54, 0.22)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  hostPanelTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  hostRequestActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  hostRequestApproveButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hostRequestAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  hostRequestChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    minHeight: 18,
    paddingHorizontal: 6,
  },
  hostRequestChips: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    minWidth: 0,
  },
  hostRequestCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  hostRequestIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  hostRequestInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  hostRequestPointsChip: {
    maxWidth: 66,
  },
  hostRequestRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 66,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    ...shadows.soft,
  },
  hostRequestStatusBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: -1,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    width: 16,
  },
  limePill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  leaveRoomButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(217, 74, 58, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  moveToPlayersButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  moveToPlayersButtonMuted: {
    backgroundColor: colors.surfaceRaised,
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
  membershipCopy: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  membershipActions: {
    alignItems: 'flex-end',
    flexShrink: 0,
    gap: spacing.xs,
  },
  membershipIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  membershipPanel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  membershipText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
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
  participantEmptyState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  pinCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  pinHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pinIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pinInput: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 18,
    letterSpacing: 0,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  pinPanel: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  pinRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pinSubmit: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  pinSubmitDisabled: {
    opacity: 0.52,
  },
  pendingApprovalCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  pendingApprovalIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pendingApprovalPanel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(36, 196, 90, 0.24)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
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
  requestCard: {
    gap: spacing.xs,
  },
  requestCountPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: spacing.xs,
  },
  requestList: {
    gap: spacing.xs,
  },
  requestReasonLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
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
