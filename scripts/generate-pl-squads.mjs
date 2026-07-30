import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FPL_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "premier-league-squads.generated.js");

const clubIdsByCode = Object.freeze({
  ARS: "arsenal",
  AVL: "aston-villa",
  BOU: "bournemouth",
  BRE: "brentford",
  BHA: "brighton",
  CHE: "chelsea",
  COV: "coventry-city",
  CRY: "crystal-palace",
  EVE: "everton",
  FUL: "fulham",
  HUL: "hull-city",
  IPS: "ipswich-town",
  LEE: "leeds-united",
  LIV: "liverpool",
  MCI: "manchester-city",
  MUN: "manchester-united",
  NEW: "newcastle-united",
  NFO: "nottingham-forest",
  TOT: "tottenham-hotspur",
  SUN: "sunderland",
});

const positions = Object.freeze({
  1: "GK",
  2: "CB",
  3: "CM",
  4: "ST",
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function simulatorRating(player) {
  const price = Number(player.now_cost || 40) / 10;
  const ownership = Number(player.selected_by_percent || 0);
  const form = Number(player.form || 0);
  return clamp(Math.round(63 + ((price - 3.5) * 4.4) + Math.min(4, ownership / 10) + Math.min(2, form / 3)), 64, 94);
}

const response = await fetch(FPL_URL, {
  headers: { "user-agent": "256-teams-squad-updater/1.0" },
});
if (!response.ok) throw new Error(`FPL squad request failed: ${response.status}`);

const data = await response.json();
if (!Array.isArray(data.teams) || data.teams.length !== 20) {
  throw new Error(`Expected 20 FPL clubs, received ${data.teams?.length ?? 0}`);
}

const teamIdToClubId = new Map();
for (const team of data.teams) {
  const clubId = clubIdsByCode[team.short_name];
  if (!clubId) throw new Error(`No simulator club mapping for ${team.name} (${team.short_name})`);
  teamIdToClubId.set(team.id, clubId);
}

const squads = Object.fromEntries(Object.values(clubIdsByCode).map((clubId) => [clubId, []]));
for (const player of data.elements) {
  const clubId = teamIdToClubId.get(player.team);
  if (!clubId) continue;
  const name = `${player.first_name || ""} ${player.second_name || ""}`.replace(/\s+/g, " ").trim() || player.web_name;
  squads[clubId].push({
    fplId: player.id,
    name,
    displayName: player.web_name,
    position: positions[player.element_type] || "CM",
    overall: simulatorRating(player),
  });
}

for (const [clubId, players] of Object.entries(squads)) {
  players.sort((a, b) => {
    const order = { GK: 0, CB: 1, CM: 2, ST: 3 };
    return (order[a.position] - order[b.position]) || (b.overall - a.overall) || a.name.localeCompare(b.name);
  });
  if (players.length < 20) throw new Error(`${clubId} only has ${players.length} current FPL players`);
  if (!players.some((player) => player.position === "GK")) throw new Error(`${clubId} has no goalkeeper`);
}

const updated = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
}).format(new Date());

const source = `// Generated from the official Fantasy Premier League bootstrap feed.\n`
  + `// Run: npm run generate:pl-squads\n`
  + `const PREMIER_LEAGUE_2026_27_SQUADS_UPDATED = ${JSON.stringify(updated)};\n`
  + `const PREMIER_LEAGUE_2026_27_SQUAD_SOURCE = ${JSON.stringify(FPL_URL)};\n`
  + `const PREMIER_LEAGUE_2026_27_CURRENT_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n\n`
  + `window.PREMIER_LEAGUE_2026_27_SQUADS_UPDATED = PREMIER_LEAGUE_2026_27_SQUADS_UPDATED;\n`
  + `window.PREMIER_LEAGUE_2026_27_SQUAD_SOURCE = PREMIER_LEAGUE_2026_27_SQUAD_SOURCE;\n`
  + `window.PREMIER_LEAGUE_2026_27_CURRENT_SQUADS = PREMIER_LEAGUE_2026_27_CURRENT_SQUADS;\n`;

await fs.writeFile(outputPath, source, "utf8");
console.log(`Wrote ${data.elements.length} current players across ${data.teams.length} clubs to ${path.basename(outputPath)}.`);
