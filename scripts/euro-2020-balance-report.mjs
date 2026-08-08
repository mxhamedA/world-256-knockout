import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "data/retro/euro-2016/squads.js",
  "data/retro/2018/squads.js",
  "data/retro/2022/squads.js",
  "data/retro/euro-2020/squads.js",
  "data/retro/euro-2020/schedule.js",
  "retro-engine.js",
].map((file) => readFileSync(join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}\nglobalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);
const engine = context.__engine;
const runs = Number(process.argv[2] || 20);
const results = [];

for (let index = 1; index <= runs; index += 1) {
  const seed = 2020000 + index;
  const tournament = engine.createTournament({ year: 2020, seed, managedTeam: null });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
  const goldenBoot = engine.goldenBoot(tournament)[0];
  results.push({
    run: index,
    seed,
    champion: tournament.champion,
    goldenBoot: goldenBoot?.player || "Unknown",
    goldenBootTeam: goldenBoot?.team || "Unknown",
    goals: goldenBoot?.goals || 0,
  });
}

const championCounts = Object.fromEntries([...new Set(results.map((row) => row.champion))]
  .map((team) => [team, results.filter((row) => row.champion === team).length])
  .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));

if (!process.argv.includes("--summary")) console.table(results);
console.log("Champion totals:", championCounts);
