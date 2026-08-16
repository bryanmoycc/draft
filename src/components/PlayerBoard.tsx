"use client";

import { useMemo, useState } from "react";
import { DraftedBy, Player, Position, POSITIONS } from "@/lib/types";
import PositionBadge from "./PositionBadge";

interface PlayerBoardProps {
  availablePlayers: Player[];
  onDraft: (playerId: string, by: DraftedBy) => void;
}

export default function PlayerBoard({ availablePlayers, onDraft }: PlayerBoardProps) {
  const [positionFilter, setPositionFilter] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return availablePlayers.filter((p) => {
      if (positionFilter !== "ALL" && p.position !== positionFilter) return false;
      if (search.trim() && !p.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [availablePlayers, positionFilter, search]);

  const tierStartIds = useMemo(() => {
    if (positionFilter === "ALL") return new Set<string>();
    const ids = new Set<string>();
    let lastTier: number | null = null;
    for (const p of filtered) {
      if (p.tier !== lastTier) ids.add(p.id);
      lastTier = p.tier;
    }
    return ids;
  }, [filtered, positionFilter]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-center gap-2 pb-3">
        <button
          onClick={() => setPositionFilter("ALL")}
          className={`px-3 py-1 rounded-full text-sm font-medium border ${
            positionFilter === "ALL"
              ? "bg-foreground text-background border-foreground"
              : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
          }`}
        >
          ALL
        </button>
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPositionFilter(pos)}
            className={`px-3 py-1 rounded-full text-sm font-medium border ${
              positionFilter === pos
                ? "bg-foreground text-background border-foreground"
                : "border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {pos}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search player…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-md border border-black/10 dark:border-white/15 bg-transparent text-sm min-w-48 focus:outline-none focus:ring-2 focus:ring-foreground/30"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-background border-b border-black/10 dark:border-white/15 text-left text-xs uppercase tracking-wide text-foreground/50">
            <tr>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Pos</th>
              <th className="px-3 py-2 font-medium">Player</th>
              <th className="px-3 py-2 font-medium">Team</th>
              <th className="px-3 py-2 font-medium">Tier</th>
              <th className="px-3 py-2 font-medium text-right">Draft</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isNewTier = tierStartIds.has(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 ${
                    isNewTier ? "border-t-2 border-t-foreground/20" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-foreground/60">{p.rank}</td>
                  <td className="px-3 py-2">
                    <PositionBadge position={p.position} />
                  </td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2 text-foreground/60">{p.team ?? "—"}</td>
                  <td className="px-3 py-2 text-foreground/60">T{p.tier}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => onDraft(p.id, "me")}
                        className="px-2 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        Me
                      </button>
                      <button
                        onClick={() => onDraft(p.id, "opponent")}
                        className="px-2 py-1 rounded text-xs font-medium bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
                      >
                        Opp
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-foreground/50">
                  No players match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
