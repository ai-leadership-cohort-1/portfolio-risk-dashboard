import { ExtractedRule, PdfParseResult } from "./types";

// pdfjs-dist v6 relies internally on Promise.withResolvers (a very recent
// addition to JS: Safari 17.4+, Chrome 119+, Firefox 121+). On older
// browsers/webviews this is undefined, which surfaces to the user as a
// cryptic "undefined is not a function" error the moment a PDF is parsed.
// Polyfill it defensively so PDF extraction keeps working everywhere; this
// only ever runs client-side since pdfParser.ts is only imported from a
// "use client" component's event handler.
if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function <T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  } {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// Keyword heuristics only — no LLM/API calls of any kind. Pure client-side
// text extraction + sentence splitting + keyword flagging.
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
const MIN_LEN = 15;
const MAX_LEN = 320;

function splitStatements(text: string): string[] {
  return text
    .split(/(?<=[.;])\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= MIN_LEN && s.length <= MAX_LEN);
}

function isRuleStatement(statement: string): boolean {
  const lower = statement.toLowerCase();
  return RULE_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function parseLendingPolicyPdf(file: File): Promise<PdfParseResult> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let rawText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    rawText += pageText + " ";
  }

  const statements = splitStatements(rawText);
  const rules: ExtractedRule[] = statements
    .filter(isRuleStatement)
    .slice(0, MAX_RULES)
    .map((text) => ({ text }));

  return { rawText, rules, pageCount: pdf.numPages };
}
