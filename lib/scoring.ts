import { Customer, RepaymentStatus, RiskCategory, ScoredCustomer } from "./types";

// ---------------------------------------------------------------------------
// SCORING CONFIGURATION
// Edit the constants in this section to change how risk is scored or how
// customers are categorised. Nothing else in the app needs to change.
// ---------------------------------------------------------------------------

/**
 * Risk Score = (Credit Risk Weight x Credit Score Factor)
 *            + (Repayment Risk Weight x Repayment Status Factor)
 *            + (Exposure Weight x Loan Balance Factor)
 *
 * Each factor is normalised to a 0-100 scale before weighting, so the
 * final Risk Score is always 0-100 regardless of the weights chosen below
 * (as long as the three weights sum to 1).
 */
export const CREDIT_RISK_WEIGHT = 0.4;
export const REPAYMENT_RISK_WEIGHT = 0.4;
export const EXPOSURE_WEIGHT = 0.2;

/**
 * Credit scores in this prototype follow the common Australian bureau scale
 * (0-1000, higher = lower risk). The credit factor is the inverse of that,
 * scaled to 0-100.
 */
export const CREDIT_SCORE_MIN = 0;
export const CREDIT_SCORE_MAX = 1000;

/**
 * Repayment status is categorical, so each status is mapped to a fixed
 * risk-point value on a 0-100 scale (0 = no risk, 100 = maximum risk).
 */
export const REPAYMENT_STATUS_POINTS: Record<RepaymentStatus, number> = {
  current: 0,
  "30_days": 30,
  "60_days": 60,
  "90_plus_days": 85,
  default: 100,
};

/**
 * Exposure factor: loan balance is scaled against a reference "high
 * exposure" cap typical of a small-business lending book. Balances at or
 * above the cap score the maximum 100 exposure points; balances of $0
 * score 0. Adjust EXPOSURE_CAP to reflect your portfolio's real distribution.
 */
export const EXPOSURE_CAP = 750_000;

/**
 * Category thresholds applied to the final 0-100 Risk Score.
 * Green: score < GREEN_MAX
 * Amber: GREEN_MAX <= score < AMBER_MAX
 * Red:   score >= AMBER_MAX
 */
export const GREEN_MAX = 35;
export const AMBER_MAX = 65;

// ---------------------------------------------------------------------------
// SCORING LOGIC — should not normally need editing.
// ---------------------------------------------------------------------------

export function creditRiskFactor(creditScore: number): number {
  const clamped = Math.min(Math.max(creditScore, CREDIT_SCORE_MIN), CREDIT_SCORE_MAX);
  const normalised = (clamped - CREDIT_SCORE_MIN) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN);
  return Math.round((1 - normalised) * 100 * 100) / 100;
}

export function repaymentRiskFactor(status: RepaymentStatus): number {
  return REPAYMENT_STATUS_POINTS[status];
}

export function exposureFactor(loanBalance: number): number {
  const clamped = Math.min(Math.max(loanBalance, 0), EXPOSURE_CAP);
  return Math.round((clamped / EXPOSURE_CAP) * 100 * 100) / 100;
}

export function categoriseRisk(riskScore: number): RiskCategory {
  if (riskScore < GREEN_MAX) return "Green";
  if (riskScore < AMBER_MAX) return "Amber";
  return "Red";
}

export function scoreCustomer(customer: Customer): ScoredCustomer {
  const cf = creditRiskFactor(customer.creditScore);
  const rf = repaymentRiskFactor(customer.repaymentStatus);
  const ef = exposureFactor(customer.loanBalance);

  const riskScore =
    Math.round(
      (CREDIT_RISK_WEIGHT * cf + REPAYMENT_RISK_WEIGHT * rf + EXPOSURE_WEIGHT * ef) * 100
    ) / 100;

  return {
    ...customer,
    creditRiskFactor: cf,
    repaymentRiskFactor: rf,
    exposureFactor: ef,
    riskScore,
    riskCategory: categoriseRisk(riskScore),
  };
}

export function scorePortfolio(customers: Customer[]): ScoredCustomer[] {
  return customers.map(scoreCustomer);
}
