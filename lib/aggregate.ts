import { AMBER_MAX, GREEN_MAX } from "./scoring";
import { PolicyRule, RiskCategory, ScoredCustomer } from "./types";

export const RISK_CATEGORIES: RiskCategory[] = ["Green", "Amber", "Red"];

export interface CategorySummary {
  category: RiskCategory;
  count: number;
  exposure: number;
  sharePct: number;
}

export function summariseByCategory(scored: ScoredCustomer[]): CategorySummary[] {
  const totalExposure = scored.reduce((sum, c) => sum + c.loanBalance, 0);
  return RISK_CATEGORIES.map((category) => {
    const rows = scored.filter((c) => c.riskCategory === category);
    const exposure = rows.reduce((sum, c) => sum + c.loanBalance, 0);
    return {
      category,
      count: rows.length,
      exposure,
      sharePct: totalExposure === 0 ? 0 : (exposure / totalExposure) * 100,
    };
  });
}

export interface SectorSummary {
  sector: string;
  exposure: number;
  count: number;
  sharePct: number;
  redExposure: number;
}

export function summariseBySector(scored: ScoredCustomer[]): SectorSummary[] {
  const totalExposure = scored.reduce((sum, c) => sum + c.loanBalance, 0);
  const bySector = new Map<string, ScoredCustomer[]>();
  for (const c of scored) {
    const list = bySector.get(c.industrySector) ?? [];
    list.push(c);
    bySector.set(c.industrySector, list);
  }
  return Array.from(bySector.entries())
    .map(([sector, rows]) => {
      const exposure = rows.reduce((sum, c) => sum + c.loanBalance, 0);
      const redExposure = rows
        .filter((c) => c.riskCategory === "Red")
        .reduce((sum, c) => sum + c.loanBalance, 0);
      return {
        sector,
        exposure,
        count: rows.length,
        sharePct: totalExposure === 0 ? 0 : (exposure / totalExposure) * 100,
        redExposure,
      };
    })
    .sort((a, b) => b.exposure - a.exposure);
}

export function topRiskCustomers(scored: ScoredCustomer[], n = 10): ScoredCustomer[] {
  return [...scored].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}

export interface RecommendedAction {
  id: string;
  priority: "High" | "Medium" | "Low";
  text: string;
}

const CONCENTRATION_LIMIT_PCT = 25; // mirrors the sample policy's stated limit

export function generateRecommendedActions(
  scored: ScoredCustomer[],
  policyRules: PolicyRule[]
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  if (scored.length === 0) return actions;

  const categories = summariseByCategory(scored);
  const sectors = summariseBySector(scored);
  const totalExposure = scored.reduce((sum, c) => sum + c.loanBalance, 0);
  const red = categories.find((c) => c.category === "Red")!;
  const amber = categories.find((c) => c.category === "Amber")!;

  if (red.count > 0) {
    actions.push({
      id: "red-escalation",
      priority: "High",
      text: `Escalate the ${red.count} Red-rated customer${red.count === 1 ? "" : "s"} (${formatAud(
        red.exposure
      )} exposure, ${red.sharePct.toFixed(1)}% of the portfolio) to the Credit Committee and schedule Relationship Manager contact within 5 business days.`,
    });
  }

  const nearThreshold = scored.filter(
    (c) => c.riskCategory === "Amber" && c.riskScore >= AMBER_MAX - 10
  );
  if (nearThreshold.length > 0) {
    actions.push({
      id: "amber-watch",
      priority: "Medium",
      text: `Place ${nearThreshold.length} Amber customer${
        nearThreshold.length === 1 ? "" : "s"
      } scoring within 10 points of the Red threshold (${AMBER_MAX}) on a watchlist with monthly review.`,
    });
  }

  const concentrated = sectors.find((s) => s.sharePct > CONCENTRATION_LIMIT_PCT);
  if (concentrated) {
    actions.push({
      id: "sector-concentration",
      priority: "High",
      text: `${concentrated.sector} represents ${concentrated.sharePct.toFixed(
        1
      )}% of total exposure, above the ${CONCENTRATION_LIMIT_PCT}% single-sector concentration guideline. Review new originations in this sector and consider risk mitigation (syndication, reduced limits, additional security).`,
    });
  }

  if (amber.count + red.count > scored.length * 0.4) {
    actions.push({
      id: "portfolio-quality",
      priority: "Medium",
      text: `Amber and Red accounts make up ${(
        ((amber.count + red.count) / scored.length) *
        100
      ).toFixed(1)}% of the book by customer count. Consider tightening new-origination credit criteria and increasing the frequency of portfolio quality reviews.`,
    });
  }

  const defaulted = scored.filter((c) => c.repaymentStatus === "default");
  if (defaulted.length > 0) {
    actions.push({
      id: "defaults",
      priority: "High",
      text: `${defaulted.length} account${defaulted.length === 1 ? " is" : "s are"} in default (${formatAud(
        defaulted.reduce((s, c) => s + c.loanBalance, 0)
      )} exposure). Initiate mandatory impairment review per policy within 5 business days.`,
    });
  }

  if (policyRules.length > 0) {
    actions.push({
      id: "policy-alignment",
      priority: "Low",
      text: `${policyRules.length} policy rule${
        policyRules.length === 1 ? "" : "s"
      } were extracted from the uploaded lending policy. Confirm the scoring thresholds in lib/scoring.ts remain aligned with current policy limits (see Extracted Policy Highlights below).`,
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "healthy",
      priority: "Low",
      text: `Portfolio risk profile is within normal tolerances (${red.count} Red, ${amber.count} Amber out of ${scored.length} customers, ${formatAud(
        totalExposure
      )} total exposure). Continue standard quarterly monitoring.`,
    });
  }

  const order = { High: 0, Medium: 1, Low: 2 };
  return actions.sort((a, b) => order[a.priority] - order[b.priority]);
}

export function formatAud(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export interface PortfolioHealth {
  rating: "Sound" | "Watch" | "Elevated Risk";
  description: string;
}

/**
 * A simple, transparent heuristic for the board-level health verdict.
 * Combines Red exposure share and industry concentration — adjust the
 * thresholds below if the committee wants a stricter or looser bar.
 */
export function assessPortfolioHealth(
  categories: CategorySummary[],
  sectors: SectorSummary[]
): PortfolioHealth {
  const red = categories.find((c) => c.category === "Red")!;
  const amber = categories.find((c) => c.category === "Amber")!;
  const maxSectorShare = sectors.length ? Math.max(...sectors.map((s) => s.sharePct)) : 0;

  if (red.sharePct >= 20 || maxSectorShare >= 35) {
    return {
      rating: "Elevated Risk",
      description: `Red-rated exposure (${red.sharePct.toFixed(
        1
      )}% of the book) and/or industry concentration (${maxSectorShare.toFixed(
        1
      )}% in the largest sector) are outside comfortable tolerances. Recommend Credit Committee review before further origination in the affected segments.`,
    };
  }

  if (red.sharePct >= 8 || amber.sharePct >= 35 || maxSectorShare >= 25) {
    return {
      rating: "Watch",
      description: `The portfolio is broadly sound but carries pockets of elevated risk — either in Red-rated exposure (${red.sharePct.toFixed(
        1
      )}%), Amber exposure (${amber.sharePct.toFixed(
        1
      )}%), or sector concentration (${maxSectorShare.toFixed(
        1
      )}% in the largest sector). Recommend continued monthly monitoring of the accounts and sectors flagged below.`,
    };
  }

  return {
    rating: "Sound",
    description: `Risk exposure is well distributed with Red-rated accounts at only ${red.sharePct.toFixed(
      1
    )}% of the book and no single industry sector exceeding ${maxSectorShare.toFixed(
      1
    )}% of exposure. Standard quarterly monitoring is sufficient.`,
  };
}

export { GREEN_MAX, AMBER_MAX };
