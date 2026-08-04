import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, css, buildScript] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../match-themes.css", import.meta.url), "utf8"),
  readFile(new URL("./build-cloudflare.mjs", import.meta.url), "utf8"),
]);

assert.doesNotMatch(html, /world-256-tournament-theme/, "Hidden competition themes must not be restored during boot.");
assert.doesNotMatch(html, /data-tournament-theme-option/, "The hidden theme picker must not appear in Settings.");
assert.doesNotMatch(html, /match-themes\.css/, "Competition theme styles must not load while the feature is hidden.");
assert.match(buildScript, /"match-themes\.css"/, "Dormant theme assets should remain available for a future relaunch.");

assert.match(app, /function applyTournamentTheme\(/, "Dormant theme logic should remain available for a future relaunch.");
assert.match(app, /delete document\.documentElement\.dataset\.tournamentTheme;/, "Runtime boot must remove stale competition themes.");
assert.doesNotMatch(app, /applyTournamentTheme\(document\.documentElement\.dataset\.tournamentTheme/, "Runtime boot must not activate a theme.");

assert.match(css, /body:not\(\.before-start\)/, "The selected edition should style active match screens.");
assert.match(css, /\.ucl-simulator-screen/, "The competition skin should cover UCL screens.");
assert.match(css, /\.pl-season-screen/, "The competition skin should cover Premier League screens.");
assert.match(css, /max-width: 38px !important/, "Edition logos should stay compact even inside Retro modals.");
assert.match(css, /overflow-x: hidden/, "The theme picker should never create horizontal scrolling.");
assert.match(css, /body:not\(\.before-start\):not\(\.custom-tournament-mode-active\)/, "Edition-specific presentation must exclude custom modes.");
for (const selectorLine of css.split(/\r?\n/).filter((line) => line.includes("body:not(.before-start)"))) {
  assert.match(selectorLine, /:not\(\.custom-tournament-mode-active\)/, `Custom modes leaked into themed selector: ${selectorLine}`);
}
assert.doesNotMatch(html, /tournament-theme-setting/, "The theme setting must stay out of the visible UI.");

console.log("Tournament theme UI checks passed.");
