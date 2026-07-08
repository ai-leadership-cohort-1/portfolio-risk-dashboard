import {
  AssessmentInput,
  INDUSTRIES,
  Industry,
  LOAN_PURPOSES,
  LoanPurpose,
  RawAssessmentRecord,
} from "./types";

/** Loan amount is capped at $500,000 AUD for this prototype (see brief). */
export const MAX_LOAN_AMOUNT_AUD = 500_000;

/** Normalises an ABN by stripping whitespace only — never reformats digits. */
export function normaliseAbn(raw: string): string {
  return raw.replace(/\s+/g, "");
}

/**
 * Validates an ABN as exactly 11 digits. This is a structural check only —
 * no ABN checksum algorithm and no external lookup (Australian Business
 * Register etc.), matching the brief's "do not call any external service".
 */
export function isValidAbn(raw: string): boolean {
  return /^\d{11}$/.test(normaliseAbn(raw));
}

/** Formats a normalised 11-digit ABN as "12 345 678 901" for display. */
export function formatAbn(raw: string): string {
  const digits = normaliseAbn(raw);
  if (!/^\d{11}$/.test(digits)) return raw;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}

export type FieldErrors = Partial<Record<keyof RawAssessmentRecord, string>>;

export interface ValidationOutcome {
  input: AssessmentInput | null;
  fieldErrors: FieldErrors;
}

function parsePositiveNumber(raw: string): number | null {
  if (raw === undefined || raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Validates and parses a raw string record (from the form or a CSV row)
 * into a typed AssessmentInput. Returns field-level errors so callers can
 * show inline messages without discarding whatever the user already
 * entered elsewhere in the record.
 */
export function validateAssessmentRecord(
  raw: RawAssessmentRecord
): ValidationOutcome {
  const errors: FieldErrors = {};

  const businessName = raw.business_name?.trim() ?? "";
  if (!businessName) errors.business_name = "Business name is required.";

  const abn = normaliseAbn(raw.abn ?? "");
  if (!isValidAbn(abn)) {
    errors.abn = "ABN must be exactly 11 digits.";
  }

  const industry = (raw.industry?.trim() ?? "") as Industry;
  if (!INDUSTRIES.includes(industry)) {
    errors.industry = `Industry must be one of: ${INDUSTRIES.join(", ")}.`;
  }

  const yearsInOperation = parsePositiveNumber(raw.years_in_operation);
  if (yearsInOperation === null) {
    errors.years_in_operation = "Years in operation must be a non-negative number.";
  }

  const annualRevenueAud = parsePositiveNumber(raw.annual_revenue_aud);
  if (annualRevenueAud === null || annualRevenueAud === 0) {
    errors.annual_revenue_aud = "Annual revenue must be a positive number.";
  }

  const existingDebtAud = parsePositiveNumber(raw.existing_debt_aud);
  if (existingDebtAud === null) {
    errors.existing_debt_aud = "Existing debt must be a non-negative number.";
  }

  const loanAmountAud = parsePositiveNumber(raw.loan_amount_aud);
  if (loanAmountAud === null || loanAmountAud <= 0) {
    errors.loan_amount_aud = "Loan amount must be a positive number.";
  } else if (loanAmountAud > MAX_LOAN_AMOUNT_AUD) {
    errors.loan_amount_aud = `Loan amount cannot exceed $${MAX_LOAN_AMOUNT_AUD.toLocaleString("en-AU")}.`;
  }

  const loanPurpose = (raw.loan_purpose?.trim() ?? "") as LoanPurpose;
  if (!LOAN_PURPOSES.includes(loanPurpose)) {
    errors.loan_purpose = `Loan purpose must be one of: ${LOAN_PURPOSES.join(", ")}.`;
  }

  const rmName = raw.rm_name?.trim() ?? "";
  if (!rmName) errors.rm_name = "Relationship manager name is required.";

  if (Object.keys(errors).length > 0) {
    return { input: null, fieldErrors: errors };
  }

  return {
    input: {
      businessName,
      abn,
      industry,
      yearsInOperation: yearsInOperation as number,
      annualRevenueAud: annualRevenueAud as number,
      existingDebtAud: existingDebtAud as number,
      loanAmountAud: loanAmountAud as number,
      loanPurpose,
      purposeDetail: raw.purpose_detail?.trim() ?? "",
      rmName,
    },
    fieldErrors: {},
  };
}
