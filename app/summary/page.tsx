"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataProvider";
import {
  summariseByCategory,
  summariseBySector,
  generateRecommendedActions,
  assessPortfolioHealth,
  formatAud,
} from "@/lib/aggregate";
import RecommendedActionsList from "@/components/RecommendedActionsList";

const RATING_STYLE: Record<string, string> = {
  Sound: "bg-green/10 text-green border-green/30",
  Watch: "bg-amber/10 text-amber border-amber/30",
  "Elevated Risk": "bg-red/10 text-red border-red/30",
};

export default function SummaryPage() {
  const { scored, policy, hasData } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!hasData) router.replace("/");
  }, [hasData, router]);

  const categories = useMemo(() => summariseByCategory(scored), [scored]);
  const sectors = useMemo(() => summariseBySector(scored), [scored]);
  const actions = useMemo(
    () => generateRecommendedActions(scored, policy?.rules ?? []),
    [scored, policy]
  );
  const health = useMemo(() => assessPortfolioHealth(categories, sectors), [categories, sectors]);

  if (!hasData) return null;

  const totalExposure = scored.reduce((s, c) => s + c.loanBalance, 0);
  const red = categories.find((c) => c.category === "Red")!;
  const amber = categories.find((c) => c.category === "Amber")!;
  const green = categories.find((c) => c.category === "Green")!;
  const topSectors = sectors.slice(0, 3);
  const today = new Date().toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="no-print mb-6 flex justify-end">
        <button
          onClick={() => window.print()}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
        >
          Print / Save as PDF
        </button>
      </div>

      <header className="border-b border-border pb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Board &amp; Executive Committee Briefing
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Portfolio Risk — Executive Summary
        </h1>
        <p className="mt-1 text-sm text-muted">
          Prepared {today} · {scored.length} customers · {formatAud(totalExposure)} total exposure
        </p>
        <p className="mt-2 text-xs italic text-muted">
          Internal prototype output for pre-screening discussion only. Not a credit decision or
          a substitute for full Credit Committee assessment.
        </p>
      </header>

      {/* Portfolio health */}
      <section className="mt-6">
        <div className={`rounded-lg border p-4 ${RATING_STYLE[health.rating]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide">Overall Portfolio Health</p>
          <p className="mt-1 text-xl font-semibold">{health.rating}</p>
          <p className="mt-2 text-sm leading-relaxed">{health.description}</p>
        </div>
      </section>

      {/* Key findings */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Key Findings</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/90">
          <li>
            The portfolio comprises {scored.length} customers totalling {formatAud(totalExposure)}{" "}
            in exposure: {green.count} Green ({green.sharePct.toFixed(1)}% of exposure),{" "}
            {amber.count} Amber ({amber.sharePct.toFixed(1)}%), and {red.count} Red (
            {red.sharePct.toFixed(1)}%).
          </li>
          <li>
            The largest single exposure sector is {topSectors[0]?.sector ?? "n/a"} at{" "}
            {formatAud(topSectors[0]?.exposure ?? 0)} ({topSectors[0]?.sharePct.toFixed(1)}% of
            the book, {topSectors[0]?.count} customers).
          </li>
          <li>
            {red.count > 0
              ? `${red.count} customer${red.count === 1 ? " requires" : "s require"} immediate attention, representing ${formatAud(red.exposure)} of exposure at elevated risk of loss.`
              : "No customers currently sit in the Red (high risk) category."}
          </li>
          {policy && policy.rules.length > 0 && (
            <li>
              {policy.rules.length} lending/risk rules were extracted from the supplied policy
              document (&ldquo;{policy.fileName}&rdquo;) and used as reference context for the
              recommendations below.
            </li>
          )}
        </ul>
      </section>

      {/* Concentrations */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Largest Risk Concentrations
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Sector</th>
                <th className="py-2 pr-3 font-medium">Customers</th>
                <th className="py-2 pr-3 font-medium">Exposure</th>
                <th className="py-2 pr-3 font-medium">Share of book</th>
              </tr>
            </thead>
            <tbody>
              {sectors.slice(0, 5).map((s) => (
                <tr key={s.sector} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-3 font-medium text-foreground">{s.sector}</td>
                  <td className="py-2 pr-3 text-muted">{s.count}</td>
                  <td className="py-2 pr-3 text-muted">{formatAud(s.exposure)}</td>
                  <td className="py-2 pr-3 text-muted">{s.sharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Estimated exposure */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Estimated Exposure by Risk Category
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {categories.map((c) => (
            <div key={c.category} className="rounded-lg border border-border bg-surface p-3">
              <p className="text-xs font-medium text-muted">{c.category}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{formatAud(c.exposure)}</p>
              <p className="text-xs text-muted">
                {c.count} customers · {c.sharePct.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended actions */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Recommended Actions
        </h2>
        <div className="mt-3">
          <RecommendedActionsList actions={actions} />
        </div>
      </section>

      <section className="mt-8 border-t border-border pt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Methodology</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight ×
          Repayment Status Factor) + (Exposure Weight × Loan Balance Factor), each factor
          normalised to 0–100. Weights and category thresholds are documented and editable in
          lib/scoring.ts. See the Dashboard page for full charts and the underlying customer
          list.
        </p>
      </section>
    </div>
  );
}
