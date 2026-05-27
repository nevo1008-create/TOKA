import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

import { Avatar } from '../components/Avatar';
import { players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { ChatChannelType, Lobby, LobbyParticipant, Player } from '../types';

type LobbyDetailsScreenProps = {
  lobby: Lobby;
  currentPlayer: Player;
  onBack: () => void;
};

type ChatTab = 'all' | 'joined';

type DetailTile = {
  label: string;
  value: string;
};

const heroImageUrl =
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80';

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
  const criteria = useMemo<DetailTile[]>(
    () => [
      { label: 'Location', value: lobby.location.name },
      { label: 'Time', value: lobby.startsAt },
      { label: 'Rank', value: getRankRuleLabel(lobby) },
      { label: 'Gender', value: getGenderRuleLabel(lobby) },
      { label: 'Players', value: `${activeCount} / ${lobby.maxPlayers}` },
      { label: 'Access', value: getAccessLabel(lobby) },
      { label: 'Equipment', value: getEquipmentLabel(lobby) },
      { label: 'Status', value: getStatusLabel(lobby) },
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
            {admin ? <Avatar player={admin} size={34} /> : null}
            <Text style={styles.adminText}>Admin: {admin?.name ?? 'Room creator'}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>{getStatusLabel(lobby)}</Text>
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

      <View style={styles.detailsGrid}>
        {criteria.map((item) => (
          <InfoTile key={item.label} tile={item} activeCount={activeCount} maxPlayers={lobby.maxPlayers} />
        ))}
      </View>

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
                  : 'Coordination will appear here once chat is connected.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function InfoTile({
  tile,
  activeCount,
  maxPlayers,
}: {
  tile: DetailTile;
  activeCount: number;
  maxPlayers: number;
}) {
  return (
    <View style={styles.infoTile}>
      <View style={styles.tileHeader}>
        <View style={styles.tileDot} />
        <Text style={styles.tileLabel}>{tile.label}</Text>
      </View>
      <Text style={styles.tileValue}>{tile.value}</Text>
      {tile.label === 'Players' ? (
        <View style={styles.playerDots}>
          {Array.from({ length: maxPlayers }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.playerDot,
                index < activeCount ? styles.playerDotFilled : styles.playerDotEmpty,
              ]}
            />
          ))}
        </View>
      ) : null}
      {tile.label === 'Rank' ? (
        <View style={styles.rankBars}>
          <View style={[styles.rankBar, styles.rankBarSoft]} />
          <View style={[styles.rankBar, styles.rankBarMid]} />
          <View style={[styles.rankBar, styles.rankBarHot]} />
          <View style={[styles.rankBar, styles.rankBarEmpty]} />
        </View>
      ) : null}
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
        {variant === 'active' ? <Text style={styles.addPlayerText}>Add player</Text> : null}
      </View>
      <View style={styles.playerList}>
        {participants.length > 0 ? (
          participants.map((participant) => (
            <ParticipantRow
              key={`${participant.playerId}-${participant.role}`}
              lobby={lobby}
              participant={participant}
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
}: {
  lobby: Lobby;
  participant: LobbyParticipant;
}) {
  const player = players.find((candidate) => candidate.id === participant.playerId);

  if (!player) {
    return null;
  }

  const isAdmin = player.id === lobby.adminId;

  return (
    <View style={styles.playerRow}>
      <Avatar player={player} size={50} />
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

function EquipmentBadge({ label, tone }: { label: string; tone: 'green' | 'blue' }) {
  return (
    <View style={[styles.equipmentBadge, tone === 'blue' && styles.equipmentBadgeBlue]}>
      <Text style={[styles.equipmentText, tone === 'blue' && styles.equipmentTextBlue]}>
        {label}
      </Text>
    </View>
  );
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: '#1B2430',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  heroPhoto: {
    borderRadius: 18,
    height: 142,
    overflow: 'hidden',
    width: 118,
  },
  heroImage: {
    borderRadius: 18,
  },
  heroContent: {
    flex: 1,
    gap: 7,
    justifyContent: 'center',
    minWidth: 0,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 28,
  },
  adminRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  adminText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DDF2D2',
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 8,
    width: 8,
  },
  statusBadgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  primaryActionJoined: {
    backgroundColor: colors.primaryDark,
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  shareAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  shareActionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoTile: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 100,
    padding: spacing.md,
    width: '48.7%',
  },
  tileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tileDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 7,
    opacity: 0.75,
    width: 7,
  },
  tileLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  tileValue: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  playerDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 'auto',
  },
  playerDot: {
    borderRadius: radius.round,
    height: 13,
    width: 13,
  },
  playerDotFilled: {
    backgroundColor: colors.ink,
  },
  playerDotEmpty: {
    backgroundColor: colors.border,
  },
  rankBars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 'auto',
  },
  rankBar: {
    borderRadius: radius.round,
    height: 8,
    width: 12,
  },
  rankBarSoft: {
    backgroundColor: '#CAEAB9',
  },
  rankBarMid: {
    backgroundColor: '#ADC953',
  },
  rankBarHot: {
    backgroundColor: colors.accent,
  },
  rankBarEmpty: {
    backgroundColor: colors.surfaceMuted,
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
    gap: spacing.sm,
  },
  sectionHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCount: {
    color: '#A4854E',
    fontSize: 16,
    fontWeight: '700',
  },
  addPlayerText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  playerList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  playerRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  adminBadge: {
    backgroundColor: '#ECD08C',
    borderRadius: radius.round,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  subBadge: {
    backgroundColor: '#DCECF4',
    borderRadius: radius.round,
    color: colors.ocean,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  playerMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  equipmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  equipmentBadge: {
    alignItems: 'center',
    backgroundColor: '#E6F4E8',
    borderRadius: radius.round,
    minWidth: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  equipmentBadgeBlue: {
    backgroundColor: '#E5F0FB',
  },
  equipmentText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  equipmentTextBlue: {
    color: colors.ocean,
  },
  rowMore: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptySectionText: {
    color: colors.muted,
    fontSize: 13,
    padding: spacing.lg,
  },
  chatPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  chatTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatTab: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  chatTabActive: {
    backgroundColor: colors.ink,
  },
  chatTabLocked: {
    opacity: 0.72,
  },
  chatTabText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  chatTabTextActive: {
    color: colors.surface,
  },
  chatEmptyState: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    minHeight: 126,
    padding: spacing.lg,
  },
  chatBubbleIcon: {
    alignItems: 'center',
    backgroundColor: '#EEEAE1',
    borderRadius: radius.round,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  chatBubbleRing: {
    borderColor: colors.ink,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 26,
    opacity: 0.82,
    width: 26,
  },
  chatCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  chatTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  chatText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.72,
  },
});
