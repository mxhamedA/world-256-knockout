import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.resolve(root, process.argv[2] || ".tmp-wc2026-worldcup.json");
const outputPath = path.join(root, "retro-2026-schedule.js");
const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const teamAliases = Object.freeze({
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  "Cape Verde": "Cabo Verde",
  "Czech Republic": "Czechia",
  "DR Congo": "Congo DR",
  Iran: "IR Iran",
  "Ivory Coast": "Côte d'Ivoire",
  "South Korea": "Korea Republic",
  Turkey: "Türkiye",
});

const venues = Object.freeze({
  Atlanta: ["Atlanta Stadium", "Atlanta"],
  "Boston (Foxborough)": ["Boston Stadium", "Boston"],
  "Dallas (Arlington)": ["Dallas Stadium", "Dallas"],
  "Guadalajara (Zapopan)": ["Estadio Guadalajara", "Guadalajara"],
  Houston: ["Houston Stadium", "Houston"],
  "Kansas City": ["Kansas City Stadium", "Kansas City"],
  "Los Angeles (Inglewood)": ["Los Angeles Stadium", "Los Angeles"],
  "Mexico City": ["Mexico City Stadium", "Mexico City"],
  "Miami (Miami Gardens)": ["Miami Stadium", "Miami"],
  "Monterrey (Guadalupe)": ["Estadio Monterrey", "Monterrey"],
  "New York/New Jersey (East Rutherford)": ["New York New Jersey Stadium", "New York/New Jersey"],
  Philadelphia: ["Philadelphia Stadium", "Philadelphia"],
  "San Francisco Bay Area (Santa Clara)": ["San Francisco Bay Area Stadium", "San Francisco Bay Area"],
  Seattle: ["Seattle Stadium", "Seattle"],
  Toronto: ["Toronto Stadium", "Toronto"],
  Vancouver: ["BC Place Vancouver", "Vancouver"],
});

function canonicalTeam(name) {
  return teamAliases[name] || name;
}

function utcOffset(time) {
  const match = String(time).match(/UTC([+-])(\d{1,2})$/);
  if (!match) throw new Error(`Missing UTC offset in ${time}`);
  return `${match[1]}${match[2].padStart(2, "0")}:00`;
}

function scheduleFor(match) {
  const [stadium, city] = venues[match.ground] || [];
  if (!stadium || !city) throw new Error(`Unknown 2026 venue: ${match.ground}`);
  return {
    ...(Number.isFinite(Number(match.num)) ? { matchNumber: Number(match.num) } : {}),
    date: match.date,
    localTime: String(match.time).split(" ")[0],
    utcOffset: utcOffset(match.time),
    stadium,
    city,
  };
}

function knockoutId(matchNumber) {
  if (matchNumber >= 73 && matchNumber <= 88) return `ko-r32-m${matchNumber - 72}`;
  if (matchNumber >= 89 && matchNumber <= 96) return `ko-r16-m${matchNumber - 88}`;
  if (matchNumber >= 97 && matchNumber <= 100) return `ko-qf-m${matchNumber - 96}`;
  if (matchNumber >= 101 && matchNumber <= 102) return `ko-sf-m${matchNumber - 100}`;
  if (matchNumber === 103) return "ko-third-place";
  if (matchNumber === 104) return "ko-final";
  throw new Error(`Unknown 2026 knockout match number: ${matchNumber}`);
}

const groups = {};
const knockouts = {};
for (const match of source.matches) {
  if (match.group) {
    groups[`${canonicalTeam(match.team1)}|${canonicalTeam(match.team2)}`] = scheduleFor(match);
  } else {
    knockouts[knockoutId(Number(match.num))] = scheduleFor(match);
  }
}

if (Object.keys(groups).length !== 72 || Object.keys(knockouts).length !== 32) {
  throw new Error(`Expected 72 group and 32 knockout schedules, received ${Object.keys(groups).length} and ${Object.keys(knockouts).length}`);
}

const output = `// FIFA World Cup 2026 fixture dates, local kick-off times and official tournament venue names.\n`
  + `const RETRO_2026_GROUP_SCHEDULE = Object.freeze(${JSON.stringify(groups, null, 2)});\n\n`
  + `const RETRO_2026_KNOCKOUT_SCHEDULE = Object.freeze(${JSON.stringify(knockouts, null, 2)});\n`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${path.relative(root, outputPath)} with 104 match schedules.`);
