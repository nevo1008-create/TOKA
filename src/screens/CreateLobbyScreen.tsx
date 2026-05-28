import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '../components/AppHeader';
import { currentPlayer, notifications } from '../data/mock';
import { colors, radius, spacing } from '../theme';

type CreateLobbyScreenProps = {
  onCancel: () => void;
};

export function CreateLobbyScreen({ onCancel }: CreateLobbyScreenProps) {
  return (
    <View style={styles.screen}>
      <AppHeader notificationCount={notifications.length} player={currentPlayer} />

      <View style={styles.content}>
        <View style={styles.screenHeading}>
          <Text style={styles.screenTitle}>Create game</Text>
          <Text style={styles.screenIntro}>Set the rules, place, and players.</Text>
        </View>

        <Section icon="L" title="When and where">
          <Field label="Game title">
            <InputShell value="Sunset Footvolley" withClear />
          </Field>

          <View style={styles.twoColumn}>
            <Field label="Date">
              <InputShell icon="D" value="Mon, May 26" withChevron />
            </Field>
            <Field label="Start time">
              <InputShell icon="T" value="18:30" withChevron />
            </Field>
          </View>

          <Field label="Location">
            <InputShell icon="P" value="Gordon Beach, Tel Aviv" withChevron />
          </Field>

          <Field label="Location details / meeting point">
            <TextInput
              multiline
              style={styles.textArea}
              value="Meet near the north workout area by the showers"
            />
          </Field>
        </Section>

        <Section icon="A" title="Access rules">
          <Field label="Players amount">
            <SegmentedControl options={['4', '5', '6']} selected="6" />
          </Field>

          <SegmentedControl compact options={['Any level', 'Exact level', 'Level range']} selected="Level range" />

          <View style={styles.twoColumn}>
            <Field label="Min level">
              <InputShell value="B-" withChevron />
            </Field>
            <Field label="Max level">
              <InputShell value="A" withChevron />
            </Field>
          </View>

          <Field label="Gender rule">
            <SegmentedControl options={['Everyone', 'Men', 'Women']} selected="Everyone" />
          </Field>

          <Field label="Join policy">
            <View style={styles.policyGrid}>
              <PolicyCard
                description="Anyone can join"
                icon="O"
                selected
                title="Public"
              />
              <PolicyCard
                description="Only invited or approved players"
                icon="P"
                title="Private"
              />
            </View>
          </Field>
        </Section>

        <Section icon="E" title="Equipment">
          <ToggleRow accent="muted" label="Ball needed" />
          <ToggleRow label="Court marks needed" />
        </Section>

        <View style={styles.footerActions}>
          <Pressable style={styles.createButton}>
            <Text style={styles.createButtonText}>{'Create game  ->'}</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Section({ children, icon, title }: { children: ReactNode; icon: string; title: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
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
  icon?: string;
  value: string;
  withChevron?: boolean;
  withClear?: boolean;
}) {
  return (
    <View style={styles.inputShell}>
      {icon ? <Text style={styles.inputIcon}>{icon}</Text> : null}
      <Text style={styles.inputText} numberOfLines={1}>
        {value}
      </Text>
      {withClear ? <Text style={styles.inputAction}>x</Text> : null}
      {withChevron ? <Text style={styles.inputAction}>v</Text> : null}
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
      {options.map((option, index) => {
        const isSelected = option === selected;

        return (
          <Pressable
            key={option}
            style={[
              styles.segment,
              index > 0 && styles.segmentBorder,
              compact && styles.segmentCompact,
              isSelected && styles.segmentSelected,
            ]}
          >
            <Text style={[styles.segmentText, isSelected && styles.segmentTextSelected]}>{option}</Text>
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
  icon: string;
  selected?: boolean;
  title: string;
}) {
  return (
    <Pressable style={[styles.policyCard, selected && styles.policyCardSelected]}>
      <View style={styles.policyTopRow}>
        <View style={styles.policyTitleRow}>
          <Text style={[styles.policyIcon, selected && styles.primaryText]}>{icon}</Text>
          <Text style={[styles.policyTitle, selected && styles.primaryText]}>{title}</Text>
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
      </View>
      <Text style={[styles.policyDescription, selected && styles.policyDescriptionSelected]}>
        {description}
      </Text>
    </Pressable>
  );
}

function ToggleRow({ accent = 'primary', label }: { accent?: 'muted' | 'primary'; label: string }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLabelRow}>
        <Text style={[styles.toggleIcon, accent === 'muted' && styles.toggleIconMuted]}>
          {accent === 'muted' ? 'B' : 'M'}
        </Text>
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <View style={styles.toggleTrack}>
        <View style={styles.toggleKnob}>
          <Text style={styles.toggleKnobText}>V</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.darkBackground,
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.darkBackground,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  backButtonText: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderColor: colors.neon,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  logoText: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '900',
  },
  logoDot: {
    backgroundColor: colors.neon,
    borderColor: colors.darkBackground,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 10,
    position: 'absolute',
    right: 6,
    top: 5,
    width: 10,
  },
  headerCopy: {
    flex: 1,
  },
  screenTitle: {
    color: colors.darkText,
    fontSize: 23,
    fontWeight: '900',
  },
  screenIntro: {
    color: colors.darkMuted,
    fontSize: 13,
    marginTop: 2,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: 124,
  },
  screenHeading: {
    gap: spacing.xs,
  },
  section: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionIcon: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.darkText,
    fontSize: 19,
    fontWeight: '900',
  },
  sectionBody: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    color: colors.darkText,
    fontSize: 12,
    fontWeight: '900',
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    color: colors.darkText,
    fontSize: 13,
    fontWeight: '900',
    marginRight: spacing.sm,
  },
  inputText: {
    color: colors.darkText,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  inputAction: {
    color: colors.darkMuted,
    fontSize: 16,
    fontWeight: '900',
    marginLeft: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.darkText,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  segmentedControl: {
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segmentedControlCompact: {
    gap: spacing.xs,
    padding: spacing.xs,
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    minHeight: 42,
    justifyContent: 'center',
  },
  segmentCompact: {
    borderRadius: radius.sm,
    minHeight: 34,
  },
  segmentBorder: {
    borderLeftColor: colors.darkBorder,
    borderLeftWidth: 1,
  },
  segmentSelected: {
    backgroundColor: colors.neon,
  },
  segmentText: {
    color: colors.darkText,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentTextSelected: {
    color: colors.ink,
  },
  policyGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  policyCard: {
    backgroundColor: colors.darkSurfaceHigh,
    borderColor: colors.darkBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minHeight: 82,
    padding: spacing.sm,
  },
  policyCardSelected: {
    borderColor: colors.neon,
  },
  policyTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  policyTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  policyIcon: {
    color: colors.darkText,
    fontSize: 18,
    fontWeight: '900',
  },
  policyTitle: {
    color: colors.darkText,
    fontSize: 15,
    fontWeight: '900',
  },
  primaryText: {
    color: colors.neon,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: colors.darkMuted,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioOuterSelected: {
    borderColor: colors.neon,
  },
  radioInner: {
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 10,
    width: 10,
  },
  policyDescription: {
    color: colors.darkMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  policyDescriptionSelected: {
    color: colors.darkText,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleIcon: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
    width: 24,
  },
  toggleIconMuted: {
    color: colors.darkMuted,
  },
  toggleLabel: {
    color: colors.darkText,
    fontSize: 15,
    fontWeight: '800',
  },
  toggleTrack: {
    alignItems: 'flex-end',
    backgroundColor: colors.neon,
    borderRadius: radius.round,
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 52,
  },
  toggleKnob: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  toggleKnobText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '900',
  },
  footerActions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: colors.neon,
    borderRadius: radius.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  createButtonText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  cancelButton: {
    alignItems: 'center',
    minHeight: 34,
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.darkText,
    fontSize: 16,
    fontWeight: '800',
  },
});
