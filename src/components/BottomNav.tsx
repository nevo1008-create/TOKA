import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import { AppText } from './AppText';

export type Tab = 'home' | 'games' | 'create' | 'community' | 'profile';

type IconName = keyof typeof Ionicons.glyphMap;

const tabs: Array<{ activeIcon: IconName; icon: IconName; id: Tab; label: string }> = [
  { activeIcon: 'home-outline', icon: 'home-outline', id: 'home', label: 'Home' },
  { activeIcon: 'calendar-outline', icon: 'calendar-outline', id: 'games', label: 'Games' },
  { activeIcon: 'football-outline', icon: 'football-outline', id: 'create', label: 'Create' },
  { activeIcon: 'people-outline', icon: 'people-outline', id: 'community', label: 'Community' },
  { activeIcon: 'person-outline', icon: 'person-outline', id: 'profile', label: 'Profile' },
];

type BottomNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  isDark?: boolean;
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCreate = tab.id === 'create';
        const iconColor = isActive ? colors.primaryDark : isCreate ? colors.textOnGreen : colors.muted;

        return (
          <Pressable
            key={tab.id}
            style={[styles.navItem, isCreate && styles.createNavItem]}
            onPress={() => onChange(tab.id)}
          >
            <View
              style={[
                styles.navIcon,
                isCreate && styles.createNavIcon,
                isActive && !isCreate && styles.activeNavIcon,
              ]}
            >
              <Ionicons color={iconColor} name={isActive ? tab.activeIcon : tab.icon} size={isCreate ? 33 : 21} />
            </View>
            <AppText
              style={styles.navLabel}
              tone={isActive ? 'accent' : 'muted'}
              variant="navLabel"
              weight={isActive ? '800' : '600'}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.xs,
    left: 0,
    paddingBottom: 4,
    paddingHorizontal: 12,
    paddingTop: 4,
    position: 'absolute',
    right: 0,
    ...shadows.nav,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: 1,
    minHeight: 46,
  },
  createNavItem: {
    transform: [{ translateY: -7 }],
  },
  navIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  createNavIcon: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.70)',
    borderWidth: 3,
    height: 48,
    width: 48,
    ...shadows.soft,
  },
  activeNavIcon: {
    backgroundColor: colors.surfaceMuted,
  },
  navLabel: {
    maxWidth: 68,
  },
});
