import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, html, css, worker, wrangler, challengeService, customTeamsMigration] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../clean.css", import.meta.url), "utf8"),
  readFile(new URL("../worker.mjs", import.meta.url), "utf8"),
  readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"),
  readFile(new URL("../challenge-service.mjs", import.meta.url), "utf8"),
  readFile(new URL("../migrations/0014_account_custom_teams.sql", import.meta.url), "utf8"),
]);

assert.match(html, /id="openCustomMatchButton"/);
assert.match(html, /id="customMatchScreen"/);
assert.match(app, /const CUSTOM_TEAM_LIBRARY_KEY = "world-256-custom-team-library-v1"/);
assert.match(app, /function sanitizeCustomTeam\(team\)/);
assert.match(app, /function customTeamCreatorMarkup\(\)/);
assert.match(app, /data-custom-player-field="overall"/);
assert.match(app, /data-custom-player-field="startingXI"/);
assert.match(app, /data-custom-action="auto-pick-custom-xi"/);
assert.match(app, /function customPlayersWithValidStartingXI\(players\)/);
assert.match(app, /Choose exactly 11 players for the starting XI/);
assert.match(app, /\["goalkeeping", "GK"\]/);
assert.match(app, /function customFlagDataUrl\(file\)/);
assert.match(app, /CUSTOM_TEAM_FLAG_DATABASE_NAME = "world-256-custom-team-flags"/);
assert.match(app, /function openCustomTeamFlagDatabase\(\)/);
assert.match(app, /async function writeCustomTeamFlagAsset\(teamId, dataUrl\)/);
assert.match(app, /async function hydrateCustomTeamFlagAssets\(\)/);
assert.match(app, /if \(source === "custom"\) return \[\.\.\.customTeamLibrary\]/,
  "Every saved custom team must remain available to selectors.");
assert.doesNotMatch(app, /customTeamLibrary\.slice\(/,
  "The custom-team library must not have an arbitrary client-side count cap.");
assert.match(challengeService, /SELECT team_json FROM account_custom_teams\s+WHERE account_id = \? ORDER BY updated_at DESC/,
  "Account sync must return the complete custom-team library.");
assert.doesNotMatch(challengeService, /SELECT team_json FROM account_custom_teams[\s\S]{0,160}\bLIMIT\b/,
  "Account sync must not silently limit the number of returned custom teams.");
assert.doesNotMatch(customTeamsMigration, /\bCHECK\s*\(/,
  "The custom-team table must not impose an arbitrary per-account team count.");
assert.match(app, /const \{ customFlag, \.\.\.metadata \} = team/,
  "Local custom-team metadata must not keep image data after IndexedDB is ready.");
assert.match(app, /await deleteCustomTeamFlagAsset\(team\.id\)/);
assert.match(app, /CUSTOM_TEAM_IMAGE_INPUT_MAX_BYTES = 25_000_000/);
assert.match(app, /function compressedCustomFlagDataUrl\(sourceCanvas\)/);
assert.match(app, /dataUrl\.length <= CUSTOM_TEAM_IMAGE_DATA_URL_TARGET/);
assert.doesNotMatch(app, /file\.size > 5_000_000/);
assert.match(app, /Crop your team image/);
assert.match(app, /data-crop-action="apply"/);
assert.match(app, /data-crop-shape="square"/);
assert.match(app, /customFlagShape: draft\.customFlagShape/);
assert.match(app, /customFlag \|\| imageOverride \|\| `https:\/\/flagcdn\.com/,
  "Snapshots must load uploaded custom-team flags before falling back to a country flag.");
assert.match(app, /customFlag: true|customFlag/);
assert.match(app, /function createCustomMatchState\(\)/);
assert.match(
  app,
  /const officialRetroSquad = Boolean\(team\.retroWorldCup && team\.playerProfiles\?\.length\)/,
  "Retro teams in Custom Match must keep their historical player profiles.",
);
assert.match(
  app,
  /const canonicalCurrentTeam = team\.retroWorldCup \|\| historicalTournament/,
  "Retro teams must never be replaced by the same country's current 2026 roster.",
);
assert.match(app, /function customMatchScriptMarkup\(home, away\)/, "Standalone Custom Match must expose a result scripting panel.");
assert.match(app, /customMatchSetup\.script \? \{ \"0:0\": structuredClone\(customMatchSetup\.script\) \} : \{\}/, "Standalone match scripts must flow into the simulation state.");
assert.match(app, /customMatchSetup\.script = \{[\s\S]{0,260}homeGoals,[\s\S]{0,260}awayGoals,[\s\S]{0,260}goals/s, "Standalone scripts must persist scores and goal events.");
assert.match(app, /data-custom-action="randomise-groups"/, "Custom group builders must expose a randomise action.");
assert.match(app, /function randomisedCustomGroupSlots\(selectedIds, random = Math\.random\)/);
assert.match(app, /showToast\("Groups randomised\."\)/);
assert.match(css, /\.custom-randomise-groups/, "The group randomiser must follow the custom-builder button styling.");
assert.match(
  app,
  /if \(matchday < 0\) \{[\s\S]{0,900}buildNextRound\(0\);[\s\S]{0,900}state\.activeRound = 1;/,
  "A completed custom group stage must open the knockout round instead of returning early.",
);
assert.doesNotMatch(
  app,
  /if \(isCustomGroupStageRound\(\)\) \{\s*const matchday = pendingCustomGroupMatchday\(round\);\s*if \(matchday < 0\) return;/,
  "A restored tournament with every group fixture revealed must not get stuck before the Round of 32.",
);
assert.match(
  app,
  /isCustomGroupStageRound\(\) && pendingCustomGroupMatchday\(selectedRound\(\)\) < 0\) \{\s*simulateCurrentRound\(\);/,
  "The completed group-stage button must continue immediately instead of opening another simulation prompt.",
);
assert.match(app, /`Continue to \$\{tournamentRoundName\(1\)\}`/);
assert.match(
  app,
  /state\.spectateTeamId && managedMatchIndex < 0[\s\S]{0,180}state\.neutralView = true/,
  "An eliminated managed team must fall back to neutral viewing when the knockouts begin.",
);
assert.match(app, /customMatch: true/);
assert.match(app, /count === 2 && candidate\.customTournament\.customMatch === true/);
assert.match(app, /customMatch: "\/custom-matches"/);
assert.match(app, /\["premier-league", "Premier League clubs"\]/);
assert.match(app, /data-custom-match-source=/);
assert.match(app, /function reconcileCustomMatchTeamSelections\(\)/);
assert.match(app, /No custom teams yet/);
assert.match(app, /data-custom-match-action="edit-custom-team"[\s\S]{0,180}data-custom-match-action="delete-custom-team"/, "Custom Match must expose edit and delete actions for custom teams.");
assert.match(app, /teamCreatorReturnSide = button\.dataset\.side === "away" \? "away" : "home"/, "Editing a Custom Match team must return it to the correct side.");
assert.match(app, /customTournamentUi\.teamCreatorReturnMode === "customMatch" \? customTeamCreatorMarkup\(\) : ""/, "Custom Match must render the team editor without leaving its own route.");
assert.doesNotMatch(app, /teamCreatorReturnMode = "customMatch";[\s\S]{0,180}setAppModeUrl\("custom"\)/, "Opening the team editor from Custom Match must keep the /custom-matches route.");
assert.match(app, /function raiseLinkedCustomRatings\(ratings, keys, nextOverall, baselineRatings = ratings\)/, "Custom team Overall changes must have a linked-ratings helper.");
assert.match(app, /CUSTOM_PREMIER_LEAGUE_TEAMS/);
assert.match(app, /const CUSTOM_PREMIER_LEAGUE_TEAMS = Object\.freeze\([\s\S]*window\.PREMIER_LEAGUE_2026_27_CLUBS/);
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
assert.match(app, /data-custom-action="delete-custom-team"/);
assert.match(app, /async function deleteCustomTeam\(teamId\)/);
assert.match(app, /const previousLibrary = \[\.\.\.customTeamLibrary\]/);
assert.match(app, /removeCustomTeamFromAccount\(team\.id\)/);
assert.match(app, /customTournamentSetup\.selectedIds\.map\(\(selectedId\) => selectedId === team\.id \? null : selectedId\)/);
assert.match(app, /replaceDeletedCustomMatchTeam\("home", team\.id\)/);
assert.match(css, /\.custom-team-delete-button/);
assert.match(css, /\.custom-match-team-actions button\.is-danger/, "Custom Match must style its delete action as destructive.");
assert.match(css, /custom-uploaded-flag img[^}]*object-fit: cover/);
assert.match(css, /custom-team-flag-preview img[^}]*object-fit: cover/);
assert.match(css, /\.custom-uploaded-flag\s*{[^}]*border-radius:/);
assert.match(css, /\.custom-uploaded-flag\s*{[^}]*border:\s*0;[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/,
  "Uploaded custom flags must not have a gray frame or backing.");
assert.match(css, /\.custom-team-flag-preview:has\(img\)\s*{[^}]*border-color:\s*transparent/);
assert.match(css, /\.custom-uploaded-flag\.custom-uploaded-badge\s*{[^}]*aspect-ratio:\s*1/);
assert.match(css, /\.custom-flag-crop-editor/);
assert.match(css, /custom-match-team-flag\.pl-club-flag img[\s\S]*object-fit: contain/);
assert.match(css, /\.pl-club-flag img[\s\S]*object-fit: contain/);
assert.match(css, /\.flag-orb:has\(\.pl-club-flag\)/);
assert.match(css, /body\.custom-match-mode-active #roundBoard/);
assert.match(worker, /APP_SHELL_PATHS[^\n]+"\/custom-matches"/);
assert.match(wrangler, /"\/custom-matches"/);
assert.match(css, /\.custom-team-creator/);
assert.match(css, /\.custom-match-builder/);

const lineupHelperStart = app.indexOf("function customPlayersWithValidStartingXI(");
const lineupHelperEnd = app.indexOf("function sanitizeCustomTeam(", lineupHelperStart);
assert.ok(lineupHelperStart >= 0 && lineupHelperEnd > lineupHelperStart);
const customPlayersWithValidStartingXI = new Function(
  `${app.slice(lineupHelperStart, lineupHelperEnd)}; return customPlayersWithValidStartingXI;`,
)();
const squad = [
  { name: "Keeper", position: "GK", overall: 70 },
  ...Array.from({ length: 12 }, (_, index) => ({
    name: `Outfield ${index + 1}`,
    position: "CM",
    overall: 60 + index,
  })),
];
const automaticXI = customPlayersWithValidStartingXI(squad);
assert.equal(automaticXI.filter((player) => player.startingXI).length, 11);
assert.equal(automaticXI.find((player) => player.name === "Keeper").startingXI, true);
assert.equal(automaticXI.find((player) => player.name === "Outfield 1").startingXI, false);
assert.equal(automaticXI.find((player) => player.name === "Outfield 12").startingXI, true);

const groupRandomiserStart = app.indexOf("function randomisedCustomGroupSlots(");
const groupRandomiserEnd = app.indexOf("function customGroupFixturePairs(", groupRandomiserStart);
assert.ok(groupRandomiserStart >= 0 && groupRandomiserEnd > groupRandomiserStart);
const randomisedCustomGroupSlots = new Function(
  "shuffle",
  `${app.slice(groupRandomiserStart, groupRandomiserEnd)}; return randomisedCustomGroupSlots;`,
)((items) => [...items].reverse());
assert.deepEqual(
  randomisedCustomGroupSlots(["a", "b", "c", "d", null, "e"]),
  ["e", "d", "c", "b", null, "a"],
  "Randomising groups must reshuffle selected teams without moving empty slots.",
);

const linkedRatingsHelperStart = app.indexOf("function raiseLinkedCustomRatings(");
const linkedRatingsHelperEnd = app.indexOf("function customTeamCreatorContainer(", linkedRatingsHelperStart);
assert.ok(linkedRatingsHelperStart >= 0 && linkedRatingsHelperEnd > linkedRatingsHelperStart);
const raiseLinkedCustomRatings = new Function(
  "simulationClamp",
  `${app.slice(linkedRatingsHelperStart, linkedRatingsHelperEnd)}; return raiseLinkedCustomRatings;`,
)((value, min, max) => Math.min(max, Math.max(min, value)));
const linkedRatings = { overall: 75, attack: 78, midfield: 74, defence: 70, goalkeeper: 65 };
raiseLinkedCustomRatings(linkedRatings, ["overall", "attack", "midfield", "defence", "goalkeeper"], 80);
assert.deepEqual(linkedRatings, { overall: 80, attack: 83, midfield: 79, defence: 75, goalkeeper: 70 });
raiseLinkedCustomRatings(linkedRatings, ["overall", "attack", "midfield", "defence", "goalkeeper"], 77);
assert.deepEqual(linkedRatings, { overall: 77, attack: 83, midfield: 79, defence: 75, goalkeeper: 70 }, "Lowering Overall must not silently erase custom stat choices.");

const reconcileHelperStart = app.indexOf("function reconcileCustomMatchTeamSelections(");
const reconcileHelperEnd = app.indexOf("function customMatchTeamOptions(", reconcileHelperStart);
assert.ok(reconcileHelperStart >= 0 && reconcileHelperEnd > reconcileHelperStart);
const delayedCustomSetup = {
  homeSource: "custom",
  homeId: null,
  awaySource: "current",
  awayId: "england",
};
let customMatchSetupSaves = 0;
const reconcileDelayedCustomTeam = new Function(
  "customMatchSetup",
  "customTeamSourcePool",
  "saveCustomMatchSetup",
  `${app.slice(reconcileHelperStart, reconcileHelperEnd)}; return reconcileCustomMatchTeamSelections;`,
)(delayedCustomSetup, (source) => source === "custom" ? [{ id: "custom-cloud-club" }] : [{ id: "england" }], () => {
  customMatchSetupSaves += 1;
});
assert.equal(reconcileDelayedCustomTeam(), true);
assert.equal(delayedCustomSetup.homeId, "custom-cloud-club", "A custom team loaded after initial render must become the real selected team.");
assert.equal(customMatchSetupSaves, 1);

console.log("Custom team creator and custom match checks passed.");
