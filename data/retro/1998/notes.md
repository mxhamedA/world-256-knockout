# France 1998 data and rating notes

## Tournament facts

- Competition: 1998 FIFA World Cup, held in France from 10 June to 12 July 1998.
- Format: 32 teams, eight groups of four, 48 group matches, Round of 16, quarter-finals, semi-finals, third-place play-off and final.
- Squad size: 22 players per country. South Africa's final 22 uses Simon Gopane as the injury replacement for Paul Evans.
- Historical country labels in the mode are preserved where practical. `USA`, `South Korea`, `Iran` and `Yugoslavia` are explicitly aliased to the main flag database (`USA`, `South Korea`, `Iran` and Serbia's flag asset respectively) without mutating other editions.

## Sources

- FIFA, [Progression of FIFA World Cup squad sizes](https://www.fifa.com/en/tournaments/mens/worldcup/articles/number-players-squad-sizes) — confirms the 22-player limit.
- FIFA, [France in stats — 1998 FIFA World Cup winners](https://www.fifa.com/en/tournaments/mens/worldcup/articles/france-1998-winners-champions-stats-statistics) — tournament context and France's pre-tournament ranking of 18th.
- James Fjelstul, [A Comprehensive Database on the FIFA World Cup](https://github.com/jfjelstul/worldcup) (CC BY-SA 4.0) — match dates, times, stadiums, host cities, squads, shirt numbers, positions, appearances, opening XIs and tournament goals.
- [1998 FIFA World Cup squads](https://en.wikipedia.org/wiki/1998_FIFA_World_Cup_squads) — tournament-time clubs, captains and replacement notes, cross-checked against the Fjelstul squad records.
- Dato-Futbol, [Historical men's FIFA ranking dataset](https://github.com/Dato-Futbol/fifa-ranking) — 20 May 1998 FIFA/Coca-Cola ranking and points.

The generated files retain source labels on every player record and are reproducible with `scripts/generate-retro-1998-data.py` after placing the cited source repositories under `tmp/`.

## Custom rating methodology

The simulator ratings are original balance values. They are not represented as official EA Sports, FIFA 98 or FIFA 99 ratings.

Team ratings use a pre-tournament blend rather than the eventual finish:

1. approximately 35% final pre-tournament FIFA ranking and recent international form;
2. approximately 40% squad quality entering June 1998, with emphasis on 1997/98 club level and role;
3. approximately 15% depth, experience and goalkeeper quality;
4. approximately 10% tactical cohesion and qualification form.

Player ratings begin from the team's strength band, then adjust for 1997/98 club level, international caps entering the tournament, opening-XI usage, captaincy and position. A curated elite-player layer prevents globally recognised 1997/98 stars from being flattened by team averages. Tournament performance is used only for scorer-role weighting and lineup evidence, not to inflate the underlying team rating.

Starting XIs are the real opening-match starters from the appearance dataset. The most frequently recorded detailed tournament position is used for positional fit; unused squad players fall back to a conservative broad-position mapping. Formations are derived from those XI positions. Penalty-taker lists combine historically established primary takers with captaincy, attacking role and the custom penalty attribute.

## Balance policy

Ratings are adjusted only when repeated full-tournament simulations reveal a systemic problem. A single surprise winner is treated as normal World Cup variance. The managed-team assistance is separate from all base ratings and applies only to the selected country; poor positional fit, weak selection and unsuitable formation/tactic combinations can reduce or reverse it.
