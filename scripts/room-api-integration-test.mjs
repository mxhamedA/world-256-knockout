import assert from "node:assert/strict";
import { DRAFT_TEAMS } from "../draft-team-catalog.generated.mjs";

const baseUrl = process.env.ONLINE_ROOM_TEST_URL || "http://127.0.0.1:8791";
let hostSession = null;

async function request(path, { method = "GET", body, token, origin } = {}) {
  const mutating = !["GET", "HEAD"].includes(method);
  const accessToken = body?.accessToken || (mutating && (path === "/api/rooms" || path.endsWith("/join"))
    ? Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url")
    : undefined);
  const requestBody = mutating ? {
    ...(body || {}),
    clientCommandId: body?.clientCommandId || crypto.randomUUID(),
    ...(path === "/api/rooms" && !body?.roomCode
      ? { roomCode: String(crypto.getRandomValues(new Uint16Array(1))[0] % 10_000).padStart(4, "0") }
      : {}),
    ...(accessToken ? { accessToken } : {}),
  } : body;
  const headers = { Accept: "application/json" };
  if (requestBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: requestBody ? JSON.stringify(requestBody) : undefined,
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  return { response, payload, accessToken, requestBody };
}

try {
  const crossOrigin = await request("/api/rooms", {
    method: "POST",
    body: { name: "Blocked" },
    origin: "https://attacker.invalid",
  });
  assert.equal(crossOrigin.response.status, 403);

  const invalidName = await request("/api/rooms", { method: "POST", body: { name: "<script>" } });
  assert.equal(invalidName.response.status, 400);

  const created = await request("/api/rooms", { method: "POST", body: { name: "Host" } });
  assert.equal(created.response.status, 201);
  assert.match(created.payload.room.code, /^\d{4}$/);
  assert.match(created.accessToken, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(created.payload.room.memberCount, 1);
  assert.equal(created.payload.room.maxMembers, 8);
  assert.equal(created.payload.room.picksPerMember, 5);
  assert.equal(created.payload.room.members.filter((member) => member.isCpu).length, 0);
  assert.equal("tokenHash" in created.payload.room.members[0], false);
  hostSession = { code: created.payload.room.code, token: created.accessToken, memberId: created.payload.memberId };

  const replayedCreate = await request("/api/rooms", {
    method: "POST",
    body: created.requestBody,
  });
  assert.equal(replayedCreate.response.status, 201, "Creating with the same command must be idempotent.");
  assert.equal(replayedCreate.payload.room.code, created.payload.room.code);
  assert.equal(replayedCreate.payload.memberId, created.payload.memberId);
  const conflictingCreate = await request("/api/rooms", {
    method: "POST",
    body: { ...created.requestBody, name: "Different Host" },
  });
  assert.equal(conflictingCreate.response.status, 409, "A command ID cannot be reused with different data.");

  const unauthenticated = await request(`/api/rooms/${hostSession.code}`);
  assert.equal(unauthenticated.response.status, 401);

  const joined = await request(`/api/rooms/${hostSession.code}/join`, {
    method: "POST",
    body: { name: "Guest" },
  });
  assert.equal(joined.response.status, 201);
  assert.equal(joined.payload.room.memberCount, 2);
  assert.notEqual(joined.accessToken, hostSession.token);

  const sharedIpPolling = await Promise.all(Array.from({ length: 320 }, (_, index) => request(
    `/api/rooms/${hostSession.code}`,
    { token: index % 2 ? hostSession.token : joined.accessToken },
  )));
  assert.ok(
    sharedIpPolling.every(({ response }) => response.status === 200),
    "Players sharing one IP address must have independent authenticated polling limits.",
  );

  const renamed = await request(`/api/rooms/${hostSession.code}/rename`, {
    method: "POST",
    token: joined.accessToken,
    body: { name: "Guest Two" },
  });
  assert.equal(renamed.response.status, 200);
  assert.equal(renamed.payload.room.members.find((member) => member.id === joined.payload.memberId).name, "Guest Two");

  const duplicateName = await request(`/api/rooms/${hostSession.code}/rename`, {
    method: "POST",
    token: joined.accessToken,
    body: { name: "Host" },
  });
  assert.equal(duplicateName.response.status, 409);

  const guestStatus = await request(`/api/rooms/${hostSession.code}`, { token: joined.accessToken });
  assert.equal(guestStatus.response.status, 200);
  assert.equal(guestStatus.payload.room.members.length, 2);
  assert.equal(JSON.stringify(guestStatus.payload).includes(hostSession.token), false);

  const guestClose = await request(`/api/rooms/${hostSession.code}`, {
    method: "DELETE",
    token: joined.accessToken,
  });
  assert.equal(guestClose.response.status, 403);

  const leaver = await request(`/api/rooms/${hostSession.code}/join`, {
    method: "POST",
    body: { name: "Leaver" },
  });
  assert.equal(leaver.response.status, 201);
  assert.equal(leaver.payload.room.memberCount, 3);

  const left = await request(`/api/rooms/${hostSession.code}/leave`, {
    method: "POST",
    token: leaver.accessToken,
  });
  assert.equal(left.response.status, 200);

  const hostStatus = await request(`/api/rooms/${hostSession.code}`, { token: hostSession.token });
  assert.equal(hostStatus.payload.room.memberCount, 2);

  const unauthorisedDraft = await request(`/api/rooms/${hostSession.code}/draft-start`, { method: "POST" });
  assert.equal(unauthorisedDraft.response.status, 401);

  const startedDraft = await request(`/api/rooms/${hostSession.code}/draft-start`, {
    method: "POST",
    token: hostSession.token,
  });
  assert.equal(startedDraft.response.status, 200);
  assert.equal(startedDraft.payload.room.status, "draft");
  assert.equal(startedDraft.payload.room.draft.picksPerMember, 5);
  assert.equal(startedDraft.payload.room.draft.totalPicks, 10);
  assert.equal(new Set(startedDraft.payload.room.draft.baseOrder).size, 2);
  assert.deepEqual(
    startedDraft.payload.room.draft.order.slice(0, 4),
    [...startedDraft.payload.room.draft.baseOrder, ...startedDraft.payload.room.draft.baseOrder.toReversed()],
  );

  const guestDraw = await request(`/api/rooms/${hostSession.code}/draft-draw`, {
    method: "POST",
    token: joined.accessToken,
    body: { expectedTurnIndex: 0 },
  });
  assert.equal(guestDraw.response.status, 403);

  let draftRoom = startedDraft.payload.room;
  const firstDraw = await request(`/api/rooms/${hostSession.code}/draft-draw`, {
    method: "POST",
    token: hostSession.token,
    body: { expectedTurnIndex: 0 },
  });
  assert.equal(firstDraw.response.status, 200);
  draftRoom = firstDraw.payload.room;

  const duplicateTurn = await request(`/api/rooms/${hostSession.code}/draft-draw`, {
    method: "POST",
    token: hostSession.token,
    body: { expectedTurnIndex: 0 },
  });
  assert.equal(duplicateTurn.response.status, 409);

  while (draftRoom.draft.status === "active") {
    const drawn = await request(`/api/rooms/${hostSession.code}/draft-draw`, {
      method: "POST",
      token: hostSession.token,
      body: { expectedTurnIndex: draftRoom.draft.turnIndex },
    });
    assert.equal(drawn.response.status, 200);
    draftRoom = drawn.payload.room;
  }
  assert.equal(draftRoom.status, "matches");
  assert.equal(draftRoom.draft.picks.length, 10);
  assert.equal(new Set(draftRoom.draft.picks.map((pick) => pick.teamId)).size, 10);
  const topTeamIds = new Set(DRAFT_TEAMS
    .filter((team) => Number.isInteger(team.officialFifaRank) && team.officialFifaRank <= 20)
    .map((team) => team.id));
  const midTeamIds = new Set(DRAFT_TEAMS
    .filter((team) => team.officialFifaRank >= 40 && team.officialFifaRank <= 90)
    .map((team) => team.id));
  const lowerTeamIds = new Set(DRAFT_TEAMS
    .filter((team) => !team.officialFifaRank || team.officialFifaRank >= 120)
    .map((team) => team.id));
  draftRoom.members.forEach((member) => {
    const memberPicks = draftRoom.draft.picks.filter((pick) => pick.memberId === member.id);
    assert.equal(memberPicks.length, 5);
    assert.equal(
      memberPicks.filter((pick) => topTeamIds.has(pick.teamId)).length,
      1,
      `${member.name} should receive exactly one top-ranked country.`,
    );
    assert.equal(
      memberPicks.filter((pick) => midTeamIds.has(pick.teamId)).length,
      2,
      `${member.name} should receive exactly two mid-ranked countries.`,
    );
    assert.equal(
      memberPicks.filter((pick) => lowerTeamIds.has(pick.teamId)).length,
      2,
      `${member.name} should receive exactly two lower-ranked countries.`,
    );
  });

  assert.equal(draftRoom.tournament.status, "active");
  assert.equal(draftRoom.tournament.participantTeamIds.length, 256);
  assert.equal(draftRoom.tournament.rounds[0].matches.length, 128);
  assert.equal(draftRoom.tournament.rounds[0].matches.some((match) => !match.awayTeamId), false);
  const humanOwnerIds = new Set(draftRoom.members.filter((member) => !member.isCpu).map((member) => member.id));
  const openingHumanMatches = draftRoom.tournament.rounds[0].matches.filter((match) => (
    humanOwnerIds.has(draftRoom.tournament.teamOwnerById[match.homeTeamId])
    && humanOwnerIds.has(draftRoom.tournament.teamOwnerById[match.awayTeamId])
  ));
  assert.equal(openingHumanMatches.length, 0, "Human-owned countries should avoid each other in the opening round while CPU opponents are available.");
  assert.equal(draftRoom.tournament.activeTeamByMember[hostSession.memberId], draftRoom.draft.picks
    .filter((pick) => pick.memberId === hostSession.memberId)
    .map((pick) => DRAFT_TEAMS.find((team) => team.id === pick.teamId))
    .toSorted((a, b) => (a.officialFifaRank || 999) - (b.officialFifaRank || 999))[0].id);

  const tacticTeamId = draftRoom.tournament.rounds.at(-1).matches
    .find((match) => match.status === "waiting" && match.requiredMemberIds.includes(hostSession.memberId))
    ?.homeTeamId;
  const ownedTacticTeamId = draftRoom.tournament.teamOwnerById[tacticTeamId] === hostSession.memberId
    ? tacticTeamId
    : draftRoom.tournament.rounds.at(-1).matches
      .find((match) => match.status === "waiting" && match.requiredMemberIds.includes(hostSession.memberId))?.awayTeamId;
  assert.ok(ownedTacticTeamId);
  const tactic = await request(`/api/rooms/${hostSession.code}/match-tactic`, {
    method: "POST",
    token: hostSession.token,
    body: { tactic: "attacking", teamId: ownedTacticTeamId },
  });
  assert.equal(tactic.response.status, 200);
  assert.equal(tactic.payload.room.tournament.tacticsByTeam[ownedTacticTeamId], "attacking");
  const unreadyHumanMatches = tactic.payload.room.tournament.rounds.at(-1).matches.filter((match) => (
    match.status === "waiting" && match.requiredMemberIds.length && !match.capacityReady
  ));
  assert.ok(unreadyHumanMatches.length > 0);
  assert.ok(
    unreadyHumanMatches.every((match) => !match.lease && !Number.isInteger(match.queuePosition)),
    "Unready player ties must not consume or queue for global match capacity.",
  );
  const hostMatch = unreadyHumanMatches.find((match) => match.requiredMemberIds.includes(hostSession.memberId));
  assert.ok(hostMatch);
  const readiedMatch = await request(`/api/rooms/${hostSession.code}/match-ready`, {
    method: "POST",
    token: hostSession.token,
    body: { matchId: hostMatch.id },
  });
  assert.equal(readiedMatch.response.status, 200);
  assert.equal(
    readiedMatch.payload.room.tournament.rounds.at(-1).matches.find((match) => match.id === hostMatch.id)?.status,
    "live",
    "A ready player tie must start immediately even when background simulations have filled capacity.",
  );

  const invalidPenalty = await request(`/api/rooms/${hostSession.code}/penalty-kick`, {
    method: "POST",
    token: hostSession.token,
    body: { matchId: "not-a-match", target: "outside" },
  });
  assert.equal(invalidPenalty.response.status, 400);

  if (false) {
  const tokenByMemberId = new Map([
    [hostSession.memberId, hostSession.token],
    [joined.payload.memberId, joined.accessToken],
  ]);
  let tournamentRoom = tactic.payload.room;
  let sawHumanMatch = false;
  let sawShootout = false;
  let changedTacticDuringPlayback = false;
  let testedSharedPlayback = false;
  for (let action = 0; action < 500 && tournamentRoom.tournament.status === "active"; action += 1) {
    const tournament = tournamentRoom.tournament;
    const selectionMemberId = tournament.selectionRequired.find((memberId) => tokenByMemberId.has(memberId));
    if (selectionMemberId) {
      const teamId = tournament.survivingTeamIds.find((candidateId) => tournament.teamOwnerById[candidateId] === selectionMemberId);
      const selected = await request(`/api/rooms/${hostSession.code}/team-select`, {
        method: "POST",
        token: tokenByMemberId.get(selectionMemberId),
        body: { teamId },
      });
      assert.equal(selected.response.status, 200);
      tournamentRoom = selected.payload.room;
      continue;
    }

    const matches = tournament.rounds.at(-1).matches;
    matches.filter((match) => match.awayTeamId).forEach((match) => {
      const homeOwnerId = tournament.teamOwnerById[match.homeTeamId];
      const awayOwnerId = tournament.teamOwnerById[match.awayTeamId];
      if (homeOwnerId && awayOwnerId) {
        assert.notEqual(homeOwnerId, awayOwnerId, "Countries owned by the same player must never face each other.");
      }
      [match.homeTeamId, match.awayTeamId].forEach((teamId) => {
        const ownerId = tournament.teamOwnerById[teamId];
        if (tokenByMemberId.has(ownerId) && match.status === "waiting") {
          assert.ok(match.requiredMemberIds.includes(ownerId), "Every human-owned country match must be player-controlled.");
        }
      });
    });
    const penaltyMatch = matches.find((match) => match.status === "penalties");
    if (penaltyMatch) {
      sawShootout = true;
      const ownerId = tournament.teamOwnerById[penaltyMatch.penalty.currentTeamId];
      const token = tokenByMemberId.get(ownerId);
      assert.ok(token, "A pending penalty must belong to a human-controlled country.");
      const kicked = await request(`/api/rooms/${hostSession.code}/penalty-kick`, {
        method: "POST",
        token,
        body: { matchId: penaltyMatch.id, target: "top-right" },
      });
      assert.equal(kicked.response.status, 200);
      tournamentRoom = kicked.payload.room;
      continue;
    }

    const waitingMatch = matches.find((match) => match.status === "waiting" && match.requiredMemberIds.some((id) => !match.readyMemberIds.includes(id)));
    assert.ok(waitingMatch, "An active tournament must expose a human action when automatic matches are settled.");
    sawHumanMatch = true;
    const memberId = waitingMatch.requiredMemberIds.find((id) => !waitingMatch.readyMemberIds.includes(id));
    const ready = await request(`/api/rooms/${hostSession.code}/match-ready`, {
      method: "POST",
      token: tokenByMemberId.get(memberId),
      body: { matchId: waitingMatch.id },
    });
    assert.equal(ready.response.status, 200);
    if (waitingMatch.requiredMemberIds.length === 2 && waitingMatch.readyMemberIds.length === 0) {
      const sameMatch = ready.payload.room.tournament.rounds.at(-1).matches.find((match) => match.id === waitingMatch.id);
      assert.equal(sameMatch.status, "waiting", "A human-v-human match must wait for both players.");
    }
    const resolvedMatch = ready.payload.room.tournament.rounds.at(-1).matches.find((match) => match.id === waitingMatch.id);
    if (!testedSharedPlayback && resolvedMatch?.playback?.controllerMemberIds?.length === 2) {
      const [firstControllerId, secondControllerId] = resolvedMatch.playback.controllerMemberIds;
      const paused = await request(`/api/rooms/${hostSession.code}/match-playback`, {
        method: "POST",
        token: tokenByMemberId.get(firstControllerId),
        body: { matchId: resolvedMatch.id, paused: true },
      });
      assert.equal(paused.response.status, 200);
      const pausedMatch = paused.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.ok(pausedMatch.playback.pausedUntil > pausedMatch.playback.updatedAt);
      assert.ok(pausedMatch.playback.pausedUntil - pausedMatch.playback.updatedAt <= 15000);

      const observedPause = await request(`/api/rooms/${hostSession.code}`, { token: tokenByMemberId.get(secondControllerId) });
      const observedPauseMatch = observedPause.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.equal(observedPauseMatch.playback.pausedUntil, pausedMatch.playback.pausedUntil, "The opponent must receive the same pause deadline.");

      const repeatedPause = await request(`/api/rooms/${hostSession.code}/match-playback`, {
        method: "POST",
        token: tokenByMemberId.get(secondControllerId),
        body: { matchId: resolvedMatch.id, paused: true },
      });
      const repeatedPauseMatch = repeatedPause.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.equal(repeatedPauseMatch.playback.pausedUntil, pausedMatch.playback.pausedUntil, "A second pause request must not extend the 15-second timer.");

      const secondAtFour = await request(`/api/rooms/${hostSession.code}/match-playback`, {
        method: "POST",
        token: tokenByMemberId.get(secondControllerId),
        body: { matchId: resolvedMatch.id, speed: 4 },
      });
      const secondAtFourMatch = secondAtFour.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.equal(secondAtFourMatch.playback.effectiveSpeed, 1, "1x and 4x must run at 1x.");

      const firstAtTwo = await request(`/api/rooms/${hostSession.code}/match-playback`, {
        method: "POST",
        token: tokenByMemberId.get(firstControllerId),
        body: { matchId: resolvedMatch.id, speed: 2 },
      });
      const firstAtTwoMatch = firstAtTwo.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.equal(firstAtTwoMatch.playback.effectiveSpeed, 2, "2x and 4x must run at 2x.");

      const firstAtFour = await request(`/api/rooms/${hostSession.code}/match-playback`, {
        method: "POST",
        token: tokenByMemberId.get(firstControllerId),
        body: { matchId: resolvedMatch.id, speed: 4 },
      });
      const firstAtFourMatch = firstAtFour.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.equal(firstAtFourMatch.playback.effectiveSpeed, 4, "4x and 4x must run at 4x.");

      const resumed = await request(`/api/rooms/${hostSession.code}/match-playback`, {
        method: "POST",
        token: tokenByMemberId.get(secondControllerId),
        body: { matchId: resolvedMatch.id, paused: false },
      });
      const resumedMatch = resumed.payload.room.tournament.rounds
        .flatMap((round) => round.matches).find((match) => match.id === resolvedMatch.id);
      assert.equal(resumedMatch.playback.pausedUntil, null, "Either player must be able to resume the shared match.");
      testedSharedPlayback = true;
      tournamentRoom = resumed.payload.room;
    }
    if (!changedTacticDuringPlayback && resolvedMatch?.status !== "waiting") {
      const controlledTeamId = [resolvedMatch.homeTeamId, resolvedMatch.awayTeamId]
        .find((teamId) => ready.payload.room.tournament.teamOwnerById[teamId] === memberId);
      const liveTactic = await request(`/api/rooms/${hostSession.code}/match-tactic`, {
        method: "POST",
        token: tokenByMemberId.get(memberId),
        body: { tactic: "defensive", teamId: controlledTeamId },
      });
      assert.equal(liveTactic.response.status, 200, "Tactics must remain selectable during match playback.");
      assert.equal(liveTactic.payload.room.tournament.tacticsByTeam[controlledTeamId], "defensive");
      changedTacticDuringPlayback = true;
      tournamentRoom = liveTactic.payload.room;
    } else {
      tournamentRoom = ready.payload.room;
    }
  }
  assert.equal(tournamentRoom.tournament.status, "complete");
  assert.equal(tournamentRoom.status, "tournament-complete");
  assert.ok(tournamentRoom.tournament.championTeamId);
  assert.equal(sawHumanMatch, true);
  assert.equal(changedTacticDuringPlayback, true);
  assert.equal(testedSharedPlayback, true);
  assert.equal(typeof sawShootout, "boolean");
  const completedPlayedMatches = tournamentRoom.tournament.rounds
    .flatMap((round) => round.matches)
    .filter((match) => match.awayTeamId);
  completedPlayedMatches.forEach((match) => {
    assert.equal(match.status, "complete");
    assert.ok(match.events.length >= match.homeScore + match.awayScore);
    match.events.forEach((event) => {
      assert.ok(["goal", "penalty"].includes(event.type));
      assert.ok(event.minute >= 2 && event.minute <= 89);
    });
    assert.equal(match.events.filter((event) => event.scored !== false).length, match.homeScore + match.awayScore);
    (match.penalty?.kicks || []).forEach((kick) => {
      assert.ok(["top-left", "top-right", "middle", "bottom-left", "bottom-right"].includes(kick.goalkeeperTarget));
    });
  });
  }

  const tokenByMemberId = new Map([
    [hostSession.memberId, hostSession.token],
    [joined.payload.memberId, joined.accessToken],
  ]);
  let liveRoom = readiedMatch.payload.room;
  const waitingHumanMatch = liveRoom.tournament.rounds.at(-1).matches.slice(0, 64).find((match) => (
    match.status === "waiting" && match.requiredMemberIds.length > 0
  )) || liveRoom.tournament.rounds.at(-1).matches.find((match) => (
    match.status === "waiting" && match.requiredMemberIds.length > 0
  ));
  assert.ok(waitingHumanMatch, "The opening round must expose a human-controlled match.");
  for (const memberId of waitingHumanMatch.requiredMemberIds) {
    const ready = await request(`/api/rooms/${hostSession.code}/match-ready`, {
      method: "POST",
      token: tokenByMemberId.get(memberId),
      body: { matchId: waitingHumanMatch.id },
    });
    assert.equal(ready.response.status, 200);
    liveRoom = ready.payload.room;
  }
  let liveMatch = liveRoom.tournament.rounds.at(-1).matches.find((match) => match.id === waitingHumanMatch.id);
  for (let retry = 0; retry < 10 && liveMatch?.status === "waiting"; retry += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const status = await request(`/api/rooms/${hostSession.code}`, { token: hostSession.token });
    liveRoom = status.payload.room;
    liveMatch = liveRoom.tournament.rounds.at(-1).matches.find((match) => match.id === waitingHumanMatch.id);
  }
  assert.equal(liveMatch.simulationVersion, 2);
  assert.ok(liveMatch.liveState, "A ready match must have authoritative live state.");
  assert.ok(liveMatch.liveState.minute < 90, "The final result must not exist at kickoff.");
  assert.equal("rngState" in liveMatch.liveState, false, "Private RNG state must not be public.");

  const controllingMemberId = waitingHumanMatch.requiredMemberIds[0];
  const controlledTeamId = [liveMatch.homeTeamId, liveMatch.awayTeamId]
    .find((teamId) => liveRoom.tournament.teamOwnerById[teamId] === controllingMemberId);
  const commandId = crypto.randomUUID();
  const liveTactic = await request(`/api/rooms/${hostSession.code}/match-tactic`, {
    method: "POST",
    token: tokenByMemberId.get(controllingMemberId),
    body: { tactic: "high-press", teamId: controlledTeamId, clientCommandId: commandId },
  });
  assert.equal(liveTactic.response.status, 200);
  const replayedTactic = await request(`/api/rooms/${hostSession.code}/match-tactic`, {
    method: "POST",
    token: tokenByMemberId.get(controllingMemberId),
    body: { tactic: "high-press", teamId: controlledTeamId, clientCommandId: commandId },
  });
  assert.equal(replayedTactic.response.status, 200, "Duplicate commands must be idempotent.");
  assert.equal(replayedTactic.payload.room.tournament.tacticsByTeam[controlledTeamId], "high-press");

  const paused = await request(`/api/rooms/${hostSession.code}/match-playback`, {
    method: "POST",
    token: tokenByMemberId.get(controllingMemberId),
    body: { matchId: liveMatch.id, paused: true },
  });
  assert.equal(paused.response.status, 200);
  liveMatch = paused.payload.room.tournament.rounds.at(-1).matches.find((match) => match.id === liveMatch.id);
  assert.ok(liveMatch.liveState.clock.pausedUntil > Date.now());
  const pauseDeadline = liveMatch.liveState.clock.pausedUntil;
  const repeatedPause = await request(`/api/rooms/${hostSession.code}/match-playback`, {
    method: "POST",
    token: tokenByMemberId.get(controllingMemberId),
    body: { matchId: liveMatch.id, paused: true },
  });
  liveMatch = repeatedPause.payload.room.tournament.rounds.at(-1).matches.find((match) => match.id === liveMatch.id);
  assert.equal(liveMatch.liveState.clock.pausedUntil, pauseDeadline, "Repeated pause commands cannot extend the shared 15-second limit.");

  const delta = await request(
    `/api/rooms/${hostSession.code}?afterStateVersion=${paused.payload.stateVersion}&lastSeenEventId=${paused.payload.lastEventId}`,
    { token: hostSession.token },
  );
  assert.equal(delta.response.status, 200);
  assert.ok(["noop", "delta"].includes(delta.payload.mode));
  assert.equal(JSON.stringify(delta.payload).includes("rngState"), false);

  const leftDuringTournament = await request(`/api/rooms/${hostSession.code}/leave`, {
    method: "POST",
    token: joined.accessToken,
  });
  assert.equal(leftDuringTournament.response.status, 200, "Guests must be able to leave after the draft starts.");
  const afterTournamentLeave = await request(`/api/rooms/${hostSession.code}`, { token: hostSession.token });
  assert.equal(afterTournamentLeave.payload.room.memberCount, 1);
  assert.equal(
    Object.values(afterTournamentLeave.payload.room.tournament.teamOwnerById).includes(joined.payload.memberId),
    false,
    "A departing player's countries must transfer to CPU control.",
  );

  const closed = await request(`/api/rooms/${hostSession.code}`, {
    method: "DELETE",
    token: hostSession.token,
  });
  assert.equal(closed.response.status, 200);
  hostSession = null;

  console.log("Online room API integration test passed.");
} finally {
  if (hostSession) {
    await request(`/api/rooms/${hostSession.code}`, {
      method: "DELETE",
      token: hostSession.token,
    }).catch(() => {});
  }
}
