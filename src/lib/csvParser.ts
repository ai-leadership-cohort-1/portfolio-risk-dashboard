import Papa from "papaparse";
import type { CsvParseResult, RawCustomerRow } from "./types";

// Accepted header aliases per logical column (case-insensitive,
// whitespace-normalised at match time).
const HEADER_ALIASES: Record<keyof RawCustomerRow, string[]> = {
  customerId: ["customerid", "customer_id", "id", "account_id", "account number", "customer id"],
  customerName: ["customername", "customer_name", "name", "client name", "customer"],
  industrySector: ["industrysector", "industry_sector", "industry", "sector", "industry sector"],
  creditScore: ["creditscore", "credit_score", "credit score", "score", "bureau_score"],
  repaymentStatus: [
    "repaymentstatus",
    "repayment_status",
    "repayment status",
    "status",
    "arrears_status",
    "delinquency_status",
  ],
  loanBalance: ["loanbalance", "loan_balance", "loan balance", "balance", "exposure", "outstanding_balance"],
};

function normaliseHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildHeaderMap(headers: string[]): Partial<Record<keyof RawCustomerRow, string>> {
  const normalisedToOriginal = new Map(headers.map((h) => [normaliseHeader(h), h]));
  const map: Partial<Record<keyof RawCustomerRow, string>> = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof RawCustomerRow, string[]][]) {
    for (const alias of aliases) {
      const original = normalisedToOriginal.get(alias);
      if (original) {
        map[field] = original;
        break;
      }
    }
  }

  return map;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function parseCustomerCsv(fileText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  const headerMap = buildHeaderMap(headers);

  const requiredFields: (keyof RawCustomerRow)[] = [
    "customerId",
    "customerName",
    "industrySector",
    "creditScore",
    "repaymentStatus",
    "loanBalance",
  ];
  const missing = requiredFields.filter((f) => !headerMap[f]);
  if (missing.length > 0) {
    throw new Error(
      `Could not find columns for: ${missing.join(", ")}. Please check your CSV headers and try again.`
    );
  }

  const customers: RawCustomerRow[] = [];
  let rowsSkipped = 0;

  for (const row of parsed.data) {
    const customerId = String(row[headerMap.customerId!] ?? "").trim();
    const customerName = String(row[headerMap.customerName!] ?? "").trim();
    const industrySector = String(row[headerMap.industrySector!] ?? "").trim() || "Unclassified";
    const creditScore = parseNumber(row[headerMap.creditScore!]);
    const repaymentStatus = String(row[headerMap.repaymentStatus!] ?? "").trim();
    const loanBalance = parseNumber(row[headerMap.loanBalance!]);

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
