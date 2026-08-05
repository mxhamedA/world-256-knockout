function playerProfilesForTeam(team) {
  const historicalTournament = isRetroSimulatorState() || state.legacyTournament === true;
  const officialRetroSquad = Boolean(team.retroWorldCup && team.playerProfiles?.length);
  const canonicalCurrentTeam = team.retroWorldCup || historicalTournament || state?.premierLeagueSeason || state?.uclSeason || team.uclClub || team.customTeam
    ? null
    : TEAMS.find((candidate) => candidate.name === team.name) || null;
  const rosterTeam = canonicalCurrentTeam || team;
  const rosterPlayers = rosterTeam.players || [];
  const rosterProfiles = rosterTeam.playerProfiles || [];
  const useRealPlayers = Boolean((state.settings.realNames || officialRetroSquad) && rosterPlayers.length);
  const realPlayersOnly = state.settings.realPlayersOnly !== false;
  const playerMode = `current-roster-3:${useRealPlayers ? "real" : "generated"}:${realPlayersOnly ? "real-only" : "all"}`;
  const cacheKey = `${team.id}:${playerMode}`;
  if (!playerProfileCache.has(cacheKey)) {
    let inputs = useRealPlayers
      ? rosterProfiles.length
        ? [
          ...rosterProfiles.map((profile) => ({ ...profile })),
          ...rosterPlayers.filter((name) => !rosterProfiles.some((profile) => profile.name === name)),
        ]
        : [...rosterPlayers]
      : generatedPlayers(team);
    if (realPlayersOnly) inputs = inputs.filter((entry) => !FICTIONAL_PLAYER_NAMES.has(typeof entry === "string" ? entry : entry.name));
    if (team.name === "Moldova" && !inputs.some((entry) => (typeof entry === "string" ? entry : entry.name) === "Amenyah")) {
      inputs = [{ name: "Amenyah", position: "ST" }, ...inputs];
    }
    if (team.name === "Jersey" && !inputs.some((entry) => (typeof entry === "string" ? entry : entry.name) === "ChrisMD")) {
      inputs = [{ name: "ChrisMD", position: "ST" }, ...inputs];
    }
    if (team.name === "Guernsey" && !inputs.some((entry) => (typeof entry === "string" ? entry : entry.name) === "Wroetoshaw")) {
      inputs = [{ name: "Wroetoshaw", position: "ST" }, ...inputs];
    }
    let profiles = buildPlayerProfiles(team, inputs, !useRealPlayers);
    if (state?.premierLeagueSeason) {
      const shirtNumberByName = new Map(
        rosterProfiles.map((profile, index) => [
          profile.name,
          Number.isInteger(profile.number) ? profile.number : index + 1,
        ]),
      );
      profiles = profiles.map((profile, index) => ({
        ...profile,
        number: shirtNumberByName.get(profile.name) || index + 1,
      }));
    }
    if (useRealPlayers && !officialRetroSquad) {
      const requiredPositions = ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"];
      const requiredGroups = requiredPositions.reduce((counts, position) => {
        const group = possessionPositionGroup(position);
        counts[group] = (counts[group] || 0) + 1;
        return counts;
      }, {});
      const currentGroups = profiles.reduce((counts, profile) => {
        const group = possessionPositionGroup(profile.position);
        counts[group] = (counts[group] || 0) + 1;
        return counts;
      }, {});
      const usedNames = new Set(profiles.map((profile) => profile.name));
      const generatedNames = generatedPlayers(team).filter((name) => !usedNames.has(name));
      const supplements = [];
      Object.entries(requiredGroups).forEach(([group, required]) => {
        const groupSlots = requiredPositions.filter((position) => possessionPositionGroup(position) === group);
        for (let index = currentGroups[group] || 0; index < required; index += 1) {
          const name = generatedNames.shift() || `${team.name} Player ${profiles.length + supplements.length + 1}`;
          supplements.push({ name, position: groupSlots[index % groupSlots.length] });
        }
      });
      if (supplements.length) profiles = [...profiles, ...buildPlayerProfiles(team, supplements, true)];
    }
    if (officialRetroSquad) {
      const officialNames = new Set(team.players);
      profiles = profiles.filter((profile) => officialNames.has(profile.name));
    }
    profiles = profiles.map((profile, index) => {
      const preferredFoot = profile.preferredFoot
        || PREFERRED_FOOT_OVERRIDES.get(repairPlayerText(profile.name))
        || (TWO_FOOTED_PENALTY_TAKERS.has(profile.name) ? "both" : LEFT_FOOTED_PENALTY_TAKERS.has(profile.name) ? "left" : null);
      const draftedPosition = team.positionSuitability?.find((entry) => entry.player === profile.name);
      if (!draftedPosition) return { ...profile, preferredFoot };
      const position = draftedPosition.slot;
      const overall = draftedPosition.overall ?? profile.overall;
      return {
        ...profile,
        position,
        overall,
        finishing: position === "GK" ? 5 : draftedPosition.finishing ?? profile.finishing,
        pace: draftedPosition.pace ?? profile.pace,
        shooting: position === "GK" ? 5 : draftedPosition.shooting ?? draftedPosition.finishing ?? profile.shooting,
        passing: draftedPosition.passing ?? profile.passing,
        dribbling: draftedPosition.dribbling ?? profile.dribbling,
        defending: draftedPosition.defending ?? profile.defending,
        physical: draftedPosition.physical ?? profile.physical,
        goalkeeping: draftedPosition.goalkeeping ?? profile.goalkeeping,
        attackingRole: roleForProfile(position, index),
        penaltyTaker: position === "GK" ? false : profile.penaltyTaker,
        expectedMinutesShare: expectedMinutesForProfile(roleForProfile(position, index), position, index),
        preferredFoot,
      };
    });
    playerProfileCache.set(cacheKey, profiles);
  }
  const profiles = playerProfileCache.get(cacheKey);
  const managerLineup = retroManagerLineupForTeam(team);
  const liveManagement = retroLiveTeamManagement(team.id);
  if (!managerLineup && !liveManagement) {
    team.liveMissingSlotIndexes = [];
    team.liveMissingPlayerNames = [];
    team.liveOrderedStarterNames = [];
    return profiles;
  }
  const activeStarterNumbers = liveManagement?.activeStarters?.length === 11
    ? liveManagement.activeStarters
    : managerLineup?.starters;
  if (!activeStarterNumbers?.length) return profiles;
  const missingNumbers = new Set(Object.values(liveManagement?.missingSlots || {}).map((entry) => entry.number));
  team.liveMissingSlotIndexes = Object.keys(liveManagement?.missingSlots || {}).map(Number);
  team.liveMissingPlayerNames = Object.values(liveManagement?.missingSlots || {}).map((entry) => entry.name);
  team.liveOrderedStarterNames = activeStarterNumbers.map((number) => (
    profiles.find((profile) => profile.number === number)?.name || null
  ));
  const starterNumbers = new Set(activeStarterNumbers.filter((number) => !missingNumbers.has(number)));
  team.selectedFormation = liveManagement?.formation || managerLineup?.formation || team.selectedFormation;
  return profiles
    .map((profile) => ({
      ...profile,
      startingXI: starterNumbers.has(profile.number),
      expectedMinutesShare: starterNumbers.has(profile.number) ? 0.98 : 0.08,
    }))
    .sort((left, right) => (
      Number(starterNumbers.has(right.number)) - Number(starterNumbers.has(left.number))
      || activeStarterNumbers.indexOf(left.number) - activeStarterNumbers.indexOf(right.number)
    ));
}

function canonicalCurrentRosterNames(team, outfieldOnly = false) {
  const rosterTeam = TEAMS.find((candidate) => candidate.name === team?.name) || team;
  const profiles = Array.isArray(rosterTeam?.playerProfiles) ? rosterTeam.playerProfiles : [];
  const resolvedProfiles = profiles.length
    ? profiles
    : buildPlayerProfiles(rosterTeam, rosterTeam?.players || [], false);
  const names = resolvedProfiles.length
    ? resolvedProfiles
      .filter((profile) => !outfieldOnly || profile.position !== "GK")
      .map((profile) => profile.name)
    : (rosterTeam?.players || []);
  return [...new Set(names.map(repairPlayerText).filter(Boolean))];
}

function repairDefaultKnockoutRosterResults(candidate = state) {
  if (
    !candidate
    || candidate.retroWorldCup
    || candidate.legacyTournament
    || !Array.isArray(candidate.rounds)
  ) return false;

  let repaired = false;
  const replaceInvalid = (entry, key, validNames, matchId, field = "player") => {
    if (!entry || !validNames.length || validNames.includes(repairPlayerText(entry[field]))) return;
    entry[field] = validNames[stableHash(`${matchId}:${key}`) % validNames.length];
    repaired = true;
  };

  candidate.rounds.flat().forEach((match) => {
    if (!match?.result) return;
    const teams = {
      home: TEAM_BY_ID.get(match.homeId),
      away: TEAM_BY_ID.get(match.awayId),
    };
    if (!teams.home || !teams.away || teams.home.retroWorldCup || teams.away.retroWorldCup) return;
    const rosters = {
      home: canonicalCurrentRosterNames(teams.home),
      away: canonicalCurrentRosterNames(teams.away),
    };
    const outfield = {
      home: canonicalCurrentRosterNames(teams.home, true),
      away: canonicalCurrentRosterNames(teams.away, true),
    };

    ["home", "away"].forEach((side) => {
      const defendingSide = side === "home" ? "away" : "home";
      (match.result[`${side}Events`] || []).forEach((event, index) => {
        if (event.ownGoal) {
          replaceInvalid(event, `${side}:own-goal:${index}`, outfield[defendingSide], match.id, "ownGoalBy");
          const expectedScorer = `${event.ownGoalBy} (OG)`;
          if (event.scorer !== expectedScorer) {
            event.scorer = expectedScorer;
            repaired = true;
          }
          return;
        }
        replaceInvalid(event, `${side}:goal:${index}`, outfield[side], match.id, "scorer");
        if (event.assist) {
          replaceInvalid(event, `${side}:assist:${index}`, outfield[side], match.id, "assist");
          if (event.assist === event.scorer) {
            const eligibleAssisters = outfield[side].filter((name) => name !== event.scorer);
            event.assist = eligibleAssisters.length
              ? eligibleAssisters[stableHash(`${match.id}:${side}:assist-alternative:${index}`) % eligibleAssisters.length]
              : null;
            repaired = true;
          }
        }
      });
    });

    ["redCards", "injuries"].forEach((collection) => {
      (match.result[collection] || []).forEach((event, index) => {
        const side = event.side === "away" || event.teamId === match.awayId ? "away" : "home";
        replaceInvalid(event, `${collection}:${side}:${index}`, outfield[side], match.id);
      });
    });
    const absences = removeImpossiblePlayerAbsenceEvents(
      match.result.redCards || [],
      match.result.injuries || [],
    );
    if (
      absences.redCards.length !== (match.result.redCards || []).length
      || absences.injuries.length !== (match.result.injuries || []).length
    ) {
      match.result.redCards = absences.redCards;
      match.result.injuries = absences.injuries;
      repaired = true;
    }
    ["home", "away"].forEach((side) => {
      const key = `${side}Events`;
      const currentEvents = match.result[key] || [];
      const repairedEvents = removeDismissedPlayersFromFutureGoals(
        currentEvents,
        side,
        match.result.redCards || [],
        match,
        match.result.injuries || [],
      );
      if (repairedEvents.some((event, index) => event !== currentEvents[index])) repaired = true;
      match.result[key] = repairedEvents;
    });
    (match.result.shootout || []).forEach((attempt, index) => {
      const side = attempt.side === "away" ? "away" : "home";
      replaceInvalid(attempt, `shootout:${side}:${index}`, outfield[side], match.id);
    });
    (match.result.substitutions || []).forEach((substitution, index) => {
      const side = substitution.side === "away" || substitution.teamId === match.awayId
        ? "away"
        : "home";
      replaceInvalid(substitution, `substitution:${side}:${index}:in`, rosters[side], match.id, "playerIn");
      replaceInvalid(substitution, `substitution:${side}:${index}:out`, rosters[side], match.id, "playerOut");
      if (substitution.player) {
        replaceInvalid(substitution, `substitution:${side}:${index}:player`, rosters[side], match.id);
      }
    });
    ["home", "away"].forEach((side) => {
      const ratings = match.result.playerRatings?.[side];
      if (!ratings || typeof ratings !== "object") return;
      Object.entries(ratings).forEach(([player, rating]) => {
        if (rosters[side].includes(repairPlayerText(player))) return;
        const replacement = rosters[side][stableHash(`${match.id}:rating:${side}:${player}`) % rosters[side].length];
        if (replacement && !ratings[replacement]) ratings[replacement] = rating;
        delete ratings[player];
        repaired = true;
      });
    });
  });
  return repaired;
}

if (repairDefaultKnockoutRosterResults()) saveState();

function scorerPool(team, excludedPlayers = []) {
  const excluded = new Set(excludedPlayers);
  return playerProfilesForTeam(team)
    .map((profile) => profile.name)
    .filter((player) => !excluded.has(player));
}

function shootoutPosition(team, profile) {
  return team.positionSuitability?.find((entry) => entry.player === profile.name)?.slot || profile.position;
}

function shootoutPositionPriority(position) {
  if (["ST", "CF", "SS"].includes(position)) return 0;
  if (["LW", "RW", "LF", "RF", "CAM", "AM", "LM", "RM"].includes(position)) return 1;
  if (["CM", "LCM", "RCM"].includes(position)) return 2;
  if (["CDM", "DM"].includes(position)) return 3;
  if (["LB", "RB", "LWB", "RWB"].includes(position)) return 4;
  if (["CB", "SW"].includes(position)) return 5;
  if (position === "GK") return 99;
  return 6;
}

function retroShootoutActiveNames(team) {
  if (!team?.retroWorldCup || ![1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2026].includes(Number(retroTournament?.year))) {
    return null;
  }
  const match = selectedMatch();
  const management = retroLiveTeamManagement(team.id)
    || match?.result?.retroFinalManagement?.[team.id];
  const squad = retroManagerSquadForTeam(team);
  if (management?.activeStarters?.length && squad?.players?.length) {
    const missingNumbers = new Set(Object.values(management.missingSlots || {}).map((entry) => entry.number));
    return management.activeStarters
      .filter((number) => !missingNumbers.has(number))
      .map((number) => squad.players.find((player) => player.number === number)?.name)
      .filter(Boolean);
  }
  const managedLineup = retroManagerLineupForTeam(team);
  if (managedLineup?.starters?.length && squad?.players?.length) {
    return managedLineup.starters
      .map((number) => squad.players.find((player) => player.number === number)?.name)
      .filter(Boolean);
  }
  return RETRO_WORLD_CUP_ENGINE.startingXI(Number(retroTournament.year), team.name)
    .players
    .map((player) => player.name);
}

function shootoutUnavailablePlayers(result, side) {
  return [...new Set([
    ...(result?.suspendedPlayers?.[side] || []),
    ...(result?.injuries || [])
      .filter((injury) => injury.side === side)
      .map((injury) => injury.player),
  ])];
}

function shootoutTakerPool(team, unavailablePlayers = [], dismissedPlayers = []) {
  const unavailable = new Set(unavailablePlayers);
  const dismissed = new Set(dismissedPlayers);
  const excluded = new Set([...unavailable, ...dismissed]);
  const legacyLineup = team.id?.startsWith("legacy-") && Array.isArray(team.positionSuitability)
    ? team.positionSuitability
      .filter((entry) => entry?.player && !excluded.has(entry.player))
      .map((entry, index) => ({
        profile: {
          name: entry.player,
          position: entry.slot,
          finishing: entry.finishing ?? entry.overall ?? team.rating,
          overall: entry.overall ?? team.rating,
          penaltyTaker: entry.slot !== "GK" && index === 0,
        },
        index,
        priority: shootoutPositionPriority(entry.slot),
      }))
    : null;
  let candidates = legacyLineup?.length
    ? legacyLineup
    : playerProfilesForTeam(team)
      .filter((profile) => !excluded.has(profile.name))
      .map((profile, index) => ({
        profile,
        index,
        priority: shootoutPositionPriority(shootoutPosition(team, profile)),
      }));
  const retroActiveNames = new Set(retroShootoutActiveNames(team) || []);
  if (retroActiveNames.size) {
    candidates = candidates.filter(({ profile }) => retroActiveNames.has(profile.name));
  }
  const markedStarters = candidates.filter(({ profile }) => profile.startingXI);
  const eligible = markedStarters.length ? markedStarters : candidates;
  const fallback = candidates.length
    ? candidates
    : Array.from({ length: 11 }, (_, index) => ({
      profile: {
        name: `${team.name || "Team"} Player ${index + 1}`,
        position: "CM",
        finishing: team.rating || 60,
        overall: team.rating || 60,
        penaltyTaker: index === 0,
      },
      index,
      priority: shootoutPositionPriority("CM"),
    }));
  const pool = eligible.length ? eligible : fallback;
  const outfield = pool.filter(({ profile }) => profile.position !== "GK");
  const goalkeepers = pool.filter(({ profile }) => profile.position === "GK");
  return [...outfield, ...goalkeepers]
    .map((profile, index) => ({
      profile: profile.profile,
      index,
      priority: profile.priority,
    }))
    .sort((left, right) => (
      left.priority - right.priority
      || Number(right.profile.penaltyTaker) - Number(left.profile.penaltyTaker)
      || right.profile.finishing - left.profile.finishing
      || right.profile.overall - left.profile.overall
      || left.index - right.index
    ))
    .map(({ profile }) => profile.name);
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

function matchGoalRandom(randomSeed, matchId, side, phase = "regulation") {
  return mulberry32(randomSeed + stableHash(`${matchId}-${side}-${phase}-goals`));
}

function scoringRunBrake() {
  // Tournament totals are never capped; repeat scoring is controlled per match.
  return 1;
}

function selectWeightedProfile(profiles, random, weightForProfile) {
  const weights = profiles.map((profile) => Math.max(0, weightForProfile(profile)));
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  if (weightTotal <= 0) return profiles[0];
  let roll = random() * weightTotal;
  for (let index = 0; index < profiles.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return profiles[index];
  }
  return profiles[profiles.length - 1];
}

function onPitchPlayerProfiles(team) {
  const squadProfiles = playerProfilesForTeam(team);
  const markedStarters = squadProfiles.filter((profile) => profile.startingXI);
  const starters = markedStarters.length ? markedStarters : squadProfiles;
  if (!state?.uclSeason || starters.length !== 11) return starters;
  const match = selectedMatch();
  if (!match || ![match.homeId, match.awayId].includes(team.id)) return starters;
  const groupFor = (position) => {
    if (position === "GK") return "goalkeeper";
    if (["CB", "LB", "RB", "LWB", "RWB"].includes(position)) return "defence";
    if (["CDM", "CM", "CAM", "LM", "RM", "AM"].includes(position)) return "midfield";
    return "attack";
  };
  const rotationRandom = mulberry32(
    Number(state.drawSeed || 1)
    + stableHash(`${match.id}:${team.id}:ucl-lineup-rotation`),
  );
  const rotated = new Map(starters.map((profile) => [profile.name, profile]));
  const rotationTarget = stableHash(`${match.id}:${team.id}:ucl-rotation-count`) % 3;
  const replacementPool = squadProfiles
    .filter((profile) => profile.selectionEligible !== false
      && !rotated.has(profile.name)
      && profile.position !== "GK"
      && profile.expectedMinutesShare >= 0.2)
    .map((profile) => ({
      profile,
      score: profile.expectedMinutesShare * 4 + profile.overall / 25 + rotationRandom(),
    }))
    .sort((left, right) => right.score - left.score);
  let replacements = 0;
  for (const candidate of replacementPool) {
    if (replacements >= rotationTarget) break;
    const group = groupFor(candidate.profile.position);
    const replaceable = [...rotated.values()]
      .filter((profile) => profile.position !== "GK" && groupFor(profile.position) === group)
      .map((profile) => ({
        profile,
        restScore: (1 - profile.expectedMinutesShare) * 3 + rotationRandom(),
      }))
      .sort((left, right) => right.restScore - left.restScore)[0]?.profile;
    if (!replaceable) continue;
    rotated.delete(replaceable.name);
    rotated.set(candidate.profile.name, candidate.profile);
    replacements += 1;
  }
  return [...rotated.values()];
}

function eligibleScorerProfiles(team, minute, cards = [], suspendedPlayers = []) {
  const dismissed = new Set(
    cards.filter((card) => card.minute <= minute).map((card) => card.player),
  );
  const unavailable = new Set([...suspendedPlayers, ...dismissed]);
  const activeProfiles = onPitchPlayerProfiles(team);
  const profiles = activeProfiles.filter((profile) => (
    !unavailable.has(profile.name)
    && profile.position !== "GK"
    && minute <= Math.max(25, profile.expectedMinutesShare * 120)
  ));
  return profiles.length
    ? profiles
    : activeProfiles.filter((profile) => !unavailable.has(profile.name) && profile.position !== "GK");
}

function weightedScorer(
  team,
  random,
  excludedPlayers = [],
  inMatchGoals = new Map(),
  goalType = "openPlay",
  minute = 60,
  opponent = null,
  tournamentScoring = { teamGoals: 0, playerGoals: new Map() },
) {
  const squadProfiles = playerProfilesForTeam(team);
  const profiles = preferredPenaltyScorerProfiles(
    team,
    eligibleScorerProfiles(team, goalType === "penalty" ? 1 : minute, [], excludedPlayers),
    goalType,
  );
  return selectWeightedProfile(profiles, random, (profile) => scorerWeightForGoalType(
    profile,
    goalType,
    inMatchGoals.get(profile.name) || 0,
    {
      team,
      opponent,
      squadProfiles,
      seasonSeed: state?.drawSeed,
      tournamentTeamGoals: tournamentScoring.teamGoals || 0,
      tournamentPlayerGoals: (tournamentScoring.playerGoals?.get(profile.name) || 0)
        + (inMatchGoals.get(profile.name) || 0),
    },
  )).name;
}

function availableScorer(
  team,
  minute,
  cards,
  random,
  suspendedPlayers = [],
  inMatchGoals = new Map(),
  goalType = "openPlay",
  opponent = null,
  tournamentScoring = { teamGoals: 0, playerGoals: new Map() },
) {
  const squadProfiles = playerProfilesForTeam(team);
  const profiles = preferredPenaltyScorerProfiles(
    team,
    eligibleScorerProfiles(team, goalType === "penalty" ? 1 : minute, cards, suspendedPlayers),
    goalType,
  );
  return selectWeightedProfile(profiles, random, (profile) => scorerWeightForGoalType(
    profile,
    goalType,
    inMatchGoals.get(profile.name) || 0,
    {
      team,
      opponent,
      squadProfiles,
      seasonSeed: state?.drawSeed,
      tournamentTeamGoals: tournamentScoring.teamGoals || 0,
      tournamentPlayerGoals: (tournamentScoring.playerGoals?.get(profile.name) || 0)
        + (inMatchGoals.get(profile.name) || 0),
    },
  )).name;
}

function shuffledOutcomes(goals, kicks, random, forceLastGoal = false, forceLastMiss = false) {
  const outcomes = shuffle([
    ...Array(goals).fill(true),
    ...Array(Math.max(0, kicks - goals)).fill(false),
  ], random);
  if (forceLastGoal && goals > 0 && !outcomes[kicks - 1]) {
    const goalIndex = outcomes.indexOf(true);
    [outcomes[goalIndex], outcomes[kicks - 1]] = [outcomes[kicks - 1], outcomes[goalIndex]];
  }
  if (forceLastMiss && goals < kicks && outcomes[kicks - 1]) {
    const missIndex = outcomes.indexOf(false);
    [outcomes[missIndex], outcomes[kicks - 1]] = [outcomes[kicks - 1], outcomes[missIndex]];
  }
  return outcomes;
}

function missedPenaltyVisual(side, team, player, round, direction, keeperDive) {
  const visualSeed = stableHash(`${side}-${team.id}-${player}-${round}-penalty-miss`);
  if (visualSeed % 100 < 30) {
    return {
      direction: `wide-${visualSeed % 2 === 0 ? "left" : "right"}`,
      keeperDive,
      missType: "wide",
    };
  }
  if (direction === "centre") {
    const savedDirection = visualSeed % 2 === 0 ? "left" : "right";
    return { direction: savedDirection, keeperDive: savedDirection, missType: "save" };
  }
  return { direction, keeperDive: direction, missType: "save" };
}

function distinctKeeperDiveForGoal(direction, keeperDive, variation = 0) {
  if (direction === "centre") return keeperDive === "centre"
    ? (Math.abs(variation) % 2 === 0 ? "left" : "right")
    : keeperDive;
  if (keeperDive !== direction) return keeperDive;
  const alternatives = ["left", "centre", "right"].filter((candidate) => candidate !== direction);
  return alternatives[Math.abs(variation) % alternatives.length];
}

function createShootoutSequence(home, away, penalties, random, cards = [], suspendedPlayers = { home: [], away: [] }) {
  const rounds = Math.max(5, penalties.home, penalties.away);
  const homeWon = penalties.home > penalties.away;
  const homeOutcomes = shuffledOutcomes(penalties.home, rounds, random, homeWon, !homeWon);
  const awayOutcomes = shuffledOutcomes(penalties.away, rounds, random, !homeWon, homeWon);
  const pools = {
    home: shootoutTakerPool(home, [
      ...(suspendedPlayers.home || []),
    ], cards.filter((card) => card.side === "home").map((card) => card.player)),
    away: shootoutTakerPool(away, [
      ...(suspendedPlayers.away || []),
    ], cards.filter((card) => card.side === "away").map((card) => card.player)),
  };
  const directions = ["left", "centre", "right"];
  const sequence = [];

  for (let round = 0; round < rounds; round += 1) {
    for (const side of ["home", "away"]) {
      const scored = side === "home" ? homeOutcomes[round] : awayOutcomes[round];
      let direction = directions[Math.floor(random() * directions.length)];
      let keeperDive = directions[Math.floor(random() * directions.length)];
      const team = side === "home" ? home : away;
      const player = pools[side][round % pools[side].length];
      let missType = null;
      if (!scored) {
        ({ direction, keeperDive, missType } = missedPenaltyVisual(
          side,
          team,
          player,
          round + 1,
          direction,
          keeperDive,
        ));
      } else {
        keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, round + Number(side === "away"));
      }
      sequence.push({
        side,
        player,
        foot: preferredPenaltyFoot(team, player, random),
        direction,
        keeperDive,
        scored,
        missType,
        round: round + 1,
        target: penaltyDirectionTarget(direction, random),
      });
    }
  }
  return sequence;
}

function createShootoutAttempt(side, team, player, scored, round, random) {
  const directions = ["left", "centre", "right"];
  let direction = directions[Math.floor(random() * directions.length)];
  let keeperDive = directions[Math.floor(random() * directions.length)];
  let missType = null;
  if (!scored) {
    ({ direction, keeperDive, missType } = missedPenaltyVisual(
      side,
      team,
      player,
      round,
      direction,
      keeperDive,
    ));
  } else {
    keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, round + Number(side === "away"));
  }
  return {
    side,
    player,
    foot: preferredPenaltyFoot(team, player, random),
    direction,
    keeperDive,
    scored,
    missType,
    round,
    target: penaltyDirectionTarget(direction, random),
  };
}

function createInteractiveShootoutSequence(match, controlledSide, startRound = 1, roundCount = 60) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const result = match.result;
  const random = mulberry32(state.drawSeed + stableHash(`${match.id}-interactive-shootout-${startRound}`));
  const dismissed = {
    home: (result.redCards || []).filter((card) => card.side === "home").map((card) => card.player),
    away: (result.redCards || []).filter((card) => card.side === "away").map((card) => card.player),
  };
  const pools = {
    home: shootoutTakerPool(home, shootoutUnavailablePlayers(result, "home"), dismissed.home),
    away: shootoutTakerPool(away, shootoutUnavailablePlayers(result, "away"), dismissed.away),
  };
  const conversion = {
    home: shootoutConversionChance(home, away, state.settings.upset),
    away: shootoutConversionChance(away, home, state.settings.upset),
  };
  const sequence = [];
  for (let round = startRound; round < startRound + roundCount; round += 1) {
    for (const side of ["home", "away"]) {
      const team = side === "home" ? home : away;
      const player = pools[side][(round - 1) % pools[side].length];
      const roundConversion = shootoutRoundConversionChance(conversion[side], round);
      if (side !== controlledSide) {
        const shotTarget = STANDARD_PENALTY_TARGETS[Math.floor(random() * STANDARD_PENALTY_TARGETS.length)];
        sequence.push({
          side,
          player,
          foot: preferredPenaltyFoot(team, player, random),
          direction: "centre",
          keeperDive: "centre",
          goalkeeperTarget: null,
          shotTarget,
          conversionChance: roundConversion,
          target: null,
          scored: null,
          missType: null,
          interactive: true,
          interactionRole: "keeper",
          round,
        });
        continue;
      }
      const goalkeeperTarget = STANDARD_PENALTY_TARGETS[Math.floor(random() * STANDARD_PENALTY_TARGETS.length)];
      sequence.push({
        side,
        player,
        foot: preferredPenaltyFoot(team, player, random),
        direction: "centre",
        keeperDive: onlinePenaltyDirection(goalkeeperTarget),
        goalkeeperTarget,
        conversionChance: roundConversion,
        outcomeRoll: random(),
        target: null,
        scored: null,
        missType: null,
        interactive: true,
        interactionRole: "taker",
        round,
      });
    }
  }
  return sequence;
}

function simulatePenaltyShootout(
  home,
  away,
  random,
  cards = [],
  suspendedPlayers = { home: [], away: [] },
  modeName = "balanced",
) {
  const dismissed = {
    home: cards.filter((card) => card.side === "home").map((card) => card.player),
    away: cards.filter((card) => card.side === "away").map((card) => card.player),
  };
  const pools = {
    home: shootoutTakerPool(home, suspendedPlayers.home || [], dismissed.home),
    away: shootoutTakerPool(away, suspendedPlayers.away || [], dismissed.away),
  };
  const conversion = {
    home: shootoutConversionChance(home, away, modeName),
    away: shootoutConversionChance(away, home, modeName),
  };
  const penalties = { home: 0, away: 0 };
  const sequence = [];

  const takeKick = (side, round) => {
    const team = side === "home" ? home : away;
    const pool = pools[side];
    const player = pool[(round - 1) % pool.length];
    const scored = random() < shootoutRoundConversionChance(conversion[side], round);
    if (scored) penalties[side] += 1;
    sequence.push(createShootoutAttempt(side, team, player, scored, round, random));
  };

  for (let round = 1; round <= 5; round += 1) {
    if (standardShootoutWinner({
      homeScore: penalties.home,
      awayScore: penalties.away,
      homeKicks: sequence.filter((attempt) => attempt.side === "home").length,
      awayKicks: sequence.filter((attempt) => attempt.side === "away").length,
    })) break;
    takeKick("home", round);
    if (standardShootoutWinner({
      homeScore: penalties.home,
      awayScore: penalties.away,
      homeKicks: sequence.filter((attempt) => attempt.side === "home").length,
      awayKicks: sequence.filter((attempt) => attempt.side === "away").length,
    })) break;
    takeKick("away", round);
  }
  let round = 6;
  while (penalties.home === penalties.away && round <= 20) {
    takeKick("home", round);
    takeKick("away", round);
    round += 1;
  }

  // A 15-round tie is extraordinarily rare; settle it with one final quality-weighted pair.
  if (penalties.home === penalties.away) {
    const homeFavoured = random() < simulationClamp(
      0.5 + (calculateShootoutRating(home) - calculateShootoutRating(away)) * 0.005,
      0.38,
      0.62,
    );
    const winnerSide = homeFavoured ? "home" : "away";
    const loserSide = homeFavoured ? "away" : "home";
    const finalRound = 21;
    const loserTeam = loserSide === "home" ? home : away;
    const winnerTeam = winnerSide === "home" ? home : away;
    const loserPlayer = pools[loserSide][(finalRound - 1) % pools[loserSide].length];
    const winnerPlayer = pools[winnerSide][(finalRound - 1) % pools[winnerSide].length];
    sequence.push(createShootoutAttempt(loserSide, loserTeam, loserPlayer, false, finalRound, random));
    sequence.push(createShootoutAttempt(winnerSide, winnerTeam, winnerPlayer, true, finalRound, random));
    penalties[winnerSide] += 1;
  }

  return { penalties, sequence };
}

function chooseAssist(team, scorer, minute, cards, random, suspendedPlayers, goalType) {
  const assistChance = goalType === "openPlay" ? 0.68 : goalType === "setPiece" ? 0.42 : 0;
  if (random() >= assistChance) return null;
  const candidates = eligibleScorerProfiles(team, minute, cards, suspendedPlayers)
    .filter((profile) => profile.name !== scorer && profile.position !== "GK");
  if (!candidates.length) return null;
  const positionWeight = {
    CAM: 1.7,
    AM: 1.7,
    LW: 1.45,
    RW: 1.45,
    LM: 1.35,
    RM: 1.35,
    CM: 1.2,
    ST: 0.82,
    CF: 0.9,
    SS: 1,
    CDM: 0.68,
    DM: 0.68,
    LB: 0.62,
    RB: 0.62,
    LWB: 0.78,
    RWB: 0.78,
    CB: 0.08,
  };
  return selectWeightedProfile(candidates, random, (profile) => (
    (Number(profile.passing) || profile.overall)
    * profile.expectedMinutesShare
    * (positionWeight[profile.position] || 0.72)
  )).name;
}

function ownGoalScorer(defendingTeam, minute, cards, random, suspendedPlayers = []) {
  const candidates = eligibleScorerProfiles(defendingTeam, minute, cards, suspendedPlayers)
    .filter((profile) => ["CB", "LB", "RB", "LWB", "RWB", "GK", "CDM"].includes(profile.position));
  const pool = candidates.length ? candidates : eligibleScorerProfiles(defendingTeam, minute, cards, suspendedPlayers);
  return pool[Math.floor(random() * pool.length)].name;
}

function goalEvents(
  team,
  defendingTeam,
  regulationCount,
  extraTimeCount,
  random,
  cards = [],
  suspendedPlayers = [],
  defendingCards = [],
  defendingSuspendedPlayers = [],
  usedMinutes = new Set(),
) {
  const events = [];
  const inMatchGoals = new Map();
  const priorTournamentScoring = tournamentScoringForTeam(team.id);
  let currentTeamGoals = 0;
  const uniqueGoalMinute = (start, end) => {
    const span = end - start + 1;
    const initial = start + Math.floor(random() * span);
    for (let offset = 0; offset < span; offset += 1) {
      const candidate = start + ((initial - start + offset) % span);
      if (usedMinutes.has(candidate)) continue;
      usedMinutes.add(candidate);
      return candidate;
    }
    return initial;
  };
  const addGoal = (minute) => {
    const goalType = chooseGoalType(random);
    if (goalType === "ownGoal") {
      const ownGoalBy = ownGoalScorer(
        defendingTeam,
        minute,
        defendingCards,
        random,
        defendingSuspendedPlayers,
      );
      events.push({ minute, scorer: `${ownGoalBy} (OG)`, ownGoalBy, goalType, ownGoal: true, type: "goal" });
      currentTeamGoals += 1;
      return;
    }
    const scorer = availableScorer(
      team,
      minute,
      cards,
      random,
      suspendedPlayers,
      inMatchGoals,
      goalType,
      defendingTeam,
      {
        teamGoals: priorTournamentScoring.teamGoals + currentTeamGoals,
        playerGoals: priorTournamentScoring.playerGoals,
      },
    );
    inMatchGoals.set(scorer, (inMatchGoals.get(scorer) || 0) + 1);
    const chosenAssist = chooseAssist(team, scorer, minute, cards, random, suspendedPlayers, goalType);
    const assist = chosenAssist && chosenAssist !== scorer ? chosenAssist : null;
    events.push({ minute, scorer, assist, goalType, type: "goal" });
    currentTeamGoals += 1;
  };
  for (let index = 0; index < regulationCount; index += 1) {
    const minute = uniqueGoalMinute(2, 90);
    addGoal(minute);
  }
  for (let index = 0; index < extraTimeCount; index += 1) {
    const minute = uniqueGoalMinute(91, 120);
    addGoal(minute);
  }
  return events.sort((a, b) => a.minute - b.minute);
}

function createRedCard(team, side, random, suspendedPlayers = []) {
  const candidates = onPitchPlayerProfiles(team).filter((profile) => (
    !suspendedPlayers.includes(profile.name) && profile.position !== "GK"
  ));
  const player = selectWeightedProfile(candidates, random, (profile) => (
    ["CDM", "DM", "CB", "LB", "RB"].includes(profile.position) ? 1.35 : 1
  ));
  return {
    minute: 12 + Math.floor(random() * 77),
    player: player.name,
    teamId: team.id,
    side,
    type: "red",
  };
}

function createInjury(team, side, random, unavailablePlayers = []) {
  const candidates = onPitchPlayerProfiles(team).filter((profile) => (
    !unavailablePlayers.includes(profile.name)
  ));
  const player = selectWeightedProfile(candidates, random, (profile) => (
    profile.position === "GK" ? 0.45 : ["ST", "LW", "RW", "CF"].includes(profile.position) ? 1.12 : 1
  ));
  if (!player) return null;
  return {
    minute: 9 + Math.floor(random() * 76),
    player: player.name,
    teamId: team.id,
    side,
    type: "injury",
    matchesOut: random() < 0.72 ? 1 : 2,
  };
}

function removeImpossiblePlayerAbsenceEvents(redCards = [], injuries = []) {
  const seen = new Set();
  const retainedRedCards = new Set();
  const retainedInjuries = new Set();
  [
    ...redCards.map((event, order) => ({ event, order, kind: "red" })),
    ...injuries.map((event, order) => ({ event, order, kind: "injury" })),
  ]
    .sort((left, right) => (
      Number(left.event.minute) - Number(right.event.minute)
      || (left.kind === right.kind ? left.order - right.order : left.kind === "red" ? -1 : 1)
    ))
    .forEach(({ event, kind }) => {
      const player = repairPlayerText(event?.player || event?.scorer || "");
      const side = event?.side || event?.teamId || "";
      if (!player) {
        if (kind === "red") retainedRedCards.add(event);
        else retainedInjuries.add(event);
        return;
      }
      const key = `${side}:${player.toLocaleLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (kind === "red") retainedRedCards.add(event);
      else retainedInjuries.add(event);
    });
  return {
    redCards: redCards.filter((event) => retainedRedCards.has(event)),
    injuries: injuries.filter((event) => retainedInjuries.has(event)),
  };
}

function applyScorelineCeiling(home, away, homeGoals, awayGoals) {
  if (homeGoals === awayGoals) return { homeGoals, awayGoals };
  const homeWon = homeGoals > awayGoals;
  if (state?.uclSeason) {
    const leaderGoals = homeWon ? homeGoals : awayGoals;
    const trailerGoals = homeWon ? awayGoals : homeGoals;
    if (leaderGoals > 5) {
      const matchId = selectedMatch()?.id || `${home.id}:${away.id}`;
      const keepRoll = (stableHash(`${state.drawSeed}:${matchId}:ucl-high-score-keep`) % 1000) / 1000;
      const keepChance = leaderGoals === 6 ? 0.18 : leaderGoals === 7 ? 0.04 : 0.01;
      if (keepRoll >= keepChance) {
        const sixGoalRoll = (stableHash(`${state.drawSeed}:${matchId}:ucl-six-goal-ceiling`) % 1000) / 1000;
        const ceiling = leaderGoals >= 7 && sixGoalRoll < 0.12 ? 6 : 5;
        const softenedGoals = Math.max(trailerGoals + 1, ceiling);
        if (homeWon) homeGoals = softenedGoals;
        else awayGoals = softenedGoals;
      }
    }
  }
  const loser = homeWon ? away : home;
  if (!loser.fifaRank || loser.fifaRank > 175) return { homeGoals, awayGoals };
  const ceiling = loser.fifaRank <= 75 ? 5 : loser.fifaRank <= 125 ? 6 : 7;
  if (homeWon && homeGoals > ceiling) {
    homeGoals = ceiling;
    awayGoals = Math.min(awayGoals, ceiling - 1);
  } else if (!homeWon && awayGoals > ceiling) {
    awayGoals = ceiling;
    homeGoals = Math.min(homeGoals, ceiling - 1);
  }
  return { homeGoals, awayGoals };
}

function suspendedPlayersForTeam(teamId, roundIndex) {
  if (roundIndex <= 0) return [];
  const previousMatch = (state.rounds[roundIndex - 1] || []).find((match) => (
    match?.result
    && (match.homeId === teamId || match.awayId === teamId)
  ));
  if (!previousMatch) return [];
  return [...new Set((previousMatch.result.redCards || [])
    .filter((card) => card.teamId === teamId)
    .map((card) => card.player))];
}

function injuredPlayersForTeam(teamId, roundIndex) {
  if (state.settings.removeInjuries === true) return [];
  if (roundIndex <= 0) return [];
  const injured = [];
  state.rounds.slice(0, roundIndex).forEach((round, sourceRoundIndex) => {
    const match = (round || []).find((candidate) => (
      candidate?.result && (candidate.homeId === teamId || candidate.awayId === teamId)
    ));
    (match?.result?.injuries || []).forEach((injury) => {
      if (
        injury.teamId === teamId
        && roundIndex - sourceRoundIndex <= Math.max(1, Number(injury.matchesOut) || 1)
      ) injured.push(injury.player);
    });
  });
  return [...new Set(injured)];
}

function unavailablePlayersForTeam(teamId, roundIndex = state.activeRound) {
  return [...new Set([
    ...suspendedPlayersForTeam(teamId, roundIndex),
    ...injuredPlayersForTeam(teamId, roundIndex),
  ])];
}

function matchesPlayedForTeam(teamId, beforeRoundIndex) {
  return state.rounds.slice(0, beforeRoundIndex).reduce((total, round) => (
    total + (round || []).filter((match) => (
      match?.result && (match.homeId === teamId || match.awayId === teamId)
    )).length
  ), 0);
}

function momentumForTeam(teamId, nextOpponent, roundIndex) {
  if (roundIndex <= 0) return 1;
  const previousMatch = (state.rounds[roundIndex - 1] || []).find((match) => (
    match?.result?.winnerId === teamId
    && (match.homeId === teamId || match.awayId === teamId)
  ));
  if (!previousMatch) return 1;
  const defeatedTeamId = previousMatch.homeId === teamId ? previousMatch.awayId : previousMatch.homeId;
  const winner = teamById(teamId);
  const defeated = teamById(defeatedTeamId);
  return giantKillingMomentumMultiplier(
    teamSimulationRatings(winner).overall,
    teamSimulationRatings(defeated).overall,
    teamSimulationRatings(nextOpponent).overall,
  );
}

function opponentStandardTactic(match, controlledSide) {
  const controlled = teamById(controlledSide === "home" ? match.homeId : match.awayId);
  const opponent = teamById(controlledSide === "home" ? match.awayId : match.homeId);
  const ratingGap = teamSimulationRatings(opponent).overall - teamSimulationRatings(controlled).overall;
  const candidates = ratingGap >= 8
    ? ["high-press", "tiki-taka", "balanced"]
    : ratingGap <= -8
      ? ["counter", "defensive", "balanced"]
      : ["balanced", "tiki-taka", "counter", "high-press", "defensive"];
  return candidates[stableHash(`${match.id}-opponent-tactic`) % candidates.length];
}

const RETRO_FORMATION_TACTIC_SYNERGY = Object.freeze({
  "4-3-3": Object.freeze(["high-press", "tiki-taka", "balanced"]),
  "4-2-3-1": Object.freeze(["balanced", "counter", "defensive"]),
  "4-4-2": Object.freeze(["counter", "balanced", "defensive"]),
  "4-1-2-1-2": Object.freeze(["tiki-taka", "high-press", "balanced"]),
  "4-3-2-1": Object.freeze(["counter", "tiki-taka", "defensive"]),
  "4-1-4-1": Object.freeze(["defensive", "tiki-taka", "balanced"]),
  "3-5-2": Object.freeze(["balanced", "counter", "tiki-taka"]),
  "3-4-3": Object.freeze(["high-press", "counter", "balanced"]),
  "5-3-2": Object.freeze(["defensive", "counter", "balanced"]),
  "5-2-2-1": Object.freeze(["counter", "defensive", "balanced"]),
  "5-2-3": Object.freeze(["counter", "high-press", "balanced"]),
});

function standardFormationKey(candidate = state?.standardFormation) {
  return RETRO_MANAGER_FORMATIONS.includes(candidate) ? candidate : "4-3-3";
}

function applyPremierLeagueFormationToManagedTeam(match) {
  if (!state?.premierLeagueSeason || !state.spectateTeamId || !match) return null;
  if (![match.homeId, match.awayId].includes(state.spectateTeamId)) return null;
  const managedTeam = teamById(state.spectateTeamId);
  if (!managedTeam) return null;
  const savedFormation = state.managerLineups?.[managedTeam.id]?.formation;
  const formation = standardFormationKey(savedFormation || state.standardFormation);
  state.standardFormation = formation;
  managedTeam.selectedFormation = formation;
  return managedTeam;
}

function premierLeagueFormationTacticalImpact(tacticKey) {
  if (!state?.premierLeagueSeason) {
    return { attack: 1, defence: 1, score: 0, synergy: 0, formation: null };
  }
  const formation = standardFormationKey();
  const preferredTactics = RETRO_FORMATION_TACTIC_SYNERGY[formation] || ["balanced"];
  const rank = preferredTactics.indexOf(tacticKey);
  if (rank === 0) return { attack: 1.025, defence: 0.982, score: 1, synergy: 1, formation };
  if (rank === 1) return { attack: 1.014, defence: 0.99, score: 0.78, synergy: 0.78, formation };
  if (rank === 2) return { attack: 1.005, defence: 0.996, score: 0.58, synergy: 0.58, formation };
  return { attack: 0.988, defence: 1.01, score: 0.25, synergy: 0.25, formation };
}

function retroManagedTeamSheetImpact(team, opponent, tacticKey) {
  if (
    !isRetroSimulatorState()
    || ![1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2026].includes(Number(retroTournament?.year))
    || team?.name !== retroTournament?.managedTeam
  ) return { attack: 1, defence: 1, score: 0, fit: 0, selection: 0, synergy: 0 };
  const squad = retroManagerSquadForTeam(team);
  const liveManagement = retroLiveTeamManagement(team.id);
  const lineup = retroManagerLineupForTeam(team);
  const formation = liveManagement?.formation || lineup?.formation || squad?.formation || "4-3-3";
  const starterNumbers = liveManagement?.activeStarters || lineup?.starters || [];
  const missingNumbers = new Set(Object.values(liveManagement?.missingSlots || {}).map((entry) => entry.number));
  const slots = RETRO_MANAGER_SLOT_POSITIONS[formation] || RETRO_MANAGER_SLOT_POSITIONS["4-3-3"];
  const starterEntries = starterNumbers
    .map((number, slotIndex) => ({
      player: squad?.players.find((candidate) => candidate.number === number),
      slotIndex,
    }))
    .filter(({ player }) => player && !missingNumbers.has(player.number));
  const starters = starterEntries.map(({ player }) => player);
  if (!starters.length) return { attack: 1, defence: 1, score: 0, fit: 0, selection: 0, synergy: 0 };

  const fitValues = starterEntries.map(({ player, slotIndex }) => (
    retroPlayerPositionFit(player, slots[slotIndex] || player.position)
  ));
  const averageFit = fitValues.reduce((sum, fit) => sum + fit, 0) / fitValues.length;
  const fitScore = simulationClamp((averageFit - 72) / 65, 0, 1);
  const availablePlayers = (squad?.players || []).filter((player) => (
    !unavailablePlayersForTeam(team.id, state.activeRound).includes(player.name)
  ));
  const optimalPlayers = retroOrderPlayersForSlots(availablePlayers, slots)
    .map((number) => availablePlayers.find((player) => player.number === number))
    .filter(Boolean);
  const starterQuality = starters.reduce((sum, player) => sum + player.overall, 0) / starters.length;
  const optimalQuality = optimalPlayers.reduce((sum, player) => sum + player.overall, 0)
    / Math.max(1, optimalPlayers.length);
  const selectionScore = simulationClamp(1 - Math.max(0, optimalQuality - starterQuality) / 9, 0, 1);
  const preferredTactics = RETRO_FORMATION_TACTIC_SYNERGY[formation] || ["balanced"];
  const synergyRank = preferredTactics.indexOf(tacticKey);
  const synergyScore = synergyRank < 0 ? 0.25 : [1, 0.78, 0.58][synergyRank] || 0.5;
  const managementScore = fitScore * 0.45 + selectionScore * 0.35 + synergyScore * 0.2;
  const ratingGap = Math.max(0, teamSimulationRatings(opponent).overall - teamSimulationRatings(team).overall);
  const underdogLeverage = simulationClamp(ratingGap / 18, 0, 1);
  const attack = simulationClamp(
    0.91 + managementScore * 0.16 + managementScore * underdogLeverage * 0.1,
    0.88,
    1.17,
  );
  const defence = simulationClamp(
    1.09 - managementScore * 0.15 - managementScore * underdogLeverage * 0.09,
    0.84,
    1.12,
  );
  return {
    attack,
    defence,
    score: managementScore,
    fit: fitScore,
    selection: selectionScore,
    synergy: synergyScore,
    formation,
  };
}

function managedRetroTacticalBoost(ratingGap, edge) {
  if (!isRetroSimulatorState() || !retroTournament?.managedTeam) {
    return { attack: 1, defence: 1, comebackFloor: null, favouriteCeiling: null };
  }

  const isKoreaJapan2002 = Number(retroTournament.year) === 2002;
  const isFrance1998 = Number(retroTournament.year) === 1998;
  const managementAttack = isFrance1998 ? 0.018 : isKoreaJapan2002 ? 0.025 : 0;
  const managementDefence = isFrance1998 ? 0.012 : isKoreaJapan2002 ? 0.015 : 0;
  if (edge <= 0) {
    return {
      attack: 1 + managementAttack,
      defence: 1 - managementDefence,
      comebackFloor: null,
      favouriteCeiling: null,
    };
  }

  const execution = Math.min(1, edge / 0.2);
  const underdogScale = Math.min(1, Math.max(0, ratingGap) / 18);
  const attack = 1 + managementAttack + (0.04 + underdogScale * 0.11) * execution;
  const defence = 1 - managementDefence - (0.03 + underdogScale * 0.08) * execution;
  const comebackFloor = ratingGap >= 10 && edge >= 0.14
    ? 0.82 + edge * 1.8 + Math.min(0.28, ratingGap * 0.006)
    : null;
  const favouriteCeiling = ratingGap >= 10 && edge >= 0.14
    ? 2.85 - edge * 1.5
    : null;

  return { attack, defence, comebackFloor, favouriteCeiling };
}

function managedStandardTournamentBoost(controlledTeam, opponentTeam, roundIndex = state.activeRound) {
  const isManagedUclMode = Boolean(
    state.uclSeason
    && state.spectateTeamId
    && !state.neutralView
    && controlledTeam?.id === state.spectateTeamId
  );
  if (isManagedUclMode) {
    const ratingGap = Math.max(
      0,
      teamSimulationRatings(opponentTeam).overall - teamSimulationRatings(controlledTeam).overall,
    );
    const underdogScale = simulationClamp(ratingGap / 24, 0, 1);
    return {
      attack: 1.03 + underdogScale * 0.015,
      defence: 0.98 - underdogScale * 0.01,
      assistance: 0.25,
    };
  }
  const isManaged256Mode = Boolean(
    state.spectateTeamId
    && !state.neutralView
    && !state.customTournament
    && !state.premierLeagueSeason
    && !state.legacyTournament
    && !state.savedTournamentView
    && !isRetroSimulatorState()
    && controlledTeam?.id === state.spectateTeamId
  );
  if (!isManaged256Mode) return { attack: 1, defence: 1, assistance: 0 };

  const ratingGap = Math.max(
    0,
    teamSimulationRatings(opponentTeam).overall - teamSimulationRatings(controlledTeam).overall,
  );
  const underdogScale = simulationClamp(ratingGap / 32, 0, 1);
  const lateRoundScale = simulationClamp(Number(roundIndex) / 7, 0, 1);
  return {
    attack: 1.15 + underdogScale * 0.16 + lateRoundScale * 0.05,
    defence: 0.89 - underdogScale * 0.09 - lateRoundScale * 0.04,
    assistance: 1,
  };
}

function applyControlledTacticalMatchup(adjustedXG, match, controlledSide) {
  const tacticKey = STANDARD_TACTICS[state.standardTactic] ? state.standardTactic : "balanced";
  const opponentTacticKey = opponentStandardTactic(match, controlledSide);
  const tactic = STANDARD_TACTICS[tacticKey];
  const opponentTactic = STANDARD_TACTICS[opponentTacticKey];
  const edge = STANDARD_TACTIC_MATCHUPS[tacticKey]?.[opponentTacticKey] || 0;
  const controlledTeam = teamById(controlledSide === "home" ? match.homeId : match.awayId);
  const opponentTeam = teamById(controlledSide === "home" ? match.awayId : match.homeId);
  const ratingGap = Math.max(0, teamSimulationRatings(opponentTeam).overall - teamSimulationRatings(controlledTeam).overall);
  const underdogAttackBoost = edge > 0 ? 1 + Math.min(0.38, ratingGap * 0.012) * Math.min(1, edge / 0.2) : 1;
  const underdogDefenceBoost = edge > 0 ? 1 - Math.min(0.28, ratingGap * 0.008) * Math.min(1, edge / 0.2) : 1;
  const managedBoost = managedRetroTacticalBoost(ratingGap, edge);
  const standardManagedBoost = managedStandardTournamentBoost(controlledTeam, opponentTeam);
  const teamSheetImpact = retroManagedTeamSheetImpact(controlledTeam, opponentTeam, tacticKey);
  const formationImpact = premierLeagueFormationTacticalImpact(tacticKey);
  const ownMultiplier = tactic.ownXg * opponentTactic.opponentXg * (1 + edge)
    * underdogAttackBoost * managedBoost.attack * standardManagedBoost.attack
    * teamSheetImpact.attack * formationImpact.attack;
  const opponentMultiplier = tactic.opponentXg * opponentTactic.ownXg * (1 - edge * 0.72)
    * underdogDefenceBoost * managedBoost.defence * standardManagedBoost.defence
    * teamSheetImpact.defence * formationImpact.defence;

  if (controlledSide === "home") {
    adjustedXG.homeXG *= ownMultiplier;
    adjustedXG.awayXG *= opponentMultiplier;
  } else {
    adjustedXG.awayXG *= ownMultiplier;
    adjustedXG.homeXG *= opponentMultiplier;
  }
  if (ratingGap >= 15 && edge >= 0.14) {
    const comebackFloor = Math.max(
      0.65 + edge * 2 + Math.min(0.35, ratingGap * 0.005),
      managedBoost.comebackFloor || 0,
    );
    const favouriteCeiling = Math.min(
      3.2 - edge * 2,
      managedBoost.favouriteCeiling || Number.POSITIVE_INFINITY,
    );
    if (controlledSide === "home") {
      adjustedXG.homeXG = Math.max(adjustedXG.homeXG, comebackFloor);
      adjustedXG.awayXG = Math.min(adjustedXG.awayXG, favouriteCeiling);
    } else {
      adjustedXG.awayXG = Math.max(adjustedXG.awayXG, comebackFloor);
      adjustedXG.homeXG = Math.min(adjustedXG.homeXG, favouriteCeiling);
    }
  }
  return {
    adjustedXG,
    tacticKey,
    opponentTacticKey,
    edge,
    managedBoost,
    teamSheetImpact: state.premierLeagueSeason
      ? { ...teamSheetImpact, ...formationImpact }
      : { ...teamSheetImpact, assistance: standardManagedBoost.assistance },
  };
}

function standardTacticalFeedback(tacticKey, opponentTacticKey) {
  const edge = STANDARD_TACTIC_MATCHUPS[tacticKey]?.[opponentTacticKey] || 0;
  if (edge >= 0.18) return { edge, label: "Strong tactical edge" };
  if (edge >= 0.06) return { edge, label: "Tactical edge" };
  if (edge <= -0.18) return { edge, label: "Major tactical risk" };
  if (edge <= -0.06) return { edge, label: "Tactical risk" };
  return { edge, label: "Even tactical matchup" };
}

function decidingMatchScore(match, homeGoals, awayGoals) {
  const aggregate = match?.uclAggregateBefore;
  return {
    home: Number(homeGoals) + (Number(aggregate?.home) || 0),
    away: Number(awayGoals) + (Number(aggregate?.away) || 0),
  };
}

function decidingMatchIsLevel(match, homeGoals, awayGoals) {
  if (match?.allowDraw) return false;
  const score = decidingMatchScore(match, homeGoals, awayGoals);
  return score.home === score.away;
}

function decidingMatchWinnerId(match, homeGoals, awayGoals) {
  const score = decidingMatchScore(match, homeGoals, awayGoals);
  if (score.home === score.away) return null;
  return score.home > score.away ? match.homeId : match.awayId;
}
