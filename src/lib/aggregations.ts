import { RiskCategory, ScoredCustomer } from "./types";

export const RISK_CATEGORIES: RiskCategory[] = ["Green", "Amber", "Red"];

export interface CategorySummary {
  category: RiskCategory;
  count: number;
  exposure: number;
  pctOfCustomers: number;
  pctOfExposure: number;
}

export function summariseByCategory(customers: ScoredCustomer[]): CategorySummary[] {
  const totalCount = customers.length;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0);

  return RISK_CATEGORIES.map((category) => {
    const inCategory = customers.filter((c) => c.category === category);
    const count = inCategory.length;
    const exposure = inCategory.reduce((sum, c) => sum + c.loanBalance, 0);
    return {
      category,
      count,
      exposure,
      pctOfCustomers: totalCount > 0 ? (count / totalCount) * 100 : 0,
      pctOfExposure: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0,
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

export interface TrendPoint {
  label: string;
  averageRiskScore: number;
}

/**
 * Seeded pseudo-random walk that tapers into the real current average
 * portfolio risk score at the most recent point, giving an illustrative
 * "trend leading up to today" without fabricating a false historical
 * record.
 */
export function generatePortfolioTrend(customers: ScoredCustomer[], points = 12): TrendPoint[] {
  const currentAverage =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length
      : 0;

  // Simple deterministic seeded PRNG (mulberry32) so the trend is stable
  // across renders for the same underlying dataset.
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
    const progress = i / (points - 1);
    const drift = (next() - 0.5) * 8 * (1 - progress);
    value = value + drift;
    // Taper toward the real current average as we approach "today".
    value = value * (1 - progress * 0.4) + currentAverage * (progress * 0.4);
    value = Math.max(0, Math.min(100, value));

    trend.push({
      label: i === points - 1 ? "Today" : `T-${points - 1 - i}`,
      averageRiskScore: Math.round((i === points - 1 ? currentAverage : value) * 10) / 10,
    });
  }

  return trend;
}

export interface RecommendedAction {
  text: string;
}

export function recommendedActions(customers: ScoredCustomer[]): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const total = customers.length;
  const totalExp = totalExposure(customers);

  const redCustomers = customers.filter((c) => c.category === "Red");
  const amberCustomers = customers.filter((c) => c.category === "Amber");

  if (redCustomers.length > 0) {
    const names = redCustomers
      .slice(0, 5)
      .map((c) => c.customerName)
      .join(", ");
    const suffix = redCustomers.length > 5 ? ` and ${redCustomers.length - 5} more` : "";
    actions.push({
      text: `Escalate ${redCustomers.length} Red (high risk) customer${redCustomers.length > 1 ? "s" : ""} for immediate review: ${names}${suffix}.`,
    });
  }

  const redExposure = redCustomers.reduce((sum, c) => sum + c.loanBalance, 0);
  const redExposureShare = totalExp > 0 ? (redExposure / totalExp) * 100 : 0;
  if (redExposureShare > 15) {
    actions.push({
      text: `Red-category exposure is ${redExposureShare.toFixed(1)}% of total portfolio exposure, above the 15% concentration guideline — consider provisioning review.`,
    });
  }

  if (amberCustomers.length > 0) {
    actions.push({
      text: `Place ${amberCustomers.length} Amber (medium risk) customer${amberCustomers.length > 1 ? "s" : ""} on watchlist for closer monitoring.`,
    });
  }

  const industries = exposureByIndustry(customers);
  if (industries.length > 0) {
    const top = industries[0];
    const share = totalExp > 0 ? (top.exposure / totalExp) * 100 : 0;
    if (share > 30) {
      actions.push({
        text: `${top.industry} represents ${share.toFixed(1)}% of total exposure, above the 30% single-sector concentration guideline — review industry diversification.`,
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      text: `Portfolio risk profile is within normal parameters across ${total} customers — continue standard monitoring cadence.`,
    });
  }

  return actions;
}
