import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

export function LobbyDetailsScreen({ lobby, currentPlayer, onBack }: LobbyDetailsScreenProps) {
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
  const criteria = useMemo(
    () => [
      { label: 'Location', value: lobby.location.name },
      { label: 'Time', value: lobby.startsAt },
      { label: 'Rank', value: getRankRuleLabel(lobby) },
      { label: 'Gender', value: getGenderRuleLabel(lobby) },
      { label: 'Players', value: `${activeCount}/${lobby.maxPlayers}` },
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
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to lobbies"
          onPress={onBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.iconButtonText}>{'<'}</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>{lobby.title}</Text>
          <Text style={styles.adminLine}>
            Admin: {admin?.name ?? 'Room creator'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share lobby"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.iconButtonText}>...</Text>
        </Pressable>
      </View>

      <View style={styles.criteriaGrid}>
        {criteria.map((item) => (
          <View key={item.label} style={styles.criteriaCard}>
            <Text style={styles.criteriaLabel}>{item.label}</Text>
            <Text style={styles.criteriaValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      {lobby.locationDescription ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteLabel}>Meeting note</Text>
          <Text style={styles.noteText}>{lobby.locationDescription}</Text>
        </View>
      ) : null}

      <ParticipantSection
        title="Players in Lobby"
        lobby={lobby}
        participants={activeParticipants}
      />
      <ParticipantSection title="Queue" lobby={lobby} participants={queuedParticipants} />

      <View style={styles.chatPanel}>
        <View style={styles.chatTabs}>
          <ChatTabButton
            label="All lobby"
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
          <Text style={styles.chatTitle}>
            {isJoinedTabLocked || isAllTabLocked
              ? 'Chat locked'
              : selectedChannel?.title ?? 'Lobby chat'}
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
  );
}

function ParticipantSection({
  title,
  lobby,
  participants,
}: {
  title: string;
  lobby: Lobby;
  participants: LobbyParticipant[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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
      <Avatar player={player} size={48} />
      <View style={styles.playerCopy}>
        <View style={styles.playerNameRow}>
          <Text style={styles.playerName}>{player.name}</Text>
          {isAdmin ? <Text style={styles.roleBadge}>Admin</Text> : null}
          {participant.role === 'substitute' ? (
            <Text style={styles.roleBadge}>Sub</Text>
          ) : null}
        </View>
        <Text style={styles.playerMeta}>Rank: {player.level}</Text>
      </View>
      <View style={styles.equipmentRow}>
        <EquipmentBadge active={participant.bringsCourtMarks} label="Marks" />
        <EquipmentBadge active={participant.bringsBall} label="Ball" />
      </View>
    </View>
  );
}

function EquipmentBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <View style={[styles.equipmentBadge, !active && styles.equipmentBadgeMuted]}>
      <Text style={[styles.equipmentText, !active && styles.equipmentTextMuted]}>
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
    gap: spacing.lg,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  adminLine: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  criteriaCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 96,
    padding: spacing.lg,
    width: '47.8%',
  },
  criteriaLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  criteriaValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },
  noteBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  noteLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  noteText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  playerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 56,
  },
  playerCopy: {
    flex: 1,
    gap: spacing.xs,
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
    fontWeight: '900',
  },
  roleBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  playerMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  equipmentRow: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  equipmentBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    minWidth: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  equipmentBadgeMuted: {
    opacity: 0.38,
  },
  equipmentText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
  },
  equipmentTextMuted: {
    color: colors.muted,
  },
  emptySectionText: {
    color: colors.muted,
    fontSize: 13,
  },
  chatPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  chatTabs: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  chatTab: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  chatTabActive: {
    backgroundColor: colors.ink,
  },
  chatTabText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  chatTabTextActive: {
    color: colors.surface,
  },
  chatEmptyState: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 132,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  chatTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  chatText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.76,
  },
});
