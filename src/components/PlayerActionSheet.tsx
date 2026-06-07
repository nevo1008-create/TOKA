import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import { AppText } from './AppText';

type IconName = keyof typeof Ionicons.glyphMap;

export type PlayerAction = {
  confirmation?: {
    body: string;
    confirmLabel: string;
    title: string;
  };
  destructive?: boolean;
  icon: IconName;
  label: string;
  onPress?: () => Promise<void> | void;
};

export type PlayerActionSheetPlayer = {
  contextLabel?: string;
  initials: string;
  name: string;
};

type PlayerActionSheetProps = {
  actions: PlayerAction[];
  contextLabel?: string;
  initials: string;
  name: string;
  onClose: () => void;
  visible: boolean;
};

export function PlayerActionSheet({
  actions,
  contextLabel,
  initials,
  name,
  onClose,
  visible,
}: PlayerActionSheetProps) {
  const [confirmingAction, setConfirmingAction] = useState<PlayerAction | null>(null);

  async function runAction(action: PlayerAction) {
    await action.onPress?.();
    setConfirmingAction(null);
    onClose();
  }

  function closeSheet() {
    setConfirmingAction(null);
    onClose();
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={closeSheet}>
      <Pressable accessibilityRole="button" onPress={closeSheet} style={styles.backdrop}>
        <Pressable accessibilityRole="menu" onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.avatar}>
              <AppText align="center" variant="cardTitle" weight="800">
                {initials}
              </AppText>
            </View>
            <View style={styles.headerCopy}>
              <AppText numberOfLines={1} variant="cardTitle" weight="800">
                {name}
              </AppText>
              {contextLabel ? (
                <AppText tone="muted" variant="metadata" weight="600">
                  {contextLabel}
                </AppText>
              ) : null}
            </View>
            <Pressable accessibilityRole="button" onPress={closeSheet} style={styles.closeButton}>
              <Ionicons color={colors.muted} name="close" size={18} />
            </Pressable>
          </View>

          {confirmingAction ? (
            <View style={styles.confirmPanel}>
              <View style={[styles.confirmIcon, confirmingAction.destructive && styles.confirmIconDanger]}>
                <Ionicons
                  color={confirmingAction.destructive ? colors.danger : colors.primaryDark}
                  name={confirmingAction.icon}
                  size={20}
                />
              </View>
              <View style={styles.confirmCopy}>
                <AppText align="center" variant="uiBody" weight="900">
                  {confirmingAction.confirmation?.title}
                </AppText>
                <AppText align="center" tone="muted" variant="metadata" weight="600">
                  {confirmingAction.confirmation?.body}
                </AppText>
              </View>
              <View style={styles.confirmActions}>
                <Pressable accessibilityRole="button" onPress={() => setConfirmingAction(null)} style={styles.confirmCancelButton}>
                  <AppText align="center" tone="muted" variant="button" weight="800">
                    Cancel
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void runAction(confirmingAction);
                  }}
                  style={[styles.confirmButton, confirmingAction.destructive && styles.confirmDangerButton]}
                >
                  <AppText align="center" tone="inverse" variant="button" weight="900">
                    {confirmingAction.confirmation?.confirmLabel}
                  </AppText>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.actionList}>
            {actions.map((action, index) => {
              const isFirstDestructive = action.destructive && !actions[index - 1]?.destructive;

              return (
              <Pressable
                accessibilityRole="menuitem"
                key={action.label}
                onPress={() => {
                  if (action.confirmation) {
                    setConfirmingAction(action);
                    return;
                  }

                  void runAction(action);
                }}
                style={[
                  styles.actionRow,
                  action.destructive && styles.actionRowDanger,
                  isFirstDestructive && styles.firstDangerAction,
                ]}
              >
                <View style={[styles.actionIcon, action.destructive && styles.actionIconDanger]}>
                  <Ionicons
                    color={action.destructive ? colors.danger : colors.primaryDark}
                    name={action.icon}
                    size={18}
                  />
                </View>
                <AppText
                  style={action.destructive ? styles.dangerText : undefined}
                  tone={action.destructive ? 'danger' : 'primary'}
                  variant="uiBody"
                  weight="700"
                >
                  {action.label}
                </AppText>
              </Pressable>
              );
            })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  actionIconDanger: {
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
  },
  actionList: {
    gap: spacing.sm,
  },
  actionRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  actionRowDanger: {
    backgroundColor: '#FFF7F1',
    borderColor: 'rgba(217, 74, 58, 0.16)',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  backdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.16)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  confirmActions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  confirmCancelButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  confirmCopy: {
    gap: spacing.xs,
  },
  confirmDangerButton: {
    backgroundColor: colors.danger,
  },
  confirmIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  confirmIconDanger: {
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.18)',
  },
  confirmPanel: {
    alignItems: 'center',
    gap: spacing.md,
  },
  dangerText: {
    color: colors.danger,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 4,
    marginBottom: spacing.md,
    width: 44,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  firstDangerAction: {
    marginTop: spacing.xs,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
    ...shadows.nav,
  },
});
