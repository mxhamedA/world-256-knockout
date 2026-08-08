import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");

const setupBackButtons = html.match(/class="[^"]*setup-panel-back[^"]*"[^>]*data-mode-route-back/g) || [];
assert.equal(setupBackButtons.length, 4,
  "The 256, retro, Premier League, and UCL setup panels each need a Back to modes button.");
assert.match(html, /class="legacy-setup-back legacy-topbar-back"[\s\S]*?Back to modes/,
  "The full-screen Legacy Draft setup needs a Back to modes action.");
assert.match(html, /class="legacy-setup-back legacy-topbar-back"[^>]*form="legacySetupForm"[\s\S]*?<form method="dialog" class="legacy-setup-modal-card" id="legacySetupForm"/,
  "The Legacy Draft back button must sit outside the setup card while still closing its dialog.");
assert.match(html, /id="customTournamentBackButton"[\s\S]*?Back to modes/,
  "The custom tournament setup must keep its Back to modes action.");
assert.match(app, /document\.querySelectorAll\("\[data-mode-route-back\]"\)[\s\S]*?setAppModeUrl\("home"\)/,
  "Shared setup back buttons must return directly to the mode menu.");
assert.match(app, /function modeSetupRouteEnabled\(mode\)[\s\S]*?mode === "standard" \|\| desktopModeSetupEnabled\(\)/,
  "The 256 knockout setup route must remain available on mobile screens.");
assert.match(app, /classList\.contains\("legacy-route-setup-active"\)[\s\S]*?legacySetupModal\?\.show\(\)[\s\S]*?legacySetupModal\?\.showModal\(\)/,
  "Desktop Legacy Draft setup must use a non-modal route so the top banner remains visible.");
assert.match(app, /setProperty\("display", desktopSetupMode === "standard" \? "block" : "grid", "important"\)/,
  "The standard setup renderer must remove the obsolete sidebar column.");
assert.match(app, /dataset\.desktopModeSetup === "standard"[\s\S]*?setProperty\("display", "block", "important"\)/,
  "Startup recovery must preserve the standard setup's full-width shell.");
assert.match(css, /\.standard-route-back,\s*\.setup-panel-back\s*\{\s*display: none/,
  "Setup-only back buttons must stay hidden on the main mode menu.");
assert.match(css, /body\[data-desktop-mode-setup="standard"\] #appShell\s*\{\s*display: block !important/,
  "The 256 setup must not inherit the old sidebar grid shell.");
assert.match(css, /body\[data-desktop-mode-setup="standard"\] \.sidebar\s*\{[\s\S]*?grid-area: standard-setup-header;[\s\S]*?width: 100% !important/,
  "The standard setup must retain a full-width top banner instead of a sidebar rail.");
assert.match(css, /grid-template-columns: minmax\(0, 1fr\) !important/,
  "The standard setup shell must remain one full-width column even if another renderer selects grid display.");
assert.match(css, /body\[data-desktop-mode-setup="standard"\] \.field-overview\s*\{\s*display: block !important/,
  "The setup panel must not inherit the desktop home page's empty leaderboard column.");
assert.match(css, /body\.legacy-route-setup-active #legacySetupModal\s*\{[\s\S]*?inset: 72px 0 0;[\s\S]*?width: 100%;[\s\S]*?height: calc\(100dvh - 72px\)/,
  "The Legacy Draft setup canvas should fill the viewport beneath the top banner.");
assert.match(css, /body\.legacy-route-setup-active #legacySetupModal \.legacy-setup-modal-card\s*\{[\s\S]*?justify-self: center;[\s\S]*?align-self: center/,
  "The Legacy Draft setup card should be explicitly centered in the viewport.");
assert.match(css, /body\.legacy-route-setup-active \.legacy-setup-back\s*\{[\s\S]*?position: fixed;[\s\S]*?top: 96px/,
  "The Legacy Draft back button should sit at the route's top-left, outside the card.");
assert.match(html, /clean\.css\?v=custom-club-pool-1/,
  "Setup shell CSS changes need a fresh browser cache key.");
assert.match(html, /app\.js\?v=ucl-mobile-picker-1/,
  "Setup route behavior changes need a fresh browser cache key.");
assert.match(css, /@media \(max-width: 720px\)[\s\S]*?body\[data-desktop-mode-setup="standard"\] \.mode-card-mobile-toggle\s*\{\s*display: none !important/,
  "The mobile 256 route must show its setup controls instead of the main-menu accordion.");
assert.match(html, /setup-panel-back legacy-topbar-back/,
  "The 256 setup must reuse the standard tournament back-button UI.");
assert.match(html, /setup-panel-back ucl-back-button/,
  "The UCL setup must reuse the UCL tournament back-button UI.");
assert.match(html, /setup-panel-back pl-back-button/,
  "The Premier League setup must reuse the league tournament back-button UI.");
assert.match(html, /setup-panel-back retro-back-to-modes/,
  "Retro setup routes must reuse each edition's themed tournament back-button UI.");
assert.match(css, /\.setup-panel-back:active\s*\{\s*transform: scale\(\.97\)/,
  "Setup back buttons need responsive press feedback.");

console.log("Mode setup navigation checks passed.");
