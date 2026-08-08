import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist.`);
  const bodyStart = app.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}.`);
}

const context = vm.createContext({});
vm.runInContext(`
  let state = null;
  ${functionSource("standardTournamentSetupLocked")}
  globalThis.locked = (candidate) => standardTournamentSetupLocked(candidate);
`, context);

const openingRound = Array.from({ length: 128 }, () => ({}));
assert.equal(context.locked({ started: true, rounds: [openingRound] }), true,
  "A started default 256 knockout must lock its setup.");
assert.equal(context.locked({ started: false, rounds: [openingRound] }), false,
  "A restarted default tournament must unlock its setup.");
assert.equal(context.locked({ started: true, rounds: [openingRound], customTournament: { active: true } }), false,
  "The default lock must not be applied to custom tournaments.");

assert.match(html, /id="defaultModeCard"/, "The default mode card needs a lock-state target.");
assert.match(html, /class="[^"]*standard-route-back[^"]*"[^>]*data-mode-route-back/,
  "The desktop 256 setup needs a direct route back to the mode library.");
assert.match(functionSource("syncStandardTournamentCardLock"), /button\.disabled = setupLocked/,
  "Simulation controls must be disabled while locked.");
assert.match(functionSource("syncStandardTournamentCardLock"), /spectatePickerButton\.disabled = setupLocked/,
  "The managed-team picker must be disabled while locked.");
assert.match(app, /Restart the tournament before changing its simulation settings\./,
  "Changing simulation settings must also have an event-level lock guard.");
assert.match(app, /Restart the tournament before changing your managed team\./,
  "Changing the managed team must also have an event-level lock guard.");
assert.match(css, /\.mode-card-default\.is-setup-locked[\s\S]*content: "\\1F512"/,
  "Locked default settings need visible lock indicators.");
assert.match(css, /body\[data-desktop-mode-setup="standard"\] \.mode-select\s*\{[\s\S]*?place-items: center/,
  "The desktop 256 setup should use a centered, dedicated setup surface.");
assert.match(css, /body\[data-desktop-mode-setup="standard"\] \.landing-team-setting\s*\{[\s\S]*?grid-column: 1 \/ -1/,
  "The team picker should occupy its own full-width row in the desktop setup.");

console.log("Default 256 tournament setup lock tests passed.");
