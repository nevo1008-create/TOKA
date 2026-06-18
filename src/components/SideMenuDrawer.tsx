import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { formatPlayerRating } from '../features/ratings/playerRatingSummary';
import { colors, radius, shadows, spacing } from '../theme';
import type { Player } from '../types';
import { AppText } from './AppText';

type DrawerRowAction = 'blockedPlayers';

type SideMenuDrawerProps = {
  onClose: () => void;
  onAbout: () => void;
  onCommunityGuidelines: () => void;
  onEditProfile: () => void;
  onHelpSupport: () => void;
  onInviteFriends: () => void;
  onDeleteAccount: () => void;
  onMyGames: () => void;
  onNotifications: () => void;
  onPrivacyPolicy: () => void;
  onLogOut: () => void;
  onReportProblem: () => void;
  onTermsOfService: () => void;
  onPlaceholderAction: (action: DrawerRowAction, label: string) => void;
  onViewProfile: () => void;
  player: Player;
  rating?: string;
  visible: boolean;
};

type DrawerRowConfig = {
  action?: DrawerRowAction;
  destructive?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  tone?: 'aqua' | 'gold' | 'green';
};

export function SideMenuDrawer({
  onClose,
  onAbout,
  onCommunityGuidelines,
  onEditProfile,
  onHelpSupport,
  onInviteFriends,
  onDeleteAccount,
  onLogOut,
  onMyGames,
  onNotifications,
  onPrivacyPolicy,
  onReportProblem,
  onTermsOfService,
  onPlaceholderAction,
  onViewProfile,
  player,
  rating,
  visible,
}: SideMenuDrawerProps) {
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.round(width * 0.86), 360);
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const profileName = getProfileName(player);
  const ratingLabel = rating ?? formatPlayerRating(player);

  useEffect(() => {
    Animated.timing(slideAnim, {
      duration: visible ? 240 : 180,
      toValue: visible ? 0 : drawerWidth,
      useNativeDriver: true,
    }).start();
  }, [drawerWidth, slideAnim, visible]);

  function handleRowPress(row: DrawerRowConfig) {
    if (row.onPress) {
      row.onPress();
      return;
    }

    if (row.action) {
      onPlaceholderAction(row.action, row.label);
    }
  }

  const accountRows: DrawerRowConfig[] = [
    { icon: 'create-outline', label: 'Edit profile', onPress: onEditProfile, tone: 'green' },
    { icon: 'calendar-outline', label: 'My games', onPress: onMyGames, tone: 'aqua' },
    { icon: 'notifications-outline', label: 'Notifications', onPress: onNotifications, tone: 'gold' },
  ];

  const safetyRows: DrawerRowConfig[] = [
    { icon: 'person-add-outline', label: 'Invite friends', onPress: onInviteFriends, tone: 'green' },
    { action: 'blockedPlayers', icon: 'ban-outline', label: 'Blocked players' },
    { icon: 'flag-outline', label: 'Report a problem', onPress: onReportProblem, tone: 'gold' },
    { icon: 'help-buoy-outline', label: 'Help & support', onPress: onHelpSupport, tone: 'aqua' },
  ];

  const aboutRows: DrawerRowConfig[] = [
    { icon: 'information-circle-outline', label: 'About us', onPress: onAbout, tone: 'aqua' },
    { icon: 'people-circle-outline', label: 'Community guidelines', onPress: onCommunityGuidelines, tone: 'green' },
    { icon: 'shield-checkmark-outline', label: 'Privacy policy', onPress: onPrivacyPolicy },
    { icon: 'document-text-outline', label: 'Terms of service', onPress: onTermsOfService },
  ];

  const managementRows: DrawerRowConfig[] = [
    { destructive: true, icon: 'log-out-outline', label: 'Log out', onPress: onLogOut },
    { destructive: true, icon: 'trash-outline', label: 'Delete account', onPress: onDeleteAccount },
  ];

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
              width: drawerWidth,
            },
          ]}
        >
          <LinearGradient
            colors={['#FFF6D7', colors.surface, colors.backgroundAlt]}
            locations={[0, 0.52, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sunGlow} />

          <View style={styles.drawerHeader}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Ionicons color={colors.ink} name="close" size={18} />
            </Pressable>
            <View style={styles.brandLockup}>
              <LinearGradient
                colors={[colors.surfaceYellow, colors.surfaceMuted]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.logoBall}
              >
                <Ionicons color={colors.primaryDark} name="football" size={18} />
              </LinearGradient>
              <View>
                <AppText style={styles.logoText} variant="title" weight="900">
                  TOCA
                </AppText>
                <AppText tone="accent" variant="caption" weight="800">
                  Footvolley community
                </AppText>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <View style={styles.avatar}>
                  <AppText align="center" variant="cardTitle" weight="900">
                    {player.initials}
                  </AppText>
                </View>
                <View style={styles.profileCopy}>
                  <AppText numberOfLines={1} variant="cardTitle" weight="900">
                    {profileName}
                  </AppText>
                  <View style={styles.locationLine}>
                    <Ionicons color={colors.accentSea} name="location" size={13} />
                    <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
                      {player.area}
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={styles.profileChips}>
                <View style={styles.rankChip}>
                  <AppText variant="chip" weight="800">
                    Rank {player.level}
                  </AppText>
                </View>
                <View style={styles.ratingChip}>
                  <Ionicons color={colors.accentGoldDark} name="star-outline" size={11} />
                  <AppText variant="chip" weight="800">
                    {ratingLabel} rating
                  </AppText>
                </View>
              </View>

              <Pressable accessibilityRole="button" onPress={onViewProfile} style={styles.viewProfileButton}>
                <AppText align="center" tone="accent" variant="button" weight="800">
                  View profile
                </AppText>
                <Ionicons color={colors.primaryDark} name="chevron-forward" size={15} />
              </Pressable>
            </View>

            <DrawerGroup title="Account">
              {accountRows.map((row) => (
                <DrawerRow key={row.label} row={row} onPress={() => handleRowPress(row)} />
              ))}
            </DrawerGroup>

            <DrawerGroup title="Community & safety">
              {safetyRows.map((row) => (
                <DrawerRow key={row.label} row={row} onPress={() => handleRowPress(row)} />
              ))}
            </DrawerGroup>

            <DrawerGroup title="About TOCA">
              {aboutRows.map((row) => (
                <DrawerRow key={row.label} row={row} onPress={() => handleRowPress(row)} />
              ))}
            </DrawerGroup>

            <DrawerGroup title="Account management">
              {managementRows.map((row) => (
                <DrawerRow key={row.label} row={row} onPress={() => handleRowPress(row)} />
              ))}
            </DrawerGroup>

            <View style={styles.footer}>
              <AppText tone="muted" variant="caption" weight="800">
                TOCA v1.0.0
              </AppText>
              <AppText tone="subtle" variant="caption" weight="600">
                Made for beach players
              </AppText>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.group}>
      <AppText style={styles.groupTitle} tone="muted" variant="metadata" weight="700">
        {title}
      </AppText>
      <View style={styles.groupCard}>{children}</View>
    </View>
  );
}

function DrawerRow({ onPress, row }: { onPress: () => void; row: DrawerRowConfig }) {
  const iconStyle =
    row.destructive
      ? styles.rowIconDestructive
      : row.tone === 'aqua'
        ? styles.rowIconAqua
        : row.tone === 'gold'
          ? styles.rowIconGold
          : styles.rowIconGreen;
  const iconColor = row.destructive
    ? colors.danger
    : row.tone === 'aqua'
      ? colors.accentSea
      : row.tone === 'gold'
        ? colors.accentGoldDark
        : colors.primaryDark;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, iconStyle]}>
        <Ionicons color={iconColor} name={row.icon} size={17} />
      </View>
      <AppText
        numberOfLines={1}
        style={[styles.rowLabel, row.destructive && styles.rowLabelDestructive]}
        tone={row.destructive ? 'danger' : 'primary'}
        variant="uiBody"
        weight="600"
      >
        {row.label}
      </AppText>
      <Ionicons color={row.destructive ? colors.danger : colors.subtle} name="chevron-forward" size={15} />
    </Pressable>
  );
}

function getProfileName(player: Player) {
  return player.name.includes(' ') ? player.name : `${player.name} Sternberg`;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  backdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.22)',
    flex: 1,
  },
  brandLockup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
    ...shadows.soft,
  },
  drawer: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 28,
    borderLeftColor: 'rgba(255, 255, 255, 0.76)',
    borderLeftWidth: 1,
    borderTopLeftRadius: 28,
    bottom: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    ...shadows.hero,
  },
  drawerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    zIndex: 2,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xxs,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  group: {
    gap: spacing.xs,
  },
  groupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.64)',
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.soft,
  },
  groupTitle: {
    paddingHorizontal: spacing.xs,
    textTransform: 'uppercase',
  },
  locationLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  logoBall: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
    ...shadows.soft,
  },
  logoText: {
    fontStyle: 'italic',
    letterSpacing: 0,
    lineHeight: 22,
    transform: [{ skewX: '-10deg' }],
  },
  modalRoot: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.70)',
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
    ...shadows.card,
  },
  profileChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  profileTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rankChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  ratingChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
  },
  rowIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rowIconAqua: {
    backgroundColor: colors.surfaceAqua,
  },
  rowIconDestructive: {
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
  },
  rowIconGold: {
    backgroundColor: colors.surfaceYellow,
  },
  rowIconGreen: {
    backgroundColor: colors.surfaceMuted,
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
  },
  rowLabelDestructive: {
    color: colors.danger,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  sunGlow: {
    backgroundColor: 'rgba(246, 201, 69, 0.22)',
    borderRadius: radius.round,
    height: 150,
    position: 'absolute',
    right: -58,
    top: 92,
    width: 150,
  },
  viewProfileButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
  },
});
