import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import { formatRankRange, getRankIndex, rankOptions, RankBar, RankRangeBar } from '../components/RankRangeBar';
import type { CreateLobbyDraft } from '../features/lobbies/lobbyCreateTypes';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { GenderRule, LobbyVisibility, Player, PlayerLevel, RankRuleType } from '../types';

type CreateLobbyScreenProps = {
  isCreating?: boolean;
  notificationCount: number;
  onCancel: () => void;
  onCreateLobby: (draft: CreateLobbyDraft) => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  player: Player;
};

type CreatePicker = 'date' | 'location' | 'time';

export function CreateLobbyScreen({
  isCreating = false,
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
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [playerCounts, setPlayerCounts] = useState<number[]>([4, 6]);
  const [rankRuleType, setRankRuleType] = useState<RankRuleType>('range');
  const [rankMin, setRankMin] = useState<PlayerLevel>('A-');
  const [rankMax, setRankMax] = useState<PlayerLevel>('B+');
  const [rankExact, setRankExact] = useState<PlayerLevel>('B+');
  const [activePicker, setActivePicker] = useState<CreatePicker | null>(null);
  const [genderRule, setGenderRule] = useState<GenderRule>('everyone');
  const [visibility, setVisibility] = useState<LobbyVisibility>('public');
  const selectedDate = dateOptions[selectedDateIndex];
  const selectedTime = timeOptions[selectedTimeIndex];
  const selectedLocation = locationOptions[selectedLocationIndex];
  const startsAt = `${selectedDate.value}T${selectedTime.value}:00+03:00`;
  const isTitleValid = title.trim().length > 2;
  const isMeetingPointValid = meetingPoint.trim().length > 4;
  const isRankRangeValid = rankRuleType !== 'range' || getRankIndex(rankMin) <= getRankIndex(rankMax);
  const maxPlayers = Math.max(...playerCounts);
  const canContinue = isTitleValid && isMeetingPointValid;
  const canCreate = canContinue && isRankRangeValid && playerCounts.length > 0;

  function createLobby() {
    if (!canCreate || isCreating) {
      return;
    }

    const accessCode = visibility === 'password' ? generatePrivateAccessCode() : undefined;

    onCreateLobby({
      accessCode,
      genderRule,
      locationCity: selectedLocation.city,
      locationName: selectedLocation.name,
      maxPlayers,
      meetingPoint: meetingPoint.trim(),
      playerCounts,
      rankExact: rankRuleType === 'exact' ? rankExact : undefined,
      rankMax: rankRuleType === 'range' ? rankMax : undefined,
      rankMin: rankRuleType === 'range' ? rankMin : undefined,
      rankRuleType,
      startsAt,
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

  function selectLocation(index: number) {
    const previousDefaultMeetingPoint = locationOptions[selectedLocationIndex].defaultMeetingPoint;
    const nextLocation = locationOptions[index];

    setSelectedLocationIndex(index);

    if (!meetingPoint.trim() || meetingPoint === previousDefaultMeetingPoint) {
      setMeetingPoint(nextLocation.defaultMeetingPoint);
    }
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
              dateLabel={selectedDate.label}
              locationLabel={`${selectedLocation.name}, ${selectedLocation.city}`}
              meetingPoint={meetingPoint}
              onChangeMeetingPoint={setMeetingPoint}
              onChangeTitle={setTitle}
              onOpenDate={() => setActivePicker('date')}
              onOpenLocation={() => setActivePicker('location')}
              onOpenTime={() => setActivePicker('time')}
              timeLabel={selectedTime.label}
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
              onChangeRankMax={setRankMax}
              onChangeRankExact={setRankExact}
              onChangeRankMin={setRankMin}
              onChangeRankRuleType={setRankRuleType}
              onChangeVisibility={setVisibility}
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
            disabled={step === 1 ? !canContinue : !canCreate || isCreating}
            label={step === 1 ? 'Continue' : isCreating ? 'Creating...' : 'Create game'}
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
      <OptionPickerSheet
        onClose={() => setActivePicker(null)}
        onSelect={(index) => {
          if (activePicker === 'date') {
            setSelectedDateIndex(index);
          } else if (activePicker === 'time') {
            setSelectedTimeIndex(index);
          } else if (activePicker === 'location') {
            selectLocation(index);
          }

          setActivePicker(null);
        }}
        options={getPickerOptions(activePicker)}
        selectedIndex={getPickerSelectedIndex(activePicker, selectedDateIndex, selectedTimeIndex, selectedLocationIndex)}
        title={getPickerTitle(activePicker)}
        visible={Boolean(activePicker)}
      />
    </View>
  );
}

function WhenWhereStep({
  dateLabel,
  locationLabel,
  meetingPoint,
  onChangeMeetingPoint,
  onChangeTitle,
  onOpenDate,
  onOpenLocation,
  onOpenTime,
  timeLabel,
  title,
}: {
  dateLabel: string;
  locationLabel: string;
  meetingPoint: string;
  onChangeMeetingPoint: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onOpenDate: () => void;
  onOpenLocation: () => void;
  onOpenTime: () => void;
  timeLabel: string;
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
          <InputShell icon="calendar-outline" onPress={onOpenDate} value={dateLabel} withChevron />
        </Field>
        <Field label="Start time" style={styles.fieldInRow}>
          <InputShell icon="time-outline" onPress={onOpenTime} value={timeLabel} withChevron />
        </Field>
      </View>

      <Field label="Location">
        <InputShell icon="location" onPress={onOpenLocation} value={locationLabel} withChevron />
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
  onChangeRankExact,
  onChangeRankMax,
  onChangeRankMin,
  onChangeRankRuleType,
  onChangeVisibility,
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
  onChangeRankExact: (value: PlayerLevel) => void;
  onChangeRankMax: (value: PlayerLevel) => void;
  onChangeRankMin: (value: PlayerLevel) => void;
  onChangeRankRuleType: (value: RankRuleType) => void;
  onChangeVisibility: (value: LobbyVisibility) => void;
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
        <Field label="Rank range">
          <View style={styles.rankRangePanel}>
            <View style={styles.rankRangeHeader}>
              <AppText tone="primary" variant="metadata" weight="800">
                {formatRankRange(getRankIndex(rankMin), getRankIndex(rankMax))}
              </AppText>
              <AppText tone="muted" variant="metadata" weight="600">
                Drag handles
              </AppText>
            </View>
            <RankRangeBar
              fromIndex={getRankIndex(rankMin)}
              onFromChange={(index) => onChangeRankMin(rankOptions[index])}
              onToChange={(index) => onChangeRankMax(rankOptions[index])}
              toIndex={getRankIndex(rankMax)}
            />
          </View>
        </Field>
      ) : null}

      {rankRuleType === 'exact' ? (
        <Field label="Exact rank">
          <RankBar selectedRank={rankExact} onSelect={onChangeRankExact} />
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

function generatePrivateAccessCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
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

function OptionPickerSheet({
  onClose,
  onSelect,
  options,
  selectedIndex,
  title,
  visible,
}: {
  onClose: () => void;
  onSelect: (index: number) => void;
  options: Array<{ description?: string; label: string }>;
  selectedIndex: number;
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
                Tap an option to update this game.
              </AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.rankCloseButton}>
              <Ionicons color={colors.muted} name="close" size={18} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.optionList} showsVerticalScrollIndicator={false}>
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={`${option.label}-${index}`}
                  onPress={() => onSelect(index)}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                >
                  <View style={styles.optionCopy}>
                    <AppText tone={isSelected ? 'accent' : 'primary'} variant="button" weight="800">
                      {option.label}
                    </AppText>
                    {option.description ? (
                      <AppText tone="muted" variant="metadata" weight="600">
                        {option.description}
                      </AppText>
                    ) : null}
                  </View>
                  <Ionicons
                    color={isSelected ? colors.accentLime : colors.muted}
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    size={18}
                  />
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

const dateOptions = [
  { label: 'Tue, Jun 9', value: '2026-06-09' },
  { label: 'Wed, Jun 10', value: '2026-06-10' },
  { label: 'Thu, Jun 11', value: '2026-06-11' },
  { label: 'Fri, Jun 12', value: '2026-06-12' },
  { label: 'Sat, Jun 13', value: '2026-06-13' },
];
const timeOptions = [
  { label: '07:00', value: '07:00' },
  { label: '08:30', value: '08:30' },
  { label: '16:30', value: '16:30' },
  { label: '18:30', value: '18:30' },
  { label: '20:00', value: '20:00' },
];
const locationOptions = [
  {
    city: 'Tel Aviv',
    defaultMeetingPoint: 'Meet near the north workout area by the showers',
    name: 'Gordon Beach',
  },
  {
    city: 'Tel Aviv',
    defaultMeetingPoint: 'Meet by the south entrance stairs near the promenade',
    name: 'Hilton Beach',
  },
  {
    city: 'Netanya',
    defaultMeetingPoint: 'Meet next to the central lifeguard tower',
    name: 'Poleg Beach',
  },
  {
    city: 'Caesarea',
    defaultMeetingPoint: 'Meet by the aqueduct parking entrance',
    name: 'Aqueduct Beach',
  },
];
const playerCountOptions = [4, 5, 6];

function getPickerOptions(picker: CreatePicker | null) {
  if (picker === 'date') {
    return dateOptions.map((option) => ({ label: option.label }));
  }

  if (picker === 'time') {
    return timeOptions.map((option) => ({ label: option.label }));
  }

  if (picker === 'location') {
    return locationOptions.map((option) => ({
      description: option.city,
      label: option.name,
    }));
  }

  return [];
}

function getPickerSelectedIndex(
  picker: CreatePicker | null,
  selectedDateIndex: number,
  selectedTimeIndex: number,
  selectedLocationIndex: number,
) {
  if (picker === 'date') {
    return selectedDateIndex;
  }

  if (picker === 'time') {
    return selectedTimeIndex;
  }

  if (picker === 'location') {
    return selectedLocationIndex;
  }

  return 0;
}

function getPickerTitle(picker: CreatePicker | null) {
  if (picker === 'date') {
    return 'Choose date';
  }

  if (picker === 'time') {
    return 'Choose start time';
  }

  if (picker === 'location') {
    return 'Choose location';
  }

  return 'Choose option';
}

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
  optionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  optionList: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  optionRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
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
  rankRangeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rankRangePanel: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
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
