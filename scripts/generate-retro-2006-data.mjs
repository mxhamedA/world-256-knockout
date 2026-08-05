import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "tmp", "fjelstul-worldcup", "data-csv");
const officialClubsPath = path.join(root, "data/retro/2006/clubs.generated.json");
const squadsOutputPath = path.join(root, "data/retro/2006/squads.js");
const scheduleOutputPath = path.join(root, "data/retro/2006/schedule.js");
const officialClubs = JSON.parse(fs.readFileSync(officialClubsPath, "utf8"));

const TEAM_RATINGS = Object.freeze({
  Germany: 89, "Costa Rica": 73, Poland: 77, Ecuador: 79,
  England: 87, Paraguay: 79, "Trinidad and Tobago": 68, Sweden: 82,
  Argentina: 89, "Ivory Coast": 80, "Serbia and Montenegro": 76, Netherlands: 86,
  Mexico: 82, Iran: 73, Angola: 70, Portugal: 88,
  Italy: 91, Ghana: 79, USA: 76, "Czech Republic": 84,
  Brazil: 89, Croatia: 81, Australia: 78, Japan: 76,
  France: 90, Switzerland: 81, "South Korea": 77, Togo: 69,
  Spain: 86, Ukraine: 81, Tunisia: 73, "Saudi Arabia": 70,
});

// Anchors use FIFA 07's August 2006 database as the closest complete EA snapshot,
// then account for the 2005/06 club season and the player's Germany 2006 performance.
const STAR_RATINGS = Object.freeze({
  gianluigibuffon: 93, fabiocannavaro: 94, andreapirlo: 91, francescototti: 90,
  gianlucazambrotta: 89, alessandronesta: 89, gennarogattuso: 87, lucatoni: 87,
  zinedinezidane: 93, thierryhenry: 91, patrickvieira: 90, claudemakelele: 89,
  lilianthuram: 89, franckribery: 86, williamgallas: 86,
  michaelballack: 90, miroslavklose: 89, philipplahm: 87, torstenfrings: 87,
  lukaspodolski: 86, bastianschweinsteiger: 84, jenslehmann: 87,
  cristianoronaldo: 89, deco: 89, luisfigo: 88, ricardocarvalho: 88, maniche: 86,
  ronaldinho: 91, kaka: 89, ronaldo: 87, adriano: 88, dida: 89, lucio: 89,
  robertocarlos: 87, cafu: 86, juninhopernambucano: 88,
  juanromanriquelme: 90, hernancrespo: 88, javiermascherano: 86,
  robertoayala: 88, lionelmessi: 85, carlostevez: 85, estebancambiasso: 86,
  waynerooney: 88, stevengerrard: 90, franklampard: 89, johnterry: 90,
  rioferdinand: 89, davidbeckham: 88, ashleycole: 87, michaelowen: 86,
  ruudvannistelrooy: 90, edwinvandersar: 90, arjenrobben: 88,
  robinvanpersie: 85, wesleysneijder: 85,
  ikercasillas: 90, xavi: 88, carlespuyol: 89, xabialonso: 87,
  fernandotorres: 86, davidvilla: 86, sergioramos: 84, cescfabregas: 84,
  petrcech: 92, pavelnedved: 90, tomasrosicky: 87, jankoller: 86,
  didierdrogba: 89, michaelessien: 88, andriyshevchenko: 91, zlatanibrahimovic: 88,
  freddieljungberg: 86, henriklarsson: 87, rafaelmarquez: 87, jaredborgetti: 84,
  parkjisung: 84, hidetoshinakata: 84, timcahill: 83, harrykewell: 84,
});

const PENALTY_TAKERS = Object.freeze({
  Germany: ["Michael Ballack", "Miroslav Klose", "Lukas Podolski"],
  Argentina: ["Juan Román Riquelme", "Hernán Jorge Crespo", "Lionel Messi"],
  England: ["Frank Lampard", "Steven Gerrard", "David Beckham"],
  Portugal: ["Cristiano Ronaldo", "Luís Figo", "Simão Sabrosa"],
  Italy: ["Francesco Totti", "Andrea Pirlo", "Alessandro Del Piero"],
  France: ["Zinedine Zidane", "Thierry Henry", "David Trezeguet"],
  Brazil: ["Ronaldinho", "Kaká", "Ronaldo"],
  Spain: ["David Villa", "Fernando Torres", "Xabi Alonso"],
  Ukraine: ["Andriy Shevchenko", "Andriy Voronin"],
  Netherlands: ["Ruud van Nistelrooy", "Robin van Persie"],
});

const KNOCKOUT_PAIR_BY_ID = Object.freeze({
  "ko-r16-m1": ["Germany", "Sweden"],
  "ko-r16-m2": ["Argentina", "Mexico"],
  "ko-r16-m3": ["Italy", "Australia"],
  "ko-r16-m4": ["Switzerland", "Ukraine"],
  "ko-r16-m5": ["England", "Ecuador"],
  "ko-r16-m6": ["Portugal", "Netherlands"],
  "ko-r16-m7": ["Brazil", "Ghana"],
  "ko-r16-m8": ["Spain", "France"],
  "ko-r2-m1": ["Germany", "Argentina"],
  "ko-r2-m2": ["Italy", "Ukraine"],
  "ko-r2-m3": ["England", "Portugal"],
  "ko-r2-m4": ["Brazil", "France"],
  "ko-r3-m1": ["Germany", "Italy"],
  "ko-r3-m2": ["Portugal", "France"],
  "ko-third-place": ["Germany", "Portugal"],
  "ko-final": ["Italy", "France"],
});

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function readCsv(name) {
  return parseCsv(fs.readFileSync(path.join(sourceRoot, `${name}.csv`), "utf8"));
}

function appTeamName(name) {
  return name === "United States" ? "USA" : name;
}

function fullName(row) {
  return row.given_name === "not applicable"
    ? row.family_name
    : `${row.given_name} ${row.family_name}`;
}

function normalize(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function broadPosition(code) {
  if (code === "GK") return "GK";
  if (["CB", "LB", "RB", "SW"].includes(code)) return "DF";
  if (["CF", "SS", "LW", "RW", "LF", "RF"].includes(code)) return "FW";
  return "MF";
}

function playerAttributes(position, overall) {
  const profiles = {
    GK: [35, 45, 40, 42, 55, 64],
    DF: [66, 52, 61, 58, 82, 78],
    MF: [70, 68, 78, 77, 64, 70],
    FW: [78, 82, 66, 79, 38, 70],
  };
  const [pace, shooting, passing, dribbling, defending, physic] = profiles[position];
  const shift = overall - 76;
  return {
    pace: clamp(pace + Math.round(shift * 0.55), 35, 96),
    shooting: clamp(shooting + Math.round(shift * 0.72), 18, 96),
    passing: clamp(passing + Math.round(shift * 0.66), 25, 96),
    dribbling: clamp(dribbling + Math.round(shift * 0.68), 25, 97),
    defending: clamp(defending + Math.round(shift * 0.64), 18, 97),
    physic: clamp(physic + Math.round(shift * 0.55), 35, 96),
    ...(position === "GK" ? {
      goalkeeping_diving: clamp(overall + 1, 45, 96),
      goalkeeping_handling: clamp(overall - 1, 45, 96),
      goalkeeping_kicking: clamp(overall - 4, 42, 94),
      goalkeeping_positioning: clamp(overall, 45, 96),
      goalkeeping_reflexes: clamp(overall + 2, 45, 97),
    } : {}),
  };
}

function inferFormation(starters) {
  const counts = starters.reduce((result, player) => {
    result[broadPosition(player.position_code)] += 1;
    return result;
  }, { GK: 0, DF: 0, MF: 0, FW: 0 });
  const shape = `${counts.DF}-${counts.MF}-${counts.FW}`;
  if (["4-4-2", "4-3-3", "3-5-2", "3-4-3", "5-3-2", "5-4-1"].includes(shape)) return shape;
  if (shape === "4-5-1") return "4-2-3-1";
  if (shape === "4-2-4") return "4-2-3-1";
  if (shape === "3-6-1") return "3-4-2-1";
  return "4-4-2";
}

function fixtureFacts(match) {
  return {
    matchNumber: Number(match.match_id.split("-").at(-1)),
    date: match.match_date,
    localTime: match.match_time,
    utcOffset: "+02:00",
    stadium: match.stadium_name,
    city: match.city_name,
  };
}

const squadRows = readCsv("squads").filter((row) => row.tournament_id === "WC-2006");
const appearanceRows = readCsv("player_appearances").filter((row) => row.tournament_id === "WC-2006");
const goalRows = readCsv("goals").filter((row) => row.tournament_id === "WC-2006" && row.own_goal !== "1");
const managerRows = readCsv("manager_appointments").filter((row) => row.tournament_id === "WC-2006");
const matchRows = readCsv("matches").filter((row) => row.tournament_id === "WC-2006");

const squads = Object.fromEntries([...new Set(squadRows.map((row) => appTeamName(row.team_name)))].map((teamName) => {
  const sourceTeamName = teamName === "USA" ? "United States" : teamName;
  const teamSquad = squadRows.filter((row) => row.team_name === sourceTeamName);
  const appearances = appearanceRows.filter((row) => row.team_name === sourceTeamName);
  const firstMatchId = [...new Set(appearances.map((row) => row.match_id))].sort()[0];
  const firstStarters = appearances.filter((row) => row.match_id === firstMatchId && row.starter === "1");
  const appearanceByPlayer = new Map();
  appearances.forEach((row) => {
    const current = appearanceByPlayer.get(row.player_id) || { appearances: 0, starts: 0, positions: new Map() };
    current.appearances += 1;
    current.starts += Number(row.starter);
    current.positions.set(row.position_code, (current.positions.get(row.position_code) || 0) + 1);
    appearanceByPlayer.set(row.player_id, current);
  });
  const goalsByPlayer = new Map();
  goalRows.filter((row) => row.player_team_name === sourceTeamName).forEach((row) => {
    goalsByPlayer.set(row.player_id, (goalsByPlayer.get(row.player_id) || 0) + 1);
  });
  const teamRating = TEAM_RATINGS[teamName];
  const players = teamSquad.map((row) => {
    const stats = appearanceByPlayer.get(row.player_id) || { appearances: 0, starts: 0, positions: new Map() };
    const detailedPosition = [...stats.positions.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || row.position_code;
    const position = broadPosition(detailedPosition);
    const name = fullName(row);
    const starOverall = STAR_RATINGS[normalize(name)];
    const squadBase = teamRating - 6;
    const involvement = Math.min(5, stats.starts) + Math.min(2, Math.max(0, stats.appearances - stats.starts));
    const goalBoost = Math.min(4, (goalsByPlayer.get(row.player_id) || 0) * 2);
    const overall = starOverall || clamp(Math.round(squadBase + involvement * 0.62 + goalBoost), 62, 88);
    return {
      number: Number(row.shirt_number),
      name,
      displayName: name,
      position,
      positions: [detailedPosition],
      club: officialClubs[teamName]?.[String(Number(row.shirt_number))] || "",
      overall,
      preferredFoot: null,
      captain: false,
      ratingJustification: starOverall
        ? "FIFA 07 baseline blended with 2005/06 club form and Germany 2006 performance"
        : "Team strength, tournament role, appearances and Germany 2006 performance blend",
      attributes: playerAttributes(position, overall),
    };
  }).sort((left, right) => left.number - right.number);
  const manager = managerRows.find((row) => row.team_name === sourceTeamName);
  return [teamName, {
    coach: manager ? fullName(manager) : "",
    formation: inferFormation(firstStarters),
    startingXI: firstStarters.map((row) => Number(row.shirt_number)),
    penaltyTakers: PENALTY_TAKERS[teamName] || players
      .filter((player) => player.position !== "GK")
      .sort((left, right) => right.overall - left.overall)
      .slice(0, 3)
      .map((player) => player.name),
    teamRatings: {
      attack: teamRating,
      midfield: clamp(teamRating - (teamRating < 76 ? 2 : 0), 62, 94),
      defence: clamp(teamRating + (["Italy", "France", "Switzerland"].includes(teamName) ? 2 : 0), 62, 94),
    },
    players,
  }];
}));

const groupSchedule = Object.fromEntries(matchRows
  .filter((match) => match.group_stage === "1")
  .map((match) => [
    `${appTeamName(match.home_team_name)}|${appTeamName(match.away_team_name)}`,
    fixtureFacts(match),
  ]));

const knockoutSchedule = Object.fromEntries(Object.entries(KNOCKOUT_PAIR_BY_ID).map(([id, pair]) => {
  const match = matchRows.find((candidate) => (
    candidate.knockout_stage === "1"
    && pair.every((team) => [appTeamName(candidate.home_team_name), appTeamName(candidate.away_team_name)].includes(team))
  ));
  if (!match) throw new Error(`Missing Germany 2006 knockout fixture ${id}: ${pair.join(" v ")}`);
  return [id, fixtureFacts(match)];
}));

if (Object.keys(squads).length !== 32) throw new Error("Germany 2006 generation requires exactly 32 squads.");
Object.entries(squads).forEach(([team, squad]) => {
  if (squad.players.length !== 23) throw new Error(`${team} requires exactly 23 players.`);
  if (squad.players.filter((player) => player.position === "GK").length !== 3) {
    throw new Error(`${team} requires exactly three goalkeepers.`);
  }
  if (squad.players.some((player) => !player.club)) {
    throw new Error(`${team} requires an official tournament-time club for every player.`);
  }
  if (squad.startingXI.length !== 11 || new Set(squad.startingXI).size !== 11) {
    throw new Error(`${team} requires a valid historical opening-match XI.`);
  }
});
if (Object.keys(groupSchedule).length !== 48 || Object.keys(knockoutSchedule).length !== 16) {
  throw new Error("Germany 2006 generation requires 48 group fixtures and 16 knockout fixtures.");
}

fs.writeFileSync(
  squadsOutputPath,
  `/* Official Germany 2006 squads and opening XIs from the Fjelstul World Cup Database (CC-BY-SA-4.0). Player clubs are from FIFA's official Germany 2006 squad list. Ratings are a modified hybrid of FIFA 07, 2005/06 club form and tournament performance. */\nconst RETRO_2006_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n`,
  "utf8",
);
fs.writeFileSync(
  scheduleOutputPath,
  `/* Historical Germany 2006 fixture facts from the Fjelstul World Cup Database (CC-BY-SA-4.0). */\nconst RETRO_2006_GROUP_SCHEDULE = Object.freeze(${JSON.stringify(groupSchedule, null, 2)});\n\nconst RETRO_2006_KNOCKOUT_SCHEDULE = Object.freeze(${JSON.stringify(knockoutSchedule, null, 2)});\n`,
  "utf8",
);

console.log(`Generated ${Object.keys(squads).length} Germany 2006 squads, ${Object.keys(groupSchedule).length} group fixtures and ${Object.keys(knockoutSchedule).length} knockout fixtures.`);
