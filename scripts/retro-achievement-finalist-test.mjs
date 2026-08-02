import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const challengeSource = readFileSync(join(root, "challenge.js"), "utf8");
const appSource = readFileSync(join(root, "app.js"), "utf8");

function functionSourceFrom(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist.`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}.`);
}

const functionSource = (name) => functionSourceFrom(challengeSource, name);

const context = vm.createContext({});
vm.runInContext(`
  ${functionSource("completedRetroChampion")}
  globalThis.completedRetroChampion = completedRetroChampion;
`, context);

const completedRetroChampion = context.completedRetroChampion;
const final = (winner, revealed = true) => [{
  name: "Finals",
  matches: [{
    id: "ko-final",
    home: "Belgium",
    away: "Italy",
    result: { winner, revealed },
  }],
}];
const finalWithoutReveal = (winner) => [{
  name: "Finals",
  matches: [{
    id: "ko-final",
    home: "Belgium",
    away: "Italy",
    result: { winner },
  }],
}];

assert.equal(
  completedRetroChampion({
    phase: "knockout",
    managedTeam: "Belgium",
    champion: null,
    knockoutRounds: final("Belgium"),
  }),
  null,
  "A hidden precomputed final winner must not unlock an achievement before the tournament is complete.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Belgium",
    knockoutRounds: finalWithoutReveal("Belgium"),
  }),
  null,
  "A final result without an explicit full-time reveal must not unlock an achievement.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Belgium",
    knockoutRounds: final("Belgium", false),
  }),
  null,
  "An unrevealed final must not unlock an achievement.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Belgium",
    knockoutRounds: final("Italy"),
  }),
  null,
  "A stale predicted Belgium champion must not survive an interactive final loss to Italy.",
);

assert.equal(
  completedRetroChampion({
    phase: "complete",
    managedTeam: "Belgium",
    champion: "Italy",
    knockoutRounds: final("Italy"),
  }),
  "Italy",
  "The revealed final winner should be accepted when it matches the completed tournament champion.",
);

assert.match(
  challengeSource,
  /const phase = tournament\.phase === "complete" && champion \? "complete" : "start";/,
  "Achievement tracking must only submit a completed run with a validated champion.",
);

const retroEngineSource = readFileSync(join(root, "retro-engine.js"), "utf8");
assert.match(
  retroEngineSource,
  /totalExpectedGoals:[\s\S]*?revealed: true,[\s\S]*?advanceTournament\(tournament\);/,
  "Instant simulations must explicitly reveal their result before tournament completion can unlock an achievement.",
);

const finalizationContext = vm.createContext({});
vm.runInContext(`
  const australiaId = "retro-2026-australia";
  const finalRound = [
    {
      id: "ko-third-place",
      homeId: "retro-2026-france",
      awayId: "retro-2026-spain",
      result: null,
    },
    {
      id: "ko-final",
      homeId: australiaId,
      awayId: "retro-2026-argentina",
      result: { winnerId: australiaId, revealed: true },
    },
  ];
  let saveCalls = 0;
  const state = { retroWorldCup: true, rounds: Array.from({ length: 8 }, () => []) };
  state.rounds[7] = finalRound;
  const retroTournament = { year: 2026, phase: "knockout", champion: null };
  const window = {};
  const isRetroSimulatorState = () => true;
  const tournamentFinalRoundIndex = () => 7;
  const tournamentFinalMatch = (round) => round.find((match) => match.id === "ko-final") || null;
  const simulateAndRevealMatch = (match) => {
    match.result = { winnerId: match.homeId, revealed: true };
    return match.result;
  };
  const teamById = (id) => ({
    name: id === australiaId ? "Australia" : id.split("-").at(-1),
  });
  const RETRO_WORLD_CUP_ENGINE = {
    advanceTournament(tournament) {
      if (!finalRound.every((match) => match.result?.revealed)) return;
      tournament.phase = "complete";
      tournament.champion = tournamentFinalMatch(finalRound).result.winner;
    },
  };
  const retroSimulatorRounds = () => state.rounds;
  const saveRetroTournamentState = () => { saveCalls += 1; };
  ${functionSourceFrom(appSource, "settlePendingRetroFinalMatches")}
  ${functionSourceFrom(appSource, "buildNextRound")}
  buildNextRound(7);
  globalThis.__finalization = {
    phase: retroTournament.phase,
    champion: retroTournament.champion,
    thirdPlaceRevealed: finalRound[0].result?.revealed === true,
    finalWinner: finalRound[1].result?.winner,
    saveCalls,
  };
`, finalizationContext);

assert.deepEqual(
  JSON.parse(JSON.stringify(finalizationContext.__finalization)),
  {
    phase: "complete",
    champion: "Australia",
    thirdPlaceRevealed: true,
    finalWinner: "Australia",
    saveCalls: 1,
  },
  "A revealed 2026 final win must complete and persist immediately even if third place was still pending.",
);
assert.match(
  appSource,
  /const savedFinal = tournamentFinalMatch\(state\.rounds\[savedFinalRoundIndex\] \|\| \[\]\);[\s\S]*?buildNextRound\(savedFinalRoundIndex\);/,
  "A saved revealed 2026 final must be repaired and replayed after reload.",
);

console.log("Retro achievement finalist-loss regression checks passed.");
