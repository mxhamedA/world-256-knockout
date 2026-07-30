import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const challengeSource = readFileSync(join(root, "challenge.js"), "utf8");

function functionSource(name) {
  const start = challengeSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist.`);
  const bodyStart = challengeSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < challengeSource.length; index += 1) {
    if (challengeSource[index] === "{") depth += 1;
    if (challengeSource[index] === "}") depth -= 1;
    if (depth === 0) return challengeSource.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}.`);
}

const context = vm.createContext({});
vm.runInContext(`
  ${functionSource("completedRetroChampion")}
  globalThis.completedRetroChampion = completedRetroChampion;
`, context);

const completedRetroChampion = context.completedRetroChampion;
const final = (winner, revealed = true) => [{
  name: "Finals",
  matches: [{
    id: "ko-final",
    home: "Belgium",
    away: "Italy",
    result: { winner, revealed },
  }],
}];
const finalWithoutReveal = (winner) => [{
  name: "Finals",
  matches: [{
    id: "ko-final",
    home: "Belgium",
    away: "Italy",
    result: { winner },
  }],
}];

assert.equal(
  completedRetroChampion({
    phase: "knockout",
    managedTeam: "Belgium",
    champion: null,
    knockoutRounds: final("Belgium"),
  }),
  null,
  "A hidden precomputed final winner must not unlock an achievement before the tournament is complete.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Belgium",
    knockoutRounds: finalWithoutReveal("Belgium"),
  }),
  null,
  "A final result without an explicit full-time reveal must not unlock an achievement.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Belgium",
    knockoutRounds: final("Belgium", false),
  }),
  null,
  "An unrevealed final must not unlock an achievement.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Belgium",
    knockoutRounds: final("Italy"),
  }),
  null,
  "A stale predicted Belgium champion must not survive an interactive final loss to Italy.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Italy",
    knockoutRounds: final("Italy"),
  }),
  "Italy",
  "The revealed final winner should be accepted when it matches the completed tournament champion.",
);

assert.match(
  challengeSource,
  /const phase = tournament\.phase === "complete" && champion \? "complete" : "start";/,
  "Achievement tracking must only submit a completed run with a validated champion.",
);

const retroEngineSource = readFileSync(join(root, "retro-engine.js"), "utf8");
assert.match(
  retroEngineSource,
  /totalExpectedGoals:[\s\S]*?revealed: true,[\s\S]*?advanceTournament\(tournament\);/,
  "Instant simulations must explicitly reveal their result before tournament completion can unlock an achievement.",
);

console.log("Retro achievement finalist-loss regression checks passed.");
