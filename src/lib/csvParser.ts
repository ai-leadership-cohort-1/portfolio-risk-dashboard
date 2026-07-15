import Papa from "papaparse";
import { CsvParseResult, RawCustomerRow } from "./types";

const COLUMN_ALIASES: Record<keyof RawCustomerRow, string[]> = {
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

function matchColumns(headers: string[]): Partial<Record<keyof RawCustomerRow, string>> {
  const normalisedHeaders = headers.map((h) => ({ raw: h, norm: normaliseHeader(h) }));
  const matches: Partial<Record<keyof RawCustomerRow, string>> = {};

  (Object.keys(COLUMN_ALIASES) as (keyof RawCustomerRow)[]).forEach((key) => {
    const aliases = COLUMN_ALIASES[key];
    const found = normalisedHeaders.find((h) => aliases.includes(h.norm) || h.norm === normaliseHeader(key));
    if (found) matches[key] = found.raw;
  });

  return matches;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseCsv(text: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields || [];
  const columnMap = matchColumns(headers);

  const requiredKeys: (keyof RawCustomerRow)[] = [
    "customerId",
    "customerName",
    "industrySector",
    "creditScore",
    "repaymentStatus",
    "loanBalance",
  ];
  const missing = requiredKeys.filter((k) => !columnMap[k]);

  if (missing.length > 0) {
    throw new Error(
      `Could not find required column(s) in the CSV: ${missing.join(", ")}. ` +
        `Please check the file headers and try again.`
    );
  }

  let rowsSkipped = 0;
  const customers: RawCustomerRow[] = [];

  for (const row of parsed.data) {
    const customerId = String(row[columnMap.customerId!] ?? "").trim();
    const customerName = String(row[columnMap.customerName!] ?? "").trim();
    const industrySector = String(row[columnMap.industrySector!] ?? "").trim() || "Unclassified";
    const repaymentStatus = String(row[columnMap.repaymentStatus!] ?? "").trim();
    const creditScore = parseNumber(row[columnMap.creditScore!]);
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
      repaymentStatus,
      loanBalance,
    });
  }

  return { customers, rowsSkipped };
}
