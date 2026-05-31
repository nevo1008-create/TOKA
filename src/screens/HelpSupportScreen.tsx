import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';

type HelpSupportScreenProps = {
  onBack: () => void;
  onReportProblem: () => void;
};

type HelpTopic = {
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  title: string;
};

const helpTopics: HelpTopic[] = [
  {
    answer:
      'Open Games, choose a lobby, and use Open game to review the time, beach, rank range, players, and joining state before you join.',
    icon: 'football-outline',
    id: 'joining',
    title: 'Joining a game',
  },
  {
    answer:
      'Internal invites are always game-specific. Add Friends is for finding TOCA players or inviting someone new to join the app.',
    icon: 'person-add-outline',
    id: 'invites',
    title: 'Invites and friends',
  },
  {
    answer:
      'Rank is your playing skill, rating reflects player behavior, and TOCA Points are progression points earned through activity.',
    icon: 'star-outline',
    id: 'rank-rating',
    title: 'Rank, rating, and points',
  },
  {
    answer:
      'Protected lobbies can require admin approval when a player is outside the room rules. Those players can join the waitlist.',
    icon: 'shield-checkmark-outline',
    id: 'protected',
    title: 'Protected lobbies',
  },
  {
    answer:
      'Profile details help hosts and players understand your preferred beach, foot, side, reliability, and community history.',
    icon: 'person-circle-outline',
    id: 'profile',
    title: 'Profile and privacy',
  },
];

export function HelpSupportScreen({ onBack, onReportProblem }: HelpSupportScreenProps) {
  const [query, setQuery] = useState('');
  const [openTopicId, setOpenTopicId] = useState<string | null>('joining');
  const [supportStarted, setSupportStarted] = useState(false);

  const filteredTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return helpTopics;
    }

    return helpTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(normalizedQuery) ||
        topic.answer.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

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
            Help & support
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Get help with games, friends, safety, and your account.
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchCard}>
          <View style={styles.searchIcon}>
            <Ionicons color={colors.accentSea} name="search" size={18} />
          </View>
          <TextInput
            onChangeText={setQuery}
            placeholder="Search help topics"
            placeholderTextColor={colors.subtle}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <View style={styles.quickGrid}>
          <QuickAction
            description="Bugs, safety, lobbies, or player behavior."
            icon="flag-outline"
            onPress={onReportProblem}
            title="Report a problem"
            tone="gold"
          />
          <QuickAction
            description="Ask the TOCA team for help."
            icon="help-buoy-outline"
            onPress={() => setSupportStarted(true)}
            title="Contact support"
            tone="aqua"
          />
        </View>

        {supportStarted ? (
          <View style={styles.supportReadyCard}>
            <View style={styles.supportReadyIcon}>
              <Ionicons color={colors.primaryDark} name="checkmark" size={18} />
            </View>
            <View style={styles.supportReadyCopy}>
              <AppText variant="titleSmall" weight="900">
                Support request ready
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                We will connect this to the support backend later. For urgent issues, use Report a problem.
              </AppText>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons color={colors.primaryDark} name="sparkles-outline" size={15} />
            </View>
            <AppText variant="title" weight="900">
              Popular help
            </AppText>
          </View>

          <View style={styles.topicCard}>
            {filteredTopics.length > 0 ? (
              filteredTopics.map((topic, index) => (
                <HelpTopicRow
                  isLast={index === filteredTopics.length - 1}
                  isOpen={openTopicId === topic.id}
                  key={topic.id}
                  onPress={() => setOpenTopicId((current) => (current === topic.id ? null : topic.id))}
                  topic={topic}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons color={colors.accentSea} name="search-outline" size={22} />
                </View>
                <AppText align="center" variant="titleSmall" weight="900">
                  No help topic found
                </AppText>
                <AppText align="center" tone="muted" variant="metadata" weight="600">
                  Try a different word or contact support.
                </AppText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <View style={styles.contactIcon}>
              <Ionicons color={colors.accentSea} name="chatbubbles-outline" size={21} />
            </View>
            <View style={styles.contactCopy}>
              <AppText variant="titleSmall" weight="900">
                Need more help?
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                Support usually replies within 24-48 hours.
              </AppText>
            </View>
          </View>

          <View style={styles.contactLine}>
            <Ionicons color={colors.primaryDark} name="mail-outline" size={15} />
            <AppText tone="muted" variant="metadata" weight="700">
              support@toca.app
            </AppText>
          </View>

          <Pressable accessibilityRole="button" onPress={() => setSupportStarted(true)} style={styles.contactButton}>
            <AppText align="center" tone="inverse" variant="button" weight="900">
              Start support request
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  description,
  icon,
  onPress,
  title,
  tone,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
  tone: 'aqua' | 'gold';
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.quickAction}>
      <View style={[styles.quickIcon, tone === 'gold' ? styles.quickIconGold : styles.quickIconAqua]}>
        <Ionicons
          color={tone === 'gold' ? colors.accentGoldDark : colors.accentSea}
          name={icon}
          size={20}
        />
      </View>
      <AppText numberOfLines={2} variant="titleSmall" weight="900">
        {title}
      </AppText>
      <AppText numberOfLines={3} tone="muted" variant="metadata" weight="600">
        {description}
      </AppText>
    </Pressable>
  );
}

function HelpTopicRow({
  isLast,
  isOpen,
  onPress,
  topic,
}: {
  isLast: boolean;
  isOpen: boolean;
  onPress: () => void;
  topic: HelpTopic;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.topicRow, !isLast && styles.topicDivider]}>
      <View style={styles.topicTopRow}>
        <View style={styles.topicIcon}>
          <Ionicons color={colors.primaryDark} name={topic.icon} size={16} />
        </View>
        <AppText numberOfLines={2} style={styles.topicTitle} variant="uiBody" weight="900">
          {topic.title}
        </AppText>
        <Ionicons color={colors.subtle} name={isOpen ? 'chevron-up' : 'chevron-down'} size={17} />
      </View>
      {isOpen ? (
        <AppText style={styles.topicAnswer} tone="muted" variant="metadata" weight="600">
          {topic.answer}
        </AppText>
      ) : null}
    </Pressable>
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
  contactButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 50,
    ...shadows.soft,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  contactCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  contactHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  contactIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.22)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  contactLine: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
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
  quickAction: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: 142,
    padding: spacing.md,
    ...shadows.card,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  quickIconAqua: {
    backgroundColor: colors.surfaceAqua,
  },
  quickIconGold: {
    backgroundColor: colors.surfaceYellow,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    ...shadows.card,
  },
  searchIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.bold,
    fontSize: 16,
    lineHeight: 22,
    minWidth: 0,
    padding: 0,
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
  supportReadyCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  supportReadyCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  supportReadyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  topicAnswer: {
    paddingLeft: 48,
  },
  topicCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  topicDivider: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: 1,
  },
  topicIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  topicRow: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  topicTitle: {
    flex: 1,
    minWidth: 0,
  },
  topicTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
