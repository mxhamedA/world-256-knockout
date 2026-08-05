import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
vm.runInContext(`${[
  "retro-data.js", "retro-1998-squads.js", "retro-1998-schedule.js", "retro-engine.js",
].map(read).join("\n")}
globalThis.__data = RETRO_WORLD_CUPS[1998];
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data;
const engine = context.__engine;
const simulationCount = Math.max(20, Number.parseInt(process.env.RETRO_1998_SIMULATIONS || "300", 10));
const teamRatings = new Map(data.teams.map((team) => [team.name, team.rating]));
const champions = new Map();
const finals = new Map();
const semiFinals = new Map();
const roundOf16 = new Map();
const scorerGoals = new Map();
let totalGoals = 0;
let totalMatches = 0;

const increment = (map, key, amount = 1) => map.set(key, (map.get(key) || 0) + amount);
const ranked = (map) => [...map.entries()]
  .map(([country, count]) => ({ country, count, rate: Number((count * 100 / simulationCount).toFixed(1)) }))
  .sort((left, right) => right.count - left.count || left.country.localeCompare(right.country));

for (let index = 0; index < simulationCount; index += 1) {
  const tournament = engine.createTournament({ year: 1998, seed: 19980610 + index * 7919 });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);

  increment(champions, tournament.champion);
  tournament.knockoutRounds[0].matches.forEach((match) => {
    increment(roundOf16, match.home);
    increment(roundOf16, match.away);
  });
  tournament.knockoutRounds[2].matches.forEach((match) => {
    increment(semiFinals, match.home);
    increment(semiFinals, match.away);
  });
  const final = tournament.knockoutRounds.at(-1).matches.find((match) => match.id === "ko-final");
  increment(finals, final.home);
  increment(finals, final.away);

  const matches = [
    ...tournament.groupMatches,
    ...tournament.knockoutRounds.flatMap((round) => round.matches),
  ];
  for (const match of matches) {
    totalMatches += 1;
    totalGoals += match.result.homeGoals + match.result.awayGoals;
    for (const [side, team] of [["home", match.home], ["away", match.away]]) {
      for (const event of match.result[`${side}Events`] || []) {
        increment(scorerGoals, `${event.scorer} (${team})`);
      }
    }
  }
}

const teamRows = data.teams.map((team) => {
  const semiRate = (semiFinals.get(team.name) || 0) / simulationCount;
  const knockoutRate = (roundOf16.get(team.name) || 0) / simulationCount;
  return {
    country: team.name,
    rating: team.rating,
    knockoutRate: Number((knockoutRate * 100).toFixed(1)),
    semiFinalRate: Number((semiRate * 100).toFixed(1)),
    performanceIndex: Number((semiRate - Math.max(0.01, (team.rating - 70) * 0.016)).toFixed(3)),
  };
});
const overperformers = teamRows.filter((row) => row.rating < 85)
  .sort((a, b) => b.semiFinalRate - a.semiFinalRate || a.rating - b.rating).slice(0, 5);
const underperformers = teamRows.filter((row) => row.rating >= 78)
  .sort((a, b) => a.semiFinalRate - b.semiFinalRate || b.rating - a.rating).slice(0, 5);
const tooStrong = teamRows.filter((row) => row.rating <= 78 && row.semiFinalRate >= 10)
  .sort((a, b) => b.semiFinalRate - a.semiFinalRate);
const tooWeak = teamRows.filter((row) => row.rating >= 85 && row.knockoutRate < 55)
  .sort((a, b) => a.knockoutRate - b.knockoutRate);
const topScorers = [...scorerGoals.entries()]
  .map(([player, goals]) => ({ player, goals, perTournament: Number((goals / simulationCount).toFixed(2)) }))
  .sort((a, b) => b.goals - a.goals || a.player.localeCompare(b.player))
  .slice(0, 20);
const unrealisticScorers = topScorers.filter((row) => row.perTournament > 5.5);
const averageGoalsPerMatch = Number((totalGoals / totalMatches).toFixed(3));

assert.equal(totalMatches, simulationCount * 64, "Every France 98 simulation must complete all 64 matches.");
assert.ok(averageGoalsPerMatch >= 1.9 && averageGoalsPerMatch <= 3.3, "Tournament scoring must remain plausible.");
assert.ok(ranked(champions).length >= 8, "The model must preserve meaningful tournament variance.");
const dominanceLimit = simulationCount < 30 ? 35 : 26;
assert.ok(
  (ranked(champions)[0]?.rate || 0) <= dominanceLimit,
  `No country should dominate more than ${dominanceLimit}% of this sample.`,
);

const report = {
  tournament: "France 1998 World Cup",
  simulations: simulationCount,
  matches: totalMatches,
  averageGoalsPerMatch,
  championCounts: ranked(champions),
  finalAppearances: ranked(finals),
  semiFinalAppearances: ranked(semiFinals),
  topGoalscorers: topScorers,
  biggestOverperformers: overperformers,
  biggestUnderperformers: underperformers,
  teamsAppearingTooStrong: tooStrong,
  teamsAppearingTooWeak: tooWeak,
  playersScoringUnrealisticallyOften: unrealisticScorers,
};

const artifactDirectory = path.join(root, "artifacts");
fs.mkdirSync(artifactDirectory, { recursive: true });
fs.writeFileSync(path.join(artifactDirectory, "retro-1998-balance-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
console.log(`France 1998 balance test passed across ${simulationCount} tournaments.`);
