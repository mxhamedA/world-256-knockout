# Historical retro data

Each edition has its own folder. The JavaScript files are still classic-script
runtime files and must be loaded before `retro-engine.js` in `index.html`.

| Folder | Contents |
| --- | --- |
| `1998/`, `2002/`, `2006/`, `2010/`, `2014/`, `2018/`, `2022/`, `2026/` | World Cup squads and schedules |
| `euro-2016/` | Euro 2016 squads, schedule and research dataset |

Inside a year folder:

- `squads.js` is the generated browser roster/player data.
- `schedule.js` is the generated group and knockout fixture data.
- `squad-dataset.json`, when present, is the editable research dataset.
- `clubs.generated.json`, `notes.md` and `validation.md`, when present, are
  supporting provenance and validation files.

Edit the dataset or generator source listed in
`src/web/modes/retro/README.md`, then regenerate the runtime file into the same
edition folder. Do not move a year’s files back to the repository root.
