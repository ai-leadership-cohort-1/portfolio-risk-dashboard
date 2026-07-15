/**
 * Risk scoring engine.
 *
 * *** THIS IS THE SINGLE FILE TO EDIT to change scoring behaviour ***
 * (weights, thresholds, credit score band, exposure cap, repayment lookup
 * table). Nothing outside this file should hard-code a weight, threshold,
 * or scoring constant — every UI surface reads these exported values.
 *
 * Formula:
 *   Risk Score = (Credit Risk Weight x Credit Score Factor)
 *              + (Repayment Risk Weight x Repayment Status Factor)
 *              + (Exposure Weight x Loan Balance Factor)
 *
 * Each factor is independently normalised to a 0-100 scale before the
 * weights are applied, so the final Risk Score is also 0-100.
 */

import { RawCustomerRow, RiskCategory, RiskWeights, ScoredCustomer } from "./types";

/**
 * Default weights. Credit history and repayment behaviour are the
 * strongest predictors of default, so they carry the most weight (0.4
 * each). Exposure reflects materiality (how much is at stake), not
 * probability of default, hence the lower weight (0.2). Must sum to 1.
 */
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
} as const;

/**
 * Lower credit score => higher risk. Clamp first, then invert onto a
 * 0-100 scale where 100 = maximum credit risk.
 */
export function creditScoreFactor(creditScore: number): number {
  const clamped = Math.min(Math.max(creditScore, CREDIT_SCORE_MIN), CREDIT_SCORE_MAX);
  return ((CREDIT_SCORE_MAX - clamped) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100;
}

/**
 * Loan balance relative to a materiality cap. Balances at or above the
 * cap score the maximum exposure factor.
 */
export function exposureFactor(loanBalance: number): number {
  const clamped = Math.min(Math.max(loanBalance, 0), EXPOSURE_CAP);
  return (clamped / EXPOSURE_CAP) * 100;
}

/**
 * Free-text repayment status lookup. Unrecognised text with no
 * parseable day count defaults to 50 (moderate risk) rather than being
 * silently ignored or treated as zero risk.
 *
 * Note: the "60 days" (75) vs "60 Days Past Due" (60) asymmetry below is
 * intentional history from earlier policy language, not a bug to fix.
 */
export function repaymentRiskFactor(status: string): number {
  const normalised = status.trim().toLowerCase();

  const table: Array<[RegExp, number]> = [
    [/^current$/, 0],
    [/on time/, 0],
    [/watchlist/, 20],
    [/grace/, 20],
    [/1[-\s]?29 days/, 35],
    [/^30 days/, 55],
    [/30 days late/, 55],
    [/60[-\s]?89 days/, 75],
    [/60 days past due/, 60],
    [/^60 days/, 75],
    [/60 days late/, 75],
    [/90\+? days/, 90],
    [/90 days late/, 90],
    [/default/, 100],
    [/write.?off/, 100],
    [/non.?performing/, 95],
    [/npl/, 95],
  ];

  for (const [pattern, value] of table) {
    if (pattern.test(normalised)) return value;
  }

  // Try to parse a raw day count e.g. "45 days" -> map onto the bands.
  const dayMatch = normalised.match(/(\d+)\s*days?/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (days <= 0) return 0;
    if (days < 30) return 35;
    if (days < 60) return 55;
    if (days < 90) return 75;
    return 90;
  }

  return 50;
}

export function categoriseRiskScore(riskScore: number): RiskCategory {
  if (riskScore <= RISK_THRESHOLDS.greenMax) return "Green";
  if (riskScore <= RISK_THRESHOLDS.amberMax) return "Amber";
  return "Red";
}

export function scoreCustomer(
  row: RawCustomerRow,
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer {
  const csf = creditScoreFactor(row.creditScore);
  const rrf = repaymentRiskFactor(row.repaymentStatus);
  const ef = exposureFactor(row.loanBalance);

  const riskScore =
    weights.creditRiskWeight * csf +
    weights.repaymentRiskWeight * rrf +
    weights.exposureWeight * ef;

  return {
    ...row,
    creditScoreFactor: Math.round(csf * 10) / 10,
    repaymentRiskFactor: Math.round(rrf * 10) / 10,
    exposureFactor: Math.round(ef * 10) / 10,
    riskScore: Math.round(riskScore * 10) / 10,
    category: categoriseRiskScore(riskScore),
  };
}

export function scoreCustomers(
  rows: RawCustomerRow[],
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer[] {
  return rows.map((row) => scoreCustomer(row, weights));
}
