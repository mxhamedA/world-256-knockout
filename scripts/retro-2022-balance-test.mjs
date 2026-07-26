import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "retro-2010-squads.js",
  "retro-2010-schedule.js",
  "retro-2014-squads.js",
  "retro-2014-schedule.js",
  "retro-2018-squads.js",
  "retro-2018-schedule.js",
  "retro-2022-squads.js",
  "retro-2022-schedule.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__retroData = RETRO_WORLD_CUPS;
globalThis.__retro2022Squads = RETRO_2022_SQUADS;
globalThis.__retroEngine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__retroData[2022];
const squads = context.__retro2022Squads;
const engine = context.__retroEngine;
const simulationCount = Math.max(20, Number.parseInt(process.env.RETRO_2022_SIMULATIONS || "500", 10));
const plausibleGoldenBootPositions = new Set(["ST", "CF", "FW", "LW", "RW", "LM", "RM", "CAM"]);
const eliteTeams = new Set(["Argentina", "France", "Brazil", "England", "Portugal", "Spain", "Germany", "Netherlands", "Belgium"]);
const teamRatings = new Map(data.teams.map((team) => [team.name, team.rating]));
const championCounts = new Map();
const finalCounts = new Map();
const semiFinalCounts = new Map();
const knockoutCounts = new Map();
const goldenBootCounts = new Map();
const sampleRuns = [];
const goldenBootWinners = [];

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function ranked(map) {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count, rate: Number((count * 100 / simulationCount).toFixed(1)) }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

for (let index = 0; index < simulationCount; index += 1) {
  const tournament = engine.createTournament({ year: 2022, seed: 20221120 + index * 7919 });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);

  increment(championCounts, tournament.champion);
  tournament.knockoutRounds[0].matches.forEach((match) => {
    increment(knockoutCounts, match.home);
    increment(knockoutCounts, match.away);
  });
  tournament.knockoutRounds[2].matches.forEach((match) => {
    increment(semiFinalCounts, match.home);
    increment(semiFinalCounts, match.away);
  });

  const final = tournament.knockoutRounds.at(-1).matches.find((match) => match.id === "ko-final");
  increment(finalCounts, final.home);
  increment(finalCounts, final.away);
  const runnerUp = final.result.winner === final.home ? final.away : final.home;
  const goldenBoot = engine.goldenBoot(tournament)[0];
  const player = squads[goldenBoot.team].players.find((candidate) => candidate.name === goldenBoot.player);
  const winner = {
    ...goldenBoot,
    position: player?.positions?.[0] || player?.position,
    overall: Number(player?.overall || 0),
  };
  goldenBootWinners.push(winner);
  increment(goldenBootCounts, `${winner.player} (${winner.team})`);

  if (sampleRuns.length < 20) {
    sampleRuns.push({
      run: index + 1,
      champion: tournament.champion,
      runnerUp,
      goldenBoot: winner.player,
      goldenBootTeam: winner.team,
      goals: winner.goals,
    });
  }
}

const eliteTitleCount = [...championCounts.entries()]
  .filter(([team]) => eliteTeams.has(team))
  .reduce((sum, [, count]) => sum + count, 0);
const lowRatedTitleCount = [...championCounts.entries()]
  .filter(([team]) => teamRatings.get(team) <= 76)
  .reduce((sum, [, count]) => sum + count, 0);
const championRanking = ranked(championCounts);
const maximumGoldenBootGoals = Math.max(...goldenBootWinners.map((winner) => winner.goals));
const mbappe = squads.France.players.find((player) => player.name === "Kylian Mbappé");
const kramaric = squads.Croatia.players.find((player) => player.name === "Andrej Kramarić");

if (maximumGoldenBootGoals > 12) {
  console.error("Golden Boot outliers:", JSON.stringify(
    goldenBootWinners.filter((winner) => winner.goals > 12).sort((left, right) => right.goals - left.goals),
    null,
    2,
  ));
}

assert.ok(goldenBootWinners.every((winner) => plausibleGoldenBootPositions.has(winner.position)),
  "Golden Boot must not be won by goalkeepers, defenders or central midfielders.");
assert.ok(goldenBootWinners.every((winner) => winner.overall >= 72),
  "Golden Boot must be won by a credible tournament-level attacker.");
assert.ok(maximumGoldenBootGoals <= 12,
  "Golden Boot goal totals must remain historically plausible.");
assert.ok(Number(mbappe?.scoringRoleMultiplier) > 1,
  "Mbappé must be France's primary 2022 scoring role.");
assert.ok(Number(kramaric?.scoringRoleMultiplier) < 1,
  "Kramarić's 2022 scoring share must reflect Croatia's distributed attack.");
assert.ok(eliteTitleCount / simulationCount >= 0.62,
  "Pre-tournament elite teams should win at least 62% of simulations.");
assert.ok(lowRatedTitleCount / simulationCount <= 0.06,
  "Teams rated 76 or below should not win more than 6% of simulations.");
assert.ok((championRanking[0]?.rate || 0) <= 24,
  "No single team should win more than 24% of simulations.");
assert.ok(championRanking.length >= 10,
  "The model should still allow credible tournament variance.");

const report = {
  simulations: simulationCount,
  sampleRuns,
  champions: championRanking,
  finalists: ranked(finalCounts),
  semiFinalists: ranked(semiFinalCounts),
  knockoutQualification: ranked(knockoutCounts),
  goldenBootWinners: ranked(goldenBootCounts).slice(0, 20),
  checks: {
    eliteTitleRate: Number((eliteTitleCount * 100 / simulationCount).toFixed(1)),
    teamsRated76OrBelowTitleRate: Number((lowRatedTitleCount * 100 / simulationCount).toFixed(1)),
    distinctChampions: championRanking.length,
    distinctGoldenBootWinners: new Set(goldenBootWinners.map((winner) => winner.player)).size,
    maximumGoldenBootGoals,
  },
};

console.log(JSON.stringify(report, null, 2));
console.log(`Qatar 2022 balance test passed across ${simulationCount} tournaments.`);
