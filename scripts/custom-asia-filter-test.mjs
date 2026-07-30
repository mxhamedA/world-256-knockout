import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
const dataSource = await readFile(new URL("../data.js", import.meta.url), "utf8");
const playerPoolSource = await readFile(new URL("../player-pools.generated.js", import.meta.url), "utf8");
const context = { console };

vm.createContext(context);
vm.runInContext(`${playerPoolSource}\n${dataSource}\nglobalThis.__teams = TEAMS;`, context);

const asianTeams = context.__teams.filter((team) => team.confed === "AFC");

assert.match(
  appSource,
  /if \(preset === "asia"\) return TEAMS\.filter\(\(team\) => team\.confed === "AFC"\);/,
  "The Asia filter must select only current AFC teams.",
);
assert.match(
  appSource,
  /<option value="asia"[^>]*>Only Asia<\/option>/,
  "The custom tournament quick-fill menu must expose Only Asia.",
);
assert.equal(asianTeams.length, 46, "The Asia filter should contain all 46 current AFC teams.");
assert.ok(asianTeams.some((team) => team.name === "Japan"), "Japan should be available in the Asia filter.");
assert.ok(asianTeams.some((team) => team.name === "Palestine"), "Palestine should be available in the Asia filter.");
assert.ok(asianTeams.every((team) => !team.retroWorldCup), "The Asia filter must not include retro squads.");

console.log("Custom tournament Asia filter checks passed.");
