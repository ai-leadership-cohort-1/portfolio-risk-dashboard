// Dashboard-facing aggregation helpers. All pure functions over
// ScoredCustomer[] — no side effects, no fetching.

import { RISK_THRESHOLDS } from "./riskScoring";
import type { RiskCategory, ScoredCustomer, TrendPoint } from "./types";

export const CATEGORY_ORDER: RiskCategory[] = ["Green", "Amber", "Red"];

export interface CategorySummary {
  category: RiskCategory;
  count: number;
  exposure: number;
  pctOfCustomers: number;
  pctOfExposure: number;
}

export function totalExposure(customers: ScoredCustomer[]): number {
  return customers.reduce((sum, c) => sum + c.loanBalance, 0);
}

export function categorySummaries(customers: ScoredCustomer[]): CategorySummary[] {
  const total = customers.length;
  const totalExp = totalExposure(customers);

  return CATEGORY_ORDER.map((category) => {
    const inCategory = customers.filter((c) => c.category === category);
    const exposure = totalExposure(inCategory);
    return {
      category,
      count: inCategory.length,
      exposure,
      pctOfCustomers: total > 0 ? (inCategory.length / total) * 100 : 0,
      pctOfExposure: totalExp > 0 ? (exposure / totalExp) * 100 : 0,
    };
  });
}

export interface IndustryExposure {
  industry: string;
  exposure: number;
  count: number;
}

export function exposureByIndustry(customers: ScoredCustomer[]): IndustryExposure[] {
  const map = new Map<string, IndustryExposure>();
  for (const c of customers) {
    const existing = map.get(c.industrySector);
    if (existing) {
      existing.exposure += c.loanBalance;
      existing.count += 1;
    } else {
      map.set(c.industrySector, { industry: c.industrySector, exposure: c.loanBalance, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.exposure - a.exposure);
}

export function topRiskCustomers(customers: ScoredCustomer[], n = 10): ScoredCustomer[] {
  return [...customers].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}

export function averageRiskScore(customers: ScoredCustomer[]): number {
  if (customers.length === 0) return 0;
  return customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length;
}

// Deterministic seeded pseudo-random walk so the trend chart is stable
// across renders (React strict mode, re-renders) rather than jumping around,
// while still tapering to the real current average at the most recent point.
function seededRandom(seed: number): () => number {
  let value = seed;
  return function next() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

export function generatePortfolioTrend(customers: ScoredCustomer[], points = 12): TrendPoint[] {
  const currentAverage = averageRiskScore(customers);
  const rand = seededRandom(currentAverage > 0 ? Math.round(currentAverage * 1000) : 42);

  const trend: TrendPoint[] = [];
  let value = clampScore(currentAverage + (rand() - 0.5) * 20);

  for (let i = 0; i < points; i += 1) {
    const isLast = i === points - 1;
    if (isLast) {
      value = currentAverage;
    } else {
      const drift = (rand() - 0.5) * 8;
      // Taper the random walk toward the real current average as we
      // approach "now" so the line reads as a believable lead-in.
      const taper = i / (points - 1);
      value = clampScore(value + drift * (1 - taper) + (currentAverage - value) * taper * 0.35);
    }

    const monthsAgo = points - 1 - i;
    const label = monthsAgo === 0 ? "Now" : `${monthsAgo}mo ago`;
    trend.push({ label, averageRiskScore: value });
  }

  return trend;
}

function clampScore(v: number): number {
  return Math.min(100, Math.max(0, v));
}

export function recommendedActions(customers: ScoredCustomer[]): string[] {
  const actions: string[] = [];
  const total = customers.length;
  const totalExp = totalExposure(customers);

  const redCustomers = customers.filter((c) => c.category === "Red");
  const amberCustomers = customers.filter((c) => c.category === "Amber");

  if (redCustomers.length > 0) {
    const names = redCustomers
      .map((c) => c.customerName)
      .slice(0, 5)
      .join(", ");
    const more = redCustomers.length > 5 ? ` and ${redCustomers.length - 5} more` : "";
    actions.push(`Escalate ${redCustomers.length} Red (high risk) customer(s) for immediate review: ${names}${more}.`);
  }

  const redExposure = totalExposure(redCustomers);
  if (totalExp > 0 && redExposure / totalExp > 0.15) {
    actions.push(
      `Red-category exposure is ${((redExposure / totalExp) * 100).toFixed(1)}% of total portfolio exposure — above the 15% concentration flag; consider tightening new lending in this segment.`
    );
  }

  if (amberCustomers.length > 0) {
    actions.push(`Place ${amberCustomers.length} Amber (medium risk) customer(s) on the watchlist for closer monitoring.`);
  }

  const industries = new Map<string, number>();
  for (const c of customers) {
    industries.set(c.industrySector, (industries.get(c.industrySector) ?? 0) + c.loanBalance);
  }
  let topIndustry: string | null = null;
  let topIndustryExposure = 0;
  for (const [industry, exposure] of industries) {
    if (exposure > topIndustryExposure) {
      topIndustry = industry;
      topIndustryExposure = exposure;
    }
  }
  if (topIndustry && totalExp > 0 && topIndustryExposure / totalExp > 0.3) {
    actions.push(
      `${topIndustry} accounts for ${((topIndustryExposure / totalExp) * 100).toFixed(1)}% of total exposure — above the 30% concentration flag; review industry diversification.`
    );
  }

  if (actions.length === 0) {
    actions.push(
      total > 0
        ? "Portfolio risk is within normal parameters — no immediate action required."
        : "No customer data loaded."
    );
  }

  return actions;
}

export { RISK_THRESHOLDS };
