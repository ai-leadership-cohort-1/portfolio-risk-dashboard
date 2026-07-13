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
import RiskBadge from "@/components/RiskBadge";
import { useAnalysis } from "@/context/AnalysisContext";
import {
  categorySummaries,
  exposureByIndustry,
  generatePortfolioTrend,
  recommendedActions,
  topRiskCustomers,
  totalExposure,
} from "@/lib/aggregations";
import { formatCompactCurrency, formatFullCurrency } from "@/lib/format";
import { RISK_THRESHOLDS } from "@/lib/riskScoring";
import type { RiskCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  Green: "#2f7d4f",
  Amber: "#b5720f",
  Red: "#b13030",
};

const EXPOSURE_BAR_COLOR = "#333a42";

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

function CategoryExposureLegend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
      <span className="font-medium text-[var(--foreground)]">Customers:</span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.Green }} /> Green
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.Amber }} /> Amber
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS.Red }} /> Red
      </span>
      <span className="ml-2 flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EXPOSURE_BAR_COLOR }} /> Exposure
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium text-[var(--foreground)]">No analysis loaded yet</p>
        <Link
          href="/"
          className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { customers, rules, csvFileName, pdfFileName, pdfPageCount, analysedAt, isSampleData, pdfParseFailed } =
    result;

  const summaries = categorySummaries(customers);
  const totalExp = totalExposure(customers);
  const industryData = exposureByIndustry(customers);
  const trendData = generatePortfolioTrend(customers);
  const top10 = topRiskCustomers(customers, 10);
  const actions = recommendedActions(customers);

  const barData = summaries.map((s) => ({
    category: s.category,
    customers: s.count,
    exposure: s.exposure,
  }));

  const analysedDateLabel = analysedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const analysedTimeLabel = analysedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Executive Dashboard</h1>
        {isSampleData && (
          <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Sample Data
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {customers.length} customers · {csvFileName} · {pdfFileName ?? "no policy uploaded"} · analysed{" "}
        {analysedDateLabel}, {analysedTimeLabel}
      </p>

      {/* Category KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {summaries.map((s) => (
          <div key={s.category} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[s.category] }} />
              <span className="text-sm font-medium text-[var(--foreground)]">
                {s.category} ({s.category === "Green" ? "Low" : s.category === "Amber" ? "Medium" : "High"} Risk)
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{s.count}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {s.pctOfCustomers.toFixed(1)}% of customers · {formatCompactCurrency(s.exposure)} exposure (
              {s.pctOfExposure.toFixed(1)}%)
            </p>
          </div>
        ))}
      </div>

      {/* Total exposure */}
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-[var(--muted)]">Total Portfolio Exposure</p>
        <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{formatFullCurrency(totalExp)}</p>
      </div>

      {/* Chart row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Customers &amp; Exposure by Risk Category</h2>
          <CategoryExposureLegend />
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--muted)" fontSize={12} />
                <YAxis yAxisId="left" stroke="var(--muted)" fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--muted)"
                  fontSize={12}
                  tickFormatter={(v: number) => formatCompactCurrency(v)}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) =>
                    name === "exposure" ? [formatFullCurrency(Number(value)), "Exposure"] : [value, "Customers"]
                  }
                />
                <Bar yAxisId="left" dataKey="customers" name="Customers" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as RiskCategory]} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="exposure" name="Exposure" fill={EXPOSURE_BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Exposure by Industry Sector</h2>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="exposure"
                  nameKey="industry"
                  outerRadius={90}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(entry: any) => entry.industry ?? entry.name}
                >
                  {industryData.map((entry, idx) => (
                    <Cell key={entry.industry} fill={INDUSTRY_PALETTE[idx % INDUSTRY_PALETTE.length]} />
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
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Portfolio Risk Trend</h2>
        <p className="text-sm text-[var(--muted)]">Illustrative trend leading up to current position</p>
        <div className="mt-3 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" stroke="var(--muted)" fontSize={12} />
              <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => Number(value).toFixed(1)}
              />
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
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Top 10 Highest-Risk Customers</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Industry</th>
                <th className="py-2 pr-4 font-medium">Credit Score</th>
                <th className="py-2 pr-4 font-medium">Repayment Status</th>
                <th className="py-2 pr-4 font-medium">Loan Balance</th>
                <th className="py-2 pr-4 font-medium">Risk Score</th>
                <th className="py-2 pr-4 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((c) => (
                <tr key={c.customerId} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-4 text-[var(--foreground)]">{c.customerName}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{c.industrySector}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{c.creditScore}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{c.repaymentStatus}</td>
                  <td className="py-2 pr-4 text-[var(--muted)]">{formatFullCurrency(c.loanBalance)}</td>
                  <td className="py-2 pr-4 text-[var(--foreground)]">{c.riskScore.toFixed(1)}</td>
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
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Recommended Actions</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
            {actions.map((action, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Scoring Methodology</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight × Repayment Status
            Factor) + (Exposure Weight × Loan Balance Factor)
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Green 0–{RISK_THRESHOLDS.greenMax} · Amber {RISK_THRESHOLDS.greenMax + 1}–{RISK_THRESHOLDS.amberMax} · Red{" "}
            {RISK_THRESHOLDS.amberMax + 1}–100
          </p>

          <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">Extracted Policy Highlights</h3>
          {!pdfFileName && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              No policy PDF was uploaded, so no rules were extracted for this analysis.
            </p>
          )}
          {pdfFileName && pdfParseFailed && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Could not extract text from {pdfFileName}. It may be a scanned/image-only PDF or an unsupported
              browser environment.
            </p>
          )}
          {pdfFileName && !pdfParseFailed && (
            <>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Heuristic extraction from {pdfFileName} — {pdfPageCount ?? 0} page(s) scanned.
              </p>
              {rules.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">No rule statements were identified in this document.</p>
              ) : (
                <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-sm text-[var(--foreground)]">
                  {rules.map((rule, idx) => (
                    <li key={idx} className="border-l-2 border-[var(--accent)] py-0.5 pl-3">
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
