import { ScoredCustomer, TrendPoint } from "./types";

export interface CategorySummary {
  category: "Green" | "Amber" | "Red";
  count: number;
  exposure: number;
  pctOfCustomers: number;
  pctOfExposure: number;
}

export function summariseByCategory(customers: ScoredCustomer[]): CategorySummary[] {
  const total = customers.length || 1;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0) || 1;

  return (["Green", "Amber", "Red"] as const).map((category) => {
    const rows = customers.filter((c) => c.category === category);
    const exposure = rows.reduce((sum, c) => sum + c.loanBalance, 0);
    return {
      category,
      count: rows.length,
      exposure,
      pctOfCustomers: Math.round((rows.length / total) * 1000) / 10,
      pctOfExposure: Math.round((exposure / totalExposure) * 1000) / 10,
    };
  });
}

export function totalExposure(customers: ScoredCustomer[]): number {
  return customers.reduce((sum, c) => sum + c.loanBalance, 0);
}

export function topRiskCustomers(customers: ScoredCustomer[], n = 10): ScoredCustomer[] {
  return [...customers].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}

export interface IndustryExposure {
  industry: string;
  exposure: number;
}

export function exposureByIndustry(customers: ScoredCustomer[]): IndustryExposure[] {
  const map = new Map<string, number>();
  customers.forEach((c) => {
    map.set(c.industrySector, (map.get(c.industrySector) ?? 0) + c.loanBalance);
  });
  return Array.from(map.entries())
    .map(([industry, exposure]) => ({ industry, exposure }))
    .sort((a, b) => b.exposure - a.exposure);
}

// Seeded pseudo-random walk (deterministic per session) that tapers to the
// real current average risk score at the most recent point. Illustrative
// only — this is not derived from historical data (there is none client-side).
export function generatePortfolioTrend(currentAverage: number, points = 12): TrendPoint[] {
  let seed = Math.round(currentAverage * 97) + 13;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const trend: TrendPoint[] = [];
  let value = Math.max(5, Math.min(95, currentAverage + (rand() - 0.5) * 20));

  for (let i = 0; i < points; i++) {
    const monthsAgo = points - 1 - i;
    const isLast = i === points - 1;
    if (isLast) {
      value = currentAverage;
    } else {
      const drift = (rand() - 0.5) * 8;
      const pullToCurrent = (currentAverage - value) * 0.15;
      value = value + drift + pullToCurrent;
      value = Math.max(0, Math.min(100, value));
    }

    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    const label = date.toLocaleDateString("en-AU", { month: "short", year: "2-digit" });

    trend.push({ label, averageRiskScore: Math.round(value * 10) / 10 });
  }

  return trend;
}

export function averageRiskScore(customers: ScoredCustomer[]): number {
  if (customers.length === 0) return 0;
  return (
    Math.round(
      (customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length) * 10
    ) / 10
  );
}

export function recommendedActions(customers: ScoredCustomer[]): string[] {
  const actions: string[] = [];
  const categories = summariseByCategory(customers);
  const red = categories.find((c) => c.category === "Red")!;
  const amber = categories.find((c) => c.category === "Amber")!;

  const redCustomers = customers.filter((c) => c.category === "Red");
  if (redCustomers.length > 0) {
    const names = redCustomers
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((c) => c.customerName)
      .join(", ");
    actions.push(`Escalate for immediate review: ${names}${redCustomers.length > 5 ? ", and others" : ""} (Red category).`);
  }

  if (red.pctOfExposure > 15) {
    actions.push(
      `Red-category exposure is ${red.pctOfExposure}% of total portfolio exposure — above the 15% concentration flag, consider capital and provisioning review.`
    );
  }

  if (amber.count > 0) {
    actions.push(`Place ${amber.count} Amber-category customer(s) on active watchlist for early intervention.`);
  }

  const byIndustry = exposureByIndustry(customers);
  const total = totalExposure(customers) || 1;
  if (byIndustry.length > 0) {
    const top = byIndustry[0];
    const pct = Math.round((top.exposure / total) * 1000) / 10;
    if (pct > 30) {
      actions.push(`${top.industry} accounts for ${pct}% of total exposure — above the 30% single-sector concentration flag.`);
    }
  }

  if (actions.length === 0) {
    actions.push("Portfolio risk profile is within normal parameters — no immediate escalation required.");
  }

  return actions;
}
