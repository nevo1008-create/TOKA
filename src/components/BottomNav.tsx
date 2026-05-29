import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
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

export function BottomNav({ activeTab, onChange, isDark = false }: BottomNavProps) {
  return (
    <BlurView intensity={isDark ? 48 : 20} tint={isDark ? 'dark' : 'light'} style={[styles.bottomNav, isDark && styles.bottomNavDark]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCreate = tab.id === 'create';
        const iconColor = isActive ? colors.accentLime : isCreate ? colors.darkText : colors.darkMuted;

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
              ]}
            >
              <Ionicons color={iconColor} name={isActive ? tab.activeIcon : tab.icon} size={isCreate ? 33 : 21} />
            </View>
            <AppText
              style={styles.navLabel}
              tone={isActive ? 'accent' : 'muted'}
              variant="caption"
              weight={isActive ? '800' : '600'}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    bottom: 6,
    flexDirection: 'row',
    gap: spacing.xs,
    left: spacing.xl2,
    padding: spacing.xs,
    position: 'absolute',
    right: spacing.xl2,
  },
  bottomNavDark: {
    backgroundColor: 'rgba(6, 20, 10, 0.86)',
    borderColor: colors.darkBorder,
    borderRadius: 24,
    bottom: 6,
    left: spacing.xl2,
    paddingBottom: 6,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    right: spacing.xl2,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xxs,
    minHeight: 51,
  },
  createNavItem: {
    transform: [{ translateY: -5 }],
  },
  navIcon: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  createNavIcon: {
    height: 44,
    width: 44,
  },
  navLabel: {
    maxWidth: 68,
  },
});
