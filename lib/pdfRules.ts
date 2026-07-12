import { PolicyDocument, PolicyRule } from "./types";

// Keywords that flag a sentence in the uploaded policy document as a
// lending/risk rule worth surfacing to a credit or risk analyst. This is a
// lightweight, fully client-side heuristic (no external calls) — it is not
// a substitute for a human policy review.
const RULE_KEYWORDS = [
  "credit score",
  "loan-to-value",
  "lvr",
  "arrears",
  "default",
  "exposure",
  "concentration",
  "serviceability",
  "dscr",
  "debt service",
  "collateral",
  "security",
  "covenant",
  "maximum",
  "minimum",
  "threshold",
  "risk rating",
  "watchlist",
  "impairment",
  "write-off",
  "industry sector",
  "diversification",
  "approval limit",
  "delegated authority",
];

const MAX_RULES = 15;

function splitIntoSentences(text: string): string[] {
  const normalised = text.replace(/\s+/g, " ").trim();
  // Split on sentence-ending punctuation followed by a space and a capital
  // letter/number, which is a reasonable heuristic for policy-style prose
  // and bulleted clauses alike.
  return normalised
    .split(/(?<=[.;])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20 && s.length <= 400);
}

export function extractRulesFromText(rawText: string): PolicyRule[] {
  const sentences = splitIntoSentences(rawText);
  const rules: PolicyRule[] = [];
  const seen = new Set<string>();

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const matchedKeyword = RULE_KEYWORDS.find((kw) => lower.includes(kw));
    if (!matchedKeyword) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    rules.push({
      id: `rule-${rules.length + 1}`,
      keyword: matchedKeyword,
      text: sentence,
    });
    if (rules.length >= MAX_RULES) break;
  }

  return rules;
}

/**
 * Extracts text and heuristic policy rules from an uploaded PDF, entirely
 * in the browser (pdf.js). No file contents ever leave the client.
 */
export async function extractPolicyFromPdf(file: File): Promise<PolicyDocument> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const doc = await loadingTask.promise;

  let rawText = "";
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    rawText += pageText + "\n";
  }

  return {
    fileName: file.name,
    pageCount: doc.numPages,
    rawText,
    rules: extractRulesFromText(rawText),
  };
}

/** Plain-text sample policy used by the "Load sample data" shortcut. */
export const SAMPLE_POLICY_TEXT = `Small Business Lending Policy — Risk & Credit Guidelines (Sample)

1. Credit Assessment. All applicants must have a minimum credit score of 500 to be
considered for approval without additional security. Applications with a credit score
below 500 require Credit Committee referral.

2. Serviceability. Debt Service Coverage Ratio (DSCR) must be at least 1.25x based on
verified trailing twelve-month cash flow before an unsecured facility is approved.

3. Exposure Limits. Maximum single-customer exposure is capped at $750,000 for
unsecured lending and $2,000,000 in aggregate with approved security. Exposures above
this threshold require Regional Credit Manager sign-off.

4. Arrears and Default. Accounts reaching 30 days in arrears are flagged for proactive
Relationship Manager contact. Accounts reaching 90 days in arrears are moved to the
watchlist and reviewed monthly. Any default event triggers mandatory impairment review
within 5 business days.

5. Industry Concentration. No single industry sector should represent more than 25% of
total portfolio exposure without explicit Risk Committee approval, to maintain
diversification across the small-business book.

6. Collateral and Security. Loans exceeding $250,000 should be secured by registered
collateral (real property or general security agreement) wherever the applicant's asset
position allows it.

7. Delegated Authority. Relationship Managers may approve loans up to $150,000 within
policy; approvals above this amount require escalation per the delegated approval limit
matrix.

8. Ongoing Monitoring. Portfolio risk ratings should be reviewed quarterly, with any
customer showing a two-notch downgrade escalated for early intervention.
`;
