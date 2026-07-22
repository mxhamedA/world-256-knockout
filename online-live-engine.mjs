export const LIVE_SIMULATION_VERSION = 2;
export const LIVE_MINUTE_MS = 667;
export const LIVE_PENALTY_DEADLINE_MS = 15_000;
export const LIVE_MAX_BATCH_MINUTES = 512;
export const LIVE_MAX_BATCH_CPU_MS = 15;

export const LIVE_TACTICS = Object.freeze({
  "park-the-bus": { attack: 0.70, defence: 0.72, possession: -0.12, fatigue: 0.78, cardRisk: 0.90, volatility: 0.78 },
  defensive: { attack: 0.84, defence: 0.86, possession: -0.06, fatigue: 0.90, cardRisk: 0.95, volatility: 0.88 },
  balanced: { attack: 1, defence: 1, possession: 0, fatigue: 1, cardRisk: 1, volatility: 1 },
  "tiki-taka": { attack: 1.05, defence: 0.95, possession: 0.12, fatigue: 1.04, cardRisk: 0.92, volatility: 0.90 },
  counter: { attack: 1.08, defence: 1.03, possession: -0.07, fatigue: 0.98, cardRisk: 0.98, volatility: 1.15 },
  "high-press": { attack: 1.12, defence: 1.07, possession: 0.08, fatigue: 1.20, cardRisk: 1.14, volatility: 1.10 },
  attacking: { attack: 1.18, defence: 1.15, possession: 0.06, fatigue: 1.12, cardRisk: 1.08, volatility: 1.12 },
  "ultra-attacking": { attack: 1.34, defence: 1.31, possession: 0.12, fatigue: 1.28, cardRisk: 1.18, volatility: 1.28 },
});

export const LIVE_PENALTY_TARGETS = Object.freeze([
  "top-left", "top-right", "middle", "bottom-left", "bottom-right",
]);

const POSITION_GROUPS = Object.freeze({
  GK: "goalkeeper",
  CB: "defender", LB: "defender", RB: "defender", LWB: "defender", RWB: "defender",
  CDM: "midfielder", DM: "midfielder", CM: "midfielder", CAM: "midfielder", AM: "midfielder", LM: "midfielder", RM: "midfielder",
  ST: "attacker", CF: "attacker", SS: "attacker", LW: "attacker", RW: "attacker", LF: "attacker", RF: "attacker",
});

export function positionGroup(position) {
  return POSITION_GROUPS[position] || "midfielder";
}

export function createLiveMatchState({
  matchId,
  homeTeamId,
  awayTeamId,
  homeRating,
  awayRating,
  homeRoster,
  awayRoster,
  homeTactic = "balanced",
  awayTactic = "balanced",
  seed,
  now = Date.now(),
}) {
  return {
    simulationVersion: LIVE_SIMULATION_VERSION,
    matchId,
    homeTeamId,
    awayTeamId,
    status: "waiting",
    minute: 0,
    addedTime: 0,
    homeScore: 0,
    awayScore: 0,
    homeTactic,
    awayTactic,
    homeMomentum: 1,
    awayMomentum: 1,
    homeFatigue: 0,
    awayFatigue: 0,
    homeRedCards: 0,
    awayRedCards: 0,
    homeXG: 0,
    awayXG: 0,
    shots: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    possession: { home: 0, away: 0 },
    lineups: {
      home: createValidLineup(homeRoster),
      away: createValidLineup(awayRoster),
    },
    yellowCards: { home: {}, away: {} },
    substitutions: { home: [], away: [] },
    suspensionPlayerIds: [],
    penalty: null,
    pendingDecision: null,
    clock: {
      lastAdvancedAt: now,
      nextMinuteAt: now,
      pausedUntil: null,
      pauseStartedAt: null,
      speedByMemberId: {},
      effectiveSpeed: 1,
    },
    rngState: normalizeSeed(seed),
    eventSequence: 0,
    processedMinuteCursor: 0,
    updatedAt: now,
    completedAt: null,
    winnerTeamId: null,
    ratings: { home: homeRating, away: awayRating },
    controllers: { home: null, away: null },
    goalkeeperTendencies: {
      home: goalkeeperTendencyFor(matchId, "home"),
      away: goalkeeperTendencyFor(matchId, "away"),
    },
  };
}

export function startLiveMatch(state, now = Date.now()) {
  ensureLiveStateShape(state, now);
  if (state.status !== "waiting") return;
  state.status = "firstHalf";
  state.clock.lastAdvancedAt = now;
  state.clock.nextMinuteAt = now + minuteDuration(state);
  state.updatedAt = now;
  if (state.status === "finished") state.completedAt = now;
}

export function setLiveTactic(state, side, tactic) {
  ensureLiveStateShape(state);
  if (!LIVE_TACTICS[tactic] || !["home", "away"].includes(side)) return false;
  state[`${side}Tactic`] = tactic;
  return true;
}

export function advanceLiveMatch(state, {
  now = Date.now(),
  maxMinutes = LIVE_MAX_BATCH_MINUTES,
  shouldStop = () => false,
  makeDecisionId = defaultDecisionId,
} = {}) {
  ensureLiveStateShape(state, now);
  const events = [];
  if (!isRunning(state) || state.pendingDecision) return { events, processedMinutes: 0, caughtUp: true };
  if (state.clock.pausedUntil && state.clock.pausedUntil > now) return { events, processedMinutes: 0, caughtUp: true };
  if (state.clock.pausedUntil && state.clock.pausedUntil <= now) {
    const pausedFor = Math.max(0, state.clock.pausedUntil - (state.clock.pauseStartedAt || state.clock.pausedUntil));
    state.clock.nextMinuteAt += pausedFor;
    state.clock.lastAdvancedAt += pausedFor;
    state.clock.pausedUntil = null;
    state.clock.pauseStartedAt = null;
  }

  let processedMinutes = 0;
  while (
    isRunning(state)
    && !state.pendingDecision
    && state.clock.nextMinuteAt <= now
    && processedMinutes < maxMinutes
    && !shouldStop()
  ) {
    simulateLiveMinute(state, events, makeDecisionId, now);
    processedMinutes += 1;
    state.processedMinuteCursor += 1;
    state.clock.lastAdvancedAt = state.clock.nextMinuteAt;
    state.clock.nextMinuteAt += minuteDuration(state);
  }
  state.updatedAt = now;
  return {
    events,
    processedMinutes,
    caughtUp: !isRunning(state) || Boolean(state.pendingDecision) || state.clock.nextMinuteAt > now,
  };
}

export function resolveLivePenaltyDecision(state, {
  decisionId,
  target,
  now = Date.now(),
  automatic = false,
} = {}) {
  ensureLiveStateShape(state, now);
  const decision = state.pendingDecision;
  if (!decision || decision.id !== decisionId) return { accepted: false, reason: "already-resolved", events: [] };
  if (!automatic && now >= decision.deadlineAt) return { accepted: false, reason: "expired", events: [] };
  const chosenTarget = LIVE_PENALTY_TARGETS.includes(target) ? target : randomTarget(state);
  const event = resolvePenaltyAttempt(state, decision.side, chosenTarget, !automatic, decision.kind, decision.round);
  const events = [event];
  state.pendingDecision = null;
  if (decision.kind === "shootout") advanceShootoutState(state, events, now);
  state.clock.lastAdvancedAt = now;
  state.clock.nextMinuteAt = now + minuteDuration(state);
  state.updatedAt = now;
  return { accepted: true, events };
}

export function expireLivePenaltyDecision(state, now = Date.now()) {
  if (!state.pendingDecision || now < state.pendingDecision.deadlineAt) return { events: [], expired: false };
  const result = resolveLivePenaltyDecision(state, {
    decisionId: state.pendingDecision.id,
    target: randomTarget(state),
    now,
    automatic: true,
  });
  return { events: result.events, expired: true };
}

export function validateFormation(players) {
  const active = players.filter((player) => player && !player.dismissed);
  const counts = active.reduce((result, player) => {
    result[positionGroup(player.position)] += 1;
    return result;
  }, { goalkeeper: 0, defender: 0, midfielder: 0, attacker: 0 });
  return counts.goalkeeper === 1 && counts.defender >= 3 && counts.midfielder >= 2 && counts.attacker >= 1;
}

function simulateLiveMinute(state, events, makeDecisionId, now = Date.now()) {
  state.minute += 1;
  decayMomentum(state);
  updateFatigueAndPossession(state);
  maybeCard(state, "home", events);
  maybeCard(state, "away", events);
  maybeSubstitute(state, "home", events);
  maybeSubstitute(state, "away", events);

  const attackingSide = choosePossessionSide(state);
  const penaltyChance = 0.00105 * LIVE_TACTICS[state[`${attackingSide}Tactic`]].volatility;
  if (nextRandom(state) < penaltyChance) {
    const controllerMemberId = state.controllers?.[attackingSide] || null;
    if (controllerMemberId) {
      state.pendingDecision = {
        id: makeDecisionId(state, attackingSide, "regulation"),
        kind: "regulation",
        side: attackingSide,
        teamId: state[`${attackingSide}TeamId`],
        memberId: controllerMemberId,
        openedAt: Math.max(now, state.clock.nextMinuteAt),
        deadlineAt: Math.max(now, state.clock.nextMinuteAt) + LIVE_PENALTY_DEADLINE_MS,
      };
      events.push(baseEvent(state, "penalty-awarded", attackingSide));
      return;
    }
    events.push(resolvePenaltyAttempt(state, attackingSide, randomTarget(state), false, "regulation"));
  } else {
    maybeGoal(state, attackingSide, events);
  }

  transitionPhase(state, events, makeDecisionId, now);
}

function maybeGoal(state, side, events) {
  const other = side === "home" ? "away" : "home";
  const attackTactic = LIVE_TACTICS[state[`${side}Tactic`]];
  const defenceTactic = LIVE_TACTICS[state[`${other}Tactic`]];
  const ratingEdge = (state.ratings[side] - state.ratings[other]) / 45;
  const fatiguePenalty = 1 - state[`${side}Fatigue`] * 0.34;
  const redPenalty = Math.max(0.50, 1 - state[`${side}RedCards`] * 0.16);
  const opponentRedBoost = 1 + state[`${other}RedCards`] * 0.14;
  const fullMatchXg = clamp(
    (1.18 + ratingEdge) * attackTactic.attack * defenceTactic.defence
      * state[`${side}Momentum`] * fatiguePenalty * redPenalty * opponentRedBoost,
    0.15,
    4.4,
  );
  const minuteXg = fullMatchXg / 90;
  state[`${side}XG`] += minuteXg;
  const shotChance = clamp(0.065 + fullMatchXg * 0.024, 0.07, 0.17);
  if (nextRandom(state) >= shotChance) return;
  state.shots[side] += 1;
  const shooter = choosePlayer(state, side, ["attacker", "midfielder"]);
  const shotXg = clamp(minuteXg / shotChance, 0.025, 0.42);
  const goalChance = clamp((1 - Math.exp(-minuteXg)) / shotChance, 0.015, 0.46);
  const scoreBefore = { home: state.homeScore, away: state.awayScore };
  if (nextRandom(state) >= goalChance) {
    const onTargetChance = clamp(0.32 + state.ratings[side] / 500 - state[`${side}Fatigue`] * 0.22, 0.30, 0.58);
    if (nextRandom(state) < onTargetChance) {
      state.shotsOnTarget[side] += 1;
      events.push({
        ...baseEvent(state, "save", side, {
          importance: shotXg >= 0.18 ? "major" : "notable",
          scoreBefore,
          metadata: { shooter, xg: Number(shotXg.toFixed(3)) },
        }),
        player: shooter,
        xg: Number(shotXg.toFixed(3)),
      });
    } else {
      const blocked = nextRandom(state) < 0.34;
      events.push({
        ...baseEvent(state, blocked ? "shot-blocked" : "shot-missed", side, {
          importance: shotXg >= 0.2 ? "notable" : "normal",
          scoreBefore,
          metadata: { shooter, xg: Number(shotXg.toFixed(3)) },
        }),
        player: shooter,
        xg: Number(shotXg.toFixed(3)),
      });
    }
    return;
  }
  state[`${side}Score`] += 1;
  state.shotsOnTarget[side] += 1;
  state[`${side}Momentum`] = clamp(state[`${side}Momentum`] + 0.06, 0.85, 1.15);
  state[`${other}Momentum`] = clamp(state[`${other}Momentum`] - 0.04, 0.85, 1.15);
  const scoreAfter = { home: state.homeScore, away: state.awayScore };
  events.push({
    ...baseEvent(state, "goal", side, {
      importance: "goal",
      scoreBefore,
      scoreAfter,
      metadata: { scorer: shooter, goalType: "openPlay", xg: Number(shotXg.toFixed(3)) },
    }),
    player: shooter,
    xg: Number(shotXg.toFixed(3)),
    homeScore: state.homeScore,
    awayScore: state.awayScore,
  });
}

function maybeCard(state, side, events) {
  const tactic = LIVE_TACTICS[state[`${side}Tactic`]];
  const chance = 0.0018 * tactic.cardRisk * (1 + state[`${side}Fatigue`] * 0.8);
  if (nextRandom(state) >= chance) return;
  const player = chooseActivePlayer(state, side, false);
  if (!player) return;
  const yellowCount = state.yellowCards[side][player.id] || 0;
  const directRed = nextRandom(state) < 0.08;
  if (directRed || yellowCount >= 1) {
    player.dismissed = true;
    state[`${side}RedCards`] += 1;
    state.suspensionPlayerIds.push(player.id);
    events.push({
      ...baseEvent(state, directRed ? "red-card" : "second-yellow", side, {
        importance: "major",
        metadata: { player: player.name },
      }),
      player: player.name,
    });
    return;
  }
  state.yellowCards[side][player.id] = 1;
  events.push({
    ...baseEvent(state, "yellow-card", side, { importance: "normal", metadata: { player: player.name } }),
    player: player.name,
  });
}

function maybeSubstitute(state, side, events) {
  if (![56, 66, 76].includes(state.minute)) return;
  const lineup = state.lineups[side];
  const already = state.substitutions[side].length;
  const allowedNow = state.minute === 76 ? 5 - already : Math.min(2, 5 - already);
  for (let index = 0; index < allowedNow; index += 1) {
    const candidates = lineup.active
      .filter((player) => !player.dismissed && player.position !== "GK")
      .toSorted((a, b) => (a.overall || 50) - (b.overall || 50));
    const outgoing = candidates[index];
    if (!outgoing) break;
    const group = positionGroup(outgoing.position);
    const replacementIndex = lineup.bench.findIndex((player) => positionGroup(player.position) === group);
    if (replacementIndex < 0) continue;
    const incoming = lineup.bench[replacementIndex];
    const proposed = lineup.active.map((player) => player.id === outgoing.id ? incoming : player);
    if (!validateFormation(proposed)) continue;
    lineup.active = proposed;
    lineup.bench.splice(replacementIndex, 1, outgoing);
    state.substitutions[side].push({ minute: state.minute, playerOut: outgoing.name, playerIn: incoming.name });
    events.push({
      ...baseEvent(state, "substitution", side, {
        importance: "normal",
        metadata: { playerOut: outgoing.name, playerIn: incoming.name },
      }),
      playerOut: outgoing.name,
      playerIn: incoming.name,
    });
  }
}

function transitionPhase(state, events, makeDecisionId, now = Date.now()) {
  if (state.status === "firstHalf" && state.minute >= 45) {
    state.status = "halfTime";
    state.status = "secondHalf";
    events.push(baseEvent(state, "half-time", null));
    return;
  }
  if (state.status === "secondHalf" && state.minute >= 90) {
    if (state.homeScore !== state.awayScore) return finishMatch(state, events);
    state.status = "extraTimeFirst";
    events.push(baseEvent(state, "extra-time", null));
    return;
  }
  if (state.status === "extraTimeFirst" && state.minute >= 105) {
    state.status = "extraTimeSecond";
    events.push(baseEvent(state, "extra-time-break", null));
    return;
  }
  if (state.status === "extraTimeSecond" && state.minute >= 120) {
    if (state.homeScore !== state.awayScore) return finishMatch(state, events);
    state.status = "penalties";
    state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
    queueShootoutDecision(state, events, makeDecisionId, now);
  }
}

function queueShootoutDecision(state, events, makeDecisionId = defaultDecisionId, now = Date.now()) {
  if (state.status !== "penalties" || state.pendingDecision) return;
  const side = state.penalty.currentSide;
  const controllerMemberId = state.controllers?.[side] || null;
  if (controllerMemberId) {
    state.pendingDecision = {
      id: makeDecisionId(state, side, "shootout"),
      kind: "shootout",
      side,
      teamId: state[`${side}TeamId`],
      memberId: controllerMemberId,
      round: side === "home" ? state.penalty.homeKicks + 1 : state.penalty.awayKicks + 1,
      openedAt: Math.max(now, state.clock.nextMinuteAt),
      deadlineAt: Math.max(now, state.clock.nextMinuteAt) + LIVE_PENALTY_DEADLINE_MS,
    };
    events.push(baseEvent(state, "shootout-ready", side));
    return;
  }
  const event = resolvePenaltyAttempt(state, side, randomTarget(state), false, "shootout");
  events.push(event);
  advanceShootoutState(state, events);
  if (state.status === "penalties") queueShootoutDecision(state, events, makeDecisionId, now);
}

function resolvePenaltyAttempt(state, side, target, manual, kind, round = null) {
  const other = side === "home" ? "away" : "home";
  const tendency = goalkeeperTendency(state, other);
  const keeperTarget = weightedTarget(state, tendency, (state.penalty?.kicks || []).filter((kick) => kick.side === side));
  const exact = keeperTarget === target;
  const adjacent = !exact && adjacentTargets(keeperTarget, target);
  const shooterRating = state.ratings[side];
  const keeperRating = state.ratings[other];
  const qualityAdjustment = clamp((keeperRating - shooterRating) / 250, -0.12, 0.12);
  const baseSaveChance = exact ? 0.62 : adjacent ? 0.18 : 0;
  const wideChance = manual ? 0 : clamp(0.09 - (shooterRating - 50) / 900, 0.025, 0.12);
  const wentWide = nextRandom(state) < wideChance;
  const saved = !wentWide && nextRandom(state) < clamp(baseSaveChance + qualityAdjustment, 0, 0.82);
  const scored = !wentWide && !saved;
  const scoreBefore = { home: state.homeScore, away: state.awayScore };
  if (kind === "regulation") {
    state.shots[side] += 1;
    if (!wentWide) state.shotsOnTarget[side] += 1;
    state[`${side}XG`] += 0.79;
    if (scored) state[`${side}Score`] += 1;
  }
  if (kind === "shootout") {
    state.penalty[`${side}Kicks`] += 1;
    if (scored) state.penalty[`${side}Score`] += 1;
  }
  const kick = { side, target, goalkeeperTarget: keeperTarget, scored, missType: wentWide ? "wide" : saved ? "save" : null, round };
  if (kind === "shootout") state.penalty.kicks.push(kick);
  const player = choosePlayer(state, side, ["attacker", "midfielder"]);
  return {
    ...baseEvent(state, kind === "shootout" ? "shootout-kick" : "penalty-kick", side, {
      importance: kind === "shootout" ? "major" : scored ? "goal" : "major",
      scoreBefore,
      scoreAfter: { home: state.homeScore, away: state.awayScore },
      metadata: {
        scorer: player,
        goalType: kind === "shootout" ? "shootout" : "penalty",
        scored,
        missType: kick.missType,
        round,
      },
    }),
    ...kick,
    player,
    homeScore: state.homeScore,
    awayScore: state.awayScore,
  };
}

function advanceShootoutState(state, events = [], now = Date.now()) {
  if (shootoutWinner(state.penalty)) {
    state.winnerTeamId = state.penalty.homeScore > state.penalty.awayScore ? state.homeTeamId : state.awayTeamId;
    state.status = "finished";
    state.completedAt = state.updatedAt;
    state.pendingDecision = null;
    return;
  }
  state.penalty.currentSide = state.penalty.homeKicks === state.penalty.awayKicks ? "home" : "away";
  queueShootoutDecision(state, events, defaultDecisionId, now);
}

export function shootoutWinner(penalty) {
  const { homeScore, awayScore, homeKicks, awayKicks } = penalty;
  if (homeKicks < 5 || awayKicks < 5) {
    if (homeScore > awayScore + (5 - awayKicks)) return "home";
    if (awayScore > homeScore + (5 - homeKicks)) return "away";
    return null;
  }
  if (homeKicks !== awayKicks) return null;
  if (homeScore === awayScore) return null;
  return homeScore > awayScore ? "home" : "away";
}

function finishMatch(state, events) {
  state.status = "finished";
  state.winnerTeamId = state.homeScore > state.awayScore ? state.homeTeamId : state.awayTeamId;
  state.completedAt = state.clock.nextMinuteAt;
  events.push(baseEvent(state, "full-time", null));
}

function createValidLineup(roster = []) {
  const normalized = roster.map((player, index) => ({
    id: player.id || `player-${index + 1}`,
    name: player.name || `Player ${index + 1}`,
    position: player.position || defaultPosition(index),
    overall: Number(player.overall) || 50,
    placeholder: Boolean(player.placeholder),
    dismissed: false,
  }));
  while (normalized.length < 18) {
    const index = normalized.length;
    normalized.push({ id: `generated-${index + 1}`, name: `Player ${index + 1}`, position: defaultPosition(index), overall: 45, placeholder: true, dismissed: false });
  }
  const chosen = [];
  const take = (group, count) => {
    normalized.filter((player) => positionGroup(player.position) === group && !chosen.includes(player))
      .toSorted((a, b) => b.overall - a.overall).slice(0, count).forEach((player) => chosen.push(player));
  };
  take("goalkeeper", 1); take("defender", 4); take("midfielder", 3); take("attacker", 3);
  normalized.filter((player) => !chosen.includes(player)).slice(0, 11 - chosen.length).forEach((player) => chosen.push(player));
  return { active: chosen, bench: normalized.filter((player) => !chosen.includes(player)) };
}

function defaultPosition(index) {
  return ["GK", "RB", "CB", "CB", "LB", "CDM", "CM", "CAM", "RW", "ST", "LW", "GK", "CB", "RB", "CM", "CAM", "ST", "LW"][index % 18];
}

function choosePossessionSide(state) {
  const homeTactic = LIVE_TACTICS[state.homeTactic];
  const awayTactic = LIVE_TACTICS[state.awayTactic];
  const homeShare = clamp(0.5 + (state.ratings.home - state.ratings.away) / 300 + homeTactic.possession - awayTactic.possession, 0.24, 0.76);
  const side = nextRandom(state) < homeShare ? "home" : "away";
  state.possession[side] += 1;
  return side;
}

function updateFatigueAndPossession(state) {
  for (const side of ["home", "away"]) {
    const tactic = LIVE_TACTICS[state[`${side}Tactic`]];
    state[`${side}Fatigue`] = clamp(state[`${side}Fatigue`] + 0.00115 * tactic.fatigue, 0, 0.24);
  }
}

function decayMomentum(state) {
  for (const side of ["home", "away"]) {
    const key = `${side}Momentum`;
    state[key] += (1 - state[key]) * 0.08;
    state[key] = clamp(state[key], 0.85, 1.15);
  }
}

function choosePlayer(state, side, preferredGroups) {
  const players = state.lineups[side].active.filter((player) => !player.dismissed);
  const namedPlayers = players.filter((player) => !player.placeholder);
  const preferred = namedPlayers.filter((player) => preferredGroups.includes(positionGroup(player.position)));
  const pool = preferred.length ? preferred : namedPlayers.length ? namedPlayers : players;
  return pool.length ? pool[Math.floor(nextRandom(state) * pool.length)].name : "Goalscorer";
}

function chooseActivePlayer(state, side, includeGoalkeeper = true) {
  const pool = state.lineups[side].active.filter((player) => !player.dismissed && (includeGoalkeeper || player.position !== "GK"));
  const namedPlayers = pool.filter((player) => !player.placeholder);
  const candidates = namedPlayers.length ? namedPlayers : pool;
  return candidates.length ? candidates[Math.floor(nextRandom(state) * candidates.length)] : null;
}

function goalkeeperTendency(state, side) {
  return state.goalkeeperTendencies?.[side] || goalkeeperTendencyFor(state.matchId, side);
}

function goalkeeperTendencyFor(matchId, side) {
  const targets = LIVE_PENALTY_TARGETS;
  const index = Math.abs(hashString(`${matchId}:${side}:keeper`)) % targets.length;
  return { primaryTarget: targets[index], weights: targets.map((_, targetIndex) => targetIndex === index ? 4 : 1) };
}

function weightedTarget(state, tendency, kicks) {
  const weights = [...tendency.weights];
  const recent = kicks.slice(-3);
  recent.forEach((kick) => {
    const index = LIVE_PENALTY_TARGETS.indexOf(kick.target);
    if (index >= 0) weights[index] += 1.5;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = nextRandom(state) * total;
  for (let index = 0; index < weights.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return LIVE_PENALTY_TARGETS[index];
  }
  return tendency.primaryTarget;
}

function adjacentTargets(first, second) {
  if (first === "middle" || second === "middle") return false;
  return first.endsWith("left") === second.endsWith("left") || first.endsWith("right") === second.endsWith("right");
}

function randomTarget(state) {
  return LIVE_PENALTY_TARGETS[Math.floor(nextRandom(state) * LIVE_PENALTY_TARGETS.length)];
}

function baseEvent(state, type, side, options = {}) {
  const scoreBefore = options.scoreBefore || { home: state.homeScore, away: state.awayScore };
  const scoreAfter = options.scoreAfter || { home: state.homeScore, away: state.awayScore };
  const phase = state.status === "extraTimeFirst" || state.status === "extraTimeSecond"
    ? "extra-time"
    : state.status === "penalties" ? "shootout"
      : state.minute > 45 ? "second-half" : "first-half";
  return {
    sequence: ++state.eventSequence,
    type,
    importance: options.importance || liveEventImportance(type),
    side,
    teamId: side ? state[`${side}TeamId`] : null,
    minute: state.minute,
    addedTime: state.addedTime || 0,
    phase,
    scoreBefore,
    scoreAfter,
    metadata: options.metadata || {},
  };
}

function liveEventImportance(type) {
  if (type === "goal") return "goal";
  if (["penalty-awarded", "penalty-kick", "shootout-kick", "red-card", "second-yellow", "extra-time", "full-time"].includes(type)) return "major";
  if (["save", "half-time", "extra-time-break"].includes(type)) return "notable";
  if (["shot-missed", "shot-blocked", "yellow-card", "substitution"].includes(type)) return "normal";
  return "silent";
}

function ensureLiveStateShape(state, now = Date.now()) {
  state.simulationVersion = LIVE_SIMULATION_VERSION;
  state.shots ||= { home: 0, away: 0 };
  state.shotsOnTarget ||= { home: 0, away: 0 };
  state.possession ||= { home: 0, away: 0 };
  state.yellowCards ||= { home: {}, away: {} };
  state.substitutions ||= { home: [], away: [] };
  state.controllers ||= { home: null, away: null };
  state.suspensionPlayerIds ||= [];
  state.goalkeeperTendencies ||= {
    home: goalkeeperTendencyFor(state.matchId, "home"),
    away: goalkeeperTendencyFor(state.matchId, "away"),
  };
  state.clock ||= {};
  state.clock.lastAdvancedAt ??= now;
  state.clock.nextMinuteAt ??= now + LIVE_MINUTE_MS;
  state.clock.pausedUntil ??= null;
  state.clock.pauseStartedAt ??= null;
  state.clock.speedByMemberId ||= {};
  state.clock.effectiveSpeed = [1, 2, 4].includes(state.clock.effectiveSpeed) ? state.clock.effectiveSpeed : 1;
  state.eventSequence = Number.isFinite(state.eventSequence) ? state.eventSequence : 0;
  state.processedMinuteCursor = Number.isFinite(state.processedMinuteCursor) ? state.processedMinuteCursor : (state.minute || 0);
  for (const side of ["home", "away"]) {
    state.shots[side] = Number.isFinite(state.shots[side]) ? state.shots[side] : 0;
    state.shotsOnTarget[side] = Number.isFinite(state.shotsOnTarget[side]) ? state.shotsOnTarget[side] : 0;
    state.possession[side] = Number.isFinite(state.possession[side]) ? state.possession[side] : 0;
    state.yellowCards[side] ||= {};
    state.substitutions[side] ||= [];
  }
}

function isRunning(state) {
  return !["waiting", "penalties", "finished"].includes(state.status);
}

function minuteDuration(state) {
  return LIVE_MINUTE_MS / ([1, 2, 4].includes(state.clock.effectiveSpeed) ? state.clock.effectiveSpeed : 1);
}

function defaultDecisionId(state, side, kind) {
  return `${state.matchId}:${kind}:${side}:${state.processedMinuteCursor}:${state.penalty?.kicks.length || 0}`;
}

function normalizeSeed(seed) {
  const value = Number(seed) >>> 0;
  return value || 0x9e3779b9;
}

export function nextRandom(state) {
  let value = state.rngState >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  state.rngState = value >>> 0 || 0x9e3779b9;
  return state.rngState / 4294967296;
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
