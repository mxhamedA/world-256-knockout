function selectOnlineMatchFromList(event) {
  const button = event.target.closest("[data-match-id]");
  if (!button || button.disabled || !latestOnlineRoom) return;
  onlineMatchSelectionManual = true;
  onlineViewedMatchId = button.dataset.matchId;
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();
  renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
}
els.onlineMyMatches.addEventListener("click", selectOnlineMatchFromList);
els.onlineRoundMatches.addEventListener("click", selectOnlineMatchFromList);
els.onlineMatchFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-online-match-filter]");
  if (!button || !latestOnlineRoom) return;
  onlineOtherMatchFilter = button.dataset.onlineMatchFilter;
  renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
});
els.onlinePauseMatchButton.addEventListener("click", () => {
  const authoritativeMatchId = els.onlinePauseMatchButton.dataset.matchId;
  if (authoritativeMatchId) {
    const match = latestOnlineRoom?.tournament?.rounds.flatMap((round) => round.matches).find((item) => item.id === authoritativeMatchId);
    const paused = Boolean(match?.liveState?.clock?.pausedUntil > onlineServerNow());
    performOnlineMatchAction("match-playback", { matchId: authoritativeMatchId, paused: !paused });
    return;
  }
  if (!onlineMatchPlayback) return;
  if (onlineMatchPlayback.shared) {
    performOnlineMatchAction("match-playback", {
      matchId: onlineMatchPlayback.matchId,
      paused: !onlineMatchPlayback.paused,
    });
    return;
  }
  onlineMatchPlayback.paused = !onlineMatchPlayback.paused;
  els.onlinePauseMatchButton.textContent = onlineMatchPlayback.paused ? "Resume" : "Pause";
  if (!onlineMatchPlayback.paused) {
    onlineMatchPlayback.lastTimestamp = 0;
    onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
  }
});
els.onlineMatchSpeedButton.addEventListener("click", () => {
  const authoritativeMatchId = els.onlineMatchSpeedButton.dataset.matchId;
  if (authoritativeMatchId) {
    const match = latestOnlineRoom?.tournament?.rounds.flatMap((round) => round.matches).find((item) => item.id === authoritativeMatchId);
    const speed = match?.liveState?.clock?.speedByMemberId?.[onlineRoomSession?.memberId] || 1;
    performOnlineMatchAction("match-playback", { matchId: authoritativeMatchId, speed: speed === 1 ? 2 : speed === 2 ? 4 : 1 });
    return;
  }
  if (!onlineMatchPlayback) return;
  if (onlineMatchPlayback.shared) {
    const requestedSpeed = onlineMatchPlayback.requestedSpeed === 1 ? 2 : onlineMatchPlayback.requestedSpeed === 2 ? 4 : 1;
    performOnlineMatchAction("match-playback", { matchId: onlineMatchPlayback.matchId, speed: requestedSpeed });
    return;
  }
  onlineMatchPlayback.speed = onlineMatchPlayback.speed === 1 ? 2 : onlineMatchPlayback.speed === 2 ? 4 : 1;
  els.onlineMatchSpeedButton.textContent = `${onlineMatchPlayback.speed}×`;
});
els.onlineTeamSelectDialog.addEventListener("cancel", (event) => event.preventDefault());
els.closeOnlineScreenButton.addEventListener("click", () => closeOnlineScreen());
els.onlineScreenBrand.addEventListener("click", (event) => {
  event.preventDefault();
  closeOnlineScreen({ updateUrl: true });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.onlineRoomScreen.hidden) closeOnlineScreen();
});
els.onlineRoomCodeInput.addEventListener("input", (event) => {
  event.target.value = normalizeOnlineRoomCode(event.target.value);
});
els.onlineRoomCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    joinOnlineRoom();
  }
});
els.onlineDisplayName.addEventListener("input", () => {
  saveOnlineDisplayName(els.onlineDisplayName.value);
});
els.onlineDisplayName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (els.onlineRoomCodeInput.value) joinOnlineRoom();
    else els.onlineRoomCodeInput.focus();
  }
});
els.onlineLobbyDisplayName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    updateOnlineDisplayName();
  }
});
els.copyOnlineRoomCodeButton.addEventListener("click", async () => {
  if (!onlineRoomSession) return;
  await copyOnlineText(onlineRoomSession.code, "Room code copied.", `Room code: ${onlineRoomSession.code}`);
});
els.copyOnlineRoomInviteButton.addEventListener("click", async () => {
  if (!onlineRoomSession) return;
  const inviteUrl = onlineRoomInviteUrl(onlineRoomSession.code);
  await copyOnlineText(inviteUrl, "Invite link copied.", inviteUrl);
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && onlineRoomSession && !els.onlineRoomScreen.hidden) {
    refreshOnlineRoom({ quiet: true });
    startOnlineRoomPolling();
  } else if (!document.hidden && onlineMatchmakingSession && !els.onlineRoomScreen.hidden) {
    refreshOnlineMatchmaking({ quiet: true });
    startOnlineMatchmakingPolling();
  }
});

els.predictionSearch.addEventListener("input", (event) => renderPredictionList(event.target.value));
els.predictionList.addEventListener("click", (event) => {
  const option = event.target.closest(".prediction-option");
  if (!option) return;
  state.predictionTeamId = option.dataset.teamId;
  saveState();
  els.predictionModal.close();
  showToast(`${teamById(state.predictionTeamId).name} is your champion prediction.`);
});
els.clearPredictionButton.addEventListener("click", () => {
  state.predictionTeamId = null;
  saveState();
  els.predictionModal.close();
  showToast("Champion prediction cleared.");
});

els.spectatePickerButton.addEventListener("click", () => {
  if (standardTournamentSetupLocked()) {
    showToast("Restart the tournament before changing your managed team.");
    return;
  }
  openSpectatePicker("all");
});
els.retroTeamPickerButton?.addEventListener("click", openRetroWorldCupTeamPicker);
els.uclTeamPickerButton?.addEventListener("click", openUclTeamPicker);
els.premierLeagueTeamPickerButton?.addEventListener("click", openPremierLeagueTeamPicker);
window.addEventListener("premier-league-season-state", renderPremierLeagueTeamPicker);
els.premierLeagueInstallButton?.addEventListener("click", openPremierLeagueAssetPack);
els.plAssetPackCloseButton?.addEventListener("click", () => els.plAssetPackModal?.close());
els.plAssetPackCancelButton?.addEventListener("click", () => els.plAssetPackModal?.close());
els.plAssetPackConfirmButton?.addEventListener("click", installPremierLeagueAssetPack);
els.uclInstallButton?.addEventListener("click", openUclAssetPack);
els.uclAssetPackCloseButton?.addEventListener("click", () => els.uclAssetPackModal?.close());
els.uclAssetPackCancelButton?.addEventListener("click", () => els.uclAssetPackModal?.close());
els.uclAssetPackConfirmButton?.addEventListener("click", installUclAssetPack);
window.addEventListener("accountstatechange", (event) => {
  const account = event.detail?.account || null;
  setPremierLeagueAssetAccount(account);
  setUclAssetAccount(account);
  setCustomTeamAccount(account);
});
els.spectateSearch.addEventListener("input", (event) => renderSpectateList(event.target.value));
els.spectateList.addEventListener("click", (event) => {
  const option = event.target.closest(".prediction-option");
  if (!option) return;
  if (spectatePickerMode === "ucl") {
    const teamId = option.dataset.uclTeamId || null;
    const team = UCL_2026_27_QUALIFIED_TEAMS.find((candidate) => candidate.id === teamId) || null;
    saveUclMenuTeamId(team?.id || null);
    renderUclTeamPicker();
    els.spectateModal.close();
    showToast(team ? `${team.name} selected for the UCL simulator.` : "Neutral Champions League view selected.");
    return;
  }
  if (spectatePickerMode === "premier-league") {
    if (window.PremierLeagueSeason?.hasStarted?.()) {
      els.spectateModal.close();
      showToast("Restart the season before changing clubs.");
      return;
    }
    const teamId = option.dataset.premTeamId || null;
    const team = PREMIER_LEAGUE_2026_27_TEAMS.find((candidate) => candidate.id === teamId) || null;
    premierLeagueMenuSetup.teamId = team?.id || null;
    savePremierLeagueMenuSetup();
    renderPremierLeagueTeamPicker();
    els.spectateModal.close();
    showToast(team ? `${team.name} selected for the Premier League simulator.` : "Neutral Premier League view selected.");
    return;
  }
  if (spectatePickerMode === "retro") {
    const year = selectedRetroTournamentYear();
    const competition = readRetroCompetition();
    const isEuros = competition === "euros";
    const isCopa = competition === "copa";
    if (retroTournamentForYear(year)) {
      els.spectateModal.close();
      showToast(`Restart this ${isEuros ? "Euro" : "World Cup"} before changing your team.`);
      return;
    }
    const name = option.dataset.retroTeamName;
    const selectedData = isCopa
      ? RETRO_COPA_2024.teams.find((team) => team.name === name)
      : isEuros
      ? RETRO_EURO_2016.teams.find((team) => team.name === name)
      : retroWorldCupTeamData(year, name);
    if (name && !selectedData) return;
    if (isCopa) saveRetroCopaTeam(name);
    else if (isEuros) saveRetroEuroTeam(name);
    else saveRetroWorldCupTeam(year, name);
    renderRetroWorldCupTeamPicker(year);
    els.spectateModal.close();
    showToast(
      name
        ? `${name} selected for ${isCopa ? "Copa América 2024" : isEuros ? "Euro 2016" : `the ${year} World Cup`}.`
        : "Neutral view selected.",
    );
    return;
  }
  if (standardTournamentSetupLocked()) {
    els.spectateModal.close();
    showToast("Restart the tournament before changing your managed team.");
    return;
  }
  const teamId = option.dataset.teamId || null;
  state.spectateTeamId = teamId;
  state.neutralView = !teamId;
  if (state.started && teamId) focusSpectatedTeam();
  saveState();
  render();
  els.spectateModal.close();
  const team = spectatedTeam();
  showToast(team ? `Now following ${team.name}.` : "Neutral view selected.");
  if (state.started) window.scrollTo({ top: 0, behavior: "smooth" });
});
