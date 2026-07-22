import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(process.argv[2] || "");

if (!sourcePath || !existsSync(sourcePath)) {
  throw new Error("Pass the Fjelstul player_appearances.csv path as the first argument.");
}

const nationDefinitions = [
  { id: "argentina", name: "Argentina", code: "AR", sourceNames: ["Argentina"] },
  { id: "belgium", name: "Belgium", code: "BE", sourceNames: ["Belgium"] },
  { id: "brazil", name: "Brazil", code: "BR", sourceNames: ["Brazil"] },
  { id: "england", name: "England", code: "GB-ENG", sourceNames: ["England"] },
  { id: "france", name: "France", code: "FR", sourceNames: ["France"] },
  { id: "germany", name: "Germany", code: "DE", sourceNames: ["Germany", "West Germany"] },
  { id: "italy", name: "Italy", code: "IT", sourceNames: ["Italy"] },
  { id: "netherlands", name: "Netherlands", code: "NL", sourceNames: ["Netherlands"] },
  { id: "portugal", name: "Portugal", code: "PT", sourceNames: ["Portugal"] },
  { id: "spain", name: "Spain", code: "ES", sourceNames: ["Spain"] },
];

const targetYears = new Set([1986, 1990, 1994, 1998, 2002, 2006, 2010, 2014, 2018, 2022]);
const exactPositionCodes = new Set(["GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "SS", "ST"]);
const gameYearForTournament = new Map([
  [1986, null], [1990, null], [1994, 95], [1998, 99], [2002, 3],
  [2006, 7], [2010, 11], [2014, 15], [2018, 19], [2022, 23],
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.filter((values) => values.length === headers.length).map((values) => (
    Object.fromEntries(headers.map((header, index) => [header, values[index]]))
  ));
}

function normalizedName(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function displayName(row) {
  return row.given_name === "not applicable" ? row.family_name : `${row.given_name} ${row.family_name}`;
}

function loadExistingEnglandRatings() {
  const ratings = new Map();
  const jsonDirectory = join(projectRoot, "legacy-data", "nations", "england");
  if (existsSync(jsonDirectory)) {
    for (const file of readdirSync(jsonDirectory).filter((name) => name.endsWith(".json"))) {
      const squad = JSON.parse(readFileSync(join(jsonDirectory, file), "utf8"));
      for (const player of squad.players || []) {
        if (Number.isInteger(player.overall)) ratings.set(`${squad.year}:${normalizedName(player.name)}`, player);
      }
    }
  }

  const legacyDirectory = join(projectRoot, "legacy-data", "england");
  if (!existsSync(legacyDirectory)) return ratings;
  const context = { window: {} };
  vm.createContext(context);
  for (const file of readdirSync(legacyDirectory).filter((name) => name.endsWith(".js")).sort()) {
    vm.runInContext(readFileSync(join(legacyDirectory, file), "utf8"), context);
  }
  for (const squad of context.window.LEGACY_HISTORIC_DATABASE?.england?.squads || []) {
    for (const player of squad.players) {
      ratings.set(`${squad.year}:${normalizedName(player.name)}`, {
        ...player,
        ratingSource: {
          ...player.ratingSource,
          status: "sourced",
          sourceUrl: player.ratingSource?.sourceUrl || null,
        },
      });
    }
  }
  return ratings;
}

function missingPlayer(row, year) {
  const primaryPosition = exactPositionCodes.has(row.position_code) ? row.position_code : null;
  return {
    name: displayName(row),
    primaryPosition,
    secondaryPositions: [],
    sourcePosition: row.position_code,
    overall: null,
    attributes: {
      pace: null,
      shooting: null,
      passing: null,
      dribbling: null,
      defending: null,
      physical: null,
    },
    goalkeeperAttributes: primaryPosition === "GK" ? {
      diving: null,
      handling: null,
      kicking: null,
      reflexes: null,
      positioning: null,
    } : null,
    ratingSource: {
      status: "missing",
      publisher: "EA Sports",
      series: "FIFA",
      gameYear: gameYearForTournament.get(year),
      sourceUrl: null,
      note: "Exact rating and position require source review.",
    },
  };
}

const rows = parseCsv(readFileSync(sourcePath, "utf8"));
const englandRatings = loadExistingEnglandRatings();
const outputRoot = join(projectRoot, "legacy-data", "nations");
const auditLines = [
  "# Legacy Draft Data Audit",
  "",
  "Starting XIs are each nation's first match at that World Cup, sourced from the Fjelstul World Cup Database.",
  "Numeric England records retain their existing EA Sports game-year attribution. Missing ratings and precise positions are explicitly flagged for review.",
  "",
];
let squadCount = 0;
let playerCount = 0;
let readyCount = 0;

for (const nation of nationDefinitions) {
  const nationRows = rows.filter((row) => {
    const year = Number(row.tournament_id?.slice(3));
    return nation.sourceNames.includes(row.team_name)
      && row.tournament_name?.includes("FIFA Men's World Cup")
      && !row.tournament_name.includes("Women's")
      && targetYears.has(year)
      && row.starter === "1";
  });
  const rowsByYear = new Map();
  for (const row of nationRows) {
    const year = Number(row.tournament_id.slice(3));
    const current = rowsByYear.get(year) || [];
    current.push(row);
    rowsByYear.set(year, current);
  }

  auditLines.push(`## ${nation.name}`, "");
  for (const [year, tournamentRows] of [...rowsByYear.entries()].sort(([a], [b]) => a - b)) {
    const firstDate = tournamentRows.map((row) => row.match_date).sort()[0];
    const firstMatchRows = tournamentRows.filter((row) => row.match_date === firstDate);
    const matchId = firstMatchRows[0]?.match_id;
    const starters = firstMatchRows.filter((row) => row.match_id === matchId);
    if (starters.length !== 11) {
      throw new Error(`${nation.name} ${year}: expected 11 starters, found ${starters.length}.`);
    }
    const players = starters.map((row) => {
      const key = `${year}:${normalizedName(displayName(row))}`;
      const existing = nation.id === "england" ? englandRatings.get(key) : null;
      return existing ? { ...existing, sourcePosition: row.position_code } : missingPlayer(row, year);
    });
    const ready = players.every((player) => Number.isInteger(player.overall)
      && player.primaryPosition
      && Object.values(player.attributes || {}).every(Number.isInteger));
    const squad = {
      schemaVersion: 2,
      nation: nation.name,
      nationId: nation.id,
      nationCode: nation.code,
      year,
      dataStatus: ready ? "ready" : "review",
      lineupSource: {
        database: "Fjelstul World Cup Database v1.2.0",
        author: "Joshua C. Fjelstul, Ph.D.",
        license: "CC-BY-SA-4.0",
        repositoryUrl: "https://github.com/jfjelstul/worldcup",
        matchId,
        matchName: firstMatchRows[0].match_name,
        matchDate: firstDate,
        selectionRule: "Opening match starting XI",
      },
      ratingSource: {
        publisher: "EA Sports",
        series: "FIFA",
        gameYear: gameYearForTournament.get(year),
      },
      players,
    };
    const directory = join(outputRoot, nation.id);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, `${year}.json`), `${JSON.stringify(squad, null, 2)}\n`, "utf8");
    auditLines.push(`- **${year}** (${squad.lineupSource.matchName}, ${ready ? "draft-ready" : "ratings review"}): ${players.map((player) => player.name).join(", ")}`);
    squadCount += 1;
    playerCount += players.length;
    if (ready) readyCount += 1;
  }
  auditLines.push("");
}

writeFileSync(join(projectRoot, "legacy-data", "audit-report.md"), `${auditLines.join("\n")}\n`, "utf8");
console.log(`Imported ${squadCount} opening-match XIs (${playerCount} player records); ${readyCount} are draft-ready.`);
