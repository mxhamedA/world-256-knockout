import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const seasonSource = read("premier-league.js");
const context = vm.createContext({ window: {} });

[
  "premier-league-squads.generated.js",
  "premier-league-fc26-ratings.js",
  "premier-league-data.js",
].forEach((file) => vm.runInContext(read(file), context));

const candidateListSource = seasonSource.match(
  /const youngPlayerCandidateNames = Object\.freeze\((\[[\s\S]*?\])\);/,
)?.[1];
assert.ok(candidateListSource, "The YPOTY candidate list must be present.");

const candidates = vm.runInNewContext(candidateListSource);
const clubs = context.window.PREMIER_LEAGUE_2026_27_CLUBS;
const registeredNames = new Set(
  clubs.flatMap((club) => club.playerProfiles.map((player) => player.name)),
);

assert.ok(
  candidates.every((name) => registeredNames.has(name)),
  `YPOTY contains players outside the current league squads: ${candidates.filter((name) => !registeredNames.has(name)).join(", ")}`,
);
assert.ok(!candidates.includes("Jobe Bellingham"), "Jobe Bellingham must not be a PL YPOTY candidate.");
assert.ok(!candidates.includes("Kendry Páez"), "Kendry Páez must not be a PL YPOTY candidate.");
assert.ok(!candidates.includes("Wilfried Gnonto"), "Wilfried Gnonto must not be age-eligible for YPOTY.");
assert.match(
  seasonSource,
  /youngPlayerCandidateNames\.filter\(\(name\) => registeredPremierLeaguePlayerNames\.has\(name\)\)/,
  "YPOTY must be intersected with the live league squad dataset.",
);
assert.doesNotMatch(
  seasonSource,
  /enrichedPlayers\.filter\(\(row\) => row\.overall <= 82\)/,
  "YPOTY must not fall back to arbitrary low-rated players.",
);

console.log(`Premier League awards checks passed for ${candidates.length} registered YPOTY candidates.`);
