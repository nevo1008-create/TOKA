import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { HomeHeader } from '../components/home/HomeHeader';
import { currentPlayer, notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { GenderRule, Lobby, LobbyParticipant, LobbyVisibility, Player } from '../types';

type LobbyDetailsScreenProps = {
  lobby: Lobby;
  lobbyIndex: number;
  onBack: () => void;
};

export function LobbyDetailsScreen({ lobby, lobbyIndex, onBack }: LobbyDetailsScreenProps) {
  const admin = players.find((player) => player.id === lobby.adminId);
  const activeParticipants = lobby.participants.filter(isActiveParticipant);
  const waitlistedParticipants = lobby.participants.filter((participant) => participant.role === 'waitlist');
  const currentParticipant = lobby.participants.find((participant) => participant.playerId === currentPlayer.id);
  const playerCount = `${activeParticipants.length} / ${lobby.maxPlayers}`;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(76, 255, 90, 0.09)', colors.darkBackground, colors.darkBackground]}
        locations={[0, 0.34, 1]}
        style={styles.backgroundGlow}
      />
      <HomeHeader notificationCount={notifications.length} onBack={onBack} player={currentPlayer} />

      <View style={styles.content}>
        <RoomHeroCard
          admin={admin}
          currentParticipant={currentParticipant}
          lobby={lobby}
          lobbyIndex={lobbyIndex}
          playerCount={playerCount}
        />

        <View style={styles.infoStrip}>
          <InfoCell icon="calendar-outline" label="Starts" value={formatStartTime(lobby.startsAt)} />
          <InfoCell icon="cellular" iconColor={colors.accentLime} label="Level" value={getRankLabel(lobby)} />
          <InfoCell icon="people-outline" label="Players" value={playerCount} />
          <InfoCell icon="people-circle-outline" iconColor={colors.accentSea} label="Gender" value={getGenderLabel(lobby.genderRule)} />
        </View>

        <LobbyChatCard lobby={lobby} />

        <ParticipantsSection
          actionLabel="Invite"
          count={activeParticipants.length}
          participants={activeParticipants}
          title="Players"
        />

        {waitlistedParticipants.length > 0 ? (
          <ParticipantsSection
            count={waitlistedParticipants.length}
            participants={waitlistedParticipants}
            title="Waitlist"
          />
        ) : null}

      </View>
    </View>
  );
}

function RoomHeroCard({
  admin,
  currentParticipant,
  lobby,
  lobbyIndex,
  playerCount,
}: {
  admin?: Player;
  currentParticipant?: LobbyParticipant;
  lobby: Lobby;
  lobbyIndex: number;
  playerCount: string;
}) {
  const isJoined = currentParticipant && isActiveParticipant(currentParticipant);
  const primaryLabel = isJoined ? 'Joined' : getPrimaryAction(lobby);

  return (
    <View style={styles.heroCard}>
      <BeachVisual seed={lobbyIndex} />
      <LinearGradient
        colors={[colors.darkBackgroundRaised, 'rgba(6, 20, 10, 0.94)', 'rgba(6, 20, 10, 0.18)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.heroOverlay}
      />

      <View style={styles.heroContent}>
        <View style={styles.heroPills}>
          <StatusPill label={getStatusLabel(lobby)} tone="lime" />
          <StatusPill icon="time-outline" label={lobby.startsAt} tone="gold" />
        </View>

        <View style={styles.titleBlock}>
          <AppText numberOfLines={2} style={styles.lobbyTitle} variant="display" weight="800">
            {lobby.title}
          </AppText>
          <View style={styles.locationRow}>
            <Ionicons color={colors.accentSea} name="location" size={18} />
            <AppText numberOfLines={1} tone="muted" variant="titleSmall" weight="600">
              {lobby.location.name}, {lobby.location.city}
            </AppText>
          </View>
        </View>

        {admin ? (
          <View style={styles.adminRow}>
            <Avatar player={admin} size={32} />
            <View style={styles.adminCopy}>
              <AppText tone="subtle" variant="caption" weight="600">
                Hosted by
              </AppText>
              <AppText numberOfLines={1} variant="bodySmall" weight="800">
                {admin.name}
              </AppText>
            </View>
          </View>
        ) : null}

        {lobby.note ? (
          <AppText numberOfLines={2} style={styles.noteText} tone="muted" variant="bodySmall" weight="500">
            {lobby.note}
          </AppText>
        ) : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" style={[styles.primaryButton, isJoined && styles.joinedButton]}>
            <AppText align="center" tone={isJoined ? 'muted' : 'inverse'} variant="body" weight="800">
              {primaryLabel}
            </AppText>
            <Ionicons color={isJoined ? colors.darkMuted : colors.ink} name={isJoined ? 'checkmark' : 'chevron-forward'} size={17} />
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondaryButton}>
            <Ionicons color={colors.accentLime} name="share-social-outline" size={18} />
          </Pressable>
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <AppText style={styles.sectionTitle} variant="heading" weight="800">
            {title}
          </AppText>
          <AppText tone="subtle" variant="label" weight="600">
            {count}
          </AppText>
        </View>
        {actionLabel ? (
          <Pressable accessibilityRole="button" style={styles.sectionAction}>
            <Ionicons color={colors.accentLime} name="person-add-outline" size={15} />
            <AppText tone="accent" variant="label" weight="800">
              {actionLabel}
            </AppText>
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
          <Avatar player={player} size={42} />
          {participant.role === 'admin' ? <View style={styles.onlineDot} /> : null}
        </View>
        <View style={styles.playerText}>
          <View style={styles.playerNameRow}>
            <AppText numberOfLines={1} style={styles.playerName} variant="body" weight="800">
              {player.name}
            </AppText>
            <RolePill role={participant.role} />
          </View>
          <AppText tone="subtle" variant="caption" weight="600">
            {player.level} level - {player.area}
          </AppText>
        </View>
      </View>

      <View style={styles.equipmentRow}>
        <EquipmentIcon active={participant.bringsBall} icon="football-outline" />
        <EquipmentIcon active={participant.bringsCourtMarks} icon="flag-outline" />
        <Ionicons color={colors.darkMuted} name="ellipsis-horizontal" size={17} />
      </View>
    </View>
  );
}

function LobbyChatCard({ lobby }: { lobby: Lobby }) {
  const unreadCount = lobby.chatChannels.reduce((total, channel) => total + channel.unreadCount, 0);

  return (
    <View style={styles.chatCard}>
      <View style={styles.chatHeader}>
        <View style={styles.chatTitleRow}>
          <View style={styles.chatIcon}>
            <Ionicons color={colors.accentSea} name="chatbubbles-outline" size={18} />
          </View>
          <View style={styles.chatCopy}>
            <AppText style={styles.chatTitle} variant="titleSmall" weight="800">
              Room chat
            </AppText>
            <AppText tone="subtle" variant="label" weight="600">
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'Coordination and updates'}
            </AppText>
          </View>
        </View>
        <Pressable accessibilityRole="button" style={styles.openChatButton}>
          <AppText tone="accent" variant="label" weight="800">
            Open chat
          </AppText>
          <Ionicons color={colors.accentLime} name="chevron-forward" size={14} />
        </Pressable>
      </View>

      <View style={styles.channelStack}>
        {lobby.chatChannels.map((channel) => (
          <View key={channel.id} style={styles.channelRow}>
            <View style={styles.channelCopy}>
              <AppText variant="bodySmall" weight="800">
                {channel.title}
              </AppText>
              <AppText tone="subtle" variant="caption" weight="600">
                {channel.type === 'all' ? 'Everyone in the room' : 'Admin and active players'}
              </AppText>
            </View>
            {channel.unreadCount > 0 ? (
              <View style={styles.unreadPill}>
                <AppText align="center" tone="inverse" variant="caption" weight="800">
                  {channel.unreadCount}
                </AppText>
              </View>
            ) : (
              <Ionicons color={colors.darkMuted} name="chevron-forward" size={16} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function InfoCell({
  icon,
  iconColor = colors.darkMuted,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCell}>
      <View style={styles.infoValueRow}>
        <Ionicons color={iconColor} name={icon} size={17} />
        <AppText numberOfLines={1} style={styles.infoValue} variant="bodySmall" weight="800">
          {value}
        </AppText>
      </View>
      <AppText style={styles.infoLabel} tone="muted" variant="caption" weight="600">
        {label}
      </AppText>
    </View>
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
          color={isGold ? colors.accent : isLime ? colors.accentLime : colors.darkMuted}
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
      <Ionicons color={active ? colors.accentLime : colors.darkSubtle} name={icon} size={14} />
    </View>
  );
}

function BeachVisual({ seed }: { seed: number }) {
  const gradient = seed % 2 === 0
    ? ['#173E24', '#27644A', '#D99A00']
    : ['#0B2730', '#218678', '#FFD78E'];

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

function formatStartTime(startsAt: string) {
  const parts = startsAt.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : startsAt;
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

function getPrimaryAction(lobby: Lobby) {
  if (lobby.status === 'full') {
    return lobby.waitlistEnabled ? 'Join waitlist' : 'View details';
  }

  if (lobby.visibility !== 'public') {
    return 'Request access';
  }

  return 'Join game';
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
    height: 360,
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
  channelCopy: {
    flex: 1,
    minWidth: 0,
  },
  channelRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  channelStack: {
    gap: spacing.sm,
  },
  chatCard: {
    backgroundColor: 'rgba(11, 29, 16, 0.62)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  chatHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  chatCopy: {
    flex: 1,
    minWidth: 0,
  },
  chatIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(39, 210, 196, 0.08)',
    borderColor: 'rgba(39, 210, 196, 0.26)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  chatTitle: {
    color: '#ECEDE6',
  },
  chatTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  equipmentIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.05)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  equipmentIconActive: {
    backgroundColor: 'rgba(76, 255, 90, 0.10)',
    borderColor: colors.neonMuted,
  },
  equipmentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: spacing.xs,
  },
  goldPill: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  heroCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: 26,
    borderWidth: 1,
    minHeight: 266,
    overflow: 'hidden',
    position: 'relative',
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
  infoCell: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  infoLabel: {
    color: 'rgba(215, 217, 208, 0.78)',
    fontSize: 9,
    lineHeight: 12,
  },
  infoStrip: {
    backgroundColor: 'rgba(11, 29, 16, 0.52)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
  },
  infoValue: {
    color: 'rgba(243, 244, 238, 0.9)',
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  infoValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  limePill: {
    backgroundColor: 'rgba(76, 255, 90, 0.10)',
    borderColor: colors.neonMuted,
  },
  lobbyTitle: {
    fontSize: 26,
    lineHeight: 31,
    maxWidth: 278,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: 300,
  },
  netLine: {
    backgroundColor: 'rgba(246, 247, 237, 0.26)',
    bottom: 98,
    height: 2,
    left: 14,
    position: 'absolute',
    right: 8,
    transform: [{ rotate: '-7deg' }],
  },
  noteText: {
    color: 'rgba(215, 217, 208, 0.82)',
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 286,
  },
  onlineDot: {
    backgroundColor: colors.accentLime,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 0,
    height: 13,
    position: 'absolute',
    right: 0,
    width: 13,
  },
  openChatButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  palmLine: {
    backgroundColor: 'rgba(3, 16, 8, 0.64)',
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
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pill: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
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
    color: '#ECEDE6',
    flexShrink: 1,
  },
  playerNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerText: {
    flex: 1,
    minWidth: 0,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accentLime,
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
  },
  joinedButton: {
    backgroundColor: 'rgba(246, 247, 237, 0.08)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
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
    backgroundColor: 'rgba(76, 255, 90, 0.10)',
    borderColor: colors.neonMuted,
  },
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: colors.neonMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    width: 48,
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
});
