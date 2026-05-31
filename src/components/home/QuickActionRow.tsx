import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme';
import { AppText } from '../AppText';

type ActionId = 'create' | 'find' | 'invite';

const actions: Array<{
  id: ActionId;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}> = [
  { id: 'find', icon: 'location', iconColor: colors.accentSea, title: 'Find game' },
  { id: 'create', icon: 'add', iconColor: colors.accentLime, title: 'Create game' },
  { id: 'invite', icon: 'person-add-outline', iconColor: colors.accentGold, title: 'Invite friends' },
];

type QuickActionRowProps = {
  onCreateGame: () => void;
  onFindGame: () => void;
  onInviteFriends: () => void;
};

export function QuickActionRow({ onCreateGame, onFindGame, onInviteFriends }: QuickActionRowProps) {
  const handlers: Record<ActionId, () => void> = {
    create: onCreateGame,
    find: onFindGame,
    invite: onInviteFriends,
  };

  return (
    <View style={styles.card}>
      {actions.map((action, index) => (
        <View key={action.title} style={styles.actionWrap}>
          <Pressable accessibilityRole="button" onPress={handlers[action.id]} style={[styles.action, action.id === 'create' && styles.createAction]}>
            <View style={[styles.iconRing, action.id === 'create' && styles.createIconRing, { borderColor: action.iconColor }]}>
              <Ionicons color={action.iconColor} name={action.icon} size={index === 1 ? 22 : 19} />
            </View>
            <View style={styles.copy}>
              <AppText align="center" numberOfLines={2} style={styles.actionTitle} variant="button" weight="700">
                {action.title}
              </AppText>
            </View>
          </Pressable>
          {index < actions.length - 1 ? <View style={styles.separator} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    flex: 1,
    gap: 5,
    justifyContent: 'center',
    minHeight: 74,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  actionWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 16,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
    ...shadows.card,
  },
  copy: {
    alignItems: 'center',
    minWidth: 0,
    width: '100%',
  },
  iconRing: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  createAction: {
    gap: 7,
  },
  createIconRing: {
    backgroundColor: colors.surfaceMuted,
    height: 44,
    width: 44,
  },
  separator: {
    backgroundColor: 'rgba(216, 232, 212, 0.60)',
    height: 46,
    marginHorizontal: spacing.xxs,
    width: 1,
  },
});
