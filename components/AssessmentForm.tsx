"use client";

import { INDUSTRIES, LOAN_PURPOSES, RawAssessmentRecord } from "@/lib/types";
import { FieldErrors, MAX_LOAN_AMOUNT_AUD } from "@/lib/validation";

interface AssessmentFormProps {
  values: RawAssessmentRecord;
  errors: FieldErrors;
  onChange: (field: keyof RawAssessmentRecord, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
}

function FieldWrapper({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30";

export default function AssessmentForm({
  values,
  errors,
  onChange,
  onSubmit,
  submitLabel = "Run pre-screening assessment",
}: AssessmentFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FieldWrapper label="Business name" htmlFor="business_name" error={errors.business_name}>
          <input
            id="business_name"
            className={inputClass}
            value={values.business_name}
            onChange={(e) => onChange("business_name", e.target.value)}
            placeholder="e.g. Harbourview Legal Advisory Pty Ltd"
          />
        </FieldWrapper>

        <FieldWrapper
          label="ABN"
          htmlFor="abn"
          error={errors.abn}
          hint="11 digits, no external verification is performed."
        >
          <input
            id="abn"
            className={inputClass}
            value={values.abn}
            onChange={(e) => onChange("abn", e.target.value)}
            placeholder="51 824 753 556"
            inputMode="numeric"
          />
        </FieldWrapper>

        <FieldWrapper label="Industry" htmlFor="industry" error={errors.industry}>
          <select
            id="industry"
            className={inputClass}
            value={values.industry}
            onChange={(e) => onChange("industry", e.target.value)}
          >
            <option value="" disabled>
              Select an industry
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </FieldWrapper>

        <FieldWrapper
          label="Years in operation"
          htmlFor="years_in_operation"
          error={errors.years_in_operation}
        >
          <input
            id="years_in_operation"
            className={inputClass}
            type="number"
            min={0}
            step={0.5}
            value={values.years_in_operation}
            onChange={(e) => onChange("years_in_operation", e.target.value)}
            placeholder="e.g. 3.5"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Annual revenue (AUD)"
          htmlFor="annual_revenue_aud"
          error={errors.annual_revenue_aud}
        >
          <input
            id="annual_revenue_aud"
            className={inputClass}
            type="number"
            min={0}
            step={1000}
            value={values.annual_revenue_aud}
            onChange={(e) => onChange("annual_revenue_aud", e.target.value)}
            placeholder="e.g. 850000"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Existing annualised debt obligations (AUD)"
          htmlFor="existing_debt_aud"
          error={errors.existing_debt_aud}
        >
          <input
            id="existing_debt_aud"
            className={inputClass}
            type="number"
            min={0}
            step={1000}
            value={values.existing_debt_aud}
            onChange={(e) => onChange("existing_debt_aud", e.target.value)}
            placeholder="e.g. 120000"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Loan amount requested (AUD)"
          htmlFor="loan_amount_aud"
          error={errors.loan_amount_aud}
          hint={`Capped at $${MAX_LOAN_AMOUNT_AUD.toLocaleString("en-AU")}.`}
        >
          <input
            id="loan_amount_aud"
            className={inputClass}
            type="number"
            min={0}
            max={MAX_LOAN_AMOUNT_AUD}
            step={1000}
            value={values.loan_amount_aud}
            onChange={(e) => onChange("loan_amount_aud", e.target.value)}
            placeholder="e.g. 150000"
          />
        </FieldWrapper>

        <FieldWrapper label="Loan purpose" htmlFor="loan_purpose" error={errors.loan_purpose}>
          <select
            id="loan_purpose"
            className={inputClass}
            value={values.loan_purpose}
            onChange={(e) => onChange("loan_purpose", e.target.value)}
          >
            <option value="" disabled>
              Select a purpose
            </option>
            {LOAN_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </FieldWrapper>

        <FieldWrapper
          label="Relationship manager name"
          htmlFor="rm_name"
          error={errors.rm_name}
        >
          <input
            id="rm_name"
            className={inputClass}
            value={values.rm_name}
            onChange={(e) => onChange("rm_name", e.target.value)}
            placeholder="e.g. Sarah Chen"
          />
        </FieldWrapper>

        <div className="sm:col-span-2">
          <FieldWrapper
            label="Purpose detail (optional)"
            htmlFor="purpose_detail"
            error={errors.purpose_detail}
          >
            <textarea
              id="purpose_detail"
              className={inputClass}
              rows={2}
              value={values.purpose_detail}
              onChange={(e) => onChange("purpose_detail", e.target.value)}
              placeholder="Any additional context on what the funds are for."
            />
          </FieldWrapper>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
