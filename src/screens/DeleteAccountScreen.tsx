import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';

type DeleteAccountScreenProps = {
  errorMessage?: string | null;
  isDeleting: boolean;
  onBack: () => void;
  onDeleteAccount: (feedback: string) => void;
};

export function DeleteAccountScreen({ errorMessage, isDeleting, onBack, onDeleteAccount }: DeleteAccountScreenProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const canDelete = isConfirmed && !isDeleting;

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
        <Pressable accessibilityLabel="Back" accessibilityRole="button" disabled={isDeleting} onPress={onBack} style={styles.headerButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={21} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText numberOfLines={1} variant="sectionHeading" weight="900">
            Delete account
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            This permanently removes your TOCA account.
          </AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warningCard}>
          <View style={styles.warningIcon}>
            <Ionicons color={colors.danger} name="warning-outline" size={28} />
          </View>
          <View style={styles.warningCopy}>
            <AppText variant="sectionHeading" weight="900">
              Are you sure you want to delete your account?
            </AppText>
            <AppText tone="muted" variant="uiBody" weight="600">
              Deleting your account will remove your player profile, profile photo, app preferences, lobby memberships, hosted rooms,
              messages, notifications, and account access. This action cannot be undone.
            </AppText>
          </View>
        </View>

        <View style={styles.feedbackCard}>
          <View style={styles.feedbackHeader}>
            <View style={styles.feedbackIcon}>
              <Ionicons color={colors.accentSea} name="chatbubble-ellipses-outline" size={18} />
            </View>
            <View style={styles.feedbackCopy}>
              <AppText variant="titleSmall" weight="900">
                Tell us how to improve
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                Optional feedback is saved anonymously.
              </AppText>
            </View>
          </View>
          <TextInput
            multiline
            onChangeText={setFeedback}
            placeholder="What made you decide to leave?"
            placeholderTextColor={colors.subtle}
            style={styles.feedbackInput}
            textAlignVertical="top"
            value={feedback}
          />
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isConfirmed }}
          disabled={isDeleting}
          onPress={() => setIsConfirmed((current) => !current)}
          style={[styles.confirmCard, isConfirmed && styles.confirmCardActive]}
        >
          <View style={[styles.confirmBox, isConfirmed && styles.confirmBoxActive]}>
            {isConfirmed ? <Ionicons color={colors.textOnGreen} name="checkmark" size={15} /> : null}
          </View>
          <AppText style={styles.confirmText} tone="muted" variant="metadata" weight="800">
            I understand this permanently deletes my account and TOCA data.
          </AppText>
        </Pressable>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Ionicons color={colors.danger} name="alert-circle-outline" size={17} />
            <AppText style={styles.errorText} tone="danger" variant="metadata" weight="800">
              {errorMessage}
            </AppText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canDelete}
          onPress={() => onDeleteAccount(feedback)}
          style={[styles.deleteButton, !canDelete && styles.deleteButtonDisabled]}
        >
          {isDeleting ? <ActivityIndicator color={colors.textOnGreen} size="small" /> : <Ionicons color={colors.textOnGreen} name="trash-outline" size={17} />}
          <AppText align="center" tone="inverse" variant="button" weight="900">
            {isDeleting ? 'Deleting account...' : 'Delete my account'}
          </AppText>
        </Pressable>
      </ScrollView>
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
  confirmBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  confirmBoxActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  confirmCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  confirmCardActive: {
    backgroundColor: 'rgba(217, 74, 58, 0.08)',
    borderColor: 'rgba(217, 74, 58, 0.32)',
  },
  confirmText: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 18,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.soft,
  },
  deleteButtonDisabled: {
    opacity: 0.46,
  },
  feedbackCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.24)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    minWidth: 0,
  },
  feedbackCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  feedbackHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  feedbackIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  feedbackInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 15,
    lineHeight: 21,
    minHeight: 118,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
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
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  warningCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(217, 74, 58, 0.22)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.card,
  },
  warningCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  warningIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderRadius: radius.round,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
});
