export const GIANT_KILLING_RATING_GAP = 12;
export const GIANT_KILLING_MOMENTUM_MULTIPLIER = 1.10;

export function giantKillingMomentumMultiplier(winnerRating, defeatedRating, nextOpponentRating) {
  const wasGiantKilling = defeatedRating - winnerRating >= GIANT_KILLING_RATING_GAP;
  const opponentIsSmallerThanDefeatedTeam = nextOpponentRating < defeatedRating;
  return wasGiantKilling && opponentIsSmallerThanDefeatedTeam
    ? GIANT_KILLING_MOMENTUM_MULTIPLIER
    : 1;
}
