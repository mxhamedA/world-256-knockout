});

els.overviewSearch.addEventListener("input", (event) => renderParticipantOverview(event.target.value));
els.teamSearch.addEventListener("input", (event) => renderSearchResults(event.target.value));
els.teamFilterChip.addEventListener("click", clearTeamFilter);
els.bugReportButton?.addEventListener("click", () => {
  els.bugReportStatus.textContent = "";
  els.bugReportModal.showModal();
  els.bugReportMessage.focus();
});
els.onlineBugReportButton?.addEventListener("click", () => els.bugReportButton.click());
els.bugReportCloseButton?.addEventListener("click", () => els.bugReportModal.close());
els.bugReportForm?.addEventListener("submit", submitBugReport);
const openDiscordModal = () => {
  if (els.settingsModal?.open) els.settingsModal.close();
  els.discordModal.showModal();
};
els.discordButton?.addEventListener("click", openDiscordModal);
els.settingsDiscordButton?.addEventListener("click", openDiscordModal);
els.onlineDiscordButton?.addEventListener("click", openDiscordModal);
$("#profileDiscordButton")?.addEventListener("click", openDiscordModal);
els.discordCloseButton?.addEventListener("click", () => els.discordModal.close());
const openDonateModal = () => {
  if (els.settingsModal?.open) els.settingsModal.close();
  els.donateModal?.showModal();
};
els.donateButton?.addEventListener("click", openDonateModal);
els.onlineDonateButton?.addEventListener("click", openDonateModal);
$("#profileDonateButton")?.addEventListener("click", openDonateModal);
els.donateCloseButton?.addEventListener("click", () => els.donateModal?.close());
$("#profileCurrentButton")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("#goToTopButton").addEventListener("click", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});

els.openCustomTournamentButton?.addEventListener("click", () => {
  stopStandardPlaybackForNavigation();
  if (isValidCustomTournamentState(customTournamentState)) {
    state = customTournamentState;
    standardTournamentState = state;
    customTournamentSetupViewOpen = false;
  } else if (state.customTournament?.customMatch === true) {
    state = isDefaultKnockoutState(defaultKnockoutState) ? defaultKnockoutState : createInitialState();
    standardTournamentState = state;
  }
  setAppModeUrl("custom");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
els.restartCustomTournamentButton?.addEventListener("click", () => openDefaultResetModal(false));

els.openCustomMatchButton?.addEventListener("click", () => {
  stopStandardPlaybackForNavigation();
  if (customMatchCanResume()) {
    state = customMatchState;
    standardTournamentState = state;
    customMatchSetupViewOpen = false;
  } else {
    customMatchSetupViewOpen = true;
  }
  setAppModeUrl("customMatch");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
els.restartCustomMatchButton?.addEventListener("click", () => {
  customMatchSetupViewOpen = true;
  setAppModeUrl("customMatch");
  render();
});

els.customTournamentBackButton?.addEventListener("click", () => {
  stopStandardPlaybackForNavigation();
  setAppModeUrl("home");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
els.customMatchBackButton?.addEventListener("click", () => {
  stopStandardPlaybackForNavigation();
  setAppModeUrl("home");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
els.customMatchCreateTeamButton?.addEventListener("click", () => {
  customTournamentSetup.sourceFilter = "custom";
  customTournamentUi.teamCreatorOpen = true;
  customTournamentUi.editingCustomTeamId = null;
  customTournamentUi.customTeamDraft = newCustomTeamDraft();
  customTournamentUi.teamCreatorReturnMode = "customMatch";
  customTournamentUi.teamCreatorReturnSide = "home";
  render();
});

document.querySelector("[data-custom-header-action='save-preset']")?.addEventListener("click", downloadCustomTournamentPreset);
document.querySelector("[data-custom-header-action='import-preset']")?.addEventListener("click", () => els.customPresetFile?.click());
els.customHeaderStartButton?.addEventListener("click", handleCustomTournamentStartAction);
els.customMatchStartButton?.addEventListener("click", () => {
  if (!customMatchSetupViewOpen && isValidCustomTournamentState(state) && state.customTournament?.customMatch === true && state.started) {
    customMatchSetupViewOpen = false;
    render();
    return;
  }
  startCustomMatch();
});
els.customPresetFile?.addEventListener("change", (event) => readCustomTournamentPresetFile(event.target.files?.[0]));

document.querySelectorAll("[data-mode-route-back]").forEach((button) => {
  button.addEventListener("click", () => {
    closeDesktopModeSetup();
    restoreClubRouteSetupControls();
    setAppModeUrl("home");
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
  });
});

els.startTournamentButton.addEventListener("click", () => {
  if (currentAppMode() === "home" && openDesktopModeSetup("standard")) return;
  closeDesktopModeSetup();
  if (isValidCustomTournamentState(state)) {
    if (state.customTournament?.customMatch === true) customMatchState = state;
    else customTournamentState = state;
    state = isDefaultKnockoutState(defaultKnockoutState)
      ? defaultKnockoutState
      : createInitialState();
    standardTournamentState = state;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    teamFilterId = null;
    teamFilterReturn = null;
  }
  if (state.legacyTournament) {
    const previousSettings = { ...state.settings };
    const standardSpectateTeamId = state.spectateTeamId?.startsWith("legacy-") ? null : state.spectateTeamId;
    const standardPredictionTeamId = TEAM_BY_ID.has(state.predictionTeamId) && !state.predictionTeamId?.startsWith("legacy-")
      ? state.predictionTeamId
      : null;
    state = createInitialState();
    state.settings = previousSettings;
    state.spectateTeamId = standardSpectateTeamId;
    state.predictionTeamId = standardPredictionTeamId;
    state.neutralView = !standardSpectateTeamId;
  }
  // If resuming but the spectate team changed, force a fresh start
  if (state.started && state._activeSpectateId && state.spectateTeamId !== state._activeSpectateId) {
    openDefaultResetModal(false);
    return;
  }
  if (!state.started) state._activeSpectateId = state.spectateTeamId;
  const resuming = state.started;
  state.started = true;
  if (!resuming && state.spectateTeamId) focusSpectatedTeam(0);
  saveState();
  setAppModeUrl("standard");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (resuming) {
    showToast("Tournament resumed.");
    return;
  }
  const pick = state.predictionTeamId ? teamById(state.predictionTeamId) : null;
  const watched = spectatedTeam();
  showToast(watched
    ? `${watched.name}'s opening match is ready.`
    : pick ? `${pick.name} locked in. The draw is live.` : "The draw is live. Choose the opening tie.");
});

els.startLegacyDraftButton?.addEventListener("click", () => {
  renderLegacyLandingSetup();
  setAppModeUrl("legacy");
  if (desktopModeSetupEnabled()) {
    document.body.classList.add("legacy-route-setup-active");
  }
  if (document.body.classList.contains("legacy-route-setup-active")) {
    els.legacySetupModal?.show();
  } else {
    els.legacySetupModal?.showModal();
  }
});

els.confirmLegacyDraftButton?.addEventListener("click", () => {
  els.legacySetupModal.dataset.confirmed = "true";
  document.body.classList.remove("legacy-route-setup-active");
  els.legacySetupModal?.close();
  if (state.legacyTournament && state.started) {
    if (!isValidLegacyTournamentState(state) && legacyDraft?.complete) {
      state = createLegacyTournamentState();
      saveState();
    }
    setAppModeUrl("standard");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (!state.legacyTournament && legacyDraft?.complete) {
    try {
      const savedLegacyTournament = JSON.parse(localStorage.getItem(LEGACY_TOURNAMENT_SESSION_KEY));
      if (savedLegacyTournament?.version === STATE_VERSION && isValidLegacyTournamentState(savedLegacyTournament)) {
        savedLegacyTournament.settings = normalizeSettings(savedLegacyTournament.settings);
        state = savedLegacyTournament;
        const customTeam = legacyDraftTeam();
        TEAM_BY_ID.set(customTeam.id, customTeam);
        clearPlayerProfileCacheForTeam(customTeam.id);
        setAppModeUrl("standard");
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Legacy tournament resumed.");
        return;
      }
    } catch {
      localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
    }
  }
  if (legacyDraft) {
    setAppModeUrl("legacy");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  legacyDraft = null;
  localStorage.removeItem("legacyDraftState");
  startLegacyDraft(legacySetup.nationId);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

els.legacySetupRestartButton?.addEventListener("click", () => {
  const legacyTeamId = legacyDraft?.nationId ? `legacy-${legacyDraft.nationId}-xi` : state.spectateTeamId;
  if (typeof legacyTeamId === "string" && legacyTeamId.startsWith("legacy-")) TEAM_BY_ID.delete(legacyTeamId);
  legacyDraft = null;
  localStorage.removeItem("legacyDraftState");
  localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
  if (state.legacyTournament) {
    const previousSettings = { ...state.settings };
    state = createInitialState();
    state.settings = previousSettings;
    saveState();
  }
  renderLegacyLandingSetup();
  showToast("Choose a new Legacy Draft setup.");
});

els.restartLegacyDraftButton?.addEventListener("click", () => {
  document.body.classList.remove("legacy-route-setup-active");
  els.legacySetupModal?.close();
  const legacyTeamId = legacyDraft?.nationId ? `legacy-${legacyDraft.nationId}-xi` : state.spectateTeamId;
  if (typeof legacyTeamId === "string" && legacyTeamId.startsWith("legacy-")) TEAM_BY_ID.delete(legacyTeamId);
  legacyDraft = null;
  localStorage.removeItem("legacyDraftState");
  localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
  if (state.legacyTournament) {
    const previousSettings = { ...state.settings };
    state = createInitialState();
    state.settings = previousSettings;
    saveState();
  }
  setAppModeUrl("home", { replace: true });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Legacy tournament restarted.");
});

els.legacySetupModal?.addEventListener("close", () => {
  document.body.classList.remove("legacy-route-setup-active");
  const confirmed = els.legacySetupModal.dataset.confirmed === "true";
  delete els.legacySetupModal.dataset.confirmed;
  if (!confirmed && currentAppMode() === "legacy") {
    setAppModeUrl("home", { replace: true });
    render();
  }
});

els.legacyDraftBackButton.addEventListener("click", () => {
  if (state?.premierLeagueSeason || document.body.classList.contains("pl-match-mode-active")) {
    window.PremierLeagueSeason?.returnToSeason?.();
    return;
  }
  if (els.legacyDraftBackButton.dataset.savedTournament === "true") {
    closeTournamentHistory();
    return;
  }
  if (els.legacyDraftBackButton.dataset.customSettings === "true") {
    openCustomTournamentSettings();
    return;
  }
  closeDesktopModeSetup();
  setAppModeUrl("home");
  render();
});

els.legacyHeaderBackButton.addEventListener("click", () => {
  if (state?.premierLeagueSeason || document.body.classList.contains("pl-match-mode-active")) {
    window.PremierLeagueSeason?.returnToSeason?.();
    return;
  }
  closeDesktopModeSetup();
  setAppModeUrl("home");
  render();
});

els.retroWorldCupBackButton?.addEventListener("click", () => {
  if (activeTournamentHistoryRecord) {
    closeTournamentHistory();
    return;
  }
  stopStandardPlaybackForNavigation();
  setAppModeUrl("home");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
