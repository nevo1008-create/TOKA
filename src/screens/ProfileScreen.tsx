import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { colors, radius, spacing } from '../theme';
import type { Player } from '../types';

export function ProfileScreen({ player }: { player: Player }) {
  return (
    <View style={styles.screen}>
      <View style={styles.profileHeader}>
        <Avatar player={player} size={64} />
        <View style={styles.profileCopy}>
          <Text style={styles.screenTitle}>{player.name}</Text>
          <Text style={styles.screenIntro}>
            {player.area} · {formatFoot(player.preferredFoot)} foot · {player.gender}
          </Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <Stat label="Level" value={player.level} />
        <Stat label="Games" value={`${player.gamesPlayed}`} />
        <Stat label="TOCA points" value={`${player.tocaPoints}`} />
      </View>
      <View style={styles.profilePanel}>
        <Text style={styles.rowTitle}>Ranking state</Text>
        <Text style={styles.subtleText}>
          Skill rank is {player.rankStatus.replace('_', ' ')}. TOCA points track community and
          reliability signals separately from pure playing level.
        </Text>
      </View>
      <View style={styles.profilePanel}>
        <Text style={styles.rowTitle}>Equipment</Text>
        <Text style={styles.subtleText}>
          {player.hasBall ? 'Has ball' : 'No ball marked'} ·{' '}
          {player.hasCourtMarks ? 'Has court marks' : 'No court marks marked'}
        </Text>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatFoot(foot: Player['preferredFoot']) {
  if (foot === 'both') {
    return 'both';
  }

  return foot;
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  screenIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.lg,
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  profilePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  subtleText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
