/**
 * RM CALL NOTES — deterministic, templated call-guide generator.
 *
 * This is NOT an AI call and makes no external requests: every sentence is
 * built from plain string templates driven by the scoring output in
 * lib/scoring.ts. Same input always produces the same notes.
 */

import { AssessmentInput, Band, FactorResult, ScoringResult, TrafficLight, CallNotes } from "./types";

export const CALL_NOTES_DISCLAIMER =
  "These notes are a triage aid for internal RM use only. Not for distribution to the customer.";

function buildOpeningLine(input: AssessmentInput): string {
  const purpose = input.loanPurpose.toLowerCase();
  return `Thanks for making time to chat — I've been through ${input.businessName}'s application for ${purpose} and wanted to run through a few points with you before we take it further.`;
}

/** One talking point per factor, phrased around its band. Always five
 * points (one per factor), which sits comfortably inside the brief's
 * 3-5 range while guaranteeing full coverage of the breakdown. */
const TALKING_POINT_TEMPLATES: Record<FactorResult["key"], Record<Band, string>> = {
  leverage: {
    weak: "Leverage came out weak — walk through their existing debt obligations and how comfortably they're being serviced today.",
    moderate: "Leverage is moderate — worth confirming how existing repayments are being funded month to month.",
    strong: "Leverage is strong — a quick confirmation that no new debt has been taken on recently is enough.",
  },
  coverage: {
    weak: "The loan requested is large relative to revenue — talk through exactly how the funds will convert into serviceable cash flow.",
    moderate: "Loan-to-revenue coverage is moderate — confirm the revenue figures used are still current.",
    strong: "Coverage is comfortable — a brief check that revenue hasn't materially changed is sufficient.",
  },
  vintage: {
    weak: "Trading history is under two years — ask about the owners' prior experience to help offset the limited track record.",
    moderate: "Trading history is still developing — ask what's driven the business's performance over the last couple of years.",
    strong: "An established trading history — confirm there's been no major change in the business since it was established.",
  },
  industryRisk: {
    weak: "This industry sits in the higher-risk tier here — discuss how the business is managing sector-specific pressures (seasonality, input costs, competition).",
    moderate: "Industry risk is moderate — ask briefly about the business's competitive position within the sector.",
    strong: "No particular industry concerns — a general check on current trading conditions is enough.",
  },
  purposeRisk: {
    weak: "Loan purpose warrants a closer look — clarify exactly what the funds will be used for.",
    moderate: "Loan purpose is flagged for extra scrutiny — clarify exactly what the funds will be used for and the expected outcome.",
    strong: "Purpose is clear and standard — confirm it still matches how the funds will actually be used.",
  },
};

function buildTalkingPoints(result: ScoringResult): string[] {
  return result.factors.map((f) => TALKING_POINT_TEMPLATES[f.key][f.band]);
}

function buildQuestions(overall: TrafficLight, result: ScoringResult, input: AssessmentInput): string[] {
  if (overall === "Green") {
    return [
      "Can you confirm your revenue and existing debt figures are still in line with your latest financials?",
      "Are there any upcoming changes to the business — ownership, premises, major contracts — we should know about?",
      "Is the loan amount and purpose you've described still accurate today?",
    ];
  }

  if (overall === "Red") {
    return [
      "What's driving the need to refinance existing debt (or take on new debt) at this time?",
      "How confident are you in the business's ability to service both existing and new debt given current revenue?",
      "What's the plan if revenue doesn't grow as expected over the next 12 months?",
      "Have you considered restructuring existing facilities as an alternative to additional borrowing?",
    ];
  }

  // Amber: clarifying questions targeted at the specific weak/moderate factors.
  const questions: string[] = [];
  const softFactors = result.factors.filter((f) => f.band !== "strong");
  for (const f of softFactors) {
    switch (f.key) {
      case "leverage":
        questions.push("Can you walk me through how your existing debt repayments are currently being funded?");
        break;
      case "coverage":
        questions.push("How will the requested funds translate into revenue or cost savings to support repayment?");
        break;
      case "vintage":
        questions.push("What's given you confidence in the business's trajectory given its relatively short trading history?");
        break;
      case "industryRisk":
        questions.push(`How is the business managing conditions specific to the ${input.industry} sector at the moment?`);
        break;
      case "purposeRisk":
        questions.push("Can you clarify exactly what the funds from this loan will be used for, and the expected outcome?");
        break;
    }
  }
  if (questions.length === 0) {
    questions.push("Can you talk me through the assumptions behind the figures you've provided?");
  }
  return questions;
}

function buildNextStep(overall: TrafficLight): string {
  if (overall === "Green") return "Proceed to committee with the current pack.";
  if (overall === "Red")
    return "Decline to progress in its current form — recommend referral to a business banking specialist for a detailed manual assessment.";
  return "Request additional supporting documentation (e.g. 12 months of BAS statements) on the flagged factor(s) before proceeding to committee.";
}

export function generateCallNotes(input: AssessmentInput, result: ScoringResult): CallNotes {
  return {
    openingLine: buildOpeningLine(input),
    talkingPoints: buildTalkingPoints(result),
    questions: buildQuestions(result.overall, result, input),
    nextStep: buildNextStep(result.overall),
    disclaimer: CALL_NOTES_DISCLAIMER,
  };
}
