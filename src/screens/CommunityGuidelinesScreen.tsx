import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';

type CommunityGuidelinesScreenProps = {
  onBack: () => void;
  onReportProblem: () => void;
};

const guidelines: Array<{
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: 'aqua' | 'gold' | 'green';
}> = [
  {
    body: 'Keep chat, ratings, and game behavior respectful. Competition is welcome; harassment is not.',
    icon: 'heart-circle-outline',
    title: 'Respect every player',
    tone: 'green',
  },
  {
    body: 'Join only when you plan to arrive. If plans change, update the room early so hosts can fill the spot.',
    icon: 'time-outline',
    title: 'Show up or update',
    tone: 'gold',
  },
  {
    body: 'Use rank ranges honestly. If a room requires approval, join the waitlist and let the host decide.',
    icon: 'stats-chart-outline',
    title: 'Play within the room rules',
    tone: 'aqua',
  },
  {
    body: 'Hosts should manage players, waitlists, and exceptions fairly. Players should respect host decisions.',
    icon: 'shield-checkmark-outline',
    title: 'Respect the host role',
    tone: 'green',
  },
  {
    body: 'Rate behavior and rank thoughtfully after games. Ratings should help the community, not punish people.',
    icon: 'star-outline',
    title: 'Rate honestly',
    tone: 'gold',
  },
  {
    body: 'Report unsafe behavior, fake profiles, repeated no-shows, or anything that makes beach games less safe.',
    icon: 'flag-outline',
    title: 'Protect the community',
    tone: 'aqua',
  },
];

const notAllowed = [
  'Harassment, threats, hate, or intimidation',
  'Repeated no-shows without updating the room',
  'Fake profiles or misleading player information',
  'Manipulating ratings, rankings, or invites',
];

export function CommunityGuidelinesScreen({ onBack, onReportProblem }: CommunityGuidelinesScreenProps) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
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
            Guidelines
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Keep TOCA competitive, social, and safe.
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons color={colors.primaryDark} name="people-circle-outline" size={30} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="sectionHeading" weight="900">
              Play fair. Show up. Respect the beach.
            </AppText>
            <AppText tone="muted" variant="uiBody" weight="600">
              TOCA works best when players are reliable, hosts are fair, and every room feels welcoming before the first serve.
            </AppText>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons color={colors.primaryDark} name="checkmark-circle-outline" size={15} />
            </View>
            <AppText variant="title" weight="900">
              Community rules
            </AppText>
          </View>

          <View style={styles.guidelineList}>
            {guidelines.map((guideline) => (
              <GuidelineCard key={guideline.title} {...guideline} />
            ))}
          </View>
        </View>

        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <View style={styles.warningIcon}>
              <Ionicons color={colors.accentGoldDark} name="alert-circle-outline" size={20} />
            </View>
            <View style={styles.warningCopy}>
              <AppText variant="titleSmall" weight="900">
                Not allowed on TOCA
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                These can lead to warnings, room restrictions, or account action.
              </AppText>
            </View>
          </View>

          <View style={styles.notAllowedList}>
            {notAllowed.map((item) => (
              <View key={item} style={styles.notAllowedRow}>
                <Ionicons color={colors.coral} name="remove-circle-outline" size={16} />
                <AppText style={styles.notAllowedText} tone="muted" variant="metadata" weight="700">
                  {item}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.reportCard}>
          <View style={styles.reportCopy}>
            <AppText variant="titleSmall" weight="900">
              See something off?
            </AppText>
            <AppText tone="muted" variant="metadata" weight="600">
              Send a quick report so TOCA can review safety, behavior, lobby, or account issues.
            </AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={onReportProblem} style={styles.reportButton}>
            <Ionicons color={colors.textOnGreen} name="flag-outline" size={16} />
            <AppText tone="inverse" variant="button" weight="900">
              Report a problem
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function GuidelineCard({
  body,
  icon,
  title,
  tone,
}: {
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: 'aqua' | 'gold' | 'green';
}) {
  return (
    <View style={styles.guidelineCard}>
      <View
        style={[
          styles.guidelineIcon,
          tone === 'aqua'
            ? styles.guidelineIconAqua
            : tone === 'gold'
              ? styles.guidelineIconGold
              : styles.guidelineIconGreen,
        ]}
      >
        <Ionicons
          color={tone === 'aqua' ? colors.accentSea : tone === 'gold' ? colors.accentGoldDark : colors.primaryDark}
          name={icon}
          size={18}
        />
      </View>
      <View style={styles.guidelineCopy}>
        <AppText variant="titleSmall" weight="900">
          {title}
        </AppText>
        <AppText tone="muted" variant="metadata" weight="600">
          {body}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 430,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  guidelineCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  guidelineCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  guidelineIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  guidelineIconAqua: {
    backgroundColor: colors.surfaceAqua,
  },
  guidelineIconGold: {
    backgroundColor: colors.surfaceYellow,
  },
  guidelineIconGreen: {
    backgroundColor: colors.surfaceMuted,
  },
  guidelineList: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
    ...shadows.soft,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 26,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.hero,
  },
  heroCopy: {
    gap: spacing.sm,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  notAllowedList: {
    gap: spacing.sm,
  },
  notAllowedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notAllowedText: {
    flex: 1,
    minWidth: 0,
  },
  reportButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 50,
    ...shadows.soft,
  },
  reportCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  reportCopy: {
    gap: spacing.xs,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  warningCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  warningCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  warningHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  warningIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
});
