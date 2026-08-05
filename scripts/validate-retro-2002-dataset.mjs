import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function evaluate(file, exportName, globalName) {
  const context = {};
  const source = `${fs.readFileSync(path.join(root, file), "utf8")}\nthis.${globalName} = ${exportName};`;
  vm.runInNewContext(source, context, { filename: file });
  return context[globalName];
}

const worldCups = evaluate("retro-data.js", "RETRO_WORLD_CUPS", "worldCups");
const squads = evaluate("data/retro/2002/squads.js", "RETRO_2002_SQUADS", "squads");
const edition = worldCups[2002];

assert.ok(edition, "2002 World Cup metadata is present");
assert.equal(edition.rankingDate, "2002-05-15");
assert.match(edition.rankingSource, /FIFA\/Coca-Cola/);
assert.equal(edition.teams.length, 32);
assert.equal(Object.keys(squads).length, 32);
assert.deepEqual([...new Set(edition.teams.map((team) => team.group))].sort(), ["A", "B", "C", "D", "E", "F", "G", "H"]);
assert.ok(edition.teams.every((team) => Number.isInteger(team.fifaRank) && Number.isInteger(team.fifaPoints)));
assert.equal(edition.teams.filter((team) => team.fifaRank === 2).length, 2, "Brazil and Argentina share rank 2");

let playerCount = 0;
let anchorCount = 0;
for (const team of edition.teams) {
  const squad = squads[team.name];
  assert.ok(squad, `${team.name} has a squad record`);
  assert.equal(squad.group, team.group);
  assert.equal(squad.teamRatings.overall, team.rating);
  assert.equal(squad.fifaRanking.rank, team.fifaRank);
  assert.equal(squad.fifaRanking.points, team.fifaPoints);
  assert.equal(squad.players.length, 23, `${team.name} has 23 players`);
  assert.equal(squad.players.filter((player) => player.position === "GK").length, 3, `${team.name} has three goalkeepers`);
  assert.equal(squad.startingXI.length, 11, `${team.name} has an opening XI`);
  assert.equal(new Set(squad.startingXI).size, 11);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 23);
  assert.ok(squad.coach, `${team.name} has a coach`);
  assert.ok(squad.players.every((player) => player.club), `${team.name} has dated club affiliations`);
  assert.ok(squad.players.every((player) => Number.isInteger(player.overall) && player.overall >= 55 && player.overall <= 96));
  assert.ok(squad.players.every((player) => Number.isInteger(player.fifaRating) && player.fifaRating >= 55 && player.fifaRating <= 97));
  assert.ok(squad.players.every((player) => player.ratingSource && player.ratingJustification));
  anchorCount += squad.players.filter((player) => player.fifaRatingIsAnchor).length;
  playerCount += squad.players.length;
}

assert.equal(playerCount, 736, "all 32 official squads contain 736 players");
assert.ok(anchorCount >= 100, "the prominent players have FIFA-era rating anchors");
console.log(`2002 dataset valid: ${Object.keys(squads).length} squads, ${playerCount} players, ${anchorCount} anchored ratings.`);
