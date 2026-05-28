import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { currentPlayer, notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { GenderRule, Lobby, LobbyParticipant, LobbyVisibility, Player } from '../types';
import { getLobbyImageUrl } from './GamesScreen';

type LobbyDetailsScreenProps = {
  lobby: Lobby;
  lobbyIndex: number;
  onBack: () => void;
};

export function LobbyDetailsScreen({ lobby, lobbyIndex, onBack }: LobbyDetailsScreenProps) {
  const admin = players.find((player) => player.id === lobby.adminId);
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const waitlistedParticipants = lobby.participants.filter((participant) => participant.role === 'waitlist');
  const statusLabel = getStatusLabel(lobby);

  return (
    <View style={styles.screen}>
      <AppHeader notificationCount={notifications.length} onBack={onBack} player={currentPlayer} />

      <View style={styles.content}>
        <View style={styles.eventCard}>
          <View style={styles.eventTop}>
            <Image source={{ uri: getLobbyImageUrl(lobbyIndex) }} style={styles.heroImage} />
            <View style={styles.eventCopy}>
              <Text style={styles.lobbyTitle} numberOfLines={2}>
                {lobby.title}
              </Text>
              {admin ? (
                <View style={styles.adminRow}>
                  <Avatar player={admin} size={28} />
                  <Text style={styles.adminText}>
                    Admin: <Text style={styles.adminName}>{admin.name}</Text>
                  </Text>
                </View>
              ) : null}
              <View style={styles.statusRow}>
                <Pill label={statusLabel} tone="primary" />
                <Pill label={getGenderLabel(lobby.genderRule)} />
                <Pill label={getVisibilityLabel(lobby.visibility)} />
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.joinButton}>
              <Text style={styles.joinButtonText}>{getPrimaryAction(lobby)}</Text>
            </Pressable>
            <Pressable style={styles.shareButton}>
              <Text style={styles.shareButtonText}>S</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <DetailCell label="Location" value={lobby.location.name} />
          <DetailCell label="Time" value={lobby.startsAt} />
          <DetailCell label="Rank" value={getRankLabel(lobby)} />
          <DetailCell label="Players" value={`${activeParticipants.length} / ${lobby.maxPlayers}`} isLast />
        </View>

        <ParticipantsSection
          actionLabel="Add player"
          count={activeParticipants.length}
          participants={activeParticipants}
          title="Players in Lobby"
        />

        <ParticipantsSection
          count={waitlistedParticipants.length}
          participants={waitlistedParticipants}
          title="Waitlist"
        />

        <View style={styles.chatCard}>
          <View style={styles.chatTabs}>
            <Pressable style={[styles.chatTab, styles.chatTabActive]}>
              <Text style={[styles.chatTabText, styles.chatTabTextActive]}>All Lobby</Text>
            </Pressable>
            <Pressable style={styles.chatTab}>
              <Text style={styles.chatTabText}>Joined</Text>
            </Pressable>
          </View>
          <View style={styles.chatEmpty}>
            <View style={styles.chatIcon}>
              <Text style={styles.chatIconText}>C</Text>
            </View>
            <View style={styles.chatCopy}>
              <Text style={styles.chatTitle}>All lobby</Text>
              <Text style={styles.chatText}>
                No messages yet. Coordination will appear here once chat is connected.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function ParticipantsSection({
  actionLabel,
  count,
  participants,
  title,
}: {
  actionLabel?: string;
  count: number;
  participants: LobbyParticipant[];
  title: string;
}) {
  return (
    <View style={styles.participantsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {title} <Text style={styles.sectionCount}>({count})</Text>
        </Text>
        {actionLabel ? (
          <Pressable>
            <Text style={styles.sectionAction}>{actionLabel} +</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.participantList}>
        {participants.map((participant) => {
          const player = players.find((candidate) => candidate.id === participant.playerId);

          return player ? (
            <ParticipantRow key={`${participant.playerId}-${participant.role}`} participant={participant} player={player} />
          ) : null;
        })}
      </View>
    </View>
  );
}

function ParticipantRow({ participant, player }: { participant: LobbyParticipant; player: Player }) {
  return (
    <View style={styles.participantRow}>
      <View style={styles.playerInfo}>
        <View style={styles.avatarWrap}>
          <Avatar player={player} size={48} />
          {participant.role === 'admin' ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={styles.playerText}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>{player.name}</Text>
            {participant.role === 'admin' ? <Text style={styles.adminBadge}>Admin</Text> : null}
            {participant.role === 'substitute' ? <Text style={styles.adminBadge}>Sub</Text> : null}
          </View>
          <Text style={styles.playerRank}>Rank: {player.level}</Text>
        </View>
      </View>
      <View style={styles.equipmentRow}>
        {participant.bringsCourtMarks ? <EquipmentPill label="Marks" /> : null}
        {participant.bringsBall ? <EquipmentPill label="Ball" /> : null}
        <Text style={styles.moreText}>...</Text>
      </View>
    </View>
  );
}

function DetailCell({ isLast = false, label, value }: { isLast?: boolean; label: string; value: string }) {
  return (
    <View style={[styles.detailCell, isLast && styles.detailCellLast]}>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
  );
}

function Pill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'primary' }) {
  return (
    <View style={[styles.pill, tone === 'primary' && styles.primaryPill]}>
      {tone === 'primary' ? <View style={styles.pillDot} /> : null}
      <Text style={[styles.pillText, tone === 'primary' && styles.primaryPillText]}>{label}</Text>
    </View>
  );
}

function EquipmentPill({ label }: { label: string }) {
  return (
    <View style={styles.equipmentPill}>
      <Text style={styles.equipmentText}>{label}</Text>
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

function getPrimaryAction(lobby: Lobby) {
  if (lobby.status === 'full') {
    return lobby.waitlistEnabled ? 'Join Waitlist' : 'View Details';
  }

  if (lobby.visibility !== 'public') {
    return 'Request Access';
  }

  return 'Join Lobby';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.darkBackground,
    flex: 1,
    minHeight: '100%',
  },
  topBar: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    borderBottomColor: colors.darkBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  iconButtonText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  logoText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  topActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notificationCount: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    top: -1,
    width: 18,
    zIndex: 1,
  },
  notificationCountText: {
    color: colors.darkBackground,
    fontSize: 9,
    fontWeight: '900',
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
  },
  eventCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  eventTop: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  heroImage: {
    borderRadius: radius.md,
    height: 128,
    width: 128,
  },
  eventCopy: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  lobbyTitle: {
    color: colors.darkText,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29,
  },
  adminRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  adminText: {
    color: colors.darkMuted,
    fontSize: 12,
  },
  adminName: {
    color: colors.neon,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  primaryPill: {
    backgroundColor: colors.darkBackground,
    borderColor: colors.neon,
  },
  pillDot: {
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 6,
    width: 6,
  },
  pillText: {
    color: colors.darkMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  primaryPillText: {
    color: colors.neon,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  joinButtonText: {
    color: colors.darkBackground,
    fontSize: 15,
    fontWeight: '900',
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    width: 56,
  },
  shareButtonText: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '900',
  },
  detailsRow: {
    borderBottomColor: colors.darkBorder,
    borderBottomWidth: 1,
    borderTopColor: colors.darkBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
  },
  detailCell: {
    borderRightColor: colors.darkBorder,
    borderRightWidth: 1,
    flex: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  detailCellLast: {
    borderRightWidth: 0,
  },
  detailValue: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  detailLabel: {
    color: colors.darkMuted,
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  participantsSection: {
    gap: spacing.lg,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionCount: {
    color: colors.neon,
  },
  sectionAction: {
    color: colors.neon,
    fontSize: 12,
    fontWeight: '900',
  },
  participantList: {
    gap: spacing.lg,
  },
  participantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  playerInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 0,
    height: 14,
    position: 'absolute',
    right: 0,
    width: 14,
  },
  playerText: {
    flex: 1,
    minWidth: 0,
  },
  playerNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  playerName: {
    color: colors.darkText,
    fontSize: 15,
    fontWeight: '900',
  },
  adminBadge: {
    borderColor: colors.neon,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.neon,
    fontSize: 8,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    textTransform: 'uppercase',
  },
  playerRank: {
    color: colors.darkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  equipmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  equipmentPill: {
    backgroundColor: colors.darkBackground,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  equipmentText: {
    color: colors.neon,
    fontSize: 10,
    fontWeight: '900',
  },
  moreText: {
    color: colors.darkMuted,
    fontSize: 16,
    fontWeight: '900',
    paddingHorizontal: spacing.xs,
  },
  chatCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chatTabs: {
    borderBottomColor: colors.darkBorder,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  chatTab: {
    alignItems: 'center',
    borderBottomColor: colors.transparent,
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: spacing.lg,
  },
  chatTabActive: {
    borderBottomColor: colors.neon,
  },
  chatTabText: {
    color: colors.darkMuted,
    fontSize: 14,
    fontWeight: '900',
  },
  chatTabTextActive: {
    color: colors.neon,
  },
  chatEmpty: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  chatIcon: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  chatIconText: {
    color: colors.darkMuted,
    fontSize: 16,
    fontWeight: '900',
  },
  chatCopy: {
    flex: 1,
  },
  chatTitle: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '900',
  },
  chatText: {
    color: colors.darkMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.xs,
  },
});
