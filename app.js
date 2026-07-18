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
  fieldModal: $("#fieldModal"),
  resetModal: $("#resetModal"),
  simulateRoundModal: $("#simulateRoundModal"),
  snapshotModal: $("#snapshotModal"),
  snapshotImage: $("#snapshotImage"),
  snapshotButton: $("#snapshotButton"),
  copySnapshotButton: $("#copySnapshotButton"),
  shareSnapshotButton: $("#shareSnapshotButton"),
  saveSnapshotButton: $("#saveSnapshotButton"),
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
  predictionPickerButton: $("#predictionPickerButton"),
  predictionPickerLabel: $("#predictionPickerLabel"),
  predictionModal: $("#predictionModal"),
  predictionSearch: $("#predictionSearch"),
  predictionList: $("#predictionList"),
  clearPredictionButton: $("#clearPredictionButton"),
  soundToggleButton: $("#soundToggleButton"),
  soundToggleLabel: $("#soundToggleLabel"),
  championPredictionResult: $("#championPredictionResult"),
  matchPenaltyOverlay: $("#matchPenaltyOverlay"),
  matchPenaltyScene: $("#matchPenaltyScene"),
  matchPenaltyPlayer: $("#matchPenaltyPlayer"),
};

const defaultSettings = {
  upset: "balanced",
  goals: "normal",
  realNames: true,
  sound: true,
};

const TEAM_BY_ID = new Map(TEAMS.map((team) => [team.id, team]));

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
const MATCH_SOUND_PATHS = {
  penaltyWhistle: "./assets/audio/penalty-whistle.mp3",
  fullTimeWhistle: "./assets/audio/full-time-whistle.mp3",
};
const activeMatchSounds = new Set();

function audioIsEnabled() {
  return Boolean(state.settings.sound && !document.hidden);
}

function playAudioSample(path, volume, { delay = 0, duration = null } = {}) {
  if (!audioIsEnabled()) return;
  const start = () => {
    if (!audioIsEnabled()) return;
    const audio = new Audio(path);
    let stopTimer = null;
    audio.preload = "auto";
    audio.volume = volume;
    activeMatchSounds.add(audio);
    const cleanup = () => {
      if (stopTimer) clearTimeout(stopTimer);
      activeMatchSounds.delete(audio);
    };
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    audio.play().catch(cleanup);
    if (duration) {
      stopTimer = setTimeout(() => {
        audio.pause();
        cleanup();
      }, duration);
    }
  };
  if (delay) setTimeout(start, delay);
  else start();
}

function primeMatchSounds() {
  if (!state.settings.sound) return;
  Object.values(MATCH_SOUND_PATHS).forEach((path) => {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.load();
  });
}

function playWhistleSound() {
  playAudioSample(MATCH_SOUND_PATHS.penaltyWhistle, 0.16);
}

function playFullTimeWhistle() {
  playAudioSample(MATCH_SOUND_PATHS.fullTimeWhistle, 0.18);
}

function playFullTimeWhistleOnce() {
  if (!livePlayback || livePlayback.fullTimeWhistlePlayed) return;
  livePlayback.fullTimeWhistlePlayed = true;
  playFullTimeWhistle();
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
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

function normalizeDistinctGoalMinutes(result) {
  if (!result) return;
  const events = [
    ...(result.homeEvents || []).map((event, order) => ({ event, order, side: "home" })),
    ...(result.awayEvents || []).map((event, order) => ({ event, order: order + 1000, side: "away" })),
  ].sort((a, b) => a.event.minute - b.event.minute || a.order - b.order);
  const usedMinutes = new Set();
  events.forEach(({ event, side }) => {
    const start = event.minute > 90 ? 91 : 2;
    const dismissal = (result.redCards || []).find((card) => card.side === side && card.player === event.scorer);
    const segmentEnd = event.minute > 90 ? 120 : 90;
    const end = dismissal ? Math.min(segmentEnd, dismissal.minute) : segmentEnd;
    let minute = Math.min(end, Math.max(start, event.minute));
    if (usedMinutes.has(minute)) {
      for (let offset = 1; offset <= end - start; offset += 1) {
        const later = minute + offset;
        const earlier = minute - offset;
        if (later <= end && !usedMinutes.has(later)) {
          minute = later;
          break;
        }
        if (earlier >= start && !usedMinutes.has(earlier)) {
          minute = earlier;
          break;
        }
      }
    }
    event.minute = minute;
    usedMinutes.add(minute);
  });
  result.homeEvents?.sort((a, b) => a.minute - b.minute);
  result.awayEvents?.sort((a, b) => a.minute - b.minute);
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
    predictionTeamId: null,
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
      saved.settings = { ...defaultSettings, ...(saved.settings || {}) };
      saved.settings.realNames = true;
      delete saved.settings.spoiler;
      if (!TEAM_BY_ID.has(saved.predictionTeamId)) saved.predictionTeamId = null;
      saved.rounds.flat().forEach((match) => normalizeDistinctGoalMinutes(match?.result));
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
  return TEAM_BY_ID.get(id);
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

function predictionProgress() {
  const team = state.predictionTeamId ? teamById(state.predictionTeamId) : null;
  if (!team) return null;
  for (let roundIndex = 0; roundIndex < state.rounds.length; roundIndex += 1) {
    const loss = (state.rounds[roundIndex] || []).find((match) => (
      match.result?.revealed
      && (match.homeId === team.id || match.awayId === team.id)
      && match.result.winnerId !== team.id
    ));
    if (loss) return { team, state: "eliminated", roundIndex, label: `Eliminated in ${ROUND_NAMES[roundIndex]}` };
  }
  const final = state.rounds[7]?.[0];
  if (final?.result?.revealed && final.result.winnerId === team.id) {
    return { team, state: "correct", roundIndex: 7, label: "Prediction correct" };
  }
  return { team, state: "alive", roundIndex: state.activeRound, label: "Still alive" };
}

function renderPredictionPicker() {
  const progress = predictionProgress();
  els.predictionPickerButton.hidden = Boolean(state.started && !progress);
  els.predictionPickerButton.classList.toggle("has-prediction", Boolean(progress));
  els.predictionPickerButton.classList.toggle("is-eliminated", progress?.state === "eliminated");
  els.predictionPickerButton.classList.toggle("is-correct", progress?.state === "correct");
  if (!progress) {
    els.predictionPickerLabel.textContent = "?";
    els.predictionPickerButton.setAttribute("aria-label", "Choose champion prediction");
    els.predictionPickerButton.title = "Choose your champion";
    return;
  }
  els.predictionPickerLabel.innerHTML = flagMarkup(progress.team, "prediction-picker-flag");
  els.predictionPickerButton.setAttribute("aria-label", `Prediction: ${progress.team.name}. ${progress.label}`);
  els.predictionPickerButton.title = `${progress.team.name} · ${progress.label}`;
}

function renderPredictionList(query = "") {
  const normalized = query.trim().toLowerCase();
  const teams = TEAMS
    .filter((team) => team.name.toLowerCase().includes(normalized))
    .slice(0, normalized ? 80 : 40);
  els.predictionList.innerHTML = teams.map((team) => `
    <button class="prediction-option ${team.id === state.predictionTeamId ? "selected" : ""}" type="button" data-team-id="${team.id}">
      ${flagMarkup(team, "prediction-option-flag")}
      <span><strong>${team.name}</strong><small>${team.fifaRank ? `FIFA #${team.fifaRank}` : "Guest team"}</small></span>
      <i aria-hidden="true">${team.id === state.predictionTeamId ? "✓" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No team matches that search.</div>`;
  els.clearPredictionButton.hidden = !state.predictionTeamId;
}

function renderChampionPrediction(champion) {
  const progress = predictionProgress();
  els.championPredictionResult.hidden = !progress;
  if (!progress) return;
  const correct = progress.team.id === champion.id;
  els.championPredictionResult.classList.toggle("correct", correct);
  els.championPredictionResult.innerHTML = `
    ${flagMarkup(progress.team, "prediction-result-flag")}
    <span><small>YOUR PREDICTION</small><strong>${progress.team.name}</strong></span>
    <b>${correct ? "✓ CORRECT" : "MISSED"}</b>
  `;
}

function tournamentScoringForTeam(teamId) {
  const playerGoals = new Map();
  let teamGoals = 0;
  allMatches().forEach((match) => {
    if (!match?.result) return;
    const side = match.homeId === teamId ? "home" : match.awayId === teamId ? "away" : null;
    if (!side) return;
    teamGoals += side === "home" ? match.result.homeGoals : match.result.awayGoals;
    const events = side === "home" ? match.result.homeEvents : match.result.awayEvents;
    (events || []).forEach((event) => {
      if (event.goalType === "ownGoal" || event.ownGoal) return;
      playerGoals.set(event.scorer, (playerGoals.get(event.scorer) || 0) + 1);
    });
  });
  return { teamGoals, playerGoals };
}

function completedCount() {
  return allMatches().filter((match) => match.result).length;
}

function calculateGoalscorerTable(rounds = state.rounds) {
  const scorers = new Map();
  const teamAppearances = new Map();
  rounds.forEach((round, roundIndex) => {
    (round || []).forEach((match) => {
      if (!match?.result?.revealed) return;
      teamAppearances.set(match.homeId, (teamAppearances.get(match.homeId) || 0) + 1);
      teamAppearances.set(match.awayId, (teamAppearances.get(match.awayId) || 0) + 1);
      const addGoals = (events, teamId) => {
        (events || []).forEach((event) => {
          if (event.goalType === "ownGoal" || event.ownGoal) return;
          const key = `${teamId}\u0000${event.scorer}`;
          const current = scorers.get(key) || {
            player: event.scorer,
            teamId,
            goals: 0,
            penalties: 0,
            latestRound: roundIndex,
          };
          current.goals += 1;
          if (event.goalType === "penalty") current.penalties += 1;
          current.latestRound = Math.max(current.latestRound, roundIndex);
          scorers.set(key, current);
        });
      };
      addGoals(match.result.homeEvents, match.homeId);
      addGoals(match.result.awayEvents, match.awayId);
    });
  });

  return [...scorers.values()].map((entry) => {
    const team = teamById(entry.teamId);
    const squadProfiles = playerProfilesForTeam(team);
    const profile = squadProfiles.find((player) => player.name === entry.player);
    const matches = teamAppearances.get(entry.teamId) || 0;
    return {
      ...entry,
      matches,
      minutes: profile ? Math.round(matches * 90 * profile.expectedMinutesShare) : matches * 90,
      position: profile?.position || "—",
      playerOverall: profile?.overall || team?.rating || 0,
      finishing: profile?.finishing || 0,
      attackingRole: profile?.attackingRole || "support",
      scorerWeight: profile ? calculateScorerWeight(profile, team, squadProfiles) : 0,
    };
  }).sort((a, b) => (
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

let snapshotBlob = null;
let snapshotObjectUrl = null;
let snapshotFilename = "world-256-snapshot.png";

function snapshotRoundedRect(context, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function snapshotText(context, text, x, y, maximumWidth, startingSize, options = {}) {
  const {
    minimumSize = 20,
    weight = 700,
    family = "Manrope, Arial, sans-serif",
    align = "center",
    color = "#f5f7fb",
  } = options;
  let size = startingSize;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillStyle = color;
  do {
    context.font = `${weight} ${size}px ${family}`;
    if (context.measureText(text).width <= maximumWidth) break;
    size -= 2;
  } while (size > minimumSize);
  context.fillText(text, x, y);
}

function snapshotGoalLines(events) {
  const goals = (events || []).slice().sort((a, b) => a.minute - b.minute);
  const scorerMinutes = new Map();
  goals.forEach((event) => {
    if (!scorerMinutes.has(event.scorer)) scorerMinutes.set(event.scorer, []);
    scorerMinutes.get(event.scorer).push(`${event.minute}'`);
  });
  return [...scorerMinutes].map(([scorer, minutes]) => `${scorer}  ${minutes.join(", ")}`);
}

function snapshotMatchContext() {
  const roundIndex = state.championView ? 7 : state.activeRound;
  const match = state.championView ? state.rounds[7]?.[0] : selectedMatch();
  if (!match) return null;
  return {
    match,
    roundIndex,
    home: teamById(match.homeId),
    away: teamById(match.awayId),
  };
}

function drawSnapshotGoalLines(context, lines, x, y, align, maximumWidth = 420) {
  const spacing = lines.length > 6 ? 20 : lines.length > 4 ? 24 : 29;
  const fontSize = lines.length > 6 ? 15 : lines.length > 4 ? 17 : 19;
  lines.forEach((line, index) => snapshotText(context, line, x, y + index * spacing, maximumWidth, fontSize, {
    minimumSize: 13,
    weight: 600,
    align,
    color: "#aab4c4",
    family: "Manrope, Arial, sans-serif",
  }));
}

function drawSnapshotConfetti(context, championId) {
  const colours = ["#f2c45f", "#5f8cff", "#f4f7fb", "#34c77b", "#ef5b5b"];
  const random = mulberry32(stableHash(`${championId}-snapshot-confetti`));
  context.save();
  let placed = 0;
  let attempts = 0;
  while (placed < 46 && attempts < 240) {
    attempts += 1;
    const edge = random();
    const x = edge < 0.42
      ? 72 + random() * 180
      : edge < 0.84 ? 948 + random() * 180 : 250 + random() * 700;
    const y = edge < 0.84 ? 66 + random() * 460 : 58 + random() * 74;
    const overlapsGoalDetails = y >= 350 && y <= 575 && (x <= 450 || x >= 750);
    const overlapsChampionLabel = x >= 740 && y <= 128;
    if (overlapsGoalDetails || overlapsChampionLabel) continue;
    const width = 4 + random() * 6;
    const height = 9 + random() * 9;
    context.save();
    context.translate(x, y);
    context.rotate(random() * Math.PI);
    context.globalAlpha = 0.56 + random() * 0.34;
    context.fillStyle = colours[Math.floor(random() * colours.length)];
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
    placed += 1;
  }
  context.restore();
}

function drawSnapshotGoldenBoot(context, scorer) {
  if (!scorer) return;
  const scorerTeam = teamById(scorer.teamId);
  snapshotRoundedRect(context, 414, 438, 372, 116, 18);
  context.fillStyle = "rgba(17, 24, 36, 0.92)";
  context.fill();
  context.strokeStyle = "rgba(118, 145, 196, 0.24)";
  context.lineWidth = 1.5;
  context.stroke();
  snapshotText(context, "GOLDEN BOOT", 600, 459, 300, 14, {
    minimumSize: 12,
    weight: 800,
    color: "#779cff",
  });
  snapshotText(context, scorer.player, 600, 489, 330, 25, {
    minimumSize: 18,
    weight: 800,
  });
  snapshotText(context, `${scorerTeam.name} · ${scorer.goals} ${scorer.goals === 1 ? "GOAL" : "GOALS"}`, 600, 524, 330, 15, {
    minimumSize: 12,
    weight: 700,
    color: "#aab4c4",
  });
}

function loadSnapshotFlag(team) {
  const code = FLAG_CODE_OVERRIDES[team.code] || team.code.toLowerCase();
  if (code === "xx") return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(value);
    };
    const timeout = setTimeout(() => finish(null), 2500);
    image.crossOrigin = "anonymous";
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.src = `https://flagcdn.com/w320/${code}.png`;
  });
}

function drawSnapshotFlag(context, image, team, x, y) {
  snapshotRoundedRect(context, x - 82, y - 57, 164, 114, 13);
  context.fillStyle = "#192232";
  context.fill();
  if (image) {
    context.save();
    snapshotRoundedRect(context, x - 75, y - 50, 150, 100, 8);
    context.clip();
    context.drawImage(image, x - 75, y - 50, 150, 100);
    context.restore();
  } else {
    snapshotText(context, team.code === "XX" ? "W256" : team.code, x, y, 125, 42, {
      minimumSize: 30,
      weight: 800,
      color: "#8aa9ff",
      family: "Manrope, Arial, sans-serif",
    });
  }
}

async function createMatchSnapshotCanvas() {
  const snapshot = snapshotMatchContext();
  if (!snapshot) throw new Error("No match is selected.");
  const { match, roundIndex, home, away } = snapshot;
  const result = match.result;
  const revealed = Boolean(result?.revealed);
  const championSnapshot = Boolean(state.championView && revealed);
  const championId = championSnapshot ? result.winnerId : null;
  const goldenBootWinner = championSnapshot ? calculateTopGoalscorer() : null;
  const [homeFlagImage, awayFlagImage] = await Promise.all([
    loadSnapshotFlag(home),
    loadSnapshotFlag(away),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image creation is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, 1200, 675);
  background.addColorStop(0, "#0b1018");
  background.addColorStop(0.55, "#111925");
  background.addColorStop(1, "#0b111b");
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, 675);

  const glow = context.createRadialGradient(600, 250, 0, 600, 250, 530);
  glow.addColorStop(0, "rgba(31, 94, 255, 0.18)");
  glow.addColorStop(1, "rgba(31, 94, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 1200, 675);

  snapshotRoundedRect(context, 55, 42, 1090, 558, 28);
  context.fillStyle = "rgba(17, 24, 36, 0.88)";
  context.fill();
  context.strokeStyle = "rgba(118, 145, 196, 0.24)";
  context.lineWidth = 2;
  context.stroke();

  if (championSnapshot) drawSnapshotConfetti(context, championId);

  snapshotText(context, championSnapshot ? "256 TEAMS WC CHAMPIONS" : ROUND_NAMES[roundIndex].toUpperCase(), 1110, 88, 360, 18, {
    minimumSize: 14,
    weight: 700,
    align: "right",
    color: "#779cff",
    family: "Manrope, Arial, sans-serif",
  });

  drawSnapshotFlag(context, homeFlagImage, home, 270, 205);
  drawSnapshotFlag(context, awayFlagImage, away, 930, 205);
  snapshotText(context, home.name, 270, 292, 390, 42, { minimumSize: 24, weight: 800 });
  snapshotText(context, away.name, 930, 292, 390, 42, { minimumSize: 24, weight: 800 });

  if (revealed) {
    snapshotText(context, String(result.homeGoals), 505, 300, 120, 88, {
      weight: 800,
      family: "Manrope, Arial, sans-serif",
    });
    snapshotText(context, "–", 600, 300, 80, 52, { color: "#65728a", weight: 400 });
    snapshotText(context, String(result.awayGoals), 695, 300, 120, 88, {
      weight: 800,
      family: "Manrope, Arial, sans-serif",
    });
    const resultLabel = result.penalties
      ? `PENALTIES ${result.penalties.home}–${result.penalties.away}`
      : result.extraTime ? "AFTER EXTRA TIME" : "FULL TIME";
    snapshotText(context, resultLabel, 600, 370, 380, 24, {
      minimumSize: 20,
      weight: 700,
      color: "#7e8ca3",
      family: "Manrope, Arial, sans-serif",
    });
    drawSnapshotGoalLines(context, snapshotGoalLines(result.homeEvents), 188, 414, "left", championSnapshot ? 290 : 420);
    drawSnapshotGoalLines(context, snapshotGoalLines(result.awayEvents), 1012, 414, "right", championSnapshot ? 290 : 420);
    if (championSnapshot) drawSnapshotGoldenBoot(context, goldenBootWinner);
  } else {
    snapshotText(context, "VS", 600, 307, 180, 52, {
      weight: 800,
      color: "#789cff",
      family: "Manrope, Arial, sans-serif",
    });
    snapshotText(context, result ? "RESULT HIDDEN" : "UPCOMING FIXTURE", 600, 370, 320, 18, {
      weight: 700,
      color: "#7e8ca3",
      family: "Manrope, Arial, sans-serif",
    });
  }

  const mode = state.settings.upset === "chaos" ? "PURE CHAOS" : state.settings.upset.toUpperCase();
  snapshotText(context, `${mode} · ${state.settings.goals.toUpperCase()} GOALS`, 84, 632, 420, 15, {
    weight: 600,
    align: "left",
    color: "#69778e",
    family: "Manrope, Arial, sans-serif",
  });
  snapshotText(context, "256teams.com", 1116, 632, 420, 15, {
    weight: 600,
    align: "right",
    color: "#69778e",
    family: "Manrope, Arial, sans-serif",
  });
  return canvas;
}

function canvasPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The snapshot could not be created."));
    }, "image/png");
  });
}

async function openSnapshotModal() {
  if (livePlayback) {
    showToast("Finish or skip the live match before taking a snapshot.");
    return;
  }
  els.snapshotButton.disabled = true;
  try {
    snapshotBlob = await canvasPngBlob(await createMatchSnapshotCanvas());
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    const snapshot = snapshotMatchContext();
    snapshotFilename = `world-256-${snapshot.home.name}-vs-${snapshot.away.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The snapshot could not be created.");
  } finally {
    els.snapshotButton.disabled = false;
  }
}

async function copySnapshotImage() {
  if (!snapshotBlob) return;
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    showToast("Image copying is unavailable here. Use Save image instead.");
    return;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": snapshotBlob })]);
    showToast("Snapshot copied to your clipboard.");
  } catch {
    showToast("The browser blocked image copying. Try Save image.");
  }
}

async function shareSnapshotImage() {
  if (!snapshotBlob || typeof navigator.share !== "function") return;
  const file = new File([snapshotBlob], snapshotFilename, { type: "image/png" });
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      showToast("File sharing is unavailable here. Use Save image instead.");
      return;
    }
    await navigator.share({
      title: "256 TEAMS WC match snapshot",
      text: "256 TEAMS WC tournament result",
      files: [file],
    });
  } catch (error) {
    if (error.name !== "AbortError") showToast("The snapshot could not be shared.");
  }
}

function saveSnapshotImage() {
  if (!snapshotBlob) return;
  const link = document.createElement("a");
  link.href = snapshotObjectUrl;
  link.download = snapshotFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("Snapshot saved as a PNG.");
}

function generatedPlayers(team) {
  const seed = stableHash(team.name);
  const culture = CULTURAL_NAME_POOLS[team.nameCulture] || CULTURAL_NAME_POOLS.british;
  const names = [];
  for (let index = 0; names.length < 11; index += 1) {
    const first = culture.first[(seed + index * 5) % culture.first.length];
    const last = culture.last[(seed + index * 7 + Math.floor(index / culture.first.length) + 3) % culture.last.length];
    const name = `${first} ${last}`;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

const playerProfileCache = new Map();

function playerProfilesForTeam(team) {
  const useRealPlayers = Boolean(state.settings.realNames && team.players);
  const cacheKey = `${team.id}:${useRealPlayers ? "real" : "generated"}`;
  if (!playerProfileCache.has(cacheKey)) {
    let names = useRealPlayers ? [...team.players] : generatedPlayers(team);
    if (team.name === "Moldova" && !names.includes("Amenyah")) names = ["Amenyah", ...names];
    playerProfileCache.set(cacheKey, buildPlayerProfiles(team, names, !useRealPlayers));
  }
  return playerProfileCache.get(cacheKey);
}

function scorerPool(team, excludedPlayers = []) {
  const excluded = new Set(excludedPlayers);
  return playerProfilesForTeam(team)
    .map((profile) => profile.name)
    .filter((player) => !excluded.has(player));
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

function scoringRunBrake() {
  // Tournament totals are never capped; repeat scoring is controlled per match.
  return 1;
}

function selectWeightedProfile(profiles, random, weightForProfile) {
  const weights = profiles.map((profile) => Math.max(0, weightForProfile(profile)));
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  if (weightTotal <= 0) return profiles[0];
  let roll = random() * weightTotal;
  for (let index = 0; index < profiles.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return profiles[index];
  }
  return profiles[profiles.length - 1];
}

function eligibleScorerProfiles(team, minute, cards = [], suspendedPlayers = []) {
  const dismissed = new Set(
    cards.filter((card) => card.minute < minute).map((card) => card.player),
  );
  const unavailable = new Set([...suspendedPlayers, ...dismissed]);
  const profiles = playerProfilesForTeam(team).filter((profile) => (
    !unavailable.has(profile.name)
    && minute <= Math.max(25, profile.expectedMinutesShare * 120)
  ));
  return profiles.length
    ? profiles
    : playerProfilesForTeam(team).filter((profile) => !unavailable.has(profile.name));
}

function weightedScorer(
  team,
  random,
  excludedPlayers = [],
  inMatchGoals = new Map(),
  goalType = "openPlay",
  minute = 60,
  opponent = null,
  tournamentScoring = { teamGoals: 0, playerGoals: new Map() },
) {
  const squadProfiles = playerProfilesForTeam(team);
  const profiles = eligibleScorerProfiles(team, minute, [], excludedPlayers);
  return selectWeightedProfile(profiles, random, (profile) => scorerWeightForGoalType(
    profile,
    goalType,
    inMatchGoals.get(profile.name) || 0,
    {
      team,
      opponent,
      squadProfiles,
      tournamentTeamGoals: tournamentScoring.teamGoals || 0,
      tournamentPlayerGoals: (tournamentScoring.playerGoals?.get(profile.name) || 0)
        + (inMatchGoals.get(profile.name) || 0),
    },
  )).name;
}

function availableScorer(
  team,
  minute,
  cards,
  random,
  suspendedPlayers = [],
  inMatchGoals = new Map(),
  goalType = "openPlay",
  opponent = null,
  tournamentScoring = { teamGoals: 0, playerGoals: new Map() },
) {
  const squadProfiles = playerProfilesForTeam(team);
  const profiles = eligibleScorerProfiles(team, minute, cards, suspendedPlayers);
  return selectWeightedProfile(profiles, random, (profile) => scorerWeightForGoalType(
    profile,
    goalType,
    inMatchGoals.get(profile.name) || 0,
    {
      team,
      opponent,
      squadProfiles,
      tournamentTeamGoals: tournamentScoring.teamGoals || 0,
      tournamentPlayerGoals: (tournamentScoring.playerGoals?.get(profile.name) || 0)
        + (inMatchGoals.get(profile.name) || 0),
    },
  )).name;
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

function missedPenaltyVisual(side, team, player, round, direction, keeperDive) {
  const visualSeed = stableHash(`${side}-${team.id}-${player}-${round}-penalty-miss`);
  if (visualSeed % 100 < 30) {
    return {
      direction: `wide-${visualSeed % 2 === 0 ? "left" : "right"}`,
      keeperDive,
      missType: "wide",
    };
  }
  return { direction, keeperDive: direction, missType: "save" };
}

function distinctKeeperDiveForGoal(direction, keeperDive, variation = 0) {
  if (keeperDive !== direction) return keeperDive;
  const alternatives = ["left", "centre", "right"].filter((candidate) => candidate !== direction);
  return alternatives[Math.abs(variation) % alternatives.length];
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
      let direction = directions[Math.floor(random() * directions.length)];
      let keeperDive = directions[Math.floor(random() * directions.length)];
      const team = side === "home" ? home : away;
      const player = pools[side][round % pools[side].length];
      let missType = null;
      if (!scored) {
        ({ direction, keeperDive, missType } = missedPenaltyVisual(
          side,
          team,
          player,
          round + 1,
          direction,
          keeperDive,
        ));
      } else {
        keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, round + Number(side === "away"));
      }
      sequence.push({
        side,
        player,
        foot: preferredPenaltyFoot(team, player, random),
        direction,
        keeperDive,
        scored,
        missType,
        round: round + 1,
      });
    }
  }
  return sequence;
}

function createShootoutAttempt(side, team, player, scored, round, random) {
  const directions = ["left", "centre", "right"];
  let direction = directions[Math.floor(random() * directions.length)];
  let keeperDive = directions[Math.floor(random() * directions.length)];
  let missType = null;
  if (!scored) {
    ({ direction, keeperDive, missType } = missedPenaltyVisual(
      side,
      team,
      player,
      round,
      direction,
      keeperDive,
    ));
  } else {
    keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, round + Number(side === "away"));
  }
  return {
    side,
    player,
    foot: preferredPenaltyFoot(team, player, random),
    direction,
    keeperDive,
    scored,
    missType,
    round,
  };
}

function simulatePenaltyShootout(
  home,
  away,
  random,
  cards = [],
  suspendedPlayers = { home: [], away: [] },
  modeName = "balanced",
) {
  const excluded = {
    home: new Set([
      ...(suspendedPlayers.home || []),
      ...cards.filter((card) => card.side === "home").map((card) => card.player),
    ]),
    away: new Set([
      ...(suspendedPlayers.away || []),
      ...cards.filter((card) => card.side === "away").map((card) => card.player),
    ]),
  };
  const orderedTakers = (team, side) => {
    const squadProfiles = playerProfilesForTeam(team);
    return squadProfiles
      .filter((profile) => !excluded[side].has(profile.name))
      .sort((a, b) => Number(b.penaltyTaker) - Number(a.penaltyTaker)
        || calculateScorerWeight(b, team, squadProfiles) - calculateScorerWeight(a, team, squadProfiles));
  };
  const pools = { home: orderedTakers(home, "home"), away: orderedTakers(away, "away") };
  const conversion = {
    home: shootoutConversionChance(home, away, modeName),
    away: shootoutConversionChance(away, home, modeName),
  };
  const penalties = { home: 0, away: 0 };
  const sequence = [];

  const takeKick = (side, round) => {
    const team = side === "home" ? home : away;
    const pool = pools[side];
    const player = pool[(round - 1) % pool.length].name;
    const scored = random() < conversion[side];
    if (scored) penalties[side] += 1;
    sequence.push(createShootoutAttempt(side, team, player, scored, round, random));
  };

  for (let round = 1; round <= 5; round += 1) {
    takeKick("home", round);
    takeKick("away", round);
  }
  let round = 6;
  while (penalties.home === penalties.away && round <= 20) {
    takeKick("home", round);
    takeKick("away", round);
    round += 1;
  }

  // A 15-round tie is extraordinarily rare; settle it with one final quality-weighted pair.
  if (penalties.home === penalties.away) {
    const homeFavoured = random() < simulationClamp(
      0.5 + (calculateShootoutRating(home) - calculateShootoutRating(away)) * 0.005,
      0.38,
      0.62,
    );
    const winnerSide = homeFavoured ? "home" : "away";
    const loserSide = homeFavoured ? "away" : "home";
    const finalRound = 21;
    const loserTeam = loserSide === "home" ? home : away;
    const winnerTeam = winnerSide === "home" ? home : away;
    const loserPlayer = pools[loserSide][(finalRound - 1) % pools[loserSide].length].name;
    const winnerPlayer = pools[winnerSide][(finalRound - 1) % pools[winnerSide].length].name;
    sequence.push(createShootoutAttempt(loserSide, loserTeam, loserPlayer, false, finalRound, random));
    sequence.push(createShootoutAttempt(winnerSide, winnerTeam, winnerPlayer, true, finalRound, random));
    penalties[winnerSide] += 1;
  }

  return { penalties, sequence };
}

function chooseAssist(team, scorer, minute, cards, random, suspendedPlayers, goalType) {
  const assistChance = goalType === "openPlay" ? 0.68 : goalType === "setPiece" ? 0.42 : 0;
  if (random() >= assistChance) return null;
  const candidates = eligibleScorerProfiles(team, minute, cards, suspendedPlayers)
    .filter((profile) => profile.name !== scorer && profile.position !== "GK");
  if (!candidates.length) return null;
  return selectWeightedProfile(candidates, random, (profile) => (
    profile.overall * profile.expectedMinutesShare * (["CAM", "AM", "CM", "LW", "RW"].includes(profile.position) ? 1.35 : 1)
  )).name;
}

function ownGoalScorer(defendingTeam, minute, cards, random, suspendedPlayers = []) {
  const candidates = eligibleScorerProfiles(defendingTeam, minute, cards, suspendedPlayers)
    .filter((profile) => ["CB", "LB", "RB", "LWB", "RWB", "GK", "CDM"].includes(profile.position));
  const pool = candidates.length ? candidates : eligibleScorerProfiles(defendingTeam, minute, cards, suspendedPlayers);
  return pool[Math.floor(random() * pool.length)].name;
}

function goalEvents(
  team,
  defendingTeam,
  regulationCount,
  extraTimeCount,
  random,
  cards = [],
  suspendedPlayers = [],
  defendingCards = [],
  defendingSuspendedPlayers = [],
  usedMinutes = new Set(),
) {
  const events = [];
  const inMatchGoals = new Map();
  const priorTournamentScoring = tournamentScoringForTeam(team.id);
  let currentTeamGoals = 0;
  const uniqueGoalMinute = (start, end) => {
    const span = end - start + 1;
    const initial = start + Math.floor(random() * span);
    for (let offset = 0; offset < span; offset += 1) {
      const candidate = start + ((initial - start + offset) % span);
      if (usedMinutes.has(candidate)) continue;
      usedMinutes.add(candidate);
      return candidate;
    }
    return initial;
  };
  const addGoal = (minute) => {
    const goalType = chooseGoalType(random);
    if (goalType === "ownGoal") {
      const ownGoalBy = ownGoalScorer(
        defendingTeam,
        minute,
        defendingCards,
        random,
        defendingSuspendedPlayers,
      );
      events.push({ minute, scorer: `${ownGoalBy} (OG)`, ownGoalBy, goalType, ownGoal: true, type: "goal" });
      currentTeamGoals += 1;
      return;
    }
    const scorer = availableScorer(
      team,
      minute,
      cards,
      random,
      suspendedPlayers,
      inMatchGoals,
      goalType,
      defendingTeam,
      {
        teamGoals: priorTournamentScoring.teamGoals + currentTeamGoals,
        playerGoals: priorTournamentScoring.playerGoals,
      },
    );
    inMatchGoals.set(scorer, (inMatchGoals.get(scorer) || 0) + 1);
    const assist = chooseAssist(team, scorer, minute, cards, random, suspendedPlayers, goalType);
    events.push({ minute, scorer, assist, goalType, type: "goal" });
    currentTeamGoals += 1;
  };
  for (let index = 0; index < regulationCount; index += 1) {
    const minute = uniqueGoalMinute(2, 90);
    addGoal(minute);
  }
  for (let index = 0; index < extraTimeCount; index += 1) {
    const minute = uniqueGoalMinute(91, 120);
    addGoal(minute);
  }
  return events.sort((a, b) => a.minute - b.minute);
}

function forceOpeningRoundIsraelLoss(home, away, roundIndex, homeGoals, awayGoals) {
  if (roundIndex !== 0) return { homeGoals, awayGoals };
  if (home.name === "Israel" && homeGoals >= awayGoals) awayGoals = homeGoals + 1;
  if (away.name === "Israel" && awayGoals >= homeGoals) homeGoals = awayGoals + 1;
  return { homeGoals, awayGoals };
}

function createRedCard(team, side, random, suspendedPlayers = []) {
  const candidates = playerProfilesForTeam(team).filter((profile) => (
    !suspendedPlayers.includes(profile.name) && profile.position !== "GK"
  ));
  const player = selectWeightedProfile(candidates, random, (profile) => (
    ["CDM", "DM", "CB", "LB", "RB"].includes(profile.position) ? 1.35 : 1
  ));
  return {
    minute: 12 + Math.floor(random() * 77),
    player: player.name,
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

function matchesPlayedForTeam(teamId, beforeRoundIndex) {
  return state.rounds.slice(0, beforeRoundIndex).reduce((total, round) => (
    total + (round || []).filter((match) => (
      match?.result && (match.homeId === teamId || match.awayId === teamId)
    )).length
  ), 0);
}

function simulateMatch(match, roundIndex) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const randomSeed = state.drawSeed + stableHash(match.id) + roundIndex * 1009;
  const random = mulberry32(randomSeed);
  const suspendedPlayers = {
    home: suspendedPlayersForTeam(home.id, roundIndex),
    away: suspendedPlayersForTeam(away.id, roundIndex),
  };
  const modeName = state.settings.upset;
  const mode = SIMULATION_CONFIG.modes[modeName] || SIMULATION_CONFIG.modes.balanced;
  const goalConfig = SIMULATION_CONFIG.goals[state.settings.goals] || SIMULATION_CONFIG.goals.normal;
  const matchesPlayed = {
    home: matchesPlayedForTeam(home.id, roundIndex),
    away: matchesPlayedForTeam(away.id, roundIndex),
  };
  const expected = calculateExpectedGoals(
    home,
    away,
    roundIndex,
    modeName,
    state.settings.goals,
    matchesPlayed.home,
    matchesPlayed.away,
  );
  const redCards = [];
  let shock = false;

  if (random() < redCardChanceForTeam(home, modeName)) {
    redCards.push(createRedCard(home, "home", random, suspendedPlayers.home));
  }
  if (random() < redCardChanceForTeam(away, modeName)) {
    redCards.push(createRedCard(away, "away", random, suspendedPlayers.away));
  }

  let adjustedXG = { homeXG: expected.homeXG, awayXG: expected.awayXG };
  if (expected.ratingGap >= 18 && random() < mode.shockChance) {
    shock = true;
    if (teamSimulationRatings(home).overall > teamSimulationRatings(away).overall) {
      adjustedXG.homeXG *= mode.shockFavouriteReduction;
      adjustedXG.awayXG *= mode.shockUnderdogBoost;
    } else {
      adjustedXG.awayXG *= mode.shockFavouriteReduction;
      adjustedXG.homeXG *= mode.shockUnderdogBoost;
    }
  }

  redCards.forEach((card) => {
    adjustedXG = applyRedCardImpact(adjustedXG.homeXG, adjustedXG.awayXG, card);
  });
  adjustedXG.homeXG = simulationClamp(adjustedXG.homeXG, mode.minimumXG, goalConfig.maximumXG);
  adjustedXG.awayXG = simulationClamp(adjustedXG.awayXG, mode.minimumXG, goalConfig.maximumXG);

  let homeGoals = poisson(adjustedXG.homeXG, random);
  let awayGoals = poisson(adjustedXG.awayXG, random);
  ({ homeGoals, awayGoals } = forceOpeningRoundIsraelLoss(
    home,
    away,
    roundIndex,
    homeGoals,
    awayGoals,
  ));
  ({ homeGoals, awayGoals } = applyScorelineCeiling(home, away, homeGoals, awayGoals));
  const regulationHome = homeGoals;
  const regulationAway = awayGoals;
  let extraTime = false;
  let penalties = null;
  let shootout = null;

  if (homeGoals === awayGoals) {
    extraTime = true;
    const homeDepth = teamSimulationRatings(home).squadDepth;
    const awayDepth = teamSimulationRatings(away).squadDepth;
    const homeExtraTimeFactor = simulationClamp(0.97 - Math.max(0, 76 - homeDepth) * 0.0015, 0.86, 0.98);
    const awayExtraTimeFactor = simulationClamp(0.97 - Math.max(0, 76 - awayDepth) * 0.0015, 0.86, 0.98);
    homeGoals += poisson(adjustedXG.homeXG * 0.32 * homeExtraTimeFactor, random);
    awayGoals += poisson(adjustedXG.awayXG * 0.32 * awayExtraTimeFactor, random);
  }

  if (homeGoals === awayGoals) {
    const penaltyResult = simulatePenaltyShootout(
      home,
      away,
      random,
      redCards,
      suspendedPlayers,
      modeName,
    );
    penalties = penaltyResult.penalties;
    shootout = penaltyResult.sequence;
  }

  const winnerId = penalties
    ? penalties.home > penalties.away ? home.id : away.id
    : homeGoals > awayGoals ? home.id : away.id;

  const usedGoalMinutes = new Set();
  const homeEvents = goalEvents(
    home,
    away,
    regulationHome,
    homeGoals - regulationHome,
    random,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
    usedGoalMinutes,
  );
  const awayEvents = goalEvents(
    away,
    home,
    regulationAway,
    awayGoals - regulationAway,
    random,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
    usedGoalMinutes,
  );
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
    expectedGoals: {
      home: Number(adjustedXG.homeXG.toFixed(3)),
      away: Number(adjustedXG.awayXG.toFixed(3)),
      homeFatigue: Number(expected.homeFatigue.toFixed(3)),
      awayFatigue: Number(expected.awayFatigue.toFixed(3)),
    },
    revealed: false,
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
    if (animate) {
      bumpScore(event.side);
    }
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
  if (direction === "wide-left") return "towards the left post";
  if (direction === "wide-right") return "towards the right post";
  return direction === "centre" ? "down the middle" : `to the ${direction}`;
}

function penaltyMissCopy(attempt) {
  if (attempt.missType === "wide") {
    return attempt.direction === "wide-left"
      ? "WIDE · past the left post"
      : "WIDE · past the right post";
  }
  return `SAVED · keeper dives ${attempt.keeperDive}`;
}

function penaltyStepDelay(duration) {
  if (!livePlayback) return duration;
  if (livePlayback.reducedMotion) return Math.min(180, duration);
  return duration / livePlayback.speed;
}

const SHOOTOUT_MARK_WINDOW_ROUNDS = 5;

function visibleShootoutAttempts(playback, side) {
  if (!playback?.shootout?.length) return [];
  const currentAttempt = playback.shootout[playback.shootoutIndex]
    || playback.shootout[playback.shootout.length - 1];
  const currentRound = currentAttempt?.round || Math.floor(playback.shootoutIndex / 2) + 1;
  const windowStartRound = Math.floor((currentRound - 1) / SHOOTOUT_MARK_WINDOW_ROUNDS)
    * SHOOTOUT_MARK_WINDOW_ROUNDS + 1;
  const windowEndRound = windowStartRound + SHOOTOUT_MARK_WINDOW_ROUNDS;
  const completedThrough = ["result", "complete"].includes(playback.shootoutStep)
    ? playback.shootoutIndex
    : playback.shootoutIndex - 1;

  return playback.shootout
    .map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt, index }) => attempt.side === side
      && index <= completedThrough
      && attempt.round >= windowStartRound
      && attempt.round < windowEndRound);
}

function shootoutMarksMarkup(playback, side) {
  return visibleShootoutAttempts(playback, side)
    .map(({ attempt }) => {
      const state = attempt.scored ? "goal" : "miss";
      const label = attempt.scored ? "Scored" : "Missed";
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
  scene.dataset.result = step === "result"
    ? attempt.scored ? "goal" : attempt.missType === "wide" ? "wide" : "save"
    : "pending";
}

function setPenaltyScene(attempt, step) {
  setPenaltySceneElement(els.penaltyScene, attempt, step);
}

function clearMatchPenaltyAnimation() {
  if (!livePlayback?.matchPenaltyTimers) return;
  livePlayback.matchPenaltyTimers.forEach((timer) => clearTimeout(timer));
  livePlayback.matchPenaltyTimers = [];
  livePlayback.matchPenaltyActive = false;
  els.matchPenaltyOverlay.hidden = true;
  els.matchStage.classList.remove("has-match-penalty");
}

function matchPenaltyAttempt(event) {
  const team = teamById(event.teamId);
  const random = mulberry32(state.drawSeed + stableHash(`${livePlayback.matchId}-${event.side}-${event.minute}-${event.player}-match-penalty`));
  const directions = ["left", "centre", "right"];
  const direction = directions[Math.floor(random() * directions.length)];
  const otherDirections = directions.filter((option) => option !== direction);
  return {
    player: event.player,
    side: event.side,
    scored: true,
    direction,
    keeperDive: otherDirections[Math.floor(random() * otherDirections.length)],
    foot: preferredPenaltyFoot(team, event.player, random),
  };
}

function startMatchPenaltyAnimation(event) {
  if (!livePlayback || livePlayback.matchPenaltyActive) return;
  const playback = livePlayback;
  const attempt = matchPenaltyAttempt(event);
  const motionScale = playback.reducedMotion ? 0.15 : 1;
  const delay = (duration) => Math.max(40, duration * motionScale);
  const whistleLeadIn = 1050;
  const setupHold = 1650;
  const flightEndsAt = whistleLeadIn + setupHold + delay(570);
  playback.matchPenaltyActive = true;
  playback.matchPenaltyTimers = [];
  cancelAnimationFrame(playback.frame);
  playback.frame = null;
  els.matchPenaltyPlayer.textContent = `${event.player} steps up`;
  playWhistleSound();

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    els.matchPenaltyOverlay.hidden = false;
    els.matchStage.classList.add("has-match-penalty");
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "setup");
  }, whistleLeadIn));

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "flight");
  }, whistleLeadIn + setupHold));

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "result");
    applyLiveEvent(event, true);
    playback.eventIndex += 1;
  }, flightEndsAt));

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    playback.matchPenaltyActive = false;
    playback.matchPenaltyTimers = [];
    els.matchPenaltyOverlay.hidden = true;
    els.matchStage.classList.remove("has-match-penalty");
    playback.lastTimestamp = 0;
    playback.frame = requestAnimationFrame(stepLivePlayback);
  }, flightEndsAt + delay(630)));
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
    : `KICK ${livePlayback.shootoutIndex + 1}`;

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
        : penaltyMissCopy(attempt);
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
  playFullTimeWhistleOnce();
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
    if (attempt.scored) {
      livePlayback[`penalty${attempt.side === "home" ? "Home" : "Away"}Score`] += 1;
    }
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
  playFullTimeWhistleOnce();
  const completed = livePlayback;
  const match = state.rounds[completed.roundIndex]?.[completed.matchIndex];
  if (!match?.result) {
    livePlayback = null;
    return;
  }

  clearMatchPenaltyAnimation();
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
    const event = livePlayback.events[livePlayback.eventIndex];
    if (event.type === "goal" && event.goalType === "penalty") {
      startMatchPenaltyAnimation(event);
      return;
    }
    applyLiveEvent(event);
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
    playFullTimeWhistleOnce();
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
    fullTimeWhistlePlayed: false,
    frame: null,
    finishTimer: null,
    penaltyTimer: null,
    matchPenaltyActive: false,
    matchPenaltyTimers: [],
  };
  render();
  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
}

function skipLivePlayback() {
  if (!livePlayback) return;

  if (livePlayback.matchPenaltyActive) {
    showToast("Let the penalty play out first.");
    return;
  }

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
  if (livePlayback.matchPenaltyActive) {
    showToast("Speed controls return after the penalty.");
    return;
  }
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
  if (livePlayback.matchPenaltyActive) {
    showToast("Pause controls return after the penalty.");
    return;
  }
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

  primeMatchSounds();
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
  els.matchPenaltyOverlay.hidden = !livePlayback?.matchPenaltyActive;
  els.matchStage.classList.remove("is-shootout");
  els.snapshotButton.hidden = true;
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
      els.snapshotButton.hidden = !final.result.revealed;
      els.championTopScorerAward.hidden = !topScorer;
      els.championTopScorerAward.style.display = topScorer ? "" : "none";
      if (topScorer) {
        const scorerTeam = teamById(topScorer.teamId);
        els.championTopScorerName.textContent = topScorer.player;
        els.championTopScorerFlag.innerHTML = flagMarkup(scorerTeam, "award-flag");
        els.championTopScorerTeam.textContent = scorerTeam.name;
        els.championTopScorerGoals.textContent = `${topScorer.goals} ${topScorer.goals === 1 ? "goal" : "goals"}`;
      }
      renderChampionPrediction(champion);
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
  els.snapshotButton.hidden = !revealed || Boolean(isLive);

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
  const rankedScorers = calculateGoalscorerTable().map((leader, index) => ({
    ...leader,
    goldenBootRank: index + 1,
  }));
  let leaders = rankedScorers.slice(0, 5);
  const championId = state.rounds[7]?.[0]?.result?.winnerId;
  const championLeader = championId
    ? rankedScorers.find((leader) => leader.teamId === championId)
    : null;
  if (championLeader && !leaders.some((leader) => leader.teamId === championId)) {
    leaders = [...leaders.slice(0, 4), championLeader];
  }
  if (!leaders.length) {
    els.goldenBootList.innerHTML = `
      <div class="golden-boot-empty">
        <span>01</span>
        <p>The race starts with the first goal.</p>
      </div>
    `;
    return;
  }

  els.goldenBootList.innerHTML = leaders.map((leader) => {
    const team = teamById(leader.teamId);
    return `
      <div class="golden-boot-row ${leader.goldenBootRank === 1 ? "leader" : ""}">
        <span class="golden-boot-rank">${leader.goldenBootRank}</span>
        <span class="golden-boot-player">
          <strong>${leader.player}</strong>
          <small>${flagMarkup(team, "golden-boot-flag")} ${team.name} · ${leader.matches} apps</small>
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
    chaos: ["Pure chaos", "anything can happen"],
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
  renderPredictionPicker();
  syncSoundToggle();
  document.body.classList.toggle("before-start", beforeStart);
  els.fieldOverview.hidden = !beforeStart;
  els.mainContent.hidden = beforeStart;

  if (beforeStart) {
    els.pageKicker.textContent = "256 TEAMS WC · NEW TOURNAMENT";
    els.pageTitle.textContent = "Choose your mode";
    syncLandingSettings();
    renderParticipantOverview(els.overviewSearch.value);
    renderProgress();
    return;
  }

  const roundName = ROUND_NAMES[state.activeRound];
  const historyMode = viewingRoundHistory();
  els.pageKicker.textContent = state.championView
    ? "TOURNAMENT COMPLETE"
    : historyMode ? "ROUND ARCHIVE" : "256 TEAMS WC KNOCKOUT";
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

function syncSoundToggle() {
  const enabled = state.settings.sound !== false;
  els.soundToggleButton.setAttribute("aria-pressed", String(enabled));
  els.soundToggleButton.title = enabled ? "Turn match sounds off" : "Turn match sounds on";
  els.soundToggleLabel.textContent = enabled ? "Sounds on" : "Sounds off";
}

function syncLandingSettings() {
  document.querySelectorAll(".landing-segmented").forEach((group) => {
    const setting = group.dataset.setting;
    group.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === state.settings[setting]);
    });
  });
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

els.snapshotButton.addEventListener("click", openSnapshotModal);
els.copySnapshotButton.addEventListener("click", copySnapshotImage);
els.shareSnapshotButton.addEventListener("click", shareSnapshotImage);
els.saveSnapshotButton.addEventListener("click", saveSnapshotImage);

els.soundToggleButton.addEventListener("click", () => {
  state.settings.sound = !state.settings.sound;
  saveState();
  syncSoundToggle();
  showToast(state.settings.sound ? "Match sounds on." : "Match sounds off.");
});

$("#fieldButton").addEventListener("click", () => {
  renderField();
  els.fieldModal.showModal();
});

els.predictionPickerButton.addEventListener("click", () => {
  if (state.started) {
    const progress = predictionProgress();
    showToast(progress ? `${progress.team.name} · ${progress.label}` : "Predictions lock when the tournament starts.");
    return;
  }
  els.predictionSearch.value = "";
  renderPredictionList();
  els.predictionModal.showModal();
  requestAnimationFrame(() => els.predictionSearch.focus());
});

els.predictionSearch.addEventListener("input", (event) => renderPredictionList(event.target.value));
els.predictionList.addEventListener("click", (event) => {
  const option = event.target.closest(".prediction-option");
  if (!option) return;
  state.predictionTeamId = option.dataset.teamId;
  saveState();
  renderPredictionPicker();
  els.predictionModal.close();
  showToast(`${teamById(state.predictionTeamId).name} is your champion prediction.`);
});
els.clearPredictionButton.addEventListener("click", () => {
  state.predictionTeamId = null;
  saveState();
  renderPredictionPicker();
  els.predictionModal.close();
  showToast("Champion prediction cleared.");
});

$("#newTournamentButton").addEventListener("click", () => els.resetModal.showModal());
$("#championReset").addEventListener("click", () => els.resetModal.showModal());
$("#confirmResetButton").addEventListener("click", () => {
  if (livePlayback) {
    clearMatchPenaltyAnimation();
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

document.querySelectorAll(".landing-segmented").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.settings[group.dataset.setting] = button.dataset.value;
    saveState();
  });
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
  const pick = state.predictionTeamId ? teamById(state.predictionTeamId) : null;
  showToast(pick ? `${pick.name} locked in. The draw is live.` : "The draw is live. Choose the opening tie.");
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
