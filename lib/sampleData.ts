import { RawAssessmentRecord } from "./types";

/**
 * Sample scenarios for the "Load sample" buttons on the Single Assessment
 * form. Chosen to land cleanly on Green / Amber / Red once run through
 * lib/scoring.ts (see the comments below each one).
 */

// All strong factors: established business, modest ask well within coverage.
const SAMPLE_GREEN: RawAssessmentRecord = {
  business_name: "Green Valley Advisory Pty Ltd",
  abn: "12345678901",
  industry: "Professional Services",
  years_in_operation: "7",
  annual_revenue_aud: "1200000",
  existing_debt_aud: "150000",
  loan_amount_aud: "150000",
  loan_purpose: "Working capital",
  purpose_detail: "Smooth out seasonal cashflow between large client invoices",
  rm_name: "Alex Morgan",
};

// One weak factor (industry) plus moderate leverage/coverage/vintage -> Amber.
const SAMPLE_AMBER: RawAssessmentRecord = {
  business_name: "Sunset Harbour Kitchen",
  abn: "23456789012",
  industry: "Hospitality & Food",
  years_in_operation: "3",
  annual_revenue_aud: "600000",
  existing_debt_aud: "180000",
  loan_amount_aud: "200000",
  loan_purpose: "Equipment finance",
  purpose_detail: "New commercial kitchen equipment to expand dinner service",
  rm_name: "Jordan Lee",
};

// Four weak factors (leverage, coverage, vintage, industry) -> Red.
const SAMPLE_RED: RawAssessmentRecord = {
  business_name: "Precision Formwork Solutions",
  abn: "34567890123",
  industry: "Construction",
  years_in_operation: "1.5",
  annual_revenue_aud: "500000",
  existing_debt_aud: "250000",
  loan_amount_aud: "480000",
  loan_purpose: "Refinance existing debt",
  purpose_detail: "Consolidate short-term supplier and equipment finance debt",
  rm_name: "Casey Nguyen",
};

export const SAMPLE_SCENARIOS = {
  Green: SAMPLE_GREEN,
  Amber: SAMPLE_AMBER,
  Red: SAMPLE_RED,
} as const;

export type SampleScenarioKey = keyof typeof SAMPLE_SCENARIOS;
