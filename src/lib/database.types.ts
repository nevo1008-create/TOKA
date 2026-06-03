import type {
  CapacityMode,
  Gender,
  GenderRule,
  LobbyStatus,
  LobbyVisibility,
  PlayerLevel,
  PlayerSide,
  PreferredFoot,
  RankRuleType,
  RankStatus,
} from '../types';

export type DbPlayer = {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  gender: Gender;
  level: PlayerLevel;
  rank_status: RankStatus;
  toca_points: number;
  games_played: number;
  preferred_foot: PreferredFoot;
  side: PlayerSide;
  area: string;
  initials: string;
  has_ball: boolean;
  has_court_marks: boolean;
  friend_ids: string[];
  created_at: string;
  updated_at: string;
};

export type DbLocation = {
  id: string;
  name: string;
  city: string;
  area: string;
  distance_km: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type DbLobby = {
  id: string;
  host_player_id: string;
  location_id: string;
  title: string;
  location_description: string | null;
  starts_at: string;
  status: LobbyStatus;
  visibility: LobbyVisibility;
  capacity_mode: CapacityMode;
  min_players: number;
  max_players: number;
  rank_rule_type: RankRuleType;
  rank_min: PlayerLevel | null;
  rank_max: PlayerLevel | null;
  rank_exact: PlayerLevel | null;
  gender_rule: GenderRule;
  competitive_level: 'casual' | 'balanced' | 'competitive' | null;
  waitlist_enabled: boolean;
  exception_requests_enabled: boolean;
  cancellation_penalty_minutes: number | null;
  pin_code_hash: string | null;
  ball_needed: boolean;
  court_marks_needed: boolean;
  note: string;
  created_at: string;
  updated_at: string;
};

export type DbLobbyMembershipStatus =
  | 'joined'
  | 'waitlisted'
  | 'pending_approval'
  | 'declined'
  | 'left'
  | 'removed'
  | 'cancelled_on_time'
  | 'cancelled_late'
  | 'no_show'
  | 'attended';

export type DbLobbyMembership = {
  id: string;
  lobby_id: string;
  player_id: string;
  status: DbLobbyMembershipStatus;
  role: 'host' | 'member';
  brings_ball: boolean;
  brings_court_marks: boolean;
  position: number | null;
  requested_reasons: string[];
  request_message: string | null;
  requested_at: string | null;
  joined_at: string | null;
  left_at: string | null;
  approved_at: string | null;
  approved_by_player_id: string | null;
  declined_at: string | null;
  declined_by_player_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbLobbyMessage = {
  id: string;
  lobby_id: string;
  sender_player_id: string;
  channel: 'all' | 'admin_joined';
  body: string;
  created_at: string;
  deleted_at: string | null;
};

export type DbNotification = {
  id: string;
  recipient_player_id: string | null;
  type: string;
  title: string;
  body: string;
  related_lobby_id: string | null;
  related_player_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type DbLobbyWithRelations = DbLobby & {
  locations: DbLocation | null;
  lobby_memberships: DbLobbyMembership[];
};

export type Database = {
  public: {
    Tables: {
      players: {
        Row: DbPlayer;
        Insert: Partial<DbPlayer> & Pick<DbPlayer, 'display_name' | 'gender' | 'level'>;
        Update: Partial<DbPlayer>;
      };
      locations: {
        Row: DbLocation;
        Insert: Partial<DbLocation> & Pick<DbLocation, 'name' | 'city' | 'area'>;
        Update: Partial<DbLocation>;
      };
      lobbies: {
        Row: DbLobby;
        Insert: Partial<DbLobby> & Pick<DbLobby, 'host_player_id' | 'location_id' | 'title' | 'starts_at' | 'min_players' | 'max_players' | 'gender_rule' | 'rank_rule_type'>;
        Update: Partial<DbLobby>;
      };
      lobby_memberships: {
        Row: DbLobbyMembership;
        Insert: Partial<DbLobbyMembership> & Pick<DbLobbyMembership, 'lobby_id' | 'player_id' | 'status'>;
        Update: Partial<DbLobbyMembership>;
      };
      lobby_messages: {
        Row: DbLobbyMessage;
        Insert: Partial<DbLobbyMessage> & Pick<DbLobbyMessage, 'lobby_id' | 'sender_player_id' | 'channel' | 'body'>;
        Update: Partial<DbLobbyMessage>;
      };
      notifications: {
        Row: DbNotification;
        Insert: Partial<DbNotification> & Pick<DbNotification, 'type' | 'title' | 'body'>;
        Update: Partial<DbNotification>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
