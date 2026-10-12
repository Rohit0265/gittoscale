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
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        No simulation data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Throughput Chart */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold text-slate-700 block mb-2">
          Throughput Dynamics (req/s)
        </span>
        <div className="h-36 w-full text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                unit="s"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <span className="text-[11px] font-bold text-slate-700 block mb-2">
          Queue Accumulation & Rejections
        </span>
        <div className="h-36 w-full text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                unit="s"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickLine={false}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '6px',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
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
