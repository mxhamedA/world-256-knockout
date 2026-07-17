const STORAGE_KEY = "world-256-tournament-v1";
const MATCH_SPEED_STORAGE_KEY = "world-256-match-speed";
const STATE_VERSION = 2;

const $ = (selector) => document.querySelector(selector);
const els = {
  roundNav: $("#roundNav"),
  progressPercent: $("#progressPercent"),
  progressBar: $("#progressBar"),
  progressCopy: $("#progressCopy"),
  pageKicker: $("#pageKicker"),
  pageTitle: $("#pageTitle"),
  matchStage: $("#matchStage"),
  matchContent: $("#matchContent"),
  championStage: $("#championStage"),
  championConfetti: $("#championConfetti"),
  championFlag: $("#championFlag"),
  championName: $("#championName"),
  championTopScorerAward: $("#championTopScorerAward"),
  championTopScorerName: $("#championTopScorerName"),
  championTopScorerFlag: $("#championTopScorerFlag"),
  championTopScorerTeam: $("#championTopScorerTeam"),
  championTopScorerGoals: $("#championTopScorerGoals"),
  matchNumber: $("#matchNumber"),
  stageRoundLabel: $("#stageRoundLabel"),
  homeSeed: $("#homeSeed"),
  awaySeed: $("#awaySeed"),
  homeFlag: $("#homeFlag"),
  awayFlag: $("#awayFlag"),
  homeName: $("#homeName"),
  awayName: $("#awayName"),
  homeDiscipline: $("#homeDiscipline"),
  awayDiscipline: $("#awayDiscipline"),
  homeScore: $("#homeScore"),
  awayScore: $("#awayScore"),
  resultNote: $("#resultNote"),
  spoilerPanel: $("#spoilerPanel"),
  liveClock: $("#liveClock"),
  livePhase: $("#livePhase"),
  pauseLiveButton: $("#pauseLiveButton"),
  speedButton: $("#speedButton"),
  skipLiveButton: $("#skipLiveButton"),
  homeEventSide: $("#homeEventSide"),
  awayEventSide: $("#awayEventSide"),
  eventLiveClock: $("#eventLiveClock"),
  eventControls: $("#eventControls"),
  skipControl: $("#skipControl"),
  penaltyStage: $("#penaltyStage"),
  penaltyScene: $("#penaltyScene"),
  penaltyHomeScore: $("#penaltyHomeScore"),
  penaltyAwayScore: $("#penaltyAwayScore"),
  penaltyKickNumber: $("#penaltyKickNumber"),
  penaltyPlayer: $("#penaltyPlayer"),
  penaltyOutcome: $("#penaltyOutcome"),
  penaltyHomeName: $("#penaltyHomeName"),
  penaltyAwayName: $("#penaltyAwayName"),
  penaltyHomeMarks: $("#penaltyHomeMarks"),
  penaltyAwayMarks: $("#penaltyAwayMarks"),
  stageAction: $("#stageAction"),
  playButton: $("#playButton"),
  revealButton: $("#revealButton"),
  chaosValue: $("#chaosValue"),
  chaosCopy: $("#chaosCopy"),
  boardTitle: $("#boardTitle"),
  roundBoard: $("#roundBoard"),
  historyRoundButton: $("#historyRoundButton"),
  newerRoundButton: $("#newerRoundButton"),
  fixtureGrid: $("#fixtureGrid"),
  loadMoreButton: $("#loadMoreButton"),
  simulateRoundButton: $("#simulateRoundButton"),
  unresolvedFilter: $("#unresolvedFilter"),
  tiesRemaining: $("#tiesRemaining"),
  matchQueue: $("#matchQueue"),
  goldenBootList: $("#goldenBootList"),
  plotList: $("#plotList"),
  settingsModal: $("#settingsModal"),
  fieldModal: $("#fieldModal"),
  resetModal: $("#resetModal"),
  simulateRoundModal: $("#simulateRoundModal"),
  simulateRoundConfirmCopy: $("#simulateRoundConfirmCopy"),
  fieldList: $("#fieldList"),
  fieldSearch: $("#fieldSearch"),
  teamSearch: $("#teamSearch"),
  teamFilterControl: $("#teamFilterControl"),
  teamFilterChip: $("#teamFilterChip"),
  toast: $("#toast"),
  sidebar: $("#sidebar"),
  fieldOverview: $("#fieldOverview"),
  mainContent: $("#mainContent"),
  overviewSearch: $("#overviewSearch"),
  participantSections: $("#participantSections"),
};

const defaultSettings = {
  upset: "balanced",
  goals: "normal",
  spoiler: true,
  realNames: true,
};

const FLAG_CODE_OVERRIDES = {
  "GB-ENG": "gb-eng",
  "GB-SCT": "gb-sct",
  "GB-WLS": "gb-wls",
  "GB-NIR": "gb-nir",
};

const TOP_SHOOTOUT_TEAM_IDS = new Set(
  [...TEAMS]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 20)
    .map((team) => team.id),
);

const LEFT_FOOTED_PENALTY_TAKERS = new Set([
  "Lionel Messi",
  "Nicolás González",
  "Lamine Yamal",
  "Mikel Oyarzabal",
  "Mikel Merino",
  "Fabián Ruiz",
  "Michael Olise",
  "Bukayo Saka",
  "Noni Madueke",
  "Cole Palmer",
  "Phil Foden",
  "Ethan Nwaneri",
  "Max Dowman",
  "Declan Rice",
  "Raphinha",
  "Endrick",
  "Luiz Henrique",
  "Francisco Trincão",
  "Pedro Neto",
  "Francisco Conceição",
  "Romelu Lukaku",
  "Dodi Lukébakio",
  "Charles De Ketelaere",
  "Kai Havertz",
  "Jorge Carrascal",
  "Ante Budimir",
  "Marco Pašalić",
  "Amine Adli",
  "Kōki Ogawa",
  "Takefusa Kubo",
  "Alejandro Zendejas",
  "Cavan Sullivan",
  "Santiago Giménez",
  "Guillermo Martínez",
  "Rasmus Højlund",
  "Ibrahim Mbaye",
  "Micky van de Ven",
  "Luka Sučić",
  "Bruno Durdov",
  "Joško Gvardiol",
  "Carlos Forbs",
]);

const TWO_FOOTED_PENALTY_TAKERS = new Set([
  "Ousmane Dembélé",
  "Ivan Perišić",
  "Brahim Díaz",
]);

function preferredPenaltyFoot(team, player, random) {
  if (!TOP_SHOOTOUT_TEAM_IDS.has(team.id)) return random() < 0.22 ? "left" : "right";
  if (TWO_FOOTED_PENALTY_TAKERS.has(player)) return random() < 0.5 ? "left" : "right";
  return LEFT_FOOTED_PENALTY_TAKERS.has(player) ? "left" : "right";
}

function flagMarkup(team, className = "") {
  const code = FLAG_CODE_OVERRIDES[team.code] || team.code.toLowerCase();
  const fallback = `<span class="flag-fallback" aria-hidden="true">${team.flag}</span>`;
  if (code === "xx") {
    return `<span class="country-flag ${className}" role="img" aria-label="${team.name} flag">${fallback}</span>`;
  }
  return `
    <span class="country-flag ${className}" role="img" aria-label="${team.name} flag">
      ${fallback}
      <img
        src="https://flagcdn.com/w160/${code}.png"
        srcset="https://flagcdn.com/w320/${code}.png 2x"
        alt=""
        loading="lazy"
        onerror="this.remove()"
      />
    </span>
  `;
}

function measureTeamName(element) {
  const label = element.querySelector("span");
  if (!label || !element.clientWidth) return;
  const overflow = Math.max(0, Math.ceil(label.scrollWidth - element.clientWidth));
  element.style.setProperty("--team-name-overflow", `${overflow}px`);
  element.style.setProperty("--team-name-duration", `${Math.min(11, 7.2 + overflow / 34)}s`);
  element.classList.toggle("is-overflowing", overflow > 2);
}

function setTeamName(element, name) {
  let label = element.querySelector("span");
  if (!label) {
    label = document.createElement("span");
    element.replaceChildren(label);
  }
  element.classList.remove("is-overflowing");
  element.classList.toggle("is-long", name.length >= 16);
  label.textContent = name;
  requestAnimationFrame(() => measureTeamName(element));
}

if (typeof ResizeObserver !== "undefined") {
  const teamNameObserver = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => measureTeamName(target));
  });
  teamNameObserver.observe(els.homeName);
  teamNameObserver.observe(els.awayName);
}

const DEFAULT_FIXTURE_LIMIT = 24;
let fixtureLimit = DEFAULT_FIXTURE_LIMIT;
let filterUnresolved = false;
let toastTimer;
let searchPopover;
let teamFilterId = null;
let teamFilterReturn = null;
let livePlayback = null;
const savedMatchSpeed = Number(localStorage.getItem(MATCH_SPEED_STORAGE_KEY));
let preferredMatchSpeed = [1, 2, 4].includes(savedMatchSpeed) ? savedMatchSpeed : null;

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function createFirstRound(drawSeed) {
  const random = mulberry32(drawSeed);
  const topHalf = shuffle(TEAMS.slice(0, 128), random);
  const bottomHalf = shuffle(TEAMS.slice(128), random);
  return topHalf.map((team, index) => ({
    id: `r0-m${index}`,
    homeId: team.id,
    awayId: bottomHalf[index].id,
    result: null,
  }));
}

function createInitialState() {
  const drawSeed = Date.now() % 2147483647;
  return {
    version: STATE_VERSION,
    drawSeed,
    settings: { ...defaultSettings },
    rounds: [createFirstRound(drawSeed)],
    activeRound: 0,
    selectedMatch: 0,
    championView: false,
    started: false,
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      saved?.version === STATE_VERSION &&
      Array.isArray(saved.rounds) &&
      saved.rounds[0]?.length === 128
    ) {
      if (typeof saved.started !== "boolean") {
        saved.started = false;
      }
      return saved;
    }
  } catch {
    // A corrupt save should never block the tournament.
  }
  return createInitialState();
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function teamById(id) {
  return TEAMS.find((team) => team.id === id);
}

function selectedRound() {
  return state.rounds[state.activeRound] || [];
}

function selectedMatch() {
  return selectedRound()[state.selectedMatch] || null;
}

function allMatches() {
  return state.rounds.flat();
}

function completedCount() {
  return allMatches().filter((match) => match.result).length;
}

function calculateGoalscorerTable(rounds = state.rounds) {
  const scorers = new Map();
  rounds.forEach((round, roundIndex) => {
    (round || []).forEach((match) => {
      if (!match?.result?.revealed) return;
      const addGoals = (events, teamId) => {
        (events || []).forEach((event) => {
          const key = `${teamId}\u0000${event.scorer}`;
          const current = scorers.get(key) || {
            player: event.scorer,
            teamId,
            goals: 0,
            latestRound: roundIndex,
          };
          current.goals += 1;
          current.latestRound = Math.max(current.latestRound, roundIndex);
          scorers.set(key, current);
        });
      };
      addGoals(match.result.homeEvents, match.homeId);
      addGoals(match.result.awayEvents, match.awayId);
    });
  });

  return [...scorers.values()].sort((a, b) => (
    b.goals - a.goals
    || b.latestRound - a.latestRound
    || a.player.localeCompare(b.player)
  ));
}

function calculateTopGoalscorer(rounds = state.rounds) {
  return calculateGoalscorerTable(rounds)[0] || null;
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2600);
}

function generatedPlayers(team) {
  const seed = stableHash(team.name);
  const culture = CULTURAL_NAME_POOLS[team.nameCulture] || CULTURAL_NAME_POOLS.british;
  return Array.from({ length: 6 }, (_, index) => {
    const first = culture.first[(seed + index * 7) % culture.first.length];
    const last = culture.last[(seed + index * 11 + 3) % culture.last.length];
    return `${first} ${last}`;
  });
}

function scorerPool(team, excludedPlayers = []) {
  const excluded = new Set(excludedPlayers);
  let pool = state.settings.realNames && team.players ? [...team.players] : generatedPlayers(team);
  if (team.name === "Moldova" && !pool.includes("Amenyah")) pool = ["Amenyah", ...pool];
  return pool.filter((player) => !excluded.has(player));
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

const SCORER_WEIGHT_MULTIPLIERS = new Map([
  ["Erling Haaland", 1.5],
  ["Kylian Mbappé", 1.4],
  ["Lamine Yamal", 1.5],
  ["Bukayo Saka", 0.7],
  ["Ismael Saibari", 1.15],
  ["Lionel Messi", 0.65],
  ["José Manuel López", 0.2],
  ["Manfred Ugalde", 0.35],
  ["Jehhanafee Mamah", 0.35],
  ["Jorge Benguché", 0.35],
  ["Eldor Shomurodov", 0.35],
  ["Nicolás González", 0.35],
  ["Marcus Thuram", 0.35],
  ["Romelu Lukaku", 0.35],
  ["Breel Embolo", 0.6],
  ["Cole Palmer", 0.65],
  ["Deniz Gül", 0.35],
  ["Martin Baturina", 0.35],
  ["Harry Kane", 0.3],
  ["Ricardo Pepi", 0.35],
  ["Alessio Cacciamani", 0.35],
  ["Shūto Machino", 0.35],
  ["Rasmus Højlund", 0.3],
  ["Jhon Córdoba", 0.35],
]);

const SCORER_HIERARCHY_OVERRIDES = new Map([
  ["Iran", 0.9],
  ["Uruguay", 0.82],
  ["Croatia", 0.85],
  ["Ivory Coast", 0.84],
  ["Japan", 0.8],
]);

// Player pools are ordered FW -> MF -> DF. Reserve a realistic share of goals
// for the deeper half so midfielders and defenders contribute across a run.
const SUPPORTING_SCORER_SHARE = 0.24;

function tournamentGoalsForPlayer(teamId, player) {
  return state.rounds.reduce((total, round) => total + (round || []).reduce((roundTotal, match) => {
    if (!match?.result) return roundTotal;
    const events = match.homeId === teamId
      ? match.result.homeEvents
      : match.awayId === teamId ? match.result.awayEvents : [];
    return roundTotal + (events || []).filter((event) => event.scorer === player).length;
  }, 0), 0);
}

function scoringRunBrake(goals) {
  if (goals >= 10) return 0;
  if (goals === 9) return 0.08;
  if (goals === 8) return 0.25;
  if (goals === 7) return 0.55;
  return 1;
}

function weightedScorer(team, random, excludedPlayers = [], inMatchGoals = new Map()) {
  const fullPool = scorerPool(team);
  const pool = scorerPool(team, excludedPlayers);
  const hierarchy = SCORER_HIERARCHY_OVERRIDES.get(team.name) || (
    team.fifaRank && team.fifaRank <= 20
      ? 0.56
      : team.fifaRank && team.fifaRank <= 50 ? 0.72 : 0.88
  );
  const supportingStart = Math.max(3, Math.ceil(fullPool.length * 0.55));
  const supportingNames = new Set(fullPool.slice(supportingStart));
  const supportingPool = pool.filter((player) => supportingNames.has(player));
  const primaryPool = pool.filter((player) => !supportingNames.has(player));
  const useSupportingScorer = supportingPool.length > 0
    && primaryPool.length > 0
    && random() < SUPPORTING_SCORER_SHARE;
  const selectionPool = useSupportingScorer ? supportingPool : primaryPool.length ? primaryPool : pool;
  const selectionHierarchy = useSupportingScorer ? 0.9 : hierarchy;
  const totalGoals = (player) => tournamentGoalsForPlayer(team.id, player) + (inMatchGoals.get(player) || 0);
  const weights = selectionPool.map((player, index) => {
    const originalIndex = fullPool.indexOf(player);
    const hierarchyIndex = useSupportingScorer ? index : Math.max(0, originalIndex);
    return (
    (selectionHierarchy ** hierarchyIndex)
    * (SCORER_WEIGHT_MULTIPLIERS.get(player) || 1)
    * scoringRunBrake(totalGoals(player))
    );
  });
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  if (weightTotal <= 0) {
    return [...selectionPool].sort((a, b) => totalGoals(a) - totalGoals(b))[0];
  }
  let roll = random() * weightTotal;
  for (let index = 0; index < selectionPool.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return selectionPool[index];
  }
  return selectionPool[0];
}

function availableScorer(team, minute, cards, random, suspendedPlayers = [], inMatchGoals = new Map()) {
  const dismissed = new Set(
    cards.filter((card) => card.minute < minute).map((card) => card.player),
  );
  return weightedScorer(team, random, [...suspendedPlayers, ...dismissed], inMatchGoals);
}

function shuffledOutcomes(goals, kicks, random, forceLastGoal = false, forceLastMiss = false) {
  const outcomes = shuffle([
    ...Array(goals).fill(true),
    ...Array(Math.max(0, kicks - goals)).fill(false),
  ], random);
  if (forceLastGoal && goals > 0 && !outcomes[kicks - 1]) {
    const goalIndex = outcomes.indexOf(true);
    [outcomes[goalIndex], outcomes[kicks - 1]] = [outcomes[kicks - 1], outcomes[goalIndex]];
  }
  if (forceLastMiss && goals < kicks && outcomes[kicks - 1]) {
    const missIndex = outcomes.indexOf(false);
    [outcomes[missIndex], outcomes[kicks - 1]] = [outcomes[kicks - 1], outcomes[missIndex]];
  }
  return outcomes;
}

function createShootoutSequence(home, away, penalties, random, cards = [], suspendedPlayers = { home: [], away: [] }) {
  const rounds = Math.max(5, penalties.home, penalties.away);
  const homeWon = penalties.home > penalties.away;
  const homeOutcomes = shuffledOutcomes(penalties.home, rounds, random, homeWon, !homeWon);
  const awayOutcomes = shuffledOutcomes(penalties.away, rounds, random, !homeWon, homeWon);
  const pools = {
    home: scorerPool(home, [
      ...(suspendedPlayers.home || []),
      ...cards.filter((card) => card.side === "home").map((card) => card.player),
    ]),
    away: scorerPool(away, [
      ...(suspendedPlayers.away || []),
      ...cards.filter((card) => card.side === "away").map((card) => card.player),
    ]),
  };
  const directions = ["left", "centre", "right"];
  const sequence = [];

  for (let round = 0; round < rounds; round += 1) {
    for (const side of ["home", "away"]) {
      const scored = side === "home" ? homeOutcomes[round] : awayOutcomes[round];
      const direction = directions[Math.floor(random() * directions.length)];
      let keeperDive = directions[Math.floor(random() * directions.length)];
      if (!scored) keeperDive = direction;
      const team = side === "home" ? home : away;
      const player = pools[side][round % pools[side].length];
      sequence.push({
        side,
        player,
        foot: preferredPenaltyFoot(team, player, random),
        direction,
        keeperDive,
        scored,
        round: round + 1,
      });
    }
  }
  return sequence;
}

function goalEvents(team, regulationCount, extraTimeCount, random, cards = [], suspendedPlayers = []) {
  const events = [];
  const inMatchGoals = new Map();
  const addGoal = (minute) => {
    const scorer = availableScorer(team, minute, cards, random, suspendedPlayers, inMatchGoals);
    inMatchGoals.set(scorer, (inMatchGoals.get(scorer) || 0) + 1);
    events.push({ minute, scorer, type: "goal" });
  };
  for (let index = 0; index < regulationCount; index += 1) {
    const minute = 2 + Math.floor(random() * 89);
    addGoal(minute);
  }
  for (let index = 0; index < extraTimeCount; index += 1) {
    const minute = 91 + Math.floor(random() * 30);
    addGoal(minute);
  }
  return events.sort((a, b) => a.minute - b.minute);
}

function guaranteeAmenyahGoal(events, cards) {
  const dismissal = cards.find((card) => card.player === "Amenyah");
  const minute = dismissal
    ? Math.min(events[0].minute, Math.max(2, dismissal.minute - 1))
    : events[0].minute;
  events[0] = { ...events[0], minute, scorer: "Amenyah" };
  events.sort((a, b) => a.minute - b.minute);
}

function createRedCard(team, side, random, suspendedPlayers = []) {
  return {
    minute: 12 + Math.floor(random() * 77),
    player: weightedScorer(team, random, suspendedPlayers),
    teamId: team.id,
    side,
    type: "red",
  };
}

function applyScorelineCeiling(home, away, homeGoals, awayGoals) {
  if (homeGoals === awayGoals) return { homeGoals, awayGoals };
  const homeWon = homeGoals > awayGoals;
  const loser = homeWon ? away : home;
  if (!loser.fifaRank || loser.fifaRank > 175) return { homeGoals, awayGoals };
  const ceiling = loser.fifaRank <= 75 ? 5 : loser.fifaRank <= 125 ? 6 : 7;
  if (homeWon && homeGoals > ceiling) {
    homeGoals = ceiling;
    awayGoals = Math.min(awayGoals, ceiling - 1);
  } else if (!homeWon && awayGoals > ceiling) {
    awayGoals = ceiling;
    homeGoals = Math.min(homeGoals, ceiling - 1);
  }
  return { homeGoals, awayGoals };
}

function suspendedPlayersForTeam(teamId, roundIndex) {
  if (roundIndex <= 0) return [];
  const previousMatch = (state.rounds[roundIndex - 1] || []).find((match) => (
    match?.result?.winnerId === teamId
    && (match.homeId === teamId || match.awayId === teamId)
  ));
  if (!previousMatch) return [];
  return [...new Set((previousMatch.result.redCards || [])
    .filter((card) => card.teamId === teamId)
    .map((card) => card.player))];
}

function simulateMatch(match, roundIndex) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const randomSeed = state.drawSeed + stableHash(match.id) + completedCount() * 97;
  const random = mulberry32(randomSeed);
  const suspendedPlayers = {
    home: suspendedPlayersForTeam(home.id, roundIndex),
    away: suspendedPlayersForTeam(away.id, roundIndex),
  };

  const matchModel = {
    realistic: { weight: 0.065, spread: 0.43, floor: 0.06, redChance: 0.03, shockChance: 0.006 },
    balanced: { weight: 0.058, spread: 0.43, floor: 0.07, redChance: 0.05, shockChance: 0.012 },
    chaos: { weight: 0.022, spread: 0.3, floor: 0.2, redChance: 0.18, shockChance: 0.16 },
  }[state.settings.upset];
  const totalGoals = { tight: 2.12, normal: 2.72, wild: 3.6 }[state.settings.goals];
  const strengthGap = home.strength - away.strength;
  let homeShare = Math.max(
    matchModel.floor,
    Math.min(1 - matchModel.floor, 0.5 + Math.tanh(strengthGap * matchModel.weight) * matchModel.spread),
  );
  const lateRoundTension = Math.max(0.8, 1 - roundIndex * 0.025);
  const redCards = [];
  let shock = false;

  if (random() < matchModel.redChance) redCards.push(createRedCard(home, "home", random, suspendedPlayers.home));
  if (random() < matchModel.redChance) redCards.push(createRedCard(away, "away", random, suspendedPlayers.away));

  if (Math.abs(strengthGap) > 18 && random() < matchModel.shockChance) {
    shock = true;
    if (strengthGap > 0) {
      homeShare = 0.31 + random() * 0.12;
      if (!redCards.some((card) => card.side === "home") && random() < 0.48) {
        redCards.push(createRedCard(home, "home", random, suspendedPlayers.home));
      }
    } else {
      homeShare = 0.57 + random() * 0.12;
      if (!redCards.some((card) => card.side === "away") && random() < 0.48) {
        redCards.push(createRedCard(away, "away", random, suspendedPlayers.away));
      }
    }
  }

  redCards.forEach((card) => {
    const impact = card.minute < 70 ? 0.105 : 0.055;
    homeShare += card.side === "home" ? -impact : impact;
  });
  homeShare = Math.max(matchModel.floor, Math.min(1 - matchModel.floor, homeShare));

  let homeGoals = poisson(totalGoals * homeShare * lateRoundTension, random);
  let awayGoals = poisson(totalGoals * (1 - homeShare) * lateRoundTension, random);
  const amenyahSide = roundIndex === 0
    ? home.name === "Moldova" ? "home" : away.name === "Moldova" ? "away" : null
    : null;
  if (amenyahSide === "home" && homeGoals === 0) homeGoals = 1;
  if (amenyahSide === "away" && awayGoals === 0) awayGoals = 1;
  if (home.name === "Israel") {
    homeGoals = 0;
    awayGoals = Math.max(4, awayGoals);
  }
  if (away.name === "Israel") {
    awayGoals = 0;
    homeGoals = Math.max(4, homeGoals);
  }
  ({ homeGoals, awayGoals } = applyScorelineCeiling(home, away, homeGoals, awayGoals));
  const regulationHome = homeGoals;
  const regulationAway = awayGoals;
  let extraTime = false;
  let penalties = null;

  if (homeGoals === awayGoals) {
    extraTime = true;
    homeGoals += poisson(totalGoals * homeShare * 0.28, random);
    awayGoals += poisson(totalGoals * (1 - homeShare) * 0.28, random);
  }

  if (homeGoals === awayGoals) {
    const homePenChance = Math.max(0.28, Math.min(0.72, 0.18 + homeShare * 0.64));
    const homeWins = random() < homePenChance;
    const winner = homeWins ? home : away;
    const winnerComposure = Math.max(0, Math.min(1, (winner.rating - 35) / 65));
    const shootoutRoll = random();
    const twoGoalWinChance = 0.14 * (1 - winnerComposure);
    const fourGoalThreshold = 0.84 - winnerComposure * 0.1;
    const winnerPens = shootoutRoll < twoGoalWinChance ? 2 : shootoutRoll < fourGoalThreshold ? 3 : 4;
    const loserPens = Math.max(1, winnerPens - (random() < 0.62 ? 1 : 2));
    penalties = homeWins
      ? { home: winnerPens, away: loserPens }
      : { home: loserPens, away: winnerPens };
  }

  const winnerId = penalties
    ? penalties.home > penalties.away ? home.id : away.id
    : homeGoals > awayGoals ? home.id : away.id;

  const homeEvents = goalEvents(
    home,
    regulationHome,
    homeGoals - regulationHome,
    random,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
  );
  const awayEvents = goalEvents(
    away,
    regulationAway,
    awayGoals - regulationAway,
    random,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
  );
  if (amenyahSide === "home") {
    guaranteeAmenyahGoal(homeEvents, redCards.filter((card) => card.side === "home"));
  }
  if (amenyahSide === "away") {
    guaranteeAmenyahGoal(awayEvents, redCards.filter((card) => card.side === "away"));
  }
  const shootout = penalties
    ? createShootoutSequence(home, away, penalties, random, redCards, suspendedPlayers)
    : null;

  return {
    homeGoals,
    awayGoals,
    regulationHome,
    regulationAway,
    extraTime,
    penalties,
    shootout,
    winnerId,
    homeEvents,
    awayEvents,
    redCards: redCards.sort((a, b) => a.minute - b.minute),
    suspendedPlayers,
    shock,
    revealed: !state.settings.spoiler,
  };
}

function buildNextRound(roundIndex) {
  if (roundIndex >= 7 || state.rounds[roundIndex + 1]) return;
  const round = state.rounds[roundIndex];
  if (!round.every((match) => match.result?.revealed)) return;
  const next = [];
  for (let index = 0; index < round.length; index += 2) {
    next.push({
      id: `r${roundIndex + 1}-m${index / 2}`,
      homeId: round[index].result.winnerId,
      awayId: round[index + 1].result.winnerId,
      result: null,
    });
  }
  state.rounds.push(next);
}

function firstUnplayedIndex(roundIndex = state.activeRound) {
  return (state.rounds[roundIndex] || []).findIndex((match) => !match.result);
}

function roundIsComplete(roundIndex) {
  const round = state.rounds[roundIndex];
  return Boolean(round?.length) && round.every((match) => match.result?.revealed);
}

function currentTournamentRoundIndex() {
  for (let index = state.rounds.length - 1; index >= 0; index -= 1) {
    if (state.rounds[index]?.some((match) => !match.result?.revealed)) return index;
  }
  return Math.max(0, state.rounds.length - 1);
}

function viewingRoundHistory() {
  return state.activeRound < currentTournamentRoundIndex() && roundIsComplete(state.activeRound);
}

function openRound(roundIndex, scrollToResults = false) {
  const round = state.rounds[roundIndex];
  if (!round) return;
  state.activeRound = roundIndex;
  state.selectedMatch = roundIsComplete(roundIndex)
    ? 0
    : Math.max(0, firstUnplayedIndex(roundIndex));
  state.championView = false;
  fixtureLimit = roundIsComplete(roundIndex) ? round.length : DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  saveState();
  render();
  if (scrollToResults) els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goToNextTie() {
  const round = selectedRound();
  const next = round.findIndex((match) => !match.result);
  if (next >= 0) {
    state.selectedMatch = next;
    state.championView = false;
  } else if (state.activeRound < 7) {
    buildNextRound(state.activeRound);
    if (state.rounds[state.activeRound + 1]) {
      state.activeRound += 1;
      state.selectedMatch = 0;
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`${ROUND_NAMES[state.activeRound]} is ready.`);
    }
  } else {
    state.championView = true;
  }
  saveState();
  render();
}

function playbackEvents(match) {
  const result = match.result;
  const homeGoals = (result.homeEvents || []).map((event) => ({
    ...event,
    side: "home",
    teamId: match.homeId,
    player: event.scorer,
  }));
  const awayGoals = (result.awayEvents || []).map((event) => ({
    ...event,
    side: "away",
    teamId: match.awayId,
    player: event.scorer,
  }));
  const events = [...homeGoals, ...awayGoals, ...(result.redCards || [])]
    .sort((a, b) => a.minute - b.minute || (a.type === "red" ? -1 : 1));

  return events;
}

function clockText(minute) {
  const wholeMinute = Math.max(0, Math.floor(minute));
  const seconds = Math.floor((minute - wholeMinute) * 60);
  return `${String(wholeMinute).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function phaseForMinute(minute, result) {
  if (minute < 45) return "FIRST HALF";
  if (minute < 90) return "SECOND HALF";
  if (result.extraTime && minute < 105) return "EXTRA TIME · FIRST HALF";
  if (result.extraTime && minute < 120) return "EXTRA TIME · SECOND HALF";
  return result.penalties ? "PENALTY SHOOTOUT" : "FULL TIME";
}

function timelineEventMarkup(event, away = false, animate = false) {
  if (!["goal", "red"].includes(event.type)) return "";
  const marker = event.type === "red" ? "<i></i>" : "";
  return `
    <div class="event timeline-event ${event.type === "red" ? "red-event" : "goal-event"} ${animate ? "event-enter" : ""}">
      ${away
    ? `<b>${event.minute}'</b><span>${event.player}</span>${marker}`
    : `${marker}<span>${event.player}</span><b>${event.minute}'</b>`}
    </div>
  `;
}

function disciplineMarkup(cards) {
  return cards.map((card) => `
    <span class="discipline-card">
      <i></i>
      <span>${card.player} · ${card.minute}'</span>
    </span>
  `).join("");
}

function renderLiveTimeline() {
  if (!livePlayback) return;
  const playedEvents = livePlayback.feed
    .filter((event) => ["goal", "red"].includes(event.type))
    .reverse();
  els.homeEventSide.innerHTML = playedEvents
    .filter((event) => event.side === "home")
    .map((event) => timelineEventMarkup(event))
    .join("");
  els.awayEventSide.innerHTML = playedEvents
    .filter((event) => event.side === "away")
    .map((event) => timelineEventMarkup(event, true))
    .join("");
}

function appendLiveTimelineEvent(event, animate = true) {
  if (!["goal", "red"].includes(event.type)) return;
  const target = event.side === "home" ? els.homeEventSide : els.awayEventSide;
  target.insertAdjacentHTML(
    "beforeend",
    timelineEventMarkup(event, event.side === "away", animate),
  );
}

function bumpScore(side) {
  const element = side === "home" ? els.homeScore : els.awayScore;
  element.classList.add("score-pop");
  setTimeout(() => element.classList.remove("score-pop"), 230);
}

function applyLiveEvent(event, animate = true) {
  if (!livePlayback) return;
  if (event.type === "goal") {
    livePlayback[`${event.side}Score`] += 1;
    if (animate) bumpScore(event.side);
  }
  if (event.type === "red") {
    livePlayback[`${event.side}Reds`].push(event);
  }
  livePlayback.feed.unshift(event);
  els.homeScore.textContent = livePlayback.homeScore;
  els.awayScore.textContent = livePlayback.awayScore;
  els.homeDiscipline.innerHTML = disciplineMarkup(livePlayback.homeReds);
  els.awayDiscipline.innerHTML = disciplineMarkup(livePlayback.awayReds);
  appendLiveTimelineEvent(event, animate);
}

function ensureShootoutSequence(match) {
  if (!match.result?.penalties || match.result.shootout?.length) return;
  const random = mulberry32(state.drawSeed + stableHash(`${match.id}-shootout`));
  match.result.shootout = createShootoutSequence(
    teamById(match.homeId),
    teamById(match.awayId),
    match.result.penalties,
    random,
    match.result.redCards || [],
    match.result.suspendedPlayers || { home: [], away: [] },
  );
}

function penaltyDirectionCopy(direction) {
  return direction === "centre" ? "down the middle" : `to the ${direction}`;
}

function penaltyStepDelay(duration) {
  if (!livePlayback) return duration;
  if (livePlayback.reducedMotion) return Math.min(180, duration);
  return duration / livePlayback.speed;
}

function shootoutMarksMarkup(playback, side) {
  if (!playback) return "";
  return playback.shootout
    .map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt }) => attempt.side === side)
    .map(({ attempt, index }) => {
      const complete = index < playback.shootoutIndex
        || (index === playback.shootoutIndex && ["result", "complete"].includes(playback.shootoutStep));
      const state = complete ? (attempt.scored ? "goal" : "miss") : "pending";
      const label = complete ? (attempt.scored ? "Scored" : "Missed") : "Not taken";
      return `<i class="penalty-mark ${state}" title="${label}"></i>`;
    })
    .join("");
}

function penaltyMarksMarkup(side) {
  return shootoutMarksMarkup(livePlayback, side);
}

function setPenaltySceneElement(scene, attempt, step) {
  if (!attempt) return;
  if (step === "setup") {
    scene.classList.add("is-resetting");
    scene.dataset.state = "setup";
    scene.dataset.result = "pending";
    scene.dataset.direction = attempt.direction;
    scene.dataset.dive = attempt.keeperDive;
    scene.dataset.foot = attempt.foot || "right";
    void scene.offsetWidth;
    scene.classList.remove("is-resetting");
    return;
  }
  scene.dataset.state = step === "flight" ? "flight" : "result";
  scene.dataset.direction = attempt.direction;
  scene.dataset.dive = attempt.keeperDive;
  scene.dataset.foot = attempt.foot || "right";
  scene.dataset.result = step === "result" ? (attempt.scored ? "goal" : "save") : "pending";
}

function setPenaltyScene(attempt, step) {
  setPenaltySceneElement(els.penaltyScene, attempt, step);
}

function renderPenaltyStage() {
  if (!livePlayback?.shootout?.length) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const attempt = livePlayback.shootout[livePlayback.shootoutIndex];
  const step = livePlayback.shootoutStep;
  const motionScale = livePlayback.reducedMotion ? 0.02 : 1 / livePlayback.speed;

  els.penaltyStage.style.setProperty("--penalty-flight-duration", `${540 * motionScale}ms`);
  els.penaltyStage.style.setProperty("--penalty-dive-duration", `${520 * motionScale}ms`);
  els.penaltyStage.style.setProperty("--penalty-kicker-duration", `${300 * motionScale}ms`);
  els.penaltyStage.style.setProperty("--penalty-fade-duration", `${200 * motionScale}ms`);

  els.penaltyHomeScore.textContent = livePlayback.penaltyHomeScore;
  els.penaltyAwayScore.textContent = livePlayback.penaltyAwayScore;
  els.penaltyHomeName.textContent = home.name;
  els.penaltyAwayName.textContent = away.name;
  els.penaltyHomeMarks.innerHTML = penaltyMarksMarkup("home");
  els.penaltyAwayMarks.innerHTML = penaltyMarksMarkup("away");
  els.penaltyKickNumber.textContent = step === "complete"
    ? "SHOOTOUT COMPLETE"
    : `KICK ${livePlayback.shootoutIndex + 1} / ${livePlayback.shootout.length}`;

  if (step === "complete") {
    const winner = teamById(match.result.winnerId);
    els.penaltyPlayer.textContent = winner.name;
    els.penaltyOutcome.textContent = "WIN THE SHOOTOUT";
    return;
  }

  els.penaltyPlayer.textContent = attempt.player;
  els.penaltyOutcome.textContent = step === "setup"
    ? `${attempt.side === "home" ? home.name : away.name} · steps up · ${attempt.foot || "right"}-footed`
    : step === "flight"
      ? `Shoots ${penaltyDirectionCopy(attempt.direction)}…`
      : attempt.scored
        ? `GOAL · ${penaltyDirectionCopy(attempt.direction)}`
        : `SAVED · keeper dives ${attempt.keeperDive}`;
  setPenaltyScene(attempt, step);
}

function schedulePenaltyStep(duration) {
  if (!livePlayback || livePlayback.paused || livePlayback.phase !== "shootout") return;
  clearTimeout(livePlayback.penaltyTimer);
  livePlayback.penaltyTimer = setTimeout(advancePenaltyShootout, penaltyStepDelay(duration));
}

function finishPenaltyShootout() {
  if (!livePlayback) return;
  livePlayback.shootoutStep = "complete";
  livePlayback.ending = true;
  renderPenaltyStage();
  livePlayback.finishTimer = setTimeout(finishLivePlayback, penaltyStepDelay(1250));
}

function advancePenaltyShootout() {
  if (!livePlayback || livePlayback.paused || livePlayback.phase !== "shootout") return;
  const attempt = livePlayback.shootout[livePlayback.shootoutIndex];

  if (livePlayback.shootoutStep === "setup") {
    livePlayback.shootoutStep = "flight";
    renderPenaltyStage();
    schedulePenaltyStep(650);
    return;
  }

  if (livePlayback.shootoutStep === "flight") {
    livePlayback.shootoutStep = "result";
    if (attempt.scored) livePlayback[`penalty${attempt.side === "home" ? "Home" : "Away"}Score`] += 1;
    renderPenaltyStage();
    const score = attempt.side === "home" ? els.penaltyHomeScore : els.penaltyAwayScore;
    score.classList.add("score-pop");
    setTimeout(() => score.classList.remove("score-pop"), penaltyStepDelay(230));
    schedulePenaltyStep(900);
    return;
  }

  if (livePlayback.shootoutIndex >= livePlayback.shootout.length - 1) {
    finishPenaltyShootout();
    return;
  }

  livePlayback.shootoutIndex += 1;
  livePlayback.shootoutStep = "setup";
  renderPenaltyStage();
  schedulePenaltyStep(650);
}

function startPenaltyShootout() {
  if (!livePlayback) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  ensureShootoutSequence(match);
  livePlayback.phase = "shootout";
  livePlayback.speed = 1;
  livePlayback.shootout = match.result.shootout;
  livePlayback.shootoutIndex = 0;
  livePlayback.shootoutStep = "setup";
  livePlayback.penaltyHomeScore = 0;
  livePlayback.penaltyAwayScore = 0;
  livePlayback.lastTimestamp = 0;
  livePlayback.frame = null;
  render();
  schedulePenaltyStep(800);
}

function finishLivePlayback() {
  if (!livePlayback) return;
  const completed = livePlayback;
  const match = state.rounds[completed.roundIndex]?.[completed.matchIndex];
  if (!match?.result) {
    livePlayback = null;
    return;
  }

  match.result.revealed = true;
  livePlayback = null;
  buildNextRound(completed.roundIndex);
  saveState();
  render();

  const winner = teamById(match.result.winnerId);
  const loser = winner.id === match.homeId ? teamById(match.awayId) : teamById(match.homeId);
  const isShock = loser.strength - winner.strength > 12;
  showToast(isShock ? `Giant-killing! ${winner.name} send ${loser.name} home.` : `${winner.name} advance.`);
}

function completeLiveEvents(animate = false) {
  if (!livePlayback) return;
  while (livePlayback.eventIndex < livePlayback.events.length) {
    applyLiveEvent(livePlayback.events[livePlayback.eventIndex], animate);
    livePlayback.eventIndex += 1;
  }
}

function stepLivePlayback(timestamp) {
  if (!livePlayback || livePlayback.ending || livePlayback.paused) return;
  if (!livePlayback.lastTimestamp) {
    livePlayback.lastTimestamp = timestamp;
    livePlayback.frame = requestAnimationFrame(stepLivePlayback);
    return;
  }

  const elapsed = Math.min(100, timestamp - livePlayback.lastTimestamp);
  livePlayback.lastTimestamp = timestamp;
  livePlayback.minute = Math.min(
    livePlayback.maxMinute,
    livePlayback.minute + (elapsed / livePlayback.baseDuration) * livePlayback.maxMinute * livePlayback.speed,
  );

  while (
    livePlayback.eventIndex < livePlayback.events.length &&
    livePlayback.events[livePlayback.eventIndex].minute <= livePlayback.minute
  ) {
    applyLiveEvent(livePlayback.events[livePlayback.eventIndex]);
    livePlayback.eventIndex += 1;
  }

  els.liveClock.textContent = clockText(livePlayback.minute);
  els.livePhase.textContent = phaseForMinute(livePlayback.minute, selectedMatch().result);
  if (livePlayback.minute >= livePlayback.maxMinute) {
    completeLiveEvents();
    els.liveClock.textContent = livePlayback.maxMinute === 120 ? "120:00" : "90:00";
    if (selectedMatch().result.penalties) {
      els.livePhase.textContent = "PENALTY SHOOTOUT";
      startPenaltyShootout();
      return;
    }
    livePlayback.ending = true;
    els.livePhase.textContent = "FULL TIME";
    livePlayback.finishTimer = setTimeout(finishLivePlayback, 900);
    return;
  }

  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
}

function startLivePlayback(match) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ensureShootoutSequence(match);
  livePlayback = {
    matchId: match.id,
    roundIndex: state.activeRound,
    matchIndex: state.selectedMatch,
    minute: 0,
    maxMinute: match.result.extraTime ? 120 : 90,
    homeScore: 0,
    awayScore: 0,
    homeReds: [],
    awayReds: [],
    eventIndex: 0,
    events: playbackEvents(match),
    feed: [{ type: "kickoff", minute: 0 }],
    phase: "match",
    shootout: match.result.shootout || [],
    shootoutIndex: 0,
    shootoutStep: "setup",
    penaltyHomeScore: 0,
    penaltyAwayScore: 0,
    speed: preferredMatchSpeed ?? (reducedMotion ? 4 : 1),
    reducedMotion,
    paused: false,
    baseDuration: reducedMotion ? 9000 : 24000,
    lastTimestamp: 0,
    ending: false,
    frame: null,
    finishTimer: null,
    penaltyTimer: null,
  };
  render();
  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
}

function skipLivePlayback() {
  if (!livePlayback) return;

  // A shootout is the suspenseful part: never skip its kick-by-kick playback.
  if (livePlayback.phase === "shootout") {
    showToast("The shootout must play out kick by kick.");
    return;
  }

  cancelAnimationFrame(livePlayback.frame);
  clearTimeout(livePlayback.finishTimer);
  clearTimeout(livePlayback.penaltyTimer);
  completeLiveEvents(false);

  livePlayback.minute = livePlayback.maxMinute;
  livePlayback.lastTimestamp = 0;
  livePlayback.frame = null;
  els.liveClock.textContent = livePlayback.maxMinute === 120 ? "120:00" : "90:00";

  if (selectedMatch().result.penalties) {
    livePlayback.paused = false;
    els.livePhase.textContent = "PENALTY SHOOTOUT";
    startPenaltyShootout();
    return;
  }

  finishLivePlayback();
}

function cycleLiveSpeed() {
  if (!livePlayback) return;
  if (livePlayback.phase === "shootout") {
    livePlayback.speed = livePlayback.speed === 1 ? 2 : livePlayback.speed === 2 ? 4 : 1;
    els.speedButton.textContent = `${livePlayback.speed}×`;
    renderPenaltyStage();
    showToast(`Shootout playback set to ${livePlayback.speed}× speed.`);
    return;
  }
  livePlayback.speed = livePlayback.speed === 1 ? 2 : livePlayback.speed === 2 ? 4 : 1;
  preferredMatchSpeed = livePlayback.speed;
  localStorage.setItem(MATCH_SPEED_STORAGE_KEY, String(preferredMatchSpeed));
  els.speedButton.textContent = `${livePlayback.speed}×`;
  if (livePlayback.phase === "shootout") renderPenaltyStage();
  showToast(`Live simulation set to ${livePlayback.speed}× speed.`);
}

function toggleLivePause() {
  if (!livePlayback || livePlayback.ending) return;
  livePlayback.paused = !livePlayback.paused;
  els.pauseLiveButton.setAttribute("aria-pressed", String(livePlayback.paused));

  if (livePlayback.phase === "shootout") {
    els.pauseLiveButton.textContent = livePlayback.paused ? "Resume" : "Pause";
    els.penaltyStage.classList.toggle("is-paused", livePlayback.paused);
    els.penaltyStage.getAnimations().forEach((animation) => {
      if (livePlayback.paused) animation.pause();
      else animation.play();
    });
    if (livePlayback.paused) {
      clearTimeout(livePlayback.penaltyTimer);
    } else {
      schedulePenaltyStep(300);
    }
    return;
  }

  if (livePlayback.paused) {
    cancelAnimationFrame(livePlayback.frame);
    livePlayback.frame = null;
    els.pauseLiveButton.textContent = "Resume";
    return;
  }

  livePlayback.lastTimestamp = 0;
  els.pauseLiveButton.textContent = "Pause";
  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
}

function playSelected() {
  const match = selectedMatch();
  if (!match) return;
  if (livePlayback) return;
  if (match.result?.revealed) {
    goToNextTie();
    return;
  }
  if (match.result && !match.result.revealed) return;

  match.result = simulateMatch(match, state.activeRound);
  match.result.revealed = false;
  saveState();
  startLivePlayback(match);
}

function revealSelected() {
  if (livePlayback) return;
  const match = selectedMatch();
  if (!match?.result) return;
  match.result.revealed = true;
  buildNextRound(state.activeRound);
  saveState();
  render();

  const winner = teamById(match.result.winnerId);
  const loser = winner.id === match.homeId ? teamById(match.awayId) : teamById(match.homeId);
  const gap = loser.strength - winner.strength;
  showToast(gap > 12 ? `Huge upset — ${winner.name} knock out ${loser.name}!` : `${winner.name} advance.`);
}

function simulateCurrentRound() {
  if (livePlayback) {
    showToast("Finish or skip the live tie before simulating the round.");
    return;
  }
  const round = selectedRound();
  round.forEach((match) => {
    if (!match.result) match.result = simulateMatch(match, state.activeRound);
    match.result.revealed = true;
  });
  buildNextRound(state.activeRound);

  if (state.activeRound < 7) {
    state.activeRound += 1;
    state.selectedMatch = 0;
    state.championView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    showToast(`${ROUND_NAMES[state.activeRound - 1]} complete. The next draw is ready.`);
  } else {
    state.championView = true;
  }

  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function requestRoundSimulation() {
  if (livePlayback) {
    showToast("Finish or skip the live tie before simulating the round.");
    return;
  }
  const matchLabel = state.activeRound === 7 ? "match" : "matches";
  els.simulateRoundConfirmCopy.textContent = `Simulate the ${ROUND_NAMES[state.activeRound]} ${matchLabel}?`;
  els.simulateRoundModal.showModal();
}

function resultSuffix(result) {
  if (result.penalties) return `PENS ${result.penalties.home}–${result.penalties.away}`;
  if (result.extraTime) return "AFTER EXTRA TIME";
  return "FULL TIME";
}

function renderEvents(match) {
  const result = match.result;
  els.eventControls.hidden = true;
  els.skipControl.hidden = true;
  if (!result?.revealed) {
    els.homeEventSide.innerHTML = "";
    els.awayEventSide.innerHTML = "";
    els.homeEventSide.hidden = true;
    els.awayEventSide.hidden = true;
    return;
  }
  const sideEvents = (side, goals) => [
    ...(goals || []).map((event) => ({ ...event, type: "goal", player: event.scorer })),
    ...(result.redCards || []).filter((event) => event.side === side),
  ].sort((a, b) => a.minute - b.minute);

  const homeList = sideEvents("home", result.homeEvents);
  const awayList = sideEvents("away", result.awayEvents);
  const homeEvents = homeList.length
    ? homeList.map((event) => timelineEventMarkup(event)).join("")
    : `<div class="event">No major events</div>`;
  const awayEvents = awayList.length
    ? awayList.map((event) => timelineEventMarkup(event, true)).join("")
    : `<div class="event">No major events</div>`;
  els.homeEventSide.innerHTML = homeEvents;
  els.awayEventSide.innerHTML = awayEvents;
  els.homeEventSide.hidden = false;
  els.awayEventSide.hidden = false;
  els.eventLiveClock.hidden = true;
}

let confettiChampionId = null;

function renderChampionConfetti(championId) {
  if (confettiChampionId === championId || !els.championConfetti) return;
  confettiChampionId = championId;
  const colours = ["#f2c45f", "#5f8cff", "#f4f7fb", "#34c77b", "#ef5b5b"];
  els.championConfetti.innerHTML = Array.from({ length: 120 }, (_, index) => {
    const random = mulberry32(stableHash(`${championId}-confetti-${index}`));
    const x = Math.round(random() * 100);
    const drift = Math.round((random() - 0.5) * 170);
    const delay = Math.floor(index / 12) * 1000 + Math.round(random() * 900);
    const duration = 1900 + Math.round(random() * 800);
    const spin = 320 + Math.round(random() * 760);
    const colour = colours[Math.floor(random() * colours.length)];
    const width = 5 + Math.round(random() * 4);
    const height = 9 + Math.round(random() * 7);
    return `<i style="--confetti-x:${x}%;--confetti-drift:${drift}px;--confetti-delay:${delay}ms;--confetti-duration:${duration}ms;--confetti-spin:${spin}deg;--confetti-colour:${colour};--confetti-width:${width}px;--confetti-height:${height}px"></i>`;
  }).join("");
}

function clearChampionConfetti() {
  if (!confettiChampionId || !els.championConfetti) return;
  confettiChampionId = null;
  els.championConfetti.replaceChildren();
}

function renderStage() {
  els.penaltyStage.hidden = true;
  els.matchStage.classList.remove("is-shootout");
  if (state.championView) {
    const final = state.rounds[7]?.[0];
    const champion = final?.result ? teamById(final.result.winnerId) : null;
    if (champion) {
      const topScorer = calculateTopGoalscorer();
      els.matchContent.hidden = true;
      els.championStage.hidden = false;
      els.championFlag.innerHTML = flagMarkup(champion, "hero-flag");
      els.championName.textContent = champion.name;
      renderChampionConfetti(champion.id);
      els.championTopScorerAward.hidden = !topScorer;
      els.championTopScorerAward.style.display = topScorer ? "" : "none";
      if (topScorer) {
        const scorerTeam = teamById(topScorer.teamId);
        els.championTopScorerName.textContent = topScorer.player;
        els.championTopScorerFlag.innerHTML = flagMarkup(scorerTeam, "award-flag");
        els.championTopScorerTeam.textContent = scorerTeam.name;
        els.championTopScorerGoals.textContent = `${topScorer.goals} ${topScorer.goals === 1 ? "goal" : "goals"}`;
      }
      return;
    }
  }

  els.matchContent.hidden = false;
  els.championStage.hidden = true;
  clearChampionConfetti();
  const match = selectedMatch();
  if (!match) return;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const result = match.result;
  const revealed = result?.revealed;
  const isLive = livePlayback?.matchId === match.id;
  const isShootout = isLive && livePlayback.phase === "shootout";
  const pendingReveal = result && !revealed && !isLive;

  els.matchNumber.textContent = `${state.selectedMatch + 1}/${selectedRound().length}`;
  els.stageRoundLabel.textContent = ROUND_NAMES[state.activeRound].toUpperCase();
  els.homeSeed.textContent = "";
  els.awaySeed.textContent = "";
  els.homeFlag.innerHTML = flagMarkup(home, "hero-flag");
  els.awayFlag.innerHTML = flagMarkup(away, "hero-flag");
  setTeamName(els.homeName, home.name);
  setTeamName(els.awayName, away.name);
  els.homeScore.textContent = isLive ? livePlayback.homeScore : revealed ? result.homeGoals : result ? "–" : "0";
  els.awayScore.textContent = isLive ? livePlayback.awayScore : revealed ? result.awayGoals : result ? "–" : "0";
  els.resultNote.hidden = isLive || !revealed;
  els.resultNote.textContent = revealed ? resultSuffix(result) : "";
  els.spoilerPanel.hidden = !pendingReveal;
  els.stageAction.hidden = pendingReveal || isLive;
  els.matchStage.classList.toggle("is-live", Boolean(isLive));
  els.matchStage.classList.toggle("is-shootout", Boolean(isShootout));
  els.penaltyStage.hidden = !isShootout;
  els.homeDiscipline.innerHTML = disciplineMarkup(
    isLive ? livePlayback.homeReds : revealed ? (result.redCards || []).filter((card) => card.side === "home") : [],
  );
  els.awayDiscipline.innerHTML = disciplineMarkup(
    isLive ? livePlayback.awayReds : revealed ? (result.redCards || []).filter((card) => card.side === "away") : [],
  );
  if (isLive) {
    els.homeEventSide.hidden = false;
    els.awayEventSide.hidden = false;
    els.eventLiveClock.hidden = isShootout;
    els.eventControls.hidden = false;
    els.skipControl.hidden = isShootout;
    els.liveClock.textContent = clockText(livePlayback.minute);
    els.livePhase.textContent = phaseForMinute(livePlayback.minute, result);
    els.pauseLiveButton.setAttribute("aria-pressed", String(livePlayback.paused));
    els.pauseLiveButton.textContent = livePlayback.paused ? "Resume" : "Pause";
    els.speedButton.disabled = false;
    els.speedButton.textContent = `${livePlayback.speed}×`;
    renderLiveTimeline();
    if (isShootout) renderPenaltyStage();
  }
  els.playButton.innerHTML = revealed
    ? `${state.activeRound === 7 ? "Crown champion" : "Next tie"} <span>→</span>`
    : `<span class="play-icon">▶</span> Play this tie`;
  if (!isLive) renderEvents(match);
}

function renderRoundNav() {
  els.roundNav.innerHTML = ROUND_NAMES.map((name, index) => {
    const round = state.rounds[index];
    const available = Boolean(round);
    const complete = available && round.every((match) => match.result?.revealed);
    return `
      <button
        class="round-link ${index === state.activeRound ? "active" : ""} ${complete ? "complete" : ""} ${available ? "available" : ""}"
        data-round="${index}"
        title="${complete ? `View all ${name} results` : name}"
        ${available ? "" : "disabled"}
      >
        <span class="round-index">${complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
        <strong>${name}</strong>
        <small>${complete ? "Results" : (round ? round.length : 2 ** (7 - index))}</small>
      </button>
    `;
  }).join("");

}

function roundHistoryTargets() {
  const currentRound = currentTournamentRoundIndex();
  const historyMode = viewingRoundHistory();
  const olderStart = historyMode
    ? state.activeRound - 1
    : state.activeRound >= 4 ? 3 : state.activeRound - 1;
  let older = null;
  for (let index = olderStart; index >= 0; index -= 1) {
    if (roundIsComplete(index)) {
      older = index;
      break;
    }
  }

  const newer = historyMode
    ? state.activeRound === 3 && currentRound >= 4
      ? currentRound
      : state.activeRound + 1
    : null;
  return { older, newer };
}

function roundHistoryLabel(roundIndex) {
  return roundIndex >= 4 ? "View knockout bracket" : `View ${ROUND_NAMES[roundIndex]}`;
}

function renderRoundHistoryControl() {
  if (teamFilterId) {
    els.historyRoundButton.hidden = true;
    els.newerRoundButton.hidden = true;
    return;
  }
  const { older, newer } = roundHistoryTargets();

  els.historyRoundButton.hidden = older === null;
  if (older !== null) {
    els.historyRoundButton.textContent = roundHistoryLabel(older);
    els.historyRoundButton.dataset.round = String(older);
  }

  els.newerRoundButton.hidden = newer === null || !state.rounds[newer];
  if (newer !== null && state.rounds[newer]) {
    els.newerRoundButton.textContent = roundHistoryLabel(newer);
    els.newerRoundButton.dataset.round = String(newer);
  }
}

function fixtureScoreMarkup(result, side, revealed) {
  if (!revealed) return "–";
  const goals = side === "home" ? result.homeGoals : result.awayGoals;
  const shootout = result.penalties?.[side];
  return shootout === undefined ? String(goals) : `${goals}<small>(${shootout})</small>`;
}

function fixtureStatus(result, revealed, index) {
  if (result && !revealed) return "READY";
  if (!revealed) return `MATCH ${String(index + 1).padStart(2, "0")}`;
  if (result.penalties) return "PENALTIES";
  if (result.extraTime) return "AFTER EXTRA TIME";
  return "FULL TIME";
}

function fixtureMarkup(match, index, roundIndex = state.activeRound, options = {}) {
  const placeholder = !match;
  const home = placeholder ? null : teamById(match.homeId);
  const away = placeholder ? null : teamById(match.awayId);
  const result = match?.result;
  const revealed = result?.revealed;
  const winner = revealed ? result.winnerId : null;
  const selected = !placeholder
    && roundIndex === state.activeRound
    && index === state.selectedMatch
    && !state.championView;
  const style = options.row && options.column
    ? `style="grid-column:${options.column};grid-row:${options.row}"`
    : "";
  const connection = options.connects ? "data-connects=\"true\"" : "";
  const homeName = home?.name || "To be confirmed";
  const awayName = away?.name || "To be confirmed";
  const homeFlag = home ? flagMarkup(home, "fixture-flag") : `<span class="fixture-tbc-flag">?</span>`;
  const awayFlag = away ? flagMarkup(away, "fixture-flag") : `<span class="fixture-tbc-flag">?</span>`;

  return `
    <button
      class="fixture ${options.bracket ? "bracket-fixture" : ""} ${revealed ? "complete" : ""} ${selected ? "selected" : ""} ${placeholder ? "placeholder" : ""}"
      data-index="${index}"
      data-round="${roundIndex}"
      ${connection}
      ${style}
      ${placeholder ? "disabled" : ""}
    >
      ${options.bracket ? "" : `
        <span class="fixture-card-head">
          <span>${ROUND_NAMES[roundIndex]}</span>
          <small>${fixtureStatus(result, revealed, index)}</small>
        </span>
      `}
      <span class="fixture-teams">
        <span class="fixture-team ${winner === home?.id ? "winner" : ""}">
          <span class="flag">${homeFlag}</span>
          <span class="name">${homeName}</span>
          <b>${fixtureScoreMarkup(result, "home", revealed)}</b>
          <i class="fixture-winner-marker" aria-hidden="true"></i>
        </span>
        <span class="fixture-team ${winner === away?.id ? "winner" : ""}">
          <span class="flag">${awayFlag}</span>
          <span class="name">${awayName}</span>
          <b>${fixtureScoreMarkup(result, "away", revealed)}</b>
          <i class="fixture-winner-marker" aria-hidden="true"></i>
        </span>
      </span>
    </button>
  `;
}

function bracketMarkup() {
  const roundIndexes = [4, 5, 6, 7];
  const heads = roundIndexes
    .map((roundIndex) => `<span>${ROUND_NAMES[roundIndex]}</span>`)
    .join("");
  const cards = [];
  const connectors = [];

  roundIndexes.forEach((roundIndex, offset) => {
    const matches = state.rounds[roundIndex] || [];
    const matchCount = 2 ** (7 - roundIndex);
    const baseRow = 2 ** offset;
    const rowStep = 2 ** (offset + 1);
    for (let index = 0; index < matchCount; index += 1) {
      cards.push(fixtureMarkup(matches[index], index, roundIndex, {
        bracket: true,
        column: offset + 1,
        connects: offset < roundIndexes.length - 1,
        row: baseRow + index * rowStep,
      }));
    }

    if (offset < roundIndexes.length - 1) {
      for (let pair = 0; pair < matchCount / 2; pair += 1) {
        const firstRow = baseRow + pair * 2 * rowStep;
        const secondRow = firstRow + rowStep;
        const span = secondRow - firstRow + 1;
        connectors.push(`
          <i
            class="bracket-connector"
            aria-hidden="true"
            style="grid-column:${offset + 1};grid-row:${firstRow} / span ${span};--connector-inset:${50 / span}%"
          ></i>
        `);
      }
    }
  });

  return `
    <div class="bracket-shell">
      <div class="bracket-heads">${heads}</div>
      <div class="bracket-canvas">${cards.join("")}${connectors.join("")}</div>
    </div>
  `;
}

function bindFixtureNavigation() {
  els.fixtureGrid.querySelectorAll(".fixture:not(:disabled)").forEach((fixture) => {
    fixture.addEventListener("click", () => {
      if (livePlayback) {
        showToast("The live tie is still running.");
        return;
      }
      const roundIndex = Number(fixture.dataset.round);
      if (!state.rounds[roundIndex]) return;
      state.activeRound = roundIndex;
      state.selectedMatch = Number(fixture.dataset.index);
      state.championView = false;
      saveState();
      render();
      els.matchStage.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function renderFixtures() {
  if (teamFilterId) {
    const journey = teamJourneyMatches(teamFilterId);
    els.fixtureGrid.classList.remove("bracket-mode");
    els.fixtureGrid.classList.add("team-journey-mode");
    els.unresolvedFilter.hidden = true;
    els.fixtureGrid.innerHTML = journey.map(({ match, matchIndex, roundIndex }) => (
      fixtureMarkup(match, matchIndex, roundIndex)
    )).join("") || `<div class="overview-empty">No matches found for this team.</div>`;
    els.loadMoreButton.hidden = true;
    bindFixtureNavigation();
    return;
  }

  els.fixtureGrid.classList.remove("team-journey-mode");
  const bracketMode = state.activeRound >= 4;
  const historyMode = viewingRoundHistory();
  els.fixtureGrid.classList.toggle("bracket-mode", bracketMode);
  els.unresolvedFilter.hidden = bracketMode || historyMode;

  if (bracketMode) {
    els.fixtureGrid.innerHTML = bracketMarkup();
    els.loadMoreButton.hidden = true;
    bindFixtureNavigation();
    return;
  }

  const round = selectedRound();
  const indexed = round.map((match, index) => ({ match, index }));
  const filtered = filterUnresolved
    ? indexed.filter(({ match }) => !match.result?.revealed)
    : indexed;
  const shown = filtered;
  els.fixtureGrid.innerHTML = shown.map(({ match, index }) => fixtureMarkup(match, index)).join("");
  bindFixtureNavigation();
  els.loadMoreButton.hidden = true;
}

function renderQueue() {
  const round = selectedRound();
  const unplayed = round
    .map((match, index) => ({ match, index }))
    .filter(({ match }) => !match.result)
    .slice(0, 5);
  els.tiesRemaining.textContent = `${round.filter((match) => !match.result?.revealed).length} ties left`;

  if (!unplayed.length) {
    els.matchQueue.innerHTML = `
      <div class="empty-story">
        <span>✓</span>
        <p>This round is complete.</p>
      </div>
    `;
    return;
  }

  els.matchQueue.innerHTML = unplayed.map(({ match, index }) => {
    const home = teamById(match.homeId);
    const away = teamById(match.awayId);
    return `
      <div class="queue-item ${index === state.selectedMatch ? "current" : ""}" data-index="${index}">
        <span class="queue-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="queue-pair">
          <span class="queue-team"><span>${flagMarkup(home, "queue-flag")}</span><span>${home.name}</span></span>
          <span class="queue-team"><span>${flagMarkup(away, "queue-flag")}</span><span>${away.name}</span></span>
        </span>
      </div>
    `;
  }).join("");

  els.matchQueue.querySelectorAll(".queue-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (livePlayback) {
        showToast("The live tie is still running.");
        return;
      }
      state.selectedMatch = Number(item.dataset.index);
      state.championView = false;
      saveState();
      render();
    });
  });
}

function storylineFor(match) {
  if (!match.result?.revealed) return null;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const winner = teamById(match.result.winnerId);
  const loser = winner.id === home.id ? away : home;
  const goals = match.result.homeGoals + match.result.awayGoals;

  if (loser.strength - winner.strength > 12) {
    return {
      icon: "⚡",
      title: `${winner.name} stun ${loser.name}`,
      copy: `${winner.name} send one of the tournament favourites home.`,
      priority: 4,
    };
  }
  if (match.result.penalties) {
    return {
      icon: "◎",
      title: `${winner.name} survive on penalties`,
      copy: `${match.result.penalties.home}–${match.result.penalties.away} in the shootout.`,
      priority: 3,
    };
  }
  if (goals >= 6) {
    return {
      icon: "✦",
      title: `${goals}-goal classic`,
      copy: `${home.name} and ${away.name} deliver a wild one.`,
      priority: 2,
    };
  }
  if ((match.result.redCards || []).length) {
    const card = match.result.redCards[0];
    const dismissedTeam = teamById(card.teamId);
    return {
      icon: "▮",
      title: `${dismissedTeam.name} see red`,
      copy: `${card.player} was dismissed in the ${card.minute}th minute.`,
      priority: 2,
    };
  }
  if (match.result.extraTime) {
    return {
      icon: "+",
      title: `${winner.name} need extra time`,
      copy: `${home.name} ${match.result.homeGoals}–${match.result.awayGoals} ${away.name}.`,
      priority: 1,
    };
  }
  return null;
}

function renderStorylines() {
  const stories = allMatches()
    .map((match, index) => ({ story: storylineFor(match), index }))
    .filter(({ story }) => story)
    .sort((a, b) => b.index - a.index || b.story.priority - a.story.priority)
    .slice(0, 5)
    .map(({ story }) => story);

  if (!stories.length) {
    els.plotList.innerHTML = `
      <div class="empty-story">
        <span>✦</span>
        <p>The first giant-killing, thriller and penalty shootout will appear here.</p>
      </div>
    `;
    return;
  }

  els.plotList.innerHTML = stories.map((story) => `
    <div class="plot-item">
      <span class="plot-icon">${story.icon}</span>
      <div><strong>${story.title}</strong><p>${story.copy}</p></div>
    </div>
  `).join("");
}

function renderGoldenBoot() {
  const leaders = calculateGoalscorerTable().slice(0, 5);
  if (!leaders.length) {
    els.goldenBootList.innerHTML = `
      <div class="golden-boot-empty">
        <span>01</span>
        <p>The race starts with the first goal.</p>
      </div>
    `;
    return;
  }

  els.goldenBootList.innerHTML = leaders.map((leader, index) => {
    const team = teamById(leader.teamId);
    return `
      <div class="golden-boot-row ${index === 0 ? "leader" : ""}">
        <span class="golden-boot-rank">${index + 1}</span>
        <span class="golden-boot-player">
          <strong>${leader.player}</strong>
          <small>${flagMarkup(team, "golden-boot-flag")} ${team.name}</small>
        </span>
        <b>${leader.goals}</b>
      </div>
    `;
  }).join("");
}

function renderProgress() {
  const complete = completedCount();
  const percent = Math.round((complete / 255) * 100);
  els.progressPercent.textContent = `${percent}%`;
  els.progressBar.style.width = `${percent}%`;
  els.progressCopy.textContent = complete
    ? `${complete} played · ${255 - complete} ties remaining`
    : "256 teams. 255 ties. One champion.";
}

function renderSettingsSummary() {
  const copy = {
    realistic: ["Realistic", "favourites hold the edge"],
    balanced: ["Balanced", "upsets can happen"],
    chaos: ["Pure chaos", "no giant is safe"],
  }[state.settings.upset];
  els.chaosValue.textContent = copy[0];
  els.chaosCopy.textContent = copy[1];
}

function renderParticipantOverview(query = "") {
  const normalized = query.trim().toLowerCase();
  const confederations = [
    ["UEFA", "Europe"],
    ["CONMEBOL", "South America"],
    ["CONCACAF", "North & Central America"],
    ["AFC", "Asia"],
    ["CAF", "Africa"],
    ["OFC", "Oceania"],
    ["INVITED", "Invited & non-FIFA"],
  ];

  els.participantSections.innerHTML = confederations.map(([code, label]) => {
    const teams = TEAMS
      .filter((team) => team.confed === code && team.name.toLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!teams.length) return "";
    return `
      <section class="participant-group">
        <div class="participant-group-head">
          <h3>${label}</h3>
          <span>${teams.length} ${teams.length === 1 ? "team" : "teams"}</span>
        </div>
        <div class="participant-grid">
          ${teams.map((team) => `
            <div class="participant">
              <span class="participant-flag">${flagMarkup(team, "participant-flag-art")}</span>
              <span>
                <strong>${team.name}</strong>
                <small>${team.fifaRank ? `FIFA #${team.fifaRank}` : "Guest team"} · ${team.rating}/100</small>
              </span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }).join("") || `<div class="overview-empty">No teams match that search.</div>`;
}

function render() {
  const beforeStart = !state.started;
  document.body.classList.toggle("before-start", beforeStart);
  els.fieldOverview.hidden = !beforeStart;
  els.mainContent.hidden = beforeStart;

  if (beforeStart) {
    els.pageKicker.textContent = "WORLD 256 · TOURNAMENT FIELD";
    els.pageTitle.textContent = "Meet the 256 teams";
    renderParticipantOverview(els.overviewSearch.value);
    renderProgress();
    return;
  }

  const roundName = ROUND_NAMES[state.activeRound];
  const historyMode = viewingRoundHistory();
  els.pageKicker.textContent = state.championView
    ? "TOURNAMENT COMPLETE"
    : historyMode ? "ROUND ARCHIVE" : "WORLD 256 KNOCKOUT";
  els.pageTitle.textContent = state.championView
    ? "Final"
    : roundName;
  els.boardTitle.textContent = historyMode
    ? roundName
    : state.activeRound >= 4 ? "Knockout bracket" : `${roundName} fixtures`;
  if (teamFilterId) els.boardTitle.textContent = `${teamById(teamFilterId).name} matches`;
  els.simulateRoundButton.textContent = state.activeRound === 7 ? "Simulate final" : "Simulate round";
  els.simulateRoundButton.hidden = historyMode || Boolean(teamFilterId);
  renderRoundNav();
  renderRoundHistoryControl();
  renderProgress();
  renderSettingsSummary();
  renderTeamFilter();
  renderStage();
  renderFixtures();
  renderQueue();
  renderGoldenBoot();
  renderStorylines();
  els.unresolvedFilter.classList.toggle("active", filterUnresolved);
}

function syncSettingsModal() {
  document.querySelectorAll("#upsetSetting button").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.settings.upset);
  });
  document.querySelectorAll("#goalSetting button").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === state.settings.goals);
  });
  $("#spoilerSetting").checked = state.settings.spoiler;
  $("#realNamesSetting").checked = state.settings.realNames;
}

function renderField(query = "") {
  const normalized = query.trim().toLowerCase();
  const teams = TEAMS.filter((team) => team.name.toLowerCase().includes(normalized));
  els.fieldList.innerHTML = teams.map((team) => `
    <div class="field-team">
      <span class="field-flag">${flagMarkup(team, "field-flag-art")}</span>
      <span>${team.name}</span>
      <small class="${team.confed === "INVITED" ? "invited" : ""}">
        ${team.fifaRank ? `#${team.fifaRank} · ${team.rating}` : `guest · ${team.rating}`}
      </small>
    </div>
  `).join("");
}

function teamJourneyMatches(teamId) {
  return state.rounds.flatMap((round, roundIndex) => (round || [])
    .map((match, matchIndex) => ({ match, matchIndex, roundIndex }))
    .filter(({ match }) => match.homeId === teamId || match.awayId === teamId));
}

function renderTeamFilter() {
  const team = teamFilterId ? teamById(teamFilterId) : null;
  els.teamFilterControl.classList.toggle("active", Boolean(team));
  els.teamFilterChip.hidden = !team;
  if (!team) return;
  els.teamFilterChip.innerHTML = `
    <span class="team-filter-check" aria-hidden="true">✓</span>
    ${flagMarkup(team, "team-filter-flag")}
    <strong>${team.name}</strong>
    <span class="team-filter-clear" aria-hidden="true">×</span>
  `;
  els.teamFilterChip.setAttribute("aria-label", `Clear ${team.name} match filter`);
}

function selectTeamFilter(teamId) {
  if (!teamFilterId) {
    teamFilterReturn = {
      activeRound: state.activeRound,
      selectedMatch: state.selectedMatch,
      championView: state.championView,
      fixtureLimit,
      filterUnresolved,
    };
  }
  teamFilterId = teamId;
  els.teamSearch.value = "";
  closeSearch();
  render();
  els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearTeamFilter() {
  teamFilterId = null;
  if (teamFilterReturn) {
    state.activeRound = teamFilterReturn.activeRound;
    state.selectedMatch = teamFilterReturn.selectedMatch;
    state.championView = teamFilterReturn.championView;
    fixtureLimit = teamFilterReturn.fixtureLimit;
    filterUnresolved = teamFilterReturn.filterUnresolved;
  }
  teamFilterReturn = null;
  els.teamSearch.value = "";
  closeSearch();
  saveState();
  render();
  els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeSearch() {
  searchPopover?.remove();
  searchPopover = null;
}

function renderSearchResults(query) {
  closeSearch();
  if (!query.trim()) return;
  const results = TEAMS.filter((team) => team.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  searchPopover = document.createElement("div");
  searchPopover.className = "search-result-popover";
  searchPopover.innerHTML = results.length
    ? results.map((team) => {
      const journey = teamJourneyMatches(team.id);
      return `
        <button class="search-result" data-id="${team.id}">
          <span>${flagMarkup(team, "search-flag")}</span>
          <span><strong>${team.name}</strong><small>${journey.length} ${journey.length === 1 ? "match" : "matches"}</small></span>
        </button>
      `;
    }).join("")
    : `<div class="empty-story"><p>No team found.</p></div>`;
  els.teamFilterControl.appendChild(searchPopover);
  searchPopover.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      if (livePlayback) {
        showToast("The live tie is still running.");
        closeSearch();
        return;
      }
      selectTeamFilter(button.dataset.id);
    });
  });
}

document.addEventListener("click", (event) => {
  if (searchPopover && !els.teamFilterControl.contains(event.target)) {
    closeSearch();
  }
});

els.playButton.addEventListener("click", playSelected);
els.revealButton.addEventListener("click", revealSelected);
els.pauseLiveButton.addEventListener("click", toggleLivePause);
els.speedButton.addEventListener("click", cycleLiveSpeed);
els.skipLiveButton.addEventListener("click", skipLivePlayback);
els.simulateRoundButton.addEventListener("click", requestRoundSimulation);
$("#confirmSimulateRoundButton").addEventListener("click", simulateCurrentRound);
els.roundNav.addEventListener("click", (event) => {
  const button = event.target.closest(".round-link.available");
  if (!button) return;
  if (livePlayback) {
    showToast("The live tie is still running. Skip to full time before changing rounds.");
    return;
  }
  const roundIndex = Number(button.dataset.round);
  openRound(roundIndex, roundIsComplete(roundIndex));
  els.sidebar.classList.remove("open");
});
els.historyRoundButton.addEventListener("click", () => {
  if (livePlayback) {
    showToast("Finish or skip the live tie before changing rounds.");
    return;
  }
  openRound(Number(els.historyRoundButton.dataset.round), true);
});
els.newerRoundButton.addEventListener("click", () => {
  if (livePlayback) {
    showToast("Finish or skip the live tie before changing rounds.");
    return;
  }
  openRound(Number(els.newerRoundButton.dataset.round), true);
});
els.loadMoreButton.addEventListener("click", () => {
  fixtureLimit += 24;
  renderFixtures();
});
els.unresolvedFilter.addEventListener("click", () => {
  filterUnresolved = !filterUnresolved;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  renderFixtures();
  els.unresolvedFilter.classList.toggle("active", filterUnresolved);
});

$("#settingsButton").addEventListener("click", () => {
  syncSettingsModal();
  els.settingsModal.showModal();
});

$("#fieldButton").addEventListener("click", () => {
  renderField();
  els.fieldModal.showModal();
});

$("#newTournamentButton").addEventListener("click", () => els.resetModal.showModal());
$("#championReset").addEventListener("click", () => els.resetModal.showModal());
$("#confirmResetButton").addEventListener("click", () => {
  if (livePlayback) {
    cancelAnimationFrame(livePlayback.frame);
    clearTimeout(livePlayback.finishTimer);
    clearTimeout(livePlayback.penaltyTimer);
    livePlayback = null;
  }
  const previousSettings = { ...state.settings };
  state = createInitialState();
  state.settings = previousSettings;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  teamFilterId = null;
  teamFilterReturn = null;
  closeSearch();
  saveState();
  render();
  showToast("Fresh draw created. All 256 teams are back.");
});

document.querySelectorAll(".segmented").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

$("#saveSettingsButton").addEventListener("click", () => {
  state.settings = {
    upset: $("#upsetSetting .active").dataset.value,
    goals: $("#goalSetting .active").dataset.value,
    spoiler: $("#spoilerSetting").checked,
    realNames: $("#realNamesSetting").checked,
  };
  saveState();
  render();
  showToast("Simulation settings saved.");
});

els.fieldSearch.addEventListener("input", (event) => renderField(event.target.value));
els.overviewSearch.addEventListener("input", (event) => renderParticipantOverview(event.target.value));
els.teamSearch.addEventListener("input", (event) => renderSearchResults(event.target.value));
els.teamFilterChip.addEventListener("click", clearTeamFilter);

$("#startTournamentButton").addEventListener("click", () => {
  state.started = true;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("The draw is live. Choose the opening tie.");
});

$("#menuButton").addEventListener("click", () => els.sidebar.classList.toggle("open"));
$("#fullscreenButton").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    showToast("Fullscreen is not available in this browser.");
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") els.sidebar.classList.remove("open");
  if (
    event.key === " " &&
    !["INPUT", "BUTTON"].includes(document.activeElement.tagName) &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    if (livePlayback) {
      showToast("Use the live controls to speed up or skip this tie.");
      return;
    }
    const match = selectedMatch();
    if (match?.result && !match.result.revealed) revealSelected();
    else playSelected();
  }
});

render();
