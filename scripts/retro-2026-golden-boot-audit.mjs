import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const countArgument = process.argv.find((argument) => argument.startsWith("--count="));
const tournamentCount = Math.max(1, Number(countArgument?.split("=")[1]) || 20);
const context = vm.createContext({ console, Date, Math, Object, Array, Map, Set, JSON });
const source = [
  "retro-data.js",
  "data/retro/2026/squads.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
vm.runInContext(`${source}
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;
globalThis.__squads = RETRO_2026_SQUADS;`, context);

const engine = context.__engine;
const squads = context.__squads;
const results = [];
let stonesGoals = 0;
let stonesMatches = 0;
let englandGoals = 0;
let defenderGoldenBoots = 0;

function playerPosition(teamName, playerName) {
  return squads[teamName]?.players.find((player) => player.name === playerName)?.position || "—";
}

for (let index = 0; index < tournamentCount; index += 1) {
  const seed = (2_026_080_001 + Math.imul(index + 1, 2_654_435_761)) >>> 0;
  const tournament = engine.createTournament({ year: 2026, seed });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
  const goldenBoot = engine.goldenBoot(tournament)[0];
  const position = playerPosition(goldenBoot.team, goldenBoot.player);
  defenderGoldenBoots += Number(["CB", "LB", "RB", "LWB", "RWB", "DF"].includes(position));
  let tournamentStonesGoals = 0;
  let tournamentStonesMatches = 0;
  let tournamentEnglandGoals = 0;
  engine.allMatches(tournament).forEach((match) => {
    const side = match.home === "England" ? "home" : match.away === "England" ? "away" : null;
    if (!side || !match.result) return;
    tournamentStonesMatches += 1;
    tournamentEnglandGoals += side === "home" ? match.result.homeGoals : match.result.awayGoals;
    tournamentStonesGoals += match.result[`${side}Events`]
      .filter((event) => event.scorer === "John Stones").length;
  });
  stonesGoals += tournamentStonesGoals;
  stonesMatches += tournamentStonesMatches;
  englandGoals += tournamentEnglandGoals;
  results.push({
    simulation: index + 1,
    seed,
    champion: tournament.champion,
    goldenBoot: goldenBoot.player,
    team: goldenBoot.team,
    position,
    goals: goldenBoot.goals,
    johnStonesGoals: tournamentStonesGoals,
    englandMatches: tournamentStonesMatches,
    englandGoals: tournamentEnglandGoals,
  });
}

console.log(JSON.stringify({
  tournamentCount,
  results,
  summary: {
    defenderGoldenBoots,
    johnStonesGoals: stonesGoals,
    englandMatches: stonesMatches,
    englandGoals,
    johnStonesGoalsPerEnglandMatch: Number((stonesGoals / Math.max(1, stonesMatches)).toFixed(4)),
    johnStonesShareOfEnglandGoals: Number((stonesGoals / Math.max(1, englandGoals)).toFixed(4)),
    tournamentsWithAStonesGoal: results.filter((result) => result.johnStonesGoals > 0).length,
    maximumStonesGoalsInOneTournament: Math.max(...results.map((result) => result.johnStonesGoals)),
  },
}, null, 2));
