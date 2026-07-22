# World Cup Legacy Draft data

Historic lineups are stored as one JSON file per nation and tournament year under `nations/<nation>/<year>.json`.

## Lineup source

Starting-XI membership comes from the [Fjelstul World Cup Database](https://github.com/jfjelstul/worldcup), copyright Joshua C. Fjelstul, Ph.D., licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Each record identifies the exact match and uses the nation's opening World Cup match as a consistent snapshot.

## Rating status

- `ready`: all 11 players have positions, an overall, six outfield attributes, and an EA Sports FIFA game year.
- `review`: the historic XI is complete, but at least one rating or precise position has not been matched to a reliable source.
- Missing values stay `null`. They must never be estimated merely to make a lineup pass validation.

Run `npm run generate:legacy-data` after editing JSON records. Run `npm run test:legacy-data` to validate the catalog and print the remaining review queue.
