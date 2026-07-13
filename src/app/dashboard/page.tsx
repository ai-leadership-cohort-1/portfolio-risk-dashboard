"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";
import { useAnalysis } from "@/context/AnalysisContext";
import RiskBadge from "@/components/RiskBadge";
import {
  summariseByCategory,
  totalExposure,
  topRiskCustomers,
  exposureByIndustry,
  generatePortfolioTrend,
  averageRiskScore,
  recommendedActions,
} from "@/lib/aggregations";
import { RISK_THRESHOLDS } from "@/lib/riskScoring";
import { RiskCategory } from "@/lib/types";

const CATEGORY_COLOR: Record<RiskCategory, string> = {
  Green: "#2f7d4f",
  Amber: "#b5720f",
  Red: "#b13030",
};
const EXPOSURE_COLOR = "#333a42";
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

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function CategoryLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
      <span className="font-medium text-[var(--foreground)]">Customers:</span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR.Green }} /> Green
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR.Amber }} /> Amber
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR.Red }} /> Red
      </span>
      <span className="ml-2 flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: EXPOSURE_COLOR }} /> Exposure
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg text-[var(--muted)]">No analysis loaded yet</p>
        <Link
          href="/"
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { customers, rules, csvFileName, pdfFileName, pdfPageCount, analysedAt, isSampleData } = result;

  const categories = summariseByCategory(customers);
  const exposure = totalExposure(customers);
  const top10 = topRiskCustomers(customers, 10);
  const industryData = exposureByIndustry(customers);
  const avgRisk = averageRiskScore(customers);
  const trend = generatePortfolioTrend(avgRisk);
  const actions = recommendedActions(customers);

  const categoryChartData = categories.map((c) => ({
    category: c.category,
    Customers: c.count,
    Exposure: c.exposure,
  }));

  const dateStr = analysedAt.toLocaleDateString("en-AU");
  const timeStr = analysedAt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">Executive Dashboard</h1>
          {isSampleData && (
            <span className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Sample Data
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {customers.length} customers · {csvFileName} · {pdfFileName ?? "no policy uploaded"} · analysed{" "}
          {dateStr}, {timeStr}
        </p>
      </div>

      {/* Category KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {categories.map((c) => (
          <div key={c.category} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOR[c.category] }} />
              <span className="text-sm font-medium text-[var(--foreground)]">{c.category}</span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{c.count}</div>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {c.pctOfCustomers}% of customers · {formatCompactCurrency(c.exposure)} exposure ({c.pctOfExposure}%)
            </p>
          </div>
        ))}
      </div>

      {/* Total exposure */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <p className="text-sm text-[var(--muted)]">Total portfolio exposure</p>
        <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{formatFullCurrency(exposure)}</p>
      </div>

      {/* Chart row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Customers &amp; Exposure by Risk Category
          </h2>
          <div className="mt-2">
            <CategoryLegend />
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
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
                    name === "Exposure" ? [formatFullCurrency(Number(value)), name] : [value, name]
                  }
                />
                <Bar yAxisId="left" dataKey="Customers" name="Customers">
                  {categoryChartData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLOR[entry.category as RiskCategory]} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="Exposure" name="Exposure" fill={EXPOSURE_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Exposure by Industry Sector</h2>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="exposure"
                  nameKey="industry"
                  label={(entry: { industry?: string; name?: string }) => entry.industry ?? entry.name ?? ""}
                  outerRadius={90}
                >
                  {industryData.map((entry, i) => (
                    <Cell key={entry.industry} fill={INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => formatFullCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend chart */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Portfolio Risk Trend</h2>
        <p className="text-xs text-[var(--muted)]">Illustrative trend leading up to current position</p>
        <div className="mt-4 h-72 w-full">
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
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Top 10 Highest-Risk Customers</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Industry</th>
                <th className="py-2 pr-4">Credit Score</th>
                <th className="py-2 pr-4">Repayment Status</th>
                <th className="py-2 pr-4">Loan Balance</th>
                <th className="py-2 pr-4">Risk Score</th>
                <th className="py-2 pr-4">Category</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((c) => (
                <tr key={c.customerId} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-4 font-medium text-[var(--foreground)]">{c.customerName}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{c.industrySector}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{c.creditScore}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{c.repaymentStatus}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{formatFullCurrency(c.loanBalance)}</td>
                  <td className="py-2 pr-4 text-[var(--foreground)]">{c.riskScore}</td>
                  <td className="py-2 pr-4">
                    <RiskBadge category={c.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Recommended Actions</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {actions.map((action, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--foreground)]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Scoring Methodology</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight ×
            Repayment Status Factor) + (Exposure Weight × Loan Balance Factor)
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Green 0–{RISK_THRESHOLDS.greenMax} · Amber {RISK_THRESHOLDS.greenMax + 1}–
            {RISK_THRESHOLDS.amberMax} · Red {RISK_THRESHOLDS.amberMax + 1}–100
          </p>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Extracted Policy Highlights
          </h3>
          {pdfFileName ? (
            <>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Heuristic extraction from {pdfFileName} — {pdfPageCount} page(s) scanned.
              </p>
              {rules.length > 0 ? (
                <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                  {rules.map((rule, i) => (
                    <li
                      key={i}
                      className="border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--foreground)]"
                    >
                      {rule.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  No policy rules were detected in this document.
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted)]">
              No policy PDF was uploaded, so no rules were extracted for this analysis.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
