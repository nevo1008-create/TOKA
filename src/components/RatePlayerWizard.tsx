import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';
import { playerLevels, type Player, type PlayerLevel } from '../types';
import { AppText } from './AppText';

type RatePlayerWizardProps = {
  behaviorRating?: number;
  currentRank: PlayerLevel;
  isFriend: boolean;
  onAddFriend?: (player: Player) => void;
  onClose: () => void;
  onSubmitRating?: (rating: { behaviorRating: number; rank: PlayerLevel; targetPlayer: Player }) => boolean | void | Promise<boolean | void>;
  onViewProfile: (player: Player) => void;
  player: Player | null;
  visible: boolean;
};

type WizardStep = 'rank' | 'behavior' | 'done';

export function RatePlayerWizard({
  behaviorRating = 3.5,
  currentRank,
  isFriend,
  onAddFriend,
  onClose,
  onSubmitRating,
  onViewProfile,
  player,
  visible,
}: RatePlayerWizardProps) {
  const [step, setStep] = useState<WizardStep>('rank');
  const [rankIndex, setRankIndex] = useState(getRankIndex(currentRank));
  const [rating, setRating] = useState(behaviorRating);
  const [friendRequested, setFriendRequested] = useState(false);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const selectedRank = playerLevels[rankIndex];

  useEffect(() => {
    if (!visible) {
      return;
    }

    setStep('rank');
    setRankIndex(getRankIndex(currentRank));
    setRating(behaviorRating);
    setFriendRequested(false);
    setHasSubmittedRating(false);
    setIsSubmittingRating(false);
  }, [behaviorRating, currentRank, player?.id, visible]);

  function handleBack() {
    if (step === 'done') {
      if (hasSubmittedRating) {
        onClose();
        return;
      }

      setStep('behavior');
      return;
    }

    if (step === 'behavior') {
      setStep('rank');
      return;
    }

    onClose();
  }

  if (!player) {
    return null;
  }

  async function submitRating() {
    if (!player || isSubmittingRating) {
      return;
    }

    setIsSubmittingRating(true);

    try {
      const result = await onSubmitRating?.({
        behaviorRating: rating,
        rank: selectedRank,
        targetPlayer: player,
      });

      if (result === false) {
        return;
      }

      setHasSubmittedRating(true);
      setStep('done');
    } finally {
      setIsSubmittingRating(false);
    }
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.card}>
          <LinearGradient
            colors={['rgba(255, 246, 215, 0.95)', 'rgba(255, 249, 236, 0.95)', 'rgba(221, 245, 241, 0.72)']}
            locations={[0, 0.55, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sunGlow} />

          <View style={styles.header}>
            <Pressable accessibilityRole="button" onPress={handleBack} style={styles.iconButton}>
              <Ionicons color={colors.ink} name="chevron-back" size={19} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
              <AppText tone="muted" variant="metadata" weight="800">
                Cancel
              </AppText>
            </Pressable>
          </View>

          <PlayerSummary player={player} />

          {step === 'rank' ? (
            <RankStep
              currentRank={currentRank}
              onChange={setRankIndex}
              onContinue={() => setStep('behavior')}
              rankIndex={rankIndex}
              selectedRank={selectedRank}
            />
          ) : null}

          {step === 'behavior' ? (
            <BehaviorStep
              isSubmitting={isSubmittingRating}
              onChange={setRating}
              onContinue={submitRating}
              playerName={player.name}
              rating={rating}
            />
          ) : null}

          {step === 'done' ? (
            <DoneStep
              friendRequested={friendRequested}
              isFriend={isFriend}
              onAddFriend={() => {
                setFriendRequested(true);
                onAddFriend?.(player);
              }}
              onClose={onClose}
              onViewProfile={() => {
                onClose();
                onViewProfile(player);
              }}
              playerName={player.name}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function PlayerSummary({ player }: { player: Player }) {
  return (
    <View style={styles.playerSummary}>
      <View style={styles.avatar}>
        <AppText align="center" variant="cardTitle" weight="900">
          {player.initials}
        </AppText>
      </View>
      <View style={styles.playerCopy}>
        <AppText numberOfLines={1} variant="title" weight="900">
          {player.name}
        </AppText>
        <AppText tone="muted" variant="metadata" weight="700">
          Rating this game experience
        </AppText>
      </View>
    </View>
  );
}

function RankStep({
  currentRank,
  onChange,
  onContinue,
  rankIndex,
  selectedRank,
}: {
  currentRank: PlayerLevel;
  onChange: (index: number) => void;
  onContinue: () => void;
  rankIndex: number;
  selectedRank: PlayerLevel;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.questionBlock}>
        <AppText align="center" variant="sectionHeading" weight="900">
          How would you rank this player?
        </AppText>
        <AppText align="center" tone="muted" variant="metadata" weight="600">
          Move the marker to the rank that best matches their game today.
        </AppText>
      </View>

      <View style={styles.rankCard}>
        <View style={styles.rankHeader}>
          <View>
            <AppText tone="muted" variant="metadata" weight="700">
              Current rank
            </AppText>
            <View style={styles.currentRankPill}>
              <AppText variant="button" weight="900">
                {currentRank}
              </AppText>
            </View>
          </View>
          <View style={styles.selectedRank}>
            <AppText align="center" tone="muted" variant="metadata" weight="700">
              Your pick
            </AppText>
            <AppText align="center" variant="heroTitle" weight="900">
              {selectedRank}
            </AppText>
          </View>
        </View>

        <SingleRankBar onChange={onChange} rankIndex={rankIndex} />

        <View style={styles.rankEnds}>
          <AppText tone="muted" variant="caption" weight="800">
            A-
          </AppText>
          <AppText tone="muted" variant="caption" weight="800">
            League
          </AppText>
        </View>
      </View>

      <WizardButton label="Continue" onPress={onContinue} />
    </View>
  );
}

function SingleRankBar({ onChange, rankIndex }: { onChange: (index: number) => void; rankIndex: number }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const rankIndexRef = useRef(rankIndex);
  const trackWidthRef = useRef(trackWidth);
  const dragStartIndex = useRef(rankIndex);
  const percent = getRankPercent(rankIndex);
  rankIndexRef.current = rankIndex;
  trackWidthRef.current = trackWidth;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          dragStartIndex.current = rankIndexRef.current;
          updateFromX(event.nativeEvent.locationX);
        },
        onPanResponderMove: (_event, gestureState) => {
          const availableTrackWidth = trackWidthRef.current;

          if (!availableTrackWidth) {
            return;
          }

          const stepWidth = availableTrackWidth / (playerLevels.length - 1);
          const nextIndex = clampRankIndex(dragStartIndex.current + Math.round(gestureState.dx / stepWidth));

          if (nextIndex !== rankIndexRef.current) {
            onChange(nextIndex);
          }
        },
      }),
    [onChange],
  );

  function updateFromX(x: number) {
    const availableTrackWidth = trackWidthRef.current;

    if (!availableTrackWidth) {
      return;
    }

    const clampedX = Math.max(0, Math.min(x, availableTrackWidth));
    onChange(clampRankIndex(Math.round((clampedX / availableTrackWidth) * (playerLevels.length - 1))));
  }

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View {...responder.panHandlers} onLayout={handleLayout} style={styles.rankBar}>
      <View style={styles.rankTrackLine} />
      <View pointerEvents="none" style={styles.rankTicks}>
        {playerLevels.map((level) => (
          <View key={level} style={styles.rankTick} />
        ))}
      </View>
      <View style={[styles.rankTrackFill, { width: `${percent}%` }]} />
      <View style={[styles.rankThumbTouchArea, { left: `${percent}%` }]}>
        <View style={styles.rankThumb}>
          <Ionicons color={colors.textOnGreen} name="football-outline" size={13} />
        </View>
      </View>
    </View>
  );
}

function BehaviorStep({
  isSubmitting,
  onChange,
  onContinue,
  playerName,
  rating,
}: {
  isSubmitting: boolean;
  onChange: (rating: number) => void;
  onContinue: () => void;
  playerName: string;
  rating: number;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.questionBlock}>
        <AppText align="center" variant="sectionHeading" weight="900">
          How would you rate {playerName}&apos;s behavior?
        </AppText>
        <AppText align="center" tone="muted" variant="metadata" weight="600">
          Tap the left or right side of a star for half-point precision.
        </AppText>
      </View>

      <View style={styles.starsCard}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarControl key={star} onChange={onChange} rating={rating} star={star} />
          ))}
        </View>
        <View style={styles.ratingReadout}>
          <Ionicons color={colors.accentGoldDark} name="star" size={15} />
          <AppText tone="primary" variant="button" weight="900">
            {rating.toFixed(1)} / 5
          </AppText>
        </View>
      </View>

      <WizardButton disabled={isSubmitting} label={isSubmitting ? 'Saving...' : 'Submit rating'} onPress={onContinue} />
    </View>
  );
}

function StarControl({
  onChange,
  rating,
  star,
}: {
  onChange: (rating: number) => void;
  rating: number;
  star: number;
}) {
  return (
    <View style={styles.starControl}>
      <Ionicons color={colors.accentGoldDark} name={getStarIcon(star, rating)} size={33} />
      <Pressable
        accessibilityLabel={`Rate ${star - 0.5} stars`}
        accessibilityRole="button"
        onPress={() => onChange(star - 0.5)}
        style={[styles.starHalfHitbox, styles.starLeftHitbox]}
      />
      <Pressable
        accessibilityLabel={`Rate ${star} stars`}
        accessibilityRole="button"
        onPress={() => onChange(star)}
        style={[styles.starHalfHitbox, styles.starRightHitbox]}
      />
    </View>
  );
}

function DoneStep({
  friendRequested,
  isFriend,
  onAddFriend,
  onClose,
  onViewProfile,
  playerName,
}: {
  friendRequested: boolean;
  isFriend: boolean;
  onAddFriend: () => void;
  onClose: () => void;
  onViewProfile: () => void;
  playerName: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.doneBadge}>
        <Ionicons color={colors.textOnGreen} name="checkmark" size={30} />
      </View>
      <View style={styles.questionBlock}>
        <AppText align="center" variant="sectionHeading" weight="900">
          Thank you for rating {playerName}
        </AppText>
        <AppText align="center" tone="muted" variant="metadata" weight="600">
          Your feedback helps keep TOCA games fair, friendly, and well matched.
        </AppText>
      </View>

      <View style={styles.doneActions}>
        <WizardButton label="View full profile" onPress={onViewProfile} />
        {!isFriend ? (
          <Pressable
            accessibilityRole="button"
            disabled={friendRequested}
            onPress={onAddFriend}
            style={[styles.secondaryWideButton, friendRequested && styles.disabledButton]}
          >
            <AppText align="center" tone="accent" variant="button" weight="800">
              {friendRequested ? 'Friend request sent' : 'Add friend'}
            </AppText>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeWideButton}>
          <AppText align="center" tone="muted" variant="button" weight="800">
            Close
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function WizardButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.primaryWideButton, disabled && styles.disabledButton]}>
      <AppText align="center" tone="inverse" variant="button" weight="900">
        {label}
      </AppText>
    </Pressable>
  );
}

function getRankIndex(rank: PlayerLevel) {
  const index = playerLevels.findIndex((level) => level === rank);

  return index >= 0 ? index : 0;
}

function getRankPercent(index: number) {
  return (index / (playerLevels.length - 1)) * 100;
}

function clampRankIndex(index: number) {
  return Math.min(Math.max(index, 0), playerLevels.length - 1);
}

function getStarIcon(star: number, rating: number): keyof typeof Ionicons.glyphMap {
  if (rating >= star) {
    return 'star';
  }

  if (rating >= star - 0.5) {
    return 'star-half';
  }

  return 'star-outline';
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  backdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.16)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl2,
  },
  cancelButton: {
    alignItems: 'center',
    borderRadius: radius.round,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    ...shadows.hero,
  },
  closeWideButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  currentRankPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    marginTop: 5,
    minHeight: 34,
    minWidth: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  disabledButton: {
    opacity: 0.72,
  },
  doneActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  doneBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: radius.round,
    borderWidth: 3,
    height: 62,
    justifyContent: 'center',
    width: 62,
    ...shadows.soft,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
    ...shadows.soft,
  },
  playerCopy: {
    flex: 1,
    minWidth: 0,
  },
  playerSummary: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    zIndex: 2,
  },
  primaryWideButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 50,
    ...shadows.soft,
  },
  questionBlock: {
    gap: spacing.xs,
  },
  rankBar: {
    height: 42,
    justifyContent: 'center',
    marginHorizontal: 13,
    position: 'relative',
  },
  rankCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderColor: colors.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  rankEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankThumb: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
    ...shadows.soft,
  },
  rankThumbTouchArea: {
    alignItems: 'center',
    cursor: 'pointer',
    height: 42,
    justifyContent: 'center',
    marginLeft: -21,
    position: 'absolute',
    width: 42,
    zIndex: 3,
  },
  rankTick: {
    backgroundColor: 'rgba(21, 153, 71, 0.24)',
    borderRadius: radius.round,
    height: 8,
    width: 2,
  },
  rankTicks: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 12,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  rankTrackFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 6,
    left: 0,
    position: 'absolute',
    zIndex: 1,
  },
  rankTrackLine: {
    backgroundColor: 'rgba(216, 232, 212, 0.95)',
    borderRadius: radius.round,
    height: 6,
  },
  ratingReadout: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.46)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  secondaryWideButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  selectedRank: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: 'rgba(246, 201, 69, 0.42)',
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 104,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  starControl: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 45,
  },
  starHalfHitbox: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: '50%',
  },
  starLeftHitbox: {
    left: 0,
  },
  starRightHitbox: {
    right: 0,
  },
  starsCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderColor: colors.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
  },
  starsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  step: {
    gap: spacing.lg,
    zIndex: 2,
  },
  sunGlow: {
    backgroundColor: 'rgba(246, 201, 69, 0.28)',
    borderRadius: radius.round,
    height: 120,
    position: 'absolute',
    right: -40,
    top: 86,
    width: 120,
  },
});
