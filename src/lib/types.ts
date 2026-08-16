export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";

export const POSITIONS: Position[] = ["QB", "RB", "WR", "TE", "K", "DEF"];

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: string | null;
  rank: number;
  positionRank: number;
  tier: number;
  injuryStatus: string | null;
  yearsExp: number | null;
  trendingAddCount: number;
  isBreakout: boolean;
  /** Projected fantasy points for the season (PPR scoring), if available. */
  projectedPoints: number | null;
}

export type DraftedBy = "me" | "opponent";

export interface DraftPick {
  playerId: string;
  by: DraftedBy;
  pickNumber: number;
}

export type RosterSlotType = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DEF" | "BENCH";

export interface RosterSettings {
  numTeams: number;
  /** 1-indexed draft position in round 1 of a snake draft. */
  myDraftSlot: number;
  slots: RosterSlotType[];
}

export const DEFAULT_ROSTER_SETTINGS: RosterSettings = {
  numTeams: 12,
  myDraftSlot: 4,
  slots: ["QB", "RB", "RB", "WR", "WR", "TE", "FLEX", "K", "DEF", "BENCH", "BENCH", "BENCH", "BENCH", "BENCH", "BENCH"],
};

export const FLEX_ELIGIBLE: Position[] = ["RB", "WR", "TE"];
