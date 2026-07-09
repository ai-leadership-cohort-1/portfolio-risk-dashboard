/**
 * Client-side CSV template generation + parsing for Batch Review.
 * No server, no external library — a small hand-rolled RFC4180-ish parser
 * so quoted fields (business names containing commas, etc.) are handled
 * correctly without adding a dependency.
 */

import { RAW_FIELD_ORDER, RawAssessmentRecord } from "./types";

/** Five illustrative sample rows spanning a realistic spread of outcomes,
 * used both for the downloadable template and as a reference for the
 * expected format. Figures are chosen so the set covers Green, Amber and
 * Red outcomes once run through lib/scoring.ts. */
export const SAMPLE_CSV_ROWS: RawAssessmentRecord[] = [
  {
    business_name: "Harbourview Legal Advisory Pty Ltd",
    abn: "51824753556",
    industry: "Professional Services",
    years_in_operation: "6",
    annual_revenue_aud: "950000",
    existing_debt_aud: "120000",
    loan_amount_aud: "100000",
    loan_purpose: "Working capital",
    purpose_detail: "Cover seasonal cashflow gap",
    rm_name: "Sarah Chen",
  },
  {
    business_name: "Coastal Grounds Cafe",
    abn: "40123456789",
    industry: "Hospitality & Food",
    years_in_operation: "3",
    annual_revenue_aud: "480000",
    existing_debt_aud: "140000",
    loan_amount_aud: "160000",
    loan_purpose: "Equipment finance",
    purpose_detail: "New kitchen equipment",
    rm_name: "James Patel",
  },
  {
    business_name: "Ironline Formwork Subbies Pty Ltd",
    abn: "63987654321",
    industry: "Construction",
    years_in_operation: "4",
    annual_revenue_aud: "700000",
    existing_debt_aud: "320000",
    loan_amount_aud: "380000",
    loan_purpose: "Business expansion",
    purpose_detail: "Purchase additional formwork equipment",
    rm_name: "Michael Nguyen",
  },
  {
    business_name: "Bayside Family Dental",
    abn: "72456789123",
    industry: "Healthcare",
    years_in_operation: "8",
    annual_revenue_aud: "1100000",
    existing_debt_aud: "200000",
    loan_amount_aud: "220000",
    loan_purpose: "Property/fit-out",
    purpose_detail: "Fit-out second consulting room",
    rm_name: "Aisha Nguyen",
  },
  {
    business_name: "Northside Home & Hardware",
    abn: "85234567891",
    industry: "Retail Trade",
    years_in_operation: "3",
    annual_revenue_aud: "900000",
    existing_debt_aud: "300000",
    loan_amount_aud: "250000",
    loan_purpose: "Refinance existing debt",
    purpose_detail: "Consolidate supplier finance facility",
    rm_name: "Priya Kaur",
  },
];

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds the downloadable CSV template: headers + five ready-to-use sample rows. */
export function generateCsvTemplate(): string {
  const lines = [RAW_FIELD_ORDER.join(",")];
  for (const row of SAMPLE_CSV_ROWS) {
    lines.push(RAW_FIELD_ORDER.map((key) => escapeCsvField(row[key])).join(","));
  }
  return lines.join("\n") + "\n";
}

/** Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas,
 * embedded newlines, and doubled-quote escaping ("" -> "). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalised.length; i++) {
    const c = normalised[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalised[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully blank trailing/interstitial lines.
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

export interface ParsedCsvResult {
  records: RawAssessmentRecord[];
  headerError: string | null;
}

/** Parses raw CSV text into RawAssessmentRecord rows, matching columns by
 * header name (order-independent) so the file doesn't have to exactly
 * match the template's column order. */
export function parseAssessmentCsv(text: string): ParsedCsvResult {
  const table = parseCsv(text);
  if (table.length === 0) {
    return { records: [], headerError: "The CSV file appears to be empty." };
  }

  const header = table[0].map((h) => h.trim());
  const missing = RAW_FIELD_ORDER.filter((f) => !header.includes(f));
  if (missing.length > 0) {
    return {
      records: [],
      headerError: `CSV is missing expected column(s): ${missing.join(", ")}.`,
    };
  }

  const records: RawAssessmentRecord[] = [];
  for (const rawRow of table.slice(1)) {
    if (rawRow.every((cell) => cell.trim() === "")) continue;
    const record = {} as unknown as Record<string, string>;
    header.forEach((h, idx) => {
      if ((RAW_FIELD_ORDER as string[]).includes(h)) {
        record[h] = rawRow[idx] ?? "";
      }
    });
    for (const key of RAW_FIELD_ORDER) {
      if (record[key] === undefined) record[key] = "";
    }
    records.push(record as unknown as RawAssessmentRecord);
  }
  return { records, headerError: null };
}

/** Triggers a client-side download of the given text as a named file. */
export function downloadTextFile(filename: string, contents: string, mimeType = "text/csv") {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
