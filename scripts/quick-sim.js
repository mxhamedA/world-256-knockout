const fs = require("fs");
const vm = require("vm");

const root = __dirname + "/..";

function el() {
  return {
    hidden: false, textContent: "", value: "", checked: false,
    innerHTML: "", innerText: "",
    parentElement: null, parentNode: null, dataset: {},
    style: { setProperty() {}, removeProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, setAttribute() {},
    querySelectorAll() { return []; },
    querySelector() { return el(); },
    closest() { return null; },
    appendChild() {}, after() {}, before() {}, insertBefore() {},
    remove() {}, replaceChildren() {}, scrollIntoView() {},
    showModal() {}, close() {}, focus() {}, click() {},
    getAttribute() { return null; },
  };
}

const ctx = {
  console, URL, URLSearchParams, Object, Array, Map, Set, Math, Date, JSON,
  isNaN, parseInt, parseFloat, Number, String, Boolean,
  Error, TypeError, ReferenceError, Promise, Intl,
  setTimeout: () => 1, clearTimeout: () => {},
  setInterval: () => 1, clearInterval: () => {},
  requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
  window: {
    addEventListener() {}, scrollTo() {}, matchMedia() { return { matches: false }; },
    location: { pathname: "/", search: "", hash: "", href: "http://localhost/" },
    history: { replaceState() {}, pushState() {} },
    setInterval: () => 1, setTimeout: () => 1,
  },
  _els: new Map(),
  document: {
    querySelector(sel) {
      if (!ctx._els.has(sel)) ctx._els.set(sel, el());
      return ctx._els.get(sel);
    },
    querySelectorAll() { return []; },
    createElement() { return el(); },
    createComment() { return el(); },
    addEventListener() {},
    body: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, style: {}, hidden: false, addEventListener() {} },
    documentElement: { classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
    activeElement: { tagName: "BODY" },
    fullscreenElement: null,
  },
  localStorage: { getItem() { return null; }, setItem() {} },
};

vm.createContext(ctx);

const files = [
  "player-pools.generated.js",
  "data.js",
  "retro-data.js",
  "retro-2014-squads.js",
  "retro-2014-schedule.js",
  "retro-engine.js",
  "presentation-engine.js",
  "simulation-engine.js",
  "legacy-data/catalog.generated.js",
  "app.js",
];

console.log("Loading modules...");
const source = files.map((f) => fs.readFileSync(root + "/" + f, "utf8")).join("\n");
vm.runInContext(source, ctx);
console.log("Modules loaded.");

vm.runInContext(`
const teamByName = (name) => TEAMS.find(t => t.name === name);
const COUNT = 15;
const winners = {};
const finalists = {};
const semiFinalists = {};

for (let t = 0; t < COUNT; t += 1) {
  state.drawSeed = (Date.now() + t * 777) % 2147483647;
  state.settings = { ...defaultSettings, upset: "balanced", goals: "normal", realNames: true, realPlayersOnly: true };
  state.rounds = [createFirstRound(state.drawSeed)];
  state.started = true;
  state.spectateTeamId = null;
  state.neutralView = true;
  state.standardTactic = "balanced";

  for (let roundIndex = 0; roundIndex < 8; roundIndex += 1) {
    state.activeRound = roundIndex;
    const round = state.rounds[roundIndex];
    for (let i = 0; i < round.length; i += 1) {
      const match = round[i];
      match.result = simulateMatch(match, roundIndex);
      match.result.revealed = true;
    }
    if (roundIndex < 7) buildNextRound(roundIndex);
  }

  const champMatch = state.rounds[7][0];
  const champId = champMatch.result.winnerId;
  const runnerUpId = champId === champMatch.homeId ? champMatch.awayId : champMatch.homeId;
  const champ = teamById(champId);
  const runnerUp = teamById(runnerUpId);
  const sf1 = state.rounds[6][0];
  const sf2 = state.rounds[6][1];
  const sfLoser1 = teamById(sf1.result.winnerId === sf1.homeId ? sf1.awayId : sf1.homeId);
  const sfLoser2 = teamById(sf2.result.winnerId === sf2.homeId ? sf2.awayId : sf2.homeId);

  winners[champ.name] = (winners[champ.name] || 0) + 1;
  finalists[runnerUp.name] = (finalists[runnerUp.name] || 0) + 1;
  semiFinalists[sfLoser1.name] = (semiFinalists[sfLoser1.name] || 0) + 1;
  semiFinalists[sfLoser2.name] = (semiFinalists[sfLoser2.name] || 0) + 1;

  console.log('Tournament ' + (t + 1) + ': ' + champ.name + ' (#' + champ.seed + ', ' + champ.rating + ')  beats  ' + runnerUp.name + ' (#' + runnerUp.seed + ', ' + runnerUp.rating + ')');
}

console.log('');
console.log('=== WINNERS ===');
Object.entries(winners).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
  const t = teamByName(name);
  console.log('  ' + count + 'x  ' + name + '  (#' + t.seed + ', rating ' + t.rating + ', ' + t.confed + ')');
});

console.log('');
console.log('=== RUNNER-UP ===');
Object.entries(finalists).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
  const t = teamByName(name);
  console.log('  ' + count + 'x  ' + name + '  (#' + t.seed + ', rating ' + t.rating + ', ' + t.confed + ')');
});

console.log('');
console.log('=== SEMI-FINALISTS ===');
Object.entries(semiFinalists).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
  const t = teamByName(name);
  console.log('  ' + count + 'x  ' + name + '  (#' + t.seed + ', rating ' + t.rating + ', ' + t.confed + ')');
});
`, ctx);
