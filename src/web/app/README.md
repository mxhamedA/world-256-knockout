# Ordered application chunks

These files are the maintainable source for the browser application. They are
classic-script chunks and must remain in numeric execution order. The bundle
builder concatenates them into the root `app.js` without changing their code.

The folders are broad ownership boundaries:

- `00-core/` — shared setup, settings, legacy draft and routing
- `01-online/` — online room and live multiplayer behavior
- `02-tournaments/` — shared tournament state, simulation and standard UI
- `03-custom/` — custom tournament and custom-match behavior
- `04-retro/` — historical tournament views, lifecycle and lineup management
- `05-ui/` — cross-mode event bindings, announcements and startup navigation

| Chunk | Responsibility |
| --- | --- |
| `01-bootstrap-and-constants.js` | Storage keys, feature flags, DOM references and shared constants |
| `02-settings-and-custom-teams.js` | Settings normalization, custom-team library and image storage |
| `03-legacy-draft-and-utilities.js` | Legacy formations, historic draft data and shared display helpers |
| `04-startup-and-routing.js` | Startup recovery, route visibility and URL mode routing |
| `05-online-lobby-and-matchmaking.js` | Online room setup, matchmaking and lobby UI |
| `06-online-live-match.js` | Online live-match state, playback and penalties |
| `07-standard-and-legacy-tournaments.js` | Audio, standard setup and legacy tournament state |
| `08-retro-state-and-team-installation.js` | Retro state, historical team IDs and squad installation |
| `09-shared-state-and-rendering-helpers.js` | Shared tournament state, team lookup, history and roster repair |
| `10-player-profiles-and-rosters.js` | Player profile construction, roster selection and lineup helpers |
| `11-match-simulation.js` | Custom rules, goals, penalties and standard match simulation |
| `12-live-match-presentation.js` | Live match playback, highlights, commentary and 2D presentation |
| `13-tournament-progression-and-standard-ui.js` | Round simulation, advancement and standard tournament rendering |
| `14-custom-tournament-and-custom-match.js` | Custom setup, team pickers, scripts and bracket construction |
| `15-main-rendering-and-retro-views.js` | Main router plus retro matches, groups and squad views |
| `16-retro-mode-lifecycle.js` | Starting, restarting and rendering retro tournaments |
| `17-announcements-and-feature-modals.js` | Feature announcements and modal actions |
| `18-online-event-bindings.js` | Online list and match-selection event handlers |
| `19-retro-lineup-bindings.js` | Retro lineup editing and lineup event handlers |
| `20-global-event-bindings.js` | Settings, reset, custom-mode and navigation event handlers |
| `21-navigation-mobile-and-startup.js` | Mobile menu, browser navigation and application bootstrap |

For a React Native port, start with chunks `08` through `16` for the tournament
domain and rendering behavior. Treat chunks `01` through `07` and `17` through
`21` as browser adapters: they contain DOM, URL, local-storage, audio and event
binding code that should be replaced with native services, not copied into RN
components.

Do not edit the generated root `app.js` directly. Run `npm run build:app` after
editing a chunk. The build preserves the classic global binding contract until
the app is intentionally migrated to modules.
