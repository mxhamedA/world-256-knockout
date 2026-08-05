import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourcePath = path.join(root, "tmp", "worldcup-matches.csv");
const outputPath = path.join(root, "data/retro/2014/schedule.js");

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
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function normalizeTeam(name) {
  return name === "United States" ? "USA" : name;
}

function scheduleEntry(row) {
  return {
    matchNumber: Number(row.match_id.slice(-2)),
    date: row.match_date,
    localTime: row.match_time,
    utcOffset: ["Cuiabá", "Manaus"].includes(row.city_name) ? "-04:00" : "-03:00",
    stadium: row.stadium_name,
    city: row.city_name,
  };
}

const rows = parseCsv(fs.readFileSync(sourcePath, "utf8"))
  .filter((row) => row.tournament_id === "WC-2014");

if (rows.length !== 64) {
  throw new Error(`Expected 64 Brazil 2014 fixtures, found ${rows.length}.`);
}

const groupSchedule = Object.fromEntries(rows
  .filter((row) => row.stage_name === "group stage")
  .map((row) => [
    `${normalizeTeam(row.home_team_name)}|${normalizeTeam(row.away_team_name)}`,
    scheduleEntry(row),
  ]));

const knockoutEngineIds = new Map([
  [49, "ko-r16-m1"],
  [50, "ko-r16-m2"],
  [53, "ko-r16-m3"],
  [54, "ko-r16-m4"],
  [51, "ko-r16-m5"],
  [52, "ko-r16-m6"],
  [55, "ko-r16-m7"],
  [56, "ko-r16-m8"],
  [58, "ko-r2-m1"],
  [57, "ko-r2-m2"],
  [60, "ko-r2-m3"],
  [59, "ko-r2-m4"],
  [61, "ko-r3-m1"],
  [62, "ko-r3-m2"],
  [63, "ko-third-place"],
  [64, "ko-final"],
]);

const knockoutSchedule = Object.fromEntries(rows
  .filter((row) => row.stage_name !== "group stage")
  .map((row) => {
    const matchNumber = Number(row.match_id.slice(-2));
    const engineId = knockoutEngineIds.get(matchNumber);
    if (!engineId) throw new Error(`No engine fixture id for 2014 match ${matchNumber}.`);
    return [engineId, scheduleEntry(row)];
  }));

const output = `// Historical fixture facts cross-checked against The FA schedule and OpenFootball's public-domain data.\n`
  + `const RETRO_2014_GROUP_SCHEDULE = Object.freeze(${JSON.stringify(groupSchedule, null, 2)});\n\n`
  + `const RETRO_2014_KNOCKOUT_SCHEDULE = Object.freeze(${JSON.stringify(knockoutSchedule, null, 2)});\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${Object.keys(groupSchedule).length} group fixtures and ${Object.keys(knockoutSchedule).length} knockout fixtures.`);
