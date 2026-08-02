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
assert.equal([...uclTeamBlock.matchAll(/\["/g)].length, 39);
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
assert.match(app, /function setupMobileModeCards\(\)/, "The mobile menu must progressively disclose mode setup cards.");
assert.match(app, /candidate\.classList\.remove\("is-mobile-expanded"\)/, "Opening one mobile mode must close the others.");
assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.mode-grid > \.mode-card\s*\{[\s\S]*max-height:\s*76px/, "Collapsed mobile modes must render as compact launcher rows.");
assert.match(css, /\.mode-grid > \.mode-card\.is-mobile-expanded[\s\S]*max-height:\s*none/, "The selected mobile mode must expand without clipping its setup.");
assert.match(css, /\.landing-setting:not\(\.landing-team-setting\)[\s\S]*grid-template-columns:\s*minmax\(88px/, "Expanded mobile settings must use compact single-line controls.");
assert.match(css, /\.mode-card-actions[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) auto/, "Resume and restart actions must share a compact mobile row.");
assert.doesNotMatch(app, /mode-card-mobile-mark/, "Compact mobile modes must not restore abbreviation badges.");
assert.match(app, /mode-card-mobile-artwork/, "Mobile mode rows must expose a real-artwork slot.");
assert.match(app, /256-teams-icon\.svg/, "The 256-team mobile row must use the site icon.");
assert.match(app, /prem-logo\.webp/, "The Premier League mobile row must use its real logo.");
assert.match(app, /ucl-starball-white\.png/, "The UCL mobile row must use the starball artwork.");
assert.match(css, /\.is-mobile-expanded > \.mode-card-mobile-toggle[\s\S]{0,220}background:\s*transparent\s*!important/, "The expanded mobile header must not retain a translucent button rectangle.");
assert.match(css, /\.mode-card\.is-mobile-expanded > \.mode-card-mobile-toggle[\s\S]{0,140}grid-template-columns:\s*60px[\s\S]{0,140}min-height:\s*88px/, "Expanded mobile headers must give their artwork a larger dedicated footprint.");
assert.match(css, /\.is-mobile-expanded \.mode-card-mobile-artwork img\s*\{[\s\S]{0,100}width:\s*58px;[\s\S]{0,80}height:\s*58px;/, "Expanded tournament logos must not retain the compact collapsed size.");
assert.match(css, /data-retro-competition="euros"\] \.mode-card-mobile-artwork img\s*\{[\s\S]{0,100}object-fit:\s*cover;[\s\S]{0,100}transform:\s*none;/, "The padded Euro artwork must use a stable crop instead of moving when expanded.");
assert.match(css, /\.mode-card-ucl\s*\{\s*order:\s*3;[\s\S]{0,100}\.mode-card-default\s*\{\s*order:\s*4;/, "UCL must be the third mobile mode, ahead of the 256-team knockout.");

console.log("Legacy menu layout checks passed.");
