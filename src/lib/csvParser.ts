import Papa from "papaparse";
import { CsvParseResult, RawCustomerRow } from "./types";

interface ColumnSpec {
  key: keyof RawCustomerRow;
  aliases: string[];
}

const COLUMN_SPECS: ColumnSpec[] = [
  {
    key: "customerId",
    aliases: ["customer_id", "customerid", "id", "account_id", "account number", "customer id"],
  },
  {
    key: "customerName",
    aliases: ["customer_name", "customername", "name", "client name", "customer"],
  },
  {
    key: "industrySector",
    aliases: ["industry_sector", "industry", "sector", "industry sector"],
  },
  {
    key: "creditScore",
    aliases: ["credit_score", "creditscore", "credit score", "score", "bureau_score"],
  },
  {
    key: "repaymentStatus",
    aliases: [
      "repayment_status",
      "repaymentstatus",
      "repayment status",
      "status",
      "arrears_status",
      "delinquency_status",
    ],
  },
  {
    key: "loanBalance",
    aliases: ["loan_balance", "loanbalance", "loan balance", "balance", "exposure", "outstanding_balance"],
  },
];

function normaliseHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildColumnMap(headers: string[]): {
  map: Partial<Record<keyof RawCustomerRow, string>>;
  missing: string[];
} {
  const normalisedHeaders = headers.map((h) => ({ raw: h, normalised: normaliseHeader(h) }));
  const map: Partial<Record<keyof RawCustomerRow, string>> = {};
  const missing: string[] = [];

  for (const spec of COLUMN_SPECS) {
    const match = normalisedHeaders.find((h) => spec.aliases.includes(h.normalised));
    if (match) {
      map[spec.key] = match.raw;
    } else {
      missing.push(spec.key);
    }
  }

  return { map, missing };
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[$,\s]/g, "");
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
  const { map, missing } = buildColumnMap(headers);

  if (missing.length > 0) {
    throw new Error(
      `The uploaded CSV is missing required column(s): ${missing.join(", ")}. ` +
        `Expected columns include CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance (names are matched flexibly).`
    );
  }

  let rowsSkipped = 0;
  const customers: RawCustomerRow[] = [];

  for (const row of parsed.data) {
    const customerId = String(row[map.customerId!] ?? "").trim();
    const customerName = String(row[map.customerName!] ?? "").trim();
    const industrySector = String(row[map.industrySector!] ?? "").trim() || "Unclassified";
    const creditScore = parseNumber(row[map.creditScore!]);
    const repaymentStatus = String(row[map.repaymentStatus!] ?? "").trim();
    const loanBalance = parseNumber(row[map.loanBalance!]);

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
