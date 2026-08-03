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
assert.match(app, /data-custom-player-field="startingXI"/);
assert.match(app, /data-custom-action="auto-pick-custom-xi"/);
assert.match(app, /function customPlayersWithValidStartingXI\(players\)/);
assert.match(app, /Choose exactly 11 players for the starting XI/);
assert.match(app, /\["goalkeeping", "GK"\]/);
assert.match(app, /function customFlagDataUrl\(file\)/);
assert.match(app, /Crop your team image/);
assert.match(app, /data-crop-action="apply"/);
assert.match(app, /data-crop-shape="square"/);
assert.match(app, /customFlagShape: draft\.customFlagShape/);
assert.match(app, /customFlag \|\| imageOverride \|\| `https:\/\/flagcdn\.com/,
  "Snapshots must load uploaded custom-team flags before falling back to a country flag.");
assert.match(app, /customFlag: true|customFlag/);
assert.match(app, /function createCustomMatchState\(\)/);
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
