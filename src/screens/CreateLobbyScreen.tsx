import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export function CreateLobbyScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Create lobby</Text>
      <Text style={styles.screenIntro}>
        The MVP wizard should collect location, time, level range, gender rule, access policy,
        waitlist, equipment, and a free-text location note.
      </Text>
      <CreateStep
        index="1"
        title="When and where"
        body="Choose curated location, start time, and optional text instructions."
      />
      <CreateStep
        index="2"
        title="Game rules"
        body="Set 4-6 players, level range up to League, gender rule, and competitive tone."
      />
      <CreateStep
        index="3"
        title="Access and coordination"
        body="Open, approval, password or invite link, waitlist, substitutes, ball and court marks."
      />
      <Pressable style={styles.primaryButtonWide}>
        <Text style={styles.primaryButtonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

function CreateStep({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndex}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.subtleText}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  screenIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  stepRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  stepIndex: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepIndexText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  stepCopy: {
    flex: 1,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  subtleText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButtonWide: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
});
