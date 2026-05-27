import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export type Tab = 'home' | 'lobbies' | 'create' | 'profile';

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'home', label: 'Home', icon: 'H' },
  { id: 'lobbies', label: 'Lobbies', icon: 'L' },
  { id: 'create', label: 'Create', icon: '+' },
  { id: 'profile', label: 'Profile', icon: 'P' },
];

type BottomNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
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
                isActive && styles.navIconActive,
                isCreate && styles.createNavIcon,
              ]}
            >
              <Text
                style={[
                  styles.navIconText,
                  isActive && styles.navIconTextActive,
                  isCreate && styles.createNavIconText,
                ]}
              >
                {tab.icon}
              </Text>
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
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
    borderRadius: 22,
    borderWidth: 1,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    left: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: spacing.lg,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  createNavItem: {
    transform: [{ translateY: -8 }],
  },
  navIcon: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  navIconActive: {
    backgroundColor: 'transparent',
  },
  createNavIcon: {
    backgroundColor: '#62C85B',
    borderColor: colors.surface,
    borderWidth: 3,
    height: 54,
    width: 54,
  },
  navIconText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  navIconTextActive: {
    color: colors.primaryDark,
  },
  createNavIconText: {
    color: colors.surface,
    fontSize: 30,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  navLabelActive: {
    color: colors.ink,
  },
});
