import type { RiskCategory, ScoredCustomer, TrendPoint } from "./types";
import { RISK_THRESHOLDS } from "./riskScoring";

export interface CategorySummary {
  category: RiskCategory;
  count: number;
  exposure: number;
  pctOfCustomers: number;
  pctOfExposure: number;
}

const CATEGORIES: RiskCategory[] = ["Green", "Amber", "Red"];

export function summariseByCategory(customers: ScoredCustomer[]): CategorySummary[] {
  const totalCustomers = customers.length || 1;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0) || 1;

  return CATEGORIES.map((category) => {
    const inCategory = customers.filter((c) => c.category === category);
    const exposure = inCategory.reduce((sum, c) => sum + c.loanBalance, 0);
    return {
      category,
      count: inCategory.length,
      exposure,
      pctOfCustomers: (inCategory.length / totalCustomers) * 100,
      pctOfExposure: (exposure / totalExposure) * 100,
    };
  });
}

export function totalExposure(customers: ScoredCustomer[]): number {
  return customers.reduce((sum, c) => sum + c.loanBalance, 0);
}

export interface IndustryExposure {
  industry: string;
  exposure: number;
}

export function summariseByIndustry(customers: ScoredCustomer[]): IndustryExposure[] {
  const map = new Map<string, number>();
  for (const c of customers) {
    map.set(c.industrySector, (map.get(c.industrySector) ?? 0) + c.loanBalance);
  }
  return Array.from(map.entries())
    .map(([industry, exposure]) => ({ industry, exposure }))
    .sort((a, b) => b.exposure - a.exposure);
}

export function topRiskCustomers(customers: ScoredCustomer[], n = 10): ScoredCustomer[] {
  return [...customers].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}

/**
 * Generates an illustrative portfolio risk trend: a seeded pseudo-random
 * walk over the preceding periods that tapers into the real current
 * average risk score at the most recent point. Purely illustrative — not
 * derived from historical data (none exists in this prototype).
 */
export function generatePortfolioTrend(customers: ScoredCustomer[], points = 8): TrendPoint[] {
  const currentAverage =
    customers.length > 0 ? customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length : 40;

  // Simple seeded PRNG (mulberry32) so the trend is deterministic per session.
  let seed = 42;
  function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const result: TrendPoint[] = [];
  let value = Math.max(10, Math.min(90, currentAverage + (next() - 0.5) * 20));

  for (let i = 0; i < points - 1; i += 1) {
    const monthsAgo = points - 1 - i;
    const taper = 1 - i / (points - 1); // closer to 1 for earlier points, tapering toward 0
    const drift = (next() - 0.5) * 10 * taper;
    value = Math.max(5, Math.min(95, value + drift));
    result.push({ label: `${monthsAgo}mo ago`, averageRiskScore: Math.round(value * 10) / 10 });
  }

  result.push({ label: "Now", averageRiskScore: Math.round(currentAverage * 10) / 10 });

  return result;
}

export function recommendedActions(customers: ScoredCustomer[]): string[] {
  const actions: string[] = [];

  const redCustomers = customers.filter((c) => c.category === "Red");
  const amberCustomers = customers.filter((c) => c.category === "Amber");
  const summary = summariseByCategory(customers);
  const redSummary = summary.find((s) => s.category === "Red");
  const industries = summariseByIndustry(customers);
  const exposureTotal = totalExposure(customers) || 1;

  if (redCustomers.length > 0) {
    const names = redCustomers
      .slice(0, 5)
      .map((c) => c.customerName)
      .join(", ");
    const suffix = redCustomers.length > 5 ? ` and ${redCustomers.length - 5} more` : "";
    actions.push(`Escalate ${redCustomers.length} Red (high-risk) customer${redCustomers.length === 1 ? "" : "s"} for immediate review: ${names}${suffix}.`);
  }

  if (redSummary && redSummary.pctOfExposure > 15) {
    actions.push(
      `Red-category exposure represents ${redSummary.pctOfExposure.toFixed(1)}% of total portfolio exposure — above the 15% concentration flag. Consider tightening approval criteria or increasing provisioning.`
    );
  }

  if (amberCustomers.length > 0) {
    actions.push(`Place ${amberCustomers.length} Amber (medium-risk) customer${amberCustomers.length === 1 ? "" : "s"} on watchlist for enhanced monitoring.`);
  }

  if (industries.length > 0) {
    const top = industries[0];
    const share = (top.exposure / exposureTotal) * 100;
    if (share > 30) {
      actions.push(
        `${top.industry} accounts for ${share.toFixed(1)}% of total exposure — above the 30% concentration flag. Review industry diversification strategy.`
      );
    }
  }

  if (actions.length === 0) {
    actions.push("Portfolio risk profile is within normal parameters. No immediate escalation required.");
  }

  return actions;
}

export { RISK_THRESHOLDS };
