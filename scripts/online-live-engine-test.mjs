import assert from "node:assert/strict";
import {
  LIVE_MINUTE_MS,
  LIVE_TACTICS,
  advanceLiveMatch,
  createLiveMatchState,
  expireLivePenaltyDecision,
  resolveLivePenaltyDecision,
  setLiveTactic,
  shootoutWinner,
  startLiveMatch,
  validateFormation,
} from "../online-live-engine.mjs";

const roster = (prefix) => ["GK", "RB", "CB", "CB", "LB", "CDM", "CM", "CAM", "RW", "ST", "LW", "GK", "CB", "RB", "CM", "CAM", "ST", "LW"]
  .map((position, index) => ({ id: `${prefix}-${index}`, name: `${prefix} ${index}`, position, overall: 80 - index }));

function match(seed = 1234) {
  return createLiveMatchState({
    matchId: `test-${seed}`,
    homeTeamId: "home",
    awayTeamId: "away",
    homeRating: 80,
    awayRating: 80,
    homeRoster: roster("Home"),
    awayRoster: roster("Away"),
    seed,
    now: 0,
  });
}

{
  const state = match();
  assert.equal(state.status, "waiting");
  assert.equal(state.homeScore, 0);
  assert.equal(state.awayScore, 0);
  assert.equal(state.processedMinuteCursor, 0);
  assert.equal("events" in state, false, "Future events must not be stored at kickoff.");
  assert.equal(validateFormation(state.lineups.home.active), true);
}

{
  const first = match(4567);
  const second = match(4567);
  startLiveMatch(first, 0);
  startLiveMatch(second, 0);
  const firstResult = advanceLiveMatch(first, { now: LIVE_MINUTE_MS * 44, maxMinutes: 44 });
  const secondResult = advanceLiveMatch(second, { now: LIVE_MINUTE_MS * 44, maxMinutes: 44 });
  assert.deepEqual(first, second);
  assert.deepEqual(firstResult.events, secondResult.events);
  assert.equal(first.processedMinuteCursor, 44);
}

{
  const state = match(5150);
  startLiveMatch(state, 0);
  const result = advanceLiveMatch(state, { now: LIVE_MINUTE_MS * 90, maxMinutes: 90 });
  let previousSequence = 0;
  result.events.forEach((event) => {
    assert.ok(event.sequence > previousSequence, "Live events need a stable, increasing sequence.");
    previousSequence = event.sequence;
    assert.ok(Number.isFinite(event.minute));
    assert.ok(event.type);
    assert.ok(event.importance);
    assert.ok(event.phase);
    assert.deepEqual(Object.keys(event.scoreBefore).sort(), ["away", "home"]);
    assert.deepEqual(Object.keys(event.scoreAfter).sort(), ["away", "home"]);
    if (event.type === "goal" || (event.type === "penalty-kick" && event.scored)) {
      const beforeTotal = event.scoreBefore.home + event.scoreBefore.away;
      const afterTotal = event.scoreAfter.home + event.scoreAfter.away;
      assert.equal(afterTotal, beforeTotal + 1, "A scoring event must carry its exact score transition.");
    }
  });
  assert.ok(state.shots.home >= state.homeScore);
  assert.ok(state.shots.away >= state.awayScore);
  assert.ok(state.shotsOnTarget.home >= state.homeScore);
  assert.ok(state.shotsOnTarget.away >= state.awayScore);
  assert.ok(state.shots.home >= state.shotsOnTarget.home);
  assert.ok(state.shots.away >= state.shotsOnTarget.away);
}

{
  const state = match(6160);
  startLiveMatch(state, 0);
  delete state.shots;
  delete state.shotsOnTarget;
  delete state.eventSequence;
  delete state.clock.effectiveSpeed;
  const result = advanceLiveMatch(state, { now: LIVE_MINUTE_MS * 5, maxMinutes: 5 });
  assert.equal(result.processedMinutes, 5, "An older persisted room must resume after an engine upgrade.");
  assert.deepEqual(state.shots, { home: 0, away: 0 });
  assert.deepEqual(state.shotsOnTarget, { home: 0, away: 0 });
  assert.ok(Number.isFinite(state.eventSequence));
  assert.equal(state.clock.effectiveSpeed, 1);
}

{
  const placeholderRoster = roster("Named").map((player, index) => (
    index < 8 ? player : { ...player, name: `Test Team Player ${index + 1}`, placeholder: true }
  ));
  let goalEvents = [];
  for (let seed = 1; seed <= 100 && !goalEvents.length; seed += 1) {
    const state = createLiveMatchState({
      matchId: `placeholder-${seed}`,
      homeTeamId: "home",
      awayTeamId: "away",
      homeRating: 90,
      awayRating: 70,
      homeRoster: placeholderRoster,
      awayRoster: placeholderRoster,
      seed,
      now: 0,
    });
    startLiveMatch(state, 0);
    goalEvents = advanceLiveMatch(state, { now: LIVE_MINUTE_MS * 90, maxMinutes: 90 }).events
      .filter((event) => event.type === "goal");
  }
  assert.ok(goalEvents.length, "The scorer-name regression needs at least one deterministic goal.");
  goalEvents.forEach((event) => assert.doesNotMatch(event.player, / Player \d+$/, "Placeholder names cannot leak into scorer events."));
}

{
  const balanced = match(9012);
  const changed = match(9012);
  startLiveMatch(balanced, 0);
  startLiveMatch(changed, 0);
  advanceLiveMatch(balanced, { now: LIVE_MINUTE_MS * 30, maxMinutes: 30 });
  advanceLiveMatch(changed, { now: LIVE_MINUTE_MS * 30, maxMinutes: 30 });
  assert.equal(setLiveTactic(changed, "home", "high-press"), true);
  const before = structuredClone(balanced);
  const beforeChanged = structuredClone(changed);
  assert.equal(before.homeScore, beforeChanged.homeScore, "Tactic changes must not rewrite prior scoring.");
  advanceLiveMatch(balanced, { now: LIVE_MINUTE_MS * 60, maxMinutes: 30 });
  advanceLiveMatch(changed, { now: LIVE_MINUTE_MS * 60, maxMinutes: 30 });
  assert.notEqual(changed.homeFatigue, balanced.homeFatigue, "Live tactics must affect future fatigue.");
}

{
  assert.ok(LIVE_TACTICS["park-the-bus"].attack < LIVE_TACTICS.balanced.attack);
  assert.ok(LIVE_TACTICS["park-the-bus"].defence < LIVE_TACTICS.balanced.defence);
  assert.ok(LIVE_TACTICS["ultra-attacking"].attack > LIVE_TACTICS.balanced.attack);
  assert.ok(LIVE_TACTICS["ultra-attacking"].defence > LIVE_TACTICS.balanced.defence);
  assert.ok(LIVE_TACTICS["ultra-attacking"].fatigue > LIVE_TACTICS.balanced.fatigue);
  assert.ok(LIVE_TACTICS["ultra-attacking"].cardRisk > LIVE_TACTICS.balanced.cardRisk);
  assert.ok(LIVE_TACTICS["tiki-taka"].possession > LIVE_TACTICS.balanced.possession);
  assert.ok(LIVE_TACTICS.counter.volatility > LIVE_TACTICS.balanced.volatility);
  assert.ok(LIVE_TACTICS["high-press"].fatigue > LIVE_TACTICS.balanced.fatigue);
}

{
  const state = match(7070);
  startLiveMatch(state, 0);
  const result = advanceLiveMatch(state, { now: LIVE_MINUTE_MS * 90, maxMinutes: 90 });
  assert.ok(state.substitutions.home.length <= 5);
  assert.ok(state.substitutions.away.length <= 5);
  assert.ok(new Set(state.substitutions.home.map((sub) => sub.minute)).size <= 3);
  assert.ok(new Set(state.substitutions.away.map((sub) => sub.minute)).size <= 3);
  assert.equal(validateFormation(state.lineups.home.active.filter((player) => !player.dismissed)), true);
  assert.equal(validateFormation(state.lineups.away.active.filter((player) => !player.dismissed)), true);
  assert.equal(result.events.some((event) => event.minute > state.minute), false, "No future event can be emitted.");
}

{
  let extraTimeState = null;
  for (let seed = 1; seed < 2_000 && !extraTimeState; seed += 1) {
    const candidate = match(seed);
    startLiveMatch(candidate, 0);
    advanceLiveMatch(candidate, { now: LIVE_MINUTE_MS * 90, maxMinutes: 90 });
    if (candidate.status === "extraTimeFirst") extraTimeState = candidate;
  }
  assert.ok(extraTimeState, "A deterministic draw must enter extra time.");
  const result = advanceLiveMatch(extraTimeState, { now: LIVE_MINUTE_MS * 120, maxMinutes: 30 });
  assert.equal(extraTimeState.status, "finished");
  assert.ok(extraTimeState.winnerTeamId);
  if (extraTimeState.penalty) {
    assert.equal(shootoutWinner(extraTimeState.penalty) !== null, true);
    assert.equal(extraTimeState.penalty.homeKicks === extraTimeState.penalty.awayKicks, true);
    assert.ok(result.events.some((event) => event.type === "shootout-kick"));
  }
}

{
  const state = match(8080);
  startLiveMatch(state, 0);
  const result = advanceLiveMatch(state, {
    now: LIVE_MINUTE_MS * 90,
    maxMinutes: 512,
    shouldStop: () => state.processedMinuteCursor >= 7,
  });
  assert.equal(result.processedMinutes, 7, "A processing safety limit must persist a partial batch.");
  assert.equal(state.processedMinuteCursor, 7);
  const resumed = advanceLiveMatch(state, { now: LIVE_MINUTE_MS * 90, maxMinutes: 512 });
  assert.ok(resumed.processedMinutes > 0, "A short alarm continuation can resume from the committed cursor.");
}

{
  const state = match(9090);
  startLiveMatch(state, 0);
  state.clock.pauseStartedAt = 100;
  state.clock.pausedUntil = 15_100;
  const atResume = advanceLiveMatch(state, { now: 15_100, maxMinutes: 90 });
  assert.equal(atResume.processedMinutes, 0, "A pause must not create an instant catch-up jump.");
  assert.equal(state.clock.nextMinuteAt, LIVE_MINUTE_MS + 15_000);
  const nextMinute = advanceLiveMatch(state, { now: LIVE_MINUTE_MS + 15_000, maxMinutes: 90 });
  assert.equal(nextMinute.processedMinutes, 1);
}

{
  assert.equal(shootoutWinner({ homeScore: 5, awayScore: 5, homeKicks: 5, awayKicks: 5 }), null);
  assert.equal(shootoutWinner({ homeScore: 6, awayScore: 5, homeKicks: 6, awayKicks: 5 }), null);
  assert.equal(shootoutWinner({ homeScore: 6, awayScore: 6, homeKicks: 6, awayKicks: 6 }), null);
  assert.equal(shootoutWinner({ homeScore: 7, awayScore: 6, homeKicks: 7, awayKicks: 7 }), "home");
  assert.equal(shootoutWinner({ homeScore: 3, awayScore: 1, homeKicks: 4, awayKicks: 4 }), "home");
}

{
  const state = match(2222);
  state.status = "penalties";
  state.controllers.home = "member-home";
  state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
  state.pendingDecision = {
    id: "decision-1",
    kind: "shootout",
    side: "home",
    memberId: "member-home",
    openedAt: 1_000,
    deadlineAt: 16_000,
    round: 1,
  };
  const late = resolveLivePenaltyDecision(state, { decisionId: "decision-1", target: "top-left", now: 16_001 });
  assert.equal(late.accepted, false);
  assert.equal(late.reason, "expired");
  const expired = expireLivePenaltyDecision(state, 16_001);
  assert.equal(expired.expired, true);
  assert.equal(state.penalty.homeKicks, 1);
  assert.equal(state.pendingDecision?.id === "decision-1", false);
}

{
  const state = match(3333);
  state.status = "penalties";
  state.controllers.home = "member-home";
  state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
  state.pendingDecision = {
    id: "decision-2",
    kind: "shootout",
    side: "home",
    memberId: "member-home",
    openedAt: 1_000,
    deadlineAt: 16_000,
    round: 1,
  };
  const accepted = resolveLivePenaltyDecision(state, { decisionId: "decision-2", target: "top-left", now: 2_000 });
  assert.equal(accepted.accepted, true);
  assert.notEqual(accepted.events[0].missType, "wide", "A manually targeted shot must stay on target.");
  const duplicate = resolveLivePenaltyDecision(state, { decisionId: "decision-2", target: "top-left", now: 2_001 });
  assert.equal(duplicate.accepted, false);
  assert.equal(duplicate.reason, "already-resolved");
  assert.equal(state.penalty.homeKicks, 1, "A duplicate decision cannot add another kick.");
}

{
  const state = match(4444);
  state.status = "penalties";
  state.controllers.home = "member-home";
  state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
  state.goalkeeperTendencies.away = { primaryTarget: "middle", weights: [0, 0, 1, 0, 0] };
  state.pendingDecision = {
    id: "decision-middle",
    kind: "shootout",
    side: "home",
    memberId: "member-home",
    openedAt: 1_000,
    deadlineAt: 16_000,
    round: 1,
  };
  const accepted = resolveLivePenaltyDecision(state, { decisionId: "decision-middle", target: "middle", now: 2_000 });
  assert.equal(accepted.accepted, true);
  assert.equal(state.penalty.homeScore, 1, "A live middle penalty must count even if the goalkeeper stays middle.");
  assert.equal(state.penalty.kicks[0].goalkeeperTarget, "middle");
  assert.equal(state.penalty.kicks[0].scored, true);
}

{
  const state = match(4545);
  state.status = "penalties";
  state.controllers.home = "member-home";
  state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
  state.goalkeeperTendencies.away = { primaryTarget: "bottom-left", weights: [0, 0, 0, 1, 0] };
  state.pendingDecision = {
    id: "decision-middle-keeper-away",
    kind: "shootout",
    side: "home",
    memberId: "member-home",
    openedAt: 1_000,
    deadlineAt: 16_000,
    round: 1,
  };
  const accepted = resolveLivePenaltyDecision(state, {
    decisionId: "decision-middle-keeper-away",
    target: "middle",
    now: 2_000,
  });
  assert.equal(accepted.accepted, true);
  assert.equal(state.penalty.kicks[0].goalkeeperTarget, "bottom-left");
  assert.equal(state.penalty.kicks[0].scored, true, "A middle penalty must score when the goalkeeper dives away.");
}

{
  const state = match(4646);
  state.status = "penalties";
  state.controllers.home = "member-home";
  state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
  state.goalkeeperTendencies.away = { primaryTarget: "bottom-left", weights: [0, 0, 0, 1, 0] };
  state.pendingDecision = {
    id: "decision-opposite-height",
    kind: "shootout",
    side: "home",
    memberId: "member-home",
    openedAt: 1_000,
    deadlineAt: 16_000,
    round: 1,
  };
  const accepted = resolveLivePenaltyDecision(state, {
    decisionId: "decision-opposite-height",
    target: "top-left",
    now: 2_000,
  });
  assert.equal(accepted.accepted, true);
  assert.equal(state.penalty.kicks[0].goalkeeperTarget, "bottom-left");
  assert.equal(state.penalty.kicks[0].scored, true, "A manually aimed penalty must score when the keeper picks another target.");
}

{
  const state = match(5555);
  state.status = "penalties";
  state.controllers.home = "member-home";
  state.penalty = { homeScore: 0, awayScore: 0, homeKicks: 0, awayKicks: 0, currentSide: "home", kicks: [] };
  state.goalkeeperTendencies.away = { primaryTarget: "bottom-left", weights: [0, 0, 0, 1, 0] };
  state.pendingDecision = {
    id: "decision-bottom-left",
    kind: "shootout",
    side: "home",
    memberId: "member-home",
    openedAt: 1_000,
    deadlineAt: 16_000,
    round: 1,
  };
  const accepted = resolveLivePenaltyDecision(state, { decisionId: "decision-bottom-left", target: "bottom-left", now: 2_000 });
  assert.equal(accepted.accepted, true);
  assert.equal(state.penalty.kicks[0].goalkeeperTarget, "bottom-left");
  assert.equal(state.penalty.kicks[0].scored, false, "An exact non-middle goalkeeper dive must save the penalty.");
  assert.equal(state.penalty.kicks[0].missType, "save");
}

console.log("Progressive online live engine tests passed.");
