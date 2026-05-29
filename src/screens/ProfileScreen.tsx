import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { Avatar } from '../components/Avatar';
import { HomeHeader } from '../components/home/HomeHeader';
import { ProgressBar } from '../components/ProgressBar';
import { notifications, players } from '../data/mock';
import { colors, radius, spacing } from '../theme';
import type { Player } from '../types';

export function ProfileScreen({ player }: { player: Player }) {
  const friendPlayers = players.filter((candidate) => player.friendIds.includes(candidate.id));
  const recentPlayers = players.filter((candidate) => candidate.id !== player.id);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(76, 255, 90, 0.09)', colors.darkBackground, colors.darkBackground]}
        locations={[0, 0.34, 1]}
        style={styles.backgroundGlow}
      />
      <HomeHeader notificationCount={notifications.length} player={player} />

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatarWrap}>
              <Avatar player={player} size={72} />
            </View>

            <View style={styles.profileCopy}>
              <View style={styles.nameRow}>
                <AppText numberOfLines={1} style={styles.profileName} variant="heading" weight="800">
                  {player.name}
                </AppText>
                <View style={styles.verifiedPill}>
                  <Ionicons color={colors.accentSea} name="shield-checkmark" size={13} />
                </View>
              </View>
              <View style={styles.locationRow}>
                <Ionicons color={colors.accentSea} name="location" size={14} />
                <AppText numberOfLines={1} tone="muted" variant="bodySmall" weight="600">
                  {player.area}
                </AppText>
              </View>
              <View style={styles.profileMetaRow}>
                <Ionicons color={colors.darkSubtle} name="person-outline" size={13} />
                <AppText numberOfLines={1} tone="subtle" variant="caption" weight="600">
                  {capitalize(player.gender)}
                </AppText>
              </View>
            </View>

            <Pressable accessibilityRole="button" style={styles.editButton}>
              <Ionicons color={colors.accentLime} name="pencil-outline" size={16} />
            </Pressable>
          </View>
        </View>

        <View style={styles.pointsCard}>
          <LinearGradient
            colors={[colors.accentGold, '#FFE889', colors.accentGoldDark]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.levelBadge}
          >
            <AppText align="center" tone="inverse" style={styles.levelLabel} weight="800">
              Level
            </AppText>
            <AppText align="center" tone="inverse" style={styles.levelNumber} weight="800">
              8
            </AppText>
          </LinearGradient>

          <View style={styles.pointsCopy}>
            <View style={styles.pointsHeader}>
              <AppText variant="titleSmall" weight="800">
                TOCA Points
              </AppText>
              <AppText tone="muted" variant="caption" weight="700">
                1,250 / 2,000
              </AppText>
            </View>
            <ProgressBar fillColor={colors.accentGold} progress={0.625} style={styles.progress} trackColor="rgba(246,247,237,0.11)" />
            <AppText tone="subtle" variant="caption" weight="600">
              750 points until Level 9
            </AppText>
          </View>
        </View>

        <View style={styles.summaryStrip}>
          <SummaryItem icon="ribbon-outline" label="Level" value={player.level} />
          <View style={styles.summaryDivider} />
          <SummaryItem icon="star-outline" label="Rating" value="3.6" warning />
          <View style={styles.summaryDivider} />
          <SummaryItem icon="calendar-outline" label="Games" tone="sea" value={`${player.gamesPlayed}`} />
          <View style={styles.summaryDivider} />
          <SummaryItem icon="medal-outline" label="Badges" tone="purple" value="7" />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Playing profile" />
          <View style={styles.playingGrid}>
            <PlayingCell icon="walk-outline" label="Foot" value={capitalize(player.preferredFoot)} />
            <PlayingCell icon="swap-horizontal-outline" label="Side" value={capitalize(player.side)} />
            <GearCell hasBall={player.hasBall} hasCourtMarks={player.hasCourtMarks} />
          </View>
        </View>

        <PeopleSection action="See all" players={friendPlayers} title="Friends" trailingCount={24} />
        <PeopleSection players={recentPlayers} showRecency title="Recently played with" variant="connect" />

        <View style={styles.section}>
          <SectionHeader title="Badges & titles" />
          <ScrollView horizontal contentContainerStyle={styles.badgeRow} showsHorizontalScrollIndicator={false}>
            <BadgeCard icon="sunny-outline" title="Beach Player" description="10 beach games" />
            <BadgeCard icon="flash-outline" title="Active Player" description="10 games in a month" warning />
            <BadgeCard icon="heart-outline" title="Fair Player" description="Great attitude" />
            <BadgeCard icon="people-outline" title="Team Player" description="Full lobby regular" />
            <BadgeCard icon="lock-closed-outline" title="Locked" description="Coming soon" muted />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

function SummaryItem({
  icon,
  label,
  tone,
  value,
  warning = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone?: 'purple' | 'sea';
  value: string;
  warning?: boolean;
}) {
  const accentColor = tone === 'sea' ? colors.accentSea : tone === 'purple' ? colors.accentPurple : warning ? colors.accent : colors.accentLime;

  return (
    <View style={styles.summaryItem}>
      <View style={[styles.summaryIcon, warning && styles.summaryIconGold, tone === 'sea' && styles.summaryIconSea, tone === 'purple' && styles.summaryIconPurple]}>
        <Ionicons color={accentColor} name={icon} size={15} />
      </View>
      <AppText style={tone ? { color: accentColor } : undefined} tone={warning ? 'warning' : 'primary'} variant="titleSmall" weight="800">
        {value}
      </AppText>
      <AppText style={tone ? { color: accentColor } : undefined} tone="muted" variant="caption" weight="600">
        {label}
      </AppText>
    </View>
  );
}

function PlayingCell({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.playingCell}>
      <View style={styles.playingIcon}>
        <Ionicons color={colors.accentLime} name={icon} size={16} />
      </View>
      <AppText align="center" tone="subtle" variant="caption" weight="600">
        {label}
      </AppText>
      <AppText align="center" numberOfLines={1} variant="caption" weight="800">
        {value}
      </AppText>
    </View>
  );
}

function GearCell({ hasBall, hasCourtMarks }: { hasBall: boolean; hasCourtMarks: boolean }) {
  return (
    <View style={styles.playingCell}>
      <View style={styles.gearIconRow}>
        <View style={[styles.gearIcon, hasBall && styles.gearIconActive]}>
          <Ionicons color={hasBall ? colors.accentLime : colors.darkSubtle} name="football-outline" size={14} />
        </View>
        <View style={[styles.gearIcon, hasCourtMarks && styles.gearIconActive]}>
          <Ionicons color={hasCourtMarks ? colors.accentLime : colors.darkSubtle} name="flag-outline" size={14} />
        </View>
      </View>
      <View style={styles.gearLabelRow}>
        {hasBall ? (
          <AppText align="center" variant="caption" weight="800">
            Ball
          </AppText>
        ) : null}
        {hasCourtMarks ? (
          <AppText align="center" variant="caption" weight="800">
            Mark
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function PeopleSection({
  action,
  players: people,
  showRecency = false,
  title,
  trailingCount,
  variant = 'friend',
}: {
  action?: string;
  players: Player[];
  showRecency?: boolean;
  title: string;
  trailingCount?: number;
  variant?: 'connect' | 'friend';
}) {
  return (
    <View style={styles.section}>
      <SectionHeader action={action} icon="chevron-forward" title={title} />
      <ScrollView horizontal contentContainerStyle={styles.peopleRow} showsHorizontalScrollIndicator={false}>
        {people.map((person, index) => (
          <PlayerMiniCard
            key={person.id}
            player={person}
            recency={showRecency ? getRecentLabel(index) : undefined}
            variant={variant}
          />
        ))}
        {trailingCount ? <MoreCard label="Add friends" value={`${trailingCount}+`} /> : null}
      </ScrollView>
    </View>
  );
}

function PlayerMiniCard({
  player,
  recency,
  variant = 'friend',
}: {
  player: Player;
  recency?: string;
  variant?: 'connect' | 'friend';
}) {
  const isShield = player.id === 'p3';
  const isConnectStar = variant === 'connect' && !isShield;

  return (
    <View style={styles.playerCard}>
      <View style={styles.playerAvatar}>
        <AppText align="center" variant="titleSmall" weight="800">
          {player.initials}
        </AppText>
        <View style={[styles.playerBadge, isShield && styles.playerBadgeBlue, isConnectStar && styles.playerBadgeGold]}>
          <Ionicons color={colors.ink} name={isShield ? 'shield-checkmark' : 'star'} size={11} />
        </View>
      </View>
      <AppText align="center" numberOfLines={1} style={styles.playerName} variant="bodySmall" weight="800">
        {player.name}
      </AppText>
      <View style={styles.playerMetaRow}>
        <MiniChip label={player.level} />
        <MiniChip icon="star" label={player.id === 'p4' ? '3.6' : player.id === 'p3' ? '4.0' : '3.2'} warning />
      </View>
      <AppText align="center" tone="subtle" variant="caption" weight="600">
        {recency ?? `${player.tocaPoints} points`}
      </AppText>
    </View>
  );
}

function MoreCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.moreCard}>
      <View style={styles.moreCircle}>
        <AppText align="center" tone="accent" variant="titleSmall" weight="800">
          {value}
        </AppText>
      </View>
      <AppText align="center" tone="muted" variant="caption" weight="700">
        {label}
      </AppText>
    </View>
  );
}

function SectionHeader({
  action,
  icon,
  title,
}: {
  action?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle} variant="heading" weight="800">
        {title}
      </AppText>
      {action && icon ? (
        <Pressable accessibilityRole="button" style={styles.sectionAction}>
          <AppText tone="accent" variant="label" weight="800">
            {action}
          </AppText>
          <Ionicons color={colors.accentLime} name={icon} size={15} />
        </Pressable>
      ) : null}
    </View>
  );
}

function BadgeCard({
  description,
  icon,
  muted = false,
  title,
  warning = false,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  muted?: boolean;
  title: string;
  warning?: boolean;
}) {
  return (
    <View style={[styles.badgeCard, muted && styles.mutedCard]}>
      <View style={[styles.badgeIcon, warning && styles.badgeIconGold, muted && styles.badgeIconMuted]}>
        <Ionicons
          color={muted ? colors.darkSubtle : warning ? colors.accent : colors.accentLime}
          name={icon}
          size={19}
        />
      </View>
      <AppText align="center" numberOfLines={1} variant="bodySmall" weight="800">
        {title}
      </AppText>
      <AppText align="center" tone="subtle" variant="caption" weight="600">
        {description}
      </AppText>
    </View>
  );
}

function MiniChip({
  active = false,
  icon,
  label,
  warning = false,
}: {
  active?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  warning?: boolean;
}) {
  return (
    <View style={[styles.miniChip, active && styles.miniChipActive, warning && styles.miniChipGold]}>
      {icon ? (
        <Ionicons
          color={warning ? colors.accent : active ? colors.accentLime : colors.darkMuted}
          name={icon}
          size={10}
        />
      ) : null}
      <AppText tone={warning ? 'warning' : active ? 'accent' : 'muted'} variant="caption" weight="800">
        {label}
      </AppText>
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
  badgeCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 6,
    minHeight: 126,
    padding: spacing.sm,
    width: 116,
  },
  badgeIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  badgeIconGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  badgeIconMuted: {
    backgroundColor: 'rgba(246, 247, 237, 0.04)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
  },
  badgeRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl2,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  levelBadge: {
    alignItems: 'center',
    borderRadius: 16,
    height: 62,
    justifyContent: 'center',
    width: 60,
  },
  levelLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  levelNumber: {
    fontSize: 26,
    lineHeight: 28,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.xs,
  },
  gearIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  gearIconActive: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
  },
  gearIconRow: {
    flexDirection: 'row',
    gap: 5,
  },
  gearLabelRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 14,
    transform: [{ translateX: -14 }],
  },
  miniChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    minHeight: 22,
    paddingHorizontal: 7,
  },
  miniChipActive: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
  },
  miniChipGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  moreCard: {
    alignItems: 'center',
    gap: 6,
    minHeight: 144,
    padding: spacing.sm,
    width: 86,
  },
  moreCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.70)',
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  mutedCard: {
    opacity: 0.58,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  peopleRow: {
    gap: spacing.sm,
    paddingRight: spacing.xl2,
  },
  playerCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 6,
    height: 144,
    padding: spacing.sm,
    width: 108,
  },
  playerAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.06)',
    borderColor: 'rgba(246, 247, 237, 0.12)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    position: 'relative',
    width: 58,
  },
  playerBadge: {
    alignItems: 'center',
    backgroundColor: colors.accentLime,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: -1,
    height: 21,
    justifyContent: 'center',
    position: 'absolute',
    right: -1,
    width: 21,
  },
  playerBadgeBlue: {
    backgroundColor: colors.accentSea,
  },
  playerBadgeGold: {
    backgroundColor: colors.accent,
  },
  playerMetaRow: {
    flexDirection: 'row',
    gap: 4,
  },
  playerName: {
    maxWidth: 88,
  },
  playingCell: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  playingGrid: {
    backgroundColor: 'rgba(11, 29, 16, 0.52)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  playingIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  pointsCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.58)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  pointsCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pointsHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileCard: {
    backgroundColor: 'rgba(11, 29, 16, 0.62)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 3,
  },
  profileName: {
    color: '#ECEDE6',
    flexShrink: 1,
  },
  profileTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  progress: {
    height: 6,
  },
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
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
  summaryDivider: {
    backgroundColor: 'rgba(246, 247, 237, 0.10)',
    height: 34,
    width: 1,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    marginBottom: 3,
    width: 26,
  },
  summaryIconGold: {
    backgroundColor: 'rgba(255, 200, 61, 0.10)',
    borderColor: 'rgba(255, 200, 61, 0.28)',
  },
  summaryIconPurple: {
    backgroundColor: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.36)',
  },
  summaryIconSea: {
    backgroundColor: 'rgba(39, 210, 196, 0.10)',
    borderColor: 'rgba(39, 210, 196, 0.34)',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStrip: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.48)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 78,
    paddingHorizontal: spacing.sm,
  },
  verifiedPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(39, 210, 196, 0.10)',
    borderColor: 'rgba(39, 210, 196, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
});
