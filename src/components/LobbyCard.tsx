import { Pressable, StyleSheet, Text, View } from 'react-native';

import { players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Lobby, LobbyParticipant } from '../types';
import { Avatar } from './Avatar';

type LobbyCardProps = {
  lobby: Lobby;
  featured?: boolean;
  onPress?: (lobby: Lobby) => void;
};

export function LobbyCard({ lobby, featured = false, onPress }: LobbyCardProps) {
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const waitlistCount = lobby.participants.filter((participant) => participant.role === 'waitlist').length;
  const pendingRequests = lobby.joinRequests.filter((request) => request.status === 'pending').length;
  const statusLabel = getStatusLabel(lobby);
  const cardContent = (
    <>
      <View style={styles.cardTopRow}>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
        <Text style={styles.cardTime}>{lobby.startsAt}</Text>
      </View>
      <Text style={styles.cardTitle}>{lobby.title}</Text>
      <Text style={styles.cardMeta}>
        {lobby.location.name} - {getRankRuleLabel(lobby)} - {getGenderRuleLabel(lobby)}
      </Text>
      <Text style={styles.cardNote}>{lobby.note}</Text>
      <View style={styles.metaGrid}>
        <Pill label={`${activeParticipants.length}/${lobby.maxPlayers} active`} />
        <Pill label={`${waitlistCount} queue`} />
        <Pill label={`${pendingRequests} requests`} />
      </View>
      <View style={styles.cardBottomRow}>
        <View style={styles.avatarStack}>
          {activeParticipants.slice(0, 4).map((participant) => {
            const player = players.find((candidate) => candidate.id === participant.playerId);

            return player ? <Avatar key={player.id} player={player} size={32} /> : null;
          })}
        </View>
        <View style={styles.channelBox}>
          <Text style={styles.channelText}>{lobby.chatChannels.length} channels</Text>
          <Text style={styles.channelLabel}>all + joined</Text>
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, featured && styles.featuredCard]}>{cardContent}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${lobby.title}`}
      onPress={() => onPress(lobby)}
      style={({ pressed }) => [
        styles.card,
        featured && styles.featuredCard,
        pressed && styles.pressedCard,
      ]}
    >
      {cardContent}
    </Pressable>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaPillText}>{label}</Text>
    </View>
  );
}

function isActiveParticipant(participant: LobbyParticipant) {
  return participant.role === 'admin' || participant.role === 'joined' || participant.role === 'substitute';
}

function getStatusLabel(lobby: Lobby) {
  if (lobby.status === 'full') {
    return 'Full';
  }

  if (lobby.visibility === 'approval_required') {
    return 'Approval';
  }

  if (lobby.visibility === 'password' || lobby.visibility === 'invite_link') {
    return 'Protected';
  }

  return 'Open';
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  featuredCard: {
    borderColor: colors.primary,
  },
  pressedCard: {
    opacity: 0.86,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  cardTime: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  cardMeta: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  cardNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  metaPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  cardBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row',
  },
  channelBox: {
    alignItems: 'flex-end',
  },
  channelText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  channelLabel: {
    color: colors.muted,
    fontSize: 12,
  },
});
