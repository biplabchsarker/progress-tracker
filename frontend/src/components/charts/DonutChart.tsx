import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, useChartAxisTheme, type ChartColor } from './chartTheme';

export interface DonutSegment {
  label: string;
  value: number;
  color: ChartColor;
}

export default function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 168,
}: {
  segments: DonutSegment[];
  centerValue: string | number;
  centerLabel: string;
  size?: number;
}) {
  const { tooltip } = useChartAxisTheme();
  const data = segments.filter((s) => s.value > 0);
  const pieData = data.length ? data : [{ label: 'None', value: 1, color: 'slate' as ChartColor }];

  return (
    <div className="flex items-center gap-5">
      <div style={{ width: size, height: size }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 3 : 0}
              stroke="none"
            >
              {pieData.map((seg, i) => (
                <Cell key={i} fill={CHART_COLORS[seg.color]} />
              ))}
            </Pie>
            {data.length > 0 && (
              <Tooltip
                contentStyle={tooltip}
                formatter={(value: number, label: string) => [value, label]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">{centerValue}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">{centerLabel}</span>
        </div>
      </div>
      <ul className="space-y-1.5 text-xs">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[seg.color] }} />
            <span className="truncate">{seg.label}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 ml-auto pl-3">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
