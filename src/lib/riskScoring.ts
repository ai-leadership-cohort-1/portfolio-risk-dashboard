// ============================================================================
// RISK SCORING ENGINE
// This is the single file to edit to change scoring weights, credit score
// bands, repayment status mappings, exposure cap, or category thresholds.
// ============================================================================
import { RawCustomerRow, RiskWeights, ScoredCustomer, RiskCategory } from "./types";

// Weights must sum to 1. Rationale: credit history and repayment behaviour
// are the strongest predictors of default; exposure reflects materiality
// (how much is at stake), not probability of default, hence the lower weight.
export const DEFAULT_WEIGHTS: RiskWeights = {
  creditRiskWeight: 0.4,
  repaymentRiskWeight: 0.4,
  exposureWeight: 0.2,
};

export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;

export const EXPOSURE_CAP = 500_000;

export const RISK_THRESHOLDS = {
  greenMax: 35,
  amberMax: 65,
};

// Repayment status free-text lookup. Unrecognised text with no parseable
// day count defaults to 50 (moderate risk — never silently ignored).
function repaymentStatusFactor(status: string): number {
  const s = status.trim().toLowerCase();

  if (s.includes("current") || s.includes("on time")) return 0;
  if (s.includes("watchlist") || s.includes("grace")) return 20;
  if (s.includes("default") || s.includes("write-off") || s.includes("write off")) return 100;
  if (s.includes("non-performing") || s.includes("npl") || s.includes("nonperforming")) return 95;

  // "60 Days Past Due" (exact label) intentionally maps to 60 while the
  // 60-89 day band below maps to 75 — this asymmetry is intentional
  // historical behaviour, not a bug to "fix".
  if (s === "60 days past due") return 60;

  if (s.includes("90+") || s.includes("90 +") || /\b9\d\b.*day/.test(s)) return 90;
  if (s.includes("60") && s.includes("day")) return 75;
  if (s.includes("30") && s.includes("day")) return 55;

  const dayMatch = s.match(/(\d+)\s*\+?\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (days >= 90) return 90;
    if (days >= 60) return 75;
    if (days >= 30) return 55;
    if (days >= 1) return 35;
    return 0;
  }

  return 50;
}

function creditScoreFactor(score: number): number {
  const clamped = Math.min(Math.max(score, CREDIT_SCORE_MIN), CREDIT_SCORE_MAX);
  return ((CREDIT_SCORE_MAX - clamped) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100;
}

function exposureFactor(loanBalance: number): number {
  return (Math.min(loanBalance, EXPOSURE_CAP) / EXPOSURE_CAP) * 100;
}

function categorise(score: number): RiskCategory {
  if (score <= RISK_THRESHOLDS.greenMax) return "Green";
  if (score <= RISK_THRESHOLDS.amberMax) return "Amber";
  return "Red";
}

export function scoreCustomer(
  row: RawCustomerRow,
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer {
  const csFactor = creditScoreFactor(row.creditScore);
  const rpFactor = repaymentStatusFactor(row.repaymentStatus);
  const expFactor = exposureFactor(row.loanBalance);

  const riskScore =
    weights.creditRiskWeight * csFactor +
    weights.repaymentRiskWeight * rpFactor +
    weights.exposureWeight * expFactor;

  return {
    ...row,
    creditScoreFactor: Math.round(csFactor * 10) / 10,
    repaymentRiskFactor: Math.round(rpFactor * 10) / 10,
    exposureFactor: Math.round(expFactor * 10) / 10,
    riskScore: Math.round(riskScore * 10) / 10,
    category: categorise(riskScore),
  };
}

export function scoreCustomers(
  rows: RawCustomerRow[],
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer[] {
  return rows.map((row) => scoreCustomer(row, weights));
}
