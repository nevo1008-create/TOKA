import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, radius, shadows, spacing } from '../theme';

type AboutUsScreenProps = {
  onBack: () => void;
};

const productPoints: Array<{
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  tone: 'aqua' | 'gold' | 'green';
}> = [
  {
    body: 'Find nearby rooms, understand the level, and join without friction.',
    icon: 'location-outline',
    title: 'Play nearby',
    tone: 'aqua',
  },
  {
    body: 'Create organized lobbies with rank, gender, waitlist, and host tools.',
    icon: 'football-outline',
    title: 'Build better games',
    tone: 'green',
  },
  {
    body: 'Use ratings, reliability, and player profiles to know who you play with.',
    icon: 'shield-checkmark-outline',
    title: 'Grow trust',
    tone: 'gold',
  },
];

const values: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { icon: 'sunny-outline', label: 'Warm beach energy' },
  { icon: 'people-outline', label: 'Local community first' },
  { icon: 'trophy-outline', label: 'Competitive, not toxic' },
  { icon: 'heart-circle-outline', label: 'Reliable and respectful' },
];

export function AboutUsScreen({ onBack }: AboutUsScreenProps) {
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
            About TOCA
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Built for local footvolley players.
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[colors.surfaceYellow, colors.surfaceMuted]}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.logoBall}
            >
              <Ionicons color={colors.primaryDark} name="football" size={30} />
            </LinearGradient>
            <View style={styles.logoCopy}>
              <AppText style={styles.logoText} variant="heading" weight="900">
                TOCA
              </AppText>
              <AppText tone="accent" variant="metadata" weight="900">
                Footvolley community
              </AppText>
            </View>
          </View>

          <AppText variant="sectionHeading" weight="900">
            A better way to organize beach games
          </AppText>
          <AppText tone="muted" variant="uiBody" weight="600">
            TOCA helps footvolley players in Israel discover rooms, join games, invite friends, and build a trusted local beach crew.
          </AppText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIcon}>
              <Ionicons color={colors.primaryDark} name="sparkles-outline" size={15} />
            </View>
            <AppText variant="title" weight="900">
              What TOCA helps with
            </AppText>
          </View>

          <View style={styles.pointList}>
            {productPoints.map((point) => (
              <PointCard key={point.title} {...point} />
            ))}
          </View>
        </View>

        <View style={styles.storyCard}>
          <View style={styles.storyIcon}>
            <Ionicons color={colors.accentSea} name="water-outline" size={22} />
          </View>
          <View style={styles.storyCopy}>
            <AppText variant="titleSmall" weight="900">
              Made for the real beach routine
            </AppText>
            <AppText tone="muted" variant="metadata" weight="600">
              Quick evening matches, competitive weekend rooms, regular beaches, waitlists, hosts, and players who want the game to feel organized before they arrive.
            </AppText>
          </View>
        </View>

        <View style={styles.valuesCard}>
          <AppText variant="titleSmall" weight="900">
            Our product values
          </AppText>
          <View style={styles.valuesGrid}>
            {values.map((value) => (
              <View key={value.label} style={styles.valueItem}>
                <View style={styles.valueIcon}>
                  <Ionicons color={colors.primaryDark} name={value.icon} size={16} />
                </View>
                <AppText numberOfLines={2} style={styles.valueLabel} variant="metadata" weight="800">
                  {value.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footerCard}>
          <AppText align="center" tone="muted" variant="metadata" weight="700">
            TOCA v1.0.0
          </AppText>
          <AppText align="center" tone="subtle" variant="caption" weight="600">
            Made for beach players
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

function PointCard({
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
    <View style={styles.pointCard}>
      <View
        style={[
          styles.pointIcon,
          tone === 'aqua' ? styles.pointIconAqua : tone === 'gold' ? styles.pointIconGold : styles.pointIconGreen,
        ]}
      >
        <Ionicons
          color={tone === 'aqua' ? colors.accentSea : tone === 'gold' ? colors.accentGoldDark : colors.primaryDark}
          name={icon}
          size={19}
        />
      </View>
      <View style={styles.pointCopy}>
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
  footerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xxs,
    padding: spacing.md,
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
  logoBall: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.round,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    width: 64,
    ...shadows.soft,
  },
  logoCopy: {
    flex: 1,
    minWidth: 0,
  },
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  logoText: {
    fontStyle: 'italic',
    letterSpacing: 0,
    transform: [{ skewX: '-10deg' }],
  },
  pointCard: {
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
  pointCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  pointIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  pointIconAqua: {
    backgroundColor: colors.surfaceAqua,
  },
  pointIconGold: {
    backgroundColor: colors.surfaceYellow,
  },
  pointIconGreen: {
    backgroundColor: colors.surfaceMuted,
  },
  pointList: {
    gap: spacing.sm,
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
  storyCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.24)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  storyCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  storyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  valueIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  valueItem: {
    alignItems: 'center',
    flexBasis: '47%',
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  valueLabel: {
    flex: 1,
    minWidth: 0,
  },
  valuesCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  valuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
