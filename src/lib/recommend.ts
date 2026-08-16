import { openRequiredSlots, RosterAssignment } from "./roster";
import { FLEX_ELIGIBLE, Player, Position, RosterSettings } from "./types";

// VBD-style replacement ranks calibrated for a 12-team league, scaled by league size.
const BASELINE_REPLACEMENT_RANK_12_TEAM: Record<Position, number> = {
  QB: 14,
  RB: 30,
  WR: 36,
  TE: 14,
  K: 12,
  DEF: 12,
};

const REQUIRED_SLOT_BONUS = 40;
const FLEX_SLOT_BONUS = 20;

// RB/WR have the steepest positional drop-off and the deepest bench/flex
// utility, so nudge them ahead of QB/TE among comparably-valued players.
const PRIORITY_POSITIONS = new Set<Position>(["RB", "WR"]);
const PRIORITY_POSITION_BONUS = 15;

// Kept well below REQUIRED_SLOT_BONUS so breakout buzz nudges the order
// within a tier rather than overriding real roster need.
const BREAKOUT_BONUS_CAP = 25;

function breakoutBonus(player: Player): number {
  if (!player.isBreakout) return 0;
  return Math.min(BREAKOUT_BONUS_CAP, Math.log10(player.trendingAddCount + 1) * 6);
}

export interface Recommendation extends Player {
  value: number;
  score: number;
}

function replacementRank(position: Position, numTeams: number): number {
  return Math.round((BASELINE_REPLACEMENT_RANK_12_TEAM[position] * numTeams) / 12);
}

export function recommendPlayers(
  availablePlayers: Player[],
  rosterAssignment: RosterAssignment[],
  settings: RosterSettings
): Recommendation[] {
  const openSlots = openRequiredSlots(rosterAssignment);
  const openPositions = new Set(openSlots.filter((s) => s !== "FLEX"));
  const flexOpen = openSlots.includes("FLEX");

  return availablePlayers
    .map((player) => {
      const value = replacementRank(player.position, settings.numTeams) - player.positionRank;

      let needBonus = 0;
      if (openPositions.has(player.position)) {
        needBonus += REQUIRED_SLOT_BONUS;
      } else if (flexOpen && FLEX_ELIGIBLE.includes(player.position)) {
        needBonus += FLEX_SLOT_BONUS;
      }

      const priorityBonus = PRIORITY_POSITIONS.has(player.position) ? PRIORITY_POSITION_BONUS : 0;

      return { ...player, value, score: value + needBonus + breakoutBonus(player) + priorityBonus };
    })
    .sort((a, b) => b.score - a.score);
}
