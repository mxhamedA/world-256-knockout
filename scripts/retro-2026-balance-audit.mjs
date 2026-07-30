import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const durationArgument = process.argv.find((argument) => argument.startsWith("--duration-ms="));
const countArgument = process.argv.find((argument) => argument.startsWith("--count="));
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const durationMs = Math.max(1_000, Number(durationArgument?.split("=")[1]) || 60_000);
const requestedCount = Math.max(0, Number(countArgument?.split("=")[1]) || 0);
const outputPath = path.resolve(root, outputArgument?.slice("--output=".length) || "tmp/retro-2026-balance-audit.json");

const context = vm.createContext({ console, Date, Math, Object, Array, Map, Set, JSON });
const source = [
  "retro-data.js",
  "retro-2026-squads.js",
  "retro-engine.js",
].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
vm.runInContext(`${source}
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;
globalThis.__data = RETRO_WORLD_CUPS;
globalThis.__squads = RETRO_2026_SQUADS;`, context);

const engine = context.__engine;
const edition = context.__data[2026];
const squads = context.__squads;
const startedAt = Date.now();
const deadline = startedAt + durationMs;
const gapBuckets = ["0-2", "3-5", "6-8", "9-12", "13+"];
const bucketForGap = (gap) => (
  gap <= 2 ? "0-2"
    : gap <= 5 ? "3-5"
      : gap <= 8 ? "6-8"
        : gap <= 12 ? "9-12"
          : "13+"
);
const teamRows = Object.fromEntries(edition.teams.map((team) => {
  const squad = squads[team.name];
  return [team.name, {
    team: team.name,
    rating: Number(squad?.teamRatings?.overall ?? team.rating),
    fifaRank: Number(squad?.ratingBlend?.fifaRank || 999),
    groupAdvanced: 0,
    roundOf16: 0,
    quarterFinal: 0,
    semiFinal: 0,
    finalist: 0,
    champion: 0,
    runnerUp: 0,
    third: 0,
    fourth: 0,
  }];
}));
const knockoutUpsets = Object.fromEntries(gapBuckets.map((bucket) => [bucket, {
  matches: 0,
  lowerRatedWins: 0,
}]));
const groupUpsets = Object.fromEntries(gapBuckets.map((bucket) => [bucket, {
  decisiveMatches: 0,
  lowerRatedWins: 0,
}]));
let tournaments = 0;
let totalGoals = 0;
let totalMatches = 0;

function participants(round) {
  return new Set((round?.matches || []).flatMap((match) => [match.home, match.away]));
}

function recordMatch(match, tournament, groupStage = false) {
  if (!match?.result) return;
  const home = engine.teamEntry(2026, match.home);
  const away = engine.teamEntry(2026, match.away);
  const gap = Math.abs(home.rating - away.rating);
  const bucket = bucketForGap(gap);
  totalGoals += match.result.homeGoals + match.result.awayGoals;
  totalMatches += 1;
  if (groupStage) {
    if (!match.result.winner) return;
    groupUpsets[bucket].decisiveMatches += 1;
    const winner = engine.teamEntry(2026, match.result.winner);
    const loser = winner.name === home.name ? away : home;
    groupUpsets[bucket].lowerRatedWins += Number(winner.rating < loser.rating);
    return;
  }
  knockoutUpsets[bucket].matches += 1;
  const winner = engine.teamEntry(2026, match.result.winner);
  const loser = winner.name === home.name ? away : home;
  knockoutUpsets[bucket].lowerRatedWins += Number(winner.rating < loser.rating);
}

function recordTournament(tournament) {
  tournament.groupMatches.forEach((match) => recordMatch(match, tournament, true));
  tournament.knockoutRounds.flatMap((round) => round.matches).forEach((match) => recordMatch(match, tournament, false));
  const rounds = Object.fromEntries(tournament.knockoutRounds.map((round) => [round.name, round]));
  participants(rounds["Round of 32"]).forEach((team) => { teamRows[team].groupAdvanced += 1; });
  participants(rounds["Round of 16"]).forEach((team) => { teamRows[team].roundOf16 += 1; });
  participants(rounds["Quarter-finals"]).forEach((team) => { teamRows[team].quarterFinal += 1; });
  participants(rounds["Semi-finals"]).forEach((team) => { teamRows[team].semiFinal += 1; });
  const finals = rounds.Finals?.matches || [];
  const final = finals.find((match) => match.id === "ko-final");
  const thirdPlace = finals.find((match) => match.id === "ko-third-place");
  if (final) {
    teamRows[final.home].finalist += 1;
    teamRows[final.away].finalist += 1;
    teamRows[final.result.winner].champion += 1;
    const runnerUp = final.result.winner === final.home ? final.away : final.home;
    teamRows[runnerUp].runnerUp += 1;
  }
  if (thirdPlace) {
    teamRows[thirdPlace.result.winner].third += 1;
    const fourth = thirdPlace.result.winner === thirdPlace.home ? thirdPlace.away : thirdPlace.home;
    teamRows[fourth].fourth += 1;
  }
}

function report(complete = false) {
  const rate = (count) => Number((count / Math.max(1, tournaments)).toFixed(6));
  const teams = Object.values(teamRows)
    .map((row) => ({
      ...row,
      groupAdvanceRate: rate(row.groupAdvanced),
      roundOf16Rate: rate(row.roundOf16),
      quarterFinalRate: rate(row.quarterFinal),
      semiFinalRate: rate(row.semiFinal),
      finalRate: rate(row.finalist),
      titleRate: rate(row.champion),
      runnerUpRate: rate(row.runnerUp),
      thirdRate: rate(row.third),
      topThreeRate: rate(row.champion + row.runnerUp + row.third),
    }))
    .sort((left, right) => right.titleRate - left.titleRate || right.finalRate - left.finalRate || right.rating - left.rating);
  const summarizeUpsets = (rows, matchKey) => Object.fromEntries(
    Object.entries(rows).map(([bucket, row]) => [bucket, {
      ...row,
      lowerRatedWinRate: Number((row.lowerRatedWins / Math.max(1, row[matchKey])).toFixed(6)),
    }]),
  );
  return {
    complete,
    requestedCount: requestedCount || null,
    requestedDurationMs: durationMs,
    elapsedMs: Date.now() - startedAt,
    tournaments,
    matches: totalMatches,
    averageGoalsPerMatch: Number((totalGoals / Math.max(1, totalMatches)).toFixed(4)),
    knockoutUpsetsByRatingGap: summarizeUpsets(knockoutUpsets, "matches"),
    groupUpsetsByRatingGap: summarizeUpsets(groupUpsets, "decisiveMatches"),
    teams,
  };
}

function writeReport(complete = false) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report(complete), null, 2)}\n`);
}

let nextProgressWrite = startedAt;
while (requestedCount ? tournaments < requestedCount : Date.now() < deadline) {
  const seed = (2_026_073_019 + Math.imul(tournaments + 1, 2_654_435_761)) >>> 0;
  const tournament = engine.createTournament({ year: 2026, seed });
  while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
  recordTournament(tournament);
  tournaments += 1;
  if (Date.now() >= nextProgressWrite) {
    writeReport(false);
    nextProgressWrite = Date.now() + 5_000;
  }
}
writeReport(true);
console.log(JSON.stringify({
  outputPath,
  tournaments,
  matches: totalMatches,
  elapsedMs: Date.now() - startedAt,
}, null, 2));
