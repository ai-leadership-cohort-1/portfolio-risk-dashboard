// Shared type definitions for the Portfolio Risk Dashboard.
// No backend/database — these types describe purely client-side, in-memory data.

export type RiskCategory = "Green" | "Amber" | "Red";

export interface RawCustomerRow {
  customerId: string;
  customerName: string;
  industrySector: string;
  creditScore: number;
  repaymentStatus: string;
  loanBalance: number;
}

export interface ScoredCustomer extends RawCustomerRow {
  creditScoreFactor: number;
  repaymentRiskFactor: number;
  exposureFactor: number;
  riskScore: number;
  category: RiskCategory;
}

export interface RiskWeights {
  creditRiskWeight: number;
  repaymentRiskWeight: number;
  exposureWeight: number;
}

export interface RiskThresholds {
  greenMax: number;
  amberMax: number;
}

export interface ExtractedRule {
  text: string;
}

export interface CsvParseResult {
  customers: RawCustomerRow[];
  rowsSkipped: number;
}

export interface PdfParseResult {
  rawText: string;
  rules: ExtractedRule[];
  pageCount: number;
}

export interface AnalysisResult {
  customers: ScoredCustomer[];
  rules: ExtractedRule[];
  weights: RiskWeights;
  csvFileName: string;
  pdfFileName: string | null;
  pdfPageCount: number | null;
  analysedAt: Date;
  isSampleData: boolean;
  pdfParseFailed: boolean;
  pdfParseErrorMessage?: string;
}

export interface TrendPoint {
  label: string;
  averageRiskScore: number;
}
