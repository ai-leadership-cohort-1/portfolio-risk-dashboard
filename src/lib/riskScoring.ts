// ============================================================================
// RISK SCORING ENGINE
// ----------------------------------------------------------------------------
// THIS IS THE SINGLE FILE TO EDIT to change scoring weights, bands, or the
// repayment-status lookup table. Nothing else in the app hard-codes these
// numbers — the UI reads them from the constants below so the "How risk is
// scored" and "Scoring Methodology" cards always stay in sync with reality.
//
// Formula:
//   Risk Score = (Credit Risk Weight x Credit Score Factor)
//              + (Repayment Risk Weight x Repayment Status Factor)
//              + (Exposure Weight x Loan Balance Factor)
// ============================================================================

import type { RawCustomerRow, RiskCategory, RiskThresholds, RiskWeights, ScoredCustomer } from "./types";

// Weights must sum to 1. Credit history and repayment behaviour are the
// strongest predictors of default, so they carry the most weight; exposure
// reflects materiality (how much is at stake), not probability of default,
// hence the lower weight.
export const DEFAULT_WEIGHTS: RiskWeights = {
  creditRiskWeight: 0.4,
  repaymentRiskWeight: 0.4,
  exposureWeight: 0.2,
};

export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;

export const EXPOSURE_CAP = 500_000;

export const RISK_THRESHOLDS: RiskThresholds = {
  greenMax: 35,
  amberMax: 65,
};

// Free-text repayment status lookup. Unrecognised text with no parseable
// "days past due" count defaults to 50 (moderate risk — never silently
// ignored). The 60-day asymmetry (60-89 label -> 75, plain "60 Days Past Due"
// -> 60) is intentional historical behaviour, not a bug.
const REPAYMENT_STATUS_TABLE: Array<{ match: RegExp; factor: number }> = [
  { match: /current|on time|on-time/i, factor: 0 },
  { match: /watchlist|grace/i, factor: 20 },
  { match: /90\+|90 ?\+|90-day|ninety/i, factor: 90 },
  { match: /60-89|60 to 89|60-day/i, factor: 75 },
  { match: /60 days? past due|60 days? late/i, factor: 60 },
  { match: /30 days? past due|30 days? late|1-29|1 to 29/i, factor: 35 },
  { match: /default|write[- ]?off/i, factor: 100 },
  { match: /non-?performing|npl/i, factor: 95 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function creditScoreFactor(creditScore: number): number {
  const clamped = clamp(creditScore, CREDIT_SCORE_MIN, CREDIT_SCORE_MAX);
  return ((CREDIT_SCORE_MAX - clamped) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100;
}

export function exposureFactor(loanBalance: number): number {
  const capped = Math.min(Math.max(loanBalance, 0), EXPOSURE_CAP);
  return (capped / EXPOSURE_CAP) * 100;
}

export function repaymentRiskFactor(repaymentStatus: string): number {
  const text = (repaymentStatus ?? "").trim();
  for (const entry of REPAYMENT_STATUS_TABLE) {
    if (entry.match.test(text)) return entry.factor;
  }
  // Try to parse a raw "N days" figure for free-text statuses that don't
  // match a known label but do carry a day count.
  const dayMatch = text.match(/(\d+)\s*\+?\s*day/i);
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

export function categoriseRiskScore(riskScore: number, thresholds: RiskThresholds = RISK_THRESHOLDS): RiskCategory {
  if (riskScore <= thresholds.greenMax) return "Green";
  if (riskScore <= thresholds.amberMax) return "Amber";
  return "Red";
}

export function scoreCustomer(
  row: RawCustomerRow,
  weights: RiskWeights = DEFAULT_WEIGHTS,
  thresholds: RiskThresholds = RISK_THRESHOLDS
): ScoredCustomer {
  const csf = creditScoreFactor(row.creditScore);
  const rrf = repaymentRiskFactor(row.repaymentStatus);
  const ef = exposureFactor(row.loanBalance);

  const riskScore =
    weights.creditRiskWeight * csf + weights.repaymentRiskWeight * rrf + weights.exposureWeight * ef;

  return {
    ...row,
    creditScoreFactor: csf,
    repaymentRiskFactor: rrf,
    exposureFactor: ef,
    riskScore,
    category: categoriseRiskScore(riskScore, thresholds),
  };
}

export function scoreCustomers(
  rows: RawCustomerRow[],
  weights: RiskWeights = DEFAULT_WEIGHTS,
  thresholds: RiskThresholds = RISK_THRESHOLDS
): ScoredCustomer[] {
  return rows.map((row) => scoreCustomer(row, weights, thresholds));
}
