import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "src", "web", "app");
const bundlePath = join(projectRoot, "app.js");

// The application is still served as one classic browser script. These ordered
// chunks are deliberately concatenated rather than converted to ES modules so
// the existing global runtime and script-loader contract remain unchanged.
const chunks = [
  ["00-core/01-bootstrap-and-constants.js", 1, 783],
  ["00-core/02-settings-and-custom-teams.js", 784, 1193],
  ["00-core/03-legacy-draft-and-utilities.js", 1194, 1668],
  ["00-core/04-startup-and-routing.js", 1669, 2141],
  ["01-online/05-online-lobby-and-matchmaking.js", 2142, 4307],
  ["01-online/06-online-live-match.js", 4308, 5434],
  ["02-tournaments/07-standard-and-legacy-tournaments.js", 5435, 6143],
  ["02-tournaments/08-retro-state-and-team-installation.js", 6144, 6908],
  ["02-tournaments/09-shared-state-and-rendering-helpers.js", 6909, 10509],
  ["02-tournaments/10-player-profiles-and-rosters.js", 10510, 11878],
  ["02-tournaments/11-match-simulation.js", 11879, 14025],
  ["02-tournaments/12-live-match-presentation.js", 14026, 16264],
  ["02-tournaments/13-tournament-progression-and-standard-ui.js", 16265, 18076],
  ["03-custom/14-custom-tournament-and-custom-match.js", 18077, 20643],
  ["04-retro/15-main-rendering-and-retro-views.js", 20644, 22660],
  ["04-retro/16-retro-mode-lifecycle.js", 22661, 23293],
  ["05-ui/17-announcements-and-feature-modals.js", 23294, 23567],
  ["05-ui/18-online-event-bindings.js", 23568, 23792],
  ["04-retro/19-retro-lineup-bindings.js", 23793, 24400],
  ["05-ui/20-global-event-bindings.js", 24401, 24660],
  ["05-ui/21-navigation-mobile-and-startup.js", 24661, 24949],
];

// Preserve the original readability blank lines at chunk boundaries. They are
// not required by JavaScript, but keeping them makes the generated bundle easy
// to compare with the pre-split runtime.
const boundaryBlankLines = new Set([
  "00-core/02-settings-and-custom-teams.js",
  "01-online/05-online-lobby-and-matchmaking.js",
  "02-tournaments/07-standard-and-legacy-tournaments.js",
  "02-tournaments/08-retro-state-and-team-installation.js",
  "02-tournaments/09-shared-state-and-rendering-helpers.js",
  "02-tournaments/10-player-profiles-and-rosters.js",
  "02-tournaments/11-match-simulation.js",
  "02-tournaments/13-tournament-progression-and-standard-ui.js",
  "03-custom/14-custom-tournament-and-custom-match.js",
  "04-retro/15-main-rendering-and-retro-views.js",
  "04-retro/16-retro-mode-lifecycle.js",
  "05-ui/17-announcements-and-feature-modals.js",
  "04-retro/19-retro-lineup-bindings.js",
]);

function bootstrapSourceChunks() {
  if (chunks.every(([filename]) => existsSync(join(sourceRoot, filename)))) return;
  if (!existsSync(bundlePath)) {
    throw new Error(`Cannot bootstrap app sources: ${bundlePath} does not exist.`);
  }
  const lines = readFileSync(bundlePath, "utf8").replace(/^\/\* Generated from src\/web\/app\. \*\/\r?\n/, "").split(/\r?\n/);
  mkdirSync(sourceRoot, { recursive: true });
  chunks.forEach(([filename, start, end]) => {
    const destination = join(sourceRoot, filename);
    mkdirSync(dirname(destination), { recursive: true });
    const content = lines.slice(start - 1, end).join("\n").replace(/\n+$/, "") + "\n";
    writeFileSync(destination, content, "utf8");
  });
}

export function buildAppBundle() {
  bootstrapSourceChunks();
  const missing = chunks.filter(([filename]) => !existsSync(join(sourceRoot, filename))).map(([filename]) => filename);
  if (missing.length) throw new Error(`Missing app source chunks: ${missing.join(", ")}`);
  const source = chunks.map(([filename]) => (
    `${boundaryBlankLines.has(filename) ? "\n" : ""}${readFileSync(join(sourceRoot, filename), "utf8")}`
  )).join("").replace(/\s+$/, "");
  writeFileSync(bundlePath, `/* Generated from src/web/app. Edit the source chunks, then run npm run build:app. */\n${source}\n`, "utf8");
  return { bundlePath, chunkCount: chunks.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = buildAppBundle();
  console.log(`App bundle ready: ${result.chunkCount} ordered source chunks -> app.js.`);
}
