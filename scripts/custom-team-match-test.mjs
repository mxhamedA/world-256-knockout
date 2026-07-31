import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, html, css, worker, wrangler] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../clean.css", import.meta.url), "utf8"),
  readFile(new URL("../worker.mjs", import.meta.url), "utf8"),
  readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
]);

assert.match(html, /id="openCustomMatchButton"/);
assert.match(html, /id="customMatchScreen"/);
assert.match(app, /const CUSTOM_TEAM_LIBRARY_KEY = "world-256-custom-team-library-v1"/);
assert.match(app, /function sanitizeCustomTeam\(team\)/);
assert.match(app, /function customTeamCreatorMarkup\(\)/);
assert.match(app, /data-custom-player-field="overall"/);
assert.match(app, /\["goalkeeping", "GK"\]/);
assert.match(app, /function customFlagDataUrl\(file\)/);
assert.match(app, /customFlag: true|customFlag/);
assert.match(app, /function createCustomMatchState\(\)/);
assert.match(app, /customMatch: true/);
assert.match(app, /count === 2 && candidate\.customTournament\.customMatch === true/);
assert.match(app, /customMatch: "\/custom-matches"/);
assert.match(app, /\["premier-league", "Premier League clubs"\]/);
assert.match(app, /data-custom-match-source=/);
assert.match(app, /CUSTOM_PREMIER_LEAGUE_TEAMS/);
assert.match(app, /customMatch === true\) return \["Custom match"\]/);
assert.match(app, /els\.roundBoard\.hidden = customMatchActive/);
assert.match(app, /els\.championTeamJourney\.hidden = customMatch/);
assert.match(app, /els\.championAwardsGrid\.hidden = customMatch/);
assert.match(app, /const snapshotShowsAward = championSnapshot && !customMatchSnapshot/);
assert.match(app, /customMatchSnapshot \? "CUSTOM MATCH WINNER" : "256 TEAMS WC CHAMPIONS"/);
assert.match(app, /if \(snapshotShowsAward\) drawSnapshotGoldenBoot/);
assert.match(app, /function customMatchCanResume\(candidate = customMatchState\)/);
assert.match(app, /fixture\?\.result\?\.revealed !== true/);
assert.match(app, /Start a fresh custom match\?/);
assert.match(app, /Keep this match/);
assert.match(app, /<span>Team to manage<\/span>/);
assert.match(app, /Add teams first/);
assert.match(app, /Save to my account/);
assert.match(app, /\/api\/challenge\/custom-teams/);
assert.match(css, /custom-uploaded-flag img[^}]*object-fit: contain/);
assert.match(css, /custom-team-flag-preview img[^}]*object-fit: contain/);
assert.match(css, /custom-match-team-flag\.pl-club-flag img[\s\S]*object-fit: contain/);
assert.match(css, /\.pl-club-flag img[\s\S]*object-fit: contain/);
assert.match(css, /\.flag-orb:has\(\.pl-club-flag\)/);
assert.match(css, /body\.custom-match-mode-active #roundBoard/);
assert.match(worker, /APP_SHELL_PATHS[^\n]+"\/custom-matches"/);
assert.match(wrangler, /"\/custom-matches"/);
assert.match(css, /\.custom-team-creator/);
assert.match(css, /\.custom-match-builder/);

console.log("Custom team creator and custom match checks passed.");
