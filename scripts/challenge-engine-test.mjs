import assert from "node:assert/strict";
import { DRAFT_TEAMS } from "../draft-team-catalog.generated.mjs";
import {
  CHALLENGE_COUNTED_RUN_LIMIT,
  CHALLENGE_GOAL_LEVEL,
  CHALLENGE_TEAM_ID,
  CHALLENGE_UPSET_MODE,
  countedRunIds,
  createChallengeRunState,
  opponentRankMultiplier,
  playChallengeRound,
  scoreChallengeWin,
} from "../challenge-engine.mjs";

assert.equal(opponentRankMultiplier(1), 3);
assert.equal(opponentRankMultiplier(10), 3);
assert.equal(opponentRankMultiplier(11), 2.5);
assert.equal(opponentRankMultiplier(26), 2);
assert.equal(opponentRankMultiplier(51), 1.5);
assert.equal(opponentRankMultiplier(101), 1);
assert.deepEqual(scoreChallengeWin(0, 8, 9), {
  progressPoints: 3,
  goalPoints: 5,
  championPoints: 0,
  total: 8,
});
assert.equal(scoreChallengeWin(7, 5, 2, true).total, 117);

let state = createChallengeRunState(DRAFT_TEAMS, "fixed-test-seed");
assert.equal(state.lockedTeamId, CHALLENGE_TEAM_ID);
assert.equal(state.upsetMode, CHALLENGE_UPSET_MODE);
assert.equal(state.goalLevel, CHALLENGE_GOAL_LEVEL);
assert.equal(state.currentTeamIds.length, 256);

let playedRounds = 0;
while (state.status === "active") {
  const result = playChallengeRound(state, DRAFT_TEAMS);
  state = result.state;
  playedRounds += 1;
  assert.equal(state.rounds.length, playedRounds);
  assert.ok(result.match.homeId === CHALLENGE_TEAM_ID || result.match.awayId === CHALLENGE_TEAM_ID);
  assert.ok(result.breakdown.goalPoints <= 5);
}
assert.ok(playedRounds >= 1 && playedRounds <= 8);

const tampered = createChallengeRunState(DRAFT_TEAMS, "tampered");
tampered.lockedTeamId = "team-1";
assert.throws(() => playChallengeRound(tampered, DRAFT_TEAMS), /settings failed validation/);

const runs = Array.from({ length: 30 }, (_, index) => ({ id: `run-${index}`, score: index, completedAt: index }));
const counted = countedRunIds(runs);
assert.equal(counted.size, CHALLENGE_COUNTED_RUN_LIMIT);
assert.equal(counted.has("run-29"), true);
assert.equal(counted.has("run-5"), true);
assert.equal(counted.has("run-4"), false);

console.log("Palestine Challenge engine tests passed.");
