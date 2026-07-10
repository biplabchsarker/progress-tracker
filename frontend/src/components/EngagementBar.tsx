export function EngagementLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 inline-block" /> Client
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 inline-block" /> Internal
      </span>
    </div>
  );
}

export default function EngagementBar({
  label,
  clientPct,
  internalPct,
  total,
}: {
  label: string;
  clientPct: number;
  internalPct: number;
  total: number;
}) {
  const clientWidth = Math.max(0, Math.min(clientPct, 100));
  const internalWidth = Math.max(0, Math.min(internalPct, 100 - clientWidth));
  const isOverAllocated = total > 100;
  const isUnderAllocated = total < 50;
  // Data-end (the far edge of whichever segment is last) gets the rounded cap;
  // the baseline (left, 0%) stays square — the track's own left edge is square too.
  const internalIsLast = internalWidth > 0;

  return (
    <div className="flex items-center gap-3 group">
      <span className="text-sm text-slate-300 w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-6 rounded-r-full bg-slate-800/70 ring-1 ring-inset ring-slate-700/50 overflow-hidden flex">
        {clientWidth > 0 && (
          <div
            className={`h-full bg-gradient-to-b from-teal-400 to-teal-600 ${!internalIsLast ? 'rounded-r-full' : ''}`}
            style={{ width: `${clientWidth}%`, marginRight: internalWidth > 0 ? '2px' : 0 }}
            title={`Client: ${clientPct}%`}
          />
        )}
        {internalWidth > 0 && (
          <div
            className="h-full rounded-r-full bg-gradient-to-b from-purple-400 to-purple-600"
            style={{ width: `${internalWidth}%` }}
            title={`Internal: ${internalPct}%`}
          />
        )}
      </div>
      <span className="text-sm font-semibold text-slate-200 w-12 text-right shrink-0">{total}%</span>
      {isOverAllocated && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-red-800 bg-red-950 text-red-400 shrink-0">OVER</span>
      )}
      {isUnderAllocated && !isOverAllocated && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-amber-800 bg-amber-950 text-amber-400 shrink-0">UNDER</span>
      )}
      {!isOverAllocated && !isUnderAllocated && (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-green-800 bg-green-950 text-green-400 shrink-0">OK</span>
      )}
    </div>
  );
}
