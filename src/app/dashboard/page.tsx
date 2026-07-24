"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalysis } from "@/context/AnalysisContext";
import RiskBadge from "@/components/RiskBadge";
import {
  summariseByCategory,
  summariseByIndustry,
  totalExposure,
  topRiskCustomers,
  generatePortfolioTrend,
  recommendedActions,
} from "@/lib/aggregations";
import { RISK_THRESHOLDS } from "@/lib/riskScoring";
import type { RiskCategory } from "@/lib/types";

const CATEGORY_COLOURS: Record<RiskCategory, string> = {
  Green: "#2f7d4f",
  Amber: "#b5720f",
  Red: "#b13030",
};

const EXPOSURE_COLOUR = "#333a42";

const INDUSTRY_PALETTE = [
  "#1f4267",
  "#2c5a8c",
  "#4a7ab0",
  "#7098c2",
  "#9db8d6",
  "#5b6572",
  "#8b95a1",
  "#b8c0c9",
];

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function CategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
      <span className="font-medium" style={{ color: "var(--foreground)" }}>
        Customers:
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOURS.Green }} /> Green
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOURS.Amber }} /> Amber
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOURS.Red }} /> Red
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EXPOSURE_COLOUR }} /> Exposure
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-medium">No analysis loaded yet</p>
        <Link
          href="/"
          className="rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { customers, rules, csvFileName, pdfFileName, pdfPageCount, analysedAt, isSampleData, pdfParseFailed } =
    result;

  const categorySummary = summariseByCategory(customers);
  const industryData = summariseByIndustry(customers);
  const total = totalExposure(customers);
  const top10 = topRiskCustomers(customers, 10);
  const trend = generatePortfolioTrend(customers);
  const actions = recommendedActions(customers);

  const barData = categorySummary.map((s) => ({
    category: s.category,
    customers: s.count,
    exposure: s.exposure,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold">Executive Dashboard</h1>
        {isSampleData && (
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Sample Data
          </span>
        )}
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        {customers.length} customers · {csvFileName} · {pdfFileName ?? "no policy uploaded"} · analysed{" "}
        {analysedAt.toLocaleDateString()}, {analysedAt.toLocaleTimeString()}
      </p>

      {/* Category KPI cards */}
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {categorySummary.map((s) => (
          <div key={s.category} className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOURS[s.category] }} />
              <span className="text-sm font-medium">{s.category}</span>
            </div>
            <div className="mt-2 text-3xl font-semibold">{s.count}</div>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {s.pctOfCustomers.toFixed(1)}% of customers · {formatCompactCurrency(s.exposure)} exposure (
              {s.pctOfExposure.toFixed(1)}%)
            </p>
          </div>
        ))}
      </div>

      {/* Total exposure */}
      <div className="mt-5 rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Total Portfolio Exposure
        </p>
        <p className="mt-1 text-3xl font-semibold">{formatCurrency(total)}</p>
      </div>

      {/* Chart row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold">Customers &amp; Exposure by Risk Category</h3>
          <div className="mt-3">
            <CategoryLegend />
          </div>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => formatCompactCurrency(Number(v))}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) =>
                    name === "exposure" ? formatCurrency(Number(value)) : value
                  }
                />
                <Bar yAxisId="left" dataKey="customers" name="Customers" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLOURS[entry.category as RiskCategory]} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="exposure" name="Exposure" fill={EXPOSURE_COLOUR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold">Exposure by Industry Sector</h3>
          <div className="mt-3 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="exposure"
                  nameKey="industry"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(entry: any) => entry.industry ?? entry.name}
                >
                  {industryData.map((entry, idx) => (
                    <Cell key={entry.industry} fill={INDUSTRY_PALETTE[idx % INDUSTRY_PALETTE.length]} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="mt-5 rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold">Portfolio Risk Trend</h3>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          Illustrative trend leading up to current position
        </p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="averageRiskScore"
                name="Average Risk Score"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 table */}
      <div className="mt-5 rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold">Top 10 Highest-Risk Customers</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Customer</th>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Industry</th>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Credit Score</th>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Repayment Status</th>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Loan Balance</th>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Risk Score</th>
                <th className="py-2 pr-4 font-medium" style={{ color: "var(--muted)" }}>Category</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((c) => (
                <tr key={c.customerId} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2 pr-4">{c.customerName}</td>
                  <td className="py-2 pr-4">{c.industrySector}</td>
                  <td className="py-2 pr-4">{c.creditScore}</td>
                  <td className="py-2 pr-4">{c.repaymentStatus}</td>
                  <td className="py-2 pr-4">{formatCurrency(c.loanBalance)}</td>
                  <td className="py-2 pr-4">{c.riskScore.toFixed(1)}</td>
                  <td className="py-2 pr-4">
                    <RiskBadge category={c.category} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold">Recommended Actions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {actions.map((action, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold">Scoring Methodology</h3>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight × Repayment Status
            Factor) + (Exposure Weight × Loan Balance Factor)
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Green 0–{RISK_THRESHOLDS.greenMax} · Amber {RISK_THRESHOLDS.greenMax + 1}–{RISK_THRESHOLDS.amberMax} ·
            Red {RISK_THRESHOLDS.amberMax + 1}–100
          </p>

          <h4 className="mt-4 text-sm font-semibold">Extracted Policy Highlights</h4>
          {!pdfFileName ? (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              No policy PDF was uploaded, so no rules were extracted for this analysis.
            </p>
          ) : pdfParseFailed ? (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Could not extract text from {pdfFileName}.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                Heuristic extraction from {pdfFileName} — {pdfPageCount} page(s) scanned.
              </p>
              {rules.length === 0 ? (
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                  No policy rules were identified in this document.
                </p>
              ) : (
                <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm">
                  {rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="border-l-2 pl-3"
                      style={{ borderColor: "var(--accent)" }}
                    >
                      {rule.text}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
