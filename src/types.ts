export const playerLevels = [
  'A-',
  'A',
  'A+',
  'B-',
  'B',
  'B+',
  'C-',
  'C',
  'C+',
  'D-',
  'D',
  'D+',
  'E-',
  'E',
  'E+',
  'League',
] as const;

export type PlayerLevel = (typeof playerLevels)[number];

export type Gender = 'male' | 'female';
export type GenderRule = Gender | 'everyone';
export type PreferredFoot = 'left' | 'right' | 'both';
export type PlayerSide = 'left' | 'right' | 'both';
export type RankStatus =
  | 'self_declared'
  | 'initial_rating'
  | 'stabilizing'
  | 'established';

export type LobbyStatus =
  | 'draft'
  | 'open'
  | 'full'
  | 'in_progress'
  | 'rating_open'
  | 'completed'
  | 'closed';

export type LobbyVisibility = 'public' | 'approval_required' | 'password' | 'invite_link';
export type RankRuleType = 'exact' | 'range' | 'any';
export type CapacityMode = 'fixed' | 'flexible';
export type ParticipantRole = 'admin' | 'joined' | 'waitlist';
export type ParticipantStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'removed'
  | 'cancelled_on_time'
  | 'cancelled_late'
  | 'no_show'
  | 'attended';

export type JoinRequestReason =
  | 'approval_required'
  | 'level_exception'
  | 'gender_exception'
  | 'private_access';

export type ChatChannelType = 'all' | 'admin_joined';
export type RatingTaskStatus = 'open' | 'completed' | 'overdue';
export type SkillVote = 'much_below' | 'below' | 'matches' | 'above' | 'much_above';
export type PunctualityVote = 'on_time' | 'around_on_time' | 'late';
export type PlayAgainVote = 'yes' | 'maybe' | 'no';

export type Player = {
  id: string;
  name: string;
  gender: Gender;
  level: PlayerLevel;
  rankStatus: RankStatus;
  tocaPoints: number;
  gamesPlayed: number;
  preferredFoot: PreferredFoot;
  side: PlayerSide;
  area: string;
  avatarFocusX?: number | null;
  avatarFocusY?: number | null;
  avatarPath?: string | null;
  avatarUrl?: string | null;
  initials: string;
  hasBall: boolean;
  hasCourtMarks: boolean;
  pushNotificationsEnabled?: boolean;
  friendIds: string[];
};

export type Location = {
  id: string;
  name: string;
  city: string;
  area: string;
  distanceKm?: number;
  description?: string;
};

export type LobbyParticipant = {
  playerId: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  bringsBall: boolean;
  bringsCourtMarks: boolean;
};

export type JoinRequest = {
  id: string;
  lobbyId: string;
  playerId: string;
  reasons: JoinRequestReason[];
  message?: string;
  adminDecisionRole?: Extract<ParticipantRole, 'joined' | 'waitlist'>;
  status: 'pending' | 'approved' | 'rejected';
};

export type ChatChannel = {
  id: string;
  lobbyId: string;
  type: ChatChannelType;
  title: string;
  participantRoles: ParticipantRole[];
  unreadCount: number;
};

export type ChatMessage = {
  id: string;
  lobbyId: string;
  channelId: string;
  playerId: string;
  body: string;
  createdAt: string;
};

export type RatingTask = {
  id: string;
  lobbyId: string;
  playerId: string;
  status: RatingTaskStatus;
  openedAt: string;
  remainingPlayerIds: string[];
  skippedPlayerIds: string[];
};

export type Notification = {
  id: string;
  type:
    | 'join_request'
    | 'request_approved'
    | 'request_rejected'
    | 'room_invite'
    | 'waitlist_update'
    | 'rating_required'
    | 'lobby_changed';
  title: string;
  body: string;
  lobbyId?: string;
  read: boolean;
};

export type Lobby = {
  id: string;
  title: string;
  location: Location;
  locationDescription?: string;
  /**
   * ISO datetime string. UI should format this value for display.
   */
  startsAt: string;
  status: LobbyStatus;
  visibility: LobbyVisibility;
  capacityMode: CapacityMode;
  minPlayers: number;
  maxPlayers: number;
  rankRuleType: RankRuleType;
  rankMin?: PlayerLevel;
  rankMax?: PlayerLevel;
  rankExact?: PlayerLevel;
  genderRule: GenderRule;
  competitiveLevel?: 'casual' | 'balanced' | 'competitive';
  waitlistEnabled: boolean;
  exceptionRequestsEnabled: boolean;
  cancellationPenaltyMinutes?: number;
  accessCode?: string;
  ballNeeded: boolean;
  courtMarksNeeded: boolean;
  note: string;
  adminId: string;
  participants: LobbyParticipant[];
  joinRequests: JoinRequest[];
  chatChannels: ChatChannel[];
};
