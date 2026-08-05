import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
vm.runInContext([
  "retro-data.js",
  "data/retro/copa-america-2024/squads.js",
  "data/retro/copa-america-2024/schedule.js",
  "retro-engine.js",
].map(read).join("\n") + "\nglobalThis.__data = RETRO_WORLD_CUPS; globalThis.__engine = RETRO_WORLD_CUP_ENGINE;", context);

const data = context.__data[2024];
const engine = context.__engine;
const simulations = Number(process.argv[2] || 500);
const teamNames = data.teams.map((team) => team.name);
const ratings = Object.fromEntries(data.teams.map((team) => [team.name, Number(team.rating)]));
const champions = Object.fromEntries(teamNames.map((team) => [team, 0]));
const finals = Object.fromEntries(teamNames.map((team) => [team, 0]));
const semifinals = Object.fromEntries(teamNames.map((team) => [team, 0]));
const teamGoals = Object.fromEntries(teamNames.map((team) => [team, 0]));
const playerGoals = new Map();
let totalGoals = 0;

for (let index = 0; index < simulations; index += 1) {
  const tournament = engine.createTournament({ year: 2024, seed: 20240001 + index });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
  const allMatches = Array.from(engine.allMatches(tournament));
  allMatches.forEach((match) => {
    const result = match.result;
    const matchGoals = Number(result.homeGoals || 0) + Number(result.awayGoals || 0);
    totalGoals += matchGoals;
    teamGoals[match.home] += Number(result.homeGoals || 0);
    teamGoals[match.away] += Number(result.awayGoals || 0);
    [[match.home, result.homeEvents], [match.away, result.awayEvents]].forEach(([team, events]) => {
      (events || []).forEach((event) => {
        if (event.ownGoal || event.goalType === "ownGoal") return;
        const key = `${team}:${event.scorer}`;
        playerGoals.set(key, (playerGoals.get(key) || 0) + 1);
      });
    });
  });
  champions[tournament.champion] += 1;
  const finalRound = tournament.knockoutRounds.at(-1);
  const final = finalRound.matches.find((match) => match.id === "ko-final");
  finals[final.home] += 1;
  finals[final.away] += 1;
  tournament.knockoutRounds[1].matches.forEach((match) => {
    semifinals[match.home] += 1;
    semifinals[match.away] += 1;
  });
}

const sumRatings = teamNames.reduce((sum, team) => sum + ratings[team], 0);
const expectedShare = (team) => ratings[team] / sumRatings;
const performanceRows = (source) => teamNames.map((team) => ({
  country: team,
  rating: ratings[team],
  appearances: source[team],
  rate: Number((source[team] / simulations).toFixed(4)),
  expectedRate: Number(expectedShare(team).toFixed(4)),
  ratio: Number(((source[team] / simulations) / expectedShare(team)).toFixed(2)),
}));
const scorerRows = [...playerGoals.entries()]
  .map(([key, goals]) => {
    const split = key.indexOf(":");
    return { country: key.slice(0, split), player: key.slice(split + 1), goals, goalsPerSimulation: Number((goals / simulations).toFixed(3)) };
  })
  .sort((left, right) => right.goals - left.goals || left.player.localeCompare(right.player));
const overperformers = performanceRows(champions).sort((left, right) => right.ratio - left.ratio).slice(0, 5);
const underperformers = performanceRows(champions).sort((left, right) => left.ratio - right.ratio).slice(0, 5);
const report = {
  tournament: "Copa América USA 2024",
  simulations,
  championCounts: Object.fromEntries(Object.entries(champions).sort(([, left], [, right]) => right - left)),
  finalAppearances: performanceRows(finals).sort((left, right) => right.appearances - left.appearances),
  semiFinalAppearances: performanceRows(semifinals).sort((left, right) => right.appearances - left.appearances),
  topGoalscorers: scorerRows.slice(0, 15),
  averageGoalsPerMatch: Number((totalGoals / (simulations * 32)).toFixed(3)),
  averageGoalsByCountry: Object.fromEntries(teamNames.map((team) => [team, Number((teamGoals[team] / simulations).toFixed(2))])),
  biggestOverperformers: overperformers,
  teamsThatAppearTooStrong: performanceRows(champions).filter((row) => row.appearances >= 2 && row.ratio > 1.45).sort((left, right) => right.ratio - left.ratio),
  teamsThatAppearTooWeak: performanceRows(champions).filter((row) => row.appearances >= 1 && row.ratio < .55).sort((left, right) => left.ratio - right.ratio),
  playersWhoScoreUnrealisticallyOften: scorerRows.filter((row) => row.goalsPerSimulation > .32).slice(0, 10),
  underperformers,
};

console.log(JSON.stringify(report, null, 2));
