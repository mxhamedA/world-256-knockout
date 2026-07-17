# World 256

A self-contained, spoiler-safe 256-team international football knockout simulator
built for reaction videos.

## Run it

Open `index.html` in a browser. For the most reliable local experience, serve this
folder with any small static web server.

For example, if Node.js is installed:

```powershell
npx serve .
```

Then open the local address shown in the terminal.

## What is included

- 256-team single-elimination bracket across eight rounds
- 211 FIFA member associations plus 45 clearly labelled guest sides
- Rectangular country and territory flags throughout the interface
- Seeded opening draw and strength-weighted results
- Regulation, extra time and penalty shootouts
- Watchable live simulations with a running match clock
- Goals and red cards revealed at their simulated match minute
- 1×, 2× and 4× playback speeds plus skip-to-full-time
- Spoiler shield for on-camera result reveals
- Curated real-player scorer pools for prominent national teams
- Deterministic generated scorer names for the rest of the field
- One-tie and whole-round simulation controls
- Search, tournament storylines, fullscreen mode and local progress saving
- Giant-killing logic that allows even the smallest guest side to beat a favourite

This is an entertainment simulator. Team strengths and player pools are curated for
the experience and are not an official or live ranking feed.

Flag images are loaded from FlagCDN when an internet connection is available. The
interface falls back to an emoji or neutral flag mark if an image is unavailable.
