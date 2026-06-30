import type {
  CapacityMode,
  FriendRequestStatus,
  Gender,
  GenderRule,
  LobbyStatus,
  LobbyVisibility,
  PlayerLevel,
  PlayerSide,
  PreferredFoot,
  RankRuleType,
  RankStatus,
  ReportContext,
  ReportEmailNotificationStatus,
  ReportStatus,
  ReportType,
  SkillRankVoteType,
  TocaPointEventType,
} from '../types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DbPlayer = {
  id: string;
  auth_user_id: string | null;
  display_name: string;
  gender: Gender;
  level: PlayerLevel;
  rank_status: RankStatus;
  rating_average: number | null;
  rating_count: number;
  toca_points: number;
  games_played: number;
  preferred_foot: PreferredFoot;
  side: PlayerSide;
  area: string;
  avatar_focus_x: number | null;
  avatar_focus_y: number | null;
  avatar_path: string | null;
  initials: string;
  has_ball: boolean;
  has_court_marks: boolean;
  push_notifications_enabled: boolean;
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
  match_locked_at: string | null;
  match_participant_ids: string[] | null;
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

export type DbFriendRequest = {
  id: string;
  requester_player_id: string;
  recipient_player_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
};

export type DbPlayerBlock = {
  id: string;
  blocker_player_id: string;
  blocked_player_id: string;
  created_at: string;
};

export type DbTocaPointEvent = {
  id: string;
  player_id: string;
  lobby_id: string | null;
  related_player_id: string | null;
  type: TocaPointEventType;
  points: number;
  dedupe_key: string;
  metadata: Json;
  created_at: string;
};

export type DbPlayerRating = {
  id: string;
  lobby_id: string;
  rater_player_id: string;
  rated_player_id: string;
  rank_vote: PlayerLevel;
  behavior_rating: number;
  skill_vote_type: SkillRankVoteType;
  skill_vote_rank: PlayerLevel | null;
  implied_rank_index: number;
  processed_rank_batch_id: string | null;
  created_at: string;
};

export type DbPlayerReport = {
  id: string;
  reporter_player_id: string;
  reported_player_id: string | null;
  related_lobby_id: string | null;
  report_type: ReportType;
  report_context: ReportContext;
  message: string;
  diagnostics_opt_in: boolean;
  contact_opt_in: boolean;
  status: ReportStatus;
  email_notification_attempted_at: string | null;
  email_notification_error: string | null;
  email_notification_status: ReportEmailNotificationStatus;
  email_notification_sent_at: string | null;
  support_email_snapshot: string;
  client_context: Json;
  created_at: string;
  updated_at: string;
};

export type DbPlayerRankState = {
  player_id: string;
  skill_score: number;
  rank_confidence: number;
  received_skill_rating_count: number;
  processed_skill_rating_count: number;
  created_at: string;
  updated_at: string;
};

export type DbPlayerRaterReliability = {
  player_id: string;
  reliability_score: number;
  accuracy_sample_count: number;
  bias_score: number;
  behavior_trust_modifier: number;
  created_at: string;
  updated_at: string;
};

export type DbPlayerRankBatch = {
  id: string;
  player_id: string;
  rating_ids: string[];
  previous_level: PlayerLevel;
  next_level: PlayerLevel;
  previous_skill_score: number;
  next_skill_score: number;
  weighted_median_score: number;
  weighted_average_score: number;
  consensus_score: number;
  total_weight: number;
  movement_factor: number;
  confidence_before: number;
  confidence_after: number;
  created_at: string;
};

export type DbPlayerRankBatchRating = {
  batch_id: string;
  rating_id: string;
  rater_player_id: string;
  vote_score: number;
  vote_weight: number;
  vote_error: number;
  rater_reliability_at_time: number;
  behavior_trust_modifier_at_time: number;
  rank_distance_weight_at_time: number;
  outlier_modifier_at_time: number;
};

export type DbPlayerRankHistory = {
  id: string;
  batch_id: string | null;
  player_id: string;
  previous_level: PlayerLevel;
  next_level: PlayerLevel;
  previous_skill_score: number;
  next_skill_score: number;
  reason: string;
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
      friend_requests: {
        Row: DbFriendRequest;
        Insert: Partial<DbFriendRequest> & Pick<DbFriendRequest, 'requester_player_id' | 'recipient_player_id'>;
        Update: Partial<DbFriendRequest>;
      };
      player_blocks: {
        Row: DbPlayerBlock;
        Insert: Partial<DbPlayerBlock> & Pick<DbPlayerBlock, 'blocker_player_id' | 'blocked_player_id'>;
        Update: Partial<DbPlayerBlock>;
      };
      toca_point_events: {
        Row: DbTocaPointEvent;
        Insert: Partial<DbTocaPointEvent> & Pick<DbTocaPointEvent, 'player_id' | 'type' | 'points' | 'dedupe_key'>;
        Update: Partial<DbTocaPointEvent>;
      };
      player_ratings: {
        Row: DbPlayerRating;
        Insert: Partial<DbPlayerRating> & Pick<DbPlayerRating, 'lobby_id' | 'rater_player_id' | 'rated_player_id' | 'rank_vote' | 'behavior_rating'>;
        Update: Partial<DbPlayerRating>;
      };
      player_reports: {
        Row: DbPlayerReport;
        Insert: Partial<DbPlayerReport> & Pick<DbPlayerReport, 'reporter_player_id' | 'report_type' | 'report_context' | 'message'>;
        Update: Partial<DbPlayerReport>;
      };
      player_rank_state: {
        Row: DbPlayerRankState;
        Insert: Partial<DbPlayerRankState> & Pick<DbPlayerRankState, 'player_id' | 'skill_score'>;
        Update: Partial<DbPlayerRankState>;
      };
      player_rater_reliability: {
        Row: DbPlayerRaterReliability;
        Insert: Partial<DbPlayerRaterReliability> & Pick<DbPlayerRaterReliability, 'player_id'>;
        Update: Partial<DbPlayerRaterReliability>;
      };
      player_rank_batches: {
        Row: DbPlayerRankBatch;
        Insert: Partial<DbPlayerRankBatch> & Pick<DbPlayerRankBatch, 'player_id' | 'rating_ids' | 'previous_level' | 'next_level' | 'previous_skill_score' | 'next_skill_score' | 'weighted_median_score' | 'weighted_average_score' | 'consensus_score' | 'total_weight' | 'movement_factor' | 'confidence_before' | 'confidence_after'>;
        Update: Partial<DbPlayerRankBatch>;
      };
      player_rank_batch_ratings: {
        Row: DbPlayerRankBatchRating;
        Insert: DbPlayerRankBatchRating;
        Update: Partial<DbPlayerRankBatchRating>;
      };
      player_rank_history: {
        Row: DbPlayerRankHistory;
        Insert: Partial<DbPlayerRankHistory> & Pick<DbPlayerRankHistory, 'player_id' | 'previous_level' | 'next_level' | 'previous_skill_score' | 'next_skill_score'>;
        Update: Partial<DbPlayerRankHistory>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_lobby: {
        Args: {
          next_capacity_mode: CapacityMode;
          next_gender_rule: GenderRule;
          next_location_city: string;
          next_location_description: string;
          next_location_name: string;
          next_max_players: number;
          next_min_players: number;
          next_note: string;
          next_pin_code_hash: string | null;
          next_rank_exact: PlayerLevel | null;
          next_rank_max: PlayerLevel | null;
          next_rank_min: PlayerLevel | null;
          next_rank_rule_type: RankRuleType;
          next_starts_at: string;
          next_title: string;
          next_visibility: LobbyVisibility;
        };
        Returns: DbLobby;
      };
      host_update_lobby_settings: {
        Args: {
          next_capacity_mode: CapacityMode;
          next_gender_rule: GenderRule;
          next_location_city: string;
          next_location_description: string;
          next_location_name: string;
          next_max_players: number;
          next_min_players: number;
          next_note: string;
          next_pin_code_hash: string | null;
          next_rank_exact: PlayerLevel | null;
          next_rank_max: PlayerLevel | null;
          next_rank_min: PlayerLevel | null;
          next_rank_rule_type: RankRuleType;
          next_starts_at: string;
          next_title: string;
          next_visibility: LobbyVisibility;
          target_lobby_id: string;
        };
        Returns: void;
      };
      host_move_lobby_member_to_waitlist: {
        Args: {
          target_lobby_id: string;
          target_player_id: string;
        };
        Returns: DbLobbyMembership;
      };
      sync_lobby_host: {
        Args: {
          target_lobby_id: string;
        };
        Returns: string;
      };
      send_friend_request: {
        Args: {
          target_player_id: string;
        };
        Returns: DbFriendRequest;
      };
      accept_friend_request: {
        Args: {
          target_request_id: string;
        };
        Returns: DbFriendRequest;
      };
      decline_friend_request: {
        Args: {
          target_request_id: string;
        };
        Returns: DbFriendRequest;
      };
      cancel_friend_request: {
        Args: {
          target_request_id: string;
        };
        Returns: DbFriendRequest;
      };
      remove_friend: {
        Args: {
          target_player_id: string;
        };
        Returns: void;
      };
      block_player: {
        Args: {
          target_player_id: string;
        };
        Returns: DbPlayerBlock;
      };
      list_my_player_blocks: {
        Args: Record<string, never>;
        Returns: DbPlayerBlock[];
      };
      unblock_player: {
        Args: {
          target_player_id: string;
        };
        Returns: void;
      };
      can_current_user_read_lobby: {
        Args: {
          target_lobby_id: string;
        };
        Returns: boolean;
      };
      send_lobby_invites: {
        Args: {
          target_lobby_id: string;
          target_player_ids: string[];
        };
        Returns: Array<{
          messages: string[];
          sent_count: number;
          success: boolean;
        }>;
      };
      sync_lobby_lifecycle: {
        Args: {
          target_lobby_id: string;
        };
        Returns: DbLobby;
      };
      submit_player_skill_rating: {
        Args: {
          exact_rank_vote?: PlayerLevel | null;
          skill_vote_type: SkillRankVoteType;
          submitted_behavior_rating?: number | null;
          target_lobby_id: string;
          target_player_id: string;
        };
        Returns: DbPlayerRating;
      };
      submit_player_report: {
        Args: {
          can_contact?: boolean;
          include_diagnostics?: boolean;
          submitted_client_context?: Json;
          submitted_message: string;
          submitted_report_context: ReportContext;
          submitted_report_type: ReportType;
          target_related_lobby_id?: string | null;
          target_reported_player_id?: string | null;
        };
        Returns: DbPlayerReport;
      };
      award_toca_points: {
        Args: {
          event_dedupe_key: string;
          event_metadata?: Json;
          event_type: TocaPointEventType;
          points_delta: number;
          target_lobby_id?: string | null;
          target_player_id: string;
          target_related_player_id?: string | null;
        };
        Returns: DbTocaPointEvent;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
