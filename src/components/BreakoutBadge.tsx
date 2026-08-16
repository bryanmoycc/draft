export default function BreakoutBadge({ isBreakout, trendingAddCount }: { isBreakout: boolean; trendingAddCount: number }) {
  if (!isBreakout) return null;

  return (
    <span
      title={`Trending up — added in ${trendingAddCount.toLocaleString()} Sleeper rosters in the last 48h`}
      className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold leading-none bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
    >
      🚀 BREAKOUT
    </span>
  );
}
