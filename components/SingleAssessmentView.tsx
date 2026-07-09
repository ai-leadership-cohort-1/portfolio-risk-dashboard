"use client";

import { useState } from "react";
import AssessmentForm from "@/components/AssessmentForm";
import CreditSummary from "@/components/CreditSummary";
import CallNotesSection from "@/components/CallNotesSection";
import {
  RawAssessmentRecord,
  AssessmentInput,
  ScoringResult,
  AssessmentMeta,
} from "@/lib/types";
import { FieldErrors, validateAssessmentRecord } from "@/lib/validation";
import { computeScore } from "@/lib/scoring";
import { generateAssessmentId, formatTimestamp } from "@/lib/id";
import { SAMPLE_SCENARIOS, SampleScenarioKey } from "@/lib/sampleData";

const EMPTY_VALUES: RawAssessmentRecord = {
  business_name: "",
  abn: "",
  industry: "",
  years_in_operation: "",
  annual_revenue_aud: "",
  existing_debt_aud: "",
  loan_amount_aud: "",
  loan_purpose: "",
  purpose_detail: "",
  rm_name: "",
};

export default function SingleAssessmentView() {
  const [values, setValues] = useState<RawAssessmentRecord>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [validated, setValidated] = useState<AssessmentInput | null>(null);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [meta, setMeta] = useState<AssessmentMeta | null>(null);

  function handleChange(field: keyof RawAssessmentRecord, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleLoadSample(key: SampleScenarioKey) {
    setValues(SAMPLE_SCENARIOS[key]);
    setErrors({});
    setValidated(null);
    setResult(null);
    setMeta(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const outcome = validateAssessmentRecord(values);
    setErrors(outcome.fieldErrors);
    if (outcome.input) {
      setValidated(outcome.input);
      setResult(computeScore(outcome.input));
      setMeta({
        assessmentId: generateAssessmentId(),
        timestamp: formatTimestamp(new Date()),
      });
    } else {
      setValidated(null);
      setResult(null);
      setMeta(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
      <div className="print:hidden mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Single Assessment
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Enter the application details below to generate an instant
          pre-screening summary.
        </p>
      </div>

      <div className="print:hidden mb-6 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted">Load sample:</span>
        {(Object.keys(SAMPLE_SCENARIOS) as SampleScenarioKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleLoadSample(key)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                key === "Green" ? "bg-emerald-600" : key === "Amber" ? "bg-amber-500" : "bg-red-600"
              }`}
              aria-hidden="true"
            />
            {key}
          </button>
        ))}
      </div>

      <div className="print:hidden rounded-lg border border-border bg-surface p-6">
        <AssessmentForm
          values={values}
          errors={errors}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>

      {validated && result && meta && (
        <div className="mt-8">
          <CreditSummary input={validated} result={result} meta={meta} />
          <CallNotesSection input={validated} result={result} />
        </div>
      )}
    </div>
  );
}
