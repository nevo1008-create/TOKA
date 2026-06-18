import type { Player, PlayerRatingSummary } from '../../types';

export const newPlayerRatingSummary: PlayerRatingSummary = {
  average: null,
  count: 0,
};

export function formatPlayerRating(player: Pick<Player, 'rating'>) {
  const ratingValue = getPlayerRatingValue(player.rating);

  return ratingValue === null ? 'New' : ratingValue.toFixed(1);
}

export function getPlayerRatingValue(rating: PlayerRatingSummary = newPlayerRatingSummary) {
  if (rating.count <= 0 || rating.average === null || Number.isNaN(rating.average)) {
    return null;
  }

  return Math.min(Math.max(rating.average, 0), 5);
}

export function getInitialBehaviorRating(player: Pick<Player, 'rating'>, fallbackRating = 3.5) {
  return getPlayerRatingValue(player.rating) ?? fallbackRating;
}
