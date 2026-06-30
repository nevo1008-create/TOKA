import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';

type PrivacyPolicyScreenProps = {
  onBack: () => void;
  onReportProblem?: () => void;
  showReportCard?: boolean;
};

const policySections: Array<{
  body: string[];
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: 'aqua' | 'gold' | 'green';
}> = [
  {
    body: [
      'Account and profile information such as email, name, initials, preferred area or beaches, gender, preferred foot, preferred side, equipment, profile photo, avatar focus, rank, rating, TOCA Points, and reliability signals.',
      'Game and community activity such as created or joined lobbies, waitlists, invites, friend relationships and requests, blocked players, player ratings, reports, support requests, notifications, and basic app interactions.',
      'Report and support context such as report type, related player or lobby, optional message, diagnostics opt-in, client context, support email status, and contact preference.',
    ],
    icon: 'albums-outline',
    title: 'Information we collect',
    tone: 'aqua',
  },
  {
    body: [
      'To help players discover games, join rooms, create lobbies, invite friends, manage waitlists, and view trusted player profiles.',
      'To support community safety, moderation, blocking, reporting, customer support, fraud prevention, and account security.',
      'To improve TOCA, understand app performance, fix bugs, and develop better footvolley community tools.',
    ],
    icon: 'sparkles-outline',
    title: 'How we use information',
    tone: 'green',
  },
  {
    body: [
      'Some profile and game details are visible to other TOCA players when needed for discovery, joining, ratings, and community trust.',
      'We may share limited data with service providers that help us operate hosting, authentication, storage, support email, security, notifications, or diagnostics.',
      'We do not sell personal information. We may disclose information if required by law, safety needs, or to protect TOCA and its community.',
    ],
    icon: 'people-outline',
    title: 'Sharing and visibility',
    tone: 'gold',
  },
  {
    body: [
      'TOCA stores your selected area or preferred beaches for game discovery. Native location access is not required for the V1 MVP.',
      'You can control device permissions in your phone settings. Some features may be limited if permissions are turned off.',
      'If TOCA later adds third-party sign-in, analytics, native push delivery, payments, or precise location, those practices must also be reflected in the store data safety details and this policy.',
    ],
    icon: 'shield-checkmark-outline',
    title: 'Permissions and third parties',
    tone: 'aqua',
  },
  {
    body: [
      'We keep account and game information for as long as needed to provide TOCA, support community safety, resolve disputes, and meet legal obligations.',
      'You can delete your account from inside the app through Delete account. Deletion removes the auth account, player profile, profile photo files, hosted lobbies, memberships, messages, notifications, submitted reports, ratings, blocks, and related app data tied to the player where the V1 hard-delete flow applies.',
      'Optional account deletion feedback is retained without player or auth identifiers. Some information may also be retained where required for security, fraud prevention, legal compliance, or legitimate community safety records.',
    ],
    icon: 'trash-outline',
    title: 'Retention and deletion',
    tone: 'green',
  },
  {
    body: [
      'You can update your profile details from Edit profile.',
      'You can request account deletion, report a problem, block players, or contact support from the side menu.',
      'For privacy questions, contact support@toca-ftv.com.',
    ],
    icon: 'person-circle-outline',
    title: 'Your choices and contact',
    tone: 'gold',
  },
];

export function PrivacyPolicyScreen({ onBack, onReportProblem, showReportCard = true }: PrivacyPolicyScreenProps) {
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
            Privacy policy
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            How TOCA handles player and community data.
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons color={colors.primaryDark} name="shield-checkmark-outline" size={30} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="sectionHeading" weight="900">
              Your beach community data should be clear
            </AppText>
            <AppText tone="muted" variant="uiBody" weight="600">
              This policy explains what TOCA collects, why it is used, how it may be shared, and how players can request deletion or support.
            </AppText>
            <View style={styles.updatedPill}>
              <Ionicons color={colors.accentGoldDark} name="calendar-outline" size={13} />
              <AppText tone="muted" variant="chip" weight="800">
                Last updated: June 30, 2026
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Ionicons color={colors.accentGoldDark} name="information-circle-outline" size={19} />
          <AppText style={styles.noticeText} tone="muted" variant="metadata" weight="700">
            Launch note: this MVP policy should be matched to the final App Store and Google Play data disclosures before release.
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons color={colors.primaryDark} name="document-text-outline" size={15} />
            </View>
            <AppText variant="title" weight="900">
              Policy details
            </AppText>
          </View>

          <View style={styles.sectionList}>
            {policySections.map((section) => (
              <LegalSection key={section.title} {...section} />
            ))}
          </View>
        </View>

        {showReportCard && onReportProblem ? (
          <View style={styles.reportCard}>
            <View style={styles.reportCopy}>
              <AppText variant="titleSmall" weight="900">
                Privacy or safety issue?
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                Send a report if something looks wrong, unsafe, or inconsistent with how TOCA should protect players.
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

function LegalSection({
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
    <View style={styles.legalCard}>
      <View
        style={[
          styles.legalIcon,
          tone === 'aqua' ? styles.legalIconAqua : tone === 'gold' ? styles.legalIconGold : styles.legalIconGreen,
        ]}
      >
        <Ionicons
          color={tone === 'aqua' ? colors.accentSea : tone === 'gold' ? colors.accentGoldDark : colors.primaryDark}
          name={icon}
          size={18}
        />
      </View>
      <View style={styles.legalCopy}>
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
  legalCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  legalCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  legalIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  legalIconAqua: {
    backgroundColor: colors.surfaceAqua,
  },
  legalIconGold: {
    backgroundColor: colors.surfaceYellow,
  },
  legalIconGreen: {
    backgroundColor: colors.surfaceMuted,
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
