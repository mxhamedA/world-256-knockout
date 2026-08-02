import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "ucl-squads.generated.js");
const ratingsSite = "https://www.fcratings.com";
const allClubsUrl = `${ratingsSite}/lists/all-clubs`;

const targets = Object.freeze([
  ["real-madrid", "Real Madrid", ["real madrid cf"]],
  ["manchester-city", "Man City", ["manchester city fc", "manchester city f.c."]],
  ["bayern-munich", "Bayern Munich", ["fc bayern munich"]],
  ["paris-saint-germain", "PSG", ["paris saint-germain fc"]],
  ["liverpool", "Liverpool", []],
  ["barcelona", "Barcelona", ["fc barcelona"]],
  ["inter-milan", "Inter Milan", ["inter milan"]],
  ["arsenal", "Arsenal", ["arsenal fc", "arsenal f.c."]],
  ["atletico-madrid", "Atlético Madrid", ["atletico madrid"]],
  ["borussia-dortmund", "Borussia Dortmund", []],
  ["napoli", "Napoli", ["ssc napoli"]],
  ["manchester-united", "Man United", ["manchester united fc", "manchester united f.c."]],
  ["rb-leipzig", "RB Leipzig", ["rasenballsport leipzig"]],
  ["sporting-cp", "Sporting CP", ["sporting clube de portugal", "sporting lisbon"]],
  ["porto", "Porto", ["fc porto"]],
  ["villarreal", "Villarreal", ["villarreal cf"]],
  ["roma", "Roma", ["as roma"]],
  ["psv-eindhoven", "PSV Eindhoven", ["psv"]],
  ["aston-villa", "Aston Villa", ["aston villa fc", "aston villa f.c."]],
  ["galatasaray", "Galatasaray", ["galatasaray sk"]],
  ["feyenoord", "Feyenoord", []],
  ["stuttgart", "Stuttgart", ["vfb stuttgart"]],
  ["lille", "Lille", ["lille osc", "losc lille"]],
  ["club-brugge", "Club Brugge", ["club brugge kv"]],
  ["shakhtar-donetsk", "Shakhtar Donetsk", ["fc shakhtar donetsk"]],
  ["real-betis", "Real Betis", ["real betis balompie"]],
  ["como", "Como", ["como 1907"]],
  ["lens", "Lens", ["rc lens"]],
  ["slavia-prague", "Slavia Prague", ["sk slavia prague", "slavia praha"]],
  ["fenerbahce", "Fenerbahçe", ["fenerbahce sk", "fenerbahçe sk"]],
  ["olympique-lyonnais", "Lyon", ["olympique lyonnais", "olympique lyon", "lyon"]],
  ["gnk-dinamo-zagreb", "Dinamo Zagreb", ["dinamo zagreb"]],
  ["crvena-zvezda", "FK Crvena zvezda", ["crvena zvezda", "red star belgrade"]],
  ["union-saint-gilloise", "Union SG", ["union saint-gilloise", "union saint gilloise", "union sg"]],
  ["olympiacos", "Olympiacos", ["olympiacos fc"]],
  ["agf-aarhus", "AGF Aarhus", ["aarhus gymnastikforening", "agf"]],
  ["slovan-bratislava", "ŠK Slovan Bratislava", ["slovan bratislava"]],
  ["levski-sofia", "PFC Levski Sofia", ["levski sofia"]],
  ["nk-celje", "NK Celje", ["celje"]],
]);

const currentSquadUrls = Object.freeze({
  "real-madrid": "https://www.transfermarkt.co.uk/real-madrid/kader/verein/418/saison_id/2026/plus/1",
  "manchester-city": "https://www.transfermarkt.co.uk/manchester-city/kader/verein/281/saison_id/2026/plus/1",
  "bayern-munich": "https://www.transfermarkt.co.uk/bayern-munich/kader/verein/27/saison_id/2026/plus/1",
  "paris-saint-germain": "https://www.transfermarkt.co.uk/paris-saint-germain/kader/verein/583/saison_id/2026/plus/1",
  liverpool: "https://www.transfermarkt.co.uk/fc-liverpool/kader/verein/31/saison_id/2026/plus/1",
  barcelona: "https://www.transfermarkt.co.uk/fc-barcelona/kader/verein/131/saison_id/2026/plus/1",
  "inter-milan": "https://www.transfermarkt.co.uk/inter-mailand/kader/verein/46/saison_id/2026/plus/1",
  arsenal: "https://www.transfermarkt.co.uk/fc-arsenal/kader/verein/11/saison_id/2026/plus/1",
  "atletico-madrid": "https://www.transfermarkt.co.uk/atletico-de-madrid/kader/verein/13/saison_id/2026/plus/1",
  "borussia-dortmund": "https://www.transfermarkt.co.uk/borussia-dortmund/kader/verein/16/saison_id/2026/plus/1",
  napoli: "https://www.transfermarkt.co.uk/ssc-neapel/kader/verein/6195/saison_id/2026/plus/1",
  "manchester-united": "https://www.transfermarkt.co.uk/manchester-united/kader/verein/985/saison_id/2026/plus/1",
  "rb-leipzig": "https://www.transfermarkt.co.uk/rasenballsport-leipzig/kader/verein/23826/saison_id/2026/plus/1",
  "sporting-cp": "https://www.transfermarkt.co.uk/sporting-lissabon/kader/verein/336/saison_id/2026/plus/1",
  porto: "https://www.transfermarkt.co.uk/fc-porto/kader/verein/720/saison_id/2026/plus/1",
  villarreal: "https://www.transfermarkt.co.uk/fc-villarreal/kader/verein/1050/saison_id/2026/plus/1",
  roma: "https://www.transfermarkt.co.uk/as-rom/kader/verein/12/saison_id/2026/plus/1",
  "psv-eindhoven": "https://www.transfermarkt.co.uk/psv-eindhoven/kader/verein/383/saison_id/2026/plus/1",
  "aston-villa": "https://www.transfermarkt.co.uk/aston-villa/kader/verein/405/saison_id/2026/plus/1",
  galatasaray: "https://www.transfermarkt.co.uk/galatasaray/kader/verein/141/saison_id/2026/plus/1",
  feyenoord: "https://www.transfermarkt.co.uk/feyenoord-rotterdam/kader/verein/234/saison_id/2026/plus/1",
  stuttgart: "https://www.transfermarkt.co.uk/vfb-stuttgart/kader/verein/79/saison_id/2026/plus/1",
  lille: "https://www.transfermarkt.co.uk/losc-lille/kader/verein/1082/saison_id/2026/plus/1",
  "club-brugge": "https://www.transfermarkt.co.uk/club-brugge/kader/verein/2282/saison_id/2026/plus/1",
  "shakhtar-donetsk": "https://www.transfermarkt.co.uk/schachtar-donezk/kader/verein/660/saison_id/2026/plus/1",
  "real-betis": "https://www.transfermarkt.co.uk/real-betis-sevilla/kader/verein/150/saison_id/2026/plus/1",
  como: "https://www.transfermarkt.co.uk/como-1907/kader/verein/1047/saison_id/2026/plus/1",
  lens: "https://www.transfermarkt.co.uk/rc-lens/kader/verein/826/saison_id/2026/plus/1",
  "slavia-prague": "https://www.transfermarkt.co.uk/slavia-prag/kader/verein/167/saison_id/2026/plus/1",
  fenerbahce: "https://www.transfermarkt.co.uk/fenerbahce/kader/verein/36/saison_id/2026/plus/1",
  "olympique-lyonnais": "https://www.transfermarkt.co.uk/olympique-lyon/kader/verein/1041/saison_id/2026/plus/1",
  "gnk-dinamo-zagreb": "https://www.transfermarkt.co.uk/gnk-dinamo-zagreb/kader/verein/419/saison_id/2026/plus/1",
  "crvena-zvezda": "https://www.transfermarkt.co.uk/crvena-zvezda/kader/verein/668/saison_id/2026/plus/1",
  "union-saint-gilloise": "https://www.transfermarkt.co.uk/union-saint-gilloise/kader/verein/3948/saison_id/2026/plus/1",
  olympiacos: "https://www.transfermarkt.co.uk/olympiakos-piraeus/kader/verein/683/saison_id/2026/plus/1",
  "agf-aarhus": "https://www.transfermarkt.co.uk/aarhus-gf/kader/verein/678/saison_id/2026/plus/1",
  "slovan-bratislava": "https://www.transfermarkt.co.uk/slovan-bratislava/kader/verein/540/saison_id/2026/plus/1",
  "levski-sofia": "https://www.transfermarkt.co.uk/levski-sofia/kader/verein/156/saison_id/2026/plus/1",
  "nk-celje": "https://www.transfermarkt.co.uk/nk-celje/kader/verein/710/saison_id/2026/plus/1",
});

const startingXIOverrides = Object.freeze({
  "manchester-city": Object.freeze({
    include: Object.freeze(["Rayan Aït-Nouri"]),
    exclude: Object.freeze([]),
  }),
  "club-brugge": Object.freeze({
    include: Object.freeze(["Carlos Forbs"]),
    exclude: Object.freeze(["Andrej Vasovic"]),
  }),
});

const squadExclusions = Object.freeze({
  "manchester-city": Object.freeze(["Josh Wilson-Esbrand"]),
});

function applySquadExclusions(teamId, players) {
  const excluded = new Set(squadExclusions[teamId] || []);
  return players.filter((player) => !excluded.has(player.name));
}

function applyStartingXIOverrides(teamId, players) {
  const override = startingXIOverrides[teamId];
  if (!override) return players;
  const included = new Set(override.include);
  const excluded = new Set(override.exclude);
  return players.map((player) => ({
    ...player,
    startingXI: included.has(player.name) ? true : excluded.has(player.name) ? false : player.startingXI,
  }));
}

// FC Ratings does not currently publish pages for these six clubs. Keep their
// current 26/27 squad pages in the same generated pack so no UCL match falls
// back to synthetic players. The rating overrides below use the last published
// FC26 values where available; any remaining players receive a transparent
// position-based estimate from the club baseline.
const transfermarktFallbacks = Object.freeze({
  "psv-eindhoven": {
    source: "https://www.transfermarkt.co.uk/psv-eindhoven/kader/verein/383/saison_id/2026/plus/1",
    ratingSource: "https://fifaindex.com/teams/247-psv",
    ratingEdition: "FC26 published roster fallback",
    baseline: 74,
    ratings: {
      "matej kovar": 77,
      "joel drommel": 65,
      "nick olij": 76,
      "tijn smolenaars": 59,
      "yarek gasiorowski": 76,
      "ryan flamingo": 76,
      "armando obispo": 74,
      "adamo nagalo": 69,
      "fabian merien": 61,
      "mauro junior": 80,
      "sergino dest": 79,
      "kiliann sildillia": 72,
      "jerdy schouten": 79,
      "joey veerman": 81,
      "paul wanner": 75,
      "noah fernandez": 61,
      "joel van den berg": 62,
      "guus til": 77,
      "sven mijnans": 74,
      "isaac babadi": 67,
      "ruben van bommel": 74,
      "couhaib driouech": 72,
      "ivan perisic": 81,
      "dennis man": 77,
      "esmir bajraktarevic": 72,
      "ricardo pepi": 76,
      "alassane plea": 78,
    },
  },
  feyenoord: {
    source: "https://www.transfermarkt.co.uk/feyenoord-rotterdam/kader/verein/234/saison_id/2026/plus/1",
    ratingSource: "https://www.fcupdate.nl/voetbalnieuws/2025/09/feyenoord-player-ratings-in-fc26-overzicht-van-alle-ratings",
    ratingEdition: "FC26 published ratings fallback",
    baseline: 71,
    ratings: {
      "tjark ernst": 70,
      "liam bossin": 65,
      "tsuyoshi watanabe": 75,
      "anel ahmedhodzic": 74,
      "mika marmol": 73,
      "thomas beelen": 74,
      "thijs kraaijeveld": 59,
      "jeremiah st juste": 73,
      "neraysho kasanwirjo": 68,
      "jordan bos": 69,
      "gijs smal": 74,
      "givairo read": 75,
      "jordan lotomba": 75,
      "mats deijl": 71,
      "bart nieuwkoop": 74,
      "oussama targhalline": 73,
      "charles vanhoutte": 72,
      "luciano valente": 72,
      "jakub moder": 75,
      "gjivai zechiel": 67,
      "sem steijn": 78,
      "luka ivanusec": 73,
      "aymen sliti": 64,
      "gaoussou diarra": 72,
      "anis hadj moussa": 76,
      "goncalo borges": 72,
      "ayase ueda": 74,
      "nacho ferri": 68,
      "casper tengstedt": 74,
    },
  },
  "union-saint-gilloise": {
    source: "https://www.transfermarkt.co.uk/union-saint-gilloise/kader/verein/3948/saison_id/2026/plus/1",
    ratingSource: "https://www.ea.com/games/ea-sports-fc/ratings",
    ratingEdition: "FC27 club estimate (EA page not published for this club)",
    baseline: 69,
    ratings: {
      "herve koffi": 73,
      "kevin mac allister": 72,
      "ross sykes": 71,
      "fedde leysen": 69,
      "mamadou thierno barry": 70,
      "adem zorgane": 74,
      "darius olaru": 75,
      "relebohile mofokeng": 73,
      "promise david": 74,
      "kevin rodriguez": 71,
      "raul florucz": 70,
      "mohammed fuseini": 72,
    },
  },
  "slovan-bratislava": {
    source: "https://www.transfermarkt.co.uk/slovan-bratislava/kader/verein/540/saison_id/2026/plus/1",
    ratingSource: "https://www.ea.com/games/ea-sports-fc/ratings",
    ratingEdition: "FC27 club estimate (EA page not published for this club)",
    baseline: 68,
    ratings: {
      "dominik takac": 70,
      "svetozar markovic": 70,
      "kenan bajric": 69,
      "kevin wimmer": 70,
      "peter pokorny": 70,
      "danylo ignatenko": 70,
      "tigran barseghyan": 72,
      "mykola kukharevych": 69,
      "andraz sporar": 71,
    },
  },
  "levski-sofia": {
    source: "https://www.transfermarkt.co.uk/levski-sofia/kader/verein/156/saison_id/2026/plus/1",
    ratingSource: "https://www.ea.com/games/ea-sports-fc/ratings",
    ratingEdition: "FC27 club estimate (EA page not published for this club)",
    baseline: 67,
    ratings: {
      "svetoslav vutsov": 68,
      "martin lukov": 66,
      "christian makoun": 69,
      "kristian dimitrov": 68,
      "nikola serafimov": 67,
      "maicon": 68,
      "alex centelles": 68,
      "serginho": 69,
      "radoslav kirilov": 70,
      "mustapha sangare": 69,
      "juan perea": 68,
    },
  },
  "nk-celje": {
    source: "https://www.transfermarkt.co.uk/nk-celje/kader/verein/710/saison_id/2026/plus/1",
    ratingSource: "https://www.ea.com/games/ea-sports-fc/ratings",
    ratingEdition: "FC27 club estimate (EA page not published for this club)",
    baseline: 66,
    ratings: {
      "zan luk leban": 67,
      "ziga frelih": 65,
      "simon sluga": 68,
      "artemijus tutyskinas": 67,
      "lukasz bejger": 66,
      "damjan vuklisevic": 67,
      "leonardo koutris": 68,
      "pijus sirvys": 67,
      "mark zabukovnik": 67,
      "svit seslar": 67,
      "benjamin verbic": 68,
      "armandas kucys": 69,
      "matej poplatnik": 67,
    },
  },
});

function decodeHtml(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeHtml(String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function normalize(value) {
  return stripTags(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(f\.?c\.?|cf|fc|kv|sk|pfc|nk|fk|rc|vfb|ssc|as)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function slugBase(slug) {
  return slug.replace(/-\d+$/, "").replace(/-/g, " ");
}

function parseClubLinks(html) {
  const links = [];
  const seen = new Set();
  for (const match of html.matchAll(/href=["'](?:https?:\/\/www\.fcratings\.com)?\/clubs\/([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const slug = match[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const label = stripTags(match[2]);
    links.push({ slug, url: `${ratingsSite}/clubs/${slug}`, label, normalizedSlug: normalize(slugBase(slug)), normalizedLabel: normalize(label) });
  }
  return links;
}

function findClubLink(target, links) {
  const aliases = [target[1], ...target[2]].map(normalize).filter(Boolean);
  const exact = links.find((link) => aliases.includes(link.normalizedSlug) || aliases.includes(link.normalizedLabel));
  if (exact) return exact;
  const loose = links.filter((link) => aliases.some((alias) => link.normalizedSlug.includes(alias) || alias.includes(link.normalizedSlug)));
  if (loose.length === 1) return loose[0];
  return null;
}

function numberFromCell(cell) {
  const value = cell.match(/data-sort-value=["'](\d+)["']/i)?.[1];
  return value ? Number(value) : null;
}

function positionCode(label) {
  const normalized = normalize(label);
  return {
    goalkeeper: "GK",
    "centre back": "CB",
    "left back": "LB",
    "right back": "RB",
    "defensive midfield": "CDM",
    "central midfield": "CM",
    "attacking midfield": "CAM",
    "left midfield": "LM",
    "right midfield": "RM",
    "left winger": "LW",
    "right winger": "RW",
    "centre forward": "ST",
    "second striker": "CF",
  }[normalized] || "CM";
}

function selectStartingXI(players) {
  const byPosition = (positions) => players
    .filter((player) => positions.includes(player.position))
    .sort((a, b) => b.overall - a.overall);
  const chosen = [];
  const take = (positions, count) => {
    byPosition(positions).forEach((player) => {
      if (chosen.length >= 11 || count <= 0 || chosen.includes(player)) return;
      chosen.push(player);
      count -= 1;
    });
  };
  take(["GK"], 1);
  take(["LB", "LWB"], 1);
  take(["CB"], 2);
  take(["RB", "RWB"], 1);
  take(["CDM", "CM", "CAM", "LM", "RM"], 3);
  take(["LW", "RW", "CF", "ST"], 3);
  players
    .slice()
    .sort((a, b) => b.overall - a.overall)
    .forEach((player) => {
      if (chosen.length < 11 && !chosen.includes(player)) chosen.push(player);
    });
  const startingNames = new Set(chosen.map((player) => player.name));
  return players.map((player) => ({ ...player, startingXI: startingNames.has(player.name) }));
}

function parsePlayers(html, teamName) {
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const players = [];
  for (const row of rows) {
    const name = stripTags(row.match(/class=["'][^"']*custom-name[^"']*["'][^>]*>([\s\S]*?)<\//i)?.[1] || "");
    if (!name) continue;
    const position = row.match(/class=["'][^"']*custom-pos-badge[^"']*["'][^>]*>([A-Z]{2,3})<\//i)?.[1] || "CM";
    const statCells = row.match(/<td[^>]*class=["'][^"']*custom-stat[^"']*["'][^>]*>[\s\S]*?<\/td>/gi) || [];
    const stats = statCells.map(numberFromCell);
    const [overall, pace, shooting, passing, dribbling, defending, physical] = stats;
    if (![overall, pace, shooting, passing, dribbling, defending, physical].every(Number.isInteger)) continue;
    players.push({
      name,
      position,
      overall,
      finishing: position === "GK" ? 5 : shooting,
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physical,
      goalkeeping: position === "GK" ? overall : 5,
      simulatorRating: true,
      startingXI: false,
    });
  }
  if (players.length < 11) throw new Error(`${teamName} returned only ${players.length} parseable FC 27 players.`);
  return selectStartingXI(players);
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, Math.round(value)));
}

function fallbackAttribute(overall, position, attribute) {
  if (position === "GK") {
    return attribute === "goalkeeping" ? overall : attribute === "physical" ? clamp(overall - 4, 35, 90) : 5;
  }
  const modifiers = {
    pace: ["LW", "RW"].includes(position) ? 8 : ["LB", "RB"].includes(position) ? 5 : ["ST", "CF"].includes(position) ? 4 : -1,
    shooting: ["ST", "CF"].includes(position) ? 5 : ["LW", "RW", "CAM"].includes(position) ? 2 : ["CM", "LM", "RM"].includes(position) ? -3 : -12,
    passing: ["CAM", "CM", "CDM", "LM", "RM"].includes(position) ? 5 : ["CB", "LB", "RB"].includes(position) ? -3 : 0,
    dribbling: ["LW", "RW", "CAM"].includes(position) ? 6 : ["ST", "CF", "LM", "RM"].includes(position) ? 3 : 0,
    defending: ["CB", "LB", "RB", "CDM"].includes(position) ? 7 : ["CM"].includes(position) ? 0 : -16,
    physical: ["CB", "CDM", "ST", "CF"].includes(position) ? 5 : 0,
  };
  return clamp(overall + (modifiers[attribute] || 0), 5, 95);
}

function makeFallbackPlayer(name, position, overall, ratingSource) {
  return {
    name,
    position,
    overall,
    finishing: position === "GK" ? 5 : fallbackAttribute(overall, position, "shooting"),
    pace: fallbackAttribute(overall, position, "pace"),
    shooting: fallbackAttribute(overall, position, "shooting"),
    passing: fallbackAttribute(overall, position, "passing"),
    dribbling: fallbackAttribute(overall, position, "dribbling"),
    defending: fallbackAttribute(overall, position, "defending"),
    physical: fallbackAttribute(overall, position, "physical"),
    goalkeeping: position === "GK" ? overall : 5,
    simulatorRating: true,
    ratingSource,
    startingXI: false,
  };
}

function parseCurrentRoster(html, teamName) {
  const starts = [...html.matchAll(/<td class=["']zentriert rueckennummer[^>]*>/gi)].map((match) => match.index);
  const seen = new Set();
  const players = starts.map((start, index) => {
    const row = html.slice(start, starts[index + 1] ?? html.length);
    const name = stripTags(row.match(/<td class=["'][^"']*\bhauptlink\b[^"']*["'][^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "");
    const label = stripTags(row.match(/<td>\s*([^<]+?)\s*<\/td>\s*<\/tr>\s*<\/table>/i)?.[1] || "");
    if (!name || !label) return null;
    const key = normalize(name);
    if (seen.has(key)) return null;
    seen.add(key);
    return { name, position: positionCode(label) };
  }).filter(Boolean);
  if (players.length < 11) throw new Error(`${teamName} returned only ${players.length} parseable current players.`);
  return players;
}

function findRatedPlayer(name, ratedPlayers) {
  const normalizedName = normalize(name);
  const exact = ratedPlayers.find((player) => normalize(player.name) === normalizedName);
  if (exact) return exact;
  const loose = normalizedName
    .replace(/\b(junior|jr|sr)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return ratedPlayers.find((player) => normalize(player.name)
    .replace(/\b(junior|jr|sr)\b/g, "")
    .replace(/\s+/g, " ")
    .trim() === loose) || null;
}

function mergeCurrentRoster(currentPlayers, ratedPlayers, fallback = {}) {
  const baseline = fallback.baseline || deriveTeamRatings(ratedPlayers, 75).overall;
  const ratingSource = fallback.ratingEdition || "FC27 current-roster estimate";
  return selectStartingXI(currentPlayers.map(({ name, position }) => {
    const rated = findRatedPlayer(name, ratedPlayers);
    if (rated) return { ...rated, name, position, startingXI: false };
    const positionAdjustment = ["LW", "RW", "ST", "CF"].includes(position)
      ? 2
      : ["CAM", "CM", "CDM"].includes(position)
        ? 1
        : 0;
    return makeFallbackPlayer(name, position, clamp(baseline + positionAdjustment, 55, 85), `${ratingSource}; position estimate`);
  }));
}

function parseTransfermarktPlayers(html, teamName, fallback) {
  const starts = [...html.matchAll(/<td class=["']zentriert rueckennummer[^>]*>/gi)].map((match) => match.index);
  const players = starts.map((start, index) => {
    const row = html.slice(start, starts[index + 1] ?? html.length);
    const name = stripTags(row.match(/<td class=["']hauptlink["']>\s*<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "");
    const label = stripTags(row.match(/<td>\s*([A-Za-zÀ-ÿ' -]+?)\s*<\/td>\s*<\/tr>\s*<\/table>/i)?.[1] || "");
    if (!name || !label) return null;
    const position = positionCode(label);
    const normalizedName = normalize(name);
    const override = fallback.ratings[normalizedName];
    const positionAdjustment = ["LW", "RW", "ST", "CF"].includes(position) ? 2 : ["CAM", "CM", "CDM"].includes(position) ? 1 : 0;
    const overall = clamp(override ?? fallback.baseline + positionAdjustment, 55, 85);
    return makeFallbackPlayer(name, position, overall, override ? fallback.ratingEdition : `${fallback.ratingEdition}; position estimate`);
  }).filter(Boolean);
  if (players.length < 11) throw new Error(`${teamName} returned only ${players.length} parseable current players.`);
  return selectStartingXI(players);
}

function deriveTeamRatings(players, fallback = 75) {
  const starters = players.filter((player) => player.startingXI);
  const average = (list, defaultValue = fallback) => list.length
    ? list.reduce((total, player) => total + player.overall, 0) / list.length
    : defaultValue;
  const attack = average(starters.filter((player) => ["LW", "RW", "CF", "ST", "CAM"].includes(player.position)));
  const midfield = average(starters.filter((player) => ["CDM", "CM", "LM", "RM", "CAM"].includes(player.position)));
  const defence = average(starters.filter((player) => ["CB", "LB", "RB", "LWB", "RWB"].includes(player.position)));
  const goalkeeper = average(starters.filter((player) => player.position === "GK"));
  const overall = average(starters);
  const depth = average(players.slice().sort((a, b) => b.overall - a.overall).slice(0, 18));
  return {
    overall: clamp(overall, 55, 94),
    attack: clamp(attack, 55, 96),
    midfield: clamp(midfield, 55, 96),
    defence: clamp(defence, 55, 96),
    goalkeeper: clamp(goalkeeper, 55, 96),
    squadDepth: clamp(depth, 55, 94),
    experience: clamp(overall, 55, 94),
    penalties: clamp(average(starters.filter((player) => ["ST", "CF", "CAM", "CM"].includes(player.position))), 55, 94),
    discipline: 72,
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "256-teams-ucl-squad-updater/1.0" } });
  if (!response.ok) throw new Error(`Request failed (${response.status}) for ${url}`);
  return response.text();
}

const allClubsHtml = await fetchText(allClubsUrl);
const links = parseClubLinks(allClubsHtml);
const mapped = targets.map((target) => {
  const link = findClubLink(target, links);
  const fallback = transfermarktFallbacks[target[0]] || null;
  const currentSource = currentSquadUrls[target[0]] || fallback?.source || null;
  if (!link && !currentSource) throw new Error(`Could not map ${target[1]} to an FC Ratings page or current squad source.`);
  if (!link) console.warn(`Using current Transfermarkt squad fallback for ${target[1]}.`);
  return { target, link, fallback, currentSource };
});
const squads = {};
for (const { target, link, fallback, currentSource } of mapped) {
  const ratingHtml = link ? await fetchText(link.url) : null;
  const ratedPlayers = link
    ? parsePlayers(ratingHtml, target[1])
    : parseTransfermarktPlayers(await fetchText(currentSource), target[1], fallback);
  const currentHtml = await fetchText(currentSource);
  const players = applyStartingXIOverrides(target[0], mergeCurrentRoster(
    applySquadExclusions(target[0], parseCurrentRoster(currentHtml, target[1])),
    ratedPlayers,
    fallback || { baseline: deriveTeamRatings(ratedPlayers, 75).overall },
  ));
  squads[target[0]] = {
    team: target[1],
    source: currentSource,
    ratingSource: link ? `${ratingsSite} + current squad source` : fallback.ratingSource,
    ratingEdition: link ? "FC27 pre-release ratings · current 26/27 roster" : fallback.ratingEdition,
    players,
    simulationRatings: deriveTeamRatings(players, link ? 75 : fallback.baseline),
  };
  console.log(`${target[1]}: ${players.length} players (${link?.slug || "current squad fallback"})`);
}

const updated = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
}).format(new Date());

const source = `// Generated from FC Ratings' pre-release FC 27 ratings overlaid on current 2026/27 squads.\n`
  + `// EA has not officially published FC 27 ratings; these values are subject to change.\n`
  + `// Current squad membership is taken from Transfermarkt's 2026/27 squad pages so expired\n`
  + `// loans and completed transfers do not remain in the simulation.\n`
  + `// New players without a matching FC27 record receive a clearly marked position estimate.\n`
  + `// Run: node scripts/generate-ucl-squads.mjs\n`
  + `const UCL_FC27_SQUADS_UPDATED = ${JSON.stringify(updated)};\n`
  + `const UCL_FC27_SQUADS_SOURCE = ${JSON.stringify(allClubsUrl)};\n`
  + `const UCL_FC27_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n\n`
  + `if (typeof window !== "undefined") {\n`
  + `  window.UCL_FC27_SQUADS_UPDATED = UCL_FC27_SQUADS_UPDATED;\n`
  + `  window.UCL_FC27_SQUADS_SOURCE = UCL_FC27_SQUADS_SOURCE;\n`
  + `  window.UCL_FC27_SQUADS = UCL_FC27_SQUADS;\n`
  + `}\n`
  + `if (typeof module === "object" && module.exports) module.exports = { UCL_FC27_SQUADS_UPDATED, UCL_FC27_SQUADS_SOURCE, UCL_FC27_SQUADS };\n`;

await fs.writeFile(outputPath, source, "utf8");
console.log(`Wrote ${targets.length} UCL club squads to ${path.basename(outputPath)}.`);
