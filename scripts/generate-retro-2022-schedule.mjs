import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "tmp", "worldcup-data", "data-csv", "matches.csv");
const outputPath = path.join(root, "retro-2022-schedule.js");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normalizeTeam(name) {
  return name === "United States" ? "USA"
    : name === "Korea Republic" ? "South Korea"
    : name;
}

function scheduleEntry(row) {
  return {
    matchNumber: Number(row.match_id.slice(-2)),
    date: row.match_date,
    localTime: row.match_time,
    utcOffset: "+03:00",
    stadium: row.stadium_name,
    city: row.city_name,
  };
}

const rows = parseCsv(fs.readFileSync(sourcePath, "utf8"))
  .filter((row) => row.tournament_id === "WC-2022");

if (rows.length !== 64) throw new Error(`Expected 64 Qatar 2022 fixtures, found ${rows.length}.`);

const groupSchedule = Object.fromEntries(rows
  .filter((row) => row.stage_name === "group stage")
  .map((row) => [
    `${normalizeTeam(row.home_team_name)}|${normalizeTeam(row.away_team_name)}`,
    scheduleEntry(row),
  ]));

const knockoutEngineIds = new Map([
  [49, "ko-r16-m1"], [50, "ko-r16-m2"], [53, "ko-r16-m3"], [54, "ko-r16-m4"],
  [51, "ko-r16-m5"], [52, "ko-r16-m6"], [55, "ko-r16-m7"], [56, "ko-r16-m8"],
  [57, "ko-r2-m1"], [58, "ko-r2-m2"], [59, "ko-r2-m3"], [60, "ko-r2-m4"],
  [61, "ko-r3-m1"], [62, "ko-r3-m2"], [63, "ko-third-place"], [64, "ko-final"],
]);

const knockoutSchedule = Object.fromEntries(rows
  .filter((row) => row.stage_name !== "group stage")
  .map((row) => {
    const matchNumber = Number(row.match_id.slice(-2));
    const engineId = knockoutEngineIds.get(matchNumber);
    if (!engineId) throw new Error(`No engine fixture id for 2022 match ${matchNumber}.`);
    return [engineId, scheduleEntry(row)];
  }));

const output = "// Historical Qatar 2022 fixture facts sourced from the World Cup match dataset.\n"
  + `const RETRO_2022_GROUP_SCHEDULE = Object.freeze(${JSON.stringify(groupSchedule, null, 2)});\n\n`
  + `const RETRO_2022_KNOCKOUT_SCHEDULE = Object.freeze(${JSON.stringify(knockoutSchedule, null, 2)});\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${Object.keys(groupSchedule).length} group fixtures and ${Object.keys(knockoutSchedule).length} knockout fixtures.`);
