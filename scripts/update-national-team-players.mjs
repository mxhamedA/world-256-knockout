import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const dataPath = new URL("data.js", root);
const outputPath = new URL("player-pools.generated.js", root);
const source = fs.readFileSync(dataPath, "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`const RECENT_NATIONAL_TEAM_PLAYERS = {};${source};globalThis.__teams=TEAMS;globalThis.__existing=REAL_PLAYERS;`, context);

const teams = context.__teams.filter((team) => team.confed !== "INVITED");
const existing = context.__existing;
const WIKI_API = "https://en.wikipedia.org/w/api.php";
const pageOverrides = {
  USA: "United States men's national soccer team",
  China: "China national football team",
  "Ivory Coast": "Ivory Coast national football team",
  "Cape Verde": "Cape Verde national football team",
  "DR Congo": "DR Congo national football team",
  "South Korea": "South Korea national football team",
  "North Korea": "North Korea national football team",
  "Chinese Taipei": "Chinese Taipei national football team",
  "Republic of Ireland": "Republic of Ireland national football team",
};

const chileOfficialMarch2026 = [
  "Darío Osorio",
  "Lucas Cepeda",
  "Alexander Aravena",
  "Ben Brereton Díaz",
  "Gonzalo Tapia",
  "Felipe Loyola",
  "Vicente Pizarro",
  "Rodrigo Echeverría",
];

const manualOverrides = {
  Bulgaria: ["Marin Petkov", "Martin Minchev", "Tonislav Yordanov", "Lukas Petkov"],
  Gibraltar: ["Tjay De Barr", "Jaiden Bartolo", "Ayoub El Hmidi", "Kelvin Morgan", "Carlos Richards", "Dylan Borge", "Luca Scanlon", "James Scanlon"],
  Eritrea: ["Ali Sulieman", "Oliver Hintsa", "Benhur Amanuel", "Nobel Gebrezgi", "Siem Eyob-Abraha", "Nahom Netabay", "Medhane Redie", "Ablelom Teklezghi"],
  Philippines: ["André Leipold", "Jarvey Gayoso", "Sebastian Rasmussen", "Pocholo Bugas", "Sandro Reyes", "Manny Ott", "John Lucero", "Randy Schneider"],
};

const manualSources = {
  Bulgaria: "Bulgaria June 2026 senior squad",
  Gibraltar: "UEFA European Qualifiers 2026 squad",
  Eritrea: "National-Football-Teams 2026 appearances",
  Philippines: "Philippines June 2026 senior squad",
};

function pageTitle(teamName) {
  return pageOverrides[teamName] || `${teamName} national football team`;
}

function cleanWikiName(value = "") {
  return value
    .replace(/<!--.*?-->/g, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>|<ref[^/>]*\/>/gi, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\{\{nowrap\|([^}]+)\}\}/gi, "$1")
    .replace(/\{\{sortname\|([^|}]+)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, "$1 $2")
    .replace(/\{\{[^{}]+\}\}/g, "")
    .replace(/\|(?:other|sortname)\s*=.*$/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\|+$/g, "")
    .replace(/''/g, "")
    .trim();
}

function section(content, heading) {
  const expression = new RegExp(`^={2,4}\\s*${heading}\\s*={2,4}\\s*$`, "im");
  const match = expression.exec(content);
  if (!match) return "";
  const rest = content.slice(match.index + match[0].length);
  const next = /^={2,4}[^=].*?={2,4}\s*$/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function parsePlayers(content) {
  const roster = section(content, "Current squad") || section(content, "Recent call-ups");
  if (!roster) return [];
  const players = [];
  for (const line of roster.split("\n")) {
    if (!/nat fs.*player/i.test(line)) continue;
    const nameMatch = /\|\s*name\s*=\s*(.*?)(?=\s*\|\s*(?:caps|goals|club|clubnum|pos|age|number|num|nat|notes?)\s*=|\s*}}\s*$)/i.exec(line);
    if (!nameMatch) continue;
    const pos = /\|\s*pos\s*=\s*([A-Z]+)/i.exec(line)?.[1]?.toUpperCase() || "";
    const name = cleanWikiName(nameMatch[1]);
    if (name && name.length < 60) players.push({ name, pos });
  }
  const ordered = ["FW", "MF", "DF", "GK"].flatMap((position) => players.filter((player) => player.pos === position));
  const untyped = players.filter((player) => !["FW", "MF", "DF", "GK"].includes(player.pos));
  return [...new Set([...ordered, ...untyped].filter((player) => player.pos !== "GK").map((player) => player.name))].slice(0, 8);
}

async function fetchJson(url, attempt = 0) {
  const response = await fetch(url, { headers: { "User-Agent": "World256RosterBuilder/1.0 (local simulator)" } });
  if (!response.ok) {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchBatch(batch) {
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    redirects: "1",
    format: "json",
    formatversion: "2",
    titles: batch.map((team) => pageTitle(team.name)).join("|"),
  });
  const json = await fetchJson(`${WIKI_API}?${params}`);
  const pages = new Map((json.query?.pages || []).map((page) => [page.title, page]));
  const normalized = new Map((json.query?.normalized || []).map((item) => [item.from, item.to]));
  const redirects = new Map((json.query?.redirects || []).map((item) => [item.from, item.to]));
  return batch.map((team) => {
    const requested = pageTitle(team.name);
    const normalizedTitle = normalized.get(requested) || requested;
    const resolved = redirects.get(normalizedTitle) || normalizedTitle;
    const page = pages.get(resolved);
    const content = page?.revisions?.[0]?.slots?.main?.content || "";
    return [team.name, parsePlayers(content), page?.title || "not found"];
  });
}

const fetched = [];
for (let index = 0; index < teams.length; index += 40) {
  const batch = teams.slice(index, index + 40);
  fetched.push(...await fetchBatch(batch));
  console.log(`Fetched ${Math.min(index + 40, teams.length)}/${teams.length} squad pages`);
}

const pools = {};
const sources = {};
for (const [name, wikipediaPlayers, resolvedPage] of fetched) {
  const players = manualOverrides[name]
    || (name === "Chile"
    ? chileOfficialMarch2026
    : wikipediaPlayers.length >= 4
      ? wikipediaPlayers
      : existing[name] || wikipediaPlayers);
  if (players.length >= 4) pools[name] = players;
  sources[name] = manualSources[name] || (name === "Chile" ? "ANFP March 2026 senior squad" : resolvedPage);
}

const missing = teams.filter((team) => !pools[team.name]).map((team) => team.name);
const generatedAt = new Date().toISOString();
const output = `/* Generated by scripts/update-national-team-players.mjs on ${generatedAt}.
 * Current squad source: English Wikipedia national-team pages, with listed manual source overrides.
 */
const RECENT_NATIONAL_TEAM_PLAYERS = ${JSON.stringify(pools, null, 2)};
const NATIONAL_TEAM_PLAYER_SOURCES = ${JSON.stringify(sources, null, 2)};
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote ${Object.keys(pools).length}/${teams.length} recognised-team pools.`);
if (missing.length) console.log(`Missing (${missing.length}): ${missing.join(", ")}`);
