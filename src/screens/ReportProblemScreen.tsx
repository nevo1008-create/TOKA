import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';

type ReportProblemScreenProps = {
  onBack: () => void;
};

type ReportCategory = 'app' | 'lobby' | 'player' | 'safety' | 'account' | 'other';
type ReportContext = 'general' | 'game' | 'player' | 'profile';

const categories: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: ReportCategory;
}> = [
  { icon: 'phone-portrait-outline', label: 'App issue', value: 'app' },
  { icon: 'football-outline', label: 'Game or lobby', value: 'lobby' },
  { icon: 'person-outline', label: 'Player behavior', value: 'player' },
  { icon: 'shield-checkmark-outline', label: 'Safety concern', value: 'safety' },
  { icon: 'person-circle-outline', label: 'Account', value: 'account' },
  { icon: 'ellipsis-horizontal-circle-outline', label: 'Other', value: 'other' },
];

const contexts: Array<{ label: string; value: ReportContext }> = [
  { label: 'General app', value: 'general' },
  { label: 'A game', value: 'game' },
  { label: 'A player', value: 'player' },
  { label: 'My profile', value: 'profile' },
];

export function ReportProblemScreen({ onBack }: ReportProblemScreenProps) {
  const [category, setCategory] = useState<ReportCategory>('app');
  const [context, setContext] = useState<ReportContext>('general');
  const [message, setMessage] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [canContact, setCanContact] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const canSubmit = message.trim().length >= 8;

  function submitReport() {
    if (!canSubmit) {
      return;
    }

    setIsSubmitted(true);
  }

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
            Report a problem
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Send a quick note to TOCA support.
          </AppText>
        </View>
      </View>

      {isSubmitted ? (
        <ReportSentState onDone={onBack} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.noticeCard}>
              <View style={styles.noticeIcon}>
                <Ionicons color={colors.primaryDark} name="heart-circle-outline" size={22} />
              </View>
              <View style={styles.noticeCopy}>
                <AppText variant="titleSmall" weight="900">
                  Keep it simple
                </AppText>
                <AppText tone="muted" variant="metadata" weight="600">
                  Tell us what happened. Safety and community reports are reviewed first.
                </AppText>
              </View>
            </View>

            <FormBlock icon="flag-outline" title="What should we look at?">
              <View style={styles.categoryGrid}>
                {categories.map((item) => (
                  <CategoryChip
                    active={category === item.value}
                    icon={item.icon}
                    key={item.value}
                    label={item.label}
                    onPress={() => setCategory(item.value)}
                  />
                ))}
              </View>
            </FormBlock>

            <FormBlock icon="chatbubble-ellipses-outline" title="What happened?">
              <View style={styles.textAreaShell}>
                <TextInput
                  multiline
                  onChangeText={setMessage}
                  placeholder="Write a short description..."
                  placeholderTextColor={colors.subtle}
                  style={styles.textArea}
                  textAlignVertical="top"
                  value={message}
                />
              </View>
              <AppText tone={canSubmit ? 'muted' : 'warning'} variant="caption" weight="700">
                {canSubmit ? 'Thanks, that is enough detail to send.' : 'Add at least a few words so support has context.'}
              </AppText>
            </FormBlock>

            <FormBlock icon="link-outline" title="Related to">
              <View style={styles.contextGrid}>
                {contexts.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    key={item.value}
                    onPress={() => setContext(item.value)}
                    style={[styles.contextPill, context === item.value && styles.contextPillActive]}
                  >
                    <AppText
                      align="center"
                      tone={context === item.value ? 'accent' : 'muted'}
                      variant="chip"
                      weight="800"
                    >
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </FormBlock>

            <View style={styles.optionsCard}>
              <OptionToggle
                active={includeDiagnostics}
                description="Helps us understand device and app state."
                icon="bug-outline"
                label="Include app diagnostics"
                onPress={() => setIncludeDiagnostics((current) => !current)}
              />
              <View style={styles.optionDivider} />
              <OptionToggle
                active={canContact}
                description="We may ask for one extra detail if needed."
                icon="mail-outline"
                label="Support can contact me"
                onPress={() => setCanContact((current) => !current)}
              />
            </View>
          </ScrollView>

          <View style={styles.submitBar}>
            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={submitReport}
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            >
              <AppText align="center" tone="inverse" variant="button" weight="900">
                Send report
              </AppText>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function FormBlock({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.formBlock}>
      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <Ionicons color={colors.primaryDark} name={icon} size={15} />
        </View>
        <AppText variant="title" weight="900">
          {title}
        </AppText>
      </View>
      <View style={styles.blockCard}>{children}</View>
    </View>
  );
}

function CategoryChip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.categoryChip, active && styles.categoryChipActive]}
    >
      <View style={[styles.categoryIcon, active && styles.categoryIconActive]}>
        <Ionicons color={active ? colors.primaryDark : colors.muted} name={icon} size={15} />
      </View>
      <AppText
        align="center"
        numberOfLines={2}
        tone={active ? 'accent' : 'muted'}
        variant="chip"
        weight="800"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function OptionToggle({
  active,
  description,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: active }} onPress={onPress} style={styles.optionRow}>
      <View style={styles.optionIcon}>
        <Ionicons color={colors.accentSea} name={icon} size={17} />
      </View>
      <View style={styles.optionCopy}>
        <AppText variant="uiBody" weight="900">
          {label}
        </AppText>
        <AppText tone="muted" variant="metadata" weight="600">
          {description}
        </AppText>
      </View>
      <View style={[styles.switchTrack, active && styles.switchTrackActive]}>
        <View style={[styles.switchThumb, active && styles.switchThumbActive]} />
      </View>
    </Pressable>
  );
}

function ReportSentState({ onDone }: { onDone: () => void }) {
  return (
    <View style={styles.sentWrap}>
      <View style={styles.sentCard}>
        <View style={styles.sentIcon}>
          <Ionicons color={colors.textOnGreen} name="checkmark" size={32} />
        </View>
        <AppText align="center" variant="sectionHeading" weight="900">
          Report sent
        </AppText>
        <AppText align="center" tone="muted" variant="uiBody" weight="600">
          Thanks for helping keep TOCA safe and friendly. We will review it as soon as possible.
        </AppText>
        <Pressable accessibilityRole="button" onPress={onDone} style={styles.doneButton}>
          <AppText align="center" tone="inverse" variant="button" weight="900">
            Done
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 440,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  blockCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.card,
  },
  blockHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  blockIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '48%',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 82,
    padding: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  categoryIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.22)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  categoryIconActive: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 126,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contextPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  contextPillActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  doneButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.soft,
  },
  formBlock: {
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
  noticeCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  noticeCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  noticeIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  optionDivider: {
    backgroundColor: colors.borderSoft,
    height: 1,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 62,
  },
  optionsCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sentCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    ...shadows.hero,
  },
  sentIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.round,
    borderWidth: 3,
    height: 66,
    justifyContent: 'center',
    width: 66,
    ...shadows.soft,
  },
  sentWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl2,
  },
  submitBar: {
    backgroundColor: 'rgba(248, 241, 227, 0.96)',
    borderTopColor: 'rgba(216, 232, 212, 0.72)',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.soft,
  },
  submitButtonDisabled: {
    opacity: 0.48,
  },
  switchThumb: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 20,
    width: 20,
    ...shadows.soft,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  switchTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 24,
    padding: 2,
    width: 46,
  },
  switchTrackActive: {
    backgroundColor: colors.primary,
  },
  textArea: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 120,
    padding: 0,
  },
  textAreaShell: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 132,
    padding: spacing.md,
  },
});
