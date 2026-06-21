import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import type { Notification } from '../types';
import { AppText } from './AppText';

type LiveNotificationBannerProps = {
  notification: Notification | null;
  onClose: () => void;
  onPress: (notification: Notification) => void;
  visible: boolean;
};

export function LiveNotificationBanner({
  notification,
  onClose,
  onPress,
  visible,
}: LiveNotificationBannerProps) {
  if (!visible || !notification) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" onPress={() => onPress(notification)} style={styles.contentButton}>
          <View style={styles.icon}>
            <AppText align="center" tone="primary" variant="caption" weight="900">
              !
            </AppText>
          </View>
          <View style={styles.copy}>
            <AppText numberOfLines={1} variant="titleSmall" weight="900">
              {notification.title}
            </AppText>
            <AppText numberOfLines={2} tone="muted" variant="metadata" weight="700">
              {notification.body}
            </AppText>
          </View>
        </Pressable>
        <Pressable accessibilityLabel="Dismiss notification" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
          <AppText align="center" tone="muted" variant="caption" weight="900">
            X
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: 420,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '92%',
    ...shadows.hero,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  contentButton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.42)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  layer: {
    left: 0,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    top: 16,
    zIndex: 30,
  },
});
