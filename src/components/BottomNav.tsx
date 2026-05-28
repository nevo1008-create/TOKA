import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export type Tab = 'home' | 'games' | 'create' | 'community' | 'profile';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'games', label: 'Games' },
  { id: 'create', label: 'Create' },
  { id: 'community', label: 'Community' },
  { id: 'profile', label: 'Profile' },
];

type BottomNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  isDark?: boolean;
};

export function BottomNav({ activeTab, onChange, isDark = false }: BottomNavProps) {
  return (
    <View style={[styles.bottomNav, isDark && styles.bottomNavDark]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCreate = tab.id === 'create';

        return (
          <Pressable
            key={tab.id}
            style={[styles.navItem, isCreate && styles.createNavItem]}
            onPress={() => onChange(tab.id)}
          >
            <View
              style={[
                styles.navIcon,
                isDark && styles.navIconDark,
                isActive && styles.navIconActive,
                isActive && isDark && styles.navIconActiveDark,
                isCreate && styles.createNavIcon,
              ]}
            >
              <Text
                style={[
                  styles.navIconText,
                  isDark && styles.navIconTextDark,
                  isActive && styles.navIconTextActive,
                  isActive && isDark && styles.navIconTextActiveDark,
                  isCreate && styles.createNavIconText,
                ]}
              >
                {isCreate ? '+' : tab.label.slice(0, 1)}
              </Text>
            </View>
            <Text style={[styles.navLabel, isDark && styles.navLabelDark, isActive && styles.navLabelActive, isActive && isDark && styles.navLabelActiveDark]}>{tab.label}</Text>
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
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.lg,
    padding: spacing.sm,
    position: 'absolute',
    right: spacing.lg,
  },
  bottomNavDark: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkBorder,
    borderRadius: 0,
    bottom: 0,
    left: 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  createNavItem: {
    transform: [{ translateY: -10 }],
  },
  navIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  navIconDark: {
    backgroundColor: colors.darkSurfaceHigh,
  },
  navIconActive: {
    backgroundColor: colors.ink,
  },
  navIconActiveDark: {
    backgroundColor: colors.neon,
  },
  createNavIcon: {
    backgroundColor: colors.neon,
    height: 54,
    width: 54,
  },
  navIconText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  navIconTextDark: {
    color: colors.darkMuted,
  },
  navIconTextActive: {
    color: colors.surface,
  },
  navIconTextActiveDark: {
    color: colors.ink,
  },
  createNavIconText: {
    color: colors.ink,
    fontSize: 28,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  navLabelDark: {
    color: colors.darkMuted,
  },
  navLabelActive: {
    color: colors.ink,
  },
  navLabelActiveDark: {
    color: colors.neon,
  },
});
