import type { GenderRule, LobbyVisibility, PlayerLevel, RankRuleType } from '../../types';

export type CreateLobbyDraft = {
  title: string;
  locationName: string;
  locationCity: string;
  meetingPoint: string;
  playerCounts: number[];
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
