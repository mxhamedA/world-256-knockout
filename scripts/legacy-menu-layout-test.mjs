import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, css] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../clean.css", import.meta.url), "utf8"),
]);

assert.match(html, /class="mode-card mode-card-legacy"[\s\S]*id="startLegacyDraftButton"[\s\S]*Start tournament/);
assert.match(html, /class="mode-card mode-card-custom"[\s\S]*custom-mode-prefix">Custom<[\s\S]*>Tournament<[\s\S]*class="custom-match-card-copy"[\s\S]*custom-mode-prefix">Custom<[\s\S]*>Match<[\s\S]*id="openCustomTournamentButton"[\s\S]*id="openCustomMatchButton"/,
  "Custom Tournament and Custom Match must share one menu card.");
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
assert.match(css, /\.mode-card-custom[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  "The shared Custom card must split into two equal desktop launch areas.");
assert.match(css, /#openCustomTournamentButton, #openCustomMatchButton[\s\S]*?display:\s*inline-flex !important/,
  "Both Custom launch actions must remain visible on desktop.");
assert.match(css, /\.retro-competition-switch button,[\s\S]*?\.retro-year-switch button[\s\S]*?font-size:\s*10px !important/,
  "Retro competition and year labels must be larger without resizing their controls.");
assert.match(css, /#premierLeagueLogo\s*\{[\s\S]*?width:\s*34px !important;[\s\S]*?height:\s*40px !important/,
  "The Premier League crest must stay contained beside its title.");
assert.match(css, /#openCustomTournamentButton::before,[\s\S]*?#openCustomTournamentButton::after[\s\S]*?content:\s*none !important/,
  "The Custom Tournament button must not duplicate its live Play or Resume label.");
assert.match(app, /openCustomTournamentButton\.innerHTML = `\$\{customActive \? "Resume" : "Play"\}/,
  "The compact Custom Tournament action should use Play or Resume.");
assert.match(app, /openCustomMatchButton\.innerHTML = `\$\{matchActive \? "Resume" : "Play"\}/,
  "The compact Custom Match action should use Play or Resume.");
assert.match(css, /\.legacy-setup-modal::backdrop/);
assert.match(app, /startLegacyDraftButton\?\.addEventListener[\s\S]*renderLegacyLandingSetup\(\);[\s\S]*legacySetupModal\?\.showModal\(\)/);
assert.match(app, /renderLegacyLandingSetup\(\);\s*setAppModeUrl\("legacy"\);/,
  "Opening a fresh Legacy Draft setup must navigate to its own URL.");
const legacyMenuLaunchHandler = app.match(/startLegacyDraftButton\?\.addEventListener\("click", \(\) => \{[\s\S]*?\n\}\);/)?.[0] || "";
assert.doesNotMatch(legacyMenuLaunchHandler, /if \(legacyDraft\)/,
  "The Legacy menu launch must not bypass setup when a saved draft exists.");
assert.match(app, /activeLegacySession \? "Resume draft" : "Start draft"/,
  "The setup screen must resume an active Legacy Draft instead of replacing it.");
assert.match(html, /id="legacySetupRestartButton"[^>]*hidden>Restart<\/button>/,
  "An active Legacy setup needs an explicit restart action.");
assert.match(css, /:is\(#retroWorldCupScreen, #premierLeagueSeasonScreen, #uclSimulatorScreen, #playerCareerScreen\)\[hidden\][\s\S]{0,80}display: none !important/,
  "Hidden full-screen modes must not remain in the document flow.");
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
assert.match(
  css,
  /body\.before-start:not\(\[data-desktop-mode-setup\]\) \.home-achievement-leaderboard\s*\{[^}]*min-height:\s*176px;[^}]*height:\s*auto;/,
  "A populated leaderboard must expand with its rows instead of overflowing a fixed-height card.",
);
assert.doesNotMatch(css, /@keyframes achievement-(?:gold|silver|bronze)-glow/,
  "Leaderboard podium styling must not use animated text glows that render as colour blocks.");
assert.match(css, /@media \(min-width: 721px\)\s*\{[\s\S]*?\.field-overview\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) clamp\(250px, 29vw, 330px\)/,
  "Tablet layouts must keep the leaderboard in a compact right-hand column.");
assert.match(css, /\.field-overview > \.home-editorial\s*\{\s*grid-column:\s*1 \/ -1/,
  "The simulator information footer must span beneath both tablet columns.");
assert.match(css, /@media \(min-width: 721px\) and \(max-width: 1159px\)[\s\S]*?\.mode-card:not\(\.mode-card-retro, \.mode-card-custom\)[\s\S]*?grid-column:\s*span 3 !important/,
  "Tablet launchers must use two columns instead of squeezing into three.");
assert.match(css, /\.mode-grid > \.mode-card\.mode-card-custom\s*\{\s*grid-column:\s*1 \/ -1 !important/,
  "The shared Custom launcher must span both tablet columns.");
assert.match(css, /@media \(min-width: 721px\) and \(max-width: 1159px\)[\s\S]*?\.mode-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6, minmax\(0, 1fr\)\)/,
  "The tablet mode grid must override the single-column mobile rule.");
assert.match(css, /@media \(min-width: 721px\) and \(max-width: 1159px\)[\s\S]*?\.mode-card-retro \.retro-year-switch\s*\{[\s\S]*?repeat\(8, minmax\(42px, 1fr\)\)/,
  "World Cup year controls must retain readable tap targets on tablets.");
assert.doesNotMatch(app, /window\.addEventListener\("resize"/,
  "Navigation should react to breakpoint changes instead of running on every resize event.");

console.log("Legacy menu layout checks passed.");
