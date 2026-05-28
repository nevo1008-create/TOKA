import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { Avatar } from '../components/Avatar';
import { notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Player } from '../types';

export function ProfileScreen({ player }: { player: Player }) {
  const friendPlayers = players.filter((candidate) => player.friendIds.includes(candidate.id));
  const recentPlayers = players.filter((candidate) => candidate.id !== player.id);

  return (
    <View style={styles.screen}>
      <AppHeader notificationCount={notifications.length} player={player} />

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Avatar player={player} size={82} />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.profileCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{player.name}</Text>
                <Text style={styles.verifiedBadge}>✓</Text>
              </View>
              <Text style={styles.locationText}>{player.area}</Text>
              <Text style={styles.genderLine}>Gender: {capitalize(player.gender)}</Text>
              <View style={styles.equipmentChips}>
                <InfoChip label={player.hasBall ? 'Has ball' : 'No ball'} tone="muted" />
                <InfoChip
                  label={player.hasCourtMarks ? 'Has court marks' : 'No court marks'}
                  tone={player.hasCourtMarks ? 'primary' : 'muted'}
                />
              </View>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard accent="primary" label="Skill Rank" note="Your current level" value={player.level} />
            <StatCard accent="warning" label="Rating" note="Public average" value="3.6" withStars />
            <StatCard accent="muted" label="Games Played" note="This Month" value={`${player.gamesPlayed}`} />
            <StatCard accent="primary" label="Badges & Titles" note="Achieved" value="7" />
          </View>
        </View>

        <View style={styles.pointsCard}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsBadgeText}>8</Text>
          </View>
          <View style={styles.pointsCopy}>
            <Text style={styles.pointsKicker}>TOCA Points</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsTitle}>Level 8</Text>
              <Text style={styles.pointsMeta}>
                <Text style={styles.primaryText}>1,250</Text> / 2,000
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.pointsHint}>750 points until Level 9</Text>
          </View>
          <Text style={styles.chevron}>{'>'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playing Profile</Text>
          <View style={styles.playingGrid}>
            <PlayingProfileCell label="Plays against" value="Everyone" />
            <PlayingProfileCell label="Preferred Foot" value={capitalize(player.preferredFoot)} />
            <PlayingProfileCell label="Play Side" value={capitalize(player.side)} />
            <PlayingProfileCell isLast label="Equipment" value="ball / mark" />
          </View>
        </View>

        <PeopleSection action="See all" players={friendPlayers} title="Friends" trailingCount={24} />
        <PeopleSection action="View all" players={recentPlayers} showRecency title="Recently Played With" />

        <View style={styles.section}>
          <SectionHeader action="View all" title="Badges & Titles" />
          <ScrollView horizontal contentContainerStyle={styles.badgeRow} showsHorizontalScrollIndicator={false}>
            <BadgeCard accent="primary" description="Play at the beach 10 times" title="Beach Player" />
            <BadgeCard accent="warning" description="Play 10 games in a month" title="Active Player" />
            <BadgeCard accent="muted" description="Great attitude, every game" title="Fair Player" />
            <BadgeCard accent="primary" description="Play in a full lobby 5 times" title="Team Player" />
            <BadgeCard locked description="More badges coming soon" title="Locked" />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function StatCard({
  accent,
  label,
  note,
  value,
  withStars = false,
}: {
  accent: 'muted' | 'primary' | 'warning';
  label: string;
  note: string;
  value: string;
  withStars?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, accent === 'primary' && styles.primaryBorder, accent === 'warning' && styles.warningBorder]}>
        <Text style={[styles.statIconText, accent === 'primary' && styles.primaryText, accent === 'warning' && styles.warningText]}>
          {withStars ? '*' : label.slice(0, 1)}
        </Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {withStars ? (
        <View style={styles.starsRow}>
          <Text style={styles.starActive}>*</Text>
          <Text style={styles.starActive}>*</Text>
          <Text style={styles.starActive}>*</Text>
          <Text style={styles.starFaded}>*</Text>
          <Text style={styles.starMuted}>*</Text>
        </View>
      ) : null}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </View>
  );
}

function PlayingProfileCell({ isLast = false, label, value }: { isLast?: boolean; label: string; value: string }) {
  return (
    <View style={[styles.playingCell, isLast && styles.playingCellLast]}>
      <Text style={styles.playingIcon}>{label.slice(0, 1)}</Text>
      <Text style={styles.playingLabel}>{label}</Text>
      <Text style={styles.playingValue}>{value}</Text>
    </View>
  );
}

function PeopleSection({
  action,
  players: people,
  showRecency = false,
  title,
  trailingCount,
}: {
  action: string;
  players: Player[];
  showRecency?: boolean;
  title: string;
  trailingCount?: number;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader action={action} title={title} />
      <ScrollView horizontal contentContainerStyle={styles.peopleRow} showsHorizontalScrollIndicator={false}>
        {people.map((person, index) => (
          <View key={person.id} style={styles.personItem}>
            <View style={styles.personAvatarWrap}>
              <Avatar player={person} size={56} />
              <View style={styles.personOnlineDot} />
            </View>
            <Text style={styles.personName}>{person.name}</Text>
            {showRecency ? <Text style={styles.personMeta}>{getRecentLabel(index)}</Text> : null}
          </View>
        ))}
        {trailingCount ? (
          <View style={styles.personItem}>
            <View style={styles.moreFriends}>
              <Text style={styles.moreFriendsText}>{trailingCount}</Text>
            </View>
            <Text style={styles.personMeta}>Friends</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ action, title }: { action: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

function BadgeCard({
  accent = 'primary',
  description,
  locked = false,
  title,
}: {
  accent?: 'muted' | 'primary' | 'warning';
  description: string;
  locked?: boolean;
  title: string;
}) {
  return (
    <View style={[styles.badgeCard, locked && styles.lockedBadge]}>
      <View style={[styles.badgeIcon, accent === 'warning' && styles.warningBorder, accent === 'muted' && styles.mutedBorder]}>
        <Text
          style={[
            styles.badgeIconText,
            accent === 'warning' && styles.warningText,
            accent === 'muted' && styles.mutedText,
          ]}
        >
          {locked ? '?' : 'B'}
        </Text>
      </View>
      <Text style={styles.badgeTitle}>{title}</Text>
      <Text style={styles.badgeDescription}>{description}</Text>
    </View>
  );
}

function InfoChip({ label, tone }: { label: string; tone: 'muted' | 'primary' }) {
  return (
    <View style={[styles.infoChip, tone === 'primary' && styles.infoChipPrimary]}>
      <Text style={[styles.infoChipText, tone === 'primary' && styles.infoChipTextPrimary]}>{label}</Text>
    </View>
  );
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function getRecentLabel(index: number) {
  return ['2d ago', '3d ago', '5d ago', '1w ago'][index] ?? '1w ago';
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minWidth: 0,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'relative',
    width: 42,
  },
  iconText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  brandRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  logoText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  brandTitle: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: colors.darkMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -4,
    width: 18,
  },
  notificationText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
  },
  content: {
    gap: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  editButton: {
    alignSelf: 'flex-end',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editButtonText: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '800',
  },
  profileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: -spacing.lg,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkSurface,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 4,
    height: 18,
    position: 'absolute',
    right: 4,
    width: 18,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  profileName: {
    color: colors.darkText,
    fontSize: 26,
    fontWeight: '900',
  },
  verifiedBadge: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
  },
  locationText: {
    color: colors.darkMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  genderLine: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  equipmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  infoChip: {
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  infoChipPrimary: {
    borderColor: colors.neon,
  },
  infoChipText: {
    color: colors.darkMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  infoChipTextPrimary: {
    color: colors.neon,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 158,
    padding: spacing.sm,
  },
  statIcon: {
    alignItems: 'center',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 40,
  },
  statIconText: {
    color: colors.darkMuted,
    fontSize: 16,
    fontWeight: '900',
  },
  primaryBorder: {
    borderColor: colors.neon,
  },
  warningBorder: {
    borderColor: colors.accent,
  },
  mutedBorder: {
    borderColor: colors.darkMuted,
  },
  primaryText: {
    color: colors.neon,
  },
  warningText: {
    color: colors.accent,
  },
  mutedText: {
    color: colors.darkMuted,
  },
  statValue: {
    color: colors.darkText,
    fontSize: 22,
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  starActive: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
  },
  starFaded: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    opacity: 0.45,
  },
  starMuted: {
    color: colors.darkBorder,
    fontSize: 10,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.darkMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  statNote: {
    color: colors.darkMuted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  pointsCard: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  pointsBadge: {
    alignItems: 'center',
    borderColor: colors.neon,
    borderRadius: radius.md,
    borderWidth: 4,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  pointsBadgeText: {
    color: colors.darkText,
    fontSize: 22,
    fontWeight: '900',
  },
  pointsCopy: {
    flex: 1,
    minWidth: 0,
  },
  pointsKicker: {
    color: colors.darkMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  pointsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsTitle: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '900',
  },
  pointsMeta: {
    color: colors.darkText,
    fontSize: 12,
  },
  progressTrack: {
    backgroundColor: colors.darkBackground,
    borderRadius: radius.round,
    height: 7,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: '100%',
    width: '62.5%',
  },
  pointsHint: {
    color: colors.darkMuted,
    fontSize: 10,
    marginTop: spacing.sm,
  },
  chevron: {
    color: colors.darkMuted,
    fontSize: 24,
    fontWeight: '900',
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.darkText,
    fontSize: 21,
    fontWeight: '900',
  },
  sectionAction: {
    color: colors.neon,
    fontSize: 14,
    fontWeight: '800',
  },
  playingGrid: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  playingCell: {
    alignItems: 'center',
    borderRightColor: colors.darkBorder,
    borderRightWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 86,
    paddingHorizontal: spacing.xs,
  },
  playingCellLast: {
    borderRightWidth: 0,
  },
  playingIcon: {
    color: colors.neon,
    fontSize: 16,
    fontWeight: '900',
  },
  playingLabel: {
    color: colors.darkMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  playingValue: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  peopleRow: {
    gap: spacing.lg,
    paddingBottom: spacing.xs,
  },
  personItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 62,
  },
  personAvatarWrap: {
    position: 'relative',
  },
  personOnlineDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 1,
    height: 14,
    position: 'absolute',
    right: 1,
    width: 14,
  },
  personName: {
    color: colors.darkText,
    fontSize: 12,
  },
  personMeta: {
    color: colors.darkMuted,
    fontSize: 10,
  },
  moreFriends: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  moreFriendsText: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
  },
  badgeRow: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  badgeCard: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 132,
    padding: spacing.md,
    width: 128,
  },
  lockedBadge: {
    opacity: 0.55,
  },
  badgeIcon: {
    alignItems: 'center',
    borderColor: colors.neon,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 42,
  },
  badgeIconText: {
    color: colors.neon,
    fontSize: 16,
    fontWeight: '900',
  },
  badgeTitle: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  badgeDescription: {
    color: colors.darkMuted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
