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
  Australia: "Australia men's national soccer team",
  Canada: "Canada men's national soccer team",
  Sweden: "Sweden men's national football team",
  "New Zealand": "New Zealand men's national football team",
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

function sourcePositionGroup(value = "") {
  const position = value.toUpperCase();
  if (position === "GK") return "GK";
  if (["DF", "CB", "LB", "RB", "LWB", "RWB"].includes(position)) return "DF";
  if (["MF", "DM", "CM", "AM", "LM", "RM", "CDM", "CAM"].includes(position)) return "MF";
  if (["FW", "CF", "ST", "LW", "RW", "LF", "RF"].includes(position)) return "FW";
  return "";
}

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

// Current-squad pages can lag behind retirement announcements, especially
// immediately after a major tournament. Keep this small, sourced and explicit
// instead of guessing that every older active player has retired.
const retiredInternationalPlayers = new Set([
  "Manuel Neuer",
  "Patrik Schick",
  "Guillermo Ochoa",
  "Riyad Mahrez",
  "Enner Valencia",
  "NicolÃ¡s Otamendi",
  "Marko ArnautoviÄ‡",
  "Sadio ManÃ©",
  "Craig Gordon",
  "Jean MichaÃ«l Seri",
  "Neymar",
  "Wataru Endo",
  "Kyle Walker",
]);

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
    .replace(/\s*(?:RET|INJ|WD|PRE|SUS)\s*$/i, "")
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

function parseRosterSection(roster) {
  if (!roster) return [];
  const players = [];
  for (const line of roster.split("\n")) {
    if (!/nat fs.*player/i.test(line)) continue;
    // Wikipedia keeps retired internationals in some recent-call-up tables and
    // marks them RET. They are useful historical context, but not current squad
    // candidates for the default simulator.
    if (/(?:^|[\s|=])RET(?:[\s|}]|$)/i.test(line)) continue;
    const nameMatch = /\|\s*name\s*=\s*(.*?)(?=\s*\|\s*(?:caps|goals|club|clubnum|pos|age|number|num|nat|notes?)\s*=|\s*}}\s*$)/i.exec(line);
    if (!nameMatch) continue;
    const pos = sourcePositionGroup(/\|\s*pos\s*=\s*([A-Z]+)/i.exec(line)?.[1] || "");
    const name = cleanWikiName(nameMatch[1]);
    if (name && name.length < 60) players.push({ name, pos });
  }
  const seen = new Set();
  return players.filter((player) => {
    if (seen.has(player.name)) return false;
    seen.add(player.name);
    return true;
  });
}

function parsePlayers(content) {
  const combined = [
    ...parseRosterSection(section(content, "Current squad")),
    ...parseRosterSection(section(content, "Recent call-ups")),
  ];
  const seen = new Set();
  return combined.filter((player) => {
    if (seen.has(player.name)) return false;
    seen.add(player.name);
    return true;
  });
}

const xiSlots = [
  ["GK", "GK"],
  ["DF", "LB"], ["DF", "CB"], ["DF", "CB"], ["DF", "RB"],
  ["MF", "CDM"], ["MF", "CM"], ["MF", "CAM"],
  ["FW", "LW"], ["FW", "ST"], ["FW", "RW"],
];

function selectSquad(entries, maximum = 26) {
  const players = entries.map((entry) => typeof entry === "string" ? { name: entry, pos: "" } : entry);
  const used = new Set();
  const squad = xiSlots.map(([group, position]) => {
    let index = players.findIndex((player, playerIndex) => !used.has(playerIndex) && player.pos === group);
    if (index < 0) index = players.findIndex((player, playerIndex) => !used.has(playerIndex));
    if (index < 0) return null;
    used.add(index);
    return { name: players[index].name, position, sourcePosition: players[index].pos || null };
  }).filter(Boolean);

  const reservePositions = {
    GK: ["GK", "GK"],
    DF: ["CB", "CB", "LB", "RB", "CB"],
    MF: ["CDM", "CM", "CAM", "CM", "RM"],
    FW: ["ST", "LW", "RW", "ST"],
  };
  const reserveCounts = { GK: 0, DF: 0, MF: 0, FW: 0 };
  players.forEach((player, index) => {
    if (squad.length >= maximum || used.has(index)) return;
    const group = reservePositions[player.pos] ? player.pos : "MF";
    const choices = reservePositions[group];
    const position = choices[reserveCounts[group] % choices.length];
    reserveCounts[group] += 1;
    used.add(index);
    squad.push({ name: player.name, position, sourcePosition: player.pos || null });
  });
  return squad;
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
const profiles = {};
const sources = {};
for (const [name, wikipediaPlayers, resolvedPage] of fetched) {
  const preferred = manualOverrides[name]
    || (name === "Chile" ? chileOfficialMarch2026 : []);
  const fallbackPlayers = wikipediaPlayers.length < 11 ? (existing[name] || []) : [];
  const roster = [
    ...preferred,
    ...wikipediaPlayers,
    ...fallbackPlayers,
  ].filter((player, index, entries) => {
    const playerName = typeof player === "string" ? player : player.name;
    return !retiredInternationalPlayers.has(playerName)
      && entries.findIndex((candidate) => (typeof candidate === "string" ? candidate : candidate.name) === playerName) === index;
  });
  const selected = selectSquad(roster, 26);
  if (selected.length >= 4) pools[name] = selected.map((player) => player.name);
  if (selected.length >= 11 && selected.every((player) => player.sourcePosition)) profiles[name] = selected;
  sources[name] = manualSources[name] || (name === "Chile" ? "ANFP March 2026 senior squad" : resolvedPage);
}

const missing = teams.filter((team) => !pools[team.name]).map((team) => team.name);
const generatedAt = new Date().toISOString();
const output = `/* Generated by scripts/update-national-team-players.mjs on ${generatedAt}.
 * Squad source: English Wikipedia current squads and recent call-ups, with listed manual source overrides.
 */
const RECENT_NATIONAL_TEAM_PLAYERS = ${JSON.stringify(pools, null, 2)};
const RECENT_NATIONAL_TEAM_PLAYER_PROFILES = ${JSON.stringify(profiles, null, 2)};
const NATIONAL_TEAM_PLAYER_SOURCES = ${JSON.stringify(sources, null, 2)};
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote ${Object.keys(pools).length}/${teams.length} recognised-team pools.`);
console.log(`Wrote ${Object.keys(profiles).length} structured squads (up to 26 players each).`);
if (missing.length) console.log(`Missing (${missing.length}): ${missing.join(", ")}`);
