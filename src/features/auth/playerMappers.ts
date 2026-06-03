import type { DbPlayer } from '../../lib/database.types';
import type { Player } from '../../types';

export function mapDbPlayerToPlayer(row: DbPlayer): Player {
  return {
    area: row.area,
    friendIds: row.friend_ids ?? [],
    gamesPlayed: row.games_played,
    gender: row.gender,
    hasBall: row.has_ball,
    hasCourtMarks: row.has_court_marks,
    id: row.id,
    initials: row.initials || getInitials(row.display_name),
    level: row.level,
    name: row.display_name,
    preferredFoot: row.preferred_foot,
    rankStatus: row.rank_status,
    side: row.side,
    tocaPoints: row.toca_points,
  };
}

export function mapPlayerToDbProfile(player: Player, authUserId: string): Partial<DbPlayer> {
  return {
    area: player.area,
    auth_user_id: authUserId,
    display_name: player.name,
    friend_ids: player.friendIds,
    games_played: player.gamesPlayed,
    gender: player.gender,
    has_ball: player.hasBall,
    has_court_marks: player.hasCourtMarks,
    initials: player.initials,
    level: player.level,
    preferred_foot: player.preferredFoot,
    rank_status: player.rankStatus,
    side: player.side,
    toca_points: player.tocaPoints,
  };
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
