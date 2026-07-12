"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendPoint } from "@/lib/trend";

export default function RiskTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e0dc" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5c5c5c" }} axisLine={{ stroke: "#e2e0dc" }} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#5c5c5c" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          formatter={(value) => [Number(value).toFixed(1), "Avg. risk score"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e0dc" }}
        />
        <Line
          type="monotone"
          dataKey="avgRiskScore"
          stroke="#c8102e"
          strokeWidth={2}
          dot={{ r: 3, fill: "#c8102e" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
