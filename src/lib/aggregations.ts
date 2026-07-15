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

export interface SectorTrend {
  industry: string;
  count: number;
  exposure: number;
  avgRiskScore: number;
  redCount: number;
  amberCount: number;
  greenCount: number;
  redSharePct: number;
  exposureSharePct: number;
}

/**
 * Per-industry risk pattern breakdown — surfaces which segments are
 * carrying disproportionate risk, not just disproportionate exposure.
 */
export function sectorTrends(customers: ScoredCustomer[]): SectorTrend[] {
  const totalExp = totalExposure(customers) || 1;
  const map = new Map<string, ScoredCustomer[]>();

  for (const c of customers) {
    const key = c.industrySector || "Unclassified";
    const list = map.get(key);
    if (list) list.push(c);
    else map.set(key, [c]);
  }

  const trends: SectorTrend[] = Array.from(map.entries()).map(([industry, group]) => {
    const count = group.length;
    const exposure = group.reduce((sum, c) => sum + c.loanBalance, 0);
    const avgRiskScore = group.reduce((sum, c) => sum + c.riskScore, 0) / count;
    const redCount = group.filter((c) => c.category === "Red").length;
    const amberCount = group.filter((c) => c.category === "Amber").length;
    const greenCount = group.filter((c) => c.category === "Green").length;
    return {
      industry,
      count,
      exposure,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
      redCount,
      amberCount,
      greenCount,
      redSharePct: (redCount / count) * 100,
      exposureSharePct: (exposure / totalExp) * 100,
    };
  });

  return trends.sort((a, b) => b.avgRiskScore - a.avgRiskScore);
}

/**
 * Narrative call-outs for the sector trend section — flags the segments an
 * executive reader should look at first, rather than just listing raw
 * numbers. Thresholds mirror the concentration/escalation logic used in
 * recommendedActions() so the two sections stay consistent.
 */
export function sectorTrendInsights(customers: ScoredCustomer[]): string[] {
  const trends = sectorTrends(customers);
  if (trends.length === 0) return ["No sector data available."];

  const insights: string[] = [];
  const portfolioAvg =
    customers.length > 0 ? customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length : 0;

  const highestAvg = trends[0];
  if (highestAvg.avgRiskScore > portfolioAvg + 5) {
    insights.push(
      `${highestAvg.industry} carries the highest average risk score (${highestAvg.avgRiskScore.toFixed(
        1
      )} vs. portfolio average ${portfolioAvg.toFixed(1)}), driven by ${highestAvg.redCount} of ${
        highestAvg.count
      } customers in the Red category.`
    );
  }

  const highRedShare = [...trends]
    .filter((t) => t.count >= 3 && t.redSharePct > 25)
    .sort((a, b) => b.redSharePct - a.redSharePct)[0];
  if (highRedShare && highRedShare.industry !== highestAvg.industry) {
    insights.push(
      `${highRedShare.industry} has an elevated concentration of Red-category customers (${highRedShare.redSharePct.toFixed(
        1
      )}% of the sector), signalling deteriorating credit quality in that segment.`
    );
  }

  const mostConcentrated = [...trends].sort((a, b) => b.exposureSharePct - a.exposureSharePct)[0];
  if (mostConcentrated.exposureSharePct > 30) {
    insights.push(
      `${mostConcentrated.industry} accounts for ${mostConcentrated.exposureSharePct.toFixed(
        1
      )}% of total portfolio exposure — a concentration risk independent of individual credit quality.`
    );
  }

  const cleanest = [...trends]
    .filter((t) => t.count >= 3)
    .sort((a, b) => a.avgRiskScore - b.avgRiskScore)[0];
  if (cleanest && cleanest.avgRiskScore < portfolioAvg - 5) {
    insights.push(
      `${cleanest.industry} is the strongest-performing sector (average risk score ${cleanest.avgRiskScore.toFixed(
        1
      )}), with ${cleanest.greenCount} of ${cleanest.count} customers in the Green category.`
    );
  }

  if (insights.length === 0) {
    insights.push("Risk is broadly evenly distributed across sectors — no segment stands out from the portfolio average.");
  }

  return insights;
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

/**
 * Intervention-oriented recommended actions. Each triggered rule names the
 * specific credit-management lever to pull (not just "review" or
 * "escalate") so the dashboard reads as an action list a portfolio manager
 * can hand to a team, not a generic risk summary.
 */
export function recommendedActions(customers: ScoredCustomer[]): string[] {
  const actions: string[] = [];
  const total = customers.length;
  const totalExp = totalExposure(customers) || 1;

  const redCustomers = customers.filter((c) => c.category === "Red");
  const amberCustomers = customers.filter((c) => c.category === "Amber");

  // Most severe Red customers: individual, named intervention.
  const criticalRed = redCustomers.filter((c) => c.riskScore >= 85);
  if (criticalRed.length > 0) {
    const names = criticalRed
      .slice()
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((c) => `${c.customerName} (score ${c.riskScore.toFixed(0)})`)
      .join(", ");
    actions.push(
      `Refer ${criticalRed.length} critical-risk customer${
        criticalRed.length === 1 ? "" : "s"
      } (score 85+) to the workout/special assets team within 5 business days for individual restructuring review, ` +
        `including a fresh collateral valuation and updated repayment capacity assessment: ${names}.`
    );
  }

  // Remaining Red customers: facility-level tightening.
  const standardRed = redCustomers.filter((c) => c.riskScore < 85);
  if (standardRed.length > 0) {
    actions.push(
      `For the remaining ${standardRed.length} Red-category customer${
        standardRed.length === 1 ? "" : "s"
      }, request updated financials and a serviceability re-check within 30 days, and consider reducing ` +
        `facility limits or requiring additional collateral cover until risk scores improve.`
    );
  }

  const redExposure = redCustomers.reduce((sum, c) => sum + c.loanBalance, 0);
  const redExposureShare = (redExposure / totalExp) * 100;
  if (redExposureShare > 15) {
    actions.push(
      `Red-category exposure is ${redExposureShare.toFixed(
        1
      )}% of total portfolio exposure, above the 15% concentration flag — escalate to the credit committee for a ` +
        `provisioning review and tighten origination criteria (minimum credit score / maximum LVR) for new lending until exposure recovers below threshold.`
    );
  }

  if (amberCustomers.length > 0) {
    actions.push(
      `Move ${amberCustomers.length} Amber-category customer${
        amberCustomers.length === 1 ? "" : "s"
      } to a monthly monitoring cadence: request updated financials at next review, set early-warning triggers on ` +
        `repayment status changes, and flag for re-scoring if any miss a scheduled payment.`
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
        )}% of the portfolio, above the 30% concentration flag — pause growth in new ${top.industry} lending and ` +
          `apply tighter serviceability buffers to new applications in this sector until concentration reduces.`
      );
    }
  }

  const sectors = sectorTrends(customers);
  const worstSector = sectors.find((s) => s.count >= 3 && s.redSharePct > 25);
  if (worstSector) {
    actions.push(
      `${worstSector.industry} has ${worstSector.redSharePct.toFixed(
        1
      )}% of its customers in the Red category — commission a targeted portfolio review of this sector's facilities ` +
        `and consider a temporary hold on new originations pending the review outcome.`
    );
  }

  if (actions.length === 0) {
    actions.push(
      `Portfolio risk is within normal parameters across all ${total} customers — maintain standard quarterly monitoring, no immediate intervention required.`
    );
  }

  return actions;
}

export { RISK_THRESHOLDS };
