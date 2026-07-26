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
    profile2010AchievementCount: $("#profile2010AchievementCount"),
    profile2014AchievementCount: $("#profile2014AchievementCount"),
    profile2018AchievementCount: $("#profile2018AchievementCount"),
    profile2022AchievementCount: $("#profile2022AchievementCount"),
    profile2010AchievementBar: $("#profile2010AchievementBar"),
    profile2014AchievementBar: $("#profile2014AchievementBar"),
    profile2018AchievementBar: $("#profile2018AchievementBar"),
    profile2022AchievementBar: $("#profile2022AchievementBar"),
    profileUnlockedCount: $("#profileUnlockedCount"),
    profileUnlockedAchievements: $("#profileUnlockedAchievements"),
    achievementCount: $("#retro2014AchievementCount"),
    achievementBar: $("#retro2014AchievementBar"),
    achievementGrid: $("#retro2014AchievementGrid"),
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
    homeAchievementLeaderboard: $("#homeAchievementLeaderboard"),
    homeAchievementOwn: $("#homeAchievementOwn"),
    homeAchievementAction: $("#homeAchievementAction"),
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
  let achievementLeaderboardPayload = null;
  let reviewedUsernameAccountId = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);

  async function challengeApi(path = "", options = {}) {
    const response = await fetch(`/api/challenge${path}`, {
      method: options.method || "GET",
      credentials: "same-origin",
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
      profileReturnPath = /^\/retro-(10|14|18|22)-world-cup(?:\?|$)/.test(currentPath) ? currentPath : "/";
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
  }

  function syncGoogleButton() {
    const enabled = dashboard?.auth?.googleEnabled === true;
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

  async function loadDashboard() {
    if (!challengeRouteActive()) return;
    try {
      const payload = await challengeApi();
      dashboard = payload;
      serverOffset = payload.challenge.serverTime - Date.now();
      renderDashboard();
      handleAuthReturn();
      queueGeneratedUsernamePrompt();
      await syncStoredRetroAchievements();
      clearInterval(countdownTimer);
      countdownTimer = setInterval(renderCountdown, 1000);
    } catch (error) {
      elements.message.textContent = error.message;
      elements.start.disabled = true;
    }
  }

  async function loadHomeAccount() {
    if (challengeRouteActive() || profileRouteActive()) return;
    try {
      dashboard = await challengeApi();
      syncMainAccount();
      syncGoogleButton();
      handleAuthReturn();
      queueGeneratedUsernamePrompt();
      await syncStoredRetroAchievements();
      await loadAchievementLeaderboard();
      if (achievementsRouteActive()) await loadAchievements();
    } catch {
      syncMainAccount();
      syncGoogleButton();
      await loadAchievementLeaderboard();
      if (achievementsRouteActive()) renderAchievements();
    }
  }

  function teamById(teamId) {
    return (typeof TEAMS !== "undefined" ? TEAMS : []).find((team) => team.id === teamId) || null;
  }

  function teamByName(teamName) {
    return (typeof TEAMS !== "undefined" ? TEAMS : []).find((team) => team.name === teamName) || null;
  }

  function renderAchievements() {
    if (!elements.achievementGrid) return;
    const account = dashboard?.account;
    const achievement = achievementPayloads.get(activeAchievementYear)?.achievement;
    const teams = achievement?.teams || (typeof RETRO_WORLD_CUPS !== "undefined"
      ? RETRO_WORLD_CUPS[activeAchievementYear].teams.map((team) => ({ teamName: team.name, attempts: 0, won: false, wonOnAttempt: null }))
      : []);
    const completed = Number(achievement?.completed || 0);
    const total = Number(achievement?.total || 32);
    const progressMarkup = teams.map((progress) => {
      const team = teamByName(progress.teamName);
      const status = progress.won
        ? `Won in ${progress.wonOnAttempt || progress.attempts} ${Number(progress.wonOnAttempt || progress.attempts) === 1 ? "try" : "tries"}`
        : progress.attempts
          ? `${progress.attempts} ${progress.attempts === 1 ? "try" : "tries"}`
          : account ? "Not attempted" : "Log in to track";
      return `
        <article class="achievement-country${progress.won ? " is-complete" : ""}">
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
    const challengeCopy = `Win the ${activeAchievementYear} WC with every country`;
    if (elements.achievementChallengeTitle) elements.achievementChallengeTitle.textContent = challengeCopy;
    if (elements.retroAchievementModalDescription) elements.retroAchievementModalDescription.textContent = challengeCopy;
    document.querySelectorAll("[data-achievement-year]").forEach((button) => {
      button.setAttribute("aria-selected", String(Number(button.dataset.achievementYear) === activeAchievementYear));
    });
  }

  async function loadAchievements(year = activeAchievementYear) {
    if (!elements.achievementGrid) return;
    activeAchievementYear = [2010, 2014, 2018, 2022].includes(Number(year)) ? Number(year) : 2014;
    try {
      achievementPayloads.set(activeAchievementYear, await challengeApi(`/achievements/retro-${activeAchievementYear}`));
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
    const year = Number(payload.achievement?.year) || 2014;
    elements.achievementModalTitle.textContent = grandUnlock ? `${year} World Cup mastered` : `${payload.unlockedTeam.teamName} complete`;
    elements.achievementModalCopy.textContent = grandUnlock
      ? `You have won the ${year} World Cup with all 32 countries. ${payload.achievement.completedPoints} points earned in this World Cup.`
      : `World Cup won in ${payload.unlockedTeam.wonOnAttempt} ${payload.unlockedTeam.wonOnAttempt === 1 ? "try" : "tries"}. +${payload.unlockedTeam.points} points. ${payload.achievement.completed} of 32 countries complete.`;
    if (!elements.achievementModal.open) elements.achievementModal.showModal();
  }

  function showAchievementUnlock(payload) {
    if (!elements.achievementModal || (!payload.countryUnlocked && !payload.challengeUnlocked)) return;
    const grandUnlock = payload.challengeUnlocked === true;
    const year = Number(payload.achievement?.year) || 2014;
    pendingAchievementUnlock = payload;
    elements.achievementBannerTitle.textContent = grandUnlock
      ? `${year} World Cup mastered`
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
    await loadAchievements(year);
    if (elements.retroAchievementModal && !elements.retroAchievementModal.open) {
      elements.retroAchievementModal.showModal();
    }
  }

  async function trackRetroTournament(tournament) {
    const year = Number(tournament?.year);
    if (![2010, 2014, 2018, 2022].includes(year) || !tournament?.managedTeam || !Number.isInteger(Number(tournament.seed))) return;
    const phase = tournament.phase === "complete" || tournament.champion ? "complete" : "start";
    const key = `${year}:${tournament.seed}:${tournament.managedTeam}:${phase}`;
    if (trackedRetroRequests.has(key)) return trackedRetroRequests.get(key);
    const request = challengeApi(`/achievements/retro-${year}`, {
      method: "POST",
      keepalive: phase === "complete",
      body: {
        seed: Number(tournament.seed),
        teamName: tournament.managedTeam,
        phase,
        champion: tournament.champion || null,
      },
    }).then((payload) => {
      achievementPayloads.set(year, payload);
      activeAchievementYear = year;
      renderAchievements();
      showAchievementUnlock(payload);
      return payload;
    }).catch((error) => {
      if (error.status !== 401) console.warn("Achievement tracking failed", error);
      trackedRetroRequests.delete(key);
      return null;
    });
    trackedRetroRequests.set(key, request);
    return request;
  }

  async function syncStoredRetroAchievements() {
    if (!dashboard?.account || typeof window.getRetroAchievementTournamentStates !== "function") return;
    const tournaments = window.getRetroAchievementTournamentStates();
    await Promise.all(tournaments.map((tournament) => trackRetroTournament(tournament)));
  }

  function profileFlagMarkup(team, className = "profile-country-flag") {
    if (!team) return '<span class="profile-avatar-empty">?</span>';
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
    const years = [2010, 2014, 2018, 2022];
    const achievements = years.map((year) => achievementPayloads.get(year)?.achievement || {
      year,
      completed: 0,
      total: 32,
      teams: [],
    });
    const completed = achievements.reduce((sum, achievement) => sum + Number(achievement.completed || 0), 0);
    const total = achievements.reduce((sum, achievement) => sum + Number(achievement.total || 32), 0);
    const points = achievements.reduce((sum, achievement) => sum + Number(achievement.completedPoints || 0), 0);
    const unlocked = achievements.flatMap((achievement) => (achievement.teams || [])
      .filter((team) => team.won)
      .map((team) => ({ ...team, year: Number(achievement.year) })));

    elements.profileAchievementCount.textContent = String(completed);
    elements.profileAchievementTotal.textContent = String(total);
    if (elements.profileAchievementPoints) elements.profileAchievementPoints.textContent = points.toLocaleString();
    if (elements.profileAchievementSummary) elements.profileAchievementSummary.textContent = `${completed} / ${total}`;
    if (elements.profileUnlockedCount) {
      elements.profileUnlockedCount.textContent = `${unlocked.length} ${unlocked.length === 1 ? "achievement" : "achievements"}`;
    }

    achievements.forEach((achievement) => {
      const year = Number(achievement.year);
      const yearCompleted = Number(achievement.completed || 0);
      const yearTotal = Number(achievement.total || 32);
      const countElement = {
        2010: elements.profile2010AchievementCount,
        2014: elements.profile2014AchievementCount,
        2018: elements.profile2018AchievementCount,
        2022: elements.profile2022AchievementCount,
      }[year];
      const barElement = {
        2010: elements.profile2010AchievementBar,
        2014: elements.profile2014AchievementBar,
        2018: elements.profile2018AchievementBar,
        2022: elements.profile2022AchievementBar,
      }[year];
      if (countElement) countElement.textContent = `${yearCompleted} / ${yearTotal}`;
      if (barElement) barElement.style.width = `${Math.min(100, (yearCompleted / yearTotal) * 100)}%`;
    });

    elements.profileUnlockedAchievements.innerHTML = unlocked.length
      ? unlocked.map((achievement) => {
        const team = teamByName(achievement.teamName);
        const tries = Number(achievement.wonOnAttempt || achievement.attempts || 1);
        const unlockedAt = formatAchievementUnlockTime(achievement.unlockedAt);
        return `
          <article class="profile-unlocked-achievement">
            ${profileFlagMarkup(team, "profile-unlocked-flag")}
            <span>
              <strong>${escapeHtml(achievement.teamName)}</strong>
              <small>${achievement.year} World Cup · Won in ${tries} ${tries === 1 ? "try" : "tries"}</small>
              ${unlockedAt ? `<time datetime="${new Date(Number(achievement.unlockedAt)).toISOString()}">Unlocked ${escapeHtml(unlockedAt)}</time>` : ""}
            </span>
            <b aria-label="${Number(achievement.points || 0)} points">${Number(achievement.points || 0)} pts</b>
          </article>
        `;
      }).join("")
      : '<p class="profile-empty-state">No World Cup achievements unlocked yet.</p>';
  }

  function renderAchievementLeaderboard() {
    if (!elements.homeAchievementLeaderboard) return;
    const entries = achievementLeaderboardPayload?.leaderboard || [];
    elements.homeAchievementLeaderboard.innerHTML = entries.length ? `
      <div class="home-achievement-row is-heading">
        <span>Rank</span><span>Player</span><span>Points</span><span>Unlocked</span>
      </div>
      ${entries.slice(0, 10).map((entry) => `
          <div class="home-achievement-row${entry.isCurrentUser ? " is-current" : ""}">
            <strong>${entry.rank}</strong>
            <span class="home-achievement-player"><b>${escapeHtml(entry.username)}</b></span>
            <strong>${Number(entry.points || 0).toLocaleString()}</strong>
            <span>${Number(entry.achievements || 0)} / ${Number(achievementLeaderboardPayload.totalAchievements || 128)}</span>
          </div>
        `).join("")}
    ` : '<p class="home-achievement-empty">No achievements unlocked yet. The first points are waiting.</p>';
    const own = achievementLeaderboardPayload?.currentUser;
    if (elements.homeAchievementOwn) {
      elements.homeAchievementOwn.hidden = !own;
      elements.homeAchievementOwn.innerHTML = own
        ? `<span>Your standing</span><strong>${own.rank ? `#${own.rank}` : "Unranked"}</strong><b>${Number(own.points || 0).toLocaleString()} pts · ${Number(own.achievements || 0)} achievements</b>`
        : "";
    }
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

  async function loadProfile() {
    try {
      profilePayload = await challengeApi("/profile");
      if (profilePayload?.account) {
        dashboard = { ...(dashboard || {}), account: profilePayload.account };
        await syncStoredRetroAchievements();
        await Promise.all([2010, 2014, 2018, 2022].map(async (year) => {
          try {
            achievementPayloads.set(year, await challengeApi(`/achievements/retro-${year}`));
          } catch {
            achievementPayloads.delete(year);
          }
        }));
      }
      renderProfile();
      handleAuthReturn();
      queueGeneratedUsernamePrompt();
    } catch (error) {
      try {
        dashboard = await challengeApi();
      } catch {}
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
      await challengeApi(`/${authMode}`, { method: "POST", body });
      authModal.close();
      authForm.reset();
      if (challengeRouteActive()) await loadDashboard();
      else if (profileRouteActive()) await loadProfile();
      else await loadHomeAccount();
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
  elements.homeAchievementAction?.addEventListener("click", () => document.querySelector("#openAchievementsButton")?.click());
  document.querySelectorAll("[data-achievement-year]").forEach((button) => {
    button.addEventListener("click", () => void loadAchievements(Number(button.dataset.achievementYear)));
  });
  elements.profileCountrySearch?.addEventListener("input", renderProfileCountries);
  elements.profileCountryGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-profile-country-id]");
    if (!button) return;
    selectedProfileCountryId = button.dataset.profileCountryId;
    renderProfileAvatar();
    renderProfileCountries();
  });
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
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void syncStoredRetroAchievements();
  });
  window.AccountAchievements = {
    load: loadAchievements,
    trackRetroTournament,
    openRetroModal: openRetroAchievementsModal,
  };
  syncRoute();
})();
