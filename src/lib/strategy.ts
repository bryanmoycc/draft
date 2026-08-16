import { Player, Position } from "./types";

export type PositionCounts = Record<Position, number>;

export function countMyPositions(myPlayers: Player[]): PositionCounts {
  const counts: PositionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
  for (const p of myPlayers) counts[p.position]++;
  return counts;
}

/**
 * Research-backed nudges (2026 consensus: FantasyPros, PFF, Draft Sharks,
 * Establish the Run et al.) instead of a fixed position queue — every source
 * agrees the biggest mistake is forcing a predetermined plan instead of
 * taking the value in front of you. These only break ties between
 * comparably-valued players; the underlying value-based-drafting score
 * (positional replacement-rank gap) still does the heavy lifting.
 */
const ELITE_TE_BONUS = 20;
const RB_DOUBLE_UP_BONUS = 10;
const SURVIVAL_URGENCY_BONUS = 10;

const ELITE_TIER = 2;
const RB_DOUBLE_UP_TARGET = 2;

/**
 * TE is a "get the elite tier or punt it" position — the scoring cliff after
 * the top few TEs is steep enough that a true top-tier guy is a real weekly
 * edge, but reaching for a mid-tier TE just to fill the slot isn't worth it
 * (value-based drafting already discourages that on its own).
 */
export function eliteTeBonus(player: Player, counts: PositionCounts): number {
  if (player.position !== "TE") return 0;
  if (counts.TE >= 1) return 0;
  return player.tier <= ELITE_TIER ? ELITE_TE_BONUS : 0;
}

/**
 * 2026-specific: a weak rookie class and fewer true workhorse backs make
 * "two of the top-15 RBs" a cited edge this year. Only applies to
 * still-elite-tier RBs, and stops once you have your second one — this is a
 * nudge toward doubling up when the value is there, not a forced 3-RB floor.
 */
export function rbDoubleUpBonus(player: Player, counts: PositionCounts): number {
  if (player.position !== "RB") return 0;
  if (counts.RB >= RB_DOUBLE_UP_TARGET) return 0;
  return player.tier <= ELITE_TIER ? RB_DOUBLE_UP_BONUS : 0;
}

/**
 * The actual pick-position-driven lever: if a player is a toss-up to survive
 * until your next turn, that's the case for reaching now instead of waiting
 * — a "safe" player can be grabbed later, and a "likely gone" player is
 * probably a lost cause either way, so neither needs a boost.
 */
export function survivalUrgencyBonus(survival: "gone" | "borderline" | "safe" | null): number {
  return survival === "borderline" ? SURVIVAL_URGENCY_BONUS : 0;
}

export function getStrategyNote(availablePlayers: Player[], counts: PositionCounts): string {
  const bestAvailableTe = availablePlayers.find((p) => p.position === "TE");

  if (counts.TE === 0 && bestAvailableTe && bestAvailableTe.tier <= ELITE_TIER) {
    return "Elite TE available — a real weekly edge if you want it, otherwise fine to wait";
  }
  if (counts.RB < RB_DOUBLE_UP_TARGET) {
    return "Workhorse RBs are scarce this year — a 2nd top-tier RB is a cited edge";
  }
  if (counts.QB === 0) {
    return "QB is deep this year — best player available, no need to reach";
  }
  return "Best player available (value-based)";
}
