import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  I18nManager,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { currentPlayer, lobbies } from './src/data/mock';
import { colors, radius, spacing } from './src/theme';
import type { Lobby, Player } from './src/types';

I18nManager.allowRTL(true);

type Tab = 'home' | 'lobbies' | 'create' | 'profile';

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'home', label: 'בית' },
  { id: 'lobbies', label: 'לובים' },
  { id: 'create', label: 'יצירה' },
  { id: 'profile', label: 'פרופיל' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedFilter, setSelectedFilter] = useState('קרוב אליי');
  const upcomingLobby = lobbies[0];
  const nearbyLobbies = useMemo(
    () =>
      selectedFilter === 'יש מקום'
        ? lobbies.filter((lobby) => lobby.playerCount < lobby.capacity)
        : lobbies,
    [selectedFilter],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        <Header />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'home' && (
            <HomeScreen
              upcomingLobby={upcomingLobby}
              nearbyLobbies={nearbyLobbies}
              onCreate={() => setActiveTab('create')}
              onOpenLobbies={() => setActiveTab('lobbies')}
            />
          )}
          {activeTab === 'lobbies' && (
            <LobbiesScreen
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              lobbies={nearbyLobbies}
            />
          )}
          {activeTab === 'create' && <CreateScreen />}
          {activeTab === 'profile' && <ProfileScreen player={currentPlayer} />}
        </ScrollView>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.brandMark}>
        <Text style={styles.brandBall}>T</Text>
      </View>
      <View style={styles.headerCopy}>
        <Text style={styles.brand}>TOKA</Text>
        <Text style={styles.subtleText}>פוצ'יוולי לפי רמה, מקום ואנשים</Text>
      </View>
    </View>
  );
}

function HomeScreen({
  upcomingLobby,
  nearbyLobbies,
  onCreate,
  onOpenLobbies,
}: {
  upcomingLobby: Lobby;
  nearbyLobbies: Lobby[];
  onCreate: () => void;
  onOpenLobbies: () => void;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>המשחק הבא שלך כבר כמעט מלא</Text>
        <Text style={styles.heroText}>
          מצא רביעייה שמתאימה לרמה שלך, או פתח לובי ותן לקהילה להשלים אותו.
        </Text>
        <View style={styles.heroActions}>
          <Pressable style={styles.primaryButton} onPress={onCreate}>
            <Text style={styles.primaryButtonText}>צור משחק</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onOpenLobbies}>
            <Text style={styles.secondaryButtonText}>ראה לובים</Text>
          </Pressable>
        </View>
      </View>

      <SectionTitle title="המשחקים הבאים שלי" action="הכל" />
      <LobbyCard lobby={upcomingLobby} featured />

      <SectionTitle title="משחקים בסביבה שלי" action="סינון" />
      {nearbyLobbies.slice(1).map((lobby) => (
        <LobbyCard key={lobby.id} lobby={lobby} />
      ))}

      <SectionTitle title="היסטוריה" />
      <View style={styles.historyRow}>
        <Text style={styles.historyScore}>+42</Text>
        <View style={styles.historyTextGroup}>
          <Text style={styles.rowTitle}>משחקים ודירוגים אחרונים</Text>
          <Text style={styles.subtleText}>
            3 משחקים החודש, 100% השלמת דירוגים.
          </Text>
        </View>
      </View>
    </View>
  );
}

function LobbiesScreen({
  selectedFilter,
  setSelectedFilter,
  lobbies: filteredLobbies,
}: {
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  lobbies: Lobby[];
}) {
  const filters = ['קרוב אליי', 'יש מקום', 'B-C', 'היום'];

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>לובים פתוחים</Text>
      <Text style={styles.screenIntro}>
        הרשימה מסודרת לפי אזור ותתעדכן בהמשך לפי מיקום חי.
      </Text>
      <ScrollView
        horizontal
        contentContainerStyle={styles.filterRow}
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
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
      {filteredLobbies.map((lobby) => (
        <LobbyCard key={lobby.id} lobby={lobby} />
      ))}
    </View>
  );
}

function CreateScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>יצירת משחק</Text>
      <Text style={styles.screenIntro}>
        זה ה-wizard הראשון. בשלב הבא נחבר אותו לטופס אמיתי ול-Supabase.
      </Text>
      <CreateStep index="1" title="מתי ואיפה" body="תאריך, שעה, חוף או כתובת." />
      <CreateStep
        index="2"
        title="רמה וכמות"
        body="טווח רמות, 4-6 שחקנים ורמת תחרותיות."
      />
      <CreateStep
        index="3"
        title="הגדרות לובי"
        body="פתוח או נעול, סיסמה, רשימת המתנה וציוד."
      />
      <Pressable style={styles.primaryButtonWide}>
        <Text style={styles.primaryButtonText}>המשך לבניית לובי</Text>
      </Pressable>
    </View>
  );
}

function ProfileScreen({ player }: { player: Player }) {
  return (
    <View style={styles.screen}>
      <View style={styles.profileHeader}>
        <Avatar player={player} size={64} />
        <View style={styles.profileCopy}>
          <Text style={styles.screenTitle}>{player.name}</Text>
          <Text style={styles.screenIntro}>
            {player.area} · רגל {player.preferredFoot}
          </Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <Stat label="רמה" value={player.level} />
        <Stat label="משחקים" value={`${player.gamesPlayed}`} />
        <Stat label="נקודות TOKA" value="328" />
      </View>
      <View style={styles.profilePanel}>
        <Text style={styles.rowTitle}>סטטוס דירוג</Text>
        <Text style={styles.subtleText}>
          הרמה מתחילה להתייצב אחרי שלושה משחקים מדורגים. כרגע נציג כאן באדג'
          רמה, משחקים וחברים.
        </Text>
      </View>
    </View>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

function LobbyCard({ lobby, featured = false }: { lobby: Lobby; featured?: boolean }) {
  const statusLabel =
    lobby.status === 'open' ? 'פתוח' : lobby.status === 'locked' ? 'נעול' : 'מלא';

  return (
    <View style={[styles.card, featured && styles.featuredCard]}>
      <View style={styles.cardTopRow}>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
        <Text style={styles.cardTime}>{lobby.startsAt}</Text>
      </View>
      <Text style={styles.cardTitle}>{lobby.title}</Text>
      <Text style={styles.cardMeta}>
        {lobby.location} · {lobby.levelRange}
      </Text>
      <Text style={styles.cardNote}>{lobby.note}</Text>
      <View style={styles.cardBottomRow}>
        <View style={styles.avatarStack}>
          {lobby.players.slice(0, 4).map((player) => (
            <Avatar key={player.id} player={player} size={32} />
          ))}
        </View>
        <View style={styles.capacityBox}>
          <Text style={styles.capacityText}>
            {lobby.playerCount}/{lobby.capacity}
          </Text>
          <Text style={styles.capacityLabel}>
            {lobby.waitlistCount > 0
              ? `${lobby.waitlistCount} בהמתנה`
              : 'אין המתנה'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Avatar({ player, size }: { player: Player; size: number }) {
  return (
    <View style={[styles.avatar, { height: size, width: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>
        {player.initials}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CreateStep({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepIndex}>
        <Text style={styles.stepIndexText}>{index}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.subtleText}>{body}</Text>
      </View>
    </View>
  );
}

function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCreate = tab.id === 'create';

        return (
          <Pressable
            key={tab.id}
            style={[styles.navItem, isCreate && styles.createNavItem]}
            onPress={() => onChange(tab.id)}
          >
            <View
              style={[
                styles.navIcon,
                isActive && styles.navIconActive,
                isCreate && styles.createNavIcon,
              ]}
            >
              <Text
                style={[
                  styles.navIconText,
                  isActive && styles.navIconTextActive,
                  isCreate && styles.createNavIconText,
                ]}
              >
                {isCreate ? 'T' : tab.label.slice(0, 1)}
              </Text>
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
    direction: 'rtl',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.md,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.round,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  brandBall: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  headerCopy: {
    alignItems: 'flex-end',
    flex: 1,
  },
  brand: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtleText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  content: {
    paddingBottom: 112,
    paddingHorizontal: spacing.lg,
  },
  screen: {
    gap: spacing.md,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 36,
    textAlign: 'right',
  },
  heroText: {
    color: '#EAF4EC',
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  heroActions: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonWide: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    marginTop: spacing.sm,
    paddingVertical: spacing.lg,
  },
  primaryButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#CDE5D5',
    borderRadius: radius.round,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionHeading: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'right',
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  featuredCard: {
    borderColor: colors.primary,
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  cardTime: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'right',
  },
  cardMeta: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  cardNote: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'right',
  },
  cardBottomRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  avatarStack: {
    flexDirection: 'row-reverse',
    gap: -6,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.sand,
    borderColor: colors.surface,
    borderWidth: 2,
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.ink,
    fontWeight: '900',
  },
  capacityBox: {
    alignItems: 'flex-start',
  },
  capacityText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  capacityLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  historyRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row-reverse',
    gap: spacing.md,
    padding: spacing.lg,
  },
  historyScore: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  historyTextGroup: {
    alignItems: 'flex-end',
    flex: 1,
  },
  rowTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'right',
  },
  screenIntro: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  filterRow: {
    flexDirection: 'row-reverse',
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
  stepRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: spacing.md,
    padding: spacing.lg,
  },
  stepIndex: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepIndexText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  stepCopy: {
    alignItems: 'flex-end',
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.md,
  },
  profileCopy: {
    alignItems: 'flex-end',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row-reverse',
    gap: spacing.sm,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.lg,
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  profilePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    bottom: spacing.lg,
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    left: spacing.lg,
    padding: spacing.sm,
    position: 'absolute',
    right: spacing.lg,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  createNavItem: {
    transform: [{ translateY: -10 }],
  },
  navIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  navIconActive: {
    backgroundColor: colors.ink,
  },
  createNavIcon: {
    backgroundColor: colors.accent,
    height: 54,
    width: 54,
  },
  navIconText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  navIconTextActive: {
    color: colors.surface,
  },
  createNavIconText: {
    color: colors.ink,
    fontSize: 22,
  },
  navLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  navLabelActive: {
    color: colors.ink,
  },
});
