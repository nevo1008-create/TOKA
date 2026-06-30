import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';

type TermsOfServiceScreenProps = {
  onBack: () => void;
  onReportProblem?: () => void;
  showReportCard?: boolean;
};

const termsSections: Array<{
  body: string[];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: 'aqua' | 'gold' | 'green';
}> = [
  {
    body: [
      'TOCA is a community app for discovering, creating, joining, and organizing footvolley lobbies.',
      'You are responsible for the accuracy of your profile, rank, location, lobby details, ratings, and messages.',
      'The MVP uses mock or local data in some areas. Production behavior may change when backend services are connected.',
    ],
    icon: 'football-outline',
    title: 'Using TOCA',
    tone: 'green',
  },
  {
    body: [
      'You must keep account information accurate and protect your own account access.',
      'You may not impersonate another person, create misleading profiles, manipulate ratings, or abuse invite, waitlist, or report systems.',
      'You can request account deletion from inside the app or by contacting support.',
    ],
    icon: 'person-circle-outline',
    title: 'Accounts',
    tone: 'aqua',
  },
  {
    body: [
      'Players must follow the Community Guidelines, respect hosts, and avoid harassment, hate, threats, spam, or unsafe conduct.',
      'Hosts may manage room rules, waitlists, protected lobbies, and exceptions. Host actions should be fair and community-minded.',
      'TOCA may review reports and take action such as warnings, restrictions, removal from lobbies, or account suspension.',
    ],
    icon: 'shield-checkmark-outline',
    title: 'Community conduct',
    tone: 'gold',
  },
  {
    body: [
      'You keep ownership of content you provide, such as profile details, lobby notes, reports, ratings, and messages.',
      'You allow TOCA to use that content as needed to operate the app, show rooms and profiles, support safety, and improve the service.',
      'Do not upload or share content you do not have the right to use, or content that violates player privacy or safety.',
    ],
    icon: 'chatbubbles-outline',
    title: 'User content',
    tone: 'green',
  },
  {
    body: [
      'TOCA helps organize games but does not guarantee player availability, game quality, rank accuracy, room safety, weather, courts, or outcomes.',
      'Players are responsible for their own safety, equipment, travel, and decisions to participate in physical activity.',
      'Features may be changed, paused, or removed as the product evolves.',
    ],
    icon: 'alert-circle-outline',
    title: 'Service limits',
    tone: 'aqua',
  },
  {
    body: [
      'If TOCA later adds paid features, subscriptions, or digital purchases, payment terms and store rules will apply.',
      'For iOS distribution, Apple payment and standard licensed application terms may apply where relevant.',
      'For Android distribution, Google Play payment and store policies may apply where relevant.',
    ],
    icon: 'card-outline',
    title: 'Payments and stores',
    tone: 'gold',
  },
  {
    body: [
      'We may update these Terms as TOCA evolves. Material changes should be communicated in-app or through an appropriate notice.',
      'Continuing to use TOCA after updated Terms take effect means you accept the updated Terms.',
      'Questions can be sent to support@toca-ftv.com.',
    ],
    icon: 'document-text-outline',
    title: 'Changes and contact',
    tone: 'green',
  },
];

export function TermsOfServiceScreen({ onBack, onReportProblem, showReportCard = true }: TermsOfServiceScreenProps) {
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
            Terms of service
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Rules for using TOCA.
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons color={colors.primaryDark} name="document-text-outline" size={30} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="sectionHeading" weight="900">
              Clear rules for a trusted beach community
            </AppText>
            <AppText tone="muted" variant="uiBody" weight="600">
              These draft Terms explain how TOCA should be used, what players are responsible for, and how community safety is handled.
            </AppText>
            <View style={styles.updatedPill}>
              <Ionicons color={colors.accentGoldDark} name="calendar-outline" size={13} />
              <AppText tone="muted" variant="chip" weight="800">
                Last updated: May 31, 2026
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Ionicons color={colors.accentGoldDark} name="information-circle-outline" size={19} />
          <AppText style={styles.noticeText} tone="muted" variant="metadata" weight="700">
            Launch note: this is product-ready terms copy for the MVP, but it should be reviewed by legal counsel and matched to the final App Store and Google Play listing before release.
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons color={colors.primaryDark} name="reader-outline" size={15} />
            </View>
            <AppText variant="title" weight="900">
              Terms details
            </AppText>
          </View>

          <View style={styles.sectionList}>
            {termsSections.map((section) => (
              <TermsSection key={section.title} {...section} />
            ))}
          </View>
        </View>

        {showReportCard && onReportProblem ? (
          <View style={styles.reportCard}>
            <View style={styles.reportCopy}>
              <AppText variant="titleSmall" weight="900">
                Need help with these Terms?
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                Use Report a problem for account, safety, player behavior, or lobby concerns.
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={onReportProblem} style={styles.reportButton}>
              <Ionicons color={colors.textOnGreen} name="flag-outline" size={16} />
              <AppText tone="inverse" variant="button" weight="900">
                Report a problem
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TermsSection({
  body,
  icon,
  title,
  tone,
}: {
  body: string[];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: 'aqua' | 'gold' | 'green';
}) {
  return (
    <View style={styles.termsCard}>
      <View
        style={[
          styles.termsIcon,
          tone === 'aqua' ? styles.termsIconAqua : tone === 'gold' ? styles.termsIconGold : styles.termsIconGreen,
        ]}
      >
        <Ionicons
          color={tone === 'aqua' ? colors.accentSea : tone === 'gold' ? colors.accentGoldDark : colors.primaryDark}
          name={icon}
          size={18}
        />
      </View>
      <View style={styles.termsCopy}>
        <AppText variant="titleSmall" weight="900">
          {title}
        </AppText>
        <View style={styles.bulletList}>
          {body.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <AppText style={styles.bulletText} tone="muted" variant="metadata" weight="600">
                {item}
              </AppText>
            </View>
          ))}
        </View>
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
  bulletDot: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.round,
    height: 5,
    marginTop: 7,
    width: 5,
  },
  bulletList: {
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
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
  noticeCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.34)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  noticeText: {
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
  sectionList: {
    gap: spacing.sm,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  termsCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  termsCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  termsIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  termsIconAqua: {
    backgroundColor: colors.surfaceAqua,
  },
  termsIconGold: {
    backgroundColor: colors.surfaceYellow,
  },
  termsIconGreen: {
    backgroundColor: colors.surfaceMuted,
  },
  updatedPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
