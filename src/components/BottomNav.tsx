import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export type Tab = 'home' | 'lobbies' | 'create' | 'profile';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'lobbies', label: 'Lobbies' },
  { id: 'create', label: 'Create' },
  { id: 'profile', label: 'Profile' },
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
                {isCreate ? '+' : tab.label.slice(0, 1)}
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
  navIconActive: {
    backgroundColor: colors.ink,
  },
  createNavIcon: {
    backgroundColor: colors.accent,
    height: 54,
    width: 54,
  },
  navIconText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  navIconTextActive: {
    color: colors.surface,
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
  navLabelActive: {
    color: colors.ink,
  },
});
