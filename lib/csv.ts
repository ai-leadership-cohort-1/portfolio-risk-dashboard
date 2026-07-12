import Papa from "papaparse";
import { Customer, PortfolioDataset, RepaymentStatus } from "./types";

// Maps many plausible header spellings to our canonical field names.
// Extend this if a real portfolio export uses different column names.
const HEADER_ALIASES: Record<string, keyof Customer | "unused"> = {
  id: "id",
  customerid: "id",
  customer_id: "id",
  loanid: "id",
  loan_id: "id",
  accountnumber: "id",
  account_number: "id",

  name: "name",
  customername: "name",
  customer_name: "name",
  businessname: "name",
  business_name: "name",
  clientname: "name",

  industry: "industrySector",
  industrysector: "industrySector",
  industry_sector: "industrySector",
  sector: "industrySector",

  state: "state",
  region: "state",

  creditscore: "creditScore",
  credit_score: "creditScore",
  score: "creditScore",

  repaymentstatus: "repaymentStatus",
  repayment_status: "repaymentStatus",
  arrearsstatus: "repaymentStatus",
  arrears_status: "repaymentStatus",
  status: "repaymentStatus",
  paymentstatus: "repaymentStatus",

  loanbalance: "loanBalance",
  loan_balance: "loanBalance",
  balance: "loanBalance",
  exposure: "loanBalance",
  outstandingbalance: "loanBalance",
  outstanding_balance: "loanBalance",

  loantype: "loanType",
  loan_type: "loanType",
  producttype: "loanType",
  product_type: "loanType",
};

function normaliseHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/_/g, "");
}

function parseRepaymentStatus(raw: string): RepaymentStatus | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (["default", "defaulted", "written off", "writtenoff", "charged off"].includes(v)) {
    return "default";
  }
  if (v.includes("90") || v.includes("default")) return "90_plus_days";
  if (v.includes("60")) return "60_days";
  if (v.includes("30")) return "30_days";
  if (["current", "0", "on time", "ontime", "up to date", "uptodate", "0 days"].includes(v)) {
    return "current";
  }
  // Fall back: pure-numeric "days in arrears" values.
  const numeric = Number(v.replace(/[^0-9.]/g, ""));
  if (!Number.isNaN(numeric)) {
    if (numeric <= 0) return "current";
    if (numeric <= 30) return "30_days";
    if (numeric <= 60) return "60_days";
    if (numeric <= 89) return "90_plus_days";
    return "default";
  }
  return null;
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parsePortfolioCsv(csvText: string, fileName: string): PortfolioDataset {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h,
  });

  const rawHeaders = parsed.meta.fields ?? [];
  const headerMap = new Map<string, keyof Customer | "unused">();
  const unrecognisedColumns: string[] = [];

  for (const header of rawHeaders) {
    const key = normaliseHeader(header);
    const mapped = HEADER_ALIASES[key];
    if (mapped) {
      headerMap.set(header, mapped);
    } else {
      unrecognisedColumns.push(header);
    }
  }

  const customers: Customer[] = [];
  let skippedRows = 0;

  parsed.data.forEach((row, index) => {
    const record: Partial<Customer> = {};

    for (const [header, field] of headerMap.entries()) {
      const value = (row[header] ?? "").toString().trim();
      if (!value || field === "unused") continue;

      switch (field) {
        case "creditScore": {
          const n = Number(value.replace(/[^0-9.]/g, ""));
          if (Number.isFinite(n)) record.creditScore = n;
          break;
        }
        case "loanBalance": {
          const n = parseMoney(value);
          if (n !== null) record.loanBalance = n;
          break;
        }
        case "repaymentStatus": {
          const status = parseRepaymentStatus(value);
          if (status) record.repaymentStatus = status;
          break;
        }
        default:
          (record as Record<string, unknown>)[field] = value;
      }
    }

    const hasRequired =
      record.creditScore !== undefined &&
      record.loanBalance !== undefined &&
      record.repaymentStatus !== undefined;

    if (!hasRequired) {
      skippedRows += 1;
      return;
    }

    customers.push({
      id: record.id?.toString() || `row-${index + 1}`,
      name: record.name?.toString() || `Customer ${index + 1}`,
      industrySector: record.industrySector?.toString() || "Unclassified",
      state: record.state,
      creditScore: record.creditScore!,
      repaymentStatus: record.repaymentStatus!,
      loanBalance: record.loanBalance!,
      loanType: record.loanType,
    });
  });

  return { fileName, customers, unrecognisedColumns, skippedRows };
}

/** A small CSV template so users know exactly which columns to provide. */
export const CSV_TEMPLATE = `customer_id,customer_name,industry_sector,state,credit_score,repayment_status,loan_balance,loan_type
CUST-001,Example Pty Ltd,Retail Trade,NSW,720,current,150000,Term Loan
CUST-002,Sample Cafe Co,Hospitality,VIC,610,30_days,85000,Overdraft
CUST-003,Acme Builders,Construction,QLD,540,60_days,420000,Term Loan
`;
