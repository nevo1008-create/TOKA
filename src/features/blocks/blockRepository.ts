import { supabase } from '../../lib/supabase';
import type { DbPlayerBlock } from '../../lib/database.types';
import type { PlayerBlock } from '../../types';

export async function listPlayerBlocks(playerId: string): Promise<PlayerBlock[]> {
  if (!isUuid(playerId)) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_blocks')
    .select('*')
    .eq('blocker_player_id', playerId)
    .order('created_at', { ascending: false });

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}
