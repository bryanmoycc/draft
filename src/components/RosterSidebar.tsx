"use client";

import { RosterAssignment } from "@/lib/roster";
import PositionBadge from "./PositionBadge";

interface RosterSidebarProps {
  assignment: RosterAssignment[];
  onUndo: (playerId: string) => void;
}

export default function RosterSidebar({ assignment, onUndo }: RosterSidebarProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-sm font-semibold text-foreground/70 mb-1">My Roster</h2>
      {assignment.map((slot, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 rounded-md border border-black/10 dark:border-white/15 px-2.5 py-1.5 text-sm"
        >
          <span className="w-12 shrink-0 text-xs font-semibold text-foreground/50">{slot.slot}</span>
          {slot.player ? (
            <>
              <span className="flex-1 truncate flex items-center gap-2">
                <PositionBadge position={slot.player.position} />
                {slot.player.name}
              </span>
              <button
                onClick={() => onUndo(slot.player!.id)}
                title="Undo pick"
                className="text-xs text-foreground/40 hover:text-red-500"
              >
                ✕
              </button>
            </>
          ) : (
            <span className="flex-1 text-foreground/30">empty</span>
          )}
        </div>
      ))}
    </div>
  );
}
