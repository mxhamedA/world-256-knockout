import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [appSource, cssSource, htmlSource] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../clean.css", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

assert.match(
  appSource,
  /retroTournament\.pendingEliminationDecision = \{[\s\S]*teamName: team\.name,[\s\S]*roundIndex: completedRound/,
  "A managed team eliminated in the retro group stage must pause for a decision.",
);
assert.doesNotMatch(
  appSource,
  /if \(isRetroSimulatorState\(\) && completedRound === 2 && nextMatchIndex < 0\) \{[\s\S]{0,900}Continuing neutrally/,
  "Retro group-stage elimination must not silently continue in neutral mode.",
);
assert.match(
  appSource,
  /const retroGroupEliminationPending = Boolean\([\s\S]*pendingEliminationDecision\.matchId === match\.id[\s\S]*\);[\s\S]*const spectatedLost = !state\.premierLeagueSeason && \(retroGroupEliminationPending \|\|/,
  "The standard elimination choice panel must also render for a retro group-stage exit.",
);
assert.match(
  appSource,
  /function tournamentHasThirdPlacePlayoff\(\) \{[\s\S]*if \(isRetroSimulatorState\(\)\) return Number\(retroTournament\?\.year\) !== 2016;/,
  "Euro 2016 must not hide elimination choices behind a nonexistent third-place playoff.",
);
assert.match(
  appSource,
  /if \(isRetroSimulatorState\(\) && retroTournament\?\.pendingEliminationDecision\) \{[\s\S]*delete retroTournament\.pendingEliminationDecision;[\s\S]*retroTournament\.neutralView = true;[\s\S]*state\.activeRound = Math\.min\(3,/,
  "Continue neutrally must clear the paused decision and enter the knockout stage.",
);
assert.match(
  appSource,
  /savedNeutralView = retroTournament\.neutralView === true[\s\S]*neutralView: wasCurrentRetroTournament[\s\S]*Boolean\(previous\.neutralView\)[\s\S]*savedNeutralView \|\| !retroTournament\.managedTeam/,
  "Neutral continuation must survive World Cup renders and reloads.",
);
assert.match(
  appSource,
  /const managedTeamChanged = !state\.neutralView && previousSpectateTeamId !== managedTeamId;/,
  "Neutral World Cup renders must not repeatedly refocus the eliminated managed team.",
);
assert.match(
  appSource,
  /if \(isRetroSimulatorState\(\)\) \{[\s\S]*managedTeam: team\.name,[\s\S]*Fresh World Cup/,
  "Replay must restart the same World Cup with the eliminated team.",
);

assert.match(htmlSource, /id="spectateEliminationActions"[\s\S]*id="replaySpectatedButton"[\s\S]*id="continueNeutralButton"/);
for (const selector of [
  ".retro-mode-active #mainContent .inline-elimination",
  ".retro-2010-active #mainContent .inline-elimination",
  ".retro-2018-active #mainContent .inline-elimination",
  ".retro-2022-active #mainContent .inline-elimination",
]) {
  assert.ok(cssSource.includes(selector), `${selector} must have a year-appropriate elimination treatment.`);
}

console.log("Retro elimination decision UI checks passed.");
