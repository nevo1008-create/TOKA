import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../components/AppText';
import { RankBar } from '../components/RankRangeBar';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import type { Gender, Player, PlayerLevel, PlayerSide, PreferredFoot } from '../types';

type SignupWizardScreenProps = {
  email?: string;
  onBack: () => void;
  onComplete: (player: Player) => void;
  player: Player;
};

const beachOptions = ['Gordon Beach', 'Hilton Beach', 'Poleg Beach', 'Aqueduct Beach'];
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

export function SignupWizardScreen({ email, onBack, onComplete, player }: SignupWizardScreenProps) {
  const initialName = splitName(player.name);
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [location, setLocation] = useState(player.area);
  const [gender, setGender] = useState<Gender>(player.gender);
  const [rank, setRank] = useState<PlayerLevel>(player.level);
  const [preferredFoot, setPreferredFoot] = useState<PreferredFoot>(player.preferredFoot);
  const [preferredSide, setPreferredSide] = useState<PlayerSide>(player.side);
  const [hasBall, setHasBall] = useState(player.hasBall);
  const [hasCourtMarks, setHasCourtMarks] = useState(player.hasCourtMarks);
  const [locationAccess, setLocationAccess] = useState(false);
  const [preferredBeaches, setPreferredBeaches] = useState<string[]>(['Gordon Beach']);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const fullName = useMemo(() => [firstName.trim(), lastName.trim()].filter(Boolean).join(' '), [firstName, lastName]);
  const initials = getInitials(firstName, lastName, player.initials);
  const canContinue =
    step === 0
      ? firstName.trim().length > 0 && location.trim().length > 0
      : step === 3
        ? termsAccepted
        : true;
  const isLastStep = step === 3;

  function goNext() {
    if (!canContinue) {
      return;
    }

    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }

    onComplete({
      ...player,
      area: location.trim(),
      gender,
      hasBall,
      hasCourtMarks,
      initials,
      level: rank,
      name: fullName || player.name,
      preferredFoot,
      side: preferredSide,
    });
  }

  function goBack() {
    if (step === 0) {
      onBack();
      return;
    }

    setStep((current) => current - 1);
  }

  function toggleBeach(beach: string) {
    setPreferredBeaches((current) =>
      current.includes(beach) ? current.filter((item) => item !== beach) : [...current, beach],
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FFF6D7', colors.background, colors.backgroundAlt]}
        locations={[0, 0.44, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.78 }}
        style={styles.backgroundGlow}
      />

      <View style={styles.header}>
        <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={goBack} style={styles.headerButton}>
          <Ionicons color={colors.ink} name="chevron-back" size={21} />
        </Pressable>
        <View style={styles.headerCopy}>
          <AppText numberOfLines={1} variant="sectionHeading" weight="800">
            Set up TOCA
          </AppText>
          <AppText numberOfLines={1} tone="muted" variant="metadata" weight="500">
            Step {step + 1} of 4
          </AppText>
        </View>
        <View style={styles.stepDots}>
          {[0, 1, 2, 3].map((item) => (
            <View key={item} style={[styles.stepDot, item <= step && styles.stepDotActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <WizardSection
            icon="person-outline"
            subtitle={email ? `Signed in as ${email}` : 'Tell players who they are meeting.'}
            title="Your player identity"
          >
            <View style={styles.previewCard}>
              <LinearGradient
                colors={[colors.surfaceAqua, colors.surfaceYellow]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <AppText align="center" variant="heroTitle" weight="800">
                  {initials}
                </AppText>
              </LinearGradient>
              <View style={styles.previewCopy}>
                <AppText numberOfLines={1} variant="cardTitle" weight="700">
                  {fullName || 'Your name'}
                </AppText>
                <AppText numberOfLines={1} tone="muted" variant="metadata" weight="500">
                  {location.trim() || 'Add location'}
                </AppText>
              </View>
            </View>

            <TwoColumn>
              <Field label="First name" required>
                <WarmInput onChangeText={setFirstName} placeholder="First name" value={firstName} />
              </Field>
              <Field label="Last name">
                <WarmInput onChangeText={setLastName} placeholder="Last name" value={lastName} />
              </Field>
            </TwoColumn>
            <Field label="Location" required>
              <WarmInput icon="location" onChangeText={setLocation} placeholder="City or beach area" value={location} />
            </Field>
            <Field label="Gender">
              <SegmentedOptions options={genderOptions} selectedValue={gender} onSelect={setGender} />
            </Field>
          </WizardSection>
        ) : null}

        {step === 1 ? (
          <WizardSection
            icon="trophy-outline"
            subtitle="Hosts use this to match the right rooms and teams."
            title="Playing profile"
          >
            <Field label="Rank">
              <RankBar selectedRank={rank} onSelect={setRank} />
            </Field>
            <Field label="Preferred foot">
              <SegmentedOptions options={footOptions} selectedValue={preferredFoot} onSelect={setPreferredFoot} />
            </Field>
            <Field label="Preferred side">
              <SegmentedOptions options={sideOptions} selectedValue={preferredSide} onSelect={setPreferredSide} />
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
          </WizardSection>
        ) : null}

        {step === 2 ? (
          <WizardSection
            icon="location-outline"
            subtitle="TOCA feels best when nearby rooms appear first."
            title="Location and beaches"
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLocationAccess((current) => !current);
                if (!location.trim()) {
                  setLocation('Tel Aviv and central Israel');
                }
              }}
              style={[styles.permissionCard, locationAccess && styles.permissionCardActive]}
            >
              <View style={styles.permissionIcon}>
                <Ionicons color={colors.accentSea} name="navigate-outline" size={20} />
              </View>
              <View style={styles.permissionCopy}>
                <AppText variant="titleSmall" weight="700">
                  Location access
                </AppText>
                <AppText tone="muted" variant="metadata" weight="500">
                  Use your area to show nearby beach games first.
                </AppText>
              </View>
              <Ionicons
                color={locationAccess ? colors.primaryDark : colors.subtle}
                name={locationAccess ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
              />
            </Pressable>

            <Field label="Preferred beaches">
              <View style={styles.beachGrid}>
                {beachOptions.map((beach) => {
                  const selected = preferredBeaches.includes(beach);

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={beach}
                      onPress={() => toggleBeach(beach)}
                      style={[styles.beachChip, selected && styles.beachChipSelected]}
                    >
                      <Ionicons color={selected ? colors.primaryDark : colors.accentSea} name="location" size={13} />
                      <AppText tone={selected ? 'accent' : 'muted'} variant="chip" weight="700">
                        {beach}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <ToggleCard
              active={notificationsEnabled}
              icon="notifications-outline"
              label="Game notifications"
              onPress={() => setNotificationsEnabled((current) => !current)}
              text="Get room invites, waitlist updates, and rating reminders."
            />
          </WizardSection>
        ) : null}

        {step === 3 ? (
          <WizardSection
            icon="shield-checkmark-outline"
            subtitle="A trusted beach community works when everyone knows the rules."
            title="Community agreement"
          >
            <AgreementRow label="I agree to the Terms of service" />
            <AgreementRow label="I understand the Privacy policy" />
            <AgreementRow label="I will follow the Community guidelines" />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: termsAccepted }}
              onPress={() => setTermsAccepted((current) => !current)}
              style={[styles.acceptCard, termsAccepted && styles.acceptCardActive]}
            >
              <Ionicons color={termsAccepted ? colors.primaryDark : colors.subtle} name={termsAccepted ? 'checkbox' : 'square-outline'} size={23} />
              <View style={styles.acceptCopy}>
                <AppText variant="titleSmall" weight="700">
                  Accept and create profile
                </AppText>
                <AppText tone="muted" variant="metadata" weight="500">
                  You can edit your profile details later.
                </AppText>
              </View>
            </Pressable>
          </WizardSection>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={!canContinue}
          onPress={goNext}
          style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
        >
          <AppText align="center" tone="inverse" variant="button" weight="700">
            {isLastStep ? 'Enter TOCA' : 'Continue'}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function WizardSection({
  children,
  icon,
  subtitle,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons color={colors.primaryDark} name={icon} size={18} />
        </View>
        <View style={styles.sectionCopy}>
          <AppText variant="sectionHeading" weight="800">
            {title}
          </AppText>
          <AppText tone="muted" variant="metadata" weight="500">
            {subtitle}
          </AppText>
        </View>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Field({ children, label, required }: { children: ReactNode; label: string; required?: boolean }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppText tone="muted" variant="metadata" weight="600">
          {label}
        </AppText>
        {required ? (
          <AppText tone="warning" variant="caption" weight="700">
            Required
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function TwoColumn({ children }: { children: ReactNode }) {
  return <View style={styles.twoColumn}>{children}</View>;
}

function WarmInput({
  icon,
  ...props
}: {
  icon?: keyof typeof Ionicons.glyphMap;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputShell}>
      {icon ? <Ionicons color={colors.accentSea} name={icon} size={16} /> : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.subtle}
        style={styles.input}
      />
    </View>
  );
}

function SegmentedOptions<T extends string>({
  onSelect,
  options,
  selectedValue,
}: {
  onSelect: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = selectedValue === option.value;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.segmentedOption, selected && styles.segmentedOptionActive]}
          >
            <AppText align="center" tone={selected ? 'accent' : 'muted'} variant="metadata" weight="700">
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
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.equipmentToggle, active && styles.equipmentToggleActive]}>
      <Ionicons color={active ? colors.primaryDark : colors.muted} name={icon} size={16} />
      <AppText tone={active ? 'accent' : 'muted'} variant="metadata" weight="700">
        {label}
      </AppText>
    </Pressable>
  );
}

function ToggleCard({
  active,
  icon,
  label,
  onPress,
  text,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  text: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.permissionCard}>
      <View style={styles.permissionIcon}>
        <Ionicons color={colors.accentGoldDark} name={icon} size={20} />
      </View>
      <View style={styles.permissionCopy}>
        <AppText variant="titleSmall" weight="700">
          {label}
        </AppText>
        <AppText tone="muted" variant="metadata" weight="500">
          {text}
        </AppText>
      </View>
      <Ionicons color={active ? colors.primaryDark : colors.subtle} name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} />
    </Pressable>
  );
}

function AgreementRow({ label }: { label: string }) {
  return (
    <View style={styles.agreementRow}>
      <View style={styles.agreementIcon}>
        <Ionicons color={colors.primaryDark} name="checkmark" size={14} />
      </View>
      <AppText variant="metadata" weight="600">
        {label}
      </AppText>
    </View>
  );
}

function splitName(name: string) {
  const [firstName = '', ...rest] = name.split(' ');
  return {
    firstName,
    lastName: rest.join(' '),
  };
}

function getInitials(firstName: string, lastName: string, fallback: string) {
  const initials = [firstName.trim().charAt(0), lastName.trim().charAt(0)].filter(Boolean).join('');
  return initials.toUpperCase() || fallback;
}

const styles = StyleSheet.create({
  acceptCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 68,
    padding: spacing.md,
  },
  acceptCardActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.36)',
  },
  acceptCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  agreementIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  agreementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  backgroundGlow: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  beachChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  beachChipSelected: {
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.28)',
  },
  beachGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 26,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  content: {
    gap: spacing.xl,
    paddingBottom: 140,
    paddingHorizontal: spacing.xl2,
  },
  equipmentToggle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
  },
  equipmentToggleActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.36)',
  },
  field: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  footer: {
    backgroundColor: 'rgba(248, 241, 227, 0.92)',
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: spacing.xl2,
    position: 'absolute',
    right: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl2,
    paddingTop: spacing.md,
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
    backgroundColor: colors.surfaceRaised,
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
  permissionCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 78,
    padding: spacing.md,
  },
  permissionCardActive: {
    backgroundColor: colors.surfaceAqua,
    borderColor: 'rgba(27, 183, 168, 0.28)',
  },
  permissionCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  permissionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  previewCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  previewCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 54,
    ...shadows.soft,
  },
  primaryButtonDisabled: {
    opacity: 0.48,
  },
  rankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rankPill: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    minHeight: 34,
    minWidth: 52,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
  },
  rankPillSelected: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.36)',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    gap: spacing.md,
    paddingTop: spacing.xl2,
  },
  sectionCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
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
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  segmented: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  segmentedOption: {
    alignItems: 'center',
    borderRadius: radius.round,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  segmentedOptionActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.42)',
    borderWidth: 1,
  },
  stepDot: {
    backgroundColor: colors.border,
    borderRadius: radius.round,
    height: 7,
    width: 7,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  stepDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
