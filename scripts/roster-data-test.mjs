import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { DRAFT_TEAMS } from "../draft-team-catalog.generated.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = fs.readFileSync(path.join(root, "player-pools.generated.js"), "utf8");
const data = fs.readFileSync(path.join(root, "data.js"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${generated}\n${data}\nglobalThis.__rosterQa = {
  teams: TEAMS,
  pools: RECENT_NATIONAL_TEAM_PLAYERS,
  profiles: RECENT_NATIONAL_TEAM_PLAYER_PROFILES,
  sources: NATIONAL_TEAM_PLAYER_SOURCES,
};`, context);

const { teams, pools, profiles, sources } = context.__rosterQa;
const recognised = teams.filter((team) => team.confed !== "INVITED");
const completePositions = ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"];

recognised.forEach((team) => {
  assert.ok(Array.isArray(pools[team.name]) && pools[team.name].length >= 4, `${team.name} needs a sourced recent-player pool.`);
  assert.ok(sources[team.name], `${team.name} needs a traceable roster source.`);
  assert.equal(new Set(pools[team.name]).size, pools[team.name].length, `${team.name} contains duplicate player names.`);
});

Object.entries(profiles).forEach(([team, xi]) => {
  assert.ok(xi.length >= 11 && xi.length <= 26, `${team} must have a structured squad of 11-26 players.`);
  assert.deepEqual(Array.from(xi.slice(0, 11), (player) => player.position), completePositions, `${team} has invalid XI positions.`);
  assert.equal(new Set(xi.map((player) => player.name)).size, xi.length, `${team} has duplicate squad players.`);
  xi.forEach((player) => {
    assert.ok(player.name && !/^Player \d+$/i.test(player.name), `${team} contains a placeholder player.`);
    assert.ok(["GK", "DF", "MF", "FW"].includes(player.sourcePosition), `${team}: ${player.name} has no source position group.`);
  });
});

const germany = teams.find((team) => team.name === "Germany");
assert.ok(germany?.players?.length >= 26, "Germany needs a full 26-player recent squad.");
assert.ok(!germany.players.some((name) => /^Germany Player \d+$/i.test(name)), "Germany must not contain numbered placeholders.");

DRAFT_TEAMS.forEach((team) => {
  assert.equal(team.players.length, 26, `${team.name} needs a complete 26-player online squad.`);
  assert.equal(new Set(team.players).size, 26, `${team.name} has duplicate online squad names.`);
  assert.ok(!team.players.some((name) => /(?:^|\s)Player\s+\d+$/i.test(name)), `${team.name} contains a numbered placeholder.`);
});

assert.equal(Object.keys(pools).length, recognised.length, "Every recognised team needs a recent-player pool.");
assert.ok(Object.keys(profiles).length >= 195, "Structured source coverage unexpectedly dropped.");
console.log(`Roster data: ${Object.keys(pools).length} sourced pools, ${Object.keys(profiles).length} structured squads.`);
