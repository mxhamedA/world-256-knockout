import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, css, buildScript] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../match-themes.css", import.meta.url), "utf8"),
  readFile(new URL("./build-cloudflare.mjs", import.meta.url), "utf8"),
]);

assert.match(html, /world-256-tournament-theme/, "The selected match theme must be restored during boot.");
assert.match(html, /data-tournament-theme-option="off"[\s\S]*DEFAULT/, "The custom match theme must have an off option.");
assert.match(html, /savedMatchTheme \|\| cookieMatchTheme \|\| "off"/, "Default must be selected until the user chooses a custom theme.");
assert.match(html, /data-tournament-theme-option="off" aria-pressed="true"/, "The initial picker state must show Default as selected.");
assert.match(html, /data-tournament-theme-option="1998"/, "France 1998 must be selectable.");
assert.match(html, /data-tournament-theme-option="2002"/, "Korea\/Japan 2002 must be selectable.");
for (const year of [2006, 2010, 2014, 2018, 2022, 2026]) {
  assert.match(html, new RegExp(`data-tournament-theme-option="${year}"`), `${year} must be selectable.`);
}
assert.match(html, /match-themes\.css/, "Match theme styles must load.");
assert.match(buildScript, /"match-themes\.css"/, "Match theme assets must ship in the build.");

assert.match(app, /function applyTournamentTheme\(/, "Match theme selection logic must be available.");
assert.match(app, /nextTheme === "off"[\s\S]*Custom match theme turned off/, "Turning the theme off must restore the default presentation.");
assert.match(app, /dataset\.tournamentTheme !== "off"[\s\S]*standardKnockoutActive \|\| customTournamentActive/, "The custom skin must not activate when the setting is off.");
assert.match(app, /applyTournamentTheme\(document\.documentElement\.dataset\.tournamentTheme/, "Runtime boot must activate the saved theme.");
assert.match(app, /classList\.toggle\("authentic-tournament-theme-active", sharedTournamentThemeActive\)/, "Only standard knockout and custom tournament match flows should activate the authentic theme.");
assert.match(app, /\[1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026\]/, "Every World Cup mode should support the selected theme.");

assert.match(css, /body\.authentic-tournament-theme-active\.tournament-theme-shared-shell-active #appShell/, "Authentic themes must preserve the standard and custom match shell.");
assert.doesNotMatch(css, /body:not\(\.before-start\)/, "Theme scope must not rely on setup-screen state.");
assert.doesNotMatch(css, /\.ucl-simulator-screen/, "The competition skin must not cover UCL screens.");
assert.doesNotMatch(css, /\.pl-season-screen/, "The competition skin must not cover Premier League screens.");
assert.match(css, /max-width: 38px !important/, "Edition logos should stay compact even inside Retro modals.");
assert.match(css, /overflow-x: hidden/, "The theme picker should never create horizontal scrolling.");
assert.match(html, /class="tournament-theme-setting"/, "The theme setting must be visible in Settings.");
assert.doesNotMatch(html, /id="tournamentThemeStatus"/, "The compact picker should use only the tile checkmark to show selection.");

console.log("Tournament theme UI checks passed.");
