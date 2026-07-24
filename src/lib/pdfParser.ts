import type { ExtractedRule, PdfParseResult } from "./types";

// pdfjs-dist v6 requires Promise.withResolvers, which is undefined on
// browsers older than Safari 17.4 / Chrome 119 / Firefox 121. Polyfill
// defensively before ever touching pdfjs-dist.
function ensureWithResolvers() {
  if (typeof Promise.withResolvers !== "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Promise as any).withResolvers = function withResolvers<T>() {
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

function splitStatements(text: string): string[] {
  return text
    .split(/(?:\. |; )/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15 && s.length <= 320);
}

function isRuleStatement(statement: string): boolean {
  const lower = statement.toLowerCase();
  return RULE_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function parsePolicyPdf(file: File): Promise<PdfParseResult> {
  ensureWithResolvers();

  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let rawText = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    rawText += pageText + " ";
  }

  const statements = splitStatements(rawText);
  const rules: ExtractedRule[] = statements
    .filter(isRuleStatement)
    .slice(0, 25)
    .map((text) => ({ text }));

  return { rawText, rules, pageCount: doc.numPages };
}
