# Qatar 2022 Squad Dataset Validation

## Result

Status: **PASS**

- Countries: 32
- Official final-squad players: 831
- Groups: 8 groups of 4, in official draw order
- Squad sizes: Iran 25; every other country 26
- Goalkeepers: Iran, Switzerland and Tunisia 4 each; every other country 3
- Likely starting XIs: 32 complete, unique 11-player lineups
- Captains: exactly 1 marked captain per country
- Official replacements: 11 declared and 11 linked to their incoming players
- Duplicate names, shirt numbers and FIFA rating identities: 0
- Generic unreviewed rating fallbacks: 0

Validation command:

```text
npm run test:retro-2022-data
```

Dataset SHA-256:

```text
15CEBD01FC8B70AAB3DFE7E74876774631CF949ACD19C757E913B12EB6054665
```

## Rating Evidence

- 723 players use FIFA 23 update 6, dated 16 November 2022, as their numerical baseline.
- 36 players absent from FIFA 23 use FIFA 22 update 64, dated 18 July 2022, as a clearly labelled fallback.
- 72 players absent from both snapshots have manually reviewed November-December 2022 profiles.
- Manual reviews use tournament role and playing time, 2021/22 and early-2022/23 club level, international importance and World Cup performance.
- Ratings are finalized to 18 December 2022. They do not use later clubs, later FIFA editions or post-tournament career development.

## Primary Sources

- FIFA official final squad list PDF: https://fdp.fifa.org/assetspublic/ce44/pdf/SquadLists-English.pdf
- FIFA squad-size and replacement rules: https://www.fifa.com/en/articles/all-you-need-to-know-about-fifa-world-cup-qatar-2022-squad-lists
- World Cup squads, appearances, starts and match records: https://github.com/jfjelstul/worldcup
- FIFA 23 and FIFA 22 historical rating snapshots: https://www.kaggle.com/datasets/stefanoleone992/fifa-23-complete-player-dataset
- Replacement cross-check: https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_squads

The local FIFA PDF used by the generator has SHA-256:

```text
2A75FB43FB871564EF040C1E81F9260C85B6A9EA7FC3B7C68CD5723D6DE7E874
```

## Official Replacements

| Country | Out | In | Date |
|---|---|---|---|
| Senegal | Sadio Mané | Moussa N'Diaye | 20 Nov |
| Argentina | Nicolás González | Ángel Correa | 17 Nov |
| Argentina | Joaquín Correa | Thiago Almada | 18 Nov |
| Poland | Bartłomiej Drągowski | Kamil Grabara | 13 Nov |
| Saudi Arabia | Fahad Al-Muwallad | Nawaf Al-Abed | 13 Nov |
| Australia | Martin Boyle | Marco Tilio | 20 Nov |
| France | Presnel Kimpembe | Axel Disasi | 14 Nov |
| France | Christopher Nkunku | Randal Kolo Muani | 16 Nov |
| Japan | Yūta Nakayama | Shuto Machino | 8 Nov |
| Spain | José Gayà | Alejandro Balde | 18 Nov |
| Morocco | Amine Harit | Anass Zaroury | 16 Nov |

## Uncertainties And Decisions

- Karim Benzema remains in France's official 26 because he was not formally replaced after his 20 November injury. He has zero tournament usage and low starting likelihood.
- Marcus Thuram was the final addition to France's permitted 26-player squad, not an injury replacement.
- Opening-match XIs provide the canonical starting lineup. Tactical roles changed during the tournament, so the listed formation is a plausible baseline rather than a claim that each team used one shape in every match.
- Primary positions reflect period club/national roles; a starting-XI entry can show a different match-specific tactical role.
- Preferred feet sourced from FIFA are marked accordingly. Manually reviewed feet are labelled `manual-period-review`.
- FIFA and the official squad PDF occasionally disagree on DOB formatting or classify hybrid players in different broad position groups. Joins therefore require full name evidence or corroborating DOB, official family name and club evidence.
- Son Heung-min's FIFA reference is stored in native script; it was accepted through matching DOB, official family name and Tottenham club evidence.
- Rating adjustments remain editorial by nature. Every adjustment is bounded to the 2022 window and includes a short player-level justification in the JSON.

## Files

- `data/retro/2022/squad-dataset.json`: complete country-grouped dataset
- `scripts/generate-retro-2022-data.py`: reproducible source and rating generator
- `scripts/validate-retro-2022-dataset.mjs`: independent schema and historical-integrity validator
