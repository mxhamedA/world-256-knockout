function setOnlineRoomMessage(message = "", error = false) {
  els.onlineRoomMessage.textContent = message;
  els.onlineRoomMessage.classList.toggle("is-error", error);
}

function setOnlineRoomBusy(busy) {
  onlineRoomBusy = busy;
  [els.confirmCreateRoomButton, els.confirmJoinRoomButton, els.findOnlineMatchButton,
    els.closeOnlineRoomButton, els.leaveOnlineRoomButton,
    els.closeOnlineDraftRoomButton, els.leaveOnlineDraftRoomButton, els.updateOnlineDisplayNameButton,
    els.onlineReadyButton, els.onlinePauseMatchButton, els.onlineMatchSpeedButton,
    els.closeOnlineMatchRoomButton, els.leaveOnlineMatchRoomButton,
    els.onlinePlayAgainButton, els.onlineEndLobbyButton]
    .forEach((button) => { button.disabled = busy; });
  els.onlineTacticSlider.disabled = busy;
  els.onlinePenaltyControl.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
  const needsOpponent = latestOnlineRoom?.status === "lobby" && latestOnlineRoom.memberCount < 2;
  els.startOnlineDraftButton.disabled = busy || needsOpponent;
  els.confirmCreateRoomButton.textContent = busy ? "Creating…" : "Create private room";
  els.confirmJoinRoomButton.textContent = busy ? "Joining…" : "Join room";
  els.updateOnlineDisplayNameButton.textContent = busy ? "Saving..." : "Update";
}

function renderOnlineMatchmakingState(payload = null) {
  if (!els.onlineMatchmakingCard) return;
  const searching = Boolean(onlineMatchmakingSession);
  els.onlineMatchmakingCard.classList.toggle("is-searching", searching);
  els.onlineMatchmakingQueue.hidden = !searching;
  els.findOnlineMatchButton.hidden = searching;
  els.findOnlineMatchButton.disabled = searching || onlineMatchmakingBusy;
  els.findOnlineMatchButton.innerHTML = onlineMatchmakingBusy
    ? "Joining queue…"
    : 'Play now <span aria-hidden="true">&rarr;</span>';
  els.onlineEntryOptions.hidden = searching;
  els.onlineDisplayName.disabled = searching || onlineMatchmakingBusy;
  els.cancelOnlineMatchmakingButton.disabled = onlineMatchmakingBusy;
  if (!searching) return;
  const status = payload?.status || "queued";
  els.onlineMatchmakingStatus.textContent = status === "matching"
    ? "Opponent found — creating your room"
    : "Searching for an opponent";
  if (status === "matching") {
    els.onlineMatchmakingMeta.textContent = "Your country draft will begin automatically.";
  } else if (Number.isInteger(payload?.position) && payload.position > 1) {
    els.onlineMatchmakingMeta.textContent = `Queue position ${payload.position}. Keep this page open.`;
  } else {
    els.onlineMatchmakingMeta.textContent = "You’re first in line. Keep this page open.";
  }
}

function showOnlineRoomEntry(preferJoin = false) {
  stopOnlineRoomPolling();
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();
  clearTimeout(onlineRoundScoreTimer);
  onlineRoundScoreTimer = null;
  onlineDisplayedRoundNumber = null;
  if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
  els.onlineRoomEntry.hidden = false;
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineScreenHeading.hidden = false;
  stopOnlineDraftRun();
  els.onlineRoomTitle.textContent = "Play online";
  renderOnlineMatchmakingState();
  if (onlineMatchmakingSession) startOnlineMatchmakingPolling();
  const linkedCode = new URLSearchParams(window.location.search).get("room");
  if (linkedCode) els.onlineRoomCodeInput.value = normalizeOnlineRoomCode(linkedCode);
  requestAnimationFrame(() => (preferJoin && els.onlineRoomCodeInput.value
    ? els.onlineRoomCodeInput
    : els.onlineDisplayName).focus());
}

async function openOnlineRoom(preferJoin = false, { updateUrl = true } = {}) {
  if (updateUrl && currentAppMode() !== "online") setAppModeUrl("online");
  setOnlineRoomMessage();
  els.appShell.hidden = true;
  els.onlineRoomScreen.hidden = false;
  document.body.classList.add("online-screen-open");
  window.scrollTo({ top: 0, behavior: "auto" });
  const linkedCode = normalizeOnlineRoomCode(new URLSearchParams(window.location.search).get("room"));
  if (!onlineRoomSession || (linkedCode && linkedCode !== onlineRoomSession.code)) {
    showOnlineRoomEntry(preferJoin || Boolean(linkedCode));
    if (linkedCode && els.onlineDisplayName.value.trim() && !onlineInviteAutoJoinAttempted) {
      onlineInviteAutoJoinAttempted = true;
      queueMicrotask(() => joinOnlineRoom());
    }
    return;
  }
  showOnlineLobbyShell();
  await refreshOnlineRoom();
}

function closeOnlineScreen({ updateUrl = true, force = false } = {}) {
  if (onlineRoomBusy && !force) return;
  if (onlineMatchmakingSession) void cancelOnlineMatchmaking({ quiet: true });
  stopOnlineRoomPolling();
  stopOnlineMatchmakingPolling();
  stopOnlineDraftRun();
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();
  clearTimeout(onlineRoundScoreTimer);
  onlineRoundScoreTimer = null;
  onlineDisplayedRoundNumber = null;
  if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
  els.onlineRoomScreen.hidden = true;
  els.appShell.hidden = false;
  document.body.classList.remove("online-screen-open");
  if (updateUrl) setAppModeUrl("home", { replace: true });
  requestAnimationFrame(() => {
    if (!els.joinOnlineRoomButton.hidden) els.joinOnlineRoomButton.focus();
  });
}

function showOnlineLobbyShell() {
  stopOnlineMatchmakingPolling();
  els.onlineRoomEntry.hidden = true;
  els.onlineRoomLobby.hidden = false;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineResults.hidden = true;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Online tournament lobby";
  els.onlineRoomCode.textContent = onlineRoomSession?.code || "------";
  startOnlineRoomPolling();
}

function renderOnlineLobby(room, memberId) {
  if (room.status === "tournament-complete" && room.tournament?.status === "complete") {
    renderOnlineResults(room, memberId);
    return;
  }
  if (room.status === "matches") {
    renderOnlineMatches(room, memberId);
    return;
  }
  if (room.status === "draft" || room.status === "draft-complete") {
    renderOnlineDraft(room, memberId);
    return;
  }
  latestOnlineRoom = room;
  els.onlineRoomLobby.hidden = false;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineResults.hidden = true;
  els.onlineRoomCode.textContent = room.code;
  const isPublicRoom = room.visibility === "public";
  els.onlineRoomTitle.textContent = isPublicRoom ? "Public tournament" : "Private tournament lobby";
  els.onlineRoomCodePanel.hidden = isPublicRoom;
  const inviteUrl = onlineRoomInviteUrl(room.code);
  els.onlineRoomInviteLink.href = inviteUrl;
  els.onlineRoomInviteLink.textContent = inviteUrl.replace(/^https?:\/\//, "");
  els.onlineRoomCount.textContent = `${room.memberCount} / ${room.maxMembers} players`;
  const currentMember = room.members.find((member) => member.id === memberId);
  if (document.activeElement !== els.onlineLobbyDisplayName) {
    els.onlineLobbyDisplayName.value = currentMember?.name || onlineRoomSession?.name || "";
  }
  els.closeOnlineRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
  els.onlineMemberList.replaceChildren(...room.members.map((member) => {
    const row = document.createElement("div");
    row.className = "online-member";
    const avatar = document.createElement("span");
    avatar.className = "online-member-avatar";
    avatar.textContent = member.name.slice(0, 1).toUpperCase();
    avatar.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = member.name;
    const role = document.createElement("small");
    role.textContent = member.isHost ? "Host" : member.isCpu ? "CPU opponent" : member.id === memberId ? "You" : "Player";
    copy.append(name, role);
    const state = document.createElement("i");
    state.textContent = "Ready";
    row.append(avatar, copy, state);
    return row;
  }));
  els.startOnlineDraftButton.hidden = !onlineRoomSession?.isHost;
  els.startOnlineDraftButton.disabled = onlineRoomBusy || room.memberCount < 2;
}

function renderOnlineDraftLegacy(room, memberId) {
  latestOnlineRoom = room;
  els.onlineRoomLobby.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineDraft.hidden = false;
  els.onlineRoomTitle.textContent = "Country draft";
  const draft = room.draft;
  const currentMember = room.members.find((member) => member.id === draft?.currentMemberId);
  const isComplete = draft?.status === "complete";
  const isMyTurn = draft?.currentMemberId === memberId;
  els.onlineDraftTitle.textContent = isComplete ? "Draft complete" : isMyTurn ? "Choose your country" : `${currentMember?.name || "Another player"} is choosing`;
  els.onlineDraftTurn.textContent = isComplete ? "Complete" : isMyTurn ? "Your turn" : `${currentMember?.name || "Player"}'s turn`;
  els.onlineDraftTurn.classList.toggle("is-waiting", !isComplete && !isMyTurn);
  els.onlineDraftTurn.classList.toggle("is-complete", isComplete);

  const picksByMember = new Map((draft?.picks || []).map((pick) => [pick.memberId, pick]));
  els.onlineDraftPicks.replaceChildren(...room.members.map((member) => {
    const pick = picksByMember.get(member.id);
    const team = pick ? TEAM_BY_ID.get(pick.teamId) : null;
    const card = document.createElement("div");
    card.className = "online-draft-pick";
    const flag = document.createElement("span");
    flag.className = "online-draft-pick-flag";
    if (team) flag.innerHTML = flagMarkup(team, "draft-pick-flag");
    else flag.textContent = "?";
    const copy = document.createElement("span");
    const name = document.createElement("small");
    name.textContent = member.isCpu ? "CPU" : member.name;
    const selection = document.createElement("strong");
    selection.textContent = team?.name || (draft?.currentMemberId === member.id ? "Choosing…" : "Waiting");
    copy.append(name, selection);
    card.append(flag, copy);
    return card;
  }));

  const claimed = new Set((draft?.picks || []).map((pick) => pick.teamId));
  const query = els.onlineDraftSearch.value.trim().toLocaleLowerCase();
  const listSignature = `${query}|${isMyTurn}|${isComplete}|${onlineRoomBusy}|${[...claimed].sort().join(",")}`;
  if (listSignature !== onlineDraftListSignature) {
    const teams = [...TEAMS]
      .sort(compareTeamsByOfficialFifaRank)
      .filter((team) => !query || team.name.toLocaleLowerCase().includes(query));
    els.onlineCountryList.replaceChildren(...teams.map((team) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "online-country-option";
      const taken = claimed.has(team.id);
      button.disabled = onlineRoomBusy || !isMyTurn || taken || isComplete;
      button.dataset.teamId = team.id;
      button.setAttribute("aria-label", `${team.name}, ${team.officialFifaRank ? `FIFA rank ${team.officialFifaRank}` : "unranked"}${taken ? ", already picked" : ""}`);
      const flag = document.createElement("span");
      flag.innerHTML = flagMarkup(team, "draft-country-flag");
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = team.name;
      const rank = document.createElement("small");
      rank.textContent = team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team";
      copy.append(name, rank);
      const state = document.createElement("i");
      state.textContent = taken ? "Picked" : "Choose";
      button.append(flag, copy, state);
      return button;
    }));
    onlineDraftListSignature = listSignature;
  }
  els.onlineDraftSearch.disabled = !isMyTurn || isComplete;
  els.closeOnlineDraftRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineDraftRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
}

function renderOnlineDraft(room, memberId) {
  latestOnlineRoom = room;
  els.onlineRoomLobby.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineResults.hidden = true;
  els.onlineDraft.hidden = false;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Snake draft";
  const draft = room.draft;
  const currentMember = room.members.find((member) => member.id === draft?.currentMemberId);
  const isComplete = draft?.status === "complete";
  els.onlineDraftHead.hidden = isComplete;
  const totalPicks = draft?.totalPicks || room.members.length * (draft?.picksPerMember || 5);
  const completedPicks = draft?.picks.length || 0;
  const roundNumber = Math.min(draft?.picksPerMember || 5, Math.floor(completedPicks / room.members.length) + 1);
  els.onlineDraftTitle.textContent = `Round ${roundNumber} of ${draft?.picksPerMember || 5}`;
  els.onlineDraftTurn.textContent = isComplete ? "Complete" : `Pick ${completedPicks + 1} of ${totalPicks}`;
  els.onlineDraftTurn.classList.toggle("is-waiting", false);
  els.onlineDraftTurn.classList.toggle("is-complete", isComplete);
  els.onlineDraftProgress.style.width = `${totalPicks ? Math.round((completedPicks / totalPicks) * 100) : 0}%`;

  const memberById = new Map(room.members.map((member) => [member.id, member]));
  const rosterOrder = (draft?.baseOrder || room.members.map((member) => member.id))
    .map((id) => memberById.get(id))
    .filter(Boolean);
  els.onlineDraftRosters.replaceChildren(...rosterOrder.map((member) => {
    const memberPicks = (draft?.picks || []).filter((pick) => pick.memberId === member.id);
    const roster = document.createElement("section");
    roster.className = "online-draft-roster";
    roster.classList.toggle("is-current", !isComplete && currentMember?.id === member.id);
    const head = document.createElement("div");
    head.className = "online-draft-roster-head";
    const identity = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = member.isCpu ? "CPU" : member.name;
    identity.append(name);
    const count = document.createElement("i");
    count.textContent = `${memberPicks.length} / ${draft?.picksPerMember || 5}`;
    head.append(identity, count);
    const countries = document.createElement("div");
    countries.className = "online-draft-roster-countries";
    for (let slot = 0; slot < (draft?.picksPerMember || 5); slot += 1) {
      const pick = memberPicks[slot];
      const team = pick ? TEAM_BY_ID.get(pick.teamId) : null;
      const country = document.createElement("div");
      country.className = "online-roster-country";
      country.classList.toggle("is-empty", !team);
      const flag = document.createElement("span");
      if (team) flag.innerHTML = flagMarkup(team, "roster-country-flag");
      else flag.textContent = String(slot + 1);
      const label = document.createElement("strong");
      label.className = "team-name online-roster-country-name";
      setTeamName(label, team?.name || "Waiting");
      country.append(flag, label);
      countries.append(country);
    }
    roster.append(head, countries);
    return roster;
  }));

  if (!onlineDraftRunning) {
    const lastPick = draft?.picks.at(-1);
    const lastTeam = lastPick ? TEAM_BY_ID.get(lastPick.teamId) : null;
    const displayMember = lastPick ? memberById.get(lastPick.memberId) : currentMember;
    if (lastTeam) showOnlineRouletteResult(displayMember, lastTeam, lastPick);
    else setOnlineRouletteSearching(currentMember, room, draft);
  }
  els.closeOnlineDraftRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineDraftRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
  if (isComplete) stopOnlineDraftRun();
  else if (onlineRoomSession?.isHost && !onlineDraftRunning && !els.onlineRoomScreen.hidden) {
    queueMicrotask(() => runOnlineSnakeDraft(room));
  } else if (!onlineRoomSession?.isHost && !onlineDraftRunning && !els.onlineRoomScreen.hidden) {
    queueMicrotask(() => runOnlineDraftSpectator(room));
  }
}

const ONLINE_TACTIC_OPTIONS = [
  { id: "balanced", name: "Balanced", copy: "No attacking or defensive modifier." },
  { id: "tiki-taka", name: "Tiki-taka", copy: "Patient possession play that creates openings through short combinations." },
  { id: "counter", name: "Counter", copy: "Defend compactly, then attack the space quickly when possession turns over." },
  { id: "high-press", name: "High press", copy: "Win the ball higher up the pitch at the cost of extra fatigue and risk." },
  { id: "defensive", name: "Defensive", copy: "A safer shape that concedes fewer chances but creates less going forward." },
];
const ONLINE_SHARED_PLAYBACK_MS = 30000;
const ONLINE_LIVE_MINUTE_MS = 667;
const ONLINE_LIVE_MAX_FRAME_MS = 100;
const ONLINE_LIVE_CATCHUP_FACTOR = 1.8;
const ONLINE_LIVE_MAX_FRAME_MINUTES = 0.45;

function onlineRoundName(tournament, roundNumber) {
  const totalTeams = tournament?.participantTeamIds?.length || 256;
  const teamsRemaining = Math.max(2, Math.ceil(totalTeams / (2 ** Math.max(0, roundNumber - 1))));
  if (teamsRemaining === 2) return "Final";
  if (teamsRemaining === 4) return "Semi-finals";
  if (teamsRemaining === 8) return "Quarter-finals";
  return `Round of ${teamsRemaining}`;
}

function onlineMemberOwnsMatch(tournament, memberId, match) {
  return Boolean(match && memberId && [match.homeTeamId, match.awayTeamId]
    .some((teamId) => tournament?.teamOwnerById?.[teamId] === memberId));
}

function onlineMatchStillPlaying(match) {
  if (!match?.awayTeamId) return false;
  if (match.liveState) return !["waiting", "finished"].includes(match.liveState.status);
  return ["live", "penalties"].includes(match.status)
    || onlineSharedMatchState(match, onlineServerNow()).live
    || onlineMatchPlayback?.matchId === match.id;
}

function onlineResultScore(match, teamId) {
  const home = match.homeTeamId === teamId;
  const goalsFor = Number(home ? match.homeScore : match.awayScore) || 0;
  const goalsAgainst = Number(home ? match.awayScore : match.homeScore) || 0;
  const opponentId = home ? match.awayTeamId : match.homeTeamId;
  const opponent = TEAM_BY_ID.get(opponentId);
  const penalty = match.penalty;
  const penaltyCopy = penalty
    ? ` (pens ${home ? penalty.homeScore : penalty.awayScore}-${home ? penalty.awayScore : penalty.homeScore})`
    : "";
  return {
    match,
    teamId,
    opponentId,
    won: match.winnerTeamId === teamId,
    goalsFor,
    goalsAgainst,
    text: `${match.winnerTeamId === teamId ? "W" : "L"} ${goalsFor}-${goalsAgainst}${penaltyCopy} vs ${opponent?.name || "Opponent"}`,
  };
}

function onlineTeamTournamentResult(tournament, teamId) {
  const rounds = tournament.rounds || [];
  const appearances = rounds.flatMap((round) => round.matches
    .filter((match) => match.homeTeamId === teamId || match.awayTeamId === teamId)
    .map((match) => ({ round, match })));
  const played = appearances.filter(({ match }) => match.status === "complete" && match.awayTeamId);
  const scores = played.map(({ match }) => onlineResultScore(match, teamId));
  const furthestRound = Math.max(0, ...appearances.map(({ round }) => round.number));
  const champion = tournament.championTeamId === teamId;
  const reachedFinal = onlineRoundName(tournament, furthestRound || 1) === "Final";
  const finish = champion
    ? "Winners"
    : reachedFinal && tournament.status === "complete"
      ? "Runners-up"
      : onlineRoundName(tournament, furthestRound || 1);
  return {
    teamId,
    champion,
    furthestRound,
    finish,
    goalsFor: scores.reduce((total, score) => total + score.goalsFor, 0),
    goalsAgainst: scores.reduce((total, score) => total + score.goalsAgainst, 0),
    scores,
  };
}

function createOnlineResultScoreCard(score, tournament) {
  const match = score.match;
  const home = TEAM_BY_ID.get(match.homeTeamId);
  const away = TEAM_BY_ID.get(match.awayTeamId);
  const card = document.createElement("article");
  card.className = "online-result-score-card";
  const head = document.createElement("header");
  const round = document.createElement("span");
  round.textContent = onlineRoundName(tournament, match.roundNumber || 1);
  const outcome = document.createElement("b");
  outcome.textContent = score.won ? "WIN" : "LOSS";
  outcome.className = score.won ? "is-win" : "is-loss";
  head.append(round, outcome);
  const teams = document.createElement("div");
  [[home, match.homeScore, match.homeTeamId, match.penalty?.homeScore], [away, match.awayScore, match.awayTeamId, match.penalty?.awayScore]].forEach(([team, goals, teamId, penaltyScore]) => {
    const row = document.createElement("div");
    row.className = `online-result-score-team${match.winnerTeamId === teamId ? " is-winner" : ""}`;
    const flag = document.createElement("span");
    if (team) flag.innerHTML = flagMarkup(team, "online-result-score-flag");
    const name = document.createElement("strong");
    name.textContent = team?.name || "Bye";
    const value = document.createElement("b");
    value.textContent = penaltyScore === undefined ? (goals ?? "-") : `${goals ?? "-"} (${penaltyScore})`;
    row.append(flag, name, value);
    teams.append(row);
  });
  card.append(head, teams);
  const footer = document.createElement("small");
  footer.textContent = match.penalty ? "Decided on penalties" : "Full time";
  card.append(footer);
  return card;
}

function createOnlineBracketMatch(match) {
  const card = document.createElement("article");
  card.className = "online-bracket-match";
  [[match.homeTeamId, match.homeScore, match.penalty?.homeScore], [match.awayTeamId, match.awayScore, match.penalty?.awayScore]].forEach(([teamId, score, penaltyScore]) => {
    const team = TEAM_BY_ID.get(teamId);
    const row = document.createElement("div");
    row.className = match.winnerTeamId === teamId ? "is-winner" : "";
    const flag = document.createElement("span");
    if (team) flag.innerHTML = flagMarkup(team, "online-bracket-flag");
    const name = document.createElement("strong");
    name.textContent = team?.name || "Bye";
    const value = document.createElement("b");
    value.textContent = penaltyScore === undefined ? (score ?? "-") : `${score ?? "-"} (${penaltyScore})`;
    row.append(flag, name, value);
    card.append(row);
  });
  return card;
}

function setOnlineResultsTab(tabName) {
  const selected = ["standings", "results", "bracket"].includes(tabName) ? tabName : "standings";
  onlineResultsActiveTab = selected;
  els.onlineResults.querySelectorAll("[data-online-results-tab]").forEach((button) => {
    const active = button.dataset.onlineResultsTab === selected;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.onlineResults.querySelectorAll("[data-online-results-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.onlineResultsPanel !== selected;
  });
}

function renderOnlineOpeningBracket(tournament) {
  const finalSelected = onlineResultsOpeningRound === "final";
  const selectedRound = (tournament.rounds || []).find((round) => round.number === onlineResultsOpeningRound)
    || tournament.rounds?.[0];
  els.onlineBracketRoundTabs.querySelectorAll("[data-online-bracket-round]").forEach((button) => {
    const buttonRound = button.dataset.onlineBracketRound;
    const active = finalSelected ? buttonRound === "final" : Number(buttonRound) === selectedRound?.number;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.onlineOpeningBracket.hidden = finalSelected;
  els.onlineResultsBracket.hidden = !finalSelected;
  if (finalSelected) return;
  els.onlineOpeningBracket.replaceChildren(...(selectedRound?.matches || []).map(createOnlineBracketMatch));
}

function setOnlineBracketOpeningRound(roundNumber) {
  const nextRound = roundNumber === "final" ? "final" : Number(roundNumber);
  if (nextRound !== "final" && ![1, 2, 3].includes(nextRound)) return;
  onlineResultsOpeningRound = nextRound;
  if (latestOnlineRoom?.tournament) renderOnlineOpeningBracket(latestOnlineRoom.tournament);
}

function renderOnlineResults(room, memberId) {
  latestOnlineRoom = room;
  stopOnlineLivePresentation();
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineResults.hidden = false;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Tournament results";

  const tournament = room.tournament;
  const champion = TEAM_BY_ID.get(tournament.championTeamId);
  const championOwnerId = tournament.teamOwnerById?.[tournament.championTeamId];
  const championOwner = room.members.find((member) => member.id === championOwnerId);
  maybeShowPostWinDonation(
    `online:${room.code}:${tournament.completedAt || "complete"}:${tournament.championTeamId || "champion"}`,
  );
  els.onlineResultsSummary.textContent = tournament.completionReason === "all-players-eliminated"
    ? "Every player-controlled country was eliminated. Here is how the lobby finished."
    : championOwner
    ? `${champion?.name || "The champion"} won the tournament for ${championOwner.name}.`
    : `${champion?.name || "The champion"} won the tournament. None of the players' teams won.`;

  const standings = room.members.filter((member) => !member.isCpu).map((member) => {
    const teams = Object.entries(tournament.teamOwnerById || {})
      .filter(([, ownerId]) => ownerId === member.id)
      .map(([teamId]) => onlineTeamTournamentResult(tournament, teamId));
    const furthestRound = Math.max(0, ...teams.map((team) => team.furthestRound));
    return {
      member,
      teams,
      furthestRound,
      champion: teams.some((team) => team.champion),
      goalsFor: teams.reduce((total, team) => total + team.goalsFor, 0),
      goalsAgainst: teams.reduce((total, team) => total + team.goalsAgainst, 0),
      played: teams.reduce((total, team) => total + team.scores.length, 0),
      wins: teams.reduce((total, team) => total + team.scores.filter((score) => score.won).length, 0),
    };
  }).map((entry) => ({ ...entry, points: entry.wins * 3 }))
    .toSorted((left, right) => (
    right.points - left.points
    || Number(right.champion) - Number(left.champion)
    || right.furthestRound - left.furthestRound
    || (right.goalsFor - right.goalsAgainst) - (left.goalsFor - left.goalsAgainst)
    || right.goalsFor - left.goalsFor
  ));

  const championEntries = standings.filter((entry) => entry.champion);
  const furthestRound = Math.max(0, ...standings.map((entry) => entry.furthestRound));
  const leaders = championEntries.length
    ? championEntries
    : standings.filter((entry) => entry.furthestRound === furthestRound);
  els.onlineResultsLeaders.replaceChildren();
  if (leaders.length) {
    const label = document.createElement("span");
    label.textContent = leaders.length > 1 ? "Winners" : "Winner";
    const value = document.createElement("strong");
    value.textContent = leaders.map((entry) => entry.member.name).join(" & ");
    els.onlineResultsLeaders.append(label, value);
  }

  els.onlineResultsTable.replaceChildren(...standings.map((entry, index) => {
    const row = document.createElement("tr");
    const values = [
      index + 1,
      entry.member.id === memberId ? `${entry.member.name} (You)` : entry.member.name,
      entry.played,
      entry.wins,
      entry.played - entry.wins,
      entry.goalsFor,
      entry.goalsAgainst,
      entry.goalsFor - entry.goalsAgainst,
      entry.points,
    ];
    values.forEach((value, cellIndex) => {
      const cell = document.createElement("td");
      cell.textContent = cellIndex === 7 && Number(value) > 0 ? `+${value}` : value;
      if (cellIndex === 1) cell.className = "is-player";
      if (cellIndex === 8) cell.className = "is-points";
      row.append(cell);
    });
    return row;
  }));

  els.onlineResultsPlayers.replaceChildren(...standings.map((entry, index) => {
    const section = document.createElement("section");
    section.className = "online-result-player";
    const head = document.createElement("header");
    const rank = document.createElement("span");
    rank.textContent = String(index + 1).padStart(2, "0");
    const title = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = entry.member.id === memberId ? `${entry.member.name} (You)` : entry.member.name;
    const summary = document.createElement("small");
    summary.textContent = `${entry.goalsFor} goals scored | ${entry.goalsAgainst} conceded`;
    title.append(name, summary);
    const furthest = document.createElement("b");
    furthest.textContent = entry.champion ? "Winner" : onlineRoundName(tournament, entry.furthestRound || 1);
    head.append(rank, title, furthest);

    const teamList = document.createElement("div");
    teamList.className = "online-result-team-list";
    entry.teams.forEach((result) => {
      const team = TEAM_BY_ID.get(result.teamId);
      const row = document.createElement("article");
      row.className = "online-result-team";
      const identity = document.createElement("div");
      const flag = document.createElement("span");
      if (team) flag.innerHTML = flagMarkup(team, "online-result-flag");
      const teamCopy = document.createElement("span");
      const teamName = document.createElement("strong");
      teamName.textContent = team?.name || result.teamId;
      const finish = document.createElement("small");
      finish.textContent = `${result.finish} | ${result.goalsFor} goals`;
      teamCopy.append(teamName, finish);
      identity.append(flag, teamCopy);
      const scoreList = document.createElement("div");
      scoreList.className = "online-result-score-list";
      if (result.scores.length) result.scores.forEach((score) => scoreList.append(createOnlineResultScoreCard(score, tournament)));
      else {
        const bye = document.createElement("span");
        bye.className = "online-result-bye";
        bye.textContent = "No match played";
        scoreList.append(bye);
      }
      row.append(identity, scoreList);
      teamList.append(row);
    });
    section.append(head, teamList);
    return section;
  }));

  renderOnlineOpeningBracket(tournament);
  els.onlineResultsBracket.replaceChildren(...(tournament.rounds || []).filter((round) => round.number >= 4).map((round) => {
    const column = document.createElement("section");
    column.className = "online-bracket-round";
    const title = document.createElement("h3");
    title.textContent = onlineRoundName(tournament, round.number);
    const matches = document.createElement("div");
    matches.replaceChildren(...round.matches.map(createOnlineBracketMatch));
    column.append(title, matches);
    return column;
  }));

  setOnlineResultsTab(onlineResultsActiveTab);

  const isHost = Boolean(onlineRoomSession?.isHost);
  els.onlinePlayAgainButton.hidden = !isHost;
  els.onlineEndLobbyButton.textContent = isHost ? "End lobby" : "Leave lobby";
  els.onlineResultsWaiting.hidden = isHost;
}

function updateOnlineSpectatorMode(room, memberId, surviving) {
  const tournament = room.tournament;
  const ownedTeamIds = Object.entries(tournament?.teamOwnerById || {})
    .filter(([, ownerId]) => ownerId === memberId)
    .map(([teamId]) => teamId);
  const eliminated = tournament?.status === "active"
    && ownedTeamIds.length > 0
    && ownedTeamIds.every((teamId) => !surviving.has(teamId));
  const candidates = eliminated
    ? (room.members || []).filter((member) => (
      !member.isCpu
      && member.id !== memberId
      && Object.entries(tournament.teamOwnerById || {}).some(([teamId, ownerId]) => ownerId === member.id && surviving.has(teamId))
    ))
    : [];
  els.onlineSpectatorPicker.hidden = !candidates.length;
  if (!candidates.length) {
    onlineSpectatingMemberId = null;
    els.onlineSpectatorSelect.replaceChildren();
    return null;
  }
  if (!candidates.some((member) => member.id === onlineSpectatingMemberId)) {
    onlineSpectatingMemberId = candidates[0].id;
    onlineViewedMatchId = null;
    onlineMatchSelectionManual = false;
  }
  els.onlineSpectatorSelect.replaceChildren(...candidates.map((member) => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = member.name;
    option.selected = member.id === onlineSpectatingMemberId;
    return option;
  }));
  return onlineSpectatingMemberId;
}

function queueOnlineViewedMatchSync(matchId) {
  if (!matchId || onlineSpectatingMemberId || matchId === onlineLastSyncedViewedMatchId || !onlineRoomSession) return;
  clearTimeout(onlineViewedMatchSyncTimer);
  onlineViewedMatchSyncTimer = setTimeout(async () => {
    if (!onlineRoomSession || onlineSpectatingMemberId || matchId === onlineLastSyncedViewedMatchId) return;
    try {
      await roomApi(`/api/rooms/${onlineRoomSession.code}/match-view`, { method: "POST", body: { matchId } });
      onlineLastSyncedViewedMatchId = matchId;
    } catch {
      // Viewing remains usable locally if presence syncing is briefly unavailable.
    }
  }, 180);
}

function renderOnlineMatches(room, memberId) {
  restoreOnlineMatchHistory(room.code);
  const previousViewedMatchId = onlineViewedMatchId;
  const previousRoom = latestOnlineRoom;
  latestOnlineRoom = room;
  notifyOnlineReadyWaiting(room, memberId);
  if (onlinePenaltyTester) {
    renderOnlinePenaltyTester();
    return;
  }
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineResults.hidden = true;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Online knockout";
  stopOnlineDraftRun();
  els.onlineMatches.hidden = false;
  els.onlineMatches.classList.remove("is-penalty-tester");

  const tournament = room.tournament;
  const latestRound = tournament?.rounds?.at(-1);
  if (!onlineDisplayedRoundNumber || !tournament?.rounds?.some((round) => round.number === onlineDisplayedRoundNumber)) {
    onlineDisplayedRoundNumber = latestRound?.number || 1;
  }
  const currentRound = tournament?.rounds?.find((round) => round.number === onlineDisplayedRoundNumber) || latestRound;
  els.onlinePenaltyTesterButton.hidden = true;
  els.onlinePenaltyTesterButton.textContent = "Test shootout";
  const isComplete = tournament?.status === "complete" && currentRound?.number === latestRound?.number;
  const surviving = new Set(tournament?.survivingTeamIds || []);
  const spectatedMemberId = updateOnlineSpectatorMode(room, memberId, surviving);
  const displayMemberId = spectatedMemberId || memberId;
  const ownedTeamIds = Object.entries(tournament?.teamOwnerById || {})
    .filter(([, ownerId]) => ownerId === displayMemberId)
    .map(([teamId]) => teamId);
  const ownedTeamIdSet = new Set(ownedTeamIds);
  const controlledTeamIdSet = new Set(Object.entries(tournament?.teamOwnerById || {})
    .filter(([, ownerId]) => ownerId === memberId)
    .map(([teamId]) => teamId));
  const ownedMatches = currentRound?.matches.filter((match) => (
    ownedTeamIdSet.has(match.homeTeamId) || ownedTeamIdSet.has(match.awayTeamId)
  )) || [];
  const allMatches = tournament?.rounds?.flatMap((round) => round.matches) || [];
  const previousMatches = new Map((previousRoom?.tournament?.rounds || []).flatMap((round) => round.matches).map((match) => [match.id, match]));
  const newlyResolvedControlledMatch = allMatches.find((match) => {
    const previous = previousMatches.get(match.id);
    const sharedPlaybackActive = match.playback?.controllerMemberIds?.length === 2
      && (match.playback.positionMs || 0) < ONLINE_SHARED_PLAYBACK_MS;
    return ["complete", "penalties"].includes(match.status)
      && (ownedTeamIdSet.has(match.homeTeamId) || ownedTeamIdSet.has(match.awayTeamId))
      && !onlinePlayedMatchIds.has(match.id)
      && (previous?.status === "waiting" || (!previous && sharedPlaybackActive));
  });
  const penaltyMatch = ownedMatches.find((match) => (
    !spectatedMemberId
    && match.status === "penalties"
    && tournament?.teamOwnerById?.[match.penalty?.currentTeamId] === memberId
  ));
  const nextOwnedMatch = penaltyMatch
    || ownedMatches.find((match) => match.status === "live")
    || ownedMatches.find((match) => match.status === "waiting")
    || ownedMatches[0]
    || null;
  const unfinishedOwnedMatch = !spectatedMemberId
    ? ownedMatches.find((match) => onlineMatchStillPlaying(match)) || null
    : null;
  const spectatedMember = room.members?.find((member) => member.id === spectatedMemberId);
  const syncedSpectatedMatch = spectatedMember?.viewedMatchId
    ? allMatches.find((match) => match.id === spectatedMember.viewedMatchId)
    : null;
  if (unfinishedOwnedMatch && onlineViewedMatchId && !ownedMatches.some((match) => match.id === onlineViewedMatchId)) {
    onlineViewedMatchId = nextOwnedMatch?.id || unfinishedOwnedMatch.id;
    onlineMatchSelectionManual = false;
  } else if (spectatedMemberId && syncedSpectatedMatch) {
    onlineViewedMatchId = syncedSpectatedMatch.id;
  } else if (spectatedMemberId && (!onlineViewedMatchId || !ownedMatches.some((match) => match.id === onlineViewedMatchId))) {
    onlineViewedMatchId = nextOwnedMatch?.id || null;
  } else if (penaltyMatch) {
    onlineViewedMatchId = penaltyMatch.id;
  } else if (newlyResolvedControlledMatch) {
    onlineViewedMatchId = newlyResolvedControlledMatch.id;
  } else if (!onlineMatchSelectionManual && !onlineViewedMatchId && nextOwnedMatch) {
    onlineViewedMatchId = nextOwnedMatch.id;
  } else if (!onlineViewedMatchId || !allMatches.some((match) => match.id === onlineViewedMatchId)) {
    onlineViewedMatchId = nextOwnedMatch?.id || allMatches[0]?.id || null;
  }
  if (previousViewedMatchId !== onlineViewedMatchId) {
    if (onlineMatchPlayback?.matchId !== onlineViewedMatchId) stopOnlineMatchPlayback();
    if (onlineLivePresentation?.matchId !== onlineViewedMatchId) stopOnlineLivePresentation();
  }
  const viewedMatch = allMatches.find((match) => match.id === onlineViewedMatchId) || nextOwnedMatch || null;
  const controlledMatch = !spectatedMemberId && viewedMatch
    && (controlledTeamIdSet.has(viewedMatch.homeTeamId) || controlledTeamIdSet.has(viewedMatch.awayTeamId))
    ? viewedMatch
    : null;
  if (!spectatedMemberId) queueOnlineViewedMatchSync(onlineViewedMatchId);

  els.onlineMatchRound.textContent = isComplete ? "Tournament complete" : onlineRoundName(tournament, currentRound?.number || 1);
  els.onlineMatchStatus.hidden = true;
  renderOnlineCountries(ownedTeamIds, surviving, currentRound, tournament?.championTeamId, tournament?.rounds || []);
  const presentationMatch = spectatedMemberId ? viewedMatch : controlledMatch;
  const matchPresentationFinished = Boolean(
    presentationMatch?.liveState?.status === "finished"
    || presentationMatch?.status === "complete"
  );
  const showTactics = Boolean(presentationMatch?.awayTeamId && !matchPresentationFinished);
  const tacticsEditable = !spectatedMemberId && Boolean(
    controlledMatch?.status === "waiting"
    || controlledMatch?.status === "live"
    || controlledMatch?.liveState?.status === "penalties"
    || onlineMatchPlayback?.matchId === controlledMatch?.id
  );
  renderOnlineTactics(tournament, displayMemberId, showTactics, presentationMatch, tacticsEditable);
  if (onlineMatchPlayback?.matchId === viewedMatch?.id) syncOnlinePlaybackFromMatch(viewedMatch);
  renderOnlineCurrentMatch(room, memberId, viewedMatch, controlledMatch, displayMemberId);
  const startsPlaybackNow = !spectatedMemberId && newlyResolvedControlledMatch && newlyResolvedControlledMatch.simulationVersion !== 2;
  if (!startsPlaybackNow) {
    renderOnlineRoundMatches(tournament?.rounds || [], tournament, displayMemberId, room.members, Boolean(unfinishedOwnedMatch));
  }
  if (startsPlaybackNow) {
    startOnlineMatchPlayback(newlyResolvedControlledMatch);
    setTimeout(() => {
      if (!latestOnlineRoom || els.onlineRoomScreen.hidden || onlineMatchPlayback?.matchId !== newlyResolvedControlledMatch.id) return;
      renderOnlineRoundMatches(
        latestOnlineRoom.tournament?.rounds || [],
        latestOnlineRoom.tournament,
        onlineRoomSession.memberId,
        latestOnlineRoom.members,
      );
    }, 500);
  }
  updateOnlineRoundNextButton(currentRound, tournament, memberId);
  if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();

  els.closeOnlineMatchRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineMatchRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
}

function notifyOnlineReadyWaiting(room, memberId) {
  const activeNotifications = new Set();
  const memberById = new Map((room.members || []).map((member) => [member.id, member]));
  const matches = room.tournament?.rounds?.at(-1)?.matches || [];
  matches.forEach((match) => {
    if (match.status !== "waiting" || !match.requiredMemberIds?.includes(memberId)) return;
    const readyIds = new Set(match.readyMemberIds || []);
    if (readyIds.has(memberId)) return;
    match.requiredMemberIds.forEach((readyMemberId) => {
      const readyMember = memberById.get(readyMemberId);
      if (readyMemberId === memberId || !readyIds.has(readyMemberId) || !readyMember || readyMember.isCpu) return;
      const notificationKey = `${match.id}:${readyMemberId}`;
      activeNotifications.add(notificationKey);
      if (onlineReadyWaitingNotifications.has(notificationKey)) return;
      onlineReadyWaitingNotifications.add(notificationKey);
      showToast(`${readyMember.name} is waiting for the match`, 5000);
    });
  });
  [...onlineReadyWaitingNotifications].forEach((key) => {
    if (!activeNotifications.has(key)) onlineReadyWaitingNotifications.delete(key);
  });
}

function renderOnlinePenaltyTester() {
  const france = TEAMS.find((team) => team.name === "France");
  const spain = TEAMS.find((team) => team.name === "Spain");
  if (!france || !spain || !onlinePenaltyTester) return;
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineScreenHeading.hidden = true;
  els.onlineMatches.hidden = false;
  els.onlineMatches.classList.add("is-penalty-tester");
  els.onlineMatchRound.textContent = "Penalty shootout tester";
  els.onlineMatchStatus.hidden = true;
  els.onlinePenaltyTesterButton.hidden = false;
  els.onlinePenaltyTesterButton.textContent = "Exit tester";
  els.onlineRoundNextButton.hidden = true;
  els.onlineActiveTeam.replaceChildren();
  els.onlineTactics.hidden = true;
  els.onlineCurrentMatch.classList.add("tactics-hidden");
  els.onlineCurrentMatch.hidden = false;
  els.onlineCurrentMatch.classList.add("is-penalty-tester");
  els.onlineCardRound.textContent = "FRANCE VS SPAIN";
  els.onlineCardMatchNumber.textContent = "SHOOTOUT TEST";
  els.onlineMatchHome.innerHTML = onlineMatchTeamMarkup(france.id, true);
  els.onlineMatchAway.innerHTML = onlineMatchTeamMarkup(spain.id);
  els.onlineMatchScore.textContent = "0–0";
  els.onlineMatchPenaltyScore.hidden = false;
  els.onlineMatchPenaltyScore.textContent = `PENS ${onlinePenaltyTester.homeScore}–${onlinePenaltyTester.awayScore}`;
  els.onlineMatchMinute.textContent = "PENALTIES";
  els.onlineMatchClock.textContent = "90:00";
  els.onlineMatchPhase.textContent = "PENALTY SHOOTOUT";
  els.onlineLiveLabel.hidden = true;
  els.onlinePauseMatchButton.hidden = true;
  els.onlineMatchSpeedButton.hidden = true;
  els.onlinePauseCountdown.hidden = true;
  els.onlineHomeScorers.replaceChildren();
  els.onlineAwayScorers.replaceChildren();
  renderOnlinePenaltyMarkResults(onlinePenaltyTester.homeResults, onlinePenaltyTester.awayResults);
  els.onlineMatchEvents.replaceChildren();
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = false;
  els.onlinePenaltyControl.classList.toggle("is-cpu-taking", onlinePenaltyTester.currentTeam === "away");
  els.onlinePenaltyPrompt.textContent = onlinePenaltyTester.complete
    ? `${onlinePenaltyTester.homeScore > onlinePenaltyTester.awayScore ? "France" : "Spain"} win`
    : `${onlinePenaltyTester.currentTeam === "home" ? "France" : "Spain"} to take`;
  els.onlinePenaltyFeedback.textContent = onlinePenaltyTester.complete
    ? "Exit and reopen the tester to start again."
    : onlinePenaltyTester.currentTeam === "home"
      ? "Choose one of the five targets"
      : "Spain are taking their penalty automatically";
  els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => {
    button.disabled = onlinePenaltyTester.complete
      || onlinePenaltyTester.currentTeam !== "home"
      || Boolean(onlinePenaltyAnimation);
  });
  els.onlineMyMatches.replaceChildren();
  els.onlineRoundMatches.replaceChildren();
}

function startOnlinePenaltyTester() {
  onlinePenaltyTester = {
    homeScore: 0,
    awayScore: 0,
    homeKicks: 0,
    awayKicks: 0,
    currentTeam: "home",
    complete: false,
    homeResults: [],
    awayResults: [],
  };
  stopOnlineRoomPolling();
  stopOnlineMatchPlayback();
  setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
  els.onlinePenaltyScene.dataset.target = "middle";
  renderOnlinePenaltyTester();
}

async function takeOnlineTesterPenalty(target, automatic = false) {
  if (!onlinePenaltyTester || onlinePenaltyTester.complete || onlinePenaltyAnimation) return;
  if (onlinePenaltyTester.currentTeam !== "home" && !automatic) return;
  const targets = ["top-left", "top-right", "middle", "bottom-left", "bottom-right"];
  const goalkeeperTarget = targets[Math.floor(Math.random() * targets.length)];
  const scored = target === "middle" || (goalkeeperTarget !== target && Math.random() < 0.88);
  const takingSide = onlinePenaltyTester.currentTeam;
  onlinePenaltyAnimation = { matchId: "penalty-tester", target };
  els.onlinePenaltyScene.dataset.target = target;
  els.onlinePenaltyPrompt.textContent = `${takingSide === "home" ? "France" : "Spain"} take`;
  els.onlinePenaltyFeedback.textContent = "The goalkeeper waits…";
  els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
  const shotDirection = onlinePenaltyDirection(target);
  const keeperDirection = onlinePenaltyDirection(goalkeeperTarget);
  const attempt = {
    direction: shotDirection,
    keeperDive: scored ? distinctKeeperDiveForGoal(shotDirection, keeperDirection) : keeperDirection,
    foot: "right",
    scored,
    missType: scored ? null : "save",
  };
  setPenaltySceneElement(els.onlinePenaltyScene, attempt, "setup");
  await waitForOnlinePenaltyFrame(80);
  setPenaltySceneElement(els.onlinePenaltyScene, attempt, "flight");
  await waitForOnlinePenaltyFrame(560);
  setPenaltySceneElement(els.onlinePenaltyScene, attempt, "result");
  if (takingSide === "home") {
    onlinePenaltyTester.homeKicks += 1;
    onlinePenaltyTester.homeResults.push(scored);
    if (scored) onlinePenaltyTester.homeScore += 1;
  } else {
    onlinePenaltyTester.awayKicks += 1;
    onlinePenaltyTester.awayResults.push(scored);
    if (scored) onlinePenaltyTester.awayScore += 1;
  }
  const equalKicks = onlinePenaltyTester.homeKicks === onlinePenaltyTester.awayKicks;
  onlinePenaltyTester.complete = equalKicks
    && onlinePenaltyTester.homeKicks >= 5
    && onlinePenaltyTester.homeScore !== onlinePenaltyTester.awayScore;
  onlinePenaltyTester.currentTeam = takingSide === "home" ? "away" : "home";
  els.onlineMatchPenaltyScore.textContent = `PENS ${onlinePenaltyTester.homeScore}–${onlinePenaltyTester.awayScore}`;
  els.onlinePenaltyPrompt.textContent = scored ? "Goal" : "Saved";
  els.onlinePenaltyFeedback.textContent = scored ? "Perfectly placed." : "The goalkeeper got there.";
  await waitForOnlinePenaltyFrame(1400);
  onlinePenaltyAnimation = null;
  if (!onlinePenaltyTester) return;
  setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
  els.onlinePenaltyScene.dataset.target = "middle";
  renderOnlinePenaltyTester();
  if (!onlinePenaltyTester.complete && onlinePenaltyTester.currentTeam === "away") {
    await waitForOnlinePenaltyFrame(520);
    if (!onlinePenaltyTester || onlinePenaltyTester.currentTeam !== "away" || onlinePenaltyAnimation) return;
    const cpuTarget = targets[Math.floor(Math.random() * targets.length)];
    takeOnlineTesterPenalty(cpuTarget, true);
  }
}

function onlineSharedMatchState(match, now = Date.now()) {
  if (match.liveState?.simulationVersion === 2) {
    const live = match.liveState;
    return {
      homeScore: live.status === "waiting" ? "–" : live.homeScore,
      awayScore: live.status === "waiting" ? "–" : live.awayScore,
      penaltyText: live.penalty ? `PENS ${live.penalty.homeScore}–${live.penalty.awayScore}` : "",
      label: live.status === "finished" ? "FULL TIME" : live.status === "penalties" ? "SHOOTOUT" : `${Math.max(1, Math.floor(live.minute))}'`,
      minute: live.minute,
      live: !["waiting", "finished"].includes(live.status),
    };
  }
  if (match.status === "waiting") {
    return { homeScore: "–", awayScore: "–", label: match.readyMemberIds?.length ? "WAITING" : "NOT STARTED", minute: 0, live: false };
  }
  if (match.status === "complete" && onlineFinishedPlaybackIds.has(match.id)) {
    return {
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      penaltyText: match.penalty ? `PENS ${match.penalty.homeScore ?? 0}–${match.penalty.awayScore ?? 0}` : "",
      label: "FULL TIME",
      minute: 90,
      live: false,
    };
  }
  const usesSharedClock = match.playback?.controllerMemberIds?.length === 2;
  const playbackUpdatedAt = Number(match.playback?.updatedAt) || now;
  const playbackPausedUntil = Number(match.playback?.pausedUntil) || 0;
  const playbackActiveStart = playbackPausedUntil > playbackUpdatedAt
    ? Math.max(playbackUpdatedAt, playbackPausedUntil)
    : playbackUpdatedAt;
  const projectedPlaybackMs = Math.min(
    ONLINE_SHARED_PLAYBACK_MS,
    Math.max(0, Number(match.playback?.positionMs) || 0)
      + Math.max(0, now - playbackActiveStart) * (match.playback?.effectiveSpeed || 1),
  );
  const elapsed = usesSharedClock ? projectedPlaybackMs : Math.max(0, now - (match.completedAt || 0));
  const minute = Math.min(90, (elapsed / ONLINE_SHARED_PLAYBACK_MS) * 90);
  const event = (match.events || []).filter((item) => item.minute <= minute).at(-1);
  const finished = elapsed >= ONLINE_SHARED_PLAYBACK_MS;
  if (match.penalty && (!usesSharedClock || finished)) {
    return {
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      penaltyText: "",
      label: match.status === "penalties" ? "SHOOTOUT" : "FULL TIME",
      minute: 90,
      live: match.status === "penalties",
    };
  }
  return {
    homeScore: finished ? match.homeScore ?? 0 : event?.homeScore ?? 0,
    awayScore: finished ? match.awayScore ?? 0 : event?.awayScore ?? 0,
    label: finished ? "FULL TIME" : `${Math.max(1, Math.floor(minute))}'`,
    minute,
    live: !finished,
  };
}

function onlineRoundIsVisuallyComplete(round) {
  const now = Date.now();
  return Boolean(round?.matches?.every((match) => (
    match.status === "complete"
    && (!match.awayTeamId || !onlineSharedMatchState(match, now).live)
  )));
}

function updateOnlineRoundNextButton(round, tournament, memberId) {
  const ownedMatches = round?.matches?.filter((match) => (
    tournament?.teamOwnerById?.[match.homeTeamId] === memberId
    || tournament?.teamOwnerById?.[match.awayTeamId] === memberId
  )) || [];
  const ownPlaybackFinished = ownedMatches.every((match) => (
    !match.awayTeamId
    || (
      match.status === "complete"
      && !onlineSharedMatchState(match).live
      && onlineMatchPlayback?.matchId !== match.id
    )
  ));
  const nextRoundReady = (tournament?.roundNumber || 0) > (round?.number || 0);
  const roundVisuallyComplete = onlineRoundIsVisuallyComplete(round);
  const canAdvance = !onlineMatchPlayback
    && ownPlaybackFinished
    && nextRoundReady
    && roundVisuallyComplete;
  els.onlineRoundNextButton.hidden = !round || tournament?.status === "complete";
  els.onlineRoundNextButton.disabled = !canAdvance;
  els.onlineRoundNextButton.classList.toggle("is-disabled", !canAdvance);
  els.onlineRoundNextButton.title = canAdvance
    ? "Go to the next round"
    : "Finish every match in this round first";
}

function advanceOnlineToAvailableRound() {
  const roundNumber = latestOnlineRoom?.tournament?.roundNumber;
  if (!roundNumber) return;
  stopOnlineMatchPlayback();
  onlineAdvanceQueuedRoundNumber = null;
  onlineDisplayedRoundNumber = roundNumber;
  onlineViewedMatchId = null;
  onlineMatchSelectionManual = false;
  renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderOnlineCountries(teamIds, surviving, currentRound, championTeamId, rounds = []) {
  els.onlineActiveTeam.replaceChildren();
  teamIds.forEach((teamId) => {
    const team = TEAM_BY_ID.get(teamId);
    if (!team) return;
    const match = currentRound?.matches.find((item) => item.homeTeamId === teamId || item.awayTeamId === teamId);
    const latestCompletedMatch = rounds
      .flatMap((round) => round.matches || [])
      .filter((item) => item.status === "complete" && (item.homeTeamId === teamId || item.awayTeamId === teamId))
      .at(-1);
    const completedResultVisible = Boolean(
      latestCompletedMatch
      && onlineMatchPlayback?.matchId !== latestCompletedMatch.id
      && (
        onlineFinishedPlaybackIds.has(latestCompletedMatch.id)
        || latestCompletedMatch.liveState?.status === "finished"
      )
    );
    const revealedLoss = completedResultVisible && latestCompletedMatch.winnerTeamId !== teamId;
    const resultVisible = !match?.awayTeamId || onlineFinishedPlaybackIds.has(match?.id);
    const eliminated = revealedLoss || (resultVisible && !surviving.has(teamId));
    const champion = resultVisible && championTeamId === teamId;
    const card = document.createElement("div");
    card.className = "online-owned-country";
    card.classList.toggle("is-eliminated", eliminated);
    card.classList.toggle("is-champion", champion);
    const status = champion
      ? "Champion"
      : eliminated
        ? "Eliminated"
        : !match?.awayTeamId
          ? "Through on a bye"
          : !resultVisible || match.status === "waiting"
            ? ""
            : match.status === "penalties"
              ? "Penalty shootout"
              : "Still in";
    card.innerHTML = `${flagMarkup(team, "online-owned-flag")}<span><strong>${team.name}</strong>${status ? `<small>${status}</small>` : ""}</span>`;
    els.onlineActiveTeam.append(card);
  });
}

function renderOnlineTactics(tournament, memberId, visible, match = null, editable = false) {
  els.onlineTactics.hidden = !visible;
  els.onlineCurrentMatch?.classList.toggle("tactics-hidden", !visible);
  if (!visible) return;
  const teamId = [match?.homeTeamId, match?.awayTeamId].find((id) => tournament?.teamOwnerById?.[id] === memberId);
  const tacticId = tournament?.tacticsByTeam?.[teamId] || "balanced";
  const index = Math.max(0, ONLINE_TACTIC_OPTIONS.findIndex((option) => option.id === tacticId));
  if (document.activeElement !== els.onlineTacticSlider) els.onlineTacticSlider.value = String(index);
  els.onlineTacticSlider.dataset.teamId = teamId || "";
  els.onlineTacticSlider.disabled = onlineRoomBusy || !editable;
  els.onlineTacticName.textContent = ONLINE_TACTIC_OPTIONS[index].name;
  const opponentTeamId = match
    ? [match.homeTeamId, match.awayTeamId].find((id) => id && id !== teamId)
    : null;
  const opponentTacticId = tournament?.tacticsByTeam?.[opponentTeamId] || "balanced";
  const opponentTactic = ONLINE_TACTIC_OPTIONS.find((option) => option.id === opponentTacticId);
  els.onlineTacticCopy.textContent = `Opponent: ${opponentTactic?.name || "--"}`;
  els.onlineTacticButtons.dataset.teamId = teamId || "";
  els.onlineTacticButtons.querySelectorAll("[data-online-tactic]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.onlineTactic === tacticId);
    button.disabled = onlineRoomBusy || !editable;
  });
}

function onlineMatchTeamMarkup(teamId, isMine = false) {
  const team = TEAM_BY_ID.get(teamId);
  if (!team) return `<span class="online-match-bye">Bye</span>`;
  const nameClasses = [
    isMine ? "is-mine" : "",
    team.name.length >= 22 ? "is-very-long-name" : team.name.length >= 15 ? "is-long-name" : "",
  ].filter(Boolean).join(" ");
  return `${flagMarkup(team, "online-match-flag")}<strong${nameClasses ? ` class="${nameClasses}"` : ""}>${team.name}</strong>`;
}

function onlineReadyWaitingLabel(match) {
  const requiredMembers = match?.requiredMemberIds || [];
  const readyMembers = new Set(match?.readyMemberIds || []);
  if (!requiredMembers.every((memberId) => readyMembers.has(memberId))) return "Waiting for opponent";
  if (Number.isInteger(match?.queuePosition) && match.queuePosition > 0) return "Waiting for match slot";
  return "Starting match…";
}

function renderOnlineCurrentMatchLegacy(room, memberId, match, isComplete) {
  els.onlineCurrentMatch.hidden = !match || isComplete;
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = true;
  if (!match || isComplete) return;
  els.onlineMatchHome.innerHTML = onlineMatchTeamMarkup(match.homeTeamId, room.tournament?.teamOwnerById?.[match.homeTeamId] === memberId);
  els.onlineMatchAway.innerHTML = onlineMatchTeamMarkup(match.awayTeamId, room.tournament?.teamOwnerById?.[match.awayTeamId] === memberId);
  els.onlineMatchScore.textContent = match.homeScore === null
    ? "–"
    : match.penalty
      ? `${match.homeScore}–${match.awayScore} (${match.penalty.homeScore}–${match.penalty.awayScore})`
      : `${match.homeScore}–${match.awayScore}`;

  if (match.status === "waiting" && match.requiredMemberIds.includes(memberId)) {
    const readyMembers = new Set(match.readyMemberIds);
    const requiredNames = match.requiredMemberIds.map((id) => room.members.find((member) => member.id === id)?.name || "Player");
    const isReady = readyMembers.has(memberId);
    els.onlineReadyPanel.hidden = false;
    els.onlineReadyTitle.textContent = isReady ? "You are ready" : "Ready to play?";
    els.onlineReadyCopy.textContent = match.requiredMemberIds.length > 1
      ? `${requiredNames.join(" and ")} must both be ready before kickoff.`
      : "Kickoff starts as soon as you are ready.";
    els.onlineReadyButton.textContent = isReady ? "Ready ✓" : "Ready";
    els.onlineReadyButton.disabled = onlineRoomBusy || isReady;
    els.onlineReadyButton.dataset.matchId = match.id;
  } else if (match.status === "penalties") {
    const myTurn = room.tournament.activeTeamByMember[memberId] === match.penalty?.currentTeamId;
    els.onlinePenaltyControl.hidden = !myTurn;
    els.onlineReadyPanel.hidden = myTurn;
    if (!myTurn) {
      els.onlineReadyPanel.hidden = false;
      els.onlineReadyTitle.textContent = "Penalty shootout";
      els.onlineReadyCopy.textContent = "Waiting for the current taker to choose a target.";
      els.onlineReadyButton.hidden = true;
    }
  }
  if (match.status !== "penalties") els.onlineReadyButton.hidden = false;
}

function renderOnlineRoundMatchesLegacy(matches) {
  els.onlineRoundMatches.replaceChildren(...matches.map((match) => {
    const row = document.createElement("div");
    row.className = "online-round-match";
    const home = TEAM_BY_ID.get(match.homeTeamId);
    const away = TEAM_BY_ID.get(match.awayTeamId);
    const names = document.createElement("span");
    names.textContent = `${home?.name || "Bye"}  vs  ${away?.name || "Bye"}`;
    const score = document.createElement("strong");
    score.textContent = match.homeScore === null ? "Waiting" : `${match.homeScore}–${match.awayScore}`;
    row.classList.toggle("is-complete", match.status === "complete");
    row.append(names, score);
    return row;
  }));
}

function renderOnlineCurrentMatch(room, memberId, viewedMatch, controlledMatch, displayMemberId = memberId) {
  const animatingPenalty = onlinePenaltyAnimation?.matchId === viewedMatch?.id;
  els.onlineCurrentMatch.hidden = !viewedMatch;
  els.onlineSnapshotButton.hidden = !viewedMatch
    || animatingPenalty
    || !(viewedMatch.status === "complete" || viewedMatch.liveState?.status === "finished");
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = !animatingPenalty;
  if (!viewedMatch) {
    stopOnlineLivePresentation();
    els.onlineCurrentMatch.classList.remove("has-penalty-control");
    delete els.onlineCurrentMatch.dataset.matchId;
    return;
  }
  els.onlineCurrentMatch.dataset.matchId = viewedMatch.id;
  const livePenaltyActive = viewedMatch.liveState?.status === "penalties" || Boolean(viewedMatch.liveState?.pendingDecision);
  const legacyPenaltyActive = viewedMatch.status === "penalties";
  els.onlineCurrentMatch.classList.toggle("has-penalty-control", livePenaltyActive || legacyPenaltyActive || !els.onlinePenaltyControl.hidden);
  const viewedRound = room.tournament.rounds.find((round) => round.matches.some((match) => match.id === viewedMatch.id));
  const viewedIndex = viewedRound?.matches.findIndex((match) => match.id === viewedMatch.id) ?? 0;
  els.onlineCardRound.textContent = onlineRoundName(room.tournament, viewedRound?.number || 1).toUpperCase();
  els.onlineCardMatchNumber.textContent = `${viewedIndex + 1}/${viewedRound?.matches.length || 1}`;
  const homeIsMine = room.tournament.teamOwnerById?.[viewedMatch.homeTeamId] === displayMemberId;
  const awayIsMine = room.tournament.teamOwnerById?.[viewedMatch.awayTeamId] === displayMemberId;
  els.onlineMatchHome.innerHTML = onlineMatchTeamMarkup(viewedMatch.homeTeamId, homeIsMine);
  els.onlineMatchAway.innerHTML = onlineMatchTeamMarkup(viewedMatch.awayTeamId, awayIsMine);
  renderOnlineMatchResult(viewedMatch);

  if (viewedMatch.liveState?.simulationVersion === 2) {
    const pending = viewedMatch.liveState.pendingDecision;
    const myTurn = pending?.memberId === memberId;
    const waitingForOpponent = livePenaltyActive && Boolean(pending) && !myTurn;
    els.onlinePenaltyControl.hidden = !myTurn && !waitingForOpponent && !animatingPenalty;
    if (myTurn && !animatingPenalty) {
      els.onlinePenaltyControl.classList.remove("is-cpu-taking");
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = onlineRoomBusy; });
      els.onlinePenaltyPrompt.textContent = "Pick your spot";
      const goalkeeperSide = pending.side === "home" ? "away" : "home";
      const tendency = viewedMatch.liveState.goalkeeperTendencies?.[goalkeeperSide]?.primaryTarget || "middle";
      const tendencyLabel = tendency === "middle" ? "the middle" : tendency.endsWith("left") ? "their left" : "their right";
      els.onlinePenaltyFeedback.textContent = `The goalkeeper favours ${tendencyLabel} and adapts to repeated shots`;
      els.onlinePenaltyControl.dataset.matchId = viewedMatch.id;
      els.onlinePenaltyControl.dataset.decisionId = pending.id;
      setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
    }
    if (waitingForOpponent && !animatingPenalty) {
      const team = TEAM_BY_ID.get(pending.teamId);
      els.onlinePenaltyControl.classList.add("is-cpu-taking");
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
      els.onlinePenaltyPrompt.textContent = `${team?.name || "Opponent"} to take`;
      els.onlinePenaltyFeedback.textContent = "Waiting for the penalty taker";
      els.onlinePenaltyControl.dataset.matchId = viewedMatch.id;
      delete els.onlinePenaltyControl.dataset.decisionId;
      els.onlinePenaltyScene.dataset.target = "middle";
      setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
    }
    if (controlledMatch?.status === "waiting" && controlledMatch.requiredMemberIds.includes(memberId)) {
      const readyMembers = new Set(controlledMatch.readyMemberIds);
      const isReady = readyMembers.has(memberId);
      els.onlineReadyPanel.hidden = false;
      els.onlineReadyButtonLabel.textContent = isReady ? onlineReadyWaitingLabel(controlledMatch) : "Play this tie";
      els.onlineReadyButton.disabled = onlineRoomBusy || isReady;
      els.onlineReadyButton.dataset.action = "ready";
      els.onlineReadyButton.dataset.matchId = controlledMatch.id;
      els.onlineReadyButton.hidden = false;
    }
    return;
  }
  if (onlineMatchPlayback) return;
  if (controlledMatch?.status === "waiting" && controlledMatch.requiredMemberIds.includes(memberId)) {
    const readyMembers = new Set(controlledMatch.readyMemberIds);
    const isReady = readyMembers.has(memberId);
    els.onlineReadyPanel.hidden = false;
    els.onlineReadyButtonLabel.textContent = isReady ? onlineReadyWaitingLabel(controlledMatch) : "Play this tie";
    els.onlineReadyButton.disabled = onlineRoomBusy || isReady;
    els.onlineReadyButton.dataset.action = "ready";
    els.onlineReadyButton.dataset.matchId = controlledMatch.id;
    els.onlineReadyButton.hidden = false;
  } else if (controlledMatch?.status === "penalties") {
    const myTurn = room.tournament.teamOwnerById[controlledMatch.penalty?.currentTeamId] === memberId;
    els.onlinePenaltyControl.hidden = !myTurn && !animatingPenalty;
    if (myTurn && !animatingPenalty) {
      els.onlinePenaltyControl.classList.remove("is-cpu-taking");
      els.onlinePenaltyPrompt.textContent = "Pick your spot";
      els.onlinePenaltyFeedback.textContent = "Choose one of the five targets";
      setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
      els.onlinePenaltyScene.dataset.target = "middle";
    }
    if (!myTurn) {
      els.onlineReadyButton.hidden = true;
    }
  }
}

function renderOnlineMatchResult(match) {
  els.onlinePauseMatchButton.dataset.matchId = "";
  els.onlineMatchSpeedButton.dataset.matchId = "";
  renderOnlinePenaltyMarkResults([], [], false);
  if (onlineMatchPlayback?.matchId === match.id) {
    renderOnlinePlaybackFrame();
    return;
  }
  if (match.liveState?.simulationVersion === 2) {
    const live = match.liveState;
    syncOnlineLivePresentation(match);
    const finished = live.status === "finished";
    const displayMinute = projectedOnlineLiveMinute(live);
    const queuedPenalty = onlineObservedPenaltyQueue.find((item) => item.matchId === match.id);
    const hiddenScoreBefore = onlinePenaltyAnimation?.matchId === match.id && !onlinePenaltyAnimation.resultRevealed
      ? onlinePenaltyAnimation.scoreBefore
      : queuedPenalty?.event.scoreBefore;
    const hiddenPenaltyResult = Boolean(hiddenScoreBefore);
    const displayedHomeScore = hiddenPenaltyResult
      ? hiddenScoreBefore?.home ?? live.homeScore
      : live.homeScore;
    const displayedAwayScore = hiddenPenaltyResult
      ? hiddenScoreBefore?.away ?? live.awayScore
      : live.awayScore;
    const hiddenPenaltyEventKeys = onlineHiddenPenaltyEventKeys(match.id);
    const displayedMatch = hiddenPenaltyEventKeys.size
      ? {
        ...match,
        events: (match.events || []).filter((event) => !hiddenPenaltyEventKeys.has(onlineObservedPenaltyEventKey(match, event))),
      }
      : match;
    els.onlineMatchMinute.textContent = finished ? "FULL TIME" : live.status === "penalties" ? "PENALTIES" : "LIVE";
    els.onlineMatchScore.textContent = live.status === "waiting" ? "– –" : `${displayedHomeScore}–${displayedAwayScore}`;
    const penaltyPlaybackPending = onlinePenaltyAnimation?.matchId === match.id
      || onlineObservedPenaltyQueue.some((item) => item.matchId === match.id);
    const hiddenObservedKicks = onlineObservedPenaltyQueue.filter((item) => item.matchId === match.id).length
      + Number(onlinePenaltyAnimation?.matchId === match.id && onlinePenaltyAnimation.observed);
    const visiblePenaltyKicks = Math.max(0, (match.penalty?.kicks?.length || 0) - hiddenObservedKicks);
    els.onlineMatchPenaltyScore.hidden = !live.penalty;
    if (!live.penalty) {
      els.onlineMatchPenaltyScore.textContent = "";
      delete els.onlineMatchPenaltyScore.dataset.homeScore;
      delete els.onlineMatchPenaltyScore.dataset.awayScore;
    } else if (!penaltyPlaybackPending) {
      setOnlineDisplayedPenaltyScore(live.penalty.homeScore, live.penalty.awayScore);
    }
    els.onlineMatchClock.textContent = clockText(displayMinute);
    els.onlineMatchPhase.textContent = phaseForLiveStatus(live.status);
    els.onlineLiveLabel.hidden = finished || live.status === "waiting";
    els.onlinePauseMatchButton.hidden = finished || live.status === "waiting";
    els.onlinePauseMatchButton.dataset.matchId = match.id;
    els.onlineMatchSpeedButton.hidden = finished || live.status === "waiting";
    els.onlineMatchSpeedButton.dataset.matchId = match.id;
    els.onlineMatchSpeedButton.textContent = `${live.clock?.effectiveSpeed || 1}×`;
    renderOnlinePauseState(live);
    renderOnlineScorerTimelines(displayedMatch, displayMinute);
    renderOnlineMatchEvents(displayedMatch, displayMinute, visiblePenaltyKicks);
    renderOnlinePenaltyLedgers(displayedMatch, visiblePenaltyKicks);
    renderOnlineMatchStats(live);
    return;
  }
  stopOnlineLivePresentation();
  els.onlineMatchMinute.textContent = match.status === "complete" ? "FULL TIME" : match.status === "penalties" ? "PENALTIES" : "PRE-MATCH";
  els.onlineMatchScore.textContent = match.status === "waiting" || match.homeScore === null
    ? "– –"
    : `${match.homeScore}–${match.awayScore}`;
  els.onlineMatchPenaltyScore.hidden = !match.penalty;
  els.onlineMatchPenaltyScore.textContent = match.penalty ? `PENS ${match.penalty.homeScore}–${match.penalty.awayScore}` : "";
  renderOnlinePenaltyLedgers(match, match.penalty?.kicks.length || 0);
  els.onlineMatchClock.textContent = match.status === "waiting" ? "00:00" : "90:00";
  els.onlineMatchPhase.textContent = match.status === "waiting" ? "FIRST HALF" : match.status === "penalties" ? "PENALTY SHOOTOUT" : "FULL TIME";
  els.onlineLiveLabel.hidden = true;
  els.onlinePauseMatchButton.hidden = true;
  els.onlineMatchSpeedButton.hidden = true;
  renderOnlineScorerTimelines(match, match.status === "waiting" ? 0 : 90);
  renderOnlineMatchEvents(match, 90, match.penalty?.kicks.length || 0);
}

function onlineServerNow() {
  return Date.now() + (onlineServerOffsetReady ? onlineServerOffsetMs : 0);
}

function renderOnlinePauseState(live) {
  if (!els.onlinePauseMatchButton || !els.onlinePauseCountdown || !live) return;
  const pausedUntil = Number(live.clock?.pausedUntil) || 0;
  const remainingSeconds = Math.max(0, Math.ceil((pausedUntil - onlineServerNow()) / 1000));
  const paused = remainingSeconds > 0;
  els.onlinePauseMatchButton.textContent = paused ? "Resume" : "Pause";
  els.onlinePauseMatchButton.setAttribute("aria-pressed", String(paused));
  els.onlinePauseCountdown.hidden = !paused;
  els.onlinePauseCountdown.textContent = `Auto resumes in ${remainingSeconds}s`;
}

function projectedOnlineLiveMinute(live) {
  if (!live || live.status === "waiting" || live.status === "finished" || live.pendingDecision) return live?.minute || 0;
  const now = onlineServerNow();
  if (live.clock?.pausedUntil && live.clock.pausedUntil > now) return live.minute || 0;
  const nextMinuteAt = Number(live.clock?.nextMinuteAt);
  if (!Number.isFinite(nextMinuteAt)) return live.minute || 0;
  const speed = [1, 2, 4].includes(live.clock?.effectiveSpeed) ? live.clock.effectiveSpeed : 1;
  const minuteDuration = ONLINE_LIVE_MINUTE_MS / speed;
  const projected = (live.minute || 0) + Math.max(0, now - (nextMinuteAt - minuteDuration)) / minuteDuration;
  const cap = ({
    firstHalf: 45,
    halfTime: 45,
    secondHalf: 90,
    extraTimeFirst: 105,
    extraTimeSecond: 120,
    penalties: 120,
  })[live.status] || 120;
  return Math.min(cap, projected);
}

function smoothOnlineLiveMinute(current, target, elapsedMs, speed = 1) {
  const from = Math.max(0, Number(current) || 0);
  const to = Math.max(from, Number(target) || from);
  const safeElapsed = Math.min(ONLINE_LIVE_MAX_FRAME_MS, Math.max(0, Number(elapsedMs) || 0));
  const safeSpeed = [1, 2, 4].includes(speed) ? speed : 1;
  const maxStep = Math.min(
    ONLINE_LIVE_MAX_FRAME_MINUTES,
    (safeElapsed / ONLINE_LIVE_MINUTE_MS) * safeSpeed * ONLINE_LIVE_CATCHUP_FACTOR,
  );
  return Math.min(to, from + maxStep);
}

function onlinePresentationType(event) {
  if (event.type === "penalty-kick") return event.scored ? "goal" : "penalty-miss";
  if (event.type === "red-card" || event.type === "second-yellow") return "red";
  return event.type;
}

function onlinePresentationEvent(match, event) {
  const type = onlinePresentationType(event);
  const metadata = {
    ...(event.metadata || {}),
    scorer: event.metadata?.scorer || event.player || null,
    scored: event.scored,
    missType: event.missType || null,
  };
  return MatchPresentation.createEvent({
    id: `online:${match.id}:${event.id ?? event.sequence}`,
    sequence: Number(event.id) || Number(event.sequence) || 0,
    minute: event.minute,
    addedTime: event.addedTime || 0,
    type,
    importance: event.importance || (type === "goal" ? "goal" : type === "red" ? "major" : "normal"),
    side: event.side,
    teamId: event.teamId,
    playerIds: [],
    scoreBefore: event.scoreBefore || { home: 0, away: 0 },
    scoreAfter: event.scoreAfter || { home: event.homeScore || 0, away: event.awayScore || 0 },
    phase: event.phase || "first-half",
    metadata,
  });
}

function onlineEventCommentary(match, event) {
  const presentationEvent = onlinePresentationEvent(match, event);
  const team = TEAM_BY_ID.get(event.teamId);
  const opponentId = event.side === "home" ? match.awayTeamId : match.homeTeamId;
  const opponent = TEAM_BY_ID.get(opponentId);
  const player = event.player || event.metadata?.player || event.metadata?.shooter || "A player";
  if (["goal", "penalty-miss", "shootout-kick"].includes(presentationEvent.type)) {
    return MatchPresentation.goalCommentary(presentationEvent, team?.name || "Team");
  }
  if (event.type === "penalty-awarded") return `PENALTY TO ${(team?.name || "THE ATTACKING TEAM").toUpperCase()}!`;
  if (event.type === "save") return `${opponent?.name || "The defending side"}'s goalkeeper is equal to ${player}'s effort.`;
  if (event.type === "shot-blocked") return `${player}'s effort is blocked before it can trouble the goalkeeper.`;
  if (event.type === "shot-missed") return `${player} sends the effort narrowly wide.`;
  if (event.type === "red-card") return `${player} is shown a straight red card!`;
  if (event.type === "second-yellow") return `${player} receives a second yellow and is sent off!`;
  if (event.type === "yellow-card") return `${player} goes into the referee's book.`;
  if (event.type === "substitution") return `${event.playerIn || event.metadata?.playerIn} replaces ${event.playerOut || event.metadata?.playerOut}.`;
  if (event.type === "half-time") return "Half-time. The players head down the tunnel.";
  if (event.type === "extra-time") return "The tie is level. Extra time begins.";
  if (event.type === "extra-time-break") return "Half-time in extra time.";
  if (event.type === "full-time") return "Full-time.";
  return "";
}

function renderOnlineCommentaryEvent(match, event) {
  if (!els.onlineCommentaryFeed || !event) return;
  const presentationEvent = onlinePresentationEvent(match, event);
  const text = onlineEventCommentary(match, event);
  if (!text) return;
  const line = document.createElement("div");
  line.className = `commentary-line ${presentationEvent.type}`;
  const copy = document.createElement("span");
  copy.textContent = presentationEvent.importance === "goal" ? text.toUpperCase() : text;
  line.append(copy);
  els.onlineCommentaryFeed.replaceChildren(line);
  els.onlineCommentaryFeed.classList.toggle("is-goal", presentationEvent.importance === "goal");
  els.onlineCommentaryFeed.classList.toggle("is-major", presentationEvent.importance === "major");
  if (presentationEvent.importance === "goal") flashOnlineGoalCommentary(event.teamId);
}

function flashOnlineGoalCommentary(teamId) {
  const team = TEAM_BY_ID.get(teamId);
  if (!team || !onlineLivePresentation || !els.onlineCommentaryFeed) return;
  const theme = getTeamGoalFlashTheme(team);
  clearTimeout(onlineLivePresentation.goalFlashTimer);
  els.onlineCommentaryFeed.style.setProperty("--goal-flash-color", theme.background);
  els.onlineCommentaryFeed.style.setProperty("--goal-flash-text-color", theme.text);
  els.onlineCommentaryFeed.style.background = theme.background;
  els.onlineCommentaryFeed.style.borderColor = theme.background;
  els.onlineCommentaryFeed.style.color = theme.text;
  els.onlineCommentaryFeed.classList.add("is-goal-flashing");
  onlineLivePresentation.goalFlashTimer = setTimeout(() => {
    if (!els.onlineCommentaryFeed) return;
    els.onlineCommentaryFeed.style.background = "";
    els.onlineCommentaryFeed.style.borderColor = "";
    els.onlineCommentaryFeed.style.color = "";
    els.onlineCommentaryFeed.classList.remove("is-goal-flashing");
  }, 1400);
}

function meaningfulOnlineEvents(match) {
  return (match.events || []).filter((event) => (
    event.importance && event.importance !== "silent"
  ));
}

function createOnlinePresentationScheduler(match) {
  return MatchPresentation.createScheduler({
    now: () => performance.now(),
    onShow: (presentationEvent) => {
      const event = meaningfulOnlineEvents(onlineLivePresentation?.match || match)
        .find((candidate) => `online:${match.id}:${candidate.id ?? candidate.sequence}` === presentationEvent.id);
      if (event && onlineLivePresentation?.matchId === match.id) renderOnlineCommentaryEvent(onlineLivePresentation.match, event);
    },
  });
}

function syncOnlineLivePresentation(match) {
  const live = match.liveState;
  if (!live || live.simulationVersion !== 2) return;
  if (!onlineLivePresentation || onlineLivePresentation.matchId !== match.id) {
    stopOnlineLivePresentation();
    const events = meaningfulOnlineEvents(match).toSorted((a, b) => (a.id || a.sequence) - (b.id || b.sequence));
    onlineLivePresentation = {
      matchId: match.id,
      match,
      scheduler: createOnlinePresentationScheduler(match),
      lastEventId: events.at(-1)?.id || events.at(-1)?.sequence || 0,
      displayedMinute: projectedOnlineLiveMinute(live),
      lastFrameAt: performance.now(),
      goalFlashTimer: null,
    };
    const latest = events.filter((event) => (
      event.minute <= live.minute
      && !(event.type === "shootout-kick" && onlineObservedPenaltyIds.has(onlineObservedPenaltyEventKey(match, event)))
    )).at(-1);
    if (latest) renderOnlineCommentaryEvent(match, latest);
    else if (els.onlineCommentaryFeed) els.onlineCommentaryFeed.innerHTML = '<div class="commentary-line"><span>Waiting for the opening passage of play.</span></div>';
  } else {
    onlineLivePresentation.match = match;
    const fresh = meaningfulOnlineEvents(match)
      .filter((event) => (event.id || event.sequence || 0) > onlineLivePresentation.lastEventId)
      .toSorted((a, b) => (a.id || a.sequence) - (b.id || b.sequence));
    fresh.forEach((event) => {
      const ownerId = latestOnlineRoom?.tournament?.teamOwnerById?.[event.teamId];
      const penaltyEvent = ["penalty-kick", "shootout-kick"].includes(event.type);
      const observedOpponentKick = penaltyEvent && ownerId !== onlineRoomSession?.memberId;
      const ownPenaltyAnimation = penaltyEvent
        && onlinePenaltyAnimation?.matchId === match.id
        && !onlinePenaltyAnimation.resultRevealed;
      const pairedPenaltyAward = event.type === "penalty-awarded" && fresh.some((candidate) => (
        candidate.type === "penalty-kick"
        && candidate.teamId === event.teamId
        && (candidate.id || candidate.sequence || 0) > (event.id || event.sequence || 0)
      ));
      if (observedOpponentKick) queueOnlineObservedPenalty(match, event);
      if (!observedOpponentKick && !ownPenaltyAnimation && !pairedPenaltyAward) {
        onlineLivePresentation.scheduler.enqueue(onlinePresentationEvent(match, event), {
          now: performance.now(),
          speed: live.clock?.effectiveSpeed || 1,
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
      }
      onlineLivePresentation.lastEventId = Math.max(onlineLivePresentation.lastEventId, event.id || event.sequence || 0);
    });
  }
  if (!onlineLivePresentationTimer && live.status !== "finished") {
    onlineLivePresentationTimer = requestAnimationFrame(stepOnlineLivePresentation);
  }
}

function stepOnlineLivePresentation() {
  onlineLivePresentationTimer = null;
  const presentation = onlineLivePresentation;
  if (!presentation || els.onlineRoomScreen.hidden) return;
  const live = presentation.match?.liveState;
  if (!live) return;
  const projected = projectedOnlineLiveMinute(live);
  const now = performance.now();
  const elapsed = presentation.lastFrameAt ? now - presentation.lastFrameAt : 0;
  presentation.lastFrameAt = now;
  const watchingOwnedMatch = onlineMemberOwnsMatch(
    latestOnlineRoom?.tournament,
    onlineRoomSession?.memberId,
    presentation.match,
  );
  presentation.displayedMinute = watchingOwnedMatch
    ? smoothOnlineLiveMinute(
      presentation.displayedMinute || 0,
      projected,
      elapsed,
      live.clock?.effectiveSpeed || 1,
    )
    : projected;
  const displayMinute = live.status === "finished" ? live.minute : presentation.displayedMinute;
  if (els.onlineMatchClock) els.onlineMatchClock.textContent = clockText(displayMinute);
  if (els.onlineMatchPhase) els.onlineMatchPhase.textContent = phaseForLiveStatus(live.status);
  renderOnlinePauseState(live);
  renderOnlineMatchStats(live);
  presentation.scheduler.tick({
    now,
    speed: live.clock?.effectiveSpeed || 1,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  if (live.status !== "finished" || presentation.scheduler.snapshot().queueLength) {
    onlineLivePresentationTimer = requestAnimationFrame(stepOnlineLivePresentation);
  }
}

function stopOnlineLivePresentation() {
  cancelAnimationFrame(onlineLivePresentationTimer);
  onlineLivePresentationTimer = null;
  if (onlineLivePresentation) {
    clearTimeout(onlineLivePresentation.goalFlashTimer);
    onlineLivePresentation.scheduler?.clear("online-match-change");
  }
  onlineLivePresentation = null;
}

function renderOnlineMatchStats(live) {
  if (!els.onlineMatchStatsGrid || !live) return;
  const totalPossession = (live.possession?.home || 0) + (live.possession?.away || 0);
  const homePossession = totalPossession
    ? Math.round(((live.possession?.home || 0) / totalPossession) * 100)
    : 50;
  const awayPossession = 100 - homePossession;
  const rows = [
    ["Possession", `${homePossession}%`, `${awayPossession}%`],
    ["xG", Number(live.homeXG || 0).toFixed(2), Number(live.awayXG || 0).toFixed(2)],
    ["Shots", live.shots?.home || 0, live.shots?.away || 0],
    ["On target", live.shotsOnTarget?.home || 0, live.shotsOnTarget?.away || 0],
    ["Red cards", live.homeRedCards || 0, live.awayRedCards || 0],
  ];
  const signature = rows.flat().join(":");
  if (els.onlineMatchStatsGrid.dataset.renderSignature === signature) return;
  els.onlineMatchStatsGrid.dataset.renderSignature = signature;
  els.onlineMatchStatsGrid.innerHTML = rows.map(([label, home, away]) => (
    `<div class="online-match-stat-row"><b>${home}</b><span>${label}</span><b>${away}</b></div>`
  )).join("");
}

function phaseForLiveStatus(status) {
  return ({
    waiting: "PRE-MATCH",
    firstHalf: "FIRST HALF",
    halfTime: "HALF TIME",
    secondHalf: "SECOND HALF",
    extraTimeFirst: "EXTRA TIME",
    extraTimeBreak: "EXTRA TIME BREAK",
    extraTimeSecond: "EXTRA TIME",
    penalties: "PENALTY SHOOTOUT",
    finished: "FULL TIME",
  })[status] || "LIVE";
}

function onlineGoalScorer(match, event, eventIndex) {
  if (event?.player) return event.player;
  const team = TEAM_BY_ID.get(event.teamId);
  if (!team) return "Goalscorer";
  const players = team.players?.length ? team.players : generatedPlayers(team);
  return players[stableHash(`${match.id}:${event.teamId}:${event.minute}:${eventIndex}`) % players.length];
}

function onlineGoalEvents(match) {
  return (match.events || [])
    .filter((event) => ["goal", "penalty", "penalty-kick"].includes(event.type || "goal") && event.scored !== false)
    .map((event, index) => ({
      ...event,
      type: ["penalty", "penalty-kick"].includes(event.type) ? "penalty" : "goal",
      side: event.teamId === match.homeTeamId ? "home" : "away",
      player: onlineGoalScorer(match, event, index),
    }));
}

function renderOnlineScorerTimelines(match, minute) {
  const events = onlineGoalEvents(match)
    .filter((event) => event.minute <= minute && event.scored !== false)
    .map((event) => ({ ...event, type: "goal" }));
  const signature = `${match.id}:${events.map((event) => `${event.side}:${event.minute}:${event.player}:${isPenaltyGoalEvent(event)}`).join("|")}`;
  if (els.onlineHomeScorers.dataset.renderSignature === signature) return;
  els.onlineHomeScorers.dataset.renderSignature = signature;
  els.onlineAwayScorers.dataset.renderSignature = signature;
  els.onlineHomeScorers.innerHTML = events
    .filter((event) => event.side === "home")
    .map((event) => timelineEventMarkup(event))
    .join("");
  els.onlineAwayScorers.innerHTML = events
    .filter((event) => event.side === "away")
    .map((event) => timelineEventMarkup(event, true))
    .join("");
}

function penaltyMarkResultsMarkup(results) {
  const slots = Math.max(5, results.length);
  return Array.from({ length: slots }, (_, index) => {
    const result = results[index];
    const state = result === true ? " goal" : result === false ? " miss" : "";
    const label = result === true ? "Scored" : result === false ? "Missed" : "Pending";
    return `<span class="penalty-mark${state}" aria-label="${label}"></span>`;
  }).join("");
}

function renderOnlinePenaltyMarkResults(homeResults, awayResults, visible = true) {
  els.onlineHomePenaltyMarks.hidden = !visible;
  els.onlineAwayPenaltyMarks.hidden = !visible;
  if (!visible) {
    els.onlineHomePenaltyMarks.replaceChildren();
    els.onlineAwayPenaltyMarks.replaceChildren();
    delete els.onlineHomePenaltyMarks.dataset.renderSignature;
    delete els.onlineAwayPenaltyMarks.dataset.renderSignature;
    return;
  }
  const signature = `${homeResults.map((result) => Number(result)).join("")}:${awayResults.map((result) => Number(result)).join("")}`;
  if (els.onlineHomePenaltyMarks.dataset.renderSignature === signature) return;
  els.onlineHomePenaltyMarks.dataset.renderSignature = signature;
  els.onlineAwayPenaltyMarks.dataset.renderSignature = signature;
  els.onlineHomePenaltyMarks.innerHTML = penaltyMarkResultsMarkup(homeResults);
  els.onlineAwayPenaltyMarks.innerHTML = penaltyMarkResultsMarkup(awayResults);
}

function renderOnlinePenaltyLedgers(match, kickCount) {
  if (!match.penalty) {
    renderOnlinePenaltyMarkResults([], [], false);
    return;
  }
  const visibleKicks = (match.penalty.kicks || []).slice(0, kickCount);
  renderOnlinePenaltyMarkResults(
    visibleKicks.filter((kick) => kick.teamId === match.homeTeamId).map((kick) => Boolean(kick.scored)),
    visibleKicks.filter((kick) => kick.teamId === match.awayTeamId).map((kick) => Boolean(kick.scored)),
  );
}

function renderOnlineMatchEvents(match, minute, penaltyKickCount) {
  const events = (match.events || []).filter((event) => event.minute <= minute);
  const signature = `${match.id}:${match.status}:${events.map((event) => `${event.type || "goal"}:${event.minute}:${event.teamId}:${event.scored}`).join("|")}:p${penaltyKickCount}`;
  if (els.onlineMatchEvents.dataset.renderSignature === signature) return;
  els.onlineMatchEvents.dataset.renderSignature = signature;
  const rows = events.map((event, index) => {
    const row = document.createElement("div");
    row.className = `online-match-event ${event.type === "penalty" ? "is-penalty" : "is-goal"} ${event.scored === false ? "is-missed" : ""}`;
    const eventMinute = document.createElement("span");
    eventMinute.textContent = goalMinuteText(event);
    const copy = document.createElement("strong");
    copy.textContent = event.type === "penalty"
      ? `Penalty — ${onlineGoalScorer(match, event, index)} — ${event.scored === false ? "Saved" : "Scored"}`
      : `Goal — ${onlineGoalScorer(match, event, index)}`;
    row.append(eventMinute, copy);
    return row;
  });
  (match.penalty?.kicks || []).slice(0, penaltyKickCount).forEach((kick, index) => {
    const row = document.createElement("div");
    row.className = `online-match-event is-penalty ${kick.scored ? "is-scored" : "is-missed"}`;
    const count = document.createElement("span");
    count.textContent = `P${index + 1}`;
    const copy = document.createElement("strong");
    copy.textContent = `${TEAM_BY_ID.get(kick.teamId)?.name || "Country"} — ${kick.scored ? "Scored" : "Saved"}`;
    row.append(count, copy);
    rows.push(row);
  });
  if (!rows.length) {
    const empty = document.createElement("span");
    empty.className = "online-match-events-empty";
    empty.textContent = match.status === "waiting" ? "The match has not started." : "No goals yet.";
    rows.push(empty);
  }
  els.onlineMatchEvents.replaceChildren(...rows);
  els.onlineMatchEvents.scrollTop = els.onlineMatchEvents.scrollHeight;
}

function onlineCentreMatchCard(match, tournament, memberId, memberById, viewingLocked = false) {
    const isLive = onlineMatchPlayback?.matchId === match.id;
    const visibleEvents = isLive ? (match.events || []).filter((event) => event.minute <= onlineMatchPlayback.minute) : [];
    const liveScore = visibleEvents.at(-1) || { homeScore: 0, awayScore: 0 };
    const sharedState = onlineSharedMatchState(match);
    const penaltyPlaybackPending = match.id === onlineViewedMatchId && (
      onlinePenaltyAnimation?.matchId === match.id
      || onlineObservedPenaltyQueue.some((item) => item.matchId === match.id)
    );
    const visiblePenaltyText = penaltyPlaybackPending
      ? els.onlineMatchPenaltyScore.textContent
      : sharedState.penaltyText;
    const cardIsLive = isLive || sharedState.live;
    const home = TEAM_BY_ID.get(match.homeTeamId);
    const away = TEAM_BY_ID.get(match.awayTeamId);
    const homeOwnerId = tournament?.teamOwnerById?.[match.homeTeamId];
    const awayOwnerId = tournament?.teamOwnerById?.[match.awayTeamId];
    const humanOwners = [...new Set([homeOwnerId, awayOwnerId])]
      .map((ownerId) => memberById.get(ownerId))
      .filter((member) => member && !member.isCpu);
    const status = !match.awayTeamId
      ? "THROUGH"
      : isLive
        ? "LIVE"
        : match.status === "waiting"
          ? match.readyMemberIds.length
            ? match.requiredMemberIds.length > 1 ? "WAITING FOR PLAYER" : match.queuePosition > 0 ? "QUEUED" : "STARTING"
            : "READY"
          : match.status === "penalties"
            ? sharedState.label
            : sharedState.label;
    const hasStarted = match.status !== "waiting";
    const homeScore = !hasStarted ? "–" : isLive ? liveScore.homeScore : sharedState.homeScore;
    const awayScore = !hasStarted ? "–" : isLive ? liveScore.awayScore : sharedState.awayScore;
    const winnerVisible = match.status === "complete" && !cardIsLive;
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.matchId = match.id;
    card.className = "online-centre-match";
    card.disabled = viewingLocked;
    card.classList.toggle("is-viewing-locked", viewingLocked);
    if (viewingLocked) card.title = "Finish your active match before watching another match";
    card.classList.toggle("is-selected", match.id === onlineViewedMatchId);
    card.innerHTML = `
      <span class="online-centre-head">
        <span>${humanOwners.map((owner) => escapeHtml(owner.name)).join(" vs ") || "CPU match"}</span>
        <small class="${cardIsLive ? "is-live" : ""}">${cardIsLive ? "<i></i>" : ""}${visiblePenaltyText || status}</small>
      </span>
      <span class="online-centre-team">
        ${home ? flagMarkup(home, "online-centre-flag") : ""}
        <strong class="${homeOwnerId === memberId ? "is-mine" : ""}">${home?.name || "Bye"}</strong>
        <b>${homeScore}${winnerVisible && match.winnerTeamId === match.homeTeamId ? " ◀" : ""}</b>
      </span>
      <span class="online-centre-team">
        ${away ? flagMarkup(away, "online-centre-flag") : ""}
        <strong class="${awayOwnerId === memberId ? "is-mine" : ""}">${away?.name || "Bye"}</strong>
        <b>${awayScore}${winnerVisible && match.winnerTeamId === match.awayTeamId ? " ◀" : ""}</b>
      </span>
    `;
    return card;
}

function onlineMatchListEmpty(copy) {
  const empty = document.createElement("div");
  empty.className = "online-match-list-empty";
  empty.textContent = copy;
  return empty;
}

function renderOnlineRoundMatches(rounds, tournament, memberId, members = [], friendViewingLocked = null) {
  clearTimeout(onlineRoundScoreTimer);
  onlineRoundScoreTimer = null;
  const currentRound = rounds.find((round) => round.number === onlineDisplayedRoundNumber) || rounds.at(-1);
  if (!currentRound) {
    els.onlineMyMatches.replaceChildren();
    els.onlineRoundMatches.replaceChildren();
    return;
  }
  const memberById = new Map(members.map((member) => [member.id, member]));
  const isMine = (match) => [match.homeTeamId, match.awayTeamId]
    .some((teamId) => tournament?.teamOwnerById?.[teamId] === memberId);
  const viewingLocked = friendViewingLocked ?? currentRound.matches.some((match) => isMine(match) && onlineMatchStillPlaying(match));
  let historyChanged = false;
  currentRound.matches.forEach((match) => {
    if (isMine(match) || match.status !== "complete" || onlineSharedMatchState(match).live) return;
    if (!onlinePlayedMatchIds.has(match.id)) {
      onlinePlayedMatchIds.add(match.id);
      historyChanged = true;
    }
    if (!onlineFinishedPlaybackIds.has(match.id)) {
      onlineFinishedPlaybackIds.add(match.id);
      historyChanged = true;
    }
  });
  if (historyChanged) saveOnlineMatchHistory();
  const hasFriend = (match) => [match.homeTeamId, match.awayTeamId].some((teamId) => {
    const ownerId = tournament?.teamOwnerById?.[teamId];
    const owner = memberById.get(ownerId);
    return owner && !owner.isCpu && ownerId !== memberId;
  });
  const myMatches = currentRound.matches.filter(isMine);
  const otherMatches = onlineOtherMatchFilter === "all"
    ? currentRound.matches
    : currentRound.matches.filter((match) => !isMine(match) && hasFriend(match));
  const myCards = myMatches.map((match) => onlineCentreMatchCard(match, tournament, memberId, memberById));
  const otherCards = otherMatches.map((match) => onlineCentreMatchCard(
    match,
    tournament,
    memberId,
    memberById,
    viewingLocked,
  ));
  els.onlineMyMatches.replaceChildren(...(myCards.length ? myCards : [onlineMatchListEmpty("No matches to play in this round.")]));
  els.onlineRoundMatches.replaceChildren(...(otherCards.length ? otherCards : [onlineMatchListEmpty("No friends' matches in this round.")]));
  els.onlineRoundMatches.classList.toggle("is-all-matches", onlineOtherMatchFilter === "all");
  els.onlineOtherMatchesTitle.textContent = onlineOtherMatchFilter === "all" ? "ALL MATCHES" : "FRIENDS' MATCHES";
  els.onlineMatchFilter.querySelectorAll("[data-online-match-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.onlineMatchFilter === onlineOtherMatchFilter);
  });
  updateOnlineRoundNextButton(currentRound, tournament, memberId);
  const hasLiveScore = currentRound.matches.some((match) => match.status === "complete" && onlineSharedMatchState(match).live);
  if (hasLiveScore) {
    onlineRoundScoreTimer = setTimeout(() => {
      if (!latestOnlineRoom || els.onlineRoomScreen.hidden) return;
      renderOnlineRoundMatches(
        latestOnlineRoom.tournament?.rounds || [],
        latestOnlineRoom.tournament,
        onlineRoomSession.memberId,
        latestOnlineRoom.members,
      );
    }, 250);
  }
}

function startOnlineMatchPlayback(match) {
  stopOnlineMatchPlayback();
  onlineViewedMatchId = match.id;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shared = Boolean(
    match.playback?.controllerMemberIds?.length === 2
    && match.playback.controllerMemberIds.includes(onlineRoomSession?.memberId)
  );
  onlineMatchPlayback = {
    matchId: match.id,
    match,
    minute: 0,
    penaltyKickCount: 0,
    speed: 1,
    requestedSpeed: 1,
    paused: false,
    shared,
    sharedPositionMs: 0,
    sharedSnapshotAt: Date.now(),
    sharedPauseUntil: 0,
    reducedMotion,
    baseDuration: shared ? ONLINE_SHARED_PLAYBACK_MS : reducedMotion ? 10000 : ONLINE_SHARED_PLAYBACK_MS,
    lastTimestamp: 0,
    shootoutElapsed: 0,
    finishStarted: 0,
    shownRegulationPenalties: new Set(),
    regulationPenaltyTimers: [],
    regulationPenaltyActive: false,
  };
  if (shared) syncOnlinePlaybackFromMatch(match);
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = true;
  const tournament = latestOnlineRoom?.tournament;
  const memberId = onlineRoomSession?.memberId;
  const controlsTeam = [match.homeTeamId, match.awayTeamId]
    .some((teamId) => tournament?.teamOwnerById?.[teamId] === memberId);
  if (controlsTeam) renderOnlineTactics(tournament, memberId, true, match, true);
  renderOnlinePlaybackFrame();
  onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
  if (shared) startOnlineRoomPolling();
}

function syncOnlinePlaybackFromMatch(match) {
  const playback = onlineMatchPlayback;
  const shared = match?.playback;
  if (!playback || playback.matchId !== match?.id || !playback.shared || !shared) return;
  const receivedAt = Date.now();
  const sharedUpdatedAt = Number(shared.updatedAt) || receivedAt;
  const sharedPausedUntil = Number(shared.pausedUntil) || 0;
  const nextSpeed = [1, 2, 4].includes(shared.effectiveSpeed) ? shared.effectiveSpeed : 1;
  const currentActiveStart = playback.sharedPauseUntil > playback.sharedSnapshotAt
    ? Math.max(playback.sharedSnapshotAt, playback.sharedPauseUntil)
    : playback.sharedSnapshotAt;
  const currentProjectedPosition = Math.min(
    playback.baseDuration,
    playback.sharedPositionMs + Math.max(0, receivedAt - currentActiveStart) * playback.speed,
  );
  const serverActiveStart = sharedPausedUntil > sharedUpdatedAt
    ? Math.max(sharedUpdatedAt, sharedPausedUntil)
    : sharedUpdatedAt;
  const serverProjectedPosition = Math.min(
    playback.baseDuration,
    Math.max(0, Number(shared.positionMs) || 0) + Math.max(0, receivedAt - serverActiveStart) * nextSpeed,
  );
  const serverRemainingPause = Math.max(0, sharedPausedUntil - receivedAt);
  playback.match = match;
  playback.sharedPositionMs = Math.max(0, serverRemainingPause ? serverProjectedPosition : Math.max(serverProjectedPosition, currentProjectedPosition));
  playback.sharedSnapshotAt = receivedAt;
  playback.sharedPauseUntil = receivedAt + serverRemainingPause;
  playback.speed = nextSpeed;
  playback.requestedSpeed = [1, 2, 4].includes(shared.speedByMemberId?.[onlineRoomSession?.memberId])
    ? shared.speedByMemberId[onlineRoomSession.memberId]
    : 1;
  playback.paused = playback.sharedPauseUntil > receivedAt;
}

function updateSharedOnlinePlaybackClock(playback) {
  const now = Date.now();
  const activeStart = playback.sharedPauseUntil > playback.sharedSnapshotAt
    ? Math.max(playback.sharedSnapshotAt, playback.sharedPauseUntil)
    : playback.sharedSnapshotAt;
  const activeElapsed = Math.max(0, now - activeStart);
  const positionMs = Math.min(playback.baseDuration, playback.sharedPositionMs + activeElapsed * playback.speed);
  playback.minute = Math.min(90, (positionMs / playback.baseDuration) * 90);
  playback.paused = playback.sharedPauseUntil > now;
}

function stepOnlineMatchPlayback(timestamp) {
  const playback = onlineMatchPlayback;
  if (!playback || els.onlineRoomScreen.hidden) {
    stopOnlineMatchPlayback();
    return;
  }
  if (playback.shared) {
    updateSharedOnlinePlaybackClock(playback);
    if (playback.paused) {
      playback.lastTimestamp = 0;
      renderOnlinePlaybackFrame();
      onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
      return;
    }
  } else if (playback.paused) return;
  if (!playback.lastTimestamp) {
    playback.lastTimestamp = timestamp;
    onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
    return;
  }
  const elapsed = Math.min(100, timestamp - playback.lastTimestamp);
  playback.lastTimestamp = timestamp;
  if (playback.minute < 90) {
    if (!playback.shared) {
      playback.minute = Math.min(90, playback.minute + (elapsed / playback.baseDuration) * 90 * playback.speed);
    }
  } else if (playback.penaltyKickCount < (playback.match.penalty?.kicks.length || 0)) {
    playback.shootoutElapsed += elapsed * playback.speed;
    playback.penaltyKickCount = Math.min(
      playback.match.penalty.kicks.length,
      Math.floor(playback.shootoutElapsed / (playback.reducedMotion ? 180 : 720)),
    );
  } else if (!playback.finishStarted) {
    playback.finishStarted = timestamp;
  } else if (timestamp - playback.finishStarted >= (playback.reducedMotion ? 120 : 900)) {
    onlinePlayedMatchIds.add(playback.matchId);
    onlineFinishedPlaybackIds.add(playback.matchId);
    saveOnlineMatchHistory();
    stopOnlineMatchPlayback();
    renderOnlineLobby(latestOnlineRoom, onlineRoomSession.memberId);
    return;
  }
  renderOnlinePlaybackFrame();
  onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
}

function renderOnlinePlaybackFrame() {
  const playback = onlineMatchPlayback;
  if (!playback) return;
  const { match, minute, penaltyKickCount } = playback;
  const visibleEvents = (match.events || []).filter((event) => event.minute <= minute);
  const lastEvent = visibleEvents.at(-1);
  const homeScore = lastEvent?.homeScore || 0;
  const awayScore = lastEvent?.awayScore || 0;
  const visibleKicks = (match.penalty?.kicks || []).slice(0, penaltyKickCount);
  const homePenalties = visibleKicks.filter((kick) => kick.teamId === match.homeTeamId && kick.scored).length;
  const awayPenalties = visibleKicks.filter((kick) => kick.teamId === match.awayTeamId && kick.scored).length;
  els.onlineMatchMinute.textContent = minute < 90 ? "LIVE" : visibleKicks.length < (match.penalty?.kicks.length || 0) ? "PENALTIES" : "FULL TIME";
  els.onlineMatchScore.textContent = minute < 90 || !match.penalty
    ? `${homeScore}–${awayScore}`
    : `${match.homeScore}–${match.awayScore}`;
  els.onlineMatchPenaltyScore.hidden = !match.penalty || minute < 90;
  els.onlineMatchPenaltyScore.textContent = `PENS ${homePenalties}–${awayPenalties}`;
  els.onlineMatchClock.textContent = clockText(minute);
  els.onlineMatchPhase.textContent = phaseForMinute(minute, { extraTime: false, penalties: Boolean(match.penalty) });
  els.onlineLiveLabel.hidden = minute >= 90;
  els.onlinePauseMatchButton.hidden = false;
  els.onlinePauseMatchButton.textContent = playback.paused ? "Resume" : "Pause";
  const pauseSeconds = playback.shared && playback.paused
    ? Math.max(0, Math.ceil((playback.sharedPauseUntil - Date.now()) / 1000))
    : 0;
  els.onlinePauseCountdown.hidden = !pauseSeconds;
  els.onlinePauseCountdown.textContent = `${pauseSeconds}s`;
  els.onlineMatchSpeedButton.hidden = false;
  els.onlineMatchSpeedButton.textContent = `${playback.speed}×`;
  els.onlineMatchSpeedButton.title = playback.shared
    ? `Your choice: ${playback.requestedSpeed}× · Match speed: ${playback.speed}×`
    : `Match speed: ${playback.speed}×`;
  renderOnlineScorerTimelines(match, minute);
  renderOnlineMatchEvents(match, minute, penaltyKickCount);
  if (minute >= 90) renderOnlinePenaltyLedgers(match, penaltyKickCount);
  else renderOnlinePenaltyMarkResults([], [], false);
  showOnlineRegulationPenaltyIfNeeded(match, visibleEvents);
}

function showOnlineRegulationPenaltyIfNeeded(match, visibleEvents) {
  const playback = onlineMatchPlayback;
  if (!playback || playback.regulationPenaltyActive) return;
  const event = visibleEvents.find((item, index) => (
    item.type === "penalty"
    && !playback.shownRegulationPenalties.has(`${item.minute}:${item.teamId}:${index}`)
  ));
  if (!event) return;
  const eventIndex = (match.events || []).indexOf(event);
  const eventKey = `${event.minute}:${event.teamId}:${eventIndex}`;
  playback.shownRegulationPenalties.add(eventKey);
  playback.regulationPenaltyActive = true;
  const seed = stableHash(`${match.id}:${eventKey}`);
  const directions = ["left", "centre", "right"];
  const attempt = {
    direction: directions[seed % directions.length],
    keeperDive: directions[Math.floor(seed / 3) % directions.length],
    foot: seed % 2 ? "right" : "left",
    scored: event.scored !== false,
    missType: event.scored === false ? "save" : null,
  };
  els.onlineMatchPenaltyPlayer.textContent = onlineGoalScorer(match, event, eventIndex);
  els.onlineMatchPenaltyOverlay.hidden = false;
  setPenaltySceneElement(els.onlineMatchPenaltyScene, attempt, "setup");
  const flightTimer = setTimeout(() => setPenaltySceneElement(els.onlineMatchPenaltyScene, attempt, "flight"), 220);
  const resultTimer = setTimeout(() => setPenaltySceneElement(els.onlineMatchPenaltyScene, attempt, "result"), 760);
  const closeTimer = setTimeout(() => {
    els.onlineMatchPenaltyOverlay.hidden = true;
    if (onlineMatchPlayback) onlineMatchPlayback.regulationPenaltyActive = false;
  }, 1500);
  playback.regulationPenaltyTimers.push(flightTimer, resultTimer, closeTimer);
}

function stopOnlineMatchPlayback() {
  (onlineMatchPlayback?.regulationPenaltyTimers || []).forEach((timer) => clearTimeout(timer));
  els.onlineMatchPenaltyOverlay.hidden = true;
  cancelAnimationFrame(onlineMatchPlaybackTimer);
  onlineMatchPlaybackTimer = null;
  onlineMatchPlayback = null;
  if (els.onlinePauseMatchButton) els.onlinePauseMatchButton.hidden = true;
  if (els.onlinePauseCountdown) els.onlinePauseCountdown.hidden = true;
  if (els.onlineMatchSpeedButton) els.onlineMatchSpeedButton.hidden = true;
}
