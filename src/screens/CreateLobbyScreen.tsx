import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import { currentPlayer, notifications } from '../data/mock';
import { colors, radius, spacing } from '../theme';

type CreateLobbyScreenProps = {
  onCancel: () => void;
};

export function CreateLobbyScreen({ onCancel }: CreateLobbyScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['rgba(76, 255, 90, 0.09)', colors.darkBackground, colors.darkBackground]}
        locations={[0, 0.34, 1]}
        style={styles.backgroundGlow}
      />
      <HomeHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.content}>
        {step === 1 ? <WhenWhereStep /> : null}

        {step === 2 ? (
          <>
            <Pressable accessibilityRole="button" onPress={() => setStep(1)} style={styles.wizardBackButton}>
              <Ionicons color={colors.darkText} name="chevron-back" size={20} />
            </Pressable>
            <AccessRulesStep />
          </>
        ) : null}

        <View style={styles.footerActions}>
          <PrimaryActionButton
            label={step === 1 ? 'Continue' : 'Create game'}
            onPress={step === 1 ? () => setStep(2) : undefined}
          />
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}>
            <AppText align="center" tone="muted" variant="bodySmall" weight="700">
              Cancel
            </AppText>
          </Pressable>
          <WizardDots step={step} />
        </View>
      </View>
    </View>
  );
}

function WhenWhereStep() {
  return (
    <Section icon="calendar-outline" title="When and where">
      <Field label="Game title">
        <InputShell value="Sunset Footvolley" withClear />
      </Field>

      <View style={styles.twoColumn}>
        <Field label="Date">
          <InputShell icon="calendar-outline" value="Mon, May 26" withChevron />
        </Field>
        <Field label="Start time">
          <InputShell icon="time-outline" value="18:30" withChevron />
        </Field>
      </View>

      <Field label="Location">
        <InputShell icon="location" value="Gordon Beach, Tel Aviv" withChevron />
      </Field>

      <Field label="Meeting point">
        <TextInput
          editable={false}
          multiline
          style={styles.textArea}
          value="Meet near the north workout area by the showers"
        />
      </Field>
    </Section>
  );
}

function AccessRulesStep() {
  return (
    <Section icon="options-outline" title="Access rules">
      <Field label="Players">
        <SegmentedControl options={['4', '5', '6']} selected="6" />
      </Field>

      <Field label="Level policy">
        <SegmentedControl compact options={['Any level', 'Exact level', 'Range']} selected="Range" />
      </Field>

      <View style={styles.twoColumn}>
        <Field label="Min level">
          <InputShell value="B-" withChevron />
        </Field>
        <Field label="Max level">
          <InputShell value="A" withChevron />
        </Field>
      </View>

      <Field label="Gender">
        <SegmentedControl options={['Everyone', 'Men', 'Women']} selected="Everyone" />
      </Field>

      <Field label="Join policy">
        <View style={styles.policyGrid}>
          <PolicyCard
            description="Anyone can join instantly"
            icon="earth-outline"
            selected
            title="Public"
          />
          <PolicyCard
            description="Invite or approval only"
            icon="lock-closed-outline"
            title="Private"
          />
        </View>
      </Field>
    </Section>
  );
}

function PrimaryActionButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.createButton}>
      <LinearGradient
        colors={['#5CFF68', colors.accentLimeDark]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.createButtonFill}
      >
        <AppText align="center" tone="inverse" variant="body" weight="800">
          {label}
        </AppText>
        <Ionicons color={colors.ink} name="arrow-forward" size={18} />
      </LinearGradient>
    </Pressable>
  );
}

function WizardDots({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.wizardDots}>
      <View style={[styles.wizardDot, step === 1 && styles.wizardDotActive]} />
      <View style={[styles.wizardDot, step === 2 && styles.wizardDotActive]} />
    </View>
  );
}

function Section({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>
          <Ionicons color={colors.accentLime} name={icon} size={15} />
        </View>
        <AppText style={styles.sectionTitle} variant="titleSmall" weight="800">
          {title}
        </AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.field}>
      <AppText tone="subtle" variant="label" weight="700">
        {label}
      </AppText>
      {children}
    </View>
  );
}

function InputShell({
  icon,
  value,
  withChevron = false,
  withClear = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  value: string;
  withChevron?: boolean;
  withClear?: boolean;
}) {
  return (
    <View style={styles.inputShell}>
      {icon ? <Ionicons color={colors.accentSea} name={icon} size={15} style={styles.inputIcon} /> : null}
      <AppText numberOfLines={1} style={styles.inputText} variant="bodySmall" weight="700">
        {value}
      </AppText>
      {withClear ? <Ionicons color={colors.darkSubtle} name="close-circle-outline" size={16} /> : null}
      {withChevron ? <Ionicons color={colors.darkSubtle} name="chevron-down" size={15} /> : null}
    </View>
  );
}

function SegmentedControl({
  compact = false,
  options,
  selected,
}: {
  compact?: boolean;
  options: string[];
  selected: string;
}) {
  return (
    <View style={[styles.segmentedControl, compact && styles.segmentedControlCompact]}>
      {options.map((option) => {
        const isSelected = option === selected;

        return (
          <Pressable
            accessibilityRole="button"
            key={option}
            style={[styles.segment, compact && styles.segmentCompact, isSelected && styles.segmentSelected]}
          >
            <AppText
              align="center"
              numberOfLines={1}
              tone={isSelected ? 'accent' : 'muted'}
              variant="label"
              weight="800"
            >
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function PolicyCard({
  description,
  icon,
  selected = false,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  title: string;
}) {
  return (
    <Pressable accessibilityRole="button" style={[styles.policyCard, selected && styles.policyCardSelected]}>
      <View style={styles.policyTopRow}>
        <View style={styles.policyTitleRow}>
          <View style={[styles.policyIcon, selected && styles.policyIconSelected]}>
            <Ionicons color={selected ? colors.accentLime : colors.darkSubtle} name={icon} size={15} />
          </View>
          <AppText tone={selected ? 'accent' : 'primary'} variant="bodySmall" weight="800">
            {title}
          </AppText>
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
      </View>
      <AppText tone={selected ? 'muted' : 'subtle'} variant="caption" weight="600">
        {description}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 360,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 124,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  createButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  createButtonFill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
  },
  field: {
    gap: spacing.xs,
  },
  footerActions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  inputText: {
    flex: 1,
  },
  policyCard: {
    backgroundColor: 'rgba(246, 247, 237, 0.035)',
    borderColor: 'rgba(246, 247, 237, 0.09)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minHeight: 86,
    padding: spacing.sm,
  },
  policyCardSelected: {
    backgroundColor: 'rgba(76, 255, 90, 0.055)',
    borderColor: colors.neonMuted,
  },
  policyGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  policyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  policyIconSelected: {
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
  },
  policyTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  policyTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioInner: {
    backgroundColor: colors.accentLime,
    borderRadius: radius.round,
    height: 8,
    width: 8,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: 'rgba(246, 247, 237, 0.16)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioOuterSelected: {
    borderColor: colors.neonMuted,
  },
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  section: {
    backgroundColor: 'rgba(11, 29, 16, 0.62)',
    borderColor: colors.darkBorder,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionBody: {
    gap: spacing.md,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(76, 255, 90, 0.08)',
    borderColor: colors.neonMuted,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  sectionTitle: {
    color: '#ECEDE6',
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.xs,
  },
  segmentCompact: {
    minHeight: 32,
  },
  segmentSelected: {
    backgroundColor: 'rgba(76, 255, 90, 0.09)',
  },
  segmentedControl: {
    backgroundColor: 'rgba(3, 16, 8, 0.48)',
    borderColor: 'rgba(246, 247, 237, 0.09)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  segmentedControlCompact: {
    borderRadius: radius.round,
  },
  textArea: {
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.darkMuted,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  wizardBackButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(246, 247, 237, 0.045)',
    borderColor: 'rgba(246, 247, 237, 0.10)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  wizardDot: {
    backgroundColor: 'rgba(246, 247, 237, 0.18)',
    borderRadius: radius.round,
    height: 6,
    width: 6,
  },
  wizardDotActive: {
    backgroundColor: colors.accentLime,
    width: 16,
  },
  wizardDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
});
