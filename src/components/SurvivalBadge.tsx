import { SurvivalEstimate } from "@/lib/snake";

const LABELS: Record<SurvivalEstimate, string> = {
  gone: "likely gone",
  borderline: "50/50",
  safe: "should last",
};

const COLORS: Record<SurvivalEstimate, string> = {
  gone: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  borderline: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  safe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

interface SurvivalBadgeProps {
  estimate: SurvivalEstimate;
  /** Only "gone"/"borderline" render by default — pass true to also show "safe". */
  showSafe?: boolean;
}

export default function SurvivalBadge({ estimate, showSafe = false }: SurvivalBadgeProps) {
  if (estimate === "safe" && !showSafe) return null;

  return (
    <span
      title="Estimated chance this player is still available at your next pick, based on consensus rank"
      className={`inline-flex items-center rounded px-1 py-0.5 text-[10px] font-bold leading-none whitespace-nowrap ${COLORS[estimate]}`}
    >
      {LABELS[estimate]}
    </span>
  );
}
