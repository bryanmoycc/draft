"use client";

import { useMemo } from "react";
import { DraftedBy, Player } from "@/lib/types";
import PositionBadge from "./PositionBadge";

interface BreakoutWatchProps {
  availablePlayers: Player[];
  onDraft: (playerId: string, by: DraftedBy) => void;
}

export default function BreakoutWatch({ availablePlayers, onDraft }: BreakoutWatchProps) {
  const top = useMemo(
    () =>
      availablePlayers
        .filter((p) => p.isBreakout)
        .sort((a, b) => b.trendingAddCount - a.trendingAddCount)
        .slice(0, 5),
    [availablePlayers]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <h2 className="text-sm font-semibold text-foreground/70 mb-1">🚀 Breakout Watch</h2>
      {top.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-2 rounded-md border border-black/10 dark:border-white/15 px-2.5 py-1.5 text-sm"
        >
          <PositionBadge position={p.position} />
          <span className="flex-1 truncate" title={`${p.trendingAddCount.toLocaleString()} adds (48h)`}>
            {p.name}
          </span>
          <button
            onClick={() => onDraft(p.id, "me")}
            className="px-2 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Draft
          </button>
        </div>
      ))}
      {top.length === 0 && (
        <p className="text-sm text-foreground/40">No breakout buzz among available players right now.</p>
      )}
    </div>
  );
}
