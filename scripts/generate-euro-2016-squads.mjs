import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "data/retro/euro-2016/squad-dataset.json");
const outputPath = join(root, "data/retro/euro-2016/squads.js");
const dataset = JSON.parse(readFileSync(sourcePath, "utf8"));

const squads = Object.fromEntries(Object.entries(dataset.countries).map(([country, team]) => [
  country,
  {
    coach: team.coach,
    formation: team.formation,
    startingXI: team.likelyStartingXI.map((player) => player.shirtNumber),
    captain: team.captain,
    penaltyTakers: team.penaltyTakers,
    teamRatings: team.teamRatings,
    players: team.players.map((player) => ({
      name: player.name,
      number: player.shirtNumber,
      position: player.primaryPosition,
      positions: [player.primaryPosition, ...player.secondaryPositions],
      club: player.club,
      preferredFoot: player.preferredFoot,
      overall: player.overall,
      attributes: {
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physic: player.physical,
      },
      goalkeeping: player.goalkeeping,
      startingXILikelihood: player.startingXILikelihood,
      penaltyTakingAbility: player.penaltyTakingAbility,
      captain: player.captain,
      officialReplacement: player.officialReplacement,
      euroGoals: player.tournamentUsage.goals,
      tournamentUsage: player.tournamentUsage,
      ratingJustification: player.shortRatingJustification,
      sources: player.sources,
    })),
  },
]));

const banner = [
  "/*",
  " * Generated from data/retro/euro-2016/squad-dataset.json.",
  " * Official final 23-player squads, period ratings and opening-match starting XIs.",
  " * Run: node scripts/generate-euro-2016-squads.mjs",
  " */",
].join("\n");

writeFileSync(
  outputPath,
  `${banner}\nconst RETRO_EURO_2016_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n`,
  "utf8",
);

console.log(`Wrote ${Object.keys(squads).length} Euro 2016 squads to ${outputPath}`);
