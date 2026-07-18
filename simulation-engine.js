// Pure, deterministic simulation primitives shared by live and fast match paths.
const SIMULATION_CONFIG = Object.freeze({
  roundStrengthMultipliers: [0.90, 0.95, 1.00, 1.18, 1.45, 1.52, 1.60, 1.66],
  roundUnderdogXGMultipliers: [1.00, 1.00, 0.97, 0.84, 0.60, 0.50, 0.50, 0.48],
  modes: {
    realistic: {
      ratingScale: 27,
      redCardChance: 0.015,
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
      redCardChance: 0.024,
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
      redCardChance: 0.14,
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
    wild: { baseXG: 1.55, minimumXG: 0.16, maximumXG: 4.8 },
  },
  goalTypes: {
    openPlay: 0.80,
    penalty: 0.08,
    setPiece: 0.08,
    ownGoal: 0.04,
  },
});

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
  ["Lionel Messi", { position: "SS", overall: 75, finishing: 87, attackingRole: "support", expectedMinutesShare: 0.25, penaltyTaker: true }],
  ["Lamine Yamal", { position: "RW", overall: 96, finishing: 93, attackingRole: "primary", expectedMinutesShare: 0.94, penaltyTaker: false }],
  ["Vinícius Júnior", { position: "LW", overall: 94, finishing: 91, attackingRole: "primary", expectedMinutesShare: 0.92, penaltyTaker: true }],
  ["Cristiano Ronaldo", { position: "ST", overall: 74, finishing: 85, attackingRole: "support", expectedMinutesShare: 0.28, penaltyTaker: true }],
  ["Bukayo Saka", { position: "RW", overall: 93, finishing: 91, attackingRole: "secondary", expectedMinutesShare: 0.92, penaltyTaker: false, scoringEmphasis: 1.08 }],
  ["Jude Bellingham", { position: "CAM", overall: 95, finishing: 93, attackingRole: "primary", expectedMinutesShare: 0.95, penaltyTaker: false, scoringEmphasis: 1.25 }],
  ["Max Dowman", { position: "CAM", overall: 92, finishing: 91, attackingRole: "secondary", expectedMinutesShare: 0.80, penaltyTaker: false, scoringEmphasis: 1.40 }],
  ["Phil Foden", { position: "RW", overall: 91, finishing: 88, attackingRole: "secondary", expectedMinutesShare: 0.86, penaltyTaker: false, scoringEmphasis: 0.88 }],
  ["Cole Palmer", { position: "LW", overall: 92, finishing: 89, attackingRole: "support", expectedMinutesShare: 0.80, penaltyTaker: false, scoringEmphasis: 0.85 }],
  ["Mohamed Salah", { position: "RW", overall: 84, finishing: 89, attackingRole: "secondary", expectedMinutesShare: 0.60, penaltyTaker: true }],
  ["Julián Alvarez", { position: "ST", overall: 92, finishing: 93, attackingRole: "primary", expectedMinutesShare: 0.91, penaltyTaker: false }],
  ["Lautaro Martínez", { position: "ST", overall: 89, finishing: 92, attackingRole: "secondary", expectedMinutesShare: 0.83, penaltyTaker: false }],
  ["Mitchell Duke", { position: "ST", overall: 69, finishing: 72, attackingRole: "support", expectedMinutesShare: 0.38, penaltyTaker: false }],
  ["Mehdi Ghayedi", { position: "LW", overall: 78, finishing: 77, attackingRole: "secondary", expectedMinutesShare: 0.76, penaltyTaker: true }],
  ["Ali Alipour", { position: "ST", overall: 74, finishing: 77, attackingRole: "secondary", expectedMinutesShare: 0.68, penaltyTaker: false }],
  ["Amirhossein Hosseinzadeh", { position: "RW", overall: 76, finishing: 74, attackingRole: "support", expectedMinutesShare: 0.70, penaltyTaker: false }],
  ["Darwin Núñez", { position: "ST", overall: 86, finishing: 82, attackingRole: "primary" }],
  ["Son Heung-min", { position: "LW", overall: 88, finishing: 91, attackingRole: "primary" }],
  ["Christian Pulisic", { position: "LW", overall: 88, finishing: 87, attackingRole: "primary" }],
  ["Brahim Díaz", { position: "CAM", overall: 88, finishing: 86, attackingRole: "primary" }],
  ["Takefusa Kubo", { position: "RW", overall: 87, finishing: 84, attackingRole: "primary" }],
  ["Joško Gvardiol", { position: "CB", finishing: 62, attackingRole: "defensive" }],
  ["Luka Vušković", { position: "CB", finishing: 54, attackingRole: "defensive" }],
  ["Micky van de Ven", { position: "CB", finishing: 55, attackingRole: "defensive" }],
  ["Sofyan Amrabat", { position: "CDM", finishing: 57, attackingRole: "defensive" }],
  ["Saeid Ezatolahi", { position: "CDM", finishing: 58, attackingRole: "defensive" }],
  ["Kobbie Mainoo", { position: "CM", finishing: 69, attackingRole: "support" }],
  ["Amenyah", { position: "ST", attackingRole: "primary", penaltyTaker: true }],
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

  return names.map((name, index) => {
    const profileOverride = PLAYER_PROFILE_OVERRIDES.get(name) || {};
    const position = profileOverride.position || positions[index % positions.length];
    const baseOffset = generated
      ? index === 0 ? 5 : index <= 2 ? 3 : index <= 5 ? 0 : index <= 9 ? -3 : -6
      : index === 0 ? 1 : index <= 2 ? 0 : index <= 5 ? -2 : index <= 9 ? -4 : -6;
    const stableOverallVariation = (stableHash(`${team.id}:${name}:overall`) % 7) - 3;
    const overallMaximum = profileOverride.overall !== undefined
      ? 99
      : generated ? generatedMaximum : Math.min(93, team.rating + 4);
    const overallBase = generated ? teamOverall : team.rating;
    const overall = simulationClamp(
      profileOverride.overall ?? overallBase + baseOffset + stableOverallVariation,
      20,
      overallMaximum,
    );
    const attackingRole = profileOverride.attackingRole || roleForProfile(position, index);
    const finishingVariation = (stableHash(`${team.id}:${name}:finishing`) % 9) - 4;
    const finishingMaximum = profileOverride.finishing !== undefined
      ? 99
      : generated ? Math.min(94, generatedMaximum + 8) : Math.min(94, team.rating + 9);
    const finishing = simulationClamp(
      profileOverride.finishing
        ?? (position === "GK" ? 5 : overall + defaultFinishingOffset(position) + finishingVariation),
      5,
      finishingMaximum,
    );
    const penaltyTaker = profileOverride.penaltyTaker
      ?? (penaltyOverride ? name === penaltyOverride : index === 0);
    const expectedMinutesShare = profileOverride.expectedMinutesShare
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
