# UEFA Euro 2016 Squad Dataset Validation

## Result

Status: **PASS**

- Countries: 24
- Official final-squad players: 552
- Groups: 6 groups of 4, in official draw order
- Squad sizes: exactly 23 for every country
- Shirt numbers: complete and unique 1–23 for every country
- Goalkeepers: exactly 3 in every official squad
- Likely starting XIs: 24 complete, unique 11-player lineups
- Captains: exactly 1 marked captain per country
- Preferred feet: 552 resolved as left or right, each with a reliability label
- Official incoming replacements: 7 declared and 7 linked to their final-squad players
- Duplicate or invented players: 0
- Preliminary-only and replaced outgoing players retained: 0
- Modern-season or present-day rating leakage detected: 0

Validation command:

```text
node scripts/validate-euro-2016-dataset.mjs
```

Dataset SHA-256:

```text
8A964A8DBA3917422B075AB2E2B462B170A33A38279E4EEE7F0FA2403D37060F
```

## Rating Evidence

- 469 players have a reliable FIFA 16 identity match and use that snapshot as the numerical starting point.
- 52 more players absent from the FIFA 16 snapshot have a reliable FIFA 17 launch identity, used as a post-2015/16 cross-check.
- 31 players absent from both reliable snapshots have manually bounded 2016 estimates based on position, national-team level, club context, caps and Euro usage.
- FIFA 17 is not copied blindly. It is a bounded post-season check for 2015/16 movement and the completed tournament.
- All 552 profiles were reviewed against actual Euro 2016 starts, substitute appearances, goals, national-team role and team progression.
- Attribute changes follow positional weighting, so an overall adjustment does not raise every attribute uniformly.
- Ratings are finalized to 10 July 2016. Later transfers, later peak seasons and present-day reputation are excluded.

## Primary Sources

- UEFA confirmation of all 24 final squads and the official group field:  
  https://www.uefa.com/uefaeuro/history/news/0253-0d814293cea1-a0e72fd077c9-1000--all-24-uefa-euro-2016-squads-confirmed/
- Final squads, shirt numbers, clubs, captains and national-association citations:  
  https://en.wikipedia.org/wiki/UEFA_Euro_2016_squads
- UEFA Euro 2016 Technical Report:  
  https://www.uefa.com/MultimediaFiles/Download/TechnicalReport/competitions/EURO/02/40/26/69/2402669_DOWNLOAD.pdf
- Euro 2016 match lineups and event records:  
  https://www.kaggle.com/datasets/piterfm/football-soccer-uefa-euro-1960-2024
- Historical FIFA 16 and FIFA 17 SoFIFA snapshots:  
  https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset

## Official Replacements Included

| Country | Out | In | Date |
|---|---|---|---|
| France | Raphaël Varane | Adil Rami | 24 May |
| France | Jérémy Mathieu | Samuel Umtiti | 28 May |
| France | Lassana Diarra | Morgan Schneiderlin | 31 May |
| Russia | Alan Dzagoev | Dmitri Torbinski | 22 May |
| Russia | Igor Denisov | Artur Yusupov | 7 June |
| Germany | Antonio Rüdiger | Jonathan Tah | 8 June |
| Spain | Dani Carvajal | Héctor Bellerín | 31 May |

## Uncertainties And Decisions

- The official consolidated squad source defines a player's club as the club for which he last played a competitive match before the tournament. Announced summer transfers are therefore not substituted for the tournament-time club.
- Each canonical likely XI uses the nation's opening-match selection, then normalizes its tactical labels to the listed formation. This is historically reproducible and avoids hindsight-only lineups.
- Wales' opening shape is represented as 3-4-2-1. Northern Ireland's compact opening shape is represented as 5-2-2-1. Both teams changed their out-of-possession lines during matches.
- Some source lineup records assigned a birth-country code rather than the national-team code. Those records were resolved by match, official shirt number and player identity; this affects Joe Hart, Lorik Cana and Martin Harnik in particular.
- FIFA 16 did not contain reliable identities for several players in unlicensed or lightly represented leagues. Manual estimates are explicitly labelled rather than attaching a similarly named but incorrect FIFA player.
- Preferred foot uses FIFA 16 where possible, then FIFA 17, a later biographical identity record for foot only, or a manual period-profile review. No later overall or attribute value is imported through that fallback.
- Editorial rating adjustments remain inherently debatable. Player-level justifications expose the baseline, cross-check, tournament usage and reason for each final value.

## Files

- `retro-euro-2016-squad-dataset.json`: complete country-grouped JSON
- `scripts/generate-euro-2016-data.py`: reproducible source and rating generator
- `scripts/validate-euro-2016-dataset.mjs`: independent structural and historical-integrity validator
