function customTeamSourceOptionsMarkup(selectedSource = customTournamentSetup?.sourceFilter || "current") {
  return CUSTOM_TEAM_SOURCE_OPTIONS.map(([value, label]) => (
    `<option value="${value}" ${selectedSource === value ? "selected" : ""}>${label}</option>`
  )).join("");
}

function defaultCustomTournamentSetup(teamCount = 32) {
  return {
    setupVersion: 3,
    teamCount,
    structure: customTournamentRequiresGroups(teamCount) ? "groups" : "knockout",
    thirdPlace: true,
    format: "full",
    upset: "balanced",
    goals: "normal",
    sourceFilter: "current",
    managedTeamId: null,
    selectedIds: Array(teamCount).fill(null),
    abilityOverrides: {},
    scripts: {},
  };
}

function readCustomTournamentSetup() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_TOURNAMENT_SETUP_KEY));
    const teamCount = CUSTOM_TOURNAMENT_TEAM_COUNTS.includes(Number(saved?.teamCount))
      ? Number(saved.teamCount)
      : 32;
    if (![2, 3].includes(Number(saved?.setupVersion))) return defaultCustomTournamentSetup(teamCount);
    const seenIds = new Set();
    const selectedIds = Array.from({ length: teamCount }, (_, index) => {
      const teamId = saved?.selectedIds?.[index];
      if (!TEAM_BY_ID.has(teamId) || seenIds.has(teamId)) return null;
      seenIds.add(teamId);
      return teamId;
    });
    return {
      setupVersion: 3,
      teamCount,
      structure: customTournamentRequiresGroups(teamCount) || saved?.structure === "groups" ? "groups" : "knockout",
      thirdPlace: Number(saved?.setupVersion) === 2 ? true : saved?.thirdPlace !== false,
      format: customTournamentRequiresGroups(teamCount) || saved?.structure === "groups" ? "full" : saved?.format === "penalties" ? "penalties" : "full",
      upset: SIMULATION_CONFIG.modes[saved?.upset] ? saved.upset : "balanced",
      goals: SIMULATION_CONFIG.goals[saved?.goals] ? saved.goals : "normal",
      sourceFilter: CUSTOM_TEAM_SOURCE_IDS.has(String(saved?.sourceFilter))
        ? String(saved.sourceFilter)
        : "current",
      managedTeamId: selectedIds.includes(saved?.managedTeamId) ? saved.managedTeamId : null,
      selectedIds,
      abilityOverrides: saved?.abilityOverrides && typeof saved.abilityOverrides === "object" ? saved.abilityOverrides : {},
      scripts: saved?.scripts && typeof saved.scripts === "object" ? saved.scripts : {},
    };
  } catch {
    return defaultCustomTournamentSetup();
  }
}

[1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022].forEach((year) => installRetroTeams(year));
installRetroTeams(2026);
let customTournamentSetup = readCustomTournamentSetup();
let customTournamentSetupViewOpen = false;
let customGroupTablesCollapsed = false;
let customTournamentUi = {
  tab: "bracket",
  search: "",
  quickFillPreset: "top",
  targetIndex: null,
  ratingTeamId: customTournamentSetup.selectedIds[0] || null,
  ratingEditorOpen: false,
  managerPickerOpen: false,
  scriptRound: 0,
  scriptMatch: customTournamentSetup.teamCount === 24 ? 1 : 0,
  matchEditorOpen: false,
  scriptDraftKey: null,
  scriptDraft: null,
  teamCreatorOpen: false,
  editingCustomTeamId: null,
  customTeamDraft: null,
  teamCreatorReturnMode: null,
  teamCreatorReturnSide: null,
};

const CUSTOM_PLAYER_POSITIONS = Object.freeze(["GK", "LB", "LWB", "CB", "RB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"]);
const CUSTOM_DEFAULT_XI = Object.freeze(["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"]);
const CUSTOM_TEAM_RATING_KEYS = Object.freeze(["overall", "attack", "midfield", "defence", "goalkeeper", "squadDepth", "experience", "penalties", "discipline"]);
const CUSTOM_PLAYER_RATING_KEYS = Object.freeze(["overall", "finishing", "pace", "shooting", "passing", "dribbling", "defending", "physical", "goalkeeping"]);

function raiseLinkedCustomRatings(ratings, keys, nextOverall, baselineRatings = ratings) {
  const previousOverall = simulationClamp(Number(baselineRatings?.overall) || 1, 1, 99);
  const overall = simulationClamp(Number(nextOverall) || 1, 1, 99);
  ratings.overall = overall;
  if (overall <= previousOverall) return;
  const increase = overall - previousOverall;
  keys.forEach((key) => {
    if (key === "overall") return;
    ratings[key] = simulationClamp((Number(baselineRatings[key]) || previousOverall) + increase, 1, 99);
  });
}

function customTeamCreatorContainer() {
  return customTournamentUi.teamCreatorReturnMode === "customMatch"
    ? els.customMatchBody
    : els.customTournamentBody;
}

function renderCustomTeamCreatorContext() {
  if (customTournamentUi.teamCreatorReturnMode === "customMatch") renderCustomMatchSetup();
  else renderCustomTournamentSetup();
}

function newCustomTeamDraft(team = null) {
  const basePlayers = team?.playerProfiles?.length
    ? team.playerProfiles.map((player) => ({ ...player }))
    : CUSTOM_DEFAULT_XI.map((position, index) => sanitizeCustomPlayer({
        name: `Player ${index + 1}`,
        position,
        overall: 75,
        startingXI: true,
      }, index));
  const ratings = team?.simulationRatings || {};
  return {
    name: team?.name || "",
    customFlag: team?.customFlag || "",
    customFlagShape: team?.customFlagShape === "square" ? "square" : "flag",
    saveToAccount: team?.accountSaved === true,
    simulationRatings: {
      overall: ratings.overall || 75,
      attack: ratings.attack || 75,
      midfield: ratings.midfield || 75,
      defence: ratings.defence || 75,
      goalkeeper: ratings.goalkeeper || 75,
      squadDepth: ratings.squadDepth || 75,
      experience: ratings.experience || 75,
      penalties: ratings.penalties || 75,
      discipline: ratings.discipline || 70,
    },
    playerProfiles: basePlayers,
  };
}

function customTeamCreatorMarkup() {
  if (!customTournamentUi.teamCreatorOpen) return "";
  const draft = customTournamentUi.customTeamDraft || newCustomTeamDraft();
  customTournamentUi.customTeamDraft = draft;
  const ratingFields = [
    ["overall", "Overall"], ["attack", "Attack"], ["midfield", "Midfield"], ["defence", "Defence"],
    ["goalkeeper", "Goalkeeper"], ["squadDepth", "Squad depth"], ["experience", "Experience"],
    ["penalties", "Penalties"], ["discipline", "Discipline"],
  ];
  const attributeFields = [
    ["finishing", "FIN"], ["pace", "PAC"], ["shooting", "SHO"], ["passing", "PAS"],
    ["dribbling", "DRI"], ["defending", "DEF"], ["physical", "PHY"], ["goalkeeping", "GK"],
  ];
  return `
    <div class="custom-editor-modal custom-team-creator-modal" role="dialog" aria-modal="true" aria-label="${customTournamentUi.editingCustomTeamId ? "Edit" : "Create"} custom team">
      <button class="custom-editor-backdrop" type="button" data-custom-action="close-team-creator" aria-label="Close team creator"></button>
      <form class="custom-workspace-panel custom-team-creator" id="customTeamCreatorForm">
        <header class="custom-team-creator-header">
          <div><span>CUSTOM SQUAD</span><h2>${customTournamentUi.editingCustomTeamId ? "Edit team" : "Create a team"}</h2><p>Build a reusable squad for custom tournaments and matches.</p></div>
          <button type="button" data-custom-action="close-team-creator" aria-label="Close team creator">&times;</button>
        </header>
        <div class="custom-team-identity">
          <div class="custom-team-flag-preview ${draft.customFlagShape === "square" ? "is-square" : ""}">${draft.customFlag ? `<img src="${draft.customFlag}" alt="Uploaded ${draft.customFlagShape === "square" ? "badge" : "flag"} preview" />` : `<span aria-hidden="true">⚑</span>`}</div>
          <label><span>Team name</span><input name="customTeamName" maxlength="50" required value="${escapeHtml(draft.name)}" placeholder="Team name" data-custom-team-field="name" /></label>
          <label class="custom-flag-upload"><span>Team image</span><input id="customTeamFlagFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" /><small>Choose a 3:2 flag or a square club badge, then crop and position it. Stored on this device and optionally with your account.</small></label>
        </div>
        <section class="custom-team-ratings-section">
          <div class="custom-section-title"><div><span>TEAM ABILITY</span><h3>Ratings</h3></div><small>1–99</small></div>
          <div class="custom-rating-grid">${ratingFields.map(([key, label]) => `<label><span>${label}</span><input type="number" min="1" max="99" value="${draft.simulationRatings[key]}" data-custom-team-rating="${key}" /></label>`).join("")}</div>
        </section>
        <section class="custom-player-builder">
          <div class="custom-section-title"><div><span>SQUAD</span><h3>Players</h3></div><div><button type="button" data-custom-action="auto-pick-custom-xi">Auto-pick best XI</button><button type="button" data-custom-action="add-custom-player" ${draft.playerProfiles.length >= 26 ? "disabled" : ""}>+ Add player</button></div></div>
          <p class="custom-player-help">Choose exactly 11 starters, or auto-pick the highest-rated goalkeeper and outfield players. Open attributes to tune how each player performs.</p>
          <div class="custom-player-rows">
            ${draft.playerProfiles.map((player, index) => `<article class="custom-player-row">
              <div class="custom-player-main-fields">
                <span class="custom-player-number">${index + 1}</span>
                <input aria-label="Player ${index + 1} name" maxlength="50" value="${escapeHtml(player.name)}" data-custom-player-index="${index}" data-custom-player-field="name" required />
                <select aria-label="Player ${index + 1} position" data-custom-player-index="${index}" data-custom-player-field="position">${CUSTOM_PLAYER_POSITIONS.map((position) => `<option value="${position}" ${position === player.position ? "selected" : ""}>${position}</option>`).join("")}</select>
                <label><span>OVR</span><input type="number" min="1" max="99" value="${player.overall}" data-custom-player-index="${index}" data-custom-player-field="overall" /></label>
                <label><span>XI</span><input type="checkbox" ${player.startingXI ? "checked" : ""} data-custom-player-index="${index}" data-custom-player-field="startingXI" aria-label="${escapeHtml(player.name)} in starting XI" /></label>
                <button type="button" data-custom-action="remove-custom-player" data-index="${index}" aria-label="Remove ${escapeHtml(player.name)}" ${draft.playerProfiles.length <= 11 ? "disabled" : ""}>&times;</button>
              </div>
              <details><summary>Attributes</summary><div class="custom-player-attributes">${attributeFields.map(([key, label]) => `<label><span>${label}</span><input type="number" min="1" max="99" value="${player[key]}" data-custom-player-index="${index}" data-custom-player-field="${key}" /></label>`).join("")}<label class="custom-penalty-taker"><input type="checkbox" ${player.penaltyTaker ? "checked" : ""} data-custom-player-index="${index}" data-custom-player-field="penaltyTaker" /><span>Penalty taker</span></label></div></details>
            </article>`).join("")}
          </div>
        </section>
        <label class="custom-account-save-option">
          <input id="customTeamSaveToAccount" type="checkbox" ${draft.saveToAccount ? "checked" : ""} ${customTeamAccount ? "" : "disabled"} />
          <span><strong>Save to my account</strong><small>${customTeamAccount ? "Sync this team across devices and keep it in My custom teams." : "Log in to save this team across devices."}</small></span>
        </label>
        <footer class="custom-team-creator-actions">
          <p id="customTeamCreatorMessage" aria-live="polite"></p>
          ${customTournamentUi.editingCustomTeamId ? `<button class="custom-team-delete-button" type="button" data-custom-action="delete-custom-team">Delete team</button>` : ""}
          <button class="secondary-button" type="button" data-custom-action="close-team-creator">Cancel</button>
          <button class="primary-button" type="submit">Save team</button>
        </footer>
      </form>
    </div>`;
}

function syncCustomTeamDraftFromInput(input) {
  const draft = customTournamentUi.customTeamDraft;
  if (!draft) return;
  if (input.dataset.customTeamField === "name") draft.name = input.value;
  if (input.dataset.customTeamRating) {
    const key = input.dataset.customTeamRating;
    const value = simulationClamp(Number(input.value) || 1, 1, 99);
    if (key === "overall") raiseLinkedCustomRatings(draft.simulationRatings, CUSTOM_TEAM_RATING_KEYS, value, input.customLinkedRatingsBaseline);
    else draft.simulationRatings[key] = value;
    input.value = draft.simulationRatings[key];
    if (key === "overall") {
      customTeamCreatorContainer()?.querySelectorAll("[data-custom-team-rating]").forEach((ratingInput) => {
        ratingInput.value = draft.simulationRatings[ratingInput.dataset.customTeamRating];
      });
    }
  }
  if (input.dataset.customPlayerField) {
    const player = draft.playerProfiles[Number(input.dataset.customPlayerIndex)];
    if (!player) return;
    const key = input.dataset.customPlayerField;
    if (key === "overall") {
      raiseLinkedCustomRatings(player, CUSTOM_PLAYER_RATING_KEYS, input.value, input.customLinkedRatingsBaseline);
      customTeamCreatorContainer()?.querySelectorAll(`[data-custom-player-index="${input.dataset.customPlayerIndex}"][data-custom-player-field]`).forEach((ratingInput) => {
        const ratingKey = ratingInput.dataset.customPlayerField;
        if (CUSTOM_PLAYER_RATING_KEYS.includes(ratingKey)) ratingInput.value = player[ratingKey];
      });
    } else {
      player[key] = key === "name" || key === "position" ? input.value
        : key === "penaltyTaker" || key === "startingXI" ? input.checked
          : simulationClamp(Number(input.value) || 1, 1, 99);
    }
  }
}

function compressedCustomFlagDataUrl(sourceCanvas) {
  const attempts = [
    { scale: 1, quality: 0.86 },
    { scale: 0.85, quality: 0.76 },
    { scale: 0.7, quality: 0.68 },
    { scale: 0.6, quality: 0.58 },
  ];
  let smallest = "";
  attempts.some(({ scale, quality }) => {
    const output = document.createElement("canvas");
    output.width = Math.max(1, Math.round(sourceCanvas.width * scale));
    output.height = Math.max(1, Math.round(sourceCanvas.height * scale));
    output.getContext("2d").drawImage(sourceCanvas, 0, 0, output.width, output.height);
    const dataUrl = output.toDataURL("image/webp", quality);
    if (!smallest || dataUrl.length < smallest.length) smallest = dataUrl;
    return dataUrl.startsWith("data:image/webp") && dataUrl.length <= CUSTOM_TEAM_IMAGE_DATA_URL_TARGET;
  });
  return smallest;
}

function customFlagDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) return reject(new Error("Choose an image file for the flag."));
    if (file.size > CUSTOM_TEAM_IMAGE_INPUT_MAX_BYTES) return reject(new Error("Please choose a team image smaller than 25 MB."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The flag image could not be read."));
    reader.onload = () => {
      const source = String(reader.result || "");
      const image = new Image();
      image.onerror = () => reject(new Error("The flag image format is not supported."));
      image.onload = () => {
        if (image.naturalWidth > 16_000 || image.naturalHeight > 16_000 || image.naturalWidth * image.naturalHeight > 100_000_000) {
          reject(new Error("That image resolution is too large. Please use an image under 100 megapixels."));
          return;
        }
        const editor = document.createElement("div");
        editor.className = "custom-flag-crop-editor";
        editor.setAttribute("role", "dialog");
        editor.setAttribute("aria-modal", "true");
        editor.setAttribute("aria-labelledby", "customFlagCropTitle");
        editor.innerHTML = `
          <button class="custom-flag-crop-backdrop" type="button" data-crop-action="cancel" aria-label="Cancel flag crop"></button>
          <section class="custom-flag-crop-panel">
            <header><div><span>TEAM IMAGE</span><h3 id="customFlagCropTitle">Crop your team image</h3><p>Choose a flag or badge shape, then drag to reposition.</p></div><button type="button" data-crop-action="cancel" aria-label="Cancel image crop">&times;</button></header>
            <div class="custom-flag-crop-shapes" role="group" aria-label="Image shape"><button class="active" type="button" data-crop-shape="flag" aria-pressed="true"><span aria-hidden="true"></span><strong>Flag</strong><small>3:2</small></button><button type="button" data-crop-shape="square" aria-pressed="false"><span aria-hidden="true"></span><strong>Badge</strong><small>1:1</small></button></div>
            <div class="custom-flag-crop-canvas-wrap"><canvas width="480" height="320" aria-label="Flag crop preview"></canvas><span aria-hidden="true"></span></div>
            <label class="custom-flag-crop-zoom"><span>Zoom</span><input type="range" min="1" max="3" value="1" step="0.01" aria-label="Flag crop zoom" /></label>
            <footer><button class="secondary-button" type="button" data-crop-action="cancel">Cancel</button><button class="primary-button" type="button" data-crop-action="apply">Use crop</button></footer>
          </section>`;
        document.body.append(editor);

        const canvas = document.createElement("canvas");
        canvas.width = 480;
        canvas.height = 320;
        const preview = editor.querySelector("canvas");
        const previewContext = preview.getContext("2d");
        const outputContext = canvas.getContext("2d");
        const zoomInput = editor.querySelector("input[type='range']");
        const canvasWrap = editor.querySelector(".custom-flag-crop-canvas-wrap");
        let shape = "flag";
        let zoom = 1;
        let offsetX = 0;
        let offsetY = 0;
        let drag = null;

        const cropLayout = () => {
          const scale = Math.max(canvas.width / Math.max(1, image.naturalWidth), canvas.height / Math.max(1, image.naturalHeight)) * zoom;
          const width = image.naturalWidth * scale;
          const height = image.naturalHeight * scale;
          const maxOffsetX = Math.max(0, (width - canvas.width) / 2);
          const maxOffsetY = Math.max(0, (height - canvas.height) / 2);
          offsetX = simulationClamp(offsetX, -maxOffsetX, maxOffsetX);
          offsetY = simulationClamp(offsetY, -maxOffsetY, maxOffsetY);
          return { x: (canvas.width - width) / 2 + offsetX, y: (canvas.height - height) / 2 + offsetY, width, height };
        };
        const drawCrop = (context) => {
          const layout = cropLayout();
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, layout.x, layout.y, layout.width, layout.height);
        };
        const renderCrop = () => drawCrop(previewContext);
        const cleanUp = () => {
          document.removeEventListener("keydown", onKeyDown);
          editor.remove();
        };
        const cancel = () => {
          cleanUp();
          reject(new DOMException("Flag crop cancelled.", "AbortError"));
        };
        const onKeyDown = (event) => {
          if (event.key === "Escape") cancel();
        };

        zoomInput.addEventListener("input", () => {
          zoom = Number(zoomInput.value) || 1;
          renderCrop();
        });
        editor.querySelectorAll("[data-crop-shape]").forEach((button) => button.addEventListener("click", () => {
          shape = button.dataset.cropShape === "square" ? "square" : "flag";
          const height = shape === "square" ? 480 : 320;
          canvas.height = height;
          preview.height = height;
          zoom = 1;
          offsetX = 0;
          offsetY = 0;
          zoomInput.value = "1";
          canvasWrap.classList.toggle("is-square", shape === "square");
          editor.querySelectorAll("[data-crop-shape]").forEach((shapeButton) => {
            const active = shapeButton === button;
            shapeButton.classList.toggle("active", active);
            shapeButton.setAttribute("aria-pressed", String(active));
          });
          renderCrop();
        }));
        preview.addEventListener("pointerdown", (event) => {
          drag = { x: event.clientX, y: event.clientY, offsetX, offsetY };
          preview.setPointerCapture(event.pointerId);
          preview.classList.add("is-dragging");
        });
        preview.addEventListener("pointermove", (event) => {
          if (!drag) return;
          const bounds = preview.getBoundingClientRect();
          offsetX = drag.offsetX + (event.clientX - drag.x) * (canvas.width / Math.max(1, bounds.width));
          offsetY = drag.offsetY + (event.clientY - drag.y) * (canvas.height / Math.max(1, bounds.height));
          renderCrop();
        });
        const finishDrag = (event) => {
          if (!drag) return;
          drag = null;
          if (preview.hasPointerCapture(event.pointerId)) preview.releasePointerCapture(event.pointerId);
          preview.classList.remove("is-dragging");
        };
        preview.addEventListener("pointerup", finishDrag);
        preview.addEventListener("pointercancel", finishDrag);
        editor.querySelectorAll("[data-crop-action='cancel']").forEach((button) => button.addEventListener("click", cancel));
        editor.querySelector("[data-crop-action='apply']").addEventListener("click", () => {
          drawCrop(outputContext);
          const croppedFlag = compressedCustomFlagDataUrl(canvas);
          cleanUp();
          resolve({ dataUrl: croppedFlag, shape });
        });
        document.addEventListener("keydown", onKeyDown);
        renderCrop();
        editor.querySelector("[data-crop-action='apply']").focus();
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

async function saveCustomTeamDraft() {
  const draft = customTournamentUi.customTeamDraft;
  const message = customTournamentUi.teamCreatorOpen
    ? customTeamCreatorContainer()?.querySelector("#customTeamCreatorMessage")
    : null;
  const name = String(draft?.name || "").trim();
  const players = (draft?.playerProfiles || []).map(sanitizeCustomPlayer);
  if (!name) {
    if (message) message.textContent = "Enter a team name.";
    return;
  }
  if (players.length < 11 || players.some((player) => !player.name)) {
    if (message) message.textContent = "Add names for at least 11 players.";
    return;
  }
  if (players.filter((player) => player.startingXI).length !== 11) {
    if (message) message.textContent = "Choose exactly 11 players for the starting XI, or use Auto-pick best XI.";
    return;
  }
  const duplicateName = customTeamLibrary.some((team) => team.id !== customTournamentUi.editingCustomTeamId && team.name.toLocaleLowerCase() === name.toLocaleLowerCase());
  if (duplicateName) {
    if (message) message.textContent = "A custom team with that name already exists.";
    return;
  }
  const id = customTournamentUi.editingCustomTeamId || `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const existingTeam = customTeamLibrary.find((item) => item.id === id) || null;
  let team = sanitizeCustomTeam({ id, name, customFlag: draft.customFlag, customFlagShape: draft.customFlagShape, simulationRatings: draft.simulationRatings, playerProfiles: players });
  const existingIndex = customTeamLibrary.findIndex((item) => item.id === id);
  try {
    if (draft.saveToAccount) {
      if (!customTeamAccount) throw new Error("Log in before saving this team to your account.");
      team = await saveCustomTeamToAccount(team);
    } else if (existingTeam?.accountSaved && customTeamAccount) {
      await removeCustomTeamFromAccount(id);
    }
  } catch (error) {
    customTournamentUi.editingCustomTeamId = id;
    if (message) message.textContent = error.message || "This team could not be synced to your account.";
    return;
  }
  if (team.customFlag) await writeCustomTeamFlagAsset(team.id, team.customFlag);
  const previousLibrary = [...customTeamLibrary];
  if (existingIndex >= 0) customTeamLibrary[existingIndex] = team;
  else customTeamLibrary.push(team);
  TEAM_BY_ID.set(id, team);
  clearPlayerProfileCacheForTeam(id);
  try {
    saveCustomTeamLibrary();
  } catch {
    customTeamLibrary = previousLibrary;
    if (existingTeam) TEAM_BY_ID.set(id, existingTeam);
    else TEAM_BY_ID.delete(id);
    clearPlayerProfileCacheForTeam(id);
    if (message) message.textContent = "Custom-team storage is full. Delete an unused custom team, then try again.";
    return;
  }
  customTournamentSetup.sourceFilter = "custom";
  customTournamentUi.teamCreatorOpen = false;
  customTournamentUi.editingCustomTeamId = null;
  customTournamentUi.customTeamDraft = null;
  const returnMode = customTournamentUi.teamCreatorReturnMode;
  const returnSide = customTournamentUi.teamCreatorReturnSide === "away" ? "away" : "home";
  customTournamentUi.teamCreatorReturnMode = null;
  customTournamentUi.teamCreatorReturnSide = null;
  saveCustomTournamentSetup();
  if (returnMode === "customMatch") {
    customMatchSetup[`${returnSide}Source`] = "custom";
    customMatchSetup[`${returnSide}Id`] = id;
    saveCustomMatchSetup();
    customMatchSetupViewOpen = true;
    setAppModeUrl("customMatch");
    render();
    showToast(existingIndex >= 0 ? "Custom team updated." : "Custom team created.");
    return;
  }
  renderCustomTournamentSetup();
  showToast(existingIndex >= 0 ? "Custom team updated." : "Custom team created.");
}

function replaceDeletedCustomMatchTeam(side, deletedTeamId) {
  if (customMatchSetup[`${side}Id`] !== deletedTeamId) return;
  const opposingSide = side === "home" ? "away" : "home";
  const opposingId = customMatchSetup[`${opposingSide}Id`];
  const replacementCustomTeam = customTeamLibrary.find((team) => team.id !== opposingId);
  if (replacementCustomTeam) {
    customMatchSetup[`${side}Source`] = "custom";
    customMatchSetup[`${side}Id`] = replacementCustomTeam.id;
    return;
  }
  const replacementCurrentTeam = TEAMS.find((team) => team.id !== opposingId) || TEAMS[0] || null;
  customMatchSetup[`${side}Source`] = "current";
  customMatchSetup[`${side}Id`] = replacementCurrentTeam?.id || null;
}

async function deleteCustomTeam(teamId) {
  const team = customTeamLibrary.find((candidate) => candidate.id === teamId);
  if (!team) return;
  if (!window.confirm(`Delete ${team.name}? This cannot be undone.`)) return;
  const message = customTournamentUi.teamCreatorOpen
    ? customTeamCreatorContainer()?.querySelector("#customTeamCreatorMessage")
    : null;
  if (team.accountSaved && !customTeamAccount) {
    const copy = "Log in to delete this team from your account.";
    if (message) message.textContent = copy;
    else showToast(copy);
    return;
  }
  try {
    if (team.accountSaved) await removeCustomTeamFromAccount(team.id);
  } catch (error) {
    const copy = error.message || "This team could not be deleted from your account.";
    if (message) message.textContent = copy;
    else showToast(copy);
    return;
  }

  customTeamLibrary = customTeamLibrary.filter((candidate) => candidate.id !== team.id);
  await deleteCustomTeamFlagAsset(team.id);
  TEAM_BY_ID.delete(team.id);
  clearPlayerProfileCacheForTeam(team.id);
  const wasSelected = customTournamentSetup.selectedIds.includes(team.id);
  customTournamentSetup.selectedIds = customTournamentSetup.selectedIds.map((selectedId) => selectedId === team.id ? null : selectedId);
  if (customTournamentSetup.managedTeamId === team.id) customTournamentSetup.managedTeamId = null;
  if (customTournamentUi.ratingTeamId === team.id) customTournamentUi.ratingTeamId = customTournamentSetup.selectedIds.find(Boolean) || null;
  delete customTournamentSetup.abilityOverrides[team.id];
  if (wasSelected) customTournamentSetup.scripts = {};
  replaceDeletedCustomMatchTeam("home", team.id);
  replaceDeletedCustomMatchTeam("away", team.id);
  delete customMatchSetup.abilityOverrides[team.id];
  saveCustomTeamLibrary();
  saveCustomTournamentSetup();
  saveCustomMatchSetup();

  const returnMode = customTournamentUi.teamCreatorReturnMode;
  customTournamentUi.teamCreatorOpen = false;
  customTournamentUi.editingCustomTeamId = null;
  customTournamentUi.customTeamDraft = null;
  customTournamentUi.teamCreatorReturnMode = null;
  customTournamentUi.teamCreatorReturnSide = null;
  if (returnMode === "customMatch") {
    customMatchSetupViewOpen = true;
    setAppModeUrl("customMatch");
    render();
  } else {
    renderCustomTournamentSetup();
  }
  showToast(`${team.name} deleted.`);
}

function defaultCustomMatchSetup() {
  return {
    homeId: TEAMS[0]?.id || null,
    awayId: TEAMS[1]?.id || null,
    homeSource: "current",
    awaySource: "current",
    upset: "balanced",
    goals: "normal",
    format: "full",
    managedSide: "neutral",
    abilityOverrides: {},
    script: null,
  };
}

function readCustomMatchSetup() {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOM_MATCH_SETUP_KEY));
    const fallback = defaultCustomMatchSetup();
    const homeId = TEAM_BY_ID.has(saved?.homeId) ? saved.homeId : fallback.homeId;
    const awayId = TEAM_BY_ID.has(saved?.awayId) ? saved.awayId : fallback.awayId;
    const sourceForTeam = (teamId) => {
      const team = TEAM_BY_ID.get(teamId);
      if (team?.customTeam) return "custom";
      if (team?.premierLeague) return "premier-league";
      if (team?.retroWorldCup) return String(team.retroYear);
      return "current";
    };
    return {
      homeId,
      awayId,
      homeSource: CUSTOM_TEAM_SOURCE_IDS.has(saved?.homeSource) ? saved.homeSource : sourceForTeam(homeId),
      awaySource: CUSTOM_TEAM_SOURCE_IDS.has(saved?.awaySource) ? saved.awaySource : sourceForTeam(awayId),
      upset: SIMULATION_CONFIG.modes[saved?.upset] ? saved.upset : "balanced",
      goals: SIMULATION_CONFIG.goals[saved?.goals] ? saved.goals : "normal",
      format: saved?.format === "penalties" ? "penalties" : "full",
      managedSide: ["home", "away"].includes(saved?.managedSide) ? saved.managedSide : "neutral",
      abilityOverrides: saved?.abilityOverrides && typeof saved.abilityOverrides === "object" ? saved.abilityOverrides : {},
      script: saved?.script && typeof saved.script === "object" ? {
        mode: "fixed",
        homeGoals: simulationClamp(Number(saved.script.homeGoals) || 0, 0, 20),
        awayGoals: simulationClamp(Number(saved.script.awayGoals) || 0, 0, 20),
        winnerSide: saved.script.winnerSide === "away" ? "away" : "home",
        goals: Array.isArray(saved.script.goals) ? saved.script.goals.slice(0, 40).map((goal) => ({
          side: goal?.side === "away" ? "away" : "home",
          minute: simulationClamp(Number(goal?.minute) || 1, 1, 120),
          scorer: String(goal?.scorer || "").slice(0, 80),
        })) : [],
      } : null,
    };
  } catch {
    return defaultCustomMatchSetup();
  }
}

let customMatchSetup = readCustomMatchSetup();
let customMatchSetupViewOpen = false;

function customMatchCanResume(candidate = customMatchState) {
  if (!isValidCustomTournamentState(candidate) || candidate.customTournament?.customMatch !== true || !candidate.started) return false;
  const fixture = candidate.rounds?.[0]?.find((match) => !isThirdPlacePlayoff(match));
  return candidate.championView !== true && fixture?.result?.revealed !== true;
}

function saveCustomMatchSetup() {
  localStorage.setItem(CUSTOM_MATCH_SETUP_KEY, JSON.stringify(customMatchSetup));
}

function reconcileCustomMatchTeamSelections() {
  let changed = false;
  ["home", "away"].forEach((side) => {
    const source = customMatchSetup[`${side}Source`];
    const pool = customTeamSourcePool(source);
    const currentId = customMatchSetup[`${side}Id`];
    const opposingSide = side === "home" ? "away" : "home";
    const opposingId = customMatchSetup[`${opposingSide}Id`];
    const currentIsAvailable = pool.some((team) => team.id === currentId);
    const alternativeExists = pool.some((team) => team.id !== opposingId);
    if (currentIsAvailable && (currentId !== opposingId || !alternativeExists)) return;
    const nextId = pool.find((team) => team.id !== opposingId)?.id || pool[0]?.id || null;
    if (currentId === nextId) return;
    customMatchSetup[`${side}Id`] = nextId;
    changed = true;
  });
  if (changed) saveCustomMatchSetup();
  return changed;
}

function customMatchTeamOptions(source, selectedId) {
  const pool = customTeamSourcePool(source);
  if (!pool.length) {
    return `<option value="" disabled selected>${source === "custom" ? "No custom teams yet" : "No teams available"}</option>`;
  }
  return pool
    .map((team) => `<option value="${team.id}" ${selectedId === team.id ? "selected" : ""}>${escapeHtml(customTeamDisplayName(team))}</option>`)
    .join("");
}

function customMatchRatingFields(team, side) {
  const override = customMatchSetup.abilityOverrides[team?.id] || {};
  const base = team?.simulationRatings || {};
  return [["overall", "Overall"], ["attack", "Attack"], ["midfield", "Midfield"], ["defence", "Defence"], ["goalkeeper", "Goalkeeper"]]
    .map(([key, label]) => `<label><span>${label}</span><input type="number" min="1" max="99" value="${override[key] ?? base[key] ?? team?.rating ?? 75}" data-custom-match-rating="${key}" data-side="${side}" /></label>`).join("");
}

function customMatchGoalRowsFromForm(body) {
  return [...body.querySelectorAll(".custom-match-goal-row")].map((row) => ({
    side: row.querySelector("[data-custom-match-goal-side]").value,
    minute: simulationClamp(Number(row.querySelector("[data-custom-match-goal-minute]").value) || 1, 1, 120),
    scorer: row.querySelector("[data-custom-match-goal-scorer]").value.trim(),
  }));
}

function customMatchScriptMarkup(home, away) {
  const script = customMatchSetup.script || { homeGoals: 1, awayGoals: 0, winnerSide: "home", goals: [] };
  const playerNames = {
    home: playerProfilesForTeam(home).filter((player) => player.position !== "GK").map((player) => player.name),
    away: playerProfilesForTeam(away).filter((player) => player.position !== "GK").map((player) => player.name),
  };
  return `
    <section class="custom-match-script custom-workspace-panel">
      <div class="custom-panel-heading"><div><span>MATCH CONTROL</span><h2>Script the result</h2></div><span class="custom-script-count">${script ? "Saved" : "Optional"}</span></div>
      <p class="custom-script-help">Set an exact score, decide who advances if it is tied, and optionally add goal scorers and minutes.</p>
      <div class="custom-score-script custom-match-score-script">
        <label><span>Home score</span><input id="customMatchHomeScore" type="number" min="0" max="20" value="${simulationClamp(Number(script.homeGoals) || 0, 0, 20)}" /></label>
        <span aria-hidden="true">-</span>
        <label><span>Away score</span><input id="customMatchAwayScore" type="number" min="0" max="20" value="${simulationClamp(Number(script.awayGoals) || 0, 0, 20)}" /></label>
      </div>
      <label class="custom-winner-select"><span>Advance if tied</span><select id="customMatchWinner"><option value="home" ${script.winnerSide !== "away" ? "selected" : ""}>Home team</option><option value="away" ${script.winnerSide === "away" ? "selected" : ""}>Away team</option></select></label>
      <div class="custom-goal-script-heading"><strong>Goal events</strong><button type="button" data-custom-match-action="add-script-goal">Add goal</button></div>
      <div class="custom-match-goal-rows" id="customMatchGoalRows">
        ${(script.goals || []).map((goal, index) => `
          <div class="custom-match-goal-row">
            <select data-custom-match-goal-side><option value="home" ${goal.side !== "away" ? "selected" : ""}>Home</option><option value="away" ${goal.side === "away" ? "selected" : ""}>Away</option></select>
            <input type="number" min="1" max="120" value="${goal.minute}" aria-label="Goal minute" data-custom-match-goal-minute />
            <select data-custom-match-goal-scorer aria-label="Goal scorer">
              <option value="">Choose scorer</option>
              ${playerNames[goal.side === "away" ? "away" : "home"].map((name) => `<option value="${escapeHtml(name)}" ${goal.scorer === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
            </select>
            <button type="button" data-custom-match-action="remove-script-goal" data-index="${index}" aria-label="Remove goal">&times;</button>
          </div>
        `).join("") || `<p class="custom-goal-empty">Add a goal only when you need an exact scorer or minute.</p>`}
      </div>
      <div class="custom-script-actions"><button class="secondary-button" type="button" data-custom-match-action="reset-script">Reset script</button><button class="primary-button" type="button" data-custom-match-action="save-script">Save script</button></div>
    </section>`;
}

function renderCustomMatchSetup() {
  if (!els.customMatchBody) return;
  reconcileCustomMatchTeamSelections();
  const home = TEAM_BY_ID.get(customMatchSetup.homeId);
  const away = TEAM_BY_ID.get(customMatchSetup.awayId);
  const active = !customMatchSetupViewOpen && isValidCustomTournamentState(customMatchState) && customMatchState.customTournament?.customMatch === true && customMatchState.started;
  els.customMatchStartButton.disabled = !active && (!home || !away || home.id === away.id);
  els.customMatchStartButton.innerHTML = active
    ? 'Return to match <span aria-hidden="true">&rarr;</span>'
    : 'Play match <span aria-hidden="true">&rarr;</span>';
  els.customMatchBody.innerHTML = `
    <section class="custom-match-builder custom-workspace-panel">
      <div class="custom-match-teams">
        ${[["home", home, "Home team"], ["away", away, "Away team"]].map(([side, team, label]) => `<section class="custom-match-team-card">
          <header><span>${label}</span>${team ? flagMarkup(team, "custom-match-team-flag") : ""}</header>
          <div class="custom-match-team-selectors">
            <label><span>Squad collection</span><select data-custom-match-source="${side}" aria-label="${label} squad collection">${customTeamSourceOptionsMarkup(customMatchSetup[`${side}Source`])}</select></label>
            <label><span>Team</span><select data-custom-match-team="${side}" aria-label="${label}">${customMatchTeamOptions(customMatchSetup[`${side}Source`], team?.id)}</select></label>
          </div>
          ${team ? `<div class="custom-match-team-name"><strong>${escapeHtml(customTeamDisplayName(team))}</strong>${team.customTeam ? `<span class="custom-match-team-actions"><button type="button" data-custom-match-action="edit-custom-team" data-team-id="${team.id}" data-side="${side}">Edit team</button><button class="is-danger" type="button" data-custom-match-action="delete-custom-team" data-team-id="${team.id}" data-side="${side}">Delete</button></span>` : ""}</div><div class="custom-rating-grid">${customMatchRatingFields(team, side)}</div>` : ""}
          <button class="custom-match-reset-ratings" type="button" data-custom-match-action="reset-ratings" data-team-id="${team?.id || ""}">Restore ratings</button>
        </section>`).join('<div class="custom-match-versus" aria-hidden="true">VS</div>')}
      </div>
      ${home?.id === away?.id ? `<p class="custom-match-error">Choose two different teams.</p>` : ""}
      <section class="custom-match-options">
        <div class="custom-config-group"><span>Match type</span><div class="custom-segmented"><button type="button" data-custom-match-action="format" data-value="full" class="${customMatchSetup.format === "full" ? "active" : ""}">Full match</button><button type="button" data-custom-match-action="format" data-value="penalties" class="${customMatchSetup.format === "penalties" ? "active" : ""}">Penalties only</button></div></div>
        <div class="custom-config-group"><span>Simulation style</span><div class="custom-segmented"><button type="button" data-custom-match-action="upset" data-value="realistic" class="${customMatchSetup.upset === "realistic" ? "active" : ""}">Realistic</button><button type="button" data-custom-match-action="upset" data-value="balanced" class="${customMatchSetup.upset === "balanced" ? "active" : ""}">Standard</button><button type="button" data-custom-match-action="upset" data-value="chaos" class="${customMatchSetup.upset === "chaos" ? "active" : ""}">Pure chaos</button></div></div>
        <div class="custom-config-group"><span>Goal level</span><div class="custom-segmented"><button type="button" data-custom-match-action="goals" data-value="tight" class="${customMatchSetup.goals === "tight" ? "active" : ""}">Tight</button><button type="button" data-custom-match-action="goals" data-value="normal" class="${customMatchSetup.goals === "normal" ? "active" : ""}">Normal</button><button type="button" data-custom-match-action="goals" data-value="wild" class="${customMatchSetup.goals === "wild" ? "active" : ""}">Goal fest</button></div></div>
        <div class="custom-config-group"><span>Your role</span><div class="custom-segmented"><button type="button" data-custom-match-action="managed-side" data-value="neutral" class="${customMatchSetup.managedSide === "neutral" ? "active" : ""}">Neutral</button><button type="button" data-custom-match-action="managed-side" data-value="home" class="${customMatchSetup.managedSide === "home" ? "active" : ""}">Home</button><button type="button" data-custom-match-action="managed-side" data-value="away" class="${customMatchSetup.managedSide === "away" ? "active" : ""}">Away</button></div></div>
      </section>
    </section>
    ${home && away ? customMatchScriptMarkup(home, away) : ""}
    ${customTournamentUi.teamCreatorReturnMode === "customMatch" ? customTeamCreatorMarkup() : ""}`;
  bindCustomTournamentSetup(els.customMatchBody);
  els.customMatchBody.querySelectorAll("[data-custom-match-source]").forEach((select) => select.addEventListener("change", () => {
    const side = select.dataset.customMatchSource;
    const source = CUSTOM_TEAM_SOURCE_IDS.has(select.value) ? select.value : "current";
    customMatchSetup[`${side}Source`] = source;
    const pool = customTeamSourcePool(source);
    const currentTeamId = customMatchSetup[`${side}Id`];
    if (!pool.some((team) => team.id === currentTeamId)) {
      const opposingId = customMatchSetup[`${side === "home" ? "away" : "home"}Id`];
      customMatchSetup[`${side}Id`] = pool.find((team) => team.id !== opposingId)?.id || pool[0]?.id || null;
    }
    saveCustomMatchSetup();
    renderCustomMatchSetup();
  }));
  els.customMatchBody.querySelectorAll("[data-custom-match-team]").forEach((select) => select.addEventListener("change", () => {
    customMatchSetup[`${select.dataset.customMatchTeam}Id`] = select.value;
    saveCustomMatchSetup();
    renderCustomMatchSetup();
  }));
  els.customMatchBody.querySelectorAll("[data-custom-match-rating]").forEach((input) => input.addEventListener("change", () => {
    const teamId = customMatchSetup[`${input.dataset.side}Id`];
    customMatchSetup.abilityOverrides[teamId] ||= {};
    const override = customMatchSetup.abilityOverrides[teamId];
    const base = TEAM_BY_ID.get(teamId)?.simulationRatings || {};
    CUSTOM_TEAM_RATING_KEYS.forEach((key) => {
      if (override[key] === undefined && base[key] !== undefined) override[key] = base[key];
    });
    const key = input.dataset.customMatchRating;
    const value = simulationClamp(Number(input.value) || 1, 1, 99);
    if (key === "overall") raiseLinkedCustomRatings(override, CUSTOM_TEAM_RATING_KEYS, value);
    else override[key] = value;
    saveCustomMatchSetup();
    renderCustomMatchSetup();
  }));
  els.customMatchBody.querySelector('[data-custom-match-action="add-script-goal"]')?.addEventListener("click", () => {
    const script = customMatchSetup.script || { mode: "fixed", homeGoals: 1, awayGoals: 0, winnerSide: "home", goals: [] };
    script.goals = [...(script.goals || []), { side: "home", minute: 1, scorer: "" }];
    customMatchSetup.script = script;
    renderCustomMatchSetup();
  });
  els.customMatchBody.querySelectorAll('[data-custom-match-action="remove-script-goal"]').forEach((button) => button.addEventListener("click", () => {
    if (!customMatchSetup.script) return;
    customMatchSetup.script.goals.splice(Number(button.dataset.index), 1);
    saveCustomMatchSetup();
    renderCustomMatchSetup();
  }));
  els.customMatchBody.querySelector('[data-custom-match-action="save-script"]')?.addEventListener("click", () => {
    const homeGoals = simulationClamp(Number(els.customMatchBody.querySelector("#customMatchHomeScore")?.value) || 0, 0, 20);
    const awayGoals = simulationClamp(Number(els.customMatchBody.querySelector("#customMatchAwayScore")?.value) || 0, 0, 20);
    const goals = customMatchGoalRowsFromForm(els.customMatchBody);
    if (goals.filter((goal) => goal.side === "home").length > homeGoals || goals.filter((goal) => goal.side === "away").length > awayGoals) {
      showToast("There are more goal events than the chosen score.");
      return;
    }
    customMatchSetup.script = {
      mode: "fixed",
      homeGoals,
      awayGoals,
      winnerSide: els.customMatchBody.querySelector("#customMatchWinner")?.value === "away" ? "away" : "home",
      goals,
    };
    saveCustomMatchSetup();
    renderCustomMatchSetup();
    showToast("Custom match script saved.");
  });
  els.customMatchBody.querySelector('[data-custom-match-action="reset-script"]')?.addEventListener("click", () => {
    customMatchSetup.script = null;
    saveCustomMatchSetup();
    renderCustomMatchSetup();
  });
  els.customMatchBody.querySelectorAll("[data-custom-match-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.customMatchAction;
    if (action === "create-team") {
      customTournamentSetup.sourceFilter = "custom";
      customTournamentUi.teamCreatorOpen = true;
      customTournamentUi.editingCustomTeamId = null;
      customTournamentUi.customTeamDraft = newCustomTeamDraft();
      customTournamentUi.teamCreatorReturnMode = "customMatch";
      customTournamentUi.teamCreatorReturnSide = "home";
      render();
      return;
    }
    if (action === "edit-custom-team") {
      const team = customTeamLibrary.find((candidate) => candidate.id === button.dataset.teamId);
      if (!team) return;
      customTournamentUi.teamCreatorOpen = true;
      customTournamentUi.editingCustomTeamId = team.id;
      customTournamentUi.customTeamDraft = newCustomTeamDraft(team);
      customTournamentUi.teamCreatorReturnMode = "customMatch";
      customTournamentUi.teamCreatorReturnSide = button.dataset.side === "away" ? "away" : "home";
      render();
      return;
    }
    if (action === "delete-custom-team") {
      customTournamentUi.teamCreatorReturnMode = "customMatch";
      customTournamentUi.teamCreatorReturnSide = button.dataset.side === "away" ? "away" : "home";
      void deleteCustomTeam(button.dataset.teamId).finally(() => {
        if (!customTournamentUi.teamCreatorOpen) {
          customTournamentUi.teamCreatorReturnMode = null;
          customTournamentUi.teamCreatorReturnSide = null;
        }
      });
      return;
    }
    if (action === "reset-ratings") delete customMatchSetup.abilityOverrides[button.dataset.teamId];
    else if (action === "format") customMatchSetup.format = button.dataset.value === "penalties" ? "penalties" : "full";
    else if (action === "upset") customMatchSetup.upset = SIMULATION_CONFIG.modes[button.dataset.value] ? button.dataset.value : "balanced";
    else if (action === "goals") customMatchSetup.goals = SIMULATION_CONFIG.goals[button.dataset.value] ? button.dataset.value : "normal";
    else if (action === "managed-side") customMatchSetup.managedSide = ["home", "away"].includes(button.dataset.value) ? button.dataset.value : "neutral";
    saveCustomMatchSetup();
    renderCustomMatchSetup();
  }));
}

function createCustomMatchState() {
  const homeId = customMatchSetup.homeId;
  const awayId = customMatchSetup.awayId;
  const managedTeamId = customMatchSetup.managedSide === "home" ? homeId : customMatchSetup.managedSide === "away" ? awayId : null;
  return {
    version: STATE_VERSION,
    drawSeed: Date.now() % 2147483647,
    settings: normalizeSettings({ ...state?.settings, upset: customMatchSetup.upset, goals: customMatchSetup.goals }),
    rounds: [[{ id: "r0-m0", homeId, awayId, result: null }]],
    activeRound: 0,
    selectedMatch: 0,
    championView: false,
    started: true,
    predictionTeamId: null,
    spectateTeamId: managedTeamId,
    neutralView: !managedTeamId,
    standardTactic: "balanced",
    customTournament: {
      active: true,
      customMatch: true,
      teamCount: 2,
      structure: "knockout",
      thirdPlace: false,
      format: customMatchSetup.format,
      upset: customMatchSetup.upset,
      goals: customMatchSetup.goals,
      abilityOverrides: structuredClone(customMatchSetup.abilityOverrides),
      scripts: customMatchSetup.script ? { "0:0": structuredClone(customMatchSetup.script) } : {},
    },
  };
}

function startCustomMatch() {
  if (!TEAM_BY_ID.has(customMatchSetup.homeId) || !TEAM_BY_ID.has(customMatchSetup.awayId) || customMatchSetup.homeId === customMatchSetup.awayId) {
    showToast("Choose two different teams first.");
    return;
  }
  stopStandardPlaybackForNavigation();
  if (isDefaultKnockoutState(state)) defaultKnockoutState = state;
  state = createCustomMatchState();
  customMatchState = state;
  standardTournamentState = state;
  customMatchSetupViewOpen = false;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  teamFilterId = null;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Custom match is ready.");
}

function saveCustomTournamentSetup() {
  localStorage.setItem(CUSTOM_TOURNAMENT_SETUP_KEY, JSON.stringify(customTournamentSetup));
}

function customTournamentPresetPayload() {
  const ratings = Object.entries(customTournamentSetup.abilityOverrides).map(([teamId, values]) => ({
    team: TEAM_BY_ID.get(teamId)?.name || teamId,
    retroYear: TEAM_BY_ID.get(teamId)?.retroWorldCup ? TEAM_BY_ID.get(teamId).retroYear : null,
    values: { ...values },
  }));
  return {
    type: "256teams-custom-tournament",
    version: 1,
    savedAt: new Date().toISOString(),
    teamCount: customTournamentSetup.teamCount,
    structure: customTournamentSetup.structure,
    thirdPlace: customTournamentSetup.thirdPlace === true,
    format: customTournamentSetup.format,
    upset: customTournamentSetup.upset,
    goals: customTournamentSetup.goals,
    sourceFilter: customTournamentSetup.sourceFilter,
    managedTeam: (() => {
      const team = TEAM_BY_ID.get(customTournamentSetup.managedTeamId);
      return team ? { name: team.name, retroYear: team.retroWorldCup ? team.retroYear : null } : null;
    })(),
    teams: customTournamentSetup.selectedIds.map((teamId) => {
      const team = TEAM_BY_ID.get(teamId);
      return team ? { name: team.name, retroYear: team.retroWorldCup ? team.retroYear : null } : null;
    }),
    ratings,
    scripts: structuredClone(customTournamentSetup.scripts),
  };
}

function downloadCustomTournamentPreset() {
  const payload = customTournamentPresetPayload();
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `custom-tournament-${payload.teamCount}-teams-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Custom tournament preset saved.");
}

function sanitizeImportedCustomScripts(input, teamCount, structure = "knockout") {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const roundNames = customRoundNames(teamCount, structure);
  const scripts = {};
  Object.entries(input).forEach(([key, value]) => {
    const match = key.match(/^(\d+):(\d+)$/);
    if (!match || !value || typeof value !== "object") return;
    const roundIndex = Number(match[1]);
    const matchIndex = Number(match[2]);
    const matchCount = structure === "groups" && roundIndex === 0
      ? (teamCount / 4) * 6
      : customRoundMatchCount(structure === "groups" ? customGroupQualifierCount(teamCount) : teamCount, structure === "groups" ? roundIndex - 1 : roundIndex);
    if (roundIndex >= roundNames.length || matchIndex >= matchCount) return;
    if (structure === "knockout" && customMatchIsBye(teamCount, roundIndex, matchIndex)) return;
    scripts[key] = {
      mode: value.mode === "rules" ? "rules" : "fixed",
      minGoals: simulationClamp(Number(value.minGoals) || 0, 0, 20),
      shootoutChance: simulationClamp(Number(value.shootoutChance) || 0, 0, 100),
      homeGoals: simulationClamp(Number(value.homeGoals) || 0, 0, 20),
      awayGoals: simulationClamp(Number(value.awayGoals) || 0, 0, 20),
      winnerSide: value.winnerSide === "away" ? "away" : "home",
      goals: Array.isArray(value.goals) ? value.goals.slice(0, 40).map((goal) => ({
        side: goal?.side === "away" ? "away" : "home",
        minute: simulationClamp(Number(goal?.minute) || 1, 1, 120),
        scorer: String(goal?.scorer || "").slice(0, 80),
      })) : [],
    };
  });
  return scripts;
}

function importCustomTournamentPreset(payload) {
  if (payload?.type !== "256teams-custom-tournament" || Number(payload.version) !== 1) {
    throw new Error("This is not a valid custom tournament preset.");
  }
  const teamCount = Number(payload.teamCount);
  if (!CUSTOM_TOURNAMENT_TEAM_COUNTS.includes(teamCount)) {
    throw new Error("This preset uses an unsupported team count.");
  }
  if (!Array.isArray(payload.teams) || payload.teams.length !== teamCount) {
    throw new Error(`This preset must contain exactly ${teamCount} teams.`);
  }
  const teamLookup = new Map([...TEAM_BY_ID.values()].map((team) => [
    `${repairPlayerText(team.name).toLocaleLowerCase()}:${team.retroWorldCup ? team.retroYear : "current"}`,
    team,
  ]));
  const selectedIds = payload.teams.map((reference) => {
    const name = typeof reference === "string" ? reference : reference?.name;
    const retroYear = typeof reference === "object" ? Number(reference?.retroYear) || null : null;
    return teamLookup.get(`${repairPlayerText(String(name || "")).toLocaleLowerCase()}:${retroYear || "current"}`)?.id || null;
  });
  if (selectedIds.some((id) => !id) || new Set(selectedIds).size !== teamCount) {
    throw new Error("One or more teams are missing or duplicated.");
  }
  const abilityOverrides = {};
  (Array.isArray(payload.ratings) ? payload.ratings : []).forEach((entry) => {
    const team = teamLookup.get(`${repairPlayerText(String(entry?.team || "")).toLocaleLowerCase()}:${Number(entry?.retroYear) || "current"}`);
    if (!team || !selectedIds.includes(team.id) || !entry.values || typeof entry.values !== "object") return;
    const values = {};
    ["overall", "attack", "midfield", "defence", "goalkeeper", "squadDepth", "experience", "penalties", "discipline"]
      .forEach((key) => {
        if (Number.isFinite(Number(entry.values[key]))) values[key] = simulationClamp(Number(entry.values[key]), 1, 99);
      });
    if (Object.keys(values).length) abilityOverrides[team.id] = values;
  });
  const managedReference = payload.managedTeam;
  const managedName = typeof managedReference === "string" ? managedReference : managedReference?.name;
  const managedYear = typeof managedReference === "object" ? Number(managedReference?.retroYear) || null : null;
  const managedTeamId = managedName
    ? teamLookup.get(`${repairPlayerText(String(managedName)).toLocaleLowerCase()}:${managedYear || "current"}`)?.id || null
    : null;
  customTournamentSetup = {
    setupVersion: 3,
    teamCount,
    structure: customTournamentRequiresGroups(teamCount) || payload.structure === "groups" ? "groups" : "knockout",
    thirdPlace: payload.thirdPlace !== false,
    format: customTournamentRequiresGroups(teamCount) || payload.structure === "groups" ? "full" : payload.format === "penalties" ? "penalties" : "full",
    upset: SIMULATION_CONFIG.modes[payload.upset] ? payload.upset : "balanced",
    goals: SIMULATION_CONFIG.goals[payload.goals] ? payload.goals : "normal",
    sourceFilter: CUSTOM_TEAM_SOURCE_IDS.has(String(payload.sourceFilter))
      ? String(payload.sourceFilter)
      : "current",
    managedTeamId: selectedIds.includes(managedTeamId) ? managedTeamId : null,
    selectedIds,
    abilityOverrides,
    scripts: sanitizeImportedCustomScripts(payload.scripts, teamCount, customTournamentRequiresGroups(teamCount) || payload.structure === "groups" ? "groups" : "knockout"),
  };
  customTournamentUi = {
    tab: "bracket",
    search: "",
    quickFillPreset: "top",
    targetIndex: null,
    ratingTeamId: selectedIds[0],
    ratingEditorOpen: false,
    scriptRound: 0,
    scriptMatch: teamCount === 24 ? 1 : 0,
    matchEditorOpen: false,
    scriptDraftKey: null,
    scriptDraft: null,
  };
  selectedIds.forEach(clearPlayerProfileCacheForTeam);
  saveCustomTournamentSetup();
  renderCustomTournamentSetup();
}

async function readCustomTournamentPresetFile(file) {
  if (!file) return;
  if (file.size > 2_000_000) {
    showToast("That preset file is too large.");
    return;
  }
  try {
    importCustomTournamentPreset(JSON.parse(await file.text()));
    showToast(`${customTournamentSetup.teamCount}-team preset imported.`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Could not import that preset.");
  } finally {
    if (els.customPresetFile) els.customPresetFile.value = "";
  }
}

function customSetupTeam(id) {
  return TEAM_BY_ID.get(id);
}

function customTeamDisplayName(team) {
  if (!team) return "Unknown team";
  return team.retroWorldCup
    ? `${team.name} ${Number(team.retroYear) === 2016 ? "Euro 2016" : team.retroYear}`
    : team.name;
}

function customTeamCompetitionLabel(team) {
  if (team?.customTeam) return "Custom squad";
  if (team?.premierLeague) return "Premier League";
  if (!team?.retroWorldCup) return team?.confed || "";
  return Number(team.retroYear) === 2016 ? "UEFA Euro 2016" : `World Cup ${team.retroYear}`;
}

function customTeamSourcePool(source = customTournamentSetup.sourceFilter) {
  if (source === "current") return [...TEAMS];
  if (source === "premier-league") return [...CUSTOM_PREMIER_LEAGUE_TEAMS].sort((left, right) => left.name.localeCompare(right.name));
  if (source === "custom") return [...customTeamLibrary].sort((left, right) => left.name.localeCompare(right.name));
  const retroTeams = [...TEAM_BY_ID.values()].filter((team) => team.retroWorldCup);
  if (source === "all-retro") return retroTeams.sort((left, right) => (
    right.retroYear - left.retroYear
    || right.strength - left.strength
    || left.name.localeCompare(right.name)
  ));
  const year = Number(source);
  return retroTeams.filter((team) => team.retroYear === year).sort((left, right) => (
    right.strength - left.strength || left.name.localeCompare(right.name)
  ));
}

function customGroupLabel(index) {
  let value = Number(index) + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return `Group ${label}`;
}

function randomisedCustomGroupSlots(selectedIds, random = Math.random) {
  const nextIds = [...selectedIds];
  const occupiedIndexes = nextIds
    .map((teamId, index) => teamId ? index : -1)
    .filter((index) => index >= 0);
  const currentIds = occupiedIndexes.map((index) => nextIds[index]);
  if (currentIds.length < 2) return nextIds;
  const randomisedIds = shuffle(currentIds, random);
  if (randomisedIds.every((teamId, index) => teamId === currentIds[index])) {
    randomisedIds.push(randomisedIds.shift());
  }
  occupiedIndexes.forEach((slotIndex, index) => {
    nextIds[slotIndex] = randomisedIds[index];
  });
  return nextIds;
}

function customGroupFixturePairs() {
  return [[0, 1], [2, 3], [0, 2], [3, 1], [0, 3], [1, 2]];
}

function customFirstEmptyIndex() {
  return customTournamentSetup.selectedIds.findIndex((teamId) => !teamId);
}

function customPresetPool(preset) {
  if (preset === "europe") return TEAMS.filter((team) => team.confed === "UEFA");
  if (preset === "south-america") return TEAMS.filter((team) => team.confed === "CONMEBOL");
  if (preset === "north-america") return TEAMS.filter((team) => team.confed === "CONCACAF");
  if (preset === "asia") return TEAMS.filter((team) => team.confed === "AFC");
  if (preset === "africa") return TEAMS.filter((team) => team.confed === "CAF");
  if (preset === "guests") return TEAMS.filter((team) => team.confed === "INVITED");
  if (preset === "underdogs") return TEAMS.filter((team) => (
    (team.simulationRatings?.overall ?? team.rating) <= 70
  ));
  return [];
}

function setCustomTeamCount(teamCount) {
  const current = customTournamentSetup.selectedIds.filter((id) => TEAM_BY_ID.has(id));
  customTournamentSetup.teamCount = teamCount;
  if (customTournamentRequiresGroups(teamCount)) {
    customTournamentSetup.structure = "groups";
    customTournamentSetup.format = "full";
  }
  customTournamentSetup.selectedIds = [...current, ...Array(Math.max(0, teamCount - current.length)).fill(null)].slice(0, teamCount);
  if (!customTournamentSetup.selectedIds.includes(customTournamentSetup.managedTeamId)) {
    customTournamentSetup.managedTeamId = null;
  }
  customTournamentSetup.scripts = {};
  customTournamentUi.targetIndex = null;
  customTournamentUi.ratingEditorOpen = false;
  customTournamentUi.scriptRound = 0;
  customTournamentUi.scriptMatch = teamCount === 24 ? 1 : 0;
  customTournamentUi.matchEditorOpen = false;
  saveCustomTournamentSetup();
  renderCustomTournamentSetup();
}

function customSlotMarkup(teamId, index, locationLabel) {
  const team = customSetupTeam(teamId);
  const target = customTournamentUi.targetIndex === index;
  return `
    <article class="custom-seed-slot ${team ? "is-filled" : "is-empty"} ${target ? "is-target" : ""}" data-custom-slot="${index}">
      <button class="custom-slot-main" type="button" data-custom-action="target-slot" data-index="${index}">
        <span class="custom-seed-number">${index % (customTournamentSetup.teamCount / 2) + 1}</span>
        ${team ? flagMarkup(team, "custom-team-flag") : `<span class="custom-empty-mark">+</span>`}
        <span class="custom-slot-copy">
          <strong>${team ? escapeHtml(customTeamDisplayName(team)) : "Choose team"}</strong>
          <small>${escapeHtml(locationLabel)}</small>
        </span>
      </button>
      ${team ? `
        <span class="custom-slot-actions">
          <button type="button" data-custom-action="open-team-editor" data-team-id="${team.id}" aria-label="Edit ${escapeHtml(customTeamDisplayName(team))} ratings">&#9998;</button>
          <button type="button" data-custom-action="remove-slot" data-index="${index}" aria-label="Remove ${escapeHtml(customTeamDisplayName(team))}">&times;</button>
        </span>
      ` : ""}
    </article>
  `;
}

function customOpeningMatchDefinitions(teamCount = customTournamentSetup.teamCount) {
  const definitions = [];
  const bracketSize = customTournamentBracketSize(teamCount);
  const byeCount = bracketSize - teamCount;
  if (byeCount > 0) {
    const teamsPerSide = teamCount / 2;
    const byesPerSide = byeCount / 2;
    [0, teamsPerSide].forEach((sideStart) => {
      const openingTeamStart = sideStart + byesPerSide;
      for (let index = 0; index < byesPerSide; index += 1) {
        definitions.push({ homeIndex: sideStart + index, awayIndex: null, bye: true });
        definitions.push({
          homeIndex: openingTeamStart + index * 2,
          awayIndex: openingTeamStart + index * 2 + 1,
          bye: false,
        });
      }
    });
    return definitions;
  }
  for (let index = 0; index < teamCount; index += 2) {
    definitions.push({ homeIndex: index, awayIndex: index + 1, bye: false });
  }
  return definitions;
}

function customMatchRuleSummary(roundIndex, matchIndex) {
  const rule = customTournamentSetup.scripts[customScriptKey(roundIndex, matchIndex)];
  if (!rule) return "Normal rules";
  if (rule.mode === "fixed" || !rule.mode) return `${rule.homeGoals}-${rule.awayGoals} fixed`;
  const parts = [];
  if (Number(rule.minGoals) > 0) parts.push(`${rule.minGoals}+ goals`);
  if (Number(rule.shootoutChance) > 0) parts.push(`${rule.shootoutChance}% pens`);
  return parts.join(" · ") || "Normal rules";
}

function customDirectMatchSlot(teamId, slotIndex, label) {
  const team = customSetupTeam(teamId);
  const target = customTournamentUi.targetIndex === slotIndex;
  return `
    <div class="custom-direct-match-slot ${team ? "is-filled" : "is-empty"} ${target ? "is-target" : ""}">
      <button type="button" data-custom-action="target-slot" data-index="${slotIndex}" aria-label="${team ? `Replace ${escapeHtml(customTeamDisplayName(team))}` : `Choose ${label}`}">
        ${team ? flagMarkup(team, "custom-preview-flag") : `<span class="custom-direct-plus" aria-hidden="true">+</span>`}
        <span><strong>${team ? escapeHtml(customTeamDisplayName(team)) : `Choose ${label}`}</strong><small>${team ? "Tap to replace" : "Pick from team library"}</small></span>
      </button>
      ${team ? `<span class="custom-direct-actions"><button type="button" data-custom-action="open-team-editor" data-team-id="${team.id}" aria-label="Edit ${escapeHtml(customTeamDisplayName(team))} ratings">&#9998;</button><button type="button" data-custom-action="remove-slot" data-index="${slotIndex}" aria-label="Remove ${escapeHtml(customTeamDisplayName(team))}">&times;</button></span>` : ""}
    </div>
  `;
}

function customBracketMatchCard(roundIndex, matchIndex, definition = null) {
  const bye = Boolean(definition?.bye);
  return `
    <article class="custom-bracket-edit-match ${bye ? "is-bye" : ""}">
      <header>
        <span>Match ${matchIndex + 1}</span>
        ${bye ? `<small>Seeded bye</small>` : `<button type="button" data-custom-action="open-match-rules" data-round="${roundIndex}" data-match="${matchIndex}">Edit match</button>`}
      </header>
      ${roundIndex === 0 && definition ? `
        ${customDirectMatchSlot(customTournamentSetup.selectedIds[definition.homeIndex], definition.homeIndex, bye ? "seeded team" : "home team")}
        ${bye
          ? `<div class="custom-future-team"><span>Advances automatically</span></div>`
          : customDirectMatchSlot(customTournamentSetup.selectedIds[definition.awayIndex], definition.awayIndex, "away team")}
      ` : `
        <div class="custom-future-team"><span>Winner from previous round</span></div>
        <div class="custom-future-team"><span>Winner from previous round</span></div>
      `}
      ${bye ? "" : `<footer>${escapeHtml(customMatchRuleSummary(roundIndex, matchIndex))}</footer>`}
    </article>
  `;
}

function customThirdPlacePreviewMarkup() {
  if (!customTournamentSetup.thirdPlace) return "";
  return `
    <section class="custom-third-place-preview" aria-label="Third-place play-off">
      <header><strong>Third-place play-off</strong><span>After the semi-finals</span></header>
      <div>
        <span>Semi-final loser</span>
        <span>Semi-final loser</span>
      </div>
    </section>
  `;
}

function customBracketPanelMarkup() {
  const selected = new Set(customTournamentSetup.selectedIds.filter(Boolean));
  const query = customTournamentUi.search.trim().toLocaleLowerCase();
  const available = customTeamSourcePool().filter((team) => (
    !selected.has(team.id) && customTeamDisplayName(team).toLocaleLowerCase().includes(query)
  ));
  const groupCount = customTournamentSetup.teamCount / 4;
  const groupBuilder = `
    <div class="custom-groups-builder">
      ${Array.from({ length: groupCount }, (_, groupIndex) => {
        const label = customGroupLabel(groupIndex);
        const groupStart = groupIndex * 4;
        return `<section class="custom-builder-group">
          <header><strong>${label}</strong><span>4 teams</span></header>
          <div>${Array.from({ length: 4 }, (_, offset) => {
            const index = groupStart + offset;
            return customSlotMarkup(customTournamentSetup.selectedIds[index], index, label);
          }).join("")}</div>
          <div class="custom-group-fixture-editor">
            ${[[0, 1], [2, 3], [4, 5]].map((fixtureRow) => `
              <div class="custom-group-fixture-row">
                ${fixtureRow.map((fixtureIndex) => {
                  const [homeOffset, awayOffset] = customGroupFixturePairs()[fixtureIndex];
                  const matchIndex = groupIndex * 6 + fixtureIndex;
                  const home = customSetupTeam(customTournamentSetup.selectedIds[groupStart + homeOffset]);
                  const away = customSetupTeam(customTournamentSetup.selectedIds[groupStart + awayOffset]);
                  return `<article>
                    <header><span>Match ${fixtureIndex + 1}</span><button type="button" data-custom-action="open-match-rules" data-round="0" data-match="${matchIndex}">Edit match</button></header>
                    <div>${home ? flagMarkup(home, "custom-fixture-flag") : ""}<span>${home ? escapeHtml(customTeamDisplayName(home)) : `Group slot ${homeOffset + 1}`}</span></div>
                    <div>${away ? flagMarkup(away, "custom-fixture-flag") : ""}<span>${away ? escapeHtml(customTeamDisplayName(away)) : `Group slot ${awayOffset + 1}`}</span></div>
                    <footer>${escapeHtml(customMatchRuleSummary(0, matchIndex))}</footer>
                  </article>`;
                }).join("")}
              </div>
            `).join("")}
          </div>
        </section>`;
      }).join("")}
    </div>
    <div class="custom-group-knockout-stage">
      <div class="custom-bracket-editor" aria-label="Knockout stage after the groups">
        ${customRoundNames(customGroupQualifierCount(customTournamentSetup.teamCount), "knockout").map((roundName, knockoutRoundIndex) => {
          const roundIndex = knockoutRoundIndex + 1;
          const matchCount = customRoundMatchCount(customGroupQualifierCount(customTournamentSetup.teamCount), knockoutRoundIndex);
          return `<section class="custom-bracket-edit-round">
            <header><strong>${escapeHtml(roundName)}</strong><span>${matchCount} matches</span></header>
            <div>${Array.from({ length: matchCount }, (_, matchIndex) => customBracketMatchCard(roundIndex, matchIndex)).join("")}</div>
          </section>`;
        }).join("")}
      </div>
      ${customThirdPlacePreviewMarkup()}
    </div>
  `;
  const openingMatches = customOpeningMatchDefinitions();
  const roundNames = customRoundNames(customTournamentSetup.teamCount, "knockout");
  const knockoutBuilder = `
    <div class="custom-bracket-editor" aria-label="Editable knockout bracket">
      ${roundNames.map((roundName, roundIndex) => {
        const matchCount = customRoundMatchCount(customTournamentSetup.teamCount, roundIndex);
        return `<section class="custom-bracket-edit-round">
          <header><strong>${escapeHtml(roundName)}</strong><span>${matchCount} matches</span></header>
          <div>${Array.from({ length: matchCount }, (_, matchIndex) => customBracketMatchCard(roundIndex, matchIndex, roundIndex === 0 ? openingMatches[matchIndex] : null)).join("")}</div>
        </section>`;
      }).join("")}
    </div>
    ${customThirdPlacePreviewMarkup()}
  `;
  return `
    <section class="custom-workspace-panel custom-bracket-panel">
      <div class="custom-draw-toolbar">
        <div class="custom-inline-actions">
          <label class="custom-quick-fill">
            <span>Quick fill</span>
            <select id="customQuickFill" aria-label="Choose a quick fill preset">
              <option value="top" ${customTournamentUi.quickFillPreset === "top" ? "selected" : ""}>Top ranked</option>
              <option value="random" ${customTournamentUi.quickFillPreset === "random" ? "selected" : ""}>Random</option>
              <option value="europe" ${customTournamentUi.quickFillPreset === "europe" ? "selected" : ""}>Only Europe</option>
              <option value="south-america" ${customTournamentUi.quickFillPreset === "south-america" ? "selected" : ""}>Only South America</option>
              <option value="north-america" ${customTournamentUi.quickFillPreset === "north-america" ? "selected" : ""}>Only North America</option>
              <option value="asia" ${customTournamentUi.quickFillPreset === "asia" ? "selected" : ""}>Only Asia</option>
              <option value="africa" ${customTournamentUi.quickFillPreset === "africa" ? "selected" : ""}>Only Africa</option>
              <option value="underdogs" ${customTournamentUi.quickFillPreset === "underdogs" ? "selected" : ""}>Only underdogs</option>
              <option value="guests" ${customTournamentUi.quickFillPreset === "guests" ? "selected" : ""}>Only guest nations</option>
            </select>
          </label>
          <button type="button" data-custom-action="apply-quick-fill">Fill</button>
          <button type="button" data-custom-action="clear-field">Clear</button>
          ${customTournamentSetup.structure === "groups" ? `<button class="custom-randomise-groups" type="button" data-custom-action="randomise-groups" ${selected.size < 2 ? 'disabled title="Add at least two teams first"' : ""}><span aria-hidden="true">&#8635;</span> Randomise groups</button>` : ""}
        </div>
      </div>
      <div class="custom-draw-layout">
        <div class="custom-draw-main">${customTournamentSetup.structure === "groups" ? groupBuilder : knockoutBuilder}</div>
        <aside class="custom-team-library">
          <div class="custom-library-heading">
            <div><strong>Team library</strong><span>${available.length} available</span></div>
            <button type="button" data-custom-action="open-team-creator">+ Create team</button>
          </div>
          <label class="custom-source-select"><span>Team era</span><select id="customSourceFilter" aria-label="Choose team era">${customTeamSourceOptionsMarkup()}</select></label>
          <label class="custom-search">
            <span aria-hidden="true">&#8981;</span>
            <input type="search" id="customTeamSearch" value="${escapeHtml(customTournamentUi.search)}" placeholder="Search teams" autocomplete="off" />
          </label>
          ${customTournamentUi.targetIndex !== null ? `<p class="custom-target-note">Now choose a country for the highlighted match slot.</p>` : ""}
          <div class="custom-team-library-list">
            ${available.map((team) => `
              <div class="custom-library-team">
                ${flagMarkup(team, "custom-team-flag")}
                <span><strong>${escapeHtml(customTeamDisplayName(team))}</strong><small>${escapeHtml(customTeamCompetitionLabel(team))} &middot; ${team.rating}</small></span>
                ${team.customTeam ? `<button class="custom-library-edit" type="button" data-custom-action="edit-custom-team" data-team-id="${team.id}" aria-label="Edit ${escapeHtml(team.name)}">Edit</button>` : ""}
                <button type="button" data-custom-action="add-team" data-team-id="${team.id}" aria-label="Add ${escapeHtml(customTeamDisplayName(team))} to the selected slot">+</button>
              </div>
            `).join("") || `<p class="custom-empty-state">No available teams match this search.</p>`}
          </div>
        </aside>
      </div>
      ${customTournamentUi.matchEditorOpen ? customInlineMatchEditorMarkup() : ""}
      ${customTournamentUi.ratingEditorOpen ? customRatingsPanelMarkup() : ""}
      ${customTournamentUi.targetIndex !== null ? customTeamPickerModalMarkup(available) : ""}
      ${customTournamentUi.managerPickerOpen ? customManagerPickerModalMarkup() : ""}
      ${customTeamCreatorMarkup()}
    </section>
  `;
}

function customManagerPickerModalMarkup() {
  const selectedTeams = customTournamentSetup.selectedIds.map(customSetupTeam).filter(Boolean);
  return `
    <div class="custom-editor-modal custom-manager-picker-modal" role="dialog" aria-modal="true" aria-label="Choose your role">
      <button class="custom-editor-backdrop" type="button" data-custom-action="close-manager-picker" aria-label="Close role picker"></button>
      <section class="custom-manager-picker-panel">
        <header><div><span>YOUR ROLE</span><h3>Choose a team</h3></div><button type="button" data-custom-action="close-manager-picker" aria-label="Close role picker">&times;</button></header>
        <div>
          <button type="button" data-custom-action="select-manager-team" data-team-id="" class="${customTournamentSetup.managedTeamId ? "" : "active"}"><span class="custom-manager-neutral" aria-hidden="true">N</span><span><strong>Neutral</strong><small>Spectate every match</small></span></button>
          ${selectedTeams.map((team) => `<button type="button" data-custom-action="select-manager-team" data-team-id="${team.id}" class="${customTournamentSetup.managedTeamId === team.id ? "active" : ""}">${flagMarkup(team, "custom-team-flag")}<span><strong>${escapeHtml(customTeamDisplayName(team))}</strong><small>Manage this team</small></span></button>`).join("")}
        </div>
      </section>
    </div>`;
}

function customTeamPickerModalMarkup(available) {
  const slotNumber = Number(customTournamentUi.targetIndex) + 1;
  return `
    <div class="custom-editor-modal custom-team-picker-modal" role="dialog" aria-modal="true" aria-label="Choose team for slot ${slotNumber}">
      <button class="custom-editor-backdrop" type="button" data-custom-action="close-team-picker" aria-label="Close team picker"></button>
      <section class="custom-team-picker-panel">
        <header>
          <div><span>SLOT ${slotNumber}</span><h3>Choose team</h3></div>
          <button type="button" data-custom-action="close-team-picker" aria-label="Close team picker">&times;</button>
        </header>
        <div class="custom-team-picker-tools">
          <label><span>Team era</span><select id="customPickerSourceFilter">${customTeamSourceOptionsMarkup()}</select></label>
          <label class="custom-picker-search"><span aria-hidden="true">&#8981;</span><input id="customPickerTeamSearch" type="search" value="${escapeHtml(customTournamentUi.search)}" placeholder="Search teams" autocomplete="off" /></label>
        </div>
        <div class="custom-team-picker-list">
          ${available.map((team) => `
            <button type="button" data-custom-action="add-team" data-team-id="${team.id}">
              ${flagMarkup(team, "custom-team-flag")}
              <span><strong>${escapeHtml(customTeamDisplayName(team))}</strong><small>${escapeHtml(customTeamCompetitionLabel(team))} &middot; ${team.rating}</small></span>
              <i aria-hidden="true">+</i>
            </button>
          `).join("") || `<p class="custom-empty-state">No available teams match this search.</p>`}
        </div>
      </section>
    </div>
  `;
}

function customRatingsPanelMarkup() {
  const selectedTeams = customTournamentSetup.selectedIds.map(customSetupTeam).filter(Boolean);
  const team = selectedTeams.find((candidate) => candidate.id === customTournamentUi.ratingTeamId) || selectedTeams[0];
  if (team) customTournamentUi.ratingTeamId = team.id;
  const base = team?.simulationRatings || {};
  const override = customTournamentSetup.abilityOverrides[team?.id] || {};
  const fields = [
    ["overall", "Overall"], ["attack", "Attack"], ["midfield", "Midfield"], ["defence", "Defence"],
    ["goalkeeper", "Goalkeeper"],
  ];
  return `
    <div class="custom-editor-modal" role="dialog" aria-modal="true" aria-label="Edit team ratings">
      <button class="custom-editor-backdrop" type="button" data-custom-action="close-team-editor" aria-label="Close team editor"></button>
      <section class="custom-workspace-panel custom-ratings-panel">
      <div class="custom-ratings-toolbar">
        ${team ? `<button type="button" data-custom-action="reset-ratings" data-team-id="${team.id}">Restore team</button>` : ""}
        <button type="button" data-custom-action="close-team-editor" aria-label="Close team editor">&times;</button>
      </div>
      <div class="custom-ratings-layout">
        <div class="custom-rating-team-list">
          ${selectedTeams.map((candidate) => `
            <button class="${candidate.id === team?.id ? "active" : ""}" type="button" data-custom-action="select-rating-team" data-team-id="${candidate.id}">
              ${flagMarkup(candidate, "custom-team-flag")}<span>${escapeHtml(customTeamDisplayName(candidate))}</span><strong>${customTournamentSetup.abilityOverrides[candidate.id]?.overall || candidate.simulationRatings.overall}</strong>
            </button>
          `).join("")}
        </div>
        <div class="custom-rating-editor">
          ${team ? `
            <header>${flagMarkup(team, "custom-rating-flag")}<div><h3>${escapeHtml(customTeamDisplayName(team))}</h3><p>Changes apply only to this custom tournament.</p></div></header>
            <div class="custom-rating-grid">
              ${fields.map(([key, label]) => {
                const value = override[key] ?? base[key] ?? team.rating;
                return `<label><span>${label}</span><input type="number" min="1" max="99" value="${value}" data-custom-rating="${key}" data-team-id="${team.id}" /></label>`;
              }).join("")}
            </div>
          ` : `<p class="custom-empty-state">Add a team to the bracket first.</p>`}
        </div>
      </div>
      </section>
    </div>
  `;
}

function customScriptKey(roundIndex = customTournamentUi.scriptRound, matchIndex = customTournamentUi.scriptMatch) {
  return `${roundIndex}:${matchIndex}`;
}

function customEditorMatchTeams(roundIndex, matchIndex) {
  if (customTournamentSetup.structure === "groups" && roundIndex === 0) {
    const groupIndex = Math.floor(matchIndex / 6);
    const fixtureIndex = matchIndex % 6;
    const [homeOffset, awayOffset] = customGroupFixturePairs()[fixtureIndex];
    return {
      home: customSetupTeam(customTournamentSetup.selectedIds[groupIndex * 4 + homeOffset]),
      away: customSetupTeam(customTournamentSetup.selectedIds[groupIndex * 4 + awayOffset]),
    };
  }
  if (customTournamentSetup.structure === "knockout" && roundIndex === 0) {
    return {
      home: customSetupTeam(customTournamentSetup.selectedIds[matchIndex * 2]),
      away: customSetupTeam(customTournamentSetup.selectedIds[matchIndex * 2 + 1]),
    };
  }
  return { home: null, away: null };
}

function customRoundMatchCount(teamCount, roundIndex) {
  return customTournamentBracketSize(teamCount) / (2 ** (roundIndex + 1));
}

function customMatchIsBye(teamCount, roundIndex, matchIndex) {
  return roundIndex === 0 && customOpeningMatchDefinitions(teamCount)[matchIndex]?.bye === true;
}

function customScriptPanelMarkup() {
  const roundNames = customRoundNames(customTournamentSetup.teamCount, customTournamentSetup.structure);
  const roundIndex = Math.min(customTournamentUi.scriptRound, roundNames.length - 1);
  const matchCount = customTournamentSetup.structure === "groups" && roundIndex === 0
    ? (customTournamentSetup.teamCount / 4) * 6
    : customRoundMatchCount(
      customTournamentSetup.structure === "groups" ? customGroupQualifierCount(customTournamentSetup.teamCount) : customTournamentSetup.teamCount,
      customTournamentSetup.structure === "groups" ? roundIndex - 1 : roundIndex,
    );
  let matchIndex = Math.min(customTournamentUi.scriptMatch, matchCount - 1);
  if (customTournamentSetup.structure === "knockout" && customMatchIsBye(customTournamentSetup.teamCount, roundIndex, matchIndex)) {
    matchIndex = Math.min(matchCount - 1, matchIndex + 1);
  }
  customTournamentUi.scriptRound = roundIndex;
  customTournamentUi.scriptMatch = matchIndex;
  const key = customScriptKey(roundIndex, matchIndex);
  const script = customTournamentUi.scriptDraftKey === key
    ? customTournamentUi.scriptDraft
    : customTournamentSetup.scripts[key] || { homeGoals: 1, awayGoals: 0, winnerSide: "home", goals: [] };
  const allPlayers = customTournamentSetup.selectedIds
    .map(customSetupTeam)
    .filter(Boolean)
    .flatMap((team) => playerProfilesForTeam(team).map((player) => player.name));
  return `
    <section class="custom-workspace-panel custom-scripts-panel">
      <div class="custom-panel-heading">
        <div><span>MATCH CONTROL</span><h2>Script a result</h2></div>
        <span class="custom-script-count">${Object.keys(customTournamentSetup.scripts).length} saved</span>
      </div>
      <div class="custom-script-layout">
        <form class="custom-script-editor" id="customScriptForm">
          <div class="custom-script-pickers">
            <label><span>Round</span><select id="customScriptRound">${roundNames.map((name, index) => `<option value="${index}" ${index === roundIndex ? "selected" : ""}>${name}</option>`).join("")}</select></label>
            <label><span>Match</span><select id="customScriptMatch">${Array.from({ length: matchCount }, (_, index) => {
              const bye = customTournamentSetup.structure === "knockout" && customMatchIsBye(customTournamentSetup.teamCount, roundIndex, index);
              return `<option value="${index}" ${index === matchIndex ? "selected" : ""} ${bye ? "disabled" : ""}>Match ${index + 1}${bye ? " (seeded bye)" : ""}</option>`;
            }).join("")}</select></label>
          </div>
          <div class="custom-score-script">
            <label><span>Home score</span><input id="customScriptHomeScore" type="number" min="0" max="20" value="${script.homeGoals}" /></label>
            <span aria-hidden="true">-</span>
            <label><span>Away score</span><input id="customScriptAwayScore" type="number" min="0" max="20" value="${script.awayGoals}" /></label>
          </div>
          <label class="custom-winner-select"><span>Advance if tied</span><select id="customScriptWinner"><option value="home" ${script.winnerSide !== "away" ? "selected" : ""}>Home team</option><option value="away" ${script.winnerSide === "away" ? "selected" : ""}>Away team</option></select></label>
          <div class="custom-goal-script-heading"><strong>Goal events</strong><button type="button" data-custom-action="add-script-goal">Add goal</button></div>
          <div class="custom-goal-rows" id="customGoalRows">
            ${(script.goals || []).map((goal, index) => `
              <div class="custom-goal-row">
                <select data-goal-side><option value="home" ${goal.side !== "away" ? "selected" : ""}>Home</option><option value="away" ${goal.side === "away" ? "selected" : ""}>Away</option></select>
                <input type="number" min="1" max="120" value="${goal.minute}" aria-label="Goal minute" data-goal-minute />
                <input type="text" value="${escapeHtml(goal.scorer || "")}" list="customPlayerNames" placeholder="Scorer" aria-label="Scorer" data-goal-scorer />
                <button type="button" data-custom-action="remove-script-goal" data-index="${index}" aria-label="Remove goal">&times;</button>
              </div>
            `).join("") || `<p class="custom-goal-empty">Add goal rows to control the scorer and minute. Scores can also be fixed without naming every scorer.</p>`}
          </div>
          <datalist id="customPlayerNames">${[...new Set(allPlayers)].map((name) => `<option value="${escapeHtml(name)}"></option>`).join("")}</datalist>
          <div class="custom-script-actions">
            <button class="secondary-button" type="button" data-custom-action="delete-script">Clear script</button>
            <button class="primary-button" type="submit">Save script</button>
          </div>
          <p class="custom-form-message" id="customScriptMessage" aria-live="polite"></p>
        </form>
        <div class="custom-saved-scripts">
          <strong>Saved match overrides</strong>
          ${Object.entries(customTournamentSetup.scripts).map(([key, item]) => {
            const [savedRound, savedMatch] = key.split(":").map(Number);
            return `<button type="button" data-custom-action="open-script" data-round="${savedRound}" data-match="${savedMatch}">
              <span>${escapeHtml(roundNames[savedRound] || `Round ${savedRound + 1}`)} &middot; Match ${savedMatch + 1}</span>
              <strong>${item.homeGoals}-${item.awayGoals}</strong>
            </button>`;
          }).join("") || `<p class="custom-empty-state">No matches are rigged. Every tie will use the normal simulation engine.</p>`}
        </div>
      </div>
    </section>
  `;
}

function customInlineMatchEditorMarkup() {
  const roundIndex = customTournamentUi.scriptRound;
  const matchIndex = customTournamentUi.scriptMatch;
  const key = customScriptKey(roundIndex, matchIndex);
  const saved = customTournamentSetup.scripts[key];
  const script = customTournamentUi.scriptDraftKey === key
    ? customTournamentUi.scriptDraft
    : saved || {
      mode: "rules",
      minGoals: 0,
      shootoutChance: 0,
      homeGoals: 1,
      awayGoals: 0,
      winnerSide: "home",
      goals: [],
    };
  const fixed = script.mode === "fixed" || (saved && !script.mode);
  const groupStageMatch = customTournamentSetup.structure === "groups" && roundIndex === 0;
  const roundName = customRoundNames(customTournamentSetup.teamCount, customTournamentSetup.structure)[roundIndex] || `Round ${roundIndex + 1}`;
  const matchTeams = customEditorMatchTeams(roundIndex, matchIndex);
  const playerNames = {
    home: matchTeams.home ? playerProfilesForTeam(matchTeams.home).map((player) => player.name) : [],
    away: matchTeams.away ? playerProfilesForTeam(matchTeams.away).map((player) => player.name) : [],
  };
  const teamName = (side) => matchTeams[side] ? customTeamDisplayName(matchTeams[side]) : `${side === "home" ? "Home" : "Away"} qualifier`;
  const teamPanel = (side) => `
    <article>
      ${matchTeams[side] ? flagMarkup(matchTeams[side], "custom-match-team-flag") : `<span class="custom-match-team-placeholder">?</span>`}
      <span><small>${side}</small><strong>${escapeHtml(teamName(side))}</strong></span>
    </article>`;
  const scorerMenu = (goal, index) => `
    <div class="custom-scorer-picker">
      <input type="hidden" value="${escapeHtml(goal.scorer || "")}" data-goal-scorer />
      <button type="button" data-custom-action="toggle-scorer-picker" aria-expanded="false">
        <span>${escapeHtml(goal.scorer || "Choose scorer")}</span><i aria-hidden="true">&#9662;</i>
      </button>
      <div class="custom-scorer-menu" hidden>
        ${["home", "away"].map((side) => `
          <section>
            <header>${matchTeams[side] ? flagMarkup(matchTeams[side], "custom-scorer-team-flag") : ""}<strong>${escapeHtml(teamName(side))}</strong></header>
            <div>${playerNames[side].map((name) => `<button type="button" data-custom-action="select-goal-scorer" data-index="${index}" data-side="${side}" data-player="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("") || `<small>Players become available once this matchup is known.</small>`}</div>
          </section>
        `).join("")}
      </div>
    </div>`;
  return `
    <div class="custom-editor-modal" role="dialog" aria-modal="true" aria-label="Edit match rules">
      <button class="custom-editor-backdrop" type="button" data-custom-action="close-match-rules" aria-label="Close match editor"></button>
      <section class="custom-match-rule-editor">
      <header>
        <div><span>${escapeHtml(roundName)} &middot; Match ${matchIndex + 1}</span><h3>Edit match</h3></div>
        <button type="button" data-custom-action="close-match-rules" aria-label="Close match editor">&times;</button>
      </header>
      <div class="custom-match-teams">${teamPanel("home")}<b>VS</b>${teamPanel("away")}</div>
      <form id="customScriptForm">
        <div class="custom-rule-fields">
          <label><span>Minimum total goals</span><input id="customScriptMinGoals" type="number" min="0" max="20" value="${simulationClamp(Number(script.minGoals) || 0, 0, 20)}" /></label>
          <label class="${groupStageMatch ? "is-disabled" : ""}">
            <span>Penalty shootout chance <output id="customShootoutChanceValue">${groupStageMatch ? 0 : simulationClamp(Number(script.shootoutChance) || 0, 0, 100)}%</output></span>
            <input id="customScriptShootoutChance" type="range" min="0" max="100" step="5" value="${groupStageMatch ? 0 : simulationClamp(Number(script.shootoutChance) || 0, 0, 100)}" ${groupStageMatch ? "disabled" : ""} />
          </label>
        </div>
        <label class="custom-fixed-toggle"><input id="customScriptFixedResult" type="checkbox" ${fixed ? "checked" : ""} /><span>Fix the exact result, scorers and minutes</span></label>
        <div class="custom-fixed-result-fields" ${fixed ? "" : "hidden"}>
          <div class="custom-score-script">
            <label><span>Home score</span><input id="customScriptHomeScore" type="number" min="0" max="20" value="${script.homeGoals}" /></label>
            <span aria-hidden="true">-</span>
            <label><span>Away score</span><input id="customScriptAwayScore" type="number" min="0" max="20" value="${script.awayGoals}" /></label>
          </div>
          <label class="custom-winner-select"><span>Advance if tied</span><select id="customScriptWinner"><option value="home" ${script.winnerSide !== "away" ? "selected" : ""}>Home team</option><option value="away" ${script.winnerSide === "away" ? "selected" : ""}>Away team</option></select></label>
          <div class="custom-goal-script-heading"><strong>Goal events</strong><button type="button" data-custom-action="add-script-goal">Add goal</button></div>
          <div class="custom-goal-rows" id="customGoalRows">
            ${(script.goals || []).map((goal, index) => `
              <div class="custom-goal-row">
                <select data-goal-side><option value="home" ${goal.side !== "away" ? "selected" : ""}>Home</option><option value="away" ${goal.side === "away" ? "selected" : ""}>Away</option></select>
                <input type="number" min="1" max="120" value="${goal.minute}" aria-label="Goal minute" data-goal-minute />
                <select data-goal-scorer aria-label="Choose scorer">
                  <option value="">Choose scorer</option>
                  ${playerNames[goal.side === "away" ? "away" : "home"].map((name) => `<option value="${escapeHtml(name)}" ${goal.scorer === name ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
                </select>
                <button type="button" data-custom-action="remove-script-goal" data-index="${index}" aria-label="Remove goal">&times;</button>
              </div>
            `).join("") || `<p class="custom-goal-empty">Add a goal only when you need an exact scorer or minute.</p>`}
          </div>
        </div>
        <div class="custom-script-actions">
          <button class="secondary-button" type="button" data-custom-action="delete-script">Reset match</button>
          <button class="primary-button" type="submit">Save changes</button>
        </div>
        <p class="custom-form-message" id="customScriptMessage" aria-live="polite"></p>
      </form>
      </section>
    </div>
  `;
}

function renderCustomTournamentSetup() {
  if (!els.customTournamentBody) return;
  const selectedCount = customTournamentSetup.selectedIds.filter(Boolean).length;
  const activeTournament = isValidCustomTournamentState(state) && state.customTournament?.customMatch !== true && state.started;
  const selectedTeams = customTournamentSetup.selectedIds.map(customSetupTeam).filter(Boolean);
  const managedTeamId = selectedTeams.some((team) => team.id === customTournamentSetup.managedTeamId)
    ? customTournamentSetup.managedTeamId
    : "";
  if (els.customHeaderTeamCount) els.customHeaderTeamCount.textContent = `${selectedCount}/${customTournamentSetup.teamCount} teams`;
  if (els.customHeaderStartButton) {
    els.customHeaderStartButton.disabled = !activeTournament && selectedCount !== customTournamentSetup.teamCount;
    els.customHeaderStartButton.innerHTML = activeTournament
      ? 'Return to tournament <span aria-hidden="true">&rarr;</span>'
      : 'Start tournament <span aria-hidden="true">&rarr;</span>';
  }
  els.customTournamentBody.innerHTML = `
    <section class="custom-config-bar">
      <div class="custom-config-group"><span>Teams</span><div class="custom-segmented custom-team-count-control">${CUSTOM_TOURNAMENT_TEAM_COUNTS.map((count) => `<button type="button" data-custom-action="team-count" data-count="${count}" class="${count === customTournamentSetup.teamCount ? "active" : ""}">${count}</button>`).join("")}</div></div>
      <div class="custom-config-group custom-format-config">
        <span>Format</span>
        <div class="custom-segmented"><button type="button" data-custom-action="structure" data-structure="knockout" class="${customTournamentSetup.structure === "knockout" ? "active" : ""}" ${customTournamentRequiresGroups(customTournamentSetup.teamCount) ? `disabled title="${customTournamentSetup.teamCount}-team tournaments use a group stage"` : ""}>Knockout</button><button type="button" data-custom-action="structure" data-structure="groups" class="${customTournamentSetup.structure === "groups" ? "active" : ""}">${customTournamentSetup.teamCount === 24 ? "Euros format" : customTournamentSetup.teamCount === 48 ? "World Cup format" : "Groups"}</button></div>
        <button class="custom-third-place-toggle ${customTournamentSetup.thirdPlace ? "active" : ""}" type="button" data-custom-action="third-place" aria-pressed="${customTournamentSetup.thirdPlace}">
          <i aria-hidden="true"></i>
          <span>Third-place play-off</span>
        </button>
      </div>
      <div class="custom-config-group custom-manager-control">
        <span>Team to manage</span>
        <button type="button" data-custom-action="open-manager-picker" ${selectedTeams.length ? "" : "disabled"}>
          ${managedTeamId
            ? `${flagMarkup(customSetupTeam(managedTeamId), "custom-manager-button-flag")}<span><strong>${escapeHtml(customTeamDisplayName(customSetupTeam(managedTeamId)))}</strong><small>Managing this team</small></span>`
            : `<span class="custom-manager-neutral" aria-hidden="true">N</span><span><strong>${selectedTeams.length ? "Choose team" : "Add teams first"}</strong><small>${selectedTeams.length ? "Or remain neutral" : "Fill tournament slots to continue"}</small></span>`}
          <i aria-hidden="true">&rsaquo;</i>
        </button>
      </div>
      <details class="custom-setup-more">
        <summary>Match settings</summary>
        <div>
          <div class="custom-config-group"><span>Match type</span><div class="custom-segmented"><button type="button" data-custom-action="format" data-format="full" class="${customTournamentSetup.format === "full" ? "active" : ""}">Full match</button><button type="button" data-custom-action="format" data-format="penalties" class="${customTournamentSetup.format === "penalties" ? "active" : ""}" ${customTournamentSetup.structure === "groups" ? "disabled title=\"Penalty-only tournaments use knockout format\"" : ""}>Penalties only</button></div></div>
          <div class="custom-config-group"><span>Sim style</span><div class="custom-segmented"><button type="button" data-custom-action="sim-style" data-value="realistic" class="${customTournamentSetup.upset === "realistic" ? "active" : ""}">Realistic</button><button type="button" data-custom-action="sim-style" data-value="balanced" class="${customTournamentSetup.upset === "balanced" ? "active" : ""}">Standard</button><button type="button" data-custom-action="sim-style" data-value="chaos" class="${customTournamentSetup.upset === "chaos" ? "active" : ""}">Pure chaos</button></div></div>
          <div class="custom-config-group"><span>Goal level</span><div class="custom-segmented"><button type="button" data-custom-action="goal-level" data-value="tight" class="${customTournamentSetup.goals === "tight" ? "active" : ""}">Tight</button><button type="button" data-custom-action="goal-level" data-value="normal" class="${customTournamentSetup.goals === "normal" ? "active" : ""}">Normal</button><button type="button" data-custom-action="goal-level" data-value="wild" class="${customTournamentSetup.goals === "wild" ? "active" : ""}">Goal fest</button></div></div>
        </div>
      </details>
    </section>
    <div class="custom-builder-view">${customBracketPanelMarkup()}</div>
  `;
  bindCustomTournamentSetup();
}

function customGoalRowsFromForm() {
  return [...els.customTournamentBody.querySelectorAll(".custom-goal-row")].map((row) => ({
    side: row.querySelector("[data-goal-side]").value,
    minute: simulationClamp(Number(row.querySelector("[data-goal-minute]").value) || 1, 1, 120),
    scorer: row.querySelector("[data-goal-scorer]").value.trim(),
  }));
}

function bindCustomTournamentSetup(body = els.customTournamentBody) {
  body.querySelectorAll("[data-custom-team-field], [data-custom-team-rating], [data-custom-player-field]").forEach((input) => {
    const numericRating = Boolean(input.dataset.customTeamRating)
      || (Boolean(input.dataset.customPlayerField) && !["name", "position", "penaltyTaker", "startingXI"].includes(input.dataset.customPlayerField));
    if (numericRating) {
      input.addEventListener("focus", () => {
        if (input.dataset.customTeamRating === "overall") {
          input.customLinkedRatingsBaseline = { ...customTournamentUi.customTeamDraft?.simulationRatings };
        } else if (input.dataset.customPlayerField === "overall") {
          input.customLinkedRatingsBaseline = { ...customTournamentUi.customTeamDraft?.playerProfiles?.[Number(input.dataset.customPlayerIndex)] };
        }
      });
      input.addEventListener("input", () => {
        if (input.value !== "") syncCustomTeamDraftFromInput(input);
      });
      input.addEventListener("change", () => {
        syncCustomTeamDraftFromInput(input);
        delete input.customLinkedRatingsBaseline;
      });
    } else {
      input.addEventListener("input", () => syncCustomTeamDraftFromInput(input));
      input.addEventListener("change", () => syncCustomTeamDraftFromInput(input));
    }
  });
  body.querySelector("#customTeamFlagFile")?.addEventListener("change", async (event) => {
    try {
      const croppedFlag = await customFlagDataUrl(event.target.files?.[0]);
      customTournamentUi.customTeamDraft.customFlag = croppedFlag.dataUrl;
      customTournamentUi.customTeamDraft.customFlagShape = croppedFlag.shape;
      renderCustomTeamCreatorContext();
    } catch (error) {
      if (error?.name !== "AbortError") showToast(error.message || "The flag image could not be uploaded.");
    }
  });
  body.querySelector("#customTeamCreatorForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.querySelectorAll("[data-custom-team-field], [data-custom-team-rating], [data-custom-player-field]").forEach(syncCustomTeamDraftFromInput);
    customTournamentUi.customTeamDraft.saveToAccount = Boolean(event.currentTarget.querySelector("#customTeamSaveToAccount")?.checked);
    void saveCustomTeamDraft();
  });
  body.querySelector("#customQuickFill")?.addEventListener("change", (event) => {
    customTournamentUi.quickFillPreset = event.target.value;
  });
  body.querySelector("#customManagedTeam")?.addEventListener("change", (event) => {
    customTournamentSetup.managedTeamId = customTournamentSetup.selectedIds.includes(event.target.value)
      ? event.target.value
      : null;
    saveCustomTournamentSetup();
  });
  body.querySelector("#customSourceFilter")?.addEventListener("change", (event) => {
    customTournamentSetup.sourceFilter = event.target.value;
    customTournamentUi.search = "";
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
  });
  body.querySelector("#customPickerSourceFilter")?.addEventListener("change", (event) => {
    customTournamentSetup.sourceFilter = event.target.value;
    customTournamentUi.search = "";
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
  });
  body.querySelector("#customTeamSearch")?.addEventListener("input", (event) => {
    customTournamentUi.search = event.target.value;
    renderCustomTournamentSetup();
    const search = body.querySelector("#customTeamSearch");
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
  });
  body.querySelector("#customPickerTeamSearch")?.addEventListener("input", (event) => {
    customTournamentUi.search = event.target.value;
    renderCustomTournamentSetup();
    const search = body.querySelector("#customPickerTeamSearch");
    search?.focus();
    search?.setSelectionRange(search.value.length, search.value.length);
  });
  body.querySelector("#customScriptRound")?.addEventListener("change", (event) => {
    customTournamentUi.scriptRound = Number(event.target.value);
    customTournamentUi.scriptMatch = 0;
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    renderCustomTournamentSetup();
  });
  body.querySelector("#customScriptMatch")?.addEventListener("change", (event) => {
    customTournamentUi.scriptMatch = Number(event.target.value);
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    renderCustomTournamentSetup();
  });
  body.querySelector("#customScriptFixedResult")?.addEventListener("change", (event) => {
    const fields = body.querySelector(".custom-fixed-result-fields");
    if (fields) fields.hidden = !event.target.checked;
  });
  body.querySelector("#customScriptShootoutChance")?.addEventListener("input", (event) => {
    const output = body.querySelector("#customShootoutChanceValue");
    if (output) output.textContent = `${event.target.value}%`;
  });
  body.querySelectorAll("[data-goal-side]").forEach((sideSelect) => {
    sideSelect.addEventListener("change", () => {
      const scorerSelect = sideSelect.closest(".custom-goal-row")?.querySelector("[data-goal-scorer]");
      if (!scorerSelect) return;
      const team = customEditorMatchTeams(customTournamentUi.scriptRound, customTournamentUi.scriptMatch)[sideSelect.value];
      const names = team ? playerProfilesForTeam(team).map((player) => player.name) : [];
      scorerSelect.replaceChildren(new Option("Choose scorer", ""));
      names.forEach((name) => scorerSelect.add(new Option(name, name)));
    });
  });
  body.querySelectorAll("[data-custom-rating]").forEach((input) => {
    input.addEventListener("change", () => {
      const value = simulationClamp(Number(input.value) || 1, 1, 99);
      const teamId = input.dataset.teamId;
      customTournamentSetup.abilityOverrides[teamId] ||= {};
      customTournamentSetup.abilityOverrides[teamId][input.dataset.customRating] = value;
      input.value = value;
      clearPlayerProfileCacheForTeam(teamId);
      saveCustomTournamentSetup();
    });
  });
  body.querySelector("#customScriptForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const fixed = Boolean(body.querySelector("#customScriptFixedResult")?.checked);
    const minGoals = simulationClamp(Number(body.querySelector("#customScriptMinGoals")?.value) || 0, 0, 20);
    const shootoutChance = simulationClamp(Number(body.querySelector("#customScriptShootoutChance")?.value) || 0, 0, 100);
    const homeGoals = simulationClamp(Number(body.querySelector("#customScriptHomeScore").value) || 0, 0, 20);
    const awayGoals = simulationClamp(Number(body.querySelector("#customScriptAwayScore").value) || 0, 0, 20);
    const goals = fixed ? customGoalRowsFromForm() : [];
    const namedHome = goals.filter((goal) => goal.side === "home").length;
    const namedAway = goals.filter((goal) => goal.side === "away").length;
    const message = body.querySelector("#customScriptMessage");
    if (fixed && (namedHome > homeGoals || namedAway > awayGoals)) {
      message.textContent = "There are more goal events than the chosen score.";
      message.classList.add("is-error");
      return;
    }
    if (!fixed && minGoals === 0 && shootoutChance === 0) {
      delete customTournamentSetup.scripts[customScriptKey()];
    } else {
      customTournamentSetup.scripts[customScriptKey()] = {
        mode: fixed ? "fixed" : "rules",
        minGoals,
        shootoutChance,
        homeGoals,
        awayGoals,
        winnerSide: body.querySelector("#customScriptWinner")?.value || "home",
        goals,
      };
    }
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    customTournamentUi.matchEditorOpen = false;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    showToast("Match rules saved.");
  });
  body.querySelectorAll("[data-custom-action]").forEach((button) => {
    button.addEventListener("click", () => handleCustomTournamentAction(button));
  });
}

function handleCustomTournamentAction(button) {
  const action = button.dataset.customAction;
  if (action === "open-team-creator") {
    customTournamentUi.teamCreatorOpen = true;
    customTournamentUi.editingCustomTeamId = null;
    customTournamentUi.customTeamDraft = newCustomTeamDraft();
    customTournamentUi.teamCreatorReturnMode = null;
    customTournamentUi.teamCreatorReturnSide = null;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "edit-custom-team") {
    const team = customTeamLibrary.find((item) => item.id === button.dataset.teamId);
    if (!team) return;
    customTournamentUi.teamCreatorOpen = true;
    customTournamentUi.editingCustomTeamId = team.id;
    customTournamentUi.customTeamDraft = newCustomTeamDraft(team);
    customTournamentUi.teamCreatorReturnMode = null;
    customTournamentUi.teamCreatorReturnSide = null;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "delete-custom-team") {
    void deleteCustomTeam(customTournamentUi.editingCustomTeamId);
    return;
  }
  if (action === "close-team-creator") {
    const returnMode = customTournamentUi.teamCreatorReturnMode;
    customTournamentUi.teamCreatorOpen = false;
    customTournamentUi.editingCustomTeamId = null;
    customTournamentUi.customTeamDraft = null;
    customTournamentUi.teamCreatorReturnMode = null;
    customTournamentUi.teamCreatorReturnSide = null;
    if (returnMode === "customMatch") {
      customMatchSetupViewOpen = true;
      setAppModeUrl("customMatch");
      render();
      return;
    }
    renderCustomTournamentSetup();
    return;
  }
  if (action === "add-custom-player") {
    customTeamCreatorContainer()?.querySelectorAll("[data-custom-team-field], [data-custom-team-rating], [data-custom-player-field]").forEach(syncCustomTeamDraftFromInput);
    const index = customTournamentUi.customTeamDraft.playerProfiles.length;
    customTournamentUi.customTeamDraft.playerProfiles.push(sanitizeCustomPlayer({ name: `Player ${index + 1}`, position: "CM", overall: 75, startingXI: false }, index));
    renderCustomTeamCreatorContext();
    return;
  }
  if (action === "auto-pick-custom-xi") {
    customTeamCreatorContainer()?.querySelectorAll("[data-custom-team-field], [data-custom-team-rating], [data-custom-player-field]").forEach(syncCustomTeamDraftFromInput);
    customTournamentUi.customTeamDraft.playerProfiles = customPlayersWithValidStartingXI(
      customTournamentUi.customTeamDraft.playerProfiles.map((player) => ({ ...player, startingXI: false })),
    );
    renderCustomTeamCreatorContext();
    return;
  }
  if (action === "remove-custom-player") {
    customTeamCreatorContainer()?.querySelectorAll("[data-custom-team-field], [data-custom-team-rating], [data-custom-player-field]").forEach(syncCustomTeamDraftFromInput);
    if (customTournamentUi.customTeamDraft.playerProfiles.length > 11) customTournamentUi.customTeamDraft.playerProfiles.splice(Number(button.dataset.index), 1);
    renderCustomTeamCreatorContext();
    return;
  }
  if (action === "tab") {
    customTournamentUi.tab = button.dataset.tab;
    customTournamentUi.matchEditorOpen = false;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "team-count") return setCustomTeamCount(Number(button.dataset.count));
  if (action === "structure") {
    if (customTournamentRequiresGroups(customTournamentSetup.teamCount) && button.dataset.structure !== "groups") {
      showToast(customTournamentSetup.teamCount === 24
        ? "The 24-team option uses the Euros group format."
        : "The 48-team option uses the World Cup group format.");
      return;
    }
    customTournamentSetup.structure = button.dataset.structure === "groups" ? "groups" : "knockout";
    if (customTournamentSetup.structure === "groups") customTournamentSetup.format = "full";
    customTournamentSetup.scripts = {};
    customTournamentUi.scriptRound = 0;
    customTournamentUi.scriptMatch = customTournamentSetup.structure === "knockout" && customTournamentSetup.teamCount === 24 ? 1 : 0;
    customTournamentUi.matchEditorOpen = false;
    customTournamentUi.ratingEditorOpen = false;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "source-filter") {
    customTournamentSetup.sourceFilter = button.dataset.source;
    customTournamentUi.search = "";
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "format") {
    customTournamentSetup.format = button.dataset.format;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "third-place") {
    customTournamentSetup.thirdPlace = !customTournamentSetup.thirdPlace;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "sim-style") {
    customTournamentSetup.upset = SIMULATION_CONFIG.modes[button.dataset.value] ? button.dataset.value : "balanced";
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "goal-level") {
    customTournamentSetup.goals = SIMULATION_CONFIG.goals[button.dataset.value] ? button.dataset.value : "normal";
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "apply-quick-fill") {
    const preset = els.customTournamentBody.querySelector("#customQuickFill")?.value || "top";
    customTournamentUi.quickFillPreset = preset;
    if (preset === "top" || preset === "random") {
      const sourcePool = customTeamSourcePool();
      if (sourcePool.length < customTournamentSetup.teamCount) {
        showToast(`This team source only has ${sourcePool.length} teams. Choose a smaller field.`);
        return;
      }
      const selectedTeams = preset === "random"
        ? shuffle(sourcePool, Math.random).slice(0, customTournamentSetup.teamCount)
        : sourcePool.slice(0, customTournamentSetup.teamCount);
      customTournamentSetup.selectedIds = shuffle(selectedTeams, Math.random).map((team) => team.id);
      customTournamentSetup.managedTeamId = null;
      customTournamentSetup.scripts = {};
      customTournamentUi.targetIndex = null;
      customTournamentUi.matchEditorOpen = false;
      customTournamentUi.ratingEditorOpen = false;
      saveCustomTournamentSetup();
      renderCustomTournamentSetup();
      return;
    }
    const pool = customPresetPool(preset).sort((left, right) => (
      (right.simulationRatings?.overall ?? right.rating) - (left.simulationRatings?.overall ?? left.rating)
    ));
    if (pool.length < customTournamentSetup.teamCount) {
      showToast(`That preset has ${pool.length} teams. Choose a field of ${pool.length} teams or fewer.`);
      return;
    }
    customTournamentSetup.sourceFilter = "current";
    customTournamentSetup.selectedIds = shuffle(
      pool.slice(0, customTournamentSetup.teamCount),
      Math.random,
    ).map((team) => team.id);
    customTournamentSetup.managedTeamId = null;
    customTournamentSetup.scripts = {};
    customTournamentUi.targetIndex = null;
    customTournamentUi.matchEditorOpen = false;
    customTournamentUi.ratingEditorOpen = false;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "randomise-groups") {
    if (customTournamentSetup.structure !== "groups") return;
    const selectedCount = customTournamentSetup.selectedIds.filter(Boolean).length;
    if (selectedCount < 2) {
      showToast("Add at least two teams before randomising the groups.");
      return;
    }
    customTournamentSetup.selectedIds = randomisedCustomGroupSlots(customTournamentSetup.selectedIds);
    customTournamentSetup.scripts = {};
    customTournamentUi.targetIndex = null;
    customTournamentUi.matchEditorOpen = false;
    customTournamentUi.ratingEditorOpen = false;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    showToast("Groups randomised.");
    return;
  }
  if (action === "fill-top" || action === "fill-random") {
    const sourcePool = customTeamSourcePool();
    if (sourcePool.length < customTournamentSetup.teamCount) {
      showToast(`This team source only has ${sourcePool.length} teams. Choose a smaller field or mix teams manually.`);
      return;
    }
    const pool = action === "fill-random" ? shuffle([...sourcePool], mulberry32(Date.now() % 2147483647)) : [...sourcePool];
    customTournamentSetup.selectedIds = pool.slice(0, customTournamentSetup.teamCount).map((team) => team.id);
    if (!customTournamentSetup.selectedIds.includes(customTournamentSetup.managedTeamId)) {
      customTournamentSetup.managedTeamId = null;
    }
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "clear-field") {
    customTournamentSetup.selectedIds = Array(customTournamentSetup.teamCount).fill(null);
    customTournamentSetup.managedTeamId = null;
    customTournamentSetup.scripts = {};
    customTournamentUi.targetIndex = 0;
    customTournamentUi.matchEditorOpen = false;
    customTournamentUi.ratingEditorOpen = false;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "target-slot") {
    customTournamentUi.targetIndex = Number(button.dataset.index);
    customTournamentUi.search = "";
    renderCustomTournamentSetup();
    return;
  }
  if (action === "close-team-picker") {
    customTournamentUi.targetIndex = null;
    customTournamentUi.search = "";
    renderCustomTournamentSetup();
    return;
  }
  if (action === "open-manager-picker") {
    customTournamentUi.managerPickerOpen = true;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "close-manager-picker") {
    customTournamentUi.managerPickerOpen = false;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "select-manager-team") {
    customTournamentSetup.managedTeamId = customTournamentSetup.selectedIds.includes(button.dataset.teamId)
      ? button.dataset.teamId
      : null;
    customTournamentUi.managerPickerOpen = false;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "add-team") {
    const index = customTournamentUi.targetIndex ?? customFirstEmptyIndex();
    if (index < 0) return showToast("Every tournament slot is full.");
    customTournamentSetup.selectedIds[index] = button.dataset.teamId;
    customTournamentUi.targetIndex = null;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "remove-slot") {
    const index = Number(button.dataset.index);
    if (customTournamentSetup.selectedIds[index] === customTournamentUi.ratingTeamId) {
      customTournamentUi.ratingEditorOpen = false;
    }
    if (customTournamentSetup.selectedIds[index] === customTournamentSetup.managedTeamId) {
      customTournamentSetup.managedTeamId = null;
    }
    customTournamentSetup.selectedIds[index] = null;
    customTournamentUi.targetIndex = null;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "move-slot") {
    const index = Number(button.dataset.index);
    const next = index + Number(button.dataset.offset);
    const sectionSize = customTournamentSetup.structure === "groups" ? 4 : customTournamentSetup.teamCount / 2;
    if (next < Math.floor(index / sectionSize) * sectionSize || next >= (Math.floor(index / sectionSize) + 1) * sectionSize) return;
    [customTournamentSetup.selectedIds[index], customTournamentSetup.selectedIds[next]] = [customTournamentSetup.selectedIds[next], customTournamentSetup.selectedIds[index]];
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "select-rating-team") {
    customTournamentUi.ratingTeamId = button.dataset.teamId;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "open-match-rules") {
    customTournamentUi.scriptRound = Number(button.dataset.round);
    customTournamentUi.scriptMatch = Number(button.dataset.match);
    customTournamentUi.matchEditorOpen = true;
    customTournamentUi.ratingEditorOpen = false;
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "close-match-rules") {
    customTournamentUi.matchEditorOpen = false;
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "open-team-editor") {
    customTournamentUi.ratingTeamId = button.dataset.teamId;
    customTournamentUi.ratingEditorOpen = true;
    customTournamentUi.matchEditorOpen = false;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "close-team-editor") {
    customTournamentUi.ratingEditorOpen = false;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "reset-ratings") {
    delete customTournamentSetup.abilityOverrides[button.dataset.teamId];
    clearPlayerProfileCacheForTeam(button.dataset.teamId);
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "add-script-goal") {
    const key = customScriptKey();
    const current = {
      mode: "fixed",
      minGoals: Number(els.customTournamentBody.querySelector("#customScriptMinGoals")?.value) || 0,
      shootoutChance: Number(els.customTournamentBody.querySelector("#customScriptShootoutChance")?.value) || 0,
      homeGoals: Number(els.customTournamentBody.querySelector("#customScriptHomeScore")?.value) || 1,
      awayGoals: Number(els.customTournamentBody.querySelector("#customScriptAwayScore")?.value) || 0,
      winnerSide: els.customTournamentBody.querySelector("#customScriptWinner")?.value || "home",
      goals: customGoalRowsFromForm(),
    };
    current.goals.push({ side: "home", minute: 1, scorer: "" });
    customTournamentUi.scriptDraftKey = key;
    customTournamentUi.scriptDraft = current;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "remove-script-goal") {
    const key = customScriptKey();
    const current = {
      mode: "fixed",
      minGoals: Number(els.customTournamentBody.querySelector("#customScriptMinGoals")?.value) || 0,
      shootoutChance: Number(els.customTournamentBody.querySelector("#customScriptShootoutChance")?.value) || 0,
      homeGoals: Number(els.customTournamentBody.querySelector("#customScriptHomeScore")?.value) || 0,
      awayGoals: Number(els.customTournamentBody.querySelector("#customScriptAwayScore")?.value) || 0,
      winnerSide: els.customTournamentBody.querySelector("#customScriptWinner")?.value || "home",
      goals: customGoalRowsFromForm(),
    };
    current.goals.splice(Number(button.dataset.index), 1);
    customTournamentUi.scriptDraftKey = key;
    customTournamentUi.scriptDraft = current;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "toggle-scorer-picker") {
    const menu = button.parentElement?.querySelector(".custom-scorer-menu");
    if (!menu) return;
    els.customTournamentBody.querySelectorAll(".custom-scorer-menu").forEach((candidate) => {
      if (candidate !== menu) candidate.hidden = true;
    });
    menu.hidden = !menu.hidden;
    button.setAttribute("aria-expanded", String(!menu.hidden));
    return;
  }
  if (action === "select-goal-scorer") {
    const row = button.closest(".custom-goal-row");
    const picker = button.closest(".custom-scorer-picker");
    const scorerInput = picker?.querySelector("[data-goal-scorer]");
    const scorerLabel = picker?.querySelector(":scope > button span");
    const sideSelect = row?.querySelector("[data-goal-side]");
    if (scorerInput) scorerInput.value = button.dataset.player || "";
    if (scorerLabel) scorerLabel.textContent = button.dataset.player || "Choose scorer";
    if (sideSelect && ["home", "away"].includes(button.dataset.side)) sideSelect.value = button.dataset.side;
    const menu = picker?.querySelector(".custom-scorer-menu");
    if (menu) menu.hidden = true;
    picker?.querySelector(":scope > button")?.setAttribute("aria-expanded", "false");
    return;
  }
  if (action === "delete-script") {
    delete customTournamentSetup.scripts[customScriptKey()];
    customTournamentUi.matchEditorOpen = false;
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    saveCustomTournamentSetup();
    renderCustomTournamentSetup();
    return;
  }
  if (action === "open-script") {
    customTournamentUi.scriptRound = Number(button.dataset.round);
    customTournamentUi.scriptMatch = Number(button.dataset.match);
    customTournamentUi.scriptDraftKey = null;
    customTournamentUi.scriptDraft = null;
    renderCustomTournamentSetup();
    return;
  }
  if (action === "start-custom") handleCustomTournamentStartAction();
}

function createCustomGroupRound(selectedIds) {
  const fixtures = customGroupFixturePairs();
  const matches = [];
  for (let groupIndex = 0; groupIndex < selectedIds.length / 4; groupIndex += 1) {
    const groupTeams = selectedIds.slice(groupIndex * 4, groupIndex * 4 + 4);
    fixtures.forEach(([homeIndex, awayIndex], fixtureIndex) => {
      matches.push({
        id: `r0-m${matches.length}`,
        homeId: groupTeams[homeIndex],
        awayId: groupTeams[awayIndex],
        allowDraw: true,
        customGroupIndex: groupIndex,
        customGroupLabel: customGroupLabel(groupIndex),
        customGroupFixture: fixtureIndex + 1,
        result: null,
      });
    });
  }
  return matches;
}

function customGroupStandings(groupIndex, round = state.rounds[0] || []) {
  const groupMatches = round.filter((match) => match.customGroupIndex === groupIndex);
  const teamIds = [...new Set(groupMatches.flatMap((match) => [match.homeId, match.awayId]))];
  const rows = new Map(teamIds.map((teamId) => [teamId, {
    teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
  }]));
  groupMatches.forEach((match) => {
    if (!match.result?.revealed) return;
    const home = rows.get(match.homeId);
    const away = rows.get(match.awayId);
    home.played += 1;
    away.played += 1;
    home.gf += match.result.homeGoals;
    home.ga += match.result.awayGoals;
    away.gf += match.result.awayGoals;
    away.ga += match.result.homeGoals;
    if (match.result.homeGoals > match.result.awayGoals) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.result.awayGoals > match.result.homeGoals) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  });
  return [...rows.values()].map((row) => ({ ...row, gd: row.gf - row.ga, groupIndex }))
    .sort((left, right) => (
      right.points - left.points
      || right.gd - left.gd
      || right.gf - left.gf
      || teamSimulationRatings(teamById(right.teamId)).overall - teamSimulationRatings(teamById(left.teamId)).overall
      || teamById(left.teamId).name.localeCompare(teamById(right.teamId).name)
    ));
}

function customGroupQualifiers() {
  const groupCount = state.customTournament.teamCount / 4;
  const tables = Array.from({ length: groupCount }, (_, groupIndex) => customGroupStandings(groupIndex));
  const qualifiers = tables.flatMap((table) => table.slice(0, 2).map((row, position) => ({ ...row, position })));
  if ([24, 48].includes(state.customTournament.teamCount)) {
    const bestThirdPlaceCount = customGroupQualifierCount(state.customTournament.teamCount) - groupCount * 2;
    qualifiers.push(...tables
      .map((table) => ({ ...table[2], position: 2 }))
      .sort((left, right) => right.points - left.points || right.gd - left.gd || right.gf - left.gf)
      .slice(0, bestThirdPlaceCount));
  }
  return qualifiers.sort((left, right) => (
    left.position - right.position
    || right.points - left.points
    || right.gd - left.gd
    || right.gf - left.gf
  ));
}

function customEuroKnockoutPairings(tables) {
  const thirdPlaceTeams = customGroupQualifiers().filter((entry) => entry.position === 2);
  const winnerGroups = [3, 1, 2, 0];
  const assignThirdPlaceTeams = (winnerIndex, available, assigned = []) => {
    if (winnerIndex >= winnerGroups.length) return assigned;
    const winnerGroup = winnerGroups[winnerIndex];
    for (let index = 0; index < available.length; index += 1) {
      if (available[index].groupIndex === winnerGroup) continue;
      const result = assignThirdPlaceTeams(
        winnerIndex + 1,
        available.filter((_, candidateIndex) => candidateIndex !== index),
        [...assigned, available[index]],
      );
      if (result) return result;
    }
    return null;
  };
  const assignedThirds = assignThirdPlaceTeams(0, thirdPlaceTeams) || thirdPlaceTeams;
  const thirdPlacePairings = winnerGroups.map((groupIndex, index) => [
    tables[groupIndex][0],
    assignedThirds[index],
  ]);
  return [
    [tables[0][1], tables[2][1]],
    thirdPlacePairings[0],
    thirdPlacePairings[1],
    [tables[5][0], tables[4][1]],
    thirdPlacePairings[2],
    [tables[4][0], tables[3][1]],
    thirdPlacePairings[3],
    [tables[1][1], tables[5][1]],
  ];
}

function customWorldCup48KnockoutPairings(tables) {
  const thirdPlaceTeams = customGroupQualifiers().filter((entry) => entry.position === 2);
  const winnersFacingThirds = tables.slice(0, 8).map((table) => table[0]);
  const assignThirdPlaceTeams = (winnerIndex, available, assigned = []) => {
    if (winnerIndex >= winnersFacingThirds.length) return assigned;
    const winner = winnersFacingThirds[winnerIndex];
    for (let index = 0; index < available.length; index += 1) {
      if (available[index].groupIndex === winner.groupIndex) continue;
      const result = assignThirdPlaceTeams(
        winnerIndex + 1,
        available.filter((_, candidateIndex) => candidateIndex !== index),
        [...assigned, available[index]],
      );
      if (result) return result;
    }
    return null;
  };
  const assignedThirds = assignThirdPlaceTeams(0, thirdPlaceTeams) || thirdPlaceTeams;
  const winnerThirdPairings = winnersFacingThirds.map((winner, index) => [winner, assignedThirds[index]]);
  const remainingWinnerPairings = tables.slice(8, 12).map((table, index) => [table[0], tables[index][1]]);
  const remainingRunners = tables.slice(4, 12).map((table) => table[1]);
  const runnerPairings = [];
  for (let index = 0; index < remainingRunners.length; index += 2) {
    runnerPairings.push([remainingRunners[index], remainingRunners[index + 1]]);
  }
  return [...winnerThirdPairings, ...remainingWinnerPairings, ...runnerPairings];
}

function customStandardGroupKnockoutPairings(tables) {
  const firstHalf = [];
  const secondHalf = [];
  for (let groupIndex = 0; groupIndex < tables.length; groupIndex += 2) {
    firstHalf.push([tables[groupIndex][0], tables[groupIndex + 1][1]]);
    secondHalf.push([tables[groupIndex + 1][0], tables[groupIndex][1]]);
  }
  return [...firstHalf, ...secondHalf];
}

function customGroupKnockoutRound() {
  const groupCount = state.customTournament.teamCount / 4;
  const tables = Array.from({ length: groupCount }, (_, groupIndex) => customGroupStandings(groupIndex));
  const pairings = state.customTournament.teamCount === 24
    ? customEuroKnockoutPairings(tables)
    : state.customTournament.teamCount === 48
      ? customWorldCup48KnockoutPairings(tables)
      : customStandardGroupKnockoutPairings(tables);
  return pairings.map(([home, away], index) => ({
    id: `r1-m${index}`,
    homeId: home.teamId,
    awayId: away.teamId,
    result: null,
  }));
}

function createCustomTournamentState() {
  const drawSeed = Date.now() % 2147483647;
  const selectedIds = customTournamentSetup.selectedIds.filter(Boolean);
  const managedTeamId = selectedIds.includes(customTournamentSetup.managedTeamId)
    ? customTournamentSetup.managedTeamId
    : null;
  const firstRound = [];
  if (customTournamentSetup.structure === "groups") {
    firstRound.push(...createCustomGroupRound(selectedIds));
  } else {
    customOpeningMatchDefinitions().forEach((definition, index) => {
      const homeId = selectedIds[definition.homeIndex];
      if (definition.bye) {
        firstRound.push({
          id: `r0-m${index}`,
          homeId,
          awayId: null,
          result: {
            homeGoals: 0,
            awayGoals: 0,
            regulationHome: 0,
            regulationAway: 0,
            extraTime: false,
            penalties: null,
            shootout: null,
            winnerId: homeId,
            homeEvents: [],
            awayEvents: [],
            redCards: [],
            suspendedPlayers: { home: [], away: [] },
            shock: false,
            tacticalMatchup: null,
            expectedGoals: { home: 0, away: 0, homeFatigue: 1, awayFatigue: 1 },
            bye: true,
            revealed: true,
          },
        });
        return;
      }
      firstRound.push({
        id: `r0-m${index}`,
        homeId,
        awayId: selectedIds[definition.awayIndex],
        result: null,
      });
    });
  }
  const managedOpeningIndex = managedTeamId
    ? firstRound.findIndex((match) => !match.result && [match.homeId, match.awayId].includes(managedTeamId))
    : -1;
  const firstUnplayedIndex = firstRound.findIndex((match) => !match.result);
  return {
    version: STATE_VERSION,
    drawSeed,
    settings: normalizeSettings({
      ...state?.settings,
      upset: customTournamentSetup.upset,
      goals: customTournamentSetup.goals,
    }),
    rounds: [firstRound],
    activeRound: 0,
    selectedMatch: managedOpeningIndex >= 0 ? managedOpeningIndex : Math.max(0, firstUnplayedIndex),
    championView: false,
    started: true,
    predictionTeamId: null,
    spectateTeamId: managedTeamId,
    neutralView: !managedTeamId,
    standardTactic: "balanced",
    customTournament: {
      active: true,
      teamCount: customTournamentSetup.teamCount,
      structure: customTournamentSetup.structure,
      thirdPlace: customTournamentSetup.thirdPlace === true,
      thirdPlaceAllFormatsVersion: 1,
      format: customTournamentSetup.format,
      upset: customTournamentSetup.upset,
      goals: customTournamentSetup.goals,
      abilityOverrides: structuredClone(customTournamentSetup.abilityOverrides),
      scripts: structuredClone(customTournamentSetup.scripts),
    },
  };
}

function startCustomTournament() {
  const selectedIds = customTournamentSetup.selectedIds.filter(Boolean);
  if (selectedIds.length !== customTournamentSetup.teamCount || new Set(selectedIds).size !== customTournamentSetup.teamCount) {
    showToast("Fill every bracket slot with a different team first.");
    return;
  }
  stopStandardPlaybackForNavigation();
  if (isDefaultKnockoutState(state)) defaultKnockoutState = state;
  customTournamentSetupViewOpen = false;
  state = createCustomTournamentState();
  customTournamentState = state;
  standardTournamentState = state;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  teamFilterId = null;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast(`${customTournamentSetup.teamCount}-team custom tournament is ready.`);
}

function handleCustomTournamentStartAction() {
  if (isValidCustomTournamentState(state) && state.customTournament?.customMatch !== true && state.started) {
    stopStandardPlaybackForNavigation();
    customTournamentSetupViewOpen = false;
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Tournament resumed.");
    return;
  }
  startCustomTournament();
}
