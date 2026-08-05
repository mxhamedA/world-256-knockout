(() => {
  const $ = (selector) => document.querySelector(selector);
  const screen = $("#palestineChallengeScreen");
  const appShell = $("#appShell");
  const authModal = $("#challengeAuthModal");
  const authForm = $("#challengeAuthForm");
  const profileScreen = $("#profileScreen");
  const elements = {
    open: $("#openPalestineChallengeButton"),
    mainAccount: $("#mainAccountButton"),
    mainAccountLabel: $("#mainAccountLabel"),
    retroAccount: $("#retroAccountButton"),
    retroAccountLabel: $("#retroAccountLabel"),
    back: $("#challengeBackButton"),
    account: $("#challengeAccountButton"),
    description: $("#challengeDescription"),
    countdownLabel: $("#challengeCountdownLabel"),
    countdown: $("#challengeCountdown"),
    prizes: $("#challengePrizes"),
    rank: $("#challengeCurrentRank"),
    score: $("#challengeCurrentScore"),
    attempts: $("#challengeAttempts"),
    best: $("#challengeBestRun"),
    runKicker: $("#challengeRunKicker"),
    runTitle: $("#challengeRunTitle"),
    runCopy: $("#challengeRunCopy"),
    result: $("#challengeMatchResult"),
    start: $("#challengeStartButton"),
    message: $("#challengeMessage"),
    leaderboard: $("#challengeLeaderboard"),
    leaderboardStatus: $("#challengeLeaderboardStatus"),
    history: $("#challengeHistory"),
    profileTitle: $("#challengeProfileTitle"),
    leaderboardPanel: $("#challengeLeaderboardPanel"),
    historyPanel: $("#challengeHistoryPanel"),
    authTitle: $("#challengeAuthTitle"),
    authSubmit: $("#challengeAuthSubmit"),
    authSwitch: $("#challengeAuthSwitch"),
    authClose: $("#challengeAuthCloseButton"),
    googleSignIn: $("#challengeGoogleSignIn"),
    authMessage: $("#challengeAuthMessage"),
    emailField: $("#challengeEmailField"),
    email: $("#challengeEmail"),
    identifierLabel: $("#challengeIdentifierLabel"),
    username: $("#challengeUsername"),
    password: $("#challengePassword"),
    usernameReviewModal: $("#usernameReviewModal"),
    usernameReviewForm: $("#usernameReviewForm"),
    usernameReviewInput: $("#usernameReviewInput"),
    usernameReviewMessage: $("#usernameReviewMessage"),
    usernameReviewSave: $("#usernameReviewSaveButton"),
    usernameReviewClose: $("#usernameReviewCloseButton"),
    usernameReviewLater: $("#usernameReviewLaterButton"),
    profileBack: $("#profileBackButton"),
    profileForm: $("#profileForm"),
    profileUsername: $("#profileUsername"),
    profileCurrentUsername: $("#profileCurrentUsername"),
    profileAvatar: $("#profileAvatarPreview"),
    profileEditToggle: $("#profileEditToggle"),
    profileEditPanel: $("#profileEditPanel"),
    profileCountrySearch: $("#profileCountrySearch"),
    profileCountryGrid: $("#profileCountryGrid"),
    profileMessage: $("#profileMessage"),
    profileSave: $("#profileSaveButton"),
    profileLogout: $("#profileLogoutButton"),
    profileDeleteRequest: $("#profileDeleteRequestButton"),
    profileDeleteModal: $("#profileDeleteModal"),
    profileDeleteForm: $("#profileDeleteForm"),
    profileDeleteClose: $("#profileDeleteCloseButton"),
    profileDeleteReason: $("#profileDeleteReason"),
    profileDeleteDetails: $("#profileDeleteDetails"),
    profileDeleteConfirm: $("#profileDeleteConfirm"),
    profileDeleteMessage: $("#profileDeleteMessage"),
    profileDeleteSubmit: $("#profileDeleteSubmitButton"),
    profileAchievementCount: $("#profileAchievementCount"),
    profileAchievementTotal: $("#profileAchievementTotal"),
    profileAchievementPoints: $("#profileAchievementPoints"),
    profileAchievementSummary: $("#profileAchievementSummary"),
    profileTournamentHistory: $("#profileTournamentHistory"),
    profileTournamentHistoryCount: $("#profileTournamentHistoryCount"),
    profile2010AchievementCount: $("#profile2010AchievementCount"),
    profile2014AchievementCount: $("#profile2014AchievementCount"),
    profile2016AchievementCount: $("#profile2016AchievementCount"),
    profile2018AchievementCount: $("#profile2018AchievementCount"),
    profile2022AchievementCount: $("#profile2022AchievementCount"),
    profile2010AchievementBar: $("#profile2010AchievementBar"),
    profile2014AchievementBar: $("#profile2014AchievementBar"),
    profile2016AchievementBar: $("#profile2016AchievementBar"),
    profile2018AchievementBar: $("#profile2018AchievementBar"),
    profile2022AchievementBar: $("#profile2022AchievementBar"),
    profileUnlockedCount: $("#profileUnlockedCount"),
    profileUnlockedAchievements: $("#profileUnlockedAchievements"),
    achievementCount: $("#retro2014AchievementCount"),
    achievementBar: $("#retro2014AchievementBar"),
    achievementGrid: $("#retro2014AchievementGrid"),
    achievementsScreen: $("#achievementsScreen"),
    achievementsModeLabel: $("#achievementsModeLabel"),
    achievementProgressLabel: $("#achievementProgressLabel"),
    achievementLogin: $("#achievementLoginButton"),
    achievementChallengeTitle: $("#achievementChallengeTitle"),
    achievementModal: $("#achievementUnlockModal"),
    achievementModalTitle: $("#achievementUnlockTitle"),
    achievementModalCopy: $("#achievementUnlockCopy"),
    achievementModalClose: $("#achievementUnlockClose"),
    achievementModalAction: $("#achievementUnlockAction"),
    achievementBanner: $("#achievementUnlockBanner"),
    achievementBannerTitle: $("#achievementUnlockBannerTitle"),
    retroAchievementModal: $("#retroAchievementsModal"),
    retroAchievementModalClose: $("#retroAchievementsClose"),
    retroAchievementModalCount: $("#retro2014ModalAchievementCount"),
    retroAchievementModalBar: $("#retro2014ModalAchievementBar"),
    retroAchievementModalGrid: $("#retro2014ModalAchievementGrid"),
    retroAchievementLogin: $("#retroAchievementLoginButton"),
    retroAchievementModalDescription: $("#retroAchievementModalDescription"),
    retroAchievementModeLabel: $("#retroAchievementModeLabel"),
    retroAchievementProgressLabel: $("#retroAchievementProgressLabel"),
    homeAchievementLeaderboard: $("#homeAchievementLeaderboard"),
    homeAchievementOwn: $("#homeAchievementOwn"),
    homeAchievementAction: $("#homeAchievementAction"),
    homeAchievementModal: $("#homeAchievementModal"),
    homeAchievementModalClose: $("#homeAchievementModalClose"),
    homeAchievementModalTable: $("#homeAchievementModalTable"),
  };
  let dashboard = null;
  let authMode = "login";
  let activeTab = "leaderboard";
  let serverOffset = 0;
  let countdownTimer = null;
  let actionTimer = null;
  let busy = false;
  let lastFinishedRun = null;
  let authReturnHandled = false;
  let profilePayload = null;
  let selectedProfileCountryId = null;
  let profileReturnPath = "/";
  const achievementPayloads = new Map();
  let activeAchievementYear = 2014;
  let achievementBannerTimer = null;
  let pendingAchievementUnlock = null;
  const trackedRetroRequests = new Map();
  const trackedKnockoutRequests = new Map();
  const trackedPremierLeagueRequests = new Map();
  const trackedUclRequests = new Map();
  let achievementLeaderboardPayload = null;
  let reviewedUsernameAccountId = null;
  let accountLoadVersion = 0;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);

  async function challengeApi(path = "", options = {}) {
    const response = await fetch(`/api/challenge${path}`, {
      method: options.method || "GET",
      credentials: "include",
      keepalive: options.keepalive === true,
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "The challenge service is unavailable.");
      error.status = response.status;
      error.retryAfterMs = payload.retryAfterMs;
      throw error;
    }
    return payload;
  }

  async function challengeApiForAccount(path, expectedAccount) {
    let lastError = null;
    for (const delay of [0, 150, 450]) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const payload = await challengeApi(path);
        if (!expectedAccount || payload.account?.id === expectedAccount.id) return payload;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error(
      "Your account was created, but sign-in could not finish in this browser. Open www.256teams.com directly, then log in again.",
    );
  }

  function commandId() {
    return crypto.randomUUID();
  }

  function challengeRouteActive() {
    return window.location.pathname.replace(/\/+$/, "") === "/palestine-challenge";
  }
  function profileRouteActive() {
    return window.location.pathname.replace(/\/+$/, "") === "/profile";
  }
  function achievementsRouteActive() {
    return window.location.pathname.replace(/\/+$/, "") === "/achievements";
  }

  function setRoute(active, replace = false) {
    const path = active ? "/palestine-challenge" : "/";
    window.history[replace ? "replaceState" : "pushState"]({ appMode: active ? "challenge" : "home" }, "", path);
    syncRoute();
  }

  function setProfileRoute(active = true, replace = false) {
    if (active && !profileRouteActive()) {
      const currentPath = `${window.location.pathname}${window.location.search}`;
      profileReturnPath = /^\/(?:retro-(?:98|02|06|10|14|18|22)-world-cup|retro-euro-2016)(?:\?|$)/.test(currentPath) ? currentPath : "/";
    }
    const path = active ? "/profile" : profileReturnPath;
    window.history[replace ? "replaceState" : "pushState"]({ appMode: active ? "profile" : "home" }, "", path);
    syncRoute();
  }

  function syncRoute() {
    const challengeActive = challengeRouteActive();
    const profileActive = profileRouteActive();
    screen.hidden = !challengeActive;
    if (profileScreen) profileScreen.hidden = !profileActive;
    appShell.hidden = challengeActive || profileActive;
    document.body.classList.toggle("challenge-mode-active", challengeActive);
    document.body.classList.toggle("profile-mode-active", profileActive);
    if (challengeActive) {
      void loadDashboard();
      window.scrollTo({ top: 0, behavior: "auto" });
    } else if (profileActive) {
      elements.profileEditPanel.hidden = true;
      elements.profileEditToggle.setAttribute("aria-expanded", "false");
      elements.profileEditToggle.textContent = "Edit profile";
      void loadProfile();
      window.scrollTo({ top: 0, behavior: "auto" });
    } else void loadHomeAccount();
  }

  function syncMainAccount() {
    if (!elements.mainAccount) return;
    const account = dashboard?.account;
    elements.mainAccountLabel.textContent = account?.username || "Log in";
    elements.mainAccount.setAttribute("aria-label", account ? `Open ${account.username}'s profile` : "Log in");
    elements.mainAccount.title = account ? `Open ${account.username}'s profile` : "Log in";
    if (elements.retroAccountLabel) elements.retroAccountLabel.textContent = account?.username || "Log in";
    if (elements.retroAccount) {
      elements.retroAccount.setAttribute("aria-label", account ? `Open ${account.username}'s profile` : "Log in");
      elements.retroAccount.title = account ? `Open ${account.username}'s profile` : "Log in";
    }
    window.dispatchEvent(new CustomEvent("accountstatechange", {
      detail: { account: account || null },
    }));
  }

  function syncGoogleButton() {
    const enabled = dashboard?.auth?.googleEnabled !== false;
    elements.googleSignIn.disabled = !enabled;
    elements.googleSignIn.title = enabled ? "Continue with Google" : "Google sign-in needs to be configured";
  }

  function promptForGeneratedUsername() {
    const account = dashboard?.account;
    if (!elements.usernameReviewModal || !account?.usernameNeedsReview || reviewedUsernameAccountId === account.id) return;
    reviewedUsernameAccountId = account.id;
    elements.usernameReviewInput.value = account.username;
    elements.usernameReviewMessage.textContent = "";
    if (!elements.usernameReviewModal.open) elements.usernameReviewModal.showModal();
    requestAnimationFrame(() => {
      elements.usernameReviewInput.focus();
      elements.usernameReviewInput.select();
    });
  }

  function queueGeneratedUsernamePrompt() {
    window.setTimeout(promptForGeneratedUsername, 0);
  }

  function handleAuthReturn() {
    if (authReturnHandled) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("auth") && !url.searchParams.has("authError")) return;
    authReturnHandled = true;
    if (url.searchParams.get("authError")) {
      openAuth("login");
      const failureCode = url.searchParams.get("authCode");
      elements.authMessage.textContent = failureCode
        ? `Google sign-in could not be completed (${failureCode}). Please try again.`
        : "Google sign-in could not be completed. Please try again.";
    }
    url.searchParams.delete("auth");
    url.searchParams.delete("authError");
    url.searchParams.delete("authCode");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function currentServerTime() {
    return Date.now() + serverOffset;
  }

  function renderCountdown() {
    if (!dashboard?.challenge) return;
    const challenge = dashboard.challenge;
    const now = currentServerTime();
    const upcoming = now < challenge.startTime;
    const remaining = Math.max(0, (upcoming ? challenge.startTime : challenge.endTime) - now);
    elements.countdownLabel.textContent = upcoming ? "Starts in" : challenge.status === "archived" ? "Challenge ended" : "Ends in";
    const seconds = Math.floor(remaining / 1000);
    const values = [
      [Math.floor(seconds / 86400), "Days"],
      [Math.floor((seconds % 86400) / 3600), "Hours"],
      [Math.floor((seconds % 3600) / 60), "Minutes"],
      [seconds % 60, "Seconds"],
    ];
    elements.countdown.innerHTML = values.map(([value, label]) => `<strong>${String(value).padStart(2, "0")}</strong><small>${label}</small>`).join("");
  }

  function renderPrizes() {
    elements.prizes.innerHTML = (dashboard.challenge.prizes || []).map((prize) => `
      <div class="challenge-prize"><span>${escapeHtml(prize.label)}</span><strong>${escapeHtml(prize.prize)}</strong></div>
    `).join("");
  }

  function resultScore(match) {
    if (!match) return "";
    const penalties = match.penalties ? ` (${match.penalties.home}-${match.penalties.away})` : "";
    return `${match.homeGoals}-${match.awayGoals}${penalties}`;
  }

  function renderLatestResult(run) {
    const match = run?.latestMatch;
    if (!match) {
      elements.result.hidden = true;
      elements.result.innerHTML = "";
      return;
    }
    const palestineHome = match.homeId === "team-131";
    elements.result.hidden = false;
    elements.result.innerHTML = `
      <div class="challenge-team">${palestineHome ? '<img src="./assets/flags/palestine.svg" alt="" />' : ""}<strong>${palestineHome ? "Palestine" : escapeHtml(match.opponent.name)}</strong></div>
      <div class="challenge-score">${escapeHtml(resultScore(match))}<small>+${Number(match.breakdown?.total || 0)} pts</small></div>
      <div class="challenge-team">${palestineHome ? "" : '<img src="./assets/flags/palestine.svg" alt="" />'}<strong>${palestineHome ? escapeHtml(match.opponent.name) : "Palestine"}</strong></div>
    `;
  }

  function renderRun() {
    const account = dashboard.account;
    const run = dashboard.activeRun || lastFinishedRun;
    const status = dashboard.challenge.status;
    elements.account.textContent = account ? `${account.username} · Logout` : "Log in";
    if (!account) {
      elements.runTitle.textContent = "Log in to start a run";
      elements.runCopy.textContent = "Your challenge scores are securely saved to your account.";
      elements.start.textContent = "Log in to play";
      elements.start.disabled = false;
      renderLatestResult(null);
      return;
    }
    if (status !== "active") {
      elements.runTitle.textContent = status === "upcoming" ? "The challenge has not started" : "The leaderboard is frozen";
      elements.runCopy.textContent = status === "upcoming" ? "Come back when the server countdown reaches zero." : "This event has ended. The final standings are below.";
      elements.start.textContent = status === "upcoming" ? "Not started" : "Challenge ended";
      elements.start.disabled = true;
      renderLatestResult(run);
      return;
    }
    if (!run) {
      elements.runKicker.textContent = "NEW RUN";
      elements.runTitle.textContent = "Take Palestine from 256 to one";
      elements.runCopy.textContent = "One active run at a time. Every result is generated and verified by the server.";
      elements.start.textContent = "Start Palestine Challenge";
      elements.start.disabled = busy;
      renderLatestResult(null);
      return;
    }
    elements.runKicker.textContent = `RUN SCORE · ${run.score} PTS`;
    elements.runTitle.textContent = run.status === "active" ? `${run.round} awaits` : run.tournamentWon ? "Palestine are champions" : `Run complete · ${run.furthestRound}`;
    elements.runCopy.textContent = run.status === "active" ? `${run.goals} goals scored. Continue when the next tie is ready.` : `${run.counted ? "This run counts toward your best 25." : "This run did not enter your best 25."}`;
    renderLatestResult(run);
    if (run.status === "active") {
      const wait = Math.max(0, run.nextActionAt - currentServerTime());
      elements.start.textContent = wait ? `Next tie in ${Math.ceil(wait / 1000)}s` : `Play ${run.round}`;
      elements.start.disabled = busy || wait > 0;
      clearTimeout(actionTimer);
      if (wait) actionTimer = setTimeout(renderRun, Math.min(1000, wait));
    } else {
      elements.start.textContent = "Start another run";
      elements.start.disabled = busy;
    }
  }

  function renderLeaderboard() {
    const board = dashboard.leaderboard;
    const entries = board.entries || [];
    const labels = ["#", "Player", "Score", "Best run", "Attempts", "Wins", "Semi-finals", "Goals", "Strongest opponent"];
    elements.leaderboard.parentElement.querySelector(".challenge-own-rank")?.remove();
    elements.leaderboard.innerHTML = `
      <div class="challenge-leaderboard-row is-head">${labels.map((label) => `<span>${label}</span>`).join("")}</div>
      ${entries.length ? entries.map((entry) => `
        <div class="challenge-leaderboard-row ${entry.username === dashboard.account?.username ? "is-own" : ""}">
          <span>${entry.position}</span><strong>${escapeHtml(entry.username)}</strong><span>${entry.total_score}</span><span>${entry.best_run}</span>
          <span>${entry.attempts}</span><span>${entry.tournament_wins}</span><span>${entry.semi_finals}</span><span>${entry.goals}</span><span>${escapeHtml(entry.strongest_opponent || "-")}</span>
        </div>`).join("") : '<div class="challenge-leaderboard-empty">No completed runs yet. The first score can be yours.</div>'}
    `;
    if (board.own && !entries.some((entry) => entry.username === board.own.username)) {
      elements.leaderboard.insertAdjacentHTML("afterend", `<div class="challenge-own-rank">Your rank: <strong>#${board.own.position}</strong> · ${board.own.total_score} points</div>`);
    }
    elements.leaderboardStatus.textContent = dashboard.challenge.status === "archived" ? "Final standings" : `Top ${Math.min(100, entries.length)}`;
    const own = board.own;
    elements.rank.textContent = own ? `#${own.position}` : "-";
    elements.score.textContent = own?.total_score || 0;
    elements.attempts.textContent = own?.attempts || dashboard.history.length || 0;
    elements.best.textContent = own?.best_run || 0;
  }

  function renderHistory() {
    elements.profileTitle.textContent = dashboard.account ? `${dashboard.account.username}'s runs` : "My runs";
    elements.history.innerHTML = dashboard.account
      ? dashboard.history.length
        ? dashboard.history.map((run) => `
          <article class="challenge-history-item">
            <header><strong>${escapeHtml(run.furthestRound)}</strong><span>${run.counted ? "Counted" : "Not counted"}</span></header>
            <dl>
              <div><dt>Score</dt><dd>${run.score}</dd></div><div><dt>Goals</dt><dd>${run.goals}</dd></div>
              <div><dt>Progress</dt><dd>${run.scoreBreakdown?.progress || 0}</dd></div><div><dt>Goal points</dt><dd>${run.scoreBreakdown?.goals || 0}</dd></div>
              <div><dt>Champion bonus</dt><dd>${run.scoreBreakdown?.champion || 0}</dd></div><div><dt>Completed</dt><dd>${new Date(run.completedAt).toLocaleDateString()}</dd></div>
            </dl>
          </article>`).join("")
        : '<div class="challenge-history-empty">Your completed runs will appear here.</div>'
      : '<div class="challenge-history-empty">Log in to see your complete challenge history.</div>';
  }

  function renderDashboard() {
    elements.description.textContent = dashboard.challenge.description;
    renderCountdown();
    renderPrizes();
    renderLeaderboard();
    renderHistory();
    renderRun();
    setTab(activeTab);
    syncMainAccount();
    syncGoogleButton();
  }

  async function loadDashboard(expectedAccount = null) {
    if (!challengeRouteActive()) return;
    const loadVersion = ++accountLoadVersion;
    try {
      const payload = await challengeApiForAccount("", expectedAccount);
      if (loadVersion !== accountLoadVersion) return;
      dashboard = payload;
      serverOffset = payload.challenge.serverTime - Date.now();
      renderDashboard();
      handleAuthReturn();
      queueGeneratedUsernamePrompt();
      await syncStoredRetroAchievements();
      clearInterval(countdownTimer);
      countdownTimer = setInterval(renderCountdown, 1000);
    } catch (error) {
      if (loadVersion !== accountLoadVersion) return;
      elements.message.textContent = error.message;
      elements.start.disabled = true;
      if (expectedAccount) throw error;
    }
  }

  async function loadHomeAccount(expectedAccount = null) {
    if (challengeRouteActive() || profileRouteActive()) return;
    const loadVersion = ++accountLoadVersion;
    try {
      const payload = await challengeApiForAccount("", expectedAccount);
      if (loadVersion !== accountLoadVersion) return;
      dashboard = payload;
      syncMainAccount();
      syncGoogleButton();
      handleAuthReturn();
      queueGeneratedUsernamePrompt();
      await syncStoredRetroAchievements();
      await loadAchievementLeaderboard();
      if (achievementsRouteActive()) await loadAchievements();
    } catch (error) {
      if (loadVersion !== accountLoadVersion) return;
      syncMainAccount();
      syncGoogleButton();
      await loadAchievementLeaderboard();
      if (achievementsRouteActive()) renderAchievements();
      if (expectedAccount) throw error;
    }
  }

  function teamById(teamId) {
    return (typeof TEAMS !== "undefined" ? TEAMS : []).find((team) => team.id === teamId) || null;
  }

  function teamByName(teamName) {
    const historicalAliases = {
      "Cabo Verde": "Cape Verde",
      "Congo DR": "DR Congo",
      "Côte d'Ivoire": "Ivory Coast",
      "Czech Republic": "Czechia",
      "IR Iran": "Iran",
      "Korea Republic": "South Korea",
      "Serbia and Montenegro": "Serbia",
      "Turkey": "T\u00fcrkiye",
      "United States": "USA",
      "Yugoslavia": "Serbia",
    };
    const sourceName = historicalAliases[teamName] || teamName;
    const team = (typeof TEAMS !== "undefined" ? TEAMS : []).find((candidate) => candidate.name === sourceName);
    return team ? { ...team, name: teamName } : null;
  }

  function premierLeagueClubById(clubId) {
    return (window.PREMIER_LEAGUE_2026_27_CLUBS || []).find((club) => club.id === clubId) || null;
  }

  function premierLeagueClubByName(clubName) {
    return (window.PREMIER_LEAGUE_2026_27_CLUBS || []).find((club) => club.name === clubName) || null;
  }

  function uclClubById(clubId) {
    return window.UclEngine?.team?.(clubId) || null;
  }

  function uclClubByName(clubName) {
    return (window.UclEngine?.TEAM_DATA || []).find((club) => club.name === clubName) || null;
  }

  const UCL_OBJECTIVE_GROUPS = Object.freeze([
    { ids: ["real-madrid", "manchester-city", "bayern-munich", "paris-saint-germain"], targetStageIndex: 5, objectiveLabel: "Win the UCL", points: 2 },
    { ids: ["liverpool", "barcelona"], targetStageIndex: 5, objectiveLabel: "Win the UCL", points: 3 },
    { ids: ["inter-milan", "arsenal", "atletico-madrid"], targetStageIndex: 4, objectiveLabel: "Reach the final", points: 4 },
    { ids: ["borussia-dortmund", "napoli", "manchester-united", "rb-leipzig"], targetStageIndex: 3, objectiveLabel: "Reach the semi-finals", points: 5 },
    { ids: ["sporting-cp", "porto", "villarreal", "roma", "psv-eindhoven", "aston-villa"], targetStageIndex: 2, objectiveLabel: "Reach the quarter-finals", points: 6 },
    { ids: ["galatasaray", "feyenoord", "stuttgart", "lille", "fenerbahce", "olympique-lyonnais"], targetStageIndex: 1, objectiveLabel: "Reach the Round of 16", points: 7 },
    { ids: ["club-brugge", "shakhtar-donetsk", "real-betis", "como", "lens", "gnk-dinamo-zagreb", "crvena-zvezda", "union-saint-gilloise", "olympiacos"], targetStageIndex: 0, objectiveLabel: "Finish in the top 24", points: 8 },
    { ids: ["slavia-prague", "agf-aarhus", "slovan-bratislava", "levski-sofia", "nk-celje"], targetStageIndex: 0, objectiveLabel: "Finish in the top 24", points: 9 },
  ]);

  function uclObjectiveForClub(club) {
    const group = UCL_OBJECTIVE_GROUPS.find((candidate) => candidate.ids.includes(club?.id));
    return group
      ? {
          targetStageIndex: group.targetStageIndex,
          objectiveLabel: group.objectiveLabel,
          points: group.points,
        }
      : { targetStageIndex: 0, objectiveLabel: "Finish in the top 24", points: 9 };
  }

  function premierLeagueObjectiveForClub(club) {
    const targets = {
      arsenal: [1, 2], "aston-villa": [4, 4], bournemouth: [8, 5], brentford: [8, 5],
      brighton: [6, 5], chelsea: [1, 3], "coventry-city": [17, 8],
      "crystal-palace": [6, 5], everton: [8, 5], fulham: [8, 5], "hull-city": [17, 8],
      "ipswich-town": [17, 8], "leeds-united": [10, 7], liverpool: [1, 2],
      "manchester-city": [1, 2], "manchester-united": [1, 3], "newcastle-united": [4, 3],
      "nottingham-forest": [8, 5], sunderland: [10, 8], "tottenham-hotspur": [1, 4],
    };
    const [targetPosition, points] = targets[club?.id] || [10, 5];
    return {
      objectiveLabel: targetPosition === 1
        ? "Win the Premier League"
        : targetPosition === 10
          ? "Finish in the top half"
          : targetPosition === 17 ? "Avoid relegation" : `Finish in the top ${targetPosition}`,
      targetPosition,
      points,
    };
  }

  function achievementEndpoint(key) {
    if (Number(key) === 256) return "/achievements/knockout-256";
    if (key === "pl") return "/achievements/premier-league";
    if (key === "ucl") return "/achievements/ucl";
    return `/achievements/retro-${key}`;
  }

  function achievementCompetitionLabel(key) {
    if (Number(key) === 256) return "256 Knockout";
    if (Number(key) === 2016) return "UEFA Euro 2016";
    if (key === "pl") return "Premier League 26/27";
    if (key === "ucl") return "UEFA Champions League 26/27";
    return `${key} World Cup`;
  }

  function normalizeAchievementKey(key) {
    if (key === "pl" || String(key).toLowerCase() === "pl") return "pl";
    if (key === "ucl" || String(key).toLowerCase() === "ucl") return "ucl";
    const year = Number(key);
    return [256, 1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2026].includes(year) ? year : 2014;
  }

  function knockoutObjectiveForTeam(team, teamIndex = -1) {
    if (team?.id === "team-25" || team?.name === "Israel") {
      return { objectiveLabel: "Lose in the Round of 256", points: 4 };
    }
    if (team?.name === "Norfolk Island") {
      return { objectiveLabel: "Reach the Round of 32", points: 8 };
    }
    const rank = teamIndex + 1;
    const rating = Number(team?.simulationRatings?.overall) || 0;
    if (rank >= 1 && rank <= 65) {
      return {
        objectiveLabel: "Win the tournament",
        points: rating >= 80 ? 1 : 2,
      };
    }
    if (rank <= 159) return { objectiveLabel: "Reach the semi-finals", points: rank <= 112 ? 3 : 4 };
    if (rank <= 182) return { objectiveLabel: "Reach the quarter-finals", points: 5 };
    if (rank <= 207) return { objectiveLabel: "Reach the Round of 16", points: 8 };
    if (rank <= 232) return { objectiveLabel: "Reach the Round of 32", points: 8 };
    return { objectiveLabel: "Reach the Round of 64", points: 8 };
  }

  function syncAchievementTheme(year = activeAchievementYear) {
    const theme = String(year);
    const labels = {
      256: "256-TEAM KNOCKOUT",
      1998: "FRANCE 1998",
      2002: "KOREA/JAPAN 2002",
      2006: "GERMANY 2006",
      2010: "SOUTH AFRICA 2010",
      2014: "BRAZIL 2014",
      2016: "UEFA EURO 2016",
      2018: "RUSSIA 2018",
      2022: "QATAR 2022",
      2026: "CANADA, MEXICO & USA 2026",
      pl: "PREMIER LEAGUE 26/27",
      ucl: "UEFA CHAMPIONS LEAGUE 26/27",
    };
    [elements.achievementsScreen, elements.retroAchievementModal].forEach((element) => {
      if (element) element.dataset.achievementTheme = theme;
    });
    if (elements.achievementsModeLabel) elements.achievementsModeLabel.textContent = labels[year] || labels[2014];
    if (elements.retroAchievementModeLabel) elements.retroAchievementModeLabel.textContent = labels[year] || labels[2014];
    const progressLabel = year === "pl" || year === "ucl"
      ? "CLUBS COMPLETE"
      : Number(year) === 256 ? "TEAMS COMPLETE" : "COUNTRIES COMPLETE";
    if (elements.achievementProgressLabel) elements.achievementProgressLabel.textContent = progressLabel;
    if (elements.retroAchievementProgressLabel) elements.retroAchievementProgressLabel.textContent = progressLabel;
  }

  function renderAchievements() {
    if (!elements.achievementGrid) return;
    syncAchievementTheme();
    const account = dashboard?.account;
    const achievement = achievementPayloads.get(activeAchievementYear)?.achievement;
    const teams = achievement?.teams || (activeAchievementYear === "pl"
      ? (window.PREMIER_LEAGUE_2026_27_CLUBS || []).map((club) => ({
          clubId: club.id,
          teamName: club.name,
          attempts: 0,
          complete: false,
          won: false,
          ...premierLeagueObjectiveForClub(club),
        }))
      : activeAchievementYear === "ucl"
      ? (window.UclEngine?.TEAM_DATA || []).map((club) => ({
          clubId: club.id,
          teamName: club.name,
          attempts: 0,
          complete: false,
          won: false,
          ...uclObjectiveForClub(club),
        }))
      : activeAchievementYear === 256
      ? (typeof TEAMS !== "undefined" ? TEAMS.map((team, teamIndex) => ({
          teamId: team.id,
          teamName: team.name,
          attempts: 0,
          complete: false,
          won: false,
          ...knockoutObjectiveForTeam(team, teamIndex),
        })) : [])
      : (typeof RETRO_WORLD_CUPS !== "undefined"
        ? RETRO_WORLD_CUPS[activeAchievementYear].teams.map((team) => ({ teamName: team.name, attempts: 0, won: false, wonOnAttempt: null }))
        : []));
    const completed = Number(achievement?.completed || 0);
    const total = Number(achievement?.total || (
      activeAchievementYear === 256 ? 256
        : activeAchievementYear === "pl" ? 20
          : activeAchievementYear === "ucl" ? 39
        : activeAchievementYear === 2026 ? 48
        : activeAchievementYear === 2016 ? 24
          : 32
    ));
    const progressMarkup = teams.map((progress) => {
      const team = activeAchievementYear === "pl"
        ? premierLeagueClubById(progress.clubId) || premierLeagueClubByName(progress.teamName)
        : activeAchievementYear === "ucl"
          ? uclClubById(progress.clubId) || uclClubByName(progress.teamName)
        : teamByName(progress.teamName);
      const complete = progress.complete === true || progress.won === true;
      const attemptCount = Number(progress.achievedOnAttempt || progress.wonOnAttempt || progress.attempts || 0);
      const status = complete
        ? activeAchievementYear === 256 || activeAchievementYear === "pl" || activeAchievementYear === "ucl"
          ? `${progress.objectiveLabel} · ${attemptCount} ${attemptCount === 1 ? "try" : "tries"}`
          : `Won in ${attemptCount} ${attemptCount === 1 ? "try" : "tries"}`
        : progress.attempts
          ? `${progress.objectiveLabel ? `${progress.objectiveLabel} · ` : ""}${progress.attempts} ${progress.attempts === 1 ? "try" : "tries"}`
          : account
            ? progress.objectiveLabel || "Not attempted"
            : progress.objectiveLabel
              ? `${progress.objectiveLabel} · Log in to track`
              : "Log in to track";
      return `
        <article class="achievement-country${complete ? " is-complete" : ""}">
          ${profileFlagMarkup(team, "achievement-country-flag")}
          <span><strong>${escapeHtml(progress.teamName)}</strong><small>${escapeHtml(status)}</small></span>
          ${Number(progress.points) ? `<b>${Number(progress.points)} pts</b>` : ""}
        </article>
      `;
    }).join("");
    const progressWidth = `${Math.min(100, (completed / total) * 100)}%`;
    elements.achievementCount.textContent = `${completed} / ${total}`;
    elements.achievementBar.style.width = progressWidth;
    elements.achievementLogin.hidden = Boolean(account);
    elements.achievementGrid.innerHTML = progressMarkup;
    if (elements.retroAchievementModalCount) elements.retroAchievementModalCount.textContent = `${completed} / ${total}`;
    if (elements.retroAchievementModalBar) elements.retroAchievementModalBar.style.width = progressWidth;
    if (elements.retroAchievementModalGrid) elements.retroAchievementModalGrid.innerHTML = progressMarkup;
    if (elements.retroAchievementLogin) elements.retroAchievementLogin.hidden = Boolean(account);
    const challengeCopy = activeAchievementYear === 256
      ? "Complete the objective for every country in the 256-team knockout"
      : activeAchievementYear === "pl"
        ? "Complete the season objective for every Premier League club"
        : activeAchievementYear === "ucl"
          ? "Complete the Champions League objective for every selectable club"
      : activeAchievementYear === 2016
        ? "Win UEFA Euro 2016 with every country"
        : `Win the ${activeAchievementYear} WC with every country`;
    if (elements.achievementChallengeTitle) elements.achievementChallengeTitle.textContent = challengeCopy;
    if (elements.retroAchievementModalDescription) elements.retroAchievementModalDescription.textContent = challengeCopy;
    document.querySelectorAll("[data-achievement-year]").forEach((button) => {
      button.setAttribute("aria-selected", String(normalizeAchievementKey(button.dataset.achievementYear) === activeAchievementYear));
    });
  }

  async function loadAchievements(year = activeAchievementYear) {
    if (!elements.achievementGrid) return;
    activeAchievementYear = normalizeAchievementKey(year);
    try {
      achievementPayloads.set(activeAchievementYear, await challengeApi(achievementEndpoint(activeAchievementYear)));
    } catch (error) {
      if (error.status === 401) achievementPayloads.delete(activeAchievementYear);
    }
    renderAchievements();
  }

  function playAchievementSound(grandUnlock = false) {
    try {
      const sound = new Audio("/assets/audio/achievement-unlock.mp3");
      sound.volume = grandUnlock ? 1 : 0.82;
      void sound.play();
    } catch {
      // Achievement progress still works when browser audio is unavailable.
    }
  }

  function openAchievementUnlock() {
    if (!pendingAchievementUnlock || !elements.achievementModal) return;
    const payload = pendingAchievementUnlock;
    const grandUnlock = payload.challengeUnlocked === true;
    const year = normalizeAchievementKey(payload.achievement?.year);
    elements.achievementModal.dataset.achievementTheme = String(year);
    const knockout = year === 256;
    const euros = year === 2016;
    const premierLeague = year === "pl";
    const ucl = year === "ucl";
    elements.achievementModalTitle.textContent = grandUnlock
      ? knockout ? "256 Knockout mastered" : premierLeague ? "Premier League mastered" : ucl ? "Champions League mastered" : euros ? "UEFA Euro 2016 mastered" : `${year} World Cup mastered`
      : `${payload.unlockedTeam.teamName} complete`;
    elements.achievementModalCopy.textContent = grandUnlock
      ? knockout
        ? `You have completed all 256 knockout objectives. ${payload.achievement.completedPoints} points earned in this mode.`
        : premierLeague
          ? `You have completed the objective for all 20 Premier League clubs. ${payload.achievement.completedPoints} points earned in this mode.`
        : ucl
          ? `You have completed the objective for all 39 Champions League clubs. ${payload.achievement.completedPoints} points earned in this mode.`
        : euros
          ? `You have won UEFA Euro 2016 with all ${payload.achievement.total} countries. ${payload.achievement.completedPoints} points earned in this competition.`
          : `You have won the ${year} World Cup with all ${payload.achievement.total} countries. ${payload.achievement.completedPoints} points earned in this World Cup.`
      : knockout || premierLeague || ucl
        ? `${payload.unlockedTeam.objectiveLabel} completed in ${payload.unlockedTeam.achievedOnAttempt} ${payload.unlockedTeam.achievedOnAttempt === 1 ? "try" : "tries"}. +${payload.unlockedTeam.points} points. ${payload.achievement.completed} of ${payload.achievement.total} ${premierLeague || ucl ? "clubs" : "countries"} complete.`
        : `${euros ? "European Championship" : "World Cup"} won in ${payload.unlockedTeam.wonOnAttempt} ${payload.unlockedTeam.wonOnAttempt === 1 ? "try" : "tries"}. +${payload.unlockedTeam.points} points. ${payload.achievement.completed} of ${payload.achievement.total} countries complete.`;
    if (!elements.achievementModal.open) elements.achievementModal.showModal();
  }

  function showAchievementUnlock(payload) {
    if (!elements.achievementModal || (!payload.countryUnlocked && !payload.clubUnlocked && !payload.challengeUnlocked)) return;
    const grandUnlock = payload.challengeUnlocked === true;
    const year = normalizeAchievementKey(payload.achievement?.year);
    pendingAchievementUnlock = payload;
    elements.achievementBanner.dataset.achievementTheme = String(year);
    elements.achievementModal.dataset.achievementTheme = String(year);
    elements.achievementBannerTitle.textContent = grandUnlock
      ? year === 256 ? "256 Knockout mastered" : year === "pl" ? "Premier League mastered" : year === "ucl" ? "Champions League mastered" : year === 2016 ? "UEFA Euro 2016 mastered" : `${year} World Cup mastered`
      : `${payload.unlockedTeam.teamName} complete · +${payload.unlockedTeam.points} pts`;
    clearTimeout(achievementBannerTimer);
    elements.achievementBanner.hidden = false;
    requestAnimationFrame(() => elements.achievementBanner.classList.add("is-visible"));
    playAchievementSound(grandUnlock);
    achievementBannerTimer = window.setTimeout(() => {
      elements.achievementBanner.classList.remove("is-visible");
      window.setTimeout(() => {
        elements.achievementBanner.hidden = true;
      }, 280);
    }, 3000);
  }

  async function openRetroAchievementsModal(year = 2014) {
    const achievementKey = normalizeAchievementKey(year);
    if (Number.isInteger(achievementKey) && achievementKey !== 256) {
      const savedTournaments = (window.getRetroAchievementTournamentStates?.() || [])
        .filter((tournament) => Number(tournament?.year) === achievementKey);
      await Promise.all(savedTournaments.map((tournament) => trackRetroTournament(tournament)));
    }
    if (achievementKey === "pl") {
      const savedSeason = window.PremierLeagueSeason?.achievementState?.() || null;
      if (savedSeason) await trackPremierLeagueSeason(savedSeason);
    }
    if (achievementKey === "ucl") {
      const savedSeason = window.UclSeason?.achievementState?.() || null;
      if (savedSeason) await trackUclSeason(savedSeason);
    }
    await loadAchievements(year);
    if (elements.retroAchievementModal && !elements.retroAchievementModal.open) {
      elements.retroAchievementModal.showModal();
    }
  }

  function completedRetroChampion(tournament) {
    if (tournament?.phase !== "complete") return null;
    const final = (tournament?.knockoutRounds || [])
      .flatMap((round) => round?.matches || [])
      .find((match) => match?.id === "ko-final");
    const finalWinner = typeof final?.result?.winner === "string"
      ? final.result.winner.trim()
      : "";
    const recordedChampion = typeof tournament.champion === "string"
      ? tournament.champion.trim()
      : "";
    if (
      !finalWinner
      || final.result?.revealed !== true
      || recordedChampion !== finalWinner
    ) return null;
    return finalWinner;
  }

  async function trackRetroTournament(tournament) {
    const year = Number(tournament?.year);
    if (![1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2026].includes(year) || !tournament?.managedTeam || !Number.isInteger(Number(tournament.seed))) return;
    const champion = completedRetroChampion(tournament);
    const phase = tournament.phase === "complete" && champion ? "complete" : "start";
    const key = `${year}:${tournament.seed}:${tournament.managedTeam}:${phase}:${champion || ""}`;
    if (trackedRetroRequests.has(key)) return trackedRetroRequests.get(key);
    const request = challengeApi(`/achievements/retro-${year}`, {
      method: "POST",
      keepalive: phase === "complete",
      body: {
        seed: Number(tournament.seed),
        teamName: tournament.managedTeam,
        phase,
        champion,
      },
    }).then((payload) => {
      achievementPayloads.set(year, payload);
      activeAchievementYear = year;
      renderAchievements();
      showAchievementUnlock(payload);
      return payload;
    }).catch((error) => {
      if (error.status !== 401) {
        console.warn("Achievement tracking failed", error);
        window.dispatchEvent(new CustomEvent("achievement-tracking-error", {
          detail: {
            year,
            message: error.message || `Could not save the ${year} achievement.`,
          },
        }));
      }
      trackedRetroRequests.delete(key);
      return null;
    });
    trackedRetroRequests.set(key, request);
    return request;
  }

  async function trackKnockoutTournament(tournament) {
    if (
      !tournament?.teamId
      || !Number.isInteger(Number(tournament.seed))
      || !Number.isInteger(Number(tournament.bestRoundIndex))
    ) return null;
    const key = [
      tournament.seed,
      tournament.teamId,
      tournament.bestRoundIndex,
      tournament.championTeamId || "",
      tournament.phase,
    ].join(":");
    if (trackedKnockoutRequests.has(key)) return trackedKnockoutRequests.get(key);
    const request = challengeApi("/achievements/knockout-256", {
      method: "POST",
      keepalive: tournament.phase === "complete",
      body: {
        seed: Number(tournament.seed),
        teamId: tournament.teamId,
        bestRoundIndex: Number(tournament.bestRoundIndex),
        championTeamId: tournament.championTeamId || null,
        phase: tournament.phase,
      },
    }).then((payload) => {
      achievementPayloads.set(256, payload);
      renderAchievements();
      showAchievementUnlock(payload);
      return payload;
    }).catch((error) => {
      if (error.status !== 401) console.warn("256 knockout achievement tracking failed", error);
      trackedKnockoutRequests.delete(key);
      return null;
    });
    trackedKnockoutRequests.set(key, request);
    return request;
  }

  async function trackPremierLeagueSeason(seasonState) {
    if (
      !seasonState?.clubId
      || !Number.isSafeInteger(Number(seasonState.seed))
      || !["start", "complete"].includes(seasonState.phase)
      || (seasonState.phase === "complete"
        && (!Number.isInteger(Number(seasonState.finalPosition))
          || Number(seasonState.finalPosition) < 1
          || Number(seasonState.finalPosition) > 20))
    ) return null;
    const key = [
      seasonState.seed,
      seasonState.clubId,
      seasonState.phase,
      seasonState.finalPosition || "",
    ].join(":");
    if (trackedPremierLeagueRequests.has(key)) return trackedPremierLeagueRequests.get(key);
    const request = challengeApi("/achievements/premier-league", {
      method: "POST",
      keepalive: seasonState.phase === "complete",
      body: {
        seed: Number(seasonState.seed),
        clubId: seasonState.clubId,
        phase: seasonState.phase,
        finalPosition: seasonState.phase === "complete" ? Number(seasonState.finalPosition) : null,
      },
    }).then((payload) => {
      achievementPayloads.set("pl", payload);
      renderAchievements();
      showAchievementUnlock(payload);
      return payload;
    }).catch((error) => {
      if (error.status !== 401) console.warn("Premier League achievement tracking failed", error);
      trackedPremierLeagueRequests.delete(key);
      return null;
    });
    trackedPremierLeagueRequests.set(key, request);
    return request;
  }

  async function trackUclSeason(seasonState) {
    if (
      !seasonState?.clubId
      || !Number.isSafeInteger(Number(seasonState.seed))
      || !["start", "complete"].includes(seasonState.phase)
      || !Number.isInteger(Number(seasonState.bestStageIndex))
      || Number(seasonState.bestStageIndex) < -1
      || Number(seasonState.bestStageIndex) > 5
    ) return null;
    const key = [
      seasonState.seed,
      seasonState.clubId,
      seasonState.phase,
      seasonState.bestStageIndex,
    ].join(":");
    if (trackedUclRequests.has(key)) return trackedUclRequests.get(key);
    const request = challengeApi("/achievements/ucl", {
      method: "POST",
      keepalive: seasonState.phase === "complete",
      body: {
        seed: Number(seasonState.seed),
        clubId: seasonState.clubId,
        phase: seasonState.phase,
        bestStageIndex: Number(seasonState.bestStageIndex),
      },
    }).then((payload) => {
      achievementPayloads.set("ucl", payload);
      activeAchievementYear = "ucl";
      renderAchievements();
      showAchievementUnlock(payload);
      return payload;
    }).catch((error) => {
      if (error.status !== 401) console.warn("UCL achievement tracking failed", error);
      trackedUclRequests.delete(key);
      return null;
    });
    trackedUclRequests.set(key, request);
    return request;
  }

  async function syncStoredRetroAchievements() {
    if (!dashboard?.account) return;
    const retroTournaments = typeof window.getRetroAchievementTournamentStates === "function"
      ? window.getRetroAchievementTournamentStates()
      : [];
    const knockoutTournament = typeof window.getKnockout256AchievementTournamentState === "function"
      ? window.getKnockout256AchievementTournamentState()
      : null;
    const premierLeagueSeason = window.PremierLeagueSeason?.achievementState?.() || null;
    const uclSeason = window.UclSeason?.achievementState?.() || null;
    await Promise.all([
      ...retroTournaments.map((tournament) => trackRetroTournament(tournament)),
      knockoutTournament ? trackKnockoutTournament(knockoutTournament) : null,
      premierLeagueSeason ? trackPremierLeagueSeason(premierLeagueSeason) : null,
      uclSeason ? trackUclSeason(uclSeason) : null,
    ]);
  }

  function profileFlagMarkup(team, className = "profile-country-flag") {
    if (!team) return '<span class="profile-avatar-empty">?</span>';
    if (team.badge) {
      return `<img class="${className} achievement-club-badge" src="${escapeHtml(team.badge)}" alt="" loading="lazy" decoding="async" />`;
    }
    if (typeof flagMarkup === "function") return flagMarkup(team, className);
    return `<span class="${className}">${escapeHtml(team.flag || "?")}</span>`;
  }

  function renderProfileAvatar() {
    const team = teamById(selectedProfileCountryId);
    elements.profileAvatar.innerHTML = profileFlagMarkup(team, "profile-avatar-flag");
  }

  function formatAchievementUnlockTime(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  }

  function renderProfileAchievements() {
    const years = [256, 1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2026, "pl", "ucl"];
    const achievements = years.map((year) => achievementPayloads.get(year)?.achievement || {
      year,
      completed: 0,
      total: year === 256 ? 256 : year === 2016 ? 24 : year === 2026 ? 48 : year === "pl" ? 20 : year === "ucl" ? 39 : 32,
      teams: [],
    });
    const completed = achievements.reduce((sum, achievement) => sum + Number(achievement.completed || 0), 0);
    const total = achievements.reduce((sum, achievement) => sum + Number(achievement.total || 32), 0);
    const points = achievements.reduce((sum, achievement) => sum + Number(achievement.completedPoints || 0), 0);
    const unlocked = achievements.flatMap((achievement) => (achievement.teams || [])
      .filter((team) => team.complete === true || team.won === true)
      .map((team) => ({ ...team, year: normalizeAchievementKey(achievement.year) })));

    elements.profileAchievementCount.textContent = String(completed);
    elements.profileAchievementTotal.textContent = String(total);
    if (elements.profileAchievementPoints) elements.profileAchievementPoints.textContent = points.toLocaleString();
    if (elements.profileAchievementSummary) elements.profileAchievementSummary.textContent = `${completed} / ${total}`;
    if (elements.profileUnlockedCount) {
      elements.profileUnlockedCount.textContent = `${unlocked.length} ${unlocked.length === 1 ? "achievement" : "achievements"}`;
    }

    achievements.forEach((achievement) => {
      const year = normalizeAchievementKey(achievement.year);
      const yearCompleted = Number(achievement.completed || 0);
      const yearTotal = Number(achievement.total || 32);
      const countElement = {
        2010: elements.profile2010AchievementCount,
        2014: elements.profile2014AchievementCount,
        2016: elements.profile2016AchievementCount,
        2018: elements.profile2018AchievementCount,
        2022: elements.profile2022AchievementCount,
      }[year];
      const barElement = {
        2010: elements.profile2010AchievementBar,
        2014: elements.profile2014AchievementBar,
        2016: elements.profile2016AchievementBar,
        2018: elements.profile2018AchievementBar,
        2022: elements.profile2022AchievementBar,
      }[year];
      if (countElement) countElement.textContent = `${yearCompleted} / ${yearTotal}`;
      if (barElement) barElement.style.width = `${Math.min(100, (yearCompleted / yearTotal) * 100)}%`;
    });

    elements.profileUnlockedAchievements.innerHTML = unlocked.length
      ? unlocked.map((achievement) => {
        const team = achievement.year === "pl"
          ? premierLeagueClubById(achievement.clubId) || premierLeagueClubByName(achievement.teamName)
          : achievement.year === "ucl"
            ? uclClubById(achievement.clubId) || uclClubByName(achievement.teamName)
            : achievement.teamId ? teamById(achievement.teamId) : teamByName(achievement.teamName);
        const tries = Number(achievement.achievedOnAttempt || achievement.wonOnAttempt || achievement.attempts || 1);
        const unlockedAt = formatAchievementUnlockTime(achievement.unlockedAt);
        const achievementCopy = achievement.year === 256
          ? `256 Knockout - ${achievement.objectiveLabel} in ${tries} ${tries === 1 ? "try" : "tries"}`
          : achievement.year === "pl"
            ? `Premier League 26/27 - ${achievement.objectiveLabel} in ${tries} ${tries === 1 ? "try" : "tries"}`
            : achievement.year === "ucl"
              ? `Champions League 26/27 - ${achievement.objectiveLabel} in ${tries} ${tries === 1 ? "try" : "tries"}`
              : `${achievementCompetitionLabel(achievement.year)} - Won in ${tries} ${tries === 1 ? "try" : "tries"}`;
        return `
          <article class="profile-unlocked-achievement">
            ${profileFlagMarkup(team, "profile-unlocked-flag")}
            <span>
              <strong>${escapeHtml(achievement.teamName)}</strong>
              <small>${escapeHtml(achievementCopy)}</small>
              ${unlockedAt ? `<time datetime="${new Date(Number(achievement.unlockedAt)).toISOString()}">Unlocked ${escapeHtml(unlockedAt)}</time>` : ""}
            </span>
            <b aria-label="${Number(achievement.points || 0)} points">${Number(achievement.points || 0)} pts</b>
          </article>
        `;
      }).join("")
      : '<p class="profile-empty-state">No achievements unlocked yet.</p>';
  }

  function renderProfileTournamentHistory() {
    if (!elements.profileTournamentHistory) return;
    const records = window.TournamentHistory?.list?.() || [];
    if (elements.profileTournamentHistoryCount) {
      elements.profileTournamentHistoryCount.textContent = `${records.length} saved`;
    }
    elements.profileTournamentHistory.innerHTML = records.length
      ? records.map((record) => {
        const savedChampion = record.teams?.[record.championId];
        const currentChampion = record.mode === "premier-league"
          ? premierLeagueClubById(record.championId)
          : null;
        const champion = savedChampion || currentChampion
          ? {
              ...(currentChampion || {}),
              ...(savedChampion || {}),
              badge: savedChampion?.badge || currentChampion?.badge || null,
            }
          : null;
        const managedTeam = record.managedTeamId ? record.teams?.[record.managedTeamId] : null;
        const savedAt = formatAchievementUnlockTime(record.savedAt);
        const editionMark = record.mode === "premier-league"
          ? '<span class="profile-history-league-trophy" aria-hidden="true">🏆</span>'
          : record.logo
            ? `<img src="${escapeHtml(record.logo)}" alt="" loading="lazy" />`
            : `<b aria-hidden="true">${record.theme === "256" ? "256" : "WC"}</b>`;
        return `
          <button
            class="profile-tournament-history-card"
            type="button"
            data-profile-history-id="${escapeHtml(record.id)}"
            data-history-theme="${escapeHtml(record.theme)}"
            aria-label="View ${escapeHtml(record.typeLabel)}, won by ${escapeHtml(champion?.name || "the champion")}"
          >
            <span class="profile-history-edition">${editionMark}</span>
            <span class="profile-history-card-copy">
              <small>${escapeHtml(record.editionLabel)}</small>
              <strong>${escapeHtml(champion?.name || "Champion")}</strong>
              <em>${escapeHtml(managedTeam
                ? `${managedTeam.name} · ${record.managedOutcome}`
                : record.managedOutcome || "Neutral view")}</em>
              <time datetime="${new Date(Number(record.savedAt)).toISOString()}">${escapeHtml(savedAt)}</time>
            </span>
            <span class="profile-history-champion-flag">
              ${profileFlagMarkup(champion, "profile-tournament-flag")}
              <i aria-hidden="true">&rarr;</i>
            </span>
          </button>`;
      }).join("")
      : '<p class="profile-empty-state">Finish a tournament, then choose Save tournament on the champion screen.</p>';
  }

  function renderAchievementLeaderboard() {
    if (!elements.homeAchievementLeaderboard) return;
    const entries = achievementLeaderboardPayload?.leaderboard || [];
    const totalAchievements = Number(achievementLeaderboardPayload?.totalAchievements || 611);
    const visibleEntries = entries.slice(0, 10);
    elements.homeAchievementLeaderboard.innerHTML = entries.length ? `
      <div class="home-achievement-row is-heading">
        <span>Rank</span><span>Player</span><span>Points</span><span>Unlocked</span>
      </div>
      ${visibleEntries.map((entry) => `
          <div class="home-achievement-row${entry.isCurrentUser ? " is-current" : ""}${Number(entry.achievements || 0) >= totalAchievements ? " is-all-achievements" : ""}${entry.rank === 1 ? " is-podium-gold" : entry.rank === 2 ? " is-podium-silver" : entry.rank === 3 ? " is-podium-bronze" : ""}">
            <strong>${entry.rank}</strong>
            <span class="home-achievement-player"><b>${escapeHtml(entry.username)}</b></span>
            <strong>${Number(entry.points || 0).toLocaleString()}</strong>
            <span>${Number(entry.achievements || 0)} / ${totalAchievements}</span>
          </div>
      `).join("")}
    ` : '<p class="home-achievement-empty">No achievements unlocked yet. The first points are waiting.</p>';
    if (elements.homeAchievementAction) {
      elements.homeAchievementAction.textContent = "View top 50";
      elements.homeAchievementAction.setAttribute("aria-expanded", "false");
    }
    const own = achievementLeaderboardPayload?.currentUser;
    if (elements.homeAchievementOwn) {
      elements.homeAchievementOwn.hidden = !own;
      elements.homeAchievementOwn.innerHTML = own
        ? `<span>Your standing</span><strong>${own.rank ? `#${own.rank}` : "Unranked"}</strong><b>${Number(own.points || 0).toLocaleString()} pts · ${Number(own.achievements || 0)} achievements</b>`
        : "";
    }
  }

  function renderAchievementLeaderboardModal() {
    if (!elements.homeAchievementModalTable) return;
    const entries = achievementLeaderboardPayload?.leaderboard || [];
    const totalAchievements = Number(achievementLeaderboardPayload?.totalAchievements || 611);
    elements.homeAchievementModalTable.innerHTML = entries.length ? `
      <div class="home-achievement-row is-heading">
        <span>Rank</span><span>Player</span><span>Points</span><span>Unlocked</span>
      </div>
      ${entries.slice(0, 50).map((entry) => `
        <div class="home-achievement-row${entry.isCurrentUser ? " is-current" : ""}${Number(entry.achievements || 0) >= totalAchievements ? " is-all-achievements" : ""}${entry.rank === 1 ? " is-podium-gold" : entry.rank === 2 ? " is-podium-silver" : entry.rank === 3 ? " is-podium-bronze" : ""}">
          <strong>${entry.rank}</strong>
          <span class="home-achievement-player"><b>${escapeHtml(entry.username)}</b></span>
          <strong>${Number(entry.points || 0).toLocaleString()}</strong>
          <span>${Number(entry.achievements || 0)} / ${totalAchievements}</span>
        </div>
      `).join("")}
    ` : '<p class="home-achievement-empty">No achievements unlocked yet.</p>';
  }

  async function loadAchievementLeaderboard() {
    if (!elements.homeAchievementLeaderboard) return;
    try {
      achievementLeaderboardPayload = await challengeApi("/achievements/leaderboard");
      renderAchievementLeaderboard();
    } catch {
      elements.homeAchievementLeaderboard.innerHTML = '<p class="home-achievement-empty">Standings could not be loaded.</p>';
    }
  }

  function renderProfileCountries() {
    const teams = typeof TEAMS !== "undefined" ? TEAMS : [];
    const query = elements.profileCountrySearch.value.trim().toLowerCase();
    const matches = teams
      .filter((team) => !query || team.name.toLowerCase().includes(query))
      .slice(0, query ? 80 : 48);
    elements.profileCountryGrid.innerHTML = matches.map((team) => `
      <button type="button" role="option" aria-selected="${String(team.id === selectedProfileCountryId)}" data-profile-country-id="${escapeHtml(team.id)}">
        ${profileFlagMarkup(team, "profile-country-flag")}
        <span>${escapeHtml(team.name)}</span>
      </button>
    `).join("");
  }

  function renderProfile() {
    const account = profilePayload?.account;
    renderProfileTournamentHistory();
    if (!account) {
      elements.profileCurrentUsername.textContent = "Not logged in";
      elements.profileUsername.value = "";
      elements.profileMessage.textContent = "Log in to edit your profile.";
      elements.profileSave.disabled = true;
      selectedProfileCountryId = null;
      renderProfileAvatar();
      renderProfileCountries();
      renderProfileAchievements();
      syncDeletionRequest();
      openAuth("login");
      return;
    }
    selectedProfileCountryId = account.profileCountryId || selectedProfileCountryId || null;
    elements.profileCurrentUsername.textContent = account.username;
    elements.profileUsername.value = account.username;
    elements.profileSave.disabled = false;
    elements.profileMessage.textContent = "";
    renderProfileAvatar();
    renderProfileCountries();
    renderProfileAchievements();
    syncDeletionRequest();
    dashboard = { ...(dashboard || {}), account };
    syncMainAccount();
  }

  async function loadProfile(expectedAccount = null) {
    const loadVersion = ++accountLoadVersion;
    try {
      profilePayload = await challengeApiForAccount("/profile", expectedAccount);
      if (loadVersion !== accountLoadVersion) return;
      if (profilePayload?.account) {
        dashboard = { ...(dashboard || {}), account: profilePayload.account };
        await syncStoredRetroAchievements();
        await Promise.all([256, 1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2026, "pl", "ucl"].map(async (year) => {
          try {
            achievementPayloads.set(year, await challengeApi(achievementEndpoint(year)));
          } catch {
            achievementPayloads.delete(year);
          }
        }));
      }
      renderProfile();
      handleAuthReturn();
      queueGeneratedUsernamePrompt();
    } catch (error) {
      if (loadVersion !== accountLoadVersion) return;
      if (expectedAccount) throw error;
      try {
        dashboard = await challengeApi();
      } catch {}
      if (loadVersion !== accountLoadVersion) return;
      profilePayload = { account: null };
      renderProfile();
      if (error.status !== 401) elements.profileMessage.textContent = error.message;
    }
  }

  function openAuth(mode = "login") {
    authMode = mode;
    const isLogin = mode === "login";
    elements.authTitle.textContent = mode === "login" ? "Log in" : "Create account";
    elements.authSubmit.textContent = mode === "login" ? "Log in" : "Register";
    elements.authSwitch.textContent = mode === "login" ? "Create an account" : "I already have an account";
    elements.password.autocomplete = mode === "login" ? "current-password" : "new-password";
    elements.emailField.hidden = isLogin;
    elements.email.required = !isLogin;
    elements.identifierLabel.textContent = isLogin ? "Username or email" : "Username";
    elements.username.name = isLogin ? "identifier" : "username";
    elements.username.autocomplete = "username";
    elements.username.maxLength = isLogin ? 254 : 20;
    elements.authMessage.textContent = "";
    syncGoogleButton();
    if (!authModal.open) authModal.showModal();
    elements.username.focus();
  }

  async function submitAuth(event) {
    event.preventDefault();
    elements.authSubmit.disabled = true;
    elements.authMessage.textContent = "";
    try {
      const body = authMode === "login"
        ? { identifier: elements.username.value, password: elements.password.value }
        : { email: elements.email.value, username: elements.username.value, password: elements.password.value };
      const authPayload = await challengeApi(`/${authMode}`, { method: "POST", body });
      const account = authPayload?.account;
      if (!account) throw new Error("Your account was saved, but sign-in could not be completed. Please log in again.");
      accountLoadVersion += 1;
      dashboard = { ...(dashboard || {}), account };
      syncMainAccount();
      if (achievementsRouteActive()) renderAchievements();
      if (challengeRouteActive()) await loadDashboard(account);
      else if (profileRouteActive()) await loadProfile(account);
      else await loadHomeAccount(account);
      authModal.close();
      authForm.reset();
    } catch (error) {
      elements.authMessage.textContent = error.message;
    } finally {
      elements.authSubmit.disabled = false;
    }
  }

  async function logout() {
    try { await challengeApi("/logout", { method: "POST", body: {} }); } catch {}
    dashboard = dashboard ? { ...dashboard, account: null } : null;
    reviewedUsernameAccountId = null;
    syncMainAccount();
    if (challengeRouteActive()) await loadDashboard();
    else if (profileRouteActive()) setProfileRoute(false, true);
    else await loadHomeAccount();
  }

  function startGoogleSignIn() {
    if (elements.googleSignIn.disabled) return;
    const returnTo = challengeRouteActive() ? "/palestine-challenge" : profileRouteActive() ? "/profile" : "/";
    window.location.assign(`/api/challenge/google/start?returnTo=${encodeURIComponent(returnTo)}`);
  }

  async function saveProfile(event) {
    event.preventDefault();
    elements.profileSave.disabled = true;
    elements.profileMessage.classList.remove("is-success");
    elements.profileMessage.textContent = "";
    try {
      const payload = await challengeApi("/profile", {
        method: "PATCH",
        body: { username: elements.profileUsername.value, profileCountryId: selectedProfileCountryId },
      });
      profilePayload = { ...(profilePayload || {}), account: payload.account };
      dashboard = { ...(dashboard || {}), account: payload.account };
      renderProfile();
      syncMainAccount();
      elements.profileMessage.classList.add("is-success");
      elements.profileMessage.textContent = "Profile saved.";
    } catch (error) {
      elements.profileMessage.classList.remove("is-success");
      elements.profileMessage.textContent = error.message;
    } finally {
      elements.profileSave.disabled = false;
    }
  }

  async function saveReviewedUsername(event) {
    event.preventDefault();
    elements.usernameReviewSave.disabled = true;
    elements.usernameReviewMessage.textContent = "";
    try {
      const payload = await challengeApi("/profile", {
        method: "PATCH",
        body: { username: elements.usernameReviewInput.value },
      });
      if (profilePayload) profilePayload = { ...profilePayload, account: payload.account };
      dashboard = { ...(dashboard || {}), account: payload.account };
      syncMainAccount();
      if (profileRouteActive()) renderProfile();
      elements.usernameReviewModal.close();
    } catch (error) {
      elements.usernameReviewMessage.textContent = error.message;
      elements.usernameReviewInput.focus();
    } finally {
      elements.usernameReviewSave.disabled = false;
    }
  }

  function syncDeletionRequest() {
    if (!elements.profileDeleteRequest) return;
    const loggedIn = Boolean(profilePayload?.account);
    const pending = profilePayload?.deletionRequest?.status === "pending";
    elements.profileDeleteRequest.disabled = !loggedIn || pending;
    elements.profileDeleteRequest.textContent = pending ? "Deletion requested" : "Request deletion";
  }

  function openDeletionRequest() {
    if (!elements.profileDeleteModal || elements.profileDeleteRequest.disabled) return;
    elements.profileDeleteMessage.textContent = "";
    elements.profileDeleteForm.reset();
    if (!elements.profileDeleteModal.open) elements.profileDeleteModal.showModal();
  }

  async function submitDeletionRequest(event) {
    event.preventDefault();
    elements.profileDeleteSubmit.disabled = true;
    elements.profileDeleteMessage.textContent = "";
    try {
      const payload = await challengeApi("/profile/deletion-request", {
        method: "POST",
        body: {
          reason: elements.profileDeleteReason.value,
          details: elements.profileDeleteDetails.value,
        },
      });
      profilePayload = { ...(profilePayload || {}), deletionRequest: payload.deletionRequest };
      syncDeletionRequest();
      elements.profileDeleteMessage.textContent = "Deletion request sent.";
      window.setTimeout(() => elements.profileDeleteModal.close(), 900);
    } catch (error) {
      elements.profileDeleteMessage.textContent = error.message;
    } finally {
      elements.profileDeleteSubmit.disabled = false;
    }
  }

  async function runAction() {
    if (!dashboard?.account) {
      openAuth();
      return;
    }
    if (dashboard.challenge.status !== "active" || busy) return;
    busy = true;
    elements.message.textContent = "";
    renderRun();
    try {
      if (!dashboard.activeRun || dashboard.activeRun.status !== "active") {
        const payload = await challengeApi("/runs", { method: "POST", body: { clientCommandId: commandId() } });
        dashboard.activeRun = payload.run;
        lastFinishedRun = null;
      } else {
        const payload = await challengeApi(`/runs/${dashboard.activeRun.id}/play`, { method: "POST", body: { clientCommandId: commandId() } });
        dashboard.activeRun = payload.run;
        if (payload.run.status === "completed") {
          lastFinishedRun = payload.run;
          if (payload.run.tournamentWon) {
            window.maybeShowPostWinDonation?.(`challenge:${payload.run.id}`);
          }
          await loadDashboard();
        }
      }
    } catch (error) {
      elements.message.textContent = error.message;
      if (error.status === 401) openAuth();
    } finally {
      busy = false;
      renderRun();
    }
  }

  function setTab(tab) {
    activeTab = tab === "history" ? "history" : "leaderboard";
    elements.leaderboardPanel.hidden = activeTab !== "leaderboard";
    elements.historyPanel.hidden = activeTab !== "history";
    document.querySelectorAll("[data-challenge-tab]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.challengeTab === activeTab));
    });
  }

  elements.open?.addEventListener("click", () => setRoute(true));
  elements.back.addEventListener("click", () => setRoute(false));
  elements.profileBack?.addEventListener("click", () => setProfileRoute(false));
  elements.account.addEventListener("click", () => dashboard?.account ? void logout() : openAuth());
  elements.mainAccount?.addEventListener("click", () => dashboard?.account ? setProfileRoute(true) : openAuth());
  elements.retroAccount?.addEventListener("click", () => dashboard?.account ? setProfileRoute(true) : openAuth());
  elements.start.addEventListener("click", runAction);
  elements.profileForm?.addEventListener("submit", saveProfile);
  elements.usernameReviewForm?.addEventListener("submit", saveReviewedUsername);
  elements.usernameReviewClose?.addEventListener("click", () => elements.usernameReviewModal.close());
  elements.usernameReviewLater?.addEventListener("click", () => elements.usernameReviewModal.close());
  elements.profileEditToggle?.addEventListener("click", () => {
    const willOpen = elements.profileEditPanel.hidden;
    elements.profileEditPanel.hidden = !willOpen;
    elements.profileEditToggle.setAttribute("aria-expanded", String(willOpen));
    elements.profileEditToggle.textContent = willOpen ? "Close editor" : "Edit profile";
    if (willOpen) elements.profileUsername.focus();
  });
  elements.profileLogout?.addEventListener("click", () => void logout());
  elements.profileDeleteRequest?.addEventListener("click", openDeletionRequest);
  elements.profileDeleteClose?.addEventListener("click", () => elements.profileDeleteModal.close());
  elements.profileDeleteForm?.addEventListener("submit", submitDeletionRequest);
  elements.achievementLogin?.addEventListener("click", () => openAuth("login"));
  elements.achievementModalClose?.addEventListener("click", () => elements.achievementModal.close());
  elements.achievementModalAction?.addEventListener("click", () => elements.achievementModal.close());
  elements.achievementBanner?.addEventListener("click", () => {
    clearTimeout(achievementBannerTimer);
    elements.achievementBanner.classList.remove("is-visible");
    elements.achievementBanner.hidden = true;
    openAchievementUnlock();
  });
  elements.retroAchievementModalClose?.addEventListener("click", () => elements.retroAchievementModal.close());
  elements.retroAchievementLogin?.addEventListener("click", () => openAuth("login"));
  elements.homeAchievementAction?.addEventListener("click", () => {
    renderAchievementLeaderboardModal();
    elements.homeAchievementModal?.showModal();
  });
  elements.homeAchievementModalClose?.addEventListener("click", () => elements.homeAchievementModal?.close());
  elements.homeAchievementModal?.addEventListener("click", (event) => {
    if (event.target === elements.homeAchievementModal) elements.homeAchievementModal.close();
  });
  document.querySelectorAll("[data-achievement-year]").forEach((button) => {
    button.addEventListener("click", () => void loadAchievements(normalizeAchievementKey(button.dataset.achievementYear)));
  });
  elements.profileCountrySearch?.addEventListener("input", renderProfileCountries);
  elements.profileCountryGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-country-id]");
    if (!button) return;
    selectedProfileCountryId = button.dataset.profileCountryId;
    renderProfileAvatar();
    renderProfileCountries();
  });
  elements.profileTournamentHistory?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-history-id]");
    if (!button) return;
    window.TournamentHistory?.open?.(button.dataset.profileHistoryId, button);
  });
  window.addEventListener("tournament-history-changed", renderProfileTournamentHistory);
  authForm.addEventListener("submit", submitAuth);
  elements.authClose.addEventListener("click", () => authModal.close());
  elements.authSwitch.addEventListener("click", () => openAuth(authMode === "login" ? "register" : "login"));
  elements.googleSignIn.addEventListener("click", startGoogleSignIn);
  document.querySelectorAll("[data-challenge-tab]").forEach((button) => button.addEventListener("click", () => setTab(button.dataset.challengeTab)));
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("online", () => void syncStoredRetroAchievements());
  window.addEventListener("retro-tournament-saved", (event) => {
    void trackRetroTournament(event.detail);
  });
  window.addEventListener("premier-league-achievement-state", (event) => {
    void trackPremierLeagueSeason(event.detail);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncStoredRetroAchievements();
  });
  window.AccountAchievements = {
    load: loadAchievements,
    trackRetroTournament,
    trackKnockoutTournament,
    trackPremierLeagueSeason,
    trackUclSeason,
    openRetroModal: openRetroAchievementsModal,
  };
  syncRoute();
})();
