export function EngagementLegend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" /> Client
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" /> Internal
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

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-slate-800 overflow-hidden flex">
        {clientWidth > 0 && (
          <div
            className="h-full bg-teal-500"
            style={{ width: `${clientWidth}%`, marginRight: internalWidth > 0 ? '2px' : 0 }}
            title={`Client: ${clientPct}%`}
          />
        )}
        {internalWidth > 0 && (
          <div className="h-full bg-purple-500" style={{ width: `${internalWidth}%` }} title={`Internal: ${internalPct}%`} />
        )}
      </div>
      <span className="text-sm text-slate-300 w-12 text-right shrink-0">{total}%</span>
      {isOverAllocated && (
        <span className="text-xs px-2 py-0.5 rounded-full border border-red-800 bg-red-950 text-red-400 shrink-0">OVER</span>
      )}
      {isUnderAllocated && !isOverAllocated && (
        <span className="text-xs px-2 py-0.5 rounded-full border border-amber-800 bg-amber-950 text-amber-400 shrink-0">UNDER</span>
      )}
    </div>
  );
}
