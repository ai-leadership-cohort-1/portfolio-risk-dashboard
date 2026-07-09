"use client";

import { useState } from "react";
import AssessmentForm from "@/components/AssessmentForm";
import CreditSummary from "@/components/CreditSummary";
import {
  RawAssessmentRecord,
  AssessmentInput,
  ScoringResult,
  AssessmentMeta,
} from "@/lib/types";
import { FieldErrors, validateAssessmentRecord } from "@/lib/validation";
import { computeScore } from "@/lib/scoring";
import { generateAssessmentId, formatTimestamp } from "@/lib/id";

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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="print:hidden mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Single Assessment
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Enter the application details below to generate an instant
          pre-screening summary.
        </p>
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
        </div>
      )}
    </div>
  );
}
