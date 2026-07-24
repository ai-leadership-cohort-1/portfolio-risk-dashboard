// =============================================================================
// THIS IS THE FILE TO EDIT to change portfolio risk scoring behaviour —
// weights, thresholds, and the repayment-status lookup table all live here.
// =============================================================================
//
// Formula:
//   Risk Score = (Credit Risk Weight × Credit Score Factor)
//              + (Repayment Risk Weight × Repayment Status Factor)
//              + (Exposure Weight × Loan Balance Factor)
//
// Each factor is normalised to a 0–100 scale before weighting, so the
// resulting Risk Score is always in the 0–100 range.

import type { RawCustomerRow, RiskCategory, RiskWeights, ScoredCustomer } from "./types";

// Credit history and repayment behaviour are the strongest predictors of
// default; exposure reflects materiality of a loan, not probability of
// default, hence the lower weight given to it below.
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

/**
 * Credit Score Factor: lower credit score → higher risk factor.
 * Clamped to the [300, 850] band first, then inverted onto a 0–100 scale.
 */
export function creditScoreFactor(creditScore: number): number {
  const clamped = Math.min(Math.max(creditScore, CREDIT_SCORE_MIN), CREDIT_SCORE_MAX);
  return ((CREDIT_SCORE_MAX - clamped) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100;
}

/**
 * Exposure Factor: loan balance relative to a $500,000 exposure cap,
 * capped at 100.
 */
export function exposureFactor(loanBalance: number): number {
  return (Math.min(loanBalance, EXPOSURE_CAP) / EXPOSURE_CAP) * 100;
}

// Free-text repayment status lookup table. Unrecognised text with no
// parseable day count defaults to 50 (moderate risk — never silently
// ignored). NOTE: the 60-day bands below are intentionally asymmetric
// (a "60–89 days" style label maps to 75, a literal "60 Days Past Due"
// label maps to 60) — this reflects the source policy wording history and
// is not a bug to "fix".
const REPAYMENT_LOOKUP: Array<{ pattern: RegExp; factor: number }> = [
  { pattern: /\b(current|on time|on-time)\b/i, factor: 0 },
  { pattern: /\b(watchlist|grace)\b/i, factor: 20 },
  { pattern: /\bdefault|write[\s-]?off\b/i, factor: 100 },
  { pattern: /\bnon[\s-]?performing|npl\b/i, factor: 95 },
  { pattern: /\b90\+?\s*(days?)?/i, factor: 90 },
  { pattern: /\b60\s*days?\s*past\s*due\b/i, factor: 60 },
  { pattern: /\b60[\s-]?89|\b60\+?\s*days?/i, factor: 75 },
  { pattern: /\b30\s*days?/i, factor: 55 },
  { pattern: /\b(1|[12]?\d)\s*[-–]\s*29\s*days?|\b1[-–]29\s*days?/i, factor: 35 },
];

/** Extract a bare day count from free text, e.g. "45 days late" -> 45. */
function parseDayCount(status: string): number | null {
  const match = status.match(/(\d+)\s*\+?\s*days?/i);
  return match ? Number(match[1]) : null;
}

/**
 * Repayment Status Factor: maps free-text repayment/arrears status to a
 * 0–100 risk factor via keyword lookup, falling back to a parsed day-count
 * banding, and finally to a moderate default of 50.
 */
export function repaymentRiskFactor(repaymentStatus: string): number {
  const status = repaymentStatus.trim();

  for (const { pattern, factor } of REPAYMENT_LOOKUP) {
    if (pattern.test(status)) return factor;
  }

  const days = parseDayCount(status);
  if (days !== null) {
    if (days <= 0) return 0;
    if (days < 30) return 35;
    if (days < 60) return 55;
    if (days < 90) return 75;
    return 90;
  }

  return 50;
}

export function categoriseRisk(riskScore: number): RiskCategory {
  if (riskScore <= RISK_THRESHOLDS.greenMax) return "Green";
  if (riskScore <= RISK_THRESHOLDS.amberMax) return "Amber";
  return "Red";
}

export function scoreCustomer(customer: RawCustomerRow, weights: RiskWeights = DEFAULT_WEIGHTS): ScoredCustomer {
  const creditFactor = creditScoreFactor(customer.creditScore);
  const repaymentFactor = repaymentRiskFactor(customer.repaymentStatus);
  const exposureFac = exposureFactor(customer.loanBalance);

  const riskScore =
    weights.creditRiskWeight * creditFactor +
    weights.repaymentRiskWeight * repaymentFactor +
    weights.exposureWeight * exposureFac;

  return {
    ...customer,
    creditScoreFactor: Math.round(creditFactor * 10) / 10,
    repaymentRiskFactor: Math.round(repaymentFactor * 10) / 10,
    exposureFactor: Math.round(exposureFac * 10) / 10,
    riskScore: Math.round(riskScore * 10) / 10,
    category: categoriseRisk(riskScore),
  };
}

export function scoreCustomers(customers: RawCustomerRow[], weights: RiskWeights = DEFAULT_WEIGHTS): ScoredCustomer[] {
  return customers.map((c) => scoreCustomer(c, weights));
}
