import type { Player } from '../types';
import type { PlayerPreviewDetail } from './PlayerProfilePreview';

export function getPlayerPreviewPlayingDetails(player: Player): PlayerPreviewDetail[] {
  return [
    {
      icon: 'location',
      label: 'Preferred location',
      tone: 'aqua',
      value: player.area,
    },
    {
      icon: 'walk-outline',
      label: 'Foot',
      value: capitalize(player.preferredFoot),
    },
    {
      icon: 'swap-horizontal-outline',
      label: 'Side',
      value: capitalize(player.side),
    },
  ];
}

export function getFallbackPreviewPlayingDetails(): PlayerPreviewDetail[] {
  return [
    {
      icon: 'location',
      label: 'Preferred location',
      tone: 'aqua',
      value: 'Profile not completed',
    },
    {
      icon: 'walk-outline',
      label: 'Foot',
      value: 'Profile not completed',
    },
    {
      icon: 'swap-horizontal-outline',
      label: 'Side',
      value: 'Profile not completed',
    },
  ];
}

function capitalize(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
