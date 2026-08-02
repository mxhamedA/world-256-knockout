import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, css] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../clean.css", import.meta.url), "utf8"),
]);

assert.match(html, /class="mode-card mode-card-legacy"[\s\S]*id="startLegacyDraftButton"[\s\S]*Start tournament/);
assert.doesNotMatch(html.match(/class="mode-card mode-card-legacy"[\s\S]*?<\/article>/)?.[0] || "", /id="legacyLandingSetup"/);
assert.match(html, /id="legacySetupModal"[\s\S]*id="legacyLandingSetup"[\s\S]*id="confirmLegacyDraftButton"/);
assert.match(html, /class="mode-card mode-card-ucl"[^>]*id="uclModeCard"[\s\S]*ucl-starball-white\.png[\s\S]*UCL simulator[\s\S]*id="uclTeamPickerButton"[\s\S]*id="startUclSimulatorButton"/);
assert.doesNotMatch(html.match(/id="uclModeCard"[\s\S]*?<\/article>/)?.[0] || "", /Coming soon/);
assert.doesNotMatch(html, /EUROPEAN CLUB FOOTBALL/);
assert.match(app, /const UCL_2026_27_QUALIFIED_TEAMS = Object\.freeze\(\[/);
assert.match(app, /\["arsenal", "Arsenal", "ENG", "ARS"\][\s\S]*\["villarreal", "Villarreal", "ESP", "VIL"\]/);
const uclTeamBlock = app.match(/const UCL_2026_27_QUALIFIED_TEAMS = Object\.freeze\(\[([\s\S]*?)\]\.map/)?.[1] || "";
assert.equal([...uclTeamBlock.matchAll(/\["[^"]+", "[^"]+", "[A-Z]{3}", "[A-Z0-9]{3}"\]/g)].length, 29);
assert.match(app, /function renderUclTeamPicker\(\)/);
assert.match(app, /function renderUclTeamList\(query = ""\)/);
assert.match(app, /function openUclTeamPicker\(\)/);
assert.match(app, /spectatePickerMode === "ucl"[\s\S]*saveUclMenuTeamId/);
assert.match(css, /\.ucl-mode-logo[\s\S]*object-fit:\s*contain/);
assert.match(css, /\.mode-card-ucl\s*{[^}]*radial-gradient[\s\S]*linear-gradient/);
assert.match(css, /\.mode-card-legacy\s*{[^}]*order:\s*6;[^}]*grid-column:\s*span 2;/);
assert.match(css, /\.mode-card-ucl\s*{[^}]*order:\s*4;[^}]*grid-column:\s*span 3;/);
assert.match(css, /\.legacy-setup-modal::backdrop/);
assert.match(app, /startLegacyDraftButton\?\.addEventListener[\s\S]*renderLegacyLandingSetup\(\);[\s\S]*legacySetupModal\?\.showModal\(\)/);
assert.match(app, /confirmLegacyDraftButton\?\.addEventListener[\s\S]*legacySetupModal\?\.close\(\)[\s\S]*startLegacyDraft\(legacySetup\.nationId\)/);
assert.match(app, /activeLegacySession \? "Resume tournament" : "Start tournament"/);

console.log("Legacy menu layout checks passed.");
