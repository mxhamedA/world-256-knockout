(() => {
  "use strict";

  const engine = window.PlayerCareerEngine;
  const screen = document.getElementById("playerCareerScreen");
  const app = document.getElementById("careerApp");
  const appShell = document.getElementById("appShell");
  const challengeScreen = document.getElementById("palestineChallengeScreen");
  const profileScreen = document.getElementById("profileScreen");
  const coinBalance = document.getElementById("careerCoinBalance");
  const saveStatus = document.getElementById("careerSaveStatus");
  const accountButton = document.getElementById("careerAccountButton");
  const globalMessage = document.getElementById("careerGlobalMessage");
  const profileContent = document.getElementById("profileCareerContent");
  if (!engine || !screen || !app) return;

  const STORAGE_KEY = "world-256-player-career-v1";
  const ATTRIBUTE_LABELS = Object.freeze({
    pace: "PAC",
    shooting: "SHO",
    passing: "PAS",
    dribbling: "DRI",
    defending: "DEF",
    physical: "PHY",
  });
  const FORM_LABELS = Object.freeze({
    hot: "Hot streak",
    cold: "Cold streak",
    consistent: "Consistent",
    inconsistent: "Inconsistent",
    steady: "Steady",
  });

  let career = readLocalCareer();
  let account = null;
  let cloudAuthenticated = false;
  let academySeed = Date.now() >>> 0;
  let academyChoices = [];
  let selectedAcademyId = null;
  let activeHubTab = "fixtures";
  let actionBusy = false;
  let saveTimer = null;
  let messageTimer = null;
  let cloudQueue = Promise.resolve();
  let matchView = null;
  let playbackTimer = null;
  const defaultDocumentTitle = document.title;
  const defaultDescription = document.querySelector('meta[name="description"]')?.content || "";
  const defaultCanonical = document.querySelector('link[rel="canonical"]')?.href || "https://www.256teams.com/";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);

  function safeAssetPath(value) {
    const path = String(value || "");
    return /^(?:\.\/|\/)?assets\/[a-z0-9_./-]+$/i.test(path) ? path : "";
  }

  function allNations() {
    const source = typeof TEAMS !== "undefined" && Array.isArray(TEAMS) ? TEAMS : [];
    return source.map((team) => ({
      id: String(team.id),
      name: String(team.name),
      code: String(team.code || ""),
      flag: String(team.flag || ""),
    })).sort((left, right) => left.name.localeCompare(right.name));
  }

  function allClubs() {
    const source = Array.isArray(window.PREMIER_LEAGUE_2026_27_CLUBS)
      ? window.PREMIER_LEAGUE_2026_27_CLUBS
      : [];
    return engine.normalizeClubs(source);
  }

  function readLocalCareer() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return engine.validate(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeLocalCareer(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setSaveStatus("Local save unavailable", "error");
      console.warn("Career local save failed", error);
    }
  }

  function setSaveStatus(label, tone = "") {
    if (!saveStatus) return;
    saveStatus.textContent = label;
    saveStatus.className = `career-save-status${tone ? ` is-${tone}` : ""}`;
  }

  function showMessage(message, duration = 3600) {
    if (!globalMessage) return;
    window.clearTimeout(messageTimer);
    globalMessage.textContent = String(message || "");
    if (message) {
      messageTimer = window.setTimeout(() => {
        globalMessage.textContent = "";
      }, duration);
    }
  }

  async function careerApi(method = "GET", body = null) {
    const response = await fetch("/api/challenge/career", {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "Cloud save is unavailable.");
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function scheduleCloudSave() {
    window.clearTimeout(saveTimer);
    if (!career || !cloudAuthenticated) {
      setSaveStatus(career ? "Saved on this device" : "Local save", career ? "saved" : "");
      return;
    }
    setSaveStatus("Saving...", "saving");
    saveTimer = window.setTimeout(() => {
      cloudQueue = cloudQueue.then(pushCloudSave, pushCloudSave);
    }, 550);
  }

  async function pushCloudSave() {
    if (!career || !cloudAuthenticated) return;
    const snapshot = JSON.parse(JSON.stringify(career));
    try {
      const payload = await careerApi("PUT", { save: snapshot });
      if (career?.id === snapshot.id && Number(career.updatedAt) <= Number(snapshot.updatedAt)) {
        career = engine.validate(payload.save) ? payload.save : career;
        writeLocalCareer(career);
      } else if (career?.id === snapshot.id) {
        scheduleCloudSave();
      }
      setSaveStatus("Saved to cloud", "saved");
      renderHeader();
      renderProfileCareer();
    } catch (error) {
      if (error.status === 401) {
        cloudAuthenticated = false;
        account = null;
        setSaveStatus("Saved on this device", "saved");
      } else {
        setSaveStatus("Cloud sync paused", "error");
      }
      renderHeader();
    }
  }

  async function reconcileCloudSave() {
    setSaveStatus("Checking cloud...", "saving");
    try {
      const payload = await careerApi("GET");
      cloudAuthenticated = true;
      const cloudCareer = engine.validate(payload.save) ? payload.save : null;
      if (cloudCareer && (!career || Number(cloudCareer.updatedAt) > Number(career.updatedAt))) {
        career = cloudCareer;
        writeLocalCareer(career);
      } else if (career && (!cloudCareer || Number(career.updatedAt) > Number(cloudCareer.updatedAt))) {
        scheduleCloudSave();
      } else {
        setSaveStatus(career ? "Saved to cloud" : "Cloud slot ready", "saved");
      }
      if (careerRouteActive() && !matchView) renderCurrentView();
      renderHeader();
      renderProfileCareer();
    } catch (error) {
      if (error.status === 401) {
        cloudAuthenticated = false;
        setSaveStatus(career ? "Saved on this device" : "Local save", career ? "saved" : "");
      } else {
        setSaveStatus(career ? "Offline - saved locally" : "Offline mode", "error");
      }
      renderHeader();
      renderProfileCareer();
    }
  }

  function commitCareer(nextCareer, { render = true, sync = true } = {}) {
    career = nextCareer;
    writeLocalCareer(career);
    renderHeader();
    renderProfileCareer();
    if (sync) scheduleCloudSave();
    if (render && careerRouteActive() && !matchView) renderCurrentView();
  }

  function careerRouteActive() {
    return (window.location.pathname.replace(/\/+$/, "") || "/") === "/player-career";
  }

  function syncRoute() {
    const active = careerRouteActive();
    screen.hidden = !active;
    document.body.classList.toggle("career-mode-active", active);
    if (active) {
      document.title = "Player Career Mode | 256 Teams";
      const description = document.querySelector('meta[name="description"]');
      const canonical = document.querySelector('link[rel="canonical"]');
      if (description) description.content = "Create a 15-year-old football prospect, play complete seasons, train attributes and choose every career transfer.";
      if (canonical) canonical.href = "https://www.256teams.com/player-career";
      if (challengeScreen) challengeScreen.hidden = true;
      if (profileScreen) profileScreen.hidden = true;
      if (appShell) {
        appShell.hidden = true;
        appShell.style.setProperty("display", "none", "important");
      }
      renderCurrentView();
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      document.title = defaultDocumentTitle;
      const description = document.querySelector('meta[name="description"]');
      const canonical = document.querySelector('link[rel="canonical"]');
      if (description) description.content = defaultDescription;
      if (canonical) canonical.href = defaultCanonical;
      stopPlayback();
      matchView = null;
      if (appShell?.style.getPropertyValue("display") === "none") appShell.style.removeProperty("display");
    }
  }

  function renderHeader() {
    if (coinBalance) coinBalance.textContent = String(career?.coins?.balance || 0);
    if (accountButton) accountButton.textContent = account?.username || (cloudAuthenticated ? "Account" : "Log in");
  }

  function badgeMarkup(club, className = "career-club-badge") {
    const src = safeAssetPath(club?.badge || club?.clubBadge);
    const code = escapeHtml(club?.code || club?.clubCode || String(club?.name || club?.clubName || "CLB").slice(0, 3).toUpperCase());
    if (!src) return `<span class="${className} career-badge-fallback">${code}</span>`;
    return `<img class="${className}" src="${escapeHtml(src)}" alt="" data-career-badge-fallback="${code}" />`;
  }

  function formatForm(form) {
    return FORM_LABELS[form] || FORM_LABELS.steady;
  }

  function formatWage(value) {
    return `£${Math.round(Number(value || 0)).toLocaleString("en-GB")}/wk`;
  }

  function shortDate(dateString) {
    const date = new Date(`${dateString}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return escapeHtml(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
  }

  function renderProfileCareer() {
    if (!profileContent) return;
    if (!career) {
      profileContent.innerHTML = "<p>No career save yet. Create a 15-year-old prospect and begin your first season.</p>";
      return;
    }
    const summary = engine.careerSummary(career);
    const nationality = summary.nationality?.flag || summary.nationality?.code || "";
    profileContent.innerHTML = `
      <div class="profile-career-save">
        ${badgeMarkup({ badge: summary.clubBadge, code: String(summary.clubName).slice(0, 3) })}
        <div class="profile-career-content-copy">
          <span>${escapeHtml(nationality)} ${escapeHtml(summary.position)} · ${escapeHtml(summary.season)}</span>
          <strong>${escapeHtml(summary.playerName)}</strong>
          <small>${escapeHtml(summary.clubName)} · ${escapeHtml(summary.league)}</small>
        </div>
        <div class="profile-career-stat"><span>OVR</span><strong>${summary.overall}</strong></div>
        <div class="profile-career-stat"><span>Age</span><strong>${summary.age}</strong></div>
        <div class="profile-career-stat"><span>Apps</span><strong>${summary.stats.appearances}</strong></div>
        <div class="profile-career-stat"><span>${career.player.position === "GK" ? "CS" : "G + A"}</span><strong>${career.player.position === "GK" ? summary.stats.cleanSheets : summary.stats.goals + summary.stats.assists}</strong></div>
      </div>
    `;
  }

  function renderCurrentView() {
    if (!careerRouteActive()) return;
    if (matchView) {
      renderMatchView();
      return;
    }
    if (!career) {
      renderCreation();
      return;
    }
    if (career.season.status === "transfer") {
      renderTransfer();
      return;
    }
    renderHub();
  }

  function generateAcademies() {
    academySeed = (academySeed + 2654435761) >>> 0;
    academyChoices = engine.academyOptions(allClubs(), academySeed);
    selectedAcademyId = academyChoices[0]?.id || null;
  }

  function renderCreation() {
    if (!academyChoices.length) generateAcademies();
    const nations = allNations();
    const defaultNation = nations.find((nation) => nation.name === "England")?.id || nations[0]?.id || "";
    app.innerHTML = `
      <div class="career-creation-shell">
        <section class="career-creation-hero">
          <div>
            <span class="career-eyebrow">PLAYER CAREER · CHAPTER ONE</span>
            <h1>Every legend starts somewhere.</h1>
            <p>Create a 15-year-old prospect, choose the academy that believes in them, and earn every step of the journey.</p>
          </div>
          <div class="career-creation-date">
            <span>CAREER BEGINS</span>
            <strong>1 January 2026</strong>
            <small>Age 15 · Academy football</small>
          </div>
        </section>
        <form class="career-creation-form career-panel" id="careerCreationForm">
          <div class="career-panel-heading">
            <div><span>BUILD YOUR PROSPECT</span><h2>Player details</h2></div>
            <strong>STEP 1 OF 1</strong>
          </div>
          <div class="career-form-body">
            <div class="career-form-grid">
              <label class="career-field">
                <span>Full name</span>
                <input name="fullName" type="text" autocomplete="name" minlength="3" maxlength="60" placeholder="First and last name" required />
              </label>
              <label class="career-field">
                <span>Nationality</span>
                <select name="nationality" required>
                  ${nations.map((nation) => `<option value="${escapeHtml(nation.id)}"${nation.id === defaultNation ? " selected" : ""}>${escapeHtml(nation.flag)} ${escapeHtml(nation.name)}</option>`).join("")}
                </select>
              </label>
              <label class="career-field">
                <span>Position</span>
                <select name="position" required>
                  ${engine.POSITIONS.map((position) => `<option value="${position}"${position === "CM" ? " selected" : ""}>${position}</option>`).join("")}
                </select>
              </label>
              <label class="career-field">
                <span>Preferred foot</span>
                <select name="preferredFoot" required>
                  ${engine.FEET.map((foot) => `<option value="${foot}"${foot === "Right" ? " selected" : ""}>${foot}</option>`).join("")}
                </select>
              </label>
            </div>
            <section class="career-academy-section" aria-labelledby="careerAcademyTitle">
              <div class="career-academy-intro">
                <div>
                  <span class="career-section-kicker">THREE OFFERS</span>
                  <p id="careerAcademyTitle">Choose the academy pathway that fits your first step.</p>
                </div>
                <button class="career-text-button" type="button" data-career-action="reroll-academies">New academy offers</button>
              </div>
              <div class="career-academy-grid">
                ${academyChoices.map((club) => `
                  <button class="career-academy-card${club.id === selectedAcademyId ? " is-selected" : ""}" type="button" data-career-action="select-academy" data-club-id="${escapeHtml(club.id)}" aria-pressed="${String(club.id === selectedAcademyId)}">
                    ${badgeMarkup(club)}
                    <span><strong>${escapeHtml(club.academyName)}</strong><span>${escapeHtml(club.pathway)}</span></span>
                  </button>
                `).join("")}
              </div>
            </section>
            <div class="career-create-footer">
              <p>Your six attributes are generated automatically from your position and nationality. Every rating begins between 40 and 55.</p>
              <button class="career-primary-button" type="submit">Sign academy deal <span aria-hidden="true">&rarr;</span></button>
            </div>
            <p class="career-form-message" id="careerCreationMessage" role="status" aria-live="polite"></p>
          </div>
        </form>
      </div>
    `;
  }

  function playerCardMarkup() {
    const player = career.player;
    const attributes = player.attributes;
    const nationality = player.nationality?.flag || player.nationality?.code || "";
    return `
      <div class="career-player-card form-${escapeHtml(player.form)}">
        <div class="career-card-top">
          <div class="career-card-overall">${player.overall}<span>${escapeHtml(player.position)}</span></div>
          <div class="career-card-identity">
            <strong>${escapeHtml(player.fullName)}</strong>
            <span>${escapeHtml(nationality)} · Age ${player.age}</span>
          </div>
          ${badgeMarkup({ badge: player.clubBadge, code: player.clubCode }, "career-card-club-badge")}
        </div>
        <div class="career-card-silhouette"><span>${escapeHtml(player.position)}</span></div>
        <div class="career-card-attributes">
          ${engine.ATTRIBUTES.map((attribute) => `<div class="career-card-attribute"><strong>${attributes[attribute]}</strong><span>${ATTRIBUTE_LABELS[attribute]}</span></div>`).join("")}
        </div>
        <div class="career-card-footer"><span>${escapeHtml(player.clubName)}</span><span>·</span><span>${escapeHtml(player.preferredFoot)} foot</span></div>
      </div>
    `;
  }

  function seasonStatStripMarkup() {
    const stats = career.season.stats;
    return `
      <div class="career-stat-strip">
        <div><span>Apps</span><strong>${stats.appearances}</strong></div>
        <div><span>Goals</span><strong>${stats.goals}</strong></div>
        <div><span>${career.player.position === "GK" ? "Clean sheets" : "Assists"}</span><strong>${career.player.position === "GK" ? stats.cleanSheets : stats.assists}</strong></div>
        <div><span>Avg rating</span><strong>${stats.appearances ? Number(stats.averageRating).toFixed(2) : "-"}</strong></div>
      </div>
    `;
  }

  function nextMatchMarkup() {
    const fixture = engine.nextFixture(career);
    if (!fixture) return `<section class="career-panel"><div class="career-empty-state">The season is complete. Preparing contract decisions...</div></section>`;
    const playerClub = career.world.clubs.find((club) => club.id === career.player.clubId) || { name: career.player.clubName, code: career.player.clubCode, badge: career.player.clubBadge };
    const opponent = career.world.clubs.find((club) => club.id === fixture.opponentId) || { name: fixture.opponentName, code: String(fixture.opponentName).slice(0, 3) };
    const home = fixture.homeClubId === career.player.clubId ? playerClub : opponent;
    const away = fixture.awayClubId === career.player.clubId ? playerClub : opponent;
    return `
      <section class="career-panel career-next-match">
        <div class="career-panel-heading">
          <div><span>NEXT MATCH</span><h2>${escapeHtml(fixture.competition)}</h2></div>
          <span class="career-form-pill form-${escapeHtml(career.player.form)}">${escapeHtml(formatForm(career.player.form))}</span>
        </div>
        <div class="career-next-match-body">
          <div class="career-next-match-meta"><span>${escapeHtml(fixture.stage)}</span><span>${escapeHtml(engine.dateLabel(fixture.date))}</span></div>
          <div class="career-matchup">
            <div class="career-matchup-team">${badgeMarkup(home)}<strong>${escapeHtml(home.name)}</strong></div>
            <span class="career-matchup-vs">VS</span>
            <div class="career-matchup-team">${badgeMarkup(away)}<strong>${escapeHtml(away.name)}</strong></div>
          </div>
          <div class="career-next-match-actions">
            <button class="career-primary-button" type="button" data-career-action="play-match" data-fixture-id="${escapeHtml(fixture.id)}">Play match <span aria-hidden="true">&rarr;</span></button>
            <button class="career-secondary-button" type="button" data-career-action="simulate-month" data-month="${escapeHtml(fixture.month)}">Simulate ${escapeHtml(engine.monthGroups(career).find((group) => group.key === fixture.month)?.label || "month")}</button>
          </div>
        </div>
      </section>
    `;
  }

  function fixtureScore(fixture) {
    const result = fixture.result;
    if (!result) return "";
    const penalties = result.penalties ? ` (${result.penalties.home}-${result.penalties.away} pens)` : "";
    return `${result.homeGoals}-${result.awayGoals}${penalties}`;
  }

  function fixturesPanelMarkup() {
    const groups = engine.monthGroups(career);
    const next = engine.nextFixture(career);
    return `
      <div class="career-fixture-list">
        ${groups.map((group) => {
          const scheduled = group.fixtures.filter((fixture) => fixture.status === "scheduled" && !fixture.result);
          const maySimulate = next && group.key === next.month && scheduled.length;
          return `
            <section class="career-fixture-month">
              <header class="career-fixture-month-header">
                <strong>${escapeHtml(group.label)}</strong>
                ${maySimulate ? `<button type="button" data-career-action="simulate-month" data-month="${escapeHtml(group.key)}">SIMULATE MONTH</button>` : `<span>${group.fixtures.length} fixtures</span>`}
              </header>
              ${group.fixtures.map((fixture) => {
                const isNext = next?.id === fixture.id;
                const rating = fixture.result?.appeared ? Number(fixture.result.player.rating).toFixed(1) : fixture.result ? "DNP" : "";
                return `
                  <div class="career-fixture-row">
                    <time class="career-fixture-date" datetime="${escapeHtml(fixture.date)}">${shortDate(fixture.date)}</time>
                    <div class="career-fixture-copy"><strong>${fixture.isHome ? "vs" : "at"} ${escapeHtml(fixture.opponentName)}</strong><span>${escapeHtml(fixture.competition)} · ${escapeHtml(fixture.stage)}</span></div>
                    <div class="career-fixture-result">
                      ${fixture.result
                        ? `<button type="button" data-career-action="view-result" data-fixture-id="${escapeHtml(fixture.id)}"><strong>${escapeHtml(fixtureScore(fixture))}</strong><span>${rating ? `Rating ${rating}` : "View match"}</span></button>`
                        : isNext
                          ? `<button type="button" data-career-action="play-match" data-fixture-id="${escapeHtml(fixture.id)}">PLAY</button>`
                          : "<span>UPCOMING</span>"}
                    </div>
                  </div>
                `;
              }).join("")}
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  function developmentPanelMarkup() {
    const currentWeek = engine.currentTrainingWeek(career);
    const completed = career.training.completedWeeks.includes(currentWeek);
    const latest = career.training.latestSession;
    return `
      <div class="career-training-body">
        <div class="career-training-balance"><span>AVAILABLE TRAINING POINTS</span><strong>${career.training.points} TP</strong></div>
        <div class="career-training-controls">
          <label><span>Training focus</span><select id="careerTrainingFocus">${engine.ATTRIBUTES.map((attribute) => `<option value="${attribute}">${ATTRIBUTE_LABELS[attribute]} · ${attribute[0].toUpperCase()}${attribute.slice(1)}</option>`).join("")}</select></label>
          <label><span>Effort level</span><select id="careerTrainingEffort"><option value="light">Light · 2+ TP</option><option value="medium" selected>Medium · 4+ TP</option><option value="intense">Intense · 7+ TP</option></select></label>
        </div>
        <button class="career-primary-button career-training-submit" type="button" data-career-action="train"${completed ? " disabled" : ""}>${completed ? "Training complete this week" : "Complete weekly session"}</button>
        <p class="career-training-note">${latest ? `Last session: ${escapeHtml(latest.effort)} ${escapeHtml(latest.focus)} · +${latest.earned} TP.` : "Light training protects freshness. Intense sessions earn more points but add more fatigue."}</p>
        <div class="career-upgrade-list">
          ${engine.ATTRIBUTES.map((attribute) => {
            const rating = career.player.attributes[attribute];
            const cost = engine.trainingCost(rating);
            return `
              <div class="career-upgrade-row">
                <strong>${ATTRIBUTE_LABELS[attribute]} ${rating}</strong>
                <div class="career-attribute-meter" aria-hidden="true"><span style="width:${rating}%"></span></div>
                <div class="career-upgrade-actions">
                  <button type="button" data-career-action="upgrade-attribute" data-attribute="${attribute}"${career.training.points < cost ? " disabled" : ""}>+1 · ${cost} TP</button>
                  <button type="button" data-career-action="buy-attribute" data-attribute="${attribute}"${career.coins.balance < 50 ? " disabled" : ""}>+1 · 50 C</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function careerPanelMarkup() {
    const season = career.season.stats;
    const total = career.player.careerStats;
    return `
      <div class="career-training-body">
        <div class="career-training-balance"><span>CAREER PEAK</span><strong>${career.player.peakOverall} OVR · AGE ${career.player.peakAge}</strong></div>
        <div class="career-performance-grid">
          <div><span>Career apps</span><strong>${total.appearances}</strong></div>
          <div><span>Career goals</span><strong>${total.goals}</strong></div>
          <div><span>Career assists</span><strong>${total.assists}</strong></div>
          <div><span>Clean sheets</span><strong>${total.cleanSheets}</strong></div>
          <div><span>This season wins</span><strong>${season.wins}</strong></div>
          <div><span>Reputation</span><strong>${career.player.reputation}</strong></div>
        </div>
        <div class="career-upgrade-list">
          ${career.history.length ? career.history.slice().reverse().map((entry) => `
            <div class="career-contract-row"><span>${escapeHtml(entry.label)} · ${escapeHtml(entry.clubName)}</span><strong>${entry.stats.appearances} apps · ${entry.stats.goals} goals · ${entry.overall} OVR</strong></div>
          `).join("") : "<p class=\"career-training-note\">Your completed seasons will build a full career timeline here.</p>"}
        </div>
      </div>
    `;
  }

  function centrePanelMarkup() {
    const content = activeHubTab === "development"
      ? developmentPanelMarkup()
      : activeHubTab === "career"
        ? careerPanelMarkup()
        : fixturesPanelMarkup();
    const title = activeHubTab === "development" ? "Training & attributes" : activeHubTab === "career" ? "Career record" : "Season fixtures";
    return `
      <div class="career-tab-bar" role="tablist" aria-label="Career hub views">
        <button class="${activeHubTab === "fixtures" ? "is-active" : ""}" type="button" role="tab" aria-selected="${String(activeHubTab === "fixtures")}" data-career-action="hub-tab" data-tab="fixtures">Fixtures</button>
        <button class="${activeHubTab === "development" ? "is-active" : ""}" type="button" role="tab" aria-selected="${String(activeHubTab === "development")}" data-career-action="hub-tab" data-tab="development">Development</button>
        <button class="${activeHubTab === "career" ? "is-active" : ""}" type="button" role="tab" aria-selected="${String(activeHubTab === "career")}" data-career-action="hub-tab" data-tab="career">Career</button>
      </div>
      <section class="career-panel">
        <div class="career-panel-heading"><div><span>${escapeHtml(career.season.label)}</span><h2>${title}</h2></div><strong>${career.season.fixtures.filter((fixture) => fixture.status === "played").length} / ${career.season.fixtures.filter((fixture) => fixture.status !== "cancelled").length}</strong></div>
        ${content}
      </section>
    `;
  }

  function newsPanelMarkup() {
    return `
      <section class="career-panel">
        <div class="career-panel-heading"><div><span>NEWS DESK</span><h3>Career feed</h3></div><strong>LIVE</strong></div>
        <div class="career-news-list">
          ${career.news.slice(0, 12).map((item) => `
            <article class="career-news-item tone-${escapeHtml(item.tone)}">
              <time>${escapeHtml(engine.dateLabel(item.date))}</time>
              <strong>${escapeHtml(item.headline)}</strong>
              <p>${escapeHtml(item.body)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function coinsPanelMarkup() {
    const objective = career.coins.objective;
    const today = new Date().toISOString().slice(0, 10);
    const claimed = career.coins.lastDailyClaim === today;
    return `
      <section class="career-panel">
        <div class="career-panel-heading"><div><span>REWARDS</span><h3>Coins & objective</h3></div><strong>${career.coins.balance} C</strong></div>
        <div class="career-coins-body">
          <div class="career-objective${objective.complete ? " is-complete" : ""}">
            <span>${objective.complete ? "OBJECTIVE COMPLETE" : "NEXT MATCH OBJECTIVE"}</span>
            <strong>${escapeHtml(objective.label)}</strong>
            <small>Reward · ${objective.reward} coins</small>
          </div>
          <div class="career-coins-row">
            <p>Daily login rewards keep upgrades optional and every core feature free.</p>
            <button class="career-secondary-button" type="button" data-career-action="claim-daily"${claimed ? " disabled" : ""}>${claimed ? "Claimed" : "+10 daily"}</button>
          </div>
        </div>
      </section>
    `;
  }

  function contractPanelMarkup() {
    const contract = career.player.contract;
    return `
      <section class="career-panel">
        <div class="career-panel-heading"><div><span>CURRENT DEAL</span><h3>${escapeHtml(career.player.clubName)}</h3></div></div>
        <div class="career-contract-body">
          <div class="career-contract-list">
            <div class="career-contract-row"><span>Squad role</span><strong>${escapeHtml(contract.role)}</strong></div>
            <div class="career-contract-row"><span>Weekly wage</span><strong>${formatWage(contract.weeklyWage)}</strong></div>
            <div class="career-contract-row"><span>Contract</span><strong>${contract.length} years</strong></div>
            <div class="career-contract-row"><span>Pathway</span><strong>${escapeHtml(contract.positionRole)}</strong></div>
          </div>
          <div class="career-fatigue-meter" title="Fatigue"><span style="width:${career.player.fatigue}%"></span></div>
          <p class="career-training-note">Fatigue ${career.player.fatigue}/100 · selection chances respond to role, form and freshness.</p>
        </div>
      </section>
    `;
  }

  function renderHub() {
    const next = engine.nextFixture(career);
    app.innerHTML = `
      <div class="career-hub">
        <section class="career-hub-hero">
          <div>
            <span class="career-eyebrow">${escapeHtml(career.player.league)} · ${escapeHtml(career.season.label)}</span>
            <h1>${escapeHtml(career.player.clubName)}</h1>
            <p>${next ? `${escapeHtml(engine.dateLabel(next.date))} · ${escapeHtml(next.competition)}` : "Season complete · contract decisions await"}</p>
          </div>
          <div class="career-hub-summary">
            <div><span>Season</span><strong>${escapeHtml(career.season.label)}</strong></div>
            <div><span>Form</span><strong>${escapeHtml(formatForm(career.player.form))}</strong></div>
            <div><span>Role</span><strong>${escapeHtml(career.player.contract.role)}</strong></div>
          </div>
        </section>
        <div class="career-dashboard">
          <div class="career-dashboard-column">
            <section class="career-panel career-player-card-wrap">
              ${playerCardMarkup()}
              ${seasonStatStripMarkup()}
            </section>
          </div>
          <div class="career-dashboard-column">
            ${nextMatchMarkup()}
            ${centrePanelMarkup()}
          </div>
          <aside class="career-dashboard-column">
            ${newsPanelMarkup()}
            ${coinsPanelMarkup()}
            ${contractPanelMarkup()}
            <div class="career-danger-zone"><p>One save slot. Resetting removes this career from this device and your account.</p><button class="career-danger-button" type="button" data-career-action="delete-career">Reset career</button></div>
          </aside>
        </div>
      </div>
    `;
  }

  function resultForFixture(fixture) {
    return fixture?.result || null;
  }

  function matchScoreAtMinute(fixture, result, minute) {
    if (minute >= (result.extraTime ? 120 : 90)) return [result.homeGoals, result.awayGoals];
    let home = 0;
    let away = 0;
    result.commentary.filter((event) => event.type === "goal" && event.minute <= minute).forEach((event) => {
      if (String(event.text).includes(`for ${fixture.homeClubName}`)) home += 1;
      else if (String(event.text).includes(`for ${fixture.awayClubName}`)) away += 1;
    });
    return [home, away];
  }

  function formatMatchClock(minute) {
    const whole = Math.max(0, Math.floor(minute));
    const seconds = Math.floor((minute - whole) * 60);
    return `${String(whole).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function matchPhase(result, minute) {
    if (minute >= (result.extraTime ? 120 : 90)) return "FULL TIME";
    if (minute >= 105) return "EXTRA TIME · SECOND HALF";
    if (minute >= 90) return "EXTRA TIME";
    if (minute >= 45) return "SECOND HALF";
    return "FIRST HALF";
  }

  function renderMatchView() {
    if (!matchView) return;
    const { fixture, result } = matchView;
    const player = career.player;
    const homeClub = career.world.clubs.find((club) => club.id === fixture.homeClubId) || { name: fixture.homeClubName, code: String(fixture.homeClubName).slice(0, 3) };
    const awayClub = career.world.clubs.find((club) => club.id === fixture.awayClubId) || { name: fixture.awayClubName, code: String(fixture.awayClubName).slice(0, 3) };
    app.innerHTML = `
      <div class="career-match-shell">
        <header class="career-match-heading">
          <div><span class="career-eyebrow">${escapeHtml(fixture.competition)} · ${escapeHtml(fixture.stage)}</span><h1>Matchday</h1></div>
          <span class="career-form-pill form-${escapeHtml(player.form)}">${escapeHtml(player.fullName)}</span>
        </header>
        <section class="career-live-stage">
          <div class="career-live-scoreboard">
            <div class="career-live-team">${badgeMarkup(homeClub)}<strong>${escapeHtml(fixture.homeClubName)}</strong></div>
            <div class="career-live-centre">
              <span class="career-live-status" id="careerLiveStatus">LIVE</span>
              <strong class="career-live-clock" id="careerLiveClock">00:00</strong>
              <strong class="career-live-score" id="careerLiveScore">0-0</strong>
              <span class="career-live-phase" id="careerLivePhase">FIRST HALF</span>
            </div>
            <div class="career-live-team">${badgeMarkup(awayClub)}<strong>${escapeHtml(fixture.awayClubName)}</strong></div>
          </div>
          <div class="career-live-commentary" id="careerLiveCommentary">The teams are making their way out. Kick-off is moments away.</div>
          <div class="career-live-controls">
            <button class="career-secondary-button" id="careerPauseButton" type="button" data-career-action="match-pause">Pause</button>
            <button class="career-secondary-button" id="careerSpeedButton" type="button" data-career-action="match-speed">${matchView.speed}× speed</button>
            <button class="career-primary-button" type="button" data-career-action="match-skip">Skip to FT <span aria-hidden="true">&rarr;</span></button>
          </div>
          <div class="career-live-progress"><span id="careerLiveProgress" style="width:0%"></span></div>
        </section>
        <div class="career-match-lower-grid">
          <section class="career-panel">
            <div class="career-panel-heading"><div><span>KEY MOMENTS</span><h3>Live commentary</h3></div></div>
            <div class="career-commentary-feed" id="careerCommentaryFeed"></div>
          </section>
          <aside class="career-panel career-rating-panel">
            <span class="career-section-kicker">YOUR PERFORMANCE</span>
            <div class="career-rating-ring" id="careerRatingRing">-</div>
            <h3 id="careerAppearanceLabel">Match in progress</h3>
            <p id="careerAppearanceCopy">Your rating updates at full time.</p>
            <div class="career-performance-grid" id="careerPerformanceGrid"></div>
            <button class="career-primary-button career-match-finish" type="button" data-career-action="match-finish" id="careerMatchFinish" hidden>Continue to career hub</button>
          </aside>
        </div>
      </div>
    `;
    updateMatchPlayback(true);
    if (matchView.playing) startPlayback();
  }

  function updateMatchPlayback(forceFeed = false) {
    if (!matchView) return;
    const { fixture, result } = matchView;
    const maximum = result.extraTime ? 120 : 90;
    const minute = Math.min(maximum, matchView.minute);
    const visibleEvents = result.commentary.filter((event) => event.minute <= minute);
    const latest = visibleEvents[visibleEvents.length - 1];
    const [home, away] = matchScoreAtMinute(fixture, result, minute);
    const complete = minute >= maximum;
    const clock = document.getElementById("careerLiveClock");
    const score = document.getElementById("careerLiveScore");
    const phase = document.getElementById("careerLivePhase");
    const status = document.getElementById("careerLiveStatus");
    const commentary = document.getElementById("careerLiveCommentary");
    const progress = document.getElementById("careerLiveProgress");
    const pauseButton = document.getElementById("careerPauseButton");
    const speedButton = document.getElementById("careerSpeedButton");
    if (clock) clock.textContent = complete ? "FT" : formatMatchClock(minute);
    if (score) score.textContent = `${home}-${away}`;
    if (phase) phase.textContent = matchPhase(result, minute);
    if (status) status.textContent = complete ? "FINAL" : matchView.playing ? "LIVE" : "PAUSED";
    if (commentary) commentary.textContent = latest?.text || "The teams are making their way out. Kick-off is moments away.";
    if (progress) progress.style.width = `${Math.min(100, (minute / maximum) * 100)}%`;
    if (pauseButton) pauseButton.textContent = matchView.playing ? "Pause" : "Resume";
    if (speedButton) speedButton.textContent = `${matchView.speed}× speed`;
    if (forceFeed || visibleEvents.length !== matchView.visibleEventCount) {
      matchView.visibleEventCount = visibleEvents.length;
      const feed = document.getElementById("careerCommentaryFeed");
      if (feed) {
        feed.innerHTML = visibleEvents.map((event) => `
          <article class="career-commentary-event event-${escapeHtml(event.type)}">
            <time>${event.minute}'</time><p>${escapeHtml(event.text)}</p>
          </article>
        `).join("") || "<div class=\"career-empty-state\">Commentary will appear from kick-off.</div>";
        feed.scrollTop = feed.scrollHeight;
      }
    }
    if (complete) finishPlaybackUi();
  }

  function finishPlaybackUi() {
    if (!matchView) return;
    matchView.playing = false;
    stopPlayback();
    const result = matchView.result;
    const rating = document.getElementById("careerRatingRing");
    const label = document.getElementById("careerAppearanceLabel");
    const copy = document.getElementById("careerAppearanceCopy");
    const grid = document.getElementById("careerPerformanceGrid");
    const finish = document.getElementById("careerMatchFinish");
    if (rating) rating.textContent = result.appeared ? Number(result.player.rating).toFixed(1) : "DNP";
    if (label) label.textContent = result.appeared ? (result.player.started ? "Started" : "Substitute appearance") : "Unused substitute";
    if (copy) copy.textContent = result.appeared ? `${result.player.minutes} minutes · ${formatForm(career.player.form)} form` : "The manager did not call on you today.";
    if (grid) grid.innerHTML = `
      <div><span>Goals</span><strong>${result.player.goals}</strong></div>
      <div><span>Assists</span><strong>${result.player.assists}</strong></div>
      <div><span>${career.player.position === "GK" ? "Saves" : "Tackles"}</span><strong>${career.player.position === "GK" ? result.player.saves : result.player.tackles}</strong></div>
      <div><span>${career.player.position === "GK" ? "Clean sheet" : "Dribbles"}</span><strong>${career.player.position === "GK" ? (result.player.cleanSheet ? "Yes" : "No") : result.player.dribbles}</strong></div>
    `;
    if (finish) finish.hidden = false;
  }

  function startPlayback() {
    stopPlayback();
    if (!matchView?.playing) return;
    playbackTimer = window.setInterval(() => {
      if (!matchView?.playing) return;
      const maximum = matchView.result.extraTime ? 120 : 90;
      matchView.minute = Math.min(maximum, matchView.minute + 0.5 * matchView.speed);
      updateMatchPlayback();
    }, 250);
  }

  function stopPlayback() {
    window.clearInterval(playbackTimer);
    playbackTimer = null;
  }

  function playFixture(fixtureId) {
    const outcome = engine.simulateFixture(career, fixtureId);
    commitCareer(outcome.state, { render: false, sync: true });
    matchView = {
      fixture: outcome.fixture,
      result: outcome.result,
      minute: 0,
      speed: 1,
      playing: true,
      visibleEventCount: -1,
    };
    renderMatchView();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function viewFixtureResult(fixtureId) {
    const fixture = career.season.fixtures.find((candidate) => candidate.id === fixtureId);
    const result = resultForFixture(fixture);
    if (!fixture || !result) return;
    matchView = {
      fixture: JSON.parse(JSON.stringify(fixture)),
      result: JSON.parse(JSON.stringify(result)),
      minute: result.extraTime ? 120 : 90,
      speed: 1,
      playing: false,
      visibleEventCount: -1,
    };
    renderMatchView();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function transferOfferMarkup(offer, index) {
    const locked = offer.locked && !career.transfer.thirdUnlocked;
    return `
      <article class="career-offer-card${index === 2 ? " is-premium" : ""}${locked ? " is-locked" : ""}">
        ${locked ? `
          <div class="career-offer-lock">
            <strong>Third club option</strong>
            <p>Usually the most ambitious move. Unlock it without blocking the season.</p>
            <div class="career-offer-unlock-actions">
              <button class="career-secondary-button" type="button" data-career-action="unlock-offer-ad">Rewarded ad</button>
              <button class="career-primary-button" type="button" data-career-action="unlock-offer-coins"${career.coins.balance < 100 ? " disabled" : ""}>100 coins</button>
            </div>
          </div>
        ` : ""}
        <div class="career-offer-head">
          ${badgeMarkup({ badge: offer.clubBadge, code: offer.clubCode })}
          <div><strong>${escapeHtml(offer.clubName)}</strong><span>${offer.clubRating} club rating</span></div>
        </div>
        <div class="career-offer-terms">
          <div class="career-offer-term"><span>Weekly wage</span><strong>${formatWage(offer.weeklyWage)}</strong></div>
          <div class="career-offer-term"><span>Game time</span><strong>${escapeHtml(offer.role)}</strong></div>
          <div class="career-offer-term"><span>Contract</span><strong>${offer.contractLength} years</strong></div>
          <div class="career-offer-term"><span>Position role</span><strong>${escapeHtml(offer.positionRole)}</strong></div>
        </div>
        <button class="career-primary-button" type="button" data-career-action="choose-offer" data-offer-id="${escapeHtml(offer.id)}"${locked ? " disabled" : ""}>Accept offer <span aria-hidden="true">&rarr;</span></button>
      </article>
    `;
  }

  function renderTransfer() {
    const summary = career.season.endSummary;
    const stats = summary.stats;
    app.innerHTML = `
      <div class="career-transfer-shell">
        <section class="career-transfer-hero">
          <div>
            <span class="career-eyebrow">SEASON ${career.season.number} COMPLETE</span>
            <h1>Your next chapter.</h1>
            <p>Compare the role, wage and pathway—not just the badge. A guaranteed starting place can matter more than a famous bench.</p>
          </div>
          <div class="career-season-summary-card">
            <span class="career-section-kicker">${escapeHtml(summary.label)} · ${escapeHtml(summary.clubName)}</span>
            <strong>${career.player.overall} OVR · ${escapeHtml(formatForm(career.player.form))}</strong>
            <div class="career-season-summary-stats">
              <div><span>Apps</span><b>${stats.appearances}</b></div>
              <div><span>Goals</span><b>${stats.goals}</b></div>
              <div><span>Assists</span><b>${stats.assists}</b></div>
              <div><span>Rating</span><b>${stats.appearances ? Number(stats.averageRating).toFixed(2) : "-"}</b></div>
            </div>
          </div>
        </section>
        <section class="career-stay-card">
          ${badgeMarkup({ badge: career.player.clubBadge, code: career.player.clubCode })}
          <div><h2>Stay at ${escapeHtml(career.player.clubName)}</h2><p>Continue the pathway you know with an improved deal and a role based on this season.</p></div>
          <button class="career-secondary-button" type="button" data-career-action="choose-offer" data-offer-id="stay">Stay at club</button>
        </section>
        <div class="career-offer-grid">
          ${career.transfer.offers.map(transferOfferMarkup).join("")}
        </div>
        <div class="career-transfer-toolbar">
          <p>Rerolling replaces every interested club. Your unlocked third slot stays available.</p>
          <button class="career-secondary-button" type="button" data-career-action="reroll-offers"${career.coins.balance < 40 ? " disabled" : ""}>Reroll offers · 40 coins</button>
        </div>
      </div>
    `;
  }

  async function deleteCareer() {
    if (!window.confirm("Reset this career? This removes the local save and your cloud save. This cannot be undone.")) return;
    stopPlayback();
    matchView = null;
    career = null;
    writeLocalCareer(null);
    renderHeader();
    renderProfileCareer();
    renderCreation();
    if (cloudAuthenticated) {
      try {
        await careerApi("DELETE");
        setSaveStatus("Cloud slot cleared", "saved");
      } catch (error) {
        setSaveStatus("Cloud delete failed", "error");
        showMessage(error.message);
      }
    }
  }

  async function runCareerAction(action) {
    if (actionBusy) return;
    actionBusy = true;
    try {
      await action();
    } catch (error) {
      showMessage(error.message || "That action could not be completed.");
    } finally {
      actionBusy = false;
    }
  }

  app.addEventListener("submit", (event) => {
    if (event.target.id !== "careerCreationForm") return;
    event.preventDefault();
    void runCareerAction(async () => {
      const form = new FormData(event.target);
      const nation = allNations().find((candidate) => candidate.id === form.get("nationality"));
      const nextCareer = engine.createCareer({
        fullName: form.get("fullName"),
        nationality: nation,
        position: form.get("position"),
        preferredFoot: form.get("preferredFoot"),
        academyClubId: selectedAcademyId,
        clubs: allClubs(),
        seed: academySeed,
      });
      activeHubTab = "fixtures";
      commitCareer(nextCareer);
      showMessage(`${nextCareer.player.fullName} has signed for ${nextCareer.player.clubName} Academy.`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  app.addEventListener("click", (event) => {
    const button = event.target.closest("[data-career-action]");
    if (!button) return;
    const action = button.dataset.careerAction;
    if (action === "select-academy") {
      selectedAcademyId = button.dataset.clubId;
      renderCreation();
      return;
    }
    if (action === "reroll-academies") {
      generateAcademies();
      renderCreation();
      return;
    }
    if (action === "hub-tab") {
      activeHubTab = ["fixtures", "development", "career"].includes(button.dataset.tab) ? button.dataset.tab : "fixtures";
      renderHub();
      return;
    }
    if (action === "match-pause" && matchView) {
      matchView.playing = !matchView.playing;
      if (matchView.playing) startPlayback();
      else stopPlayback();
      updateMatchPlayback();
      return;
    }
    if (action === "match-speed" && matchView) {
      matchView.speed = matchView.speed === 1 ? 2 : matchView.speed === 2 ? 4 : 1;
      updateMatchPlayback();
      return;
    }
    if (action === "match-skip" && matchView) {
      matchView.minute = matchView.result.extraTime ? 120 : 90;
      updateMatchPlayback(true);
      return;
    }
    if (action === "match-finish") {
      stopPlayback();
      matchView = null;
      renderCurrentView();
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    void runCareerAction(async () => {
      if (action === "play-match") {
        playFixture(button.dataset.fixtureId);
      } else if (action === "view-result") {
        viewFixtureResult(button.dataset.fixtureId);
      } else if (action === "simulate-month") {
        const outcome = engine.simulateMonth(career, button.dataset.month);
        commitCareer(outcome.state);
        showMessage(`${outcome.results.length} ${outcome.results.length === 1 ? "match" : "matches"} simulated. All results and player ratings have been saved.`);
      } else if (action === "train") {
        const focus = document.getElementById("careerTrainingFocus")?.value;
        const effort = document.getElementById("careerTrainingEffort")?.value;
        const outcome = engine.runTraining(career, focus, effort);
        commitCareer(outcome.state);
        showMessage(`Training complete · +${outcome.earned} Training Points.`);
      } else if (action === "upgrade-attribute") {
        const outcome = engine.upgradeAttribute(career, button.dataset.attribute);
        commitCareer(outcome.state);
        showMessage(`${ATTRIBUTE_LABELS[button.dataset.attribute]} upgraded for ${outcome.cost} Training Points.`);
      } else if (action === "buy-attribute") {
        commitCareer(engine.buyAttributeBoost(career, button.dataset.attribute));
        showMessage(`${ATTRIBUTE_LABELS[button.dataset.attribute]} upgraded for 50 coins.`);
      } else if (action === "claim-daily") {
        const outcome = engine.claimDailyLogin(career, new Date().toISOString().slice(0, 10));
        commitCareer(outcome.state);
        showMessage(outcome.claimed ? "Daily login reward · +10 coins." : "Today's reward is already claimed.");
      } else if (action === "delete-career") {
        await deleteCareer();
      } else if (action === "unlock-offer-coins") {
        commitCareer(engine.unlockThirdOffer(career));
        showMessage("Third transfer option unlocked.");
      } else if (action === "unlock-offer-ad") {
        if (typeof window.showCareerRewardedAd !== "function") {
          showMessage("Rewarded video is not configured yet. You can use 100 earned coins instead.", 5200);
          return;
        }
        const completed = await window.showCareerRewardedAd({ placement: "career-third-transfer-option" });
        if (completed === true) {
          commitCareer(engine.unlockThirdOfferByReward(career));
          showMessage("Reward complete · third transfer option unlocked.");
        }
      } else if (action === "reroll-offers") {
        commitCareer(engine.rerollOffers(career));
        showMessage("New contract offers have arrived.");
      } else if (action === "choose-offer") {
        const currentClub = career.player.clubName;
        const next = engine.beginNextSeason(career, button.dataset.offerId);
        commitCareer(next);
        showMessage(button.dataset.offerId === "stay" ? `New deal signed with ${currentClub}.` : `Transfer complete · welcome to ${next.player.clubName}.`);
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    });
  });

  screen.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.careerBadgeFallback) return;
    const fallback = document.createElement("span");
    fallback.className = `${image.className} career-badge-fallback`;
    fallback.textContent = image.dataset.careerBadgeFallback;
    image.replaceWith(fallback);
  }, true);

  accountButton?.addEventListener("click", () => {
    if (account || cloudAuthenticated) {
      window.location.assign("/profile");
      return;
    }
    document.getElementById("mainAccountButton")?.click();
  });

  window.addEventListener("accountstatechange", (event) => {
    account = event.detail?.account || null;
    cloudAuthenticated = Boolean(account);
    renderHeader();
    if (account) void reconcileCloudSave();
  });
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("online", () => void reconcileCloudSave());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && career) {
      const outcome = engine.claimDailyLogin(career, new Date().toISOString().slice(0, 10));
      if (outcome.claimed) commitCareer(outcome.state);
    }
  });

  renderHeader();
  renderProfileCareer();
  syncRoute();
  void reconcileCloudSave();
})();
