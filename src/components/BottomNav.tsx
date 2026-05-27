import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '../theme';

export type Tab = 'home' | 'lobbies' | 'create' | 'profile';

type NavItem = {
  id: string;
  label: string;
  tab?: Tab;
};

const tabs: NavItem[] = [
  { id: 'home', label: 'Home', tab: 'home' },
  { id: 'games', label: 'Games', tab: 'lobbies' },
  { id: 'create', label: 'Create', tab: 'create' },
  { id: 'community', label: 'Community' },
  { id: 'profile', label: 'Profile', tab: 'profile' },
];

type BottomNavProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <View style={styles.bottomNavWrap}>
      <View style={styles.bottomNav}>
        {tabs.map((item) => {
          const isCreate = item.id === 'create';
          const isActive = item.tab === activeTab || (item.id === 'games' && activeTab === 'lobbies');

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              key={item.id}
              onPress={() => {
                if (item.tab) {
                  onChange(item.tab);
                }
              }}
              style={({ pressed }) => [
                styles.navItem,
                isCreate && styles.createNavItem,
                pressed && styles.pressed,
              ]}
            >
              {isCreate ? (
                <View style={styles.createGlow}>
                  <View style={styles.createNavIcon}>
                    <Text style={styles.createNavIconText}>+</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.navIconWrap}>
                  <NavIcon name={item.id} active={isActive} />
                </View>
              )}
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                  isCreate && styles.createNavLabel,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const toneStyle = active ? styles.iconActive : styles.iconInactive;

  if (name === 'home') {
    return (
      <View style={styles.homeIcon}>
        <View style={[styles.homeRoof, toneStyle]} />
        <View style={[styles.homeBody, toneStyle]} />
      </View>
    );
  }

  if (name === 'games') {
    return (
      <View style={[styles.gameIcon, toneStyle]}>
        <View style={[styles.gameDotLarge, active ? styles.dotActive : styles.dotInactive]} />
        <View style={[styles.gameDotSmall, active ? styles.dotActive : styles.dotInactive]} />
        <View style={[styles.gameDotSmall, active ? styles.dotActive : styles.dotInactive]} />
      </View>
    );
  }

  if (name === 'community') {
    return (
      <View style={styles.communityIcon}>
        <View style={[styles.communityHeadPrimary, toneStyle]} />
        <View style={[styles.communityHeadSecondary, toneStyle]} />
        <View style={[styles.communityBase, toneStyle]} />
      </View>
    );
  }

  return (
    <View style={styles.profileIcon}>
      <View style={[styles.profileHead, toneStyle]} />
      <View style={[styles.profileBody, toneStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavWrap: {
    alignSelf: 'center',
    bottom: 10,
    left: 14,
    maxWidth: 400,
    position: 'absolute',
    right: 14,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,16,32,0.94)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    height: 82,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    minHeight: 56,
  },
  createNavItem: {
    transform: [{ translateY: -18 }],
  },
  navIconWrap: {
    alignItems: 'center',
    height: 26,
    justifyContent: 'center',
    width: 32,
  },
  iconInactive: {
    borderColor: '#A7B0C0',
  },
  iconActive: {
    borderColor: '#7DFF6B',
  },
  dotInactive: {
    backgroundColor: '#A7B0C0',
  },
  dotActive: {
    backgroundColor: '#7DFF6B',
  },
  homeIcon: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'flex-end',
    width: 26,
  },
  homeRoof: {
    borderLeftWidth: 1.8,
    borderTopWidth: 1.8,
    height: 16,
    position: 'absolute',
    top: 3,
    transform: [{ rotate: '45deg' }],
    width: 16,
  },
  homeBody: {
    borderBottomWidth: 1.8,
    borderLeftWidth: 1.8,
    borderRightWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    height: 14,
    width: 17,
  },
  gameIcon: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.8,
    flexDirection: 'row',
    gap: 4,
    height: 21,
    justifyContent: 'center',
    width: 28,
  },
  gameDotLarge: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  gameDotSmall: {
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  communityIcon: {
    height: 24,
    width: 28,
  },
  communityHeadPrimary: {
    borderRadius: 8,
    borderWidth: 1.8,
    height: 12,
    left: 9,
    position: 'absolute',
    top: 2,
    width: 12,
  },
  communityHeadSecondary: {
    borderRadius: 6,
    borderWidth: 1.8,
    height: 10,
    position: 'absolute',
    right: 1,
    top: 6,
    width: 10,
  },
  communityBase: {
    borderRadius: 10,
    borderWidth: 1.8,
    bottom: 1,
    height: 11,
    left: 5,
    position: 'absolute',
    width: 22,
  },
  profileIcon: {
    alignItems: 'center',
    height: 25,
    justifyContent: 'space-between',
    width: 25,
  },
  profileHead: {
    borderRadius: 8,
    borderWidth: 1.8,
    height: 12,
    width: 12,
  },
  profileBody: {
    borderRadius: 10,
    borderWidth: 1.8,
    height: 12,
    width: 22,
  },
  createGlow: {
    alignItems: 'center',
    backgroundColor: 'rgba(125,255,107,0.12)',
    borderRadius: radius.round,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  createNavIcon: {
    alignItems: 'center',
    backgroundColor: '#7DFF6B',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    shadowColor: '#7DFF6B',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    width: 62,
  },
  createNavIconText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34,
  },
  navLabel: {
    color: '#A7B0C0',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 15,
  },
  navLabelActive: {
    color: '#7DFF6B',
  },
  createNavLabel: {
    color: '#7DFF6B',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
