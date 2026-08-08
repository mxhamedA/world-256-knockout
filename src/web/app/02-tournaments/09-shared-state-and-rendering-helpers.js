function selectedRound() {
  return state.rounds[state.activeRound] || [];
}

function selectedMatch() {
  return selectedRound()[state.selectedMatch] || null;
}

function allMatches() {
  return state.rounds.flatMap((round) => round || []);
}

function spectatedTeam() {
  return state.spectateTeamId ? teamById(state.spectateTeamId) : null;
}

function teamElimination(teamId) {
  for (let roundIndex = 0; roundIndex < state.rounds.length; roundIndex += 1) {
    const match = (state.rounds[roundIndex] || []).find((item) => (
      item.result?.revealed
      && item.result.winnerId
      && !item.allowDraw
      && (item.homeId === teamId || item.awayId === teamId)
      && item.result.winnerId !== teamId
    ));
    if (match) return { match, roundIndex };
  }
  return null;
}

function teamIsAlive(teamId) {
  return !teamElimination(teamId) || teamHasPendingThirdPlace(teamId);
}

function tournamentHasThirdPlacePlayoff() {
  if (state?.savedTournamentView) {
    return (state.rounds.at(-1) || []).some((match) => isThirdPlacePlayoff(match));
  }
  if (state?.premierLeagueSeason) return false;
  if (isRetroSimulatorState()) return ![2016, 2020].includes(Number(retroTournament?.year));
  if (!state.customTournament) return true;
  return state.customTournament.thirdPlace === true;
}

function tournamentThirdPlaceMatch(teamId = null) {
  if (!tournamentHasThirdPlacePlayoff()) return null;
  const finalRound = state.rounds[tournamentFinalRoundIndex()] || [];
  return finalRound.find((match) => (
    isThirdPlacePlayoff(match)
    && (!teamId || match.homeId === teamId || match.awayId === teamId)
  )) || null;
}

function finalBlockedByThirdPlace(match, roundIndex = state.activeRound) {
  if (
    isRetroSimulatorState()
    || roundIndex !== tournamentFinalRoundIndex()
    || !match
    || isThirdPlacePlayoff(match)
  ) return false;
  if (managedDefaultFinalSkipsThirdPlace(match, roundIndex)) return false;
  const thirdPlaceMatch = tournamentThirdPlaceMatch();
  return Boolean(thirdPlaceMatch && !thirdPlaceMatch.result?.revealed);
}

function managedDefaultFinalSkipsThirdPlace(match, roundIndex = state.activeRound) {
  return Boolean(
    !isRetroSimulatorState()
    && !state.customTournament
    && state.spectateTeamId
    && !state.neutralView
    && roundIndex === tournamentFinalRoundIndex()
    && match
    && !isThirdPlacePlayoff(match)
  );
}

function teamHasPendingThirdPlace(teamId) {
  if (!tournamentHasThirdPlacePlayoff()) return false;
  const thirdPlaceMatch = tournamentThirdPlaceMatch(teamId);
  if (thirdPlaceMatch) return !thirdPlaceMatch.result?.revealed;
  const semiFinals = state.rounds[tournamentFinalRoundIndex() - 1] || [];
  return semiFinals.some((match) => (
    match.result?.revealed
    && match.result.winnerId
    && (match.homeId === teamId || match.awayId === teamId)
    && match.result.winnerId !== teamId
  ));
}

function isCustomGroupStageRound(roundIndex = state.activeRound) {
  return state.customTournament?.structure === "groups" && roundIndex === 0;
}

function customGroupMatchday(match) {
  return Math.floor((Math.max(1, Number(match?.customGroupFixture) || 1) - 1) / 2);
}

function pendingCustomGroupMatchday(round = state.rounds[0] || []) {
  const pendingMatchdays = round
    .filter((match) => !match.result?.revealed)
    .map(customGroupMatchday);
  return pendingMatchdays.length ? Math.min(...pendingMatchdays) : -1;
}

function teamMatchIndex(roundIndex, teamId = state.spectateTeamId) {
  if (!teamId) return -1;
  const round = state.rounds[roundIndex] || [];
  if (isCustomGroupStageRound(roundIndex)) {
    const pendingIndex = round.findIndex((match) => (
      !match.result?.revealed
      && (match.homeId === teamId || match.awayId === teamId)
    ));
    if (pendingIndex >= 0) return pendingIndex;
  }
  return round.findIndex((match) => (
    match.homeId === teamId || match.awayId === teamId
  ));
}

function focusSpectatedTeam(roundIndex = currentTournamentRoundIndex()) {
  const matchIndex = teamMatchIndex(roundIndex);
  if (matchIndex < 0) return false;
  state.activeRound = roundIndex;
  state.selectedMatch = matchIndex;
  state.championView = false;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  return true;
}

function renderSpectatePicker() {
  const savedTeam = spectatedTeam();
  const team = savedTeam?.id?.startsWith("legacy-") ? null : savedTeam;
  const setupLocked = standardTournamentSetupLocked();
  els.spectatePickerButton.classList.toggle("has-team", Boolean(team));
  if (!team) {
    els.spectatePickerMark.textContent = "◎";
    els.spectatePickerLabel.textContent = "Neutral";
    els.spectatePickerHint.textContent = setupLocked ? "Locked until restart" : "Show every match as normal";
    els.spectatePickerButton.setAttribute(
      "aria-label",
      setupLocked ? "Managed team locked to Neutral until restart" : "Choose a team to spectate. Current view: Neutral",
    );
    return;
  }
  els.spectatePickerMark.innerHTML = flagMarkup(team, "spectate-picker-flag");
  els.spectatePickerLabel.textContent = team.name;
  els.spectatePickerHint.textContent = setupLocked ? "Locked until restart" : "Jump to this team every round";
  els.spectatePickerButton.setAttribute(
    "aria-label",
    setupLocked ? `Managed team locked to ${team.name} until restart` : `Choose a team to spectate. Current team: ${team.name}`,
  );
}

function compareTeamsByOfficialFifaRank(a, b) {
  const rankA = a.officialFifaRank ?? Number.POSITIVE_INFINITY;
  const rankB = b.officialFifaRank ?? Number.POSITIVE_INFINITY;
  return rankA - rankB || a.name.localeCompare(b.name);
}

function renderSpectateList(query = "") {
  if (spectatePickerMode === "retro") {
    renderRetroWorldCupTeamList(query);
    return;
  }
  if (spectatePickerMode === "ucl") {
    renderUclTeamList(query);
    return;
  }
  if (spectatePickerMode === "premier-league") {
    renderPremierLeagueTeamList(query);
    return;
  }
  const normalized = query.trim().toLowerCase();
  const onlyAlive = spectatePickerMode === "alive";
  const selectedTeamId = state.spectateTeamId?.startsWith("legacy-") ? null : state.spectateTeamId;
  const teams = TEAMS
    .filter((team) => (!onlyAlive || teamIsAlive(team.id)) && team.name.toLowerCase().includes(normalized))
    .sort(compareTeamsByOfficialFifaRank);
  const neutralOption = onlyAlive || normalized
    ? ""
    : `
      <button class="prediction-option spectate-neutral-option ${selectedTeamId ? "" : "selected"}" type="button" data-team-id="">
        <span class="spectate-neutral-mark" aria-hidden="true">◎</span>
        <span><strong>Neutral</strong><small>Show every match as normal</small></span>
        <i aria-hidden="true">${selectedTeamId ? "" : "✓"}</i>
      </button>
    `;
  els.spectateList.innerHTML = neutralOption + teams.map((team) => `
    <button class="prediction-option ${team.id === selectedTeamId ? "selected" : ""}" type="button" data-team-id="${team.id}">
      ${flagMarkup(team, "prediction-option-flag")}
      <span><strong>${team.name}</strong><small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"}</small></span>
      <i aria-hidden="true">${team.id === selectedTeamId ? "✓" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No available team matches that search.</div>`;
}

function openSpectatePicker(mode = "all") {
  spectatePickerMode = mode;
  els.spectateModalTitle.textContent = mode === "alive" ? "Choose a team still in the tournament" : "Pick a country to manage";
  els.spectateSearch.placeholder = "Search all 256 teams";
  els.spectateSearch.value = "";
  renderSpectateList();
  els.spectateModal.showModal();
  requestAnimationFrame(() => els.spectateSearch.focus());
}

function readUclMenuTeamId() {
  try {
    const teamId = localStorage.getItem(UCL_2026_27_TEAM_KEY);
    return UCL_2026_27_QUALIFIED_TEAMS.some((team) => team.id === teamId) ? teamId : null;
  } catch {
    return null;
  }
}

function saveUclMenuTeamId(teamId) {
  uclMenuTeamId = UCL_2026_27_QUALIFIED_TEAMS.some((team) => team.id === teamId) ? teamId : null;
  try {
    if (uclMenuTeamId) localStorage.setItem(UCL_2026_27_TEAM_KEY, uclMenuTeamId);
    else localStorage.removeItem(UCL_2026_27_TEAM_KEY);
  } catch {
    // The selected club remains active for the current page when storage is unavailable.
  }
}

function accountHasUclAssets(account) {
  return Array.isArray(account?.assetPacks) && account.assetPacks.includes(UCL_ASSET_PACK_ID);
}

function uclClubBadgeMarkup(team, className = "ucl-club-badge") {
  if (!team.badge) return `<span class="ucl-club-code" aria-hidden="true">${team.code}</span>`;
  return `<img class="${className}" data-team-id="${escapeHtml(team.id)}" src="${team.badge}" alt="" loading="lazy" decoding="async" />`;
}

function renderUclTeamPicker() {
  if (!els.uclTeamPickerButton) return;
  const team = UCL_2026_27_QUALIFIED_TEAMS.find((candidate) => candidate.id === uclMenuTeamId) || null;
  els.uclTeamPickerButton.classList.toggle("has-team", Boolean(team));
  els.uclTeamPickerMark.classList.toggle("is-club", Boolean(team));
  if (!team) {
    els.uclTeamPickerMark.innerHTML = '<img src="./assets/ucl-starball-white.png" alt="" />';
    els.uclTeamLabel.textContent = "Neutral";
    els.uclTeamHint.textContent = `${UCL_2026_27_QUALIFIED_TEAMS.length} league-phase and qualifying clubs`;
    els.uclTeamPickerButton.setAttribute("aria-label", "Choose a 2026/27 Champions League club. Current view: Neutral");
    return;
  }
  els.uclTeamPickerMark.innerHTML = uclAssetsInstalled
    ? uclClubBadgeMarkup(team)
    : team.code;
  els.uclTeamLabel.textContent = team.name;
  els.uclTeamHint.textContent = "2026/27 league-phase pool";
  els.uclTeamPickerButton.setAttribute("aria-label", `Change ${team.name} as your Champions League club`);
}

function renderUclTeamList(query = "") {
  const normalized = query.trim().toLowerCase();
  const teams = UCL_2026_27_QUALIFIED_TEAMS.filter((team) => (
    team.name.toLowerCase().includes(normalized) || team.association.toLowerCase().includes(normalized)
  ));
  const neutralOption = normalized
    ? ""
    : `
      <button class="prediction-option spectate-neutral-option ${uclMenuTeamId ? "" : "selected"}" type="button" data-ucl-team-id="">
        <span class="spectate-neutral-mark ucl-neutral-mark" aria-hidden="true"><img src="./assets/ucl-starball-white.png" alt="" /></span>
        <span><strong>Neutral</strong><small>Follow the whole league phase</small></span>
        <i aria-hidden="true">${uclMenuTeamId ? "" : "&#10003;"}</i>
      </button>
    `;
  els.spectateList.innerHTML = neutralOption + teams.map((team) => `
    <button class="prediction-option ${team.id === uclMenuTeamId ? "selected" : ""}" type="button" data-ucl-team-id="${team.id}">
      ${uclAssetsInstalled
        ? uclClubBadgeMarkup(team, "ucl-club-badge ucl-picker-badge")
        : `<span class="ucl-club-code" aria-hidden="true">${team.code}</span>`}
      <span><strong>${escapeHtml(team.name)}</strong><small>${team.association} &middot; League-phase pool</small></span>
      <i aria-hidden="true">${team.id === uclMenuTeamId ? "&#10003;" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No qualified club matches that search.</div>`;
}

function openUclTeamPicker() {
  if (window.UclSimulator?.hasStarted?.()) {
    showToast("Restart the UCL season before changing your club.");
    return;
  }
  spectatePickerMode = "ucl";
  els.spectateModalTitle.textContent = "Choose a Champions League club";
  els.spectateSearch.placeholder = `Search ${UCL_2026_27_QUALIFIED_TEAMS.length} qualified clubs`;
  els.spectateSearch.value = "";
  renderUclTeamList();
  els.spectateModal.showModal();
  requestAnimationFrame(() => els.spectateSearch.focus());
}

function readPremierLeagueMenuSetup() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREMIER_LEAGUE_SETUP_STORAGE_KEY) || "null");
    return {
      upset: SIMULATION_CONFIG.modes[saved?.upset] ? saved.upset : defaultSettings.upset,
      goals: SIMULATION_CONFIG.goals[saved?.goals] ? saved.goals : defaultSettings.goals,
      teamId: PREMIER_LEAGUE_2026_27_TEAMS.some((team) => team.id === saved?.teamId) ? saved.teamId : null,
    };
  } catch {
    return { upset: defaultSettings.upset, goals: defaultSettings.goals, teamId: null };
  }
}

function savePremierLeagueMenuSetup() {
  try {
    localStorage.setItem(PREMIER_LEAGUE_SETUP_STORAGE_KEY, JSON.stringify(premierLeagueMenuSetup));
  } catch {
    // The menu setup remains usable for the current page when storage is unavailable.
  }
}

function accountHasPremierLeagueAssets(account) {
  return Array.isArray(account?.assetPacks) && account.assetPacks.includes(PREMIER_LEAGUE_ASSET_PACK_ID);
}

function premierLeagueBadgeMarkup(team, className = "premier-league-club-badge") {
  return `<img class="${className}" src="${team.badge}" alt="" loading="lazy" decoding="async" />`;
}

function renderPremierLeagueAssetPackPreview() {
  if (!els.plAssetPackBadgeGrid) return;
  els.plAssetPackBadgeGrid.innerHTML = PREMIER_LEAGUE_2026_27_TEAMS.map((team) => `
    <span class="pl-asset-pack-badge" title="${escapeHtml(team.name)}">
      ${premierLeagueBadgeMarkup(team)}
    </span>
  `).join("");
}

function renderPremierLeagueAssetState() {
  const assetsWereInstalled = premierLeagueAssetsInstalled;
  premierLeagueAssetsInstalled = accountHasPremierLeagueAssets(premierLeagueAssetAccount);
  if (els.premierLeagueLogo) els.premierLeagueLogo.hidden = !premierLeagueAssetsInstalled;
  if (els.premierLeagueLogoPlaceholder) els.premierLeagueLogoPlaceholder.hidden = premierLeagueAssetsInstalled;
  if (els.premierLeagueInstallButton) {
    els.premierLeagueInstallButton.textContent = premierLeagueAssetsInstalled ? "Assets installed" : "Install assets";
    els.premierLeagueInstallButton.classList.toggle("is-installed", premierLeagueAssetsInstalled);
    els.premierLeagueInstallButton.setAttribute("aria-pressed", String(premierLeagueAssetsInstalled));
  }
  if (els.plAssetPackConfirmButton) {
    els.plAssetPackConfirmButton.disabled = premierLeagueAssetInstallBusy || premierLeagueAssetsInstalled;
    els.plAssetPackConfirmButton.textContent = premierLeagueAssetsInstalled
      ? "Installed"
      : premierLeagueAssetAccount
        ? "Install asset pack"
        : "Log in to install";
  }
  renderPremierLeagueTeamPicker();
  if (spectatePickerMode === "premier-league" && els.spectateModal?.open) {
    renderPremierLeagueTeamList(els.spectateSearch?.value || "");
  }
  if (
    assetsWereInstalled !== premierLeagueAssetsInstalled
    && state?.premierLeagueSeason
    && document.body.classList.contains("pl-match-mode-active")
  ) {
    requestAnimationFrame(() => {
      if (!state?.premierLeagueSeason || !document.body.classList.contains("pl-match-mode-active")) return;
      render();
      window.PremierLeagueSeason?.renderEngineTable?.();
    });
  }
}

function setPremierLeagueAssetAccount(account) {
  premierLeagueAssetAccount = account || null;
  renderPremierLeagueAssetState();
}

function openPremierLeagueAssetPack() {
  renderPremierLeagueAssetPackPreview();
  if (els.plAssetPackStatus) {
    els.plAssetPackStatus.textContent = premierLeagueAssetsInstalled
      ? "This asset pack is installed on your account."
      : premierLeagueAssetAccount
        ? `Ready to install for ${premierLeagueAssetAccount.username}.`
        : "Log in to save this asset pack to your account.";
    els.plAssetPackStatus.classList.toggle("is-success", premierLeagueAssetsInstalled);
    els.plAssetPackStatus.classList.remove("is-error");
  }
  renderPremierLeagueAssetState();
  if (!els.plAssetPackModal?.open) els.plAssetPackModal?.showModal();
}

async function installPremierLeagueAssetPack() {
  if (premierLeagueAssetInstallBusy || premierLeagueAssetsInstalled) return;
  if (!premierLeagueAssetAccount) {
    els.plAssetPackModal?.close();
    document.querySelector("#mainAccountButton")?.click();
    showToast("Log in, then install the PL 26/27 Asset Pack.");
    return;
  }
  premierLeagueAssetInstallBusy = true;
  renderPremierLeagueAssetState();
  if (els.plAssetPackStatus) {
    els.plAssetPackStatus.textContent = "Installing 20 club badges...";
    els.plAssetPackStatus.classList.remove("is-error", "is-success");
  }
  try {
    const response = await fetch(`/api/challenge/assets/${PREMIER_LEAGUE_ASSET_PACK_ID}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "The asset pack could not be installed.");
      error.status = response.status;
      throw error;
    }
    setPremierLeagueAssetAccount(payload.account || {
      ...premierLeagueAssetAccount,
      assetPacks: [PREMIER_LEAGUE_ASSET_PACK_ID],
    });
    if (els.plAssetPackStatus) {
      els.plAssetPackStatus.textContent = "Installed. The Premier League logo and all 20 club badges are now active.";
      els.plAssetPackStatus.classList.add("is-success");
    }
    showToast("PL 26/27 Asset Pack installed.");
  } catch (error) {
    if (error.status === 401) premierLeagueAssetAccount = null;
    if (els.plAssetPackStatus) {
      els.plAssetPackStatus.textContent = error.status === 401
        ? "Your session expired. Log in again to install this pack."
        : error.message;
      els.plAssetPackStatus.classList.add("is-error");
    }
  } finally {
    premierLeagueAssetInstallBusy = false;
    renderPremierLeagueAssetState();
  }
}

function renderUclAssetPackPreview() {
  if (!els.uclAssetPackBadgeGrid) return;
  els.uclAssetPackBadgeGrid.innerHTML = UCL_2026_27_QUALIFIED_TEAMS.map((team) => `
    <span class="pl-asset-pack-badge" title="${escapeHtml(team.name)}">
      ${uclClubBadgeMarkup(team)}
    </span>
  `).join("");
}

function renderUclAssetState() {
  uclAssetsInstalled = accountHasUclAssets(uclAssetAccount);
  if (els.uclInstallButton) {
    els.uclInstallButton.textContent = uclAssetsInstalled ? "Assets installed" : "Install assets";
    els.uclInstallButton.classList.toggle("is-installed", uclAssetsInstalled);
    els.uclInstallButton.setAttribute("aria-pressed", String(uclAssetsInstalled));
  }
  if (els.uclAssetPackConfirmButton) {
    els.uclAssetPackConfirmButton.disabled = uclAssetInstallBusy || uclAssetsInstalled;
    els.uclAssetPackConfirmButton.textContent = uclAssetsInstalled
      ? "Installed"
      : uclAssetAccount
        ? "Install asset pack"
        : "Log in to install";
  }
  renderUclTeamPicker();
  if (spectatePickerMode === "ucl" && els.spectateModal?.open) {
    renderUclTeamList(els.spectateSearch?.value || "");
  }
}

function setUclAssetAccount(account) {
  uclAssetAccount = account || null;
  renderUclAssetState();
}

function openUclAssetPack() {
  renderUclAssetPackPreview();
  if (els.uclAssetPackStatus) {
    els.uclAssetPackStatus.textContent = uclAssetsInstalled
      ? "This asset pack is installed on your account."
      : uclAssetAccount
        ? `Ready to install for ${uclAssetAccount.username}.`
        : "Log in to save this asset pack to your account.";
    els.uclAssetPackStatus.classList.toggle("is-success", uclAssetsInstalled);
    els.uclAssetPackStatus.classList.remove("is-error");
  }
  renderUclAssetState();
  if (!els.uclAssetPackModal?.open) els.uclAssetPackModal?.showModal();
}

async function installUclAssetPack() {
  if (uclAssetInstallBusy || uclAssetsInstalled) return;
  if (!uclAssetAccount) {
    els.uclAssetPackModal?.close();
    document.querySelector("#mainAccountButton")?.click();
    showToast("Log in, then install the UCL 26/27 Asset Pack.");
    return;
  }
  uclAssetInstallBusy = true;
  renderUclAssetState();
  if (els.uclAssetPackStatus) {
    els.uclAssetPackStatus.textContent = "Installing 29 club badges...";
    els.uclAssetPackStatus.classList.remove("is-error", "is-success");
  }
  try {
    const response = await fetch(`/api/challenge/assets/${UCL_ASSET_PACK_ID}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "The asset pack could not be installed.");
      error.status = response.status;
      throw error;
    }
    setUclAssetAccount(payload.account || {
      ...uclAssetAccount,
      assetPacks: [...new Set([...(uclAssetAccount.assetPacks || []), UCL_ASSET_PACK_ID])],
    });
    if (els.uclAssetPackStatus) {
      els.uclAssetPackStatus.textContent = "Installed. The UCL mark and all 29 club crests are now active.";
      els.uclAssetPackStatus.classList.add("is-success");
    }
    showToast("UCL 26/27 Asset Pack installed.");
  } catch (error) {
    if (error.status === 401) uclAssetAccount = null;
    if (els.uclAssetPackStatus) {
      els.uclAssetPackStatus.textContent = error.status === 401
        ? "Your session expired. Log in again to install this pack."
        : error.message;
      els.uclAssetPackStatus.classList.add("is-error");
    }
  } finally {
    uclAssetInstallBusy = false;
    renderUclAssetState();
  }
}

function selectedPremierLeagueTeam() {
  return PREMIER_LEAGUE_2026_27_TEAMS.find((team) => team.id === premierLeagueMenuSetup.teamId) || null;
}

function renderPremierLeagueTeamPicker() {
  const team = selectedPremierLeagueTeam();
  const seasonStarted = window.PremierLeagueSeason?.hasStarted?.() === true;
  if (els.premierLeagueTeamPickerButton) {
    els.premierLeagueTeamPickerButton.disabled = seasonStarted;
    els.premierLeagueTeamPickerButton.title = seasonStarted
      ? "Restart the season before changing clubs."
      : "";
  }
  els.premierLeagueTeamPickerButton?.classList.toggle("has-team", Boolean(team));
  if (!team) {
    if (els.premierLeagueTeamPickerMark) els.premierLeagueTeamPickerMark.textContent = "PL";
    if (els.premierLeagueTeamLabel) els.premierLeagueTeamLabel.textContent = "Neutral";
    if (els.premierLeagueTeamHint) {
      els.premierLeagueTeamHint.textContent = seasonStarted ? "Club choice locked for this season" : "Watch the whole title race";
    }
    els.premierLeagueTeamPickerButton?.setAttribute("aria-label", "Choose a Premier League club. Current view: Neutral");
    return;
  }
  els.premierLeagueTeamPickerMark.innerHTML = premierLeagueAssetsInstalled
    ? premierLeagueBadgeMarkup(team)
    : team.code;
  els.premierLeagueTeamLabel.textContent = team.name;
  els.premierLeagueTeamHint.textContent = seasonStarted
    ? "Club choice locked for this season"
    : "Manage this club through 38 matches";
  els.premierLeagueTeamPickerButton.setAttribute(
    "aria-label",
    seasonStarted ? `${team.name} is locked for this season` : `Change ${team.name} as your Premier League club`,
  );
}

function renderPremierLeagueTeamList(query = "") {
  const normalized = query.trim().toLowerCase();
  const teams = PREMIER_LEAGUE_2026_27_TEAMS.filter((team) => team.name.toLowerCase().includes(normalized));
  const neutralOption = normalized
    ? ""
    : `
      <button class="prediction-option spectate-neutral-option ${premierLeagueMenuSetup.teamId ? "" : "selected"}" type="button" data-prem-team-id="">
        <span class="spectate-neutral-mark" aria-hidden="true">PL</span>
        <span><strong>Neutral</strong><small>Watch all 380 matches</small></span>
        <i aria-hidden="true">${premierLeagueMenuSetup.teamId ? "" : "&#10003;"}</i>
      </button>
    `;
  els.spectateList.innerHTML = neutralOption + teams.map((team) => `
    <button class="prediction-option ${team.id === premierLeagueMenuSetup.teamId ? "selected" : ""}" type="button" data-prem-team-id="${team.id}">
      ${premierLeagueAssetsInstalled
        ? premierLeagueBadgeMarkup(team)
        : `<span class="premier-league-club-code" aria-hidden="true">${team.code}</span>`}
      <span><strong>${team.name}</strong><small>${team.promoted ? "Promoted for 2026/27" : "Premier League club"}</small></span>
      <i aria-hidden="true">${team.id === premierLeagueMenuSetup.teamId ? "&#10003;" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No Premier League club matches that search.</div>`;
}

function openPremierLeagueTeamPicker() {
  spectatePickerMode = "premier-league";
  els.spectateModalTitle.textContent = "Choose a Premier League club";
  els.spectateSearch.placeholder = "Search 20 clubs";
  els.spectateSearch.value = "";
  renderPremierLeagueTeamList();
  els.spectateModal.showModal();
  requestAnimationFrame(() => els.spectateSearch.focus());
}

function retroWorldCupTeamStorageKey(year) {
  return `${RETRO_WORLD_CUP_TEAM_KEY_PREFIX}-${year}`;
}

function readRetroCompetition() {
  if ([2016, 2020].includes(Number(retroWorldCupYearFromPath()))) return "euros";
  try {
    const savedCompetition = localStorage.getItem(RETRO_COMPETITION_KEY);
    return ["wc", "euros", "copa", "afcon"].includes(savedCompetition) ? savedCompetition : "wc";
  } catch {
    return "wc";
  }
}

function readRetroEuroYear() {
  try {
    const year = localStorage.getItem(RETRO_EURO_YEAR_KEY);
    return ["2016", "2020"].includes(year) ? year : "2016";
  } catch {
    return "2016";
  }
}

function selectedRetroTournamentYear() {
  const competition = readRetroCompetition();
  if (competition === "euros") return Number(readRetroEuroYear());
  if (competition === "copa") return 2024;
  if (competition === "afcon") return 0;
  return Number(readRetroWorldCupYear());
}

function retroMenuTeamEntries(year = readRetroWorldCupYear()) {
  const competition = readRetroCompetition();
  if (competition === "euros") return readRetroEuroYear() === "2020" ? RETRO_EURO_2020.teams : RETRO_EURO_2016.teams;
  if (competition === "copa") return RETRO_COPA_2024.teams;
  return retroWorldCupMenuTeams(year);
}

function retroWorldCupMenuTeams(year) {
  return RETRO_WORLD_CUPS[year]?.teams || RETRO_WORLD_CUP_PREVIEW_TEAMS[year] || [];
}

function retroEuroEdition(year = readRetroEuroYear()) {
  return String(year) === RETRO_EURO_2020.year ? RETRO_EURO_2020 : RETRO_EURO_2016;
}

function retroEuroTeamStorageKey(year = readRetroEuroYear()) {
  return String(year) === RETRO_EURO_2020.year ? RETRO_EURO_2020_TEAM_KEY : RETRO_EURO_2016_TEAM_KEY;
}

function readRetroEuroTeam(year = readRetroEuroYear()) {
  try {
    const edition = retroEuroEdition(year);
    const name = localStorage.getItem(retroEuroTeamStorageKey(year));
    return edition.teams.some((team) => team.name === name) ? name : null;
  } catch {
    return null;
  }
}

function saveRetroEuroTeam(name, year = readRetroEuroYear()) {
  try {
    const key = retroEuroTeamStorageKey(year);
    if (name) localStorage.setItem(key, name);
    else localStorage.removeItem(key);
  } catch {
    // Selection remains usable for the current page when storage is unavailable.
  }
}

function readRetroCopaTeam() {
  try {
    const name = localStorage.getItem(RETRO_COPA_2024_TEAM_KEY);
    return RETRO_COPA_2024.teams.some((team) => team.name === name) ? name : null;
  } catch {
    return null;
  }
}

function saveRetroCopaTeam(name) {
  try {
    if (name) localStorage.setItem(RETRO_COPA_2024_TEAM_KEY, name);
    else localStorage.removeItem(RETRO_COPA_2024_TEAM_KEY);
  } catch {
    // Selection remains usable for the current page when storage is unavailable.
  }
}

function readRetroWorldCupTeam(year) {
  try {
    const name = localStorage.getItem(retroWorldCupTeamStorageKey(year));
    return retroWorldCupMenuTeams(year).some((team) => team.name === name) ? name : null;
  } catch {
    return null;
  }
}

function saveRetroWorldCupTeam(year, name) {
  try {
    if (name) localStorage.setItem(retroWorldCupTeamStorageKey(year), name);
    else localStorage.removeItem(retroWorldCupTeamStorageKey(year));
  } catch {
    // Selection remains usable for the current page when storage is unavailable.
  }
}

function retroWorldCupTeamData(year, name) {
  return retroWorldCupMenuTeams(year).find((team) => team.name === name) || null;
}

function retroTournamentForYear(year) {
  if (retroTournament && Number(retroTournament.year) === Number(year)) return retroTournament;
  return readRetroTournamentState(year);
}

function retroTournamentLockedSetup(tournament, fallbackSettings = retroMenuSettings) {
  if (!tournament) return null;
  const saved = tournament.lockedSetup || {};
  const managedTeam = Object.hasOwn(saved, "managedTeam")
    ? saved.managedTeam
    : tournament.managedTeam || null;
  return {
    managedTeam: retroWorldCupTeamData(tournament.year, managedTeam) ? managedTeam : null,
    upset: SIMULATION_CONFIG.modes[saved.upset] ? saved.upset : fallbackSettings.upset,
    goals: SIMULATION_CONFIG.goals[saved.goals] ? saved.goals : fallbackSettings.goals,
  };
}

function lockRetroTournamentSetup(tournament, setup = {}) {
  if (!tournament) return null;
  const fallbackSettings = {
    upset: SIMULATION_CONFIG.modes[setup.upset] ? setup.upset : retroMenuSettings.upset,
    goals: SIMULATION_CONFIG.goals[setup.goals] ? setup.goals : retroMenuSettings.goals,
  };
  const existing = retroTournamentLockedSetup(tournament, fallbackSettings);
  const lockedSetup = tournament.lockedSetup
    ? existing
    : {
        managedTeam: retroWorldCupTeamData(tournament.year, setup.managedTeam)
          ? setup.managedTeam
          : tournament.managedTeam || null,
        ...fallbackSettings,
      };
  tournament.lockedSetup = lockedSetup;
  tournament.managedTeam = lockedSetup.managedTeam;
  return lockedSetup;
}

function renderRetroWorldCupTeamPicker(year) {
  const competition = readRetroCompetition();
  const isEuros = competition === "euros";
  const isCopa = competition === "copa";
  const selectedYear = isCopa ? RETRO_COPA_2024.year : isEuros ? readRetroEuroYear() : year;
  const euroEdition = isEuros ? retroEuroEdition(selectedYear) : null;
  const activeTournament = retroTournamentForYear(selectedYear);
  const selectedName = isCopa
    ? readRetroCopaTeam()
    : isEuros
    ? activeTournament
      ? retroTournamentLockedSetup(activeTournament)?.managedTeam
      : readRetroEuroTeam(selectedYear)
    : activeTournament
      ? retroTournamentLockedSetup(activeTournament)?.managedTeam
      : readRetroWorldCupTeam(year);
  const selected = isCopa
    ? RETRO_COPA_2024.teams.find((team) => team.name === selectedName)
    : isEuros
    ? euroEdition.teams.find((team) => team.name === selectedName)
    : retroWorldCupTeamData(year, selectedName);
  const team = selected ? retroTeamForFlag(selected.name) : null;
  els.retroTeamPickerButton?.classList.toggle("has-team", Boolean(team));
  if (!team || !selected) {
    if (els.retroTeamPickerMark) els.retroTeamPickerMark.textContent = "◎";
    if (els.retroWorldCupTeamLabel) els.retroWorldCupTeamLabel.textContent = "Neutral";
    if (els.retroWorldCupTeamHint) els.retroWorldCupTeamHint.textContent = "Show every match as normal";
    els.retroTeamPickerButton?.setAttribute(
      "aria-label",
      isCopa
        ? "Choose a team from Copa América 2024. Current view: Neutral"
        : isEuros
        ? `Choose a team from Euro ${selectedYear}. Current view: Neutral`
        : `Choose a team from the ${year} World Cup. Current view: Neutral`,
    );
    return;
  }
  els.retroTeamPickerMark.innerHTML = flagMarkup(team, "spectate-picker-flag");
  els.retroWorldCupTeamLabel.textContent = team.name;
  els.retroWorldCupTeamHint.textContent = `Group ${selected.group}`;
  els.retroTeamPickerButton.setAttribute(
    "aria-label",
    isCopa
      ? `Change ${team.name} as your Copa América 2024 team`
      : isEuros
        ? `Change ${team.name} as your Euro ${selectedYear} team`
        : `Change ${team.name} as your ${year} World Cup team`,
  );
}

function renderRetroWorldCupTeamList(query = "") {
  const year = selectedRetroTournamentYear();
  const competition = readRetroCompetition();
  const isEuros = competition === "euros";
  const isCopa = competition === "copa";
  const activeTournament = retroTournamentForYear(year);
  const selectedName = isCopa
    ? readRetroCopaTeam()
    : isEuros
    ? activeTournament
      ? retroTournamentLockedSetup(activeTournament)?.managedTeam
      : readRetroEuroTeam(year)
    : activeTournament
      ? retroTournamentLockedSetup(activeTournament)?.managedTeam
      : readRetroWorldCupTeam(year);
  const normalized = query.trim().toLowerCase();
  const teams = retroMenuTeamEntries(year)
    .filter((entry) => entry.name.toLowerCase().includes(normalized))
    .map((entry) => ({
      ...entry,
      team: retroTeamForFlag(entry.name),
    }))
    .filter((entry) => entry.team);
  const neutralOption = normalized ? "" : `
    <button class="prediction-option spectate-neutral-option ${selectedName ? "" : "selected"}" type="button" data-retro-team-name="">
      <span class="spectate-neutral-mark" aria-hidden="true">◎</span>
      <span><strong>Neutral</strong><small>Show every match as normal</small></span>
      <i aria-hidden="true">${selectedName ? "" : "✓"}</i>
    </button>
  `;
  els.spectateList.innerHTML = neutralOption + teams.map((entry) => `
    <button class="prediction-option ${entry.name === selectedName ? "selected" : ""}" type="button" data-retro-team-name="${entry.name}">
      ${flagMarkup(entry.team, "prediction-option-flag")}
      <span><strong>${entry.name}</strong><small>Group ${entry.group}</small></span>
      <i aria-hidden="true">${entry.name === selectedName ? "✓" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No ${isCopa ? "Copa América 2024" : isEuros ? `Euro ${year}` : year} team matches that search.</div>`;
}

function openRetroWorldCupTeamPicker() {
  const year = selectedRetroTournamentYear();
  const competition = readRetroCompetition();
  const isEuros = competition === "euros";
  const isCopa = competition === "copa";
  if (retroTournamentForYear(year)) {
    showToast(`Restart this ${isEuros ? "Euro" : "World Cup"} before changing your team.`);
    return;
  }
  spectatePickerMode = "retro";
  els.spectateModalTitle.textContent = isCopa
    ? "Choose a Copa América 2024 team"
    : isEuros
      ? `Choose a Euro ${year} team`
      : `Choose a ${year} World Cup team`;
  els.spectateSearch.placeholder = isCopa
    ? "Search Copa América 2024 teams"
    : isEuros
      ? `Search Euro ${year} teams`
      : `Search ${year} teams`;
  els.spectateSearch.value = "";
  renderRetroWorldCupTeamList();
  els.spectateModal.showModal();
  requestAnimationFrame(() => els.spectateSearch.focus());
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
    if (loss) return { team, state: "eliminated", roundIndex, label: `Eliminated in ${tournamentRoundName(roundIndex)}` };
  }
  const final = state.rounds[7]?.[0];
  if (final?.result?.revealed && final.result.winnerId === team.id) {
    return { team, state: "correct", roundIndex: 7, label: "Prediction correct" };
  }
  return { team, state: "alive", roundIndex: state.activeRound, label: "Still alive" };
}

function renderPredictionList(query = "") {
  const normalized = query.trim().toLowerCase();
  const teams = TEAMS
    .filter((team) => team.name.toLowerCase().includes(normalized))
    .sort(compareTeamsByOfficialFifaRank)
    .slice(0, normalized ? 80 : 40);
  els.predictionList.innerHTML = teams.map((team) => `
    <button class="prediction-option ${team.id === state.predictionTeamId ? "selected" : ""}" type="button" data-team-id="${team.id}">
      ${flagMarkup(team, "prediction-option-flag")}
      <span><strong>${team.name}</strong><small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"}</small></span>
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
  return allMatches().filter((match) => match?.result && !match.result.bye).length;
}

function tournamentPlayerNameKey(name) {
  return String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.sort()
    .join("") || "";
}

function canonicalTournamentPlayerName(team, name) {
  const rawName = String(name || "").trim();
  if (!team || !rawName) return rawName;
  const profiles = playerProfilesForTeam(team);
  const exact = profiles.find((player) => player.name === rawName);
  if (exact) return exact.name;
  const key = tournamentPlayerNameKey(rawName);
  return profiles.find((player) => tournamentPlayerNameKey(player.name) === key)?.name || rawName;
}

function calculateRetroGoalscorerTable() {
  if (!retroTournament) return [];
  const year = Number(retroTournament.year);
  const appearances = new Map();
  const scorers = new Map();
  const matchRows = [
    ...(retroTournament.groupMatches || []).map((match) => ({
      match,
      roundIndex: Math.max(0, Number(match.matchday || 1) - 1),
    })),
    ...(retroTournament.knockoutRounds || []).flatMap((round, knockoutIndex) => (
      (round.matches || []).map((match) => ({ match, roundIndex: 3 + knockoutIndex }))
    )),
  ];

  matchRows.forEach(({ match, roundIndex }) => {
    if (!match?.result?.revealed || match.result.bye) return;
    [[match.home, "home"], [match.away, "away"]].forEach(([teamName, side]) => {
      if (!teamName) return;
      appearances.set(teamName, (appearances.get(teamName) || 0) + 1);
      (match.result[`${side}Events`] || []).forEach((event) => {
        if (!event?.scorer || event.goalType === "ownGoal" || event.ownGoal) return;
        const teamId = retroTeamId(teamName, year);
        const player = canonicalTournamentPlayerName(teamById(teamId), event.scorer);
        const key = `${teamName}\u0000${player}`;
        const current = scorers.get(key) || {
          player,
          teamId,
          teamName,
          goals: 0,
          penalties: 0,
          latestRound: roundIndex,
        };
        current.goals += 1;
        if (event.goalType === "penalty" || event.penalty === true) current.penalties += 1;
        current.latestRound = Math.max(current.latestRound, roundIndex);
        scorers.set(key, current);
      });
    });
  });

  return [...scorers.values()].map((entry) => {
    const team = teamById(entry.teamId);
    const squadProfiles = playerProfilesForTeam(team);
    const profile = squadProfiles.find((player) => player.name === entry.player);
    const matches = appearances.get(entry.teamName) || 0;
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
  }).sort((left, right) => (
    right.goals - left.goals
    || right.latestRound - left.latestRound
    || left.player.localeCompare(right.player)
  ));
}

function calculateGoalscorerTable(rounds = state.rounds) {
  if (isRetroSimulatorState() && retroTournament && rounds === state.rounds) {
    return calculateRetroGoalscorerTable();
  }
  const scorers = new Map();
  const teamAppearances = new Map();
  const playerAppearances = new Map();
  rounds.forEach((round, roundIndex) => {
    (round || []).forEach((match) => {
      if (!match?.result?.revealed || match.result.bye) return;
      teamAppearances.set(match.homeId, (teamAppearances.get(match.homeId) || 0) + 1);
      teamAppearances.set(match.awayId, (teamAppearances.get(match.awayId) || 0) + 1);
      const appearances = ensurePremierLeaguePlayerAppearances(match, roundIndex);
      if (appearances) {
        [["home", match.homeId], ["away", match.awayId]].forEach(([side, teamId]) => {
          (appearances[side] || []).forEach((player) => {
            const key = `${teamId}\u0000${player}`;
            playerAppearances.set(key, (playerAppearances.get(key) || 0) + 1);
          });
        });
      }
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
    const matches = playerAppearances.get(`${entry.teamId}\u0000${entry.player}`)
      ?? teamAppearances.get(entry.teamId)
      ?? 0;
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

function tournamentHistoryMode(candidate = state) {
  if (candidate?.retroWorldCup) return "retro";
  if (candidate?.customTournament) return "custom";
  if (candidate?.legacyTournament) return "legacy";
  return "standard";
}

function tournamentHistoryFinalRoundIndex(candidate = state) {
  if (candidate?.savedTournamentView) return Math.max(0, candidate.rounds.length - 1);
  if (candidate?.retroWorldCup) {
    const year = Number(candidate.retroTournamentYear);
    return year === 2026 ? 7 : year === 2024 ? 5 : 6;
  }
  if (candidate?.customTournament) {
    return customRoundNames(
      candidate.customTournament.teamCount,
      candidate.customTournament.structure,
    ).length - 1;
  }
  return 7;
}

function tournamentHistoryFinalMatch(candidate = state) {
  const finalRound = candidate?.rounds?.[tournamentHistoryFinalRoundIndex(candidate)] || [];
  return finalRound.find((match) => !isThirdPlacePlayoff(match)) || null;
}

function tournamentHistorySourceKey(candidate = state) {
  const mode = tournamentHistoryMode(candidate);
  const year = candidate?.retroWorldCup
    ? Number(retroTournament?.year || candidate.retroYear || readRetroWorldCupYear())
    : 0;
  const seed = Number(candidate?.drawSeed || retroTournament?.seed || 0);
  const championId = tournamentHistoryFinalMatch(candidate)?.result?.winnerId || "unfinished";
  return `${mode}:${year}:${seed}:${championId}`;
}

function tournamentHistoryIsComplete(candidate = state) {
  const final = tournamentHistoryFinalMatch(candidate);
  return Boolean(
    candidate?.started
    && final?.result?.revealed
    && final.result.winnerId
    && [final.homeId, final.awayId].includes(final.result.winnerId),
  );
}

function upgradeTournamentHistoryRecord(record) {
  const premierLeagueRecord = record?.mode === "premier-league"
    || record?.theme === "premier-league"
    || String(record?.sourceKey || "").startsWith("premier-league:2026-27:");
  if (!premierLeagueRecord) return record;

  const currentClubs = new Map(
    (window.PREMIER_LEAGUE_2026_27_CLUBS || []).map((club) => [club.id, club]),
  );
  const referencedTeamIds = new Set([
    ...Object.keys(record.teams || {}),
    ...(record.rounds || []).flatMap((round) => (
      (round || []).flatMap((match) => [match?.homeId, match?.awayId])
    )),
  ].filter(Boolean));
  const teams = Object.fromEntries([...referencedTeamIds].map((teamId) => {
    const savedTeam = record.teams?.[teamId] || {};
    const currentClub = currentClubs.get(teamId);
    return [teamId, {
      ...savedTeam,
      id: teamId,
      name: savedTeam.name || currentClub?.name || teamId,
      mobileName: currentClub?.mobileName || savedTeam.mobileName || savedTeam.name || currentClub?.name || teamId,
      code: savedTeam.code || currentClub?.code || "PL",
      badge: savedTeam.badge || currentClub?.badge || null,
    }];
  }));
  const rounds = Array.isArray(record.rounds) ? record.rounds : [];
  return {
    ...record,
    mode: "premier-league",
    theme: "premier-league",
    year: 2026,
    typeLabel: "Premier League 2026/27",
    editionLabel: "PL 26/27",
    teams,
    roundNames: rounds.length === 38
      ? rounds.map((_, index) => `Matchweek ${index + 1}`)
      : record.roundNames,
  };
}

function normalizeTournamentHistoryRecords(records) {
  const recordsById = new Map();
  (Array.isArray(records) ? records : []).map(upgradeTournamentHistoryRecord).forEach((record) => {
    if (
      record?.version !== TOURNAMENT_HISTORY_VERSION
      || typeof record.id !== "string"
      || typeof record.sourceKey !== "string"
      || !Array.isArray(record.rounds)
      || !record.rounds.length
    ) return;
    const existing = recordsById.get(record.id);
    if (!existing || Number(record.savedAt || 0) >= Number(existing.savedAt || 0)) {
      recordsById.set(record.id, record);
    }
  });
  return [...recordsById.values()]
    .sort((left, right) => Number(right.savedAt || 0) - Number(left.savedAt || 0))
    .slice(0, TOURNAMENT_HISTORY_LIMIT);
}

function readLegacyTournamentHistoryRecords() {
  try {
    const payload = JSON.parse(localStorage.getItem(TOURNAMENT_HISTORY_STORAGE_KEY) || "[]");
    return normalizeTournamentHistoryRecords(payload);
  } catch {
    return [];
  }
}

let tournamentHistoryRecordsCache = readLegacyTournamentHistoryRecords();
let tournamentHistoryDatabasePromise = null;
let tournamentHistoryInitializationPromise = null;
let tournamentHistoryWriteQueue = Promise.resolve();
let tournamentHistoryCacheRevision = 0;
const tournamentHistoryDeletedIds = new Set();

function readTournamentHistoryRecords() {
  return [...tournamentHistoryRecordsCache];
}

function writeLegacyTournamentHistoryRecords(records) {
  try {
    localStorage.setItem(
      TOURNAMENT_HISTORY_STORAGE_KEY,
      JSON.stringify(normalizeTournamentHistoryRecords(records)),
    );
    return true;
  } catch {
    return false;
  }
}

function openTournamentHistoryDatabase() {
  if (tournamentHistoryDatabasePromise) return tournamentHistoryDatabasePromise;
  tournamentHistoryDatabasePromise = new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }
    const request = window.indexedDB.open(
      TOURNAMENT_HISTORY_DATABASE_NAME,
      TOURNAMENT_HISTORY_DATABASE_VERSION,
    );
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(TOURNAMENT_HISTORY_OBJECT_STORE)) {
        request.result.createObjectStore(TOURNAMENT_HISTORY_OBJECT_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open tournament history."));
    request.onblocked = () => reject(new Error("Tournament history migration was blocked."));
  });
  return tournamentHistoryDatabasePromise;
}

function readIndexedTournamentHistoryRecords(database) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TOURNAMENT_HISTORY_OBJECT_STORE, "readonly");
    const request = transaction.objectStore(TOURNAMENT_HISTORY_OBJECT_STORE).getAll();
    request.onsuccess = () => resolve(normalizeTournamentHistoryRecords(request.result));
    request.onerror = () => reject(request.error || new Error("Could not read tournament history."));
    transaction.onabort = () => reject(transaction.error || new Error("Tournament history read was aborted."));
  });
}

function replaceIndexedTournamentHistoryRecords(database, records) {
  const next = normalizeTournamentHistoryRecords(records);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TOURNAMENT_HISTORY_OBJECT_STORE, "readwrite");
    const store = transaction.objectStore(TOURNAMENT_HISTORY_OBJECT_STORE);
    store.clear();
    next.forEach((record) => store.put(record));
    transaction.oncomplete = () => resolve(next);
    transaction.onerror = () => reject(transaction.error || new Error("Could not save tournament history."));
    transaction.onabort = () => reject(transaction.error || new Error("Tournament history save was aborted."));
  });
}

function mergeTournamentHistoryRecords(indexedRecords, currentRecords) {
  return normalizeTournamentHistoryRecords([
    ...indexedRecords.filter((record) => !tournamentHistoryDeletedIds.has(record.id)),
    ...currentRecords,
  ]);
}

function dispatchTournamentHistoryStorageError() {
  window.dispatchEvent(new CustomEvent("tournament-history-storage-error"));
}

function initializeTournamentHistoryStorage() {
  if (tournamentHistoryInitializationPromise) return tournamentHistoryInitializationPromise;
  tournamentHistoryInitializationPromise = (async () => {
    const database = await openTournamentHistoryDatabase();
    let indexedRecords = await readIndexedTournamentHistoryRecords(database);
    while (true) {
      const revision = tournamentHistoryCacheRevision;
      const mergedRecords = mergeTournamentHistoryRecords(
        indexedRecords,
        tournamentHistoryRecordsCache,
      );
      await replaceIndexedTournamentHistoryRecords(database, mergedRecords);

      const verifiedRecords = await readIndexedTournamentHistoryRecords(database);
      const verifiedIds = new Set(verifiedRecords.map((record) => record.id));
      if (
        verifiedRecords.length !== mergedRecords.length
        || mergedRecords.some((record) => !verifiedIds.has(record.id))
      ) {
        throw new Error("Tournament history migration could not be verified.");
      }
      if (revision === tournamentHistoryCacheRevision) {
        tournamentHistoryRecordsCache = verifiedRecords;
        break;
      }
      indexedRecords = verifiedRecords;
    }

    try {
      localStorage.setItem(TOURNAMENT_HISTORY_MIGRATION_KEY, "complete");
      localStorage.removeItem(TOURNAMENT_HISTORY_STORAGE_KEY);
    } catch {
      // IndexedDB is verified; retaining an extra legacy copy is harmless.
    }
    window.dispatchEvent(new CustomEvent("tournament-history-changed", {
      detail: { migrated: true },
    }));
    return database;
  })().catch((error) => {
    console.warn("Tournament history is using legacy browser storage.", error);
    if (!writeLegacyTournamentHistoryRecords(tournamentHistoryRecordsCache)) {
      dispatchTournamentHistoryStorageError();
    }
    return null;
  });
  return tournamentHistoryInitializationPromise;
}

function queueTournamentHistoryWrite() {
  tournamentHistoryWriteQueue = tournamentHistoryWriteQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await initializeTournamentHistoryStorage();
      if (!database) {
        if (!writeLegacyTournamentHistoryRecords(tournamentHistoryRecordsCache)) {
          throw new Error("Tournament history could not be stored.");
        }
        return;
      }
      await replaceIndexedTournamentHistoryRecords(database, tournamentHistoryRecordsCache);
    })
    .catch((error) => {
      console.warn("Could not persist tournament history.", error);
      dispatchTournamentHistoryStorageError();
    });
}

function writeTournamentHistoryRecords(records) {
  const next = normalizeTournamentHistoryRecords(records);
  const nextIds = new Set(next.map((record) => record.id));
  tournamentHistoryRecordsCache.forEach((record) => {
    if (!nextIds.has(record.id)) tournamentHistoryDeletedIds.add(record.id);
  });
  next.forEach((record) => tournamentHistoryDeletedIds.delete(record.id));
  tournamentHistoryRecordsCache = next;
  tournamentHistoryCacheRevision += 1;

  if (!("indexedDB" in window)) {
    return writeLegacyTournamentHistoryRecords(next);
  }
  queueTournamentHistoryWrite();
  return true;
}

function compactTournamentHistoryEvent(event) {
  if (!event || typeof event !== "object") return null;
  return {
    minute: Number(event.minute) || 0,
    scorer: event.scorer || null,
    assist: event.assist || event.metadata?.assist || null,
    player: event.player || null,
    side: event.side || null,
    type: event.type || null,
    goalType: event.goalType || null,
    ownGoal: event.ownGoal === true,
    scored: event.scored,
  };
}

function compactTournamentHistoryResult(result) {
  if (!result) return null;
  return {
    revealed: result.revealed !== false,
    bye: result.bye === true,
    homeGoals: Number(result.homeGoals) || 0,
    awayGoals: Number(result.awayGoals) || 0,
    regulationHome: Number.isFinite(Number(result.regulationHome)) ? Number(result.regulationHome) : null,
    regulationAway: Number.isFinite(Number(result.regulationAway)) ? Number(result.regulationAway) : null,
    extraTime: result.extraTime === true,
    penalties: result.penalties
      ? { home: Number(result.penalties.home) || 0, away: Number(result.penalties.away) || 0 }
      : null,
    winnerId: result.winnerId || null,
    playerAppearances: result.playerAppearances ? {
      home: [...(result.playerAppearances.home || [])],
      away: [...(result.playerAppearances.away || [])],
    } : null,
    homeEvents: (result.homeEvents || []).map(compactTournamentHistoryEvent).filter(Boolean),
    awayEvents: (result.awayEvents || []).map(compactTournamentHistoryEvent).filter(Boolean),
    redCards: (result.redCards || []).map(compactTournamentHistoryEvent).filter(Boolean),
    injuries: (result.injuries || []).map(compactTournamentHistoryEvent).filter(Boolean),
    shootout: (result.shootout || []).map(compactTournamentHistoryEvent).filter(Boolean),
  };
}

function compactTournamentHistoryTeam(team) {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    code: team.code || "XX",
    flag: team.flag || "🏳️",
    badge: team.badge || null,
    retroWorldCup: team.retroWorldCup === true,
    retroYear: team.retroYear || null,
  };
}

function tournamentHistoryRoundNames(candidate = state) {
  if (candidate?.retroWorldCup) return retroRoundNames(candidate.retroTournamentYear);
  if (candidate?.customTournament) {
    return customRoundNames(
      candidate.customTournament.teamCount,
      candidate.customTournament.structure,
    );
  }
  return [...ROUND_NAMES];
}

function tournamentHistoryManagedOutcome(candidate, managedTeamId, championId, roundNames) {
  if (!managedTeamId) return "Neutral view";
  if (managedTeamId === championId) return "Champions";
  let lastRoundIndex = -1;
  let eliminated = false;
  candidate.rounds.forEach((round, roundIndex) => (round || []).forEach((match) => {
    if (match.homeId !== managedTeamId && match.awayId !== managedTeamId) return;
    if (!match.result?.revealed) return;
    lastRoundIndex = Math.max(lastRoundIndex, roundIndex);
    if (
      match.result.winnerId
      && match.result.winnerId !== managedTeamId
      && !match.allowDraw
      && !isThirdPlacePlayoff(match)
    ) eliminated = true;
  }));
  if (lastRoundIndex < 0) return "No managed matches";
  const roundName = roundNames[lastRoundIndex] || `Round ${lastRoundIndex + 1}`;
  return eliminated ? `Reached ${roundName}` : `Finished ${roundName}`;
}

function createTournamentHistoryRecord() {
  if (!tournamentHistoryIsComplete(state)) return null;
  const mode = tournamentHistoryMode(state);
  const year = mode === "retro"
    ? Number(retroTournament?.year || readRetroWorldCupYear())
    : null;
  const edition = year ? RETRO_WORLD_CUP_EDITIONS[year] : null;
  const final = tournamentHistoryFinalMatch(state);
  const championId = final.result.winnerId;
  const runnerUpId = championId === final.homeId ? final.awayId : final.homeId;
  const sourceRoundNames = tournamentHistoryRoundNames(state);
  const savedRoundIndexes = state.rounds
    .map((round, roundIndex) => (round?.length ? roundIndex : -1))
    .filter((roundIndex) => roundIndex >= 0);
  const roundNames = savedRoundIndexes.map((roundIndex) => sourceRoundNames[roundIndex]);
  const managedTeamId = state._activeSpectateId
    || state.spectateTeamId
    || (mode === "retro" && retroTournament?.managedTeam
      ? retroTeamId(retroTournament.managedTeam, year)
      : null);
  const allTournamentMatches = state.rounds.flatMap((round) => round || []);
  const teamIds = [...new Set(allTournamentMatches.flatMap((match) => [match.homeId, match.awayId]).filter(Boolean))];
  const teams = Object.fromEntries(teamIds.map((teamId) => {
    const compactTeam = compactTournamentHistoryTeam(teamById(teamId));
    return [teamId, compactTeam || {
      id: teamId,
      name: teamId,
      code: "XX",
      flag: "🏳️",
      badge: null,
    }];
  }));
  const topScorer = calculateTopGoalscorer();
  const sourceKey = tournamentHistorySourceKey(state);
  const matchCount = allTournamentMatches.filter((match) => match?.result && !match.result.bye).length;
  const goalCount = allTournamentMatches.reduce((sum, match) => (
    sum + (match?.result?.bye ? 0 : Number(match?.result?.homeGoals || 0) + Number(match?.result?.awayGoals || 0))
  ), 0);
  const typeLabel = mode === "retro"
    ? [2016, 2020].includes(year) ? `UEFA Euro ${year}` : year === 2024 ? "Copa América USA 2024" : `World Cup ${year}`
    : mode === "custom"
      ? `${state.customTournament.teamCount}-team custom tournament`
      : mode === "legacy"
        ? "Legacy Draft Tournament"
        : "256 Teams Knockout";
  const editionLabel = edition?.label || (
    mode === "custom" ? "Custom Tournament"
      : mode === "legacy" ? "Legacy Draft"
        : "256 Teams WC"
  );
  const savedAt = Date.now();
  return {
    version: TOURNAMENT_HISTORY_VERSION,
    id: `tournament-${Math.abs(stableHash(sourceKey)).toString(36)}`,
    sourceKey,
    savedAt,
    completedAt: savedAt,
    mode,
    theme: year ? String(year) : mode === "standard" ? "256" : mode,
    year,
    typeLabel,
    editionLabel,
    logo: edition?.logo || null,
    championId,
    runnerUpId,
    managedTeamId,
    managedOutcome: tournamentHistoryManagedOutcome(state, managedTeamId, championId, sourceRoundNames),
    matchCount,
    goalCount,
    topScorer: topScorer ? {
      player: topScorer.player,
      teamId: topScorer.teamId,
      goals: topScorer.goals,
    } : null,
    roundNames,
    teams,
    rounds: savedRoundIndexes.map((roundIndex) => (state.rounds[roundIndex] || []).map((match) => ({
      id: match.id,
      homeId: match.homeId,
      awayId: match.awayId,
      allowDraw: match.allowDraw === true,
      customGroupLabel: match.customGroupLabel || null,
      thirdPlacePlayoff: isThirdPlacePlayoff(match),
      schedule: match.schedule ? {
        dateLabel: match.schedule.dateLabel || null,
        timeLabel: match.schedule.timeLabel || null,
        stadium: match.schedule.stadium || null,
        city: match.schedule.city || null,
      } : null,
      result: compactTournamentHistoryResult(match.result),
    }))),
  };
}

function currentTournamentHistoryRecord() {
  if (!tournamentHistoryIsComplete(state)) return null;
  const sourceKey = tournamentHistorySourceKey(state);
  return readTournamentHistoryRecords().find((record) => record.sourceKey === sourceKey) || null;
}

function syncChampionTournamentHistoryButton() {
  if (!els.championSaveTournament || !els.championSaveTournamentLabel) return;
  const customMatch = state?.customTournament?.customMatch === true;
  els.championSaveTournament.hidden = state?.savedTournamentView === true || customMatch;
  if (state?.savedTournamentView || customMatch) return;
  const savedRecord = currentTournamentHistoryRecord();
  els.championSaveTournament.classList.toggle("is-saved", Boolean(savedRecord));
  els.championSaveTournament.dataset.historyTheme = isRetroSimulatorState()
    ? String(retroTournament?.year || readRetroWorldCupYear())
    : isValidCustomTournamentState(state) ? "custom"
      : state.legacyTournament ? "legacy" : "256";
  els.championSaveTournamentLabel.textContent = savedRecord
    ? "View saved tournament"
    : "Save tournament";
  els.championSaveTournament.setAttribute(
    "aria-label",
    savedRecord ? "View this saved tournament" : "Save this completed tournament to history",
  );
}

function saveCurrentTournamentToHistory() {
  if (!tournamentHistoryIsComplete(state)) {
    showToast("Finish the tournament before saving it.");
    return null;
  }
  const existing = currentTournamentHistoryRecord();
  if (existing) return existing;
  const record = createTournamentHistoryRecord();
  if (!record) return null;
  const records = [
    record,
    ...readTournamentHistoryRecords().filter((saved) => saved.sourceKey !== record.sourceKey),
  ];
  if (!writeTournamentHistoryRecords(records)) {
    showToast("This browser does not have enough space to save the tournament.");
    return null;
  }
  syncChampionTournamentHistoryButton();
  window.dispatchEvent(new CustomEvent("tournament-history-changed", { detail: { record } }));
  showToast("Tournament saved to your history.");
  return record;
}

function savePremierLeagueToHistory(payload) {
  const rounds = Array.isArray(payload?.rounds) ? payload.rounds : [];
  const table = Array.isArray(payload?.table) ? payload.table : [];
  const teamsList = Array.isArray(payload?.teams) ? payload.teams : [];
  const complete = rounds.length === 38
    && rounds.every((round) => (
      Array.isArray(round)
      && round.length === 10
      && round.every((match) => match?.result?.revealed)
    ));
  if (!complete || !table[0]?.club?.id) {
    showToast("Finish the Premier League season before saving it.");
    return null;
  }

  const championId = table[0].club.id;
  const runnerUpId = table[1]?.club?.id || null;
  const sourceKey = String(
    payload.sourceKey
    || `premier-league:2026-27:${Number(payload.drawSeed) || 0}:${championId}`,
  );
  const existing = readTournamentHistoryRecords().find((record) => record.sourceKey === sourceKey);
  if (existing) {
    showToast("This league season is already saved.");
    return existing;
  }

  const teams = Object.fromEntries(teamsList.map((team) => {
    const compactTeam = compactTournamentHistoryTeam(team);
    return [team.id, compactTeam];
  }).filter(([, team]) => Boolean(team)));
  const allMatches = rounds.flat();
  const managedTeamId = payload.managedTeamId || null;
  const managedPosition = managedTeamId
    ? table.findIndex((row) => row.club?.id === managedTeamId) + 1
    : 0;
  const managedPositionSuffix = managedPosition % 100 >= 11 && managedPosition % 100 <= 13
    ? "th"
    : managedPosition % 10 === 1 ? "st"
      : managedPosition % 10 === 2 ? "nd"
        : managedPosition % 10 === 3 ? "rd" : "th";
  const topScorer = payload.topScorer;
  const savedAt = Date.now();
  const record = {
    version: TOURNAMENT_HISTORY_VERSION,
    id: `tournament-${Math.abs(stableHash(sourceKey)).toString(36)}`,
    sourceKey,
    savedAt,
    completedAt: savedAt,
    mode: "premier-league",
    theme: "premier-league",
    year: 2026,
    typeLabel: "Premier League 2026/27",
    editionLabel: "PL 26/27",
    logo: null,
    championId,
    runnerUpId,
    managedTeamId,
    managedOutcome: managedPosition === 1
      ? "Champions"
      : managedPosition > 0 ? `${managedPosition}${managedPositionSuffix} place`
        : "Neutral view",
    matchCount: allMatches.length,
    goalCount: allMatches.reduce((sum, match) => (
      sum + Number(match.result?.homeGoals || 0) + Number(match.result?.awayGoals || 0)
    ), 0),
    topScorer: topScorer ? {
      player: topScorer.player,
      teamId: topScorer.teamId,
      goals: Number(topScorer.goals) || 0,
    } : null,
    roundNames: rounds.map((_, index) => `Matchweek ${index + 1}`),
    teams,
    rounds: rounds.map((round) => round.map((match) => ({
      id: match.id,
      homeId: match.homeId,
      awayId: match.awayId,
      allowDraw: true,
      customGroupLabel: null,
      thirdPlacePlayoff: false,
      schedule: match.schedule ? {
        dateLabel: match.schedule.dateLabel || null,
        timeLabel: match.schedule.timeLabel || null,
        stadium: match.schedule.stadium || null,
        city: match.schedule.city || null,
      } : null,
      result: compactTournamentHistoryResult(match.result),
    }))),
  };
  const records = [
    record,
    ...readTournamentHistoryRecords().filter((saved) => saved.sourceKey !== sourceKey),
  ];
  if (!writeTournamentHistoryRecords(records)) {
    showToast("This browser does not have enough space to save the league.");
    return null;
  }
  window.dispatchEvent(new CustomEvent("tournament-history-changed", { detail: { record } }));
  showToast("League saved to your tournament history.");
  return record;
}

function tournamentHistoryTeam(record, teamId) {
  return record?.teams?.[teamId] || {
    id: teamId || "unknown",
    name: "Unknown team",
    code: "XX",
    flag: "🏳️",
  };
}

function tournamentHistoryFlag(record, teamId, className = "") {
  const team = tournamentHistoryTeam(record, teamId);
  try {
    return flagMarkup(team, className);
  } catch {
    return `<span class="country-flag ${className}" role="img" aria-label="${escapeHtml(team.name)} flag"><span class="flag-fallback" aria-hidden="true">${escapeHtml(team.flag || "🏳️")}</span></span>`;
  }
}

function formatTournamentHistoryDate(timestamp, includeTime = false) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) return "";
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(new Date(value));
}

function tournamentHistoryResultNote(result) {
  if (!result) return "Score unavailable";
  if (result.penalties) return `Penalties ${result.penalties.home}–${result.penalties.away}`;
  if (result.extraTime) return "After extra time";
  return "Full time";
}

function tournamentHistoryEventMarkup(events, fallback = "No goals") {
  if (!events?.length) return `<span class="tournament-history-no-events">${fallback}</span>`;
  return events.map((event) => {
    const label = event.ownGoal || event.goalType === "ownGoal"
      ? `${event.scorer || event.player || "Own goal"} (OG)`
      : event.scorer || event.player || "Goal";
    return `<span><b>${escapeHtml(label)}</b><i>${Number(event.minute) || 0}'</i></span>`;
  }).join("");
}

function renderTournamentHistoryHero() {
  const record = activeTournamentHistoryRecord;
  if (!record) return;
  const champion = tournamentHistoryTeam(record, record.championId);
  const runnerUp = tournamentHistoryTeam(record, record.runnerUpId);
  const logoMarkup = record.logo
    ? `<img class="tournament-history-edition-logo" src="${escapeHtml(record.logo)}" alt="${escapeHtml(record.editionLabel)} logo" />`
    : `<span class="tournament-history-edition-fallback" aria-hidden="true">${record.theme === "256" ? "256" : "WC"}</span>`;
  els.tournamentHistoryHero.innerHTML = `
    <div class="tournament-history-edition">
      ${logoMarkup}
      <span><small>${escapeHtml(record.editionLabel)}</small><strong>${escapeHtml(record.typeLabel)}</strong></span>
    </div>
    <div class="tournament-history-champion">
      <span class="tournament-history-crown" aria-hidden="true">&#9733;</span>
      ${tournamentHistoryFlag(record, record.championId, "tournament-history-champion-flag")}
      <span>
        <small>CHAMPIONS</small>
        <strong>${escapeHtml(champion.name)}</strong>
        <em>Finalists: ${escapeHtml(champion.name)} &amp; ${escapeHtml(runnerUp.name)}</em>
      </span>
    </div>`;
}

function renderTournamentHistorySummary() {
  const record = activeTournamentHistoryRecord;
  if (!record) return;
  const managedTeam = record.managedTeamId ? tournamentHistoryTeam(record, record.managedTeamId) : null;
  const topScorer = record.topScorer;
  const topScorerTeam = topScorer ? tournamentHistoryTeam(record, topScorer.teamId) : null;
  els.tournamentHistorySummary.innerHTML = `
    <article>
      <strong>${record.matchCount.toLocaleString()} matches</strong>
      <small>Full tournament archive</small>
    </article>
    <article>
      <strong>${record.goalCount.toLocaleString()} goals</strong>
      <small>Across every saved round</small>
    </article>
    <article class="tournament-history-managed">
      <div>
        ${managedTeam ? tournamentHistoryFlag(record, managedTeam.id, "tournament-history-summary-flag") : ""}
        <strong>${escapeHtml(managedTeam?.name || "Neutral simulation")}</strong>
      </div>
      <small>${escapeHtml(managedTeam ? record.managedOutcome : "All teams shown")}</small>
    </article>
    <article class="tournament-history-top-scorer">
      <strong>${escapeHtml(topScorer?.player || "No Golden Boot data")}</strong>
      <small>${topScorer
        ? `${escapeHtml(topScorerTeam.name)} · ${topScorer.goals} ${topScorer.goals === 1 ? "goal" : "goals"}`
        : "Goalscorers were not recorded"}</small>
    </article>`;
}

function tournamentHistoryMatchLabel(record, match, roundIndex) {
  if (match?.thirdPlacePlayoff) return "Third-place play-off";
  return match?.customGroupLabel || record.roundNames[roundIndex] || `Round ${roundIndex + 1}`;
}

function renderTournamentHistorySelectedMatch() {
  const record = activeTournamentHistoryRecord;
  const match = record?.rounds?.[activeTournamentHistoryRound]?.[activeTournamentHistoryMatch];
  if (!record || !match) {
    els.tournamentHistoryMatch.innerHTML = '<p class="tournament-history-empty">No saved match in this round.</p>';
    return;
  }
  const home = tournamentHistoryTeam(record, match.homeId);
  const away = tournamentHistoryTeam(record, match.awayId);
  const result = match.result;
  const schedule = match.schedule;
  const venue = [schedule?.stadium, schedule?.city].filter(Boolean).join(", ");
  const redCards = result?.redCards || [];
  const injuries = result?.injuries || [];
  const incidentMarkup = [
    ...redCards.map((event) => `${event.player || "Player"} sent off ${Number(event.minute) || 0}'`),
    ...injuries.map((event) => `${event.player || "Player"} injured ${Number(event.minute) || 0}'`),
  ];
  els.tournamentHistoryMatch.innerHTML = `
    <header>
      <span>${escapeHtml(tournamentHistoryMatchLabel(record, match, activeTournamentHistoryRound))}</span>
      <strong>Match ${activeTournamentHistoryMatch + 1} of ${record.rounds[activeTournamentHistoryRound].length}</strong>
    </header>
    <div class="tournament-history-scoreboard">
      <div class="tournament-history-match-team">
        ${tournamentHistoryFlag(record, home.id, "tournament-history-match-flag")}
        <strong>${escapeHtml(home.name)}</strong>
      </div>
      <div class="tournament-history-score">
        <span><b>${result ? result.homeGoals : "–"}</b><i>–</i><b>${result ? result.awayGoals : "–"}</b></span>
        <small>${escapeHtml(tournamentHistoryResultNote(result))}</small>
      </div>
      <div class="tournament-history-match-team">
        ${tournamentHistoryFlag(record, away.id, "tournament-history-match-flag")}
        <strong>${escapeHtml(away.name)}</strong>
      </div>
    </div>
    <div class="tournament-history-event-grid">
      <div>${tournamentHistoryEventMarkup(result?.homeEvents)}</div>
      <span aria-hidden="true"></span>
      <div>${tournamentHistoryEventMarkup(result?.awayEvents)}</div>
    </div>
    ${incidentMarkup.length ? `<div class="tournament-history-incidents">${incidentMarkup.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
    ${(schedule?.dateLabel || schedule?.timeLabel || venue) ? `
      <footer>
        <span>${escapeHtml([schedule?.dateLabel, schedule?.timeLabel].filter(Boolean).join(" · "))}</span>
        <span>${escapeHtml(venue)}</span>
      </footer>` : ""}`;
}

function renderTournamentHistoryFixtures() {
  const record = activeTournamentHistoryRecord;
  const round = record?.rounds?.[activeTournamentHistoryRound] || [];
  els.tournamentHistoryRoundTitle.textContent = record?.roundNames?.[activeTournamentHistoryRound] || "Saved round";
  els.tournamentHistoryRoundCount.textContent = `${round.length} ${round.length === 1 ? "match" : "matches"}`;
  els.tournamentHistoryFixtures.innerHTML = round.map((match, matchIndex) => {
    const home = tournamentHistoryTeam(record, match.homeId);
    const away = tournamentHistoryTeam(record, match.awayId);
    const result = match.result;
    return `
      <button
        class="tournament-history-fixture ${matchIndex === activeTournamentHistoryMatch ? "is-selected" : ""}"
        type="button"
        data-history-match="${matchIndex}"
        aria-pressed="${String(matchIndex === activeTournamentHistoryMatch)}"
      >
        <span class="tournament-history-fixture-meta">${escapeHtml(tournamentHistoryMatchLabel(record, match, activeTournamentHistoryRound))}</span>
        <span class="tournament-history-fixture-team">
          ${tournamentHistoryFlag(record, home.id, "tournament-history-fixture-flag")}
          <strong>${escapeHtml(home.name)}</strong>
          <b>${result ? result.homeGoals : "–"}</b>
        </span>
        <span class="tournament-history-fixture-team">
          ${tournamentHistoryFlag(record, away.id, "tournament-history-fixture-flag")}
          <strong>${escapeHtml(away.name)}</strong>
          <b>${result ? result.awayGoals : "–"}</b>
        </span>
        <small>${escapeHtml(tournamentHistoryResultNote(result))}</small>
      </button>`;
  }).join("");
}

function renderTournamentHistoryRounds() {
  const record = activeTournamentHistoryRecord;
  if (!record) return;
  els.tournamentHistoryRounds.innerHTML = record.rounds.map((round, roundIndex) => `
    <button
      type="button"
      class="${roundIndex === activeTournamentHistoryRound ? "is-active" : ""}"
      data-history-round="${roundIndex}"
      aria-pressed="${String(roundIndex === activeTournamentHistoryRound)}"
    >
      <span>${String(roundIndex + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(record.roundNames[roundIndex] || `Round ${roundIndex + 1}`)}</strong>
      <small>${round.length} ${round.length === 1 ? "match" : "matches"}</small>
    </button>
  `).join("");
}

function renderTournamentHistoryRecord() {
  const record = activeTournamentHistoryRecord;
  if (!record) return;
  els.tournamentHistoryScreen.dataset.historyTheme = record.theme;
  const brandMark = els.tournamentHistoryScreen.querySelector(".tournament-history-brand-mark");
  if (brandMark) {
    brandMark.textContent = record.theme === "2016"
      ? "16"
      : record.theme === "256"
        ? "256"
        : record.theme === "custom"
          ? "CT"
          : record.theme === "legacy"
            ? "LD"
            : "WC";
  }
  els.tournamentHistoryKicker.textContent = record.editionLabel.toUpperCase();
  els.tournamentHistoryTitle.textContent = record.typeLabel;
  els.tournamentHistorySavedAt.textContent = `Saved ${formatTournamentHistoryDate(record.savedAt)}`;
  els.tournamentHistorySavedAt.dateTime = new Date(record.savedAt).toISOString();
  renderTournamentHistoryHero();
  renderTournamentHistorySummary();
  renderTournamentHistoryRounds();
  renderTournamentHistorySelectedMatch();
  renderTournamentHistoryFixtures();
}

function installTournamentHistoryTeams(record) {
  tournamentHistoryTemporaryTeamIds = [];
  Object.values(record.teams || {}).forEach((team) => {
    if (!team?.id || TEAM_BY_ID.has(team.id)) return;
    const rating = 75;
    TEAM_BY_ID.set(team.id, {
      ...team,
      rating,
      strength: rating,
      simulationRatings: deriveTeamSimulationRatings(team.id, team.name, rating, null),
      playerProfiles: [],
    });
    tournamentHistoryTemporaryTeamIds.push(team.id);
  });
}

function uninstallTournamentHistoryTeams() {
  tournamentHistoryTemporaryTeamIds.forEach((teamId) => TEAM_BY_ID.delete(teamId));
  tournamentHistoryTemporaryTeamIds = [];
}

function tournamentHistorySimulatorState(record) {
  const rounds = structuredClone(record.rounds);
  const roundNames = Array.isArray(record.roundNames)
    ? record.roundNames
    : rounds.map((_, index) => `Round ${index + 1}`);
  const finalRoundIndex = Math.max(0, rounds.length - 1);
  const finalRound = rounds[finalRoundIndex] || [];
  const finalMatchIndex = Math.max(0, finalRound.findIndex((match) => !isThirdPlacePlayoff(match)));
  return {
    version: STATE_VERSION,
    savedTournamentView: true,
    savedTournamentRecordId: record.id,
    savedTournamentRoundNames: [...roundNames],
    savedTournamentTheme: record.theme,
    savedTournamentEditionLabel: record.editionLabel,
    savedTournamentTypeLabel: record.typeLabel,
    settings: normalizeSettings({ ...defaultSettings }),
    rounds,
    activeRound: finalRoundIndex,
    selectedMatch: finalMatchIndex,
    championView: false,
    started: true,
    predictionTeamId: null,
    spectateTeamId: record.managedTeamId || null,
    _activeSpectateId: record.managedTeamId || null,
    neutralView: true,
    standardTactic: "balanced",
  };
}

function tournamentHistoryRetroState(record) {
  const teamName = (teamId) => tournamentHistoryTeam(record, teamId).name;
  const roundNames = Array.isArray(record.roundNames)
    ? record.roundNames
    : record.rounds.map((_, index) => `Round ${index + 1}`);
  const adaptMatch = (match, roundIndex, matchday = null) => ({
    ...structuredClone(match),
    stage: matchday ? "group" : "knockout",
    roundIndex,
    matchday,
    home: teamName(match.homeId),
    away: teamName(match.awayId),
    result: match.result ? {
      ...structuredClone(match.result),
      winner: match.result.winnerId ? teamName(match.result.winnerId) : null,
    } : null,
  });
  const groupMatches = record.rounds.slice(0, 3).flatMap((round, roundIndex) => (
    round.map((match) => adaptMatch(match, roundIndex, roundIndex + 1))
  ));
  const knockoutRounds = record.rounds.slice(3).map((round, index) => ({
    name: roundNames[index + 3] || `Round ${index + 4}`,
    matches: round.map((match) => adaptMatch(match, index, null)),
  }));
  const seed = Number.parseInt(String(record.sourceKey || "").match(/:(\d+):/)?.[1] || "", 10)
    || Math.abs(stableHash(record.id));
  return {
    version: RETRO_WORLD_CUP_ENGINE.VERSION || 1,
    year: Number(record.year),
    seed: seed >>> 0,
    managedTeam: record.managedTeamId ? teamName(record.managedTeamId) : null,
    neutralView: true,
    phase: "complete",
    groupMatches,
    knockoutRounds,
    champion: teamName(record.championId),
    createdAt: new Date(record.completedAt || record.savedAt).toISOString(),
    savedTournamentView: true,
    savedTournamentRecordId: record.id,
    savedTournamentRoundNames: [...roundNames],
  };
}

function openTournamentHistory(
  recordId,
  returnFocus = document.activeElement,
  { updateUrl = true } = {},
) {
  const record = readTournamentHistoryRecords().find((item) => item.id === recordId);
  if (!record) {
    showToast("That saved tournament is no longer available.");
    return false;
  }
  stopStandardPlaybackForNavigation();
  tournamentHistoryReturnState = {
    state,
    standardTournamentState,
    defaultKnockoutState,
    customTournamentState,
    customMatchState,
    retroSimulatorState,
    retroTournament,
    standardTournamentUiState,
    retroTournamentUiState: { ...retroTournamentUiState },
    retroTournamentView,
    retroBottomGroupsVisible,
    retroBottomGroupMatchesVisible,
    fixtureLimit,
    filterUnresolved,
    teamFilterId,
    teamFilterReturn,
    appShellHidden: els.appShell.hidden,
    profileHidden: document.querySelector("#profileScreen")?.hidden ?? true,
  };
  tournamentHistoryReturnFocus = returnFocus instanceof HTMLElement ? returnFocus : null;
  if (updateUrl) {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    tournamentHistoryReturnUrl = savedTournamentIdFromPath() ? "/" : currentUrl;
    window.history.pushState(
      { ...(window.history.state || {}), tournamentHistoryId: record.id },
      "",
      savedTournamentPath(record.id),
    );
  } else if (!tournamentHistoryReturnUrl) {
    tournamentHistoryReturnUrl = "/";
  }
  activeTournamentHistoryRecord = record;
  if (record.mode === "premier-league" && window.PremierLeagueSeason?.openSavedHistory?.(record)) {
    const profileScreen = document.querySelector("#profileScreen");
    if (profileScreen) profileScreen.hidden = true;
    document.body.classList.add("saved-tournament-simulator");
    document.body.dataset.savedTournamentTheme = record.theme;
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }
  if (record.mode === "retro" && RETRO_WORLD_CUP_EDITIONS[record.year]) {
    installRetroTeams(record.year);
  }
  installTournamentHistoryTeams(record);
  if (record.mode === "retro" && RETRO_WORLD_CUP_EDITIONS[record.year]) {
    retroTournament = tournamentHistoryRetroState(record);
    const simulatorState = tournamentHistorySimulatorState(record);
    simulatorState.retroWorldCup = true;
    simulatorState.retroTournamentYear = Number(record.year);
    simulatorState.drawSeed = retroTournament.seed;
    retroSimulatorState = simulatorState;
    state = {};
    retroTournamentView = "matches";
    retroBottomGroupsVisible = false;
    retroBottomGroupMatchesVisible = false;
  } else {
    state = tournamentHistorySimulatorState(record);
    standardTournamentState = state;
    retroSimulatorState = null;
  }
  const profileScreen = document.querySelector("#profileScreen");
  if (profileScreen) profileScreen.hidden = true;
  document.body.classList.add("saved-tournament-simulator");
  document.body.dataset.savedTournamentTheme = record.theme;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
  requestAnimationFrame(() => {
    els.legacyDraftBackButton?.focus({ preventScroll: true });
  });
  return true;
}

function closeTournamentHistory({ updateUrl = true } = {}) {
  if (!activeTournamentHistoryRecord || !tournamentHistoryReturnState) return;
  stopStandardPlaybackForNavigation();
  const previous = tournamentHistoryReturnState;
  if (activeTournamentHistoryRecord.mode === "premier-league") {
    window.PremierLeagueSeason?.closeSavedHistory?.();
  }
  uninstallTournamentHistoryTeams();
  activeTournamentHistoryRecord = null;
  tournamentHistoryReturnState = null;
  state = previous.state;
  standardTournamentState = previous.standardTournamentState;
  defaultKnockoutState = previous.defaultKnockoutState;
  customTournamentState = previous.customTournamentState;
  customMatchState = previous.customMatchState;
  retroSimulatorState = previous.retroSimulatorState;
  retroTournament = previous.retroTournament;
  standardTournamentUiState = previous.standardTournamentUiState;
  retroTournamentUiState = previous.retroTournamentUiState;
  retroTournamentView = previous.retroTournamentView;
  retroBottomGroupsVisible = previous.retroBottomGroupsVisible;
  retroBottomGroupMatchesVisible = previous.retroBottomGroupMatchesVisible;
  fixtureLimit = previous.fixtureLimit;
  filterUnresolved = previous.filterUnresolved;
  teamFilterId = previous.teamFilterId;
  teamFilterReturn = previous.teamFilterReturn;
  document.body.classList.remove("saved-tournament-simulator");
  delete document.body.dataset.savedTournamentTheme;
  const returnFocus = tournamentHistoryReturnFocus;
  tournamentHistoryReturnFocus = null;
  if (updateUrl) {
    window.history.pushState(
      { ...(window.history.state || {}), tournamentHistoryId: null },
      "",
      tournamentHistoryReturnUrl || "/",
    );
  }
  tournamentHistoryReturnUrl = null;
  render();
  els.appShell.hidden = previous.appShellHidden;
  const profileScreen = document.querySelector("#profileScreen");
  if (profileScreen) profileScreen.hidden = previous.profileHidden;
  requestAnimationFrame(() => returnFocus?.focus?.({ preventScroll: true }));
}

function syncSavedTournamentDeleteActions() {
  const visible = Boolean(activeTournamentHistoryRecord);
  if (els.savedTournamentDeleteButton) els.savedTournamentDeleteButton.hidden = !visible;
  if (els.retroSavedTournamentDeleteButton) els.retroSavedTournamentDeleteButton.hidden = !visible;
}

function openSavedTournamentDeleteModal() {
  if (!activeTournamentHistoryRecord || !els.savedTournamentDeleteModal) return;
  const edition = activeTournamentHistoryRecord.editionLabel
    || activeTournamentHistoryRecord.typeLabel
    || "saved tournament";
  if (els.savedTournamentDeleteCopy) {
    els.savedTournamentDeleteCopy.textContent = `${edition} will be permanently removed from this browser.`;
  }
  els.savedTournamentDeleteModal.showModal();
}

function deleteSavedTournament(recordId) {
  if (!recordId) return false;
  const records = readTournamentHistoryRecords();
  const remainingRecords = records.filter((record) => record.id !== recordId);
  if (remainingRecords.length === records.length) {
    showToast("That saved tournament is no longer available.");
    return false;
  }
  if (!writeTournamentHistoryRecords(remainingRecords)) {
    showToast("This browser could not delete the saved tournament.");
    return false;
  }
  window.dispatchEvent(new CustomEvent("tournament-history-changed", {
    detail: { deletedRecordId: recordId },
  }));
  return true;
}

function confirmSavedTournamentDelete() {
  const recordId = activeTournamentHistoryRecord?.id;
  if (!recordId || !deleteSavedTournament(recordId)) return;
  els.savedTournamentDeleteModal?.close();
  closeTournamentHistory();
  showToast("Saved tournament deleted.");
}

window.TournamentHistory = Object.freeze({
  list() {
    return readTournamentHistoryRecords().map((record) => ({
      id: record.id,
      sourceKey: record.sourceKey,
      savedAt: record.savedAt,
      completedAt: record.completedAt,
      mode: record.mode,
      theme: record.theme,
      year: record.year,
      typeLabel: record.typeLabel,
      editionLabel: record.editionLabel,
      logo: record.logo,
      championId: record.championId,
      managedTeamId: record.managedTeamId,
      managedOutcome: record.managedOutcome,
      matchCount: record.matchCount,
      goalCount: record.goalCount,
      teams: record.teams,
    }));
  },
  saveCurrent: saveCurrentTournamentToHistory,
  savePremierLeague: savePremierLeagueToHistory,
  has(sourceKey) {
    return readTournamentHistoryRecords().some((record) => record.sourceKey === sourceKey);
  },
  open: openTournamentHistory,
  close: closeTournamentHistory,
  delete: deleteSavedTournament,
});

function showToast(message, duration = 2600) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), duration);
}

window.addEventListener("tournament-history-storage-error", () => {
  showToast("Tournament history could not be updated. Your existing saves were kept.", 5200);
});

window.addEventListener("achievement-tracking-error", (event) => {
  const year = Number(event.detail?.year);
  const modeLabel = Number.isInteger(year) ? `${year} achievement` : "Achievement";
  showToast(`${modeLabel} could not be saved. It will retry automatically.`, 4200);
});

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
    scorerMinutes.get(event.scorer).push(goalMinuteText(event));
  });
  return [...scorerMinutes].map(([scorer, minutes]) => `${scorer}  ${minutes.join(", ")}`);
}

function snapshotMatchContext() {
  const roundIndex = state.championView ? tournamentFinalRoundIndex() : state.activeRound;
  const finalRound = state.rounds[roundIndex] || [];
  const match = state.championView
    ? tournamentFinalMatch(finalRound)
    : selectedMatch();
  if (!match) return null;
  return {
    match,
    roundIndex,
    home: teamById(match.homeId),
    away: teamById(match.awayId),
  };
}

function drawSnapshotGoalLines(context, lines, x, y, align, maximumWidth = 420, color = "#aab4c4") {
  const spacing = lines.length > 6 ? 20 : lines.length > 4 ? 24 : 29;
  const fontSize = lines.length > 6 ? 15 : lines.length > 4 ? 17 : 19;
  lines.forEach((line, index) => snapshotText(context, line, x, y + index * spacing, maximumWidth, fontSize, {
    minimumSize: 13,
    weight: 600,
    align,
    color,
    family: "Manrope, Arial, sans-serif",
  }));
  return lines.length ? y + (lines.length - 1) * spacing : y;
}

function drawSnapshotShootout(context, attempts, x, y, align, maximumWidth = 360) {
  if (!attempts.length) return y;
  const nameX = align === "left" ? x + 22 : x - 22;
  attempts.forEach((attempt, index) => {
    const rowY = y + index * 28;
    context.beginPath();
    context.arc(x, rowY, 5, 0, Math.PI * 2);
    context.fillStyle = attempt.scored ? "#45d589" : "#ff626c";
    context.fill();
    snapshotText(context, attempt.player, nameX, rowY, maximumWidth - 24, 17, {
      minimumSize: 12,
      weight: 600,
      align,
      color: "#dce3ef",
      family: "Manrope, Arial, sans-serif",
    });
  });
  return y + (attempts.length - 1) * 28;
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

function retroSnapshotPalette(year) {
  if (Number(year) === 2024) {
    return {
      accent: "#e51b2b",
      backgroundStart: "#061d54",
      backgroundMiddle: "#0b3f96",
      backgroundEnd: "#041536",
      panel: "rgba(4, 21, 54, 0.96)",
      award: "rgba(229, 27, 43, 0.96)",
      flagBacking: "#e9edf5",
      primaryText: "#ffffff",
      secondaryText: "#cfd6e6",
      glow: "rgba(229, 27, 43, 0.3)",
      footer: "COPA AMÉRICA USA 2024",
    };
  }
  if (Number(year) === 1998) {
    return {
      accent: "#f4f4df",
      backgroundStart: "#a4b9a0",
      backgroundMiddle: "#526d56",
      backgroundEnd: "#5f334c",
      panel: "rgba(24, 45, 32, 0.94)",
      award: "rgba(95, 51, 76, 0.94)",
      flagBacking: "#526d56",
      primaryText: "#f4f4df",
      secondaryText: "#d4dcc8",
      glow: "rgba(217, 55, 99, 0.26)",
      footer: "FRANCE 1998 WORLD CUP",
    };
  }
  if (Number(year) === 2002) {
    return {
      accent: "#ef233c",
      backgroundStart: "#071d3d",
      backgroundMiddle: "#075891",
      backgroundEnd: "#020c1d",
      panel: "rgba(3, 29, 61, 0.95)",
      award: "rgba(5, 45, 84, 0.97)",
      flagBacking: "#075891",
      primaryText: "#fffaf0",
      secondaryText: "#c8d9e8",
      glow: "rgba(239, 35, 60, 0.3)",
      footer: "KOREA/JAPAN 2002 WORLD CUP",
    };
  }
  if (Number(year) === 2006) {
    return {
      accent: "#f3d566",
      backgroundStart: "#d8eff7",
      backgroundMiddle: "#0b5274",
      backgroundEnd: "#031b2b",
      panel: "rgba(3, 37, 57, 0.94)",
      award: "rgba(7, 53, 80, 0.96)",
      flagBacking: "#0b5274",
      primaryText: "#f4fbff",
      secondaryText: "#b9d4df",
      glow: "rgba(243, 213, 102, 0.24)",
      footer: "GERMANY 2006 WORLD CUP",
    };
  }
  if (Number(year) === 2010) {
    return {
      accent: "#ffd34f",
      backgroundStart: "#eb950e",
      backgroundMiddle: "#b84d0b",
      backgroundEnd: "#49230f",
      panel: "rgba(74, 35, 16, 0.94)",
      award: "rgba(57, 27, 14, 0.96)",
      flagBacking: "#6e3518",
      primaryText: "#fff7dd",
      secondaryText: "#f3d9a5",
      glow: "rgba(255, 211, 79, 0.28)",
      footer: "RETRO 10 WORLD CUP",
    };
  }
  if (Number(year) === 2016) {
    return {
      accent: "#ffdc38",
      backgroundStart: "#020d32",
      backgroundMiddle: "#0756aa",
      backgroundEnd: "#079bc9",
      panel: "rgba(3, 29, 81, 0.94)",
      award: "rgba(4, 61, 128, 0.96)",
      flagBacking: "#0756aa",
      primaryText: "#f8fdff",
      secondaryText: "#bfeeff",
      glow: "rgba(28, 199, 238, 0.32)",
      footer: "UEFA EURO 2016",
    };
  }
  if (Number(year) === 2020) {
    return {
      accent: "#b9dc18",
      backgroundStart: "#034f5c",
      backgroundMiddle: "#078c9e",
      backgroundEnd: "#0ba9b8",
      panel: "rgba(3, 79, 92, 0.95)",
      award: "rgba(5, 102, 117, 0.97)",
      flagBacking: "#056675",
      primaryText: "#f4fdff",
      secondaryText: "#c6eef2",
      glow: "rgba(185, 220, 24, 0.28)",
      footer: "UEFA EURO 2020",
    };
  }
  if (Number(year) === 2018) {
    return {
      accent: "#e9c477",
      backgroundStart: "#a51a16",
      backgroundMiddle: "#86141b",
      backgroundEnd: "#54101a",
      panel: "rgba(7, 61, 112, 0.94)",
      award: "rgba(6, 52, 95, 0.96)",
      flagBacking: "#0969aa",
      primaryText: "#fff4d6",
      secondaryText: "#f3dcc0",
      glow: "rgba(233, 196, 119, 0.24)",
      footer: "RETRO 18 WORLD CUP",
    };
  }
  if (Number(year) === 2022) {
    return {
      accent: "#c9a96a",
      backgroundStart: "#1f0a11",
      backgroundMiddle: "#310914",
      backgroundEnd: "#4c0c2a",
      panel: "rgba(27, 8, 16, 0.94)",
      award: "rgba(22, 7, 13, 0.96)",
      flagBacking: "#431025",
      primaryText: "#fffdfa",
      secondaryText: "#f4ead8",
      glow: "rgba(201, 169, 106, 0.28)",
      footer: "RETRO 22 WORLD CUP",
    };
  }
  if (Number(year) === 2026) {
    return {
      accent: "#ff9e2f",
      backgroundStart: "#06164f",
      backgroundMiddle: "#0a45ff",
      backgroundEnd: "#3568ff",
      panel: "rgba(5, 23, 79, 0.96)",
      award: "rgba(7, 31, 105, 0.96)",
      flagBacking: "#0a45ff",
      primaryText: "#ffffff",
      secondaryText: "#dce7ff",
      glow: "rgba(68, 119, 255, 0.36)",
      footer: "FIFA WORLD CUP 26",
    };
  }
  return {
    accent: "#f6d12a",
    backgroundStart: "#0a8b50",
    backgroundMiddle: "#067344",
    backgroundEnd: "#034c38",
    panel: "rgba(0, 82, 52, 0.88)",
    award: "rgba(0, 74, 47, 0.94)",
    flagBacking: "#00643f",
    primaryText: "#fff9d6",
    secondaryText: "#fff7cf",
    glow: "rgba(246, 209, 42, 0.3)",
    footer: "RETRO 14 WORLD CUP",
  };
}

function drawSnapshotGoldenBoot(context, scorer, y = 438, retroTheme = null) {
  if (!scorer) return;
  const scorerTeam = teamById(scorer.teamId);
  snapshotRoundedRect(context, 414, y, 372, 116, 18);
  context.fillStyle = retroTheme?.award || "rgba(17, 24, 36, 0.92)";
  context.fill();
  if (!retroTheme) {
    context.strokeStyle = "rgba(118, 145, 196, 0.24)";
    context.lineWidth = 1.5;
    context.stroke();
  }
  snapshotText(context, "GOLDEN BOOT", 600, y + 21, 300, 14, {
    minimumSize: 12,
    weight: 800,
    color: retroTheme?.accent || "#779cff",
  });
  snapshotText(context, scorer.player, 600, y + 51, 330, 25, {
    minimumSize: 18,
    weight: 800,
  });
  snapshotText(context, `${scorerTeam.name} · ${scorer.goals} ${scorer.goals === 1 ? "GOAL" : "GOALS"}`, 600, y + 86, 330, 15, {
    minimumSize: 12,
    weight: 700,
    color: retroTheme?.secondaryText || "#aab4c4",
  });
}

function loadSnapshotFlag(team, { premierLeague = false, ucl = false } = {}) {
  const premierLeagueBadge = (premierLeague && premierLeagueAssetsInstalled || ucl)
    && team?.badge
    ? team.badge
    : null;
  const customFlag = typeof team?.customFlag === "string" ? team.customFlag : null;
  const imageOverride = FLAG_IMAGE_OVERRIDES[team.name];
  const code = FLAG_CODE_OVERRIDES[team.code] || team.code.toLowerCase();
  if (!premierLeagueBadge && !customFlag && !imageOverride && code === "xx") return Promise.resolve(null);
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
    image.src = premierLeagueBadge || customFlag || imageOverride || `https://flagcdn.com/w320/${code}.png`;
  });
}

function drawSnapshotFlag(context, image, team, x, y, retroTheme = null, premierLeague = false, ucl = false) {
  if (premierLeague) {
    if (image) {
      const sourceWidth = image.naturalWidth || image.width || 1;
      const sourceHeight = image.naturalHeight || image.height || 1;
      const scale = Math.min(150 / sourceWidth, 124 / sourceHeight);
      const width = Math.max(1, sourceWidth * scale);
      const height = Math.max(1, sourceHeight * scale);
      context.save();
      context.shadowColor = "rgba(0, 0, 0, 0.28)";
      context.shadowBlur = 18;
      context.shadowOffsetY = 8;
      context.drawImage(image, x - width / 2, y - height / 2, width, height);
      context.restore();
    } else {
      snapshotRoundedRect(context, x - 62, y - 54, 124, 108, 18);
      context.fillStyle = ucl ? "rgba(32, 78, 170, 0.52)" : "rgba(96, 53, 126, 0.48)";
      context.fill();
      context.strokeStyle = ucl ? "rgba(143, 178, 255, 0.34)" : "rgba(217, 182, 237, 0.28)";
      context.lineWidth = 2;
      context.stroke();
      snapshotText(context, team.code || "PL", x, y, 94, 38, {
        minimumSize: 28,
        weight: 900,
        color: ucl ? "#8fb2ff" : "#d9b6ed",
        family: "Manrope, Arial, sans-serif",
      });
    }
    return;
  }
  snapshotRoundedRect(context, x - 82, y - 57, 164, 114, 13);
  context.fillStyle = retroTheme?.flagBacking || "#192232";
  context.fill();
  if (image) {
    context.save();
    const customBadge = team?.customFlagShape === "square";
    const destinationWidth = customBadge ? (retroTheme ? 108 : 100) : (retroTheme ? 164 : 150);
    const destinationHeight = customBadge ? destinationWidth : (retroTheme ? 114 : 100);
    const destinationX = x - destinationWidth / 2;
    const destinationY = y - destinationHeight / 2;
    snapshotRoundedRect(
      context,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight,
      retroTheme ? 13 : 8,
    );
    context.clip();
    const sourceWidth = image.naturalWidth || image.width || 1;
    const sourceHeight = image.naturalHeight || image.height || 1;
    const sourceAspect = sourceWidth / sourceHeight;
    const destinationAspect = destinationWidth / destinationHeight;
    const cropWidth = sourceAspect > destinationAspect ? sourceHeight * destinationAspect : sourceWidth;
    const cropHeight = sourceAspect > destinationAspect ? sourceHeight : sourceWidth / destinationAspect;
    context.drawImage(
      image,
      (sourceWidth - cropWidth) / 2,
      (sourceHeight - cropHeight) / 2,
      cropWidth,
      cropHeight,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight,
    );
    context.restore();
  } else {
    snapshotText(context, team.code === "XX" ? "W256" : team.code, x, y, 125, 42, {
      minimumSize: 30,
      weight: 800,
      color: retroTheme ? retroTheme.primaryText : "#8aa9ff",
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
  const retroSnapshot = isRetroSimulatorState();
  const retroYear = Number(
    retroTournament?.year
    || retroWorldCupYearFromPath()
    || readRetroWorldCupYear()
    || 2014,
  );
  const retroTheme = retroSnapshot ? retroSnapshotPalette(retroYear) : null;
  const uclSnapshot = Boolean(state?.uclSeason || document.body.classList.contains("ucl-match-mode-active"));
  const premierLeagueSnapshot = Boolean(state.premierLeagueSeason);
  const domesticLeagueSnapshot = premierLeagueSnapshot && !uclSnapshot;
  const snapshotAccent = retroTheme?.accent || (uclSnapshot ? "#8fb2ff" : domesticLeagueSnapshot ? "#d9b6ed" : "#779cff");
  const snapshotSecondary = retroTheme?.secondaryText || (uclSnapshot ? "#bfd0f3" : domesticLeagueSnapshot ? "#d2afd9" : "#aab4c4");
  const snapshotPrimary = retroTheme?.primaryText || "#f5f7fb";
  const championSnapshot = Boolean(state.championView && revealed);
  const customMatchSnapshot = state.customTournament?.customMatch === true;
  const snapshotShowsAward = championSnapshot && !customMatchSnapshot;
  const championId = championSnapshot ? result.winnerId : null;
  const goldenBootWinner = snapshotShowsAward ? calculateTopGoalscorer() : null;
  const homeGoalLines = revealed ? snapshotGoalLines(result.homeEvents) : [];
  const awayGoalLines = revealed ? snapshotGoalLines(result.awayEvents) : [];
  const homeShootout = revealed
    ? (result.shootout || []).filter((attempt) => attempt.side === "home")
    : [];
  const awayShootout = revealed
    ? (result.shootout || []).filter((attempt) => attempt.side === "away")
    : [];
  const detailStartY = premierLeagueSnapshot ? 395 : 365;
  const goalListBottom = (lines) => {
    if (!lines.length) return detailStartY;
    const spacing = lines.length > 6 ? 20 : lines.length > 4 ? 24 : 29;
    return detailStartY + (lines.length - 1) * spacing;
  };
  const shootoutStart = (goalLines, attempts) => (
    attempts.length ? goalListBottom(goalLines) + (goalLines.length ? 38 : 0) : null
  );
  const shootoutBottom = (goalLines, attempts) => {
    const start = shootoutStart(goalLines, attempts);
    return start === null ? goalListBottom(goalLines) : start + (attempts.length - 1) * 28;
  };
  const homeShootoutY = shootoutStart(homeGoalLines, homeShootout);
  const awayShootoutY = shootoutStart(awayGoalLines, awayShootout);
  const detailBottom = Math.max(
    shootoutBottom(homeGoalLines, homeShootout),
    shootoutBottom(awayGoalLines, awayShootout),
  );
  const goldenBootY = snapshotShowsAward ? Math.max(438, detailBottom + 34) : null;
  const contentBottom = goldenBootY === null ? detailBottom : goldenBootY + 116;
  const canvasHeight = Math.max(675, Math.ceil(contentBottom + 110));
  const [homeFlagImage, awayFlagImage] = await Promise.all([
    loadSnapshotFlag(home, { premierLeague: premierLeagueSnapshot, ucl: uclSnapshot }),
    loadSnapshotFlag(away, { premierLeague: premierLeagueSnapshot, ucl: uclSnapshot }),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image creation is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, 1200, canvasHeight);
  background.addColorStop(0, retroTheme?.backgroundStart || (uclSnapshot ? "#04112d" : domesticLeagueSnapshot ? "#1e0021" : "#0b1018"));
  background.addColorStop(0.55, retroTheme?.backgroundMiddle || (uclSnapshot ? "#0b2c72" : domesticLeagueSnapshot ? "#381d53" : "#111925"));
  background.addColorStop(1, retroTheme?.backgroundEnd || (uclSnapshot ? "#02091b" : domesticLeagueSnapshot ? "#1e0021" : "#0b111b"));
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, canvasHeight);

  const glow = context.createRadialGradient(600, 250, 0, 600, 250, 530);
  glow.addColorStop(
    0,
    retroTheme?.glow || (uclSnapshot ? "rgba(63, 123, 255, 0.32)" : domesticLeagueSnapshot ? "rgba(157, 107, 187, 0.34)" : "rgba(31, 94, 255, 0.18)"),
  );
  glow.addColorStop(
    1,
    retroTheme || premierLeagueSnapshot ? "rgba(0, 0, 0, 0)" : "rgba(31, 94, 255, 0)",
  );
  context.fillStyle = glow;
  context.fillRect(0, 0, 1200, canvasHeight);

  snapshotRoundedRect(context, 55, 42, 1090, canvasHeight - 117, [1998, 2020, 2024].includes(Number(retroYear)) ? 8 : 28);
  context.fillStyle = retroTheme?.panel || (uclSnapshot ? "rgba(4, 18, 48, 0.94)" : domesticLeagueSnapshot ? "rgba(40, 0, 45, 0.9)" : "rgba(17, 24, 36, 0.88)");
  context.fill();
  if (!retroSnapshot) {
    context.strokeStyle = uclSnapshot
      ? "rgba(143, 178, 255, 0.30)"
      : domesticLeagueSnapshot
        ? "rgba(217, 182, 237, 0.25)"
      : "rgba(118, 145, 196, 0.24)";
    context.lineWidth = 2;
    context.stroke();
  }

  if (championSnapshot) drawSnapshotConfetti(context, championId);

  const snapshotHeading = championSnapshot
    ? retroTheme
      ? Number(retroYear) === 2016
        ? "FRANCE 2016 EUROPEAN CHAMPIONS"
        : Number(retroYear) === 2024
          ? "COPA AMÉRICA USA 2024 CHAMPIONS"
        : `${RETRO_WORLD_CUP_EDITIONS[retroYear].host.toUpperCase()} ${retroYear} WORLD CHAMPIONS`
      : uclSnapshot
        ? "UCL 26/27 CHAMPIONS"
        : customMatchSnapshot ? "CUSTOM MATCH WINNER" : "256 TEAMS WC CHAMPIONS"
    : uclSnapshot
      ? `UCL 26/27 · ${tournamentMatchRoundName(match, roundIndex).toUpperCase()}`
    : premierLeagueSnapshot
      ? `PL 26/27 · ${tournamentMatchRoundName(match, roundIndex).toUpperCase()}`
      : tournamentMatchRoundName(match, roundIndex).toUpperCase();
  snapshotText(context, snapshotHeading, 1110, 88, 440, 18, {
    minimumSize: 14,
    weight: 700,
    align: "right",
    color: snapshotAccent,
    family: "Manrope, Arial, sans-serif",
  });

  const homeSnapshotName = domesticLeagueSnapshot && home.name === "Manchester United"
    ? "Man United"
    : home.name;
  const awaySnapshotName = domesticLeagueSnapshot && away.name === "Manchester United"
    ? "Man United"
    : away.name;
  if (premierLeagueSnapshot) {
    drawSnapshotFlag(context, homeFlagImage, home, 405, 250, retroTheme, true, uclSnapshot);
    drawSnapshotFlag(context, awayFlagImage, away, 795, 250, retroTheme, true, uclSnapshot);
    snapshotText(context, homeSnapshotName, 325, 250, 240, 34, {
      minimumSize: 22,
      weight: 800,
      align: "right",
      color: "#f5f7fb",
    });
    snapshotText(context, awaySnapshotName, 875, 250, 240, 34, {
      minimumSize: 22,
      weight: 800,
      align: "left",
      color: "#f5f7fb",
    });
  } else {
    drawSnapshotFlag(context, homeFlagImage, home, 270, 205, retroTheme);
    drawSnapshotFlag(context, awayFlagImage, away, 930, 205, retroTheme);
    snapshotText(context, homeSnapshotName, 270, 292, 390, 42, { minimumSize: 24, weight: 800, color: snapshotPrimary });
    snapshotText(context, awaySnapshotName, 930, 292, 390, 42, { minimumSize: 24, weight: 800, color: snapshotPrimary });
  }

  if (revealed) {
    const scoreY = premierLeagueSnapshot ? 250 : 300;
    const homeScoreX = premierLeagueSnapshot ? 525 : 505;
    const awayScoreX = premierLeagueSnapshot ? 675 : 695;
    snapshotText(context, String(result.homeGoals), homeScoreX, scoreY, 120, 88, {
      weight: 800,
      family: "Manrope, Arial, sans-serif",
    });
    snapshotText(context, "–", 600, scoreY, 80, 52, { color: "#65728a", weight: 400 });
    snapshotText(context, String(result.awayGoals), awayScoreX, scoreY, 120, 88, {
      weight: 800,
      family: "Manrope, Arial, sans-serif",
    });
    const resultLabel = result.penalties
      ? `PENALTIES ${result.penalties.home}–${result.penalties.away}`
      : result.extraTime ? "AFTER EXTRA TIME" : "FULL TIME";
    snapshotText(context, resultLabel, 600, premierLeagueSnapshot ? 340 : 370, 380, 24, {
      minimumSize: 20,
      weight: 700,
      color: snapshotAccent,
      family: "Manrope, Arial, sans-serif",
    });
    drawSnapshotGoalLines(
      context,
      homeGoalLines,
      188,
      detailStartY,
      "left",
      snapshotShowsAward ? 290 : 420,
      snapshotSecondary,
    );
    drawSnapshotGoalLines(
      context,
      awayGoalLines,
      1012,
      detailStartY,
      "right",
      snapshotShowsAward ? 290 : 420,
      snapshotSecondary,
    );
    if (homeShootoutY !== null) {
      drawSnapshotShootout(context, homeShootout, 188, homeShootoutY, "left", snapshotShowsAward ? 290 : 420);
    }
    if (awayShootoutY !== null) {
      drawSnapshotShootout(context, awayShootout, 1012, awayShootoutY, "right", snapshotShowsAward ? 290 : 420);
    }
    if (snapshotShowsAward) drawSnapshotGoldenBoot(context, goldenBootWinner, goldenBootY, retroTheme);
  } else {
    snapshotText(context, "VS", 600, premierLeagueSnapshot ? 250 : 307, 180, 52, {
      weight: 800,
      color: snapshotAccent,
      family: "Manrope, Arial, sans-serif",
    });
    snapshotText(context, result ? "RESULT HIDDEN" : "UPCOMING FIXTURE", 600, premierLeagueSnapshot ? 340 : 370, 320, 18, {
      weight: 700,
      color: snapshotSecondary,
      family: "Manrope, Arial, sans-serif",
    });
  }

  const mode = state.settings.upset === "chaos" ? "PURE CHAOS" : state.settings.upset.toUpperCase();
  snapshotText(context, `${mode} · ${state.settings.goals.toUpperCase()} GOALS`, 84, canvasHeight - 43, 420, 15, {
    weight: 600,
    align: "left",
    color: snapshotAccent,
    family: "Manrope, Arial, sans-serif",
  });
  if (uclSnapshot) {
    snapshotText(context, "UCL 26/27 SIMULATION", 600, canvasHeight - 43, 360, 17, {
      minimumSize: 14,
      weight: 900,
      color: "#ffffff",
      family: "Manrope, Arial, sans-serif",
    });
  } else if (premierLeagueSnapshot) {
    snapshotText(context, "PL 26/27 SIMULATION", 600, canvasHeight - 43, 360, 17, {
      minimumSize: 14,
      weight: 900,
      color: "#ffffff",
      family: "Manrope, Arial, sans-serif",
    });
  } else if (retroTheme) {
    snapshotText(context, retroTheme.footer, 600, canvasHeight - 43, 360, 17, {
      minimumSize: 14,
      weight: 800,
      color: retroTheme.primaryText,
      family: "Manrope, Arial, sans-serif",
    });
  } else if (state.customTournament) {
    snapshotText(context, state.customTournament.customMatch ? "CUSTOM MATCH" : "CUSTOM TOURNAMENT", 600, canvasHeight - 43, 360, 17, {
      minimumSize: 14,
      weight: 800,
      color: "#8aa9ff",
      family: "Manrope, Arial, sans-serif",
    });
  }
  snapshotText(context, "256teams.com", 1116, canvasHeight - 43, 420, 15, {
    weight: 600,
    align: "right",
    color: retroTheme?.secondaryText || (premierLeagueSnapshot ? "#d2afd9" : "#69778e"),
    family: "Manrope, Arial, sans-serif",
  });
  return canvas;
}

async function createOnlineMatchSnapshotCanvas() {
  const tournament = latestOnlineRoom?.tournament;
  const round = tournament?.rounds?.find((item) => item.matches.some((match) => match.id === onlineViewedMatchId));
  const match = round?.matches.find((item) => item.id === onlineViewedMatchId);
  if (!match || !(match.status === "complete" || match.liveState?.status === "finished")) {
    throw new Error("Finish the online match before taking a snapshot.");
  }
  const home = TEAM_BY_ID.get(match.homeTeamId);
  const away = TEAM_BY_ID.get(match.awayTeamId);
  if (!home || !away) throw new Error("The match teams could not be loaded.");
  const goals = onlineGoalEvents(match);
  const homeGoalLines = snapshotGoalLines(goals.filter((event) => event.side === "home").map((event) => ({
    scorer: event.player,
    minute: event.minute,
  })));
  const awayGoalLines = snapshotGoalLines(goals.filter((event) => event.side === "away").map((event) => ({
    scorer: event.player,
    minute: event.minute,
  })));
  const shootout = (match.events || []).filter((event) => event.type === "shootout-kick").map((event, index) => ({
    ...event,
    side: event.side || (event.teamId === match.homeTeamId ? "home" : "away"),
    player: onlineGoalScorer(match, event, index),
  }));
  const homeShootout = shootout.filter((attempt) => attempt.side === "home");
  const awayShootout = shootout.filter((attempt) => attempt.side === "away");
  const detailStartY = 390;
  const detailRows = Math.max(
    homeGoalLines.length + homeShootout.length,
    awayGoalLines.length + awayShootout.length,
    1,
  );
  const canvasHeight = Math.max(675, 500 + detailRows * 28);
  const [homeFlagImage, awayFlagImage] = await Promise.all([loadSnapshotFlag(home), loadSnapshotFlag(away)]);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image creation is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, 1200, canvasHeight);
  background.addColorStop(0, "#0b1018");
  background.addColorStop(0.55, "#111925");
  background.addColorStop(1, "#0b111b");
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, canvasHeight);
  snapshotRoundedRect(context, 55, 42, 1090, canvasHeight - 117, 28);
  context.fillStyle = "rgba(17, 24, 36, 0.9)";
  context.fill();
  context.strokeStyle = "rgba(118, 145, 196, 0.24)";
  context.lineWidth = 2;
  context.stroke();

  snapshotText(context, onlineRoundName(tournament, round.number).toUpperCase(), 1110, 88, 420, 18, {
    minimumSize: 14,
    weight: 700,
    align: "right",
    color: "#779cff",
  });
  drawSnapshotFlag(context, homeFlagImage, home, 270, 205);
  drawSnapshotFlag(context, awayFlagImage, away, 930, 205);
  snapshotText(context, home.name, 270, 292, 390, 42, { minimumSize: 20, weight: 800 });
  snapshotText(context, away.name, 930, 292, 390, 42, { minimumSize: 20, weight: 800 });
  snapshotText(context, String(match.liveState?.homeScore ?? match.homeScore ?? 0), 505, 300, 120, 88, { weight: 800 });
  snapshotText(context, "-", 600, 300, 80, 52, { color: "#65728a", weight: 400 });
  snapshotText(context, String(match.liveState?.awayScore ?? match.awayScore ?? 0), 695, 300, 120, 88, { weight: 800 });
  const penalty = match.liveState?.penalty || match.penalty;
  snapshotText(context, penalty ? `PENALTIES ${penalty.homeScore}-${penalty.awayScore}` : "FULL TIME", 600, 370, 380, 24, {
    minimumSize: 20,
    weight: 700,
    color: "#7e8ca3",
  });
  const homeGoalsBottom = drawSnapshotGoalLines(context, homeGoalLines, 188, detailStartY, "left");
  const awayGoalsBottom = drawSnapshotGoalLines(context, awayGoalLines, 1012, detailStartY, "right");
  if (homeShootout.length) drawSnapshotShootout(context, homeShootout, 188, homeGoalsBottom + (homeGoalLines.length ? 38 : 0), "left");
  if (awayShootout.length) drawSnapshotShootout(context, awayShootout, 1012, awayGoalsBottom + (awayGoalLines.length ? 38 : 0), "right");
  snapshotText(context, "ONLINE MODE", 84, canvasHeight - 43, 420, 15, {
    weight: 700,
    align: "left",
    color: "#69778e",
  });
  snapshotText(context, "256teams.com", 1116, canvasHeight - 43, 420, 15, {
    weight: 600,
    align: "right",
    color: "#69778e",
  });
  return canvas;
}

async function openOnlineSnapshotModal() {
  if (!els.onlineSnapshotButton || els.onlineSnapshotButton.disabled) return;
  els.onlineSnapshotButton.disabled = true;
  try {
    const match = latestOnlineRoom?.tournament?.rounds
      ?.flatMap((round) => round.matches)
      .find((item) => item.id === onlineViewedMatchId);
    const home = TEAM_BY_ID.get(match?.homeTeamId);
    const away = TEAM_BY_ID.get(match?.awayTeamId);
    els.snapshotModalKicker.textContent = "SHARE THE RESULT";
    els.snapshotModalTitle.textContent = "Online match snapshot";
    snapshotBlob = await canvasPngBlob(await createOnlineMatchSnapshotCanvas());
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    snapshotFilename = `world-256-online-${home?.name || "home"}-vs-${away?.name || "away"}`
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The snapshot could not be created.");
  } finally {
    els.onlineSnapshotButton.disabled = false;
  }
}

function drawLegacySnapshotPitch(context, formation, x, y, width, height, expert) {
  snapshotRoundedRect(context, x, y, width, height, 24);
  context.fillStyle = "#0d8448";
  context.fill();
  context.save();
  snapshotRoundedRect(context, x, y, width, height, 24);
  context.clip();
  const stripeHeight = height / 8;
  for (let index = 0; index < 8; index += 1) {
    context.fillStyle = index % 2 ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.035)";
    context.fillRect(x, y + index * stripeHeight, width, stripeHeight);
  }
  context.restore();

  context.strokeStyle = "rgba(211, 240, 222, 0.55)";
  context.lineWidth = 3;
  context.strokeRect(x + 2, y + 2, width - 4, height - 4);
  context.beginPath();
  context.moveTo(x, y + height / 2);
  context.lineTo(x + width, y + height / 2);
  context.stroke();
  context.beginPath();
  context.arc(x + width / 2, y + height / 2, 72, 0, Math.PI * 2);
  context.stroke();
  context.strokeRect(x + width * 0.28, y, width * 0.44, 92);
  context.strokeRect(x + width * 0.28, y + height - 92, width * 0.44, 92);
  context.strokeRect(x + width * 0.39, y, width * 0.22, 38);
  context.strokeRect(x + width * 0.39, y + height - 38, width * 0.22, 38);

  const lineGap = formation.lines.length > 1 ? (height - 150) / (formation.lines.length - 1) : 0;
  formation.lines.forEach((line, lineIndex) => {
    const lineY = y + 75 + lineIndex * lineGap;
    line.forEach((slotId, slotIndex) => {
      const slot = formation.slots.find((candidate) => candidate.id === slotId);
      const player = legacyDraft.lineup[slotId];
      const slotX = x + width * ((slotIndex + 1) / (line.length + 1));
      context.beginPath();
      context.arc(slotX, lineY, 35, 0, Math.PI * 2);
      context.fillStyle = "#075c34";
      context.fill();
      context.strokeStyle = "rgba(202, 238, 216, 0.72)";
      context.lineWidth = 3;
      context.stroke();
      snapshotText(context, expert ? slot.label : String(legacyEffectiveValue(player, slot, player.rating)), slotX, lineY, 58, 24, {
        minimumSize: 16,
        weight: 900,
      });
      snapshotText(context, player.name.split(/\s+/).at(-1), slotX, lineY + 49, 108, 15, {
        minimumSize: 10,
        weight: 800,
        color: "#f4f8f6",
      });
      snapshotText(context, String(player.year), slotX, lineY - 49, 70, 11, {
        minimumSize: 9,
        weight: 800,
        color: "#c8d7ff",
      });
    });
  });
}

function drawLegacySnapshotNationFlag(context, image, team, x, y) {
  snapshotRoundedRect(context, x, y, 88, 58, 8);
  context.fillStyle = "rgba(7, 20, 30, 0.72)";
  context.fill();
  if (image) {
    context.save();
    snapshotRoundedRect(context, x + 5, y + 5, 78, 48, 5);
    context.clip();
    context.drawImage(image, x + 5, y + 5, 78, 48);
    context.restore();
    return;
  }
  snapshotText(context, team.code, x + 44, y + 29, 66, 20, {
    minimumSize: 14,
    weight: 900,
    color: "#9bb7ff",
  });
}

async function createLegacyDraftSnapshotCanvas() {
  if (!legacyDraft?.complete) throw new Error("Finish the draft before taking a snapshot.");
  const formation = legacyFormation();
  const expert = legacyDraft.mode === "expert";
  const nationTeam = legacyNationTeam(legacyDraft.nation);
  const nationFlagImage = await loadSnapshotFlag(nationTeam);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image creation is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, 1200, 900);
  background.addColorStop(0, "#09101a");
  background.addColorStop(1, "#111b2a");
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, 900);

  snapshotText(context, `${legacyDraft.nation.name} Legacy XI`, 55, 58, 330, 34, {
    minimumSize: 22,
    weight: 900,
    align: "left",
  });
  snapshotText(context, `${formation.label}  ·  ${expert ? "EXPERT" : "CLASSIC"}`, 55, 100, 330, 16, {
    minimumSize: 12,
    weight: 800,
    align: "left",
    color: "#80a2ff",
  });
  snapshotText(context, "WORLD CUP LEGACY DRAFT", 55, 137, 330, 13, {
    minimumSize: 10,
    weight: 800,
    align: "left",
    color: "#78869b",
  });

  legacyFormationSlots().forEach((slot, index) => {
    const player = legacyDraft.lineup[slot.id];
    const rowY = 190 + index * 54;
    snapshotText(context, slot.label, 55, rowY, 46, 14, {
      minimumSize: 11,
      weight: 900,
      align: "left",
      color: "#83adff",
    });
    snapshotText(context, player.name, 108, rowY, 205, 16, {
      minimumSize: 11,
      weight: 800,
      align: "left",
    });
    snapshotText(context, expert ? String(player.year) : String(legacyEffectiveValue(player, slot, player.rating)), 365, rowY, 55, 19, {
      minimumSize: 14,
      weight: 900,
      align: "right",
      color: expert ? "#9ca9bb" : "#57e694",
    });
  });

  drawLegacySnapshotPitch(context, formation, 420, 45, 730, 810, expert);
  drawLegacySnapshotNationFlag(context, nationFlagImage, nationTeam, 442, 67);
  snapshotText(context, "256teams.com", 55, 858, 330, 14, {
    minimumSize: 11,
    weight: 700,
    align: "left",
    color: "#66758b",
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
    const uclSnapshot = Boolean(state?.uclSeason || document.body.classList.contains("ucl-match-mode-active"));
    const premierLeagueSnapshot = Boolean(state.premierLeagueSeason);
    const copaSnapshot = Number(retroTournament?.year || retroWorldCupYearFromPath()) === 2024;
    els.snapshotModalKicker.textContent = uclSnapshot
      ? "UCL 26/27 SIMULATION"
      : premierLeagueSnapshot ? "PL 26/27 SIMULATION" : copaSnapshot ? "COPA AMÉRICA USA 2024" : "SHARE THE MOMENT";
    els.snapshotModalTitle.textContent = uclSnapshot
      ? "Champions League match snapshot"
      : premierLeagueSnapshot ? "Premier League match snapshot" : copaSnapshot ? "Copa América match snapshot" : "Match snapshot";
    snapshotBlob = await canvasPngBlob(await createMatchSnapshotCanvas());
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    els.snapshotImage.alt = uclSnapshot
      ? "Generated UCL 26/27 match snapshot"
      : premierLeagueSnapshot
        ? "Generated PL 26/27 match snapshot"
      : copaSnapshot ? "Generated Copa América USA 2024 match snapshot" : "Generated 256 TEAMS WC snapshot";
    const snapshot = snapshotMatchContext();
    snapshotFilename = `${uclSnapshot ? "ucl-26-27" : premierLeagueSnapshot ? "pl-26-27" : copaSnapshot ? "copa-america-2024" : "world-256"}-${snapshot.home.name}-vs-${snapshot.away.name}`
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

async function openLegacyDraftSnapshot(button) {
  if (button) button.disabled = true;
  try {
    els.snapshotModalKicker.textContent = "YOUR LEGACY XI";
    els.snapshotModalTitle.textContent = "Draft snapshot";
    snapshotBlob = await canvasPngBlob(await createLegacyDraftSnapshotCanvas());
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    snapshotFilename = `${legacyDraft.nation.name}-legacy-xi`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The draft snapshot could not be created.");
  } finally {
    if (button) button.disabled = false;
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
    const premierLeagueSnapshot = Boolean(state?.premierLeagueSeason);
    const uclSnapshot = Boolean(state?.uclSeason || document.body.classList.contains("ucl-match-mode-active"));
    await navigator.share({
      title: uclSnapshot
        ? "UCL 26/27 match snapshot"
        : premierLeagueSnapshot ? "PL 26/27 match snapshot" : "256 TEAMS WC match snapshot",
      text: uclSnapshot
        ? "UCL 26/27 simulation result"
        : premierLeagueSnapshot ? "PL 26/27 simulation result" : "256 TEAMS WC tournament result",
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

async function createPremierLeagueSeasonSnapshotCanvas(summary) {
  const championRow = summary?.champion;
  const champion = championRow?.club;
  if (!champion) throw new Error("The Premier League season is not complete.");
  const podium = summary.podium || [];
  const simulationStyleLabel = {
    realistic: "REALISTIC",
    balanced: "STANDARD",
    chaos: "PURE CHAOS",
  }[summary?.settings?.upset] || "STANDARD";
  const goalLevelLabel = {
    tight: "TIGHT",
    normal: "NORMAL",
    wild: "GOAL FEST",
  }[summary?.settings?.goals] || "NORMAL";
  const awardRows = [
    ["GOLDEN BOOT", summary.goldenBoot, (award) => `${award.goals} goals`, "⚽"],
    ["GOLDEN GLOVE", summary.goldenGlove, (award) => `${award.cleanSheets} clean sheets`, "🧤"],
    ["PLAYER OF THE SEASON", summary.playerOfTheYear, (award) => `${award.goals} goals · ${award.assists} assists`, "🏆"],
    ["YOUNG PLAYER OF THE SEASON", summary.youngPlayerOfTheYear, (award) => `${award.goals} goals · ${award.assists} assists`, "🌟"],
  ];
  const loadedBadges = await Promise.all([
    loadSnapshotFlag(champion, { premierLeague: true }),
    ...podium.map((row) => loadSnapshotFlag(row.club, { premierLeague: true })),
    ...awardRows.map(([, award]) => (
      award?.team ? loadSnapshotFlag(award.team, { premierLeague: true }) : Promise.resolve(null)
    )),
  ]);
  const championBadge = loadedBadges[0];
  const podiumBadges = loadedBadges.slice(1, 1 + podium.length);
  const awardBadges = loadedBadges.slice(1 + podium.length);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  const background = context.createLinearGradient(0, 0, 1200, 900);
  background.addColorStop(0, "#381d53");
  background.addColorStop(0.5, "#28002d");
  background.addColorStop(1, "#1e0021");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  snapshotText(context, "2026/27 PREMIER LEAGUE CHAMPIONS", 600, 62, 760, 19, {
    weight: 800,
    color: "#d9b6ed",
    family: "DM Mono, monospace",
  });
  drawSnapshotFlag(context, championBadge, champion, 600, 160, null, true);
  snapshotText(context, champion.name, 600, 260, 820, 58, {
    minimumSize: 36,
    weight: 900,
    color: "#ffffff",
  });
  snapshotText(context, `${championRow.points} POINTS · ${championRow.won} WINS · ${championRow.gf} GOALS`, 600, 306, 720, 16, {
    weight: 800,
    color: "#d9b6ed",
  });

  podium.forEach((row, index) => {
    const x = 178 + index * 422;
    snapshotRoundedRect(context, x - 168, 350, 336, 72, 12);
    context.fillStyle = "rgba(96, 53, 126, 0.44)";
    context.fill();
    snapshotText(context, String(index + 1), x - 138, 386, 34, 25, {
      weight: 900,
      color: "#d9b6ed",
    });
    const podiumBadge = podiumBadges[index];
    if (podiumBadge) {
      const sourceWidth = podiumBadge.naturalWidth || podiumBadge.width || 1;
      const sourceHeight = podiumBadge.naturalHeight || podiumBadge.height || 1;
      const ratio = Math.min(34 / sourceWidth, 34 / sourceHeight);
      const badgeWidth = sourceWidth * ratio;
      const badgeHeight = sourceHeight * ratio;
      context.drawImage(
        podiumBadge,
        x - 100 - badgeWidth / 2,
        386 - badgeHeight / 2,
        badgeWidth,
        badgeHeight,
      );
    } else {
      snapshotRoundedRect(context, x - 116, 370, 32, 32, 7);
      context.fillStyle = "rgba(96, 53, 126, 0.72)";
      context.fill();
      snapshotText(context, row.club.code || "PL", x - 100, 387, 26, 9, {
        minimumSize: 7,
        weight: 900,
        color: "#d9b6ed",
      });
    }
    snapshotText(context, row.club.name, x - 72, 378, 185, 17, {
      minimumSize: 12,
      weight: 800,
      align: "left",
      color: "#fff",
    });
    snapshotText(context, `${row.points} PTS`, x - 72, 402, 185, 12, {
      weight: 800,
      align: "left",
      color: "#b896c4",
    });
  });

  awardRows.forEach(([label, award, detail, mark], index) => {
    if (!award) return;
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 52 + column * 574;
    const y = 466 + row * 142;
    snapshotRoundedRect(context, x, y, 522, 116, 14);
    context.fillStyle = "rgba(50, 18, 61, 0.94)";
    context.fill();
    context.strokeStyle = "rgba(217, 182, 237, 0.18)";
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = "rgba(96, 53, 126, 0.72)";
    context.beginPath();
    context.arc(x + 28, y + 58, 22, 0, Math.PI * 2);
    context.fill();
    snapshotText(context, mark, x + 28, y + 60, 32, 18, {
      minimumSize: 14,
      weight: 800,
      color: "#ffffff",
    });
    const badge = awardBadges[index];
    if (badge) {
      const ratio = Math.min(28 / (badge.naturalWidth || badge.width || 1), 28 / (badge.naturalHeight || badge.height || 1));
      const width = (badge.naturalWidth || badge.width || 1) * ratio;
      const height = (badge.naturalHeight || badge.height || 1) * ratio;
      context.drawImage(badge, x + 72 - width / 2, y + 58 - height / 2, width, height);
    }
    snapshotText(context, label, x + 98, y + 27, 390, 12, {
      weight: 900,
      align: "left",
      color: "#d9b6ed",
      family: "DM Mono, monospace",
    });
    snapshotText(context, award.player, x + 98, y + 58, 390, 23, {
      minimumSize: 16,
      weight: 900,
      align: "left",
      color: "#fff",
    });
    snapshotText(context, `${award.team.name} · ${detail(award)}`, x + 98, y + 87, 390, 13, {
      minimumSize: 10,
      weight: 700,
      align: "left",
      color: "#b896c4",
    });
  });

  snapshotText(context, `PL 26/27 SIMULATION · ${simulationStyleLabel} · ${goalLevelLabel}`, 84, 850, 760, 14, {
    weight: 800,
    align: "left",
    color: "#b896c4",
  });
  snapshotText(context, "256teams.com", 1116, 850, 380, 14, {
    weight: 800,
    align: "right",
    color: "#b896c4",
  });
  return canvas;
}

async function openPremierLeagueSeasonSnapshotModal(summary, button = null) {
  if (button) button.disabled = true;
  try {
    els.snapshotModalKicker.textContent = "PL 26/27 SEASON COMPLETE";
    els.snapshotModalTitle.textContent = "Premier League winners snapshot";
    snapshotBlob = await canvasPngBlob(await createPremierLeagueSeasonSnapshotCanvas(summary));
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    els.snapshotImage.alt = "Generated Premier League season winners snapshot";
    snapshotFilename = `pl-26-27-${summary.champion.club.name}-champions`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The season snapshot could not be created.");
  } finally {
    if (button) button.disabled = false;
  }
}

window.openPremierLeagueSeasonSnapshotModal = openPremierLeagueSeasonSnapshotModal;

async function createUclSeasonSnapshotCanvas(summary) {
  const champion = summary?.champion;
  if (!champion) throw new Error("The Champions League season is not complete.");
  const topScorer = summary.topScorer;
  const loadedBadges = await Promise.all([
    loadSnapshotFlag(champion, { ucl: true }),
    summary.playerOfTheSeason?.team ? loadSnapshotFlag(summary.playerOfTheSeason.team, { ucl: true }) : Promise.resolve(null),
    summary.youngPlayerOfTheSeason?.team ? loadSnapshotFlag(summary.youngPlayerOfTheSeason.team, { ucl: true }) : Promise.resolve(null),
    topScorer?.team ? loadSnapshotFlag(topScorer.team, { ucl: true }) : Promise.resolve(null),
  ]);
  const [championBadge, potsBadge, ypotsBadge, scorerBadge] = loadedBadges;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  const background = context.createLinearGradient(0, 0, 1200, canvas.height);
  background.addColorStop(0, "#10275d");
  background.addColorStop(0.48, "#061432");
  background.addColorStop(1, "#020817");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const glow = context.createRadialGradient(600, 185, 20, 600, 185, 360);
  glow.addColorStop(0, "rgba(75, 119, 255, 0.34)");
  glow.addColorStop(1, "rgba(2, 8, 23, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, 560);

  snapshotText(context, "2026/27 UEFA CHAMPIONS LEAGUE WINNERS", 600, 60, 850, 19, {
    weight: 900,
    color: "#8fb2ff",
    family: "DM Mono, monospace",
  });
  drawSnapshotFlag(context, championBadge, champion, 600, 172, null, true, true);
  snapshotText(context, champion.name, 600, 292, 880, 58, {
    minimumSize: 36,
    weight: 900,
    color: "#ffffff",
  });
  snapshotText(context, "CHAMPIONS OF EUROPE", 600, 334, 620, 16, {
    weight: 900,
    color: "#e5c46e",
    family: "DM Mono, monospace",
  });

  const statCards = [
    {
      label: "POTS",
      value: summary.playerOfTheSeason?.player || "—",
      detail: summary.playerOfTheSeason
        ? `${summary.playerOfTheSeason.team?.name || "Club"} · PLAYER OF THE SEASON`
        : "PLAYER OF THE SEASON",
      badge: potsBadge,
      team: summary.playerOfTheSeason?.team,
    },
    {
      label: "YPOTS",
      value: summary.youngPlayerOfTheSeason?.player || "—",
      detail: summary.youngPlayerOfTheSeason
        ? `${summary.youngPlayerOfTheSeason.team?.name || "Club"} · YOUNG PLAYER OF THE SEASON`
        : "YOUNG PLAYER OF THE SEASON",
      badge: ypotsBadge,
      team: summary.youngPlayerOfTheSeason?.team,
    },
    {
      label: "TOP SCORER",
      value: topScorer ? `${topScorer.goals}` : "—",
      detail: topScorer ? `${topScorer.player} · ${topScorer.goals === 1 ? "1 GOAL" : `${topScorer.goals} GOALS`}` : "NO GOALS RECORDED",
      badge: scorerBadge,
      team: topScorer?.team,
    },
  ];

  statCards.forEach((card, index) => {
    const x = 48 + index * 384;
    const y = 404;
    snapshotRoundedRect(context, x, y, 336, 224, 18);
    context.fillStyle = "rgba(13, 34, 78, 0.9)";
    context.fill();
    context.strokeStyle = index === 2 ? "rgba(229, 196, 110, 0.42)" : "rgba(143, 178, 255, 0.2)";
    context.lineWidth = 2;
    context.stroke();
    if (card.team) drawSnapshotFlag(context, card.badge, card.team, x + 168, y + 67, null, true, true);
    snapshotText(context, card.label, x + 168, y + 132, 290, 14, {
      weight: 900,
      color: index === 2 ? "#e5c46e" : "#8fb2ff",
      family: "DM Mono, monospace",
    });
    snapshotText(context, card.value, x + 168, y + 174, 292, index === 2 ? 38 : 24, {
      minimumSize: index === 2 ? 28 : 15,
      weight: 900,
      color: "#ffffff",
    });
    snapshotText(context, card.detail, x + 168, y + 205, 292, 12, {
      minimumSize: 9,
      weight: 800,
      color: "#a8b9df",
    });
  });

  snapshotText(context, "UCL 26/27 SIMULATION", 64, 688, 500, 14, {
    weight: 800,
    align: "left",
    color: "#8095c3",
  });
  snapshotText(context, "256teams.com", 1136, 688, 380, 14, {
    weight: 800,
    align: "right",
    color: "#8095c3",
  });
  return canvas;
}

async function openUclSeasonSnapshotModal(summary, button = null) {
  if (button) button.disabled = true;
  try {
    els.snapshotModalKicker.textContent = "UCL 26/27 COMPETITION COMPLETE";
    els.snapshotModalTitle.textContent = "Champions League winners image";
    snapshotBlob = await canvasPngBlob(await createUclSeasonSnapshotCanvas(summary));
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    els.snapshotImage.alt = "Generated Champions League winners image";
    snapshotFilename = `ucl-26-27-${summary.champion.name}-champions`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The Champions League winners image could not be created.");
  } finally {
    if (button) button.disabled = false;
  }
}

window.openUclSeasonSnapshotModal = openUclSeasonSnapshotModal;

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

function neutralPlayerLabels() {
  return Array.from({ length: 11 }, (_, index) => `Player ${index + 1}`);
}

var playerProfileCache = new Map();

function clearPlayerProfileCacheForTeam(teamId) {
  if (!(playerProfileCache instanceof Map)) return;
  [...playerProfileCache.keys()]
    .filter((key) => key.startsWith(`${teamId}:`))
    .forEach((key) => playerProfileCache.delete(key));
}
