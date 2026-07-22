import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const tactics = {
  balanced: { passMs: 900, turnover: 0.14, width: 1, line: 0, directness: 0.48 },
  "tiki-taka": { passMs: 650, turnover: 0.09, width: 0.86, line: 5, directness: 0.2 },
  counter: { passMs: 620, turnover: 0.17, width: 1.08, line: -8, directness: 0.88 },
  "high-press": { passMs: 710, turnover: 0.21, width: 0.94, line: 9, directness: 0.62 },
  defensive: { passMs: 980, turnover: 0.11, width: 0.88, line: -12, directness: 0.34 },
};
const context = { console };
vm.createContext(context);
vm.runInContext(`const STANDARD_TACTICS = ${JSON.stringify(tactics)};\n${source}\nglobalThis.__create = createPossessionMatchEngine;
globalThis.__advance = advancePossessionMatchEngine;
globalThis.__actions = POSSESSION_ACTION_TYPES;
`, context);

const team = (id, rating) => ({
  id,
  name: id.toUpperCase(),
  rating,
  simulationRatings: {
    overall: rating,
    attack: rating,
    midfield: rating,
    defence: rating,
    goalkeeper: rating,
    squadDepth: rating,
    experience: rating,
    penalties: rating,
    discipline: 70,
  },
});

const positions = ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CAM", "LW", "ST", "RW"];
const profiles = (teamId, rating, starRating = rating) => positions.map((position, index) => ({
  id: `${teamId}-${index}`,
  name: index === 9 ? `${teamId} Star` : `${teamId} Player ${index + 1}`,
  position,
  overall: index === 9 ? starRating : rating - (index % 4),
  pace: index === 9 ? starRating : rating,
  shooting: index === 9 ? starRating : position === "GK" ? 5 : rating - 6,
  finishing: index === 9 ? starRating : position === "GK" ? 5 : rating - 6,
  passing: rating,
  dribbling: index === 9 ? starRating : rating,
  defending: ["LB", "CB", "RB"].includes(position) ? rating : rating - 20,
  physical: rating,
  goalkeeping: position === "GK" ? rating : 5,
}));

function play(seed, homeTactic = "counter", awayTactic = "high-press") {
  const engine = context.__create({
    seed,
    home: team("home", 86),
    away: team("away", 78),
    homeProfiles: profiles("home", 86, 96),
    awayProfiles: profiles("away", 78, 84),
    homeTactic,
    awayTactic,
    goalLevel: "normal",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(engine.events)), [], "Kickoff must not contain a goal or scorer.");
  const actions = [];
  while (engine.nextMinute <= 90 && actions.length < 500) {
    const action = context.__advance(engine, engine.nextMinute);
    assert.ok(action, "Every due engine tick must produce an action.");
    actions.push({
      type: action.type,
      outcome: action.outcome,
      actor: action.actor?.name,
      target: action.target?.name,
      minute: Number(action.minute.toFixed(4)),
      xg: action.xg === undefined ? null : Number(action.xg.toFixed(4)),
    });
  }
  assert.ok(actions.length >= 45 && actions.length <= 120, "A match should remain lightweight but eventful.");
  assert.ok(engine.events.every((event) => event.type === "goal" && event.scorer), "Every recorded goal needs a real shooter.");
  assert.equal(
    engine.events.length,
    actions.filter((action) => action.type === "shot" && action.outcome === "goal").length,
    "The score must be created only by successful shot actions.",
  );
  assert.equal(engine.score.home + engine.score.away, engine.events.length);
  return { engine, actions };
}

const first = play(741852);
const replay = play(741852);
assert.deepEqual(replay.actions, first.actions, "The same seed must reproduce every possession action.");
assert.deepEqual(JSON.parse(JSON.stringify(replay.engine.score)), JSON.parse(JSON.stringify(first.engine.score)));
assert.notDeepEqual(
  play(741852, "tiki-taka", "defensive").actions,
  first.actions,
  "Changing tactics must alter the generated action sequence.",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__actions)),
  ["safe-pass", "progressive-pass", "through-ball", "dribble", "cross", "shot", "tackle", "interception", "clearance", "foul"],
);

const observed = new Set();
const observedOutcomes = new Set();
let totalGoals = 0;
let totalShots = 0;
let shortPasses = 0;
let mediumPasses = 0;
let longPasses = 0;
let completedPasses = 0;
let dribblesAttempted = 0;
let dribblesCompleted = 0;
let progressiveCarries = 0;
let throughBalls = 0;
let crosses = 0;
let possessionActions = 0;
let possessions = 0;
let movingPercentageTotal = 0;
let movingPercentageSamples = 0;
let penaltyFouls = 0;
let homeStarShots = 0;
let homeOtherShots = 0;
for (let seed = 1; seed <= 160; seed += 1) {
  const result = play(seed * 104729);
  result.actions.forEach((action) => {
    observed.add(action.type);
    observedOutcomes.add(action.outcome);
  });
  penaltyFouls += result.actions.filter((action) => action.type === "foul" && action.outcome === "penalty").length;
  homeStarShots += result.actions.filter((action) => action.type === "shot" && action.actor === "home Star").length;
  homeOtherShots += result.actions.filter((action) => action.type === "shot" && action.actor?.startsWith("home ") && action.actor !== "home Star").length;
  totalGoals += result.engine.score.home + result.engine.score.away;
  totalShots += result.engine.stats.shots.home + result.engine.stats.shots.away;
  for (const side of ["home", "away"]) {
    const passStats = result.engine.stats.passes[side];
    shortPasses += passStats.short;
    mediumPasses += passStats.medium;
    longPasses += passStats.long;
    completedPasses += passStats.completed;
    dribblesAttempted += result.engine.stats.dribbles[side].attempted;
    dribblesCompleted += result.engine.stats.dribbles[side].completed;
    progressiveCarries += result.engine.stats.progressiveCarries[side];
    throughBalls += result.engine.stats.throughBalls[side];
    crosses += result.engine.stats.crosses[side];
  }
  possessionActions += result.engine.stats.possessionLengths.reduce((sum, length) => sum + length, 0);
  possessions += result.engine.stats.possessionLengths.length;
  movingPercentageTotal += result.engine.stats.movingPlayerPercentage.total;
  movingPercentageSamples += result.engine.stats.movingPlayerPercentage.samples;
}
assert.ok(observed.has("safe-pass"));
assert.ok(observed.has("progressive-pass"));
assert.ok(observed.has("through-ball"));
assert.ok(observed.has("dribble"));
assert.ok(observed.has("cross"));
assert.ok(observed.has("shot"));
assert.ok(observed.has("tackle"));
assert.ok(observed.has("interception"));
assert.ok(observed.has("clearance"));
assert.ok(observed.has("foul"));
assert.ok(observedOutcomes.has("saved"), "Goalkeepers must make saves.");
assert.ok(observedOutcomes.has("blocked"), "Defenders must block shots.");
assert.ok(observedOutcomes.has("rebound"), "Saves must occasionally create rebounds.");
assert.ok(observedOutcomes.has("corner"), "Deflections must occasionally create corners.");
assert.ok(observedOutcomes.has("missed"), "Shots must be able to miss the target.");
assert.ok(penaltyFouls > 0, "Fouls in the box must be able to award penalties.");
assert.ok(homeStarShots > homeOtherShots / 10, "An elite striker must take more shots than an average teammate.");
const passTotal = shortPasses + mediumPasses + longPasses;
const averagePossessionActions = possessionActions / Math.max(1, possessions);
const averageMovingPercentage = movingPercentageTotal / Math.max(1, movingPercentageSamples);
console.log(`160-match profile:`);
console.log(`  passes/match: short ${(shortPasses / 160).toFixed(1)}, medium ${(mediumPasses / 160).toFixed(1)}, long ${(longPasses / 160).toFixed(1)} (${(longPasses / passTotal * 100).toFixed(1)}% long, ${(completedPasses / passTotal * 100).toFixed(1)}% complete)`);
console.log(`  dribbles/match: ${(dribblesAttempted / 160).toFixed(1)} attempted, ${(dribblesCompleted / 160).toFixed(1)} completed`);
console.log(`  progressive carries ${(progressiveCarries / 160).toFixed(1)}, through balls ${(throughBalls / 160).toFixed(1)}, crosses ${(crosses / 160).toFixed(1)} per match`);
console.log(`  average actions/possession ${averagePossessionActions.toFixed(2)}, players moving ${averageMovingPercentage.toFixed(1)}%`);
console.log(`  ${(totalShots / 160).toFixed(1)} shots and ${(totalGoals / 160).toFixed(2)} goals per match`);
assert.ok(totalShots / 160 >= 8, "Matches should create enough chances to watch.");
assert.ok(totalGoals / 160 >= 1 && totalGoals / 160 <= 5, "Average scoring should stay football-like.");
assert.ok(longPasses / passTotal < 0.2, "Long balls must remain a minority of passes.");
assert.ok(averagePossessionActions >= 4 && averagePossessionActions <= 10, "Most possessions should develop through 4 to 10 actions on average.");
assert.ok(dribblesAttempted / 160 >= 8, "Each match should contain several visible carries or dribbles per team.");
assert.ok(averageMovingPercentage >= 55, "Most nearby players should be moving at each simulation step.");

console.log(`Possession engine passed: ${(totalShots / 160).toFixed(1)} shots and ${(totalGoals / 160).toFixed(2)} goals per match.`);
