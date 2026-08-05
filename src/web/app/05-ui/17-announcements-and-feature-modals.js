let featureAnnouncementRetryTimer = null;
let retro1998AnnouncementShownThisPage = false;
let retroCopaAnnouncementShownThisPage = false;

function announcementWasSeen(storageKey) {
  try {
    return localStorage.getItem(storageKey) === "seen";
  } catch {
    return false;
  }
}

function rememberAnnouncement(storageKey) {
  try {
    localStorage.setItem(storageKey, "seen");
  } catch {
    // The in-page flags still prevent a repeated popup during this visit.
  }
}

function openNextFeatureAnnouncement() {
  clearTimeout(featureAnnouncementRetryTimer);
  featureAnnouncementRetryTimer = null;
  const anotherDialogIsOpen = [...document.querySelectorAll("dialog[open]")].some((dialog) => (
    dialog !== els.retro1998AnnouncementModal && dialog !== els.retroCopaAnnouncementModal
  ));
  if (anotherDialogIsOpen) {
    featureAnnouncementRetryTimer = window.setTimeout(openNextFeatureAnnouncement, 250);
    return;
  }
  if (
    els.retroCopaAnnouncementModal
    && !retroCopaAnnouncementShownThisPage
    && !announcementWasSeen(RETRO_COPA_2024_ANNOUNCEMENT_KEY)
  ) {
    retroCopaAnnouncementShownThisPage = true;
    els.retroCopaAnnouncementModal.showModal();
  }
}

function closeRetro1998Announcement() {
  rememberAnnouncement(RETRO_1998_ANNOUNCEMENT_KEY);
  if (els.retro1998AnnouncementModal?.open) els.retro1998AnnouncementModal.close();
}

els.retro1998AnnouncementClose?.addEventListener("click", closeRetro1998Announcement);
els.retro1998AnnouncementModal?.addEventListener("cancel", () => {
  rememberAnnouncement(RETRO_1998_ANNOUNCEMENT_KEY);
});
els.retro1998AnnouncementModal?.addEventListener("close", () => {
  rememberAnnouncement(RETRO_1998_ANNOUNCEMENT_KEY);
});
els.retro1998AnnouncementAction?.addEventListener("click", () => {
  closeRetro1998Announcement();
  setRetroCompetition("wc");
  setRetroWorldCupYear("1998");
  setAppModeUrl("home");
  render();
  window.setTimeout(() => {
    els.startRetroWorldCupButton?.click();
  }, 120);
});

function closeRetroCopaAnnouncement() {
  rememberAnnouncement(RETRO_COPA_2024_ANNOUNCEMENT_KEY);
  if (els.retroCopaAnnouncementModal?.open) els.retroCopaAnnouncementModal.close();
}

els.retroCopaAnnouncementClose?.addEventListener("click", closeRetroCopaAnnouncement);
els.retroCopaAnnouncementModal?.addEventListener("cancel", closeRetroCopaAnnouncement);
els.retroCopaAnnouncementModal?.addEventListener("close", () => rememberAnnouncement(RETRO_COPA_2024_ANNOUNCEMENT_KEY));
els.retroCopaAnnouncementAction?.addEventListener("click", () => {
  closeRetroCopaAnnouncement();
  setRetroCompetition("copa");
  setRetroWorldCupYear("2024");
  setAppModeUrl("home");
  render();
  window.setTimeout(() => els.startRetroWorldCupButton?.click(), 120);
});

function openCustomTournamentSettings() {
  stopStandardPlaybackForNavigation();
  if (currentAppMode() === "customMatch" || state.customTournament?.customMatch === true) customMatchSetupViewOpen = true;
  else customTournamentSetupViewOpen = true;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

els.customLiveBackButton?.addEventListener("click", openCustomTournamentSettings);
els.retroSettingsButton?.addEventListener("click", () => els.settingsButton.click());
els.retroNewsButton?.addEventListener("click", () => els.newsButton.click());
els.retroFeedbackButton?.addEventListener("click", () => els.bugReportButton.click());
$("#profileFeedbackButton")?.addEventListener("click", () => els.bugReportButton.click());
$("#profileAchievementsButton")?.addEventListener("click", () => els.openAchievementsButton.click());
els.retroAchievementsButton?.addEventListener("click", () => {
  if ([1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026].includes(Number(retroTournament?.year))) {
    window.AccountAchievements?.openRetroModal(Number(retroTournament.year));
    return;
  }
  els.openAchievementsButton.click();
});
els.retroDonateButton?.addEventListener("click", () => els.donateButton.click());
els.retroAccountButton?.addEventListener("click", () => document.querySelector("#mainAccountButton")?.click());
els.realPlayersOnlySetting.addEventListener("click", () => {
  state.settings.realPlayersOnly = state.settings.realPlayersOnly === false;
  saveState();
  syncSettingsDialog();
});
els.lightModeSetting?.addEventListener("click", () => {
  const enabled = !document.documentElement.classList.contains("light-mode");
  document.documentElement.classList.toggle("light-mode", enabled);
  document.body.classList.toggle("light-mode", enabled);
  try {
    localStorage.setItem(COLOUR_THEME_STORAGE_KEY, enabled ? "light" : "dark");
  } catch {
    // The theme still applies for this visit when storage is unavailable.
  }
  document.cookie = `${COLOUR_THEME_STORAGE_KEY}=${enabled ? "light" : "dark"}; path=/; max-age=31536000; samesite=lax`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", enabled ? "#f4f6fa" : "#0b0f17");
  syncSettingsDialog();
  showToast(enabled ? "Light mode on." : "Dark mode on.");
});
els.removeInjuriesSetting?.addEventListener("click", () => {
  state.settings = normalizeSettings(state.settings);
  const injuriesRemoved = state.settings.removeInjuries !== true;
  state.settings.removeInjuries = injuriesRemoved;
  if (standardTournamentState?.settings) {
    standardTournamentState.settings.removeInjuries = injuriesRemoved;
  }
  if (retroSimulatorState?.settings) {
    retroSimulatorState.settings.removeInjuries = injuriesRemoved;
  }
  localStorage.setItem(REMOVE_INJURIES_STORAGE_KEY, String(injuriesRemoved));
  const match = selectedMatch();
  if (injuriesRemoved && match?.result && !match.result.revealed) {
    const cutoff = livePlayback?.matchId === match.id
      ? displayedLiveMinute()
      : Number(readLiveMatchCheckpoint(match)?.displayedMinute) || 0;
    match.result.injuries = (match.result.injuries || [])
      .filter((injury) => injury.minute <= cutoff);
    if (livePlayback?.matchId === match.id) rebuildLiveMatchAfterTacticChange(match);
  }
  saveState();
  saveLiveMatchCheckpoint();
  syncSettingsDialog();
  if (match) renderMatchAnalysis(match, Boolean(livePlayback?.matchId === match.id));
  showToast(injuriesRemoved ? "Injuries removed." : "Injuries enabled.");
});
els.keybindsToggleButton?.addEventListener("click", () => {
  state.settings = normalizeSettings(state.settings);
  state.settings.keybinds.enabled = state.settings.keybinds.enabled === false;
  keybindCaptureAction = null;
  saveState();
  syncSettingsDialog();
  showToast(state.settings.keybinds.enabled ? "Keyboard shortcuts on." : "Keyboard shortcuts off.");
});
els.keybindSettingsList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-keybind-action]");
  if (!button) return;
  state.settings = normalizeSettings(state.settings);
  if (state.settings.keybinds.enabled === false) {
    showToast("Turn keyboard shortcuts on before rebinding.");
    return;
  }
  keybindCaptureAction = button.dataset.keybindAction;
  button.textContent = "Press key...";
  syncSettingsDialog();
});

els.joinOnlineRoomButton.addEventListener("click", () => openOnlineRoom(true));
els.openAchievementsButton?.addEventListener("click", () => {
  if (
    state?.uclSeason
    || document.body.classList.contains("ucl-simulator-open")
    || document.body.classList.contains("ucl-match-mode-active")
  ) {
    window.AccountAchievements?.openRetroModal("ucl");
    return;
  }
  if (
    state?.premierLeagueSeason
    || document.body.classList.contains("pl-season-open")
    || document.body.classList.contains("pl-match-mode-active")
  ) {
    window.AccountAchievements?.openRetroModal("pl");
    return;
  }
  if (
    els.retroWorldCupScreen?.hidden === false
    && [1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026].includes(Number(retroTournament?.year))
  ) {
    window.AccountAchievements?.openRetroModal(Number(retroTournament.year));
    return;
  }
  stopStandardPlaybackForNavigation();
  setAppModeUrl("achievements");
  render();
  window.AccountAchievements?.load();
  window.scrollTo({ top: 0, behavior: "smooth" });
});
els.confirmCreateRoomButton.addEventListener("click", createOnlineRoom);
els.confirmJoinRoomButton.addEventListener("click", joinOnlineRoom);
els.findOnlineMatchButton?.addEventListener("click", startOnlineMatchmaking);
els.cancelOnlineMatchmakingButton?.addEventListener("click", () => cancelOnlineMatchmaking());
els.updateOnlineDisplayNameButton.addEventListener("click", updateOnlineDisplayName);
els.leaveOnlineRoomButton.addEventListener("click", leaveOnlineRoom);
els.closeOnlineRoomButton.addEventListener("click", closeOnlineRoom);
els.startOnlineDraftButton.addEventListener("click", startOnlineDraft);
els.leaveOnlineDraftRoomButton.addEventListener("click", leaveOnlineRoom);
els.closeOnlineDraftRoomButton.addEventListener("click", closeOnlineRoom);
els.leaveOnlineMatchRoomButton.addEventListener("click", leaveOnlineRoom);
els.closeOnlineMatchRoomButton.addEventListener("click", closeOnlineRoom);
els.onlinePlayAgainButton.addEventListener("click", restartOnlineLobby);
els.onlineEndLobbyButton.addEventListener("click", leaveOrCloseCompletedOnlineRoom);
els.onlineResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-online-results-tab]");
  if (button) setOnlineResultsTab(button.dataset.onlineResultsTab);
  const roundButton = event.target.closest("[data-online-bracket-round]");
  if (roundButton) setOnlineBracketOpeningRound(roundButton.dataset.onlineBracketRound);
});
els.onlinePenaltyTesterButton.addEventListener("click", () => {
  if (onlinePenaltyTester) {
    onlinePenaltyTester = null;
    onlinePenaltyAnimation = null;
    els.onlineCurrentMatch.classList.remove("is-penalty-tester");
    renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
    startOnlineRoomPolling();
    return;
  }
  startOnlinePenaltyTester();
});
els.onlineRoundNextButton.addEventListener("click", () => {
  if (els.onlineRoundNextButton.disabled) return;
  advanceOnlineToAvailableRound();
});
els.onlineSpectatorSelect.addEventListener("change", () => {
  onlineSpectatingMemberId = els.onlineSpectatorSelect.value || null;
  onlineViewedMatchId = null;
  onlineMatchSelectionManual = false;
  if (latestOnlineRoom && onlineRoomSession) renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
});
els.onlineReadyButton.addEventListener("click", () => {
  const matchId = els.onlineReadyButton.dataset.matchId;
  if (!matchId) return;
  if (els.onlineReadyButton.dataset.action === "playback") {
    const match = latestOnlineRoom?.tournament?.rounds?.flatMap((round) => round.matches).find((item) => item.id === matchId);
    if (match) startOnlineMatchPlayback(match);
    return;
  }
  performOnlineMatchAction("match-ready", { matchId });
});
els.onlineTacticSlider.addEventListener("input", () => {
  const tactic = ONLINE_TACTIC_OPTIONS[Number(els.onlineTacticSlider.value)] || ONLINE_TACTIC_OPTIONS[2];
  els.onlineTacticName.textContent = tactic.name;
  els.onlineTacticCopy.textContent = tactic.copy;
});
els.onlineTacticSlider.addEventListener("change", () => {
  const tactic = ONLINE_TACTIC_OPTIONS[Number(els.onlineTacticSlider.value)] || ONLINE_TACTIC_OPTIONS[2];
  const teamId = els.onlineTacticSlider.dataset.teamId;
  if (teamId) performOnlineMatchAction("match-tactic", { tactic: tactic.id, teamId });
});
els.onlineTacticButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-online-tactic]");
  const teamId = els.onlineTacticButtons.dataset.teamId;
  if (!button || button.disabled || !teamId) return;
  performOnlineMatchAction("match-tactic", { tactic: button.dataset.onlineTactic, teamId });
});
els.penaltyStage.addEventListener("click", (event) => {
  const button = event.target.closest("[data-standard-penalty-target]");
  if (button && !button.disabled) chooseStandardPenaltyTarget(button.dataset.standardPenaltyTarget);
});
els.matchPenaltyOverlay.addEventListener("click", (event) => {
  const button = event.target.closest("[data-match-penalty-target]");
  if (button && !button.disabled) chooseMatchPenaltyTarget(button.dataset.matchPenaltyTarget);
});
els.onlinePenaltyControl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-penalty-target]");
  if (button && !button.disabled && onlinePenaltyTester) {
    takeOnlineTesterPenalty(button.dataset.penaltyTarget);
    return;
  }
  const memberId = onlineRoomSession?.memberId;
  const match = latestOnlineRoom?.tournament?.rounds?.at(-1)?.matches.find((item) => (
    item.liveState?.pendingDecision?.memberId === memberId
    || (item.status === "penalties" && latestOnlineRoom?.tournament?.teamOwnerById?.[item.penalty?.currentTeamId] === memberId)
  ));
  if (button && !button.disabled && match) takeOnlineInteractivePenalty(match, button.dataset.penaltyTarget);
});
els.onlineTeamSelectList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-team-id]");
  if (button) performOnlineMatchAction("team-select", { teamId: button.dataset.teamId });
});
