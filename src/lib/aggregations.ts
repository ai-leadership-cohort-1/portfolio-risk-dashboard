import { RiskCategory, ScoredCustomer } from "./types";
import { RISK_THRESHOLDS } from "./riskScoring";

export interface CategorySummary {
  category: RiskCategory;
  count: number;
  exposure: number;
  pctOfCustomers: number;
  pctOfExposure: number;
}

export function categorySummaries(customers: ScoredCustomer[]): CategorySummary[] {
  const total = customers.length || 1;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0) || 1;

  const categories: RiskCategory[] = ["Green", "Amber", "Red"];

  return categories.map((category) => {
    const inCategory = customers.filter((c) => c.category === category);
    const count = inCategory.length;
    const exposure = inCategory.reduce((sum, c) => sum + c.loanBalance, 0);
    return {
      category,
      count,
      exposure,
      pctOfCustomers: (count / total) * 100,
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
  count: number;
}

export function exposureByIndustry(customers: ScoredCustomer[]): IndustryExposure[] {
  const map = new Map<string, IndustryExposure>();
  for (const c of customers) {
    const key = c.industrySector || "Unclassified";
    const existing = map.get(key);
    if (existing) {
      existing.exposure += c.loanBalance;
      existing.count += 1;
    } else {
      map.set(key, { industry: key, exposure: c.loanBalance, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.exposure - a.exposure);
}

export function topRiskCustomers(customers: ScoredCustomer[], n = 10): ScoredCustomer[] {
  return [...customers].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}

export interface TrendPoint {
  label: string;
  averageRiskScore: number;
}

/**
 * Generates an illustrative portfolio risk trend leading up to the current
 * position. Client-side seeded pseudo-random walk that tapers to the real
 * current average risk score at the most recent point.
 */
export function generatePortfolioTrend(customers: ScoredCustomer[], points = 12): TrendPoint[] {
  const currentAverage =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length
      : 40;

  // Simple deterministic seeded PRNG (mulberry32) so the trend is stable
  // across renders for the same portfolio.
  let seed = Math.round(currentAverage * 1000) + customers.length;
  function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const trend: TrendPoint[] = [];
  let value = Math.max(5, Math.min(95, currentAverage + (next() - 0.5) * 20));

  for (let i = 0; i < points; i++) {
    const isLast = i === points - 1;
    if (isLast) {
      value = currentAverage;
    } else {
      const drift = (next() - 0.5) * 8;
      const pull = (currentAverage - value) * 0.15;
      value = Math.max(0, Math.min(100, value + drift + pull));
    }
    const monthsAgo = points - 1 - i;
    trend.push({
      label: monthsAgo === 0 ? "Now" : `-${monthsAgo}mo`,
      averageRiskScore: Math.round(value * 10) / 10,
    });
  }

  return trend;
}

export function recommendedActions(customers: ScoredCustomer[]): string[] {
  const actions: string[] = [];
  const total = customers.length;
  const totalExp = totalExposure(customers) || 1;

  const redCustomers = customers.filter((c) => c.category === "Red");
  const amberCustomers = customers.filter((c) => c.category === "Amber");

  if (redCustomers.length > 0) {
    const names = redCustomers
      .slice()
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((c) => c.customerName)
      .join(", ");
    actions.push(
      `Escalate ${redCustomers.length} Red (high risk) customer${
        redCustomers.length === 1 ? "" : "s"
      } for immediate review, prioritising: ${names}.`
    );
  }

  const redExposure = redCustomers.reduce((sum, c) => sum + c.loanBalance, 0);
  const redExposureShare = (redExposure / totalExp) * 100;
  if (redExposureShare > 15) {
    actions.push(
      `Red-category exposure represents ${redExposureShare.toFixed(
        1
      )}% of total portfolio exposure, above the 15% concentration flag — consider tightening origination criteria or increasing provisioning.`
    );
  }

  if (amberCustomers.length > 0) {
    actions.push(
      `Place ${amberCustomers.length} Amber (medium risk) customer${
        amberCustomers.length === 1 ? "" : "s"
      } on a watchlist for enhanced monitoring and early intervention.`
    );
  }

  const byIndustry = exposureByIndustry(customers);
  if (byIndustry.length > 0) {
    const top = byIndustry[0];
    const topShare = (top.exposure / totalExp) * 100;
    if (topShare > 30) {
      actions.push(
        `Exposure to the ${top.industry} sector is ${topShare.toFixed(
          1
        )}% of the portfolio, above the 30% concentration flag — review sector concentration limits.`
      );
    }
  }

  if (actions.length === 0) {
    actions.push(
      `Portfolio risk is within normal parameters across all ${total} customers — no immediate escalation required.`
    );
  }

  return actions;
}

export { RISK_THRESHOLDS };
