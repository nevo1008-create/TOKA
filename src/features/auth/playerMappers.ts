import type { DbPlayer } from '../../lib/database.types';
import type { Player } from '../../types';
import { getProfilePhotoPublicUrl } from './profilePhotoRepository';

export function mapDbPlayerToPlayer(row: DbPlayer): Player {
  return {
    area: row.area,
    avatarFocusX: row.avatar_focus_x ?? 50,
    avatarFocusY: row.avatar_focus_y ?? 50,
    avatarPath: row.avatar_path,
    avatarUrl: getProfilePhotoPublicUrl(row.avatar_path),
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
    pushNotificationsEnabled: row.push_notifications_enabled ?? false,
    rankStatus: row.rank_status,
    side: row.side,
    tocaPoints: row.toca_points,
  };
}

export function mapPlayerToDbProfile(player: Player, authUserId: string): Partial<DbPlayer> {
  const payload: Partial<DbPlayer> = {
    area: player.area,
    auth_user_id: authUserId,
    avatar_focus_x: player.avatarFocusX ?? 50,
    avatar_focus_y: player.avatarFocusY ?? 50,
    display_name: player.name,
    friend_ids: player.friendIds,
    games_played: player.gamesPlayed,
    gender: player.gender,
    has_ball: player.hasBall,
    has_court_marks: player.hasCourtMarks,
    initials: player.initials,
    level: player.level,
    preferred_foot: player.preferredFoot,
    push_notifications_enabled: player.pushNotificationsEnabled ?? false,
    rank_status: player.rankStatus,
    side: player.side,
    toca_points: player.tocaPoints,
  };

  if (player.avatarPath) {
    payload.avatar_path = player.avatarPath;
  }

  return payload;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
