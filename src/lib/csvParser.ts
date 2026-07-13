import Papa from "papaparse";
import { CsvParseResult, RawCustomerRow } from "./types";

// Accepted header aliases (case-insensitive, whitespace-normalised) for each
// required logical column.
const HEADER_ALIASES: Record<keyof RawCustomerRow, string[]> = {
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

function normalise(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildHeaderMap(headers: string[]): Partial<Record<keyof RawCustomerRow, string>> {
  const map: Partial<Record<keyof RawCustomerRow, string>> = {};
  const normalisedHeaders = headers.map((h) => ({ raw: h, norm: normalise(h) }));

  (Object.keys(HEADER_ALIASES) as (keyof RawCustomerRow)[]).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    const match = normalisedHeaders.find((h) => aliases.includes(h.norm));
    if (match) map[field] = match.raw;
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

export function parseCustomerCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const headerMap = buildHeaderMap(headers);

  const missing = (Object.keys(HEADER_ALIASES) as (keyof RawCustomerRow)[]).filter(
    (field) => !headerMap[field]
  );

  if (missing.length > 0) {
    throw new Error(
      `CSV is missing required column(s): ${missing.join(", ")}. Expected columns like CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance (column names are matched flexibly).`
    );
  }

  const customers: RawCustomerRow[] = [];
  let rowsSkipped = 0;

  for (const row of parsed.data) {
    const customerId = row[headerMap.customerId!]?.trim();
    const customerName = row[headerMap.customerName!]?.trim() || customerId || "Unknown";
    const industrySector = row[headerMap.industrySector!]?.trim() || "Unclassified";
    const creditScore = parseNumber(row[headerMap.creditScore!]);
    const repaymentStatus = row[headerMap.repaymentStatus!]?.trim() || "Unknown";
    const loanBalance = parseNumber(row[headerMap.loanBalance!]);

    if (!customerId || creditScore === null || loanBalance === null) {
      rowsSkipped += 1;
      continue;
    }

    customers.push({
      customerId,
      customerName,
      industrySector,
      creditScore,
      repaymentStatus,
      loanBalance,
    });
  }

  return { customers, rowsSkipped };
}
