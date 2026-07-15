/**
 * Risk scoring engine.
 *
 * THIS IS THE SINGLE FILE TO EDIT to change how customer risk is scored —
 * weights, thresholds, and the repayment status lookup table all live here.
 *
 * Formula:
 *   Risk Score = (Credit Risk Weight x Credit Score Factor)
 *              + (Repayment Risk Weight x Repayment Status Factor)
 *              + (Exposure Weight x Loan Balance Factor)
 *
 * Each factor is normalised to a 0-100 scale before weighting, so the final
 * riskScore is also on a 0-100 scale.
 */

import { RawCustomerRow, RiskCategory, RiskWeights, ScoredCustomer } from "./types";

// Rationale: credit history and repayment behaviour are the strongest
// predictors of default; exposure reflects materiality (how much is at
// stake), not probability of default, hence the lower weight.
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
 * Credit Score Factor: lower credit score => higher risk factor.
 * Clamped to the [300, 850] band before scaling to 0-100.
 */
export function creditScoreFactor(creditScore: number): number {
  const clamped = Math.min(CREDIT_SCORE_MAX, Math.max(CREDIT_SCORE_MIN, creditScore));
  return ((CREDIT_SCORE_MAX - clamped) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100;
}

/**
 * Exposure Factor: loan balance scaled against a materiality cap.
 * Balances at or above the cap max out the factor at 100.
 */
export function exposureFactor(loanBalance: number): number {
  const capped = Math.min(Math.max(loanBalance, 0), EXPOSURE_CAP);
  return (capped / EXPOSURE_CAP) * 100;
}

/**
 * Repayment Status Factor: free-text lookup table. Unrecognised text with no
 * parseable day count defaults to 50 (moderate risk) — never silently
 * ignored.
 *
 * Note: the "60 days" (60-89 label -> 75) vs "60 Days Past Due" (-> 60)
 * asymmetry below is intentional history carried over from prior policy
 * review, not a bug to "fix".
 */
export function repaymentRiskFactor(status: string): number {
  const s = (status || "").trim().toLowerCase();

  if (!s) return 50;

  if (s.includes("current") || s.includes("on time")) return 0;
  if (s.includes("watchlist") || s.includes("grace")) return 20;
  if (s.includes("default") || s.includes("write-off") || s.includes("write off")) return 100;
  if (s.includes("non-performing") || s.includes("nonperforming") || s.includes("npl")) return 95;

  if (s.includes("60 days past due")) return 60;

  const dayMatch = s.match(/(\d+)\s*\+?\s*days?/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (s.includes("+") || days >= 90) return 90;
    if (days >= 60) return 75;
    if (days === 30 || (days >= 30 && days < 60)) return 55;
    if (days >= 1 && days < 30) return 35;
  }

  return 50;
}

export function categoriseRisk(riskScore: number): RiskCategory {
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
    category: categoriseRisk(riskScore),
  };
}

export function scoreCustomers(
  rows: RawCustomerRow[],
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer[] {
  return rows.map((row) => scoreCustomer(row, weights));
}
