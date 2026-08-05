function retroRoundNames(year = retroTournament?.year || state?.retroTournamentYear) {
  const names = [
    "Group stage - Matchday 1",
    "Group stage - Matchday 2",
    "Group stage - Matchday 3",
  ];
  if (Number(year) === 2026) names.push("Round of 32");
  if (Number(year) === 2024) return [...names, "Quarter-finals", "Semi-finals", "Finals"];
  return [...names, "Round of 16", "Quarter-Final", "Semi-Final", "Finals"];
}

function tournamentRoundNames() {
  if (state?.savedTournamentView && Array.isArray(state.savedTournamentRoundNames)) {
    return state.savedTournamentRoundNames;
  }
  if (state?.uclSeason && state.uclKnockoutMatch) {
    return [state.uclKnockoutMatch.roundLabel || "Knockout match"];
  }
  if (state?.uclSeason) {
    return Array.from({ length: 8 }, (_, index) => `Matchday ${index + 1}`);
  }
  if (state?.premierLeagueSeason) {
    return Array.from({ length: 38 }, (_, index) => `Matchweek ${index + 1}`);
  }
  if (isRetroSimulatorState()) return retroRoundNames();
  if (isValidCustomTournamentState(state)) {
    if (state.customTournament?.customMatch === true) return ["Custom match"];
    return customRoundNames(state.customTournament.teamCount, state.customTournament.structure);
  }
  return ROUND_NAMES;
}

function tournamentRoundName(index = state.activeRound) {
  return tournamentRoundNames()[index] || "World Cup";
}

function isThirdPlacePlayoff(match) {
  return Boolean(match && (
    match.id === "ko-third-place"
    || match.customThirdPlace
    || match.thirdPlacePlayoff
  ));
}

function tournamentMatchRoundName(match, index = state.activeRound) {
  if (isThirdPlacePlayoff(match)) return "Third-place play-off";
  if (state.customTournament?.structure === "groups" && index === 0 && match?.customGroupLabel) {
    return match.customGroupLabel;
  }
  return tournamentRoundName(index);
}

function tournamentFinalRoundIndex() {
  if (state?.savedTournamentView) return Math.max(0, state.rounds.length - 1);
  if (state?.uclSeason) return 7;
  if (state?.premierLeagueSeason) return 37;
  if (isRetroSimulatorState()) {
    const year = Number(retroTournament?.year || state?.retroTournamentYear);
    return year === 2026 ? 7 : year === 2024 ? 5 : 6;
  }
  if (isValidCustomTournamentState(state)) {
    return customRoundNames(state.customTournament.teamCount, state.customTournament.structure).length - 1;
  }
  return 7;
}

function tournamentFinalMatch(finalRound = state.rounds[tournamentFinalRoundIndex()] || []) {
  if (isRetroSimulatorState()) return finalRound.find((match) => match.id === "ko-final") || null;
  return finalRound.find((match) => !isThirdPlacePlayoff(match)) || null;
}

function retroSquadsForYear(year = retroTournament?.year || Number(readRetroWorldCupYear())) {
  if (Number(year) === 1998) return RETRO_1998_SQUADS;
  if (Number(year) === 2002) return RETRO_2002_SQUADS;
  if (Number(year) === 2006) return RETRO_2006_SQUADS;
  if (Number(year) === 2010) return RETRO_2010_SQUADS;
  if (Number(year) === 2016) return RETRO_EURO_2016_SQUADS;
  if (Number(year) === 2018) return RETRO_2018_SQUADS;
  if (Number(year) === 2022) return RETRO_2022_SQUADS;
  if (Number(year) === 2024) return RETRO_COPA_2024_SQUADS;
  if (Number(year) === 2026) return RETRO_2026_SQUADS;
  return RETRO_2014_SQUADS;
}

function retroTeamId(name, year = retroTournament?.year || Number(readRetroWorldCupYear())) {
  return `retro-${year}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

function installRetroTeams(year = retroTournament?.year || Number(readRetroWorldCupYear())) {
  const squads = retroSquadsForYear(year);
  RETRO_WORLD_CUPS[year].teams.forEach((entry) => {
    const id = retroTeamId(entry.name, year);
    if (TEAM_BY_ID.has(id)) return;
    const current = TEAMS.find((team) => team.name === entry.name) || retroTeamForFlag(entry.name);
    const squad = squads[entry.name];
    const startingNumbers = new Set(
      RETRO_WORLD_CUP_ENGINE.startingXI(year, entry.name).players.map((player) => player.number),
    );
    let defenderIndex = 0;
    const playerProfiles = (squad?.players || []).map((player) => {
      let position = player.positions?.[0] || player.position;
      if (position === "DF") {
        position = ["CB", "CB", "LB", "RB"][defenderIndex % 4];
        defenderIndex += 1;
      } else if (position === "MF") {
        position = player.internationalGoals >= 8 ? "CAM" : "CM";
      } else if (position === "FW") {
        position = player.positions?.some((role) => ["LW", "RW"].includes(role)) ? player.positions.find((role) => ["LW", "RW"].includes(role)) : "ST";
      }
      return {
        name: player.name,
        number: player.number,
        club: player.club,
        position,
        overall: player.overall,
        finishing: player.attributes?.shooting || player.overall,
        pace: player.attributes?.pace,
        shooting: player.attributes?.shooting,
        passing: player.attributes?.passing,
        dribbling: player.attributes?.dribbling,
        defending: player.attributes?.defending,
        physical: player.attributes?.physic,
        goalkeeping: player.position === "GK"
          ? Math.round([
            player.attributes?.goalkeeping_diving,
            player.attributes?.goalkeeping_handling,
            player.attributes?.goalkeeping_kicking,
            player.attributes?.goalkeeping_positioning,
            player.attributes?.goalkeeping_reflexes,
          ].filter(Number.isFinite).reduce((sum, value) => sum + value, 0) / 5)
          : 5,
        attackingRole: ["ST", "CF", "LW", "RW", "CAM"].includes(position)
          ? "primary"
          : ["LM", "RM", "CM"].includes(position) ? "support" : "defensive",
        expectedMinutesShare: startingNumbers.has(player.number) ? 0.9 : 0.24,
        startingXI: startingNumbers.has(player.number),
        penaltyTaker: Boolean(squad?.penaltyTakers?.includes(player.name)),
        captain: Boolean(player.captain),
        retroWorldCup: true,
        retroYear: year,
        retroWorldCupGoals: RETRO_WORLD_CUP_ENGINE.historicalGoals(year, player),
        preferredFoot: player.preferredFoot,
      };
    });
    const rating = Number(year) === 2026 && Number.isFinite(Number(squad?.teamRatings?.overall))
      ? Number(squad.teamRatings.overall)
      : entry.rating;
    const derivedSimulationRatings = deriveTeamSimulationRatings(
      id,
      entry.name,
      rating,
      current?.fifaRank || null,
    );
    TEAM_BY_ID.set(id, {
      ...(current || {}),
      id,
      name: entry.name,
      strength: rating,
      rating,
      simulationRatings: Number(year) === 2006
        ? {
          ...derivedSimulationRatings,
          ...(squad?.teamRatings || {}),
          overall: rating,
        }
        : squad?.teamRatings
          ? { ...squad.teamRatings }
          : derivedSimulationRatings,
      players: playerProfiles.map((player) => player.name),
      playerProfiles,
      retroWorldCup: true,
      retroYear: year,
    });
  });
}

function repairRetroResultPlayers(match) {
  if (!match?.result) return;
  const result = match.result;
  const squads = retroSquadsForYear(retroTournament?.year);
  const rosterFor = (teamName, outfieldOnly = false) => (
    (squads[teamName]?.players || [])
      .filter((player) => !outfieldOnly || player.position !== "GK")
      .map((player) => player.name)
  );
  const replacement = (teamName, key, outfieldOnly = false) => {
    const roster = rosterFor(teamName, outfieldOnly);
    return roster[stableHash(`${match.id}:${key}`) % roster.length] || null;
  };

  [["home", match.home], ["away", match.away]].forEach(([side, teamName]) => {
    const officialNames = new Set(rosterFor(teamName));
    (result[`${side}Events`] || []).forEach((event, index) => {
      const ownGoal = event.ownGoal === true
        || event.goalType === "ownGoal"
        || /\(OG\)\s*$/i.test(String(event.scorer || ""));
      if (ownGoal) {
        const defendingTeamName = side === "home" ? match.away : match.home;
        const defendingNames = new Set(rosterFor(defendingTeamName));
        let ownGoalBy = event.ownGoalBy
          || String(event.scorer || "").replace(/\s*\(OG\)\s*$/i, "");
        if (!defendingNames.has(ownGoalBy)) {
          ownGoalBy = replacement(defendingTeamName, `${side}:own-goal:${event.minute}:${index}`, true);
        }
        if (ownGoalBy) {
          event.ownGoal = true;
          event.goalType = "ownGoal";
          event.ownGoalBy = ownGoalBy;
          event.scorer = `${ownGoalBy} (OG)`;
          event.assist = null;
        }
        return;
      }
      if (!officialNames.has(event.scorer)) {
        event.scorer = replacement(teamName, `${side}:goal:${event.minute}:${index}`, true);
      }
    });
  });
  (result.redCards || []).forEach((card, index) => {
    const teamName = card.side === "away" ? match.away : match.home;
    if (!new Set(rosterFor(teamName)).has(card.player)) {
      card.player = replacement(teamName, `${card.side}:red:${card.minute}:${index}`, true);
    }
  });
  (result.injuries || []).forEach((injury, index) => {
    const teamName = injury.side === "away" ? match.away : match.home;
    if (!new Set(rosterFor(teamName)).has(injury.player)) {
      injury.player = replacement(teamName, `${injury.side}:injury:${injury.minute}:${index}`, true);
    }
  });
  const absences = removeImpossiblePlayerAbsenceEvents(result.redCards || [], result.injuries || []);
  result.redCards = absences.redCards;
  result.injuries = absences.injuries;
  result.homeEvents = removeDismissedPlayersFromFutureGoals(
    result.homeEvents || [],
    "home",
    result.redCards,
    match,
    result.injuries,
  );
  result.awayEvents = removeDismissedPlayersFromFutureGoals(
    result.awayEvents || [],
    "away",
    result.redCards,
    match,
    result.injuries,
  );
  (result.shootout || []).forEach((attempt, index) => {
    const teamName = attempt.side === "away" ? match.away : match.home;
    if (!new Set(rosterFor(teamName)).has(attempt.player)) {
      attempt.player = replacement(teamName, `${attempt.side}:shootout:${index}`, true);
    }
  });
}

function adaptRetroMatch(match) {
  match.homeId = retroTeamId(match.home, retroTournament.year);
  match.awayId = retroTeamId(match.away, retroTournament.year);
  match.allowDraw = match.stage === "group";
  if (!match.schedule && [2024, 2026].includes(Number(retroTournament.year))) {
    const groupScheduleKey = `${match.home}|${match.away}`;
    const reverseGroupScheduleKey = `${match.away}|${match.home}`;
    const groupSchedule = Number(retroTournament.year) === 2024 ? RETRO_COPA_2024_GROUP_SCHEDULE : RETRO_2026_GROUP_SCHEDULE;
    const knockoutSchedule = Number(retroTournament.year) === 2024 ? RETRO_COPA_2024_KNOCKOUT_SCHEDULE : RETRO_2026_KNOCKOUT_SCHEDULE;
    match.schedule = match.stage === "group"
      ? groupSchedule[groupScheduleKey] || groupSchedule[reverseGroupScheduleKey]
      : knockoutSchedule[match.id];
  }
  if (match.schedule && (!match.schedule.dateLabel || !match.schedule.timeLabel)) {
    const details = retroScheduleDetails(match);
    match.schedule = {
      ...match.schedule,
      dateLabel: details?.date || "",
      timeLabel: details?.time
        ? `${details.time}${Number(retroTournament.year) === 2024 ? " local" : " BST"}`
        : "",
    };
  }
  if (match.result) {
    if (match.allowDraw) {
      match.result.homeEvents = (match.result.homeEvents || []).filter((event) => event.minute <= 90);
      match.result.awayEvents = (match.result.awayEvents || []).filter((event) => event.minute <= 90);
      match.result.redCards = (match.result.redCards || []).filter((event) => event.minute <= 90);
      match.result.homeGoals = match.result.homeEvents.length;
      match.result.awayGoals = match.result.awayEvents.length;
      match.result.regulationHome = match.result.homeGoals;
      match.result.regulationAway = match.result.awayGoals;
      match.result.extraTime = false;
      match.result.penalties = null;
      match.result.shootout = null;
      match.result.winnerId = match.result.homeGoals === match.result.awayGoals
        ? null
        : match.result.homeGoals > match.result.awayGoals ? match.homeId : match.awayId;
    }
    repairRetroResultPlayers(match);
    const legacyRetroResult = match.result.engineVersion !== 2 && Object.hasOwn(match.result, "winner");
    if (legacyRetroResult) {
      match.result.winnerId = match.result.winner ? retroTeamId(match.result.winner, retroTournament.year) : null;
    } else if (!Object.hasOwn(match.result, "winner")) {
      match.result.winner = match.result.winnerId ? teamById(match.result.winnerId)?.name || null : null;
    }
    repairFlatSavedPlayerRatings(match);
    match.result.revealed = match.result.revealed !== false;
  }
  return match;
}

function retroSimulatorRounds() {
  const groupRounds = [1, 2, 3].map((matchday) => (
    retroTournament.groupMatches.filter((match) => match.matchday === matchday).map(adaptRetroMatch)
  ));
  const knockoutRounds = retroTournament.knockoutRounds.map((round) => round.matches.map(adaptRetroMatch));
  return [...groupRounds, ...knockoutRounds];
}

function retroTournamentRoundIndex() {
  if (retroTournament.phase === "complete") return tournamentFinalRoundIndex();
  if (retroTournament.phase === "group") {
    const nextGroupMatch = retroTournament.groupMatches.find((match) => !match.result);
    return Math.max(0, (nextGroupMatch?.matchday || 3) - 1);
  }
  return Math.min(
    tournamentFinalRoundIndex(),
    3 + Math.max(0, retroTournament.knockoutRounds.length - 1),
  );
}

function activateRetroSimulatorState() {
  installRetroTeams(retroTournament.year);
  const lockedSetup = lockRetroTournamentSetup(retroTournament);
  if (!isRetroSimulatorState()) {
    standardTournamentState = state;
    standardTournamentUiState = {
      fixtureLimit,
      filterUnresolved,
      teamFilterId,
      teamFilterReturn,
    };
    ({ fixtureLimit, filterUnresolved, teamFilterId, teamFilterReturn } = retroTournamentUiState);
    state = retroSimulatorState || {};
  }
  const rounds = retroSimulatorRounds();
  const previous = state;
  const wasCurrentRetroTournament = Boolean(
    previous?.retroWorldCup
    && Number(previous.retroTournamentYear) === Number(retroTournament.year)
    && Number(previous.drawSeed) === Number(retroTournament.seed)
  );
  const previousSpectateTeamId = previous?.spectateTeamId || null;
  const savedNeutralView = retroTournament.neutralView === true;
  const activeRound = wasCurrentRetroTournament
    ? previous.activeRound
    : retroTournamentRoundIndex();
  if (!wasCurrentRetroTournament) state = {};
  Object.assign(state, {
    version: STATE_VERSION,
    retroWorldCup: true,
    savedTournamentView: retroTournament.savedTournamentView === true,
    savedTournamentRecordId: retroTournament.savedTournamentRecordId || null,
    savedTournamentRoundNames: retroTournament.savedTournamentRoundNames || null,
    retroTournamentYear: Number(retroTournament.year),
    drawSeed: retroTournament.seed,
    settings: {
      ...normalizeSettings(previous?.settings || standardTournamentState.settings || {}),
      upset: lockedSetup.upset,
      goals: lockedSetup.goals,
      realNames: true,
      realPlayersOnly: true,
    },
    rounds,
    activeRound: Math.min(activeRound ?? 0, Math.max(0, rounds.length - 1)),
    selectedMatch: wasCurrentRetroTournament ? previous.selectedMatch ?? 0 : 0,
    championView: wasCurrentRetroTournament
      ? Boolean(previous.championView)
      : retroTournament.phase === "complete",
    started: true,
    predictionTeamId: null,
    spectateTeamId: wasCurrentRetroTournament
      ? previous.spectateTeamId || null
      : savedNeutralView || !retroTournament.managedTeam
        ? null
        : retroTeamId(retroTournament.managedTeam, retroTournament.year),
    neutralView: wasCurrentRetroTournament
      ? Boolean(previous.neutralView)
      : savedNeutralView || !retroTournament.managedTeam,
    standardTactic: wasCurrentRetroTournament
      ? previous.standardTactic || "balanced"
      : STANDARD_TACTICS[retroTournament.managerTactic]
        ? retroTournament.managerTactic
        : "balanced",
  });
  const pendingElimination = retroTournament.pendingEliminationDecision;
  if (
    pendingElimination
    && pendingElimination.teamName === retroTournament.managedTeam
    && Number.isInteger(pendingElimination.roundIndex)
  ) {
    const decisionRound = state.rounds[pendingElimination.roundIndex] || [];
    const decisionMatchIndex = decisionRound.findIndex((match) => match.id === pendingElimination.matchId);
    if (decisionMatchIndex >= 0) {
      state.activeRound = pendingElimination.roundIndex;
      state.selectedMatch = decisionMatchIndex;
      state.championView = false;
      state.spectateTeamId = retroTeamId(pendingElimination.teamName, retroTournament.year);
      state.neutralView = false;
    }
  }
  retroSimulatorState = state;
  const savedFinalRoundIndex = tournamentFinalRoundIndex();
  const savedFinal = tournamentFinalMatch(state.rounds[savedFinalRoundIndex] || []);
  if (retroTournament.phase !== "complete" && savedFinal?.result?.revealed) {
    buildNextRound(savedFinalRoundIndex);
    state.championView = retroTournament.phase === "complete";
  }
  const round = selectedRound();
  const managedTeamId = retroTournament.managedTeam
    ? retroTeamId(retroTournament.managedTeam, retroTournament.year)
    : null;
  const managedTeamChanged = !state.neutralView && previousSpectateTeamId !== managedTeamId;
  if (!wasCurrentRetroTournament || managedTeamChanged) {
    const managedMatchIndex = managedTeamId
      ? round.findIndex((match) => (
          !match.result
          && (match.homeId === managedTeamId || match.awayId === managedTeamId)
        ))
      : -1;
    const managedPlayedMatchIndex = managedTeamId
      ? round.findIndex((match) => match.homeId === managedTeamId || match.awayId === managedTeamId)
      : -1;
    const nextUnplayedMatchIndex = round.findIndex((match) => !match.result);
    state.selectedMatch = managedMatchIndex >= 0
      ? managedMatchIndex
      : managedPlayedMatchIndex >= 0
        ? managedPlayedMatchIndex
        : Math.max(0, nextUnplayedMatchIndex);
  } else if (!round[state.selectedMatch]) {
    state.selectedMatch = Math.max(0, round.findIndex((match) => !match.result?.revealed));
  }
  const checkpoint = readStoredLiveMatchCheckpoint();
  if (checkpoint?.scope === `retro-${retroTournament.year}`) {
    const checkpointRoundIndex = state.rounds.findIndex((candidateRound) => (
      candidateRound?.some((match) => (
        match.id === checkpoint.matchId
        && !match.result?.revealed
        && Number(match.result?.engineSeed) === Number(checkpoint.engineSeed)
      ))
    ));
    if (checkpointRoundIndex >= 0) {
      state.activeRound = checkpointRoundIndex;
      state.selectedMatch = state.rounds[checkpointRoundIndex]
        .findIndex((match) => match.id === checkpoint.matchId);
      state.championView = false;
      retroSelectedMatchId = checkpoint.matchId;
    }
  }
}

function restoreStandardTournamentState() {
  if (!isRetroSimulatorState()) return;
  retroSimulatorState = state;
  retroTournamentUiState = {
    fixtureLimit,
    filterUnresolved,
    teamFilterId,
    teamFilterReturn,
  };
  state = standardTournamentState;
  if (standardTournamentUiState) {
    ({ fixtureLimit, filterUnresolved, teamFilterId, teamFilterReturn } = standardTournamentUiState);
  }
}

function restoreSharedMainContent() {
  if (els.mainContent.parentElement === sharedMainContentHome) return;
  sharedMainContentMarker.parentNode?.insertBefore(els.mainContent, sharedMainContentMarker);
}

const startupMode = currentAppMode();
const legacyTournamentMarker = new URLSearchParams(window.location.search).has("legacyTournament");
if (startupMode === "standard" && legacyTournamentMarker) {
  try {
    const legacySession = JSON.parse(localStorage.getItem(LEGACY_TOURNAMENT_SESSION_KEY));
    const validLegacySession = legacySession?.version === STATE_VERSION && isValidLegacyTournamentState(legacySession);
    if (validLegacySession) {
      legacySession.settings = normalizeSettings(legacySession.settings);
      state = legacySession;
    } else if (legacySession) {
      localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
    }
  } catch {
    localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
  }
  if (!isValidLegacyTournamentState(state) && legacyDraft?.complete) {
    state = createLegacyTournamentState();
    saveState();
  }
}

// Restore the custom team only while an active Legacy Draft tournament is open.
if (state.legacyTournament && state.spectateTeamId?.startsWith("legacy-")) {
  if (!TEAM_BY_ID.has(state.spectateTeamId) && legacyDraft?.complete) {
    const team = legacyDraftTeam();
    TEAM_BY_ID.set(team.id, team);
  }
  if (!TEAM_BY_ID.has(state.spectateTeamId)) {
    // Last resort: rebuild legacy draft from saved slots if draft state missing
    try {
      const raw = JSON.parse(localStorage.getItem("legacyDraftState"));
      if (raw?.nationId && LEGACY_NATIONS[raw.nationId]) {
        const nation = LEGACY_NATIONS[raw.nationId];
        legacyDraft = {
          nationId: raw.nationId, mode: raw.mode || "classic", formationId: raw.formationId || "433",
          seed: raw.seed || 1, complete: true,
          nation, formation: legacyFormationById(raw.formationId || "433"),
          lineup: {}, offers: [], currentSquad: null,
        };
        TEAM_BY_ID.set(legacyDraftTeam().id, legacyDraftTeam());
      }
    } catch { /* cannot recover */ }
  }
}
standardTournamentState = state;

function saveState() {
  const previousCustomTournamentState = customTournamentState;
  if (state?.savedTournamentView || retroTournament?.savedTournamentView) return;
  if (state?.uclSeason) {
    window.UclSeason?.saveEngineState?.(state);
    return;
  }
  if (state?.premierLeagueSeason) {
    window.PremierLeagueSeason?.saveEngineState?.(state);
    return;
  }
  if (isRetroSimulatorState()) {
    saveRetroTournamentState();
    return;
  }
  if (isDefaultKnockoutState(state)) defaultKnockoutState = state;
  if (isValidCustomTournamentState(state)) customTournamentState = state;
  if (state.customTournament?.customMatch === true) {
    customMatchState = state;
    customTournamentState = previousCustomTournamentState;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (isValidLegacyTournamentState(state)) {
    localStorage.setItem(LEGACY_TOURNAMENT_SESSION_KEY, JSON.stringify(state));
  }
  const knockoutAchievement = standardKnockoutAchievementState();
  if (knockoutAchievement) window.AccountAchievements?.trackKnockoutTournament(knockoutAchievement);
}

function standardKnockoutAchievementState(candidate = state) {
  if (
    !candidate?.started
    || candidate.retroWorldCup
    || candidate.customTournament
    || candidate.legacyTournament
    || candidate.rounds?.[0]?.length !== 128
  ) return null;
  const teamId = candidate._activeSpectateId || candidate.spectateTeamId;
  if (!teamId || !TEAM_BY_ID.has(teamId)) return null;
  let bestRoundIndex = 0;
  let eliminated = false;
  candidate.rounds.forEach((round, roundIndex) => (round || []).forEach((match) => {
    if (match.homeId !== teamId && match.awayId !== teamId) return;
    bestRoundIndex = Math.max(bestRoundIndex, roundIndex);
    if (
      match.result?.revealed
      && match.result.winnerId
      && match.result.winnerId !== teamId
      && !match.allowDraw
    ) eliminated = true;
  }));
  const finalRound = candidate.rounds[tournamentFinalRoundIndex()] || [];
  const final = tournamentFinalMatch(finalRound);
  const championTeamId = (
    final?.result?.revealed
    && [final.homeId, final.awayId].includes(final.result.winnerId)
  ) ? final.result.winnerId : null;
  return {
    seed: Number(candidate.drawSeed),
    teamId,
    bestRoundIndex,
    championTeamId,
    phase: eliminated || championTeamId ? "complete" : "progress",
  };
}

window.getKnockout256AchievementTournamentState = () => standardKnockoutAchievementState();

function liveMatchCheckpointScope() {
  return isRetroSimulatorState()
    ? `retro-${Number(retroTournament?.year) || Number(readRetroWorldCupYear())}`
    : "standard";
}

function readStoredLiveMatchCheckpoint() {
  try {
    return JSON.parse(localStorage.getItem(LIVE_MATCH_CHECKPOINT_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function checkpointUsesCurrentRosters(checkpoint, match) {
  if (checkpoint?.scope !== "standard" || !match) return true;
  const rosters = {
    home: new Set(canonicalCurrentRosterNames(TEAM_BY_ID.get(match.homeId))),
    away: new Set(canonicalCurrentRosterNames(TEAM_BY_ID.get(match.awayId))),
  };
  if (!rosters.home.size || !rosters.away.size) return false;
  const valid = (side, player) => !player || rosters[side]?.has(repairPlayerText(player));
  const sideFor = (event, fallback = "home") => (
    event?.side === "away" || event?.teamId === match.awayId ? "away" : fallback
  );

  if ((checkpoint.homeReds || []).some((event) => !valid("home", event.player))) return false;
  if ((checkpoint.awayReds || []).some((event) => !valid("away", event.player))) return false;
  if ((checkpoint.shootout || []).some((attempt) => !valid(attempt.side === "away" ? "away" : "home", attempt.player))) return false;
  if (["home", "away"].some((side) => (
    Object.keys(checkpoint.playerRatings?.[side] || {}).some((player) => !valid(side, player))
  ))) return false;
  const invalidManagementHistory = (management) => {
    if (!management?.teamId) return false;
    const side = management.teamId === match.awayId ? "away" : "home";
    return (management.history || []).some((change) => (
      !valid(side, change.outgoingName) || !valid(side, change.incomingName)
    ));
  };
  if (
    invalidManagementHistory(checkpoint.managerSubstitutions)
    || invalidManagementHistory(checkpoint.oppositionManagement)
  ) return false;
  return !(checkpoint.feed || []).some((event) => {
    const side = sideFor(event, event?.side === "away" ? "away" : "home");
    if (event.ownGoal) {
      const defendingSide = side === "home" ? "away" : "home";
      return !valid(defendingSide, event.ownGoalBy);
    }
    const names = [
      event.player,
      event.playerIn,
      event.playerOut,
      event.metadata?.scorer,
    ].filter(Boolean);
    return names.some((name) => !valid(side, name));
  });
}

function readLiveMatchCheckpoint(match) {
  const checkpoint = readStoredLiveMatchCheckpoint();
  if (
    !checkpoint
    || checkpoint.version !== 1
    || checkpoint.scope !== liveMatchCheckpointScope()
    || checkpoint.matchId !== match?.id
    || Number(checkpoint.engineSeed) !== Number(match?.result?.engineSeed)
    || match?.result?.revealed
  ) return null;
  if (!checkpointUsesCurrentRosters(checkpoint, match)) {
    clearLiveMatchCheckpoint(match.id);
    return null;
  }
  return checkpoint;
}

function clearLiveMatchCheckpoint(matchId = null) {
  const checkpoint = readStoredLiveMatchCheckpoint();
  if (!matchId || !checkpoint || checkpoint.matchId === matchId) {
    localStorage.removeItem(LIVE_MATCH_CHECKPOINT_STORAGE_KEY);
  }
}

function saveLiveMatchCheckpoint() {
  if (!livePlayback || livePlayback.ending) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  if (!match?.result || match.result.revealed) return;
  const displayedMinute = displayedLiveMinute(livePlayback);
  const activeHighlight = match2dState?.activeHighlight;
  const checkpoint = {
    version: 1,
    scope: liveMatchCheckpointScope(),
    matchId: match.id,
    engineSeed: match.result.engineSeed,
    updatedAt: Date.now(),
    displayedMinute,
    minute: Number(livePlayback.minute) || displayedMinute,
    maxMinute: livePlayback.maxMinute,
    phase: livePlayback.phase,
    speed: livePlayback.speed,
    homeScore: livePlayback.homeScore,
    awayScore: livePlayback.awayScore,
    homeReds: livePlayback.homeReds || [],
    awayReds: livePlayback.awayReds || [],
    feed: livePlayback.feed || [],
    commentaryFeed: livePlayback.commentaryFeed || [],
    playerRatings: livePlayback.playerRatings || null,
    ratingEventIds: [...(livePlayback.ratingEventIds || [])],
    ratingActionIds: [...(livePlayback.ratingActionIds || [])],
    managerSubstitutions: livePlayback.managerSubstitutions || null,
    oppositionManagement: livePlayback.oppositionManagement || null,
    penaltyScoreCorrections: livePlayback.penaltyScoreCorrections || { home: 0, away: 0 },
    cursor: match2dState?.cursor ?? -1,
    activeHighlightIndex: activeHighlight?.timelineIndex ?? null,
    actionIndex: match2dState?.actionIndex ?? 0,
    playedEventKeys: [...(match2dState?.playedEventKeys || [])],
    shootoutIndex: livePlayback.shootoutIndex || 0,
    shootoutStep: livePlayback.shootoutStep || "setup",
    shootout: livePlayback.shootout || [],
    penaltyHomeScore: livePlayback.penaltyHomeScore || 0,
    penaltyAwayScore: livePlayback.penaltyAwayScore || 0,
  };
  try {
    localStorage.setItem(LIVE_MATCH_CHECKPOINT_STORAGE_KEY, JSON.stringify(checkpoint));
  } catch {
    // A live match remains playable if browser storage is unavailable.
  }
}

function settleInterruptedLocalMatches() {
  let settled = false;
  const checkpoint = readStoredLiveMatchCheckpoint();
  state.rounds.forEach((round) => {
    (round || []).forEach((match) => {
      if (revealOrphanedSimulatedResult(match)) {
        settled = true;
        return;
      }
      if (match.result?.engineVersion === 2 && !match.result.revealed) {
        if (
          checkpoint?.scope === "standard"
          && checkpoint.matchId === match.id
          && Number(checkpoint.engineSeed) === Number(match.result.engineSeed)
        ) {
          if (checkpointUsesCurrentRosters(checkpoint, match)) return;
          clearLiveMatchCheckpoint(match.id);
          return;
        }
        match.result.revealed = true;
        settled = true;
      }
    });
  });
  if (!settled) return false;
  state.rounds.forEach((round, roundIndex) => {
    if (round?.length && round.every((match) => match.result?.revealed)) buildNextRound(roundIndex);
  });
  saveState();
  return true;
}

const interruptedLocalMatchSettled = settleInterruptedLocalMatches();

function teamById(id) {
  const originalTeam = TEAM_BY_ID.get(id);
  const team = originalTeam && state?.customTournament && originalTeam.retroWorldCup
    ? { ...originalTeam, name: `${originalTeam.name} ${originalTeam.retroYear}` }
    : originalTeam;
  const override = state?.customTournament?.abilityOverrides?.[id];
  if (!team || !override) return team;
  const simulationRatings = { ...team.simulationRatings };
  ["overall", "attack", "midfield", "defence", "goalkeeper", "squadDepth", "experience", "penalties", "discipline"]
    .forEach((key) => {
      if (Number.isFinite(Number(override[key]))) simulationRatings[key] = simulationClamp(Number(override[key]), 1, 99);
    });
  return {
    ...team,
    rating: simulationRatings.overall,
    strength: simulationRatings.overall,
    simulationRatings,
  };
}
