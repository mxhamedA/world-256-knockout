import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "premier-league-fc26-ratings.js");
const baseUrl = "https://www.ea.com/en/games/ea-sports-fc/ratings/leagues-ratings/premier-league/13";

function decodeHtml(value) {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function ratingsFromHtml(html) {
  const ratings = [];
  const rows = html.match(/<tr class="Table_row__[^\"]*"[\s\S]*?<\/tr>/g) || [];
  for (const row of rows) {
    const name = row.match(/href="\/games\/ea-sports-fc\/ratings\/player-ratings\/[^"]+"[\s\S]*?<span class="Table_profileLabel__[^\"]*">([^<]+)<\/span>/)?.[1];
    const overall = row.match(/data-label="OVR"[\s\S]*?<span class="Table_statCellValue__[^\"]*">(\d+)<\/span>/)?.[1];
    if (!name || !overall) continue;
    ratings.push([decodeHtml(name), Number(overall)]);
  }
  return ratings;
}

const ratings = new Map();
for (let page = 1; page <= 6; page += 1) {
  const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
  const response = await fetch(url, {
    headers: { "user-agent": "256-teams-fc26-rating-importer/1.0" },
  });
  if (!response.ok) throw new Error(`EA FC 26 ratings request failed for page ${page}: ${response.status}`);
  const pageRatings = ratingsFromHtml(await response.text());
  if (!pageRatings.length) throw new Error(`EA FC 26 ratings page ${page} did not contain any player rows.`);
  pageRatings.forEach(([name, overall]) => ratings.set(name, overall));
  console.log(`FC 26 page ${page}: ${pageRatings.length} ratings`);
}

const sortedRatings = Object.fromEntries(
  [...ratings.entries()].sort(([left], [right]) => left.localeCompare(right)),
);
const source = `// Generated from EA's official FC 26 Premier League ratings pages.\n`
  + `// Run: node scripts/generate-fc26-pl-ratings.mjs\n`
  + `const PREMIER_LEAGUE_FC26_RATINGS_SOURCE = ${JSON.stringify(baseUrl)};\n`
  + `const PREMIER_LEAGUE_FC26_RATINGS = Object.freeze(${JSON.stringify(sortedRatings, null, 2)});\n\n`
  + `window.PREMIER_LEAGUE_FC26_RATINGS_SOURCE = PREMIER_LEAGUE_FC26_RATINGS_SOURCE;\n`
  + `window.PREMIER_LEAGUE_FC26_RATINGS = PREMIER_LEAGUE_FC26_RATINGS;\n`;

await fs.writeFile(outputPath, source, "utf8");
console.log(`Wrote ${ratings.size} official FC 26 Premier League ratings to ${path.basename(outputPath)}.`);
