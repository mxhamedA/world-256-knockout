import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datasetPath = path.join(root, "data/retro/2010/squad-dataset.json");
const squadsOutputPath = path.join(root, "data/retro/2010/squads.js");
const scheduleOutputPath = path.join(root, "data/retro/2010/schedule.js");
const scheduleSourceUrl = "https://raw.githubusercontent.com/openfootball/worldcup.json/refs/heads/master/2010/worldcup.json";

const appNameByDatasetName = Object.freeze({
  "United States": "USA",
});

const scheduleNameAliases = Object.freeze({
  "Côte d'Ivoire": "Ivory Coast",
});

const officialMatchNumbers = Object.freeze({
  "South Africa|Mexico": 1,
  "Uruguay|France": 2,
  "South Korea|Greece": 3,
  "Argentina|Nigeria": 4,
  "England|USA": 5,
  "Algeria|Slovenia": 6,
  "Serbia|Ghana": 7,
  "Germany|Australia": 8,
  "Netherlands|Denmark": 9,
  "Japan|Cameroon": 10,
  "Italy|Paraguay": 11,
  "New Zealand|Slovakia": 12,
  "Ivory Coast|Portugal": 13,
  "Brazil|North Korea": 14,
  "Honduras|Chile": 15,
  "Spain|Switzerland": 16,
  "South Africa|Uruguay": 17,
  "Argentina|South Korea": 18,
  "Greece|Nigeria": 19,
  "France|Mexico": 20,
  "Germany|Serbia": 21,
  "Slovenia|USA": 22,
  "England|Algeria": 23,
  "Netherlands|Japan": 24,
  "Ghana|Australia": 25,
  "Cameroon|Denmark": 26,
  "Slovakia|Paraguay": 27,
  "Italy|New Zealand": 28,
  "Brazil|Ivory Coast": 29,
  "Portugal|North Korea": 30,
  "Chile|Switzerland": 31,
  "Spain|Honduras": 32,
  "Mexico|Uruguay": 33,
  "France|South Africa": 34,
  "Nigeria|South Korea": 35,
  "Greece|Argentina": 36,
  "Slovenia|England": 37,
  "USA|Algeria": 38,
  "Ghana|Germany": 39,
  "Australia|Serbia": 40,
  "Slovakia|Italy": 41,
  "Paraguay|New Zealand": 42,
  "Denmark|Japan": 43,
  "Cameroon|Netherlands": 44,
  "Portugal|Brazil": 45,
  "North Korea|Ivory Coast": 46,
  "Chile|Spain": 47,
  "Switzerland|Honduras": 48,
});

const knockoutPairById = Object.freeze({
  "ko-r16-m1": ["Uruguay", "South Korea", 49],
  "ko-r16-m2": ["USA", "Ghana", 50],
  "ko-r16-m3": ["Netherlands", "Slovakia", 53],
  "ko-r16-m4": ["Brazil", "Chile", 54],
  "ko-r16-m5": ["Argentina", "Mexico", 52],
  "ko-r16-m6": ["Germany", "England", 51],
  "ko-r16-m7": ["Paraguay", "Japan", 55],
  "ko-r16-m8": ["Spain", "Portugal", 56],
  "ko-r2-m1": ["Uruguay", "Ghana", 58],
  "ko-r2-m2": ["Netherlands", "Brazil", 57],
  "ko-r2-m3": ["Argentina", "Germany", 59],
  "ko-r2-m4": ["Paraguay", "Spain", 60],
  "ko-r3-m1": ["Uruguay", "Netherlands", 61],
  "ko-r3-m2": ["Germany", "Spain", 62],
  "ko-third-place": ["Uruguay", "Germany", 63],
  "ko-final": ["Netherlands", "Spain", 64],
});

function appName(name) {
  return appNameByDatasetName[name] || scheduleNameAliases[name] || name;
}

function positionGroup(sourcePosition) {
  return ["GK", "DF", "MF", "FW"].includes(sourcePosition) ? sourcePosition : "MF";
}

function compactPlayer(player) {
  const positions = [...new Set([player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean))];
  return {
    number: player.shirtNumber,
    name: player.name,
    displayName: player.name,
    position: positionGroup(player.sourcePosition),
    positions,
    club: player.club,
    overall: player.overall,
    preferredFoot: player.preferredFoot,
    captain: Boolean(player.captain),
    startingXILikelihood: player.startingXILikelihood,
    penaltyTaking: player.penaltyTakingAbility,
    ratingJustification: player.shortRatingJustification,
    sources: player.sources,
    attributes: {
      pace: player.pace,
      shooting: player.shooting,
      passing: player.passing,
      dribbling: player.dribbling,
      defending: player.defending,
      physic: player.physical,
      goalkeeping_diving: player.goalkeeping?.diving,
      goalkeeping_handling: player.goalkeeping?.handling,
      goalkeeping_kicking: player.goalkeeping?.kicking,
      goalkeeping_positioning: player.goalkeeping?.positioning,
      goalkeeping_reflexes: player.goalkeeping?.reflexes,
    },
  };
}

function buildSquads(dataset) {
  return Object.fromEntries(Object.entries(dataset.countries).map(([datasetName, country]) => {
    const name = appName(datasetName);
    const players = country.players.map(compactPlayer);
    const numberByName = new Map(players.map((player) => [player.name, player.number]));
    return [name, {
      formation: country.formation,
      startingXI: country.likelyStartingXI.map((player) => numberByName.get(player.name)),
      penaltyTakers: country.penaltyTakers,
      teamRatings: country.teamRatings,
      players,
    }];
  }));
}

function fixtureFacts(match, matchNumber) {
  const commaIndex = match.ground.lastIndexOf(",");
  return {
    matchNumber,
    date: match.date,
    localTime: match.time,
    utcOffset: "+02:00",
    stadium: match.ground.slice(0, commaIndex).trim(),
    city: match.ground.slice(commaIndex + 1).trim(),
  };
}

async function buildSchedule() {
  const response = await fetch(scheduleSourceUrl);
  if (!response.ok) throw new Error(`Could not download 2010 schedule: ${response.status}`);
  const source = await response.json();
  const matches = source.matches.map((match) => ({
    ...match,
    team1: appName(match.team1),
    team2: appName(match.team2),
  }));
  const groupMatches = matches.filter((match) => match.group);
  const groupSchedule = Object.fromEntries(groupMatches.map((match) => {
    const key = `${match.team1}|${match.team2}`;
    const matchNumber = officialMatchNumbers[key];
    if (!matchNumber) throw new Error(`Missing official match number for ${key}`);
    return [key, fixtureFacts(match, matchNumber)];
  }));
  const knockoutMatches = matches.filter((match) => !match.group);
  const knockoutSchedule = Object.fromEntries(Object.entries(knockoutPairById).map(([id, [home, away, matchNumber]]) => {
    const match = knockoutMatches.find((candidate) => candidate.team1 === home && candidate.team2 === away);
    if (!match) throw new Error(`Missing knockout fixture ${home} v ${away}`);
    return [id, fixtureFacts(match, matchNumber)];
  }));
  return { groupSchedule, knockoutSchedule };
}

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const squads = buildSquads(dataset);
const { groupSchedule, knockoutSchedule } = await buildSchedule();

if (Object.keys(squads).length !== 32) throw new Error("2010 generation requires exactly 32 squads.");
Object.entries(squads).forEach(([team, squad]) => {
  if (squad.players.length !== 23) throw new Error(`${team} requires exactly 23 players.`);
  if (squad.startingXI.length !== 11 || squad.startingXI.some((number) => !number)) {
    throw new Error(`${team} requires a valid historical starting XI.`);
  }
});
if (Object.keys(groupSchedule).length !== 48 || Object.keys(knockoutSchedule).length !== 16) {
  throw new Error("2010 generation requires 48 group fixtures and 16 knockout fixtures.");
}

fs.writeFileSync(
  squadsOutputPath,
  `/* Generated from data/retro/2010/squad-dataset.json. Do not edit by hand. */\nconst RETRO_2010_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n`,
  "utf8",
);
fs.writeFileSync(
  scheduleOutputPath,
  `/* Historical South Africa 2010 fixture facts sourced from OpenFootball's CC0 World Cup data. */\nconst RETRO_2010_GROUP_SCHEDULE = Object.freeze(${JSON.stringify(groupSchedule, null, 2)});\n\nconst RETRO_2010_KNOCKOUT_SCHEDULE = Object.freeze(${JSON.stringify(knockoutSchedule, null, 2)});\n`,
  "utf8",
);

console.log(`Generated ${Object.keys(squads).length} squads, ${Object.keys(groupSchedule).length} group fixtures and ${Object.keys(knockoutSchedule).length} knockout fixtures.`);
