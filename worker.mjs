import { DurableObject } from "cloudflare:workers";
import { DRAFT_TEAMS } from "./draft-team-catalog.generated.mjs";
import {
  onlineAutomaticPenaltyGoalChance,
  onlineManualPenaltyGoalChance,
  onlinePenaltyWinner,
} from "./online-penalty-rules.mjs";
import { giantKillingMomentumMultiplier } from "./online-momentum-rules.mjs";
import { commitAtomicRoomBatch } from "./online-room-atomic.mjs";
import { handleChallengeRequest } from "./challenge-service.mjs";
import {
  LIVE_MAX_BATCH_CPU_MS,
  LIVE_MAX_BATCH_MINUTES,
  LIVE_MINUTE_MS,
  LIVE_PENALTY_TARGETS,
  LIVE_SIMULATION_VERSION,
  advanceLiveMatch,
  createLiveMatchState,
  expireLivePenaltyDecision,
  resolveLivePenaltyDecision,
  setLiveTactic,
  startLiveMatch,
} from "./online-live-engine.mjs";
import {
  MAX_ROOM_MEMBERS,
  ROOM_CODE_PATTERN,
  ROOM_LIFETIME_MS,
  hashAccessToken,
  makeRoomCode,
  makeMemberId,
  normalizeDisplayName,
  normalizeRoomCode,
  safeEqual,
} from "./room-security.mjs";

const API_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const DEFAULT_ROOM_PLAYERS = 2;
const DEFAULT_DRAFT_PICKS_PER_MEMBER = 5;
const ROOM_PLAYER_CAPACITY = Math.min(8, MAX_ROOM_MEMBERS);
const ONLINE_PLAYBACK_BASE_MS = 30000;
const ONLINE_PAUSE_LIMIT_MS = 15000;
const ONLINE_PLAYBACK_SPEEDS = new Set([1, 2, 4]);
const ONLINE_EVENT_BUCKET_SIZE = 128;
const ONLINE_MAX_COMMAND_RECEIPTS = 512;
const ONLINE_LEASE_MS = 30_000;
const ONLINE_LEASE_RENEW_MS = 10_000;
const ONLINE_DEFAULT_ACTIVE_MATCH_LIMIT = 64;
const ONLINE_CAPACITY_SHARDS = 8;
const ONLINE_MAX_RESERVED_MATCHES_PER_ROOM = 16;
const ONLINE_SHORT_ALARM_CONTINUATION_MS = 50;
const ONLINE_CONTROLLED_MATCH_CATCHUP_MINUTES = 3;
const MATCHMAKING_QUEUE_TTL_MS = 5 * 60 * 1000;
const MATCHMAKING_ASSIGNMENT_TTL_MS = 10 * 60 * 1000;
const MATCHMAKING_TICKET_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const DRAFT_ELIGIBLE_TEAMS = DRAFT_TEAMS;
const FIFA_RANKED_DRAFT_TEAMS = DRAFT_ELIGIBLE_TEAMS
  .filter((team) => Number.isInteger(team.officialFifaRank))
  .toSorted((a, b) => a.officialFifaRank - b.officialFifaRank);
const GREAT_DRAFT_TEAMS = FIFA_RANKED_DRAFT_TEAMS.filter((team) => team.officialFifaRank <= 20);
const MID_DRAFT_TEAMS = FIFA_RANKED_DRAFT_TEAMS.filter((team) => team.officialFifaRank >= 40 && team.officialFifaRank <= 90);
const LOWER_DRAFT_TEAMS = DRAFT_ELIGIBLE_TEAMS.filter((team) => !team.officialFifaRank || team.officialFifaRank >= 120);
const APP_SHELL_PATHS = new Set(["/", "/default-mode", "/custom-tournament", "/custom-matches", "/draft-mode", "/retro-world-cup", "/retro-98-world-cup", "/retro-02-world-cup", "/retro-06-world-cup", "/retro-10-world-cup", "/retro-14-world-cup", "/retro-18-world-cup", "/retro-22-world-cup", "/world-cup-2026", "/retro-euro-2016", "/copa-america-2024", "/achievements", "/online-mode", "/pl-simulator", "/ucl-simulator", "/palestine-challenge", "/profile"]);
const SAVED_TOURNAMENT_PATH = /^\/saved-tournaments\/[A-Za-z0-9-]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestId = request.headers.get("CF-Ray") || crypto.randomUUID();
    const startedAt = performance.now();
    structuredLog("worker-request", { requestId, method: request.method, route: url.pathname });
    writeOnlineAnalytics(env, "worker-request", 1, 0, 0);
    const response = await handleWorkerRequest(request, env, url);
    structuredLog("worker-request-complete", {
      requestId,
      method: request.method,
      route: url.pathname,
      status: response.status,
      elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
    });
    return response;
  },
};

async function handleWorkerRequest(request, env, url = new URL(request.url)) {
    if (!url.pathname.startsWith("/api/")) return serveHtmlAsset(request, env);

    if (!sameOriginRequest(request, url)) {
      return json({ error: "Cross-origin requests are not allowed." }, 403);
    }

    try {
      if (url.pathname === "/api/challenge" || url.pathname.startsWith("/api/challenge/")) {
        if (env.PALESTINE_CHALLENGE_ENABLED !== "true") return json({ error: "Not found." }, 404);
        if (["/api/challenge/login", "/api/challenge/register", "/api/challenge/google/start", "/api/challenge/google/callback"].includes(url.pathname)) {
          if (!(await allowRequest(env.CHALLENGE_AUTH_LIMITER, rateKey(request, "challenge-auth")))) {
            return json({ error: "Too many account attempts. Try again in a minute." }, 429);
          }
        } else if (!(await allowRequest(env.CHALLENGE_API_LIMITER, rateKey(request, "challenge-api")))) {
          return json({ error: "Too many challenge requests. Slow down and try again." }, 429);
        }
        return handleChallengeRequest(request, env, url);
      }

      if (url.pathname === "/api/bug-report" && request.method === "POST") {
        return submitBugReport(request, env, url);
      }

      if (env.ONLINE_MODE_ENABLED !== "true") return json({ error: "Not found." }, 404);

      if (url.pathname === "/api/rooms" && request.method === "POST") {
        if (!(await allowRequest(env.ROOM_CREATE_LIMITER, rateKey(request, "create")))) {
          return json({ error: "Too many rooms created. Try again in a minute." }, 429);
        }
        return createRoom(request, env);
      }

      if (url.pathname === "/api/matchmaking" && request.method === "POST") {
        if (!(await allowRequest(env.ROOM_JOIN_LIMITER, rateKey(request, "matchmaking-join")))) {
          return json({ error: "Too many matchmaking attempts. Try again in a minute." }, 429);
        }
        return forwardToMatchmaker(env, request, "join");
      }

      const matchmakingMatch = url.pathname.match(/^\/api\/matchmaking\/([A-Za-z0-9_-]{16})(?:\/(cancel))?$/);
      if (matchmakingMatch) {
        const ticketId = matchmakingMatch[1];
        const action = matchmakingMatch[2] || "status";
        const limiter = request.method === "GET" ? env.ROOM_STATUS_LIMITER : env.ROOM_API_LIMITER;
        const limiterAction = request.method === "GET" ? "matchmaking-status" : "matchmaking-command";
        if (!(await allowRequest(limiter, roomActorRateKey(request, limiterAction)))) {
          return json({ error: "Matchmaking updates are arriving too quickly. Try again in a moment." }, 429);
        }
        if (action === "status" && request.method === "GET") {
          return forwardToMatchmaker(env, request, "status", ticketId);
        }
        if (action === "cancel" && request.method === "POST") {
          return forwardToMatchmaker(env, request, "cancel", ticketId);
        }
        return json({ error: "Method not allowed." }, 405);
      }

      const match = url.pathname.match(/^\/api\/rooms\/([^/]+)(?:\/(join|leave|rename|rematch|draft-start|draft-draw|match-ready|match-tactic|match-playback|match-view|penalty-kick|team-select))?$/);
      if (!match) return json({ error: "Not found." }, 404);
      const code = normalizeRoomCode(match[1]);
      if (!ROOM_CODE_PATTERN.test(code)) return json({ error: "Room unavailable." }, 404);
      const action = match[2] || "room";

      if (action === "join" && request.method === "POST") {
        if (!(await allowRequest(env.ROOM_JOIN_LIMITER, rateKey(request, "join")))) {
          return json({ error: "Too many join attempts. Try again in a minute." }, 429);
        }
        return forwardToRoom(env, code, request, "join");
      }
      const limiter = request.method === "GET" ? env.ROOM_STATUS_LIMITER : env.ROOM_API_LIMITER;
      const limiterAction = request.method === "GET" ? "room-status" : "room-command";
      if (!(await allowRequest(limiter, roomActorRateKey(request, limiterAction)))) {
        return json({ error: request.method === "GET"
          ? "Room updates are arriving too quickly. Try again in a moment."
          : "Too many room actions. Slow down and try again." }, 429);
      }
      if (action === "leave" && request.method === "POST") {
        return forwardToRoom(env, code, request, "leave");
      }
      if (action === "rename" && request.method === "POST") {
        return forwardToRoom(env, code, request, "rename");
      }
      if (action === "rematch" && request.method === "POST") {
        return forwardToRoom(env, code, request, "rematch");
      }
      if (action === "draft-start" && request.method === "POST") {
        return forwardToRoom(env, code, request, "draft-start");
      }
      if (action === "draft-draw" && request.method === "POST") {
        return forwardToRoom(env, code, request, "draft-draw");
      }
      if (["match-ready", "match-tactic", "match-playback", "match-view", "penalty-kick", "team-select"].includes(action) && request.method === "POST") {
        return forwardToRoom(env, code, request, action);
      }
      if (action === "room" && request.method === "GET") {
        return forwardToRoom(env, code, request, "status");
      }
      if (action === "room" && request.method === "DELETE") {
        return forwardToRoom(env, code, request, "close");
      }
      return json({ error: "Method not allowed." }, 405);
    } catch (error) {
      console.error("Room API failure", error instanceof Error ? error.message : "Unknown error");
      return json({ error: "The room service is temporarily unavailable." }, 500);
    }
}

async function serveHtmlAsset(request, env) {
  const assetUrl = new URL(request.url);
  const normalizedPath = assetUrl.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/palestine-challenge" && env.PALESTINE_CHALLENGE_ENABLED !== "true") {
    return Response.redirect(new URL("/", request.url), 302);
  }
  const appShellPath = APP_SHELL_PATHS.has(normalizedPath) || SAVED_TOURNAMENT_PATH.test(normalizedPath);
  const assetRequest = appShellPath && normalizedPath !== "/"
    ? new Request(new URL(`/${assetUrl.search}`, assetUrl), request)
    : request;
  const response = await env.ASSETS.fetch(assetRequest);
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: http:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https:",
    "frame-src https:",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join("; "));
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  return new HTMLRewriter()
    .on("script", {
      element(element) {
        element.setAttribute("nonce", nonce);
      },
    })
    .transform(new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }));
}

export class TournamentRoom extends DurableObject {
  async fetch(request) {
    const startedAt = performance.now();
    const action = new URL(request.url).pathname.slice(1);
    let status = 500;
    try {
      structuredLog("room-request", { action, method: request.method });
      let response;
      if (action === "create" && request.method === "POST") response = await this.create(request);
      else if (action === "join" && request.method === "POST") response = await this.join(request);
      else if (action === "status" && request.method === "GET") response = await this.status(request);
      else if (action === "leave" && request.method === "POST") response = await this.leave(request);
      else if (action === "rename" && request.method === "POST") response = await this.rename(request);
      else if (action === "rematch" && request.method === "POST") response = await this.rematch(request);
      else if (action === "close" && request.method === "DELETE") response = await this.close(request);
      else if (action === "draft-start" && request.method === "POST") response = await this.startDraft(request);
      else if (action === "draft-draw" && request.method === "POST") response = await this.drawCountry(request);
      else if (action === "match-ready" && request.method === "POST") response = await this.readyForMatch(request);
      else if (action === "match-tactic" && request.method === "POST") response = await this.updateMatchTactic(request);
      else if (action === "match-playback" && request.method === "POST") response = await this.updateMatchPlayback(request);
      else if (action === "match-view" && request.method === "POST") response = await this.updateMatchView(request);
      else if (action === "penalty-kick" && request.method === "POST") response = await this.takePenalty(request);
      else if (action === "team-select" && request.method === "POST") response = await this.selectControlledTeam(request);
      else response = json({ error: "Not found." }, 404);
      status = response.status;
      return response;
    } catch (error) {
      if (error instanceof RoomRequestError || Number.isInteger(error?.status)) {
        status = error.status;
        return json({ error: error.message }, status);
      }
      throw error;
    } finally {
      structuredLog("room-request-complete", { action, status, durationMs: Number((performance.now() - startedAt).toFixed(2)) });
    }
  }

  async alarm() {
    const startedAt = performance.now();
    const room = await this.ctx.storage.get("room");
    structuredLog("room-alarm", { roomId: room ? hashLogValue(room.code) : null });
    try {
      if (!room) return;
      if (room.expiresAt <= Date.now() || room.status === "closed") {
        await this.releaseRoomLeases(room);
        await this.ctx.storage.deleteAll();
        return;
      }
      const result = await this.advanceRoom(room, Date.now());
      if (result.changed) await this.persistRoomBatch(room, result.events, result.nextAlarmAt, null, result.releasedMatches);
      else await this.scheduleRoomAlarm(room, result.nextAlarmAt);
    } finally {
      structuredLog("room-alarm-complete", {
        roomId: room ? hashLogValue(room.code) : null,
        elapsedMs: Number((performance.now() - startedAt).toFixed(2)),
      });
    }
  }

  async create(request) {
    const now = Date.now();
    const body = await readJson(request);
    requireClientCommandId(body);
    const token = validateClientAccessToken(body.accessToken);
    const existing = await this.ctx.storage.get("room");
    if (existing && existing.expiresAt > now && existing.status !== "closed") {
      const receipts = await this.ctx.storage.get("commandReceipts") || [];
      const replay = receipts.find((item) => item.clientCommandId === body.clientCommandId && item.action === "create");
      if (replay) {
        if (replay.fingerprint !== commandFingerprint(body, "create", replay.memberId)) {
          throw new RoomRequestError("That command ID was already used with different data.", 409);
        }
        return this.fullRoomResponse(existing, replay.memberId, 201);
      }
      return json({ error: "Code already in use." }, 409);
    }
    if (existing) await this.ctx.storage.deleteAll();
    const name = normalizeDisplayName(body.name);
    if (!name) return invalidNameResponse();

    const code = request.headers.get("X-Room-Code");
    if (!ROOM_CODE_PATTERN.test(code || "")) return json({ error: "Invalid room code." }, 400);
    const member = {
      id: makeMemberId(),
      name,
      isHost: true,
      joinedAt: now,
      tokenHash: await hashAccessToken(token),
    };
    const room = {
      code,
      status: "lobby",
      visibility: body.visibility === "public" ? "public" : "private",
      createdAt: now,
      expiresAt: now + ROOM_LIFETIME_MS,
      hostMemberId: member.id,
      members: [member],
      maxPlayers: ROOM_PLAYER_CAPACITY,
      picksPerMember: DEFAULT_DRAFT_PICKS_PER_MEMBER,
      draft: null,
    };
    const receipt = commandReceipt(body, "create", member.id);
    await this.ctx.storage.transaction(async (transaction) => {
      await transaction.put("room", room);
      await transaction.put("commandReceipts", [receipt]);
      await transaction.setAlarm(room.expiresAt);
    });
    return json({ mode: "snapshot", room: publicRoom(room), events: [], memberId: member.id, token, stateVersion: 0, lastEventId: 0, serverNow: now }, 201);
  }

  async join(request) {
    const room = await this.activeRoom();
    if (!room) return unavailableRoomResponse();
    const body = await readJson(request);
    requireClientCommandId(body);
    const token = validateClientAccessToken(body.accessToken);
    const receipts = await this.ctx.storage.get("commandReceipts") || [];
    const replay = receipts.find((item) => item.clientCommandId === body.clientCommandId && item.action === "join");
    if (replay) {
      if (replay.fingerprint !== commandFingerprint(body, "join", replay.memberId)) {
        throw new RoomRequestError("That command ID was already used for another action.", 409);
      }
      return this.fullRoomResponse(room, replay.memberId, 201);
    }
    if (room.status !== "lobby") return unavailableRoomResponse();
    if (room.members.filter((item) => !item.leftAt).length >= room.maxPlayers) return json({ error: "This room is full." }, 409);
    const name = normalizeDisplayName(body.name);
    if (!name) return invalidNameResponse();
    if (room.members.some((member) => !member.leftAt && member.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return json({ error: "That name is already being used in this room." }, 409);
    }

    const member = {
      id: makeMemberId(),
      name,
      isHost: false,
      joinedAt: Date.now(),
      tokenHash: await hashAccessToken(token),
    };
    room.members.push(member);
    await this.ctx.storage.transaction(async (transaction) => {
      const currentReceipts = await transaction.get("commandReceipts") || [];
      currentReceipts.push(commandReceipt(body, "join", member.id));
      await transaction.put("commandReceipts", currentReceipts.slice(-ONLINE_MAX_COMMAND_RECEIPTS));
      await transaction.put("room", room);
    });
    return json({ mode: "snapshot", room: publicRoom(room), events: [], memberId: member.id, token, stateVersion: 0, lastEventId: 0, serverNow: Date.now() }, 201);
  }

  async status(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const result = await this.advanceRoom(room, Date.now());
    if (result.changed) await this.persistRoomBatch(room, result.events, result.nextAlarmAt, null, result.releasedMatches);
    else await this.scheduleRoomAlarm(room, result.nextAlarmAt);
    return this.statusResponse(request, room, member.id);
  }

  async leave(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "leave", member.id, room);
    if (duplicate) return json({ left: true });
    if (member.isHost) return json({ error: "The host must close the room." }, 409);
    member.leftAt = Date.now();
    relinquishOnlineMemberControl(room, member.id, member.leftAt);
    const result = await this.advanceRoom(room, member.leftAt);
    await this.persistRoomBatch(
      room,
      result.events,
      result.nextAlarmAt,
      commandReceipt(body, "leave", member.id),
      result.releasedMatches,
    );
    return json({ left: true });
  }

  async rename(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "rename", member.id, room);
    if (duplicate) return duplicate;
    if (room.status !== "lobby") return json({ error: "Names lock when the draft starts." }, 409);
    const name = normalizeDisplayName(body.name);
    if (!name) return invalidNameResponse();
    if (room.members.some((item) => item.id !== member.id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return json({ error: "That name is already being used in this room." }, 409);
    }
    member.name = name;
    await this.persistRoomBatch(room, [], room.expiresAt, commandReceipt(body, "rename", member.id));
    return this.fullRoomResponse(room, member.id);
  }

  async rematch(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "rematch", member.id, room);
    if (duplicate) return duplicate;
    if (!member.isHost) return json({ error: "Only the host can restart the lobby." }, 403);
    if (room.status !== "tournament-complete") return json({ error: "The tournament is not complete yet." }, 409);

    await this.releaseRoomLeases(room);
    room.status = "lobby";
    room.draft = null;
    room.tournament = null;
    room.expiresAt = Date.now() + ROOM_LIFETIME_MS;
    room.members = room.members.filter((item) => !item.leftAt && !item.isCpu);
    room.members.forEach((item) => { delete item.viewedMatchId; });
    const eventEntries = await this.ctx.storage.list({ prefix: "events:" });
    await this.ctx.storage.transaction(async (transaction) => {
      for (const key of eventEntries.keys()) await transaction.delete(key);
      const receipts = await transaction.get("commandReceipts") || [];
      receipts.push(commandReceipt(body, "rematch", member.id));
      await transaction.put("commandReceipts", receipts.slice(-ONLINE_MAX_COMMAND_RECEIPTS));
      await transaction.put("room", room);
      await transaction.setAlarm(room.expiresAt);
    });
    return this.fullRoomResponse(room, member.id);
  }

  async startDraft(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "draft-start", member.id, room);
    if (duplicate) return duplicate;
    if (!member.isHost) return json({ error: "Only the host can start the draft." }, 403);
    if (room.status !== "lobby") return json({ error: "The draft has already started." }, 409);
    const activeMembers = room.members.filter((item) => !item.leftAt);
    if (activeMembers.length < DEFAULT_ROOM_PLAYERS) {
      return json({ error: "At least two players are needed to start the draft." }, 409);
    }

    const baseOrder = secureShuffle(activeMembers.map((item) => item.id));
    room.members = activeMembers;
    const order = [];
    for (let roundIndex = 0; roundIndex < room.picksPerMember; roundIndex += 1) {
      order.push(...(roundIndex % 2 === 0 ? baseOrder : [...baseOrder].reverse()));
    }
    room.status = "draft";
    room.draft = {
      status: "active",
      baseOrder,
      order,
      turnIndex: 0,
      picks: [],
      picksPerMember: room.picksPerMember,
      startedAt: Date.now(),
      completedAt: null,
    };
    await this.persistRoomBatch(room, [], room.expiresAt, commandReceipt(body, "draft-start", member.id));
    return this.fullRoomResponse(room, member.id);
  }

  async drawCountry(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "draft-draw", member.id, room);
    if (duplicate) return duplicate;
    if (!member.isHost) return json({ error: "Only the host can run the country draw." }, 403);
    if (room.status !== "draft" || room.draft?.status !== "active") {
      return json({ error: "The country draft is not active." }, 409);
    }
    if (!Number.isInteger(body.expectedTurnIndex) || body.expectedTurnIndex !== room.draft.turnIndex) {
      return json({ error: "The draft has already moved to the next pick." }, 409);
    }

    const claimed = new Set(room.draft.picks.map((pick) => pick.teamId));
    const playerCount = room.members.length;
    const roundIndex = Math.floor(room.draft.turnIndex / playerCount);
    const drawPool = roundIndex === 0
      ? GREAT_DRAFT_TEAMS
      : roundIndex <= 2
        ? MID_DRAFT_TEAMS
        : LOWER_DRAFT_TEAMS;
    const available = drawPool.filter((team) => !claimed.has(team.id));
    const choice = available[secureRandomIndex(available.length)];
    const draftedMemberId = room.draft.order[room.draft.turnIndex];
    if (!choice || !draftedMemberId) throw new Error("The country draw cannot continue.");
    room.draft.picks.push({
      memberId: draftedMemberId,
      teamId: choice.id,
      roundNumber: Math.floor(room.draft.turnIndex / room.members.length) + 1,
      pickNumber: room.draft.turnIndex + 1,
      pickedAt: Date.now(),
    });
    room.draft.turnIndex += 1;
    if (room.draft.turnIndex >= room.draft.order.length) {
      room.draft.status = "complete";
      room.draft.completedAt = Date.now();
      room.status = "matches";
      room.tournament = createOnlineTournament(room);
      settleOnlineTournament(room);
    }
    await this.persistRoomBatch(room, [], Date.now() + ONLINE_SHORT_ALARM_CONTINUATION_MS, commandReceipt(body, "draft-draw", member.id));
    return this.fullRoomResponse(room, member.id);
  }

  async readyForMatch(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "match-ready", member.id, room);
    if (duplicate) return duplicate;
    readyOnlineMatch(room, member, body.matchId);
    settleOnlineTournament(room);
    const result = await this.advanceRoom(room, Date.now());
    await this.persistRoomBatch(room, result.events, result.nextAlarmAt, commandReceipt(body, "match-ready", member.id), result.releasedMatches);
    return this.fullRoomResponse(room, member.id);
  }

  async updateMatchTactic(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "match-tactic", member.id, room);
    if (duplicate) return duplicate;
    const result = await this.advanceRoom(room, Date.now());
    updateOnlineTactic(room, member, body.tactic, body.teamId);
    await this.persistRoomBatch(room, result.events, result.nextAlarmAt, commandReceipt(body, "match-tactic", member.id), result.releasedMatches);
    return this.fullRoomResponse(room, member.id);
  }

  async updateMatchPlayback(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "match-playback", member.id, room);
    if (duplicate) return duplicate;
    const result = await this.advanceRoom(room, Date.now());
    updateOnlinePlayback(room, member, body);
    await this.persistRoomBatch(room, result.events, result.nextAlarmAt, commandReceipt(body, "match-playback", member.id), result.releasedMatches);
    return this.fullRoomResponse(room, member.id);
  }

  async updateMatchView(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "match-view", member.id, room);
    if (duplicate) return duplicate;
    const matchExists = room.tournament?.rounds
      ?.some((round) => round.matches.some((match) => match.id === body.matchId));
    if (!matchExists) throw new RoomRequestError("That match could not be found.", 400);
    const result = await this.advanceRoom(room, Date.now());
    member.viewedMatchId = body.matchId;
    room.tournament.stateVersion = (room.tournament.stateVersion || 0) + 1;
    await this.persistRoomBatch(room, result.events, result.nextAlarmAt, commandReceipt(body, "match-view", member.id), result.releasedMatches);
    return this.fullRoomResponse(room, member.id);
  }

  async takePenalty(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "penalty-kick", member.id, room);
    if (duplicate) return duplicate;
    const targetMatch = findCurrentOnlineMatch(room, body.matchId);
    if (!targetMatch) throw new RoomRequestError("That match could not be found.", 400);
    if (targetMatch.simulationVersion === LIVE_SIMULATION_VERSION && (typeof body.decisionId !== "string" || !body.decisionId)) {
      throw new RoomRequestError("A valid penalty decision is required.", 400);
    }
    const pendingBefore = targetMatch?.liveState?.pendingDecision;
    const now = Date.now();
    const reconciled = await this.advanceRoom(room, now);
    if (pendingBefore && pendingBefore.id === body.decisionId && now >= pendingBefore.deadlineAt) {
      await this.persistRoomBatch(room, reconciled.events, reconciled.nextAlarmAt, null, reconciled.releasedMatches);
      throw new RoomRequestError("That penalty decision expired.", 409);
    }
    const penaltyEvents = takeOnlinePenalty(room, member, body.matchId, body.target, body.decisionId);
    settleOnlineTournament(room);
    const result = await this.advanceRoom(room, now);
    await this.persistRoomBatch(
      room,
      [...reconciled.events, ...penaltyEvents, ...result.events],
      result.nextAlarmAt,
      commandReceipt(body, "penalty-kick", member.id),
      [...reconciled.releasedMatches, ...result.releasedMatches],
    );
    return this.fullRoomResponse(room, member.id);
  }

  async selectControlledTeam(request) {
    const authenticated = await this.authenticatedRoom(request);
    if (!authenticated) return unauthorizedResponse();
    const { room, member } = authenticated;
    const body = await readJson(request);
    requireClientCommandId(body);
    const duplicate = await this.commandReplay(body, "team-select", member.id, room);
    if (duplicate) return duplicate;
    selectOnlineTeam(room, member, body.teamId);
    settleOnlineTournament(room);
    const result = await this.advanceRoom(room, Date.now());
    await this.persistRoomBatch(room, result.events, result.nextAlarmAt, commandReceipt(body, "team-select", member.id), result.releasedMatches);
    return this.fullRoomResponse(room, member.id);
  }

  capacityStub(roomCode, matchId) {
    const shard = parseInt(hashLogValue(`${roomCode}:${matchId}`), 36) % ONLINE_CAPACITY_SHARDS;
    return this.env.ONLINE_CAPACITY.get(this.env.ONLINE_CAPACITY.idFromName(`capacity:${shard}`));
  }

  async capacityRequest(action, room, match) {
    const priority = match.requiredMemberIds?.length ? "interactive" : "background";
    const response = await this.capacityStub(room.code, match.id).fetch(`https://capacity.internal/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.code, matchId: match.id, priority }),
    });
    if (!response.ok) throw new Error(`Capacity ${action} failed.`);
    return response.json();
  }

  async advanceRoom(room, now) {
    const events = [];
    const released = [];
    let changed = false;
    let processedMinutes = 0;
    const round = currentOnlineRound(room);
    const startedAt = performance.now();
    if (!round || room.tournament?.status !== "active") {
      return { changed: false, events, nextAlarmAt: room.expiresAt, releasedMatches: [] };
    }
    let reservedRoomMatches = round.matches.filter((match) => (
      (match.liveState && match.liveState.status !== "finished")
      || match.lease
      || Number.isInteger(match.queuePosition)
    )).length;

    settleOnlineTournament(room);
    const orderedMatches = [...round.matches].toSorted((first, second) => {
      const priority = (match) => {
        const isLive = match.liveState && match.liveState.status !== "finished";
        const isInteractive = liveHasHumanController(match.liveState) || match.requiredMemberIds?.length;
        if (isLive && isInteractive) return 0;
        if (match.status === "waiting" && isInteractive) return 1;
        if (isLive) return 2;
        return 3;
      };
      return priority(first) - priority(second) || first.id.localeCompare(second.id);
    });
    for (const match of orderedMatches) {
      if (processedMinutes >= LIVE_MAX_BATCH_MINUTES || performance.now() - startedAt >= LIVE_MAX_BATCH_CPU_MS) break;
      if (
        match.status === "waiting"
        && !match.capacityReady
        && (match.lease || Number.isInteger(match.queuePosition))
      ) {
        reservedRoomMatches = Math.max(0, reservedRoomMatches - 1);
        match.lease = null;
        match.queuePosition = null;
        match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
        released.push(match);
        changed = true;
      }
      if (
        match.status === "waiting"
        && match.capacityReady
        && !match.requiredMemberIds?.length
        && !matchBlockedBySelection(room, match)
      ) {
        simulateOnlineRegulation(room, match);
        if (match.status === "penalties") advanceAutomaticPenalties(room, match);
        match.events = [];
        match.playback = null;
        match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
        changed = true;
        continue;
      }
      if (
        match.status === "waiting"
        && match.capacityReady
        && !matchBlockedBySelection(room, match)
      ) {
        const previousQueuePosition = match.queuePosition;
        const previousLease = match.lease;
        const alreadyReserved = Boolean(previousLease) || Number.isInteger(previousQueuePosition);
        if (!alreadyReserved && reservedRoomMatches >= ONLINE_MAX_RESERVED_MATCHES_PER_ROOM) continue;
        const needsCapacityRequest = !previousLease
          || previousLease.expiresAt <= now + ONLINE_LEASE_RENEW_MS;
        const capacity = needsCapacityRequest
          ? await this.capacityRequest("acquire", room, match)
          : { granted: true, leaseExpiresAt: previousLease.expiresAt, queuePosition: null };
        match.lease = capacity.granted ? { expiresAt: capacity.leaseExpiresAt, renewedAt: now } : null;
        match.queuePosition = capacity.queuePosition;
        if (
          !alreadyReserved
          && (Boolean(match.lease) || Number.isInteger(match.queuePosition))
        ) reservedRoomMatches += 1;
        if (capacity.granted && match.capacityReady) {
          match.liveState = createOnlineLiveState(room, match, now);
          match.simulationVersion = LIVE_SIMULATION_VERSION;
          match.status = "live";
          match.readyMemberIds = [];
          match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
          changed = true;
        } else if (
          previousQueuePosition !== match.queuePosition
          || Boolean(previousLease) !== Boolean(match.lease)
          || previousLease?.expiresAt !== match.lease?.expiresAt
        ) {
          match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
          changed = true;
        }
      }
      const live = match.liveState;
      if (!live || live.status === "finished") continue;
      if (!match.lease || match.lease.expiresAt <= now) {
        const previousQueuePosition = match.queuePosition;
        const hadLease = Boolean(match.lease);
        const capacity = await this.capacityRequest("acquire", room, match);
        match.queuePosition = capacity.queuePosition;
        if (!capacity.granted) {
          match.lease = null;
          if (hadLease || previousQueuePosition !== match.queuePosition) {
            match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
            changed = true;
          }
          continue;
        }
        match.lease = { expiresAt: capacity.leaseExpiresAt, renewedAt: now };
        match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
        changed = true;
      }
      if (match.lease && now - (match.lease.renewedAt || 0) >= ONLINE_LEASE_RENEW_MS) {
        const renewed = await this.capacityRequest("renew", room, match);
        if (renewed.granted) {
          match.lease = { expiresAt: renewed.leaseExpiresAt, renewedAt: now };
          match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
          changed = true;
        } else {
          match.lease = null;
          match.updatedVersion = (room.tournament.stateVersion || 1) + 1;
          changed = true;
          continue;
        }
      }
      const expired = expireLivePenaltyDecision(live, now);
      if (expired.expired) {
        events.push(...expired.events.map((event) => ({ ...event, matchId: match.id })));
        changed = true;
      }
      const controlledCatchupLimit = liveHasHumanController(live)
        ? ONLINE_CONTROLLED_MATCH_CATCHUP_MINUTES
        : LIVE_MAX_BATCH_MINUTES;
      const remainingBudget = Math.max(0, Math.min(LIVE_MAX_BATCH_MINUTES - processedMinutes, controlledCatchupLimit));
      const advanced = advanceLiveMatch(live, {
        now,
        maxMinutes: remainingBudget,
        shouldStop: () => performance.now() - startedAt >= LIVE_MAX_BATCH_CPU_MS,
      });
      processedMinutes += advanced.processedMinutes;
      if (advanced.processedMinutes || advanced.events.length) {
        events.push(...advanced.events.map((event) => ({ ...event, matchId: match.id })));
        projectLiveMatch(match);
        match.updatedVersion = (room.tournament.stateVersion || 0) + 1;
        changed = true;
      }
      if (live.status === "finished") {
        recordOnlineSuspensions(room, match);
        projectLiveMatch(match);
        match.liveState = compactFinishedLiveState(live);
        reservedRoomMatches = Math.max(0, reservedRoomMatches - 1);
        match.updatedVersion = (room.tournament.stateVersion || 0) + 1;
        released.push(match);
      }
      if (processedMinutes >= LIVE_MAX_BATCH_MINUTES || performance.now() - startedAt >= LIVE_MAX_BATCH_CPU_MS) break;
    }

    if (released.length) {
      for (const match of released) match.lease = null;
      settleOnlineTournament(room);
      changed = true;
    }
    const activeMatches = currentOnlineRound(room)?.matches.filter((match) => match.liveState && match.liveState.status !== "finished") || [];
    const queuedMatches = currentOnlineRound(room)?.matches.filter((match) => (
      match.status === "waiting" && match.capacityReady
    )) || [];
    const caughtUp = processedMinutes < LIVE_MAX_BATCH_MINUTES && performance.now() - startedAt < LIVE_MAX_BATCH_CPU_MS;
    const nextAlarmAt = !caughtUp
      ? now + ONLINE_SHORT_ALARM_CONTINUATION_MS
      : activeMatches.length || queuedMatches.length
        ? now + LIVE_MINUTE_MS
        : room.expiresAt;
    structuredLog("simulation-batch", {
      roomId: hashLogValue(room.code),
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      processedMinutes,
      eventCount: events.length,
      activeMatches: activeMatches.length,
      stateVersion: room.tournament.stateVersion || 1,
    });
    writeOnlineAnalytics(this.env, "simulation", processedMinutes, events.length, activeMatches.length);
    return { changed, events, nextAlarmAt, releasedMatches: released };
  }

  async persistRoomBatch(room, events = [], nextAlarmAt = room.expiresAt, receipt = null, releasedMatches = []) {
    structuredLog("room-persist", {
      roomId: hashLogValue(room.code),
      bytes: new TextEncoder().encode(JSON.stringify(room)).byteLength,
      eventCount: events.length,
      releasedMatches: releasedMatches.length,
    });
    await commitAtomicRoomBatch(this.ctx.storage, {
      room,
      events,
      nextAlarmAt,
      receipt,
      eventBucketSize: ONLINE_EVENT_BUCKET_SIZE,
      maxCommandReceipts: ONLINE_MAX_COMMAND_RECEIPTS,
    });
    for (const released of releasedMatches || []) {
      await this.capacityRequest("release", room, released).catch(() => {});
    }
  }

  async scheduleRoomAlarm(room, nextAlarmAt) {
    await this.ctx.storage.setAlarm(Math.min(nextAlarmAt || room.expiresAt, room.expiresAt));
  }

  async eventsAfter(lastSeenEventId = 0) {
    const start = Math.max(0, Number(lastSeenEventId) || 0);
    const room = await this.ctx.storage.get("room");
    const last = room?.tournament?.lastEventId || 0;
    if (start >= last) return [];
    const firstBucket = Math.floor(start / ONLINE_EVENT_BUCKET_SIZE);
    const lastBucket = Math.floor((last - 1) / ONLINE_EVENT_BUCKET_SIZE);
    const events = [];
    for (let bucket = firstBucket; bucket <= lastBucket; bucket += 1) {
      const stored = await this.ctx.storage.get(`events:${bucket}`) || [];
      events.push(...stored.filter((event) => event.id > start));
    }
    return events;
  }

  async fullRoomResponse(room, memberId, status = 200) {
    const events = await this.eventsAfter(0);
    return json({ mode: "snapshot", room: publicRoom(room), events, memberId, stateVersion: room.tournament?.stateVersion || 0, lastEventId: room.tournament?.lastEventId || 0, serverNow: Date.now() }, status);
  }

  async statusResponse(request, room, memberId) {
    const url = new URL(request.url);
    const hasStateCursor = url.searchParams.has("afterStateVersion") && url.searchParams.has("lastSeenEventId");
    const afterStateVersion = Number(url.searchParams.get("afterStateVersion"));
    const lastSeenEventId = Number(url.searchParams.get("lastSeenEventId"));
    const currentVersion = room.tournament?.stateVersion || 0;
    const currentLastEventId = room.tournament?.lastEventId || 0;
    const events = await this.eventsAfter(lastSeenEventId || 0);
    if (
      !hasStateCursor
      || !Number.isFinite(afterStateVersion)
      || !Number.isFinite(lastSeenEventId)
      || afterStateVersion < 0
      || afterStateVersion > currentVersion
      || lastSeenEventId < 0
      || lastSeenEventId > currentLastEventId
    ) {
      return this.fullRoomResponse(room, memberId);
    }
    if (afterStateVersion === currentVersion && !events.length) {
      return json({ mode: "noop", stateVersion: currentVersion, lastEventId: currentLastEventId, serverNow: Date.now(), memberId });
    }
    const matches = room.tournament?.rounds.flatMap((round) => round.matches)
      .filter((match) => (match.updatedVersion || 0) > afterStateVersion)
      .map(publicOnlineMatch) || [];
    const currentRound = currentOnlineRound(room);
    return json({
      mode: "delta",
      roomPatch: {
        status: room.status,
        members: publicRoom(room).members,
        tournamentStatus: room.tournament?.status,
        roundNumber: room.tournament?.roundNumber,
        championTeamId: room.tournament?.championTeamId || null,
        completionReason: room.tournament?.completionReason || null,
        completedAt: room.tournament?.completedAt || null,
        tacticsByTeam: room.tournament?.tacticsByTeam || {},
        currentRound: (currentRound?.updatedVersion || 0) > afterStateVersion
          ? { ...currentRound, matches: currentRound.matches.map(publicOnlineMatch) }
          : undefined,
      },
      matches,
      events,
      stateVersion: currentVersion,
      lastEventId: room.tournament?.lastEventId || 0,
      serverNow: Date.now(),
      memberId,
    });
  }

  async commandReplay(body, action, memberId, room) {
    const receipts = await this.ctx.storage.get("commandReceipts") || [];
    const receipt = receipts.find((item) => item.clientCommandId === body.clientCommandId);
    if (!receipt) return null;
    const fingerprint = commandFingerprint(body, action, memberId);
    if (receipt.fingerprint !== fingerprint) throw new RoomRequestError("That command ID was already used for another action.", 409);
    return this.fullRoomResponse(room, memberId);
  }

  async releaseRoomLeases(room) {
    const matches = room.tournament?.rounds.flatMap((round) => round.matches).filter((match) => match.lease) || [];
    for (const match of matches) {
      await this.capacityRequest("release", room, match).catch(() => {});
      match.lease = null;
    }
  }

  async close(request) {
    const body = await readJson(request);
    requireClientCommandId(body);
    const token = bearerToken(request);
    const room = await this.ctx.storage.get("room");
    if (!token || !room) return unauthorizedResponse();
    const tokenHash = await hashAccessToken(token);
    const member = room.members.find((item) => safeEqual(item.tokenHash, tokenHash));
    if (!member) return unauthorizedResponse();
    const existingReceipts = await this.ctx.storage.get("commandReceipts") || [];
    const replay = existingReceipts.find((item) => item.clientCommandId === body.clientCommandId);
    if (replay) {
      if (replay.fingerprint !== commandFingerprint(body, "close", member.id)) {
        throw new RoomRequestError("That command ID was already used for another action.", 409);
      }
      return json({ closed: true });
    }
    if (room.status === "closed") return unavailableRoomResponse();
    if (!member.isHost) return json({ error: "Only the host can close this room." }, 403);
    await this.releaseRoomLeases(room);
    room.status = "closed";
    await this.ctx.storage.transaction(async (transaction) => {
      const receipts = await transaction.get("commandReceipts") || [];
      receipts.push(commandReceipt(body, "close", member.id));
      await transaction.put("commandReceipts", receipts.slice(-ONLINE_MAX_COMMAND_RECEIPTS));
      await transaction.put("room", room);
      await transaction.setAlarm(Date.now() + 1_000);
    });
    return json({ closed: true });
  }

  async activeRoom() {
    const room = await this.ctx.storage.get("room");
    if (!room) return null;
    if (room.expiresAt <= Date.now() || room.status === "closed") {
      await this.ctx.storage.deleteAll();
      return null;
    }
    if (room.status === "lobby" && (
      room.maxPlayers !== ROOM_PLAYER_CAPACITY
      || room.picksPerMember !== DEFAULT_DRAFT_PICKS_PER_MEMBER
      || room.members.some((member) => member.isCpu)
    )) {
      room.maxPlayers = ROOM_PLAYER_CAPACITY;
      room.picksPerMember = DEFAULT_DRAFT_PICKS_PER_MEMBER;
      room.members = room.members.filter((member) => !member.isCpu);
      await this.ctx.storage.put("room", room);
    }
    if (room.status === "draft-complete" && room.draft?.status === "complete" && !room.tournament) {
      room.status = "matches";
      room.tournament = createOnlineTournament(room);
      settleOnlineTournament(room);
      await this.ctx.storage.put("room", room);
    }
    if (room.status === "matches" && room.tournament && !room.tournament.participantTeamIds) {
      room.tournament = createOnlineTournament(room);
      settleOnlineTournament(room);
      await this.ctx.storage.put("room", room);
    }
    return room;
  }

  async authenticatedRoom(request) {
    const token = bearerToken(request);
    if (!token) return null;
    const room = await this.activeRoom();
    if (!room) return null;
    const tokenHash = await hashAccessToken(token);
    const member = room.members.find((item) => safeEqual(item.tokenHash, tokenHash));
    return member ? { room, member } : null;
  }
}

export class PublicMatchmaker extends DurableObject {
  async fetch(request) {
    const startedAt = performance.now();
    const action = new URL(request.url).pathname.slice(1);
    let status = 500;
    try {
      structuredLog("matchmaking-request", { action, method: request.method });
      let response;
      if (action === "join" && request.method === "POST") response = await this.join(request);
      else if (action === "status" && request.method === "GET") response = await this.status(request);
      else if (action === "cancel" && request.method === "POST") response = await this.cancel(request);
      else response = json({ error: "Not found." }, 404);
      status = response.status;
      return response;
    } catch (error) {
      if (error instanceof RoomRequestError || Number.isInteger(error?.status)) {
        status = error.status;
        return json({ error: error.message }, status);
      }
      throw error;
    } finally {
      structuredLog("matchmaking-request-complete", {
        action,
        status,
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
      });
    }
  }

  async alarm() {
    await this.cleanupExpiredTickets();
  }

  async join(request) {
    const body = await readJson(request);
    requireClientCommandId(body);
    const accessToken = validateClientAccessToken(body.accessToken);
    const name = normalizeDisplayName(body.name);
    if (!name) return invalidNameResponse();
    const tokenHash = await hashAccessToken(accessToken);
    const now = Date.now();
    let ticket = await this.ticketForTokenHash(tokenHash);
    if (!ticket || ticket.expiresAt <= now || ticket.status === "cancelled") {
      const ticketId = makeMemberId();
      ticket = {
        id: ticketId,
        name,
        tokenHash,
        accessToken,
        status: "queued",
        joinedAt: now,
        expiresAt: now + MATCHMAKING_QUEUE_TTL_MS,
      };
      await this.ctx.storage.transaction(async (transaction) => {
        const queue = await transaction.get("queue") || [];
        queue.push(ticketId);
        await transaction.put(`ticket:${ticketId}`, ticket);
        await transaction.put(`token:${tokenHash}`, ticketId);
        await transaction.put("queue", queue);
      });
      await this.scheduleCleanup(ticket.expiresAt);
      writeOnlineAnalytics(this.env, "matchmaking-queued", 1, 0, 0);
    }
    await this.attemptMatch();
    ticket = await this.ctx.storage.get(`ticket:${ticket.id}`) || ticket;
    return json(await this.publicTicket(ticket), ticket.status === "matched" ? 200 : 201);
  }

  async status(request) {
    const ticket = await this.authenticatedTicket(request);
    if (ticket.status === "cancelled") return json({ error: "Matchmaking was cancelled." }, 410);
    if (ticket.expiresAt <= Date.now()) {
      await this.expireTicket(ticket);
      return json({ error: "Matchmaking expired. Start a new search." }, 410);
    }
    if (ticket.status === "queued") await this.attemptMatch();
    const current = await this.ctx.storage.get(`ticket:${ticket.id}`) || ticket;
    return json(await this.publicTicket(current));
  }

  async cancel(request) {
    const body = await readJson(request);
    requireClientCommandId(body);
    const ticket = await this.authenticatedTicket(request);
    if (ticket.status === "matched" || ticket.status === "matching") {
      return json({ error: "Your match has already been found." }, 409);
    }
    if (ticket.status === "cancelled") return json({ status: "cancelled", ticketId: ticket.id });
    ticket.status = "cancelled";
    ticket.accessToken = undefined;
    ticket.expiresAt = Date.now() + 60_000;
    await this.ctx.storage.transaction(async (transaction) => {
      const queue = await transaction.get("queue") || [];
      await transaction.put("queue", queue.filter((ticketId) => ticketId !== ticket.id));
      await transaction.put(`ticket:${ticket.id}`, ticket);
      await transaction.delete(`token:${ticket.tokenHash}`);
    });
    return json({ status: "cancelled", ticketId: ticket.id });
  }

  async authenticatedTicket(request) {
    const ticketId = request.headers.get("X-Matchmaking-Ticket");
    if (!MATCHMAKING_TICKET_PATTERN.test(ticketId || "")) {
      throw new RoomRequestError("A valid matchmaking ticket is required.", 400);
    }
    const token = bearerToken(request);
    if (!token) throw new RoomRequestError("Matchmaking authorization is required.", 401);
    const ticket = await this.ctx.storage.get(`ticket:${ticketId}`);
    if (!ticket) throw new RoomRequestError("Matchmaking ticket not found.", 404);
    const tokenHash = await hashAccessToken(token);
    if (!safeEqual(ticket.tokenHash, tokenHash)) {
      throw new RoomRequestError("Matchmaking authorization failed.", 401);
    }
    return ticket;
  }

  async ticketForTokenHash(tokenHash) {
    const ticketId = await this.ctx.storage.get(`token:${tokenHash}`);
    return ticketId ? this.ctx.storage.get(`ticket:${ticketId}`) : null;
  }

  async publicTicket(ticket) {
    const response = {
      status: ticket.status,
      ticketId: ticket.id,
      joinedAt: ticket.joinedAt,
      expiresAt: ticket.expiresAt,
    };
    if (ticket.status === "queued") {
      const queue = await this.ctx.storage.get("queue") || [];
      const position = queue.indexOf(ticket.id);
      response.position = position >= 0 ? position + 1 : null;
      response.queuedPlayers = queue.length;
      response.waitedMs = Math.max(0, Date.now() - ticket.joinedAt);
    } else if (ticket.status === "matching") {
      response.waitedMs = Math.max(0, Date.now() - ticket.joinedAt);
    } else if (ticket.status === "matched") {
      response.room = {
        code: ticket.roomCode,
        memberId: ticket.memberId,
        isHost: ticket.isHost,
        matchedAt: ticket.matchedAt,
      };
    }
    return response;
  }

  async attemptMatch() {
    const pair = await this.ctx.storage.transaction(async (transaction) => {
      const queue = await transaction.get("queue") || [];
      const available = [];
      const now = Date.now();
      for (const ticketId of queue) {
        const ticket = await transaction.get(`ticket:${ticketId}`);
        if (!ticket || ticket.status !== "queued" || ticket.expiresAt <= now) continue;
        available.push(ticket);
      }
      const secondIndex = available.findIndex((ticket, index) => (
        index > 0 && ticket.name.toLocaleLowerCase() !== available[0]?.name.toLocaleLowerCase()
      ));
      if (secondIndex < 1) {
        await transaction.put("queue", available.map((ticket) => ticket.id));
        return null;
      }
      const selected = [available[0], available[secondIndex]];
      const selectedIds = new Set(selected.map((ticket) => ticket.id));
      for (const ticket of selected) {
        ticket.status = "matching";
        await transaction.put(`ticket:${ticket.id}`, ticket);
      }
      await transaction.put("queue", available
        .filter((ticket) => !selectedIds.has(ticket.id))
        .map((ticket) => ticket.id));
      return selected;
    });
    if (!pair) return;

    try {
      const assignment = await this.createMatchedRoom(pair);
      const matchedAt = Date.now();
      await this.ctx.storage.transaction(async (transaction) => {
        for (const ticket of pair) {
          const current = await transaction.get(`ticket:${ticket.id}`);
          if (!current || current.status !== "matching") continue;
          const member = assignment.members.find((entry) => entry.ticketId === ticket.id);
          await transaction.put(`ticket:${ticket.id}`, {
            id: ticket.id,
            name: ticket.name,
            tokenHash: ticket.tokenHash,
            status: "matched",
            joinedAt: ticket.joinedAt,
            matchedAt,
            expiresAt: matchedAt + MATCHMAKING_ASSIGNMENT_TTL_MS,
            roomCode: assignment.roomCode,
            memberId: member.memberId,
            isHost: member.isHost,
          });
        }
      });
      await this.scheduleCleanup(matchedAt + MATCHMAKING_ASSIGNMENT_TTL_MS);
      writeOnlineAnalytics(this.env, "matchmaking-matched", 2, 1, 0);
    } catch (error) {
      const now = Date.now();
      await this.ctx.storage.transaction(async (transaction) => {
        const queue = await transaction.get("queue") || [];
        for (const ticket of pair) {
          const current = await transaction.get(`ticket:${ticket.id}`);
          if (!current || current.status !== "matching" || current.expiresAt <= now) continue;
          current.status = "queued";
          await transaction.put(`ticket:${ticket.id}`, current);
          if (!queue.includes(ticket.id)) queue.push(ticket.id);
        }
        await transaction.put("queue", queue);
      });
      structuredLog("matchmaking-room-failure", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async createMatchedRoom(pair) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const roomCode = makeRoomCode();
      const stub = this.env.TOURNAMENT_ROOMS.get(this.env.TOURNAMENT_ROOMS.idFromName(roomCode));
      const host = pair[0];
      const guest = pair[1];
      const created = await this.roomCommand(stub, roomCode, "create", "POST", {
        name: host.name,
        accessToken: host.accessToken,
        visibility: "public",
      });
      if (created.response.status === 409) continue;
      if (!created.response.ok) throw new Error(created.payload.error || "Could not create a matched room.");
      const joined = await this.roomCommand(stub, roomCode, "join", "POST", {
        name: guest.name,
        accessToken: guest.accessToken,
      });
      if (!joined.response.ok) {
        await this.closeMatchedRoom(stub, roomCode, host.accessToken);
        throw new Error(joined.payload.error || "Could not join the matched room.");
      }
      const drafted = await this.roomCommand(stub, roomCode, "draft-start", "POST", {}, host.accessToken);
      if (!drafted.response.ok) {
        await this.closeMatchedRoom(stub, roomCode, host.accessToken);
        throw new Error(drafted.payload.error || "Could not start the matched room.");
      }
      return {
        roomCode,
        members: [
          { ticketId: host.id, memberId: created.payload.memberId, isHost: true },
          { ticketId: guest.id, memberId: joined.payload.memberId, isHost: false },
        ],
      };
    }
    throw new Error("Could not reserve a public room code.");
  }

  async roomCommand(stub, roomCode, action, method, body = {}, token = null) {
    const headers = new Headers({
      "Content-Type": "application/json",
      "X-Room-Code": roomCode,
    });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await stub.fetch(new Request(`https://room.internal/${action}`, {
      method,
      headers,
      body: method === "GET" ? undefined : JSON.stringify({
        ...body,
        clientCommandId: crypto.randomUUID(),
      }),
    }));
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  }

  async closeMatchedRoom(stub, roomCode, token) {
    try {
      await stub.fetch(new Request("https://room.internal/close", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Room-Code": roomCode,
        },
      }));
    } catch {
      // The normal room expiry remains a safe fallback if cleanup cannot complete.
    }
  }

  async expireTicket(ticket) {
    await this.ctx.storage.transaction(async (transaction) => {
      const queue = await transaction.get("queue") || [];
      await transaction.put("queue", queue.filter((ticketId) => ticketId !== ticket.id));
      await transaction.delete(`ticket:${ticket.id}`);
      await transaction.delete(`token:${ticket.tokenHash}`);
    });
  }

  async cleanupExpiredTickets() {
    const now = Date.now();
    const tickets = await this.ctx.storage.list({ prefix: "ticket:" });
    const expired = [...tickets.values()].filter((ticket) => ticket.expiresAt <= now);
    if (expired.length) {
      await this.ctx.storage.transaction(async (transaction) => {
        const queue = await transaction.get("queue") || [];
        const expiredIds = new Set(expired.map((ticket) => ticket.id));
        await transaction.put("queue", queue.filter((ticketId) => !expiredIds.has(ticketId)));
        for (const ticket of expired) {
          await transaction.delete(`ticket:${ticket.id}`);
          await transaction.delete(`token:${ticket.tokenHash}`);
        }
      });
    }
    const remaining = [...(await this.ctx.storage.list({ prefix: "ticket:" })).values()];
    if (remaining.length) {
      await this.ctx.storage.setAlarm(Math.min(...remaining.map((ticket) => ticket.expiresAt)));
    } else {
      await this.ctx.storage.deleteAlarm();
    }
  }

  async scheduleCleanup(expiresAt) {
    const currentAlarm = await this.ctx.storage.getAlarm();
    if (!currentAlarm || expiresAt < currentAlarm) await this.ctx.storage.setAlarm(expiresAt);
  }
}

export class OnlineCapacityCoordinator extends DurableObject {
  async fetch(request) {
    const startedAt = performance.now();
    const action = new URL(request.url).pathname.slice(1);
    if (!["acquire", "renew", "release", "diagnostics"].includes(action)) {
      return json({ error: "Not found." }, 404);
    }
    const body = request.method === "POST" ? await readJson(request) : {};
    const now = Date.now();
    let result;
    const capacity = await this.ctx.storage.get("capacity") || { sequence: 0, queue: [], leases: {} };
    removeExpiredCapacity(capacity, now);
    const limit = configuredCapacityShardLimit(this.env);
    if (action === "acquire") {
      validateCapacityIdentity(body);
      const key = `${body.roomId}:${body.matchId}`;
      const priority = body.priority === "interactive" ? "interactive" : "background";
      const existing = capacity.leases[key];
      if (existing) {
        existing.expiresAt = now + ONLINE_LEASE_MS;
        existing.priority = priority;
      } else {
        const queued = capacity.queue.find((entry) => entry.key === key);
        if (queued) {
          queued.priority = priority;
        } else {
          capacity.sequence += 1;
          capacity.queue.push({ key, roomId: body.roomId, matchId: body.matchId, priority, sequence: capacity.sequence });
        }
      }
      fillCapacityLeases(capacity, limit, now);
      result = capacityResult(capacity, key, limit, now);
    } else if (action === "renew") {
      validateCapacityIdentity(body);
      const key = `${body.roomId}:${body.matchId}`;
      if (capacity.leases[key]) {
        capacity.leases[key].renewedAt = now;
        capacity.leases[key].expiresAt = now + ONLINE_LEASE_MS;
      }
      result = capacityResult(capacity, key, limit, now);
    } else if (action === "release") {
      validateCapacityIdentity(body);
      const key = `${body.roomId}:${body.matchId}`;
      delete capacity.leases[key];
      capacity.queue = capacity.queue.filter((entry) => entry.key !== key);
      fillCapacityLeases(capacity, limit, now);
      result = capacityResult(capacity, key, limit, now);
    } else {
      fillCapacityLeases(capacity, limit, now);
      result = capacityResult(capacity, null, limit, now);
    }
    await this.ctx.storage.put("capacity", capacity);
    if (Object.keys(capacity.leases).length || capacity.queue.length) {
      await this.ctx.storage.setAlarm(now + ONLINE_LEASE_RENEW_MS);
    } else {
      await this.ctx.storage.deleteAlarm();
    }
    structuredLog("capacity", {
      action,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
      activeMatches: result.activeMatches,
      activeRooms: result.activeRooms,
      queueDepth: result.queueDepth,
    });
    writeOnlineAnalytics(this.env, "capacity", result.activeMatches, result.queueDepth, result.activeRooms);
    return json(result);
  }

  async alarm() {
    const request = new Request("https://capacity.internal/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    await this.fetch(request);
  }
}

function configuredCapacityShardLimit(env) {
  const configured = Number(env?.ONLINE_MAX_ACTIVE_MATCHES);
  const globalLimit = Number.isInteger(configured) && configured > 0 ? configured : ONLINE_DEFAULT_ACTIVE_MATCH_LIMIT;
  return Math.max(1, Math.floor(globalLimit / ONLINE_CAPACITY_SHARDS));
}

function validateCapacityIdentity(body) {
  if (!/^[a-zA-Z0-9:_-]{1,128}$/.test(body.roomId || "") || !/^[a-zA-Z0-9:_-]{1,128}$/.test(body.matchId || "")) {
    throw new RoomRequestError("Invalid capacity identity.", 400);
  }
}

function removeExpiredCapacity(capacity, now) {
  Object.entries(capacity.leases || {}).forEach(([key, lease]) => {
    if (!lease || lease.expiresAt <= now) delete capacity.leases[key];
  });
}

function fillCapacityLeases(capacity, limit, now) {
  capacity.queue.sort((first, second) => {
    const priorityDifference = Number(second.priority === "interactive") - Number(first.priority === "interactive");
    return priorityDifference || first.sequence - second.sequence;
  });
  while (Object.keys(capacity.leases).length < limit && capacity.queue.length) {
    const entry = capacity.queue.shift();
    capacity.leases[entry.key] = { ...entry, acquiredAt: now, renewedAt: now, expiresAt: now + ONLINE_LEASE_MS };
  }
}

function capacityResult(capacity, key, limit, now) {
  const validLeases = Object.values(capacity.leases || {}).filter((lease) => lease.expiresAt > now);
  const queuedIndex = key ? capacity.queue.findIndex((entry) => entry.key === key) : -1;
  return {
    granted: key ? Boolean(capacity.leases[key]?.expiresAt > now) : undefined,
    leaseExpiresAt: key ? capacity.leases[key]?.expiresAt || null : undefined,
    queuePosition: queuedIndex >= 0 ? queuedIndex + 1 : null,
    activeMatches: validLeases.length,
    activeRooms: new Set(validLeases.map((lease) => lease.roomId)).size,
    queueDepth: capacity.queue.length,
    limit,
  };
}

async function createRoom(request, env) {
  const body = await readJson(request.clone());
  const code = normalizeRoomCode(body.roomCode);
  if (!/^\d{4}$/.test(code)) {
    return json({ error: "A valid four-digit room code is required." }, 400);
  }
  return forwardToRoom(env, code, request, "create");
}

async function submitBugReport(request, env, url) {
  if (!(await allowRequest(env.BUG_REPORT_LIMITER, rateKey(request, "bug-report")))) {
    return json({ error: "Too many reports. Try again in a minute." }, 429);
  }

  if (!env.DISCORD_BUG_WEBHOOK_URL) {
    structuredLog("bug-report-missing-webhook");
    return json({ error: "Bug reports are not configured yet." }, 503);
  }

  const body = await readJson(request, 2048);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const path = typeof body.path === "string" ? body.path.trim().slice(0, 180) : "/";
  if (message.length < 3) return json({ error: "Write a little more detail first." }, 400);
  if (message.length > 900) return json({ error: "Keep bug reports under 900 characters." }, 400);

  const discordResponse = await fetch(env.DISCORD_BUG_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "256 Teams Feedback",
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: "Anonymous feedback",
          description: message,
          color: 0x95f0c5,
          fields: [
            { name: "Page", value: path || "/", inline: false },
            { name: "Origin", value: url.origin, inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!discordResponse.ok) {
    structuredLog("bug-report-discord-failure", { status: discordResponse.status });
    return json({ error: "Discord did not accept that report yet." }, 502);
  }

  structuredLog("bug-report-sent", { path: hashLogValue(path), length: message.length });
  return json({ ok: true });
}

async function forwardToRoom(env, code, request, action) {
  const id = env.TOURNAMENT_ROOMS.idFromName(code);
  const stub = env.TOURNAMENT_ROOMS.get(id);
  const headers = new Headers();
  headers.set("X-Room-Code", code);
  const authorization = request.headers.get("Authorization");
  if (authorization) headers.set("Authorization", authorization);
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;
  const sourceUrl = new URL(request.url);
  return stub.fetch(new Request(`https://room.internal/${action}${sourceUrl.search}`, {
    method: request.method,
    headers,
    body,
  }));
}

async function forwardToMatchmaker(env, request, action, ticketId = null) {
  const stub = env.PUBLIC_MATCHMAKER.get(env.PUBLIC_MATCHMAKER.idFromName("public-v1"));
  const headers = new Headers();
  const authorization = request.headers.get("Authorization");
  if (authorization) headers.set("Authorization", authorization);
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  if (ticketId) headers.set("X-Matchmaking-Ticket", ticketId);
  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;
  return stub.fetch(new Request(`https://matchmaker.internal/${action}`, {
    method: request.method,
    headers,
    body,
  }));
}

const ONLINE_TACTICS = Object.freeze({
  "park-the-bus": { attack: -0.34, defense: 0.34, volatility: 0.78 },
  defensive: { attack: -0.18, defense: 0.18, volatility: 0.88 },
  balanced: { attack: 0, defense: 0, volatility: 1 },
  "tiki-taka": { attack: 0.06, defense: 0.08, volatility: 0.90 },
  counter: { attack: 0.10, defense: -0.02, volatility: 1.12 },
  "high-press": { attack: 0.14, defense: -0.08, volatility: 1.18 },
  attacking: { attack: 0.18, defense: -0.18, volatility: 1.12 },
  "ultra-attacking": { attack: 0.34, defense: -0.34, volatility: 1.28 },
});
const PENALTY_TARGETS = Object.freeze(["top-left", "top-right", "middle", "bottom-left", "bottom-right"]);
const DRAFT_TEAM_BY_ID = new Map(DRAFT_TEAMS.map((team) => [team.id, team]));

function createOnlineTournament(room) {
  const teamIds = DRAFT_TEAMS.map((team) => team.id);
  const draftedTeamIds = room.draft.picks.map((pick) => pick.teamId);
  const activeMemberIds = new Set(room.members.filter((member) => !member.leftAt && !member.isCpu).map((member) => member.id));
  const teamOwnerById = Object.fromEntries(room.draft.picks.map((pick) => [
    pick.teamId,
    activeMemberIds.has(pick.memberId) ? pick.memberId : `cpu:${pick.teamId}`,
  ]));
  const activeTeamByMember = {};
  const tactics = {};
  const tacticsByTeam = Object.fromEntries(draftedTeamIds.map((teamId) => [teamId, "balanced"]));
  room.members.forEach((member) => {
    if (member.isCpu || member.leftAt) return;
    const ownedTeams = draftedTeamIds.filter((teamId) => teamOwnerById[teamId] === member.id);
    activeTeamByMember[member.id] = bestOnlineTeam(ownedTeams);
    tactics[member.id] = "balanced";
  });
  return {
    status: "active",
    simulationVersion: LIVE_SIMULATION_VERSION,
    stateVersion: 1,
    lastEventId: 0,
    roundNumber: 1,
    rounds: [{ number: 1, matches: createOpeningRound(teamIds, teamOwnerById), updatedVersion: 1 }],
    participantTeamIds: teamIds,
    teamOwnerById,
    activeTeamByMember,
    selectionRequired: [],
    tactics,
    tacticsByTeam,
    suspensionsByTeam: {},
    championTeamId: null,
    startedAt: Date.now(),
    completedAt: null,
  };
}

function createOpeningRound(teamIds, teamOwnerById) {
  let bracketSize = 2;
  while (bracketSize < teamIds.length) bracketSize *= 2;
  const matchCount = bracketSize / 2;
  const playedMatchCount = teamIds.length - matchCount;
  return createOwnerSafeMatches(1, teamIds, teamOwnerById, playedMatchCount);
}

function createOwnerSafeMatches(roundNumber, teamIds, teamOwnerById, desiredPairCount = Math.floor(teamIds.length / 2)) {
  const groups = new Map();
  secureShuffle(teamIds).forEach((teamId) => {
    const ownerId = onlineOwnerKey(teamId, teamOwnerById);
    if (!groups.has(ownerId)) groups.set(ownerId, []);
    groups.get(ownerId).push(teamId);
  });
  const pairs = [];
  while (pairs.length < desiredPairCount) {
    const available = [...groups.entries()]
      .filter(([, teams]) => teams.length)
      .sort((a, b) => {
        const countDiff = b[1].length - a[1].length;
        if (countDiff) return countDiff;
        return Number(ownerIsCpu(a[0])) - Number(ownerIsCpu(b[0]));
      });
    if (available.length < 2) break;
    const [firstOwnerId, firstTeams] = available[0];
    const firstIsCpu = ownerIsCpu(firstOwnerId);
    const preferredSecond = available.slice(1).find(([ownerId]) => (
      ownerId !== firstOwnerId && (firstIsCpu ? !ownerIsCpu(ownerId) : ownerIsCpu(ownerId))
    ));
    const [, secondTeams] = preferredSecond || available.find(([ownerId]) => ownerId !== firstOwnerId) || [];
    if (!secondTeams) break;
    const first = firstTeams.pop();
    const second = secondTeams.pop();
    pairs.push([first, second]);
  }
  const byes = secureShuffle([...groups.values()].flat());
  return [
    ...pairs.map(([homeTeamId, awayTeamId], index) => createOnlineMatch(roundNumber, index, homeTeamId, awayTeamId)),
    ...byes.map((homeTeamId, offset) => createOnlineMatch(roundNumber, pairs.length + offset, homeTeamId, null)),
  ];
}

function onlineOwnerKey(teamId, teamOwnerById) {
  return teamOwnerById[teamId] || `cpu:${teamId}`;
}

function ownerIsCpu(ownerId) {
  return String(ownerId).startsWith("cpu:");
}

function createOnlineMatch(roundNumber, index, homeTeamId, awayTeamId) {
  const isBye = !awayTeamId;
  return {
    id: `r${roundNumber}-m${index + 1}`,
    simulationVersion: isBye ? 1 : LIVE_SIMULATION_VERSION,
    roundNumber,
    homeTeamId,
    awayTeamId,
    status: isBye ? "complete" : "waiting",
    requiredMemberIds: [],
    readyMemberIds: [],
    homeScore: isBye ? 0 : null,
    awayScore: isBye ? 0 : null,
    winnerTeamId: isBye ? homeTeamId : null,
    events: [],
    penalty: null,
    completedAt: isBye ? Date.now() : null,
    liveState: null,
    updatedVersion: 1,
    lease: null,
  };
}

function currentOnlineRound(room) {
  return room.tournament?.rounds.at(-1) || null;
}

function liveHasHumanController(live) {
  return Boolean(live?.controllers?.home || live?.controllers?.away);
}

function findCurrentOnlineMatch(room, matchId) {
  return currentOnlineRound(room)?.matches.find((match) => match.id === matchId) || null;
}

function findOnlineMatch(room, matchId) {
  return room.tournament?.rounds.flatMap((round) => round.matches).find((match) => match.id === matchId) || null;
}

function memberById(room, memberId) {
  return room.members.find((member) => member.id === memberId) || null;
}

function controllerForTeam(room, teamId) {
  if (!teamId) return null;
  const ownerId = room.tournament.teamOwnerById[teamId];
  const owner = memberById(room, ownerId);
  if (!owner || owner.isCpu || owner.leftAt) return null;
  return ownerId;
}

function relinquishOnlineMemberControl(room, memberId, now = Date.now()) {
  const tournament = room.tournament;
  if (!tournament) return;
  Object.entries(tournament.teamOwnerById || {}).forEach(([teamId, ownerId]) => {
    if (ownerId === memberId) tournament.teamOwnerById[teamId] = `cpu:${teamId}`;
  });
  delete tournament.activeTeamByMember?.[memberId];
  delete tournament.tactics?.[memberId];
  tournament.selectionRequired = (tournament.selectionRequired || []).filter((id) => id !== memberId);
  tournament.rounds?.forEach((round) => round.matches.forEach((match) => {
    match.readyMemberIds = (match.readyMemberIds || []).filter((id) => id !== memberId);
    match.requiredMemberIds = (match.requiredMemberIds || []).filter((id) => id !== memberId);
    if (match.liveState?.controllers?.home === memberId) match.liveState.controllers.home = null;
    if (match.liveState?.controllers?.away === memberId) match.liveState.controllers.away = null;
    if (match.liveState?.pendingDecision?.memberId === memberId) match.liveState.pendingDecision.deadlineAt = now;
    if (match.playback?.controllerMemberIds) {
      match.playback.controllerMemberIds = match.playback.controllerMemberIds.filter((id) => id !== memberId);
    }
  }));
  tournament.stateVersion = (tournament.stateVersion || 0) + 1;
  settleOnlineTournament(room);
}

function requiredControllersForMatch(room, match) {
  return [...new Set([controllerForTeam(room, match.homeTeamId), controllerForTeam(room, match.awayTeamId)].filter(Boolean))];
}

function matchBlockedBySelection(room, match) {
  const owners = [match.homeTeamId, match.awayTeamId].map((teamId) => room.tournament.teamOwnerById[teamId]);
  return owners.some((ownerId) => room.tournament.selectionRequired.includes(ownerId));
}

function settleOnlineTournament(room) {
  const tournament = room.tournament;
  if (!tournament || tournament.status !== "active") return;
  for (let pass = 0; pass < 256; pass += 1) {
    let changed = false;
    const round = currentOnlineRound(room);
    if (!round) return;

    for (const match of round.matches) {
      if (match.status !== "waiting" || matchBlockedBySelection(room, match)) continue;
      const required = requiredControllersForMatch(room, match);
      match.requiredMemberIds = required;
      match.readyMemberIds = match.readyMemberIds.filter((memberId) => required.includes(memberId));
      match.capacityReady = required.length === 0 || required.every((memberId) => match.readyMemberIds.includes(memberId));
    }

    if (refreshOnlineSelections(room)) changed = true;
    if (round.matches.every((match) => match.status === "complete")) {
      const winners = round.matches.map((match) => match.winnerTeamId).filter(Boolean);
      const remainingHumanOwners = new Set(winners
        .map((teamId) => tournament.teamOwnerById[teamId])
        .filter(Boolean));
      if (remainingHumanOwners.size === 0) {
        tournament.status = "complete";
        tournament.championTeamId = null;
        tournament.completionReason = "all-players-eliminated";
        tournament.completedAt = Date.now();
        room.status = "tournament-complete";
        return;
      }
      if (winners.length === 1) {
        tournament.status = "complete";
        tournament.championTeamId = winners[0];
        tournament.completionReason = "champion";
        tournament.completedAt = Date.now();
        room.status = "tournament-complete";
        return;
      }
      const remainingOwners = new Set(winners.map((teamId) => onlineOwnerKey(teamId, tournament.teamOwnerById)));
      if (remainingOwners.size === 1) {
        tournament.status = "complete";
        tournament.championTeamId = bestOnlineTeam(winners);
        tournament.completionReason = "champion";
        tournament.completedAt = Date.now();
        room.status = "tournament-complete";
        return;
      }
      const nextRoundNumber = round.number + 1;
      tournament.roundNumber = nextRoundNumber;
      tournament.rounds.push({
        number: nextRoundNumber,
        matches: createOwnerSafeMatches(nextRoundNumber, winners, tournament.teamOwnerById),
        updatedVersion: (tournament.stateVersion || 0) + 1,
      });
      changed = true;
    }

    if (!changed) return;
  }
  throw new Error("The online tournament could not settle.");
}

function createOnlineLiveState(room, match, now = Date.now()) {
  const homeController = controllerForTeam(room, match.homeTeamId);
  const awayController = controllerForTeam(room, match.awayTeamId);
  const seedValues = new Uint32Array(1);
  crypto.getRandomValues(seedValues);
  const suspensionMap = room.tournament.suspensionsByTeam ||= {};
  const homeSuspensions = new Set(suspensionMap[match.homeTeamId] || []);
  const awaySuspensions = new Set(suspensionMap[match.awayTeamId] || []);
  const state = createLiveMatchState({
    matchId: match.id,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeRating: onlineTeamRating(match.homeTeamId),
    awayRating: onlineTeamRating(match.awayTeamId),
    homeRoster: onlineRoster(match.homeTeamId).filter((player) => !homeSuspensions.has(player.id)),
    awayRoster: onlineRoster(match.awayTeamId).filter((player) => !awaySuspensions.has(player.id)),
    homeTactic: room.tournament.tacticsByTeam?.[match.homeTeamId] || "balanced",
    awayTactic: room.tournament.tacticsByTeam?.[match.awayTeamId] || "balanced",
    seed: seedValues[0],
    now,
  });
  // A dismissal is a one-match ban: consume it only when the team's next match starts.
  delete suspensionMap[match.homeTeamId];
  delete suspensionMap[match.awayTeamId];
  state.controllers = { home: homeController, away: awayController };
  const homeMomentum = onlineMomentumMultiplier(room, match.homeTeamId, match.awayTeamId, match.roundNumber);
  const awayMomentum = onlineMomentumMultiplier(room, match.awayTeamId, match.homeTeamId, match.roundNumber);
  state.homeMomentum = clamp(homeMomentum, 0.85, 1.15);
  state.awayMomentum = clamp(awayMomentum, 0.85, 1.15);
  startLiveMatch(state, now);
  return state;
}

function recordOnlineSuspensions(room, match) {
  const live = match.liveState;
  if (!live || live.status !== "finished" || live.suspensionsCommitted) return;
  const suspensionMap = room.tournament.suspensionsByTeam ||= {};
  for (const side of ["home", "away"]) {
    const teamId = match[`${side}TeamId`];
    const prefix = `${teamId}:player:`;
    const dismissed = live.suspensionPlayerIds.filter((playerId) => playerId.startsWith(prefix));
    if (dismissed.length) suspensionMap[teamId] = [...new Set([...(suspensionMap[teamId] || []), ...dismissed])];
  }
  live.suspensionsCommitted = true;
}

function onlineRoster(teamId) {
  const team = DRAFT_TEAM_BY_ID.get(teamId);
  const positions = [
    "GK", "RB", "CB", "CB", "LB", "CDM", "CM", "CAM", "RW", "ST", "LW",
    "GK", "GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CAM", "RW", "LW", "ST", "ST", "RM", "LM",
  ];
  const rating = team?.simulationRatings?.overall || onlineTeamRating(teamId);
  const names = team?.players || [];
  return positions.slice(0, names.length).map((position, index) => ({
    id: `${teamId}:player:${index + 1}`,
    name: names[index],
    position,
    overall: clamp(Math.round(rating + 4 - index * 0.45), 25, 99),
    placeholder: false,
  }));
}

function simulateOnlineRegulation(room, match) {
  match.playback ||= createOnlinePlayback(room, match);
  const homeTactic = tacticForTeam(room, match.homeTeamId);
  const awayTactic = tacticForTeam(room, match.awayTeamId);
  const qualityEdge = (onlineTeamRating(match.homeTeamId) - onlineTeamRating(match.awayTeamId)) / 32;
  const homeMomentum = onlineMomentumMultiplier(room, match.homeTeamId, match.awayTeamId, match.roundNumber);
  const awayMomentum = onlineMomentumMultiplier(room, match.awayTeamId, match.homeTeamId, match.roundNumber);
  const homeExpected = clamp((1.22 + qualityEdge + homeTactic.attack - awayTactic.defense) * homeMomentum, 0.18, 3.8);
  const awayExpected = clamp((1.16 - qualityEdge + awayTactic.attack - homeTactic.defense) * awayMomentum, 0.18, 3.8);
  match.homeScore = sampleOnlineGoals(homeExpected, (homeTactic.volatility + awayTactic.volatility) / 2);
  match.awayScore = sampleOnlineGoals(awayExpected, (homeTactic.volatility + awayTactic.volatility) / 2);
  match.events = createOnlineGoalEvents(match);
  match.readyMemberIds = [];
  if (match.homeScore === match.awayScore) {
    match.status = "penalties";
    match.penalty = {
      homeScore: 0,
      awayScore: 0,
      homeKicks: 0,
      awayKicks: 0,
      currentTeamId: match.homeTeamId,
      kicks: [],
    };
    return;
  }
  completeOnlineMatch(match, match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId);
}

function onlineMomentumMultiplier(room, teamId, nextOpponentTeamId, roundNumber) {
  if (roundNumber <= 1) return 1;
  const previousRound = room.tournament.rounds.find((round) => round.number === roundNumber - 1);
  const previousMatch = previousRound?.matches.find((candidate) => (
    candidate.status === "complete"
    && candidate.winnerTeamId === teamId
    && (candidate.homeTeamId === teamId || candidate.awayTeamId === teamId)
  ));
  if (!previousMatch) return 1;
  const defeatedTeamId = previousMatch.homeTeamId === teamId
    ? previousMatch.awayTeamId
    : previousMatch.homeTeamId;
  if (!defeatedTeamId || !nextOpponentTeamId) return 1;
  return giantKillingMomentumMultiplier(
    onlineTeamRating(teamId),
    onlineTeamRating(defeatedTeamId),
    onlineTeamRating(nextOpponentTeamId),
  );
}

function createOnlineGoalEvents(match) {
  const scoringTeams = secureShuffle([
    ...Array.from({ length: match.homeScore }, () => match.homeTeamId),
    ...Array.from({ length: match.awayScore }, () => match.awayTeamId),
  ]);
  const minutes = new Set();
  const addMissedPenalty = secureRandomFloat() < 0.18;
  while (minutes.size < scoringTeams.length + (addMissedPenalty ? 1 : 0)) minutes.add(2 + secureRandomIndex(88));
  const orderedMinutes = [...minutes].sort((a, b) => a - b);
  const incidents = scoringTeams.map((teamId, index) => ({
    type: secureRandomFloat() < 0.2 ? "penalty" : "goal",
    minute: orderedMinutes[index],
    teamId,
    scored: true,
  }));
  if (addMissedPenalty) {
    incidents.push({
      type: "penalty",
      minute: orderedMinutes.at(-1),
      teamId: secureRandomFloat() < 0.5 ? match.homeTeamId : match.awayTeamId,
      scored: false,
    });
  }
  incidents.sort((a, b) => a.minute - b.minute);
  let homeScore = 0;
  let awayScore = 0;
  return incidents.map((incident) => {
    if (incident.scored && incident.teamId === match.homeTeamId) homeScore += 1;
    else if (incident.scored) awayScore += 1;
    return { ...incident, homeScore, awayScore };
  });
}

function tacticForTeam(room, teamId) {
  return ONLINE_TACTICS[room.tournament.tacticsByTeam?.[teamId] || "balanced"] || ONLINE_TACTICS.balanced;
}

function onlineTeamRating(teamId) {
  const team = DRAFT_TEAM_BY_ID.get(teamId);
  if (Number.isFinite(team?.simulationRatings?.overall)) return clamp(team.simulationRatings.overall, 24, 100);
  const rank = team?.officialFifaRank;
  return Number.isInteger(rank) ? clamp(101 - rank * 0.34, 28, 100) : 24;
}

function sampleOnlineGoals(expected, volatility) {
  const lambda = clamp(expected * volatility, 0.08, 4.4);
  const threshold = Math.exp(-lambda);
  let product = 1;
  let goals = 0;
  while (product > threshold && goals < 9) {
    product *= secureRandomFloat();
    if (product > threshold) goals += 1;
  }
  return goals;
}

function advanceAutomaticPenalties(room, match) {
  let changed = false;
  for (let kick = 0; kick < 64 && match.status === "penalties"; kick += 1) {
    const shootingTeamId = match.penalty.currentTeamId;
    if (controllerForTeam(room, shootingTeamId)) break;
    processOnlinePenalty(
      match,
      shootingTeamId,
      PENALTY_TARGETS[secureRandomIndex(PENALTY_TARGETS.length)],
      false,
    );
    changed = true;
  }
  return changed;
}

function processOnlinePenalty(match, shootingTeamId, target, manuallyAimed) {
  const isHome = shootingTeamId === match.homeTeamId;
  const goalkeeperTarget = PENALTY_TARGETS[secureRandomIndex(PENALTY_TARGETS.length)];
  const goalkeeperMatched = goalkeeperTarget === target;
  const shootingRating = onlineTeamRating(shootingTeamId);
  const goalChance = manuallyAimed
    ? onlineManualPenaltyGoalChance(shootingRating, goalkeeperMatched)
    : onlineAutomaticPenaltyGoalChance(shootingRating, goalkeeperMatched);
  const scored = target === "middle" || (!goalkeeperMatched && secureRandomFloat() < goalChance);
  const missType = scored ? null : goalkeeperMatched ? "save" : "wide";
  if (isHome) {
    match.penalty.homeKicks += 1;
    if (scored) match.penalty.homeScore += 1;
  } else {
    match.penalty.awayKicks += 1;
    if (scored) match.penalty.awayScore += 1;
  }
  match.penalty.kicks.push({ teamId: shootingTeamId, target, goalkeeperTarget, scored, missType });

  const { homeScore, awayScore, homeKicks, awayKicks } = match.penalty;
  const penaltyWinner = onlinePenaltyWinner(match.penalty);
  if (penaltyWinner || homeKicks + awayKicks >= 60) {
    const winnerTeamId = penaltyWinner === "home"
      ? match.homeTeamId
      : penaltyWinner === "away"
        ? match.awayTeamId
        : homeScore === awayScore
      ? (secureRandomFloat() < 0.5 ? match.homeTeamId : match.awayTeamId)
      : homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
    match.penalty.currentTeamId = null;
    completeOnlineMatch(match, winnerTeamId);
    return;
  }
  match.penalty.currentTeamId = homeKicks === awayKicks ? match.homeTeamId : match.awayTeamId;
}

function completeOnlineMatch(match, winnerTeamId) {
  match.status = "complete";
  match.winnerTeamId = winnerTeamId;
  match.requiredMemberIds = [];
  match.readyMemberIds = [];
  match.completedAt = Date.now();
}

function projectLiveMatch(match) {
  const live = match.liveState;
  if (!live) return;
  match.homeScore = live.homeScore;
  match.awayScore = live.awayScore;
  match.penalty = live.penalty ? {
    homeScore: live.penalty.homeScore,
    awayScore: live.penalty.awayScore,
    homeKicks: live.penalty.homeKicks,
    awayKicks: live.penalty.awayKicks,
    currentTeamId: live.penalty.currentSide ? live[`${live.penalty.currentSide}TeamId`] : null,
    kicks: [],
  } : null;
  if (live.status === "finished") {
    match.status = "complete";
    match.winnerTeamId = live.winnerTeamId;
    match.completedAt = live.completedAt || Date.now();
    match.requiredMemberIds = [];
    match.readyMemberIds = [];
  } else if (live.status === "penalties") {
    match.status = "penalties";
  } else {
    match.status = "live";
  }
}

function compactFinishedLiveState(live) {
  return {
    simulationVersion: live.simulationVersion,
    matchId: live.matchId,
    homeTeamId: live.homeTeamId,
    awayTeamId: live.awayTeamId,
    status: "finished",
    minute: live.minute,
    addedTime: live.addedTime,
    homeScore: live.homeScore,
    awayScore: live.awayScore,
    homeTactic: live.homeTactic,
    awayTactic: live.awayTactic,
    homeMomentum: live.homeMomentum,
    awayMomentum: live.awayMomentum,
    homeFatigue: live.homeFatigue,
    awayFatigue: live.awayFatigue,
    homeRedCards: live.homeRedCards,
    awayRedCards: live.awayRedCards,
    homeXG: live.homeXG,
    awayXG: live.awayXG,
    shots: live.shots,
    shotsOnTarget: live.shotsOnTarget,
    possession: live.possession,
    substitutions: live.substitutions,
    goalkeeperTendencies: live.goalkeeperTendencies,
    pendingDecision: null,
    penalty: live.penalty ? {
      homeScore: live.penalty.homeScore,
      awayScore: live.penalty.awayScore,
      homeKicks: live.penalty.homeKicks,
      awayKicks: live.penalty.awayKicks,
      currentSide: live.penalty.currentSide,
    } : null,
    clock: {
      lastAdvancedAt: live.clock.lastAdvancedAt,
      nextMinuteAt: live.clock.nextMinuteAt,
      pausedUntil: null,
      pauseStartedAt: null,
      effectiveSpeed: live.clock.effectiveSpeed,
      speedByMemberId: {},
    },
    completedAt: live.completedAt,
    winnerTeamId: live.winnerTeamId,
    controllers: { home: null, away: null },
    suspensionPlayerIds: [],
    suspensionsCommitted: true,
  };
}

function publicOnlineMatch(match) {
  const live = match.liveState;
  const safeLive = live ? {
    simulationVersion: live.simulationVersion,
    matchId: live.matchId,
    status: live.status,
    minute: live.minute,
    addedTime: live.addedTime,
    homeScore: live.homeScore,
    awayScore: live.awayScore,
    homeTactic: live.homeTactic,
    awayTactic: live.awayTactic,
    homeMomentum: live.homeMomentum,
    awayMomentum: live.awayMomentum,
    homeFatigue: live.homeFatigue,
    awayFatigue: live.awayFatigue,
    homeRedCards: live.homeRedCards,
    awayRedCards: live.awayRedCards,
    homeXG: Number(live.homeXG.toFixed(3)),
    awayXG: Number(live.awayXG.toFixed(3)),
    shots: live.shots,
    shotsOnTarget: live.shotsOnTarget,
    possession: live.possession,
    substitutions: live.substitutions,
    goalkeeperTendencies: {
      home: { primaryTarget: live.goalkeeperTendencies?.home?.primaryTarget || "middle" },
      away: { primaryTarget: live.goalkeeperTendencies?.away?.primaryTarget || "middle" },
    },
    pendingDecision: live.pendingDecision,
    penalty: live.penalty ? {
      homeScore: live.penalty.homeScore,
      awayScore: live.penalty.awayScore,
      homeKicks: live.penalty.homeKicks,
      awayKicks: live.penalty.awayKicks,
      currentSide: live.penalty.currentSide,
    } : null,
    clock: {
      lastAdvancedAt: live.clock.lastAdvancedAt,
      nextMinuteAt: live.clock.nextMinuteAt,
      pausedUntil: live.clock.pausedUntil,
      effectiveSpeed: live.clock.effectiveSpeed,
      speedByMemberId: live.clock.speedByMemberId,
    },
    completedAt: live.completedAt,
    winnerTeamId: live.winnerTeamId,
  } : null;
  return {
    ...match,
    liveState: safeLive,
    events: undefined,
    lease: match.lease ? { expiresAt: match.lease.expiresAt } : null,
  };
}

function requireClientCommandId(body) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body?.clientCommandId || "")) {
    throw new RoomRequestError("A valid clientCommandId is required.", 400);
  }
}

function validateClientAccessToken(token) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token || "")) {
    throw new RoomRequestError("A valid access token is required.", 400);
  }
  return token;
}

function commandFingerprint(body, action, memberId) {
  const normalized = Object.keys(body).sort().reduce((result, key) => {
    if (key !== "accessToken") result[key] = body[key];
    return result;
  }, {});
  return JSON.stringify({ action, memberId, body: normalized });
}

function commandReceipt(body, action, memberId) {
  return {
    clientCommandId: body.clientCommandId,
    fingerprint: commandFingerprint(body, action, memberId),
    action,
    memberId,
    createdAt: Date.now(),
  };
}

function refreshOnlineSelections(room) {
  room.tournament.selectionRequired = [];
  return false;
}

function survivingOnlineTeamIds(room) {
  const surviving = new Set(room.tournament.participantTeamIds || Object.keys(room.tournament.teamOwnerById));
  room.tournament.rounds.forEach((round) => round.matches.forEach((match) => {
    if (match.status !== "complete" || !match.awayTeamId) return;
    const loserTeamId = match.winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    surviving.delete(loserTeamId);
  }));
  return surviving;
}

function bestOnlineTeam(teamIds) {
  return [...teamIds].sort((a, b) => onlineTeamRating(b) - onlineTeamRating(a))[0] || null;
}

function readyOnlineMatch(room, member, matchId) {
  requireActiveOnlineTournament(room);
  const match = findCurrentOnlineMatch(room, matchId);
  if (!match || match.status !== "waiting") throw new RoomRequestError("That match is not waiting to start.", 409);
  const required = requiredControllersForMatch(room, match);
  if (!required.includes(member.id)) throw new RoomRequestError("You do not control a team in that match.", 403);
  match.requiredMemberIds = required;
  if (!match.readyMemberIds.includes(member.id)) match.readyMemberIds.push(member.id);
}

function updateOnlineTactic(room, member, tactic, teamId) {
  requireActiveOnlineTournament(room);
  if (member.isCpu || typeof tactic !== "string" || !Object.hasOwn(ONLINE_TACTICS, tactic)) {
    throw new RoomRequestError("Choose a valid tactical approach.", 400);
  }
  if (room.tournament.teamOwnerById[teamId] !== member.id) throw new RoomRequestError("Choose one of your countries.", 403);
  const match = currentOnlineRound(room).matches.find((item) => item.homeTeamId === teamId || item.awayTeamId === teamId);
  room.tournament.tacticsByTeam ||= {};
  room.tournament.tacticsByTeam[teamId] = tactic;
  if (match?.liveState && !["finished", "penalties"].includes(match.liveState.status)) {
    const side = match.homeTeamId === teamId ? "home" : "away";
    setLiveTactic(match.liveState, side, tactic);
    match.updatedVersion = (room.tournament.stateVersion || 0) + 1;
  }
  if (match?.status === "waiting") {
    match.readyMemberIds = match.readyMemberIds.filter((memberId) => memberId !== member.id);
  }
}

function createOnlinePlayback(room, match) {
  const controllerMemberIds = requiredControllersForMatch(room, match);
  const now = Date.now();
  return {
    controllerMemberIds,
    positionMs: 0,
    updatedAt: now,
    pausedUntil: null,
    pausedByMemberId: null,
    speedByMemberId: Object.fromEntries(controllerMemberIds.map((memberId) => [memberId, 1])),
    effectiveSpeed: 1,
  };
}

function syncOnlinePlayback(playback, now = Date.now()) {
  if (!playback) return;
  const updatedAt = Number(playback.updatedAt) || now;
  const pausedUntil = Number(playback.pausedUntil) || 0;
  const activeStart = pausedUntil > updatedAt ? Math.max(updatedAt, pausedUntil) : updatedAt;
  const activeElapsed = Math.max(0, now - activeStart);
  playback.positionMs = Math.min(
    ONLINE_PLAYBACK_BASE_MS,
    Math.max(0, Number(playback.positionMs) || 0) + activeElapsed * (playback.effectiveSpeed || 1),
  );
  playback.updatedAt = now;
  if (pausedUntil && pausedUntil <= now) {
    playback.pausedUntil = null;
    playback.pausedByMemberId = null;
  }
}

function updateOnlinePlayback(room, member, { matchId, paused, speed }) {
  if (!room.tournament) throw new RoomRequestError("The tournament has not started.", 409);
  if (typeof paused !== "boolean" && speed === undefined) {
    throw new RoomRequestError("Choose a playback control to update.", 400);
  }
  const match = findOnlineMatch(room, matchId);
  if (match?.liveState) {
    const live = match.liveState;
    const controllers = Object.values(live.controllers || {}).filter(Boolean);
    if (!controllers.includes(member.id)) throw new RoomRequestError("You do not control a team in that match.", 403);
    const now = Date.now();
    if (typeof paused === "boolean") {
      if (paused) {
        if (!live.clock.pausedUntil || live.clock.pausedUntil <= now) {
          live.clock.pauseStartedAt = now;
          live.clock.pausedUntil = now + ONLINE_PAUSE_LIMIT_MS;
        }
      } else if (live.clock.pausedUntil) {
        const pausedFor = Math.max(0, now - (live.clock.pauseStartedAt || now));
        live.clock.nextMinuteAt += pausedFor;
        live.clock.lastAdvancedAt += pausedFor;
        live.clock.pausedUntil = null;
        live.clock.pauseStartedAt = null;
      }
    }
    if (speed !== undefined) {
      if (!ONLINE_PLAYBACK_SPEEDS.has(speed)) throw new RoomRequestError("Choose 1x, 2x or 4x speed.", 400);
      live.clock.speedByMemberId ||= {};
      live.clock.speedByMemberId[member.id] = speed;
      live.clock.effectiveSpeed = controllers.length > 1
        ? Math.min(...controllers.map((id) => live.clock.speedByMemberId[id] || 1))
        : speed;
    }
    match.updatedVersion = (room.tournament.stateVersion || 0) + 1;
    return;
  }
  const playback = match?.playback;
  if (!match || !playback || playback.controllerMemberIds?.length !== 2) {
    throw new RoomRequestError("Shared playback controls are only available in a human match.", 409);
  }
  if (!playback.controllerMemberIds.includes(member.id)) {
    throw new RoomRequestError("You do not control a team in that match.", 403);
  }
  const now = Date.now();
  syncOnlinePlayback(playback, now);
  if (typeof paused === "boolean") {
    if (paused && playback.positionMs < ONLINE_PLAYBACK_BASE_MS) {
      if (!playback.pausedUntil || playback.pausedUntil <= now) {
        playback.pausedUntil = now + ONLINE_PAUSE_LIMIT_MS;
        playback.pausedByMemberId = member.id;
      }
    } else if (!paused) {
      playback.pausedUntil = null;
      playback.pausedByMemberId = null;
    }
    playback.updatedAt = now;
  }
  if (speed !== undefined) {
    if (!ONLINE_PLAYBACK_SPEEDS.has(speed)) throw new RoomRequestError("Choose 1x, 2x or 4x speed.", 400);
    playback.speedByMemberId ||= {};
    playback.speedByMemberId[member.id] = speed;
    playback.effectiveSpeed = Math.min(...playback.controllerMemberIds.map((memberId) => (
      ONLINE_PLAYBACK_SPEEDS.has(playback.speedByMemberId[memberId]) ? playback.speedByMemberId[memberId] : 1
    )));
    playback.updatedAt = now;
  }
}

function takeOnlinePenalty(room, member, matchId, target, decisionId) {
  requireActiveOnlineTournament(room);
  if (!LIVE_PENALTY_TARGETS.includes(target)) throw new RoomRequestError("Choose a valid penalty target.", 400);
  const match = findCurrentOnlineMatch(room, matchId);
  if (match?.liveState) {
    const pending = match.liveState.pendingDecision;
    if (!pending || pending.memberId !== member.id) throw new RoomRequestError("It is not your penalty.", 403);
    if (!decisionId || decisionId !== pending.id) throw new RoomRequestError("That penalty decision is no longer active.", 409);
    if (Date.now() >= pending.deadlineAt) {
      expireLivePenaltyDecision(match.liveState, Date.now());
      throw new RoomRequestError("That penalty decision expired.", 409);
    }
    const result = resolveLivePenaltyDecision(match.liveState, { decisionId, target, now: Date.now(), automatic: false });
    if (!result.accepted) throw new RoomRequestError("That penalty decision was already resolved.", 409);
    projectLiveMatch(match);
    match.updatedVersion = (room.tournament.stateVersion || 0) + 1;
    return result.events.map((event) => ({ ...event, matchId: match.id }));
  }
  if (!match || match.status !== "penalties") throw new RoomRequestError("That match is not in a shootout.", 409);
  if (controllerForTeam(room, match.penalty.currentTeamId) !== member.id) {
    throw new RoomRequestError("It is not your penalty.", 403);
  }
  processOnlinePenalty(match, match.penalty.currentTeamId, target, true);
  return [];
}

function selectOnlineTeam(room, member, teamId) {
  requireActiveOnlineTournament(room);
  if (!room.tournament.selectionRequired.includes(member.id)) throw new RoomRequestError("You do not need to choose another country.", 409);
  const surviving = survivingOnlineTeamIds(room);
  if (!surviving.has(teamId) || room.tournament.teamOwnerById[teamId] !== member.id) {
    throw new RoomRequestError("Choose one of your surviving countries.", 400);
  }
  room.tournament.activeTeamByMember[member.id] = teamId;
  room.tournament.selectionRequired = room.tournament.selectionRequired.filter((memberId) => memberId !== member.id);
}

function requireActiveOnlineTournament(room) {
  if (room.status !== "matches" || room.tournament?.status !== "active") {
    throw new RoomRequestError("The online tournament is not active.", 409);
  }
}

function secureRandomFloat() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function structuredLog(type, fields = {}) {
  console.log(JSON.stringify({ type, timestamp: new Date().toISOString(), ...fields }));
}

function hashLogValue(value) {
  let hash = 2166136261;
  for (let index = 0; index < String(value).length; index += 1) {
    hash ^= String(value).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function writeOnlineAnalytics(env, event, value1 = 0, value2 = 0, value3 = 0) {
  try {
    env?.ONLINE_ANALYTICS?.writeDataPoint({
      blobs: [event],
      doubles: [Number(value1) || 0, Number(value2) || 0, Number(value3) || 0],
      indexes: [event],
    });
  } catch {
    // Analytics must never affect match state or request success.
  }
}

function publicRoom(room) {
  room.tournament?.rounds.forEach((round) => round.matches.forEach((match) => syncOnlinePlayback(match.playback)));
  return {
    code: room.code,
    status: room.status,
    visibility: room.visibility || "private",
    createdAt: room.createdAt,
    expiresAt: room.expiresAt,
    memberCount: room.members.filter((member) => !member.leftAt).length,
    maxMembers: room.maxPlayers,
    picksPerMember: room.picksPerMember,
    members: room.members.filter((member) => !member.leftAt).map(({ id, name, isHost, isCpu = false, joinedAt, viewedMatchId = null }) => ({
      id,
      name,
      isHost,
      isCpu,
      joinedAt,
      viewedMatchId,
    })),
    draft: room.draft ? {
      status: room.draft.status,
      baseOrder: room.draft.baseOrder,
      order: room.draft.order,
      turnIndex: room.draft.turnIndex,
      currentMemberId: room.draft.order[room.draft.turnIndex] || null,
      picks: room.draft.picks,
      picksPerMember: room.draft.picksPerMember,
      totalPicks: room.draft.order.length,
      startedAt: room.draft.startedAt,
      completedAt: room.draft.completedAt,
    } : null,
    tournament: room.tournament ? {
      status: room.tournament.status,
      roundNumber: room.tournament.roundNumber,
      rounds: room.tournament.rounds.map((round) => ({ ...round, matches: round.matches.map(publicOnlineMatch) })),
      participantTeamIds: room.tournament.participantTeamIds || Object.keys(room.tournament.teamOwnerById),
      teamOwnerById: room.tournament.teamOwnerById,
      activeTeamByMember: room.tournament.activeTeamByMember,
      selectionRequired: room.tournament.selectionRequired,
      tactics: room.tournament.tactics,
      tacticsByTeam: room.tournament.tacticsByTeam || {},
      survivingTeamIds: [...survivingOnlineTeamIds(room)],
      championTeamId: room.tournament.championTeamId,
      completionReason: room.tournament.completionReason || null,
      startedAt: room.tournament.startedAt,
      completedAt: room.tournament.completedAt,
      stateVersion: room.tournament.stateVersion || 0,
      lastEventId: room.tournament.lastEventId || 0,
    } : null,
  };
}

function secureRandomIndex(length) {
  if (length <= 1) return 0;
  const values = new Uint32Array(1);
  const usableRange = 4294967296 - (4294967296 % length);
  do crypto.getRandomValues(values);
  while (values[0] >= usableRange);
  return values[0] % length;
}

function secureShuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = secureRandomIndex(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

async function readJson(request, maxBytes = 1024) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    throw new RoomRequestError("Requests must use JSON.", 415);
  }
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > maxBytes) throw new RoomRequestError("Request is too large.", 413);
  const text = await request.text();
  if (text.length > maxBytes) throw new RoomRequestError("Request is too large.", 413);
  try {
    const value = JSON.parse(text || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid object");
    return value;
  } catch {
    throw new RoomRequestError("Invalid JSON request.", 400);
  }
}

function bearerToken(request) {
  const match = (request.headers.get("Authorization") || "").match(/^Bearer ([A-Za-z0-9_-]{43})$/);
  return match?.[1] || null;
}

function sameOriginRequest(request, url) {
  const origin = request.headers.get("Origin");
  return !origin || origin === url.origin;
}

function rateKey(request, action) {
  const client = request.headers.get("CF-Connecting-IP") || "local";
  return `${action}:${client}`;
}

function roomActorRateKey(request, action) {
  const token = bearerToken(request);
  return token
    ? `${action}:session:${token}`
    : rateKey(request, action);
}

async function allowRequest(binding, key) {
  if (!binding) return true;
  const result = await binding.limit({ key });
  return result.success;
}

function invalidNameResponse() {
  return json({ error: "Use 1–24 letters, numbers, spaces, apostrophes, dots, dashes or underscores." }, 400);
}

function unavailableRoomResponse() {
  return json({ error: "Room unavailable. Check the code or ask the host for a new one." }, 404);
}

function unauthorizedResponse() {
  return json({ error: "Your room session is no longer valid." }, 401);
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: API_HEADERS });
}

class RoomRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
