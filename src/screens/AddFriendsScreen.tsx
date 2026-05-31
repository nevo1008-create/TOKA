import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { PlayerActionSheet, type PlayerAction, type PlayerActionSheetPlayer } from '../components/PlayerActionSheet';
import { PlayerProfilePreview } from '../components/PlayerProfilePreview';
import { getPlayerPreviewPlayingDetails } from '../components/playerProfilePreviewDetails';
import { PlayerRow, type PlayerRowAction } from '../components/PlayerRow';
import { currentPlayer } from '../data/mock';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { Player } from '../types';

type AddFriendsScreenProps = {
  onBack: () => void;
  onViewPlayerProfile: (player: Player) => void;
  players: Player[];
};

type AddFriendsTab = 'invite' | 'search';

const inviteLink = 'https://toca.app/invite/nevo';
const inviteMessage =
  'Come join me on TOCA — find beach games, join rooms, and connect with local footvolley players.';

export function AddFriendsScreen({ onBack, onViewPlayerProfile, players }: AddFriendsScreenProps) {
  const [activeTab, setActiveTab] = useState<AddFriendsTab>('search');
  const [actionSheetActions, setActionSheetActions] = useState<PlayerAction[]>([]);
  const [actionSheetPlayer, setActionSheetPlayer] = useState<PlayerActionSheetPlayer | null>(null);
  const [profilePreviewPlayer, setProfilePreviewPlayer] = useState<Player | null>(null);
  const [query, setQuery] = useState('');
  const [requestedIds, setRequestedIds] = useState<string[]>([]);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const searchablePlayers = players.filter((player) => player.id !== currentPlayer.id);
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePlayers = useMemo(() => {
    if (!normalizedQuery) {
      return searchablePlayers;
    }

    return searchablePlayers.filter((player) =>
      [player.name, player.initials, player.area, player.level].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [normalizedQuery, searchablePlayers]);

  function requestFriend(playerId: string) {
    if (currentPlayer.friendIds.includes(playerId)) {
      return;
    }

    setRequestedIds((current) => (current.includes(playerId) ? current : [...current, playerId]));
  }

  function openActions(player: Player) {
    setActionSheetPlayer({
      contextLabel: getPlayerContext(player),
      initials: player.initials,
      name: player.name,
    });
    setActionSheetActions([
      {
        icon: 'person-circle-outline',
        label: 'View profile',
        onPress: () => setProfilePreviewPlayer(player),
      },
      {
        destructive: true,
        icon: 'ban-outline',
        label: 'Block',
      },
    ]);
  }

  async function shareInviteLink() {
    try {
      await Share.share({
        message: `${inviteMessage}\n${inviteLink}`,
        title: 'Invite to TOCA',
        url: inviteLink,
      });
      setShareFeedback('Invite link ready to share');
    } catch {
      setShareFeedback('Could not open sharing right now');
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.15, y: 0.78 }}
        style={styles.backgroundGlow}
      />

      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={styles.headerButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={21} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText numberOfLines={1} variant="sectionHeading" weight="900">
            Add friends
          </AppText>
          <AppText numberOfLines={2} tone="muted" variant="metadata" weight="600">
            Find players on TOCA or invite someone to join.
          </AppText>
        </View>
      </View>

      <View style={styles.tabs}>
        <TabButton active={activeTab === 'search'} label="Search TOCA" onPress={() => setActiveTab('search')} />
        <TabButton active={activeTab === 'invite'} label="Invite to TOCA" onPress={() => setActiveTab('invite')} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {activeTab === 'search' ? (
          <>
            <View style={styles.searchBox}>
              <Ionicons color={colors.subtle} name="search" size={16} />
              <TextInput
                onChangeText={setQuery}
                placeholder="Search by name, initials, or beach"
                placeholderTextColor={colors.subtle}
                style={styles.searchInput}
                value={query}
              />
            </View>

            <View style={styles.sectionHeader}>
              <AppText variant="sectionHeading" weight="900">
                {normalizedQuery ? 'Results' : 'Suggested players'}
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                {normalizedQuery ? 'Players matching your search' : 'Nearby players and beach regulars'}
              </AppText>
            </View>

            {visiblePlayers.length > 0 ? (
              <View style={styles.playerStack}>
                {visiblePlayers.map((player) => {
                  const isFriend = currentPlayer.friendIds.includes(player.id);
                  const isRequested = requestedIds.includes(player.id);

                  return (
                    <PlayerRow
                      context={getPlayerContext(player)}
                      initials={player.initials}
                      key={player.id}
                      level={player.level}
                      name={player.name}
                      onMore={() => openActions(player)}
                      onPressProfile={() => setProfilePreviewPlayer(player)}
                      primaryAction={getPrimaryAction(player, isFriend, isRequested, () => requestFriend(player.id))}
                      rating={getPlayerRating(player)}
                      statusIcon={isFriend ? 'checkmark' : 'star'}
                    />
                  );
                })}
              </View>
            ) : (
              <NoResultsState
                onInvite={() => {
                  setActiveTab('invite');
                  setShareFeedback(null);
                }}
              />
            )}
          </>
        ) : (
          <InviteToTocaPanel onShare={shareInviteLink} shareFeedback={shareFeedback} />
        )}
      </ScrollView>

      <PlayerActionSheet
        actions={actionSheetActions}
        contextLabel={actionSheetPlayer?.contextLabel}
        initials={actionSheetPlayer?.initials ?? ''}
        name={actionSheetPlayer?.name ?? ''}
        onClose={() => setActionSheetPlayer(null)}
        visible={Boolean(actionSheetPlayer)}
      />
      <PlayerProfilePreview
        context={profilePreviewPlayer ? getPlayerContext(profilePreviewPlayer) : undefined}
        initials={profilePreviewPlayer?.initials ?? ''}
        level={profilePreviewPlayer?.level}
        meta={profilePreviewPlayer ? `${profilePreviewPlayer.tocaPoints} TOCA points` : undefined}
        moreActions={
          profilePreviewPlayer
            ? getPreviewActions(profilePreviewPlayer, () => setProfilePreviewPlayer(profilePreviewPlayer))
            : undefined
        }
        name={profilePreviewPlayer?.name ?? ''}
        onClose={() => setProfilePreviewPlayer(null)}
        primaryAction={
          profilePreviewPlayer
            ? {
                label: 'View full profile',
                onPress: () => onViewPlayerProfile(profilePreviewPlayer),
              }
            : undefined
        }
        profileDetails={profilePreviewPlayer ? getPlayerPreviewPlayingDetails(profilePreviewPlayer) : undefined}
        rating={profilePreviewPlayer ? getPlayerRating(profilePreviewPlayer) : undefined}
        secondaryAction={
          profilePreviewPlayer && !currentPlayer.friendIds.includes(profilePreviewPlayer.id)
            ? {
                label: requestedIds.includes(profilePreviewPlayer.id) ? 'Requested' : 'Add friend',
                onPress: () => requestFriend(profilePreviewPlayer.id),
              }
            : undefined
        }
        visible={Boolean(profilePreviewPlayer)}
      />
    </View>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <AppText align="center" tone={active ? 'accent' : 'muted'} variant="button" weight="800">
        {label}
      </AppText>
    </Pressable>
  );
}

function NoResultsState({ onInvite }: { onInvite: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons color={colors.accentGoldDark} name="person-add-outline" size={24} />
      </View>
      <AppText align="center" variant="cardTitle" weight="900">
        No player found
      </AppText>
      <AppText align="center" tone="muted" variant="metadata" weight="600">
        Invite them to join TOCA and connect after signup.
      </AppText>
      <Pressable accessibilityRole="button" onPress={onInvite} style={styles.emptyButton}>
        <AppText align="center" tone="inverse" variant="button" weight="800">
          Invite to TOCA
        </AppText>
      </Pressable>
    </View>
  );
}

function InviteToTocaPanel({
  onShare,
  shareFeedback,
}: {
  onShare: () => void;
  shareFeedback: string | null;
}) {
  return (
    <View style={styles.invitePanel}>
      <LinearGradient
        colors={[colors.surfaceYellow, colors.surface, colors.surfaceAqua]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.inviteHero}
      >
        <View style={styles.sunBadge}>
          <Ionicons color={colors.accentGoldDark} name="sunny-outline" size={24} />
        </View>
        <View style={styles.inviteCopy}>
          <AppText variant="sectionHeading" weight="900">
            Invite a friend to TOCA
          </AppText>
          <AppText tone="muted" variant="uiBody" weight="600">
            They'll join TOCA first. You can invite them to games after they sign up.
          </AppText>
        </View>
      </LinearGradient>

      <View style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <Ionicons color={colors.accentSea} name="chatbubble-ellipses-outline" size={17} />
          <AppText variant="titleSmall" weight="900">
            Message preview
          </AppText>
        </View>
        <AppText tone="muted" variant="uiBody" weight="600">
          {inviteMessage}
        </AppText>
        <View style={styles.linkPill}>
          <Ionicons color={colors.primaryDark} name="link-outline" size={14} />
          <AppText numberOfLines={1} tone="accent" variant="metadata" weight="800">
            {inviteLink}
          </AppText>
        </View>
      </View>

      {shareFeedback ? (
        <View style={styles.feedbackBanner}>
          <Ionicons color={colors.primaryDark} name="checkmark-circle" size={18} />
          <AppText tone="accent" variant="metadata" weight="800">
            {shareFeedback}
          </AppText>
        </View>
      ) : null}

      <Pressable accessibilityRole="button" onPress={onShare} style={styles.shareButton}>
        <Ionicons color={colors.textOnGreen} name="share-social-outline" size={18} />
        <AppText align="center" tone="inverse" variant="button" weight="900">
          Share invite link
        </AppText>
      </Pressable>

      <AppText align="center" tone="muted" variant="metadata" weight="600">
        This link is for joining TOCA, not a specific game.
      </AppText>
    </View>
  );
}

function getPrimaryAction(
  player: Player,
  isFriend: boolean,
  isRequested: boolean,
  onAdd: () => void,
): PlayerRowAction | undefined {
  if (isFriend) {
    return undefined;
  }

  if (isRequested) {
    return {
      disabled: true,
      label: 'Requested',
      variant: 'muted',
    };
  }

  return {
    label: 'Add friend',
    onPress: onAdd,
  };
}

function getPreviewActions(player: Player, onViewProfile: () => void): PlayerAction[] {
  return [
    { icon: 'person-circle-outline', label: 'View full profile', onPress: onViewProfile },
    { destructive: true, icon: 'ban-outline', label: 'Report & block' },
  ];
}

function getPlayerRating(player: Player) {
  if (player.id === 'p3') {
    return '4.0';
  }

  if (player.id === 'p4') {
    return '3.6';
  }

  if (player.id === currentPlayer.id) {
    return '3.6';
  }

  return '3.2';
}

function getPlayerContext(player: Player) {
  if (currentPlayer.friendIds.includes(player.id)) {
    return `${player.area} regular`;
  }

  if (player.level === 'League') {
    return 'Usually Gordon evenings';
  }

  if (player.gamesPlayed > 20) {
    return '3 mutual games';
  }

  return 'B+ regular';
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 440,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 36,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  emptyButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.44)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xl,
    ...shadows.card,
  },
  feedbackBanner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.sm,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 42,
    justifyContent: 'center',
    width: 42,
    ...shadows.soft,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  inviteCopy: {
    gap: spacing.xs,
  },
  inviteHero: {
    borderColor: 'rgba(255, 255, 255, 0.76)',
    borderRadius: 26,
    borderWidth: 1,
    gap: spacing.lg,
    minHeight: 190,
    overflow: 'hidden',
    padding: spacing.xl,
    ...shadows.hero,
  },
  invitePanel: {
    gap: spacing.md,
  },
  linkPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  messageCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  messageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  playerStack: {
    gap: spacing.sm,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 14,
    lineHeight: 18,
    padding: 0,
  },
  sectionHeader: {
    gap: 2,
  },
  shareButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.soft,
  },
  sunBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.44)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  tabButtonActive: {
    backgroundColor: colors.surfaceMuted,
  },
  tabs: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    marginHorizontal: spacing.xl2,
    padding: 3,
    ...shadows.soft,
  },
});
