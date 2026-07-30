import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlSource = readFileSync(join(root, "index.html"), "utf8");
const appSource = readFileSync(join(root, "app.js"), "utf8");
const cssSource = readFileSync(join(root, "clean.css"), "utf8");
const buildSource = readFileSync(join(root, "scripts", "build-cloudflare.mjs"), "utf8");

assert.ok(
  existsSync(join(root, "assets", "copa-america-2024-logo.png")),
  "The supplied Copa América logo must be included.",
);
assert.match(htmlSource, /data-retro-competition="copa"[^>]*>Copa</);
assert.match(htmlSource, /data-copa-year="2024"/);
assert.match(htmlSource, /Copa América 2024/);
assert.match(htmlSource, /coming soon/i);
assert.match(appSource, /\["wc", "euros", "copa"\]/);
assert.match(appSource, /retroWorldCupLogo\.src = RETRO_COPA_2024\.logo/);
assert.match(appSource, /\? "Copa Simulator"/);
assert.match(appSource, /const RETRO_COPA_2024 = Object\.freeze\(\{/);
assert.match(appSource, /\{ name: "Argentina", group: "A" \}/);
assert.match(appSource, /\{ name: "Canada", group: "A" \}/);
assert.match(appSource, /\{ name: "Mexico", group: "B" \}/);
assert.match(appSource, /\{ name: "Jamaica", group: "B" \}/);
assert.match(appSource, /\{ name: "United States", group: "C" \}/);
assert.match(appSource, /\{ name: "Bolivia", group: "C" \}/);
assert.match(appSource, /\{ name: "Brazil", group: "D" \}/);
assert.match(appSource, /\{ name: "Costa Rica", group: "D" \}/);
assert.match(appSource, /readRetroCopaTeam\(\)/);
assert.match(appSource, /saveRetroCopaTeam\(name\)/);
assert.match(appSource, /\? Boolean\(RETRO_COPA_2024\.teams\.length\)/);
assert.match(appSource, /isCopa\s*\?\s*"Coming soon"/);
assert.match(cssSource, /\.mode-card-retro\[data-retro-competition="copa"\]/);
assert.match(
  cssSource,
  /\.mode-card-retro\[data-retro-competition="copa"\] \.retro-mode-heading img[\s\S]*?width:\s*56px;[\s\S]*?height:\s*58px;/,
);
assert.match(
  cssSource,
  /\.mode-card-retro\[data-retro-competition="euros"\] \.retro-mode-heading img[\s\S]*?transform:\s*translateY\(4px\);/,
);
assert.match(
  cssSource,
  /\.mode-card-retro\[data-retro-competition="copa"\] \.retro-landing-settings[\s\S]*?display:\s*grid;/,
);
assert.match(cssSource, /#ff2835/);
assert.match(cssSource, /#1474e8/);
assert.match(buildSource, /assets\/copa-america-2024-logo\.png/);

console.log("Copa América 2024 coming-soon menu checks passed.");
