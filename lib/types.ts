// Core domain types for the Portfolio Risk Dashboard prototype.
// Everything here is in-memory only — nothing is persisted to disk or a database.

export type RepaymentStatus =
  | "current"
  | "30_days"
  | "60_days"
  | "90_plus_days"
  | "default";

export const REPAYMENT_STATUS_LABELS: Record<RepaymentStatus, string> = {
  current: "Current",
  "30_days": "30 days in arrears",
  "60_days": "60 days in arrears",
  "90_plus_days": "90+ days in arrears",
  default: "Default",
};

export type RiskCategory = "Green" | "Amber" | "Red";

/** A single customer / loan record as parsed from the uploaded portfolio CSV. */
export interface Customer {
  id: string;
  name: string;
  industrySector: string;
  state?: string;
  /** Australian-style credit score, 0-1000 (higher = better). */
  creditScore: number;
  repaymentStatus: RepaymentStatus;
  /** Outstanding loan balance / exposure, in AUD. */
  loanBalance: number;
  loanType?: string;
}

/** A customer record after the scoring engine has run. */
export interface ScoredCustomer extends Customer {
  creditRiskFactor: number; // 0-100, higher = riskier
  repaymentRiskFactor: number; // 0-100, higher = riskier
  exposureFactor: number; // 0-100, higher = riskier
  riskScore: number; // 0-100 weighted composite
  riskCategory: RiskCategory;
}

/** A lending/risk rule extracted from the uploaded policy PDF. */
export interface PolicyRule {
  id: string;
  keyword: string;
  text: string;
}

export interface PolicyDocument {
  fileName: string;
  pageCount: number;
  rawText: string;
  rules: PolicyRule[];
}

export interface PortfolioDataset {
  fileName: string;
  customers: Customer[];
  /** Column names that were present but not recognised, surfaced for transparency. */
  unrecognisedColumns: string[];
  /** Rows skipped due to missing/invalid required fields. */
  skippedRows: number;
}
