"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CategorySummary, formatAud } from "@/lib/aggregate";

const COLOR: Record<string, string> = {
  Green: "#15803d",
  Amber: "#b45309",
  Red: "#b91c1c",
};

export function CategoryCountChart({ data }: { data: CategorySummary[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e0dc" vertical={false} />
        <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#5c5c5c" }} axisLine={{ stroke: "#e2e0dc" }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#5c5c5c" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [Number(value), "Customers"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e0dc" }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.category} fill={COLOR[d.category]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryExposureChart({ data }: { data: CategorySummary[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e0dc" vertical={false} />
        <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#5c5c5c" }} axisLine={{ stroke: "#e2e0dc" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#5c5c5c" }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
        />
        <Tooltip
          formatter={(value) => [formatAud(Number(value)), "Exposure"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e0dc" }}
        />
        <Bar dataKey="exposure" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((d) => (
            <Cell key={d.category} fill={COLOR[d.category]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
