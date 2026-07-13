// Client-side lending policy PDF rule extraction. Pure keyword + sentence-
// splitting heuristics — no LLM/API calls of any kind. PDF upload is
// optional and best-effort: any failure here (unsupported browser, scanned/
// image-only PDF, corrupt file) must never block the CSV analysis.

import type { PdfParseResult } from "./types";

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

const MAX_RULES = 25;

function ensurePromiseWithResolvers() {
  // pdfjs-dist v6 calls Promise.withResolvers, which is undefined on
  // browsers older than Safari 17.4 / Chrome 119 / Firefox 121. Polyfill
  // defensively before touching pdfjs-dist at all.
  if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== "function") {
    (Promise as unknown as { withResolvers: () => { promise: Promise<unknown>; resolve: (v?: unknown) => void; reject: (e?: unknown) => void } }).withResolvers = function withResolvers() {
      let resolve!: (v?: unknown) => void;
      let reject!: (e?: unknown) => void;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

function splitIntoStatements(text: string): string[] {
  const normalised = text.replace(/\s+/g, " ").trim();
  const rawStatements = normalised.split(/(?:\. |; )/);
  return rawStatements
    .map((s) => s.trim())
    .filter((s) => s.length >= 15 && s.length <= 320);
}

function isRuleStatement(statement: string): boolean {
  const lower = statement.toLowerCase();
  return RULE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

export async function parseLendingPolicyPdf(file: File): Promise<PdfParseResult> {
  ensurePromiseWithResolvers();

  // Dynamic import keeps pdfjs-dist out of the initial bundle and lets the
  // worker be resolved as a bundled asset (never a CDN URL), so extraction
  // works fully offline.
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let rawText = "";
  const pageCount = pdf.numPages;

  for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    rawText += `${pageText} `;
  }

  const statements = splitIntoStatements(rawText);
  const rules = statements
    .filter(isRuleStatement)
    .slice(0, MAX_RULES)
    .map((text) => ({ text }));

  return { rawText, rules, pageCount };
}
