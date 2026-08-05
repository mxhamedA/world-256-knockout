import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "tmp", "fjelstul-worldcup", "data-csv", "matches.csv");
const outputPath = path.join(root, "data/retro/2002/schedule.js");

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
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function scheduleEntry(row) {
  return {
    matchNumber: Number(row.match_id.slice(-2)),
    date: row.match_date,
    localTime: row.match_time,
    utcOffset: "+09:00",
    stadium: row.stadium_name,
    city: row.city_name,
    hostCountry: row.country_name,
  };
}

const rows = parseCsv(fs.readFileSync(sourcePath, "utf8"))
  .filter((row) => row.tournament_id === "WC-2002");
if (rows.length !== 64) throw new Error(`Expected 64 Korea/Japan 2002 fixtures, found ${rows.length}.`);

const groupSchedule = Object.fromEntries(rows
  .filter((row) => row.stage_name === "group stage")
  .map((row) => [`${row.home_team_name}|${row.away_team_name}`, scheduleEntry(row)]));

// The 2002 bracket crossed groups differently from later 32-team World Cups.
// These ids follow the engine's 2002-specific Round-of-16 pairing order.
const knockoutEngineIds = new Map([
  [50, "ko-r16-m1"], [54, "ko-r16-m2"], [49, "ko-r16-m3"], [53, "ko-r16-m4"],
  [52, "ko-r16-m5"], [56, "ko-r16-m6"], [51, "ko-r16-m7"], [55, "ko-r16-m8"],
  [57, "ko-r2-m1"], [58, "ko-r2-m2"], [59, "ko-r2-m3"], [60, "ko-r2-m4"],
  [61, "ko-r3-m1"], [62, "ko-r3-m2"], [63, "ko-third-place"], [64, "ko-final"],
]);

const knockoutSchedule = Object.fromEntries(rows
  .filter((row) => row.stage_name !== "group stage")
  .map((row) => {
    const matchNumber = Number(row.match_id.slice(-2));
    const engineId = knockoutEngineIds.get(matchNumber);
    if (!engineId) throw new Error(`No engine fixture id for 2002 match ${matchNumber}.`);
    return [engineId, scheduleEntry(row)];
  }));

const output = `/* Historical Korea/Japan 2002 fixture facts sourced from the Fjelstul World Cup Database. */\n`
  + `const RETRO_2002_GROUP_SCHEDULE = Object.freeze(${JSON.stringify(groupSchedule, null, 2)});\n\n`
  + `const RETRO_2002_KNOCKOUT_SCHEDULE = Object.freeze(${JSON.stringify(knockoutSchedule, null, 2)});\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${Object.keys(groupSchedule).length} group fixtures and ${Object.keys(knockoutSchedule).length} knockout fixtures.`);
