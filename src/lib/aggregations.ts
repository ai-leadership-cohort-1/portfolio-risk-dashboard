import type { RiskCategory, RiskWeights, ScoredCustomer, TrendPoint } from "./types";
import { RISK_THRESHOLDS, DEFAULT_WEIGHTS } from "./riskScoring";

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
 * All Red (high-risk) customers, ordered highest risk score to lowest.
 * Unlike topRiskCustomers this is not capped — every Red customer must be
 * visible for escalation, not just the top 10 overall.
 */
export function redRiskCustomers(customers: ScoredCustomer[]): ScoredCustomer[] {
  return customers.filter((c) => c.category === "Red").sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Identifies which of the three weighted factors (credit history, repayment
 * behaviour, exposure) is contributing the most to a customer's risk score,
 * so the dashboard can explain *why* a customer is high-risk, not just that
 * they are.
 */
export function primaryRiskDriver(customer: ScoredCustomer, weights: RiskWeights = DEFAULT_WEIGHTS): string {
  const contributions = [
    { label: "Credit history", value: weights.creditRiskWeight * customer.creditScoreFactor },
    { label: "Repayment behaviour", value: weights.repaymentRiskWeight * customer.repaymentRiskFactor },
    { label: "Exposure size", value: weights.exposureWeight * customer.exposureFactor },
  ];
  contributions.sort((a, b) => b.value - a.value);
  return contributions[0].label;
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

export interface RecommendedAction {
  title: string;
  detail: string;
}

export function recommendedActions(customers: ScoredCustomer[]): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  const reds = redRiskCustomers(customers);
  const amberCustomers = customers.filter((c) => c.category === "Amber");
  const summary = summariseByCategory(customers);
  const redSummary = summary.find((s) => s.category === "Red");
  const amberSummary = summary.find((s) => s.category === "Amber");
  const industries = summariseByIndustry(customers);
  const exposureTotal = totalExposure(customers) || 1;

  if (reds.length > 0) {
    const worst = reds[0];
    const driverCounts = new Map<string, number>();
    for (const c of reds) {
      const driver = primaryRiskDriver(c);
      driverCounts.set(driver, (driverCounts.get(driver) ?? 0) + 1);
    }
    const leadingDriver = [...driverCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const redExposure = reds.reduce((sum, c) => sum + c.loanBalance, 0);

    actions.push({
      title: `Escalate ${reds.length} Red (high-risk) customer${reds.length === 1 ? "" : "s"} for immediate review`,
      detail: `These customers score above ${RISK_THRESHOLDS.amberMax} on the 0–100 risk scale (Red band: ${
        RISK_THRESHOLDS.amberMax + 1
      }–100) and together carry ${formatCurrency(redExposure)} of exposure. The single highest-risk case is ${
        worst.customerName
      } (score ${worst.riskScore.toFixed(1)}, ${worst.repaymentStatus.toLowerCase()}). ${
        leadingDriver ? `${leadingDriver[1]} of ${reds.length} Red customer${reds.length === 1 ? "" : "s"} are driven primarily by ${leadingDriver[0].toLowerCase()}, ` : ""
      }so relationship managers should prioritise contact in the order shown in the table below, starting with the highest score. Recommended next step: independent credit review within 5 business days for anyone scoring above 85.`,
    });
  }

  if (redSummary && redSummary.pctOfExposure > 15) {
    actions.push({
      title: `Red exposure concentration is elevated (${redSummary.pctOfExposure.toFixed(1)}% of portfolio)`,
      detail: `Red-category loans represent ${formatCurrency(
        redSummary.exposure
      )} of the ${formatCurrency(exposureTotal)} total portfolio — above the 15% concentration threshold used to flag capital-at-risk concerns. This level of concentration typically warrants tightened approval criteria for new originations in similar risk profiles and a review of provisioning levels to ensure adequate coverage against expected losses.`,
    });
  }

  if (amberCustomers.length > 0 && amberSummary) {
    actions.push({
      title: `Place ${amberCustomers.length} Amber (medium-risk) customer${amberCustomers.length === 1 ? "" : "s"} on enhanced monitoring`,
      detail: `Amber customers score ${RISK_THRESHOLDS.greenMax + 1}–${
        RISK_THRESHOLDS.amberMax
      } and represent ${amberSummary.pctOfExposure.toFixed(1)}% of total exposure (${formatCurrency(
        amberSummary.exposure
      )}). These accounts are not yet critical but show early warning signs — recommend quarterly repayment and credit-score reviews to catch further deterioration before it becomes a Red-category escalation.`,
    });
  }

  if (industries.length > 0) {
    const top = industries[0];
    const share = (top.exposure / exposureTotal) * 100;
    if (share > 30) {
      actions.push({
        title: `${top.industry} exposure concentration is elevated (${share.toFixed(1)}% of portfolio)`,
        detail: `${top.industry} accounts for ${formatCurrency(
          top.exposure
        )} of total exposure, above the 30% single-sector concentration threshold. A downturn specific to this sector would disproportionately affect the portfolio — recommend reviewing sector-specific underwriting criteria and setting a target ceiling for future ${top.industry.toLowerCase()} originations.`,
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      title: "Portfolio risk profile is within normal parameters",
      detail: "No Red customers, no elevated concentration in any single risk category or industry sector, and Amber exposure remains within typical monitoring thresholds. No immediate escalation required — continue standard periodic review.",
    });
  }

  return actions;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export { RISK_THRESHOLDS };
