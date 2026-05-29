import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme';
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
          <Pressable accessibilityRole="button" onPress={handlers[action.id]} style={styles.action}>
            <View style={[styles.iconRing, { borderColor: action.iconColor }]}>
              <Ionicons color={action.iconColor} name={action.icon} size={index === 1 ? 22 : 19} />
            </View>
            <View style={styles.copy}>
              <AppText numberOfLines={1} style={styles.actionTitle} weight="700">
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
    flexDirection: 'row',
    gap: 1,
    minHeight: 64,
    minWidth: 0,
  },
  actionWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  actionTitle: {
    color: 'rgba(243, 244, 238, 0.9)',
    fontSize: 11,
    lineHeight: 14,
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(11, 29, 16, 0.78)',
    borderColor: colors.darkBorder,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  iconRing: {
    alignItems: 'center',
    borderColor: colors.accentLime,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  separator: {
    backgroundColor: 'rgba(246, 247, 237, 0.11)',
    height: 36,
    marginHorizontal: spacing.xxs,
    width: 1,
  },
});
