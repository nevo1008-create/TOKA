import { supabase } from '../../lib/supabase';
import type { DbPlayerRating } from '../../lib/database.types';
import type { Lobby, PlayerLevel, RatingTask } from '../../types';
import { canPlayerRateLobby, getRatingTargetIds } from './ratingRules';

export type SubmitPlayerRatingInput = {
  behaviorRating: number;
  lobby: Lobby;
  rank: PlayerLevel;
  ratedPlayerId: string;
  raterPlayerId: string;
};

export async function listSubmittedRatingTasks(playerId: string, lobbies: Lobby[]): Promise<RatingTask[]> {
  if (!isUuid(playerId) || lobbies.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_ratings')
    .select('*')
    .eq('rater_player_id', playerId)
    .in('lobby_id', lobbies.map((lobby) => lobby.id));

  if (error) {
    throw error;
  }

  return mapSubmittedRatingsToTasks((data ?? []) as DbPlayerRating[], lobbies, playerId);
}

export async function submitPlayerRating({
  behaviorRating,
  lobby,
  rank,
  ratedPlayerId,
  raterPlayerId,
}: SubmitPlayerRatingInput) {
  await syncLobbyLifecycleBeforeRating(lobby.id);

  const { error } = await supabase
    .from('player_ratings')
    .insert({
      behavior_rating: behaviorRating,
      lobby_id: lobby.id,
      rated_player_id: ratedPlayerId,
      rater_player_id: raterPlayerId,
      rank_vote: rank,
    });

  if (error) {
    if (error.code === '23505') {
      return {
        messages: ['You already rated this player.'],
        success: false,
      };
    }

    throw error;
  }

  return {
    messages: ['Rating saved.'],
    success: true,
  };
}

function mapSubmittedRatingsToTasks(ratings: DbPlayerRating[], lobbies: Lobby[], playerId: string): RatingTask[] {
  return lobbies.flatMap((lobby) => {
    if (!canPlayerRateLobby(lobby, playerId)) {
      return [];
    }

    const targetIds = getRatingTargetIds(lobby, playerId);
    const submittedTargetIds = new Set(
      ratings
        .filter((rating) => rating.lobby_id === lobby.id)
        .map((rating) => rating.rated_player_id),
    );
    const remainingPlayerIds = targetIds.filter((targetId) => !submittedTargetIds.has(targetId));

    if (submittedTargetIds.size === 0) {
      return [];
    }

    return [{
      id: `supabase-rating-${lobby.id}-${playerId}`,
      lobbyId: lobby.id,
      openedAt: ratings.find((rating) => rating.lobby_id === lobby.id)?.created_at ?? new Date().toISOString(),
      playerId,
      remainingPlayerIds,
      skippedPlayerIds: [],
      status: remainingPlayerIds.length === 0 ? 'completed' : 'open',
    }];
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function syncLobbyLifecycleBeforeRating(lobbyId: string) {
  if (!isUuid(lobbyId)) {
    return;
  }

  const { error } = await supabase.rpc('sync_lobby_lifecycle', { target_lobby_id: lobbyId });

  if (error) {
    console.warn('Could not sync lobby lifecycle before rating.', error.message);
  }
}
