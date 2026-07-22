export function onlinePenaltyWinner({ homeScore, awayScore, homeKicks, awayKicks }) {
  const homeCannotCatch = awayKicks < 5 && homeScore > awayScore + (5 - awayKicks);
  const awayCannotCatch = homeKicks < 5 && awayScore > homeScore + (5 - homeKicks);
  if (homeCannotCatch) return "home";
  if (awayCannotCatch) return "away";

  const equalSuddenDeathAttempts = homeKicks >= 5 && awayKicks >= 5 && homeKicks === awayKicks;
  if (!equalSuddenDeathAttempts || homeScore === awayScore) return null;
  return homeScore > awayScore ? "home" : "away";
}

export function onlineManualPenaltyGoalChance(shootingRating, goalkeeperMatched) {
  if (!goalkeeperMatched) return 1;
  const ratingBonus = (shootingRating - 55) / 500;
  return Math.max(0.25, Math.min(0.52, 0.38 + ratingBonus));
}

export function onlineAutomaticPenaltyGoalChance(shootingRating, goalkeeperMatched) {
  const ratingBonus = (shootingRating - 55) / 500;
  const baseChance = goalkeeperMatched ? 0.38 : 0.88;
  return Math.max(0.25, Math.min(0.94, baseChance + ratingBonus));
}
