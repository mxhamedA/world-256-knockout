import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, Date, Math, Object, Set, Map });
const sources = [
  "retro-data.js",
  "retro-2006-squads.js",
  "retro-2006-schedule.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

vm.runInContext(`${sources}
globalThis.__squads = RETRO_2006_SQUADS;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const { __squads: squads, __engine: engine } = context;
const playerLookup = new Map();

Object.entries(squads).forEach(([team, squad]) => {
  squad.players.forEach((player) => {
    playerLookup.set(`${team}:${player.name}`, {
      name: player.displayName || player.name,
      team,
      position: player.position,
      overall: player.overall,
    });
  });
});

const runs = [];
const championCounts = new Map();
const goldenBootCounts = new Map();

for (let index = 1; index <= 20; index += 1) {
  const tournament = engine.createTournament({
    year: 2006,
    seed: 2006000 + index,
    managedTeam: null,
  });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);

  const leader = engine.goldenBoot(tournament)[0];
  const player = playerLookup.get(`${leader.team}:${leader.player}`);
  const goldenBoot = player?.name || leader.player;

  runs.push({
    run: index,
    champion: tournament.champion,
    goldenBoot,
    goldenBootTeam: leader.team,
    goals: leader.goals,
  });
  championCounts.set(tournament.champion, (championCounts.get(tournament.champion) || 0) + 1);

  const bootKey = `${goldenBoot} (${leader.team})`;
  goldenBootCounts.set(bootKey, (goldenBootCounts.get(bootKey) || 0) + 1);
}

const ranked = (counts, label) => [...counts.entries()]
  .map(([name, wins]) => ({ [label]: name, wins }))
  .sort((left, right) => right.wins - left.wins || left[label].localeCompare(right[label]));

console.log(JSON.stringify({
  runs,
  championCounts: ranked(championCounts, "team"),
  goldenBootCounts: ranked(goldenBootCounts, "player"),
}, null, 2));
