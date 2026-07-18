'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Client component: recharts renders to the DOM and needs browser APIs, so
// this can't be a server component. Keeping it isolated here (instead of
// making the whole card a client component) means only this chart re-renders
// on the client — everything else in the card can stay server-friendly.
export function ForecastChart({ daily }) {
  if (!daily?.length) return null;

  const data = daily.map((day) => ({
    day: new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }),
    max: day.maxTempC,
    min: day.minTempC,
  }));

  return (
    <div className="forecast-chart">
      <p className="forecast-chart-label">7-day forecast</p>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#8d94a6' }} axisLine={false} tickLine={false} />
          <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip
            contentStyle={{
              background: '#13151b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 10,
              fontSize: 12,
              boxShadow: '0 8px 24px -8px rgba(0, 0, 0, 0.6)',
            }}
            labelStyle={{ color: '#f4f5f7', fontWeight: 600, marginBottom: 2 }}
            itemStyle={{ padding: 0 }}
            cursor={{ stroke: 'rgba(255, 255, 255, 0.12)', strokeWidth: 1 }}
          />
          <Line type="monotone" dataKey="max" stroke="#fb923c" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
          <Line type="monotone" dataKey="min" stroke="#22d3ee" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
