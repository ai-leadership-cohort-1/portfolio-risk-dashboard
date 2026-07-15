export interface RiskWeights {
  creditRiskWeight: number;
  repaymentRiskWeight: number;
  exposureWeight: number;
}

export interface RawCustomerRow {
  customerId: string;
  customerName: string;
  industrySector: string;
  creditScore: number;
  repaymentStatus: string;
  loanBalance: number;
}

export type RiskCategory = "Green" | "Amber" | "Red";

export interface ScoredCustomer extends RawCustomerRow {
  creditScoreFactor: number;
  repaymentRiskFactor: number;
  exposureFactor: number;
  riskScore: number;
  category: RiskCategory;
}

export interface ExtractedRule {
  text: string;
}

export interface PdfExtractionResult {
  rawText: string;
  rules: ExtractedRule[];
  pageCount: number;
}

export interface CsvParseResult {
  customers: RawCustomerRow[];
  rowsSkipped: number;
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
  pdfParseFailed?: boolean;
  pdfParseError?: string;
}
