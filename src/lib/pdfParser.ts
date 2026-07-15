import { ExtractedRule, PdfExtractionResult } from "./types";

const RULE_KEYWORDS = [
  "credit score",
  "debt-to-income",
  "debt to income",
  "dti",
  "loan-to-value",
  "loan to value",
  "ltv",
  "delinquen",
  "default",
  "past due",
  "arrears",
  "watchlist",
  "covenant",
  "exposure limit",
  "concentration limit",
  "threshold",
  "risk rating",
  "risk grade",
  "write-off",
  "write off",
  "provisioning",
  "collateral",
  "minimum",
  "maximum",
];

function ensurePromiseWithResolvers() {
  // pdfjs-dist v6 requires Promise.withResolvers, which is undefined on
  // browsers older than Safari 17.4 / Chrome 119 / Firefox 121. Polyfill
  // defensively before touching pdfjs-dist.
  type PromiseWithResolvers = <T>() => {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  };
  const g = globalThis as typeof globalThis & { Promise: { withResolvers?: PromiseWithResolvers } };
  if (typeof g.Promise.withResolvers !== "function") {
    g.Promise.withResolvers = function withResolvers<T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

function extractRules(text: string): ExtractedRule[] {
  const statements = text
    .split(/(?<=[.;])\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 15 && s.length <= 320);

  const lowerKeywords = RULE_KEYWORDS.map((k) => k.toLowerCase());

  const rules: ExtractedRule[] = [];
  for (const statement of statements) {
    const lower = statement.toLowerCase();
    if (lowerKeywords.some((k) => lower.includes(k))) {
      rules.push({ text: statement });
      if (rules.length >= 25) break;
    }
  }
  return rules;
}

export async function parsePdf(file: File): Promise<PdfExtractionResult> {
  ensurePromiseWithResolvers();

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let rawText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    rawText += pageText + " ";
  }

  const rules = extractRules(rawText);

  return { rawText, rules, pageCount: pdf.numPages };
}
