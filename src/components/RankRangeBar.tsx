import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { colors, radius, spacing } from '../theme';
import { playerLevels, type PlayerLevel } from '../types';
import { AppText } from './AppText';

type RankRangeBarProps = {
  fromIndex: number;
  labelTapMode?: 'nearestHandle' | 'exact';
  onFromChange: (index: number) => void;
  onToChange: (index: number) => void;
  toIndex: number;
};

type RankBarProps = {
  onSelect: (rank: PlayerLevel) => void;
  selectedRank: PlayerLevel;
};

export const rankOptions = [...playerLevels];
const trackSideInset = 11;

export function RankRangeBar({ fromIndex, labelTapMode = 'nearestHandle', onFromChange, onToChange, toIndex }: RankRangeBarProps) {
  const [surfaceWidth, setSurfaceWidth] = useState(0);
  const activeHandle = useRef<'from' | 'to'>('to');
  const currentFromIndex = useRef(fromIndex);
  const currentToIndex = useRef(toIndex);
  const dragStartFromIndex = useRef(fromIndex);
  const dragStartToIndex = useRef(toIndex);
  const isLabelDragging = useRef(false);
  const isPointerDragging = useRef(false);
  const surfaceWidthRef = useRef(surfaceWidth);
  const fromPercent = getRankPercent(fromIndex);
  const toPercent = getRankPercent(toIndex);
  const isCollapsedRange = fromIndex === toIndex;
  currentFromIndex.current = fromIndex;
  currentToIndex.current = toIndex;
  surfaceWidthRef.current = surfaceWidth;
  const rangeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: (event) => {
          updateRangeFromLocation(event.nativeEvent.locationX, true);
        },
        onPanResponderMove: (event) => {
          updateRangeFromLocation(event.nativeEvent.locationX, false);
        },
        onPanResponderTerminationRequest: () => false,
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
      }),
    [onFromChange, onToChange],
  );
  const fromHandleResponder = useMemo(() => createHandleResponder('from'), [onFromChange, onToChange]);
  const toHandleResponder = useMemo(() => createHandleResponder('to'), [onFromChange, onToChange]);

  function handleSurfaceLayout(event: LayoutChangeEvent) {
    setSurfaceWidth(event.nativeEvent.layout.width);
  }

  function updateRangeFromLocation(locationX: number, shouldChooseHandle: boolean) {
    const nextIndex = getRankIndexFromLocation(locationX, surfaceWidthRef.current);

    updateRangeFromIndex(nextIndex, shouldChooseHandle);
  }

  function updateRangeFromIndex(nextIndex: number, shouldChooseHandle: boolean) {
    if (shouldChooseHandle) {
      activeHandle.current = getNearestHandle(nextIndex, currentFromIndex.current, currentToIndex.current);
    }

    if (activeHandle.current === 'from') {
      const nextFromIndex = clampRankIndex(nextIndex, 0, currentToIndex.current);

      if (nextFromIndex !== currentFromIndex.current) {
        onFromChange(nextFromIndex);
      }
      return;
    }

    const nextToIndex = clampRankIndex(nextIndex, currentFromIndex.current, rankOptions.length - 1);

    if (nextToIndex !== currentToIndex.current) {
      onToChange(nextToIndex);
    }
  }

  function updateExactRankFromIndex(nextIndex: number) {
    if (nextIndex !== currentFromIndex.current) {
      onFromChange(nextIndex);
    }

    if (nextIndex !== currentToIndex.current) {
      onToChange(nextIndex);
    }
  }

  function beginHandleDrag(handle: 'from' | 'to') {
    activeHandle.current = handle;
    dragStartFromIndex.current = currentFromIndex.current;
    dragStartToIndex.current = currentToIndex.current;
  }

  function updateActiveHandleFromDelta(deltaX: number) {
    const usableWidth = Math.max(surfaceWidthRef.current - trackSideInset * 2, 1);
    const deltaIndex = Math.round((deltaX / usableWidth) * (rankOptions.length - 1));

    if (activeHandle.current === 'from') {
      const nextFromIndex = clampRankIndex(dragStartFromIndex.current + deltaIndex, 0, currentToIndex.current);

      if (nextFromIndex !== currentFromIndex.current) {
        onFromChange(nextFromIndex);
      }
      return;
    }

    const nextToIndex = clampRankIndex(dragStartToIndex.current + deltaIndex, currentFromIndex.current, rankOptions.length - 1);

    if (nextToIndex !== currentToIndex.current) {
      onToChange(nextToIndex);
    }
  }

  function createHandleResponder(handle: 'from' | 'to') {
    return PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        beginHandleDrag(handle);
      },
      onPanResponderMove: (_event, gestureState) => {
        updateActiveHandleFromDelta(gestureState.dx);
      },
      onPanResponderTerminationRequest: () => false,
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
    });
  }

  function updateRangeFromPointerEvent(event: { currentTarget?: unknown; nativeEvent?: { clientX?: number; locationX?: number }; preventDefault?: () => void }, shouldChooseHandle: boolean) {
    const currentTarget = event.currentTarget as { getBoundingClientRect?: () => { left: number } } | undefined;
    const clientX = event.nativeEvent?.clientX;

    if (typeof clientX === 'number' && currentTarget?.getBoundingClientRect) {
      updateRangeFromLocation(clientX - currentTarget.getBoundingClientRect().left, shouldChooseHandle);
      return;
    }

    if (typeof event.nativeEvent?.locationX === 'number') {
      updateRangeFromLocation(event.nativeEvent.locationX, shouldChooseHandle);
    }
  }

  const webPointerHandlers = {
    onPointerDown: (event: { currentTarget?: unknown; nativeEvent?: { clientX?: number; locationX?: number }; preventDefault?: () => void }) => {
      isPointerDragging.current = true;
      event.preventDefault?.();
      updateRangeFromPointerEvent(event, true);
    },
    onPointerLeave: () => {
      isPointerDragging.current = false;
    },
    onPointerMove: (event: { currentTarget?: unknown; nativeEvent?: { clientX?: number; locationX?: number }; preventDefault?: () => void }) => {
      if (!isPointerDragging.current) {
        return;
      }

      event.preventDefault?.();
      updateRangeFromPointerEvent(event, false);
    },
    onPointerUp: () => {
      isPointerDragging.current = false;
    },
  } as Record<string, unknown>;
  const fromHandlePointerHandlers = getHandlePointerHandlers('from');
  const toHandlePointerHandlers = getHandlePointerHandlers('to');

  function getHandlePointerHandlers(handle: 'from' | 'to') {
    return {
      onPointerDown: (event: {
        preventDefault?: () => void;
        stopPropagation?: () => void;
      }) => {
        isPointerDragging.current = true;
        beginHandleDrag(handle);
        event.preventDefault?.();
        event.stopPropagation?.();
      },
      onPointerUp: (event: { stopPropagation?: () => void }) => {
        isPointerDragging.current = false;
        event.stopPropagation?.();
      },
    } as Record<string, unknown>;
  }

  return (
    <View style={styles.rangeWrap}>
      <View {...webPointerHandlers} {...rangeResponder.panHandlers} onLayout={handleSurfaceLayout} style={styles.rangeTouchSurface}>
        <View style={styles.rankBar}>
          <View style={styles.trackLine} />
          <View pointerEvents="none" style={styles.ticks}>
            {rankOptions.map((rank) => (
              <View key={rank} style={styles.tick} />
            ))}
          </View>
          <View
            pointerEvents="none"
            style={[
              styles.trackFill,
              {
                left: `${fromPercent}%`,
                right: `${100 - toPercent}%`,
              },
            ]}
          />
          <View
            {...fromHandlePointerHandlers}
            {...fromHandleResponder.panHandlers}
            style={[
              styles.thumbTouchArea,
              {
                left: `${fromPercent}%`,
                marginLeft: isCollapsedRange ? -25 : -17,
                zIndex: isCollapsedRange ? 4 : 3,
              },
            ]}
          >
            <View style={styles.thumb} />
          </View>
          <View
            {...toHandlePointerHandlers}
            {...toHandleResponder.panHandlers}
            style={[
              styles.thumbTouchArea,
              {
                left: `${toPercent}%`,
                marginLeft: isCollapsedRange ? -9 : -17,
                zIndex: isCollapsedRange ? 5 : 3,
              },
            ]}
          >
            <View style={[styles.thumb, styles.thumbRight]} />
          </View>
        </View>

        <View style={styles.rankLabels}>
          {rankOptions.map((rank, index) => {
            const isSelected = index === fromIndex || index === toIndex;
            const isInRange = index >= fromIndex && index <= toIndex;
            const shouldSelectExactRank = labelTapMode === 'exact';

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isInRange }}
                key={rank}
                onHoverIn={() => {
                  if (!shouldSelectExactRank && isLabelDragging.current) {
                    updateRangeFromIndex(index, false);
                  }
                }}
                onPress={() => {
                  if (shouldSelectExactRank) {
                    updateExactRankFromIndex(index);
                    return;
                  }

                  updateRangeFromIndex(index, true);
                }}
                onPressIn={() => {
                  if (!shouldSelectExactRank) {
                    isLabelDragging.current = true;
                    updateRangeFromIndex(index, true);
                  }
                }}
                onPressOut={() => {
                  isLabelDragging.current = false;
                }}
                style={[
                  styles.rankLabelButton,
                  index === 0 && styles.rankLabelButtonFirst,
                  index === rankOptions.length - 1 && styles.rankLabelButtonLast,
                ]}
              >
                <AppText
                  align="center"
                  numberOfLines={1}
                  style={[
                    styles.rankLabel,
                    index === rankOptions.length - 1 && styles.rankLabelLeague,
                    isSelected && styles.rankLabelSelected,
                    isInRange && styles.rankLabelInRange,
                  ]}
                  tone={isInRange ? 'accent' : 'subtle'}
                  variant="caption"
                  weight={isSelected ? '900' : '700'}
                >
                  {rank}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function RankBar({ onSelect, selectedRank }: RankBarProps) {
  return (
    <View style={styles.singleWrap}>
      <View style={styles.singleTrackLine} />
      <View style={styles.singleOptions}>
        {rankOptions.map((rank) => {
          const isSelected = rank === selectedRank;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={rank}
              onPress={() => onSelect(rank)}
              style={[styles.singleOption, isSelected && styles.singleOptionSelected]}
            >
              <AppText align="center" tone={isSelected ? 'accent' : 'muted'} variant="caption" weight="900">
                {rank}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function formatRankRange(fromIndex: number, toIndex: number) {
  const from = rankOptions[fromIndex];
  const to = rankOptions[toIndex];

  return from === to ? from : `${from}/${to}`;
}

export function getRankIndex(rank: PlayerLevel) {
  return rankOptions.indexOf(rank);
}

export function clampRankIndex(index: number, min: number, max: number) {
  return Math.min(Math.max(index, min), max);
}

function getNearestHandle(index: number, fromIndex: number, toIndex: number): 'from' | 'to' {
  if (fromIndex === toIndex) {
    return index <= fromIndex ? 'from' : 'to';
  }

  return Math.abs(index - fromIndex) <= Math.abs(index - toIndex) ? 'from' : 'to';
}

function getRankIndexFromLocation(locationX: number, surfaceWidth: number) {
  const usableWidth = Math.max(surfaceWidth - trackSideInset * 2, 1);
  const boundedLocation = Math.min(Math.max(locationX - trackSideInset, 0), usableWidth);

  return clampRankIndex(Math.round((boundedLocation / usableWidth) * (rankOptions.length - 1)), 0, rankOptions.length - 1);
}

function getRankPercent(index: number) {
  return (index / (rankOptions.length - 1)) * 100;
}

const styles = StyleSheet.create({
  rankBar: {
    height: 34,
    justifyContent: 'center',
    marginHorizontal: 11,
    position: 'relative',
  },
  rankLabel: {
    flex: 1,
    fontSize: 7,
    lineHeight: 10,
  },
  rankLabelButtonFirst: {
    alignItems: 'flex-start',
  },
  rankLabelButtonLast: {
    alignItems: 'flex-end',
    flex: 1.35,
  },
  rankLabelInRange: {
    color: colors.accentLime,
  },
  rankLabelLeague: {
    fontSize: 6.5,
  },
  rankLabelSelected: {
    color: colors.primaryDark,
  },
  rankLabels: {
    flexDirection: 'row',
    gap: 0,
  },
  rankLabelButton: {
    flex: 1,
    minHeight: 20,
    justifyContent: 'center',
    minWidth: 0,
  },
  rangeWrap: {
    gap: spacing.xs,
  },
  rangeTouchSurface: {
    gap: spacing.xs,
  },
  singleOption: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    minWidth: 34,
    paddingHorizontal: 6,
  },
  singleOptionSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  singleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  singleTrackLine: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 4,
  },
  singleWrap: {
    gap: spacing.sm,
  },
  thumb: {
    backgroundColor: colors.primary,
    borderColor: colors.surfaceRaised,
    borderRadius: radius.round,
    borderWidth: 2,
    height: 18,
    width: 18,
  },
  thumbRight: {
    backgroundColor: colors.accentGoldDark,
  },
  thumbTouchArea: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    width: 34,
  },
  tick: {
    backgroundColor: 'rgba(21, 153, 71, 0.26)',
    borderRadius: radius.round,
    height: 8,
    width: 2,
  },
  ticks: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 12,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  trackFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 5,
    position: 'absolute',
    zIndex: 1,
  },
  trackLine: {
    backgroundColor: 'rgba(216, 232, 212, 0.9)',
    borderRadius: radius.round,
    height: 5,
  },
});
