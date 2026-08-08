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

document.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.closest(".country-flag")) {
    event.target.remove();
  }
}, true);

function clearRetroRouteLoadingState() {
  document.documentElement.classList.remove("route-retro-loading", "route-retro-2006-loading", "route-retro-2022-loading");
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/palestine-challenge" || pathname === "/profile" || pathname === "/player-career") return;

  document.body.classList.remove("challenge-mode-active", "profile-mode-active", "online-screen-open", "mobile-menu-open");
  if (els.appShell) {
    els.appShell.hidden = false;
    els.appShell.style.removeProperty("display");
  }
  if (els.appShell) els.appShell.style.removeProperty("display");
  closeOpenDialogsAndMenus();
}

function enforceModeScreenVisibility(mode = currentAppMode()) {
  const routedRetroYear = retroWorldCupYearFromPath();
  const retroSetupRouteActive = document.body.dataset.desktopModeSetup === "retro" && routedRetroYear;
  const activeRetroYear = Number(retroSetupRouteActive ? routedRetroYear : retroTournament?.year || routedRetroYear || readRetroWorldCupYear());
  const activeRetroIsWorldCup = [1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026].includes(activeRetroYear);
  const selectedPresentationYear = activeRetroIsWorldCup && !retroSetupRouteActive
    && document.documentElement.dataset.tournamentTheme !== "off"
    && MATCH_SCREEN_THEMES[document.documentElement.dataset.tournamentTheme]
    ? Number(document.documentElement.dataset.tournamentTheme)
    : activeRetroYear;
  const careerScreen = document.getElementById("playerCareerScreen");
  const premierLeagueScreen = document.getElementById("premierLeagueSeasonScreen");
  const uclScreen = document.getElementById("uclSimulatorScreen");
  const premierLeagueSharedMatchActive = state?.premierLeagueSeason === true;
  const uclSharedMatchActive = state?.uclSeason === true;
  if (premierLeagueScreen && mode !== "premierLeague" && !premierLeagueSharedMatchActive) premierLeagueScreen.hidden = true;
  if (uclScreen && mode !== "ucl" && !uclSharedMatchActive) uclScreen.hidden = true;
  const careerActive = mode === "career";
  document.body.classList.toggle("career-mode-active", careerActive);
  document.body.classList.toggle("standard-mode-active", mode === "standard");
  if (careerActive) {
    if (els.appShell) {
      els.appShell.style.setProperty("display", "none", "important");
      els.appShell.hidden = true;
    }
    if (els.retroWorldCupScreen) els.retroWorldCupScreen.hidden = true;
    if (careerScreen) careerScreen.hidden = false;
    document.body.classList.remove("retro-mode-active", "retro-1998-active", "retro-2002-active", "retro-2006-active", "retro-2010-active", "retro-euro-2016-active", "retro-euro-2020-active", "retro-2018-active", "retro-2022-active", "retro-copa-2024-active", "retro-2026-active");
    return;
  }
  if (careerScreen) careerScreen.hidden = true;
  if (els.newsButton) els.newsButton.hidden = false;
  if (mode !== "retro") {
    if (els.appShell) {
      els.appShell.style.removeProperty("display");
      els.appShell.hidden = false;
    }
    if (els.retroWorldCupScreen) {
      els.retroWorldCupScreen.hidden = true;
    }
    document.body.classList.remove("retro-mode-active", "retro-1998-active", "retro-2002-active", "retro-2006-active", "retro-2010-active", "retro-euro-2016-active", "retro-euro-2020-active", "retro-2018-active", "retro-2022-active", "retro-copa-2024-active", "retro-2026-active");
    return;
  }

  document.body.classList.add("retro-mode-active");
  document.body.classList.toggle("retro-1998-active", selectedPresentationYear === 1998);
  document.body.classList.toggle("retro-2002-active", selectedPresentationYear === 2002);
  document.body.classList.toggle("retro-2006-active", selectedPresentationYear === 2006);
  document.body.classList.toggle("retro-2010-active", selectedPresentationYear === 2010);
  document.body.classList.toggle("retro-euro-2016-active", selectedPresentationYear === 2016);
  document.body.classList.toggle("retro-euro-2020-active", activeRetroYear === 2020);
  document.body.classList.toggle("retro-2018-active", selectedPresentationYear === 2018);
  document.body.classList.toggle("retro-2022-active", selectedPresentationYear === 2022);
  document.body.classList.toggle("retro-copa-2024-active", activeRetroYear === 2024);
  document.body.classList.toggle("retro-2026-active", selectedPresentationYear === 2026);
  if (els.appShell) {
    els.appShell.style.setProperty("display", "none", "important");
    els.appShell.hidden = false;
  }
  if (els.retroWorldCupScreen) {
    els.retroWorldCupScreen.hidden = false;
  }
}

function forceUnlockStartupState() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const isChallengeRoute = pathname === "/palestine-challenge";
  const isProfileRoute = pathname === "/profile";
  const isCareerRoute = pathname === "/player-career";
  const mode = currentAppMode();
  const isChallengeMode = mode === "challenge" || isChallengeRoute;
  const isProfileMode = mode === "profile" || isProfileRoute;
  const isCareerMode = mode === "career" || isCareerRoute;
  const isOnlineMode = mode === "online";

  clearRetroRouteLoadingState();
  if (!isChallengeMode) document.body.classList.remove("challenge-mode-active");
  if (!isProfileMode) document.body.classList.remove("profile-mode-active");
  if (!isCareerMode) document.body.classList.remove("career-mode-active");
  if (mode !== "retro") document.body.classList.remove("retro-mode-active", "retro-1998-active", "retro-2002-active", "retro-2006-active", "retro-2010-active", "retro-euro-2016-active", "retro-euro-2020-active", "retro-2018-active", "retro-2022-active", "retro-copa-2024-active", "retro-2026-active");

  if (!isOnlineMode && document.body.classList.contains("online-screen-open")) {
    document.body.classList.remove("online-screen-open");
    closeOnlineScreen({ updateUrl: false, force: true });
  }
  if (!isChallengeMode && !isProfileMode && !isOnlineMode) {
    document.body.classList.remove("mobile-menu-open");
    if (els.menuBackdrop) els.menuBackdrop.hidden = true;
    if (els.menuButton) {
      els.menuButton.setAttribute("aria-expanded", "false");
      els.menuButton.setAttribute("aria-label", "Open rounds");
    }
    if (els.sidebar) els.sidebar.classList.remove("open");
    closeOpenDialogsAndMenus();
  }
  if (isChallengeMode || isProfileMode) return;
  if (isCareerMode) {
    enforceModeScreenVisibility("career");
    return;
  }
  if (els.retroWorldCupScreen) els.retroWorldCupScreen.hidden = true;
  if (els.appShell) {
    if (mode === "retro") {
      els.appShell.style.removeProperty("display");
    } else if (document.body.dataset.desktopModeSetup === "standard") {
      els.appShell.style.setProperty("display", "block", "important");
    } else {
      els.appShell.style.setProperty("display", "grid", "important");
    }
    els.appShell.hidden = false;
  }
  enforceModeScreenVisibility(document.body.dataset.desktopModeSetup ? "home" : mode);
}

function startStartupUnfreezeWatchdog() {
  if (window.__retroStartupUnfreezeWatchdog) return;
  let attempts = 28;
  window.__retroStartupUnfreezeWatchdog = window.setInterval(() => {
    if (!startupRecoveryNeeded()) {
      window.clearInterval(window.__retroStartupUnfreezeWatchdog);
      window.__retroStartupUnfreezeWatchdog = null;
      return;
    }
    forceUnlockStartupState();
    clearRetroRouteLoadingState();
    enforceModeScreenVisibility();
    if (--attempts <= 0) {
      window.clearInterval(window.__retroStartupUnfreezeWatchdog);
      window.__retroStartupUnfreezeWatchdog = null;
    }
  }, 120);
}

function startupRecoveryNeeded() {
  if (document.body.dataset.desktopModeSetup) return false;
  if (document.documentElement.classList.contains("route-retro-loading")
    || document.documentElement.classList.contains("route-retro-2006-loading")
    || document.documentElement.classList.contains("route-retro-2022-loading")) {
    return true;
  }
  if (currentAppMode() !== "retro") return false;
  return els.retroWorldCupScreen?.hidden !== false
    || getComputedStyle(els.appShell).display !== "none";
}

function closeOpenDialogsAndMenus() {
  document.querySelectorAll("dialog[open]").forEach((dialog) => {
    try {
      dialog.close();
    } catch {
      dialog.open = false;
    }
  });
  if (els.menuBackdrop) els.menuBackdrop.hidden = true;
  if (els.menuButton) els.menuButton.setAttribute("aria-expanded", "false");
}

function recoverFromStartupError(error, context = "startup") {
  if (hasBootErrorRecovery) return;
  hasBootErrorRecovery = true;
  console.error(`[APP ${context.toUpperCase()} ERROR]`, error);

  clearRetroRouteLoadingState();
  closeOpenDialogsAndMenus();
  forceUnlockStartupState();
  stopStandardPlaybackForNavigation();
  closeOnlineScreen({ updateUrl: false, force: true });
  stopOnlineRoomPolling();
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();

  document.body.classList.remove(
    "retro-mode-active", "retro-1998-active", "retro-2002-active", "retro-2006-active", "retro-2010-active", "retro-euro-2016-active", "retro-euro-2020-active", "retro-2018-active", "retro-2022-active", "retro-copa-2024-active", "retro-2026-active",
    "legacy-mode-active", "achievements-mode-active", "online-screen-open",
    "challenge-mode-active", "profile-mode-active", "career-mode-active", "mobile-menu-open",
  );
  const careerScreen = document.getElementById("playerCareerScreen");
  if (careerScreen) careerScreen.hidden = true;
  if (els.retroWorldCupScreen) els.retroWorldCupScreen.hidden = true;
  if (els.onlineRoomScreen) els.onlineRoomScreen.hidden = true;
  if (els.achievementsScreen) els.achievementsScreen.hidden = true;
  if (els.customTournamentScreen) els.customTournamentScreen.hidden = true;
  if (els.customMatchScreen) els.customMatchScreen.hidden = true;
  if (els.legacyDraftScreen) els.legacyDraftScreen.hidden = true;
  if (els.mainContent) els.mainContent.hidden = false;
  if (els.fieldOverview) els.fieldOverview.hidden = false;
  if (els.pageHeading) els.pageHeading.hidden = false;
  if (els.pageKicker) els.pageKicker.textContent = "256 TEAMS WC · NEW TOURNAMENT";
  if (els.pageTitle) els.pageTitle.textContent = "Choose your mode";
  if (els.appShell) {
    els.appShell.hidden = false;
    els.appShell.style.removeProperty("display");
  }
  enforceModeScreenVisibility();

  retroTournament = null;
  retroSimulatorState = null;
  retroTournamentView = "matches";
  retroBottomGroupsVisible = false;
  retroBottomGroupMatchesVisible = false;
  retroSelectedMatchId = null;
  retroSquadTeamName = "Brazil";
  state = standardTournamentState || createInitialState();

  try {
    setAppModeUrl("home", { replace: true });
  } catch (fallbackError) {
    console.error("[APP STARTUP FALLBACK ERROR]", fallbackError);
  }
  if (typeof syncLandingSettings === "function") syncLandingSettings();
  if (typeof syncRetroWorldCupCardAction === "function") syncRetroWorldCupCardAction(readRetroWorldCupYear());
  if (typeof saveRetroTournamentState === "function") saveRetroTournamentState();
  if (typeof restoreSharedMainContent === "function") restoreSharedMainContent();
  try {
    render();
  } catch (fallbackRenderError) {
    console.error("[APP STARTUP RENDER ERROR]", fallbackRenderError);
  }
}

const DEFAULT_FIXTURE_LIMIT = 24;
let fixtureLimit = DEFAULT_FIXTURE_LIMIT;
let filterUnresolved = false;
let toastTimer;
let searchPopover;
let teamFilterId = null;
let teamFilterReturn = null;
let livePlayback = null;
let match2dState = null;
const matchPresentationCache = new Map();
let spectatePickerMode = "all";
let uclMenuTeamId = readUclMenuTeamId();
let premierLeagueMenuSetup = readPremierLeagueMenuSetup();
let premierLeagueAssetAccount = undefined;
let premierLeagueAssetsInstalled = false;
let premierLeagueAssetInstallBusy = false;
let uclAssetAccount = undefined;
let uclAssetsInstalled = false;
let uclAssetInstallBusy = false;
let retroTournament = readRetroTournamentState();

function desktopModeSetupEnabled() {
  return window.matchMedia?.("(min-width: 721px)").matches === true;
}

function modeSetupRouteEnabled(mode) {
  return mode === "standard" || desktopModeSetupEnabled();
}

function openDesktopModeSetup(mode) {
  if (!modeSetupRouteEnabled(mode)) return false;
  document.body.dataset.desktopModeSetup = mode;
  setAppModeUrl(mode);
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
  return true;
}

function closeDesktopModeSetup() {
  delete document.body.dataset.desktopModeSetup;
  restoreRetroRouteSetupControls();
  restoreClubRouteSetupControls();
  els.appShell?.style.removeProperty("display");
}

window.desktopModeSetupEnabled = desktopModeSetupEnabled;
window.modeSetupRouteEnabled = modeSetupRouteEnabled;
window.openDesktopModeSetup = openDesktopModeSetup;
window.closeDesktopModeSetup = closeDesktopModeSetup;
let retroMenuSettings = readRetroWorldCupSettings();
let retroTournamentView = "matches";
let retroBottomGroupsVisible = false;
let retroBottomGroupMatchesVisible = false;
let retroSelectedMatchId = null;
let retroSquadTeamName = retroTournament?.managedTeam || "Brazil";
let onlineRoomSession = readOnlineRoomSession();
let onlineMatchmakingSession = readOnlineMatchmakingSession();
let onlineRoomPollTimer = null;
let onlineRoomRefreshPromise = null;
let onlineRoomBusy = false;
let onlineMatchmakingBusy = false;
let onlineMatchmakingPollTimer = null;
let onlineMatchmakingRefreshPromise = null;
let onlineInviteAutoJoinAttempted = false;
let latestOnlineRoom = null;
let onlineRoomStateVersion = 0;
let onlineLastSeenEventId = 0;
const onlineRoomEvents = new Map();
let onlineViewedMatchId = null;
let onlineMatchSelectionManual = false;
let onlineSpectatingMemberId = null;
let onlineViewedMatchSyncTimer = null;
let onlineLastSyncedViewedMatchId = null;
let onlineMatchPlayback = null;
let onlineMatchPlaybackTimer = null;
let onlineLivePresentation = null;
let onlineLivePresentationTimer = null;
let onlineServerOffsetMs = 0;
let onlineServerOffsetReady = false;
let onlineDisplayedRoundNumber = null;
let onlineResultsActiveTab = "standings";
let onlineResultsOpeningRound = 1;
let onlineRoundScoreTimer = null;
let onlineOtherMatchFilter = "friends";
const onlinePlayedMatchIds = new Set();
const onlineFinishedPlaybackIds = new Set();
const onlineReadyWaitingNotifications = new Set();
let onlineHistoryRoomCode = null;
let onlineAdvanceQueuedRoundNumber = null;
let onlinePenaltyAnimation = null;
let onlineObservedPenaltyPlaybackRunning = false;
const onlineObservedPenaltyQueue = [];
const onlineObservedPenaltyIds = new Set();
let onlinePenaltyTester = null;
let onlineDraftRunning = false;
let onlineDraftRunId = 0;
const savedMatchSpeed = Number(localStorage.getItem(MATCH_SPEED_STORAGE_KEY));
let preferredMatchSpeed = [1, 1.5, 2, 3, 5].includes(savedMatchSpeed) ? savedMatchSpeed : null;
let preferredHighlightMode = MATCH_HIGHLIGHT_MODES.includes(localStorage.getItem(MATCH_HIGHLIGHT_MODE_STORAGE_KEY))
  ? localStorage.getItem(MATCH_HIGHLIGHT_MODE_STORAGE_KEY)
  : "key";
const MATCH_SOUND_PATHS = {
  penaltyWhistle: "./assets/audio/penalty-whistle.mp3",
  fullTimeWhistle: "./assets/audio/full-time-whistle.mp3",
};
const MATCH_SOUND_STORAGE_KEY = "matchSoundsEnabled";
const MATCH_WHISTLE_COOLDOWN_MS = 1400;
const activeMatchSounds = new Set();
let matchSoundsEnabled = localStorage.getItem(MATCH_SOUND_STORAGE_KEY) === null
  ? null
  : localStorage.getItem(MATCH_SOUND_STORAGE_KEY) === "true";
let lastMatchWhistleAt = 0;
let hasBootErrorRecovery = false;

function restoreOnlineMatchHistory(roomCode) {
  if (!roomCode || onlineHistoryRoomCode === roomCode) return;
  onlineHistoryRoomCode = roomCode;
  onlineViewedMatchId = null;
  onlineMatchSelectionManual = false;
  onlineSpectatingMemberId = null;
  onlineLastSyncedViewedMatchId = null;
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();
  clearTimeout(onlineViewedMatchSyncTimer);
  onlineViewedMatchSyncTimer = null;
  onlinePlayedMatchIds.clear();
  onlineFinishedPlaybackIds.clear();
  try {
    const history = JSON.parse(sessionStorage.getItem(`world-256-online-watched-${roomCode}`) || "null");
    (history?.played || []).filter((id) => typeof id === "string").forEach((id) => onlinePlayedMatchIds.add(id));
    (history?.finished || []).filter((id) => typeof id === "string").forEach((id) => onlineFinishedPlaybackIds.add(id));
  } catch {
    // A blocked or malformed session store should not stop the room from working.
  }
}

function saveOnlineMatchHistory() {
  if (!onlineHistoryRoomCode) return;
  try {
    sessionStorage.setItem(`world-256-online-watched-${onlineHistoryRoomCode}`, JSON.stringify({
      played: [...onlinePlayedMatchIds],
      finished: [...onlineFinishedPlaybackIds],
    }));
  } catch {
    // Playback still works when private session storage is unavailable.
  }
}

function readOnlineRoomSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(ONLINE_ROOM_SESSION_KEY) || "null");
    if (!session || !/^(?:\d{4}|[A-HJ-NP-Z2-9]{6})$/.test(session.code) || !/^[A-Za-z0-9_-]{43}$/.test(session.token)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveOnlineRoomSession(session) {
  if (session?.code !== onlineRoomSession?.code) {
    onlineRoomStateVersion = 0;
    onlineLastSeenEventId = 0;
    onlineRoomEvents.clear();
    latestOnlineRoom = null;
    onlineServerOffsetMs = 0;
    onlineServerOffsetReady = false;
  }
  onlineRoomSession = session;
  try {
    if (session) sessionStorage.setItem(ONLINE_ROOM_SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(ONLINE_ROOM_SESSION_KEY);
  } catch {
    // The room still works for this page even when private storage is unavailable.
  }
  syncOnlineRoomCard();
}

function readOnlineMatchmakingSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(ONLINE_MATCHMAKING_SESSION_KEY) || "null");
    if (
      !session
      || !/^[A-Za-z0-9_-]{16}$/.test(session.ticketId || "")
      || !/^[A-Za-z0-9_-]{43}$/.test(session.token || "")
    ) return null;
    return session;
  } catch {
    return null;
  }
}

function saveOnlineMatchmakingSession(session) {
  onlineMatchmakingSession = session;
  try {
    if (session) sessionStorage.setItem(ONLINE_MATCHMAKING_SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(ONLINE_MATCHMAKING_SESSION_KEY);
  } catch {
    // The active search remains usable while this page is open.
  }
  renderOnlineMatchmakingState();
}

function syncOnlineRoomCard() {
  const enabled = onlineModeAvailableLocally();
  els.onlineModeActions.hidden = !enabled;
  els.onlineModeActions.classList.toggle("has-active-room", enabled && Boolean(onlineRoomSession));
  els.joinOnlineRoomButton.hidden = !enabled;
}

function onlineModeAvailableLocally() {
  return ONLINE_PARTY_MODE_ENABLED;
}

function configureOnlineModeAvailability() {
  if (els.onlineModeStatus) {
    els.onlineModeStatus.textContent = "Online knockout";
    els.onlineModeStatus.classList.add("mode-status-online");
  }
  els.onlineModeCopy.textContent = "Match with other players or create a private knockout room, then draft your countries and play every match in real time.";
  syncOnlineRoomCard();
}

const APP_MODE_PATHS = Object.freeze({
  home: "/",
  achievements: "/achievements",
  custom: "/custom-tournament",
  customMatch: "/custom-matches",
  challenge: "/palestine-challenge",
  career: "/player-career",
  standard: "/default-mode",
  legacy: "/draft-mode",
  retro: "/retro-world-cup",
  online: "/online-mode",
  premierLeague: "/pl-simulator",
  ucl: "/ucl-simulator",
});

function savedTournamentIdFromPath() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const match = pathname.match(/^\/saved-tournaments\/([A-Za-z0-9-]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function savedTournamentPath(recordId) {
  return `/saved-tournaments/${encodeURIComponent(recordId)}`;
}

function retroWorldCupYearFromPath() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return Object.entries(RETRO_WORLD_CUP_PATHS).find(([, path]) => path === pathname)?.[0] || null;
}

function currentAppMode() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (savedTournamentIdFromPath() && activeTournamentHistoryRecord?.mode === "retro") return "retro";
  if (retroWorldCupYearFromPath()) return "retro";
  const pathMode = Object.entries(APP_MODE_PATHS).find(([, path]) => path === pathname)?.[0];
  if (pathMode) return pathMode;
  const legacyQueryMode = new URLSearchParams(window.location.search).get("mode");
  return legacyQueryMode === "online" || legacyQueryMode === "standard" || legacyQueryMode === "legacy" || legacyQueryMode === "retro"
    ? legacyQueryMode
    : "home";
}

function setAppModeUrl(mode, { replace = false } = {}) {
  const url = new URL(window.location.href);
  const selectedMode = Object.hasOwn(APP_MODE_PATHS, mode) ? mode : "home";
  const retroYear = String(retroTournament?.year || selectedRetroTournamentYear());
  url.pathname = selectedMode === "retro"
    ? RETRO_WORLD_CUP_PATHS[retroYear] || RETRO_WORLD_CUP_PATHS[2014]
    : APP_MODE_PATHS[selectedMode];
  url.searchParams.delete("mode");
  if (selectedMode !== "online") url.searchParams.delete("room");
  if (mode !== "standard") url.searchParams.delete("legacyTournament");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const nextState = { ...(window.history.state || {}), appMode: selectedMode };
  window.history[replace ? "replaceState" : "pushState"](nextState, "", nextUrl);
}
