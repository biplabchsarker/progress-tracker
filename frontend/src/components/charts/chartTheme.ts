import { useThemeStore } from '../../store/themeStore';

// Hex values mirror the Tailwind classes used elsewhere on the dashboard so
// chart fills line up with the badges/bars around them (recharts takes raw
// color props, not Tailwind classes).
export const CHART_COLORS = {
  blue: '#3b82f6',
  teal: '#2dd4bf',
  purple: '#a855f7',
  red: '#f87171',
  amber: '#fbbf24',
  green: '#4ade80',
  slate: '#94a3b8',
} as const;

export type ChartColor = keyof typeof CHART_COLORS;

export function useChartAxisTheme() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  return {
    isDark,
    grid: isDark ? '#1e293b' : '#e2e8f0',
    axisText: isDark ? '#64748b' : '#94a3b8',
    tooltip: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
      borderRadius: 8,
      fontSize: 12,
      color: isDark ? '#f1f5f9' : '#0f172a',
    },
  };
}
