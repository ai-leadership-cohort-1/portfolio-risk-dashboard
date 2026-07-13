// Client-side CSV parsing for the customer portfolio upload. Uses PapaParse
// to read the file, then flexibly maps whatever headers the bank exported
// onto the six logical fields the scoring engine needs.

import Papa from "papaparse";
import type { CsvParseResult, RawCustomerRow } from "./types";

type ColumnKey = "customerId" | "customerName" | "industrySector" | "creditScore" | "repaymentStatus" | "loanBalance";

const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  customerId: ["customer_id", "customerid", "id", "account_id", "account number", "customer id"],
  customerName: ["customer_name", "customername", "name", "client name", "customer"],
  industrySector: ["industry_sector", "industry", "sector", "industry sector"],
  creditScore: ["credit_score", "creditscore", "credit score", "score", "bureau_score"],
  repaymentStatus: [
    "repayment_status",
    "repaymentstatus",
    "repayment status",
    "status",
    "arrears_status",
    "delinquency_status",
  ],
  loanBalance: ["loan_balance", "loanbalance", "loan balance", "balance", "exposure", "outstanding_balance"],
};

function normaliseHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildColumnMap(headers: string[]): Partial<Record<ColumnKey, string>> {
  const normalisedToOriginal = new Map<string, string>();
  headers.forEach((h) => normalisedToOriginal.set(normaliseHeader(h), h));

  const map: Partial<Record<ColumnKey, string>> = {};
  (Object.keys(COLUMN_ALIASES) as ColumnKey[]).forEach((key) => {
    const aliases = COLUMN_ALIASES[key];
    for (const alias of aliases) {
      const normalisedAlias = normaliseHeader(alias);
      if (normalisedToOriginal.has(normalisedAlias)) {
        map[key] = normalisedToOriginal.get(normalisedAlias);
        return;
      }
    }
  });
  return map;
}

function parseNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const cleaned = value.replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export async function parseCustomerCsv(file: File): Promise<CsvParseResult> {
  const text = await file.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h,
  });

  const headers = parsed.meta.fields ?? [];
  const columnMap = buildColumnMap(headers);

  const missing: string[] = [];
  (Object.keys(COLUMN_ALIASES) as ColumnKey[]).forEach((key) => {
    if (!columnMap[key]) missing.push(key);
  });

  if (missing.length > 0) {
    throw new Error(
      `The CSV is missing required column(s): ${missing.join(", ")}. Expected columns for CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus and LoanBalance (column names are matched flexibly).`
    );
  }

  const customers: RawCustomerRow[] = [];
  let rowsSkipped = 0;

  for (const row of parsed.data) {
    const customerId = (row[columnMap.customerId!] ?? "").trim();
    const customerName = (row[columnMap.customerName!] ?? "").trim();
    const industrySector = (row[columnMap.industrySector!] ?? "").trim() || "Unclassified";
    const creditScore = parseNumber(row[columnMap.creditScore!]);
    const repaymentStatus = (row[columnMap.repaymentStatus!] ?? "").trim();
    const loanBalance = parseNumber(row[columnMap.loanBalance!]);

    if (!customerId || creditScore === null || loanBalance === null) {
      rowsSkipped += 1;
      continue;
    }

    customers.push({
      customerId,
      customerName: customerName || customerId,
      industrySector,
      creditScore,
      repaymentStatus: repaymentStatus || "Unknown",
      loanBalance,
    });
  }

  return { customers, rowsSkipped };
}
