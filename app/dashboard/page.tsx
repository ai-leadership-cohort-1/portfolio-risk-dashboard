"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/components/AppDataProvider";
import {
  summariseByCategory,
  summariseBySector,
  topRiskCustomers,
  generateRecommendedActions,
  formatAud,
} from "@/lib/aggregate";
import { buildIllustrativeTrend } from "@/lib/trend";
import { CategoryCountChart, CategoryExposureChart } from "@/components/charts/CategorySummaryChart";
import SectorExposureChart from "@/components/charts/SectorExposureChart";
import RiskTrendChart from "@/components/charts/RiskTrendChart";
import TopRiskTable from "@/components/TopRiskTable";
import RecommendedActionsList from "@/components/RecommendedActionsList";
import KpiCard from "@/components/KpiCard";

export default function DashboardPage() {
  const { scored, policy, hasData } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!hasData) router.replace("/");
  }, [hasData, router]);

  const categories = useMemo(() => summariseByCategory(scored), [scored]);
  const sectors = useMemo(() => summariseBySector(scored), [scored]);
  const top10 = useMemo(() => topRiskCustomers(scored, 10), [scored]);
  const actions = useMemo(
    () => generateRecommendedActions(scored, policy?.rules ?? []),
    [scored, policy]
  );
  const trend = useMemo(() => buildIllustrativeTrend(scored), [scored]);

  if (!hasData) return null;

  const totalExposure = scored.reduce((s, c) => s + c.loanBalance, 0);
  const avgScore = scored.length ? scored.reduce((s, c) => s + c.riskScore, 0) / scored.length : 0;
  const green = categories.find((c) => c.category === "Green")!;
  const amber = categories.find((c) => c.category === "Amber")!;
  const red = categories.find((c) => c.category === "Red")!;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            {scored.length} customers · {formatAud(totalExposure)} total exposure · avg. risk
            score {avgScore.toFixed(1)} / 100
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total exposure" value={formatAud(totalExposure)} sublabel={`${scored.length} customers`} />
        <KpiCard label="Green (low risk)" value={String(green.count)} sublabel={formatAud(green.exposure)} accent="green" />
        <KpiCard label="Amber (medium risk)" value={String(amber.count)} sublabel={formatAud(amber.exposure)} accent="amber" />
        <KpiCard label="Red (high risk)" value={String(red.count)} sublabel={formatAud(red.exposure)} accent="red" />
      </div>

      {/* Category charts */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Customers by risk category</h2>
          <CategoryCountChart data={categories} />
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Exposure by risk category</h2>
          <CategoryExposureChart data={categories} />
        </div>
      </div>

      {/* Sector + trend */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Exposure by industry sector</h2>
          <p className="mt-0.5 text-xs text-muted">Darker bars indicate sectors with Red-rated exposure.</p>
          <div className="mt-2">
            <SectorExposureChart data={sectors} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Portfolio risk trend</h2>
          <p className="mt-0.5 text-xs text-muted">
            Illustrative — this prototype only sees a single snapshot upload, so the trailing
            5 months are a synthetic walk toward today&rsquo;s real average score. Swap in real
            historical snapshots for production use.
          </p>
          <RiskTrendChart data={trend} />
        </div>
      </div>

      {/* Top 10 + actions */}
      <div className="mt-5 grid gap-5 xl:grid-cols-5">
        <div className="rounded-lg border border-border bg-surface p-5 xl:col-span-3">
          <h2 className="text-sm font-semibold text-foreground">Top 10 highest-risk customers</h2>
          <div className="mt-3">
            <TopRiskTable customers={top10} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-5 xl:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Recommended actions</h2>
          <div className="mt-3">
            <RecommendedActionsList actions={actions} />
          </div>
        </div>
      </div>

      {policy && policy.rules.length > 0 && (
        <div className="mt-5 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Extracted policy highlights</h2>
          <p className="mt-0.5 text-xs text-muted">
            Keyword-matched clauses from &ldquo;{policy.fileName}&rdquo; ({policy.pageCount} page
            {policy.pageCount === 1 ? "" : "s"}). Heuristic extraction — always confirm against
            the source document.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-foreground/90">
            {policy.rules.map((rule) => (
              <li key={rule.id} className="border-l-2 border-accent/40 pl-3">
                {rule.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
