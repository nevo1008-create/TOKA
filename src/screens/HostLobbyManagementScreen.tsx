import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../components/AppText';
import { HomeHeader } from '../components/home/HomeHeader';
import { formatRankRange, getRankIndex, rankOptions, RankBar, RankRangeBar } from '../components/RankRangeBar';
import { israelPlaces } from '../data/israelPlaces';
import type { LobbySettingsDraft } from '../features/lobbies/lobbyCreateTypes';
import { formatLobbyStart, getLobbyLocalDateValue, getLobbyLocalTimeValue } from '../features/lobbies/lobbyDateTime';
import { getJoinedParticipants } from '../features/lobbies/lobbyRules';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { GenderRule, Lobby, LobbyVisibility, Player, PlayerLevel, RankRuleType } from '../types';

type HostLobbyManagementScreenProps = {
  currentPlayer: Player;
  isActionPending?: boolean;
  lobby: Lobby;
  notificationCount: number;
  onBack: () => void;
  onCloseLobby: () => void;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onSaveSettings: (draft: LobbySettingsDraft) => void;
};

type PickerType = 'date' | 'time' | 'location';

export function HostLobbyManagementScreen({
  currentPlayer,
  isActionPending = false,
  lobby,
  notificationCount,
  onBack,
  onCloseLobby,
  onOpenMenu,
  onOpenNotifications,
  onSaveSettings,
}: HostLobbyManagementScreenProps) {
  const initialDate = getLobbyLocalDateValue(lobby.startsAt);
  const initialTime = getLobbyLocalTimeValue(lobby.startsAt);
  const initialLocationIndex = Math.max(
    israelPlaces.findIndex((place) => place.name === lobby.location.name && place.city === lobby.location.city),
    0,
  );
  const dateOptions = useMemo(() => buildDateOptions(initialDate), [initialDate]);
  const timeOptions = useMemo(() => buildTimeOptions(initialTime), [initialTime]);
  const initialTimeIndex = Math.max(timeOptions.findIndex((option) => option.value === initialTime), 0);
  const [title, setTitle] = useState(lobby.title);
  const [meetingPoint, setMeetingPoint] = useState(lobby.locationDescription ?? lobby.note.replace(/^Private game\.\s*/i, ''));
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(initialTimeIndex);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(initialLocationIndex);
  const [playerCounts, setPlayerCounts] = useState<number[]>(getInitialPlayerCounts(lobby));
  const [rankRuleType, setRankRuleType] = useState<RankRuleType>(lobby.rankRuleType);
  const [rankMin, setRankMin] = useState<PlayerLevel>(lobby.rankMin ?? 'A-');
  const [rankMax, setRankMax] = useState<PlayerLevel>(lobby.rankMax ?? 'League');
  const [rankExact, setRankExact] = useState<PlayerLevel>(lobby.rankExact ?? lobby.rankMin ?? 'B');
  const [genderRule, setGenderRule] = useState<GenderRule>(lobby.genderRule);
  const [visibility, setVisibility] = useState<LobbyVisibility>(lobby.visibility === 'password' ? 'password' : 'public');
  const [accessCode, setAccessCode] = useState(lobby.accessCode);
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);
  const [isCloseConfirmed, setIsCloseConfirmed] = useState(false);
  const joinedParticipants = getJoinedParticipants(lobby);
  const activePlayerCount = joinedParticipants.length;
  const selectedDate = dateOptions[selectedDateIndex];
  const selectedTime = timeOptions[selectedTimeIndex];
  const selectedLocation = israelPlaces[selectedLocationIndex] ?? israelPlaces[0];
  const maxPlayers = Math.max(...playerCounts);
  const isPlayerLimitValid = maxPlayers >= activePlayerCount;
  const isRankRangeValid = rankRuleType !== 'range' || getRankIndex(rankMin) <= getRankIndex(rankMax);
  const canSave = title.trim().length > 2 && meetingPoint.trim().length > 4 && isPlayerLimitValid && isRankRangeValid && !isActionPending;

  function togglePlayerCount(count: number) {
    setPlayerCounts((current) => {
      if (current.includes(count)) {
        return current.length === 1 ? current : current.filter((item) => item !== count);
      }

      return [...current, count].sort((first, second) => first - second);
    });
  }

  function changeVisibility(nextVisibility: LobbyVisibility) {
    setVisibility(nextVisibility);

    if (nextVisibility === 'password' && !accessCode) {
      setAccessCode(generatePrivateAccessCode());
    }
  }

  function saveSettings() {
    if (!canSave) {
      return;
    }

    onSaveSettings({
      accessCode: visibility === 'password' ? accessCode ?? generatePrivateAccessCode() : undefined,
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
      startsAt: `${selectedDate.value}T${selectedTime.value}:00+03:00`,
      title: title.trim(),
      visibility,
    });
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
        player={currentPlayer}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Ionicons color={colors.ink} name="chevron-back" size={20} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="heading" weight="900">
              Host tools
            </AppText>
            <AppText tone="muted" variant="metadata" weight="700">
              {lobby.title} · {formatLobbyStart(lobby.startsAt)}
            </AppText>
          </View>
        </View>

        <Section danger compact icon="close-circle-outline" title="Close lobby">
          <AppText tone="muted" variant="metadata" weight="600">
            Closing removes this lobby from active games for everyone.
          </AppText>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCloseConfirmed }}
            onPress={() => setIsCloseConfirmed((current) => !current)}
            style={styles.confirmRow}
          >
            <View style={[styles.checkbox, isCloseConfirmed && styles.checkboxChecked]}>
              {isCloseConfirmed ? <Ionicons color={colors.textOnGreen} name="checkmark" size={14} /> : null}
            </View>
            <AppText style={styles.confirmText} tone="muted" variant="metadata" weight="700">
              I understand this will close the lobby for everyone.
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isActionPending || !isCloseConfirmed}
            onPress={onCloseLobby}
            style={[styles.dangerButton, (isActionPending || !isCloseConfirmed) && styles.disabledButton]}
          >
            <AppText align="center" tone="danger" variant="button" weight="900">
              Close lobby
            </AppText>
          </Pressable>
        </Section>

        <Section icon="settings-outline" title="Lobby settings">
          <Field label="Game title">
            <TextInput
              onChangeText={setTitle}
              placeholder="Game title"
              placeholderTextColor={colors.subtle}
              style={styles.textInput}
              value={title}
            />
          </Field>

          <View style={styles.twoColumn}>
            <Field label="Date" style={styles.fieldInRow}>
              <InputShell icon="calendar-outline" onPress={() => setActivePicker('date')} value={selectedDate.label} />
            </Field>
            <Field label="Start time" style={styles.fieldInRow}>
              <InputShell icon="time-outline" onPress={() => setActivePicker('time')} value={selectedTime.label} />
            </Field>
          </View>

          <Field label="Location">
            <InputShell
              icon="location"
              onPress={() => setActivePicker('location')}
              value={`${selectedLocation.name}, ${selectedLocation.city}`}
            />
          </Field>

          <Field label="Meeting point">
            <TextInput
              multiline
              onChangeText={setMeetingPoint}
              placeholder="Where exactly should players meet?"
              placeholderTextColor={colors.subtle}
              style={styles.textArea}
              value={meetingPoint}
            />
          </Field>

          <Field label="Players">
            <PlayerCountSelector onToggle={togglePlayerCount} selectedCounts={playerCounts} />
            {!isPlayerLimitValid ? (
              <AppText tone="danger" variant="metadata" weight="700">
                Player limit cannot be lower than current joined players ({activePlayerCount}).
              </AppText>
            ) : null}
          </Field>

          <Field label="Rank policy">
            <SegmentedControl
              compact
              onSelect={(option) => {
                if (option === 'Any rank') {
                  setRankRuleType('any');
                } else if (option === 'Exact rank') {
                  setRankRuleType('exact');
                } else {
                  setRankRuleType('range');
                }
              }}
              options={['Any rank', 'Exact rank', 'Range']}
              selected={getRankRuleLabel(rankRuleType)}
            />
          </Field>

          {rankRuleType === 'range' ? (
            <Field label="Rank range">
              <View style={styles.rankPanel}>
                <View style={styles.rankPanelHeader}>
                  <AppText tone="primary" variant="metadata" weight="800">
                    {formatRankRange(getRankIndex(rankMin), getRankIndex(rankMax))}
                  </AppText>
                  <AppText tone="muted" variant="metadata" weight="600">
                    Drag handles
                  </AppText>
                </View>
                <RankRangeBar
                  fromIndex={getRankIndex(rankMin)}
                  onFromChange={(index) => setRankMin(rankOptions[index])}
                  onToChange={(index) => setRankMax(rankOptions[index])}
                  toIndex={getRankIndex(rankMax)}
                />
              </View>
            </Field>
          ) : null}

          {rankRuleType === 'exact' ? (
            <Field label="Exact rank">
              <RankBar selectedRank={rankExact} onSelect={setRankExact} />
            </Field>
          ) : null}

          <Field label="Gender">
            <SegmentedControl
              onSelect={(option) => {
                if (option === 'Men') {
                  setGenderRule('male');
                } else if (option === 'Women') {
                  setGenderRule('female');
                } else {
                  setGenderRule('everyone');
                }
              }}
              options={['Everyone', 'Men', 'Women']}
              selected={getGenderLabel(genderRule)}
            />
          </Field>

          <Field label="Visibility">
            <SegmentedControl
              onSelect={(option) => changeVisibility(option === 'Private' ? 'password' : 'public')}
              options={['Public', 'Private']}
              selected={visibility === 'password' ? 'Private' : 'Public'}
            />
            {visibility === 'password' && accessCode ? (
              <View style={styles.pinNotice}>
                <Ionicons color={colors.danger} name="lock-closed-outline" size={14} />
                <AppText tone="danger" variant="metadata" weight="800">
                  PIN {accessCode}
                </AppText>
              </View>
            ) : null}
          </Field>

          {!isRankRangeValid ? (
            <AppText align="center" tone="danger" variant="metadata" weight="700">
              Min rank must be lower than or equal to max rank.
            </AppText>
          ) : null}

          <PrimaryActionButton disabled={!canSave} label={isActionPending ? 'Saving...' : 'Save changes'} onPress={saveSettings} />
        </Section>

      </ScrollView>

      <OptionPickerSheet
        onClose={() => setActivePicker(null)}
        onSelect={(index) => {
          if (activePicker === 'date') {
            setSelectedDateIndex(index);
          } else if (activePicker === 'time') {
            setSelectedTimeIndex(index);
          } else if (activePicker === 'location') {
            setSelectedLocationIndex(index);
          }

          setActivePicker(null);
        }}
        options={getPickerOptions(activePicker, dateOptions, timeOptions)}
        selectedIndex={getPickerSelectedIndex(activePicker, selectedDateIndex, selectedTimeIndex, selectedLocationIndex)}
        title={getPickerTitle(activePicker)}
        visible={Boolean(activePicker)}
      />
    </View>
  );
}

function Section({
  children,
  compact = false,
  danger = false,
  icon,
  title,
}: {
  children: ReactNode;
  compact?: boolean;
  danger?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={[styles.section, compact && styles.sectionCompact, danger && styles.dangerSection]}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIcon, danger && styles.dangerIcon]}>
          <Ionicons color={danger ? colors.danger : colors.accentLime} name={icon} size={15} />
        </View>
        <AppText style={styles.sectionTitle} variant="title" weight="900">
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
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.inputShell}>
      {icon ? <Ionicons color={colors.accentSea} name={icon} size={15} style={styles.inputIcon} /> : null}
      <AppText numberOfLines={1} style={styles.inputText} variant="bodySmall" weight="700">
        {value}
      </AppText>
      <Ionicons color={colors.muted} name="chevron-down" size={15} />
    </Pressable>
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

function SegmentedControl({
  compact = false,
  onSelect,
  options,
  selected,
}: {
  compact?: boolean;
  onSelect: (option: string) => void;
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
            onPress={() => onSelect(option)}
            style={[styles.segment, compact && styles.segmentCompact, isSelected && styles.segmentSelected]}
          >
            <AppText align="center" numberOfLines={1} tone={isSelected ? 'accent' : 'muted'} variant="chip" weight="800">
              {option}
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
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.pickerOverlay}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.pickerBackdrop} />
      <View style={styles.pickerSheet}>
        <View style={styles.pickerHeader}>
          <AppText variant="uiBody" weight="900">
            {title}
          </AppText>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.pickerCloseButton}>
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
                <Ionicons color={isSelected ? colors.accentLime : colors.muted} name={isSelected ? 'checkmark-circle' : 'chevron-forward'} size={18} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function PrimaryActionButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.saveButton, disabled && styles.disabledButton]}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.saveButtonFill}>
        <AppText align="center" tone="inverse" variant="button" weight="900">
          {label}
        </AppText>
      </LinearGradient>
    </Pressable>
  );
}

const playerCountOptions = [4, 5, 6];

function getInitialPlayerCounts(lobby: Lobby) {
  if (lobby.capacityMode === 'flexible' && lobby.minPlayers !== lobby.maxPlayers) {
    return playerCountOptions.filter((count) => count >= lobby.minPlayers && count <= lobby.maxPlayers);
  }

  return playerCountOptions.includes(lobby.maxPlayers) ? [lobby.maxPlayers] : [Math.max(lobby.maxPlayers, 4)];
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

function getGenderLabel(genderRule: GenderRule) {
  if (genderRule === 'male') {
    return 'Men';
  }

  if (genderRule === 'female') {
    return 'Women';
  }

  return 'Everyone';
}

function buildDateOptions(currentDate: string) {
  const baseDate = new Date(`${currentDate}T12:00:00`);

  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date(baseDate);

    date.setDate(baseDate.getDate() + index);

    return {
      label: date.toLocaleDateString([], { day: 'numeric', month: 'short', weekday: 'short' }),
      value: date.toISOString().slice(0, 10),
    };
  });
}

function buildTimeOptions(currentTime: string) {
  const baseTimes = ['07:00', '08:30', '16:30', '18:30', '20:00'];
  const times = baseTimes.includes(currentTime) ? baseTimes : [currentTime, ...baseTimes];

  return times.map((time) => ({ label: time, value: time }));
}

function getPickerOptions(
  picker: PickerType | null,
  dateOptions: Array<{ label: string; value: string }>,
  timeOptions: Array<{ label: string; value: string }>,
) {
  if (picker === 'date') {
    return dateOptions.map((option) => ({ label: option.label }));
  }

  if (picker === 'time') {
    return timeOptions.map((option) => ({ label: option.label }));
  }

  if (picker === 'location') {
    return israelPlaces.map((option) => ({
      description: option.city,
      label: option.name,
    }));
  }

  return [];
}

function getPickerSelectedIndex(
  picker: PickerType | null,
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

function getPickerTitle(picker: PickerType | null) {
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

function generatePrivateAccessCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const styles = StyleSheet.create({
  backgroundGlow: {
    height: 430,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
    ...shadows.soft,
  },
  content: {
    gap: spacing.md,
    paddingBottom: 160,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  confirmRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.08)',
    borderColor: 'rgba(217, 74, 58, 0.20)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmText: {
    flex: 1,
    minWidth: 0,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.28)',
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
  },
  dangerIcon: {
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.22)',
  },
  dangerSection: {
    borderColor: 'rgba(217, 74, 58, 0.18)',
  },
  disabledButton: {
    opacity: 0.52,
  },
  emptyRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  field: {
    gap: spacing.xs,
    minWidth: 0,
  },
  fieldInRow: {
    flex: 1,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
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
    minWidth: 0,
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
  pickerBackdrop: {
    backgroundColor: 'rgba(18, 59, 42, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pickerCloseButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerOverlay: {
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.78)',
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    maxHeight: '62%',
    padding: spacing.lg,
    ...shadows.hero,
  },
  pinNotice: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(217, 74, 58, 0.10)',
    borderColor: 'rgba(217, 74, 58, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
  playerGroup: {
    gap: spacing.sm,
  },
  playerGroupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  playerList: {
    gap: spacing.sm,
  },
  rankPanel: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  rankPanelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    borderRadius: 18,
    overflow: 'hidden',
    ...shadows.soft,
  },
  saveButtonFill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  sectionCompact: {
    padding: spacing.md,
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
});
