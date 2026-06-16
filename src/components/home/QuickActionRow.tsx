import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, homeTypography, radius, shadows, spacing } from '../../theme';
import { AppText } from '../AppText';

type ActionId = 'create' | 'find' | 'invite';

const actions: Array<{
  backgroundColor: string;
  id: ActionId;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
}> = [
  { backgroundColor: colors.surfaceAqua, id: 'find', icon: 'location', iconColor: colors.accentSea, title: 'Find game' },
  { backgroundColor: colors.surfaceMuted, id: 'create', icon: 'add', iconColor: colors.primaryDark, title: 'Create game' },
  { backgroundColor: colors.surfaceYellow, id: 'invite', icon: 'person-add-outline', iconColor: colors.accentGoldDark, title: 'Invite friends' },
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
            <View
              style={[
                styles.iconRing,
                { backgroundColor: action.backgroundColor, borderColor: action.iconColor },
                action.id === 'create' && styles.createIconRing,
              ]}
            >
              <Ionicons color={action.iconColor} name={action.icon} size={index === 1 ? 23 : 20} />
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
    gap: 7,
    justifyContent: 'center',
    minHeight: 82,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  actionWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  actionTitle: {
    color: colors.ink,
    fontFamily: homeTypography.button.fontFamily,
    fontSize: 13,
    fontWeight: 'normal',
    lineHeight: 16,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 7,
    ...shadows.card,
  },
  copy: {
    alignItems: 'center',
    minWidth: 0,
    width: '100%',
  },
  iconRing: {
    alignItems: 'center',
    borderRadius: radius.round,
    borderWidth: 1.5,
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 42,
  },
  createAction: {
    gap: 8,
  },
  createIconRing: {
    height: 46,
    width: 46,
  },
  separator: {
    backgroundColor: 'rgba(216, 232, 212, 0.72)',
    height: 50,
    marginHorizontal: spacing.xxs,
    width: 1,
  },
});
