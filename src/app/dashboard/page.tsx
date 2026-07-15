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
  exposureByIndustry,
  generatePortfolioTrend,
  recommendedActions,
  summariseByCategory,
  topRiskCustomers,
  totalExposure,
} from "@/lib/aggregations";
import { RISK_THRESHOLDS } from "@/lib/riskScoring";
import { RiskCategory } from "@/lib/types";

const CATEGORY_COLOURS: Record<RiskCategory, string> = {
  Green: "#2f7d4f",
  Amber: "#b5720f",
  Red: "#b13030",
};

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
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOURS.Green }} />
        Green
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOURS.Amber }} />
        Amber
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLOURS.Red }} />
        Red
      </span>
      <span className="flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#333a42" }} />
        Exposure
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
          className="mt-4 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { customers, isSampleData, csvFileName, pdfFileName, analysedAt, rules, weights } = result;

  const categorySummary = summariseByCategory(customers);
  const total = totalExposure(customers);
  const industryData = exposureByIndustry(customers);
  const trendData = generatePortfolioTrend(customers);
  const top10 = topRiskCustomers(customers, 10);
  const actions = recommendedActions(customers);

  const categoryChartData = categorySummary.map((c) => ({
    category: c.category,
    customers: c.count,
    exposure: c.exposure,
  }));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">Executive Dashboard</h1>
          {isSampleData && (
            <span className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold uppercase text-white">
              Sample Data
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {customers.length} customers · {csvFileName} · {pdfFileName ?? "no policy uploaded"} ·
          analysed {analysedAt.toLocaleDateString()}, {analysedAt.toLocaleTimeString()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {categorySummary.map((c) => (
          <div
            key={c.category}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: CATEGORY_COLOURS[c.category] }}
              />
              <span className="text-sm font-medium text-[var(--foreground)]">{c.category}</span>
            </div>
            <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{c.count}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {c.pctOfCustomers.toFixed(1)}% of customers · {formatCompactCurrency(c.exposure)}{" "}
              exposure ({c.pctOfExposure.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <div className="text-sm font-medium text-[var(--muted)]">Total portfolio exposure</div>
        <div className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
          {formatFullCurrency(total)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Customers &amp; Exposure by Risk Category
          </h3>
          <div className="mt-2">
            <CategoryLegend />
          </div>
          <div className="mt-4 h-72">
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
                    name === "exposure" ? formatFullCurrency(Number(value)) : value
                  }
                />
                <Bar yAxisId="left" dataKey="customers" name="Customers" radius={[4, 4, 0, 0]}>
                  {categoryChartData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLOURS[entry.category as RiskCategory]} />
                  ))}
                </Bar>
                <Bar
                  yAxisId="right"
                  dataKey="exposure"
                  name="Exposure"
                  fill="#333a42"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Exposure by Industry Sector</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  dataKey="exposure"
                  nameKey="industry"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(entry: any) => entry.name ?? entry.industry}
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Portfolio Risk Trend</h3>
        <p className="text-xs text-[var(--muted)]">Illustrative trend leading up to current position</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Top 10 Highest-Risk Customers</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted)]">
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Industry</th>
                <th className="pb-2 pr-4">Credit Score</th>
                <th className="pb-2 pr-4">Repayment Status</th>
                <th className="pb-2 pr-4">Loan Balance</th>
                <th className="pb-2 pr-4">Risk Score</th>
                <th className="pb-2">Category</th>
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
                  <td className="py-2 pr-4 font-medium text-[var(--foreground)]">{c.riskScore.toFixed(1)}</td>
                  <td className="py-2">
                    <RiskBadge category={c.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Recommended Actions</h3>
          <ul className="mt-3 space-y-2">
            {actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-[var(--muted)]">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                <span>{action.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Scoring Methodology</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Risk Score = ({(weights.creditRiskWeight * 100).toFixed(0)}% × Credit Score Factor) + (
            {(weights.repaymentRiskWeight * 100).toFixed(0)}% × Repayment Status Factor) + (
            {(weights.exposureWeight * 100).toFixed(0)}% × Loan Balance Factor)
          </p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            <li>Green: 0–{RISK_THRESHOLDS.greenMax}</li>
            <li>
              Amber: {RISK_THRESHOLDS.greenMax + 1}–{RISK_THRESHOLDS.amberMax}
            </li>
            <li>Red: {RISK_THRESHOLDS.amberMax + 1}–100</li>
          </ul>

          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <h4 className="text-xs font-semibold uppercase text-[var(--muted)]">
              Extracted Policy Highlights
            </h4>
            {!pdfFileName && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                No policy PDF was uploaded, so no rules were extracted for this analysis.
              </p>
            )}
            {pdfFileName && result.pdfParseFailed && (
              <p className="mt-2 text-sm text-[var(--risk-red)]">
                Could not extract text from {pdfFileName}
                {result.pdfParseErrorMessage ? `: ${result.pdfParseErrorMessage}` : "."}
              </p>
            )}
            {pdfFileName && !result.pdfParseFailed && (
              <>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Heuristic extraction from {pdfFileName}
                  {result.pdfPageCount != null ? ` — ${result.pdfPageCount} page(s) scanned.` : "."}
                </p>
                {rules.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    No policy rules were identified in this document.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {rules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--muted)]"
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
    </div>
  );
}
