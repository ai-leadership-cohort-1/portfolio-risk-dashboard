import { ExtractedRule, PdfParseResult } from "./types";

// pdfjs-dist v6 requires Promise.withResolvers, which is undefined on
// browsers older than Safari 17.4 / Chrome 119 / Firefox 121. Polyfill
// defensively before touching pdfjs-dist so parsing doesn't throw a bare
// "undefined is not a function" on older browsers.
function polyfillPromiseWithResolvers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (Promise as any).withResolvers !== "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Promise as any).withResolvers = function <T>() {
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

function isRuleStatement(statement: string): boolean {
  const lower = statement.toLowerCase();
  return RULE_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractRules(rawText: string): ExtractedRule[] {
  const statements = rawText
    .split(/(?<=[.;])\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 15 && s.length <= 320);

  const rules: ExtractedRule[] = [];
  for (const statement of statements) {
    if (isRuleStatement(statement)) {
      rules.push({ text: statement });
      if (rules.length >= 25) break;
    }
  }
  return rules;
}

export async function parsePolicyPdf(file: File): Promise<PdfParseResult> {
  polyfillPromiseWithResolvers();

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
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    rawText += pageText + " ";
  }

  const rules = extractRules(rawText);

  return {
    rawText,
    rules,
    pageCount: pdf.numPages,
  };
}
