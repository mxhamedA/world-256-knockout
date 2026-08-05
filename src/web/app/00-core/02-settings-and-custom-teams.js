function syncOnlinePenaltyControlSlot() {
  els.onlineCurrentMatch?.classList.toggle("has-penalty-control", Boolean(els.onlinePenaltyControl && !els.onlinePenaltyControl.hidden));
}

if (typeof MutationObserver !== "undefined" && els.onlinePenaltyControl) {
  new MutationObserver(syncOnlinePenaltyControlSlot).observe(els.onlinePenaltyControl, {
    attributes: true,
    attributeFilter: ["hidden"],
  });
  syncOnlinePenaltyControlSlot();
}

let postWinDonationTimer = null;
const postWinDonationEvaluatedThisPage = new Set();

function readPostWinDonationState() {
  try {
    const saved = JSON.parse(localStorage.getItem(POST_WIN_DONATION_STORAGE_KEY) || "null");
    return {
      lastShownAt: Number(saved?.lastShownAt) || 0,
      evaluated: Array.isArray(saved?.evaluated)
        ? saved.evaluated.filter((value) => typeof value === "string").slice(-40)
        : [],
    };
  } catch {
    return { lastShownAt: 0, evaluated: [] };
  }
}

function writePostWinDonationState(nextState) {
  try {
    localStorage.setItem(POST_WIN_DONATION_STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // The in-page evaluation still prevents duplicate prompts during this visit.
  }
}

function maybeShowPostWinDonation(tournamentKey) {
  const key = typeof tournamentKey === "string" ? tournamentKey.trim() : "";
  if (!key || !els.donateModal) return false;
  if (postWinDonationEvaluatedThisPage.has(key)) return false;
  postWinDonationEvaluatedThisPage.add(key);
  const promptState = readPostWinDonationState();
  if (promptState.evaluated.includes(key)) return false;
  promptState.evaluated = [...promptState.evaluated, key].slice(-40);
  writePostWinDonationState(promptState);
  if (Date.now() - promptState.lastShownAt < POST_WIN_DONATION_COOLDOWN_MS) return false;
  if (Math.random() >= POST_WIN_DONATION_CHANCE) return false;

  clearTimeout(postWinDonationTimer);
  let remainingChecks = 20;
  const openWhenReady = () => {
    const anotherDialogIsOpen = [...document.querySelectorAll("dialog[open]")].some((dialog) => (
      dialog !== els.donateModal
    ));
    if ((anotherDialogIsOpen || document.visibilityState === "hidden") && remainingChecks > 0) {
      remainingChecks -= 1;
      postWinDonationTimer = window.setTimeout(openWhenReady, 500);
      return;
    }
    if (anotherDialogIsOpen || document.visibilityState === "hidden" || els.donateModal.open) {
      postWinDonationTimer = null;
      return;
    }
    promptState.lastShownAt = Date.now();
    writePostWinDonationState(promptState);
    postWinDonationTimer = null;
    els.donateModal.showModal();
  };
  postWinDonationTimer = window.setTimeout(openWhenReady, 1800);
  return true;
}

window.maybeShowPostWinDonation = maybeShowPostWinDonation;

const defaultKeybinds = Object.freeze({
  enabled: true,
  nextMatch: "Enter",
  pauseResume: " ",
  skipToFullTime: "Enter",
  restartTournament: "r",
});

const keybindLabels = Object.freeze({
  " ": "Space",
  Escape: "Esc",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
});

const defaultSettings = {
  upset: "balanced",
  goals: "normal",
  realNames: true,
  realPlayersOnly: true,
  sound: true,
  removeInjuries: false,
  keybinds: { ...defaultKeybinds },
};

function normalizedKeybindKey(key) {
  if (typeof key !== "string" || !key) return "";
  return key.length === 1 && key !== " " ? key.toLowerCase() : key;
}

function keybindDisplayName(key) {
  const normalized = normalizedKeybindKey(key);
  return keybindLabels[normalized] || (normalized.length === 1 ? normalized.toUpperCase() : normalized);
}

function normalizeKeybindSettings(settings = {}) {
  const saved = settings.keybinds || {};
  return {
    enabled: saved.enabled !== false,
    nextMatch: normalizedKeybindKey(saved.nextMatch) || defaultKeybinds.nextMatch,
    pauseResume: normalizedKeybindKey(saved.pauseResume) || defaultKeybinds.pauseResume,
    skipToFullTime: normalizedKeybindKey(saved.skipToFullTime) || defaultKeybinds.skipToFullTime,
    restartTournament: normalizedKeybindKey(saved.restartTournament) || defaultKeybinds.restartTournament,
  };
}

function normalizeSettings(settings = {}) {
  return {
    ...defaultSettings,
    ...settings,
    realNames: true,
    removeInjuries: localStorage.getItem(REMOVE_INJURIES_STORAGE_KEY) === null
      ? settings.removeInjuries === true
      : localStorage.getItem(REMOVE_INJURIES_STORAGE_KEY) === "true",
    keybinds: normalizeKeybindSettings(settings),
  };
}

const FICTIONAL_PLAYER_NAMES = new Set(["The Conspiracy"]);

const TEAM_BY_ID = new Map(TEAMS.map((team) => [team.id, team]));

function sanitizeCustomPlayer(player, index = 0) {
  const position = String(player?.position || "CM").toUpperCase();
  const allowedPositions = new Set(["GK", "LB", "LWB", "CB", "RB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"]);
  const rating = (key, fallback) => simulationClamp(Math.round(Number(player?.[key]) || fallback), 1, 99);
  const overall = rating("overall", 75);
  return {
    name: String(player?.name || `Player ${index + 1}`).trim().slice(0, 50) || `Player ${index + 1}`,
    position: allowedPositions.has(position) ? position : "CM",
    overall,
    finishing: rating("finishing", position === "GK" ? 5 : overall),
    pace: rating("pace", overall),
    shooting: rating("shooting", position === "GK" ? 5 : overall),
    passing: rating("passing", overall),
    dribbling: rating("dribbling", overall),
    defending: rating("defending", overall),
    physical: rating("physical", overall),
    goalkeeping: rating("goalkeeping", position === "GK" ? overall : 5),
    penaltyTaker: player?.penaltyTaker === true,
    startingXI: player?.startingXI === true,
    simulatorRating: true,
  };
}

function customPlayersWithValidStartingXI(players) {
  if (players.filter((player) => player.startingXI).length === 11) return players;
  const ranked = players
    .map((player, index) => ({ player, index }))
    .sort((left, right) => right.player.overall - left.player.overall || left.index - right.index);
  const goalkeeper = ranked.find(({ player }) => player.position === "GK");
  const selected = new Set();
  if (goalkeeper) selected.add(goalkeeper.index);
  ranked
    .filter(({ player, index }) => !selected.has(index) && (selected.size >= 11 || player.position !== "GK"))
    .slice(0, 11 - selected.size)
    .forEach(({ index }) => selected.add(index));
  if (selected.size < Math.min(11, players.length)) {
    ranked
      .filter(({ index }) => !selected.has(index))
      .slice(0, 11 - selected.size)
      .forEach(({ index }) => selected.add(index));
  }
  return players.map((player, index) => ({ ...player, startingXI: selected.has(index) }));
}

const CUSTOM_TEAM_IMAGE_INPUT_MAX_BYTES = 25_000_000;
const CUSTOM_TEAM_IMAGE_DATA_URL_TARGET = 140_000;
const CUSTOM_TEAM_IMAGE_DATA_URL_HARD_LIMIT = 2_500_000;

function sanitizeCustomTeam(team) {
  const id = String(team?.id || "");
  if (!/^custom-[a-z0-9-]{6,80}$/.test(id)) return null;
  const name = String(team?.name || "").trim().slice(0, 50);
  if (!name) return null;
  const clampRating = (key, fallback = 75) => simulationClamp(Math.round(Number(team?.simulationRatings?.[key]) || fallback), 1, 99);
  const overall = clampRating("overall");
  const players = customPlayersWithValidStartingXI(Array.isArray(team?.playerProfiles)
    ? team.playerProfiles.slice(0, 26).map(sanitizeCustomPlayer)
    : []);
  const customFlag = typeof team?.customFlag === "string"
    && team.customFlag.length <= CUSTOM_TEAM_IMAGE_DATA_URL_HARD_LIMIT
    && /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,/i.test(team.customFlag)
    ? team.customFlag
    : "";
  const customFlagShape = team?.customFlagShape === "square" ? "square" : "flag";
  return {
    id,
    name,
    code: "XX",
    flag: String(team?.flag || "⚑").slice(0, 4),
    confed: "CUSTOM",
    customTeam: true,
    customFlag,
    customFlagShape,
    rating: overall,
    strength: overall,
    simulationRatings: {
      overall,
      attack: clampRating("attack", overall),
      midfield: clampRating("midfield", overall),
      defence: clampRating("defence", overall),
      goalkeeper: clampRating("goalkeeper", overall),
      squadDepth: clampRating("squadDepth", overall),
      experience: clampRating("experience", overall),
      penalties: clampRating("penalties", overall),
      discipline: clampRating("discipline", 70),
    },
    players: players.map((player) => player.name),
    playerProfiles: players,
    nameCulture: "british",
    accountSaved: team?.accountSaved === true,
  };
}

function readCustomTeamLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_TEAM_LIBRARY_KEY));
    return Array.isArray(saved) ? saved.map(sanitizeCustomTeam).filter(Boolean) : [];
  } catch {
    return [];
  }
}

const CUSTOM_PREMIER_LEAGUE_TEAMS = Object.freeze(
  Array.isArray(window.PREMIER_LEAGUE_2026_27_CLUBS) ? [...window.PREMIER_LEAGUE_2026_27_CLUBS] : [],
);
CUSTOM_PREMIER_LEAGUE_TEAMS.forEach((team) => TEAM_BY_ID.set(team.id, team));

let customTeamLibrary = readCustomTeamLibrary();
customTeamLibrary.forEach((team) => TEAM_BY_ID.set(team.id, team));

let customTeamFlagDatabasePromise = null;
let customTeamFlagIndexedDbReady = false;
let customTeamFlagIndexedDbUnavailable = false;

function openCustomTeamFlagDatabase() {
  if (customTeamFlagDatabasePromise) return customTeamFlagDatabasePromise;
  customTeamFlagDatabasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB is unavailable."));
    const request = window.indexedDB.open(CUSTOM_TEAM_FLAG_DATABASE_NAME, CUSTOM_TEAM_FLAG_DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(CUSTOM_TEAM_FLAG_OBJECT_STORE)) {
        request.result.createObjectStore(CUSTOM_TEAM_FLAG_OBJECT_STORE, { keyPath: "teamId" });
      }
    };
    request.onsuccess = () => {
      customTeamFlagIndexedDbReady = true;
      customTeamFlagIndexedDbUnavailable = false;
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || new Error("Could not open custom-team image storage."));
    request.onblocked = () => reject(new Error("Custom-team image storage is blocked."));
  }).catch((error) => {
    customTeamFlagDatabasePromise = null;
    customTeamFlagIndexedDbUnavailable = true;
    throw error;
  });
  return customTeamFlagDatabasePromise;
}

async function writeCustomTeamFlagAsset(teamId, dataUrl) {
  if (!dataUrl) return false;
  try {
    const database = await openCustomTeamFlagDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(CUSTOM_TEAM_FLAG_OBJECT_STORE, "readwrite");
      transaction.objectStore(CUSTOM_TEAM_FLAG_OBJECT_STORE).put({ teamId, dataUrl });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Could not save the custom-team image."));
      transaction.onabort = () => reject(transaction.error || new Error("Custom-team image storage was aborted."));
    });
    return true;
  } catch {
    customTeamFlagIndexedDbUnavailable = true;
    return false;
  }
}

async function readCustomTeamFlagAsset(teamId) {
  try {
    const database = await openCustomTeamFlagDatabase();
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(CUSTOM_TEAM_FLAG_OBJECT_STORE, "readonly");
      const request = transaction.objectStore(CUSTOM_TEAM_FLAG_OBJECT_STORE).get(teamId);
      request.onsuccess = () => resolve(typeof request.result?.dataUrl === "string" ? request.result.dataUrl : "");
      request.onerror = () => reject(request.error || new Error("Could not read the custom-team image."));
    });
  } catch {
    return "";
  }
}

async function deleteCustomTeamFlagAsset(teamId) {
  try {
    const database = await openCustomTeamFlagDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(CUSTOM_TEAM_FLAG_OBJECT_STORE, "readwrite");
      transaction.objectStore(CUSTOM_TEAM_FLAG_OBJECT_STORE).delete(teamId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("Could not remove the custom-team image."));
    });
  } catch {
    // The lightweight local record can still be removed if image storage is unavailable.
  }
}

function saveCustomTeamLibrary() {
  const storedTeams = customTeamLibrary.map((team) => {
    if (!customTeamFlagIndexedDbReady || customTeamFlagIndexedDbUnavailable) return team;
    const { customFlag, ...metadata } = team;
    return metadata;
  });
  localStorage.setItem(CUSTOM_TEAM_LIBRARY_KEY, JSON.stringify(storedTeams));
}

async function hydrateCustomTeamFlagAssets() {
  try {
    await openCustomTeamFlagDatabase();
    const hydratedTeams = await Promise.all(customTeamLibrary.map(async (team) => {
      if (team.customFlag) {
        await writeCustomTeamFlagAsset(team.id, team.customFlag);
        return team;
      }
      const customFlag = await readCustomTeamFlagAsset(team.id);
      return customFlag ? { ...team, customFlag } : team;
    }));
    customTeamLibrary = hydratedTeams;
    customTeamLibrary.forEach((team) => TEAM_BY_ID.set(team.id, team));
    saveCustomTeamLibrary();
    if (els.customTournamentScreen && !els.customTournamentScreen.hidden) renderCustomTournamentSetup();
    if (els.customMatchScreen && !els.customMatchScreen.hidden) renderCustomMatchSetup();
  } catch {
    customTeamFlagIndexedDbUnavailable = true;
  }
}

setTimeout(() => void hydrateCustomTeamFlagAssets(), 0);

let customTeamAccount = null;

async function syncAccountCustomTeams() {
  const accountId = customTeamAccount?.id;
  if (!accountId) return;
  try {
    const response = await fetch("/api/challenge/custom-teams", { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Account teams could not be loaded.");
    if (customTeamAccount?.id !== accountId) return;
    const remoteTeams = (Array.isArray(payload.teams) ? payload.teams : [])
      .map((team) => sanitizeCustomTeam({ ...team, accountSaved: true }))
      .filter(Boolean);
    await Promise.all(remoteTeams.map((team) => writeCustomTeamFlagAsset(team.id, team.customFlag)));
    remoteTeams.forEach((team) => {
      const existingIndex = customTeamLibrary.findIndex((candidate) => candidate.id === team.id);
      if (existingIndex >= 0) customTeamLibrary[existingIndex] = team;
      else customTeamLibrary.push(team);
      TEAM_BY_ID.set(team.id, team);
    });
    saveCustomTeamLibrary();
    if (els.customTournamentScreen && !els.customTournamentScreen.hidden) renderCustomTournamentSetup();
    if (els.customMatchScreen && !els.customMatchScreen.hidden) renderCustomMatchSetup();
  } catch (error) {
    console.warn("Custom account teams could not be synced.", error instanceof Error ? error.message : error);
  }
}

function setCustomTeamAccount(account) {
  customTeamAccount = account || null;
  if (customTeamAccount) void syncAccountCustomTeams();
  if (customTournamentUi?.teamCreatorOpen) renderCustomTournamentSetup();
}

async function saveCustomTeamToAccount(team) {
  const response = await fetch("/api/challenge/custom-teams", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ team }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "This team could not be saved to your account.");
  return sanitizeCustomTeam({ ...payload.team, accountSaved: true });
}

async function removeCustomTeamFromAccount(teamId) {
  const response = await fetch(`/api/challenge/custom-teams/${encodeURIComponent(teamId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "This team could not be removed from your account.");
}
