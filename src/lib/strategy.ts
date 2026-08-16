import { Player, Position } from "./types";

export type PositionCounts = Record<Position, number>;

export function countMyPositions(myPlayers: Player[]): PositionCounts {
  const counts: PositionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 };
  for (const p of myPlayers) counts[p.position]++;
  return counts;
}

export type DraftPhase =
  | "core-rb"
  | "core-wr"
  | "starting-te"
  | "backup-qb"
  | "backup-te"
  | "best-available";

const CORE_RB_TARGET = 3;
const CORE_WR_TARGET = 3;

/**
 * The user's stated draft plan: build an RB/WR core (RB weighted ahead of
 * WR) until at least 3 of each, then grab a starting TE, a backup QB, and a
 * backup TE in that order, then best-available RB/WR (plus K/DEF) with a
 * 3rd+ QB as the lowest priority. This is a preference queue, not a hard
 * rule — the bonuses below are kept small next to real value-based-drafting
 * gaps so a genuine standout at another position can still win.
 */
export function getDraftPhase(counts: PositionCounts): DraftPhase {
  if (counts.RB < CORE_RB_TARGET) return "core-rb";
  if (counts.WR < CORE_WR_TARGET) return "core-wr";
  if (counts.TE < 1) return "starting-te";
  if (counts.QB < 2) return "backup-qb";
  if (counts.TE < 2) return "backup-te";
  return "best-available";
}

export const PHASE_LABELS: Record<DraftPhase, string> = {
  "core-rb": "Building RB core (targeting 3 RB)",
  "core-wr": "Building WR core (targeting 3 WR)",
  "starting-te": "Targeting a starting TE",
  "backup-qb": "Targeting a backup QB",
  "backup-te": "Targeting a backup TE",
  "best-available": "Best available RB/WR/K/DEF (QB lowest priority)",
};

// Small nudges, not overrides: a typical tier-to-tier value gap (roughly
// 6-15 VBD points) should be enough for a standout player at a
// lower-priority position to still outrank the phase's target position.
// These only decide close calls between comparably-valued players.
const PRIMARY_BONUS = 15;
const SECONDARY_BONUS = 6;
const KDEF_BONUS = 4;

export function strategyBonus(position: Position, counts: PositionCounts): number {
  const phase = getDraftPhase(counts);

  switch (phase) {
    case "core-rb":
      if (position === "RB") return PRIMARY_BONUS;
      if (position === "WR") return SECONDARY_BONUS;
      return 0;
    case "core-wr":
      if (position === "WR") return PRIMARY_BONUS;
      if (position === "RB") return SECONDARY_BONUS;
      return 0;
    case "starting-te":
      if (position === "TE") return PRIMARY_BONUS;
      if (position === "RB" || position === "WR") return SECONDARY_BONUS;
      return 0;
    case "backup-qb":
      if (position === "QB") return PRIMARY_BONUS;
      if (position === "RB" || position === "WR") return SECONDARY_BONUS;
      return 0;
    case "backup-te":
      if (position === "TE") return PRIMARY_BONUS;
      if (position === "RB" || position === "WR") return SECONDARY_BONUS;
      return 0;
    case "best-available":
      if (position === "RB" || position === "WR") return SECONDARY_BONUS;
      if (position === "K" || position === "DEF") return KDEF_BONUS;
      return 0; // QB (3rd+) is the lowest priority here
  }
}
