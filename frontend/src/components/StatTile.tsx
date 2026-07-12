export type StatTone = 'neutral' | 'blue' | 'teal' | 'purple' | 'red' | 'amber' | 'green';

const TONE_GLOW: Record<StatTone, string> = {
  neutral: 'bg-slate-500/10',
  blue: 'bg-blue-500/15',
  teal: 'bg-teal-500/15',
  purple: 'bg-purple-500/15',
  red: 'bg-red-500/15',
  amber: 'bg-amber-500/15',
  green: 'bg-green-500/15',
};

const TONE_BAR: Record<StatTone, string> = {
  neutral: 'from-slate-500 to-slate-400',
  blue: 'from-blue-600 to-blue-400',
  teal: 'from-teal-600 to-teal-400',
  purple: 'from-purple-600 to-purple-400',
  red: 'from-red-600 to-red-400',
  amber: 'from-amber-600 to-amber-400',
  green: 'from-green-600 to-green-400',
};

const TONE_TEXT: Record<StatTone, string> = {
  neutral: 'text-slate-400',
  blue: 'text-blue-400',
  teal: 'text-teal-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
  green: 'text-green-400',
};

export default function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  meterPct,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: StatTone;
  meterPct?: number;
}) {
  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-xl p-4 transition-colors hover:border-slate-300 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:shadow-none">
      <div className={`pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl ${TONE_GLOW[tone]}`} />
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${TONE_BAR[tone]}`} />

      <p className="relative text-xs font-medium uppercase tracking-wide text-slate-500 mb-1.5">{label}</p>
      <p className="relative text-3xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
      {hint && <p className={`relative text-xs mt-1.5 font-medium ${TONE_TEXT[tone]}`}>{hint}</p>}

      {meterPct !== undefined && (
        <div className="relative mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${TONE_BAR[tone]}`}
            style={{ width: `${Math.max(0, Math.min(meterPct, 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}
