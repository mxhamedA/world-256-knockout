# Retro World Cup lookup map

Use this file as the starting point when changing one historical World Cup.
The browser runtime is still made from classic scripts, so the root data files
must remain at the root; the `src/web/app` files are the maintainable UI source.

## World Cup 2010 (South Africa)

Read these files in this order:

1. **Player data and generation**
   - `retro-2010-squad-dataset.json` — editable historical roster source.
   - `scripts/generate-retro-2010-data.mjs` — regenerates both 2010 runtime
     files from the dataset and schedule source.
   - `retro-2010-squads.js` — generated browser roster/player data.
   - `retro-2010-schedule.js` — generated group and knockout fixtures.
2. **Shared tournament engine**
   - `retro-data.js` — `RETRO_WORLD_CUPS[2010]` edition metadata and teams.
   - `retro-engine.js` — 2010 squad lookup, schedules, goalscorer pools,
     match simulation, group tables and knockout progression.
   - `simulation-engine.js` and `presentation-engine.js` — shared live match
     simulation, commentary and presentation helpers.
3. **Browser UI source**
   - `src/web/app/02-tournaments/08-retro-state-and-team-installation.js` —
     historical team installation and retro state.
   - `src/web/app/02-tournaments/09-shared-state-and-rendering-helpers.js` —
     shared lookups and roster repair.
   - `src/web/app/02-tournaments/10-player-profiles-and-rosters.js` — player
     profiles, roster selection and lineup helpers.
   - `src/web/app/02-tournaments/11-match-simulation.js` and
     `12-live-match-presentation.js` — match behavior and live UI.
   - `src/web/app/04-retro/15-main-rendering-and-retro-views.js`,
     `16-retro-mode-lifecycle.js`, and `19-retro-lineup-bindings.js` — retro
     screens, mode lifecycle, lineups and interaction handlers.
4. **2010 visual rules**
   - `src/web/styles/12-wc-2018-and-wc-2010-themes.css` — South Africa theme
     and 2010 leak guards.
   - `src/web/styles/13-retro-mobile-and-wc-2022.css` — shared retro mobile
     match panels used by the 2010 screen.

## World Cup 2014 (Brazil)

Read these files in this order:

1. **Player data and fixtures**
   - `scripts/generate-retro-2014-squads.py` — regenerates the runtime squad
     file from the local historical source inputs in `tmp/`.
   - `retro-2014-squads.js` — generated 2014 roster/player data.
   - `scripts/generate-retro-2014-schedule.mjs` — regenerates fixtures from
     the historical match CSV.
   - `retro-2014-schedule.js` — generated group and knockout fixtures.
2. **Shared tournament engine**
   - `retro-data.js` — `RETRO_WORLD_CUPS[2014]` edition metadata and teams.
   - `retro-engine.js` — 2014 squad lookup, schedules, goalscorer pools,
     match simulation, group tables and knockout progression.
   - `simulation-engine.js` and `presentation-engine.js` — shared live match
     simulation, commentary and presentation helpers.
3. **Browser UI source**
   - Use the same shared chunks listed for 2010. The 2014-specific setup and
     lineup behavior is selected by `retroTournament.year === 2014` inside
     those chunks; do not duplicate the engine for a new year.
4. **2014 visual rules**
   - `src/web/styles/04-shared-world-cup-manager.css` — shared manager base.
   - `src/web/styles/05-wc-2014-lineup-and-match-ui.css` — lineup and manager
     surfaces.
   - `src/web/styles/10-wc-2014-watercolor-and-shootout.css` — Brazil artwork,
     match and shootout presentation.
   - `src/web/styles/11-online-dashboard-and-responsive.css` — final Brazil
     2014 presentation corrections near the end of the cascade.

## Shared shell and script order

`index.html` loads the historical data files before `app.js`; preserve that
order when adding a year. `src/web/app/README.md` explains the full numbered
application chunks. After editing source chunks, run:

```powershell
npm run build:app
npm run build:styles
```

For a React Native port, copy the data/engine responsibilities above into
domain modules and replace the DOM-only chunks with native screens, state and
navigation. Do not copy `document`, `localStorage`, URL or event-listener code
as-is.
