import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataset = JSON.parse(fs.readFileSync(path.join(root, "retro-2022-squad-dataset.json"), "utf8"));
const outputPath = path.join(root, "retro-2022-squads.js");

const squads = Object.fromEntries(Object.entries(dataset.countries).map(([team, country]) => [
  team,
  {
    coach: country.coach,
    players: country.players.map((player) => ({
      number: player.shirtNumber,
      name: player.name,
      displayName: player.name,
      position: player.sourcePosition,
      positions: [player.primaryPosition, ...player.secondaryPositions],
      club: player.club,
      dateOfBirth: player.dateOfBirth,
      caps: player.caps,
      internationalGoals: player.internationalGoals,
      worldCupGoals: player.worldCupGoals,
      overall: player.overall,
      ...(Number.isFinite(player.scoringRoleMultiplier) ? {
        scoringRoleMultiplier: player.scoringRoleMultiplier,
      } : {}),
      preferredFoot: player.preferredFoot,
      startingXILikelihood: player.startingXILikelihood,
      penaltyTakingAbility: player.penaltyTakingAbility,
      captain: player.captain,
      attributes: {
        pace: player.pace,
        shooting: player.shooting,
        passing: player.passing,
        dribbling: player.dribbling,
        defending: player.defending,
        physic: player.physical,
        ...(player.goalkeeping ? {
          goalkeeping_diving: player.goalkeeping.diving,
          goalkeeping_handling: player.goalkeeping.handling,
          goalkeeping_kicking: player.goalkeeping.kicking,
          goalkeeping_positioning: player.goalkeeping.positioning,
          goalkeeping_reflexes: player.goalkeeping.reflexes,
        } : {}),
      },
    })),
    startingXI: country.likelyStartingXI.map((player) => player.shirtNumber),
    formation: country.formation,
    captain: country.captain,
    penaltyTakers: country.penaltyTakers,
    teamRatings: country.teamRatings,
  },
]));

const output = "/* Generated from the validated Qatar 2022 historical squad dataset. */\n"
  + `const RETRO_2022_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${path.basename(outputPath)} with ${Object.keys(squads).length} teams and ${Object.values(squads).reduce((sum, squad) => sum + squad.players.length, 0)} players.`);
