
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  if (activeTournamentHistoryRecord) {
    closeTournamentHistory();
    return;
  }
  setMobileMenu(false);
  stopStandardPlaybackForNavigation();
  setAppModeUrl("home", { replace: true });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function stopStandardPlaybackForNavigation() {
  if (!livePlayback) return;
  clearMatchPenaltyAnimation();
  livePlayback.presentationScheduler?.clear("navigation");
  clearTimeout(livePlayback._goalFlashTimer);
  livePlayback.matchPenaltyTimers?.forEach((timer) => clearTimeout(timer));
  if (match2dState?.eventTimer) clearTimeout(match2dState.eventTimer);
  match2dState = null;
  cancelAnimationFrame(livePlayback.frame);
  clearTimeout(livePlayback.finishTimer);
  clearTimeout(livePlayback.penaltyTimer);
  if (els.matchCommentaryFeed) {
    els.matchCommentaryFeed.replaceChildren();
    els.matchCommentaryFeed.removeAttribute("style");
    els.matchCommentaryFeed.classList.remove("is-goal", "is-major", "is-goal-flashing");
  }
  livePlayback = null;
}

const menuButton = $("#menuButton");
const menuBackdrop = $("#menuBackdrop");

function setMobileMenu(open) {
  const shouldOpen = Boolean(open && window.matchMedia("(max-width: 850px)").matches);
  els.sidebar.classList.toggle("open", shouldOpen);
  menuBackdrop.hidden = !shouldOpen;
  menuButton.setAttribute("aria-expanded", String(shouldOpen));
  menuButton.setAttribute("aria-label", shouldOpen ? "Close rounds" : "Open rounds");
  document.body.classList.toggle("mobile-menu-open", shouldOpen);
}

menuButton.addEventListener("click", () => setMobileMenu(!els.sidebar.classList.contains("open")));
menuBackdrop.addEventListener("click", () => setMobileMenu(false));
window.addEventListener("resize", () => {
  if (window.innerWidth > 850) setMobileMenu(false);
});
$("#fullscreenButton").addEventListener("click", async () => {
  try {
    els.settingsModal.close();
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    showToast("Fullscreen is not available in this browser.");
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && activeTournamentHistoryRecord) {
    event.preventDefault();
    closeTournamentHistory();
    return;
  }
  if (captureKeybindShortcut(event)) return;
  if (confirmOpenDialogShortcut(event)) return;
  if (event.key === "Escape") setMobileMenu(false);
  runKeybindShortcut(event);
});

function setupMobileModeCards() {
  const descriptions = [
    ["mode-card-career-player", "Coming soon · Build your player"],
    ["mode-card-career-manager", "Coming soon · Lead your club"],
    ["mode-card-retro", "World Cups, Euros & Copa"],
    ["mode-card-premier-league", "League season"],
    ["mode-card-default", "256-team knockout"],
    ["mode-card-ucl", "League phase & knockouts"],
    ["mode-card-custom", "Build your own"],
    ["mode-card-legacy", "Classic squads"],
    ["mode-card-online", "Private multiplayer"],
    ["mode-card-challenge", "Timed tournament challenge"],
  ];
  const cards = [...document.querySelectorAll(".mode-grid > .mode-card:not([data-desktop-only-mode])")];

  const syncToggle = (card) => {
    const toggle = card.querySelector(":scope > .mode-card-mobile-toggle");
    if (!toggle) return;
    const heading = card.querySelector(".mode-card-copy h3");
    const primaryAction = card.querySelector(":scope > .mode-card-actions .start-tournament, :scope > .online-mode-actions .start-tournament");
    const title = heading?.textContent?.trim() || "Tournament mode";
    const baseDescription = descriptions.find(([className]) => card.classList.contains(className))?.[1]
      || "Tournament mode";
    const titleNode = toggle.querySelector(".mode-card-mobile-title");
    const descriptionNode = toggle.querySelector(".mode-card-mobile-description");
    const artwork = toggle.querySelector(".mode-card-mobile-artwork img");
    const artworkSource = card.classList.contains("mode-card-retro")
      ? card.querySelector("#retroWorldCupLogo")?.getAttribute("src")
      : card.classList.contains("mode-card-premier-league")
        ? "./assets/prem-logo.webp"
        : card.classList.contains("mode-card-ucl")
          ? "./assets/ucl-starball-white.png"
          : card.classList.contains("mode-card-default")
            ? "./assets/256-teams-icon.svg"
            : null;
    const description = /resume/i.test(primaryAction?.textContent || "")
      ? `Resume available · ${baseDescription}`
      : baseDescription;
    if (titleNode.textContent !== title) titleNode.textContent = title;
    if (descriptionNode.textContent !== description) descriptionNode.textContent = description;
    if (artworkSource && artwork.getAttribute("src") !== artworkSource) artwork.setAttribute("src", artworkSource);
    if (artwork.hidden === Boolean(artworkSource)) artwork.hidden = !artworkSource;
    toggle.setAttribute("aria-label", `${card.classList.contains("is-mobile-expanded") ? "Close" : "Open"} ${title} setup`);
  };

  cards.forEach((card, index) => {
    if (card.querySelector(":scope > .mode-card-mobile-toggle")) return;
    const toggle = document.createElement("button");
    toggle.className = "mode-card-mobile-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = `
      <span class="mode-card-mobile-artwork" aria-hidden="true"><img alt="" hidden /></span>
      <span class="mode-card-mobile-copy">
        <strong class="mode-card-mobile-title">Tournament mode</strong>
        <small class="mode-card-mobile-description">Configure and play</small>
      </span>
      <span class="mode-card-mobile-chevron" aria-hidden="true">&rsaquo;</span>
    `;
    card.prepend(toggle);
    toggle.addEventListener("click", () => {
      const expand = !card.classList.contains("is-mobile-expanded");
      cards.forEach((candidate) => {
        candidate.classList.remove("is-mobile-expanded");
        candidate.querySelector(":scope > .mode-card-mobile-toggle")?.setAttribute("aria-expanded", "false");
        syncToggle(candidate);
      });
      if (expand) {
        card.classList.add("is-mobile-expanded");
        toggle.setAttribute("aria-expanded", "true");
      }
      syncToggle(card);
    });
    const observer = new MutationObserver(() => syncToggle(card));
    observer.observe(card, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["src", "hidden"] });
    card.style.setProperty("--mobile-mode-index", index);
    syncToggle(card);
  });
}

window.addEventListener("pagehide", saveLiveMatchCheckpoint);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveLiveMatchCheckpoint();
});

window.addEventListener("popstate", () => {
  const routedTournamentHistoryId = savedTournamentIdFromPath();
  if (routedTournamentHistoryId) {
    void initializeTournamentHistoryStorage().then(() => {
      if (savedTournamentIdFromPath() !== routedTournamentHistoryId) return;
      openTournamentHistory(routedTournamentHistoryId, null, { updateUrl: false });
    });
    return;
  }
  if (activeTournamentHistoryRecord) closeTournamentHistory({ updateUrl: false });
  const mode = currentAppMode();
  if (modeSetupRouteEnabled(mode) && ["standard", "retro", "premierLeague", "ucl"].includes(mode)) {
    document.body.dataset.desktopModeSetup = mode;
  } else {
    closeDesktopModeSetup();
  }
  const routedRetroYear = retroWorldCupYearFromPath();
  if (mode === "retro" && routedRetroYear) {
    if (Number(routedRetroYear) === 2024) setRetroCompetition("copa");
    setRetroWorldCupYear(routedRetroYear);
    retroTournament = readRetroTournamentState(routedRetroYear);
    retroSelectedMatchId = retroTournament
      ? RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament)?.id || null
      : null;
  }
  if (mode === "online") {
    if (onlineModeAvailableLocally()) {
      openOnlineRoom(false, { updateUrl: false });
    } else {
      setAppModeUrl("home", { replace: true });
      render();
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    return;
  }
  if (mode === "premierLeague") {
    if (document.body.dataset.desktopModeSetup === "premierLeague") {
      render();
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    stopStandardPlaybackForNavigation();
    if (!els.onlineRoomScreen.hidden) closeOnlineScreen({ updateUrl: false, force: true });
    window.PremierLeagueSeason?.openSeason?.({ updateUrl: false });
    return;
  }
  if (window.PremierLeagueSeason?.isOpen?.()) {
    window.PremierLeagueSeason.closeSeason({ updateUrl: false });
  }
  if (mode !== "standard") stopStandardPlaybackForNavigation();
  if (!els.onlineRoomScreen.hidden) closeOnlineScreen({ updateUrl: false, force: true });
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

setOnlineDisplayNames(onlineRoomSession?.name || readSavedOnlineDisplayName());
const initialUrlParams = new URLSearchParams(window.location.search);
const initialSavedTournamentId = savedTournamentIdFromPath();
const linkedOnlineRoomCode = initialUrlParams.get("room");
if (linkedOnlineRoomCode) els.onlineRoomCodeInput.value = normalizeOnlineRoomCode(linkedOnlineRoomCode);
let initialAppMode = currentAppMode();
const legacyModeQuery = initialUrlParams.get("mode");
const initialRetroYear = retroWorldCupYearFromPath();
if (initialRetroYear) setRetroWorldCupYear(initialRetroYear);
if (legacyModeQuery) {
  setAppModeUrl(initialAppMode, { replace: true });
}
if (modeSetupRouteEnabled(initialAppMode) && ["standard", "retro", "premierLeague", "ucl"].includes(initialAppMode)) {
  document.body.dataset.desktopModeSetup = initialAppMode;
}
if (initialAppMode === "standard" && !state.started && !modeSetupRouteEnabled(initialAppMode)) {
  setAppModeUrl("home", { replace: true });
  initialAppMode = "home";
} else if (!legacyModeQuery) {
  window.history.replaceState(
    { ...(window.history.state || {}), appMode: initialAppMode },
    "",
    window.location.href,
  );
}
configureOnlineModeAvailability();
setupMobileModeCards();
syncOnlineRoomCard();
renderPremierLeagueTeamPicker();
renderPremierLeagueAssetState();
setRetroWorldCupYear(initialRetroYear || readRetroWorldCupYear());
if ([2016, 2020].includes(Number(initialRetroYear))) setRetroEuroYear(initialRetroYear);
else setRetroCompetition(Number(initialRetroYear) === 2024 ? "copa" : initialRetroYear ? "wc" : readRetroCompetition());
if (
  initialAppMode === "retro"
  && [1998, 2002, 2006, 2010, 2014, 2016, 2018, 2020, 2022, 2024, 2026].includes(Number(initialRetroYear))
  && (Number(initialRetroYear) !== 2024 || RETRO_COPA_2024_PLAYABLE)
  && document.body.dataset.desktopModeSetup !== "retro"
  && !retroTournament
) {
  const routedYear = Number(initialRetroYear);
  const managedTeam = [2016, 2020].includes(routedYear)
    ? readRetroEuroTeam(routedYear) || (routedYear === 2020 ? "Italy" : "France")
    : routedYear === 2024
      ? readRetroCopaTeam()
      : readRetroWorldCupTeam(String(routedYear));
  if ([2016, 2020].includes(routedYear)) saveRetroEuroTeam(managedTeam, routedYear);
  if (routedYear === 2024 && !managedTeam) saveRetroCopaTeam(null);
  retroTournament = RETRO_WORLD_CUP_ENGINE.createTournament({
    year: routedYear,
    seed: Date.now(),
    managedTeam,
  });
  lockRetroTournamentSetup(retroTournament, {
    managedTeam,
    upset: retroMenuSettings.upset,
    goals: retroMenuSettings.goals,
  });
  saveRetroTournamentState();
  retroSquadTeamName = managedTeam;
  retroSelectedMatchId = RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament)?.id || null;
}
if (initialAppMode === "retro" && !initialRetroYear) {
  setAppModeUrl("retro", { replace: true });
}
try {
  render();
} catch (error) {
  recoverFromStartupError(error, "initial-render");
}
void initializeTournamentHistoryStorage().then(() => {
  if (!initialSavedTournamentId) return;
  if (!openTournamentHistory(initialSavedTournamentId, null, { updateUrl: false })) {
    window.history.replaceState({ ...(window.history.state || {}), tournamentHistoryId: null }, "", "/");
  }
});
clearRetroRouteLoadingState();
if (interruptedLocalMatchSettled && initialAppMode === "standard") {
  showToast("Interrupted match finalized from its saved result.");
}
  if (initialAppMode === "online") {
  if (onlineModeAvailableLocally()) openOnlineRoom(false, { updateUrl: false });
  else setAppModeUrl("home", { replace: true });
}
if (!window.__retroWorldCupStartupUnfreezeBound) {
  window.__retroWorldCupStartupUnfreezeBound = true;
  startStartupUnfreezeWatchdog();
  window.setTimeout(() => {
    if (!startupRecoveryNeeded()) return;
    forceUnlockStartupState();
    clearRetroRouteLoadingState();
    try {
      render();
    } catch (error) {
      recoverFromStartupError(error, "startup-watchdog");
    }
  }, 250);
}
featureAnnouncementRetryTimer = window.setTimeout(openNextFeatureAnnouncement, 900);
