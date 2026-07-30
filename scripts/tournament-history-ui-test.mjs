import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [appSource, challengeSource, cssSource, htmlSource, workerSource, premierLeagueSource] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../challenge.js", import.meta.url), "utf8"),
  readFile(new URL("../clean.css", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../worker.mjs", import.meta.url), "utf8"),
  readFile(new URL("../premier-league.js", import.meta.url), "utf8"),
]);

assert.match(
  htmlSource,
  /id="championSaveTournament"[\s\S]*id="championSaveTournamentLabel">Save tournament/,
  "The completed tournament screen needs a save action.",
);
assert.match(
  htmlSource,
  /<base href="\/" \/>[\s\S]*src="\.\/redirect\.js"[\s\S]*href="\.\/clean\.css/,
  "Direct saved-tournament URLs must resolve scripts, styles and assets from the site root.",
);
assert.match(
  htmlSource,
  /id="profileTournamentHistory"/,
  "Saved tournaments need a profile list.",
);
assert.doesNotMatch(
  htmlSource,
  /id="tournamentHistoryScreen"/,
  "Saved tournaments should reuse the simulator instead of a separate archive screen.",
);
assert.match(
  htmlSource,
  /id="savedTournamentDeleteButton"[\s\S]*id="retroSavedTournamentDeleteButton"[\s\S]*id="savedTournamentDeleteModal"[\s\S]*id="confirmSavedTournamentDeleteButton"/,
  "Both saved-tournament layouts need a confirmed delete action.",
);
assert.match(
  appSource,
  /const TOURNAMENT_HISTORY_STORAGE_KEY[\s\S]*function createTournamentHistoryRecord\(\)[\s\S]*rounds: savedRoundIndexes\.map/,
  "Completed tournaments must be stored as compact round snapshots.",
);
assert.match(
  appSource,
  /const TOURNAMENT_HISTORY_LIMIT = 50;/,
  "Players must be able to retain up to 50 saved tournaments.",
);
assert.match(
  appSource,
  /const TOURNAMENT_HISTORY_DATABASE_NAME[\s\S]*indexedDB\.open[\s\S]*createObjectStore\(TOURNAMENT_HISTORY_OBJECT_STORE, \{ keyPath: "id" \}\)/,
  "Full tournament snapshots must use IndexedDB instead of the small localStorage quota.",
);
assert.match(
  appSource,
  /function initializeTournamentHistoryStorage\(\)[\s\S]*readIndexedTournamentHistoryRecords[\s\S]*replaceIndexedTournamentHistoryRecords[\s\S]*verifiedIds[\s\S]*localStorage\.removeItem\(TOURNAMENT_HISTORY_STORAGE_KEY\)/,
  "Existing local saves must be imported and verified before their legacy copy is retired.",
);
assert.doesNotMatch(
  appSource,
  /function writeTournamentHistoryRecords\(records\)[\s\S]*?next\.pop\(\)/,
  "Saving a tournament must never silently discard older records to fit localStorage.",
);
assert.match(
  appSource,
  /function savedTournamentIdFromPath[\s\S]*saved-tournaments[\s\S]*function savedTournamentPath/,
  "Saved tournaments need their own addressable URL.",
);
assert.match(
  appSource,
  /function openTournamentHistory[\s\S]*savedTournamentPath\(record\.id\)[\s\S]*function closeTournamentHistory/,
  "Opening the saved viewer must update the browser URL.",
);
assert.match(
  workerSource,
  /SAVED_TOURNAMENT_PATH[\s\S]*appShellPath = APP_SHELL_PATHS\.has\(normalizedPath\) \|\| SAVED_TOURNAMENT_PATH\.test\(normalizedPath\)/,
  "Cloudflare must serve the app shell for direct saved-tournament URLs.",
);
assert.doesNotMatch(
  appSource,
  /<span>\$\{managedTeam \? "YOUR RUN" : "VIEW"\}<\/span>/,
  "The saved viewer should not repeat VIEW, Neutral and Neutral view as separate labels.",
);
assert.match(
  appSource,
  /window\.TournamentHistory = Object\.freeze\(\{[\s\S]*list\(\)[\s\S]*saveCurrent: saveCurrentTournamentToHistory,[\s\S]*open: openTournamentHistory/,
  "The profile and champion screen need a shared tournament history API.",
);
assert.match(
  appSource,
  /function deleteSavedTournament\(recordId\)[\s\S]*filter\(\(record\) => record\.id !== recordId\)[\s\S]*writeTournamentHistoryRecords\(remainingRecords\)[\s\S]*delete: deleteSavedTournament/,
  "Deleting a saved tournament must remove only the selected browser record.",
);
assert.match(
  appSource,
  /function writeTournamentHistoryRecords\(records\)[\s\S]*tournamentHistoryRecordsCache = next[\s\S]*queueTournamentHistoryWrite\(\)/,
  "Deleting the final saved tournament must persist an empty history.",
);
assert.match(
  appSource,
  /initializeTournamentHistoryStorage\(\)\.then\(\(\) => \{[\s\S]*openTournamentHistory\(initialSavedTournamentId/,
  "Direct saved-tournament links must wait for IndexedDB hydration before opening.",
);
assert.match(
  appSource,
  /function confirmSavedTournamentDelete\(\)[\s\S]*deleteSavedTournament\(recordId\)[\s\S]*closeTournamentHistory\(\)[\s\S]*confirmSavedTournamentDeleteButton\?\.addEventListener\("click", confirmSavedTournamentDelete\)/,
  "Deletion must require confirmation and return to the saved-tournament list.",
);
assert.match(
  appSource,
  /function tournamentHistorySimulatorState[\s\S]*savedTournamentView: true[\s\S]*function tournamentHistoryRetroState/,
  "Saved records must be adapted into the original simulator state.",
);
assert.match(
  appSource,
  /function openTournamentHistory[\s\S]*stopStandardPlaybackForNavigation\(\)[\s\S]*document\.body\.classList\.add\("saved-tournament-simulator"\)[\s\S]*render\(\)/,
  "Opening history must stop live playback and render the original simulator.",
);
assert.match(
  appSource,
  /function saveState\(\) \{[\s\S]*state\?\.savedTournamentView \|\| retroTournament\?\.savedTournamentView[\s\S]*return;/,
  "Browsing a saved tournament must never overwrite an active tournament.",
);
assert.match(
  cssSource,
  /#championSaveTournament\[hidden\]\s*\{[\s\S]*display:\s*none !important/,
  "A saved tournament must not expose the save action again.",
);
assert.match(
  challengeSource,
  /function renderProfileTournamentHistory\(\)[\s\S]*data-profile-history-id[\s\S]*window\.TournamentHistory\?\.open/,
  "The profile needs to render and open local tournament records.",
);
assert.match(
  appSource,
  /function upgradeTournamentHistoryRecord\(record\)[\s\S]*premier-league:2026-27:[\s\S]*currentClub\?\.badge[\s\S]*mode:\s*"premier-league"[\s\S]*rounds\.map\(\(_, index\) => `Matchweek/,
  "Existing PL saves must be repaired with current club badges and league metadata during hydration.",
);
assert.match(
  appSource,
  /record\.mode === "premier-league" && window\.PremierLeagueSeason\?\.openSavedHistory\?\.\(record\)/,
  "Saved Premier League seasons must open in the Premier League viewer instead of the knockout viewer.",
);
assert.match(
  premierLeagueSource,
  /function openSavedHistory\(record\)[\s\S]*savedTournamentView:\s*true[\s\S]*activeView = "overview"[\s\S]*renderSeason\(\)/,
  "The Premier League viewer must restore a completed saved league on its Overview screen.",
);
assert.match(
  premierLeagueSource,
  /function closeSavedHistory\(\)[\s\S]*season = previous\.season[\s\S]*backLabel\.textContent = "Back to modes"/,
  "Closing a saved league must restore the user's active Premier League season.",
);
assert.match(
  challengeSource,
  /savedChampion\?\.badge \|\| currentChampion\?\.badge/,
  "PL history cards must recover the champion club badge.",
);
assert.match(
  challengeSource,
  /record\.mode === "premier-league"[\s\S]*profile-history-league-trophy/,
  "PL history cards must show a league trophy.",
);
assert.match(
  cssSource,
  /profile-tournament-history-card\[data-history-theme="premier-league"\][\s\S]*aspect-ratio:\s*auto[\s\S]*profile-tournament-flag\.achievement-club-badge[\s\S]*object-fit:\s*contain/,
  "PL history cards and crests must retain compact dimensions on mobile.",
);

assert.match(
  cssSource,
  /#championSaveTournament\[data-history-theme="2014"\]/,
  "The save action must inherit the Brazil 2014 visual language.",
);
console.log("Tournament history UI checks passed.");
