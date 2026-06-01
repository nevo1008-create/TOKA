import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import type { CreateLobbyDraft } from '../features/lobbies/lobbyCreateTypes';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { GenderRule, LobbyVisibility, Player, PlayerLevel, RankRuleType } from '../types';

type CreateLobbyScreenProps = {
  notificationCount: number;
  onCancel: () => void;
  onCreateLobby: (draft: CreateLobbyDraft) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  player: Player;
};

type RankPickerField = 'exact' | 'max' | 'min';

export function CreateLobbyScreen({
  notificationCount,
  onCancel,
  onCreateLobby,
  onOpenMenu,
  onOpenNotifications,
  player,
}: CreateLobbyScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('Sunset Footvolley');
  const [meetingPoint, setMeetingPoint] = useState('Meet near the north workout area by the showers');
  const [playerCounts, setPlayerCounts] = useState<number[]>([4, 6]);
  const [rankRuleType, setRankRuleType] = useState<RankRuleType>('range');
  const [rankMin, setRankMin] = useState<PlayerLevel>('B-');
  const [rankMax, setRankMax] = useState<PlayerLevel>('A');
  const [rankExact, setRankExact] = useState<PlayerLevel>('B+');
  const [rankPickerField, setRankPickerField] = useState<RankPickerField | null>(null);
  const [genderRule, setGenderRule] = useState<GenderRule>('everyone');
  const [visibility, setVisibility] = useState<LobbyVisibility>('public');
  const isTitleValid = title.trim().length > 2;
  const isMeetingPointValid = meetingPoint.trim().length > 4;
  const isRankRangeValid = rankRuleType !== 'range' || rankOptions.indexOf(rankMin) <= rankOptions.indexOf(rankMax);
  const maxPlayers = Math.max(...playerCounts);
  const canContinue = isTitleValid && isMeetingPointValid;
  const canCreate = canContinue && isRankRangeValid && playerCounts.length > 0;

  function createLobby() {
    if (!canCreate) {
      return;
    }

    onCreateLobby({
      genderRule,
      locationCity: 'Tel Aviv',
      locationName: 'Gordon Beach',
      maxPlayers,
      meetingPoint: meetingPoint.trim(),
      playerCounts,
      rankExact: rankRuleType === 'exact' ? rankExact : undefined,
      rankMax: rankRuleType === 'range' ? rankMax : undefined,
      rankMin: rankRuleType === 'range' ? rankMin : undefined,
      rankRuleType,
      startsAt: defaultStartsAt,
      title: title.trim(),
      visibility,
    });
  }

  function togglePlayerCount(count: number) {
    setPlayerCounts((current) => {
      if (current.includes(count)) {
        return current.length === 1 ? current : current.filter((item) => item !== count);
      }

      return [...current, count].sort((first, second) => first - second);
    });
  }

  function selectRank(rank: PlayerLevel) {
    if (rankPickerField === 'min') {
      setRankMin(rank);
    } else if (rankPickerField === 'max') {
      setRankMax(rank);
    } else if (rankPickerField === 'exact') {
      setRankExact(rank);
    }

    setRankPickerField(null);
  }

  function getSelectedRank() {
    if (rankPickerField === 'min') {
      return rankMin;
    }

    if (rankPickerField === 'max') {
      return rankMax;
    }

    return rankExact;
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.42, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.22, y: 0.72 }}
        style={styles.backgroundGlow}
      />
      <HomeHeader
        compact
        notificationCount={notificationCount}
        onMenuPress={onOpenMenu}
        onNotificationsPress={onOpenNotifications}
        player={player}
      />

      <View style={styles.content}>
        {step === 1 ? (
          <>
            <View style={styles.wizardTopSpacer} />
            <WhenWhereStep
              meetingPoint={meetingPoint}
              onChangeMeetingPoint={setMeetingPoint}
              onChangeTitle={setTitle}
              title={title}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Pressable accessibilityRole="button" onPress={() => setStep(1)} style={styles.wizardBackButton}>
              <Ionicons color={colors.ink} name="chevron-back" size={20} />
            </Pressable>
            <AccessRulesStep
              genderRule={genderRule}
              onChangeGenderRule={setGenderRule}
              onChangeRankRuleType={setRankRuleType}
              onChangeVisibility={setVisibility}
              onOpenRankPicker={setRankPickerField}
              onTogglePlayerCount={togglePlayerCount}
              playerCounts={playerCounts}
              rankExact={rankExact}
              rankMax={rankMax}
              rankMin={rankMin}
              rankRuleType={rankRuleType}
              visibility={visibility}
            />
          </>
        ) : null}

        {!canContinue && step === 1 ? (
          <AppText align="center" tone="danger" variant="metadata" weight="700">
            Add a clear title and meeting point before continuing.
          </AppText>
        ) : null}

        {!isRankRangeValid && step === 2 ? (
          <AppText align="center" tone="danger" variant="metadata" weight="700">
            Min rank must be lower than or equal to max rank.
          </AppText>
        ) : null}

        <View style={styles.footerActions}>
          <PrimaryActionButton
            disabled={step === 1 ? !canContinue : !canCreate}
            label={step === 1 ? 'Continue' : 'Create game'}
            onPress={step === 1 ? () => setStep(2) : createLobby}
          />
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancelButton}>
            <AppText align="center" tone="muted" variant="bodySmall" weight="700">
              Cancel
            </AppText>
          </Pressable>
          <WizardDots step={step} />
        </View>
      </View>
      <RankPickerSheet
        onClose={() => setRankPickerField(null)}
        onSelect={selectRank}
        selectedRank={getSelectedRank()}
        title={getRankPickerTitle(rankPickerField)}
        visible={Boolean(rankPickerField)}
      />
    </View>
  );
}

function WhenWhereStep({
  meetingPoint,
  onChangeMeetingPoint,
  onChangeTitle,
  title,
}: {
  meetingPoint: string;
  onChangeMeetingPoint: (value: string) => void;
  onChangeTitle: (value: string) => void;
  title: string;
}) {
  return (
    <Section icon="calendar-outline" title="When and where">
      <Field label="Game title">
        <TextInput
          onChangeText={onChangeTitle}
          placeholder="Game title"
          placeholderTextColor={colors.subtle}
          style={styles.textInput}
          value={title}
        />
      </Field>

      <View style={styles.twoColumn}>
        <Field label="Date" style={styles.fieldInRow}>
          <InputShell icon="calendar-outline" value="Tue, Jun 9" withChevron />
        </Field>
        <Field label="Start time" style={styles.fieldInRow}>
          <InputShell icon="time-outline" value="18:30" withChevron />
        </Field>
      </View>

      <Field label="Location">
        <InputShell icon="location" value="Gordon Beach, Tel Aviv" withChevron />
      </Field>

      <Field label="Meeting point">
        <TextInput
          multiline
          onChangeText={onChangeMeetingPoint}
          placeholder="Where exactly should players meet?"
          placeholderTextColor={colors.subtle}
          style={styles.textArea}
          value={meetingPoint}
        />
      </Field>
    </Section>
  );
}

function AccessRulesStep({
  genderRule,
  onChangeGenderRule,
  onChangeRankRuleType,
  onChangeVisibility,
  onOpenRankPicker,
  onTogglePlayerCount,
  playerCounts,
  rankExact,
  rankMax,
  rankMin,
  rankRuleType,
  visibility,
}: {
  genderRule: GenderRule;
  onChangeGenderRule: (value: GenderRule) => void;
  onChangeRankRuleType: (value: RankRuleType) => void;
  onChangeVisibility: (value: LobbyVisibility) => void;
  onOpenRankPicker: (field: RankPickerField) => void;
  onTogglePlayerCount: (count: number) => void;
  playerCounts: number[];
  rankExact: PlayerLevel;
  rankMax: PlayerLevel;
  rankMin: PlayerLevel;
  rankRuleType: RankRuleType;
  visibility: LobbyVisibility;
}) {
  return (
    <Section icon="options-outline" title="Access rules">
      <Field label="Players">
        <PlayerCountSelector onToggle={onTogglePlayerCount} selectedCounts={playerCounts} />
      </Field>

      <Field label="Rank policy">
        <SegmentedControl
          compact
          onSelect={(option) => {
            if (option === 'Any rank') {
              onChangeRankRuleType('any');
            } else if (option === 'Exact rank') {
              onChangeRankRuleType('exact');
            } else {
              onChangeRankRuleType('range');
            }
          }}
          options={['Any rank', 'Exact rank', 'Range']}
          selected={getRankRuleLabel(rankRuleType)}
        />
      </Field>

      {rankRuleType === 'range' ? (
        <View style={styles.twoColumn}>
          <Field label="Min rank" style={styles.fieldInRow}>
            <InputShell onPress={() => onOpenRankPicker('min')} value={rankMin} withChevron />
          </Field>
          <Field label="Max rank" style={styles.fieldInRow}>
            <InputShell onPress={() => onOpenRankPicker('max')} value={rankMax} withChevron />
          </Field>
        </View>
      ) : null}

      {rankRuleType === 'exact' ? (
        <Field label="Exact rank">
          <InputShell onPress={() => onOpenRankPicker('exact')} value={rankExact} withChevron />
        </Field>
      ) : null}

      <Field label="Gender">
        <SegmentedControl
          onSelect={(option) => {
            if (option === 'Men') {
              onChangeGenderRule('male');
            } else if (option === 'Women') {
              onChangeGenderRule('female');
            } else {
              onChangeGenderRule('everyone');
            }
          }}
          options={['Everyone', 'Men', 'Women']}
          selected={getGenderLabel(genderRule)}
        />
      </Field>

      <Field label="Join policy">
        <View style={styles.policyGrid}>
          <PolicyCard
            description="Anyone can join instantly"
            icon="earth-outline"
            onPress={() => onChangeVisibility('public')}
            selected={visibility === 'public'}
            title="Public"
          />
          <PolicyCard
            description="Invite or approval only"
            icon="lock-closed-outline"
            onPress={() => onChangeVisibility('password')}
            selected={visibility === 'password'}
            title="Private"
          />
        </View>
      </Field>
    </Section>
  );
}

function PlayerCountSelector({
  onToggle,
  selectedCounts,
}: {
  onToggle: (count: number) => void;
  selectedCounts: number[];
}) {
  return (
    <View style={styles.playerCountControl}>
      {playerCountOptions.map((count) => {
        const isSelected = selectedCounts.includes(count);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={count}
            onPress={() => onToggle(count)}
            style={[styles.playerCountSegment, isSelected && styles.playerCountSegmentSelected]}
          >
            <AppText align="center" tone={isSelected ? 'accent' : 'muted'} variant="chip" weight="800">
              {count}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function RankPickerSheet({
  onClose,
  onSelect,
  selectedRank,
  title,
  visible,
}: {
  onClose: () => void;
  onSelect: (rank: PlayerLevel) => void;
  selectedRank: PlayerLevel;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.rankModalRoot}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.rankModalBackdrop} />
        <View style={styles.rankSheet}>
          <View style={styles.rankSheetHeader}>
            <View>
              <AppText variant="uiBody" weight="800">
                {title}
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                Tap a rank to set the rule.
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.rankCloseButton}>
              <Ionicons color={colors.muted} name="close" size={18} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.rankGrid} showsVerticalScrollIndicator={false}>
            {rankOptions.map((rank) => {
              const isSelected = rank === selectedRank;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={rank}
                  onPress={() => onSelect(rank)}
                  style={[styles.rankOption, isSelected && styles.rankOptionSelected]}
                >
                  <AppText
                    align="center"
                    tone={isSelected ? 'accent' : 'primary'}
                    variant="button"
                    weight="800"
                  >
                    {rank}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PrimaryActionButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.createButton, disabled && styles.createButtonDisabled]}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.createButtonFill}
      >
        <AppText align="center" tone="inverse" variant="button" weight="800">
          {label}
        </AppText>
        <Ionicons color={colors.textOnGreen} name="arrow-forward" size={18} />
      </LinearGradient>
    </Pressable>
  );
}

function WizardDots({ step }: { step: 1 | 2 }) {
  return (
    <View style={styles.wizardDots}>
      <View style={[styles.wizardDot, step === 1 && styles.wizardDotActive]} />
      <View style={[styles.wizardDot, step === 2 && styles.wizardDotActive]} />
    </View>
  );
}

function Section({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionIcon}>
          <Ionicons color={colors.accentLime} name={icon} size={15} />
        </View>
        <AppText style={styles.sectionTitle} variant="sectionHeading" weight="800">
          {title}
        </AppText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ children, label, style }: { children: ReactNode; label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.field, style]}>
      <AppText tone="muted" variant="metadata" weight="700">
        {label}
      </AppText>
      {children}
    </View>
  );
}

function InputShell({
  icon,
  onPress,
  value,
  withChevron = false,
  withClear = false,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  value: string;
  withChevron?: boolean;
  withClear?: boolean;
}) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.inputShell}>
      {icon ? <Ionicons color={colors.accentSea} name={icon} size={15} style={styles.inputIcon} /> : null}
      <AppText numberOfLines={1} style={styles.inputText} variant="bodySmall" weight="700">
        {value}
      </AppText>
      {withClear ? <Ionicons color={colors.muted} name="close-circle-outline" size={16} /> : null}
      {withChevron ? <Ionicons color={colors.muted} name="chevron-down" size={15} /> : null}
    </Pressable>
  );
}

function SegmentedControl({
  compact = false,
  onSelect,
  options,
  selected,
}: {
  compact?: boolean;
  onSelect?: (option: string) => void;
  options: string[];
  selected: string;
}) {
  return (
    <View style={[styles.segmentedControl, compact && styles.segmentedControlCompact]}>
      {options.map((option) => {
        const isSelected = option === selected;

        return (
          <Pressable
            accessibilityRole="button"
            key={option}
            onPress={() => onSelect?.(option)}
            style={[styles.segment, compact && styles.segmentCompact, isSelected && styles.segmentSelected]}
          >
            <AppText
              align="center"
              numberOfLines={1}
              tone={isSelected ? 'accent' : 'muted'}
              variant="chip"
              weight="800"
            >
              {option}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function PolicyCard({
  description,
  icon,
  onPress,
  selected = false,
  title,
}: {
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  selected?: boolean;
  title: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.policyCard, selected && styles.policyCardSelected]}>
      <View style={styles.policyTopRow}>
        <View style={styles.policyTitleRow}>
          <View style={[styles.policyIcon, selected && styles.policyIconSelected]}>
            <Ionicons color={selected ? colors.primaryDark : colors.muted} name={icon} size={15} />
          </View>
          <AppText numberOfLines={1} tone={selected ? 'accent' : 'primary'} variant="uiBody" weight="800">
            {title}
          </AppText>
        </View>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
      </View>
      <AppText tone={selected ? 'muted' : 'subtle'} variant="metadata" weight="600">
        {description}
      </AppText>
    </Pressable>
  );
}

const defaultStartsAt = '2026-06-09T18:30:00+03:00';
const playerCountOptions = [4, 5, 6];
const rankOptions: PlayerLevel[] = ['C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'League'];

function getGenderLabel(genderRule: GenderRule) {
  if (genderRule === 'male') {
    return 'Men';
  }

  if (genderRule === 'female') {
    return 'Women';
  }

  return 'Everyone';
}

function getRankRuleLabel(rankRuleType: RankRuleType) {
  if (rankRuleType === 'any') {
    return 'Any rank';
  }

  if (rankRuleType === 'exact') {
    return 'Exact rank';
  }

  return 'Range';
}

function getRankPickerTitle(field: RankPickerField | null) {
  if (field === 'min') {
    return 'Choose min rank';
  }

  if (field === 'max') {
    return 'Choose max rank';
  }

  return 'Choose exact rank';
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 430,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 124,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  createButton: {
    borderRadius: 18,
    overflow: 'hidden',
    ...shadows.soft,
  },
  createButtonDisabled: {
    opacity: 0.52,
  },
  createButtonFill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 54,
  },
  field: {
    gap: spacing.xs,
    minWidth: 0,
  },
  fieldInRow: {
    flex: 1,
  },
  footerActions: {
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  inputText: {
    flex: 1,
  },
  policyCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minHeight: 76,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    ...shadows.soft,
  },
  policyCardSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  policyGrid: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  policyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  policyIconSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  policyTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minWidth: 0,
  },
  policyTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  playerCountControl: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
  playerCountSegment: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.xs,
  },
  playerCountSegmentSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  radioInner: {
    backgroundColor: colors.accentLime,
    borderRadius: radius.round,
    height: 8,
    width: 8,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  rankCloseButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  rankModalBackdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  rankModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  rankOption: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    width: '23%',
  },
  rankOptionSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  rankSheet: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: '62%',
    padding: spacing.lg,
    ...shadows.hero,
  },
  rankSheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  screen: {
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionBody: {
    gap: spacing.md,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  sectionTitle: {
    color: colors.ink,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: spacing.xs,
  },
  segmentCompact: {
    minHeight: 32,
  },
  segmentSelected: {
    backgroundColor: colors.surfaceMuted,
  },
  segmentedControl: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  segmentedControlCompact: {
    borderRadius: radius.round,
  },
  textArea: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.muted,
    fontFamily: fontFamilies.manrope.medium,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    color: colors.ink,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 14,
    letterSpacing: 0,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  wizardBackButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
    ...shadows.soft,
  },
  wizardTopSpacer: {
    height: 34,
  },
  wizardDot: {
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 6,
    width: 6,
  },
  wizardDotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  wizardDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
});
