import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = app.indexOf(`function ${name}(`);
  const end = app.indexOf(`function ${nextName}(`, start);
  assert.notEqual(start, -1, `${name} should exist`);
  assert.notEqual(end, -1, `${nextName} should follow ${name}`);
  return app.slice(start, end);
}

const factory = new Function(
  "simulateMatch",
  `${functionSource("simulateAndRevealMatch", "revealOrphanedSimulatedResult")}
   ${functionSource("revealOrphanedSimulatedResult", "buildNextRound")}
   return { simulateAndRevealMatch, revealOrphanedSimulatedResult };`,
);

let simulations = 0;
const { simulateAndRevealMatch, revealOrphanedSimulatedResult } = factory(() => {
  simulations += 1;
  return { homeGoals: 2, awayGoals: 1, revealed: false };
});

const freshMatch = { result: null };
const completed = simulateAndRevealMatch(freshMatch, 0);
assert.equal(simulations, 1);
assert.equal(completed.revealed, true);
assert.equal(freshMatch.result.revealed, true);

const orphanedMatch = { result: { homeGoals: 1, awayGoals: 0, revealed: false } };
simulateAndRevealMatch(orphanedMatch, 0);
assert.equal(simulations, 1, "an existing simulation should not be rerun");
assert.equal(orphanedMatch.result.revealed, true);

const savedOrphan = { result: { revealed: false } };
assert.equal(revealOrphanedSimulatedResult(savedOrphan), true);
assert.equal(savedOrphan.result.revealed, true);

const liveMatch = { result: { revealed: false, engineVersion: 2 } };
assert.equal(revealOrphanedSimulatedResult(liveMatch), false);
assert.equal(liveMatch.result.revealed, false, "a resumable live match must remain hidden");

assert.doesNotMatch(
  functionSource("simulateCurrentRound", "requestRoundSimulation"),
  /result\s*=\s*simulateMatch/,
  "round simulation should only use the atomic helper",
);

console.log("Mass round simulation regression checks passed.");
