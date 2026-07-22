import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const context = { console };
vm.createContext(context);
vm.runInContext(
  `${readFileSync(join(projectRoot, "player-pools.generated.js"), "utf8")}\n${readFileSync(join(projectRoot, "data.js"), "utf8")}\n;globalThis.__teams = TEAMS;globalThis.__cultures = CULTURAL_NAME_POOLS;`,
  context,
);

function squadHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function onlineSquadPlayers(team) {
  const names = [...new Set(team.players || [])];
  const culture = context.__cultures[team.nameCulture] || context.__cultures.british;
  const seed = squadHash(team.name);
  for (let index = 0; names.length < 26; index += 1) {
    const first = culture.first[(seed + index * 5) % culture.first.length];
    const last = culture.last[(seed + index * 7 + Math.floor(index / culture.first.length) + 3) % culture.last.length];
    const candidate = `${first} ${last}`;
    if (!names.includes(candidate)) names.push(candidate);
  }
  return names.slice(0, 26);
}

const catalog = context.__teams.map(({ id, name, officialFifaRank, simulationRatings, ...team }) => ({
  id,
  name,
  officialFifaRank: officialFifaRank || null,
  simulationRatings,
  players: onlineSquadPlayers({ name, ...team }),
}));

if (catalog.length !== 256 || new Set(catalog.map(({ id }) => id)).size !== 256) {
  throw new Error("Draft catalog must contain 256 unique teams.");
}
if (catalog.some(({ players }) => players.length !== 26 || players.some((name) => /(?:^|\s)Player\s+\d+$/i.test(name)))) {
  throw new Error("Every online team must have 26 named players without numbered placeholders.");
}

writeFileSync(
  join(projectRoot, "draft-team-catalog.generated.mjs"),
  `// Generated from data.js. Run node scripts/generate-draft-catalog.mjs after changing teams.\nexport const DRAFT_TEAMS = ${JSON.stringify(catalog, null, 2)};\n`,
  "utf8",
);

console.log(`Draft catalog ready: ${catalog.length} teams.`);
