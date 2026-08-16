import { RosterSettings } from "./types";

/** Overall pick number (1-indexed) for a given round/slot in a snake draft. */
export function pickNumberForRound(round: number, slot: number, numTeams: number): number {
  const isEvenRound = round % 2 === 0;
  const slotInRound = isEvenRound ? numTeams - slot + 1 : slot;
  return (round - 1) * numTeams + slotInRound;
}

/** All of "my" overall pick numbers across enough rounds to fill the roster. */
export function myPickNumbers(settings: RosterSettings): number[] {
  const rounds = settings.slots.length;
  const picks: number[] = [];
  for (let round = 1; round <= rounds; round++) {
    picks.push(pickNumberForRound(round, settings.myDraftSlot, settings.numTeams));
  }
  return picks;
}

export interface TurnInfo {
  /** The overall pick number about to happen. */
  currentPickNumber: number;
  /** Whether it's my turn right now. */
  isMyTurnNow: boolean;
  /** My next upcoming pick number (could equal currentPickNumber). */
  nextMyPickNumber: number | null;
  /** How many picks (including this one) happen before my next turn. 0 if it's my turn now. */
  picksUntilMyTurn: number | null;
}

export function getTurnInfo(picksMade: number, settings: RosterSettings): TurnInfo {
  const currentPickNumber = picksMade + 1;
  const mine = myPickNumbers(settings);
  const nextMyPickNumber = mine.find((n) => n >= currentPickNumber) ?? null;

  return {
    currentPickNumber,
    isMyTurnNow: nextMyPickNumber === currentPickNumber,
    nextMyPickNumber,
    picksUntilMyTurn: nextMyPickNumber === null ? null : nextMyPickNumber - currentPickNumber,
  };
}

export type SurvivalEstimate = "gone" | "borderline" | "safe";

const BORDERLINE_BUFFER = 5;

/**
 * Rough estimate of whether a player will still be available at my next pick,
 * based on how their consensus rank compares to the pick number I'd need them
 * to survive to. This assumes draft order roughly tracks consensus rank —
 * it's a heuristic, not a guarantee.
 */
export function estimateSurvival(playerRank: number, nextMyPickNumber: number): SurvivalEstimate {
  if (playerRank <= nextMyPickNumber - BORDERLINE_BUFFER) return "gone";
  if (playerRank <= nextMyPickNumber + BORDERLINE_BUFFER) return "borderline";
  return "safe";
}
