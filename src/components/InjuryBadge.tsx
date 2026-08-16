const LABELS: Record<string, string> = {
  Questionable: "Q",
  Doubtful: "D",
  Out: "O",
  IR: "IR",
  PUP: "PUP",
  Sus: "SUS",
  NA: "NA",
  DNR: "DNR",
  COV: "COV",
};

// "Questionable" is the only status that doesn't necessarily rule a player out this week.
const SEVERE_STATUSES = new Set(["Out", "IR", "PUP", "Sus", "NA", "DNR", "COV"]);

export default function InjuryBadge({ status }: { status: string | null }) {
  if (!status) return null;

  const severe = SEVERE_STATUSES.has(status);
  const colorClasses = severe
    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

  return (
    <span
      title={status}
      className={`inline-flex items-center justify-center rounded px-1 py-0.5 text-[10px] font-bold leading-none ${colorClasses}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
