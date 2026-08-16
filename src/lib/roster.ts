import { FLEX_ELIGIBLE, Player, RosterSettings, RosterSlotType } from "./types";

export interface RosterAssignment {
  slot: RosterSlotType;
  player: Player | null;
}

/** Greedily fills roster slots in draft order: earliest picks claim the first matching slot. */
export function assignRoster(myPlayersInDraftOrder: Player[], settings: RosterSettings): RosterAssignment[] {
  const remaining = [...myPlayersInDraftOrder];
  const result: RosterAssignment[] = [];

  for (const slot of settings.slots) {
    let idx = -1;
    if (slot === "FLEX") {
      idx = remaining.findIndex((p) => FLEX_ELIGIBLE.includes(p.position));
    } else if (slot === "BENCH") {
      idx = remaining.length > 0 ? 0 : -1;
    } else {
      idx = remaining.findIndex((p) => p.position === slot);
    }

    if (idx !== -1) {
      result.push({ slot, player: remaining[idx] });
      remaining.splice(idx, 1);
    } else {
      result.push({ slot, player: null });
    }
  }

  return result;
}

export function openRequiredSlots(assignment: RosterAssignment[]): RosterSlotType[] {
  return assignment.filter((a) => a.slot !== "BENCH" && a.player === null).map((a) => a.slot);
}
