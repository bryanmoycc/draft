import { Position } from "@/lib/types";

const COLORS: Record<Position, string> = {
  QB: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  RB: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  WR: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  TE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  K: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DEF: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function PositionBadge({ position }: { position: Position }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-semibold w-9 ${COLORS[position]}`}
    >
      {position}
    </span>
  );
}
