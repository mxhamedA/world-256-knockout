import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "assets", "pl-26-27", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert.equal(manifest.id, "pl-26-27");
assert.equal(manifest.season, "2026/27");
assert.equal(manifest.teams.length, 20);
assert.equal(new Set(manifest.teams.map((team) => team.id)).size, 20);

for (const team of manifest.teams) {
  const badgePath = path.resolve(path.dirname(manifestPath), team.badge);
  assert.ok(badgePath.startsWith(path.dirname(manifestPath)));
  assert.ok(fs.existsSync(badgePath), `${team.name} badge is missing`);
  const header = fs.readFileSync(badgePath).subarray(0, 12);
  assert.equal(header.subarray(0, 4).toString("ascii"), "RIFF", `${team.name} badge is not WebP`);
  assert.equal(header.subarray(8, 12).toString("ascii"), "WEBP", `${team.name} badge is not WebP`);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const accountClient = fs.readFileSync(path.join(root, "challenge.js"), "utf8");
const accountService = fs.readFileSync(path.join(root, "challenge-service.mjs"), "utf8");

assert.match(html, /<h3>PL 26\/27 Simulator<\/h3>/);
assert.match(html, /id="premierLeagueInstallButton"/);
assert.match(html, /id="plAssetPackModal"/);
assert.match(app, /PREMIER_LEAGUE_ASSET_PACK_ID = "pl-26-27"/);
assert.match(app, /\/api\/challenge\/assets\/\$\{PREMIER_LEAGUE_ASSET_PACK_ID\}/);
assert.match(app, /window\.addEventListener\("accountstatechange"/);
assert.match(accountClient, /new CustomEvent\("accountstatechange"/);
assert.match(accountService, /INSERT INTO account_asset_packs/);

console.log("PL 26/27 asset pack tests passed.");
