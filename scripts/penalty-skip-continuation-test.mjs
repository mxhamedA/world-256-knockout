import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appSource = readFileSync(join(root, "app.js"), "utf8");

function functionSource(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist.`);
  const signatureEnd = appSource.indexOf(") {", start);
  assert.notEqual(signatureEnd, -1, `${name} must have a function body.`);
  const bodyStart = signatureEnd + 2;
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}.`);
}

const context = vm.createContext({});
vm.runInContext(`
  ${functionSource("completedShootoutPrefix")}
  globalThis.completedShootoutPrefix = completedShootoutPrefix;
`, context);

const sequence = [
  { side: "home", scored: false, player: "Belgium 1", round: 1, interactive: true },
  { side: "away", scored: true, player: "Italy 1", round: 1, interactive: true },
  { side: "home", scored: false, player: "Belgium 2", round: 2, interactive: true },
  { side: "away", scored: true, player: "Italy 2", round: 2, interactive: true },
  { side: "home", scored: true, player: "Belgium 3", round: 3, interactive: true },
];

const completedAfterTwoRounds = context.completedShootoutPrefix({
  shootout: sequence,
  shootoutIndex: 3,
  shootoutStep: "result",
});
assert.equal(completedAfterTwoRounds.length, 4);
assert.equal(completedAfterTwoRounds.filter((attempt) => attempt.side === "home" && attempt.scored).length, 0);
assert.equal(completedAfterTwoRounds.filter((attempt) => attempt.side === "away" && attempt.scored).length, 2);
assert.ok(completedAfterTwoRounds.every((attempt) => attempt.interactive === false));

const awaitingThirdBelgiumKick = context.completedShootoutPrefix({
  shootout: sequence,
  shootoutIndex: 4,
  shootoutStep: "setup",
});
assert.equal(awaitingThirdBelgiumKick.length, 4);
assert.equal(awaitingThirdBelgiumKick.some((attempt) => attempt.player === "Belgium 3"), false);

const thirdBelgiumKickInFlight = context.completedShootoutPrefix({
  shootout: sequence,
  shootoutIndex: 4,
  shootoutStep: "flight",
});
assert.equal(thirdBelgiumKickInFlight.length, 5);
assert.equal(thirdBelgiumKickInFlight.at(-1).player, "Belgium 3");

const skipSource = functionSource("skipPenaltyShootout");
assert.match(
  skipSource,
  /const completedAttempts = completedShootoutPrefix\(livePlayback\)[\s\S]*simulatePenaltyShootoutContinuation\([\s\S]*completedAttempts/,
  "Skipping must continue from the completed manual kicks.",
);
assert.doesNotMatch(
  skipSource,
  /simulatePenaltyShootout\(/,
  "Skipping must never replace a partial shootout with a fresh result.",
);

const continuationSource = functionSource("simulatePenaltyShootoutContinuation");
assert.match(
  continuationSource,
  /const sequence = completedAttempts\.map[\s\S]*const penalties = \{[\s\S]*sequence\.filter/,
  "The continuation must derive its opening score from the preserved attempts.",
);
assert.match(
  continuationSource,
  /takeKick\(kicks\.home <= kicks\.away \? "home" : "away"\)/,
  "The CPU must resume with the correct next side.",
);

console.log("Penalty skip continuation regression checks passed.");
