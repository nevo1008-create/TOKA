import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';

type BlockedPlayersScreenProps = {
  onBack: () => void;
  onReportProblem: () => void;
};

export function BlockedPlayersScreen({ onBack, onReportProblem }: BlockedPlayersScreenProps) {
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

      <View style={styles.content}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGlow: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
