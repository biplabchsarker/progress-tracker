import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts';
import { CHART_COLORS, useChartAxisTheme, type ChartColor } from './chartTheme';

export interface BarDatum {
  label: string;
  value: number;
  color?: ChartColor;
}

export default function HorizontalBarChart({
  data,
  max = 100,
  unit = '%',
  color = 'blue',
  emptyMessage = 'No data yet.',
}: {
  data: BarDatum[];
  max?: number;
  unit?: string;
  color?: ChartColor;
  emptyMessage?: string;
}) {
  const { grid, axisText, tooltip } = useChartAxisTheme();

  if (data.length === 0) {
    return <p className="text-slate-500 text-sm py-6 text-center">{emptyMessage}</p>;
  }

  const height = Math.max(data.length * 34, 60);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={grid} />
          <XAxis type="number" domain={[0, max]} tick={{ fontSize: 11, fill: axisText }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 12, fill: axisText }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltip}
            cursor={{ fill: grid, opacity: 0.4 }}
            formatter={(value: number) => [`${value}${unit}`, undefined]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.map((d, i) => (
              <Cell key={i} fill={CHART_COLORS[d.color ?? color]} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}${unit}`} fill={axisText} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
