import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "data/retro/2010/squads.js",
  "data/retro/2010/schedule.js",
  "data/retro/2014/squads.js",
  "data/retro/2014/schedule.js",
  "data/retro/2018/squads.js",
  "data/retro/2018/schedule.js",
  "data/retro/2022/squads.js",
  "data/retro/2022/schedule.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__retroData = RETRO_WORLD_CUPS;
globalThis.__retro2010Squads = RETRO_2010_SQUADS;
globalThis.__retroSquads = RETRO_2014_SQUADS;
globalThis.__retro2018Squads = RETRO_2018_SQUADS;
globalThis.__retro2022Squads = RETRO_2022_SQUADS;
globalThis.__retroEngine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__retroData;
const squads2010 = context.__retro2010Squads;
const squads = context.__retroSquads;
const squads2018 = context.__retro2018Squads;
const squads2022 = context.__retro2022Squads;
const engine = context.__retroEngine;

const expectedGroups = {
  2010: [
    "South Africa,Mexico,Uruguay,France",
    "Argentina,Nigeria,South Korea,Greece",
    "England,USA,Algeria,Slovenia",
    "Germany,Australia,Serbia,Ghana",
    "Netherlands,Denmark,Japan,Cameroon",
    "Italy,Paraguay,New Zealand,Slovakia",
    "Brazil,North Korea,Ivory Coast,Portugal",
    "Spain,Switzerland,Honduras,Chile",
  ],
  2014: [
    "Brazil,Croatia,Mexico,Cameroon",
    "Spain,Netherlands,Chile,Australia",
    "Colombia,Greece,Ivory Coast,Japan",
    "Uruguay,Costa Rica,England,Italy",
    "Switzerland,Ecuador,France,Honduras",
    "Argentina,Bosnia and Herzegovina,Iran,Nigeria",
    "Germany,Portugal,Ghana,USA",
    "Belgium,Algeria,Russia,South Korea",
  ],
  2018: [
    "Russia,Saudi Arabia,Egypt,Uruguay",
    "Portugal,Spain,Morocco,Iran",
    "France,Australia,Peru,Denmark",
    "Argentina,Iceland,Croatia,Nigeria",
    "Brazil,Switzerland,Costa Rica,Serbia",
    "Germany,Mexico,Sweden,South Korea",
    "Belgium,Panama,Tunisia,England",
    "Poland,Senegal,Colombia,Japan",
  ],
  2022: [
    "Qatar,Ecuador,Senegal,Netherlands",
    "England,Iran,USA,Wales",
    "Argentina,Saudi Arabia,Mexico,Poland",
    "France,Australia,Denmark,Tunisia",
    "Spain,Costa Rica,Germany,Japan",
    "Belgium,Canada,Morocco,Croatia",
    "Brazil,Serbia,Switzerland,Cameroon",
    "Portugal,Ghana,Uruguay,South Korea",
  ],
};

Object.entries(expectedGroups).forEach(([year, groups]) => {
  assert.equal(data[year].teams.length, 32, `${year} should have 32 teams`);
  groups.forEach((expected, groupIndex) => {
    const group = String.fromCharCode(65 + groupIndex);
    const actual = data[year].teams
      .filter((team) => team.group === group)
      .map((team) => team.name)
      .join(",");
    assert.equal(actual, expected, `${year} Group ${group} should match the official draw`);
  });
});

assert.equal(data[2014].teams.length, 32);
assert.equal(Object.keys(squads2010).length, 32);
Object.entries(squads2010).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 23, `${team} should have 23 official 2010 players`);
  assert.equal(new Set(squad.players.map((player) => player.name)).size, 23, `${team} should not repeat 2010 players`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 23, `${team} should not repeat 2010 shirt numbers`);
  assert.equal(squad.players.filter((player) => player.position === "GK").length, 3, `${team} should have three 2010 goalkeepers`);
  const lineup = engine.startingXI(2010, team);
  assert.equal(lineup.formation, squad.formation, `${team} should use its historical 2010 formation`);
  assert.equal(lineup.players.length, 11, `${team} should have a complete 2010 starting XI`);
  assert.equal(new Set(lineup.players.map((player) => player.number)).size, 11, `${team} 2010 starting XI should not repeat players`);
});
assert.equal(engine.startingXI(2010, "Spain").formation, "4-2-3-1");
assert.deepEqual(
  Array.from(engine.startingXI(2010, "Spain").players, (player) => player.name),
  ["Iker Casillas", "Sergio Ramos", "Gerard Piqué", "Carles Puyol", "Joan Capdevila", "Sergio Busquets", "Xabi Alonso", "Xavi", "Andrés Iniesta", "David Silva", "David Villa"],
);

assert.equal(Object.keys(squads).length, 32);
Object.entries(squads).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 23, `${team} should have 23 official players`);
  assert.equal(squad.players.filter((player) => player.position === "GK").length, 3, `${team} should have three goalkeepers`);
  assert.equal(squad.startingXI.length, 11, `${team} should have a sourced 2014 opening-match XI`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} 2014 opening-match XI should not repeat players`);
  assert.ok(squad.formation, `${team} should have a sourced 2014 formation`);
  const lineup = engine.startingXI(team);
  assert.equal(lineup.formation, squad.formation, `${team} should use its sourced 2014 formation`);
  assert.equal(lineup.players.length, 11, `${team} should have a complete starting XI`);
  assert.equal(new Set(lineup.players.map((player) => player.number)).size, 11, `${team} starting XI should not repeat players`);
});
assert.ok(squads.Germany.players.some((player) => player.name === "Thomas Müller"));
assert.ok(squads.Germany.players.some((player) => player.name === "Mesut Özil"));

assert.deepEqual(
  Array.from(engine.startingXI(2014, "Germany").players, (player) => player.number).sort((left, right) => left - right),
  [1, 4, 5, 6, 8, 13, 16, 17, 18, 19, 20],
);

assert.equal(Object.keys(squads2018).length, 32);
Object.entries(squads2018).forEach(([team, squad]) => {
  assert.equal(squad.players.length, 23, `${team} should have 23 official 2018 players`);
  assert.equal(squad.players.filter((player) => player.position === "GK").length, 3, `${team} should have three 2018 goalkeepers`);
  assert.equal(squad.startingXI.length, 11, `${team} should have a sourced 2018 opening-match XI`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} 2018 opening-match XI should not repeat players`);
  assert.ok(squad.formation, `${team} should have a sourced 2018 formation`);
  const lineup = engine.startingXI(2018, team);
  assert.equal(lineup.formation, squad.formation, `${team} should use its sourced 2018 formation`);
  assert.equal(lineup.players.length, 11, `${team} should have a complete 2018 starting XI`);
  assert.equal(new Set(lineup.players.map((player) => player.number)).size, 11, `${team} 2018 starting XI should not repeat players`);
});

assert.equal(Object.keys(squads2022).length, 32);
assert.equal(Object.values(squads2022).reduce((sum, squad) => sum + squad.players.length, 0), 831);
Object.entries(squads2022).forEach(([team, squad]) => {
  assert.equal(squad.players.length, team === "Iran" ? 25 : 26, `${team} should preserve its official 2022 squad size`);
  const expectedGoalkeepers = ["Iran", "Switzerland", "Tunisia"].includes(team) ? 4 : 3;
  assert.equal(squad.players.filter((player) => player.position === "GK").length, expectedGoalkeepers, `${team} should preserve its official 2022 goalkeeper count`);
  assert.ok(
    squad.players.every((player) => !["DF", "MF", "FW"].includes(player.position)),
    `${team} should expose detailed WC22 positions instead of broad groups`,
  );
  assert.ok(
    squad.players.every((player) => player.positions.includes(player.position)),
    `${team} should retain each player's primary role in the suitability list`,
  );
  assert.equal(squad.startingXI.length, 11, `${team} should have a sourced 2022 opening-match XI`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} 2022 opening-match XI should not repeat players`);
  assert.ok(squad.formation, `${team} should have a sourced 2022 formation`);
  const lineup = engine.startingXI(2022, team);
  assert.equal(lineup.formation, squad.formation, `${team} should use its sourced 2022 formation`);
  assert.equal(lineup.players.length, 11, `${team} should have a complete 2022 starting XI`);
  assert.equal(new Set(lineup.players.map((player) => player.number)).size, 11, `${team} 2022 starting XI should not repeat players`);
});
assert.equal(
  squads2022.England.players.find((player) => player.name === "Kyle Walker")?.position,
  "RB",
  "WC22 full-backs should keep their detailed role",
);
assert.equal(
  squads2022.Brazil.players.find((player) => player.name === "Casemiro")?.position,
  "CDM",
  "WC22 holding midfielders should keep their detailed role",
);
assert.ok(
  squads2022.Germany.players.find((player) => player.name === "Joshua Kimmich")?.positions.includes("RB"),
  "WC22 secondary positions should remain available to the lineup picker",
);

const tournament = engine.createTournament({ year: 2014, seed: 2014, managedTeam: "Brazil" });
assert.equal(tournament.groupMatches.length, 48);
assert.ok(tournament.groupMatches.every((match) => match.schedule?.stadium && match.schedule?.city));
[..."ABCDEFGH"].forEach((group) => {
  const matches = tournament.groupMatches.filter((match) => match.group === group);
  assert.equal(matches.length, 6);
  data[2014].teams.filter((team) => team.group === group).forEach((team) => {
    assert.equal(matches.filter((match) => [match.home, match.away].includes(team.name)).length, 3);
  });
});

while (tournament.phase === "group") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds[0].matches.length, 8);
[..."ABCDEFGH"].forEach((group) => {
  const table = engine.groupStandings(tournament, group);
  assert.equal(table.length, 4);
  assert.ok(table.every((row) => row.played === 3));
});

while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.ok(tournament.champion);
assert.equal(tournament.knockoutRounds.length, 4);
assert.equal(tournament.knockoutRounds.map((round) => round.matches.length).join(","), "8,4,2,2");
assert.ok(tournament.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-third-place"));
assert.ok(tournament.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-final"));
assert.equal(engine.allMatches(tournament).length, 64);
assert.ok(engine.allMatches(tournament).every((match) => match.schedule?.matchNumber));

engine.allMatches(tournament).forEach((match) => {
  if (!match.result) return;
  const penaltyMinutes = [
    ...match.result.homeEvents,
    ...match.result.awayEvents,
  ].filter((event) => event.penalty).map((event) => event.minute);
  penaltyMinutes.forEach((minute, index) => {
    penaltyMinutes.slice(index + 1).forEach((otherMinute) => {
      assert.ok(Math.abs(otherMinute - minute) >= 12, `${match.id} has penalties too close together`);
    });
  });
  [["home", match.home], ["away", match.away]].forEach(([side, team]) => {
    const squadNames = new Set(squads[team].players.map((player) => player.name));
    match.result[`${side}Events`].forEach((event) => {
      assert.ok(squadNames.has(event.scorer), `${event.scorer} must belong to ${team}`);
    });
  });
});

console.log(`Retro engine passed: ${Object.keys(squads).length} squads, 736 players, 64-match tournament.`);

const tournament2010 = engine.createTournament({ year: 2010, seed: 2010, managedTeam: "South Africa" });
assert.equal(tournament2010.groupMatches.length, 48);
assert.equal(engine.nextUnplayedMatch(tournament2010).home, "South Africa");
assert.equal(engine.nextUnplayedMatch(tournament2010).away, "Mexico");
assert.ok(tournament2010.groupMatches.every((match) => match.schedule?.stadium && match.schedule?.city));
assert.equal(new Set(tournament2010.groupMatches.map((match) => match.schedule.matchNumber)).size, 48);
while (tournament2010.phase === "group") engine.simulateActiveStage(tournament2010);
assert.ok(tournament2010.groupMatches.every((match) => !match.result.extraTime && !match.result.penalties));
while (tournament2010.phase !== "complete") engine.simulateActiveStage(tournament2010);
assert.ok(tournament2010.champion);
assert.equal(engine.allMatches(tournament2010).length, 64);
assert.equal(new Set(engine.allMatches(tournament2010).map((match) => match.schedule?.matchNumber)).size, 64);
assert.ok(tournament2010.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-third-place"));
engine.allMatches(tournament2010).forEach((match) => {
  [["home", match.home], ["away", match.away]].forEach(([side, team]) => {
    const squadNames = new Set(squads2010[team].players.map((player) => player.name));
    match.result[`${side}Events`].forEach((event) => {
      assert.ok(squadNames.has(event.scorer), `${event.scorer} must belong to 2010 ${team}`);
    });
  });
});

const goldenBootSample2010 = Array.from({ length: 20 }, (_, index) => {
  const sample = engine.createTournament({ year: 2010, seed: 2010001 + index * 7919 });
  while (sample.phase !== "complete") engine.simulateActiveStage(sample);
  const winner = engine.goldenBoot(sample)[0];
  const player = squads2010[winner.team].players.find((candidate) => candidate.name === winner.player);
  return { ...winner, position: player?.positions?.[0] || player?.position };
});
const plausibleGoldenBootPositions = new Set(["ST", "CF", "FW", "LW", "RW", "LM", "RM", "CAM"]);
assert.ok(
  goldenBootSample2010.every((winner) => plausibleGoldenBootPositions.has(winner.position)),
  "2010 Golden Boot sample must not collapse onto defensive players",
);
assert.ok(
  new Set(goldenBootSample2010.map((winner) => winner.player)).size >= 8,
  "2010 Golden Boot sample should have credible scorer variety",
);
assert.ok(
  Math.max(...goldenBootSample2010.map((winner) => winner.goals)) <= 12,
  "2010 Golden Boot totals should remain historically plausible",
);
console.log(`Retro 2010 passed: ${Object.keys(squads2010).length} squads, 736 players, 64-match tournament.`);

const tournament2018 = engine.createTournament({ year: 2018, seed: 2018, managedTeam: "England" });
assert.equal(tournament2018.groupMatches.length, 48);
assert.ok(tournament2018.groupMatches.every((match) => match.schedule?.stadium && match.schedule?.city));
while (tournament2018.phase !== "complete") engine.simulateActiveStage(tournament2018);
assert.ok(tournament2018.champion);
assert.equal(engine.allMatches(tournament2018).length, 64);
assert.ok(engine.allMatches(tournament2018).every((match) => match.schedule?.matchNumber));
engine.allMatches(tournament2018).forEach((match) => {
  [["home", match.home], ["away", match.away]].forEach(([side, team]) => {
    const squadNames = new Set(squads2018[team].players.map((player) => player.name));
    match.result[`${side}Events`].forEach((event) => {
      assert.ok(squadNames.has(event.scorer), `${event.scorer} must belong to 2018 ${team}`);
    });
  });
});

console.log(`Retro 2018 passed: ${Object.keys(squads2018).length} squads, 736 players, 64-match tournament.`);

const tournament2022 = engine.createTournament({ year: 2022, seed: 2022, managedTeam: "Argentina" });
assert.equal(tournament2022.groupMatches.length, 48);
assert.equal(engine.nextUnplayedMatch(tournament2022).home, "Argentina");
assert.equal(engine.nextUnplayedMatch(tournament2022).away, "Saudi Arabia");
assert.ok(tournament2022.groupMatches.every((match) => match.schedule?.stadium && match.schedule?.city));
assert.equal(new Set(tournament2022.groupMatches.map((match) => match.schedule.matchNumber)).size, 48);
while (tournament2022.phase !== "complete") engine.simulateActiveStage(tournament2022);
assert.ok(tournament2022.champion);
assert.equal(engine.allMatches(tournament2022).length, 64);
assert.equal(new Set(engine.allMatches(tournament2022).map((match) => match.schedule?.matchNumber)).size, 64);
assert.ok(tournament2022.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-third-place"));
engine.allMatches(tournament2022).forEach((match) => {
  [["home", match.home], ["away", match.away]].forEach(([side, team]) => {
    const squadNames = new Set(squads2022[team].players.map((player) => player.name));
    match.result[`${side}Events`].forEach((event) => {
      assert.ok(squadNames.has(event.scorer), `${event.scorer} must belong to 2022 ${team}`);
    });
  });
});

const goldenBootSample2022 = Array.from({ length: 100 }, (_, index) => {
  const sample = engine.createTournament({ year: 2022, seed: 2022001 + index * 7919 });
  while (sample.phase !== "complete") engine.simulateActiveStage(sample);
  const winner = engine.goldenBoot(sample)[0];
  const player = squads2022[winner.team].players.find((candidate) => candidate.name === winner.player);
  return {
    ...winner,
    position: player?.positions?.[0] || player?.position,
    overall: player?.overall || 0,
  };
});
assert.ok(
  goldenBootSample2022.every((winner) => plausibleGoldenBootPositions.has(winner.position)),
  "2022 Golden Boot samples must not be won by goalkeepers, defenders or central midfielders",
);
const implausibleGoldenBootWinners2022 = goldenBootSample2022.filter((winner) => winner.overall < 72);
assert.ok(
  implausibleGoldenBootWinners2022.length === 0,
  `2022 Golden Boot samples must be won by credible tournament-level attackers: ${JSON.stringify(implausibleGoldenBootWinners2022)}`,
);
assert.ok(
  new Set(goldenBootSample2022.map((winner) => winner.player)).size >= 12,
  "2022 Golden Boot samples should have credible scorer variety",
);
assert.ok(
  Math.max(...goldenBootSample2022.map((winner) => winner.goals)) <= 12,
  "2022 Golden Boot totals should remain historically plausible",
);

console.log(`Retro 2022 passed: ${Object.keys(squads2022).length} squads, 831 players, 64-match tournament.`);
