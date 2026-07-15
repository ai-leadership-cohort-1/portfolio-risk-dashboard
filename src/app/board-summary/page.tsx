"use client";

import Link from "next/link";
import { useAnalysis } from "@/context/AnalysisContext";
import {
  exposureByIndustry,
  recommendedActions,
  summariseByCategory,
  totalExposure,
} from "@/lib/aggregations";

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function healthAssessment(redSharePct: number, amberSharePct: number): {
  label: string;
  colour: string;
  description: string;
} {
  if (redSharePct > 20) {
    return {
      label: "Elevated Risk",
      colour: "var(--risk-red)",
      description:
        "Red-category exposure is materially above normal tolerance. The Committee should treat this as a priority item for the current review cycle.",
    };
  }
  if (redSharePct > 10 || amberSharePct > 35) {
    return {
      label: "Requires Attention",
      colour: "var(--risk-amber)",
      description:
        "Risk concentration is trending toward the upper end of acceptable tolerance. Continued monitoring and targeted remediation are recommended.",
    };
  }
  return {
    label: "Sound",
    colour: "var(--risk-green)",
    description:
      "The portfolio is operating within normal risk tolerance across credit, repayment, and exposure dimensions.",
  };
}

export default function BoardSummaryPage() {
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

  const { customers, analysedAt, isSampleData } = result;
  const categorySummary = summariseByCategory(customers);
  const total = totalExposure(customers);
  const industries = exposureByIndustry(customers);
  const actions = recommendedActions(customers);

  const red = categorySummary.find((c) => c.category === "Red")!;
  const amber = categorySummary.find((c) => c.category === "Amber")!;
  const green = categorySummary.find((c) => c.category === "Green")!;

  const topIndustry = industries[0];
  const topIndustryShare = total > 0 && topIndustry ? (topIndustry.exposure / total) * 100 : 0;

  const health = healthAssessment(red.pctOfExposure, amber.pctOfExposure);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold text-[var(--foreground)]">
            Board Executive Summary
          </h1>
          {isSampleData && (
            <span className="rounded-md bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold uppercase text-white">
              Sample Data
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Prepared for Board / Executive Committee review · {customers.length} customers ·
          analysed {analysedAt.toLocaleDateString()}, {analysedAt.toLocaleTimeString()}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">
          Overall Portfolio Health
        </h2>
        <div className="mt-2 flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: health.colour }}
          />
          <span className="text-2xl font-semibold text-[var(--foreground)]">{health.label}</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">{health.description}</p>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">Key Findings</h2>
        <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
          <p>
            Of {customers.length} customers assessed, {green.count} ({green.pctOfCustomers.toFixed(1)}%)
            are classified Green (low risk), {amber.count} ({amber.pctOfCustomers.toFixed(1)}%) are
            Amber (medium risk), and {red.count} ({red.pctOfCustomers.toFixed(1)}%) are Red (high
            risk).
          </p>
          <p>
            Red-category customers account for {formatFullCurrency(red.exposure)} in exposure —{" "}
            {red.pctOfExposure.toFixed(1)}% of total portfolio exposure — concentrated in a
            comparatively small number of relationships.
          </p>
          {topIndustry && (
            <p>
              {topIndustry.industry} is the largest single-sector exposure at{" "}
              {formatFullCurrency(topIndustry.exposure)} ({topIndustryShare.toFixed(1)}% of the
              portfolio).
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">
            Largest Risk Concentrations
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
            <li>
              <span className="font-medium">Red exposure:</span>{" "}
              {formatFullCurrency(red.exposure)} ({red.pctOfExposure.toFixed(1)}% of portfolio)
            </li>
            <li>
              <span className="font-medium">Amber exposure:</span>{" "}
              {formatFullCurrency(amber.exposure)} ({amber.pctOfExposure.toFixed(1)}% of portfolio)
            </li>
            {industries.slice(0, 3).map((ind) => (
              <li key={ind.industry}>
                <span className="font-medium">{ind.industry}:</span>{" "}
                {formatFullCurrency(ind.exposure)} (
                {total > 0 ? ((ind.exposure / total) * 100).toFixed(1) : "0.0"}% of portfolio)
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">
            Estimated Total Exposure
          </h2>
          <div className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
            {formatFullCurrency(total)}
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Across {customers.length} active lending relationships in the assessed portfolio.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-[var(--muted)]">Recommended Actions</h2>
        <ul className="mt-3 space-y-2">
          {actions.map((action, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
              <span>{action.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-[var(--muted)]">
        This summary is generated automatically from the uploaded portfolio and is intended to
        support Board / Executive Committee discussion — it is not a substitute for full credit
        risk review.
      </p>
    </div>
  );
}
