(function initUclEngine(root, factory) {
  const drawSolver = typeof module === "object" && module.exports
    ? require("./ucl-draw-solver.js")
    : root?.UclDrawSolver;
  const engine = factory(drawSolver);
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.UclEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function createUclEngine(drawSolver) {
  "use strict";

  const VERSION = 4;
  const MATCHDAY_DATES = Object.freeze([
    "8–10 Sep 2026",
    "13–14 Oct 2026",
    "20–21 Oct 2026",
    "3–4 Nov 2026",
    "24–25 Nov 2026",
    "8–9 Dec 2026",
    "19–20 Jan 2027",
    "27 Jan 2027",
  ]);

  const BADGE_ROOT = "./assets/ucl-26-27/badges";
  const club = (id, name, association, code, rating, pot, badge = `${BADGE_ROOT}/${id}.png`) => Object.freeze({
    id,
    name,
    association,
    code,
    rating,
    pot,
    badge,
    provisional: false,
  });
  const qualifierClub = (id, name, association, code, rating, badge = `${BADGE_ROOT}/${id}.png`) => Object.freeze({
    id,
    name,
    association,
    code,
    rating,
    pot: 4,
    badge,
    provisional: false,
  });

  // The seven play-off places remain explicit slots until the qualifying field
  // is complete. Keeping them as stable IDs means an installed data update can
  // replace their display data without invalidating an in-progress simulation.
  const CORE_TEAM_DATA = Object.freeze([
    club("real-madrid", "Real Madrid", "ESP", "RMA", 92, 1),
    club("manchester-city", "Man City", "ENG", "MCI", 91, 1),
    club("bayern-munich", "Bayern Munich", "GER", "BAY", 90, 1),
    club("paris-saint-germain", "PSG", "FRA", "PSG", 90, 1),
    club("liverpool", "Liverpool", "ENG", "LIV", 89, 1),
    club("barcelona", "Barcelona", "ESP", "BAR", 89, 1),
    club("inter-milan", "Inter Milan", "ITA", "INT", 88, 1),
    club("arsenal", "Arsenal", "ENG", "ARS", 88, 1),
    club("atletico-madrid", "Atlético Madrid", "ESP", "ATM", 87, 1),

    club("borussia-dortmund", "Borussia Dortmund", "GER", "BVB", 86, 2),
    club("napoli", "Napoli", "ITA", "NAP", 85, 2, "./assets/ucl-26-27/badges/napoli-2007.png"),
    club("manchester-united", "Man United", "ENG", "MUN", 84, 2),
    club("rb-leipzig", "RB Leipzig", "GER", "RBL", 84, 2),
    club("sporting-cp", "Sporting CP", "POR", "SCP", 83, 2),
    club("porto", "Porto", "POR", "POR", 83, 2),
    club("villarreal", "Villarreal", "ESP", "VIL", 82, 2),
    club("roma", "Roma", "ITA", "ROM", 82, 2),
    club("psv-eindhoven", "PSV Eindhoven", "NED", "PSV", 82, 2),

    club("aston-villa", "Aston Villa", "ENG", "AVL", 82, 3),
    club("galatasaray", "Galatasaray", "TUR", "GAL", 81, 3),
    club("feyenoord", "Feyenoord", "NED", "FEY", 81, 3),
    club("stuttgart", "Stuttgart", "GER", "VFB", 80, 3),
    club("lille", "Lille", "FRA", "LIL", 80, 3),
    club("club-brugge", "Club Brugge", "BEL", "BRU", 79, 3),
    club("shakhtar-donetsk", "Shakhtar Donetsk", "UKR", "SHK", 79, 3),
    club("real-betis", "Real Betis", "ESP", "BET", 79, 3),
    club("como", "Como", "ITA", "COM", 78, 3),

    club("lens", "Lens", "FRA", "LEN", 78, 4),
    club("slavia-prague", "Slavia Prague", "CZE", "SLA", 77, 4),
  ]);

  // Ten projected qualifying winners compete for the seven remaining places.
  // A managed qualifier is always included; neutral seasons select seven using
  // the season seed so every club in this pool can reach the league phase.
  const QUALIFIER_POOL = Object.freeze([
    qualifierClub("fenerbahce", "Fenerbahçe", "TUR", "FEN", 81, `${BADGE_ROOT}/fenerbahce.svg`),
    qualifierClub("olympique-lyonnais", "Lyon", "FRA", "OL", 80),
    qualifierClub("gnk-dinamo-zagreb", "Dinamo Zagreb", "CRO", "DIN", 79),
    qualifierClub("crvena-zvezda", "FK Crvena zvezda", "SRB", "CZV", 79, `${BADGE_ROOT}/crvena-zvezda.svg`),
    qualifierClub("union-saint-gilloise", "Union SG", "BEL", "USG", 78, `${BADGE_ROOT}/union-saint-gilloise.svg`),
    qualifierClub("olympiacos", "Olympiacos", "GRE", "OLY", 79, `${BADGE_ROOT}/olympiacos.svg`),
    qualifierClub("agf-aarhus", "AGF Aarhus", "DEN", "AGF", 77),
    qualifierClub("slovan-bratislava", "ŠK Slovan Bratislava", "SVK", "SLO", 77, `${BADGE_ROOT}/slovan-bratislava.svg`),
    qualifierClub("levski-sofia", "PFC Levski Sofia", "BUL", "LEV", 76, `${BADGE_ROOT}/levski-sofia.svg`),
    qualifierClub("nk-celje", "NK Celje", "SVN", "CEL", 76),
  ]);

  const TEAM_DATA = Object.freeze([...CORE_TEAM_DATA, ...QUALIFIER_POOL]);

  const TEAM_BY_ID = new Map(TEAM_DATA.map((team) => [team.id, team]));
  const TOP_SEED_IDS = Object.freeze(TEAM_DATA.slice(0, 4).map((team) => team.id));

  // Slots 0–8 are pot one, 9–17 pot two, 18–26 pot three and 27–35 pot four.
  // This template was solved once so runtime work stays tiny on mobile. It is
  // eight perfect matchings with no duplicate pair and exactly two opponents
  // from every pot for every slot.
  const MATCHDAY_TEMPLATE = Object.freeze([
    [[35, 22], [24, 8], [33, 14], [21, 9], [15, 23], [1, 12], [18, 25], [11, 13], [10, 19], [0, 34], [20, 29], [32, 4], [16, 26], [3, 7], [28, 2], [31, 27], [6, 30], [17, 5]],
    [[21, 3], [25, 6], [14, 17], [30, 10], [27, 28], [5, 19], [24, 31], [33, 32], [12, 8], [1, 15], [2, 13], [9, 35], [16, 34], [26, 23], [29, 18], [0, 22], [4, 20], [11, 7]],
    [[4, 8], [34, 15], [27, 25], [16, 17], [31, 1], [5, 0], [21, 33], [18, 22], [24, 9], [20, 19], [11, 26], [29, 3], [14, 10], [30, 12], [13, 23], [2, 6], [28, 35], [7, 32]],
    [[3, 9], [29, 31], [23, 7], [30, 24], [21, 26], [20, 34], [11, 4], [19, 13], [0, 6], [5, 27], [28, 15], [1, 8], [17, 35], [10, 18], [22, 32], [14, 25], [16, 12], [2, 33]],
    [[27, 4], [3, 13], [21, 12], [25, 24], [33, 34], [11, 28], [32, 26], [5, 35], [23, 22], [20, 0], [9, 10], [6, 18], [31, 14], [1, 29], [8, 16], [2, 15], [17, 7], [19, 30]],
    [[27, 11], [35, 29], [32, 13], [2, 24], [15, 9], [8, 19], [17, 33], [34, 23], [0, 30], [22, 12], [20, 21], [31, 7], [26, 4], [16, 25], [18, 28], [5, 10], [3, 1], [6, 14]],
    [[6, 35], [13, 12], [28, 21], [15, 11], [8, 33], [0, 9], [18, 3], [14, 4], [25, 31], [26, 27], [29, 10], [30, 34], [5, 7], [17, 20], [16, 32], [19, 24], [2, 22], [1, 23]],
    [[19, 35], [21, 7], [30, 32], [26, 5], [15, 22], [10, 6], [0, 16], [3, 28], [20, 11], [1, 25], [24, 14], [33, 23], [8, 34], [31, 12], [13, 27], [4, 2], [29, 9], [17, 18]],
  ].map((round) => Object.freeze(round.map((pair) => Object.freeze(pair)))));

  const ROUND_CONFIG = Object.freeze([
    Object.freeze({ key: "playoffs", label: "Knockout phase play-offs", shortLabel: "Play-offs", legs: 2, tieCount: 8 }),
    Object.freeze({ key: "round-of-16", label: "Round of 16", shortLabel: "Round of 16", legs: 2, tieCount: 8 }),
    Object.freeze({ key: "quarter-finals", label: "Quarter-finals", shortLabel: "Quarter-finals", legs: 2, tieCount: 4 }),
    Object.freeze({ key: "semi-finals", label: "Semi-finals", shortLabel: "Semi-finals", legs: 2, tieCount: 2 }),
    Object.freeze({ key: "final", label: "The final", shortLabel: "Final", legs: 1, tieCount: 1 }),
  ]);

  function hash(value) {
    let current = 2166136261;
    for (const character of String(value)) {
      current ^= character.charCodeAt(0);
      current = Math.imul(current, 16777619);
    }
    return current >>> 0;
  }

  function random(seed) {
    let value = seed >>> 0;
    return function next() {
      value += 0x6d2b79f5;
      let result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(values, rng) {
    const copy = [...values];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(rng() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function poisson(mean, rng) {
    const limit = Math.exp(-mean);
    let product = 1;
    let count = 0;
    do {
      count += 1;
      product *= rng();
    } while (product > limit && count < 9);
    return count - 1;
  }

  function slotPot(slotIndex) {
    return Math.floor(slotIndex / 9) + 1;
  }

  function associationKey(team) {
    return team.provisional || team.association === "TBC" ? `TBC:${team.id}` : team.association;
  }

  function templateNeighbors() {
    const neighbors = Array.from({ length: 36 }, () => []);
    MATCHDAY_TEMPLATE.flat().forEach(([left, right]) => {
      neighbors[left].push(right);
      neighbors[right].push(left);
    });
    return neighbors;
  }

  const SLOT_NEIGHBORS = templateNeighbors();

  function drawConstraintScore(assignments) {
    let score = 0;
    const conflicts = new Set();
    assignments.forEach((team, slotIndex) => {
      const teamAssociation = associationKey(team);
      SLOT_NEIGHBORS[slotIndex].forEach((neighborSlot) => {
        const neighbor = assignments[neighborSlot];
        const neighborAssociation = associationKey(neighbor);
        if (teamAssociation === neighborAssociation) {
          score += 8;
          conflicts.add(slotIndex);
          conflicts.add(neighborSlot);
        }
      });
    });
    return { score, conflicts: [...conflicts] };
  }

  function assignTeamsToSlots(seed) {
    const rng = random(hash(`${seed}:league-draw`));
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const assignments = [];
      for (let pot = 1; pot <= 4; pot += 1) {
        assignments.push(...shuffled(TEAM_DATA.filter((team) => team.pot === pot), rng));
      }
      let state = drawConstraintScore(assignments);
      for (let iteration = 0; iteration < 1200; iteration += 1) {
        if (state.score === 0) return assignments.map((team) => team.id);
        const conflictedSlot = state.conflicts.length
          ? state.conflicts[Math.floor(rng() * state.conflicts.length)]
          : Math.floor(rng() * 36);
        const potStart = Math.floor(conflictedSlot / 9) * 9;
        const candidates = [];
        for (let swapSlot = potStart; swapSlot < potStart + 9; swapSlot += 1) {
          if (swapSlot === conflictedSlot) continue;
          [assignments[conflictedSlot], assignments[swapSlot]] = [assignments[swapSlot], assignments[conflictedSlot]];
          candidates.push({ swapSlot, state: drawConstraintScore(assignments) });
          [assignments[conflictedSlot], assignments[swapSlot]] = [assignments[swapSlot], assignments[conflictedSlot]];
        }
        candidates.sort((left, right) => left.state.score - right.state.score || left.swapSlot - right.swapSlot);
        const bestScore = candidates[0].state.score;
        const best = candidates.filter((candidate) => candidate.state.score === bestScore);
        const choice = best[Math.floor(rng() * best.length)];
        const escapeLocalMinimum = choice.state.score >= state.score && rng() < 0.22;
        if (choice.state.score < state.score || escapeLocalMinimum) {
          [assignments[conflictedSlot], assignments[choice.swapSlot]] = [assignments[choice.swapSlot], assignments[conflictedSlot]];
          state = choice.state;
        } else {
          const randomSwap = potStart + Math.floor(rng() * 9);
          if (randomSwap !== conflictedSlot) {
            [assignments[conflictedSlot], assignments[randomSwap]] = [assignments[randomSwap], assignments[conflictedSlot]];
            state = drawConstraintScore(assignments);
          }
        }
      }
    }
    throw new Error("The UCL draw constraints could not be solved.");
  }

  function orientedTemplate(slotIds, seed) {
    const rounds = MATCHDAY_TEMPLATE.map((round, roundIndex) => round.map(([left, right], matchIndex) => ({
      id: `ucl-md${roundIndex + 1}-${matchIndex + 1}`,
      roundIndex,
      slotLeft: left,
      slotRight: right,
      leftId: slotIds[left],
      rightId: slotIds[right],
      homeId: null,
      awayId: null,
      result: null,
    })));

    const edges = rounds.flat();
    const constraints = Array.from({ length: edges.length }, () => []);
    for (let slotIndex = 0; slotIndex < 36; slotIndex += 1) {
      for (let opponentPot = 1; opponentPot <= 4; opponentPot += 1) {
        const incident = [];
        edges.forEach((edge, edgeIndex) => {
          if (edge.slotLeft === slotIndex && slotPot(edge.slotRight) === opponentPot) {
            incident.push({ edgeIndex, inverted: 0 });
          } else if (edge.slotRight === slotIndex && slotPot(edge.slotLeft) === opponentPot) {
            incident.push({ edgeIndex, inverted: 1 });
          }
        });
        if (incident.length !== 2) throw new Error("Every slot must meet two clubs from each pot.");
        const [first, second] = incident;
        const relation = 1 ^ first.inverted ^ second.inverted;
        constraints[first.edgeIndex].push({ edgeIndex: second.edgeIndex, relation });
        constraints[second.edgeIndex].push({ edgeIndex: first.edgeIndex, relation });
      }
    }

    const orientation = Array(edges.length).fill(null);
    const rng = random(hash(`${seed}:home-away`));
    for (let start = 0; start < edges.length; start += 1) {
      if (orientation[start] !== null) continue;
      orientation[start] = rng() >= 0.5 ? 1 : 0;
      const stack = [start];
      while (stack.length) {
        const edgeIndex = stack.pop();
        constraints[edgeIndex].forEach((constraint) => {
          const required = orientation[edgeIndex] ^ constraint.relation;
          if (orientation[constraint.edgeIndex] === null) {
            orientation[constraint.edgeIndex] = required;
            stack.push(constraint.edgeIndex);
          } else if (orientation[constraint.edgeIndex] !== required) {
            throw new Error("The UCL home-and-away constraints could not be solved.");
          }
        });
      }
    }

    edges.forEach((edge, edgeIndex) => {
      const leftIsHome = orientation[edgeIndex] === 1;
      edge.homeId = leftIsHome ? edge.leftId : edge.rightId;
      edge.awayId = leftIsHome ? edge.rightId : edge.leftId;
    });

    return rounds.map((round) => round.map(({ leftId, rightId, slotLeft, slotRight, ...match }) => match));
  }

  function buildLeagueSchedule(seed, activeTeams) {
    if (!drawSolver?.generateChampionsLeagueSchedule) throw new Error("The UCL draw solver is unavailable.");
    return drawSolver.generateChampionsLeagueSchedule(
      activeTeams.map((team) => ({
        id: team.id,
        name: team.name,
        country: associationKey(team),
        pot: team.pot,
      })),
      { seed },
    ).map((round) => round.map((match) => ({
      ...match,
      stage: "league",
      allowDraw: true,
      result: null,
    })));
  }

  function createSeason(managedTeamId = null, seedValue = null) {
    const hasExplicitSeed = seedValue !== null && seedValue !== undefined && seedValue !== "";
    const parsedSeed = Number(seedValue);
    const seed = hasExplicitSeed && Number.isSafeInteger(parsedSeed)
      ? Math.abs(parsedSeed)
      : Math.floor((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    const drawRng = random(hash(`${seed}:ceremony`));
    const selectedTeamId = TEAM_BY_ID.has(managedTeamId) ? managedTeamId : null;
    const qualifierRng = random(hash(`${seed}:qualifying-pool`));
    const selectedQualifier = QUALIFIER_POOL.find((team) => team.id === selectedTeamId) || null;
    const qualifierOrder = shuffled(QUALIFIER_POOL.filter((team) => team.id !== selectedQualifier?.id), qualifierRng);
    const activeQualifiers = selectedQualifier
      ? [selectedQualifier, ...qualifierOrder.slice(0, 6)]
      : qualifierOrder.slice(0, 7);
    const activeTeams = [...CORE_TEAM_DATA, ...activeQualifiers];
    const season = {
      version: VERSION,
      seed,
      createdAt: new Date().toISOString(),
      managedTeamId: selectedTeamId,
      neutralMode: !selectedTeamId,
      leagueTeamIds: activeTeams.map((team) => team.id),
      drawOrder: shuffled(activeTeams.map((team) => team.id), drawRng),
      drawnCount: 0,
      drawComplete: false,
      phase: "league",
      activeMatchday: 0,
      viewMatchday: 0,
      league: buildLeagueSchedule(seed, activeTeams),
      knockout: {
        currentKey: null,
        rounds: {},
      },
      championId: null,
    };
    if (!validateSchedule(season.league).valid) throw new Error("The UCL league schedule could not be validated.");
    return season;
  }

  function validSeason(candidate) {
    return candidate?.version === VERSION
      && Array.isArray(candidate.drawOrder)
      && candidate.drawOrder.length === 36
      && Array.isArray(candidate.leagueTeamIds)
      && candidate.leagueTeamIds.length === 36
      && candidate.drawOrder.every((id) => TEAM_BY_ID.has(id))
      && validateSchedule(candidate.league).valid
      && candidate.knockout
      && typeof candidate.knockout.rounds === "object";
  }

  function validateSchedule(rounds) {
    const errors = [];
    if (!Array.isArray(rounds) || rounds.length !== 8) return { valid: false, errors: ["Expected eight matchdays."] };
    if (!rounds.every((round) => Array.isArray(round) && round.length === 18)) errors.push("Every matchday must contain 18 matches.");
    const participantIds = new Set(rounds.flat().flatMap((match) => [match.homeId, match.awayId]));
    if (participantIds.size !== 36) errors.push("The schedule must contain exactly 36 clubs.");
    const stats = new Map([...participantIds].filter((id) => TEAM_BY_ID.has(id)).map((id) => [id, {
      opponents: new Set(),
      home: 0,
      away: 0,
      pots: [0, 0, 0, 0],
      homePots: [0, 0, 0, 0],
      awayPots: [0, 0, 0, 0],
      associations: new Map(),
      matchdays: new Set(),
    }]));
    rounds.forEach((round, roundIndex) => round.forEach((match) => {
      const home = TEAM_BY_ID.get(match.homeId);
      const away = TEAM_BY_ID.get(match.awayId);
      if (!home || !away || home.id === away.id) {
        errors.push(`Invalid match on matchday ${roundIndex + 1}.`);
        return;
      }
      const homeStats = stats.get(home.id);
      const awayStats = stats.get(away.id);
      if (homeStats.matchdays.has(roundIndex) || awayStats.matchdays.has(roundIndex)) errors.push("A club appears twice on one matchday.");
      homeStats.matchdays.add(roundIndex);
      awayStats.matchdays.add(roundIndex);
      homeStats.opponents.add(away.id);
      awayStats.opponents.add(home.id);
      homeStats.home += 1;
      awayStats.away += 1;
      homeStats.pots[away.pot - 1] += 1;
      awayStats.pots[home.pot - 1] += 1;
      homeStats.homePots[away.pot - 1] += 1;
      awayStats.awayPots[home.pot - 1] += 1;
      const awayAssociation = associationKey(away);
      const homeAssociation = associationKey(home);
      homeStats.associations.set(awayAssociation, (homeStats.associations.get(awayAssociation) || 0) + 1);
      awayStats.associations.set(homeAssociation, (awayStats.associations.get(homeAssociation) || 0) + 1);
      if (homeAssociation === awayAssociation) errors.push(`${home.id} and ${away.id} are from the same association.`);
    }));
    stats.forEach((value, id) => {
      if (value.opponents.size !== 8) errors.push(`${id} does not have eight unique opponents.`);
      if (value.home !== 4 || value.away !== 4) errors.push(`${id} does not have four home and four away matches.`);
      if (value.pots.some((count) => count !== 2)) errors.push(`${id} does not have two opponents from every pot.`);
      if (value.homePots.some((count) => count !== 1) || value.awayPots.some((count) => count !== 1)) {
        errors.push(`${id} does not have one home and one away opponent from every pot.`);
      }
      value.associations.forEach((count, association) => {
        if (count > 2) errors.push(`${id} faces ${count} clubs from ${association}; the maximum is two.`);
      });
    });
    return { valid: errors.length === 0, errors };
  }

  function simulateScore(homeId, awayId, seed, salt, { neutral = false } = {}) {
    const home = TEAM_BY_ID.get(homeId);
    const away = TEAM_BY_ID.get(awayId);
    const rng = random(hash(`${seed}:${salt}:${homeId}:${awayId}`));
    const difference = home.rating - away.rating;
    const homeAttackEdge = (Number(home.simulationRatings?.attack) || home.rating)
      - (Number(away.simulationRatings?.defence) || away.rating);
    const awayAttackEdge = (Number(away.simulationRatings?.attack) || away.rating)
      - (Number(home.simulationRatings?.defence) || home.rating);
    const formSwing = (rng() - 0.5) * 0.30;
    const homeExpected = clamp(1.34 + difference * 0.027 + homeAttackEdge * 0.008 + (neutral ? 0 : 0.18) + formSwing, 0.22, 3.55);
    const awayExpected = clamp(1.18 - difference * 0.024 + awayAttackEdge * 0.008 - formSwing * 0.68, 0.18, 3.3);
    return {
      home: poisson(homeExpected, rng),
      away: poisson(awayExpected, rng),
    };
  }

  function isUpset(homeId, awayId, result) {
    const home = TEAM_BY_ID.get(homeId);
    const away = TEAM_BY_ID.get(awayId);
    if (result.home === result.away) return false;
    const winner = result.home > result.away ? home : away;
    const loser = winner.id === home.id ? away : home;
    return loser.rating - winner.rating >= 6;
  }

  function ensureMatchdayResults(season, roundIndex) {
    const round = season.league[roundIndex];
    if (!round) return [];
    round.forEach((match) => {
      if (match.result) return;
      const score = simulateScore(match.homeId, match.awayId, season.seed, match.id);
      match.result = {
        ...score,
        revealed: false,
        upset: isUpset(match.homeId, match.awayId, score),
      };
    });
    return round;
  }

  function revealMatch(match) {
    if (match?.result) match.result.revealed = true;
    return match;
  }

  function completeMatchday(season, roundIndex) {
    if (!season || season.phase !== "league" || roundIndex !== season.activeMatchday) return season;
    if (!season.league?.[roundIndex]) return season;
    ensureMatchdayResults(season, roundIndex).forEach(revealMatch);
    season.activeMatchday = roundIndex + 1;
    season.viewMatchday = Math.min(7, season.activeMatchday);
    if (season.activeMatchday >= 8) {
      season.phase = "knockout";
      prepareKnockoutRound(season, "playoffs");
    }
    return season;
  }

  function leagueTable(season) {
    const participantIds = [...new Set(season?.league?.flat().flatMap((match) => [match.homeId, match.awayId]) || [])];
    const rows = new Map(participantIds.map((teamId) => [teamId, {
      team: TEAM_BY_ID.get(teamId),
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      awayGoals: 0,
      awayWins: 0,
      opponents: [],
    }]));
    season?.league?.flat().forEach((match) => {
      if (!match.result?.revealed) return;
      const home = rows.get(match.homeId);
      const away = rows.get(match.awayId);
      home.played += 1;
      away.played += 1;
      home.gf += match.result.home;
      home.ga += match.result.away;
      away.gf += match.result.away;
      away.ga += match.result.home;
      home.opponents.push(away.team.id);
      away.opponents.push(home.team.id);
      away.awayGoals += match.result.away;
      if (match.result.home > match.result.away) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (match.result.home < match.result.away) {
        away.won += 1;
        away.awayWins += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;
    });
    rows.forEach((row) => {
      row.opponentPoints = row.opponents.reduce((total, opponentId) => total + rows.get(opponentId).points, 0);
      row.opponentGd = row.opponents.reduce((total, opponentId) => total + rows.get(opponentId).gd, 0);
      row.opponentGoals = row.opponents.reduce((total, opponentId) => total + rows.get(opponentId).gf, 0);
    });
    return [...rows.values()]
      .sort((left, right) => (
        right.points - left.points
        || right.gd - left.gd
        || right.gf - left.gf
        || right.awayGoals - left.awayGoals
        || right.won - left.won
        || right.awayWins - left.awayWins
        || right.opponentPoints - left.opponentPoints
        || right.opponentGd - left.opponentGd
        || right.opponentGoals - left.opponentGoals
        || right.team.rating - left.team.rating
        || left.team.name.localeCompare(right.team.name)
      ))
      .map((row, index) => ({ ...row, position: index + 1 }));
  }

  function qualificationStatus(season, teamId) {
    const position = leagueTable(season).find((row) => row.team.id === teamId)?.position || 36;
    if (position <= 8) return { position, key: "qualified", label: "Round of 16", detail: "Qualified directly" };
    if (position <= 24) return { position, key: "playoffs", label: "Knockout play-offs", detail: "Season continues" };
    return { position, key: "eliminated", label: "Eliminated", detail: "League phase complete" };
  }

  function roundConfig(key) {
    return ROUND_CONFIG.find((round) => round.key === key) || null;
  }

  function pairRankingGroups(seed, key, groups) {
    const rng = random(hash(`${seed}:knockout-draw:${key}`));
    return groups.flatMap(({ seeded, unseeded }) => {
      const seededOrder = shuffled(seeded, rng);
      const unseededOrder = shuffled(unseeded, rng);
      return [[seededOrder[0], unseededOrder[0]], [seededOrder[1], unseededOrder[1]]];
    });
  }

  function previousRoundKey(key) {
    const index = ROUND_CONFIG.findIndex((round) => round.key === key);
    return index > 0 ? ROUND_CONFIG[index - 1].key : null;
  }

  function prepareKnockoutRound(season, key) {
    if (season.knockout.rounds[key]) {
      season.knockout.currentKey = key;
      return season.knockout.rounds[key];
    }
    const config = roundConfig(key);
    if (!config) throw new Error(`Unknown UCL knockout round: ${key}`);
    const table = leagueTable(season);
    let pairs;
    if (key === "playoffs") {
      pairs = pairRankingGroups(season.seed, key, [
        { seeded: [table[8].team.id, table[9].team.id], unseeded: [table[22].team.id, table[23].team.id] },
        { seeded: [table[10].team.id, table[11].team.id], unseeded: [table[20].team.id, table[21].team.id] },
        { seeded: [table[12].team.id, table[13].team.id], unseeded: [table[18].team.id, table[19].team.id] },
        { seeded: [table[14].team.id, table[15].team.id], unseeded: [table[16].team.id, table[17].team.id] },
      ]);
    } else if (key === "round-of-16") {
      const playoffRound = season.knockout.rounds.playoffs;
      if (!playoffRound?.ties.every((tie) => tie.winnerId)) throw new Error("The knockout play-offs are not complete.");
      const groupWinners = [0, 1, 2, 3].map((group) => playoffRound.ties
        .filter((tie) => tie.bracketGroup === group)
        .map((tie) => tie.winnerId));
      const groupPairs = pairRankingGroups(season.seed, key, [
        { seeded: [table[0].team.id, table[1].team.id], unseeded: groupWinners[3] },
        { seeded: [table[2].team.id, table[3].team.id], unseeded: groupWinners[2] },
        { seeded: [table[4].team.id, table[5].team.id], unseeded: groupWinners[1] },
        { seeded: [table[6].team.id, table[7].team.id], unseeded: groupWinners[0] },
      ]);
      const bracketSlots = [[0, 4], [2, 6], [1, 5], [3, 7]];
      pairs = Array(8);
      bracketSlots.forEach((slots, group) => {
        pairs[slots[0]] = groupPairs[group * 2];
        pairs[slots[1]] = groupPairs[group * 2 + 1];
      });
    } else {
      const previous = season.knockout.rounds[previousRoundKey(key)];
      const entrants = previous?.ties.map((tie) => tie.winnerId);
      if (!entrants?.every(Boolean)) throw new Error(`The previous round is not complete before ${config.label}.`);
      pairs = [];
      for (let index = 0; index < entrants.length; index += 2) pairs.push([entrants[index], entrants[index + 1]]);
    }
    const requiresDraw = key === "playoffs" || key === "round-of-16";
    const round = {
      key,
      label: config.label,
      shortLabel: config.shortLabel,
      legs: config.legs,
      drawnCount: requiresDraw ? 0 : pairs.length * 2,
      drawComplete: !requiresDraw,
      complete: false,
      ties: pairs.map(([teamAId, teamBId], index) => ({
        id: `ucl-${key}-${index + 1}`,
        teamAId,
        teamBId,
        bracketGroup: key === "playoffs" ? Math.floor(index / 2) : null,
        bracketSlot: index,
        result: null,
        winnerId: null,
      })),
    };
    season.knockout.rounds[key] = round;
    season.knockout.currentKey = key;
    return round;
  }

  function simulateTie(season, round, tie) {
    if (tie.result) return tie;
    if (round.legs === 1) {
      const score = simulateScore(tie.teamAId, tie.teamBId, season.seed, `${tie.id}:final`, { neutral: true });
      const rng = random(hash(`${season.seed}:${tie.id}:decider`));
      let winnerId;
      let decidedBy = "90 minutes";
      let penalties = null;
      if (score.home !== score.away) {
        winnerId = score.home > score.away ? tie.teamAId : tie.teamBId;
      } else if (rng() > 0.42) {
        decidedBy = "extra time";
        if (rng() > 0.5) {
          score.home += 1;
          winnerId = tie.teamAId;
        } else {
          score.away += 1;
          winnerId = tie.teamBId;
        }
      } else {
        decidedBy = "penalties";
        const homePens = 3 + Math.floor(rng() * 3);
        const awayPens = homePens + (rng() > 0.5 ? 1 : -1);
        penalties = { home: homePens, away: Math.max(2, awayPens) };
        if (penalties.home === penalties.away) penalties.home += 1;
        winnerId = penalties.home > penalties.away ? tie.teamAId : tie.teamBId;
      }
      const winner = TEAM_BY_ID.get(winnerId);
      const loser = TEAM_BY_ID.get(winnerId === tie.teamAId ? tie.teamBId : tie.teamAId);
      tie.result = {
        legs: [{ homeId: tie.teamAId, awayId: tie.teamBId, home: score.home, away: score.away }],
        aggregateA: score.home,
        aggregateB: score.away,
        decidedBy,
        penalties,
        upset: loser.rating - winner.rating >= 6,
      };
      tie.winnerId = winnerId;
      return tie;
    }

    const first = simulateScore(tie.teamBId, tie.teamAId, season.seed, `${tie.id}:leg-1`);
    const second = simulateScore(tie.teamAId, tie.teamBId, season.seed, `${tie.id}:leg-2`);
    let aggregateA = first.away + second.home;
    let aggregateB = first.home + second.away;
    const rng = random(hash(`${season.seed}:${tie.id}:decider`));
    let decidedBy = "aggregate";
    let penalties = null;
    if (aggregateA === aggregateB && rng() > 0.38) {
      decidedBy = "extra time";
      if (rng() > 0.5) {
        second.home += 1;
        aggregateA += 1;
      } else {
        second.away += 1;
        aggregateB += 1;
      }
    } else if (aggregateA === aggregateB) {
      decidedBy = "penalties";
      const teamAPens = 3 + Math.floor(rng() * 3);
      const teamBPens = teamAPens + (rng() > 0.5 ? 1 : -1);
      penalties = { teamA: teamAPens, teamB: Math.max(2, teamBPens) };
      if (penalties.teamA === penalties.teamB) penalties.teamA += 1;
    }
    const winnerId = aggregateA === aggregateB
      ? (penalties.teamA > penalties.teamB ? tie.teamAId : tie.teamBId)
      : (aggregateA > aggregateB ? tie.teamAId : tie.teamBId);
    const winner = TEAM_BY_ID.get(winnerId);
    const loser = TEAM_BY_ID.get(winnerId === tie.teamAId ? tie.teamBId : tie.teamAId);
    tie.result = {
      legs: [
        { homeId: tie.teamBId, awayId: tie.teamAId, home: first.home, away: first.away },
        { homeId: tie.teamAId, awayId: tie.teamBId, home: second.home, away: second.away },
      ],
      aggregateA,
      aggregateB,
      decidedBy,
      penalties,
      upset: loser.rating - winner.rating >= 6,
    };
    tie.winnerId = winnerId;
    return tie;
  }

  function ensureKnockoutResults(season, key, options = {}) {
    const round = prepareKnockoutRound(season, key);
    const excludedIds = new Set(options.excludeIds || []);
    round.ties.forEach((tie) => {
      if (!excludedIds.has(tie.id)) simulateTie(season, round, tie);
    });
    return round;
  }

  function completeKnockoutRound(season, key) {
    const round = ensureKnockoutResults(season, key);
    round.complete = true;
    if (key === "final") {
      season.championId = round.ties[0].winnerId;
      season.phase = "complete";
      return season;
    }
    const currentIndex = ROUND_CONFIG.findIndex((config) => config.key === key);
    prepareKnockoutRound(season, ROUND_CONFIG[currentIndex + 1].key);
    return season;
  }

  function team(teamId) {
    return TEAM_BY_ID.get(teamId) || null;
  }

  function applySimulationRatings(teamId, ratings = {}) {
    const current = TEAM_BY_ID.get(teamId);
    const overall = Number(ratings.overall);
    if (!current || !Number.isFinite(overall)) return current || null;
    const normalizedOverall = clamp(Math.round(overall), 55, 96);
    const updated = Object.freeze({
      ...current,
      rating: normalizedOverall,
      simulationRatings: Object.freeze({
        ...(current.simulationRatings || {}),
        ...ratings,
        overall: normalizedOverall,
      }),
    });
    TEAM_BY_ID.set(teamId, updated);
    return updated;
  }

  function managedFixtures(season) {
    if (!season?.managedTeamId) return [];
    return season.league.map((round, roundIndex) => {
      const match = round.find((candidate) => candidate.homeId === season.managedTeamId || candidate.awayId === season.managedTeamId);
      return match ? { ...match, roundIndex } : null;
    }).filter(Boolean);
  }

  return Object.freeze({
    VERSION,
    TEAM_DATA,
    QUALIFIER_POOL,
    TOP_SEED_IDS,
    MATCHDAY_DATES,
    ROUND_CONFIG,
    createSeason,
    validSeason,
    validateSchedule,
    team,
    applySimulationRatings,
    leagueTable,
    qualificationStatus,
    managedFixtures,
    ensureMatchdayResults,
    revealMatch,
    completeMatchday,
    prepareKnockoutRound,
    ensureKnockoutResults,
    completeKnockoutRound,
    roundConfig,
  });
});
