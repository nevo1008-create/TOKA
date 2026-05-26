export type PlayerLevel =
  | 'A-'
  | 'A'
  | 'A+'
  | 'B-'
  | 'B'
  | 'B+'
  | 'C-'
  | 'C'
  | 'C+'
  | 'D-'
  | 'D'
  | 'D+'
  | 'E-'
  | 'E'
  | 'E+';

export type LobbyStatus = 'open' | 'locked' | 'full';

export type Player = {
  id: string;
  name: string;
  level: PlayerLevel;
  gamesPlayed: number;
  preferredFoot: 'ימין' | 'שמאל' | 'שתיהן';
  area: string;
  initials: string;
};

export type Lobby = {
  id: string;
  title: string;
  location: string;
  area: string;
  startsAt: string;
  levelRange: string;
  capacity: number;
  playerCount: number;
  status: LobbyStatus;
  waitlistCount: number;
  note: string;
  players: Player[];
};
