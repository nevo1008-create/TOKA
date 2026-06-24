import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import { supabase } from '../../lib/supabase';

export type RealtimeDomain = 'chat' | 'friends' | 'lobbies' | 'notifications' | 'players' | 'ratings';

type RealtimeTable =
  | 'friend_requests'
  | 'lobbies'
  | 'lobby_memberships'
  | 'lobby_messages'
  | 'notifications'
  | 'player_ratings'
  | 'players';

type RealtimeTableSubscription = {
  domain: RealtimeDomain;
  filter?: string;
  table: RealtimeTable;
};

export type AppRealtimeChange = {
  domain: RealtimeDomain;
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>;
  table: RealtimeTable;
};

type AppRealtimeOptions = {
  currentPlayerId: string;
  onChange: (change: AppRealtimeChange) => void;
  onStatusChange?: (status: string) => void;
};

export function subscribeToAppRealtime({ currentPlayerId, onChange, onStatusChange }: AppRealtimeOptions) {
  if (!isUuid(currentPlayerId)) {
    return () => undefined;
  }

  const channel = supabase.channel(`app-realtime:${currentPlayerId}`);

  getRealtimeTableSubscriptions(currentPlayerId).forEach((subscription) => {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        filter: subscription.filter,
        schema: 'public',
        table: subscription.table,
      },
      (payload) => {
        onChange({
          domain: subscription.domain,
          payload,
          table: subscription.table,
        });
      },
    );
  });

  channel.subscribe((status) => {
    onStatusChange?.(status);
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}

function getRealtimeTableSubscriptions(currentPlayerId: string): RealtimeTableSubscription[] {
  return [
    { domain: 'lobbies', table: 'lobbies' },
    { domain: 'lobbies', table: 'lobby_memberships' },
    { domain: 'chat', table: 'lobby_messages' },
    { domain: 'notifications', filter: `recipient_player_id=eq.${currentPlayerId}`, table: 'notifications' },
    { domain: 'friends', filter: `requester_player_id=eq.${currentPlayerId}`, table: 'friend_requests' },
    { domain: 'friends', filter: `recipient_player_id=eq.${currentPlayerId}`, table: 'friend_requests' },
    { domain: 'ratings', table: 'player_ratings' },
    { domain: 'players', table: 'players' },
  ];
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
