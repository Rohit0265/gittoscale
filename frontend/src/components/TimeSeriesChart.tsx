import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { TimeSeriesSample } from '../types';

interface TimeSeriesChartProps {
  data: TimeSeriesSample[];
  isDark?: boolean;
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, isDark: propIsDark }) => {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof propIsDark === 'boolean') return propIsDark;
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  React.useEffect(() => {
    if (typeof propIsDark === 'boolean') {
      setIsDark(propIsDark);
      return;
    }
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsDark]);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
        No simulation data available
      </div>
    );
  }

  const gridStroke = isDark ? '#334155' : '#f1f5f9';
  const axisTickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const tooltipColor = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="space-y-4">
      {/* Throughput Chart */}
      <div className="bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-2">
          Throughput Dynamics (req/s)
        </span>
        <div className="h-36 w-full text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="time"
                unit="s"
                tick={{ fill: axisTickColor, fontSize: 10 }}
                tickLine={false}
              />
              <YAxis tick={{ fill: axisTickColor, fontSize: 10 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: tooltipColor,
                  borderRadius: '6px',
                  fontSize: '11px',
                  boxShadow: isDark
                    ? '0 4px 12px -2px rgba(0, 0, 0, 0.5)'
                    : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line
                type="monotone"
                dataKey="offeredThroughput"
                name="Offered (λ)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completedThroughput"
                name="Completed (μ)"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Queue & Dropped Requests Chart */}
      <div className="bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block mb-2">
          Queue Accumulation & Rejections
        </span>
        <div className="h-36 w-full text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis
                dataKey="time"
                unit="s"
                tick={{ fill: axisTickColor, fontSize: 10 }}
                tickLine={false}
              />
              <YAxis tick={{ fill: axisTickColor, fontSize: 10 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  color: tooltipColor,
                  borderRadius: '6px',
                  fontSize: '11px',
                  boxShadow: isDark
                    ? '0 4px 12px -2px rgba(0, 0, 0, 0.5)'
                    : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line
                type="monotone"
                dataKey="totalQueueLength"
                name="Queue Size"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="cumulativeDropped"
                name="Cumulative Drops"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
