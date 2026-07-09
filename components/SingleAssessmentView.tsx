"use client";

import { useState } from "react";
import AssessmentForm from "@/components/AssessmentForm";
import { RawAssessmentRecord, AssessmentInput, ScoringResult } from "@/lib/types";
import { FieldErrors, validateAssessmentRecord } from "@/lib/validation";
import { computeScore } from "@/lib/scoring";

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

  function handleChange(field: keyof RawAssessmentRecord, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const outcome = validateAssessmentRecord(values);
    setErrors(outcome.fieldErrors);
    setValidated(outcome.input);
    setResult(outcome.input ? computeScore(outcome.input) : null);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Single Assessment
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Enter the application details below to generate an instant
          pre-screening summary.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <AssessmentForm
          values={values}
          errors={errors}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </div>

      {validated && result && (
        <div className="mt-8 rounded-lg border border-border bg-surface p-6">
          <p className="text-sm font-medium text-foreground">
            Scoring result:{" "}
            <span className="font-semibold">{result.overall}</span>. A
            polished credit summary layout is coming in the next milestone.
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-background p-3 text-xs text-muted">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
