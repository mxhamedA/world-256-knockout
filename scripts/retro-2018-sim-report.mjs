import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "data/retro/2014/squads.js",
  "data/retro/2014/schedule.js",
  "data/retro/2018/squads.js",
  "data/retro/2018/schedule.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__squads = RETRO_2018_SQUADS;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const { __squads: squads, __engine: engine } = context;
const playerLookup = new Map();
const allPlayers = [];

Object.entries(squads).forEach(([team, squad]) => {
  squad.players.forEach((player) => {
    const entry = { name: player.displayName || player.name, team, overall: player.overall };
    playerLookup.set(`${team}:${player.name}`, entry);
    allPlayers.push(entry);
  });
});

const runs = [];
const championCounts = new Map();
const scorerTotals = new Map();

for (let index = 1; index <= 20; index += 1) {
  const tournament = engine.createTournament({
    year: 2018,
    seed: 2018000 + index,
    managedTeam: null,
  });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);

  const boot = engine.goldenBoot(tournament);
  const leader = boot[0];
  const player = playerLookup.get(`${leader.team}:${leader.player}`);
  runs.push({
    run: index,
    champion: tournament.champion,
    goldenBoot: player?.name || leader.player,
    goldenBootTeam: leader.team,
    goals: leader.goals,
    overall: player?.overall ?? null,
  });
  championCounts.set(tournament.champion, (championCounts.get(tournament.champion) || 0) + 1);

  boot.forEach((scorer) => {
    const key = `${scorer.team}:${scorer.player}`;
    const current = scorerTotals.get(key) || {
      ...(playerLookup.get(key) || { name: scorer.player, team: scorer.team, overall: null }),
      goals: 0,
      tournamentsScoredIn: 0,
    };
    current.goals += scorer.goals;
    current.tournamentsScoredIn += 1;
    scorerTotals.set(key, current);
  });
}

const output = {
  runs,
  championCounts: [...championCounts.entries()]
    .map(([team, wins]) => ({ team, wins }))
    .sort((left, right) => right.wins - left.wins || left.team.localeCompare(right.team)),
  aggregateScorers: [...scorerTotals.values()]
    .sort((left, right) => right.goals - left.goals || right.overall - left.overall || left.name.localeCompare(right.name))
    .slice(0, 15),
  topRatedPlayers: allPlayers
    .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name))
    .slice(0, 10),
};

console.log(JSON.stringify(output, null, 2));
