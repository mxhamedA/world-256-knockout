import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist.`);
  const open = app.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") {
      depth -= 1;
      if (depth === 0) return app.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}.`);
}

const context = {
  RETRO_MANAGER_SLOT_POSITIONS: {
    "4-3-3": ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "RW", "ST"],
  },
  retroPlayerPositionFit: (player, slot) => {
    if (player.position === slot) return 140;
    if (player.position === "GK" || slot === "GK") return -100;
    return 10;
  },
};
vm.createContext(context);
vm.runInContext(`
  ${functionSource("retroSelectAvailableStarterNumbers")}
  globalThis.selectStarters = retroSelectAvailableStarterNumbers;
`, context);

const preferred = Array.from({ length: 11 }, (_, index) => index + 1);
const available = [
  ...preferred.slice(0, 10).map((number, index) => ({
    number,
    position: context.RETRO_MANAGER_SLOT_POSITIONS["4-3-3"][index],
    overall: 80,
  })),
  { number: 12, position: "GK", overall: 99 },
  { number: 13, position: "ST", overall: 72 },
];
const selected = context.selectStarters(available, preferred, "4-3-3");

assert.equal(selected.length, 11, "An injury replacement must still produce a complete XI.");
assert.equal(selected[10], 13, "An injured striker must be replaced by a compatible striker.");
assert.ok(!selected.includes(12), "A high-rated reserve goalkeeper cannot be selected for an outfield vacancy.");
assert.match(
  index,
  /app\.js\?v=[a-z0-9-]+/,
  "The app bundle URL must remain versioned so browsers receive deployed fixes.",
);

console.log("World Cup injury replacement and app cache-busting checks passed.");
