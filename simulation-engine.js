// Pure, deterministic simulation primitives shared by live and fast match paths.
const SIMULATION_CONFIG = Object.freeze({
  roundStrengthMultipliers: [0.90, 0.95, 1.00, 1.18, 1.45, 1.52, 1.60, 1.66],
  roundUnderdogXGMultipliers: [1.00, 1.00, 0.97, 0.84, 0.60, 0.50, 0.50, 0.48],
  modes: {
    realistic: {
      ratingScale: 27,
      redCardChance: 0.01,
      shockChance: 0.0025,
      shockUnderdogBoost: 1.15,
      shockFavouriteReduction: 0.94,
      minimumXG: 0.07,
      penaltyQualityFactor: 0.006,
      roundStrengthMultiplierScale: 1.05,
      fatigueScale: 1.05,
      underdogXGSuppressionScale: 1.00,
    },
    balanced: {
      ratingScale: 36,
      redCardChance: 0.018,
      shockChance: 0.006,
      shockUnderdogBoost: 1.20,
      shockFavouriteReduction: 0.91,
      minimumXG: 0.10,
      penaltyQualityFactor: 0.005,
      roundStrengthMultiplierScale: 1.00,
      fatigueScale: 1.00,
      underdogXGSuppressionScale: 1.00,
    },
    chaos: {
      ratingScale: 60,
      redCardChance: 0.07,
      shockChance: 0.18,
      shockUnderdogBoost: 1.90,
      shockFavouriteReduction: 0.62,
      minimumXG: 0.38,
      penaltyQualityFactor: 0.001,
      roundStrengthMultiplierScale: 0.20,
      fatigueScale: 0.30,
      underdogXGSuppressionScale: 0.15,
    },
  },
  goals: {
    tight: { baseXG: 0.92, minimumXG: 0.08, maximumXG: 2.9 },
    normal: { baseXG: 1.02, minimumXG: 0.10, maximumXG: 3.2 },
    wild: { baseXG: 1.55, minimumXG: 0.16, maximumXG: 6.4 },
  },
  goalTypes: {
    openPlay: 0.80,
    penalty: 0.08,
    setPiece: 0.08,
    ownGoal: 0.04,
  },
});

const GIANT_KILLING_RATING_GAP = 12;
const GIANT_KILLING_MOMENTUM_MULTIPLIER = 1.10;

function giantKillingMomentumMultiplier(winnerRating, defeatedRating, nextOpponentRating) {
  const wasGiantKilling = defeatedRating - winnerRating >= GIANT_KILLING_RATING_GAP;
  const opponentIsSmallerThanDefeatedTeam = nextOpponentRating < defeatedRating;
  return wasGiantKilling && opponentIsSmallerThanDefeatedTeam
    ? GIANT_KILLING_MOMENTUM_MULTIPLIER
    : 1;
}

const POSITION_GOAL_WEIGHTS = Object.freeze({
  ST: 1.00, CF: 0.94, SS: 0.86,
  LW: 0.72, RW: 0.72, LF: 0.78, RF: 0.78,
  CAM: 0.48, AM: 0.48, LM: 0.32, RM: 0.32,
  CM: 0.22, LCM: 0.22, RCM: 0.22,
  CDM: 0.08, DM: 0.08, LWB: 0.09, RWB: 0.09,
  LB: 0.055, RB: 0.055, CB: 0.045, GK: 0.0001,
});

const ATTACKING_ROLE_MULTIPLIERS = Object.freeze({
  primary: 1.10,
  secondary: 1.04,
  support: 0.92,
  defensive: 0.60,
});

const ELITE_IN_MATCH_SCORER_MULTIPLIERS = [1, 0.90, 0.62, 0.28, 0.08];
const STANDARD_IN_MATCH_SCORER_MULTIPLIERS = [1, 0.72, 0.34, 0.10, 0.02];

const PLAYER_PROFILE_OVERRIDES = new Map([
  ["Erling Haaland", { position: "ST", overall: 97, finishing: 98, attackingRole: "primary", expectedMinutesShare: 0.96, penaltyTaker: true }],
  ["Kylian Mbappé", { position: "ST", overall: 96, finishing: 97, attackingRole: "primary", expectedMinutesShare: 0.95, penaltyTaker: true }],
  ["Harry Kane", { position: "ST", overall: 85, finishing: 92, attackingRole: "secondary", expectedMinutesShare: 0.55, penaltyTaker: true }],
  ["Lionel Messi", { position: "CF", overall: 91, finishing: 94, attackingRole: "primary", expectedMinutesShare: 0.88, penaltyTaker: true, scoringEmphasis: 1.18 }],
  ["Lamine Yamal", { position: "RW", overall: 96, finishing: 93, attackingRole: "primary", expectedMinutesShare: 0.94, penaltyTaker: false }],
  ["Vinícius Júnior", { position: "LW", overall: 94, finishing: 91, attackingRole: "primary", expectedMinutesShare: 0.92, penaltyTaker: true }],
  ["Cristiano Ronaldo", { position: "ST", overall: 74, finishing: 85, attackingRole: "support", expectedMinutesShare: 0.28, penaltyTaker: true }],
  ["Bukayo Saka", { position: "RW", overall: 93, finishing: 91, attackingRole: "secondary", expectedMinutesShare: 0.92, penaltyTaker: false, scoringEmphasis: 1.08 }],
  ["Jude Bellingham", { position: "CAM", overall: 95, finishing: 93, attackingRole: "primary", expectedMinutesShare: 0.95, penaltyTaker: false, scoringEmphasis: 1.25 }],
  ["Max Dowman", { position: "CAM", overall: 92, finishing: 91, attackingRole: "secondary", expectedMinutesShare: 0.80, penaltyTaker: false, scoringEmphasis: 1.40 }],
  ["Phil Foden", { position: "RW", overall: 91, finishing: 88, attackingRole: "secondary", expectedMinutesShare: 0.86, penaltyTaker: false, scoringEmphasis: 0.88 }],
  ["Cole Palmer", { position: "LW", overall: 92, finishing: 89, attackingRole: "support", expectedMinutesShare: 0.80, penaltyTaker: false, scoringEmphasis: 0.85 }],
  ["Mohamed Salah", { position: "RW", overall: 84, finishing: 89, attackingRole: "secondary", expectedMinutesShare: 0.60, penaltyTaker: true }],
  ["Antoine Semenyo", { position: "ST", overall: 88, finishing: 88, attackingRole: "primary", expectedMinutesShare: 0.94, penaltyTaker: false, scoringEmphasis: 1.18 }],
  ["The Conspiracy", { position: "CF", overall: 78, finishing: 80, attackingRole: "secondary", expectedMinutesShare: 0.90, penaltyTaker: false, scoringEmphasis: 1.05 }],
  ["Jordan Ayew", { position: "RW", overall: 68, finishing: 66, attackingRole: "support", expectedMinutesShare: 0.32, penaltyTaker: false, scoringEmphasis: 0.62 }],
  ["Julián Alvarez", { position: "ST", overall: 92, finishing: 93, attackingRole: "primary", expectedMinutesShare: 0.91, penaltyTaker: false }],
  ["Lautaro Martínez", { position: "ST", overall: 89, finishing: 92, attackingRole: "secondary", expectedMinutesShare: 0.83, penaltyTaker: false }],
  ["Mitchell Duke", { position: "ST", overall: 69, finishing: 72, attackingRole: "support", expectedMinutesShare: 0.38, penaltyTaker: false }],
  ["Mehdi Ghayedi", { position: "LW", overall: 78, finishing: 77, attackingRole: "secondary", expectedMinutesShare: 0.76, penaltyTaker: true }],
  ["Ali Alipour", { position: "ST", overall: 74, finishing: 77, attackingRole: "secondary", expectedMinutesShare: 0.68, penaltyTaker: false }],
  ["Amirhossein Hosseinzadeh", { position: "RW", overall: 76, finishing: 74, attackingRole: "support", expectedMinutesShare: 0.70, penaltyTaker: false }],
  ["Darwin Núñez", { position: "ST", overall: 86, finishing: 82, attackingRole: "primary" }],
  ["Son Heung-min", { position: "LW", overall: 85, finishing: 87, attackingRole: "secondary" }],
  ["Christian Pulisic", { position: "LW", overall: 88, finishing: 87, attackingRole: "primary" }],
  ["Hakim Ziyech", { position: "RW", overall: 82, finishing: 80, attackingRole: "secondary" }],
  ["Hwang Ui-jo", { position: "ST", overall: 76, finishing: 74, attackingRole: "support" }],
  ["Brahim Díaz", { position: "CAM", overall: 88, finishing: 86, attackingRole: "primary" }],
  ["Takefusa Kubo", { position: "RW", overall: 87, finishing: 84, attackingRole: "primary" }],
  ["Joško Gvardiol", { position: "CB", finishing: 62, attackingRole: "defensive" }],
  ["Luka Vušković", { position: "CB", finishing: 54, attackingRole: "defensive" }],
  ["Micky van de Ven", { position: "CB", finishing: 55, attackingRole: "defensive" }],
  ["Sofyan Amrabat", { position: "CDM", finishing: 57, attackingRole: "defensive" }],
  ["Saeid Ezatolahi", { position: "CDM", finishing: 58, attackingRole: "defensive" }],
  ["Kobbie Mainoo", { position: "CM", finishing: 69, attackingRole: "support" }],
  ["Amenyah", { position: "ST", attackingRole: "primary", penaltyTaker: true }],
  ["ChrisMD", { position: "ST", overall: 48, finishing: 52, attackingRole: "primary", expectedMinutesShare: 0.94, penaltyTaker: true, scoringEmphasis: 1.20 }],
  ["Wroetoshaw", { position: "ST", overall: 46, finishing: 50, attackingRole: "primary", expectedMinutesShare: 0.92, penaltyTaker: true, scoringEmphasis: 1.15 }],
]);

const PENALTY_TAKER_OVERRIDES = new Map([
  ["Argentina", "Lionel Messi"],
  ["England", "Harry Kane"],
  ["France", "Kylian Mbappé"],
  ["Norway", "Erling Haaland"],
  ["Portugal", "Cristiano Ronaldo"],
  ["South Korea", "Son Heung-min"],
  ["USA", "Christian Pulisic"],
  ["Moldova", "Amenyah"],
  ["Jersey", "ChrisMD"],
  ["Guernsey", "Wroetoshaw"],
  ["Spain", "Mikel Oyarzabal"],
  ["Brazil", "Vinícius Júnior"],
  ["Egypt", "Mohamed Salah"],
  ["Iran", "Mehdi Ghayedi"],
]);

const GENERATED_POSITION_SEQUENCE = ["ST", "LW", "RW", "CAM", "CM", "CM", "CDM", "CB", "LB", "RB", "GK"];
const REAL_POSITION_SEQUENCE = ["ST", "LW", "RW", "CF", "CAM", "SS", "AM", "CM", "CDM", "CB", "CB"];

function simulationClamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function teamSimulationRatings(team) {
  return team.simulationRatings || {
    overall: team.rating,
    attack: team.rating,
    midfield: team.rating,
    defence: team.rating,
    goalkeeper: team.rating,
    squadDepth: team.rating,
    experience: team.rating,
    penalties: team.rating,
    discipline: 65,
  };
}

function calculateMatchupPower(attackingTeam, defendingTeam) {
  const attack = teamSimulationRatings(attackingTeam);
  const defence = teamSimulationRatings(defendingTeam);
  return (
    attack.attack * 0.43
    + attack.midfield * 0.22
    + attack.overall * 0.12
    + attack.experience * 0.05
    - defence.defence * 0.13
    - defence.goalkeeper * 0.09
  );
}

function calculateTournamentFatigue(teamOrRatings, matchesPlayed, scale = 1) {
  if (matchesPlayed < 3) return 0;
  const ratings = teamOrRatings.simulationRatings
    ? teamSimulationRatings(teamOrRatings)
    : teamOrRatings;
  const depthWeakness = Math.max(0, 76 - ratings.squadDepth);
  return simulationClamp(depthWeakness * (matchesPlayed - 2) * 0.001 * scale, 0, 0.18);
}

function calculateExpectedGoals(
  home,
  away,
  roundIndex,
  modeName = "balanced",
  goalLevel = "normal",
  homeMatchesPlayed = roundIndex,
  awayMatchesPlayed = roundIndex,
  homeMomentumMultiplier = 1,
  awayMomentumMultiplier = 1,
) {
  const mode = SIMULATION_CONFIG.modes[modeName] || SIMULATION_CONFIG.modes.balanced;
  const goalConfig = SIMULATION_CONFIG.goals[goalLevel] || SIMULATION_CONFIG.goals.normal;
  const rawDifference = calculateMatchupPower(home, away) - calculateMatchupPower(away, home);
  const baseRoundMultiplier = SIMULATION_CONFIG.roundStrengthMultipliers[roundIndex] || 1;
  const roundMultiplier = 1 + (baseRoundMultiplier - 1) * mode.roundStrengthMultiplierScale;
  const adjustedDifference = rawDifference * roundMultiplier;
  const minimumXG = Math.max(mode.minimumXG, goalConfig.minimumXG);

  let homeXG = goalConfig.baseXG * Math.exp(adjustedDifference / mode.ratingScale);
  let awayXG = goalConfig.baseXG * Math.exp(-adjustedDifference / mode.ratingScale);
  homeXG = simulationClamp(homeXG, minimumXG, goalConfig.maximumXG);
  awayXG = simulationClamp(awayXG, minimumXG, goalConfig.maximumXG);

  const ratingGap = Math.abs(teamSimulationRatings(home).overall - teamSimulationRatings(away).overall);
  if (ratingGap >= 12) {
    const baseUnderdogMultiplier = SIMULATION_CONFIG.roundUnderdogXGMultipliers[roundIndex] || 1;
    const underdogMultiplier = 1
      - (1 - baseUnderdogMultiplier) * (mode.underdogXGSuppressionScale ?? 1);
    if (teamSimulationRatings(home).overall < teamSimulationRatings(away).overall) homeXG *= underdogMultiplier;
    else awayXG *= underdogMultiplier;
  }

  const homeFatigue = calculateTournamentFatigue(home, homeMatchesPlayed, mode.fatigueScale);
  const awayFatigue = calculateTournamentFatigue(away, awayMatchesPlayed, mode.fatigueScale);
  homeXG *= (1 - homeFatigue) * (1 + awayFatigue * 0.25);
  awayXG *= (1 - awayFatigue) * (1 + homeFatigue * 0.25);
  homeXG *= homeMomentumMultiplier;
  awayXG *= awayMomentumMultiplier;

  return {
    homeXG: simulationClamp(homeXG, minimumXG, goalConfig.maximumXG),
    awayXG: simulationClamp(awayXG, minimumXG, goalConfig.maximumXG),
    rawDifference,
    adjustedDifference,
    homeFatigue,
    awayFatigue,
    ratingGap,
  };
}

function redCardChanceForTeam(team, modeName = "balanced") {
  const mode = SIMULATION_CONFIG.modes[modeName] || SIMULATION_CONFIG.modes.balanced;
  const discipline = teamSimulationRatings(team).discipline;
  const disciplineModifier = 1 + simulationClamp((60 - discipline) / 100, -0.25, 0.35);
  return mode.redCardChance * disciplineModifier;
}

function applyRedCardImpact(homeXG, awayXG, card) {
  let dismissedMultiplier;
  let opponentMultiplier;
  if (card.minute < 30) [dismissedMultiplier, opponentMultiplier] = [0.70, 1.20];
  else if (card.minute < 60) [dismissedMultiplier, opponentMultiplier] = [0.78, 1.15];
  else if (card.minute < 75) [dismissedMultiplier, opponentMultiplier] = [0.86, 1.10];
  else [dismissedMultiplier, opponentMultiplier] = [0.93, 1.04];

  return card.side === "home"
    ? { homeXG: homeXG * dismissedMultiplier, awayXG: awayXG * opponentMultiplier }
    : { homeXG: homeXG * opponentMultiplier, awayXG: awayXG * dismissedMultiplier };
}

function calculateShootoutRating(team) {
  const ratings = teamSimulationRatings(team);
  return ratings.penalties * 0.55 + ratings.goalkeeper * 0.25 + ratings.experience * 0.20;
}

function shootoutConversionChance(attackingTeam, defendingTeam, modeName = "balanced") {
  const mode = SIMULATION_CONFIG.modes[modeName] || SIMULATION_CONFIG.modes.balanced;
  const difference = calculateShootoutRating(attackingTeam) - calculateShootoutRating(defendingTeam);
  return simulationClamp(0.745 + difference * mode.penaltyQualityFactor * 0.45, 0.62, 0.86);
}

function maximumGeneratedPlayerOverall(teamOverall) {
  if (teamOverall < 40) return 58;
  if (teamOverall < 55) return 68;
  if (teamOverall < 70) return 78;
  if (teamOverall < 80) return 85;
  if (teamOverall < 90) return 92;
  return 97;
}

function defaultFinishingOffset(position) {
  if (position === "ST") return 5;
  if (position === "CF") return 4;
  if (["LW", "RW", "LF", "RF", "SS"].includes(position)) return 2;
  if (["CAM", "AM"].includes(position)) return 0;
  if (["CM", "LCM", "RCM", "LM", "RM"].includes(position)) return -7;
  if (["CDM", "DM"].includes(position)) return -15;
  if (position === "GK") return -90;
  return -20;
}

function roleForProfile(position, index) {
  if (index === 0 && ["ST", "CF", "SS", "LW", "RW"].includes(position)) return "primary";
  if (index <= 2 && ["ST", "CF", "SS", "LW", "RW", "CAM", "AM"].includes(position)) return "secondary";
  if (["CDM", "DM", "LWB", "RWB", "LB", "RB", "CB", "GK"].includes(position)) return "defensive";
  return "support";
}

function expectedMinutesForProfile(role, position, index) {
  if (position === "GK") return 0.96;
  if (role === "primary") return 0.95;
  if (role === "secondary") return index === 1 ? 0.90 : 0.84;
  if (role === "defensive") return index <= 8 ? 0.88 : 0.72;
  return index <= 5 ? 0.76 : 0.55;
}

function buildPlayerProfiles(team, names, generated = false) {
  const positions = generated ? GENERATED_POSITION_SEQUENCE : REAL_POSITION_SEQUENCE;
  const teamOverall = teamSimulationRatings(team).overall;
  const generatedMaximum = maximumGeneratedPlayerOverall(teamOverall);
  const penaltyOverride = PENALTY_TAKER_OVERRIDES.get(team.name);

  return names.map((entry, index) => {
    const sourceProfile = typeof entry === "string" ? { name: entry } : entry;
    const name = sourceProfile.name;
    const profileOverride = PLAYER_PROFILE_OVERRIDES.get(name) || {};
    const position = profileOverride.position || sourceProfile.position || positions[index % positions.length];
    const baseOffset = generated
      ? index === 0 ? 5 : index <= 2 ? 3 : index <= 5 ? 0 : index <= 9 ? -3 : -6
      : index === 0 ? 1 : index <= 2 ? 0 : index <= 5 ? -2 : index <= 9 ? -4 : -6;
    const stableOverallVariation = (stableHash(`${team.id}:${name}:overall`) % 7) - 3;
    const overallMaximum = profileOverride.overall !== undefined
      ? 99
      : generated ? generatedMaximum : Math.min(93, team.rating + 4);
    const overallBase = generated ? teamOverall : team.rating;
    const overall = simulationClamp(
      profileOverride.overall
        ?? (sourceProfile.retroWorldCup || sourceProfile.simulatorRating ? sourceProfile.overall : null)
        ?? overallBase + baseOffset + stableOverallVariation,
      20,
      overallMaximum,
    );
    const attackingRole = profileOverride.attackingRole
      || (sourceProfile.retroWorldCup ? sourceProfile.attackingRole : null)
      || roleForProfile(position, index);
    const finishingVariation = (stableHash(`${team.id}:${name}:finishing`) % 9) - 4;
    const finishingMaximum = profileOverride.finishing !== undefined
      ? 99
      : generated ? Math.min(94, generatedMaximum + 8) : Math.min(94, team.rating + 9);
    const finishing = simulationClamp(
      profileOverride.finishing
        ?? (sourceProfile.retroWorldCup ? sourceProfile.finishing : null)
        ?? (position === "GK" ? 5 : overall + defaultFinishingOffset(position) + finishingVariation),
      5,
      finishingMaximum,
    );
    const penaltyTaker = profileOverride.penaltyTaker
      ?? (sourceProfile.retroWorldCup && sourceProfile.penaltyTaker !== undefined ? sourceProfile.penaltyTaker : null)
      ?? (penaltyOverride ? name === penaltyOverride : index === 0);
    const expectedMinutesShare = profileOverride.expectedMinutesShare
      ?? (sourceProfile.retroWorldCup ? sourceProfile.expectedMinutesShare : null)
      ?? expectedMinutesForProfile(attackingRole, position, index);

    return {
      id: `${team.id}-player-${stableHash(name).toString(36)}`,
      name,
      position,
      overall: Math.round(overall),
      finishing: Math.round(finishing),
      attackingRole,
      penaltyTaker,
      expectedMinutesShare,
      scoringEmphasis: profileOverride.scoringEmphasis ?? 1,
      retroWorldCupGoals: sourceProfile.retroWorldCupGoals || 0,
      retroWorldCup: Boolean(sourceProfile.retroWorldCup),
      startingXI: sourceProfile.startingXI ?? (!sourceProfile.retroWorldCup && index < 11),
      preferredFoot: profileOverride.preferredFoot || sourceProfile.preferredFoot || null,
      pace: sourceProfile.pace ?? null,
      shooting: sourceProfile.shooting ?? null,
      passing: sourceProfile.passing ?? null,
      dribbling: sourceProfile.dribbling ?? null,
      defending: sourceProfile.defending ?? null,
      physical: sourceProfile.physical ?? null,
      goalkeeping: sourceProfile.goalkeeping ?? null,
      captain: Boolean(sourceProfile.captain),
      generated,
    };
  });
}

function fallbackPositionGoalWeight(position) {
  if (!position) return 0.18;
  if (position.includes("F") || position.includes("W")) return 0.55;
  if (position.includes("M")) return 0.20;
  if (position.includes("B") || position.includes("D")) return 0.055;
  return 0.12;
}

function attackingQualityForProfile(profile) {
  return profile.finishing * 0.65 + profile.overall * 0.35;
}

function eliteScorerQualityFactor(profile) {
  if (profile.overall < 90 || profile.finishing < 90) return 1;
  const elitePoints = (profile.overall - 90) + (profile.finishing - 90);
  return simulationClamp(1 + elitePoints * 0.025, 1, 1.35);
}

function calculateScorerWeight(profile, team = null, squadProfiles = null) {
  const positionWeight = POSITION_GOAL_WEIGHTS[profile.position]
    ?? fallbackPositionGoalWeight(profile.position);
  const finishingFactor = (simulationClamp(profile.finishing, 5, 99) / 75) ** 2.6;
  const overallFactor = (simulationClamp(profile.overall, 20, 99) / 75) ** 1.45;
  const roleMultiplier = ATTACKING_ROLE_MULTIPLIERS[profile.attackingRole] || 1;
  const minutesFactor = simulationClamp(profile.expectedMinutesShare, 0.02, 1);
  const squad = squadProfiles || (team?.playerProfiles || null);
  const bestAttackingQuality = squad?.length
    ? Math.max(...squad.map(attackingQualityForProfile))
    : attackingQualityForProfile(profile);
  const relativeQuality = attackingQualityForProfile(profile) / Math.max(1, bestAttackingQuality);
  const relativeQualityFactor = simulationClamp(relativeQuality, 0.45, 1) ** 1.8;
  const eliteQualityFactor = eliteScorerQualityFactor(profile);
  const scoringEmphasis = simulationClamp(profile.scoringEmphasis ?? 1, 0.50, 2);
  return positionWeight
    * finishingFactor
    * overallFactor
    * roleMultiplier
    * minutesFactor
    * relativeQualityFactor
    * eliteQualityFactor
    * scoringEmphasis;
}

function matchupScorerMultiplier(profile, team, opponent) {
  if (!team || !opponent) return 1;
  const opponentGap = teamSimulationRatings(team).attack - teamSimulationRatings(opponent).defence;
  let multiplier = 1;
  if (opponentGap >= 25) {
    if (profile.finishing >= 90) multiplier *= 1.32;
    else if (profile.finishing >= 84) multiplier *= 1.16;
    else if (profile.finishing < 75) multiplier *= 0.90;
  }
  if (opponentGap >= 40) {
    if (profile.finishing >= 90) multiplier *= 1.18;
    else if (profile.finishing < 75) multiplier *= 0.86;
  }
  return multiplier;
}

function teamGoalShareMultiplier(profile, playerGoals, teamGoals) {
  if (teamGoals < 6) return 1;
  const share = playerGoals / Math.max(1, teamGoals);
  const elite = profile.finishing >= 90;
  if (share >= 0.60) return elite ? 0.76 : 0.58;
  if (share >= 0.50) return elite ? 0.90 : 0.78;
  if (share >= 0.40) return elite ? 0.97 : 0.92;
  return 1;
}

function scorerWeightForGoalType(profile, goalType, goalsAlready = 0, context = {}) {
  const squad = context.squadProfiles || null;
  let weight = calculateScorerWeight(profile, context.team, squad);
  if (context.team?.retroWorldCup && profile.retroWorldCup) {
    const historicalGoals = profile.retroWorldCupGoals || 0;
    const attackingPosition = ["ST", "CF", "SS", "LW", "RW", "CAM", "AM"].includes(profile.position);
    weight *= historicalGoals
      ? 1.25 + historicalGoals * 0.72
      : attackingPosition ? 0.58 : 0.32;
  }
  weight *= matchupScorerMultiplier(profile, context.team, context.opponent);
  weight *= teamGoalShareMultiplier(
    profile,
    context.tournamentPlayerGoals || 0,
    context.tournamentTeamGoals || 0,
  );
  if (goalType === "penalty") weight *= profile.penaltyTaker ? 8 : 0.70;
  if (goalType === "setPiece") {
    if (profile.position === "CB") weight *= 5.5;
    else if (["ST", "CF"].includes(profile.position)) weight *= 1.35;
    else if (["CAM", "AM"].includes(profile.position)) weight *= 1.15;
  }
  const repeatMultipliers = profile.finishing >= 90
    ? ELITE_IN_MATCH_SCORER_MULTIPLIERS
    : STANDARD_IN_MATCH_SCORER_MULTIPLIERS;
  weight *= repeatMultipliers[Math.min(4, goalsAlready)] || repeatMultipliers[4];
  return weight;
}

function chooseGoalType(random) {
  const roll = random();
  const types = SIMULATION_CONFIG.goalTypes;
  if (roll < types.openPlay) return "openPlay";
  if (roll < types.openPlay + types.penalty) return "penalty";
  if (roll < types.openPlay + types.penalty + types.setPiece) return "setPiece";
  return "ownGoal";
}

const POSSESSION_FORMATIONS = Object.freeze({
  "4-3-3": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [43, 25], [40, 50], [43, 75], [66, 16], [70, 50], [66, 84],
  ]),
  "4-4-2": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [44, 14], [41, 38], [41, 62], [44, 86], [69, 38], [69, 62],
  ]),
  "4-3-1-2": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [43, 26], [40, 50], [43, 74], [58, 50], [72, 38], [72, 62],
  ]),
  "4-2-3-1": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [38, 36], [38, 64], [56, 18], [54, 50], [56, 82], [70, 50],
  ]),
  "4-1-2-1-2": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [38, 50], [49, 30], [49, 70], [59, 50], [72, 38], [72, 62],
  ]),
  "4-3-2-1": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [43, 24], [40, 50], [43, 76], [58, 34], [58, 66], [72, 50],
  ]),
  "4-1-4-1": Object.freeze([
    [6, 50], [22, 14], [22, 38], [22, 62], [22, 86],
    [37, 50], [51, 14], [48, 38], [48, 62], [51, 86], [72, 50],
  ]),
  "3-5-2": Object.freeze([
    [6, 50], [23, 25], [21, 50], [23, 75], [43, 10],
    [40, 33], [38, 50], [40, 67], [43, 90], [69, 38], [69, 62],
  ]),
  "3-4-1-2": Object.freeze([
    [6, 50], [23, 25], [21, 50], [23, 75],
    [45, 12], [42, 38], [42, 62], [45, 88], [58, 50], [72, 38], [72, 62],
  ]),
  "3-4-2-1": Object.freeze([
    [6, 50], [23, 25], [21, 50], [23, 75],
    [45, 10], [42, 38], [42, 62], [45, 90], [59, 35], [59, 65], [73, 50],
  ]),
  "3-4-3": Object.freeze([
    [6, 50], [23, 25], [21, 50], [23, 75],
    [45, 12], [42, 39], [42, 61], [45, 88], [69, 18], [72, 50], [69, 82],
  ]),
  "3-3-1-3": Object.freeze([
    [6, 50], [23, 25], [21, 50], [23, 75],
    [43, 16], [40, 50], [43, 84], [57, 50], [69, 18], [72, 50], [69, 82],
  ]),
  "5-3-2": Object.freeze([
    [6, 50], [27, 10], [22, 30], [20, 50], [22, 70], [27, 90],
    [44, 25], [41, 50], [44, 75], [70, 38], [70, 62],
  ]),
  "5-4-1": Object.freeze([
    [6, 50], [27, 10], [22, 30], [20, 50], [22, 70], [27, 90],
    [46, 14], [43, 39], [43, 61], [46, 86], [72, 50],
  ]),
  "5-2-2-1": Object.freeze([
    [6, 50], [27, 10], [22, 30], [20, 50], [22, 70], [27, 90],
    [43, 35], [43, 65], [59, 25], [59, 75], [72, 50],
  ]),
  "5-2-3": Object.freeze([
    [6, 50], [27, 10], [22, 30], [20, 50], [22, 70], [27, 90],
    [44, 35], [44, 65], [68, 18], [72, 50], [68, 82],
  ]),
});

const POSSESSION_ACTION_TYPES = Object.freeze([
  "safe-pass", "progressive-pass", "through-ball", "dribble", "cross", "shot",
  "tackle", "interception", "clearance", "foul",
]);

const POSSESSION_SLOT_POSITIONS = Object.freeze({
  "4-3-3": ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
  "4-4-2": ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"],
  "4-3-1-2": ["GK", "LB", "CB", "CB", "RB", "CM", "CDM", "CM", "CAM", "ST", "ST"],
  "4-2-3-1": ["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "LW", "CAM", "RW", "ST"],
  "4-1-2-1-2": ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CM", "CAM", "ST", "ST"],
  "4-3-2-1": ["GK", "LB", "CB", "CB", "RB", "CM", "CDM", "CM", "LW", "RW", "ST"],
  "4-1-4-1": ["GK", "LB", "CB", "CB", "RB", "CDM", "LM", "CM", "CM", "RM", "ST"],
  "3-5-2": ["GK", "CB", "CB", "CB", "LWB", "CM", "CDM", "CM", "RWB", "ST", "ST"],
  "3-4-1-2": ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "CAM", "ST", "ST"],
  "3-4-2-1": ["GK", "CB", "CB", "CB", "LWB", "CM", "CM", "RWB", "CAM", "CAM", "ST"],
  "3-4-3": ["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "LW", "ST", "RW"],
  "3-3-1-3": ["GK", "CB", "CB", "CB", "LM", "CM", "RM", "CAM", "LW", "ST", "RW"],
  "5-3-2": ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CDM", "CM", "ST", "ST"],
  "5-4-1": ["GK", "LWB", "CB", "CB", "CB", "RWB", "LM", "CM", "CM", "RM", "ST"],
  "5-2-2-1": ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "LW", "RW", "ST"],
  "5-2-3": ["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "LW", "ST", "RW"],
});

function possessionHash(value) {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function possessionRandom(engine) {
  let value = engine.randomState >>> 0;
  value += 0x6D2B79F5;
  engine.randomState = value >>> 0;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function possessionWeightedChoice(engine, entries) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return entries[0]?.value;
  let roll = possessionRandom(engine) * total;
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry.value;
  }
  return entries.at(-1)?.value;
}

function possessionPositionGroup(position) {
  if (position === "GK") return "goalkeeper";
  if (["CB", "LB", "RB", "LWB", "RWB", "SW"].includes(position)) return "defender";
  if (["CDM", "DM", "CM", "LCM", "RCM", "LM", "RM"].includes(position)) return "midfielder";
  return "attacker";
}

function possessionAttribute(profile, key, fallback, salt = "") {
  const explicit = Number(profile[key]);
  if (Number.isFinite(explicit)) return simulationClamp(explicit, 5, 99);
  const variation = (possessionHash(`${profile.id || profile.name}:${key}:${salt}`) % 11) - 5;
  return simulationClamp(fallback + variation, 5, 99);
}

function normalisePossessionProfile(profile, index, team, slotPosition) {
  const overall = simulationClamp(Number(profile.overall) || team.rating || 60, 20, 99);
  const naturalPosition = profile.position || slotPosition;
  const group = possessionPositionGroup(slotPosition);
  const attacking = group === "attacker";
  const defending = group === "defender";
  const goalkeeper = slotPosition === "GK";
  return {
    ...profile,
    id: profile.id || `${team.id}-possession-${index}`,
    name: profile.name || `Player ${index + 1}`,
    position: slotPosition,
    naturalPosition,
    overall,
    pace: possessionAttribute(profile, "pace", overall + (attacking ? 4 : 0), "pace"),
    shooting: goalkeeper ? 5 : possessionAttribute(profile, "shooting", profile.finishing ?? overall + (attacking ? 5 : -12), "shooting"),
    finishing: goalkeeper ? 5 : possessionAttribute(profile, "finishing", profile.shooting ?? overall + (attacking ? 5 : -12), "finishing"),
    passing: possessionAttribute(profile, "passing", overall + (group === "midfielder" ? 4 : -2), "passing"),
    dribbling: possessionAttribute(profile, "dribbling", overall + (attacking ? 3 : -3), "dribbling"),
    defending: goalkeeper ? 18 : possessionAttribute(profile, "defending", overall + (defending ? 5 : attacking ? -24 : 0), "defending"),
    physical: possessionAttribute(profile, "physical", overall + (defending ? 4 : 0), "physical"),
    goalkeeping: goalkeeper
      ? possessionAttribute(profile, "goalkeeping", teamSimulationRatings(team).goalkeeper || overall, "goalkeeping")
      : 5,
  };
}

function possessionPositionFit(profile, slotPosition) {
  const profileGroup = possessionPositionGroup(profile.position);
  const slotGroup = possessionPositionGroup(slotPosition);
  if (profile.position === slotPosition) return 100;
  if (profileGroup === slotGroup) return 70;
  if (slotPosition === "GK" || profile.position === "GK") return -100;
  if (profileGroup === "attacker" && slotGroup === "midfielder") return 28;
  if (profileGroup === "midfielder" && slotGroup !== "goalkeeper") return 22;
  return 0;
}

function buildPossessionLineup(team, profiles, formationName) {
  const slots = POSSESSION_SLOT_POSITIONS[formationName] || POSSESSION_SLOT_POSITIONS["4-3-3"];
  const markedStarters = profiles.filter((profile) => profile.startingXI);
  const lineupPool = markedStarters.length === 11 ? markedStarters : profiles.slice(0, 18);
  const pool = lineupPool.map((profile, index) => ({ profile, index }));
  while (pool.length < 11) {
    const index = pool.length;
    pool.push({
      index,
      profile: {
        id: `${team.id}-support-${index}`,
        name: `Squad player ${index + 1}`,
        position: slots[index],
        overall: Math.max(20, (team.rating || 60) - 3),
      },
    });
  }
  const used = new Set();
  const selectedBySlot = Array(slots.length);
  const assignmentPriority = (position) => {
    const group = possessionPositionGroup(position);
    if (group === "goalkeeper") return 0;
    if (group === "attacker") return 1;
    if (group === "defender") return 2;
    return 3;
  };
  const assignmentOrder = slots
    .map((slotPosition, slotIndex) => ({ slotPosition, slotIndex }))
    .sort((left, right) => assignmentPriority(left.slotPosition) - assignmentPriority(right.slotPosition)
      || left.slotIndex - right.slotIndex);
  assignmentOrder.forEach(({ slotPosition, slotIndex }) => {
    const candidates = pool
      .filter(({ index }) => !used.has(index))
      .map((entry) => ({
        ...entry,
        fit: possessionPositionFit(entry.profile, slotPosition),
        quality: Number(entry.profile.overall) || team.rating || 60,
      }))
      .sort((left, right) => right.fit - left.fit || right.quality - left.quality || left.index - right.index);
    const selected = candidates[0] || pool.find(({ index }) => !used.has(index));
    used.add(selected.index);
    selectedBySlot[slotIndex] = normalisePossessionProfile(selected.profile, slotIndex, team, slotPosition);
  });
  return selectedBySlot;
}

function possessionFormationForTeam(team, profiles) {
  if (POSSESSION_FORMATIONS[team.selectedFormation]) return team.selectedFormation;
  if (team.positionSuitability?.length) {
    const positions = team.positionSuitability.map((entry) => entry.slot);
    const defenders = positions.filter((position) => ["CB", "LB", "RB", "LWB", "RWB"].includes(position)).length;
    const strikers = positions.filter((position) => ["ST", "CF", "SS"].includes(position)).length;
    if (defenders === 3) return "3-5-2";
    if (strikers >= 2) return "4-4-2";
    if (positions.includes("CAM") && positions.filter((position) => ["CDM", "DM"].includes(position)).length >= 2) return "4-2-3-1";
  }
  const options = Object.keys(POSSESSION_FORMATIONS);
  return options[possessionHash(`${team.id}:${profiles.length}:formation`) % options.length];
}

function possessionPoint(side, point) {
  return side === "home" ? [...point] : [100 - point[0], point[1]];
}

function createPossessionSide(team, profiles, side, tacticKey) {
  const formation = possessionFormationForTeam(team, profiles);
  const missingPlayerNames = new Set(team.liveMissingPlayerNames || []);
  const missingSlotIndexes = new Set(team.liveMissingSlotIndexes || []);
  const availableProfiles = profiles.filter((profile) => !missingPlayerNames.has(profile.name));
  const orderedStarterNames = team.liveOrderedStarterNames || [];
  const formationSlots = POSSESSION_SLOT_POSITIONS[formation] || POSSESSION_SLOT_POSITIONS["4-3-3"];
  const lineup = orderedStarterNames.length === 11
    ? orderedStarterNames.map((name, slotIndex) => {
        const profile = availableProfiles.find((candidate) => candidate.name === name);
        return profile
          ? normalisePossessionProfile(profile, slotIndex, team, formationSlots[slotIndex])
          : null;
      })
    : buildPossessionLineup(team, availableProfiles, formation);
  return {
    id: team.id,
    side,
    name: team.name,
    tacticKey,
    formation,
    rating: teamSimulationRatings(team),
    players: lineup.flatMap((profile, slotIndex) => {
      if (!profile || missingSlotIndexes.has(slotIndex)) return [];
      const point = possessionPoint(side, POSSESSION_FORMATIONS[formation][slotIndex]);
      return {
        ...profile,
        side,
        index: slotIndex,
        baseX: point[0],
        baseY: point[1],
        x: point[0],
        y: point[1],
        targetX: point[0],
        targetY: point[1],
        vx: 0,
        vy: 0,
      };
    }),
  };
}

function createPossessionMatchEngine(options) {
  const homeTactic = options.homeTactic || "balanced";
  const awayTactic = options.awayTactic || "balanced";
  const home = createPossessionSide(options.home, options.homeProfiles, "home", homeTactic);
  const away = createPossessionSide(options.away, options.awayProfiles, "away", awayTactic);
  const kickoffSide = (options.seed >>> 0) % 2 === 0 ? "home" : "away";
  const engine = {
    version: 1,
    seed: options.seed >>> 0,
    randomState: options.seed >>> 0,
    home,
    away,
    possession: kickoffSide,
    carrierId: null,
    ball: { x: 50, y: 50 },
    minute: 0,
    actionIndex: 0,
    nextMinute: 0.7,
    score: { home: 0, away: 0 },
    xg: { home: 0, away: 0 },
    events: [],
    stats: {
      shots: { home: 0, away: 0 },
      possessionActions: { home: 0, away: 0 },
      passes: {
        home: { short: 0, medium: 0, long: 0, attempted: 0, completed: 0 },
        away: { short: 0, medium: 0, long: 0, attempted: 0, completed: 0 },
      },
      dribbles: { home: { attempted: 0, completed: 0 }, away: { attempted: 0, completed: 0 } },
      progressiveCarries: { home: 0, away: 0 },
      throughBalls: { home: 0, away: 0 },
      crosses: { home: 0, away: 0 },
      possessions: { home: kickoffSide === "home" ? 1 : 0, away: kickoffSide === "away" ? 1 : 0 },
      possessionLengths: [],
      movingPlayerPercentage: { total: 0, samples: 0 },
    },
    lastAction: null,
    phase: "build-up",
    possessionActionsCurrent: 0,
    passHistory: [],
    combination: null,
    counterUntil: 0,
    restart: null,
    goalLevel: options.goalLevel || "normal",
  };
  const kickoffTeam = kickoffSide === "home" ? home : away;
  engine.carrierId = kickoffTeam.players.find((player) => ["CM", "CDM", "CAM"].includes(player.position))?.id
    || kickoffTeam.players[6].id;
  return engine;
}

function possessionTeam(engine, side = engine.possession) {
  return side === "home" ? engine.home : engine.away;
}

function possessionOpponent(engine, side = engine.possession) {
  return side === "home" ? engine.away : engine.home;
}

function possessionPlayer(engine, id) {
  return [...engine.home.players, ...engine.away.players].find((player) => player.id === id);
}

function possessionDistance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function possessionPressure(engine, player, defendingSide) {
  const defenders = possessionTeam(engine, defendingSide).players;
  const nearest = Math.min(...defenders.map((defender) => possessionDistance(player, defender)));
  return simulationClamp((18 - nearest) / 16, 0, 1);
}

function possessionLanePressure(engine, from, to, defendingSide) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy || 1;
  return possessionTeam(engine, defendingSide).players.reduce((total, defender) => {
    const t = simulationClamp(((defender.x - from.x) * dx + (defender.y - from.y) * dy) / lengthSquared, 0, 1);
    const closest = { x: from.x + dx * t, y: from.y + dy * t };
    const distance = possessionDistance(defender, closest);
    return total + (t > 0.08 && t < 0.94 ? simulationClamp((7 - distance) / 7, 0, 1) : 0);
  }, 0);
}

function possessionTactic(team) {
  return typeof STANDARD_TACTICS !== "undefined" && STANDARD_TACTICS[team.tacticKey]
    ? STANDARD_TACTICS[team.tacticKey]
    : { directness: 0.48, width: 1, line: 0, turnover: 0.14, passMs: 900 };
}

function possessionDirection(side) {
  return side === "home" ? 1 : -1;
}

function possessionProgress(side, x) {
  return side === "home" ? x : 100 - x;
}

function possessionPhase(engine) {
  const progress = possessionProgress(engine.possession, engine.ball.x);
  if (progress < 32) return "build-up";
  if (progress < 58) return "midfield-progression";
  if (progress < 79) return "final-third-creation";
  return "box-attack";
}

function possessionRoleRun(engine, player, hasBall, phase, carrier) {
  const group = possessionPositionGroup(player.position);
  const direction = possessionDirection(player.side);
  const tactic = possessionTactic(possessionTeam(engine, player.side));
  const counter = hasBall && engine.counterUntil > engine.minute && player.side === engine.possession;
  let x = player.baseX + direction * tactic.line;
  let y = 50 + (player.baseY - 50) * tactic.width;

  if (hasBall) {
    const progress = possessionProgress(player.side, engine.ball.x);
    const phaseAdvance = phase === "build-up" ? 2 : phase === "midfield-progression" ? 6 : phase === "final-third-creation" ? 10 : 13;
    x += direction * phaseAdvance;
    const distanceToBall = Math.hypot(x - engine.ball.x, y - engine.ball.y);
    const support = simulationClamp((42 - distanceToBall) / 42, 0, 0.72);
    const supportDepth = group === "defender" ? -12 : group === "midfielder" ? -5 : 7;
    x += (engine.ball.x + direction * supportDepth - x) * support;
    y += (engine.ball.y + (player.index % 2 ? 12 : -12) - y) * support * 0.45;

    if (group === "attacker" && phase !== "build-up") {
      const run = counter ? 15 : phase === "box-attack" ? 9 : 5;
      x += direction * run;
      if (carrier && player.id !== carrier.id && Math.abs(player.y - carrier.y) < 18) y += player.y < 50 ? -7 : 7;
    }
    if (["LB", "RB", "LWB", "RWB"].includes(player.position) && progress > 42) {
      const sameWing = Math.sign(player.baseY - 50) === Math.sign(engine.ball.y - 50);
      x += direction * (sameWing ? (counter ? 13 : 8) : 3);
      y += (player.baseY < 50 ? -4 : 4);
    }
    if (["CM", "CAM", "CDM", "LM", "RM"].includes(player.position) && player.id !== carrier?.id) {
      const rotation = ((engine.actionIndex + player.index) % 3) - 1;
      y += rotation * 7;
      if (phase === "build-up" && group === "midfielder") x -= direction * 3;
    }
  } else {
    const blockShift = (engine.ball.x - x) * 0.22;
    x += blockShift;
    y += (engine.ball.y - y) * 0.28;
    const distanceToBall = Math.hypot(x - engine.ball.x, y - engine.ball.y);
    const pressing = tactic.line >= 5 || tactic.turnover >= 0.18;
    if (distanceToBall < (pressing ? 30 : 22)) {
      const close = pressing ? 0.42 : 0.25;
      x += (engine.ball.x - x) * close;
      y += (engine.ball.y - y) * close;
    }
    if (group === "defender") {
      const runners = possessionTeam(engine).players
        .filter((candidate) => possessionPositionGroup(candidate.position) === "attacker")
        .map((candidate) => ({ candidate, distance: Math.hypot(candidate.x - x, candidate.y - y) }))
        .sort((left, right) => left.distance - right.distance);
      if (runners[0] && runners[0].distance < 24) {
        x += (runners[0].candidate.x - x) * 0.24;
        y += (runners[0].candidate.y - y) * 0.34;
      }
    }
  }

  const pulse = ((possessionHash(`${engine.seed}:${engine.actionIndex}:${player.id}`) % 1000) / 1000) - 0.5;
  return {
    x: simulationClamp(x + pulse * 1.6, 3, 97),
    y: simulationClamp(y + pulse * 2.4, 6, 94),
  };
}

function possessionMoveShapes(engine) {
  engine.phase = possessionPhase(engine);
  const carrier = possessionPlayer(engine, engine.carrierId);
  const players = [...engine.home.players, ...engine.away.players];
  players.forEach((player) => {
    const target = player.id === carrier?.id
      ? { x: engine.ball.x, y: engine.ball.y }
      : possessionRoleRun(engine, player, player.side === engine.possession, engine.phase, carrier);
    player.targetX = target.x;
    player.targetY = target.y;
  });

  let movingSamples = 0;
  const substeps = 8;
  const dt = 0.16;
  for (let step = 0; step < substeps; step += 1) {
    players.forEach((player) => {
      if (player.id === engine.carrierId) {
        player.x = engine.ball.x;
        player.y = engine.ball.y;
        player.vx = 0;
        player.vy = 0;
        return;
      }
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const distance = Math.hypot(dx, dy);
      const maxSpeed = 4.3 + player.pace * 0.035;
      const desiredVx = distance > 0.01 ? (dx / distance) * Math.min(maxSpeed, distance * 1.4) : 0;
      const desiredVy = distance > 0.01 ? (dy / distance) * Math.min(maxSpeed, distance * 1.4) : 0;
      player.vx += (desiredVx - player.vx) * 0.34;
      player.vy += (desiredVy - player.vy) * 0.34;
      player.x = simulationClamp(player.x + player.vx * dt, 3, 97);
      player.y = simulationClamp(player.y + player.vy * dt, 6, 94);
      if (Math.hypot(player.vx, player.vy) > 0.42) movingSamples += 1;
    });
  }
  engine.stats.movingPlayerPercentage.total += (movingSamples / (players.length * substeps)) * 100;
  engine.stats.movingPlayerPercentage.samples += 1;
  return possessionTactic(possessionTeam(engine));
}

function possessionReceiverScore(engine, carrier, receiver, actionType) {
  const direction = possessionDirection(engine.possession);
  const forward = (receiver.x - carrier.x) * direction;
  const distance = possessionDistance(carrier, receiver);
  const lane = possessionLanePressure(engine, carrier, receiver, possessionOpponent(engine).side);
  const pressure = possessionPressure(engine, receiver, possessionOpponent(engine).side);
  const quality = receiver.overall * 0.07 + receiver.pace * Math.max(0, forward) * 0.006;
  const recent = engine.passHistory.slice(-4);
  const repeatedPair = recent.filter((pass) => (
    (pass.from === carrier.id && pass.to === receiver.id)
    || (pass.from === receiver.id && pass.to === carrier.id)
  )).length;
  const combinationBoost = engine.combination?.targetId === receiver.id ? 10 : 0;
  const repetitionPenalty = repeatedPair * 12;
  if (actionType === "safe-pass") {
    return -Math.abs(distance - 14) * 0.42 - Math.abs(forward - 4) * 0.45 - lane * 11 - pressure * 6
      + quality + combinationBoost - repetitionPenalty;
  }
  if (actionType === "cross") return -Math.abs(receiver.y - 50) * 0.12 + forward * 0.42 - lane * 8 + receiver.finishing * 0.09 - repetitionPenalty;
  if (actionType === "through-ball") return forward * 0.72 - Math.abs(distance - 28) * 0.25 - lane * 14 + receiver.pace * 0.12 + quality - repetitionPenalty;
  return forward * 0.46 - Math.abs(distance - 22) * 0.28 - lane * 10 - pressure * 5 + quality + combinationBoost * 0.55 - repetitionPenalty;
}

function choosePossessionReceiver(engine, carrier, actionType) {
  const team = possessionTeam(engine);
  const allowGoalkeeper = engine.phase === "build-up" && actionType === "safe-pass";
  const candidates = team.players.filter((player) => player.id !== carrier.id && (allowGoalkeeper || player.position !== "GK"));
  const maximumDistance = actionType === "safe-pass" ? 23
    : actionType === "progressive-pass" ? 31
      : actionType === "through-ball" ? 38 : 100;
  const nearby = candidates.filter((player) => possessionDistance(carrier, player) <= maximumDistance);
  const receiverPool = nearby.length >= 2 ? nearby : candidates;
  return receiverPool
    .map((player) => ({ player, score: possessionReceiverScore(engine, carrier, player, actionType) + possessionRandom(engine) * 8 }))
    .sort((left, right) => right.score - left.score)[0]?.player || candidates[0];
}

function choosePossessionAction(engine, carrier) {
  if (engine.restart === "corner") return "cross";
  const progress = possessionProgress(engine.possession, engine.ball.x);
  const tactic = possessionTactic(possessionTeam(engine));
  const tacticKey = possessionTeam(engine).tacticKey;
  const counter = engine.counterUntil > engine.minute;
  const central = 1 - Math.min(1, Math.abs(engine.ball.y - 50) / 45);
  const actions = engine.possessionActionsCurrent;
  const buildUp = engine.phase === "build-up";
  const finalThird = engine.phase === "final-third-creation";
  const box = engine.phase === "box-attack";
  const directAllowed = (tacticKey === "counter" && counter) || (carrier.passing >= 88 && counter);
  const tiki = tacticKey === "tiki-taka";
  const defensive = tacticKey === "defensive";
  const mustProgress = actions >= 9;
  const entries = [
    { value: "safe-pass", weight: mustProgress ? 3 : buildUp ? (tiki ? 48 : defensive ? 38 : 30) : tiki ? 27 : 14 },
    { value: "progressive-pass", weight: buildUp ? (directAllowed ? 20 : 11) : 25 + tactic.directness * 8 + (mustProgress ? 16 : 0) },
    { value: "through-ball", weight: buildUp && !directAllowed ? 0 : (finalThird || box ? 4 + tactic.directness * 9 + (counter ? 13 : 0) : directAllowed ? 5 : 1) },
    { value: "dribble", weight: 9 + carrier.dribbling * 0.14 + (counter ? 6 : 0) + (mustProgress ? 9 : 0) },
    { value: "cross", weight: progress > 65 && central < 0.72 ? (tiki ? 6 : 13) : 0.5 },
    { value: "shot", weight: actions < 4 && !box ? 0 : box ? 38 + carrier.finishing * 0.14 + (actions >= 7 ? 14 : 0) : finalThird ? 12 + Math.max(0, progress - 60) * 0.9 + (actions >= 8 ? 10 : 0) : 0 },
    { value: "clearance", weight: progress < 22 && possessionPressure(engine, carrier, possessionOpponent(engine).side) > 0.55 ? 14 : 0 },
  ];
  return possessionWeightedChoice(engine, entries);
}

function finishPossession(engine) {
  if (engine.possessionActionsCurrent > 0) engine.stats.possessionLengths.push(engine.possessionActionsCurrent);
  engine.possessionActionsCurrent = 0;
  engine.passHistory = [];
  engine.combination = null;
}

function switchPossession(engine, winner, x, y, counter = true) {
  const changedSide = engine.possession !== winner.side;
  if (changedSide) finishPossession(engine);
  engine.possession = winner.side;
  engine.carrierId = winner.id;
  engine.ball = { x: simulationClamp(x, 3, 97), y: simulationClamp(y, 5, 95) };
  if (changedSide) engine.stats.possessions[winner.side] += 1;
  if (counter) engine.counterUntil = engine.minute + 7;
  engine.restart = null;
}

function possessionPassBand(distance) {
  if (distance <= 18) return "short";
  if (distance <= 34) return "medium";
  return "long";
}

function resolvePossessionPass(engine, carrier, actionType) {
  const receiver = choosePossessionReceiver(engine, carrier, actionType);
  const defendingSide = possessionOpponent(engine).side;
  const direction = possessionDirection(engine.possession);
  const runDistance = actionType === "through-ball" ? 8
    : actionType === "progressive-pass" ? 6
      : actionType === "cross" ? 9 : 0;
  const targetPoint = {
    x: actionType === "cross"
      ? (engine.possession === "home" ? 88 : 12)
      : simulationClamp(receiver.x + direction * runDistance, 3, 97),
    y: actionType === "cross"
      ? simulationClamp(50 + (receiver.y - 50) * 0.35, 32, 68)
      : receiver.y,
  };
  const distance = possessionDistance(carrier, targetPoint);
  const passBand = possessionPassBand(distance);
  const attackingSide = engine.possession;
  engine.stats.passes[attackingSide].attempted += 1;
  engine.stats.passes[attackingSide][passBand] += 1;
  if (actionType === "through-ball") engine.stats.throughBalls[attackingSide] += 1;
  if (actionType === "cross") engine.stats.crosses[attackingSide] += 1;
  const pressure = possessionPressure(engine, carrier, defendingSide);
  const lane = possessionLanePressure(engine, carrier, targetPoint, defendingSide);
  const difficulty = actionType === "safe-pass" ? 0.02
    : actionType === "progressive-pass" ? 0.09
      : actionType === "through-ball" ? 0.17 : 0.14;
  const earlyRetention = engine.possessionActionsCurrent <= 2 ? 0.07 : 0;
  const successChance = simulationClamp(
    0.88 + carrier.passing * 0.0021 + receiver.dribbling * 0.0007
      - distance * 0.0027 - pressure * 0.08 - lane * 0.06 - difficulty + earlyRetention,
    0.28,
    0.98,
  );
  if (possessionRandom(engine) < successChance) {
    const assistQuality = simulationClamp((carrier.passing + receiver.dribbling) / 200 - lane * 0.12, 0.15, 0.95);
    receiver.x = targetPoint.x;
    receiver.y = targetPoint.y;
    engine.carrierId = receiver.id;
    engine.ball = { ...targetPoint };
    engine.stats.passes[attackingSide].completed += 1;
    engine.passHistory.push({ from: carrier.id, to: receiver.id });
    if (engine.passHistory.length > 6) engine.passHistory.shift();
    if (passBand === "short" && possessionRandom(engine) < (possessionTeam(engine).tacticKey === "tiki-taka" ? 0.38 : 0.2)) {
      engine.combination = { targetId: carrier.id, expires: engine.actionIndex + 2 };
    } else if (engine.combination?.expires <= engine.actionIndex) {
      engine.combination = null;
    }
    engine.restart = null;
    return { type: actionType, outcome: "complete", actor: carrier, target: receiver, from: { x: carrier.x, y: carrier.y }, to: { ...targetPoint }, assistQuality };
  }
  const interceptor = possessionOpponent(engine).players
    .map((player) => ({ player, distance: possessionDistance(player, receiver) }))
    .sort((left, right) => left.distance - right.distance || right.player.defending - left.player.defending)[0].player;
  const interceptionType = actionType === "cross" && possessionRandom(engine) < 0.45 ? "clearance" : "interception";
  switchPossession(engine, interceptor, targetPoint.x, targetPoint.y, true);
  return { type: interceptionType, attemptedType: actionType, outcome: "turnover", actor: interceptor, target: receiver, from: { x: carrier.x, y: carrier.y }, to: { ...targetPoint } };
}

function resolvePossessionDribble(engine, carrier) {
  const attackingSide = engine.possession;
  engine.stats.dribbles[attackingSide].attempted += 1;
  const opponent = possessionOpponent(engine);
  const defender = opponent.players
    .map((player) => ({ player, distance: possessionDistance(player, carrier) }))
    .sort((left, right) => left.distance - right.distance)[0].player;
  const pressure = possessionPressure(engine, carrier, opponent.side);
  const foulChance = simulationClamp(0.018 + pressure * 0.07 + (carrier.dribbling - defender.defending) * 0.0005, 0.01, 0.12);
  if (possessionRandom(engine) < foulChance) {
    const penalty = possessionProgress(engine.possession, engine.ball.x) > 84 && Math.abs(engine.ball.y - 50) < 22;
    return { type: "foul", outcome: penalty ? "penalty" : "free-kick", actor: defender, target: carrier, from: { ...engine.ball }, to: { ...engine.ball }, penalty };
  }
  const earlyRetention = engine.possessionActionsCurrent <= 2 ? 0.08 : 0;
  const successChance = simulationClamp(0.7 + (carrier.dribbling + carrier.pace - defender.defending - defender.physical) * 0.0045 - pressure * 0.08 + earlyRetention, 0.34, 0.95);
  if (possessionRandom(engine) < successChance) {
    const direction = possessionDirection(engine.possession);
    const distance = 5 + possessionRandom(engine) * 8;
    const from = { x: carrier.x, y: carrier.y };
    const to = { x: engine.ball.x + direction * distance, y: engine.ball.y + (possessionRandom(engine) - 0.5) * 10 };
    engine.ball = { x: simulationClamp(to.x, 3, 97), y: simulationClamp(to.y, 5, 95) };
    engine.carrierId = carrier.id;
    carrier.x = engine.ball.x;
    carrier.y = engine.ball.y;
    engine.stats.dribbles[attackingSide].completed += 1;
    if (possessionProgress(attackingSide, engine.ball.x) - possessionProgress(attackingSide, from.x) >= 5) {
      engine.stats.progressiveCarries[attackingSide] += 1;
    }
    return { type: "dribble", outcome: "complete", actor: carrier, target: carrier, from, to: { ...engine.ball } };
  }
  switchPossession(engine, defender, carrier.x, carrier.y, true);
  return { type: "tackle", outcome: "turnover", actor: defender, target: carrier, from: { x: defender.x, y: defender.y }, to: { x: carrier.x, y: carrier.y } };
}

function possessionShotQuality(engine, shooter, assistQuality = 0.45) {
  const goalX = engine.possession === "home" ? 100 : 0;
  const distance = Math.hypot(goalX - engine.ball.x, (engine.ball.y - 50) * 0.72);
  const angleQuality = simulationClamp(1 - Math.abs(engine.ball.y - 50) / 48, 0.16, 1);
  const pressure = possessionPressure(engine, shooter, possessionOpponent(engine).side);
  const distanceQuality = simulationClamp(1 - (distance - 7) / 43, 0.04, 1);
  const finishingQuality = simulationClamp((shooter.finishing - 45) / 54, 0.08, 1);
  const baseXg = 0.015 + distanceQuality * distanceQuality * 0.46;
  return simulationClamp(baseXg * (0.48 + angleQuality * 0.52) * (0.55 + finishingQuality * 0.65) * (1 - pressure * 0.48) * (0.78 + assistQuality * 0.38), 0.01, 0.72);
}

function resolvePossessionShot(engine, carrier, assistQuality = 0.45) {
  const opponent = possessionOpponent(engine);
  const goalkeeper = opponent.players.find((player) => player.position === "GK") || opponent.players[0];
  const xg = possessionShotQuality(engine, carrier, assistQuality);
  engine.xg[engine.possession] += xg;
  engine.stats.shots[engine.possession] += 1;
  const pressure = possessionPressure(engine, carrier, opponent.side);
  const onTargetChance = simulationClamp(0.48 + carrier.finishing * 0.004 - pressure * 0.16, 0.34, 0.86);
  const blockedChance = simulationClamp(pressure * 0.28 + (opponent.rating.defence - carrier.overall) * 0.003, 0.04, 0.34);
  const goalMultiplier = engine.goalLevel === "tight" ? 0.88 : engine.goalLevel === "wild" ? 1.42 : 1.14;
  const goalChance = simulationClamp(xg * (1.12 - goalkeeper.goalkeeping * 0.0042) * goalMultiplier, 0.006, 0.64);
  const roll = possessionRandom(engine);
  const goalX = engine.possession === "home" ? 98 : 2;
  const targetY = 34 + possessionRandom(engine) * 32;
  if (roll < goalChance) {
    engine.score[engine.possession] += 1;
    const event = { type: "goal", side: engine.possession, scorer: carrier.name, player: carrier.name, minute: Math.max(1, Math.round(engine.minute)), goalType: "openPlay", xg: Number(xg.toFixed(3)) };
    engine.events.push(event);
    return { type: "shot", outcome: "goal", actor: carrier, goalkeeper, from: { ...engine.ball }, to: { x: goalX, y: targetY }, xg, event };
  }
  if (roll < goalChance + blockedChance) {
    const blocker = opponent.players.filter((player) => player.position !== "GK")
      .sort((left, right) => possessionDistance(left, carrier) - possessionDistance(right, carrier))[0];
    if (possessionRandom(engine) < 0.42) {
      engine.restart = "corner";
      return { type: "shot", outcome: "corner", actor: carrier, target: blocker, from: { ...engine.ball }, to: { x: goalX, y: engine.ball.y < 50 ? 7 : 93 }, xg };
    }
    switchPossession(engine, blocker, blocker.x, blocker.y, true);
    return { type: "shot", outcome: "blocked", actor: carrier, target: blocker, from: { ...engine.ball }, to: { x: blocker.x, y: blocker.y }, xg };
  }
  if (roll < goalChance + blockedChance + onTargetChance * 0.48) {
    const rebound = possessionRandom(engine) < simulationClamp(0.20 + carrier.finishing * 0.001, 0.2, 0.32);
    if (rebound) {
      const attacker = possessionTeam(engine).players.filter((player) => player.position !== "GK")
        .sort((left, right) => possessionDistance(left, goalkeeper) - possessionDistance(right, goalkeeper))[0];
      engine.carrierId = attacker.id;
      engine.ball = { x: goalkeeper.x - possessionDirection(opponent.side) * 5, y: 50 + (possessionRandom(engine) - 0.5) * 18 };
      return { type: "shot", outcome: "rebound", actor: carrier, goalkeeper, target: attacker, from: { ...engine.ball }, to: { ...engine.ball }, xg };
    }
    switchPossession(engine, goalkeeper, goalkeeper.x, goalkeeper.y, false);
    return { type: "shot", outcome: "saved", actor: carrier, goalkeeper, from: { ...engine.ball }, to: { x: goalkeeper.x, y: goalkeeper.y }, xg };
  }
  switchPossession(engine, goalkeeper, goalkeeper.x, goalkeeper.y, false);
  return { type: "shot", outcome: "missed", actor: carrier, goalkeeper, from: { ...engine.ball }, to: { x: goalX, y: targetY < 50 ? 18 : 82 }, xg };
}

function resetPossessionKickoff(engine, concedingSide) {
  finishPossession(engine);
  engine.possession = concedingSide;
  const team = possessionTeam(engine);
  const carrier = team.players.find((player) => ["CM", "CDM", "CAM"].includes(player.position)) || team.players[6];
  engine.carrierId = carrier.id;
  engine.ball = { x: 50, y: 50 };
  engine.restart = null;
  engine.counterUntil = 0;
  engine.stats.possessions[concedingSide] += 1;
}

function advancePossessionMatchEngine(engine, minute) {
  engine.minute = minute;
  if (minute + 0.0001 < engine.nextMinute) return null;
  possessionMoveShapes(engine);
  const carrier = possessionPlayer(engine, engine.carrierId) || possessionTeam(engine).players[6];
  carrier.x = engine.ball.x;
  carrier.y = engine.ball.y;
  const attackingSide = engine.possession;
  engine.possessionActionsCurrent += 1;
  const actionType = choosePossessionAction(engine, carrier);
  let action;
  if (["safe-pass", "progressive-pass", "through-ball", "cross"].includes(actionType)) {
    action = resolvePossessionPass(engine, carrier, actionType);
  } else if (actionType === "dribble") {
    action = resolvePossessionDribble(engine, carrier);
  } else if (actionType === "shot") {
    action = resolvePossessionShot(engine, carrier, engine.lastAction?.assistQuality ?? 0.45);
  } else if (actionType === "clearance") {
    const opponent = possessionOpponent(engine);
    const receiver = opponent.players.find((player) => ["CB", "CDM", "CM"].includes(player.position)) || opponent.players[5];
    const from = { ...engine.ball };
    switchPossession(engine, receiver, receiver.x, receiver.y, true);
    action = { type: "clearance", outcome: "turnover", actor: carrier, target: receiver, from, to: { x: receiver.x, y: receiver.y } };
  }
  action = action || { type: "safe-pass", outcome: "complete", actor: carrier, target: carrier, from: { ...engine.ball }, to: { ...engine.ball } };
  action.minute = minute;
  action.side = action.event?.side || attackingSide;
  action.phase = engine.phase;
  action.index = engine.actionIndex;
  engine.actionIndex += 1;
  engine.stats.possessionActions[action.side] += 1;
  engine.lastAction = action;
  if (action.outcome === "goal") resetPossessionKickoff(engine, action.side === "home" ? "away" : "home");
  if (action.penalty) engine.restart = "penalty";
  const tempo = possessionTactic(possessionTeam(engine)).passMs;
  const actionMinutes = 0.42 + (tempo / 1000) * 0.38 + possessionRandom(engine) * 0.48;
  engine.nextMinute = minute + actionMinutes;
  return action;
}

// Watched matches use a deterministic highlight reel. The statistical result is
// authoritative; these sequences explain how its meaningful moments happened.
const MATCH_HIGHLIGHT_MODES = Object.freeze(["commentary", "key", "extended"]);
const MATCH_HIGHLIGHT_TYPES = Object.freeze([
  "patient-build-up",
  "midfield-combination",
  "wing-overlap",
  "counterattack",
  "through-ball",
  "individual-dribble",
  "long-range-shot",
  "set-piece",
  "defensive-interception",
  "goalkeeper-save-rebound",
]);

function createHighlightRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function highlightRound(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function createAuthoritativeMatchStats(options, random) {
  const { result, home, away } = options;
  const homeRatings = teamSimulationRatings(home);
  const awayRatings = teamSimulationRatings(away);
  const homeGoals = Number(result.homeGoals) || 0;
  const awayGoals = Number(result.awayGoals) || 0;
  const homeXg = Math.max(homeGoals * 0.34, Number(result.expectedGoals?.home) || 0.7);
  const awayXg = Math.max(awayGoals * 0.34, Number(result.expectedGoals?.away) || 0.7);
  const maxMinute = result.extraTime ? 120 : 90;
  const possessionEdge = (homeRatings.midfield - awayRatings.midfield) * 0.36
    + (homeRatings.overall - awayRatings.overall) * 0.12
    + (random() - 0.5) * 7;
  const homePossession = Math.round(simulationClamp(50 + possessionEdge, 34, 66));
  const shotsFor = (xg, goals, attack, defence) => Math.max(
    goals,
    Math.round(4 + xg * 3.6 + (attack - defence) * 0.055 + random() * 3.2),
  );
  const onTargetFor = (shots, goals, attack, goalkeeper) => Math.max(
    goals,
    Math.min(shots, Math.round(goals + (shots - goals) * simulationClamp(
      0.31 + (attack - goalkeeper) * 0.003 + random() * 0.12,
      0.27,
      0.58,
    ))),
  );
  const homeShots = shotsFor(homeXg, homeGoals, homeRatings.attack, awayRatings.defence);
  const awayShots = shotsFor(awayXg, awayGoals, awayRatings.attack, homeRatings.defence);
  const redCards = result.redCards || [];
  const yellowCardsFor = (ratings, reds) => Math.max(
    reds,
    Math.round(simulationClamp(1.0 + (72 - ratings.discipline) * 0.03 + random() * 1.7, 0, 5)),
  );
  const homeReds = redCards.filter((card) => card.side === "home").length;
  const awayReds = redCards.filter((card) => card.side === "away").length;
  return {
    maxMinute,
    possession: { home: homePossession, away: 100 - homePossession },
    xg: { home: highlightRound(homeXg, 2), away: highlightRound(awayXg, 2) },
    shots: { home: homeShots, away: awayShots },
    shotsOnTarget: {
      home: onTargetFor(homeShots, homeGoals, homeRatings.attack, awayRatings.goalkeeper),
      away: onTargetFor(awayShots, awayGoals, awayRatings.attack, homeRatings.goalkeeper),
    },
    yellowCards: {
      home: yellowCardsFor(homeRatings, homeReds),
      away: yellowCardsFor(awayRatings, awayReds),
    },
    redCards: { home: homeReds, away: awayReds },
  };
}

function highlightPlayerGroups(side) {
  const players = side.players;
  const fallbackPlayer = players.find((player) => player.position !== "GK") || players[0] || {
    id: `${side.id || side.name || side.side || "team"}:fallback-player`,
    name: side.name || "A player",
    position: "CM",
    baseY: 50,
  };
  const idOf = (player) => player?.id || fallbackPlayer.id;
  const sortedByWidth = (pool) => [...pool].sort((left, right) => left.baseY - right.baseY);
  const goalkeeper = players.find((player) => player.position === "GK") || players[0] || fallbackPlayer;
  const defenders = sortedByWidth(players.filter((player) => possessionPositionGroup(player.position) === "defender"));
  const midfielders = sortedByWidth(players.filter((player) => possessionPositionGroup(player.position) === "midfielder"));
  const attackers = sortedByWidth(players.filter((player) => possessionPositionGroup(player.position) === "attacker"));
  const byPosition = (positions, pool = players) => positions
    .map((position) => pool.find((player) => player.position === position))
    .find(Boolean);
  const central = (pool, fallback, excluded = []) => [...pool]
    .filter((player) => !excluded.includes(player?.id))
    .sort((left, right) => Math.abs(left.baseY - 50) - Math.abs(right.baseY - 50))[0] || fallback;
  const left = (pool, fallback, excluded = []) => sortedByWidth(pool)
    .find((player) => !excluded.includes(player?.id)) || fallback;
  const right = (pool, fallback, excluded = []) => [...sortedByWidth(pool)]
    .reverse()
    .find((player) => !excluded.includes(player?.id)) || fallback;
  const lb = byPosition(["LB", "LWB"], defenders) || left(defenders, goalkeeper);
  const rb = byPosition(["RB", "RWB"], defenders) || right(defenders, goalkeeper, [idOf(lb)]);
  const centreBacks = defenders.filter((player) => ["CB", "SW"].includes(player.position));
  const lcb = left(centreBacks, left(defenders, goalkeeper, [idOf(lb), idOf(rb)]));
  const rcb = right(centreBacks, right(defenders, lcb, [idOf(lb), idOf(rb), idOf(lcb)]));
  const dm = byPosition(["CDM", "DM"], midfielders) || central(midfielders, lcb);
  const am = byPosition(["CAM", "AM"], midfielders)
    || central(midfielders, central(attackers, dm || fallbackPlayer), [idOf(dm)]);
  const lcm = byPosition(["LM", "LCM"], midfielders)
    || left(midfielders, am || fallbackPlayer, [idOf(dm), idOf(am)]);
  const rcm = byPosition(["RM", "RCM"], midfielders)
    || right(midfielders, lcm || fallbackPlayer, [idOf(dm), idOf(am), idOf(lcm)]);
  const lw = byPosition(["LW", "LF", "LM"], players)
    || left([...attackers, ...midfielders], am || fallbackPlayer, [idOf(dm), idOf(am)]);
  const rw = byPosition(["RW", "RF", "RM"], players)
    || right([...attackers, ...midfielders], am || fallbackPlayer, [idOf(dm), idOf(am), idOf(lw)]);
  const st = byPosition(["ST", "CF", "SS"], attackers)
    || central(attackers, am || fallbackPlayer, [idOf(lw), idOf(rw)]);
  return {
    gk: goalkeeper,
    lb,
    lcb,
    rcb,
    rb,
    dm,
    lcm,
    am,
    rcm,
    lw,
    st,
    rw,
  };
}

function highlightPoint(side, x, y) {
  return { x: side === "home" ? x : 100 - x, y };
}

function highlightPlayerShape(presentation, attackingSide, ball, receiverId, actionIndex) {
  const direction = possessionDirection(attackingSide);
  const progress = possessionProgress(attackingSide, ball.x);
  const allPlayers = [...presentation.home.players, ...presentation.away.players];
  const shape = {};
  allPlayers.forEach((player) => {
    const attacking = player.side === attackingSide;
    const group = possessionPositionGroup(player.position);
    let x = player.baseX;
    let y = player.baseY;
    if (attacking) {
      const phaseAdvance = progress < 32 ? 2 : progress < 58 ? 6 : progress < 79 ? 10 : 13;
      const groupFactor = group === "goalkeeper" ? 0.08 : group === "defender" ? 0.45 : group === "midfielder" ? 0.78 : 1;
      x += direction * phaseAdvance * groupFactor;
      const supportDistance = Math.hypot(x - ball.x, y - ball.y);
      const support = simulationClamp((40 - supportDistance) / 48, 0, 0.55);
      x += (ball.x - direction * (group === "attacker" ? -8 : group === "midfielder" ? 7 : 16) - x) * support;
      y += (ball.y + (player.index % 2 === 0 ? -10 : 10) - y) * support * 0.38;
      if (group === "attacker" && progress > 52 && player.id !== receiverId) x += direction * (5 + (player.index % 3) * 1.8);
      if (["LB", "RB", "LWB", "RWB"].includes(player.position) && progress > 42) {
        const sameWing = Math.sign(player.baseY - 50) === Math.sign(ball.y - 50);
        x += direction * (sameWing ? 8 : 3);
      }
    } else {
      x += (ball.x - x) * 0.22;
      y += (ball.y - y) * 0.24;
      if (group === "defender") {
        x -= direction * 3;
        y = 50 + (y - 50) * 0.86;
      }
      if (group === "midfielder") y = 50 + (y - 50) * 0.9;
    }
    const pulse = ((possessionHash(`${presentation.seed}:${actionIndex}:${player.id}`) % 1000) / 1000) - 0.5;
    shape[player.id] = {
      x: simulationClamp(x + pulse * 0.9, 3, 97),
      y: simulationClamp(y + pulse * 1.3, 6, 94),
    };
  });
  if (receiverId && shape[receiverId]) shape[receiverId] = { ...ball };
  return shape;
}

function highlightActorByName(side, name, fallback) {
  if (!name) return fallback;
  const normalized = name.replace(/\s*\(OG\)\s*$/i, "");
  const starter = side.players.find((player) => player.name === normalized);
  if (starter) return starter;
  return fallback ? { ...fallback, name: normalized, substituteFor: fallback.name } : fallback;
}

function createHighlightSequence(presentation, descriptor, random) {
  const side = descriptor.side;
  const attacking = side === "home" ? presentation.home : presentation.away;
  const defending = side === "home" ? presentation.away : presentation.home;
  const roles = highlightPlayerGroups(attacking);
  const defendingRoles = highlightPlayerGroups(defending);
  const scorer = highlightActorByName(attacking, descriptor.event?.player || descriptor.event?.scorer, roles.st);
  const assister = highlightActorByName(attacking, descriptor.event?.assist, roles.am);
  const style = descriptor.sequenceType;
  const laneLeft = random() < 0.5;
  const wing = laneLeft ? roles.lw : roles.rw;
  const fullback = laneLeft ? roles.lb : roles.rb;
  const centralMid = laneLeft ? roles.lcm : roles.rcm;
  const wingY = laneLeft ? 18 : 82;
  const actions = [];
  const line = (key, options) => options[
    possessionHash(`${presentation.seed}:${descriptor.timelineIndex}:${key}`) % options.length
  ];
  let ball = style === "counterattack"
    ? highlightPoint(side, 28, laneLeft ? 37 : 63)
    : style === "set-piece"
      ? highlightPoint(side, 63, wingY)
      : highlightPoint(side, 8, 50);
  let carrier = style === "counterattack" ? roles.lcb : style === "set-piece" ? wing : roles.gk;

  const add = (type, actor, target, x, y, copy, extra = {}) => {
    const destination = highlightPoint(side, x, y);
    const actionIndex = descriptor.timelineIndex * 20 + actions.length;
    const receiverId = ["safe-pass", "progressive-pass", "through-ball", "cross"].includes(type)
      ? target?.id
      : null;
    const shape = highlightPlayerShape(presentation, side, destination, receiverId, actionIndex);
    if (actor?.id && shape[actor.id] && ["dribble", "shot", "foul", "interception", "tackle"].includes(type)) {
      shape[actor.id] = { ...destination };
    }
    if (type === "foul" && target?.id && shape[target.id]) shape[target.id] = { ...destination };
    actions.push({
      index: actions.length,
      type,
      side,
      actor,
      target,
      from: { ...ball },
      to: destination,
      shape,
      commentary: copy,
      duration: extra.duration || (["cross", "through-ball", "shot", "clearance"].includes(type) ? 1050 : type === "dribble" ? 760 : 900),
      ...extra,
    });
    ball = destination;
    carrier = target || actor;
  };

  const finishShot = (shooter = scorer, xg = descriptor.xg) => {
    if (carrier?.id !== shooter.id) {
      add("progressive-pass", carrier, shooter, 78, 50, `${carrier.name} finds ${shooter.name} between the lines.`);
    }
    const outcome = descriptor.outcome;
    const goalY = 39 + random() * 22;
    const destination = outcome === "goal"
      ? { x: 99, y: goalY }
      : outcome === "saved" || outcome === "rebound"
        ? { x: 94, y: goalY }
        : outcome === "blocked"
          ? { x: 87, y: 42 + random() * 16 }
          : outcome === "corner"
            ? { x: 99, y: laneLeft ? 7 : 93 }
            : { x: 99, y: random() < 0.5 ? 29 : 71 };
    const goalCopy = descriptor.event?.ownGoal
      ? `${descriptor.event.ownGoalBy} cannot sort out the feet and turns it into the net.`
      : line("goal", [
        `${shooter.name} makes no mistake!`,
        `${shooter.name} buries it!`,
        `${shooter.name} supplies the finish!`,
      ]);
    const copy = outcome === "goal" ? goalCopy
      : outcome === "saved" ? line("save", [
        `${defendingRoles.gk.name} gets down well and holds ${shooter.name}'s effort.`,
        `${defendingRoles.gk.name} is equal to it and makes a firm save.`,
        `${defendingRoles.gk.name} reads it all the way and gathers safely.`,
      ])
        : outcome === "blocked" ? line("block", [
          `${defendingRoles.lcb.name} throws a body in the way!`,
          `${defendingRoles.lcb.name} closes the angle and makes a vital block.`,
          `${defendingRoles.lcb.name} gets across just in time.`,
        ])
          : outcome === "corner" ? line("corner", [
            `${defendingRoles.rcb.name} gets a touch and sends it behind.`,
            `It takes a nick off ${defendingRoles.rcb.name} and spins behind.`,
          ])
            : line("miss", [
              `${shooter.name} drags it just past the post.`,
              `${shooter.name} sends it flashing narrowly wide.`,
              `${shooter.name} cannot quite bend it inside the upright.`,
            ]);
    const shotTarget = ["blocked", "corner"].includes(outcome) ? defendingRoles.lcb : defendingRoles.gk;
    add("shot", shooter, shotTarget, destination.x, destination.y, copy, {
      outcome,
      xg,
      event: descriptor.event || null,
      duration: 980,
    });
    const shot = actions.at(-1);
    if (shot?.shape?.[defendingRoles.gk.id]) {
      const keeperY = outcome === "saved" || outcome === "rebound"
        ? destination.y
        : outcome === "goal" ? (destination.y < 50 ? 63 : 37) : 50;
      shot.shape[defendingRoles.gk.id] = highlightPoint(
        side,
        outcome === "saved" || outcome === "rebound" ? 94 : 97,
        keeperY,
      );
    }
    if (["blocked", "corner"].includes(outcome) && shot?.shape?.[defendingRoles.lcb.id]) {
      shot.shape[defendingRoles.lcb.id] = highlightPoint(side, destination.x, destination.y);
    }
  };

  if (descriptor.outcome === "penalty") {
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} rolls it out to begin the attack.`);
    add("progressive-pass", roles.lcb, roles.dm, 35, 50, `${roles.dm.name} turns neatly beyond the first line.`);
    add("safe-pass", roles.dm, centralMid, 49, laneLeft ? 36 : 64, `${centralMid.name} keeps the move flowing.`);
    add("progressive-pass", centralMid, wing, 65, wingY, `${wing.name} takes it in stride.`);
    add("dribble", wing, wing, 77, laneLeft ? 31 : 69, `${wing.name} commits the defender and bursts into the area.`);
    const offender = highlightActorByName(defending, descriptor.event?.fouledBy, defendingRoles.lcb);
    add("foul", offender, wing, 84, laneLeft ? 40 : 60, `${wing.name} is clipped inside the box. The referee points to the spot!`, {
      outcome: "penalty",
      event: descriptor.event || null,
      xg: descriptor.xg,
      duration: 920,
    });
  } else if (descriptor.event?.type === "red") {
    const offender = highlightActorByName(defending, descriptor.event.player, defendingRoles.dm);
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} starts from the back.`);
    add("progressive-pass", roles.lcb, roles.dm, 34, 50, `${roles.dm.name} moves beyond the first press.`);
    add("safe-pass", roles.dm, centralMid, 48, laneLeft ? 36 : 64, `${centralMid.name} finds a supporting angle.`);
    add("progressive-pass", centralMid, wing, 61, wingY, `${wing.name} turns into open space.`);
    add("dribble", wing, wing, 70, laneLeft ? 29 : 71, `${wing.name} carries toward the defensive line.`);
    add("foul", offender, wing, 73, laneLeft ? 34 : 66, `${offender.name} arrives late and brings the attack down.`, {
      outcome: "foul",
      event: descriptor.event,
      duration: 960,
    });
  } else if (style === "patient-build-up") {
    add("safe-pass", roles.gk, roles.lcb, 17, 39, `${roles.gk.name} invites the press and rolls it short to ${roles.lcb.name}.`);
    add("safe-pass", roles.lcb, fullback, 27, wingY, `${roles.lcb.name} shifts the point of attack to ${fullback.name}.`);
    add("progressive-pass", fullback, centralMid, 40, laneLeft ? 32 : 68, `${centralMid.name} drops into a pocket to receive.`);
    add("dribble", centralMid, centralMid, 49, laneLeft ? 36 : 64, `${centralMid.name} glides beyond the midfield line.`);
    add("safe-pass", centralMid, roles.am, 58, 50, `${roles.am.name} takes it on the half-turn.`);
    add("progressive-pass", roles.am, wing, 69, wingY, `${wing.name} stretches the defence out wide.`);
    add("through-ball", wing, assister, 77, laneLeft ? 38 : 62, `${assister.name} darts into the channel and is found.`);
    finishShot(scorer);
  } else if (style === "midfield-combination") {
    add("safe-pass", roles.gk, roles.rcb, 17, 61, `${roles.gk.name} starts the move calmly.`);
    add("progressive-pass", roles.rcb, roles.dm, 35, 50, `${roles.dm.name} shows for the ball.`);
    add("safe-pass", roles.dm, centralMid, 44, laneLeft ? 36 : 64, `${centralMid.name} plays around the press.`);
    add("progressive-pass", centralMid, roles.am, 56, 50, `${roles.am.name} finds space between midfield and defence.`);
    add("safe-pass", roles.am, centralMid, 63, laneLeft ? 35 : 65, `A sharp one-two releases ${centralMid.name}.`);
    add("through-ball", centralMid, assister, 74, laneLeft ? 31 : 69, `${assister.name} attacks the gap.`);
    finishShot(scorer);
  } else if (style === "wing-overlap") {
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} finds ${roles.lcb.name}.`);
    add("progressive-pass", roles.lcb, centralMid, 37, laneLeft ? 36 : 64, `${centralMid.name} draws a midfielder out.`);
    add("safe-pass", centralMid, wing, 53, wingY, `${wing.name} receives to feet.`);
    add("dribble", wing, wing, 63, wingY, `${wing.name} carries at the full-back.`);
    add("through-ball", wing, fullback, 76, laneLeft ? 10 : 90, `${fullback.name} races around the outside.`);
    add("cross", fullback, scorer, 84, 50, `${fullback.name} drives a cross into the area.`, { duration: 1120 });
    finishShot(scorer);
  } else if (style === "counterattack") {
    add("interception", roles.lcb, roles.lcb, 29, laneLeft ? 38 : 62, `${roles.lcb.name} anticipates the pass and steps in decisively.`);
    add("progressive-pass", roles.lcb, roles.dm, 40, 50, `${roles.dm.name} turns into acres of space.`);
    add("dribble", roles.dm, roles.dm, 50, 50, `${roles.dm.name} powers beyond the first challenge.`);
    add("progressive-pass", roles.dm, roles.am, 61, laneLeft ? 43 : 57, `${roles.am.name} takes charge of the break.`);
    add("through-ball", roles.am, wing, 75, wingY, `${wing.name} is released into the channel!`);
    add("progressive-pass", wing, assister, 82, laneLeft ? 39 : 61, `${wing.name} keeps a cool head and picks out the cut-back.`);
    finishShot(scorer);
  } else if (style === "through-ball") {
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} restarts quickly and keeps it on the deck.`);
    add("progressive-pass", roles.lcb, roles.dm, 35, 48, `${roles.dm.name} receives beyond the first line of pressure.`);
    add("safe-pass", roles.dm, centralMid, 48, laneLeft ? 35 : 65, `${centralMid.name} moves it on first time.`);
    add("progressive-pass", centralMid, assister, 61, 50, `${assister.name} turns and immediately looks forward.`);
    add("through-ball", assister, scorer, 82, laneLeft ? 43 : 57, `${scorer.name} times the run perfectly and is in behind!`);
    finishShot(scorer);
  } else if (style === "individual-dribble") {
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} feeds the left side.`);
    add("progressive-pass", roles.lcb, centralMid, 39, laneLeft ? 36 : 64, `${centralMid.name} advances the move.`);
    add("safe-pass", centralMid, wing, 55, wingY, `${wing.name} receives in space.`);
    add("dribble", wing, wing, 64, laneLeft ? 22 : 78, `${wing.name} accelerates at the defender.`);
    add("dribble", wing, wing, 73, laneLeft ? 31 : 69, `${wing.name} slips inside a second challenge.`);
    add("progressive-pass", wing, assister, 80, laneLeft ? 42 : 58, `${assister.name} offers the cut-back.`);
    finishShot(scorer);
  } else if (style === "long-range-shot") {
    add("safe-pass", roles.gk, roles.rcb, 17, 60, `${roles.gk.name} calmly begins from the back.`);
    add("progressive-pass", roles.rcb, roles.dm, 37, 52, `${roles.dm.name} strides forward with nobody closing down.`);
    add("safe-pass", roles.dm, centralMid, 49, laneLeft ? 39 : 61, `${centralMid.name} switches play and opens the pitch.`);
    add("progressive-pass", centralMid, scorer, 66, 50, `${scorer.name} is afforded a yard outside the area.`);
    finishShot(scorer, Math.min(0.16, descriptor.xg));
  } else if (style === "set-piece") {
    add("foul", defendingRoles.lcm, wing, 63, wingY, `${wing.name} is brought down in a dangerous area.`);
    add("safe-pass", wing, centralMid, 65, laneLeft ? 28 : 72, `${centralMid.name} stands over the free kick.`);
    add("cross", centralMid, assister, 80, laneLeft ? 43 : 57, `${centralMid.name} curls it into a crowded box.`);
    add("interception", defendingRoles.lcb, assister, 82, laneLeft ? 45 : 55, `${assister.name} keeps the second ball alive.`);
    add("safe-pass", assister, scorer, 84, 50, `${scorer.name} reacts first.`);
    finishShot(scorer);
  } else if (style === "defensive-interception") {
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} builds from the back.`);
    add("progressive-pass", roles.lcb, roles.dm, 36, 50, `${roles.dm.name} looks through midfield.`);
    add("safe-pass", roles.dm, centralMid, 49, laneLeft ? 35 : 65, `${centralMid.name} takes it under pressure.`);
    add("progressive-pass", centralMid, roles.am, 62, 50, `${roles.am.name} tries to thread the gap.`);
    add("interception", defendingRoles.dm, defendingRoles.dm, 66, 50, `${defendingRoles.dm.name} reads it and ends the attack.`, { outcome: "turnover" });
  } else {
    add("safe-pass", roles.gk, roles.lcb, 17, 40, `${roles.gk.name} begins patiently.`);
    add("progressive-pass", roles.lcb, roles.dm, 36, 50, `${roles.dm.name} moves it through midfield.`);
    add("progressive-pass", roles.dm, assister, 59, laneLeft ? 42 : 58, `${assister.name} takes up a supporting angle.`);
    add("through-ball", assister, scorer, 80, 50, `${scorer.name} meets the pass in stride.`);
    add("shot", scorer, defendingRoles.gk, 97, 45 + random() * 10, `${defendingRoles.gk.name} makes the first save.`, { outcome: "rebound", xg: descriptor.xg * 0.7 });
    add("dribble", assister, assister, 86, laneLeft ? 43 : 57, `${assister.name} is first to the rebound.`);
    finishShot(scorer, descriptor.xg * 0.3);
  }

  const first = actions[0];
  if (descriptor.event?.type === "red" && actions.length && !actions.at(-1).event) {
    actions[actions.length - 1].event = descriptor.event;
    actions[actions.length - 1].outcome = "foul";
  }
  const startShape = highlightPlayerShape(presentation, side, first?.from || ball, first?.actor?.id, descriptor.timelineIndex * 20 - 1);
  if (first?.actor?.id && startShape[first.actor.id]) startShape[first.actor.id] = { ...(first.from || ball) };
  return { actions, startShape, startBall: first?.from || ball };
}

function matchEventPhase(minute) {
  if (minute > 105) return "extra-time-second-half";
  if (minute > 90) return "extra-time";
  if (minute > 45) return "second-half";
  return "first-half";
}

function highlightActionImportance(action) {
  if (action.event?.type === "goal") return "goal";
  if (action.event?.type === "red" || action.outcome === "penalty" || action.penalty) return "major";
  if (action.type === "shot" || action.outcome === "saved" || action.outcome === "rebound") return "notable";
  if (["through-ball", "cross", "foul"].includes(action.type)) return "notable";
  if (["progressive-pass", "dribble", "tackle", "interception", "clearance"].includes(action.type)) return "normal";
  return "silent";
}

function createMatchHighlightPresentation(options) {
  const seed = (options.seed ?? possessionHash(`${options.home.id}:${options.away.id}`)) >>> 0;
  const random = createHighlightRandom(seed);
  const homeTactic = options.homeTactic || "balanced";
  const awayTactic = options.awayTactic || "balanced";
  const home = createPossessionSide(options.home, options.homeProfiles, "home", homeTactic);
  const away = createPossessionSide(options.away, options.awayProfiles, "away", awayTactic);
  const presentation = {
    version: 2,
    seed,
    home,
    away,
    stats: createAuthoritativeMatchStats(options, random),
    highlights: [],
  };
  const result = options.result;
  const descriptors = [];
  const addDescriptor = (descriptor) => descriptors.push({
    xg: descriptor.xg ?? highlightRound(0.08 + random() * 0.28, 3),
    importance: descriptor.importance || "extended",
    ...descriptor,
  });
  const goalEvents = [
    ...(result.homeEvents || []).map((event) => ({ ...event, side: "home", teamId: options.home.id })),
    ...(result.awayEvents || []).map((event) => ({ ...event, side: "away", teamId: options.away.id })),
  ];
  goalEvents.forEach((event) => {
    const sequenceType = event.goalType === "setPiece" ? "set-piece"
      : event.goalType === "penalty" ? "set-piece"
        : MATCH_HIGHLIGHT_TYPES[Math.floor(random() * 7)];
    addDescriptor({
      minute: event.minute,
      side: event.side,
      sequenceType,
      outcome: event.goalType === "penalty" ? "penalty" : "goal",
      importance: "key",
      event: {
        ...event,
        type: "goal",
        player: event.scorer,
        scorer: event.scorer,
        authoritative: true,
      },
      xg: event.goalType === "penalty" ? 0.79 : event.goalType === "setPiece" ? 0.16 : highlightRound(0.12 + random() * 0.35, 3),
    });
  });
  (result.redCards || []).forEach((event) => addDescriptor({
    minute: event.minute,
    side: event.side === "home" ? "away" : "home",
    sequenceType: "defensive-interception",
    outcome: "foul",
    importance: "key",
    event: { ...event, authoritative: true },
    xg: 0,
  }));
  (result.injuries || []).forEach((event) => addDescriptor({
    minute: event.minute,
    side: event.side === "home" ? "away" : "home",
    sequenceType: "defensive-interception",
    outcome: "foul",
    importance: "key",
    event: { ...event, authoritative: true },
    xg: 0,
  }));

  const maxMinute = presentation.stats.maxMinute;
  const usedMinutes = new Set(descriptors.map((descriptor) => descriptor.minute));
  const totalShots = presentation.stats.shots.home + presentation.stats.shots.away;
  const extendedTarget = simulationClamp(Math.round(totalShots * 0.72) + 3, 9, 20);
  const keyTarget = simulationClamp(Math.round(totalShots * 0.34) + 2, 5, 11);
  const remainingShots = {
    home: Math.max(0, presentation.stats.shots.home - (result.homeGoals || 0)),
    away: Math.max(0, presentation.stats.shots.away - (result.awayGoals || 0)),
  };
  const remainingOnTarget = {
    home: Math.max(0, presentation.stats.shotsOnTarget.home - (result.homeGoals || 0)),
    away: Math.max(0, presentation.stats.shotsOnTarget.away - (result.awayGoals || 0)),
  };
  const sequenceCycle = [
    "patient-build-up", "midfield-combination", "wing-overlap", "through-ball",
    "individual-dribble", "long-range-shot", "counterattack", "goalkeeper-save-rebound",
    "defensive-interception", "set-piece",
  ];
  while (descriptors.length < extendedTarget) {
    const homeWeight = remainingShots.home + 0.5;
    const awayWeight = remainingShots.away + 0.5;
    const side = random() * (homeWeight + awayWeight) < homeWeight ? "home" : "away";
    let minute = 3 + Math.floor(random() * Math.max(1, maxMinute - 5));
    while (usedMinutes.has(minute)) minute = minute >= maxMinute - 2 ? 3 : minute + 1;
    usedMinutes.add(minute);
    const hasShot = remainingShots[side] > 0;
    const onTarget = hasShot && remainingOnTarget[side] > 0;
    const sequenceType = descriptors.length === 0
      ? "patient-build-up"
      : sequenceCycle[(descriptors.length + Math.floor(random() * 3)) % sequenceCycle.length];
    const outcome = !hasShot || sequenceType === "defensive-interception" ? "turnover"
      : onTarget ? "saved"
        : random() < 0.28 ? "blocked" : random() < 0.18 ? "corner" : "missed";
    if (hasShot) remainingShots[side] -= 1;
    if (onTarget) remainingOnTarget[side] -= 1;
    addDescriptor({
      minute,
      side,
      sequenceType,
      outcome,
      importance: outcome === "saved" && descriptors.length < keyTarget ? "key" : "extended",
    });
  }
  descriptors.sort((left, right) => left.minute - right.minute || left.side.localeCompare(right.side));
  const runningScore = { home: 0, away: 0 };
  const teamHadLed = { home: false, away: false };
  descriptors.forEach((descriptor, descriptorIndex) => {
    const scoreBefore = { ...runningScore };
    if (descriptor.event?.type === "goal") runningScore[descriptor.side] += 1;
    const scoreAfter = { ...runningScore };
    const eventSide = descriptor.event?.side || descriptor.side;
    const eventTeam = eventSide === "home" ? home : away;
    const rawScorer = descriptor.event?.scorer || descriptor.event?.player || "";
    const normalizedScorer = rawScorer.replace(/\s*\(OG\)\s*$/i, "");
    const scorerProfile = eventTeam.players.find((player) => player.name === normalizedScorer);

    descriptor.scoreBefore = Object.freeze(scoreBefore);
    descriptor.scoreAfter = Object.freeze(scoreAfter);
    descriptor.sequence = descriptorIndex * 100;
    if (descriptor.event) {
      descriptor.event = MatchPresentation.createEvent({
        ...descriptor.event,
        id: `${seed}:${descriptorIndex}:${descriptor.event.type}:${descriptor.minute}:${eventSide}`,
        sequence: descriptor.sequence + 99,
        minute: descriptor.minute,
        addedTime: descriptor.event.addedTime || 0,
        type: descriptor.event.type,
        importance: descriptor.event.type === "goal" ? "goal" : "major",
        side: eventSide,
        teamId: descriptor.event.teamId || eventTeam.id,
        playerIds: [descriptor.event.playerId || scorerProfile?.id].filter(Boolean),
        scoreBefore,
        scoreAfter,
        phase: matchEventPhase(descriptor.minute),
        metadata: {
          scorer: descriptor.event.scorer || descriptor.event.player || null,
          assist: descriptor.event.assist || null,
          goalType: descriptor.event.goalType || null,
          ownGoal: Boolean(descriptor.event.ownGoal || descriptor.event.goalType === "ownGoal"),
          ownGoalBy: descriptor.event.ownGoalBy || null,
          teamHadLed: teamHadLed[eventSide],
          authoritative: Boolean(descriptor.event.authoritative),
        },
      });
    }
    if (runningScore.home > runningScore.away) teamHadLed.home = true;
    if (runningScore.away > runningScore.home) teamHadLed.away = true;
  });
  let currentKeyCount = descriptors.filter((descriptor) => descriptor.importance === "key").length;
  descriptors.forEach((descriptor) => {
    if (currentKeyCount < keyTarget && descriptor.importance !== "key" && descriptor.outcome !== "turnover") {
      descriptor.importance = "key";
      currentKeyCount += 1;
    }
  });
  presentation.highlights = descriptors.map((descriptor, timelineIndex) => {
    const sequence = createHighlightSequence(presentation, { ...descriptor, timelineIndex }, random);
    const previousMinute = timelineIndex > 0 ? descriptors[timelineIndex - 1].minute : 0;
    sequence.actions = sequence.actions.map((action, actionIndex) => {
      if (action.event) return { ...action, presentationEvent: action.event };
      const progress = (actionIndex + 1) / Math.max(1, sequence.actions.length);
      const minute = previousMinute + (descriptor.minute - previousMinute) * progress;
      return {
        ...action,
        presentationEvent: MatchPresentation.createEvent({
          id: `${seed}:${timelineIndex}:action:${actionIndex}`,
          sequence: descriptor.sequence + actionIndex + 1,
          minute,
          addedTime: 0,
          type: action.type,
          importance: highlightActionImportance(action),
          side: action.side,
          teamId: action.side === "home" ? home.id : away.id,
          playerIds: [action.actor?.id, action.target?.id].filter(Boolean),
          scoreBefore: descriptor.scoreBefore,
          scoreAfter: descriptor.scoreBefore,
          phase: matchEventPhase(minute),
          metadata: {
            actor: action.actor?.name || null,
            target: action.target?.name || null,
            outcome: action.outcome || null,
            xg: action.xg || 0,
            commentary: action.commentary || null,
          },
        }),
      };
    });
    const team = descriptor.side === "home" ? home : away;
    const heading = descriptor.event?.type === "goal" ? `${team.name} find the breakthrough`
      : descriptor.event?.type === "red" ? "A reckless challenge changes the match"
        : descriptor.sequenceType === "patient-build-up" ? `${team.name} patiently work an opening`
          : descriptor.sequenceType === "midfield-combination" ? `${team.name} slice through midfield`
            : descriptor.sequenceType === "wing-overlap" ? `${team.name} overload the flank`
              : descriptor.sequenceType === "counterattack" ? `${team.name} spring forward on the break`
                : descriptor.sequenceType === "through-ball" ? `${team.name} unlock the space in behind`
                  : descriptor.sequenceType === "individual-dribble" ? `${team.name} take on the defensive line`
                    : descriptor.sequenceType === "long-range-shot" ? `${team.name} find space on the edge of the box`
                      : descriptor.sequenceType === "set-piece" ? `${team.name} have a dangerous set piece`
                        : descriptor.sequenceType === "goalkeeper-save-rebound" ? `${team.name} keep the pressure on`
                          : `${team.name} probe for an opening`;
    return {
      ...descriptor,
      timelineIndex,
      heading,
      ...sequence,
    };
  });
  return presentation;
}
