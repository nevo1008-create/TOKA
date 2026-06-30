import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';

import { AppText } from '../components/AppText';
import {
  getRecommendedIsraelBeaches,
  searchIsraelBeaches,
  searchIsraelLocations,
  type IsraelBeachOption,
  type IsraelLocationOption,
} from '../data/israelPlaces';
import { colors, fontFamilies, radius, shadows, spacing } from '../theme';
import { playerLevels, type Gender, type Player, type PlayerLevel, type PlayerSide, type PreferredFoot } from '../types';
import { CommunityGuidelinesScreen } from './CommunityGuidelinesScreen';
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen';
import { TermsOfServiceScreen } from './TermsOfServiceScreen';

type SignupWizardScreenProps = {
  email?: string;
  onBack: () => void;
  onComplete: (player: Player) => void;
  onUploadProfilePhoto?: (imageUri: string) => Promise<{ avatarPath: string; avatarUrl: string }>;
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

export function SignupWizardScreen({ email, onBack, onComplete, onUploadProfilePhoto, player }: SignupWizardScreenProps) {
  const initialName = splitName(player.name);
  const [step, setStep] = useState(0);
  const [wizardLegalScreen, setWizardLegalScreen] = useState<'guidelines' | 'privacy' | 'terms' | null>(null);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [location, setLocation] = useState(player.area);
  const [selectedLocation, setSelectedLocation] = useState<IsraelLocationOption | null>(null);
  const [avatarPath, setAvatarPath] = useState(player.avatarPath ?? null);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState(player.avatarUrl ?? null);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [gender, setGender] = useState<Gender>(player.gender);
  const [rank, setRank] = useState<PlayerLevel>(player.level);
  const [preferredFoot, setPreferredFoot] = useState<PreferredFoot>(player.preferredFoot);
  const [preferredSide, setPreferredSide] = useState<PlayerSide>(player.side);
  const [hasBall, setHasBall] = useState(player.hasBall);
  const [hasCourtMarks, setHasCourtMarks] = useState(player.hasCourtMarks);
  const [beachQuery, setBeachQuery] = useState('');
  const [preferredBeaches, setPreferredBeaches] = useState<string[]>([]);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(player.pushNotificationsEnabled ?? false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const fullName = useMemo(() => [firstName.trim(), lastName.trim()].filter(Boolean).join(' '), [firstName, lastName]);
  const initials = getInitials(firstName, lastName, player.initials);
  const canContinue =
    step === 0
      ? firstName.trim().length > 0 && lastName.trim().length > 0 && Boolean(selectedLocation)
      : step === 3
        ? termsAccepted
        : true;
  const isLastStep = step === 3;

  async function goNext() {
    if (!canContinue || isPhotoUploading) {
      return;
    }

    if (!isLastStep) {
      setStep((current) => current + 1);
      return;
    }

    let finalAvatarPath = avatarPath;
    let finalAvatarUrl = avatarPreviewUri;

    if (selectedPhotoUri && onUploadProfilePhoto) {
      setIsPhotoUploading(true);
      setPhotoError(null);

      try {
        const uploadedPhoto = await onUploadProfilePhoto(selectedPhotoUri);

        finalAvatarPath = uploadedPhoto.avatarPath;
        finalAvatarUrl = uploadedPhoto.avatarUrl;
        setAvatarPath(uploadedPhoto.avatarPath);
        setAvatarPreviewUri(uploadedPhoto.avatarUrl);
        setSelectedPhotoUri(null);
      } catch (error) {
        setPhotoError(error instanceof Error ? error.message : 'Could not save profile photo.');
        return;
      } finally {
        setIsPhotoUploading(false);
      }
    }

    onComplete({
      ...player,
      area: selectedLocation?.displayName ?? location.trim(),
      avatarFocusX: 50,
      avatarFocusY: 50,
      avatarPath: finalAvatarPath,
      avatarUrl: finalAvatarUrl,
      gender,
      hasBall,
      hasCourtMarks,
      initials,
      level: rank,
      name: fullName || player.name,
      preferredFoot,
      pushNotificationsEnabled,
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

  async function pickProfilePhoto() {
    if (isPhotoUploading) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: Platform.OS !== 'web',
      aspect: [1, 1],
      mediaTypes: 'images',
      quality: 1,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const selectedAsset = result.assets[0];
    const imageUri = getProfilePhotoPreviewUri(selectedAsset);

    setAvatarPath(null);
    setAvatarPreviewUri(imageUri);
    setSelectedPhotoUri(imageUri);
    setPhotoError(null);
  }

  function removeProfilePhoto() {
    setAvatarPath(null);
    setAvatarPreviewUri(null);
    setSelectedPhotoUri(null);
    setPhotoError(null);
  }

  if (wizardLegalScreen === 'privacy') {
    return (
      <PrivacyPolicyScreen
        onBack={() => setWizardLegalScreen(null)}
        showReportCard={false}
      />
    );
  }

  if (wizardLegalScreen === 'terms') {
    return (
      <TermsOfServiceScreen
        onBack={() => setWizardLegalScreen(null)}
        showReportCard={false}
      />
    );
  }

  if (wizardLegalScreen === 'guidelines') {
    return (
      <CommunityGuidelinesScreen
        onBack={() => setWizardLegalScreen(null)}
        showReportCard={false}
      />
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
            <ProfilePhotoCard
              avatarUri={avatarPreviewUri}
              errorMessage={photoError}
              initials={initials}
              isUploading={isPhotoUploading}
              onPickPhoto={pickProfilePhoto}
              onRemovePhoto={removeProfilePhoto}
            />

            <TwoColumn>
              <Field label="First name" required style={styles.fieldInRow}>
                <WarmInput onChangeText={setFirstName} placeholder="First name" value={firstName} />
              </Field>
              <Field label="Last name" required style={styles.fieldInRow}>
                <WarmInput onChangeText={setLastName} placeholder="Last name" value={lastName} />
              </Field>
            </TwoColumn>
            <Field elevated label="Location" required>
              <LocationAutocomplete
                onSelect={(nextLocation) => {
                  setSelectedLocation(nextLocation);
                  setLocation(nextLocation.displayName);
                  setBeachQuery('');
                  setPreferredBeaches([]);
                }}
                onTextChange={(nextLocation) => {
                  setLocation(nextLocation);
                  setSelectedLocation(null);
                  setBeachQuery('');
                  setPreferredBeaches([]);
                }}
                value={location}
              />
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
              <OnboardingRankSlider rank={rank} onChange={setRank} />
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
            <Field elevated label="Preferred beaches">
              <BeachAutocomplete
                locationId={selectedLocation?.id}
                onQueryChange={setBeachQuery}
                onToggleBeach={toggleBeach}
                query={beachQuery}
                selectedBeaches={preferredBeaches}
              />
            </Field>

            <ToggleCard
              active={pushNotificationsEnabled}
              icon="notifications-outline"
              label="Phone notifications"
              onPress={() => setPushNotificationsEnabled((current) => !current)}
              text="Send push alerts to your phone for room invites, waitlist updates, and rating reminders. In-app notifications stay on."
            />
          </WizardSection>
        ) : null}

        {step === 3 ? (
          <WizardSection
            icon="shield-checkmark-outline"
            subtitle="A trusted beach community works when everyone knows the rules."
            title="Community agreement"
          >
            <AgreementRow label="I agree to the Terms of service" onPress={() => setWizardLegalScreen('terms')} />
            <AgreementRow label="I understand the Privacy policy" onPress={() => setWizardLegalScreen('privacy')} />
            <AgreementRow label="I will follow the Community guidelines" onPress={() => setWizardLegalScreen('guidelines')} />

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
          disabled={!canContinue || isPhotoUploading}
          onPress={goNext}
          style={[styles.primaryButton, (!canContinue || isPhotoUploading) && styles.primaryButtonDisabled]}
        >
          <AppText align="center" tone="inverse" variant="button" weight="700">
            {isLastStep ? (isPhotoUploading ? 'Saving photo...' : 'Enter TOCA') : 'Continue'}
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

function Field({
  children,
  elevated,
  label,
  required,
  style,
}: {
  children: ReactNode;
  elevated?: boolean;
  label: string;
  required?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.field, style, elevated && styles.fieldElevated]}>
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

function ProfilePhotoCard({
  avatarUri,
  errorMessage,
  initials,
  isUploading,
  onPickPhoto,
  onRemovePhoto,
}: {
  avatarUri?: string | null;
  errorMessage?: string | null;
  initials: string;
  isUploading: boolean;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
}) {
  return (
    <View style={styles.photoCard}>
      <Pressable
        accessibilityLabel="Add profile picture"
        accessibilityRole="button"
        onPress={onPickPhoto}
        style={styles.photoAvatarWrap}
      >
        <View style={styles.photoAvatarClip}>
          {avatarUri ? (
            <AvatarPreviewImage uri={avatarUri} />
          ) : (
            <LinearGradient
              colors={[colors.surfaceAqua, colors.surfaceYellow]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.photoAvatarFallback}
            >
              <AppText align="center" variant="heroTitle" weight="800">
                {initials}
              </AppText>
            </LinearGradient>
          )}
        </View>
        <View style={styles.photoCameraBadge}>
          {isUploading ? (
            <ActivityIndicator color={colors.primaryDark} size="small" />
          ) : (
            <Ionicons color={colors.primaryDark} name="camera-outline" size={15} />
          )}
        </View>
      </Pressable>

      <View style={styles.photoCardCopy}>
        <AppText variant="titleSmall" weight="800">
          Add your profile picture
        </AppText>
        {errorMessage ? (
          <AppText tone="danger" variant="caption" weight="700">
            {errorMessage}
          </AppText>
        ) : null}
      </View>

      {avatarUri ? (
        <View style={styles.photoActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isUploading}
            onPress={onRemovePhoto}
            style={[styles.photoActionButton, isUploading && styles.photoActionButtonDisabled]}
          >
            <AppText align="center" tone="muted" variant="metadata" weight="800">
              Remove
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function AvatarPreviewImage({ uri }: { uri: string }) {
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.photoAvatarImage,
          {
            backgroundImage: `url("${uri}")`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          } as ViewStyle,
        ]}
      />
    );
  }

  return <Image resizeMode="cover" source={{ uri }} style={styles.photoAvatarImage} />;
}

function getProfilePhotoPreviewUri(asset: ImagePicker.ImagePickerAsset) {
  if (Platform.OS === 'web' && asset.file) {
    return URL.createObjectURL(asset.file);
  }

  return asset.uri;
}

function LocationAutocomplete({
  onSelect,
  onTextChange,
  value,
}: {
  onSelect: (location: IsraelLocationOption) => void;
  onTextChange: (value: string) => void;
  value: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = searchIsraelLocations(value);
  const shouldShowSuggestions = isFocused && value.trim().length > 0 && suggestions.length > 0;

  return (
    <View style={styles.locationAutocomplete}>
      <WarmInput
        autoCorrect={false}
        icon="location"
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 120);
        }}
        onChangeText={onTextChange}
        onFocus={() => setIsFocused(true)}
        placeholder="Search your city"
        value={value}
      />

      {shouldShowSuggestions ? (
        <View style={styles.locationSuggestionMenu}>
          {suggestions.map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.id}
              onPress={() => {
                onSelect(suggestion);
                setIsFocused(false);
              }}
              style={styles.locationSuggestionRow}
            >
              <View style={styles.locationSuggestionIcon}>
                <Ionicons color={colors.accentSea} name="location" size={14} />
              </View>
              <View style={styles.locationSuggestionCopy}>
                <AppText numberOfLines={1} variant="metadata" weight="800">
                  {suggestion.city}
                </AppText>
                <AppText numberOfLines={1} tone="muted" variant="caption" weight="600">
                  {suggestion.area}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function BeachAutocomplete({
  locationId,
  onQueryChange,
  onToggleBeach,
  query,
  selectedBeaches,
}: {
  locationId?: string;
  onQueryChange: (value: string) => void;
  onToggleBeach: (beach: string) => void;
  query: string;
  selectedBeaches: string[];
}) {
  const [isFocused, setIsFocused] = useState(false);
  const suggestions = searchIsraelBeaches(query);
  const shouldShowSuggestions = isFocused && query.trim().length > 0 && suggestions.length > 0;
  const recommendedBeaches = getRecommendedIsraelBeaches(locationId).filter(
    (beach) => !selectedBeaches.includes(beach.displayName),
  );

  function selectBeach(beach: IsraelBeachOption) {
    onToggleBeach(beach.displayName);
    onQueryChange('');
    setIsFocused(false);
  }

  return (
    <View style={styles.beachAutocomplete}>
      <WarmInput
        autoCorrect={false}
        icon="location"
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 120);
        }}
        onChangeText={onQueryChange}
        onFocus={() => setIsFocused(true)}
        placeholder="Search preferred beaches"
        value={query}
      />

      {shouldShowSuggestions ? (
        <View style={styles.beachSuggestionMenu}>
          {suggestions.map((suggestion) => {
            const selected = selectedBeaches.includes(suggestion.displayName);

            return (
              <Pressable
                accessibilityRole="button"
                key={suggestion.id}
                onPress={() => selectBeach(suggestion)}
                style={styles.locationSuggestionRow}
              >
                <View style={styles.locationSuggestionIcon}>
                  <Ionicons color={selected ? colors.primaryDark : colors.accentSea} name="location" size={14} />
                </View>
                <View style={styles.locationSuggestionCopy}>
                  <AppText numberOfLines={1} variant="metadata" weight="800">
                    {suggestion.displayName}
                  </AppText>
                  <AppText numberOfLines={1} tone="muted" variant="caption" weight="600">
                    {suggestion.city} - {suggestion.area}
                  </AppText>
                </View>
                <Ionicons
                  color={selected ? colors.primaryDark : colors.subtle}
                  name={selected ? 'checkmark-circle' : 'add-circle-outline'}
                  size={18}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {selectedBeaches.length > 0 ? (
        <View style={styles.beachPickerBlock}>
          <AppText tone="muted" variant="caption" weight="800">
            Selected
          </AppText>
          <View style={styles.beachGrid}>
            {selectedBeaches.map((beach) => (
              <BeachChip key={beach} label={beach} onPress={() => onToggleBeach(beach)} selected />
            ))}
          </View>
        </View>
      ) : null}

      {recommendedBeaches.length > 0 ? (
        <View style={styles.beachPickerBlock}>
          <AppText tone="muted" variant="caption" weight="800">
            Recommended in your city
          </AppText>
          <View style={styles.beachGrid}>
            {recommendedBeaches.map((beach) => (
              <BeachChip key={beach.id} label={beach.displayName} onPress={() => onToggleBeach(beach.displayName)} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function BeachChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.beachChip, selected && styles.beachChipSelected]}>
      <Ionicons color={selected ? colors.primaryDark : colors.accentSea} name={selected ? 'checkmark-circle' : 'location'} size={13} />
      <AppText numberOfLines={1} tone={selected ? 'accent' : 'muted'} variant="chip" weight="700">
        {label}
      </AppText>
    </Pressable>
  );
}

function OnboardingRankSlider({
  onChange,
  rank,
}: {
  onChange: (rank: PlayerLevel) => void;
  rank: PlayerLevel;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const rankIndex = getRankIndex(rank);
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
            onChange(playerLevels[nextIndex]);
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
    const nextIndex = clampRankIndex(Math.round((clampedX / availableTrackWidth) * (playerLevels.length - 1)));

    onChange(playerLevels[nextIndex]);
  }

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.onboardingRankCard}>
      <View style={styles.rankBubbleRow}>
        <View style={[styles.rankBubble, { left: `${percent}%` }]}>
          <AppText align="center" tone="accent" variant="chip" weight="900">
            {rank}
          </AppText>
        </View>
      </View>
      <View style={styles.rankEnds}>
        <AppText tone="muted" variant="caption" weight="800">
          A-
        </AppText>
        <AppText tone="muted" variant="caption" weight="800">
          League
        </AppText>
      </View>
      <View {...responder.panHandlers} onLayout={handleLayout} style={styles.onboardingRankBar}>
        <View style={styles.onboardingRankTrackLine} />
        <View pointerEvents="none" style={styles.onboardingRankTicks}>
          {playerLevels.map((level) => (
            <View key={level} style={styles.onboardingRankTick} />
          ))}
        </View>
        <View style={[styles.onboardingRankTrackFill, { width: `${percent}%` }]} />
        <View style={[styles.onboardingRankThumbTouchArea, { left: `${percent}%` }]}>
          <View style={styles.onboardingRankThumb}>
            <Ionicons color={colors.textOnGreen} name="football-outline" size={13} />
          </View>
        </View>
      </View>
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
            <AppText align="center" numberOfLines={1} tone={selected ? 'accent' : 'muted'} variant="metadata" weight="700">
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
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.equipmentToggle, active && styles.equipmentToggleActive]}
    >
      <View style={styles.equipmentToggleCopy}>
        <Ionicons color={active ? colors.primaryDark : colors.muted} name={icon} size={16} />
        <AppText numberOfLines={1} tone={active ? 'accent' : 'muted'} variant="metadata" weight="700">
          {label}
        </AppText>
      </View>
      <View style={[styles.equipmentSwitchTrack, active && styles.equipmentSwitchTrackActive]}>
        <View style={[styles.equipmentSwitchKnob, active && styles.equipmentSwitchKnobActive]} />
      </View>
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

function AgreementRow({ label, onPress }: { label: string; onPress?: () => void }) {
  const content = (
    <>
      <View style={styles.agreementIcon}>
        <Ionicons color={colors.primaryDark} name="checkmark" size={14} />
      </View>
      <AppText style={styles.agreementText} variant="metadata" weight="600">
        {label}
      </AppText>
      {onPress ? <Ionicons color={colors.muted} name="chevron-forward" size={16} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="link" onPress={onPress} style={[styles.agreementRow, styles.agreementRowPressable]}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.agreementRow}>
      {content}
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
    minHeight: 34,
  },
  agreementRowPressable: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  agreementText: {
    flex: 1,
    minWidth: 0,
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
  beachAutocomplete: {
    gap: spacing.sm,
    position: 'relative',
    zIndex: 4,
  },
  beachChip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    maxWidth: '100%',
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
  beachPickerBlock: {
    gap: spacing.xs,
  },
  beachSuggestionMenu: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    left: 0,
    marginTop: spacing.xs,
    padding: spacing.xs,
    position: 'absolute',
    right: 0,
    top: 52,
    zIndex: 10,
    ...shadows.soft,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  equipmentToggleActive: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.36)',
  },
  equipmentSwitchKnob: {
    backgroundColor: colors.muted,
    borderRadius: radius.round,
    height: 18,
    width: 18,
  },
  equipmentSwitchKnobActive: {
    backgroundColor: colors.textOnGreen,
    transform: [{ translateX: 16 }],
  },
  equipmentSwitchTrack: {
    backgroundColor: 'rgba(93, 119, 105, 0.16)',
    borderColor: colors.borderSoft,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 42,
  },
  equipmentSwitchTrackActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  equipmentToggleCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    minWidth: 0,
  },
  field: {
    gap: spacing.xs,
    minWidth: 0,
  },
  fieldElevated: {
    zIndex: 5,
  },
  fieldInRow: {
    flex: 1,
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
  locationAutocomplete: {
    position: 'relative',
    zIndex: 4,
  },
  locationSuggestionCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  locationSuggestionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAqua,
    borderRadius: radius.round,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  locationSuggestionMenu: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.xs,
    left: 0,
    marginTop: spacing.xs,
    padding: spacing.xs,
    position: 'absolute',
    right: 0,
    top: 52,
    zIndex: 10,
    ...shadows.soft,
  },
  locationSuggestionRow: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 19,
  },
  onboardingRankBar: {
    height: 34,
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: -2,
    position: 'relative',
  },
  onboardingRankCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'rgba(36, 196, 90, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 1,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  onboardingRankThumb: {
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
  onboardingRankThumbTouchArea: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    marginLeft: -23,
    position: 'absolute',
    width: 46,
    zIndex: 3,
  },
  onboardingRankTick: {
    backgroundColor: 'rgba(21, 153, 71, 0.24)',
    borderRadius: radius.round,
    height: 8,
    width: 2,
  },
  onboardingRankTicks: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 12,
    justifyContent: 'space-between',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  onboardingRankTrackFill: {
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    height: 6,
    left: 0,
    position: 'absolute',
    zIndex: 1,
  },
  onboardingRankTrackLine: {
    backgroundColor: colors.borderSoft,
    borderRadius: radius.round,
    height: 6,
  },
  permissionCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: 'rgba(36, 196, 90, 0.34)',
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 86,
    padding: spacing.md,
  },
  permissionCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  permissionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  photoActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
  },
  photoActionButtonDisabled: {
    opacity: 0.5,
  },
  photoActions: {
    gap: spacing.xs,
  },
  photoAvatarFallback: {
    alignItems: 'center',
    borderRadius: radius.round,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  photoAvatarClip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 72,
  },
  photoAvatarImage: {
    borderRadius: radius.round,
    height: 72,
    resizeMode: 'cover',
    width: 72,
  },
  photoAvatarWrap: {
    alignItems: 'center',
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    borderRadius: radius.round,
    borderWidth: 0,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  photoCameraBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceYellow,
    borderColor: colors.surface,
    borderRadius: radius.round,
    borderWidth: 2,
    bottom: 1,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 1,
    width: 28,
    ...shadows.soft,
  },
  photoCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  photoCardCopy: {
    flex: 1,
    gap: spacing.xxs,
    minWidth: 0,
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
  rankBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(36, 196, 90, 0.12)',
    borderColor: 'rgba(36, 196, 90, 0.24)',
    borderRadius: radius.round,
    borderWidth: 1,
    justifyContent: 'center',
    marginLeft: -19,
    minHeight: 24,
    minWidth: 38,
    paddingHorizontal: spacing.xs,
    position: 'absolute',
  },
  rankBubbleRow: {
    height: 26,
    marginHorizontal: spacing.md,
    overflow: 'visible',
    position: 'relative',
  },
  rankEnds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: -4,
    marginTop: -1,
    paddingHorizontal: spacing.md,
  },
  requiredPill: {
    backgroundColor: 'rgba(36, 196, 90, 0.12)',
    borderColor: 'rgba(36, 196, 90, 0.26)',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
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
