import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BeachGameVisual } from '../components/home/BeachGameVisual';
import { NearbyGameCard } from '../components/home/NearbyGameCard';
import { PlayerRow, type PlayerRowAction } from '../components/PlayerRow';
import { currentPlayer } from '../data/mock';
import { formatLobbyStart } from '../features/lobbies/lobbyDateTime';
import { isJoinedParticipant } from '../features/lobbies/lobbyRules';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { Lobby, LobbyParticipant, Player } from '../types';

export type InviteSource = 'community' | 'leaderboard' | 'lobby' | 'player' | 'profile';

export type InviteComposerParams = {
  inviteTargetLobbyId?: string;
  inviteTargetPlayerId?: string;
  source?: InviteSource;
};

type InviteComposerScreenProps = {
  lobbies: Lobby[];
  onBack: () => void;
  onCreateGame: () => void;
  params: InviteComposerParams;
  players: Player[];
};

type InviteMode = 'both-known' | 'lobby-known' | 'neutral' | 'player-known';

export function InviteComposerScreen({
  lobbies,
  onBack,
  onCreateGame,
  params,
  players,
}: InviteComposerScreenProps) {
  const targetPlayer = players.find((player) => player.id === params.inviteTargetPlayerId);
  const targetLobby = lobbies.find((lobby) => lobby.id === params.inviteTargetLobbyId);
  const mode = getInviteMode(Boolean(targetPlayer), Boolean(targetLobby));
  const userLobbies = useMemo(() => getUserInviteLobbies(lobbies), [lobbies]);
  const [selectedLobbyId, setSelectedLobbyId] = useState(targetLobby?.id);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(targetPlayer ? [targetPlayer.id] : []);
  const [invitedPlayerIdsByLobby, setInvitedPlayerIdsByLobby] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedLobby = lobbies.find((lobby) => lobby.id === selectedLobbyId);
  const selectedPlayers = players.filter((player) => selectedPlayerIds.includes(player.id));
  const availablePlayers = players.filter((player) => player.id !== currentPlayer.id);
  const invitedIdsForSelectedLobby = selectedLobby ? invitedPlayerIdsByLobby[selectedLobby.id] ?? [] : [];
  const canSend =
    Boolean(selectedLobby) &&
    selectedPlayerIds.length > 0 &&
    selectedPlayerIds.some((playerId) => !invitedIdsForSelectedLobby.includes(playerId));
  const title = getScreenTitle(mode, targetPlayer);
  const subtitle = getScreenSubtitle(mode, targetPlayer, targetLobby);
  const ctaLabel = getCtaLabel(mode, selectedLobby, selectedPlayers, targetPlayer);

  function togglePlayer(playerId: string) {
    if (!selectedLobby || targetPlayer?.id === playerId) {
      return;
    }

    setSelectedPlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId],
    );
    setSuccessMessage(null);
  }

  function selectLobby(lobby: Lobby) {
    if (targetLobby || isLobbyDisabled(lobby)) {
      return;
    }

    setSelectedLobbyId(lobby.id);
    setSuccessMessage(null);
  }

  function sendInvites() {
    if (!selectedLobby || selectedPlayerIds.length === 0) {
      return;
    }

    setInvitedPlayerIdsByLobby((current) => {
      const invitedForLobby = current[selectedLobby.id] ?? [];
      return {
        ...current,
        [selectedLobby.id]: Array.from(new Set([...invitedForLobby, ...selectedPlayerIds])),
      };
    });
    setSuccessMessage(getSuccessMessage(selectedLobby, selectedPlayers));
    if (!targetPlayer) {
      setSelectedPlayerIds([]);
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.78 }}
        style={styles.backgroundGlow}
      />

      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={styles.headerButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={21} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText numberOfLines={1} variant="sectionHeading" weight="900">
            {title}
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
            {subtitle}
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {successMessage ? (
          <View style={styles.successBanner}>
            <Ionicons color={colors.primaryDark} name="checkmark-circle" size={18} />
            <AppText style={styles.successText} tone="accent" variant="metadata" weight="800">
              {successMessage}
            </AppText>
          </View>
        ) : null}

        {targetPlayer ? (
          <InvitePlayerContextCard
            context={getPlayerContext(targetPlayer)}
            locked
            player={targetPlayer}
            rating={getPlayerRating(targetPlayer)}
          />
        ) : null}

        {targetLobby ? <InviteGameContextCard locked lobby={targetLobby} /> : null}

        {!targetLobby ? (
          <View style={styles.section}>
            <SectionHeader
              subtitle={
                targetPlayer
                  ? `Pick the room ${targetPlayer.name} should join`
                  : 'Start with the room, then choose players'
              }
              title="Your upcoming games"
            />

            {userLobbies.length > 0 ? (
              <View style={styles.optionStack}>
                {userLobbies.map((lobby, index) => (
                  <InviteGameOption
                    disabled={isLobbyDisabled(lobby)}
                    key={lobby.id}
                    lobby={lobby}
                    onPress={() => selectLobby(lobby)}
                    selected={selectedLobbyId === lobby.id}
                    variant={index % 3}
                  />
                ))}
              </View>
            ) : (
              <InviteEmptyState
                actionLabel={targetPlayer ? `Create game to invite ${targetPlayer.name}` : 'Create a game'}
                description={
                  targetPlayer
                    ? `Set up a room first, then invite ${targetPlayer.name}.`
                    : 'Create a room before sending player invites.'
                }
                onPress={onCreateGame}
                title="No upcoming games yet"
              />
            )}

            <CreateGameCard
              description={targetPlayer ? `Set up a room and invite ${targetPlayer.name}` : 'Create a room and choose players'}
              onPress={onCreateGame}
            />
          </View>
        ) : null}

        {(targetLobby || selectedLobby) && !targetPlayer ? (
          <View style={styles.section}>
            <SectionHeader subtitle="Friends and nearby players" title="Choose players" />
            <View style={styles.searchBox}>
              <Ionicons color={colors.subtle} name="search" size={16} />
              <TextInput
                placeholder="Search players"
                placeholderTextColor={colors.subtle}
                style={styles.searchInput}
              />
            </View>
            <View style={styles.optionStack}>
              {availablePlayers.map((player) => {
                const activeLobby = selectedLobby ?? targetLobby;
                const invitedIds = activeLobby ? invitedPlayerIdsByLobby[activeLobby.id] ?? [] : [];
                const playerState = getPlayerInviteState(player, activeLobby, invitedIds);

                return (
                  <InvitePlayerOption
                    inviteState={playerState}
                    key={player.id}
                    onPress={() => togglePlayer(player.id)}
                    player={player}
                    rating={getPlayerRating(player)}
                    selected={selectedPlayerIds.includes(player.id)}
                  />
                );
              })}
            </View>
          </View>
        ) : null}

        {targetPlayer && selectedLobby ? (
          <View style={styles.section}>
            <SectionHeader subtitle="Ready to send" title="Invite summary" />
            <InviteGameContextCard lobby={selectedLobby} />
          </View>
        ) : null}
      </ScrollView>

      <StickyInviteCTA
        disabled={!canSend}
        helperText={
          targetPlayer
            ? `${targetPlayer.name} will get a room invite notification`
            : 'Players will get a room invite notification'
        }
        label={ctaLabel}
        onPress={sendInvites}
      />
    </View>
  );
}

function InvitePlayerContextCard({
  context,
  locked = false,
  player,
  rating,
}: {
  context: string;
  locked?: boolean;
  player: Player;
  rating: string;
}) {
  return (
    <PlayerRow
      context={context}
      initials={player.initials}
      level={player.level}
      location={player.area}
      meta={locked ? 'Locked' : undefined}
      name={player.name}
      rating={rating}
      statusIcon="shield-checkmark"
    />
  );
}

function InviteGameContextCard({ locked = false, lobby }: { locked?: boolean; lobby: Lobby }) {
  const activePlayers = lobby.participants.filter(isActiveParticipant).length;

  return (
    <View style={styles.contextCard}>
      <View style={styles.gameThumb}>
        <BeachGameVisual variant="aqua" />
      </View>
      <View style={styles.contextCopy}>
        <View style={styles.lockedRow}>
          <AppText numberOfLines={1} variant="cardTitle" weight="900">
            {lobby.title}
          </AppText>
          {locked ? <LockedPill /> : null}
        </View>
        <View style={styles.locationLine}>
          <Ionicons color={colors.accentSea} name="location" size={13} />
          <AppText numberOfLines={1} tone="muted" variant="metadata" weight="700">
            {lobby.location.name} - {formatLobbyStart(lobby.startsAt)}
          </AppText>
        </View>
        <View style={styles.chipRow}>
          <MiniChip label={getRankLabel(lobby)} />
          <MiniChip icon="people-outline" label={`${activePlayers}/${lobby.maxPlayers}`} />
        </View>
      </View>
    </View>
  );
}

function InviteGameOption({
  disabled,
  lobby,
  onPress,
  selected,
  variant,
}: {
  disabled: boolean;
  lobby: Lobby;
  onPress: () => void;
  selected: boolean;
  variant: number;
}) {
  const activePlayers = lobby.participants.filter(isActiveParticipant).length;
  const spotsLeft = Math.max(lobby.maxPlayers - activePlayers, 0);

  return (
    <NearbyGameCard
      actionLabel={selected ? 'Selected' : disabled ? 'Full' : 'Choose'}
      actionTone={selected ? 'accent' : 'warning'}
      audience={getGenderLabel(lobby)}
      disabled={disabled}
      distance={lobby.location.distanceKm ? `${lobby.location.distanceKm} km` : lobby.location.city}
      level={getRankLabel(lobby)}
      location={`${lobby.location.name}, ${lobby.location.city}`}
      onPress={onPress}
      players={`${activePlayers}/${lobby.maxPlayers}`}
      selected={selected}
      spotsLeft={`${spotsLeft} spots left`}
      status={disabled ? 'Full' : 'Approval'}
      time={formatLobbyStart(lobby.startsAt)}
      title={lobby.title}
      variant={variant === 1 ? 'sunset' : 'morning'}
    />
  );
}

function InvitePlayerOption({
  inviteState,
  onPress,
  player,
  rating,
  selected,
}: {
  inviteState: 'available' | 'invited' | 'joined';
  onPress: () => void;
  player: Player;
  rating: string;
  selected: boolean;
}) {
  const disabled = inviteState !== 'available';
  const action = getInvitePlayerAction(inviteState, selected, onPress);

  return (
    <PlayerRow
      context={getPlayerContext(player)}
      initials={player.initials}
      level={player.level}
      location={player.area}
      name={player.name}
      onPressProfile={disabled ? undefined : onPress}
      primaryAction={action}
      rating={rating}
      statusIcon={selected || inviteState === 'invited' ? 'checkmark' : 'star'}
      style={[selected ? styles.optionSelected : undefined, disabled ? styles.optionDisabled : undefined]}
    />
  );
}

function CreateGameCard({ description, onPress }: { description: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.createCard}>
      <View style={styles.createIcon}>
        <Ionicons color={colors.primaryDark} name="add" size={22} />
      </View>
      <View style={styles.optionCopy}>
        <AppText variant="titleSmall" weight="900">
          Create a new game
        </AppText>
        <AppText tone="muted" variant="metadata" weight="600">
          {description}
        </AppText>
      </View>
      <Ionicons color={colors.primaryDark} name="chevron-forward" size={18} />
    </Pressable>
  );
}

function InviteEmptyState({
  actionLabel,
  description,
  onPress,
  title,
}: {
  actionLabel: string;
  description: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.accentGoldDark} name="sunny-outline" size={24} />
      </View>
      <AppText align="center" variant="cardTitle" weight="900">
        {title}
      </AppText>
      <AppText align="center" tone="muted" variant="metadata" weight="600">
        {description}
      </AppText>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.emptyButton}>
        <AppText align="center" tone="inverse" variant="button" weight="800">
          {actionLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

function StickyInviteCTA({
  disabled,
  helperText,
  label,
  onPress,
}: {
  disabled: boolean;
  helperText: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.stickyCta}>
      <AppText align="center" tone="muted" variant="metadata" weight="600">
        {helperText}
      </AppText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={[styles.ctaButton, disabled && styles.ctaButtonDisabled]}
      >
        <AppText align="center" tone={disabled ? 'muted' : 'inverse'} variant="button" weight="900">
          {label}
        </AppText>
      </Pressable>
    </View>
  );
}

function SectionHeader({ subtitle, title }: { subtitle: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="sectionHeading" weight="900">
        {title}
      </AppText>
      <AppText tone="muted" variant="metadata" weight="600">
        {subtitle}
      </AppText>
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

function LockedPill() {
  return (
    <View style={styles.lockedPill}>
      <Ionicons color={colors.primaryDark} name="lock-closed-outline" size={11} />
      <AppText tone="accent" variant="chip" weight="800">
        Locked
      </AppText>
    </View>
  );
}

function SelectionMark({ disabled, selected }: { disabled: boolean; selected: boolean }) {
  return (
    <View style={[styles.selectionMark, selected && styles.selectionMarkSelected, disabled && styles.selectionMarkDisabled]}>
      {selected ? <Ionicons color={colors.textOnGreen} name="checkmark" size={15} /> : null}
    </View>
  );
}

function getInviteMode(hasPlayer: boolean, hasLobby: boolean): InviteMode {
  if (hasPlayer && hasLobby) {
    return 'both-known';
  }

  if (hasPlayer) {
    return 'player-known';
  }

  if (hasLobby) {
    return 'lobby-known';
  }

  return 'neutral';
}

function getScreenTitle(mode: InviteMode, player?: Player) {
  if (mode === 'player-known' || mode === 'both-known') {
    return player ? `Invite ${player.name}` : 'Invite player';
  }

  return 'Invite players';
}

function getScreenSubtitle(mode: InviteMode, player?: Player, lobby?: Lobby) {
  if (mode === 'lobby-known' && lobby) {
    return `${lobby.title} - ${formatLobbyStart(lobby.startsAt)}`;
  }

  if (mode === 'player-known' && player) {
    return `Choose a game to invite ${getPronoun(player)} to`;
  }

  if (mode === 'both-known' && player && lobby) {
    return `${player.name} to ${lobby.location.name}`;
  }

  return 'Choose a game, then players';
}

function getCtaLabel(mode: InviteMode, lobby?: Lobby, selectedPlayers: Player[] = [], targetPlayer?: Player) {
  if (!lobby) {
    return targetPlayer ? `Choose a game for ${targetPlayer.name}` : 'Choose a game';
  }

  if (targetPlayer) {
    return `Invite ${targetPlayer.name} to ${lobby.location.name}`;
  }

  if (selectedPlayers.length > 1) {
    return `Send ${selectedPlayers.length} invites`;
  }

  if (mode === 'lobby-known') {
    return `Invite players to ${lobby.location.name}`;
  }

  return 'Send invite';
}

function getSuccessMessage(lobby: Lobby, selectedPlayers: Player[]) {
  if (selectedPlayers.length === 1) {
    return `${selectedPlayers[0].name} invited to ${lobby.location.name}`;
  }

  return `${selectedPlayers.length} invites sent to ${lobby.location.name}`;
}

function getUserInviteLobbies(lobbies: Lobby[]) {
  return lobbies.filter((lobby) =>
    lobby.participants.some(
      (participant) =>
        participant.playerId === currentPlayer.id &&
        isJoinedParticipant(participant),
    ),
  );
}

function getPlayerInviteState(
  player: Player,
  lobby: Lobby | undefined,
  invitedPlayerIds: string[],
): 'available' | 'invited' | 'joined' {
  if (!lobby) {
    return 'available';
  }

  if (lobby.participants.some((participant) => participant.playerId === player.id && isActiveParticipant(participant))) {
    return 'joined';
  }

  if (invitedPlayerIds.includes(player.id)) {
    return 'invited';
  }

  return 'available';
}

function getPlayerStateLabel(state: 'available' | 'invited' | 'joined') {
  if (state === 'joined') {
    return 'Joined';
  }

  if (state === 'invited') {
    return 'Invited';
  }

  return 'Available';
}

function getInvitePlayerAction(
  state: 'available' | 'invited' | 'joined',
  selected: boolean,
  onPress: () => void,
): PlayerRowAction {
  if (state !== 'available') {
    return {
      disabled: true,
      label: getPlayerStateLabel(state),
      variant: 'muted',
    };
  }

  return {
    label: selected ? 'Selected' : 'Select',
    onPress,
    variant: selected ? 'muted' : 'primary',
  };
}

function isLobbyDisabled(lobby: Lobby) {
  return lobby.status === 'completed' || lobby.status === 'closed';
}

function isActiveParticipant(participant: LobbyParticipant) {
  return isJoinedParticipant(participant);
}

function getRankLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any rank';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact rank';
  }

  return `${lobby.rankMin} to ${lobby.rankMax}`;
}

function getGenderLabel(lobby: Lobby) {
  if (lobby.genderRule === 'everyone') {
    return 'Everyone';
  }

  return lobby.genderRule === 'female' ? 'Women' : 'Men';
}

function getPlayerRating(player: Player) {
  if (player.id === 'p3') {
    return '4.0';
  }

  if (player.id === 'p4') {
    return '3.6';
  }

  if (player.id === 'p1') {
    return '3.6';
  }

  return '3.2';
}

function getPlayerContext(player: Player) {
  if (player.friendIds.includes(currentPlayer.id) || currentPlayer.friendIds.includes(player.id)) {
    return `${player.area} regular`;
  }

  return `${player.gamesPlayed} games - ${player.area}`;
}

function getPronoun(player: Player) {
  return player.gender === 'female' ? 'her' : 'him';
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 440,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 150,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  contextCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  contextCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  createCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
    ...shadows.soft,
  },
  createIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.soft,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    shadowOpacity: 0,
  },
  emptyButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.44)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    ...shadows.card,
  },
  gameOption: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.sm,
    ...shadows.soft,
  },
  gameOptionThumb: {
    borderRadius: 16,
    height: 68,
    overflow: 'hidden',
    width: 74,
  },
  gameThumb: {
    borderRadius: 16,
    height: 64,
    overflow: 'hidden',
    width: 68,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
    ...shadows.soft,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minWidth: 0,
  },
  lockedPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  lockedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minWidth: 0,
  },
  miniChip: {
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
  miniChipGold: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  optionCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  optionDisabled: {
    opacity: 0.54,
  },
  optionSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.42)',
  },
  optionStack: {
    gap: spacing.sm,
  },
  playerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  playerAvatarSmall: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  playerOption: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 80,
    padding: spacing.sm,
    ...shadows.soft,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 14,
    lineHeight: 18,
    padding: 0,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    gap: 2,
  },
  selectionMark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  selectionMarkDisabled: {
    backgroundColor: colors.surface,
  },
  selectionMarkSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stickyCta: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    bottom: 0,
    gap: spacing.sm,
    left: 0,
    paddingBottom: 24,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
    position: 'absolute',
    right: 0,
    ...shadows.nav,
  },
  successBanner: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  successText: {
    flex: 1,
  },
});
