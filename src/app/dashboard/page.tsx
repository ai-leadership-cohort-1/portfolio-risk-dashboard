"use client";

import Link from "next/link";
import { useAnalysis } from "@/context/AnalysisContext";
import { RiskBadge } from "@/components/RiskBadge";
import {
  categorySummaries,
  totalExposure,
  exposureByIndustry,
  topRiskCustomers,
  generatePortfolioTrend,
  recommendedActions,
  sectorTrends,
  sectorTrendInsights,
} from "@/lib/aggregations";
import { RISK_THRESHOLDS, DEFAULT_WEIGHTS } from "@/lib/riskScoring";
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

const CATEGORY_COLORS: Record<string, string> = {
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

function compactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function fullCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function CategoryBarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)] mt-2">
      <div className="flex items-center gap-2">
        <span>Customers:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CATEGORY_COLORS.Green }} />
          Green
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CATEGORY_COLORS.Amber }} />
          Amber
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CATEGORY_COLORS.Red }} />
          Red
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#333a42" }} />
        Exposure
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-lg font-medium mb-4">No analysis loaded yet</p>
        <Link
          href="/"
          className="bg-[var(--accent)] text-white text-sm font-medium px-5 py-2.5 rounded-md hover:opacity-90"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { customers, rules, csvFileName, pdfFileName, pdfPageCount, analysedAt, isSampleData } =
    result;

  const summaries = categorySummaries(customers);
  const total = totalExposure(customers);
  const byIndustry = exposureByIndustry(customers);
  const top10 = topRiskCustomers(customers, 10);
  const trend = generatePortfolioTrend(customers);
  const actions = recommendedActions(customers);
  const sectors = sectorTrends(customers);
  const sectorInsights = sectorTrendInsights(customers);

  const barData = summaries.map((s) => ({
    category: s.category,
    customers: s.count,
    exposure: s.exposure,
  }));

  const dateStr = analysedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = analysedAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">Executive Dashboard</h1>
          {isSampleData && (
            <span className="bg-[var(--accent)] text-white text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
              Sample Data
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--muted)] mt-2">
          {customers.length} customers · {csvFileName} · {pdfFileName ?? "no policy uploaded"} ·
          analysed {dateStr}, {timeStr}
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {summaries.map((s) => (
          <div
            key={s.category}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: CATEGORY_COLORS[s.category] }}
              />
              <span className="text-sm font-medium">
                {s.category} ({s.category === "Green" ? "Low" : s.category === "Amber" ? "Medium" : "High"}{" "}
                Risk)
              </span>
            </div>
            <div className="text-3xl font-semibold mt-2">{s.count}</div>
            <p className="text-xs text-[var(--muted)] mt-1">
              {s.pctOfCustomers.toFixed(1)}% of customers · {compactCurrency(s.exposure)} exposure (
              {s.pctOfExposure.toFixed(1)}%)
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <p className="text-sm text-[var(--muted)]">Total portfolio exposure</p>
        <p className="text-3xl font-semibold mt-1">{fullCurrency(total)}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Customers &amp; Exposure by Risk Category</h3>
          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="var(--muted)" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="var(--muted)" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted)"
                  tickFormatter={(v: number) => compactCurrency(v)}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any, name: any) =>
                    name === "exposure" ? [compactCurrency(Number(value)), "Exposure"] : [value, "Customers"]
                  }
                />
                <Bar yAxisId="left" dataKey="customers" name="Customers" radius={[4, 4, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category]} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="exposure" name="Exposure" fill="#333a42" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <CategoryBarLegend />
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Exposure by Industry Sector</h3>
          <div className="h-72 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byIndustry}
                  dataKey="exposure"
                  nameKey="industry"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={(entry: any) => entry.name ?? entry.industry}
                  labelLine={false}
                >
                  {byIndustry.map((entry, idx) => (
                    <Cell key={entry.industry} fill={INDUSTRY_PALETTE[idx % INDUSTRY_PALETTE.length]} />
                  ))}
                </Pie>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => compactCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Key Emerging Trends by Sector</h3>
        <p className="text-xs text-[var(--muted)] mt-0.5 mb-4">
          Patterns across industry segments — where risk is concentrated, not just where exposure sits
        </p>

        <ul className="flex flex-col gap-2 mb-5">
          {sectorInsights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
                <th className="pb-2 pr-4">Industry</th>
                <th className="pb-2 pr-4">Customers</th>
                <th className="pb-2 pr-4">Avg Risk Score</th>
                <th className="pb-2 pr-4">Green / Amber / Red</th>
                <th className="pb-2 pr-4">Exposure</th>
                <th className="pb-2">% of Portfolio Exposure</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((s) => (
                <tr key={s.industry} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-4">{s.industry}</td>
                  <td className="py-2 pr-4">{s.count}</td>
                  <td className="py-2 pr-4">{s.avgRiskScore.toFixed(1)}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[var(--risk-green)]">{s.greenCount}</span>
                    {" / "}
                    <span className="text-[var(--risk-amber)]">{s.amberCount}</span>
                    {" / "}
                    <span className="text-[var(--risk-red)]">{s.redCount}</span>
                  </td>
                  <td className="py-2 pr-4">{compactCurrency(s.exposure)}</td>
                  <td className="py-2">{s.exposureSharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold">Portfolio Risk Trend</h3>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Illustrative trend leading up to current position
        </p>
        <div className="h-64 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" domain={[0, 100]} />
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

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm overflow-x-auto">
        <h3 className="text-sm font-semibold mb-3">Top 10 Highest-Risk Customers</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[var(--muted)] border-b border-[var(--border)]">
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
                <td className="py-2 pr-4">{c.customerName}</td>
                <td className="py-2 pr-4">{c.industrySector}</td>
                <td className="py-2 pr-4">{c.creditScore}</td>
                <td className="py-2 pr-4">{c.repaymentStatus}</td>
                <td className="py-2 pr-4">{fullCurrency(c.loanBalance)}</td>
                <td className="py-2 pr-4">{c.riskScore.toFixed(1)}</td>
                <td className="py-2">
                  <RiskBadge category={c.category} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">Recommended Actions</h3>
          <ul className="flex flex-col gap-2">
            {actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-2">Scoring Methodology</h3>
          <p className="text-sm text-[var(--muted)] mb-2">
            Risk Score = ({Math.round(DEFAULT_WEIGHTS.creditRiskWeight * 100)}% × Credit Score
            Factor) + ({Math.round(DEFAULT_WEIGHTS.repaymentRiskWeight * 100)}% × Repayment Status
            Factor) + ({Math.round(DEFAULT_WEIGHTS.exposureWeight * 100)}% × Loan Balance Factor)
          </p>
          <p className="text-sm text-[var(--muted)] mb-4">
            Green 0–{RISK_THRESHOLDS.greenMax} · Amber {RISK_THRESHOLDS.greenMax + 1}–
            {RISK_THRESHOLDS.amberMax} · Red {RISK_THRESHOLDS.amberMax + 1}–100
          </p>

          <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
            Extracted Policy Highlights
          </h4>
          {!pdfFileName && (
            <p className="text-sm text-[var(--muted)]">
              No policy PDF was uploaded, so no rules were extracted for this analysis.
            </p>
          )}
          {pdfFileName && result.pdfParseFailed && (
            <p className="text-sm text-[var(--muted)]">
              Could not extract text from {pdfFileName}. {result.pdfParseError ?? ""}
            </p>
          )}
          {pdfFileName && !result.pdfParseFailed && (
            <>
              <p className="text-sm text-[var(--muted)] mb-2">
                Heuristic extraction from {pdfFileName} — {pdfPageCount ?? 0} page(s) scanned.
              </p>
              {rules.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No rule-like statements were found in this document.
                </p>
              ) : (
                <ul className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
                  {rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="text-sm border-l-2 border-[var(--accent)] pl-3 py-0.5 text-[var(--foreground)]"
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
