import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { Gender, Player, PlayerSide, PreferredFoot } from '../types';

type EditProfileScreenProps = {
  onBack: () => void;
  onSave: (player: Player) => void;
  player: Player;
};

const genderOptions: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const footOptions: Array<{ label: string; value: PreferredFoot }> = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Both', value: 'both' },
];

const sideOptions: Array<{ label: string; value: PlayerSide }> = [
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Both', value: 'both' },
];

export function EditProfileScreen({ onBack, onSave, player }: EditProfileScreenProps) {
  const initialName = splitName(player.name);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [location, setLocation] = useState(player.area);
  const [gender, setGender] = useState<Gender>(player.gender);
  const [preferredFoot, setPreferredFoot] = useState<PreferredFoot>(player.preferredFoot);
  const [preferredSide, setPreferredSide] = useState<PlayerSide>(player.side);
  const [hasBall, setHasBall] = useState(player.hasBall);
  const [hasCourtMarks, setHasCourtMarks] = useState(player.hasCourtMarks);
  const fullName = useMemo(() => [firstName.trim(), lastName.trim()].filter(Boolean).join(' '), [firstName, lastName]);
  const initials = getInitials(firstName, lastName, player.initials);
  const canSave = firstName.trim().length > 0 && location.trim().length > 0;

  function saveChanges() {
    if (!canSave) {
      return;
    }

    onSave({
      ...player,
      area: location.trim(),
      gender,
      hasBall,
      hasCourtMarks,
      initials,
      name: fullName || player.name,
      preferredFoot,
      side: preferredSide,
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

      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={styles.headerButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={21} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText numberOfLines={1} variant="sectionHeading" weight="900">
            Edit profile
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="metadata" weight="600">
            Update your player details
          </AppText>
        </View>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.cancelButton}>
          <AppText align="center" tone="muted" variant="metadata" weight="800">
            Cancel
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewCard}>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={[colors.surfaceAqua, colors.surfaceYellow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <AppText align="center" variant="heroTitle" weight="900">
                {initials}
              </AppText>
            </LinearGradient>
            <View style={styles.avatarEditBadge}>
              <Ionicons color={colors.primaryDark} name="camera-outline" size={13} />
            </View>
          </View>
          <View style={styles.previewCopy}>
            <AppText numberOfLines={1} variant="sectionHeading" weight="900">
              {fullName || 'Your name'}
            </AppText>
            <View style={styles.previewLocation}>
              <Ionicons color={colors.accentSea} name="location" size={14} />
              <AppText numberOfLines={1} tone="muted" variant="metadata" weight="700">
                {location.trim() || 'Add location'}
              </AppText>
            </View>
          </View>
        </View>

        <FormSection icon="person-outline" title="Basic info">
          <Field label="First name" required>
            <WarmInput onChangeText={setFirstName} placeholder="First name" value={firstName} />
          </Field>
          <Field label="Last name">
            <WarmInput onChangeText={setLastName} placeholder="Last name" value={lastName} />
          </Field>
          <Field label="Location" required>
            <WarmInput
              icon="location"
              onChangeText={setLocation}
              placeholder="Preferred city or beach area"
              value={location}
            />
          </Field>
          <Field label="Gender">
            <SegmentedOptions
              options={genderOptions}
              selectedValue={gender}
              onSelect={(value) => setGender(value)}
            />
          </Field>
        </FormSection>

        <FormSection icon="walk-outline" title="Playing profile">
          <Field label="Preferred foot">
            <SegmentedOptions
              options={footOptions}
              selectedValue={preferredFoot}
              onSelect={(value) => setPreferredFoot(value)}
            />
          </Field>
          <Field label="Preferred side">
            <SegmentedOptions
              options={sideOptions}
              selectedValue={preferredSide}
              onSelect={(value) => setPreferredSide(value)}
            />
          </Field>
          <Field label="Equipment">
            <View style={styles.toggleRow}>
              <EquipmentToggle
                active={hasBall}
                icon="football-outline"
                label="Ball"
                onPress={() => setHasBall((current) => !current)}
              />
              <EquipmentToggle
                active={hasCourtMarks}
                icon="flag-outline"
                label="Marking"
                onPress={() => setHasCourtMarks((current) => !current)}
              />
            </View>
          </Field>
          <View style={styles.helperLine}>
            <Ionicons color={colors.accentSea} name="information-circle-outline" size={15} />
            <AppText style={styles.helperText} tone="muted" variant="metadata" weight="600">
              These details will appear in your profile and will help players learn more about you!
            </AppText>
          </View>
        </FormSection>
      </ScrollView>

      <View style={styles.saveBar}>
        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={saveChanges}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        >
          <AppText align="center" tone="inverse" variant="button" weight="900">
            Save changes
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function FormSection({
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
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons color={colors.primaryDark} name={icon} size={15} />
        </View>
        <AppText variant="sectionHeading" weight="900">
          {title}
        </AppText>
      </View>
      <View style={styles.formCard}>{children}</View>
    </View>
  );
}

function Field({ children, label, required = false }: { children: ReactNode; label: string; required?: boolean }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppText tone="muted" variant="metadata" weight="800">
          {label}
        </AppText>
        {required ? (
          <AppText tone="warning" variant="caption" weight="800">
            Required
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function WarmInput({
  icon,
  onChangeText,
  placeholder,
  value,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <View style={styles.inputShell}>
      {icon ? <Ionicons color={colors.accentSea} name={icon} size={16} /> : null}
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function SegmentedOptions<TValue extends string>({
  onSelect,
  options,
  selectedValue,
}: {
  onSelect: (value: TValue) => void;
  options: Array<{ label: string; value: TValue }>;
  selectedValue: TValue;
}) {
  return (
    <View style={styles.segmentedControl}>
      {options.map((option) => {
        const isSelected = option.value === selectedValue;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <AppText align="center" tone={isSelected ? 'accent' : 'muted'} variant="chip" weight="800">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function EquipmentToggle({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: active }} onPress={onPress} style={styles.equipmentToggle}>
      <View style={[styles.toggleIcon, active && styles.toggleIconActive]}>
        <Ionicons color={active ? colors.primaryDark : colors.muted} name={icon} size={16} />
      </View>
      <View style={styles.toggleCopy}>
        <AppText tone={active ? 'accent' : 'primary'} variant="button" weight="800">
          {label}
        </AppText>
        <AppText tone="muted" variant="caption" weight="700">
          {active ? 'On' : 'Off'}
        </AppText>
      </View>
      <View style={[styles.switchTrack, active && styles.switchTrackActive]}>
        <View style={[styles.switchThumb, active && styles.switchThumbActive]} />
      </View>
    </Pressable>
  );
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  };
}

function getInitials(firstName: string, lastName: string, fallback: string) {
  const first = firstName.trim().slice(0, 1);
  const last = lastName.trim().slice(0, 1);
  const initials = `${first}${last || firstName.trim().slice(1, 2)}`.toUpperCase();

  return initials || fallback;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  avatarEditBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    bottom: 0,
    height: 26,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 26,
    ...shadows.soft,
  },
  avatarWrap: {
    position: 'relative',
  },
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
    minHeight: 36,
    paddingHorizontal: spacing.xs,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 132,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
  },
  equipmentToggle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 58,
    padding: spacing.sm,
  },
  toggleCopy: {
    flex: 1,
    minWidth: 0,
  },
  toggleIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  toggleIconActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
  },
  field: {
    gap: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
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
    height: 40,
    justifyContent: 'center',
    width: 40,
    ...shadows.soft,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  helperLine: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.24)',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  helperText: {
    flex: 1,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilies.manrope.semibold,
    fontSize: 15,
    lineHeight: 20,
    minWidth: 0,
    padding: 0,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleRow: {
    gap: spacing.sm,
  },
  switchThumb: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.round,
    height: 20,
    width: 20,
    ...shadows.soft,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  switchTrack: {
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 24,
    padding: 2,
    width: 46,
  },
  switchTrackActive: {
    backgroundColor: colors.primary,
  },
  previewCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  previewCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  previewLocation: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minWidth: 0,
  },
  saveBar: {
    backgroundColor: 'rgba(248, 241, 227, 0.96)',
    borderTopColor: 'rgba(216, 232, 212, 0.72)',
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.soft,
  },
  saveButtonDisabled: {
    opacity: 0.48,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  segmentSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  segmentedControl: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
});
