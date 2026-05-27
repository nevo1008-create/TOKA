import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { ChatChannelType, Lobby, LobbyParticipant, Player } from '../types';

type LobbyDetailsScreenProps = {
  lobby: Lobby;
  currentPlayer: Player;
  onBack: () => void;
};

type ChatTab = 'all' | 'joined';

const heroImageUrl =
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80';

export function LobbyDetailsScreen({ lobby, currentPlayer }: LobbyDetailsScreenProps) {
  const [selectedChatTab, setSelectedChatTab] = useState<ChatTab>('all');
  const currentParticipant = lobby.participants.find(
    (participant) =>
      participant.playerId === currentPlayer.id &&
      participant.status === 'approved',
  );
  const canViewAllChat = Boolean(currentParticipant);
  const canViewJoinedChat = Boolean(
    currentParticipant && currentParticipant.role !== 'waitlist',
  );
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const queuedParticipants = lobby.participants.filter(
    (participant) => participant.role === 'waitlist' && participant.status === 'approved',
  );
  const activeCount = activeParticipants.length;
  const admin = players.find((player) => player.id === lobby.adminId);
  const isJoined = Boolean(currentParticipant && currentParticipant.role !== 'waitlist');
  const primaryFacts = useMemo(
    () => [
      { label: 'Time', value: lobby.startsAt },
      { label: 'Rank', value: getRankRuleLabel(lobby) },
      { label: 'Players', value: `${activeCount}/${lobby.maxPlayers}` },
      { label: 'Equipment', value: getEquipmentLabel(lobby) },
    ],
    [activeCount, lobby],
  );

  const selectedChannelType: ChatChannelType =
    selectedChatTab === 'all' ? 'all' : 'admin_joined';
  const selectedChannel = lobby.chatChannels.find(
    (channel) => channel.type === selectedChannelType,
  );
  const isJoinedTabLocked = selectedChatTab === 'joined' && !canViewJoinedChat;
  const isAllTabLocked = selectedChatTab === 'all' && !canViewAllChat;

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <ImageBackground
          imageStyle={styles.heroImage}
          source={{ uri: heroImageUrl }}
          style={styles.heroPhoto}
        />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{lobby.title}</Text>
          <View style={styles.adminRow}>
            {admin ? <PlayerAvatar player={admin} isAdmin={false} size={34} /> : null}
            <Text style={styles.adminText}>Admin: {admin?.name ?? 'Room creator'}</Text>
          </View>
          <View style={styles.heroMetaChips}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>{getStatusLabel(lobby)}</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>{getGenderRuleLabel(lobby)}</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>{getAccessLabel(lobby)}</Text>
            </View>
          </View>
          <View style={styles.heroActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isJoined ? 'Joined lobby' : 'Join lobby'}
              style={({ pressed }) => [
                styles.primaryAction,
                isJoined && styles.primaryActionJoined,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryActionText}>
                {isJoined ? 'Joined' : 'Join Lobby'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share lobby"
              style={({ pressed }) => [styles.shareAction, pressed && styles.pressed]}
            >
              <Text style={styles.shareActionText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <GameFactsPanel
        activeCount={activeCount}
        locationName={lobby.location.name}
        maxPlayers={lobby.maxPlayers}
        primaryFacts={primaryFacts}
      />

      {lobby.locationDescription ? (
        <View style={styles.meetingNote}>
          <View style={styles.noteIcon}>
            <View style={styles.noteIconMark} />
          </View>
          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>MEETING NOTE</Text>
            <Text style={styles.noteText}>{lobby.locationDescription}</Text>
          </View>
        </View>
      ) : null}

      <ParticipantSection
        title="Players in Lobby"
        lobby={lobby}
        participants={activeParticipants}
        variant="active"
      />
      <ParticipantSection
        title="Queue"
        lobby={lobby}
        participants={queuedParticipants}
        variant="queue"
      />

      <View style={styles.chatPanel}>
        <View style={styles.chatTabs}>
          <ChatTabButton
            label="All Lobby"
            active={selectedChatTab === 'all'}
            locked={!canViewAllChat}
            onPress={() => setSelectedChatTab('all')}
          />
          <ChatTabButton
            label="Joined"
            active={selectedChatTab === 'joined'}
            locked={!canViewJoinedChat}
            onPress={() => setSelectedChatTab('joined')}
          />
        </View>
        <View style={styles.chatEmptyState}>
          <View style={styles.chatBubbleIcon}>
            <View style={styles.chatBubbleRing} />
          </View>
          <View style={styles.chatCopy}>
            <Text style={styles.chatTitle}>
              {isJoinedTabLocked || isAllTabLocked
                ? 'Chat locked'
                : selectedChannel?.title ?? 'No messages yet.'}
            </Text>
            <Text style={styles.chatText}>
              {isJoinedTabLocked
                ? 'Only the admin, joined players, and substitutes can view this channel.'
                : isAllTabLocked
                  ? 'Approved lobby players can view this channel.'
                  : 'No messages yet. Coordination will appear here once chat is connected.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function GameFactsPanel({
  activeCount,
  locationName,
  maxPlayers,
  primaryFacts,
}: {
  activeCount: number;
  locationName: string;
  maxPlayers: number;
  primaryFacts: Array<{ label: string; value: string }>;
}) {
  return (
    <View style={styles.factsPanel}>
      <View style={styles.locationRow}>
        <View style={styles.locationCopy}>
          <Text style={styles.factLabel}>Location</Text>
          <Text style={styles.locationValue} numberOfLines={1}>
            {locationName}
          </Text>
        </View>
      </View>
      <View style={styles.primaryFactsRow}>
        {primaryFacts.map((fact, index) => (
          <View key={fact.label} style={styles.primaryFact}>
            <Text style={styles.factLabel}>{fact.label}</Text>
            <Text style={styles.factValue} numberOfLines={1}>
              {fact.value}
            </Text>
            {fact.label === 'Players' ? (
              <View style={styles.playerDots}>
                {Array.from({ length: maxPlayers }).map((_, dotIndex) => (
                  <View
                    key={dotIndex}
                    style={[
                      styles.playerDot,
                      dotIndex < activeCount ? styles.playerDotFilled : styles.playerDotEmpty,
                    ]}
                  />
                ))}
              </View>
            ) : null}
            {index > 0 ? <View style={styles.factDivider} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function ParticipantSection({
  title,
  lobby,
  participants,
  variant,
}: {
  title: string;
  lobby: Lobby;
  participants: LobbyParticipant[];
  variant: 'active' | 'queue';
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>
          {title} <Text style={styles.sectionCount}>({participants.length})</Text>
        </Text>
        {variant === 'active' ? (
          <View style={styles.addPlayerAction}>
            <Text style={styles.addPlayerText}>Add player</Text>
            <Text style={styles.addPlayerIcon}>+</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.playerList, variant === 'queue' && styles.queueList]}>
        {participants.length > 0 ? (
          participants.map((participant) => (
            <ParticipantRow
              key={`${participant.playerId}-${participant.role}`}
              lobby={lobby}
              participant={participant}
              variant={variant}
            />
          ))
        ) : (
          <Text style={styles.emptySectionText}>No players here yet.</Text>
        )}
      </View>
    </View>
  );
}

function ParticipantRow({
  lobby,
  participant,
  variant,
}: {
  lobby: Lobby;
  participant: LobbyParticipant;
  variant: 'active' | 'queue';
}) {
  const player = players.find((candidate) => candidate.id === participant.playerId);

  if (!player) {
    return null;
  }

  const isAdmin = player.id === lobby.adminId;

  return (
    <View style={[styles.playerRow, variant === 'queue' && styles.queueRow]}>
      <PlayerAvatar player={player} isAdmin={isAdmin} size={52} />
      <View style={styles.playerCopy}>
        <View style={styles.playerNameRow}>
          <Text style={styles.playerName}>{player.name}</Text>
          {isAdmin ? <Text style={styles.adminBadge}>Admin</Text> : null}
          {participant.role === 'substitute' ? <Text style={styles.subBadge}>Sub</Text> : null}
        </View>
        <Text style={styles.playerMeta}>Rank: {player.level}</Text>
      </View>
      <View style={styles.equipmentRow}>
        {participant.bringsCourtMarks ? <EquipmentBadge label="Marks" tone="green" /> : null}
        {participant.bringsBall ? <EquipmentBadge label="Ball" tone="blue" /> : null}
      </View>
      <Text style={styles.rowMore}>•••</Text>
    </View>
  );
}

function PlayerAvatar({
  player,
  isAdmin,
  size,
}: {
  player: Player;
  isAdmin: boolean;
  size: number;
}) {
  return (
    <View
      style={[
        styles.playerAvatar,
        getAvatarStyle(player.id),
        { borderRadius: size / 2, height: size, width: size },
      ]}
    >
      <Text style={[styles.playerAvatarText, { fontSize: size * 0.34 }]}>
        {player.initials}
      </Text>
      {isAdmin ? <View style={styles.onlineDot} /> : null}
    </View>
  );
}

function EquipmentBadge({ label, tone }: { label: string; tone: 'green' | 'blue' }) {
  return (
    <View style={[styles.equipmentBadge, tone === 'blue' && styles.equipmentBadgeBlue]}>
      <Text style={[styles.equipmentText, tone === 'blue' && styles.equipmentTextBlue]}>
        {label}
      </Text>
    </View>
  );
}

function getAvatarStyle(playerId: string) {
  if (playerId === 'p2') {
    return styles.avatarGreen;
  }

  if (playerId === 'p4') {
    return styles.avatarCoral;
  }

  if (playerId === 'p5') {
    return styles.avatarLavender;
  }

  return styles.avatarGold;
}

function ChatTabButton({
  label,
  active,
  locked,
  onPress,
}: {
  label: string;
  active: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active, disabled: locked }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chatTab,
        active && styles.chatTabActive,
        locked && styles.chatTabLocked,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chatTabText, active && styles.chatTabTextActive]}>
        {locked ? 'Locked ' : ''}
        {label}
      </Text>
    </Pressable>
  );
}

function isActiveParticipant(participant: LobbyParticipant) {
  return (
    participant.status === 'approved' &&
    (participant.role === 'admin' ||
      participant.role === 'joined' ||
      participant.role === 'substitute')
  );
}

function getRankRuleLabel(lobby: Lobby) {
  if (lobby.rankRuleType === 'any') {
    return 'Any level';
  }

  if (lobby.rankRuleType === 'exact') {
    return lobby.rankExact ?? 'Exact level';
  }

  return `${lobby.rankMin} to ${lobby.rankMax}`;
}

function getGenderRuleLabel(lobby: Lobby) {
  if (lobby.genderRule === 'everyone') {
    return 'Everyone';
  }

  return lobby.genderRule === 'male' ? 'Men' : 'Women';
}

function getAccessLabel(lobby: Lobby) {
  if (lobby.visibility === 'approval_required') {
    return 'Approval';
  }

  if (lobby.visibility === 'password') {
    return 'Password';
  }

  if (lobby.visibility === 'invite_link') {
    return 'Invite link';
  }

  return 'Public';
}

function getEquipmentLabel(lobby: Lobby) {
  if (lobby.ballNeeded && lobby.courtMarksNeeded) {
    return 'Ball + marks';
  }

  if (lobby.ballNeeded) {
    return 'Ball';
  }

  if (lobby.courtMarksNeeded) {
    return 'Court marks';
  }

  return 'Covered';
}

function getStatusLabel(lobby: Lobby) {
  if (lobby.status === 'in_progress') {
    return 'In progress';
  }

  if (lobby.status === 'rating_open') {
    return 'Rating open';
  }

  return lobby.status.charAt(0).toUpperCase() + lobby.status.slice(1);
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: '#0E1829',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    minHeight: 188,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  heroPhoto: {
    borderRadius: 21,
    height: 164,
    overflow: 'hidden',
    width: 128,
  },
  heroImage: {
    borderRadius: 21,
  },
  heroContent: {
    flex: 1,
    gap: 11,
    justifyContent: 'center',
    minWidth: 0,
  },
  heroTitle: {
    color: '#F5F7FA',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  adminRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adminText: {
    color: '#F5F7FA',
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(125,255,107,0.12)',
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 31,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 8,
    width: 8,
  },
  statusBadgeText: {
    color: '#7DFF6B',
    fontSize: 13,
    fontWeight: '600',
  },
  heroMetaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  heroChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.round,
    minHeight: 31,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  heroChipText: {
    color: '#F5F7FA',
    fontSize: 13,
    fontWeight: '500',
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 3,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: '#7DFF6B',
    borderRadius: 16,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  primaryActionJoined: {
    backgroundColor: '#55D85A',
  },
  primaryActionText: {
    color: '#07101D',
    fontSize: 16,
    fontWeight: '700',
  },
  shareAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.md,
    width: 96,
  },
  shareActionText: {
    color: '#F5F7FA',
    fontSize: 15,
    fontWeight: '600',
  },
  factsPanel: {
    backgroundColor: '#0E1829',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 13,
    marginTop: 2,
    padding: 15,
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
  },
  locationRow: {
    borderBottomColor: 'rgba(255,255,255,0.07)',
    borderBottomWidth: 1,
    paddingBottom: 13,
  },
  locationCopy: {
    gap: spacing.xs,
  },
  locationValue: {
    color: '#F5F7FA',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
  },
  primaryFactsRow: {
    flexDirection: 'row',
  },
  primaryFact: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 45,
    paddingLeft: 11,
    paddingRight: 7,
  },
  factLabel: {
    color: '#A7B0C0',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  factValue: {
    color: '#F5F7FA',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  factDivider: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  playerDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerDot: {
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  playerDotFilled: {
    backgroundColor: '#F5F7FA',
  },
  playerDotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  meetingNote: {
    alignItems: 'center',
    backgroundColor: '#FFF4D8',
    borderColor: '#EBCB83',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  noteIcon: {
    alignItems: 'center',
    backgroundColor: '#F3DFA8',
    borderRadius: radius.round,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  noteIconMark: {
    backgroundColor: '#9B6F20',
    borderRadius: radius.round,
    height: 14,
    opacity: 0.75,
    width: 14,
  },
  noteCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  noteTitle: {
    color: '#6D5120',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
  },
  noteText: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sectionHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#F5F7FA',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  sectionCount: {
    color: '#FFC857',
    fontSize: 20,
    fontWeight: '700',
  },
  addPlayerAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  addPlayerText: {
    color: '#7DFF6B',
    fontSize: 14,
    fontWeight: '600',
  },
  addPlayerIcon: {
    color: '#7DFF6B',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  playerList: {
    backgroundColor: '#0E1829',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  queueList: {
    opacity: 0.86,
  },
  playerRow: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 86,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  queueRow: {
    minHeight: 84,
  },
  playerCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  playerNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  playerName: {
    color: '#F5F7FA',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },
  adminBadge: {
    backgroundColor: 'rgba(255,200,87,0.18)',
    borderRadius: radius.round,
    color: '#FFC857',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subBadge: {
    backgroundColor: 'rgba(79,209,255,0.10)',
    borderRadius: radius.round,
    color: '#4FD1FF',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  playerMeta: {
    color: '#A7B0C0',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  equipmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  equipmentBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(125,255,107,0.10)',
    borderRadius: radius.round,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  equipmentBadgeBlue: {
    backgroundColor: 'rgba(79,209,255,0.10)',
  },
  equipmentText: {
    color: '#7DFF6B',
    fontSize: 13,
    fontWeight: '600',
  },
  equipmentTextBlue: {
    color: '#4FD1FF',
  },
  rowMore: {
    color: '#A7B0C0',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  emptySectionText: {
    color: '#A7B0C0',
    fontSize: 13,
    padding: spacing.lg,
  },
  playerAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playerAvatarText: {
    color: '#07101D',
    fontWeight: '700',
  },
  avatarGold: {
    backgroundColor: '#F1D58B',
  },
  avatarGreen: {
    backgroundColor: '#A9E7C1',
  },
  avatarCoral: {
    backgroundColor: '#FFA89A',
  },
  avatarLavender: {
    backgroundColor: '#B9B6FF',
  },
  onlineDot: {
    backgroundColor: '#7DFF6B',
    borderColor: '#0E1829',
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 0,
    height: 14,
    position: 'absolute',
    right: 0,
    width: 14,
  },
  chatPanel: {
    backgroundColor: '#0E1829',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  chatTabs: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    flexDirection: 'row',
    height: 48,
    padding: spacing.xs,
  },
  chatTab: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  chatTabActive: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  chatTabLocked: {
    opacity: 0.72,
  },
  chatTabText: {
    color: '#A7B0C0',
    fontSize: 15,
    fontWeight: '600',
  },
  chatTabTextActive: {
    color: '#F5F7FA',
  },
  chatEmptyState: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 112,
    padding: 18,
  },
  chatBubbleIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: radius.round,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  chatBubbleRing: {
    borderColor: '#F5F7FA',
    borderRadius: radius.round,
    borderWidth: 2,
    height: 24,
    opacity: 0.8,
    width: 24,
  },
  chatCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  chatTitle: {
    color: '#F5F7FA',
    fontSize: 18,
    fontWeight: '700',
  },
  chatText: {
    color: '#A7B0C0',
    fontSize: 14,
    lineHeight: 21,
  },
  pressed: {
    opacity: 0.72,
  },
});
