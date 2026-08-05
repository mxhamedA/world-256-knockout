import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "worker.mjs"), "utf8");
const build = fs.readFileSync(path.join(root, "scripts", "build-cloudflare.mjs"), "utf8");
const marker = "/* Qatar 2022 Retro edition: original burgundy architectural treatment. */";
const markerIndex = css.indexOf(marker);
const russiaMarkerIndex = css.indexOf("/* Russia 2018 Retro edition: original folk-pattern treatment over the shared simulator. */");

assert.ok(markerIndex > russiaMarkerIndex, "The Qatar theme must follow the legacy retro themes so they cannot override it.");
assert.equal(css.indexOf(marker, markerIndex + marker.length), -1, "The Qatar theme marker should occur once.");
const theme = css.slice(markerIndex);

[
  "qatar-night-landscape.png",
  "qatar-night-portrait.png",
  ".retro-screen-header",
  ".retro-view-tabs",
  ".match-stage",
  ".round-board",
  ".match-analysis",
  ".standard-match-tactics",
  ".golden-boot-panel",
  ".retro-group-table",
  ".retro-squad-view",
  ".retro-lineups-view",
  ".match-2d-pitch",
  ".match-penalty-targets",
  ".champion-stage",
  ".snapshot-modal",
  ".retro-achievements-modal",
  ".achievement-year-tabs",
  ".achievement-unlock-modal",
  "::-webkit-scrollbar-thumb",
  ":hover",
  "@media (max-width: 900px)",
].forEach((token) => assert.ok(theme.includes(token), `Qatar theme must explicitly cover ${token}.`));

assert.match(theme, /achievement-year-tabs\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  "Achievement years must stay in one evenly divided row.");
assert.match(theme, /border-radius:\s*(?:0|2px|3px)\b/,
  "Qatar panels should use restrained, sharp corners.");
assert.doesNotMatch(theme, /#(?:006b3c|00843d|0b5d35|f49a0b|f3a000|2e5fc5)\b/i,
  "Qatar rules must not reuse known Brazil, South Africa or Russia theme colours.");
assert.doesNotMatch(theme, /retroWorldCupLogo|retro-mode-heading\s+img/,
  "The isolated Qatar theme must not resize or restyle the existing menu logo.");

assert.doesNotMatch(
  css,
  /body\.retro-mode-active:not\(\.retro-2010-active\):not\(\.retro-2018-active\)(?!:not\(\.retro-2022-active\))/,
  "Brazil-only selectors must explicitly exclude Qatar 2022.",
);
assert.match(app, /if \(Number\(year\) === 2022\) return RETRO_2022_SQUADS;/);
assert.match(app, /classList\.toggle\("retro-2022-active", Number\(retroTournament\.year\) === 2022\)/);
assert.match(css, /Qatar 2022 manager: editable team sheet and live performance ratings/);
assert.match(html, /<script src="\.\/data\/retro\/2022\/squads\.js/);
assert.match(html, /<script src="\.\/data\/retro\/2022\/schedule\.js/);
assert.match(worker, /"\/retro-22-world-cup"/);
assert.match(build, /assets\/retro-2022\/qatar-night-landscape\.png/);
assert.match(build, /assets\/retro-2022\/qatar-night-portrait\.png/);

const expectedLogoHash = "b0d749ce1691b5561864ebf617dadc66f78e173a7bac9677ac74f4af931161c3";
const logo = fs.readFileSync(path.join(root, "assets", "retro-world-cup-2022.png"));
assert.equal(crypto.createHash("sha256").update(logo).digest("hex"), expectedLogoHash,
  "The existing Qatar 2022 menu logo must remain byte-for-byte unchanged.");

for (const asset of ["qatar-night-landscape.png", "qatar-night-portrait.png"]) {
  assert.ok(fs.statSync(path.join(root, "assets", "retro-2022", asset)).size > 100_000, `${asset} must be a real rendered background.`);
}

console.log("Qatar 2022 theme isolation tests passed.");
