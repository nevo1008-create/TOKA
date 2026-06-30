import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';
import type { Player } from '../types';

type BlockedPlayersScreenProps = {
  blockedPlayers: Player[];
  isUnblockingPlayerId?: string | null;
  onBack: () => void;
  onReportPlayer: (player: Player) => void;
  onReportProblem: () => void;
  onUnblockPlayer: (playerId: string) => void;
};

export function BlockedPlayersScreen({
  blockedPlayers,
  isUnblockingPlayerId = null,
  onBack,
  onReportPlayer,
  onReportProblem,
  onUnblockPlayer,
}: BlockedPlayersScreenProps) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.44, 1]}
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
            Blocked players
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Players you block will be kept out of your invites and direct interactions.
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, blockedPlayers.length === 0 && styles.contentEmpty]} showsVerticalScrollIndicator={false}>
        {blockedPlayers.length > 0 ? (
          <>
            <View style={styles.summaryPanel}>
              <View style={styles.summaryIcon}>
                <Ionicons color={colors.danger} name="ban-outline" size={20} />
              </View>
              <View style={styles.summaryCopy}>
                <AppText variant="cardTitle" weight="900">
                  {blockedPlayers.length} blocked {blockedPlayers.length === 1 ? 'player' : 'players'}
                </AppText>
                <AppText tone="muted" variant="metadata" weight="600">
                  They are hidden from your discovery surfaces and kept out of games you host.
                </AppText>
              </View>
            </View>

            <View style={styles.playerStack}>
              {blockedPlayers.map((player) => {
                const isUnblocking = isUnblockingPlayerId === player.id;

                return (
                  <View key={player.id} style={styles.playerRow}>
                    <View style={styles.avatar}>
                      <AppText align="center" variant="cardTitle" weight="900">
                        {player.initials}
                      </AppText>
                    </View>
                    <View style={styles.playerCopy}>
                      <AppText numberOfLines={1} variant="uiBody" weight="900">
                        {player.name}
                      </AppText>
                      <AppText numberOfLines={1} tone="muted" variant="metadata" weight="700">
                        {player.area} - {player.level}
                      </AppText>
                    </View>
                    <Pressable accessibilityRole="button" onPress={() => onReportPlayer(player)} style={styles.reportButton}>
                      <Ionicons color={colors.danger} name="flag-outline" size={15} />
                      <AppText align="center" tone="danger" variant="button" weight="900">
                        Report
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isUnblocking}
                      onPress={() => onUnblockPlayer(player.id)}
                      style={[styles.unblockButton, isUnblocking && styles.buttonDisabled]}
                    >
                      <AppText align="center" tone="accent" variant="button" weight="900">
                        {isUnblocking ? 'Unblocking' : 'Unblock'}
                      </AppText>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons color={colors.danger} name="ban-outline" size={28} />
            </View>
            <AppText align="center" variant="cardTitle" weight="900">
              No blocked players
            </AppText>
            <AppText align="center" tone="muted" variant="uiBody" weight="600">
              If someone makes games feel unsafe or uncomfortable, report the issue and TOCA can help review it.
            </AppText>
            <Pressable accessibilityRole="button" onPress={onReportProblem} style={styles.primaryButton}>
              <Ionicons color={colors.textOnGreen} name="flag-outline" size={17} />
              <AppText align="center" tone="inverse" variant="button" weight="900">
                Report a problem
              </AppText>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  backgroundGlow: {
    ...StyleSheet.absoluteFill,
  },
  buttonDisabled: {
    opacity: 0.58,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  contentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.12)',
    borderRadius: radius.round,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    ...shadows.soft,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
    ...shadows.soft,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  playerCopy: {
    flex: 1,
    minWidth: 0,
  },
  playerRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.sm,
    ...shadows.soft,
  },
  playerStack: {
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  reportButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.22)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 84,
    paddingHorizontal: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.18)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  summaryPanel: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  unblockButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 86,
    paddingHorizontal: spacing.md,
  },
});
