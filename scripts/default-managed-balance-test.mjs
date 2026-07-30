import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const [appSource, dataSource, playerPoolsSource] = await Promise.all([
  readFile(new URL("app.js", root), "utf8"),
  readFile(new URL("data.js", root), "utf8"),
  readFile(new URL("player-pools.generated.js", root), "utf8"),
]);

assert.match(
  appSource,
  /function managedStandardTournamentBoost\([\s\S]*?!state\.customTournament[\s\S]*?!state\.premierLeagueSeason[\s\S]*?!state\.legacyTournament[\s\S]*?!isRetroSimulatorState\(\)/,
  "Managed-team assistance must be isolated to the standard 256-team mode.",
);
assert.match(
  appSource,
  /attack: 1\.15 \+ underdogScale \* 0\.16 \+ lateRoundScale \* 0\.05/,
  "Managed 256 teams must receive meaningful attacking assistance.",
);
assert.match(
  appSource,
  /defence: 0\.89 - underdogScale \* 0\.09 - lateRoundScale \* 0\.04/,
  "Managed 256 teams must receive defensive and late-round assistance.",
);
assert.match(
  appSource,
  /standardManagedBoost\.attack[\s\S]*standardManagedBoost\.defence/,
  "The managed 256 multipliers must feed into the expected-goals calculation.",
);

const context = { console };
vm.createContext(context);
vm.runInContext(
  `${playerPoolsSource}\n${dataSource}\nglobalThis.__teams = TEAMS;`,
  context,
);
const teams = context.__teams;
const france = teams.find((team) => team.name === "France");
const spain = teams.find((team) => team.name === "Spain");

assert.equal(france.rating, 94, "France's visible 256-mode rating must be reduced from 99 to 94.");
assert.equal(france.simulationRatings.overall, 94);
assert.equal(france.simulationRatings.attack, 93);
assert.ok(
  france.simulationRatings.goalkeeper < spain.simulationRatings.goalkeeper,
  "France must retain a believable weakness relative to the strongest team.",
);

console.log("Managed 256-mode assistance and France balance checks passed.");
