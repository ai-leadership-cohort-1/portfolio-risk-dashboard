"use client";

import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectorSummary, formatAud } from "@/lib/aggregate";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: SectorSummary }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5 text-xs shadow-sm">
      <p className="font-semibold text-foreground">{d.sector}</p>
      <p className="mt-1 text-muted">{d.count} customers</p>
      <p className="text-muted">Total exposure: {formatAud(d.exposure)}</p>
      {d.redExposure > 0 && <p className="text-red">Red exposure: {formatAud(d.redExposure)}</p>}
      <p className="text-muted">{d.sharePct.toFixed(1)}% of portfolio</p>
    </div>
  );
}

export default function SectorExposureChart({ data }: { data: SectorSummary[] }) {
  const top = data.slice(0, 8);
  const height = Math.max(220, top.length * 34);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={top} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e0dc" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#5c5c5c" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
        />
        <YAxis
          type="category"
          dataKey="sector"
          tick={{ fontSize: 11, fill: "#5c5c5c" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="exposure" radius={[0, 4, 4, 0]} maxBarSize={20}>
          {top.map((d) => (
            <Cell key={d.sector} fill={d.redExposure > 0 ? "#b91c1c" : "#c8102e"} fillOpacity={d.redExposure > 0 ? 0.85 : 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
