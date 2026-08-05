import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(projectRoot, "src", "web", "styles");
const bundlePath = join(projectRoot, "clean.css");
const bootstrapBundlePath = process.env.STYLE_BOOTSTRAP_BUNDLE || bundlePath;

// The browser still receives one stylesheet. These ordered source files keep
// the cascade intact while giving each mode and shared UI area a small place
// to work. Do not reorder them without checking the cascade deliberately.
const chunks = [
  ["00-foundations-and-shared-shell.css", 1, 2045],
  ["01-online-results-and-theme.css", 2046, 3091],
  ["02-retro-base-and-legacy-skins.css", 3092, 4780],
  ["03-light-mode-and-mode-surfaces.css", 4781, 5534],
  ["04-shared-world-cup-manager.css", 5535, 6250],
  ["05-wc-2014-lineup-and-match-ui.css", 6251, 7067],
  ["06-shared-match-presentation.css", 7068, 9684],
  ["07-euro-2016-and-retro-search.css", 9685, 10867],
  ["08-snapshots-prediction-and-navigation.css", 10868, 12027],
  ["09-landing-and-competition-menu.css", 12028, 16256],
  ["10-wc-2014-watercolor-and-shootout.css", 16257, 19895],
  ["11-online-dashboard-and-responsive.css", 19896, 24616],
  ["12-wc-2018-and-wc-2010-themes.css", 24617, 26736],
  ["13-retro-mobile-and-wc-2022.css", 26737, 27997],
  ["14-custom-history-and-mode-browser.css", 27998, 35057],
  ["15-wc-2006-and-wc-2026.css", 35058, 37634],
  ["16-custom-light-and-wc-2002.css", 37635, 40370],
  ["17-wc-1998-final-guards.css", 40371, 41120],
];

// These source ranges ended on an intentionally blank line in the original
// cascade. Keep that separator in the generated bundle without leaving a
// confusing blank line at the end of every source file.
const chunksWithBlankLineAfter = new Set([
  "00-foundations-and-shared-shell.css",
  "01-online-results-and-theme.css",
  "02-retro-base-and-legacy-skins.css",
  "03-light-mode-and-mode-surfaces.css",
  "04-shared-world-cup-manager.css",
  "05-wc-2014-lineup-and-match-ui.css",
  "06-shared-match-presentation.css",
  "07-euro-2016-and-retro-search.css",
  "08-snapshots-prediction-and-navigation.css",
  "09-landing-and-competition-menu.css",
  "10-wc-2014-watercolor-and-shootout.css",
  "11-online-dashboard-and-responsive.css",
  "12-wc-2018-and-wc-2010-themes.css",
  "16-custom-light-and-wc-2002.css",
]);

function bootstrapStyleChunks() {
  if (chunks.every(([filename]) => existsSync(join(sourceRoot, filename)))) return;
  if (!existsSync(bootstrapBundlePath)) {
    throw new Error(`Cannot bootstrap style sources: ${bootstrapBundlePath} does not exist.`);
  }

  const lines = readFileSync(bootstrapBundlePath, "utf8")
    .replace(/^\/\* Generated from src\/web\/styles\. Edit the source chunks, then run npm run build:styles\. \*\/\r?\n/, "")
    .split(/\r?\n/);
  mkdirSync(sourceRoot, { recursive: true });
  chunks.forEach(([filename, start, end]) => {
    const destination = join(sourceRoot, filename);
    const content = lines.slice(start - 1, end).join("\n").replace(/\n+$/, "") + "\n";
    writeFileSync(destination, content, "utf8");
  });
}

export function buildStyleBundle() {
  bootstrapStyleChunks();
  const missing = chunks
    .filter(([filename]) => !existsSync(join(sourceRoot, filename)))
    .map(([filename]) => filename);
  if (missing.length) throw new Error(`Missing style source chunks: ${missing.join(", ")}`);

  const source = chunks.map(([filename], index) => {
    const content = readFileSync(join(sourceRoot, filename), "utf8").replace(/\s+$/, "");
    const separator = index === chunks.length - 1
      ? ""
      : chunksWithBlankLineAfter.has(filename) ? "\n\n" : "\n";
    return content + separator;
  }).join("");
  writeFileSync(
    bundlePath,
    `/* Generated from src/web/styles. Edit the source chunks, then run npm run build:styles. */\n${source}\n`,
    "utf8",
  );
  return { bundlePath, chunkCount: chunks.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = buildStyleBundle();
  console.log(`Style bundle ready: ${result.chunkCount} ordered source chunks -> clean.css.`);
}
