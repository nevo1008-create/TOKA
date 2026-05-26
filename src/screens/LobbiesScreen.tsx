import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LobbyCard } from '../components/LobbyCard';
import { colors, radius, spacing } from '../theme';
import type { Lobby } from '../types';

type LobbiesScreenProps = {
  lobbies: Lobby[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
};

const filters = ['Nearby', 'Has spots', 'Requests', 'B-League'];

export function LobbiesScreen({ lobbies, selectedFilter, setSelectedFilter }: LobbiesScreenProps) {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Lobbies</Text>
      <Text style={styles.screenIntro}>
        Browse games by distance, availability, level, gender rules, and approval state.
      </Text>
      <ScrollView horizontal contentContainerStyle={styles.filterRow} showsHorizontalScrollIndicator={false}>
        {filters.map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {lobbies.map((lobby) => (
        <LobbyCard key={lobby.id} lobby={lobby} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.md,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  screenIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterChipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
});
