import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const retroEngine = fs.readFileSync(path.join(root, "retro-engine.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function functionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist.`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}.`);
}

const context = {
  PENALTY_TAKER_OVERRIDES: new Map([
    ["Portugal", "Cristiano Ronaldo"],
    ["Argentina", "Lionel Messi"],
    ["France", "Kylian Mbappé"],
    ["Norway", "Erling Haaland"],
  ]),
};
vm.createContext(context);
vm.runInContext(`
  ${functionSource(engine, "preferredPenaltyScorerProfiles")}
  ${functionSource(engine, "applyRedCardImpact")}
  globalThis.preferred = preferredPenaltyScorerProfiles;
  globalThis.redImpact = applyRedCardImpact;
`, context);

const portugal = [
  { name: "Cristiano Ronaldo", penaltyTaker: true },
  { name: "Bruno Fernandes", penaltyTaker: true },
  { name: "João Félix", penaltyTaker: false },
  { name: "Nélson Semedo", penaltyTaker: false },
];
assert.deepEqual(
  Array.from(context.preferred({ name: "Portugal" }, portugal, "penalty"), (player) => player.name),
  ["Cristiano Ronaldo"],
  "Ronaldo must be Portugal's sole first-choice penalty scorer while eligible.",
);
assert.deepEqual(
  Array.from(context.preferred({ name: "Portugal" }, portugal.slice(1), "penalty"), (player) => player.name),
  ["Bruno Fernandes"],
  "Bruno must take over when Ronaldo is unavailable.",
);
assert.equal(
  context.preferred({ name: "Portugal" }, portugal, "openPlay").length,
  portugal.length,
  "The penalty hierarchy must not affect open-play scorer selection.",
);

const earlyHomeRed = context.redImpact(1.5, 1.2, { side: "home", minute: 20 });
assert.ok(earlyHomeRed.homeXG <= 0.95, "An early red must sharply reduce the dismissed team's attack.");
assert.ok(earlyHomeRed.awayXG >= 1.5, "An early red must materially improve the opponent's scoring outlook.");
const lateAwayRed = context.redImpact(1.5, 1.2, { side: "away", minute: 82 });
assert.ok(lateAwayRed.awayXG < 1.1, "Even a late red must leave a meaningful disadvantage.");
assert.ok(lateAwayRed.homeXG > 1.55, "The opponent must benefit from a late dismissal.");

assert.match(
  app,
  /preferredPenaltyScorerProfiles\([\s\S]*eligibleScorerProfiles\([\s\S]*goalType/,
  "Regulation penalty goals must use the strict taker hierarchy.",
);
assert.match(
  retroEngine,
  /function primaryPenaltyScorer[\s\S]*orderedTakers[\s\S]*return player[\s\S]*penalty \? primaryPenaltyScorer\(year, team, candidates\)/,
  "Instantly simulated retro matches must also use the first available penalty taker.",
);
assert.match(
  retroEngine,
  /2018:[\s\S]*Portugal: \["cristianoronaldo"\]/,
  "The 2018 Portugal hierarchy must keep Ronaldo first.",
);

console.log("Penalty hierarchy and red-card impact checks passed.");
