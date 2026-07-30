# Germany 2006 data notes

The Germany 2006 mode uses a deliberately hybrid strength model. It does not
copy one game's ratings table unchanged.

## Squad and fixture source

Official 23-player squads, shirt numbers, broad positions, opening-match
starting XIs, managers, match dates, local kick-off times, stadiums and cities
come from:

> Joshua C. Fjelstul, Ph.D., *The Fjelstul World Cup Database v1.2.0*
> (© 2023 Joshua C. Fjelstul, Ph.D.)
>
> Repository: https://github.com/jfjelstul/worldcup  
> License: https://creativecommons.org/licenses/by-sa/4.0/legalcode

Modifications made for this project:

- `United States` is displayed as `USA` to match the simulator's existing team
  identity.
- Match appearance positions are used to give players more specific roles than
  the source squad table's broad GK/DF/MF/FW groups.
- Opening-match position counts are mapped to the closest formation already
  supported by the shared lineup manager.
- Source records are transformed into the simulator's compact JavaScript squad
  and schedule formats.

## Rating method

Player anchors use the FIFA 07 August 2006 database as the closest complete EA
snapshot to the tournament. Those anchors are blended with 2005/06 club form,
Germany 2006 appearances, starts, goals and tournament performance. Players
without a direct anchor are estimated from their team's calibrated strength,
position and tournament role.

Team ratings combine:

- pre-tournament squad quality and contemporary EA strength;
- the 2005/06 club season level of core players;
- Germany 2006 performance, including stage reached;
- conservative compression for lower-ranked teams so Standard mode allows
  believable shocks without making underdogs disproportionately powerful.

The transformation script is `scripts/generate-retro-2006-data.mjs`. Its output
is validated by `scripts/retro-2006-mode-test.mjs`, including 800 deterministic
Standard-mode tournament simulations.
