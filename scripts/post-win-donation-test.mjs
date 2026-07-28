import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const app = readFileSync(join(root, "app.js"), "utf8");
const challenge = readFileSync(join(root, "challenge.js"), "utf8");
const premierLeague = readFileSync(join(root, "premier-league.js"), "utf8");

assert.match(app, /const POST_WIN_DONATION_CHANCE = 0\.25;/);
assert.match(app, /const POST_WIN_DONATION_COOLDOWN_MS = 7 \* 24 \* 60 \* 60 \* 1000;/);
assert.match(app, /postWinDonationEvaluatedThisPage\.has\(key\)/);
assert.match(app, /promptState\.evaluated\.includes\(key\)/);
assert.match(app, /Math\.random\(\) >= POST_WIN_DONATION_CHANCE/);
assert.match(app, /window\.setTimeout\(openWhenReady, 1800\)/);
assert.match(app, /maybeShowPostWinDonation\(`\$\{mode\}:\$\{state\.drawSeed \|\| "seed"\}:\$\{champion\.id\}`\)/);
assert.match(app, /`online:\$\{room\.code\}:\$\{tournament\.completedAt \|\| "complete"\}:/);
assert.match(app, /`retro-\$\{retroTournament\.year\}:\$\{retroTournament\.seed \|\| "seed"\}:/);
assert.match(challenge, /window\.maybeShowPostWinDonation\?\.\(`challenge:\$\{payload\.run\.id\}`\)/);
assert.match(premierLeague, /window\.maybeShowPostWinDonation\?\.\(`premier-league:\$\{season\.drawSeed\}:\$\{leader\.id\}`\)/);

console.log("Post-win donation prompt checks passed.");
