import type { GenderRule, LobbyVisibility, PlayerLevel, RankRuleType } from '../../types';

export type CreateLobbyDraft = {
  title: string;
  locationName: string;
  locationCity: string;
  meetingPoint: string;
  matchDate: string;
  playerCounts: number[];
  startTime: string;
  startsAt: string;
  maxPlayers: number;
  rankRuleType: RankRuleType;
  rankMin?: PlayerLevel;
  rankMax?: PlayerLevel;
  rankExact?: PlayerLevel;
  accessCode?: string;
  genderRule: GenderRule;
  visibility: LobbyVisibility;
};

export type LobbySettingsDraft = CreateLobbyDraft;
