import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatLobbyStart } from '../features/lobbies/lobbyDateTime';
import { colors, radius, shadows, spacing } from '../theme';
import type { Lobby, Notification } from '../types';
import { AppText } from './AppText';

type NotificationPanelProps = {
  lobbies: Lobby[];
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationPress: (notification: Notification) => void;
  visible: boolean;
};

export function NotificationPanel({
  lobbies,
  notifications,
  onClose,
  onMarkAllRead,
  onNotificationPress,
  visible,
}: NotificationPanelProps) {
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const sortedNotifications = [...notifications].sort((a, b) => Number(a.read) - Number(b.read));

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close notifications" accessibilityRole="button" onPress={onClose} style={styles.backdrop} />

        <View style={styles.panelWrap}>
          <LinearGradient
            colors={['#FFF6D7', colors.surface, colors.backgroundAlt]}
            locations={[0, 0.56, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.1, y: 1 }}
            style={styles.panel}
          >
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.headerIcon}>
                  <Ionicons color={colors.primaryDark} name="notifications-outline" size={18} />
                </View>
                <View style={styles.headerCopy}>
                  <AppText variant="title" weight="900">
                    Notifications
                  </AppText>
                  <AppText tone="muted" variant="metadata" weight="600">
                    {unreadCount > 0 ? `${unreadCount} new updates` : 'You are all caught up'}
                  </AppText>
                </View>
              </View>

              <Pressable accessibilityLabel="Close notifications" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
                <Ionicons color={colors.ink} name="close" size={17} />
              </Pressable>
            </View>

            {sortedNotifications.length > 0 ? (
              <>
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                  {sortedNotifications.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      lobby={notification.lobbyId ? lobbies.find((candidate) => candidate.id === notification.lobbyId) : undefined}
                      notification={notification}
                      onPress={() => onNotificationPress(notification)}
                    />
                  ))}
                </ScrollView>

                <Pressable accessibilityRole="button" onPress={onMarkAllRead} style={styles.markButton}>
                  <AppText align="center" tone="accent" variant="chip" weight="900">
                    Mark all as read
                  </AppText>
                </Pressable>
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons color={colors.accentSea} name="checkmark-circle-outline" size={24} />
                </View>
                <AppText align="center" variant="titleSmall" weight="900">
                  No notifications yet
                </AppText>
                <AppText align="center" tone="muted" variant="metadata" weight="600">
                  Room invites, rating reminders, and lobby updates will appear here.
                </AppText>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

function NotificationRow({
  lobby,
  notification,
  onPress,
}: {
  lobby?: Lobby;
  notification: Notification;
  onPress: () => void;
}) {
  const iconName = getNotificationIcon(notification.type);
  const actionLabel = lobby ? `Open ${getLobbyShortName(lobby)}` : 'Open';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.notificationRow, notification.read && styles.notificationRowRead]}
    >
      <View style={[styles.notificationIcon, notification.read && styles.notificationIconRead]}>
        <Ionicons color={notification.read ? colors.subtle : colors.primaryDark} name={iconName} size={17} />
      </View>

      <View style={styles.notificationCopy}>
        <View style={styles.notificationTitleRow}>
          <AppText numberOfLines={1} style={styles.notificationTitle} variant="titleSmall" weight="900">
            {notification.title}
          </AppText>
          {!notification.read ? <View style={styles.unreadDot} /> : null}
        </View>
        <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
          {notification.body}
        </AppText>
        {lobby ? (
          <View style={styles.contextLine}>
            <Ionicons color={colors.accentSea} name="location" size={12} />
            <AppText numberOfLines={1} tone="muted" variant="caption" weight="700">
              {lobby.location.name} · {formatLobbyStart(lobby.startsAt)}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.actionPill}>
        <AppText numberOfLines={1} tone="accent" variant="caption" weight="900">
          {actionLabel}
        </AppText>
        <Ionicons color={colors.primaryDark} name="chevron-forward" size={13} />
      </View>
    </Pressable>
  );
}

function getLobbyShortName(lobby: Lobby) {
  return lobby.title.includes(' at ') ? lobby.title.split(' at ')[0] : 'game';
}

function getNotificationIcon(type: Notification['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'join_request':
      return 'person-add-outline';
    case 'request_approved':
      return 'checkmark-circle-outline';
    case 'request_rejected':
      return 'close-circle-outline';
    case 'room_invite':
      return 'mail-open-outline';
    case 'waitlist_update':
      return 'hourglass-outline';
    case 'rating_required':
      return 'star-outline';
    case 'lobby_changed':
    default:
      return 'football-outline';
  }
}

const styles = StyleSheet.create({
  actionPill: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    maxWidth: 92,
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  backdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 32,
    justifyContent: 'center',
    width: 32,
    ...shadows.soft,
  },
  contextLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    marginTop: spacing.xs,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  list: {
    gap: spacing.sm,
    maxHeight: 360,
  },
  markButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  modalRoot: {
    flex: 1,
  },
  notificationCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.34)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  notificationIconRead: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
  },
  notificationRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.soft,
  },
  notificationRowRead: {
    opacity: 0.72,
  },
  notificationTitle: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  panel: {
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 26,
    borderWidth: 1,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadows.hero,
  },
  panelWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: 82,
    width: '100%',
  },
  titleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
  },
  unreadDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 8,
    width: 8,
  },
});
