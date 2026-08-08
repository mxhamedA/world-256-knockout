function customMatchScript(match, roundIndex) {
  if (!state.customTournament?.scripts) return null;
  const matchIndex = Number(String(match.id).match(/-m(\d+)$/)?.[1] ?? state.rounds[roundIndex]?.indexOf(match));
  return state.customTournament.scripts[`${roundIndex}:${matchIndex}`] || null;
}

function customPenaltyResult(home, away, random, preferredWinnerSide = null) {
  let result = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    result = simulatePenaltyShootout(home, away, random, [], { home: [], away: [] }, state.settings.upset);
    const winnerSide = result.penalties.home > result.penalties.away ? "home" : "away";
    if (!preferredWinnerSide || preferredWinnerSide === winnerSide) break;
  }
  return result;
}

function customGoalEvents(team, side, total, scriptedGoals, random) {
  const profiles = playerProfilesForTeam(team).filter((player) => player.position !== "GK");
  const events = (scriptedGoals || [])
    .filter((goal) => goal.side === side)
    .slice(0, total)
    .map((goal, index) => {
      const requestedScorer = repairPlayerText(goal.scorer || "").toLocaleLowerCase();
      const matchedProfile = profiles.find((profile) => repairPlayerText(profile.name).toLocaleLowerCase() === requestedScorer);
      return {
        minute: simulationClamp(Number(goal.minute) || index + 1, 1, 120),
        scorer: matchedProfile?.name || profiles[index % Math.max(1, profiles.length)]?.name || `${team.name} Player`,
        assist: null,
        goalType: "openPlay",
        type: "goal",
      };
    });
  while (events.length < total) {
    const profile = profiles[Math.floor(random() * Math.max(1, profiles.length))];
    events.push({
      minute: 2 + Math.floor(random() * 88),
      scorer: profile?.name || `${team.name} Player`,
      assist: null,
      goalType: "openPlay",
      type: "goal",
    });
  }
  events.sort((left, right) => left.minute - right.minute);
  const used = new Set();
  events.forEach((event) => {
    while (used.has(event.minute) && event.minute < 120) event.minute += 1;
    used.add(event.minute);
  });
  return events;
}

function simulateCustomMatchOverride(match, roundIndex, home, away) {
  if (!state.customTournament) return null;
  const script = customMatchScript(match, roundIndex);
  const fixedScript = script && script.mode !== "rules";
  if (!fixedScript && state.customTournament.format !== "penalties") return null;
  const random = mulberry32(state.drawSeed + stableHash(`${match.id}-custom`) + roundIndex * 1009);
  const penaltiesOnly = !fixedScript && state.customTournament.format === "penalties";
  const homeGoals = penaltiesOnly ? 0 : simulationClamp(Number(script?.homeGoals) || 0, 0, 20);
  const awayGoals = penaltiesOnly ? 0 : simulationClamp(Number(script?.awayGoals) || 0, 0, 20);
  let penaltyResult = null;
  if (homeGoals === awayGoals && !match.allowDraw) {
    penaltyResult = customPenaltyResult(home, away, random, penaltiesOnly ? null : script?.winnerSide);
  }
  const homeEvents = penaltiesOnly ? [] : customGoalEvents(home, "home", homeGoals, script?.goals, random);
  const awayEvents = penaltiesOnly ? [] : customGoalEvents(away, "away", awayGoals, script?.goals, random);
  const winnerId = penaltyResult
    ? penaltyResult.penalties.home > penaltyResult.penalties.away ? home.id : away.id
    : homeGoals === awayGoals ? null : homeGoals > awayGoals ? home.id : away.id;
  const hasExtraTimeGoal = [...homeEvents, ...awayEvents].some((event) => event.minute > 90);
  return {
    homeGoals,
    awayGoals,
    regulationHome: hasExtraTimeGoal ? homeEvents.filter((event) => event.minute <= 90).length : homeGoals,
    regulationAway: hasExtraTimeGoal ? awayEvents.filter((event) => event.minute <= 90).length : awayGoals,
    extraTime: hasExtraTimeGoal,
    penalties: penaltyResult?.penalties || null,
    shootout: penaltyResult?.sequence || null,
    winnerId,
    homeEvents,
    awayEvents,
    redCards: [],
    suspendedPlayers: { home: [], away: [] },
    shock: false,
    tacticalMatchup: null,
    expectedGoals: { home: homeGoals, away: awayGoals, homeFatigue: 1, awayFatigue: 1 },
    penaltiesOnly,
    scripted: Boolean(fixedScript),
    revealed: false,
  };
}

function liveSubstitutionExpectedGoalFactors(team) {
  const management = retroLiveTeamManagement(team?.id);
  const squad = retroManagerSquadForTeam(team);
  if (!management?.history?.length || !squad?.players?.length) {
    return { for: 1, against: 1 };
  }
  let forFactor = 1;
  let againstFactor = 1;
  const managedExecution = team.name === retroTournament?.managedTeam ? 1.35 : 0.8;
  management.history.forEach((change) => {
    const outgoing = squad.players.find((player) => player.number === change.outgoingNumber);
    const incoming = squad.players.find((player) => player.number === change.incomingNumber);
    if (!outgoing || !incoming) return;
    const qualityDifference = simulationClamp(incoming.overall - outgoing.overall, -15, 15);
    const positionFit = retroPlayerPositionFit(incoming, outgoing.position);
    const fitExecution = simulationClamp((positionFit - 65) / 75, 0, 1);
    const freshness = (0.018 + simulationClamp((Number(change.minute) - 45) / 60, 0, 1) * 0.032)
      * (0.45 + fitExecution * 0.55)
      * managedExecution;
    const incomingGroup = retroBroadPosition(incoming.position);
    if (positionFit < 76) {
      forFactor -= (0.025 + Math.max(0, -qualityDifference) * 0.003) * managedExecution;
      againstFactor += (0.02 + Math.max(0, -qualityDifference) * 0.0025) * managedExecution;
      return;
    }
    if (incomingGroup === "FW") {
      forFactor += qualityDifference * 0.0075 * managedExecution + freshness * 1.15;
      againstFactor -= freshness * 0.16;
    } else if (incomingGroup === "MF") {
      forFactor += qualityDifference * 0.0045 * managedExecution + freshness * 0.72;
      againstFactor -= qualityDifference * 0.0032 * managedExecution + freshness * 0.58;
    } else if (incomingGroup === "DF") {
      forFactor += freshness * 0.18;
      againstFactor -= qualityDifference * 0.0062 * managedExecution + freshness;
    } else if (incomingGroup === "GK") {
      againstFactor -= qualityDifference * 0.0075 * managedExecution + freshness * 0.52;
    }
  });
  return {
    for: simulationClamp(forFactor, 0.78, 1.25),
    against: simulationClamp(againstFactor, 0.76, 1.24),
  };
}

function premierLeagueAppearanceRoster(team, side, match, roundIndex, result) {
  const profiles = playerProfilesForTeam(team);
  const unavailable = new Set(result.suspendedPlayers?.[side] || []);
  const ownEvents = result[`${side}Events`] || [];
  const opponentEvents = result[side === "home" ? "awayEvents" : "homeEvents"] || [];
  const forcedNames = new Set();
  ownEvents.forEach((event) => {
    if (!event.ownGoal && event.scorer) forcedNames.add(event.scorer);
    const assist = event.assist || event.metadata?.assist;
    if (assist) forcedNames.add(assist);
  });
  opponentEvents.forEach((event) => {
    if (event.ownGoalBy) forcedNames.add(event.ownGoalBy);
  });
  (result.redCards || []).forEach((event) => {
    if (event.side === side || event.teamId === team.id) forcedNames.add(event.player);
  });
  (result.injuries || []).forEach((event) => {
    if (event.side === side || event.teamId === team.id) forcedNames.add(event.player);
  });

  const available = profiles.filter((profile) => (
    !unavailable.has(profile.name) || forcedNames.has(profile.name)
  ));
  const targetCount = Math.min(
    available.length,
    14 + (stableHash(`${match.id}:${side}:appearance-count`) % 3),
  );
  const random = mulberry32(
    state.drawSeed
    + stableHash(`${match.id}:${side}:appearances`)
    + roundIndex * 1543,
  );
  const selected = new Set(
    [...forcedNames].filter((name) => available.some((profile) => profile.name === name)),
  );

  const goalkeepers = available.filter((profile) => profile.position === "GK");
  if (goalkeepers.length && !goalkeepers.some((profile) => selected.has(profile.name))) {
    const goalkeeper = goalkeepers
      .map((profile) => ({
        profile,
        score: (profile.startingXI ? 6 : 1)
          + profile.overall / 18
          + random() * 2.2,
      }))
      .sort((left, right) => right.score - left.score)[0]?.profile;
    if (goalkeeper) selected.add(goalkeeper.name);
  }

  const candidates = available
    .filter((profile) => !selected.has(profile.name))
    .map((profile) => {
      const restChance = profile.position === "GK"
        ? 0.025
        : profile.startingXI ? Math.max(0.055, 0.105 - (profile.overall - 70) * 0.002) : 0;
      const rested = restChance > 0 && random() < restChance;
      const weight = (
        (profile.startingXI ? 5.3 : 0.9)
        + simulationClamp(profile.expectedMinutesShare, 0.02, 1) * 1.8
        + simulationClamp((profile.overall - 62) / 24, 0.1, 1.25)
      ) * (rested ? 0.16 : 1);
      return {
        profile,
        lottery: -Math.log(Math.max(0.000001, random())) / Math.max(0.05, weight),
      };
    })
    .sort((left, right) => left.lottery - right.lottery);
  candidates.slice(0, Math.max(0, targetCount - selected.size)).forEach(({ profile }) => {
    selected.add(profile.name);
  });
  return [...selected];
}

function ensurePremierLeaguePlayerAppearances(match, roundIndex, result = match?.result) {
  if (!state?.premierLeagueSeason || !match || !result) return null;
  if (
    Array.isArray(result.playerAppearances?.home)
    && Array.isArray(result.playerAppearances?.away)
  ) return result.playerAppearances;
  result.playerAppearances = {
    home: premierLeagueAppearanceRoster(teamById(match.homeId), "home", match, roundIndex, result),
    away: premierLeagueAppearanceRoster(teamById(match.awayId), "away", match, roundIndex, result),
  };
  return result.playerAppearances;
}

function simulateMatch(match, roundIndex) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  applyPremierLeagueFormationToManagedTeam(match);
  const customRules = customMatchScript(match, roundIndex);
  const customResult = simulateCustomMatchOverride(match, roundIndex, home, away);
  if (customResult) return customResult;
  const randomSeed = state.drawSeed + stableHash(match.id) + roundIndex * 1009;
  const random = mulberry32(randomSeed);
  const suspendedPlayers = {
    home: unavailablePlayersForTeam(home.id, roundIndex),
    away: unavailablePlayersForTeam(away.id, roundIndex),
  };
  const modeName = state.settings.upset;
  const mode = SIMULATION_CONFIG.modes[modeName] || SIMULATION_CONFIG.modes.balanced;
  const goalConfig = SIMULATION_CONFIG.goals[state.settings.goals] || SIMULATION_CONFIG.goals.normal;
  const matchesPlayed = {
    home: matchesPlayedForTeam(home.id, roundIndex),
    away: matchesPlayedForTeam(away.id, roundIndex),
  };
  const expected = calculateExpectedGoals(
    home,
    away,
    roundIndex,
    modeName,
    state.settings.goals,
    matchesPlayed.home,
    matchesPlayed.away,
    momentumForTeam(home.id, away, roundIndex),
    momentumForTeam(away.id, home, roundIndex),
  );
  let redCards = [];
  let shock = false;

  if (random() < redCardChanceForTeam(home, modeName)) {
    redCards.push(createRedCard(home, "home", random, suspendedPlayers.home));
  }
  if (random() < redCardChanceForTeam(away, modeName)) {
    redCards.push(createRedCard(away, "away", random, suspendedPlayers.away));
  }
  const injuryRandom = mulberry32(randomSeed + stableHash(`${match.id}-injuries`));
  let injuries = [];
  if (state.settings.removeInjuries !== true && injuryRandom() < 0.075) {
    const injury = createInjury(home, "home", injuryRandom, suspendedPlayers.home);
    if (injury) injuries.push(injury);
  }
  if (state.settings.removeInjuries !== true && injuryRandom() < 0.075) {
    const injury = createInjury(away, "away", injuryRandom, suspendedPlayers.away);
    if (injury) injuries.push(injury);
  }
  ({ redCards, injuries } = removeImpossiblePlayerAbsenceEvents(redCards, injuries));

  let adjustedXG = { homeXG: expected.homeXG, awayXG: expected.awayXG };
  if (expected.ratingGap >= 18 && random() < mode.shockChance) {
    shock = true;
    if (teamSimulationRatings(home).overall > teamSimulationRatings(away).overall) {
      adjustedXG.homeXG *= mode.shockFavouriteReduction;
      adjustedXG.awayXG *= mode.shockUnderdogBoost;
    } else {
      adjustedXG.awayXG *= mode.shockFavouriteReduction;
      adjustedXG.homeXG *= mode.shockUnderdogBoost;
    }
  }

  redCards.forEach((card) => {
    adjustedXG = applyRedCardImpact(adjustedXG.homeXG, adjustedXG.awayXG, card);
  });
  injuries.forEach((injury) => {
    const remainingShare = simulationClamp((90 - injury.minute) / 90, 0, 1);
    if (injury.side === "home") adjustedXG.homeXG *= 1 - remainingShare * 0.045;
    else adjustedXG.awayXG *= 1 - remainingShare * 0.045;
  });
  const controlledSide = state.spectateTeamId === match.homeId
    ? "home"
    : state.spectateTeamId === match.awayId ? "away" : null;
  let tacticalMatchup = null;
  if (controlledSide) {
    const tacticalResult = applyControlledTacticalMatchup(adjustedXG, match, controlledSide);
    adjustedXG = tacticalResult.adjustedXG;
    tacticalMatchup = {
      selected: tacticalResult.tacticKey,
      opponent: tacticalResult.opponentTacticKey,
      edge: tacticalResult.edge,
      management: tacticalResult.teamSheetImpact,
    };
  }
  const homeSubstitutionImpact = liveSubstitutionExpectedGoalFactors(home);
  const awaySubstitutionImpact = liveSubstitutionExpectedGoalFactors(away);
  adjustedXG.homeXG *= homeSubstitutionImpact.for * awaySubstitutionImpact.against;
  adjustedXG.awayXG *= awaySubstitutionImpact.for * homeSubstitutionImpact.against;
  adjustedXG.homeXG = simulationClamp(adjustedXG.homeXG, mode.minimumXG, goalConfig.maximumXG);
  adjustedXG.awayXG = simulationClamp(adjustedXG.awayXG, mode.minimumXG, goalConfig.maximumXG);

  const homeGoalRandom = matchGoalRandom(randomSeed, match.id, "home");
  const awayGoalRandom = matchGoalRandom(randomSeed, match.id, "away");
  let homeGoals = poisson(adjustedXG.homeXG, homeGoalRandom);
  let awayGoals = poisson(adjustedXG.awayXG, awayGoalRandom);
  ({ homeGoals, awayGoals } = applyScorelineCeiling(home, away, homeGoals, awayGoals));
  const minimumGoals = customRules?.mode === "rules"
    ? simulationClamp(Number(customRules.minGoals) || 0, 0, 20)
    : 0;
  while (homeGoals + awayGoals < minimumGoals) {
    if (random() < 0.5) homeGoals += 1;
    else awayGoals += 1;
  }
  const forceShootout = customRules?.mode === "rules"
    && !match.allowDraw
    && random() < simulationClamp(Number(customRules.shootoutChance) || 0, 0, 100) / 100;
  if (forceShootout) {
    const tiedScore = Math.max(homeGoals, awayGoals, Math.ceil(minimumGoals / 2));
    homeGoals = tiedScore;
    awayGoals = tiedScore;
  }
  const regulationHome = homeGoals;
  const regulationAway = awayGoals;
  let extraTime = false;
  let penalties = null;
  let shootout = null;

  if (!forceShootout && retroMatchAllowsExtraTime(match) && decidingMatchIsLevel(match, homeGoals, awayGoals)) {
    extraTime = true;
    const homeDepth = teamSimulationRatings(home).squadDepth;
    const awayDepth = teamSimulationRatings(away).squadDepth;
    const homeExtraTimeFactor = simulationClamp(0.97 - Math.max(0, 76 - homeDepth) * 0.0015, 0.86, 0.98);
    const awayExtraTimeFactor = simulationClamp(0.97 - Math.max(0, 76 - awayDepth) * 0.0015, 0.86, 0.98);
    homeGoals += poisson(
      adjustedXG.homeXG * 0.32 * homeExtraTimeFactor,
      matchGoalRandom(randomSeed, match.id, "home", "extra-time"),
    );
    awayGoals += poisson(
      adjustedXG.awayXG * 0.32 * awayExtraTimeFactor,
      matchGoalRandom(randomSeed, match.id, "away", "extra-time"),
    );
  }

  if (decidingMatchIsLevel(match, homeGoals, awayGoals)) {
    const shootoutUnavailable = {
      home: [...new Set([
        ...(suspendedPlayers.home || []),
        ...injuries.filter((injury) => injury.side === "home").map((injury) => injury.player),
      ])],
      away: [...new Set([
        ...(suspendedPlayers.away || []),
        ...injuries.filter((injury) => injury.side === "away").map((injury) => injury.player),
      ])],
    };
    const penaltyResult = simulatePenaltyShootout(
      home,
      away,
      random,
      redCards,
      shootoutUnavailable,
      modeName,
    );
    penalties = penaltyResult.penalties;
    shootout = penaltyResult.sequence;
  }

  const winnerId = penalties
    ? penalties.home > penalties.away ? home.id : away.id
    : match.allowDraw
      ? homeGoals === awayGoals ? null : homeGoals > awayGoals ? home.id : away.id
      : decidingMatchWinnerId(match, homeGoals, awayGoals);

  const usedGoalMinutes = new Set();
  let homeEvents = goalEvents(
    home,
    away,
    regulationHome,
    homeGoals - regulationHome,
    random,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
    usedGoalMinutes,
  );
  let awayEvents = goalEvents(
    away,
    home,
    regulationAway,
    awayGoals - regulationAway,
    random,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
    usedGoalMinutes,
  );
  homeEvents = removeDismissedPlayersFromFutureGoals(homeEvents, "home", redCards, match, injuries);
  awayEvents = removeDismissedPlayersFromFutureGoals(awayEvents, "away", redCards, match, injuries);
  const result = {
    homeGoals,
    awayGoals,
    regulationHome,
    regulationAway,
    extraTime,
    penalties,
    shootout,
    winnerId,
    homeEvents,
    awayEvents,
    redCards: redCards.sort((a, b) => a.minute - b.minute),
    injuries: injuries.sort((a, b) => a.minute - b.minute),
    suspendedPlayers,
    shock,
    tacticalMatchup,
    expectedGoals: {
      home: Number(adjustedXG.homeXG.toFixed(3)),
      away: Number(adjustedXG.awayXG.toFixed(3)),
      homeFatigue: Number(expected.homeFatigue.toFixed(3)),
      awayFatigue: Number(expected.awayFatigue.toFixed(3)),
    },
    substitutionImpact: {
      home: homeSubstitutionImpact,
      away: awaySubstitutionImpact,
    },
    revealed: false,
  };
  ensurePremierLeaguePlayerAppearances(match, roundIndex, result);
  return result;
}

function createLiveMatchResult(match, roundIndex) {
  return {
    ...simulateMatch(match, roundIndex),
    engineVersion: 2,
    engineSeed: state.drawSeed + stableHash(`${match.id}-highlight-engine`),
    revealed: false,
  };
}

function simulateAndRevealMatch(match, roundIndex) {
  if (match.result) {
    match.result.revealed = true;
    return match.result;
  }
  const result = simulateMatch(match, roundIndex);
  match.result = { ...result, revealed: true };
  return match.result;
}

function revealOrphanedSimulatedResult(match) {
  if (!match?.result || match.result.revealed !== false || match.result.engineVersion === 2) return false;
  match.result.revealed = true;
  return true;
}

function settlePendingRetroFinalMatches(round, roundIndex) {
  if (!Array.isArray(round) || !isRetroSimulatorState() || roundIndex !== tournamentFinalRoundIndex()) return;
  const final = tournamentFinalMatch(round);
  if (!final?.result?.revealed) return;
  round.forEach((match) => {
    if (match === final || match.result?.revealed) return;
    simulateAndRevealMatch(match, roundIndex);
  });
}

function buildNextRound(roundIndex) {
  if (state?.uclSeason) {
    window.UclSeason?.syncEngineProgress?.(roundIndex);
    return;
  }
  if (state?.premierLeagueSeason) {
    window.PremierLeagueSeason?.syncEngineProgress?.(roundIndex);
    return;
  }
  if (isRetroSimulatorState()) {
    const round = state.rounds[roundIndex];
    settlePendingRetroFinalMatches(round, roundIndex);
    if (!round?.every((match) => match.result?.revealed)) return;
    round.forEach((match) => {
      if (!match.result) return;
      match.result.winner = match.result.winnerId ? teamById(match.result.winnerId)?.name || null : null;
    });
    if (roundIndex === 2 || roundIndex >= 3) RETRO_WORLD_CUP_ENGINE.advanceTournament(retroTournament);
    state.rounds = retroSimulatorRounds();
    saveRetroTournamentState();
    return;
  }
  if (roundIndex >= tournamentFinalRoundIndex()) return;
  const round = state.rounds[roundIndex];
  if (!round.every((match) => match.result?.revealed)) return;
  const appendThirdPlacePlayoff = (targetRound) => {
    if (
      !tournamentHasThirdPlacePlayoff()
      || roundIndex + 1 !== tournamentFinalRoundIndex()
      || round.length !== 2
      || targetRound.some((match) => isThirdPlacePlayoff(match))
    ) return;
    const completedExistingFinal = targetRound.length > 0
      && targetRound.every((match) => match.result?.revealed);
    const semiFinalLosers = round.map((match) => (
      match.result.winnerId === match.homeId ? match.awayId : match.homeId
    ));
    targetRound.unshift({
      id: `r${roundIndex + 1}-third-place`,
      homeId: semiFinalLosers[0],
      awayId: semiFinalLosers[1],
      customThirdPlace: Boolean(state.customTournament),
      thirdPlacePlayoff: !state.customTournament,
      result: null,
    });
    if (completedExistingFinal) {
      state.activeRound = tournamentFinalRoundIndex();
      state.selectedMatch = 0;
      state.championView = false;
    }
  };
  if (state.rounds[roundIndex + 1]) {
    appendThirdPlacePlayoff(state.rounds[roundIndex + 1]);
    return;
  }
  if (state.customTournament?.structure === "groups" && roundIndex === 0) {
    state.rounds[1] = customGroupKnockoutRound();
    return;
  }
  const next = [];
  for (let index = 0; index < round.length; index += 2) {
    next.push({
      id: `r${roundIndex + 1}-m${index / 2}`,
      homeId: round[index].result.winnerId,
      awayId: round[index + 1].result.winnerId,
      result: null,
    });
  }
  appendThirdPlacePlayoff(next);
  state.rounds[roundIndex + 1] = next;
}

function ensureThirdPlacePlayoffForSavedTournament() {
  if (state?.savedTournamentView) return;
  if (!state.started || isRetroSimulatorState()) return;
  if (
    state.customTournament?.structure === "groups"
    && state.customTournament.thirdPlaceAllFormatsVersion !== 1
  ) {
    state.customTournament.thirdPlace = true;
    state.customTournament.thirdPlaceAllFormatsVersion = 1;
    saveState();
  }
  if (!tournamentHasThirdPlacePlayoff()) return;
  const semiFinalIndex = tournamentFinalRoundIndex() - 1;
  const semiFinals = state.rounds[semiFinalIndex];
  const finalRound = state.rounds[tournamentFinalRoundIndex()];
  const existingThirdPlaceIndex = finalRound?.findIndex((match) => isThirdPlacePlayoff(match)) ?? -1;
  if (existingThirdPlaceIndex >= 0) {
    const selected = state.activeRound === tournamentFinalRoundIndex()
      ? finalRound[state.selectedMatch]
      : null;
    let changed = false;
    if (existingThirdPlaceIndex !== 0) {
      const [thirdPlaceMatch] = finalRound.splice(existingThirdPlaceIndex, 1);
      finalRound.unshift(thirdPlaceMatch);
      changed = true;
    }
    if (!finalRound[0].result?.revealed && state.championView) {
      state.activeRound = tournamentFinalRoundIndex();
      state.selectedMatch = 0;
      state.championView = false;
      changed = true;
    } else if (selected) {
      state.selectedMatch = finalRound.indexOf(selected);
    }
    if (changed) saveState();
    return;
  }
  if (
    semiFinals?.length !== 2
    || !semiFinals.every((match) => match.result?.revealed)
    || !finalRound?.length
  ) return;
  const previousLength = finalRound.length;
  buildNextRound(semiFinalIndex);
  if (finalRound.length !== previousLength) saveState();
}

function firstUnplayedIndex(roundIndex = state.activeRound) {
  return (state.rounds[roundIndex] || []).findIndex((match) => !match.result);
}

function roundIsComplete(roundIndex) {
  const round = state.rounds[roundIndex];
  return Boolean(round?.length) && round.every((match) => match.result?.revealed);
}

function currentTournamentRoundIndex() {
  for (let index = state.rounds.length - 1; index >= 0; index -= 1) {
    if (state.rounds[index]?.some((match) => !match.result?.revealed)) return index;
  }
  return Math.max(0, state.rounds.length - 1);
}

function viewingRoundHistory() {
  return state.activeRound < currentTournamentRoundIndex() && roundIsComplete(state.activeRound);
}

function openRound(roundIndex, scrollToResults = false) {
  const round = state.rounds[roundIndex];
  if (!round) return;
  state.activeRound = roundIndex;
  state.selectedMatch = roundIsComplete(roundIndex)
    ? 0
    : Math.max(0, firstUnplayedIndex(roundIndex));
  state.championView = false;
  fixtureLimit = roundIsComplete(roundIndex) ? round.length : DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  saveState();
  render();
  if (scrollToResults) els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function advanceSpectatedRun() {
  const team = spectatedTeam();
  if (!team) return false;
  if (!teamIsAlive(team.id)) {
    return false;
  }

  const selected = selectedMatch();
  const selectedIsTeamMatch = selected
    && (selected.homeId === team.id || selected.awayId === team.id);
  const matchIndex = selectedIsTeamMatch
    ? state.selectedMatch
    : teamMatchIndex(state.activeRound, team.id);
  if (matchIndex < 0) return false;
  const match = selectedRound()[matchIndex];
  state.selectedMatch = matchIndex;
  state.championView = false;
  if (!match.result?.revealed) {
    saveState();
    render();
    return true;
  }

  if (isCustomGroupStageRound()) {
    const round = selectedRound();
    const completedMatchday = customGroupMatchday(match);
    round.forEach((otherMatch) => {
      if (customGroupMatchday(otherMatch) !== completedMatchday) return;
      simulateAndRevealMatch(otherMatch, state.activeRound);
    });

    const nextMatchIndex = round.findIndex((otherMatch) => (
      !otherMatch.result?.revealed
      && (otherMatch.homeId === team.id || otherMatch.awayId === team.id)
    ));
    if (nextMatchIndex >= 0) {
      state.selectedMatch = nextMatchIndex;
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      showToast(`${team.name}'s group-stage match ${customGroupMatchday(round[nextMatchIndex]) + 1} is ready.`);
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }

    buildNextRound(0);
    if (state.rounds[1]) {
      state.activeRound = 1;
      const knockoutMatchIndex = teamMatchIndex(1, team.id);
      state.selectedMatch = Math.max(0, knockoutMatchIndex);
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      if (knockoutMatchIndex < 0) {
        state.neutralView = true;
        showToast(`${team.name} are out after the group stage. Continuing neutrally.`);
      } else {
        showToast(`${team.name}'s ${tournamentRoundName()} match is ready.`);
      }
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }
  }

  if (
    state.activeRound === tournamentFinalRoundIndex()
    && isThirdPlacePlayoff(match)
    && match.result?.revealed
  ) {
    const finalIndex = selectedRound().findIndex((candidate) => !isThirdPlacePlayoff(candidate));
    if (finalIndex >= 0) {
      state.selectedMatch = finalIndex;
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("The final is ready.");
      return true;
    }
  }

  selectedRound().forEach((otherMatch) => {
    simulateAndRevealMatch(otherMatch, state.activeRound);
  });
  buildNextRound(state.activeRound);

  if (state.activeRound < tournamentFinalRoundIndex()) {
    const completedRound = state.activeRound;
    state.activeRound += 1;
    const pendingThirdPlaceIndex = state.activeRound === tournamentFinalRoundIndex()
      ? selectedRound().findIndex((match) => isThirdPlacePlayoff(match) && !match.result?.revealed)
      : -1;
    const defaultManagedFinalIndex = state.activeRound === tournamentFinalRoundIndex()
      ? selectedRound().findIndex((match) => (
          !isThirdPlacePlayoff(match)
          && (match.homeId === team.id || match.awayId === team.id)
        ))
      : -1;
    const nextMatchIndex = defaultManagedFinalIndex >= 0
      ? defaultManagedFinalIndex
      : pendingThirdPlaceIndex >= 0
        ? pendingThirdPlaceIndex
        : teamMatchIndex(state.activeRound, team.id);
    if (isRetroSimulatorState() && completedRound === 2 && nextMatchIndex < 0) {
      const decisionRound = state.rounds[completedRound] || [];
      const decisionMatchIndex = decisionRound.findIndex((item) => item.id === selected?.id);
      retroTournament.pendingEliminationDecision = {
        teamName: team.name,
        matchId: selected?.id || decisionRound.findLast((item) => (
          item.homeId === team.id || item.awayId === team.id
        ))?.id || null,
        roundIndex: completedRound,
      };
      state.activeRound = completedRound;
      state.selectedMatch = decisionMatchIndex >= 0
        ? decisionMatchIndex
        : Math.max(0, decisionRound.findLastIndex((item) => (
            item.homeId === team.id || item.awayId === team.id
          )));
      state.neutralView = false;
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    }
    state.selectedMatch = Math.max(0, nextMatchIndex);
    state.championView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    const nextMatch = selectedRound()[state.selectedMatch];
    showToast(nextMatch && (nextMatch.homeId === team.id || nextMatch.awayId === team.id)
      ? `${team.name}'s ${tournamentRoundName()} match is ready.`
      : defaultManagedFinalIndex >= 0
        ? "The final is ready. The third-place play-off will simulate unless you open it."
        : `${team.name}'s ${tournamentRoundName()} match is ready.`);
  } else {
    state.championView = true;
  }
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  return true;
}

function goToNextTie() {
  if (state?.uclSeason) {
    if (window.UclSeason?.finishManagedKnockoutMatch?.(state.activeRound, state.selectedMatch)) return;
    if (window.UclSeason?.finishManagedMatchday?.(state.activeRound, state.selectedMatch)) return;
    if (window.UclSeason?.returnToManagedMatchday?.(state.activeRound, state.selectedMatch)) return;
    window.UclSeason?.returnToSimulator?.();
    return;
  }
  if (state?.premierLeagueSeason) {
    const completedMatch = selectedMatch();
    const completedManagedMatch = Boolean(
      completedMatch?.result?.revealed
      && state.spectateTeamId
      && (
        completedMatch.homeId === state.spectateTeamId
        || completedMatch.awayId === state.spectateTeamId
      )
    );
    if (
      completedManagedMatch
      && window.PremierLeagueSeason?.finishManagedMatchweek?.(
        state.activeRound,
        state.selectedMatch,
      )
    ) return;
    const currentRound = selectedRound();
    const nextMatchIndex = currentRound.findIndex((match) => !match.result?.revealed);
    if (nextMatchIndex >= 0) {
      state.selectedMatch = nextMatchIndex;
      state.championView = false;
      saveState();
      render();
      return;
    }
    const nextRoundIndex = state.rounds.findIndex((round, index) => (
      index > state.activeRound && round.some((match) => !match.result?.revealed)
    ));
    if (nextRoundIndex >= 0) {
      state.activeRound = nextRoundIndex;
      state.viewRound = nextRoundIndex;
      state.selectedMatch = Math.max(0, state.rounds[nextRoundIndex].findIndex((match) => !match.result?.revealed));
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      saveState();
      render();
      showToast(`${tournamentRoundName()} is ready.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    saveState();
    render();
    showToast("The Premier League season is complete.");
    return;
  }
  const currentMatch = selectedMatch();
  const selectedIsSpectatedMatch = state.spectateTeamId
    && currentMatch
    && (currentMatch.homeId === state.spectateTeamId || currentMatch.awayId === state.spectateTeamId);
  if (selectedIsSpectatedMatch && !state.neutralView && advanceSpectatedRun()) return;
  const round = selectedRound();
  const next = round.findIndex((match) => !match.result?.revealed);
  if (next >= 0) {
    state.selectedMatch = next;
    state.championView = false;
  } else if (state.activeRound < tournamentFinalRoundIndex()) {
    buildNextRound(state.activeRound);
    if (state.rounds[state.activeRound + 1]) {
      state.activeRound += 1;
      state.selectedMatch = 0;
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`${tournamentRoundName()} is ready.`);
    }
  } else {
    state.championView = true;
  }
  saveState();
  render();
}

function playbackEvents(match) {
  const result = match.result;
  const homeGoals = (result.homeEvents || []).map((event) => ({
    ...event,
    side: "home",
    teamId: match.homeId,
    player: event.scorer,
  }));
  const awayGoals = (result.awayEvents || []).map((event) => ({
    ...event,
    side: "away",
    teamId: match.awayId,
    player: event.scorer,
  }));
  const events = [
    ...homeGoals,
    ...awayGoals,
    ...(result.redCards || []),
    ...(result.injuries || []),
    ...(result.substitutions || []),
  ].sort((a, b) => a.minute - b.minute || (["red", "injury"].includes(a.type) ? -1 : 1));

  return events;
}

function clockText(minute) {
  const wholeMinute = Math.max(0, Math.floor(minute));
  const seconds = Math.floor((minute - wholeMinute) * 60);
  return `${String(wholeMinute).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function phaseForMinute(minute, result) {
  if (minute < 45) return "FIRST HALF";
  if (minute < 90) return "SECOND HALF";
  if (result.extraTime && minute < 105) return "EXTRA TIME - FIRST HALF";
  if (result.extraTime && minute < 120) return "EXTRA TIME - SECOND HALF";
  return result.penalties ? "PENALTY SHOOTOUT" : "FULL TIME";
}

function setMatch2dPosition(element, x, y, duration = 700) {
  if (!element) return;
  element.style.setProperty("--move-duration", `${Math.max(0, duration)}ms`);
  element.style.left = `${simulationClamp(x, 2.5, 97.5)}%`;
  element.style.top = `${simulationClamp(y, 5, 95)}%`;
}

function rebuildMatch2dPlayerNodes(presentation) {
  if (!els.match2dPlayers || !presentation) return [];
  const players = [];
  els.match2dPlayers.replaceChildren();
  [presentation.home, presentation.away].forEach((team) => {
    team.players.forEach((profile, index) => {
      const node = document.createElement("i");
      node.className = `match-2d-player is-${team.side}`;
      node.textContent = String(index + 1);
      node.setAttribute("aria-hidden", "true");
      node.title = `${profile.name} | ${profile.position} | ${profile.overall}`;
      setMatch2dPosition(node, profile.x, profile.y, 0);
      els.match2dPlayers.append(node);
      players.push({
        id: profile.id,
        node,
        x: profile.x,
        y: profile.y,
        targetX: profile.x,
        targetY: profile.y,
        vx: 0,
        vy: 0,
      });
    });
  });
  return players;
}

function createMatch2dState(match) {
  if (!els.match2dPlayers || !els.match2dBall) return null;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const controlledSide = state.spectateTeamId === match.homeId
    ? "home"
    : state.spectateTeamId === match.awayId ? "away" : null;
  const opponentKey = controlledSide ? opponentStandardTactic(match, controlledSide) : "balanced";
  const presentation = createMatchHighlightPresentation({
    seed: match.result.engineSeed || state.drawSeed + stableHash(`${match.id}-highlight-engine`),
    home,
    away,
    homeProfiles: playerProfilesForTeam(home),
    awayProfiles: playerProfilesForTeam(away),
    homeTactic: controlledSide === "home" ? state.standardTactic : controlledSide === "away" ? opponentKey : "balanced",
    awayTactic: controlledSide === "away" ? state.standardTactic : controlledSide === "home" ? opponentKey : "balanced",
    result: match.result,
  });
  match.result.matchStats = presentation.stats;
  const players = rebuildMatch2dPlayerNodes(presentation);
  setMatch2dPosition(els.match2dBall, 50, 50, 0);
  return {
    matchId: match.id,
    engine: presentation,
    presentation,
    players,
    cursor: -1,
    activeHighlight: null,
    actionIndex: 0,
    leadInRemaining: 0,
    fullTimeClockQueued: false,
    complete: false,
    playedEventKeys: new Set(),
    nextAction: performance.now() + 450,
    lockUntil: 0,
    lastVisualTimestamp: performance.now(),
    ballX: 50,
    ballY: 50,
    ballMotion: null,
  };
}

function mergeLiveTacticalResult(current, candidate, cutoffMinute, match) {
  const cutoff = simulationClamp(Number(cutoffMinute) || 0, 0, 120);
  const mergeEvents = (key) => [
    ...(current[key] || []).filter((event) => event.minute <= cutoff),
    ...(candidate[key] || []).filter((event) => event.minute > cutoff),
  ].sort((left, right) => left.minute - right.minute);
  let homeEvents = mergeEvents("homeEvents");
  let awayEvents = mergeEvents("awayEvents");
  let redCards = mergeEvents("redCards");
  let injuries = mergeEvents("injuries");
  ({ redCards, injuries } = removeImpossiblePlayerAbsenceEvents(redCards, injuries));
  homeEvents = removeDismissedPlayersFromFutureGoals(homeEvents, "home", redCards, match, injuries);
  awayEvents = removeDismissedPlayersFromFutureGoals(awayEvents, "away", redCards, match, injuries);
  const regulationHome = homeEvents.filter((event) => event.minute <= 90).length;
  const regulationAway = awayEvents.filter((event) => event.minute <= 90).length;
  const extraTime = retroMatchAllowsExtraTime(match) && decidingMatchIsLevel(match, regulationHome, regulationAway);

  if (!extraTime) {
    homeEvents = homeEvents.filter((event) => event.minute <= 90);
    awayEvents = awayEvents.filter((event) => event.minute <= 90);
    redCards = redCards.filter((event) => event.minute <= 90);
    injuries = injuries.filter((event) => event.minute <= 90);
  }

  const homeGoals = homeEvents.length;
  const awayGoals = awayEvents.length;
  let penalties = null;
  let shootout = null;
  let winnerId;
  if (decidingMatchIsLevel(match, homeGoals, awayGoals)) {
    const shootoutRandom = mulberry32(
      state.drawSeed + stableHash(`${match.id}-${state.standardTactic}-live-tactical-shootout`),
    );
    const suspendedPlayers = candidate.suspendedPlayers || current.suspendedPlayers || { home: [], away: [] };
    const shootoutUnavailable = {
      home: [...new Set([
        ...(suspendedPlayers.home || []),
        ...injuries.filter((injury) => injury.side === "home").map((injury) => injury.player),
      ])],
      away: [...new Set([
        ...(suspendedPlayers.away || []),
        ...injuries.filter((injury) => injury.side === "away").map((injury) => injury.player),
      ])],
    };
    const penaltyResult = simulatePenaltyShootout(
      teamById(match.homeId),
      teamById(match.awayId),
      shootoutRandom,
      redCards,
      shootoutUnavailable,
      state.settings.upset,
    );
    penalties = penaltyResult.penalties;
    shootout = penaltyResult.sequence;
    winnerId = penalties.home > penalties.away ? match.homeId : match.awayId;
  } else {
    winnerId = match.allowDraw
      ? homeGoals === awayGoals ? null : homeGoals > awayGoals ? match.homeId : match.awayId
      : decidingMatchWinnerId(match, homeGoals, awayGoals);
  }

  return {
    ...current,
    ...candidate,
    homeEvents,
    awayEvents,
    redCards,
    injuries,
    homeGoals,
    awayGoals,
    regulationHome,
    regulationAway,
    extraTime,
    penalties,
    shootout,
    winnerId,
    engineVersion: current.engineVersion || 2,
    engineSeed: current.engineSeed || candidate.engineSeed,
    revealed: false,
    tacticalHistory: [...(current.tacticalHistory || []), {
      minute: Number(cutoff.toFixed(2)),
      tactic: state.standardTactic,
      opponent: candidate.tacticalMatchup?.opponent || "balanced",
      edge: candidate.tacticalMatchup?.edge || 0,
      managementScore: candidate.tacticalMatchup?.management?.score || 0,
      formation: candidate.tacticalMatchup?.management?.formation || null,
    }],
  };
}

function removeDismissedPlayersFromFutureGoals(events, side, redCards, match, injuries = []) {
  const team = teamById(side === "home" ? match.homeId : match.awayId);
  if (!team) return events;
  const defendingSide = side === "home" ? "away" : "home";
  const defendingTeam = teamById(defendingSide === "home" ? match.homeId : match.awayId);
  const participantKey = (name) => repairPlayerText(String(name || "").replace(/\s*\(OG\)\s*$/i, ""))
    .toLocaleLowerCase();
  const eventBelongsToSide = (event, eventSide, eventTeam) => (
    event?.side === eventSide
    || (!event?.side && event?.teamId === eventTeam?.id)
  );
  return events.map((event, index) => {
    const unavailable = new Set([
      ...redCards
        .filter((card) => eventBelongsToSide(card, side, team) && card.minute <= event.minute)
        .map((card) => participantKey(card.player)),
      ...injuries
        .filter((injury) => eventBelongsToSide(injury, side, team) && injury.minute <= event.minute)
        .map((injury) => participantKey(injury.player)),
    ]);

    if (event.ownGoal) {
      if (!defendingTeam) return event;
      const defendingUnavailable = new Set([
        ...redCards
          .filter((card) => eventBelongsToSide(card, defendingSide, defendingTeam) && card.minute <= event.minute)
          .map((card) => participantKey(card.player)),
        ...injuries
          .filter((injury) => eventBelongsToSide(injury, defendingSide, defendingTeam) && injury.minute <= event.minute)
          .map((injury) => participantKey(injury.player)),
      ]);
      const ownGoalBy = participantKey(event.ownGoalBy || event.scorer);
      if (!defendingUnavailable.has(ownGoalBy)) return event;
      const defendingCards = redCards.filter((card) => eventBelongsToSide(card, defendingSide, defendingTeam));
      const candidates = eligibleScorerProfiles(defendingTeam, event.minute, defendingCards)
        .filter((profile) => !defendingUnavailable.has(participantKey(profile.name)));
      const preferred = candidates.filter((profile) => (
        ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "DM"].includes(profile.position)
      ));
      const pool = preferred.length ? preferred : candidates;
      if (!pool.length) return event;
      const replacement = pool[stableHash(`${match.id}:${side}:${event.minute}:${index}:own-goal-dismissal`) % pool.length];
      return { ...event, ownGoalBy: replacement.name, scorer: `${replacement.name} (OG)` };
    }

    const scorerUnavailable = unavailable.has(participantKey(event.scorer));
    const assistUnavailable = unavailable.has(participantKey(event.assist));
    if (!scorerUnavailable && !assistUnavailable) return event;
    const sideCards = redCards.filter((card) => eventBelongsToSide(card, side, team));
    const eligible = eligibleScorerProfiles(team, event.goalType === "penalty" ? 1 : event.minute, sideCards)
      .filter((profile) => !unavailable.has(participantKey(profile.name)));
    if (!eligible.length) return event;
    const start = stableHash(`${match.id}:${side}:${event.minute}:${index}:dismissal-replacement`) % eligible.length;
    const scorerPool = event.goalType === "penalty"
      ? preferredPenaltyScorerProfiles(team, eligible, "penalty")
      : eligible;
    const replacement = scorerPool[start % scorerPool.length];
    const scorer = scorerUnavailable ? replacement.name : event.scorer;
    const assistPool = eligible.filter((profile) => profile.name !== scorer);
    const replacedAssist = assistUnavailable
      ? (assistPool.length ? assistPool[start % assistPool.length].name : null)
      : event.assist;
    return {
      ...event,
      scorer,
      assist: replacedAssist === scorer ? null : replacedAssist,
    };
  });
}

function retroPlayersOnPitchAtMinute(match, team, minute, management = null) {
  const squad = retroManagerSquadForTeam(team);
  if (!squad?.players?.length) {
    return playerProfilesForTeam(team).filter((profile) => profile.startingXI);
  }
  let activeNumbers = management?.activeStarters?.length
    ? [...management.activeStarters]
    : retroManagerLineupForTeam(team)?.starters
      || RETRO_WORLD_CUP_ENGINE.startingXI(Number(retroTournament?.year), team.name).players.map((player) => player.number);
  [...(management?.history || [])]
    .sort((left, right) => right.minute - left.minute)
    .forEach((change) => {
      if (Number(change.minute) <= minute) return;
      const incomingIndex = activeNumbers.indexOf(change.incomingNumber);
      if (incomingIndex >= 0) activeNumbers.splice(incomingIndex, 1, change.outgoingNumber);
    });
  const unavailableNames = new Set([
    ...(match.result?.redCards || [])
      .filter((event) => event.teamId === team.id && event.minute <= minute)
      .map((event) => event.player),
    ...(match.result?.injuries || [])
      .filter((event) => event.teamId === team.id && event.minute <= minute)
      .map((event) => event.player),
  ]);
  return activeNumbers
    .map((number) => squad.players.find((player) => player.number === number))
    .filter((player) => player && !unavailableNames.has(player.name));
}

function repairLiveGoalParticipants(match) {
  if (![1998, 2002, 2006, 2010, 2014, 2016, 2018, 2020, 2022, 2024, 2026].includes(Number(retroTournament?.year)) || !match?.result) return;
  ["home", "away"].forEach((side) => {
    const team = teamById(side === "home" ? match.homeId : match.awayId);
    const management = retroLiveTeamManagement(team.id);
    const events = side === "home" ? match.result.homeEvents : match.result.awayEvents;
    (events || []).forEach((event, index) => {
      if (event.ownGoal) {
        const defendingSide = side === "home" ? "away" : "home";
        const defendingTeam = teamById(defendingSide === "home" ? match.homeId : match.awayId);
        const defendingManagement = retroLiveTeamManagement(defendingTeam.id);
        const defenders = retroPlayersOnPitchAtMinute(match, defendingTeam, event.minute, defendingManagement);
        const eligibleDefenders = defenders.filter((player) => (
          ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM"].includes(player.position)
        ));
        const ownGoalPool = eligibleDefenders.length ? eligibleDefenders : defenders;
        if (ownGoalPool.length && !ownGoalPool.some((player) => player.name === event.ownGoalBy)) {
          const ownGoalIndex = stableHash(`${match.id}:${side}:${event.minute}:${index}:own-goal`) % ownGoalPool.length;
          event.ownGoalBy = ownGoalPool[ownGoalIndex].name;
          event.scorer = `${event.ownGoalBy} (OG)`;
        }
        return;
      }
      const eligible = retroPlayersOnPitchAtMinute(match, team, event.minute, management)
        .filter((player) => player.position !== "GK");
      if (!eligible.length) return;
      const eligibleNames = new Set(eligible.map((player) => player.name));
      const replacementIndex = stableHash(`${match.id}:${side}:${event.minute}:${index}:on-pitch`) % eligible.length;
      if (!eligibleNames.has(event.scorer)) event.scorer = eligible[replacementIndex].name;
      if (event.assist && (!eligibleNames.has(event.assist) || event.assist === event.scorer)) {
        const assistPool = eligible.filter((player) => player.name !== event.scorer);
        event.assist = assistPool.length ? assistPool[replacementIndex % assistPool.length].name : null;
      }
    });
  });
}

function displayedLiveMinute(playback = livePlayback) {
  const displayed = Number(playback?.presentationClock?.snapshot().displayed);
  return Number.isFinite(displayed) ? displayed : Number(playback?.minute) || 0;
}

function retroLiveSubstitutionLimits(match) {
  const extraTimeActive = Boolean(match?.result?.extraTime && displayedLiveMinute() >= 90);
  return {
    substitutions: extraTimeActive ? 7 : 5,
    stoppages: extraTimeActive ? 4 : 3,
  };
}

function retroLiveSubstitutionIsFreeInterval(match) {
  const minute = displayedLiveMinute();
  return (
    (minute >= 44.5 && minute <= 46.5)
    || Boolean(match?.result?.extraTime && minute >= 89.5 && minute <= 91.5)
    || Boolean(match?.result?.extraTime && minute >= 104.5 && minute <= 106.5)
  );
}

function retroLiveTeamManagement(teamId) {
  if (!livePlayback || !teamId) return null;
  return [livePlayback.managerSubstitutions, livePlayback.oppositionManagement]
    .find((management) => management?.teamId === teamId) || null;
}

function upgradeRetroLiveManagementSlotOrder(management) {
  if (
    !management
    || management.slotOrderVersion === RETRO_LINEUP_SLOT_ORDER_VERSION
    || management.activeStarters?.length !== 11
  ) return;
  const team = teamById(management.teamId);
  const squad = retroManagerSquadForTeam(team);
  const players = management.activeStarters
    .map((number) => squad?.players.find((player) => player.number === number))
    .filter(Boolean);
  if (players.length === 11) {
    const missingEntries = Object.values(management.missingSlots || {});
    management.activeStarters = retroOrderStarterNumbers(
      players,
      RETRO_MANAGER_FORMATIONS.includes(management.formation) ? management.formation : "4-3-3",
    );
    retroRemapMissingSlots(management, missingEntries);
  }
  management.slotOrderVersion = RETRO_LINEUP_SLOT_ORDER_VERSION;
}

function retroLiveMissingPlayer(management, playerNumber) {
  if (!management?.missingSlots) return null;
  const slot = management.activeStarters.indexOf(playerNumber);
  return slot < 0 ? null : management.missingSlots[slot] || null;
}

function applyRetroLivePlayerAbsence(match, event) {
  if (!match || !event || !["red", "injury"].includes(event.type)) return false;
  if (event.type === "injury" && state.settings.removeInjuries === true) return false;
  const management = retroLiveTeamManagement(event.teamId);
  const team = teamById(event.teamId);
  const squad = retroManagerSquadForTeam(team);
  const player = squad?.players.find((candidate) => candidate.name === (event.player || event.metadata?.scorer));
  const slot = player ? management?.activeStarters.indexOf(player.number) : -1;
  if (!management || !player || slot < 0) return false;
  management.missingSlots ||= {};
  management.missingSlots[slot] = {
    type: event.type,
    number: player.number,
    name: player.name,
    minute: Math.ceil(event.minute),
  };
  management.unavailableNumbers ||= [];
  if (!management.unavailableNumbers.includes(player.number)) management.unavailableNumbers.push(player.number);
  const eventSide = event.teamId === match.homeId ? "home" : "away";
  const presentationPlayer = match2dState?.presentation?.[eventSide]?.players
    ?.find((profile) => profile.name === player.name);
  const visualPlayer = match2dState?.players?.find((visual) => visual.id === presentationPlayer?.id);
  if (visualPlayer?.node) {
    visualPlayer.node.hidden = true;
    visualPlayer.node.classList.add("is-unavailable");
  }
  if (retroLiveSubOutNumber === player.number) {
    retroLiveSubOutNumber = null;
    retroLiveSubInNumber = null;
    retroLivePendingSubstitution = null;
  }
  clearPlayerProfileCacheForTeam(team.id);
  renderRetroMatchLineupsPanel(match);
  return true;
}

function retroLiveSubstitutionState(match) {
  if (
    !livePlayback
    || livePlayback.matchId !== match?.id
    || livePlayback.phase !== "match"
    || !livePlayback.managerSubstitutions
  ) return null;
  return livePlayback.managerSubstitutions;
}

function retroSubstitutionPositionsCompatible(outgoing, incoming) {
  if (!outgoing || !incoming) return false;
  return (outgoing.position === "GK") === (incoming.position === "GK");
}

function retroPendingSubstitutionChanges() {
  if (Array.isArray(retroLivePendingSubstitution)) return retroLivePendingSubstitution;
  return retroLivePendingSubstitution ? [retroLivePendingSubstitution] : [];
}

function stageRetroLiveSubstitution(match, outgoingNumber, incomingNumber) {
  const substitutions = retroLiveSubstitutionState(match);
  const team = spectatedTeam();
  const squad = retroManagerSquadForTeam(team);
  const outgoing = squad?.players.find((player) => player.number === outgoingNumber);
  const incoming = squad?.players.find((player) => player.number === incomingNumber);
  const pendingChanges = retroPendingSubstitutionChanges();
  const previewStarters = [...(substitutions?.activeStarters || [])];
  pendingChanges.forEach((change) => {
    const slot = previewStarters.indexOf(change.outgoingNumber);
    if (slot >= 0) previewStarters.splice(slot, 1, change.incomingNumber);
  });
  if (
    !substitutions
    || !outgoing
    || !incoming
    || !previewStarters.includes(outgoingNumber)
    || previewStarters.includes(incomingNumber)
    || substitutions.subbedOut.includes(incomingNumber)
    || pendingChanges.some((change) => (
      change.outgoingNumber === outgoingNumber
      || change.incomingNumber === incomingNumber
      || change.outgoingNumber === incomingNumber
      || change.incomingNumber === outgoingNumber
    ))
  ) return false;
  const limits = retroLiveSubstitutionLimits(match);
  if (substitutions.used + pendingChanges.length >= limits.substitutions) {
    showToast(`Only ${limits.substitutions - substitutions.used} substitutions remain.`);
    return false;
  }
  if (
    !substitutions.windowOpen
    && !retroLiveSubstitutionIsFreeInterval(match)
    && substitutions.stoppages >= limits.stoppages
  ) {
    showToast(`All ${limits.stoppages} substitution stoppages have been used.`);
    return false;
  }
  const missing = retroLiveMissingPlayer(substitutions, outgoingNumber);
  if (missing?.type === "red") {
    showToast("A player who has been sent off cannot be replaced.");
    return false;
  }
  if (!retroSubstitutionPositionsCompatible(outgoing, incoming)) {
    showToast(outgoing.position === "GK"
      ? "A goalkeeper can only be replaced by another goalkeeper."
      : "An outfield player cannot replace the goalkeeper.");
    return false;
  }
  retroLiveSubOutNumber = outgoingNumber;
  retroLiveSubInNumber = incomingNumber;
  retroLivePendingSubstitution = [...pendingChanges, { outgoingNumber, incomingNumber }];
  retroLiveSubOutNumber = null;
  retroLiveSubInNumber = null;
  renderRetroMatchLineupsPanel(match);
  showToast(`${retroLivePendingSubstitution.length} change${retroLivePendingSubstitution.length === 1 ? "" : "s"} ready.`);
  return true;
}

function applyRetroLivePositionSwap(match, firstNumber, secondNumber) {
  const management = retroLiveSubstitutionState(match);
  const team = spectatedTeam();
  const squad = retroManagerSquadForTeam(team);
  const firstIndex = management?.activeStarters.indexOf(firstNumber) ?? -1;
  const secondIndex = management?.activeStarters.indexOf(secondNumber) ?? -1;
  const first = squad?.players.find((player) => player.number === firstNumber);
  const second = squad?.players.find((player) => player.number === secondNumber);
  if (
    !management
    || !first
    || !second
    || firstIndex < 0
    || secondIndex < 0
    || firstIndex === secondIndex
    || management.missingSlots?.[firstIndex]
    || management.missingSlots?.[secondIndex]
  ) return false;
  if (retroPendingSubstitutionChanges().length) {
    showToast("Confirm or cancel the pending substitutions first.");
    return false;
  }
  [management.activeStarters[firstIndex], management.activeStarters[secondIndex]] = [
    management.activeStarters[secondIndex],
    management.activeStarters[firstIndex],
  ];
  retroLiveSubOutNumber = null;
  retroLiveSubInNumber = null;
  retroLivePendingSubstitution = null;
  publishLiveManagementCommentary({
    minute: Math.max(1, Math.ceil(displayedLiveMinute())),
    text: `${first.name} and ${second.name} switch positions for ${team.name}.`,
    type: "tactical-change",
    emphasis: "normal",
    eventId: `${match.id}:position-swap:${firstNumber}:${secondNumber}:${Date.now()}`,
  });
  clearPlayerProfileCacheForTeam(team.id);
  rebuildLiveMatchAfterTacticChange(match);
  renderRetroMatchLineupsPanel(match);
  showToast(`${first.name} and ${second.name} have switched positions.`);
  return true;
}

function applyRetroLiveSubstitutionBatch(match, pendingChanges = retroPendingSubstitutionChanges()) {
  const substitutions = retroLiveSubstitutionState(match);
  const team = spectatedTeam();
  const squad = retroManagerSquadForTeam(team);
  if (!substitutions || !team || substitutions.teamId !== team.id || !squad || !pendingChanges.length) return false;
  const workingStarters = [...substitutions.activeStarters];
  const validatedChanges = [];
  for (const change of pendingChanges) {
    const outgoingIndex = workingStarters.indexOf(change.outgoingNumber);
    const incoming = squad.players.find((player) => player.number === change.incomingNumber);
    const outgoing = squad.players.find((player) => player.number === change.outgoingNumber);
    if (
      outgoingIndex < 0
      || !incoming
      || !outgoing
      || !retroSubstitutionPositionsCompatible(outgoing, incoming)
      || workingStarters.includes(change.incomingNumber)
      || substitutions.subbedOut.includes(change.incomingNumber)
      || retroLiveMissingPlayer(substitutions, change.outgoingNumber)?.type === "red"
    ) return false;
    workingStarters.splice(outgoingIndex, 1, change.incomingNumber);
    validatedChanges.push({ ...change, outgoingIndex, outgoing, incoming });
  }
  const limits = retroLiveSubstitutionLimits(match);
  if (substitutions.used + validatedChanges.length > limits.substitutions) {
    showToast(`Only ${limits.substitutions - substitutions.used} substitutions remain.`);
    return false;
  }
  const freeInterval = retroLiveSubstitutionIsFreeInterval(match);
  if (!substitutions.windowOpen && !freeInterval && substitutions.stoppages >= limits.stoppages) {
    showToast(`All ${limits.stoppages} substitution stoppages have been used.`);
    return false;
  }
  if (!livePlayback.paused) toggleLivePause();
  if (!substitutions.windowOpen) {
    substitutions.windowOpen = true;
    if (!freeInterval) substitutions.stoppages += 1;
  }
  const substitutionMinute = Math.max(1, Math.ceil(displayedLiveMinute()));
  const side = team.id === match.homeId ? "home" : "away";
  livePlayback.playerRatings ||= { home: {}, away: {} };
  livePlayback.playerRatings[side] ||= {};
  match.result.substitutions ||= [];
  validatedChanges.forEach(({ outgoingIndex, outgoing, incoming }) => {
    substitutions.activeStarters.splice(outgoingIndex, 1, incoming.number);
    if (substitutions.missingSlots?.[outgoingIndex]) delete substitutions.missingSlots[outgoingIndex];
    substitutions.used += 1;
    substitutions.subbedOut.push(outgoing.number);
    substitutions.history.push({
      minute: substitutionMinute,
      outgoingNumber: outgoing.number,
      outgoingName: outgoing.name,
      incomingNumber: incoming.number,
      incomingName: incoming.name,
    });
    livePlayback.playerRatings[side][incoming.name] = {
      rating: 6.5,
      delta: 0,
      reason: "Substitute",
      playerNumber: incoming.number,
    };
    const substitutionEvent = {
      minute: substitutionMinute,
      player: incoming.name,
      playerIn: incoming.name,
      playerOut: outgoing.name,
      incomingNumber: incoming.number,
      outgoingNumber: outgoing.number,
      teamId: team.id,
      side,
      type: "substitution",
    };
    match.result.substitutions.push(substitutionEvent);
    livePlayback.feed.unshift(substitutionEvent);
    appendLiveTimelineEvent(substitutionEvent);
  });
  const outgoingNames = validatedChanges.map((change) => change.outgoing.name);
  const incomingNames = validatedChanges.map((change) => change.incoming.name);
  publishLiveManagementCommentary({
    minute: substitutionMinute,
    text: `${outgoingNames.join(", ")} ${outgoingNames.length === 1 ? "comes" : "come"} off. ${incomingNames.join(", ")} ${incomingNames.length === 1 ? "is" : "are"} sent on for ${team.name}.`,
    type: "substitution",
    emphasis: "normal",
    eventId: `${match.id}:sub-window:${substitutionMinute}:${substitutions.used}`,
  });
  retroLiveSubOutNumber = null;
  retroLiveSubInNumber = null;
  retroLivePendingSubstitution = null;
  clearPlayerProfileCacheForTeam(team.id);
  rebuildLiveMatchAfterTacticChange(match);
  renderRetroMatchLineupsPanel(match);
  saveLiveMatchCheckpoint();
  showToast(`${validatedChanges.length} substitution${validatedChanges.length === 1 ? "" : "s"} confirmed in one stoppage.`);
  return true;
}

function applyRetroLiveSubstitution(match, outgoingNumber, incomingNumber) {
  return applyRetroLiveSubstitutionBatch(match, [{ outgoingNumber, incomingNumber }]);
}

function updateRetroOppositionManagement(match) {
  const management = livePlayback?.oppositionManagement;
  if (!management || livePlayback.phase !== "match") return;
  const minute = displayedLiveMinute();
  const schedule = match.result?.extraTime ? [58, 68, 76, 83, 88, 101, 112] : [58, 68, 76, 83, 88];
  const nextMinute = schedule[management.nextSubIndex];
  if (!Number.isFinite(nextMinute) || minute < nextMinute) return;
  management.nextSubIndex += 1;
  const team = teamById(management.teamId);
  const squad = retroManagerSquadForTeam(team);
  if (!team || !squad) return;
  const side = team.id === match.homeId ? "home" : "away";
  const ratings = livePlayback.playerRatings?.[side] || {};
  const activePlayers = management.activeStarters
    .map((number) => squad.players.find((player) => player.number === number))
    .filter(Boolean);
  const unavailable = new Set(management.subbedOut);
  const bench = retroSortedBenchPlayers(squad, activePlayers)
    .filter((player) => !unavailable.has(player.number));
  const rankedOutgoing = activePlayers
    .filter((player) => (
      player.position !== "GK"
      && retroLiveMissingPlayer(management, player.number)?.type !== "red"
    ))
    .map((player) => ({
      player,
      rating: Number(livePlayerRatingEntry(ratings, player)?.rating) || 6.5,
    }))
    .sort((left, right) => left.rating - right.rating || left.player.overall - right.player.overall);
  const choice = rankedOutgoing
    .map(({ player }) => ({
      outgoing: player,
      incoming: bench
        .map((candidate) => ({
          candidate,
          fit: retroPlayerPositionFit(candidate, player.position),
        }))
        .filter(({ fit }) => fit >= 76)
        .sort((left, right) => right.fit - left.fit || right.candidate.overall - left.candidate.overall)[0]
        ?.candidate,
    }))
    .find(({ incoming }) => incoming);
  if (!choice) return;
  const outgoingIndex = management.activeStarters.indexOf(choice.outgoing.number);
  management.activeStarters.splice(outgoingIndex, 1, choice.incoming.number);
  if (management.missingSlots?.[outgoingIndex]) delete management.missingSlots[outgoingIndex];
  management.used += 1;
  management.subbedOut.push(choice.outgoing.number);
  management.history.push({
    minute: Math.ceil(minute),
    outgoingNumber: choice.outgoing.number,
    incomingNumber: choice.incoming.number,
  });
  livePlayback.playerRatings[side][choice.incoming.name] = {
    rating: 6.5,
    delta: 0,
    reason: "Substitute",
    playerNumber: choice.incoming.number,
  };
  if (management.nextSubIndex === 3) {
    const opponentScore = side === "home" ? livePlayback.homeScore : livePlayback.awayScore;
    const managedScore = side === "home" ? livePlayback.awayScore : livePlayback.homeScore;
    const defenderCount = retroFormationDefenderCount(management.formation);
    const nextFormation = opponentScore < managedScore
      ? ({ 3: "3-4-3", 4: "4-3-3", 5: "5-2-3" }[defenderCount] || "4-3-3")
      : opponentScore > managedScore
        ? ({ 3: "3-5-2", 4: "4-2-3-1", 5: "5-3-2" }[defenderCount] || "4-2-3-1")
        : management.formation;
    if (nextFormation !== management.formation) {
      const currentFormation = management.formation;
      const missingEntries = Object.values(management.missingSlots || {});
      const currentPlayers = management.activeStarters
        .map((number) => squad.players.find((player) => player.number === number))
        .filter(Boolean);
      management.activeStarters = retroOrderStartersForFormationChange(
        currentPlayers,
        management.activeStarters,
        currentFormation,
        nextFormation,
      );
      management.formation = nextFormation;
      retroRemapMissingSlots(management, missingEntries);
      team.selectedFormation = nextFormation;
    }
  }
  const substitutionEvent = {
    minute: Math.ceil(minute),
    player: choice.incoming.name,
    playerIn: choice.incoming.name,
    playerOut: choice.outgoing.name,
    incomingNumber: choice.incoming.number,
    outgoingNumber: choice.outgoing.number,
    teamId: team.id,
    side,
    type: "substitution",
  };
  match.result.substitutions ||= [];
  match.result.substitutions.push(substitutionEvent);
  livePlayback.feed.unshift(substitutionEvent);
  appendLiveTimelineEvent(substitutionEvent);
  publishLiveManagementCommentary({
    minute: Math.ceil(minute),
    text: `${choice.outgoing.name} makes way. ${choice.incoming.name} comes on for ${team.name}.`,
    type: "substitution",
    emphasis: "normal",
    eventId: `${match.id}:opponent-sub:${management.used}`,
  });
  clearPlayerProfileCacheForTeam(team.id);
  rebuildLiveMatchAfterTacticChange(match);
  renderRetroMatchLineupsPanel(match);
  saveLiveMatchCheckpoint();
}

function rebuildLiveMatchAfterTacticChange(match) {
  if (!livePlayback || !match2dState || livePlayback.matchId !== match.id) return false;
  if (match2dState.activeHighlight) {
    match2dState.activeHighlight = null;
    match2dState.actionIndex = 0;
    match2dState.leadInRemaining = 0;
    els.match2dViewer.hidden = true;
    els.matchCommentaryView.hidden = false;
  }
  livePlayback.pendingTacticChange = false;
  const displayedCutoff = displayedLiveMinute();
  const resultCutoff = displayedCutoff;
  livePlayback.minute = displayedCutoff;
  const candidate = createLiveMatchResult(match, livePlayback.roundIndex);
  match.result = mergeLiveTacticalResult(match.result, candidate, resultCutoff, match);
  repairLiveGoalParticipants(match);
  const controlledSide = state.spectateTeamId === match.homeId ? "home" : "away";
  const opponentKey = match.result.tacticalMatchup?.opponent || opponentStandardTactic(match, controlledSide);
  const presentation = createMatchHighlightPresentation({
    seed: match.result.engineSeed,
    home: teamById(match.homeId),
    away: teamById(match.awayId),
    homeProfiles: playerProfilesForTeam(teamById(match.homeId)),
    awayProfiles: playerProfilesForTeam(teamById(match.awayId)),
    homeTactic: controlledSide === "home" ? state.standardTactic : opponentKey,
    awayTactic: controlledSide === "away" ? state.standardTactic : opponentKey,
    result: match.result,
  });
  match.result.matchStats = presentation.stats;
  match2dState.presentation = presentation;
  match2dState.engine = presentation;
  match2dState.players = rebuildMatch2dPlayerNodes(presentation);
  // An authoritative goal can share the displayed minute with a substitution.
  // Keep that minute eligible so the management rebuild cannot skip the goal.
  match2dState.cursor = presentation.highlights.findLastIndex((highlight) => highlight.minute < resultCutoff);
  match2dState.activeHighlight = null;
  match2dState.actionIndex = 0;
  match2dState.fullTimeClockQueued = false;
  match2dState.complete = false;
  match2dState.nextAction = performance.now() + 180;
  livePlayback.maxMinute = match.result.extraTime ? 120 : 90;
  livePlayback.visibleStats = matchStatsAtMinute(presentation.stats, displayedCutoff);
  livePlayback.presentationScheduler.clear("live-tactic-change");
  livePlayback.presentationClock = MatchPresentation.createClock({
    initialMinute: displayedCutoff,
    maxMinute: livePlayback.maxMinute,
    speed: livePlayback.speed,
    now: performance.now(),
  });
  renderMatchAnalysis(match, true);
  return true;
}

function controlledMatchTactic(match) {
  const controlled = state.spectateTeamId
    && (match.homeId === state.spectateTeamId || match.awayId === state.spectateTeamId);
  return controlled ? (STANDARD_TACTICS[state.standardTactic] || STANDARD_TACTICS.balanced) : STANDARD_TACTICS.balanced;
}

function match2dTacticSummary(match) {
  const selected = controlledMatchTactic(match).name;
  const opponentKey = match?.result?.tacticalMatchup?.opponent;
  const opponent = STANDARD_TACTICS[opponentKey]?.name;
  return opponent ? `${selected} vs ${opponent}` : selected;
}

function syncMatch2dPlayers(duration, shape = null) {
  if (!match2dState) return;
  const enginePlayers = [...match2dState.presentation.home.players, ...match2dState.presentation.away.players];
  match2dState.players.forEach((visual) => {
    const { id } = visual;
    const player = enginePlayers.find((candidate) => candidate.id === id);
    const target = shape?.[id] || player;
    if (target) {
      visual.targetX = target.x;
      visual.targetY = target.y;
    }
  });
}

function animateMatch2dScene(timestamp) {
  if (!match2dState) return;
  const elapsed = Math.min(0.05, Math.max(0.001, (timestamp - match2dState.lastVisualTimestamp) / 1000));
  match2dState.lastVisualTimestamp = timestamp;
  const reducedMotion = Boolean(livePlayback?.reducedMotion);
  match2dState.players.forEach((visual) => {
    const dx = visual.targetX - visual.x;
    const dy = visual.targetY - visual.y;
    const distance = Math.hypot(dx, dy);
    if (reducedMotion) {
      visual.x = visual.targetX;
      visual.y = visual.targetY;
    } else {
      const desiredSpeed = Math.min(25, distance * 3.8);
      const desiredVx = distance > 0.01 ? (dx / distance) * desiredSpeed : 0;
      const desiredVy = distance > 0.01 ? (dy / distance) * desiredSpeed : 0;
      const acceleration = 1 - Math.exp(-8 * elapsed);
      visual.vx += (desiredVx - visual.vx) * acceleration;
      visual.vy += (desiredVy - visual.vy) * acceleration;
      visual.x += visual.vx * elapsed;
      visual.y += visual.vy * elapsed;
      if (distance < 0.15) {
        visual.x = visual.targetX;
        visual.y = visual.targetY;
        visual.vx *= 0.45;
        visual.vy *= 0.45;
      }
    }
    setMatch2dPosition(visual.node, visual.x, visual.y, reducedMotion ? 0 : 45);
  });

  const motion = match2dState.ballMotion;
  if (motion) {
    const progress = simulationClamp((timestamp - motion.startedAt) / motion.duration, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    match2dState.ballX = motion.from.x + (motion.to.x - motion.from.x) * eased;
    const bend = motion.arc * 4 * progress * (1 - progress);
    match2dState.ballY = motion.from.y + (motion.to.y - motion.from.y) * eased + bend;
    if (progress >= 1) match2dState.ballMotion = null;
  }
  setMatch2dPosition(els.match2dBall, match2dState.ballX, match2dState.ballY, reducedMotion ? 0 : 30);
}

function match2dActionCopy(action) {
  const actor = action.actor?.name || "Player";
  if (action.outcome === "goal" || action.event?.type === "goal") return `${actor} finds the net!`;
  if (action.outcome === "saved") {
    const keeper = action.goalkeeper?.name || "Goalkeeper";
    return action.penalty ? `${keeper} guesses correctly and saves the penalty!` : `${keeper} makes a strong save`;
  }
  if (action.outcome === "missed" && action.penalty) return `${actor} puts the penalty wide!`;
  if (action.outcome === "blocked") return `${action.target?.name || "Defender"} gets in the way`;
  if (action.outcome === "rebound") return `${action.target?.name || "The attack"} reacts first to the rebound`;
  if (action.outcome === "corner") return "A deflection takes it behind for a corner";
  if (action.outcome === "missed") return `${actor} sends it narrowly wide`;
  if (action.type === "foul" && action.outcome === "penalty") {
    const team = action.target?.side === "home" ? teamById(selectedMatch()?.homeId) : teamById(selectedMatch()?.awayId);
    return `PENALTY TO ${(team?.name || "TEAM").toUpperCase()}!`;
  }
  if (action.type === "foul") return `Foul on ${action.target?.name || actor}`;
  if (action.type === "tackle") return `${actor} times the challenge perfectly`;
  if (action.type === "interception") return `${actor} reads the pass and steps in`;
  if (action.type === "clearance") return `${actor} gets it away from danger`;
  if (action.type === "through-ball") return `${actor} threads a pass into the channel`;
  if (action.type === "progressive-pass") return `${actor} punches a pass through the lines`;
  if (action.type === "cross") return `${actor} delivers into the area`;
  if (action.type === "dribble") return `${actor} drives forward with the ball`;
  return `${actor} recycles possession`;
}

function recordPossessionGoal(event) {
  const match = selectedMatch();
  if (!match?.result) return;
  const eventsKey = event.side === "home" ? "homeEvents" : "awayEvents";
  const goalsKey = event.side === "home" ? "homeGoals" : "awayGoals";
  const regulationKey = event.side === "home" ? "regulationHome" : "regulationAway";
  match.result[eventsKey].push({
    type: "goal",
    scorer: event.player,
    minute: event.minute,
    goalType: event.goalType || "openPlay",
    xg: event.xg,
  });
  match.result[goalsKey] += 1;
  if (event.minute <= 90) match.result[regulationKey] += 1;
}

function match2dEventKey(event) {
  const scorer = event.player || event.scorer || event.metadata?.scorer || "";
  const scoreAfter = event.scoreAfter
    ? `${Number(event.scoreAfter.home) || 0}-${Number(event.scoreAfter.away) || 0}`
    : "";
  return [
    event.type || "event",
    event.side || "",
    Number(event.minute) || 0,
    Number(event.addedTime) || 0,
    scorer,
    scoreAfter,
  ].join(":");
}

function initializeLivePlayerRatings(match) {
  if (!livePlayback || !match2dState?.presentation) return;
  const createSide = (side) => Object.fromEntries(
    match2dState.presentation[side].players.map((player) => [
      player.name,
      {
        rating: 6.5,
        delta: 0,
        reason: "Kick-off",
        playerNumber: Number.isFinite(Number(player.number)) ? Number(player.number) : null,
      },
    ]),
  );
  livePlayback.playerRatings = {
    home: createSide("home"),
    away: createSide("away"),
  };
  livePlayback.ratingEventIds = new Set();
  livePlayback.ratingActionIds = new Set();
}

function liveRatingNameKey(name) {
  return repairPlayerText(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function livePlayerRatingEntry(ratings, player) {
  if (!ratings || !player) return null;
  if (ratings[player.name]) return ratings[player.name];
  const number = Number(player.number);
  if (Number.isFinite(number)) {
    const numberedEntry = Object.values(ratings).find((entry) => Number(entry?.playerNumber) === number);
    if (numberedEntry) return numberedEntry;
  }
  const nameKey = liveRatingNameKey(player.name);
  if (!nameKey) return null;
  const nameEntry = Object.entries(ratings)
    .find(([name]) => liveRatingNameKey(name) === nameKey);
  return nameEntry?.[1] || null;
}

function livePlayerRatingKey(ratings, playerName) {
  if (!ratings || !playerName) return null;
  if (Object.hasOwn(ratings, playerName)) return playerName;
  const nameKey = liveRatingNameKey(playerName);
  if (!nameKey) return null;
  return Object.keys(ratings).find((name) => liveRatingNameKey(name) === nameKey) || null;
}

function liveRatingSideForPlayer(playerName, preferredSide = null) {
  const ratings = livePlayback?.playerRatings;
  if (!ratings || !playerName) return null;
  if (preferredSide && livePlayerRatingKey(ratings[preferredSide], playerName)) return preferredSide;
  if (livePlayerRatingKey(ratings.home, playerName)) return "home";
  if (livePlayerRatingKey(ratings.away, playerName)) return "away";
  return null;
}

function adjustLivePlayerRating(playerName, delta, reason, preferredSide = null) {
  const side = liveRatingSideForPlayer(playerName, preferredSide);
  const ratingKey = side ? livePlayerRatingKey(livePlayback.playerRatings[side], playerName) : null;
  const entry = ratingKey ? livePlayback.playerRatings[side][ratingKey] : null;
  if (!entry || !Number.isFinite(delta)) return;
  entry.rating = Number(simulationClamp(entry.rating + delta, 3, 10).toFixed(2));
  entry.delta = Number(delta.toFixed(2));
  entry.reason = reason;
}

function liveRatingActionId(action) {
  return action?.presentationEvent?.id
    || action?.event?.id
    || `${action?.side || ""}:${action?.type || ""}:${action?.actor?.name || ""}:${action?.presentationEvent?.minute ?? action?.event?.minute ?? ""}`;
}

function updateLiveRatingsForAction(action, shouldRender = true) {
  if (!livePlayback?.playerRatings || !action || action.event?.type === "goal" || action.outcome === "goal") return;
  const actionId = liveRatingActionId(action);
  if (actionId && livePlayback.ratingActionIds?.has(actionId)) return;
  if (actionId) livePlayback.ratingActionIds?.add(actionId);
  const actor = action.actor?.name;
  const side = action.side;
  if (["interception", "tackle", "clearance"].includes(action.type)) {
    adjustLivePlayerRating(actor, 0.1, action.type, side);
  } else if (["progressive-pass", "through-ball", "cross"].includes(action.type)) {
    adjustLivePlayerRating(actor, 0.03, "Chance created", side);
  } else if (action.type === "foul") {
    adjustLivePlayerRating(actor, -0.1, "Foul conceded", side);
  } else if (action.type === "shot" && ["saved", "wide", "blocked"].includes(action.outcome)) {
    adjustLivePlayerRating(actor, -0.08, action.outcome === "saved" ? "Shot saved" : "Shot missed", side);
    if (action.outcome === "saved") {
      const goalkeeper = match2dState?.presentation?.[side === "home" ? "away" : "home"]?.players
        .find((player) => player.position === "GK");
      adjustLivePlayerRating(goalkeeper?.name, 0.15, "Save", side === "home" ? "away" : "home");
    }
  }
  if (shouldRender) renderRetroMatchLineupsPanel(selectedMatch());
}

function liveRatingEventId(event) {
  return event?.id || (event ? `rating:${match2dEventKey(event)}` : null);
}

function updateLiveRatingsForEvent(event, shouldRender = true) {
  const eventId = liveRatingEventId(event);
  if (!livePlayback?.playerRatings || !eventId || livePlayback.ratingEventIds.has(eventId)) return;
  livePlayback.ratingEventIds.add(eventId);
  const scorer = event.metadata?.scorer || event.player || event.scorer;
  if (event.type === "goal") {
    const scoringSide = liveRatingSideForPlayer(scorer, event.side);
    adjustLivePlayerRating(scorer, 1, "Goal", scoringSide);
    const assist = event.metadata?.assist || event.assist;
    adjustLivePlayerRating(assist, 0.45, "Assist", scoringSide);
    const concedingSide = scoringSide === "home" ? "away" : "home";
    Object.entries(livePlayback.playerRatings[concedingSide] || {}).forEach(([name]) => {
      const profile = match2dState?.presentation?.[concedingSide]?.players.find((player) => player.name === name);
      if (["goalkeeper", "defender"].includes(possessionPositionGroup(profile?.position))) {
        adjustLivePlayerRating(name, -0.12, "Goal conceded", concedingSide);
      }
    });
  } else if (event.type === "red") {
    const dismissed = event.metadata?.player || event.metadata?.scorer || event.player;
    adjustLivePlayerRating(dismissed, -1.5, "Sent off");
  } else if (event.type === "penalty-miss") {
    adjustLivePlayerRating(scorer, -0.55, "Penalty missed", event.side);
  }
  if (shouldRender) renderRetroMatchLineupsPanel(selectedMatch());
}

function finalizeLivePlayerRatings(match) {
  if (!livePlayback?.playerRatings || !match2dState?.presentation || !match?.result) return;
  const result = match.result;
  ["home", "away"].forEach((side) => {
    const teamId = side === "home" ? match.homeId : match.awayId;
    const goalsAgainst = Number(side === "home" ? result.awayGoals : result.homeGoals) || 0;
    const won = result.winnerId === teamId;
    const lost = Boolean(result.winnerId && !won);
    const outcomeDelta = won ? 0.18 : lost ? -0.12 : 0;
    const sideRatings = livePlayback.playerRatings[side] || {};
    const goalEvents = side === "home" ? result.homeEvents || [] : result.awayEvents || [];

    match2dState.presentation[side].players.forEach((player) => {
      let entry = livePlayerRatingEntry(sideRatings, player);
      if (!entry) {
        entry = {
          rating: 6.5,
          delta: 0,
          reason: "Full time",
          playerNumber: Number.isFinite(Number(player.number)) ? Number(player.number) : null,
        };
        sideRatings[player.name] = entry;
      }
      const existing = Number(entry.rating);
      let rating = Number.isFinite(existing) ? existing : 6.5;
      rating += outcomeDelta;

      const playerKey = liveRatingNameKey(player.name);
      const scored = goalEvents.filter((event) => liveRatingNameKey(event.scorer) === playerKey).length;
      const assisted = goalEvents.filter((event) => liveRatingNameKey(event.assist) === playerKey).length;
      if (scored) rating = Math.max(rating, 6.5 + outcomeDelta + scored * 0.95 + assisted * 0.4);
      else if (assisted) rating = Math.max(rating, 6.5 + outcomeDelta + assisted * 0.42);

      const positionGroup = possessionPositionGroup(player.position);
      if (goalsAgainst === 0 && ["goalkeeper", "defender"].includes(positionGroup)) {
        rating += positionGroup === "goalkeeper" ? 0.42 : 0.3;
        if (!scored && !assisted) entry.reason = "Clean sheet";
      } else if (goalsAgainst > 1 && ["goalkeeper", "defender"].includes(positionGroup)) {
        rating -= Math.min(0.45, (goalsAgainst - 1) * 0.12);
      }

      const redCard = (result.redCards || []).some((event) => (
        (event.side === side || event.teamId === teamId)
        && liveRatingNameKey(event.player || event.scorer) === playerKey
      ));
      if (redCard) {
        rating = Math.min(rating, 5);
        entry.reason = "Sent off";
      } else if (scored) {
        entry.reason = scored > 1 ? `${scored} goals` : "Goal";
      } else if (assisted) {
        entry.reason = assisted > 1 ? `${assisted} assists` : "Assist";
      } else if (won && entry.reason === "Kick-off") {
        entry.reason = "Winning performance";
      } else if (lost && entry.reason === "Kick-off") {
        entry.reason = "Defeat";
      }

      entry.rating = Number(simulationClamp(rating, 3, 10).toFixed(2));
      entry.delta = Number((entry.rating - 6.5).toFixed(2));
      entry.playerNumber = Number.isFinite(Number(player.number)) ? Number(player.number) : entry.playerNumber ?? null;
    });
    livePlayback.playerRatings[side] = sideRatings;
  });
}

function finalizeAndStoreLivePlayerRatings(match) {
  if (!livePlayback || livePlayback.ratingsFinalized) return;
  finalizeLivePlayerRatings(match);
  if (livePlayback.playerRatings) match.result.playerRatings = livePlayback.playerRatings;
  livePlayback.ratingsFinalized = true;
}

function repairFlatSavedPlayerRatings(match) {
  const result = match?.result;
  if (!result?.playerRatings) return false;
  let repaired = false;
  ["home", "away"].forEach((side) => {
    const ratings = result.playerRatings[side];
    const entries = Object.entries(ratings || {});
    if (
      entries.length < 2
      || !entries.every(([, entry]) => Math.abs((Number(entry?.rating) || 6.5) - 6.5) < 0.01)
    ) return;

    const teamId = side === "home" ? match.homeId : match.awayId;
    const goalsFor = Number(side === "home" ? result.homeGoals : result.awayGoals) || 0;
    const goalsAgainst = Number(side === "home" ? result.awayGoals : result.homeGoals) || 0;
    const goalEvents = side === "home" ? result.homeEvents || [] : result.awayEvents || [];
    const won = result.winnerId === teamId;
    const lost = Boolean(result.winnerId && !won);
    const outcomeDelta = won ? 0.35 : lost ? -0.15 : 0.05;
    const profiles = playerProfilesForTeam(teamById(teamId));

    entries.forEach(([name, entry]) => {
      const nameKey = liveRatingNameKey(name);
      const profile = profiles.find((candidate) => liveRatingNameKey(candidate.name) === nameKey);
      const scored = goalEvents.filter((event) => liveRatingNameKey(event.scorer) === nameKey).length;
      const assisted = goalEvents.filter((event) => liveRatingNameKey(event.assist) === nameKey).length;
      const positionGroup = possessionPositionGroup(profile?.position);
      const variation = ((stableHash(`${match.id}:${side}:${name}`) % 9) - 4) * 0.04;
      let rating = 6.25 + outcomeDelta + variation + scored * 0.95 + assisted * 0.42;
      let reason = won ? "Winning performance" : lost ? "Defeat" : "Full time";

      if (goalsAgainst === 0 && ["goalkeeper", "defender"].includes(positionGroup)) {
        rating += positionGroup === "goalkeeper" ? 0.42 : 0.3;
        if (!scored && !assisted) reason = "Clean sheet";
      } else if (goalsAgainst > 1 && ["goalkeeper", "defender"].includes(positionGroup)) {
        rating -= Math.min(0.45, (goalsAgainst - 1) * 0.12);
      }
      const sentOff = (result.redCards || []).some((card) => (
        (card.side === side || card.teamId === teamId)
        && liveRatingNameKey(card.player || card.scorer) === nameKey
      ));
      if (sentOff) {
        rating = Math.min(rating, 5);
        reason = "Sent off";
      } else if (scored) {
        reason = scored > 1 ? `${scored} goals` : "Goal";
      } else if (assisted) {
        reason = assisted > 1 ? `${assisted} assists` : "Assist";
      }

      const finalRating = Number(simulationClamp(rating, 3, 10).toFixed(2));
      ratings[name] = {
        ...entry,
        rating: finalRating,
        delta: Number((finalRating - 6.5).toFixed(2)),
        reason,
        playerNumber: entry?.playerNumber ?? profile?.number ?? null,
      };
    });
    repaired = true;
  });
  return repaired;
}

function fastForwardLivePlayerRatings() {
  match2dState?.presentation?.highlights?.forEach((highlight) => {
    highlight.actions?.forEach((action) => updateLiveRatingsForAction(action, false));
  });
}

function processPossessionAction(action, timestamp, animate = true) {
  if (!action || !match2dState || !livePlayback) return;
  const match = selectedMatch();
  const speed = Math.max(0.5, livePlayback.speed || 1);
  const duration = Math.max(50, (action.duration || 300) / (speed * 2));
  if (animate) {
    syncMatch2dPlayers(duration, action.shape);
    const from = action.from || { x: match2dState.ballX, y: match2dState.ballY };
    const to = action.to || from;
    match2dState.ballX = from.x;
    match2dState.ballY = from.y;
    match2dState.ballMotion = {
      from: { ...from },
      to: { ...to },
      startedAt: timestamp,
      duration: Math.max(180, duration * 0.86),
      arc: ["cross", "through-ball", "clearance"].includes(action.type)
        ? (action.index % 2 === 0 ? -1.8 : 1.8)
        : 0,
    };
    els.match2dPossession.textContent = action.commentary || match2dActionCopy(action);
  }
  const isGoal = action.outcome === "goal" || action.event?.type === "goal";
  const isPenaltyGoal = isGoal && (action.event?.goalType === "penalty" || action.outcome === "penalty");
  const interactivePenalty = isPenaltyGoal && action.event && isControlledMatchPenalty(action.event);
  if (isPenaltyGoal && action.event && !livePlayback.matchPenaltyActive) {
    if (interactivePenalty) {
      const penaltyEvent = MatchPresentation.createEvent({
        ...action.presentationEvent,
        id: `${action.presentationEvent.id}:awarded`,
        type: "penalty-awarded",
        importance: "major",
        scoreAfter: action.presentationEvent.scoreBefore,
        metadata: { ...action.presentationEvent.metadata, commentary: `PENALTY TO ${teamById(action.event.teamId)?.name || "THE ATTACKING TEAM"}!` },
      });
      receivePresentationEvent(penaltyEvent, penaltyEvent.metadata.commentary, animate);
    }
    startMatchPenaltyAnimation(action.event, action);
  } else {
    receivePresentationAction(action, animate);
  }
  updateLiveRatingsForAction(action);
  match2dState.nextAction = timestamp + duration + 90 / speed;
  els.match2dTacticLabel.textContent = match2dTacticSummary(match);
}

function highlightMatchesMode(highlight) {
  return preferredHighlightMode === "extended" || highlight.importance === "key";
}
