# Copa América USA 2024 dataset

This edition uses the final 16-team competition, not the provisional draw artwork.

## Sources

- CONMEBOL's [confirmed roster release](https://copaamerica.com/en/news/roster-copa-america-2024-all-the-teams), published 14 June 2024. It confirms the four groups, the 26-player registration limit, shirt numbers, clubs and position groups.
- CONMEBOL's [official 2024 matches archive](https://copaamerica.com/en/copa-america-2024/matches), cross-checked for fixture order, completed knockout pairings and venues.
- FIFA/Coca-Cola ranking snapshot immediately before the tournament, recorded as a calibration input in `retro-data.js`.
- 2023/24 club performance, June 2024 international form, contemporary public EA/FIFA rating references, squad depth and tactical strength were used as additional calibration inputs.

## Ratings

`rating` and player `overall` values are project simulator ratings. They are not official EA ratings. The model deliberately keeps Argentina strong without making it automatic, gives Colombia and Uruguay genuine contender strength from entering form and squad quality, and leaves Canada, Panama and Venezuela with credible upset paths. Copa América results are used only as a secondary calibration signal.

## Canonical naming

The simulator stores `United States`, `Mexico`, `Costa Rica`, `Paraguay`, `Canada` and `Venezuela` as the canonical names. UI and flag resolution accept `USA` and `México`/`Mexico` aliases without creating duplicate teams.
