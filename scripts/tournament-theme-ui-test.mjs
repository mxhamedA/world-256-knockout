import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [html, app, css, buildScript] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../match-themes.css", import.meta.url), "utf8"),
  readFile(new URL("./build-cloudflare.mjs", import.meta.url), "utf8"),
]);

assert.match(html, /world-256-tournament-theme/, "Theme should be restored before the page paints.");
for (const edition of ["2006", "2010", "2014", "2016", "2018", "2022", "2026"]) {
  assert.match(html, new RegExp(`data-tournament-theme-option="${edition}"`), `${edition} should be available in the match theme picker.`);
  assert.match(css, new RegExp(`data-tournament-theme="${edition}"`), `${edition} should have a shared match-screen skin.`);
}
assert.equal((html.match(/data-open-tournament-theme/g) || []).length, 2, "Both custom builders should expose the theme picker.");
assert.match(html, /match-themes\.css/, "Competition match themes should load after mode stylesheets.");
assert.match(buildScript, /"match-themes\.css"/, "The production build must include the match theme stylesheet.");

assert.match(app, /function applyTournamentTheme\(/, "The shared UI should apply theme changes immediately.");
assert.match(app, /localStorage\.setItem\(TOURNAMENT_THEME_STORAGE_KEY, nextTheme\)/, "The selected theme should persist.");
assert.match(app, /match UI applied to every mode/, "Theme changes should confirm their match-screen scope.");

assert.match(css, /body:not\(\.before-start\)/, "The selected edition should style active match screens.");
assert.match(css, /\.ucl-simulator-screen/, "The competition skin should cover UCL screens.");
assert.match(css, /\.pl-season-screen/, "The competition skin should cover Premier League screens.");
assert.match(css, /max-width: 38px !important/, "Edition logos should stay compact even inside Retro modals.");
assert.match(css, /overflow-x: hidden/, "The theme picker should never create horizontal scrolling.");
assert.match(css, /:has\(#customTournamentScreen:not\(\[hidden\]\)\)/, "Custom Tournament setup should keep its neutral builder UI.");
assert.match(css, /:has\(#customMatchScreen:not\(\[hidden\]\)\)/, "Custom Match setup should keep its neutral builder UI.");
assert.doesNotMatch(html.match(/<section class="tournament-theme-setting"[\s\S]*?<\/section>/)?.[0] || "", /squad/i, "The theme picker should not add a squads tab.");

console.log("Tournament theme UI checks passed.");
