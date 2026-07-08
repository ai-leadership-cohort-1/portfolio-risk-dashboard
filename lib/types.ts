/**
 * Shared domain types for the loan pre-screening prototype.
 * Everything here is plain data — no client/server split, no persistence.
 */

export const INDUSTRIES = [
  "Construction",
  "Hospitality & Food",
  "Retail Trade",
  "Professional Services",
  "Healthcare",
  "Manufacturing",
  "Transport & Logistics",
  "Agriculture",
  "Other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const LOAN_PURPOSES = [
  "Working capital",
  "Equipment finance",
  "Business expansion",
  "Refinance existing debt",
  "Property/fit-out",
  "Other",
] as const;
export type LoanPurpose = (typeof LOAN_PURPOSES)[number];

/** Raw, string-typed record shape — matches the CSV template headers 1:1,
 * and is what both the single-assessment form and the batch CSV parser
 * produce before validation/parsing. Keeping this shape shared means the
 * exact same validation function can be reused for both entry points. */
export interface RawAssessmentRecord {
  business_name: string;
  abn: string;
  industry: string;
  years_in_operation: string;
  annual_revenue_aud: string;
  existing_debt_aud: string;
  loan_amount_aud: string;
  loan_purpose: string;
  purpose_detail: string;
  rm_name: string;
}

export const RAW_FIELD_ORDER: (keyof RawAssessmentRecord)[] = [
  "business_name",
  "abn",
  "industry",
  "years_in_operation",
  "annual_revenue_aud",
  "existing_debt_aud",
  "loan_amount_aud",
  "loan_purpose",
  "purpose_detail",
  "rm_name",
];

/** Parsed, typed, validated assessment input — ready to score. */
export interface AssessmentInput {
  businessName: string;
  abn: string; // normalised to 11 digits, no spaces
  industry: Industry;
  yearsInOperation: number;
  annualRevenueAud: number;
  existingDebtAud: number;
  loanAmountAud: number;
  loanPurpose: LoanPurpose;
  purposeDetail: string;
  rmName: string;
}

export type Band = "strong" | "moderate" | "weak";
export type TrafficLight = "Green" | "Amber" | "Red";

export interface FactorResult {
  key: "leverage" | "coverage" | "vintage" | "industryRisk" | "purposeRisk";
  label: string;
  value: string;
  band: Band;
  interpretation: string;
}

export interface ScoringResult {
  factors: FactorResult[];
  overall: TrafficLight;
  riskFlags: string[];
  recommendation: string;
}

export interface AssessmentMeta {
  assessmentId: string;
  timestamp: string; // ISO string, formatted for display at render time
}

export interface CallNotes {
  openingLine: string;
  talkingPoints: string[];
  questions: string[];
  nextStep: string;
  disclaimer: string;
}
