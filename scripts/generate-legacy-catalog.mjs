import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const nationsRoot = join(projectRoot, "legacy-data", "nations");
const outputPath = join(projectRoot, "legacy-data", "catalog.generated.js");

const database = {};
if (existsSync(nationsRoot)) {
  for (const nationId of readdirSync(nationsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
    const files = readdirSync(join(nationsRoot, nationId)).filter((name) => name.endsWith(".json")).sort();
    const squads = files.map((file) => JSON.parse(readFileSync(join(nationsRoot, nationId, file), "utf8")));
    if (!squads.length) continue;
    database[nationId] = {
      id: nationId,
      name: squads[0].nation,
      code: squads[0].nationCode,
      squads,
    };
  }
}

const source = `window.LEGACY_HISTORIC_DATABASE = ${JSON.stringify(database)};\n`;
writeFileSync(outputPath, source, "utf8");
const distPath = join(projectRoot, "dist", "legacy-data", "catalog.generated.js");
if (existsSync(join(projectRoot, "dist"))) {
  mkdirSync(dirname(distPath), { recursive: true });
  writeFileSync(distPath, source, "utf8");
}
console.log(`Generated Legacy Draft catalog: ${Object.keys(database).length} nations, ${Object.values(database).reduce((sum, nation) => sum + nation.squads.length, 0)} XIs.`);
