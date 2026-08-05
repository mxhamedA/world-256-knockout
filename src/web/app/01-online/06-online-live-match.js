
function renderOnlineTeamSelection(room, memberId) {
  const tournament = room.tournament;
  if (onlineMatchPlayback) {
    if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
    return;
  }
  const mustChoose = tournament?.selectionRequired?.includes(memberId);
  if (!mustChoose) {
    if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
    return;
  }
  const surviving = new Set(tournament.survivingTeamIds || []);
  const teamIds = [...surviving].filter((teamId) => tournament.teamOwnerById[teamId] === memberId);
  els.onlineTeamSelectList.replaceChildren(...teamIds.map((teamId) => {
    const team = TEAM_BY_ID.get(teamId);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.teamId = teamId;
    button.innerHTML = `${flagMarkup(team, "online-select-flag")}<span><strong>${team.name}</strong><small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"}</small></span>`;
    return button;
  }));
  if (!els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.showModal();
}

async function performOnlineMatchAction(path, body) {
  if (onlineRoomBusy || !onlineRoomSession) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/${path}`, { method: "POST", body });
    renderOnlineLobby(payload.room, payload.memberId);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

function onlinePenaltyDirection(target) {
  if (target.endsWith("left")) return "left";
  if (target.endsWith("right")) return "right";
  return "centre";
}

function waitForOnlinePenaltyFrame(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function setOnlineDisplayedPenaltyScore(homeScore, awayScore) {
  els.onlineMatchPenaltyScore.dataset.homeScore = String(homeScore);
  els.onlineMatchPenaltyScore.dataset.awayScore = String(awayScore);
  els.onlineMatchPenaltyScore.textContent = `PENS ${homeScore}–${awayScore}`;
}

function setOnlineDisplayedMatchScore(homeScore, awayScore) {
  els.onlineMatchScore.textContent = `${homeScore}–${awayScore}`;
}

function revealOnlineObservedPenaltyScore(event) {
  let homeScore = Number(els.onlineMatchPenaltyScore.dataset.homeScore || 0);
  let awayScore = Number(els.onlineMatchPenaltyScore.dataset.awayScore || 0);
  if (event.scored) {
    if (event.side === "home") homeScore += 1;
    else awayScore += 1;
  }
  setOnlineDisplayedPenaltyScore(homeScore, awayScore);
}

function onlineObservedPenaltyEventKey(match, event) {
  return `${match.id}:${event.id ?? event.sequence ?? `${event.side}:${event.round}`}`;
}

function onlineHiddenPenaltyEventKeys(matchId) {
  const keys = new Set(onlineObservedPenaltyQueue
    .filter((item) => item.matchId === matchId)
    .map((item) => onlineObservedPenaltyEventKey({ id: matchId }, item.event)));
  if (
    onlinePenaltyAnimation?.matchId === matchId
    && !onlinePenaltyAnimation.resultRevealed
    && onlinePenaltyAnimation.eventKey
  ) keys.add(onlinePenaltyAnimation.eventKey);
  return keys;
}

function queueOnlineObservedPenalty(match, event) {
  const memberId = onlineRoomSession?.memberId;
  const ownerId = latestOnlineRoom?.tournament?.teamOwnerById?.[event.teamId];
  if (!match || !event || ownerId === memberId) return;
  const eventKey = onlineObservedPenaltyEventKey(match, event);
  if (onlineObservedPenaltyIds.has(eventKey)) return;
  onlineObservedPenaltyIds.add(eventKey);
  onlineObservedPenaltyQueue.push({ matchId: match.id, event });
  void playOnlineObservedPenaltyQueue();
}

function onlinePenaltyAwardEvent(match, kickEvent) {
  if (kickEvent.type !== "penalty-kick") return null;
  const kickId = kickEvent.id || kickEvent.sequence || 0;
  return meaningfulOnlineEvents(match).toReversed().find((event) => (
    event.type === "penalty-awarded"
    && event.teamId === kickEvent.teamId
    && (event.id || event.sequence || 0) < kickId
    && Math.abs((event.minute || 0) - (kickEvent.minute || 0)) <= 1
  )) || null;
}

async function playOnlineObservedPenaltyQueue() {
  if (onlineObservedPenaltyPlaybackRunning || onlinePenaltyAnimation) return;
  onlineObservedPenaltyPlaybackRunning = true;
  try {
    while (onlineObservedPenaltyQueue.length && !onlinePenaltyAnimation) {
      const item = onlineObservedPenaltyQueue.shift();
      if (els.onlineCurrentMatch?.dataset.matchId !== item.matchId || els.onlineCurrentMatch.hidden) continue;
      const { event } = item;
      const match = latestOnlineRoom?.tournament?.rounds
        ?.flatMap((round) => round.matches)
        .find((candidate) => candidate.id === item.matchId);
      if (!match) continue;
      const target = event.target || "middle";
      const team = TEAM_BY_ID.get(event.teamId);
      const wideDirection = target.endsWith("right") ? "wide-right" : "wide-left";
      const shotDirection = onlinePenaltyDirection(target);
      const keeperDirection = onlinePenaltyDirection(event.goalkeeperTarget || "middle");
      const attempt = {
        direction: event.missType === "wide" ? wideDirection : shotDirection,
        keeperDive: event.scored
          ? distinctKeeperDiveForGoal(shotDirection, keeperDirection, event.round || 0)
          : keeperDirection,
        foot: "right",
        scored: Boolean(event.scored),
        missType: event.missType || (event.scored ? null : "save"),
      };
      onlinePenaltyAnimation = {
        matchId: item.matchId,
        target,
        observed: true,
        resultRevealed: false,
        eventKey: onlineObservedPenaltyEventKey(match, event),
        scoreBefore: event.scoreBefore || {
          home: event.side === "home" && event.scored ? Math.max(0, (event.homeScore || 0) - 1) : event.homeScore || 0,
          away: event.side === "away" && event.scored ? Math.max(0, (event.awayScore || 0) - 1) : event.awayScore || 0,
        },
      };
      els.onlinePenaltyControl.hidden = false;
      els.onlinePenaltyControl.classList.add("is-cpu-taking");
      els.onlinePenaltyScene.dataset.target = target;
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
      setPenaltySceneElement(els.onlinePenaltyScene, attempt, "setup");
      const awardEvent = onlinePenaltyAwardEvent(match, event);
      if (awardEvent) {
        els.onlinePenaltyPrompt.textContent = `Penalty to ${team?.name || "the attacking team"}`;
        els.onlinePenaltyFeedback.textContent = `${event.player || "The taker"} steps up`;
        if (onlineLivePresentation?.matchId === item.matchId) {
          renderOnlineCommentaryEvent(match, awardEvent);
        }
        await waitForOnlinePenaltyFrame(850);
      }
      els.onlinePenaltyPrompt.textContent = `${team?.name || "Opponent"} take`;
      els.onlinePenaltyFeedback.textContent = "Watch the penalty";
      await waitForOnlinePenaltyFrame(500);
      setPenaltySceneElement(els.onlinePenaltyScene, attempt, "flight");
      await waitForOnlinePenaltyFrame(650);
      setPenaltySceneElement(els.onlinePenaltyScene, attempt, "result");
      onlinePenaltyAnimation.resultRevealed = true;
      if (event.type === "shootout-kick") revealOnlineObservedPenaltyScore(event);
      else setOnlineDisplayedMatchScore(event.scoreAfter?.home ?? event.homeScore, event.scoreAfter?.away ?? event.awayScore);
      if (onlineLivePresentation?.matchId === item.matchId) {
        renderOnlineCommentaryEvent(onlineLivePresentation.match, event);
      }
      els.onlinePenaltyPrompt.textContent = event.scored ? "Goal" : event.missType === "wide" ? "Missed" : "Saved";
      els.onlinePenaltyFeedback.textContent = event.scored
        ? `${team?.name || "The opponent"} score.`
        : event.missType === "wide"
          ? "The kick goes wide."
          : "The goalkeeper makes the save.";
      await waitForOnlinePenaltyFrame(1600);
      onlinePenaltyAnimation = null;
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = onlineRoomBusy; });
      if (latestOnlineRoom && onlineRoomSession) renderOnlineLobby(latestOnlineRoom, onlineRoomSession.memberId);
    }
  } finally {
    onlineObservedPenaltyPlaybackRunning = false;
  }
}

async function takeOnlineInteractivePenalty(match, target) {
  if (onlineRoomBusy || !onlineRoomSession || onlinePenaltyAnimation) return;
  const takingTeamId = match.liveState?.pendingDecision?.teamId || match.penalty?.currentTeamId;
  const knownEventIds = new Set((match.events || []).map((event) => event.id ?? event.sequence));
  onlinePenaltyAnimation = {
    matchId: match.id,
    target,
    resultRevealed: false,
    scoreBefore: {
      home: match.liveState?.homeScore ?? match.homeScore ?? 0,
      away: match.liveState?.awayScore ?? match.awayScore ?? 0,
    },
  };
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  els.onlinePenaltyPrompt.textContent = "Taking penalty";
  els.onlinePenaltyFeedback.textContent = "The goalkeeper waits…";
  els.onlinePenaltyScene.dataset.target = target;
  els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/penalty-kick`, {
      method: "POST",
      body: { matchId: match.id, target, decisionId: match.liveState?.pendingDecision?.id || match.penalty?.decisionId },
    });
    const updatedMatch = payload.room.tournament?.rounds
      ?.flatMap((round) => round.matches)
      .find((item) => item.id === match.id);
    const freshPenaltyEvents = (updatedMatch?.events || []).filter((event) => (
      ["penalty-kick", "shootout-kick"].includes(event.type)
      && !knownEventIds.has(event.id ?? event.sequence)
    ));
    const kick = freshPenaltyEvents.find((event) => event.teamId === takingTeamId)
      || [...(updatedMatch?.penalty?.kicks || [])]
        .reverse()
        .find((item) => item.teamId === takingTeamId)
      || updatedMatch?.penalty?.kicks?.at(-1);
    if (!kick) throw new Error("The penalty result could not be loaded.");
    onlinePenaltyAnimation.eventKey = onlineObservedPenaltyEventKey(updatedMatch, kick);
    if (kick.scoreBefore) onlinePenaltyAnimation.scoreBefore = kick.scoreBefore;
    const opponentEvents = freshPenaltyEvents.filter((event) => (
      latestOnlineRoom?.tournament?.teamOwnerById?.[event.teamId] !== onlineRoomSession.memberId
    ));
    const shotDirection = onlinePenaltyDirection(kick.target);
    const keeperDirection = onlinePenaltyDirection(kick.goalkeeperTarget);
    const attempt = {
      direction: shotDirection,
      keeperDive: kick.scored ? distinctKeeperDiveForGoal(shotDirection, keeperDirection, kick.round || 0) : keeperDirection,
      foot: "right",
      scored: kick.scored,
      missType: kick.scored ? null : "save",
    };
    setPenaltySceneElement(els.onlinePenaltyScene, attempt, "setup");
    await waitForOnlinePenaltyFrame(80);
    setPenaltySceneElement(els.onlinePenaltyScene, attempt, "flight");
    await waitForOnlinePenaltyFrame(560);
    setPenaltySceneElement(els.onlinePenaltyScene, attempt, "result");
    onlinePenaltyAnimation.resultRevealed = true;
    if (kick.type === "shootout-kick") revealOnlineObservedPenaltyScore(kick);
    else setOnlineDisplayedMatchScore(
      kick.scoreAfter?.home ?? updatedMatch.liveState?.homeScore ?? kick.homeScore,
      kick.scoreAfter?.away ?? updatedMatch.liveState?.awayScore ?? kick.awayScore,
    );
    if (onlineLivePresentation?.matchId === match.id) renderOnlineCommentaryEvent(updatedMatch, kick);
    opponentEvents.forEach((event) => queueOnlineObservedPenalty(updatedMatch, event));
    els.onlinePenaltyPrompt.textContent = kick.scored ? "Goal" : "Saved";
    els.onlinePenaltyFeedback.textContent = kick.scored ? "Perfectly placed." : "The goalkeeper got there.";
    await waitForOnlinePenaltyFrame(1400);
    onlinePenaltyAnimation = null;
    renderOnlineLobby(payload.room, payload.memberId);
    void playOnlineObservedPenaltyQueue();
  } catch (error) {
    onlinePenaltyAnimation = null;
    setOnlineRoomMessage(error.message, true);
    if (latestOnlineRoom) renderOnlineLobby(latestOnlineRoom, onlineRoomSession.memberId);
  } finally {
    els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = false; });
    setOnlineRoomBusy(false);
    void playOnlineObservedPenaltyQueue();
  }
}

function setOnlineRouletteSearching(member, room, draft) {
  const round = Math.floor((draft?.turnIndex || 0) / Math.max(1, room.members.length)) + 1;
  els.onlineRoulettePlayer.textContent = `${member?.name || "Player"} · Round ${round}`;
  els.onlineRouletteFlag.textContent = "?";
  els.onlineRouletteTeam.textContent = "Country incoming";
  els.onlineRouletteMeta.textContent = "Searching the remaining countries…";
  els.onlineRoulette.classList.remove("is-revealed");
}

function showOnlineRouletteFrame(member, team, roundNumber) {
  els.onlineRoulettePlayer.textContent = `${member?.name || "Player"} · Round ${roundNumber}`;
  els.onlineRouletteFlag.innerHTML = flagMarkup(team, "roulette-country-flag");
  els.onlineRouletteTeam.textContent = team.name;
  els.onlineRouletteMeta.textContent = "Drawing…";
}

function showOnlineRouletteResult(member, team, pick) {
  els.onlineRoulettePlayer.textContent = `${member?.name || "Player"} receives`;
  els.onlineRouletteFlag.innerHTML = flagMarkup(team, "roulette-country-flag");
  els.onlineRouletteTeam.textContent = team.name;
  els.onlineRouletteMeta.textContent = team.officialFifaRank ? `FIFA #${team.officialFifaRank} · Pick ${pick.pickNumber}` : `Guest team · Pick ${pick.pickNumber}`;
  els.onlineRoulette.classList.remove("is-spinning");
  els.onlineRoulette.classList.add("is-revealed");
}

const ONLINE_DRAFT_FRAME_MS = 72;
const ONLINE_DRAFT_FRAME_COUNT = 11;
const ONLINE_DRAFT_REVEAL_MS = 450;

function onlineDraftTurnStart(draft) {
  if (!draft?.turnIndex) return Number(draft?.startedAt) || onlineServerNow();
  const previousPick = draft.picks?.[draft.turnIndex - 1];
  return (Number(previousPick?.pickedAt) || onlineServerNow()) + ONLINE_DRAFT_REVEAL_MS;
}

function onlineDraftFrameTeam(available, roomCode, turnIndex, frame) {
  if (!available.length) return TEAMS[0];
  const seed = `${roomCode}:${turnIndex}:${frame}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return available[(hash >>> 0) % available.length];
}

async function waitForOnlineDraftDeadline(deadline, runId) {
  while (onlineServerNow() < deadline) {
    if (runId !== onlineDraftRunId || els.onlineRoomScreen.hidden) return false;
    await waitForDraftBeat(Math.min(80, Math.max(8, deadline - onlineServerNow())));
  }
  return runId === onlineDraftRunId && !els.onlineRoomScreen.hidden;
}

async function animateOnlineRoulette(member, room, draft, runId) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const claimed = new Set((draft.picks || []).map((pick) => pick.teamId));
  const eligible = TEAMS;
  const ranked = eligible
    .filter((team) => Number.isInteger(team.officialFifaRank))
    .toSorted((a, b) => a.officialFifaRank - b.officialFifaRank);
  const playerCount = room.members.length;
  const roundIndex = Math.floor(draft.turnIndex / playerCount);
  const greatTeams = ranked.filter((team) => team.officialFifaRank <= 20);
  const midTeams = ranked.filter((team) => team.officialFifaRank >= 40 && team.officialFifaRank <= 90);
  const lowerTeams = eligible.filter((team) => !team.officialFifaRank || team.officialFifaRank >= 120);
  const drawPool = roundIndex === 0
    ? greatTeams
    : roundIndex <= 2
      ? midTeams
      : lowerTeams;
  const available = drawPool.filter((team) => !claimed.has(team.id));
  const roundNumber = Math.floor(draft.turnIndex / room.members.length) + 1;
  const turnStartedAt = onlineDraftTurnStart(draft);
  const animationEndsAt = turnStartedAt + (ONLINE_DRAFT_FRAME_COUNT * ONLINE_DRAFT_FRAME_MS);
  els.onlineRoulette.classList.remove("is-revealed");
  els.onlineRoulette.classList.add("is-spinning");
  const firstFrame = Math.max(0, Math.floor((onlineServerNow() - turnStartedAt) / ONLINE_DRAFT_FRAME_MS));
  for (let frame = firstFrame; frame < ONLINE_DRAFT_FRAME_COUNT; frame += 1) {
    const frameAt = turnStartedAt + (frame * ONLINE_DRAFT_FRAME_MS);
    if (!await waitForOnlineDraftDeadline(frameAt, runId)) return false;
    if (!reduceMotion || frame === firstFrame || frame === ONLINE_DRAFT_FRAME_COUNT - 1) {
      showOnlineRouletteFrame(member, onlineDraftFrameTeam(available, room.code, draft.turnIndex, frame), roundNumber);
    }
  }
  if (!await waitForOnlineDraftDeadline(animationEndsAt, runId)) return false;
  return true;
}

async function commitOnlineDraftTurn(room) {
  const expectedTurnIndex = room.draft.turnIndex;
  const clientCommandId = makeOnlineCommandId();
  try {
    return await roomApi(`/api/rooms/${onlineRoomSession.code}/draft-draw`, {
      method: "POST",
      body: { expectedTurnIndex, clientCommandId },
      timeoutMs: 12000,
    });
  } catch (drawError) {
    // The pick may have committed even if its response was lost. Reconcile before retrying.
    const snapshot = await roomApi(`/api/rooms/${onlineRoomSession.code}`, { timeoutMs: 8000 });
    const serverDraft = snapshot.room.draft;
    if (snapshot.room.status !== "draft" || serverDraft?.turnIndex > expectedTurnIndex) return snapshot;
    throw drawError;
  }
}

async function runOnlineSnakeDraft(initialRoom) {
  if (onlineDraftRunning || !onlineRoomSession?.isHost || initialRoom.draft?.status !== "active") return;
  onlineDraftRunning = true;
  const runId = ++onlineDraftRunId;
  let room = initialRoom;
  try {
    while (room.draft?.status === "active" && runId === onlineDraftRunId && !els.onlineRoomScreen.hidden) {
      const member = room.members.find((item) => item.id === room.draft.currentMemberId);
      const animated = await animateOnlineRoulette(member, room, room.draft, runId);
      if (!animated) break;
      const payload = await commitOnlineDraftTurn(room);
      room = payload.room;
      latestOnlineRoom = room;
      const pick = room.draft.picks.at(-1);
      showOnlineRouletteResult(room.members.find((item) => item.id === pick.memberId), TEAM_BY_ID.get(pick.teamId), pick);
      renderOnlineDraft(room, payload.memberId);
      await waitForOnlineDraftDeadline(Number(pick.pickedAt) + ONLINE_DRAFT_REVEAL_MS, runId);
    }
    if (room.draft?.status === "complete") {
      showToast("Draft complete. Five countries each.");
      await waitForDraftBeat(550);
      renderOnlineLobby(room, onlineRoomSession.memberId);
    }
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    onlineDraftRunning = false;
    if (latestOnlineRoom?.draft?.status === "active" && onlineRoomSession?.isHost && !els.onlineRoomScreen.hidden) {
      setTimeout(() => runOnlineSnakeDraft(latestOnlineRoom), 500);
    }
  }
}

async function runOnlineDraftSpectator(initialRoom) {
  if (onlineDraftRunning || onlineRoomSession?.isHost || initialRoom.draft?.status !== "active") return;
  onlineDraftRunning = true;
  const runId = ++onlineDraftRunId;
  let room = initialRoom;
  try {
    while (room.draft?.status === "active" && runId === onlineDraftRunId && !els.onlineRoomScreen.hidden) {
      const watchedTurn = room.draft.turnIndex;
      const member = room.members.find((item) => item.id === room.draft.currentMemberId);
      const animated = await animateOnlineRoulette(member, room, room.draft, runId);
      if (!animated) break;
      let payload = await roomApi(`/api/rooms/${onlineRoomSession.code}`);
      room = payload.room;
      if (room.draft.turnIndex === watchedTurn) {
        await waitForDraftBeat(220);
        continue;
      }
      latestOnlineRoom = room;
      const pick = room.draft.picks.at(-1);
      showOnlineRouletteResult(room.members.find((item) => item.id === pick.memberId), TEAM_BY_ID.get(pick.teamId), pick);
      renderOnlineDraft(room, payload.memberId);
      await waitForOnlineDraftDeadline(Number(pick.pickedAt) + ONLINE_DRAFT_REVEAL_MS, runId);
    }
    if (room.draft?.status === "complete") {
      await waitForDraftBeat(550);
      renderOnlineLobby(room, onlineRoomSession.memberId);
    }
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    onlineDraftRunning = false;
    if (latestOnlineRoom?.draft?.status === "active" && !onlineRoomSession?.isHost && !els.onlineRoomScreen.hidden) {
      setTimeout(() => runOnlineDraftSpectator(latestOnlineRoom), 500);
    }
  }
}

function stopOnlineDraftRun() {
  onlineDraftRunId += 1;
  onlineDraftRunning = false;
  els.onlineRoulette?.classList.remove("is-spinning");
}

function waitForDraftBeat(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function startOnlineDraft() {
  if (!onlineRoomSession?.isHost || onlineRoomBusy) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/draft-start`, { method: "POST" });
    setOnlineRoomBusy(false);
    renderOnlineLobby(payload.room, payload.memberId);
  } catch (error) {
    if (error.status === 409) {
      try {
        const snapshot = await roomApi(`/api/rooms/${onlineRoomSession.code}`);
        renderOnlineLobby(snapshot.room, snapshot.memberId);
        return;
      } catch {
        // Show the original conflict when reconciliation also fails.
      }
    }
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function restartOnlineLobby() {
  if (!onlineRoomSession?.isHost || onlineRoomBusy) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/rematch`, { method: "POST" });
    onlineRoomEvents.clear();
    onlineRoomStateVersion = 0;
    onlineLastSeenEventId = 0;
    onlineViewedMatchId = null;
    onlineSpectatingMemberId = null;
    renderOnlineLobby(payload.room, payload.memberId);
    showToast("Same lobby ready for a new tournament.");
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

function leaveOrCloseCompletedOnlineRoom() {
  if (onlineRoomSession?.isHost) closeOnlineRoom();
  else leaveOnlineRoom();
}

async function roomApi(path, { method = "GET", body, token = onlineRoomSession?.token, timeoutMs = 15000 } = {}) {
  const mutating = !["GET", "HEAD"].includes(method);
  const requestBody = mutating ? { ...(body || {}), clientCommandId: body?.clientCommandId || makeOnlineCommandId() } : body;
  const headers = { Accept: "application/json" };
  if (requestBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });
  } catch {
    throw new OnlineRoomError("Could not reach the room service. Check your connection.", 0);
  } finally {
    clearTimeout(timeout);
  }
  const isJson = (response.headers.get("Content-Type") || "").toLowerCase().includes("application/json");
  if (!isJson) {
    throw new OnlineRoomError("Online rooms are not available on this version of the site yet.", response.status);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new OnlineRoomError(onlineRoomErrorMessage(payload.error), response.status);
  return applyOnlineRoomPayload(payload);
}

async function submitBugReport(event) {
  event.preventDefault();
  const message = els.bugReportMessage.value.trim();
  if (!message) {
    els.bugReportStatus.textContent = "Write a quick note first.";
    els.bugReportMessage.focus();
    return;
  }

  els.bugReportSubmit.disabled = true;
  els.bugReportStatus.textContent = "Sending...";
  try {
    const response = await fetch("/api/bug-report", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        path: window.location.pathname + window.location.search,
      }),
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not send that yet.");
    els.bugReportForm.reset();
    els.bugReportStatus.textContent = "Sent. Thank you.";
    showToast("Anonymous feedback sent.");
    setTimeout(() => {
      if (els.bugReportModal?.open) els.bugReportModal.close();
    }, 700);
  } catch (error) {
    els.bugReportStatus.textContent = error.message || "Could not send that yet.";
  } finally {
    els.bugReportSubmit.disabled = false;
  }
}

function applyOnlineRoomPayload(payload) {
  if (!payload || !payload.mode) return payload;
  if (Number.isFinite(Number(payload.serverNow))) {
    const sampleOffset = Number(payload.serverNow) - Date.now();
    onlineServerOffsetMs = onlineServerOffsetReady
      ? onlineServerOffsetMs * 0.8 + sampleOffset * 0.2
      : sampleOffset;
    onlineServerOffsetReady = true;
  }
  const incomingStateVersion = Number(payload.stateVersion);
  const incomingLastEventId = Number(payload.lastEventId);
  const payloadRoomCode = payload.room?.code || latestOnlineRoom?.code;
  const sameRoom = Boolean(latestOnlineRoom) && payloadRoomCode === latestOnlineRoom.code;
  const stalePayload = sameRoom && (
    (Number.isFinite(incomingStateVersion) && incomingStateVersion < onlineRoomStateVersion)
    || (
      Number.isFinite(incomingStateVersion)
      && incomingStateVersion === onlineRoomStateVersion
      && Number.isFinite(incomingLastEventId)
      && incomingLastEventId < onlineLastSeenEventId
    )
  );
  if (stalePayload) {
    return {
      ...payload,
      mode: "noop",
      room: latestOnlineRoom,
      events: [],
      stateVersion: onlineRoomStateVersion,
      lastEventId: onlineLastSeenEventId,
    };
  }
  (payload.events || []).forEach((event) => {
    if (Number.isInteger(event.id)) onlineRoomEvents.set(event.id, event);
  });
  if (payload.mode === "snapshot" && payload.room) {
    latestOnlineRoom = payload.room;
  } else if (payload.mode === "delta" && latestOnlineRoom) {
    if (payload.roomPatch?.status) latestOnlineRoom.status = payload.roomPatch.status;
    if (payload.roomPatch?.members) latestOnlineRoom.members = payload.roomPatch.members;
    if (latestOnlineRoom.tournament) {
      latestOnlineRoom.tournament.status = payload.roomPatch?.tournamentStatus || latestOnlineRoom.tournament.status;
      latestOnlineRoom.tournament.roundNumber = payload.roomPatch?.roundNumber || latestOnlineRoom.tournament.roundNumber;
      if ("championTeamId" in (payload.roomPatch || {})) latestOnlineRoom.tournament.championTeamId = payload.roomPatch.championTeamId;
      if ("completedAt" in (payload.roomPatch || {})) latestOnlineRoom.tournament.completedAt = payload.roomPatch.completedAt;
      if ("completionReason" in (payload.roomPatch || {})) latestOnlineRoom.tournament.completionReason = payload.roomPatch.completionReason;
      if (payload.roomPatch?.tacticsByTeam) latestOnlineRoom.tournament.tacticsByTeam = payload.roomPatch.tacticsByTeam;
      if (payload.roomPatch?.currentRound) {
        const roundIndex = latestOnlineRoom.tournament.rounds.findIndex((round) => round.number === payload.roomPatch.currentRound.number);
        if (roundIndex >= 0) latestOnlineRoom.tournament.rounds[roundIndex] = payload.roomPatch.currentRound;
        else latestOnlineRoom.tournament.rounds.push(payload.roomPatch.currentRound);
      }
      (payload.matches || []).forEach((changedMatch) => {
        let target = latestOnlineRoom.tournament.rounds
          .flatMap((round) => round.matches).find((match) => match.id === changedMatch.id);
        if (target) Object.assign(target, changedMatch);
        else {
          let round = latestOnlineRoom.tournament.rounds.find((item) => item.number === changedMatch.roundNumber);
          if (!round) {
            round = { number: changedMatch.roundNumber, matches: [] };
            latestOnlineRoom.tournament.rounds.push(round);
          }
          round.matches.push(changedMatch);
          target = changedMatch;
        }
      });
    }
    payload.room = latestOnlineRoom;
  } else if (payload.mode === "noop") {
    payload.room = latestOnlineRoom;
  }
  onlineRoomStateVersion = Number.isFinite(incomingStateVersion)
    ? Math.max(onlineRoomStateVersion, incomingStateVersion)
    : onlineRoomStateVersion;
  onlineLastSeenEventId = Number.isFinite(incomingLastEventId)
    ? Math.max(onlineLastSeenEventId, incomingLastEventId)
    : onlineLastSeenEventId;
  if (payload.room) hydrateOnlineRoomEvents(payload.room);
  return payload;
}

function hydrateOnlineRoomEvents(room) {
  const byMatch = new Map();
  [...onlineRoomEvents.values()].forEach((event) => {
    if (!event.matchId) return;
    if (!byMatch.has(event.matchId)) byMatch.set(event.matchId, []);
    byMatch.get(event.matchId).push(event);
  });
  room.tournament?.rounds.forEach((round) => round.matches.forEach((match) => {
    const events = (byMatch.get(match.id) || []).toSorted((a, b) => a.id - b.id);
    match.events = match.liveState?.simulationVersion === 2
      ? events
      : events.filter((event) => ["goal", "penalty-kick"].includes(event.type)).map((event) => ({
        ...event,
        scored: event.type === "goal" || event.scored,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
      }));
    if (match.penalty) {
      match.penalty.kicks = events.filter((event) => event.type === "shootout-kick").map((event) => ({
        teamId: event.teamId,
        target: event.target,
        goalkeeperTarget: event.goalkeeperTarget,
        scored: event.scored,
        missType: event.missType,
      }));
    }
  }));
}

function makeOnlineAccessToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function makeOnlineCommandId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function makeOnlineRoomCode() {
  const values = new Uint32Array(1);
  const usableRange = 0x1_0000_0000 - (0x1_0000_0000 % 10_000);
  do crypto.getRandomValues(values); while (values[0] >= usableRange);
  return String(values[0] % 10_000).padStart(4, "0");
}

function onlineRoomInviteUrl(code) {
  const inviteUrl = new URL(APP_MODE_PATHS.online, window.location.origin);
  inviteUrl.searchParams.set("room", normalizeOnlineRoomCode(code));
  return inviteUrl.href;
}

async function copyOnlineText(value, successMessage, fallbackMessage) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(successMessage);
  } catch {
    const input = document.createElement("input");
    input.value = value;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (copied) showToast(successMessage);
    else setOnlineRoomMessage(fallbackMessage, true);
  }
}

function onlineRoomErrorMessage(error) {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error.message === "string" && error.message.trim()) return error.message;
  return "The room request failed. Please try again.";
}

function setOnlineDisplayNames(name) {
  els.onlineDisplayName.value = name;
  els.onlineLobbyDisplayName.value = name;
  saveOnlineDisplayName(name);
}

function saveOnlineDisplayName(name) {
  try {
    if (name) localStorage.setItem(ONLINE_DISPLAY_NAME_KEY, name);
    else localStorage.removeItem(ONLINE_DISPLAY_NAME_KEY);
  } catch {
    // The room flow still works when persistent storage is unavailable.
  }
}

function readSavedOnlineDisplayName() {
  try {
    return localStorage.getItem(ONLINE_DISPLAY_NAME_KEY) || "";
  } catch {
    return "";
  }
}

function readOnlineDisplayName(input) {
  const name = input.value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  input.value = name;
  if (!name) {
    setOnlineRoomMessage("Enter a display name for this player.", true);
    input.focus();
    return null;
  }
  if (name.length > 24 || !/^[\p{L}\p{N} ._'-]+$/u.test(name)) {
    setOnlineRoomMessage("Use up to 24 letters, numbers, spaces, apostrophes, dots, dashes or underscores.", true);
    input.focus();
    return null;
  }
  return name;
}

async function createOnlineRoom() {
  if (onlineRoomBusy) return;
  const name = readOnlineDisplayName(els.onlineDisplayName);
  if (!name) return;
  setOnlineDisplayNames(name);
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const accessToken = makeOnlineAccessToken();
    let payload;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        payload = await roomApi("/api/rooms", {
          method: "POST",
          body: { name, accessToken, roomCode: makeOnlineRoomCode() },
          token: null,
        });
        break;
      } catch (error) {
        if (error?.status !== 409 || attempt === 7) throw error;
      }
    }
    if (!payload) throw new Error("Could not reserve a room code. Please try again.");
    saveOnlineRoomSession({
      code: payload.room.code,
      token: accessToken,
      memberId: payload.memberId,
      isHost: true,
      name,
    });
    showOnlineLobbyShell();
    renderOnlineLobby(payload.room, payload.memberId);
    showToast(`Room ${payload.room.code} created.`);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function startOnlineMatchmaking() {
  if (onlineMatchmakingBusy || onlineMatchmakingSession || onlineRoomSession) return;
  const name = readOnlineDisplayName(els.onlineDisplayName);
  if (!name) return;
  setOnlineDisplayNames(name);
  onlineMatchmakingBusy = true;
  setOnlineRoomMessage();
  renderOnlineMatchmakingState();
  try {
    const accessToken = makeOnlineAccessToken();
    const payload = await roomApi("/api/matchmaking", {
      method: "POST",
      body: { name, accessToken },
      token: null,
    });
    saveOnlineMatchmakingSession({
      ticketId: payload.ticketId,
      token: accessToken,
      name,
      joinedAt: payload.joinedAt || Date.now(),
    });
    renderOnlineMatchmakingState(payload);
    if (payload.status === "matched") {
      await enterMatchedOnlineRoom(payload);
    } else {
      startOnlineMatchmakingPolling();
    }
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    onlineMatchmakingBusy = false;
    renderOnlineMatchmakingState();
  }
}

async function enterMatchedOnlineRoom(payload) {
  const session = onlineMatchmakingSession;
  const assignment = payload?.room;
  if (!session || !assignment?.code || !assignment?.memberId) return;
  stopOnlineMatchmakingPolling();
  saveOnlineRoomSession({
    code: assignment.code,
    token: session.token,
    memberId: assignment.memberId,
    isHost: Boolean(assignment.isHost),
    name: session.name,
    matchmaking: true,
  });
  saveOnlineMatchmakingSession(null);
  showOnlineLobbyShell();
  await refreshOnlineRoom();
  showToast("Opponent found. Your country draft is ready.");
}

async function refreshOnlineMatchmaking({ quiet = false } = {}) {
  if (!onlineMatchmakingSession) return;
  if (onlineMatchmakingRefreshPromise) return onlineMatchmakingRefreshPromise;
  const session = { ...onlineMatchmakingSession };
  onlineMatchmakingRefreshPromise = (async () => {
    try {
      const payload = await roomApi(`/api/matchmaking/${session.ticketId}`, {
        token: session.token,
      });
      if (
        onlineMatchmakingSession?.ticketId !== session.ticketId
        || els.onlineRoomScreen.hidden
      ) return;
      renderOnlineMatchmakingState(payload);
      if (payload.status === "matched") await enterMatchedOnlineRoom(payload);
    } catch (error) {
      if ([404, 410].includes(error.status) && onlineMatchmakingSession?.ticketId === session.ticketId) {
        saveOnlineMatchmakingSession(null);
        setOnlineRoomMessage("That search ended. Start a new search when you’re ready.", true);
        return;
      }
      if (!quiet) setOnlineRoomMessage(error.message, true);
    }
  })().finally(() => {
    onlineMatchmakingRefreshPromise = null;
  });
  return onlineMatchmakingRefreshPromise;
}

function startOnlineMatchmakingPolling() {
  stopOnlineMatchmakingPolling();
  const poll = async () => {
    if (!onlineMatchmakingSession || els.onlineRoomScreen.hidden || document.hidden) return;
    await refreshOnlineMatchmaking({ quiet: true });
    if (onlineMatchmakingSession) onlineMatchmakingPollTimer = setTimeout(poll, 1500);
  };
  onlineMatchmakingPollTimer = setTimeout(poll, 600);
}

function stopOnlineMatchmakingPolling() {
  clearTimeout(onlineMatchmakingPollTimer);
  onlineMatchmakingPollTimer = null;
}

async function cancelOnlineMatchmaking({ quiet = false } = {}) {
  if (!onlineMatchmakingSession || onlineMatchmakingBusy) return;
  const session = { ...onlineMatchmakingSession };
  onlineMatchmakingBusy = true;
  stopOnlineMatchmakingPolling();
  renderOnlineMatchmakingState();
  try {
    await roomApi(`/api/matchmaking/${session.ticketId}/cancel`, {
      method: "POST",
      token: session.token,
    });
  } catch (error) {
    if (!quiet && error.status !== 409) setOnlineRoomMessage(error.message, true);
    if (error.status === 409) {
      onlineMatchmakingBusy = false;
      await refreshOnlineMatchmaking();
      return;
    }
  }
  if (onlineMatchmakingSession?.ticketId === session.ticketId) {
    saveOnlineMatchmakingSession(null);
    if (!quiet) setOnlineRoomMessage("Matchmaking cancelled.");
  }
  onlineMatchmakingBusy = false;
  renderOnlineMatchmakingState();
}

async function joinOnlineRoom() {
  if (onlineRoomBusy) return;
  const name = readOnlineDisplayName(els.onlineDisplayName);
  if (!name) return;
  setOnlineDisplayNames(name);
  const code = normalizeOnlineRoomCode(els.onlineRoomCodeInput.value);
  els.onlineRoomCodeInput.value = code;
  if (!/^(?:\d{4}|[A-HJ-NP-Z2-9]{6})$/.test(code)) {
    setOnlineRoomMessage("Enter the four-digit room code.", true);
    els.onlineRoomCodeInput.focus();
    return;
  }
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const accessToken = makeOnlineAccessToken();
    const payload = await roomApi(`/api/rooms/${code}/join`, { method: "POST", body: { name, accessToken }, token: null });
    saveOnlineRoomSession({
      code,
      token: accessToken,
      memberId: payload.memberId,
      isHost: false,
      name,
    });
    showOnlineLobbyShell();
    renderOnlineLobby(payload.room, payload.memberId);
    showToast(`Joined room ${code}.`);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function updateOnlineDisplayName() {
  if (!onlineRoomSession || onlineRoomBusy || latestOnlineRoom?.status !== "lobby") return;
  const name = readOnlineDisplayName(els.onlineLobbyDisplayName);
  if (!name) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/rename`, {
      method: "POST",
      body: { name },
    });
    saveOnlineRoomSession({ ...onlineRoomSession, name });
    setOnlineDisplayNames(name);
    renderOnlineLobby(payload.room, payload.memberId);
    showToast("Name updated.");
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function refreshOnlineRoom({ quiet = false } = {}) {
  if (!onlineRoomSession) return;
  if (onlineRoomRefreshPromise) return onlineRoomRefreshPromise;
  const session = { ...onlineRoomSession };
  onlineRoomRefreshPromise = (async () => {
    try {
      const query = onlineRoomStateVersion
        ? `?afterStateVersion=${onlineRoomStateVersion}&lastSeenEventId=${onlineLastSeenEventId}`
        : "";
      const payload = await roomApi(`/api/rooms/${session.code}${query}`, { token: session.token });
      if (
        payload.room
        && onlineRoomSession?.code === session.code
        && onlineRoomSession?.token === session.token
        && !els.onlineRoomScreen.hidden
      ) renderOnlineLobby(payload.room, payload.memberId);
    } catch (error) {
      if ([401, 404].includes(error.status) && onlineRoomSession?.code === session.code) {
        const previousName = session.name || "";
        saveOnlineRoomSession(null);
        setOnlineDisplayNames(previousName);
        showOnlineRoomEntry(true);
        setOnlineRoomMessage("That room has closed or expired.", true);
        return;
      }
      if (!quiet) setOnlineRoomMessage(error.message, true);
    }
  })().finally(() => {
    onlineRoomRefreshPromise = null;
  });
  return onlineRoomRefreshPromise;
}

function startOnlineRoomPolling() {
  stopOnlineRoomPolling();
  const poll = async () => {
    if (!onlineRoomSession || els.onlineRoomScreen.hidden || document.hidden) return;
    await refreshOnlineRoom({ quiet: true });
    onlineRoomPollTimer = setTimeout(poll, onlinePollingInterval());
  };
  onlineRoomPollTimer = setTimeout(poll, onlinePollingInterval());
}

function onlinePollingInterval() {
  if (latestOnlineRoom?.status === "draft") return 600;
  if (!latestOnlineRoom || latestOnlineRoom.status === "lobby") return 1500;
  const matches = latestOnlineRoom?.tournament?.rounds
    ?.flatMap((round) => round.matches) || [];
  const viewedMatch = matches.find((match) => match.id === onlineViewedMatchId);
  if (
    viewedMatch?.liveState
    && !["waiting", "finished"].includes(viewedMatch.liveState.status)
    && !onlineMemberOwnsMatch(latestOnlineRoom?.tournament, onlineRoomSession?.memberId, viewedMatch)
  ) return 500;
  const pending = matches
    .some((match) => match.liveState?.pendingDecision?.memberId === onlineRoomSession?.memberId);
  if (pending) return 500;
  const hasActiveProgressiveMatch = matches.some((match) => (
    match.simulationVersion === 2
    && match.liveState
    && !["waiting", "finished"].includes(match.liveState.status)
  ));
  if (onlineMatchPlayback || hasActiveProgressiveMatch) return 750;
  return 4000;
}

function stopOnlineRoomPolling() {
  clearTimeout(onlineRoomPollTimer);
  onlineRoomPollTimer = null;
}

async function leaveOnlineRoom() {
  if (!onlineRoomSession || onlineRoomBusy) return;
  const session = { ...onlineRoomSession };
  setOnlineRoomBusy(true);
  let leaveError = null;
  try {
    await roomApi(`/api/rooms/${session.code}/leave`, { method: "POST", token: session.token });
  } catch (error) {
    leaveError = error;
  } finally {
    saveOnlineRoomSession(null);
    setOnlineDisplayNames(session.name || "");
    showOnlineRoomEntry();
    setOnlineRoomBusy(false);
  }
  showToast(leaveError ? "Left this room on this device." : "You left the online room.");
}

async function closeOnlineRoom() {
  if (!onlineRoomSession?.isHost || onlineRoomBusy) return;
  if (!window.confirm("Close this room for everyone? This cannot be undone.")) return;
  setOnlineRoomBusy(true);
  try {
    await roomApi(`/api/rooms/${onlineRoomSession.code}`, { method: "DELETE" });
    const previousName = onlineRoomSession.name || "";
    saveOnlineRoomSession(null);
    setOnlineDisplayNames(previousName);
    showOnlineRoomEntry();
    showToast("Online room closed.");
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

function normalizeOnlineRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-HJ-NP-Z0-9]/g, "").slice(0, 6);
}

class OnlineRoomError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function audioIsEnabled() {
  return Boolean(matchSoundsAreEnabled() && !document.hidden);
}
