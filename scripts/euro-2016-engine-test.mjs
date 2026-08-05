import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appSource = readFileSync(join(root, "app.js"), "utf8");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "data/retro/euro-2016/squads.js",
  "data/retro/euro-2016/schedule.js",
  "retro-engine.js",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__data = RETRO_WORLD_CUPS;
globalThis.__squads = RETRO_EURO_2016_SQUADS;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data;
const squads = context.__squads;
const engine = context.__engine;
const lineupHelpersStart = appSource.indexOf("const RETRO_MANAGER_SLOT_POSITIONS");
const lineupHelpersEnd = appSource.indexOf("function retroSelectAvailableStarterNumbers");
assert.ok(lineupHelpersStart >= 0 && lineupHelpersEnd > lineupHelpersStart);
vm.runInContext(`${appSource.slice(lineupHelpersStart, lineupHelpersEnd)}
globalThis.__slotPositions = RETRO_MANAGER_SLOT_POSITIONS;
globalThis.__positionFit = retroPlayerPositionFit;
globalThis.__normalizeStarterSlotOrder = retroNormalizeStarterSlotOrder;`, context);
const slotPositions = context.__slotPositions;
const positionFit = context.__positionFit;
const normalizeStarterSlotOrder = context.__normalizeStarterSlotOrder;
const expectedGroups = [
  "France,Romania,Albania,Switzerland",
  "England,Russia,Wales,Slovakia",
  "Germany,Ukraine,Poland,Northern Ireland",
  "Spain,Czech Republic,Turkey,Croatia",
  "Belgium,Italy,Republic of Ireland,Sweden",
  "Portugal,Iceland,Austria,Hungary",
];

assert.equal(data[2016].teams.length, 24);
expectedGroups.forEach((expected, index) => {
  const group = String.fromCharCode(65 + index);
  assert.equal(
    data[2016].teams.filter((team) => team.group === group).map((team) => team.name).join(","),
    expected,
    `Euro 2016 Group ${group} should match the official draw`,
  );
});

assert.equal(Object.keys(squads).length, 24);
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 23, `${team} should have 23 official final-squad players`);
  assert.equal(new Set(squad.players.map((player) => player.name)).size, 23, `${team} player names should be unique`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 23, `${team} shirt numbers should be unique`);
  assert.equal(squad.players.filter((player) => player.position === "GK").length, 3, `${team} should have three goalkeepers`);
  assert.equal(squad.startingXI.length, 11, `${team} should have an 11-player historical starting XI`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} starting XI should not repeat players`);
  assert.equal(engine.startingXI(2016, team).players.length, 11);
  assert.equal(engine.startingXI(2016, team).formation, squad.formation);

  const orderedNumbers = normalizeStarterSlotOrder(squad.players, squad.startingXI, squad.formation);
  const orderedPlayers = orderedNumbers.map((number) => (
    squad.players.find((player) => player.number === number)
  ));
  const slots = slotPositions[squad.formation];
  assert.equal(orderedPlayers.length, 11, `${team} should fill every formation slot`);
  assert.equal(orderedPlayers[0].position, "GK", `${team} should start a goalkeeper in goal`);
  orderedPlayers.forEach((player, index) => {
    assert.ok(
      positionFit(player, slots[index]) > 0,
      `${team}: ${player.name} (${player.position}) must be credible at ${slots[index]}`,
    );
  });
});

const france = squads.France;
const orderedFrance = normalizeStarterSlotOrder(france.players, france.startingXI, france.formation)
  .map((number) => france.players.find((player) => player.number === number));
assert.equal(orderedFrance[1].name, "Patrice Evra", "France's left-back must occupy the left-back slot");
assert.equal(orderedFrance[4].name, "Bacary Sagna", "France's right-back must occupy the right-back slot");

const tournament = engine.createTournament({ year: 2016, seed: 2016, managedTeam: "France" });
assert.equal(tournament.groupMatches.length, 36);
assert.equal(engine.validate(tournament), true);
assert.ok(tournament.groupMatches.every((match) => match.schedule?.stadium && match.schedule?.city));
assert.equal(new Set(tournament.groupMatches.map((match) => match.schedule.matchNumber)).size, 36);

while (tournament.phase === "group") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds[0].matches.length, 8);
assert.equal(tournament.bestThirdPlaced.length, 4);
assert.equal(new Set(tournament.knockoutRounds[0].matches.flatMap((match) => [match.home, match.away])).size, 16);
assert.ok(tournament.knockoutRounds[0].matches.every((match) => match.schedule?.matchNumber));

for (const group of "ABCDEF") {
  const table = engine.groupStandings(tournament, group);
  assert.equal(table.length, 4);
  assert.ok(table.every((row) => row.played === 3));
  assert.ok(tournament.knockoutRounds[0].matches.some((match) => [match.home, match.away].includes(table[0].name)));
  assert.ok(tournament.knockoutRounds[0].matches.some((match) => [match.home, match.away].includes(table[1].name)));
}

while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.ok(tournament.champion);
assert.equal(tournament.knockoutRounds.map((round) => round.matches.length).join(","), "8,4,2,1");
assert.equal(engine.allMatches(tournament).length, 51);
assert.equal(new Set(engine.allMatches(tournament).map((match) => match.schedule?.matchNumber)).size, 51);
assert.ok(!engine.allMatches(tournament).some((match) => match.id === "ko-third-place"));

engine.allMatches(tournament).forEach((match) => {
  for (const [side, team] of [["home", match.home], ["away", match.away]]) {
    const squadNames = new Set(squads[team].players.map((player) => player.name));
    match.result[`${side}Events`].forEach((event) => {
      assert.ok(squadNames.has(event.scorer), `${event.scorer} must belong to Euro 2016 ${team}`);
    });
  }
});

const eliteTeams = new Set(["France", "Germany", "Spain", "Belgium", "Portugal", "Italy", "England", "Croatia"]);
const neutralChampions = new Map();
let neutralGoals = 0;
for (let index = 1; index <= 25; index += 1) {
  const balancedTournament = engine.createTournament({
    year: 2016,
    seed: 2016000 + index,
    managedTeam: null,
  });
  while (balancedTournament.phase !== "complete") engine.simulateActiveStage(balancedTournament);
  neutralChampions.set(
    balancedTournament.champion,
    (neutralChampions.get(balancedTournament.champion) || 0) + 1,
  );
  neutralGoals += engine.allMatches(balancedTournament).reduce((sum, match) => (
    sum + match.result.homeGoals + match.result.awayGoals
  ), 0);
}
const eliteNeutralTitles = [...neutralChampions.entries()]
  .filter(([team]) => eliteTeams.has(team))
  .reduce((sum, [, titles]) => sum + titles, 0);
assert.ok(eliteNeutralTitles >= 20, "Neutral Euro simulations should strongly favour the elite tier");
assert.ok(
  [...neutralChampions].every(([team]) => data[2016].teams.find((entry) => entry.name === team).rating >= 82),
  "Low-rated teams should not win the neutral 25-run balance sample",
);
assert.ok(
  neutralGoals / 25 >= 100 && neutralGoals / 25 <= 116,
  "Balanced Euro tournaments should remain near the historical scoring level",
);

function tournamentReach(tournament, teamName) {
  let reach = 0;
  tournament.knockoutRounds.forEach((round, index) => {
    if (round.matches.some((match) => [match.home, match.away].includes(teamName))) reach = index + 1;
  });
  if (tournament.champion === teamName) reach = 5;
  return reach;
}

let neutralAlbaniaReach = 0;
let managedAlbaniaReach = 0;
for (let index = 0; index < 100; index += 1) {
  const seed = 900000 + index;
  const neutralRun = engine.createTournament({ year: 2016, seed, managedTeam: null });
  const managedRun = engine.createTournament({ year: 2016, seed, managedTeam: "Albania" });
  while (neutralRun.phase !== "complete") engine.simulateActiveStage(neutralRun);
  while (managedRun.phase !== "complete") engine.simulateActiveStage(managedRun);
  neutralAlbaniaReach += tournamentReach(neutralRun, "Albania");
  managedAlbaniaReach += tournamentReach(managedRun, "Albania");
}
assert.ok(
  managedAlbaniaReach > neutralAlbaniaReach * 1.75,
  "Managing an underdog should provide a meaningful but non-guaranteed advantage",
);

console.log("Euro 2016 engine passed: 24 squads, 552 players and a 51-match tournament.");
