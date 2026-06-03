import type { User } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';
import type { DbPlayer } from '../../lib/database.types';
import type { Player } from '../../types';
import { mapDbPlayerToPlayer, mapPlayerToDbProfile } from './playerMappers';

export async function listPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('display_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapDbPlayerToPlayer);
}

export async function getPlayerByAuthUserId(authUserId: string): Promise<Player | null> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDbPlayerToPlayer(data as DbPlayer) : null;
}

export async function upsertPlayerForUser(user: User, player: Player): Promise<Player> {
  const payload = mapPlayerToDbProfile(player, user.id);
  const { data, error } = await supabase
    .from('players')
    .upsert(payload, { onConflict: 'auth_user_id' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapDbPlayerToPlayer(data as DbPlayer);
}
