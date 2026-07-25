export const PALESTINE_TEAM_NAME = "Palestine";
export const CHALLENGE_TEAM_ID = "team-131";
export const CHALLENGE_UPSET_MODE = "balanced";
export const CHALLENGE_GOAL_LEVEL = "normal";
export const CHALLENGE_COUNTED_RUN_LIMIT = 25;
export const CHALLENGE_MIN_MATCH_INTERVAL_MS = 12_000;

export const CHALLENGE_ROUNDS = Object.freeze([
  Object.freeze({ key: "r256", label: "Round of 256", winPoints: 1 }),
  Object.freeze({ key: "r128", label: "Round of 128", winPoints: 2 }),
  Object.freeze({ key: "r64", label: "Round of 64", winPoints: 3 }),
  Object.freeze({ key: "r32", label: "Round of 32", winPoints: 5 }),
  Object.freeze({ key: "r16", label: "Round of 16", winPoints: 8 }),
  Object.freeze({ key: "qf", label: "Quarter-final", winPoints: 12 }),
  Object.freeze({ key: "sf", label: "Semi-final", winPoints: 18 }),
  Object.freeze({ key: "final", label: "Final", winPoints: 30 }),
]);

const CHAMPION_BONUS = 25;

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function poisson(mean, random) {
  const limit = Math.exp(-Math.max(0.05, mean));
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit && count < 12);
  return count - 1;
}

function teamStrength(team) {
  return Number(team?.simulationRatings?.overall) || 50;
}

function simulateKnockoutMatch(home, away, seed) {
  const random = seededRandom(hashText(seed));
  const gap = teamStrength(home) - teamStrength(away);
  const homeXg = Math.max(0.2, Math.min(3.8, 1.22 + gap / 34 + 0.12));
  const awayXg = Math.max(0.2, Math.min(3.8, 1.22 - gap / 34));
  let homeGoals = poisson(homeXg, random);
  let awayGoals = poisson(awayXg, random);
  let extraTime = false;
  let penalties = null;

  if (homeGoals === awayGoals) {
    extraTime = true;
    homeGoals += poisson(homeXg * 0.28, random);
    awayGoals += poisson(awayXg * 0.28, random);
  }
  if (homeGoals === awayGoals) {
    let homePens = 0;
    let awayPens = 0;
    let kicks = 0;
    while ((kicks < 10 || homePens === awayPens) && kicks < 20) {
      if (kicks % 2 === 0) homePens += random() < 0.74 ? 1 : 0;
      else awayPens += random() < 0.74 ? 1 : 0;
      kicks += 1;
    }
    if (homePens === awayPens) homePens += 1;
    penalties = { home: homePens, away: awayPens };
  }
  const homeWon = homeGoals > awayGoals || (homeGoals === awayGoals && penalties.home > penalties.away);
  return {
    homeId: home.id,
    awayId: away.id,
    homeGoals,
    awayGoals,
    extraTime,
    penalties,
    winnerId: homeWon ? home.id : away.id,
  };
}

export function opponentRankMultiplier(rank) {
  if (Number.isInteger(rank) && rank <= 10) return 3;
  if (Number.isInteger(rank) && rank <= 25) return 2.5;
  if (Number.isInteger(rank) && rank <= 50) return 2;
  if (Number.isInteger(rank) && rank <= 100) return 1.5;
  return 1;
}

export function scoreChallengeWin(roundIndex, opponentRank, goals, champion = false) {
  const round = CHALLENGE_ROUNDS[roundIndex];
  if (!round) throw new Error("Invalid challenge round.");
  const progressPoints = Math.round(round.winPoints * opponentRankMultiplier(opponentRank));
  const goalPoints = Math.min(5, Math.max(0, Math.trunc(goals || 0)));
  const championPoints = champion ? CHAMPION_BONUS : 0;
  return {
    progressPoints,
    goalPoints,
    championPoints,
    total: progressPoints + goalPoints + championPoints,
  };
}

export function createChallengeRunState(teams, seed) {
  if (!Array.isArray(teams) || teams.length !== 256) throw new Error("Challenge requires exactly 256 teams.");
  if (!teams.some((team) => team.id === CHALLENGE_TEAM_ID)) throw new Error("Palestine is missing from the field.");
  const random = seededRandom(hashText(seed));
  const teamIds = shuffled(teams.map((team) => team.id), random);
  return {
    version: 1,
    seed,
    lockedTeamId: CHALLENGE_TEAM_ID,
    upsetMode: CHALLENGE_UPSET_MODE,
    goalLevel: CHALLENGE_GOAL_LEVEL,
    roundIndex: 0,
    currentTeamIds: teamIds,
    rounds: [],
    score: 0,
    goals: 0,
    strongestOpponent: null,
    status: "active",
  };
}

export function playChallengeRound(state, teams) {
  if (state?.status !== "active") throw new Error("Run is not active.");
  if (state.lockedTeamId !== CHALLENGE_TEAM_ID || state.upsetMode !== CHALLENGE_UPSET_MODE || state.goalLevel !== CHALLENGE_GOAL_LEVEL) {
    throw new Error("Challenge settings failed validation.");
  }
  const round = CHALLENGE_ROUNDS[state.roundIndex];
  if (!round || state.currentTeamIds.length !== 256 / (2 ** state.roundIndex)) throw new Error("Impossible tournament path.");
  const byId = new Map(teams.map((team) => [team.id, team]));
  const matches = [];
  const winners = [];
  for (let index = 0; index < state.currentTeamIds.length; index += 2) {
    const home = byId.get(state.currentTeamIds[index]);
    const away = byId.get(state.currentTeamIds[index + 1]);
    if (!home || !away) throw new Error("Unknown team in challenge bracket.");
    const result = simulateKnockoutMatch(home, away, `${state.seed}:${state.roundIndex}:${index / 2}`);
    matches.push(result);
    winners.push(result.winnerId);
  }
  const palestineMatch = matches.find((match) => match.homeId === CHALLENGE_TEAM_ID || match.awayId === CHALLENGE_TEAM_ID);
  if (!palestineMatch) throw new Error("Palestine has an impossible tournament path.");
  const opponentId = palestineMatch.homeId === CHALLENGE_TEAM_ID ? palestineMatch.awayId : palestineMatch.homeId;
  const opponent = byId.get(opponentId);
  const palestineGoals = palestineMatch.homeId === CHALLENGE_TEAM_ID ? palestineMatch.homeGoals : palestineMatch.awayGoals;
  const won = palestineMatch.winnerId === CHALLENGE_TEAM_ID;
  const champion = won && state.roundIndex === CHALLENGE_ROUNDS.length - 1;
  const breakdown = won ? scoreChallengeWin(state.roundIndex, opponent.officialFifaRank, palestineGoals, champion) : {
    progressPoints: 0,
    goalPoints: Math.min(5, palestineGoals),
    championPoints: 0,
    total: Math.min(5, palestineGoals),
  };
  const strongestOpponent = !state.strongestOpponent
    || (opponent.officialFifaRank || 999) < (state.strongestOpponent.rank || 999)
    ? { id: opponent.id, name: opponent.name, rank: opponent.officialFifaRank || null }
    : state.strongestOpponent;
  const nextState = {
    ...state,
    rounds: [...state.rounds, { roundIndex: state.roundIndex, matches, palestineMatch, opponent: { id: opponent.id, name: opponent.name, rank: opponent.officialFifaRank || null }, breakdown }],
    score: state.score + breakdown.total,
    goals: state.goals + palestineGoals,
    strongestOpponent,
    currentTeamIds: winners,
    roundIndex: state.roundIndex + 1,
    status: won && !champion ? "active" : "completed",
    outcome: champion ? "champion" : won ? null : "eliminated",
  };
  return { state: nextState, match: palestineMatch, opponent, won, champion, breakdown };
}

export function countedRunIds(runs, limit = CHALLENGE_COUNTED_RUN_LIMIT) {
  return new Set([...runs]
    .sort((left, right) => right.score - left.score || left.completedAt - right.completedAt || left.id.localeCompare(right.id))
    .slice(0, limit)
    .map((run) => run.id));
}

export function furthestRoundLabel(state) {
  if (state.outcome === "champion") return "Champion";
  const played = Math.max(0, state.roundIndex - 1);
  return CHALLENGE_ROUNDS[played]?.label || CHALLENGE_ROUNDS[0].label;
}
