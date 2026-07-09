/**
 * SCORING ENGINE — the single source of truth for pre-screening thresholds.
 *
 * Every number and lookup table that drives the Green/Amber/Red outcome
 * lives in this file as a named, commented constant. To change how strict
 * or lenient the prototype is, edit the constants below — nothing else in
 * the app needs to change.
 *
 * IMPORTANT: none of these thresholds are calibrated against APRA capital
 * rules, real credit-bureau data, or NAB's actual credit policy. They are
 * illustrative assumptions for a prototype and are clearly flagged as such
 * wherever they appear in the UI.
 */

import { AssessmentInput, Band, FactorResult, Industry, LoanPurpose, ScoringResult, TrafficLight } from "./types";

// ---------------------------------------------------------------------------
// 1. LEVERAGE — existing annualised debt obligations ÷ annual revenue
// ---------------------------------------------------------------------------
/** Below this ratio, leverage is considered "strong" (low risk). */
export const LEVERAGE_STRONG_MAX = 0.20; // < 20%
/** Below this ratio (and at/above the strong cutoff), leverage is "moderate". */
export const LEVERAGE_MODERATE_MAX = 0.40; // 20%–40%
// Anything >= LEVERAGE_MODERATE_MAX is "weak" (> 40%).

// ---------------------------------------------------------------------------
// 2. LOAN-TO-REVENUE COVERAGE — loan amount requested ÷ annual revenue
// ---------------------------------------------------------------------------
export const COVERAGE_STRONG_MAX = 0.25; // < 25%
export const COVERAGE_MODERATE_MAX = 0.50; // 25%–50%
// Anything >= COVERAGE_MODERATE_MAX is "weak" (> 50%).

// ---------------------------------------------------------------------------
// 3. BUSINESS VINTAGE — years in operation
// ---------------------------------------------------------------------------
export const VINTAGE_STRONG_MIN_YEARS = 5; // > 5 years is "strong"
export const VINTAGE_MODERATE_MIN_YEARS = 2; // 2–5 years is "moderate"
// Below VINTAGE_MODERATE_MIN_YEARS is "weak" (< 2 years).

// ---------------------------------------------------------------------------
// 4. INDUSTRY RISK TIER — illustrative lookup table, NOT APRA-calibrated.
//    This is a simplified assumption for the prototype only, standing in
//    for the kind of industry risk weighting a real credit policy would
//    derive from portfolio loss history and APRA risk-weight guidance.
// ---------------------------------------------------------------------------
export type RiskTier = "low" | "medium" | "high";

export const INDUSTRY_RISK_TIER: Record<Industry, RiskTier> = {
  "Professional Services": "low",
  "Healthcare": "low",
  "Retail Trade": "medium",
  "Manufacturing": "medium",
  "Transport & Logistics": "medium",
  "Other": "medium",
  "Construction": "high",
  "Hospitality & Food": "high",
  "Agriculture": "high",
};

/** Maps an industry risk tier onto the same strong/moderate/weak scale used
 * by the numeric factors, so all five factors can be aggregated uniformly. */
const RISK_TIER_TO_BAND: Record<RiskTier, Band> = {
  low: "strong",
  medium: "moderate",
  high: "weak",
};

// ---------------------------------------------------------------------------
// 5. LOAN PURPOSE RISK — purposes that warrant additional scrutiny.
//    Flagged purposes are banded "moderate" rather than "weak": a refinance
//    or unspecified ("Other") purpose alone shouldn't force an Amber/Red
//    result, but it should tip the balance when combined with any other
//    soft factor. See the aggregation rubric below.
// ---------------------------------------------------------------------------
export const HIGH_SCRUTINY_PURPOSES: LoanPurpose[] = [
  "Refinance existing debt",
  "Other",
];

// ---------------------------------------------------------------------------
// AGGREGATION RUBRIC
//   - 2 or more "weak" factors  -> Red
//   - exactly 1 "weak" factor   -> Amber (at least; the 2+ rule above is what
//                                  escalates to Red, a single weak never does)
//   - 0 "weak" factors:
//       - "strong" is the majority (>= 3 of 5 factors) -> Green
//       - otherwise (moderate-heavy, no weak)          -> Amber
// ---------------------------------------------------------------------------
const FACTOR_COUNT = 5;
const STRONG_MAJORITY_THRESHOLD = Math.ceil(FACTOR_COUNT / 2); // 3 of 5

function ratioBand(ratio: number, strongMax: number, moderateMax: number): Band {
  if (ratio < strongMax) return "strong";
  if (ratio < moderateMax) return "moderate";
  return "weak";
}

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

function formatYears(years: number): string {
  return years === 1 ? "1 year" : `${years} years`;
}

function formatAud(amount: number): string {
  return amount.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

export function computeScore(input: AssessmentInput): ScoringResult {
  const leverageRatio = input.annualRevenueAud > 0 ? input.existingDebtAud / input.annualRevenueAud : 1;
  const coverageRatio = input.annualRevenueAud > 0 ? input.loanAmountAud / input.annualRevenueAud : 1;

  const leverageBand = ratioBand(leverageRatio, LEVERAGE_STRONG_MAX, LEVERAGE_MODERATE_MAX);
  const coverageBand = ratioBand(coverageRatio, COVERAGE_STRONG_MAX, COVERAGE_MODERATE_MAX);

  const vintageBand: Band =
    input.yearsInOperation > VINTAGE_STRONG_MIN_YEARS
      ? "strong"
      : input.yearsInOperation >= VINTAGE_MODERATE_MIN_YEARS
        ? "moderate"
        : "weak";

  const industryTier = INDUSTRY_RISK_TIER[input.industry];
  const industryBand = RISK_TIER_TO_BAND[industryTier];

  const purposeFlagged = HIGH_SCRUTINY_PURPOSES.includes(input.loanPurpose);
  const purposeBand: Band = purposeFlagged ? "moderate" : "strong";

  const factors: FactorResult[] = [
    {
      key: "leverage",
      label: "Leverage",
      value: `${formatPercent(leverageRatio)} (${formatAud(input.existingDebtAud)} debt / ${formatAud(input.annualRevenueAud)} revenue)`,
      band: leverageBand,
      interpretation:
        leverageBand === "strong"
          ? "Existing debt is low relative to revenue, leaving healthy headroom."
          : leverageBand === "moderate"
            ? "Existing debt is a meaningful share of revenue; worth confirming serviceability."
            : "Existing debt is high relative to revenue, raising repayment capacity concerns.",
    },
    {
      key: "coverage",
      label: "Loan-to-revenue coverage",
      value: `${formatPercent(coverageRatio)} (${formatAud(input.loanAmountAud)} requested / ${formatAud(input.annualRevenueAud)} revenue)`,
      band: coverageBand,
      interpretation:
        coverageBand === "strong"
          ? "The requested loan is small relative to revenue."
          : coverageBand === "moderate"
            ? "The requested loan is a moderate share of revenue; monitor serviceability."
            : "The requested loan is large relative to revenue, well beyond typical coverage.",
    },
    {
      key: "vintage",
      label: "Business vintage",
      value: formatYears(input.yearsInOperation),
      band: vintageBand,
      interpretation:
        vintageBand === "strong"
          ? "An established trading history of more than five years."
          : vintageBand === "moderate"
            ? "A moderate trading history (2–5 years); some track record but still developing."
            : "Less than two years trading; limited track record to assess.",
    },
    {
      key: "industryRisk",
      label: "Industry risk tier",
      value: `${input.industry} (illustrative tier: ${industryTier})`,
      band: industryBand,
      interpretation:
        industryBand === "strong"
          ? "Industry is assessed as lower risk under this prototype's illustrative tiering."
          : industryBand === "moderate"
            ? "Industry is assessed as medium risk under this prototype's illustrative tiering."
            : "Industry is assessed as higher risk under this prototype's illustrative tiering.",
    },
    {
      key: "purposeRisk",
      label: "Loan purpose risk",
      value: input.loanPurpose,
      band: purposeBand,
      interpretation: purposeFlagged
        ? "This purpose is flagged for additional scrutiny (refinance or unspecified use of funds)."
        : "This purpose is a standard, well-defined use of funds.",
    },
  ];

  const weakCount = factors.filter((f) => f.band === "weak").length;
  const strongCount = factors.filter((f) => f.band === "strong").length;

  let overall: TrafficLight;
  if (weakCount >= 2) {
    overall = "Red";
  } else if (weakCount === 1) {
    overall = "Amber";
  } else if (strongCount >= STRONG_MAJORITY_THRESHOLD) {
    overall = "Green";
  } else {
    overall = "Amber";
  }

  const riskFlags = buildRiskFlags(factors, purposeFlagged, input);

  const recommendation = buildRecommendation(overall, factors, input);

  return { factors, overall, riskFlags, recommendation };
}

function buildRiskFlags(factors: FactorResult[], purposeFlagged: boolean, input: AssessmentInput): string[] {
  const flags: string[] = [];
  for (const f of factors) {
    if (f.band === "weak") {
      flags.push(`${f.label} is weak: ${f.interpretation}`);
    }
  }
  if (purposeFlagged) {
    flags.push(
      `Loan purpose ("${input.loanPurpose}") is flagged for additional scrutiny.`
    );
  }
  if (input.loanAmountAud >= 0.9 * 500_000) {
    flags.push("Loan amount requested is close to the $500,000 prototype cap.");
  }
  if (flags.length === 0) {
    flags.push("No material risk flags identified across the five factors assessed.");
  }
  return flags;
}

function buildRecommendation(overall: TrafficLight, factors: FactorResult[], input: AssessmentInput): string {
  const weakLabels = factors.filter((f) => f.band === "weak").map((f) => f.label.toLowerCase());
  const moderateLabels = factors.filter((f) => f.band === "moderate").map((f) => f.label.toLowerCase());

  if (overall === "Green") {
    return `${input.businessName} presents a low-risk profile across the factors assessed, with a well-established trading history and a loan request well covered by revenue. On the basis of this pre-screening, the application appears suitable to progress to standard credit committee review with no additional conditions flagged. As with all pre-screened applications, the committee should independently verify financials before final approval.`;
  }

  if (overall === "Amber") {
    const focus = weakLabels.length > 0 ? weakLabels : moderateLabels;
    return `${input.businessName} presents a mixed risk profile, with ${focus.join(" and ")} warranting closer review before this application proceeds. The pre-screening result does not preclude progression, but the committee should request supporting documentation on the flagged factor(s) and confirm serviceability assumptions. A conditional pathway to committee is recommended, subject to that additional information.`;
  }

  return `${input.businessName} presents a higher-risk profile, with multiple weak factors including ${weakLabels.join(", ")}. On the basis of this pre-screening, the application is not recommended to proceed to committee in its current form. A more detailed manual assessment — or a referral to a business banking specialist — is recommended before any further action is taken.`;
}
