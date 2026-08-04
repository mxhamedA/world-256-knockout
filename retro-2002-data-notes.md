# Korea/Japan 2002 data notes

The 2002 data layer contains all 32 finalists, each with the official 23-player registration (736 players total), coach, group, shirt number, broad position, opening-match XI, World Cup appearances/starts/goals, FIFA-era rating field, and a playable overall rating.

## Squad source

The squad rows, positions, shirt numbers, opening-match line-ups, appearances and goals are generated from the local copy of the Fjelstul World Cup Database (`tmp/fjelstul-worldcup/data-csv`, CC-BY-SA-4.0). This matches the historical 23-player format and gives a reproducible source for the 736-player count. Club affiliations are joined by team and shirt number from the public [2002 FIFA World Cup squads](https://en.wikipedia.org/wiki/2002_FIFA_World_Cup_squads) tables, which date clubs and player details to 31 May 2002; the joined source is kept in `retro-2002-clubs.generated.json`.

## FIFA rankings

`retro-data.js` stores the FIFA/Coca-Cola list published 15 May 2002, immediately before the finals: rank and points are retained for every team, including the Brazil/Argentina tie at rank 2. The historical table is [FIFA's 15 May 2002 ranking snapshot](https://fifa2.com/rank/main/alpha_E_latest.html).

## Ratings

`overall` is the rating used by the simulator. It is intentionally not presented as a verbatim full EA database dump:

1. Prominent players use contemporary FIFA Soccer 2002 guide anchors where available, supplemented by explicit season-context anchors for stars whose guide value is not available (`fifaRatingIsAnchor: true` means an explicit manual anchor).
2. The overall value then reflects 2001/02 form, national-team role and the player's Korea/Japan 2002 usage.
3. Other players receive a deterministic estimate from team strength, position, starts, appearances and tournament production; those records are marked `ratingConfidence: "medium"`.
4. `fifaRating` is still populated for every player: direct guide anchors retain the guide value, explicit season anchors retain their calibrated FIFA-era proxy, and non-anchor values use the calibrated overall rather than inventing false precision.

The contemporary anchor reference is the [FIFA Soccer 2002 player-rating guide](https://gamefaqs.gamespot.com/pc/475265-fifa-soccer-2002/faqs/16943). This hybrid approach keeps Brazil's 2002 core, France's pre-tournament strength, the Portuguese/Italian/Spanish stars and the emerging Korea/Senegal/USA players in a sensible range while respecting the actual pre-tournament FIFA ranking.
