import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "retro-2026-squads.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__data = RETRO_WORLD_CUPS;
globalThis.__squads = RETRO_2026_SQUADS;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data[2026];
const squads = context.__squads;
const engine = context.__engine;

assert.equal(data.teams.length, 48, "2026 must contain all 48 qualified teams");
assert.equal(Object.keys(squads).length, 48, "2026 must contain 48 official squads");
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 26, `${team} must have a 26-player squad`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 26, `${team} shirt numbers must be unique`);
  assert.equal(squad.startingXI.length, 11, `${team} must have a starting XI`);
  const lineup = engine.startingXI(2026, team);
  assert.equal(lineup.players.length, 11, `${team} lineup must resolve to 11 official players`);
  assert.ok(lineup.players.some((player) => player.position === "GK"), `${team} lineup must include a goalkeeper`);
  assert.match(squad.ratingBlend.formula, /40% FC 26 squad, 32% FIFA ranking, 28% 2026 tournament performance/);
});

const tournament = engine.createTournament({ year: 2026, seed: 20260719, managedTeam: "Spain" });
assert.equal(engine.teamEntry(2026, "Spain").rating, squads.Spain.teamRatings.overall);
assert.equal(engine.teamEntry(2026, "Argentina").rating, squads.Argentina.teamRatings.overall);
assert.equal(tournament.groupMatches.length, 72, "12 groups must produce 72 group matches");
assert.equal(engine.validate(tournament), true, "new 2026 tournaments must validate");

while (tournament.phase === "group") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds[0].name, "Round of 32");
assert.equal(tournament.knockoutRounds[0].matches.length, 16);
assert.equal(new Set(tournament.knockoutRounds[0].matches.flatMap((match) => [match.home, match.away])).size, 32);
assert.equal(tournament.bestThirdPlaced.length, 8);

while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.deepEqual(
  Array.from(tournament.knockoutRounds, (round) => round.name),
  ["Round of 32", "Round of 16", "Quarter-finals", "Semi-finals", "Finals"],
);
assert.ok(tournament.champion, "completed tournament must crown a champion");
assert.equal(engine.allMatches(tournament).length, 104, "full 2026 tournament must contain 104 matches");

console.log("2026 World Cup squads, ratings, format, and completion flow verified.");
