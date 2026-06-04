import { StyleSheet, View } from 'react-native';

import { colors, radius } from '../theme';
import { AppText } from './AppText';

type LobbyImageBadgeTone = 'green' | 'muted' | 'yellow';
type LobbyImageBadgeSize = 'compact' | 'wide';

type LobbyImageBadgeProps = {
  label?: string;
  size?: LobbyImageBadgeSize;
  tone?: LobbyImageBadgeTone;
};

export function LobbyImageBadge({ label = '', size = 'compact', tone = 'yellow' }: LobbyImageBadgeProps) {
  const visibleLabel = label.trim();

  if (!visibleLabel) {
    return null;
  }

  const isLong = visibleLabel.length > 12;
  const isCompact = size === 'compact';

  return (
    <View
      style={[
        styles.badge,
        isCompact ? styles.badgeCompact : styles.badgeWide,
        isLong && (isCompact ? styles.badgeCompactLong : styles.badgeWideLong),
        tone === 'green' && styles.badgeGreen,
        tone === 'muted' && styles.badgeMuted,
      ]}
    >
      <AppText
        adjustsFontSizeToFit
        minimumFontScale={0.78}
        numberOfLines={1}
        style={[
          styles.text,
          isLong && styles.textLong,
          isLong && !isCompact && styles.textWideLong,
        ]}
        tone={tone === 'green' ? 'accent' : tone === 'muted' ? 'muted' : 'primary'}
        variant="chip"
        weight="800"
      >
        {visibleLabel}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 247, 219, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    position: 'absolute',
  },
  badgeCompact: {
    left: 7,
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    top: 7,
  },
  badgeCompactLong: {
    left: 0,
    maxWidth: 100,
    minHeight: 21,
    paddingHorizontal: 3,
    paddingVertical: 3,
    top: 8,
  },
  badgeGreen: {
    backgroundColor: 'rgba(234, 245, 236, 0.82)',
    borderColor: 'rgba(36, 196, 90, 0.28)',
  },
  badgeMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.62)',
  },
  badgeWide: {
    left: 8,
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    top: 8,
  },
  badgeWideLong: {
    left: 5,
    minHeight: 22,
    paddingHorizontal: 5,
    paddingVertical: 3,
    right: 5,
    top: 8,
  },
  text: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 12,
  },
  textLong: {
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
  },
  textWideLong: {
    fontSize: 9,
    lineHeight: 11,
  },
});
