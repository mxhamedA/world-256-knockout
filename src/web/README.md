# Web application source layout

The production web app still ships `app.js` as one classic browser script. That
runtime contract is intentional: the HTML shell and the existing feature scripts
share ordered global bindings, so converting the whole app to ES modules in one
step would be unnecessarily risky.

The editable source is now split into ordered chunks under `src/web/app/`.
The numeric prefixes are execution order, not just display order. Keep them when
adding a new chunk or update `scripts/build-app-bundle.mjs` deliberately.

Edit the source chunks, then run:

```text
npm run build:app
```

`npm run build` also rebuilds the bundle before copying the production static
output to `dist/`.

The chunks are grouped by responsibility:

- bootstrap, constants, DOM references and shared setup
- settings, custom teams and legacy draft mode
- startup, routing and online mode
- standard/legacy tournament state
- retro state, team installation and historical data adapters
- shared roster/player helpers
- match simulation and live presentation
- tournament progression and standard UI
- custom tournament/custom match UI
- main rendering, retro views and lifecycle
- event bindings, mobile navigation and startup

The source chunks intentionally preserve the original code and ordering. This
is an organization boundary for humans and future ports (including React
Native), not a behavior rewrite.
