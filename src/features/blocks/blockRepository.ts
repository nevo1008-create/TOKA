import { supabase } from '../../lib/supabase';
import type { DbPlayerBlock } from '../../lib/database.types';
import type { PlayerBlock } from '../../types';

export async function listPlayerBlocks(_playerId?: string): Promise<PlayerBlock[]> {
  const { data, error } = await supabase.rpc('list_my_player_blocks');

  if (error) {
    throw error;
  }

  return ((data ?? []) as DbPlayerBlock[]).map(mapDbPlayerBlockToPlayerBlock);
}

export async function blockPlayer(playerId: string): Promise<PlayerBlock> {
  const { data, error } = await supabase.rpc('block_player', { target_player_id: playerId });

  if (error) {
    throw new Error(error.message);
  }

  return mapDbPlayerBlockToPlayerBlock(data as DbPlayerBlock);
}

export async function unblockPlayer(playerId: string) {
  const { error } = await supabase.rpc('unblock_player', { target_player_id: playerId });

  if (error) {
    throw new Error(error.message);
  }
}

function mapDbPlayerBlockToPlayerBlock(row: DbPlayerBlock): PlayerBlock {
  return {
    blockedPlayerId: row.blocked_player_id,
    blockerPlayerId: row.blocker_player_id,
    createdAt: row.created_at,
    id: row.id,
  };
}
