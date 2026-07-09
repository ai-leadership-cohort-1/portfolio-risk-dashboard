"use client";

import { useState } from "react";
import { AssessmentInput, AssessmentMeta, RawAssessmentRecord, ScoringResult } from "@/lib/types";
import { FieldErrors } from "@/lib/validation";
import CreditSummary from "@/components/CreditSummary";
import CallNotesSection from "@/components/CallNotesSection";
import {
  BAND_BADGE_CLASSES,
  FACTOR_SHORT_LABEL,
  TRAFFIC_LIGHT_CHIP_CLASSES,
  TRAFFIC_LIGHT_LEFT_BORDER,
} from "@/components/bandStyles";

export interface BatchRow {
  index: number;
  raw: RawAssessmentRecord;
  fieldErrors: FieldErrors;
  input: AssessmentInput | null;
  result: ScoringResult | null;
  meta: AssessmentMeta | null;
}

export default function ResultTile({ row }: { row: BatchRow }) {
  const [expanded, setExpanded] = useState(false);

  if (!row.input || !row.result || !row.meta) {
    return (
      <div className="flex h-full flex-col gap-2 rounded-lg border border-border border-l-4 border-l-red-600 bg-surface p-5">
        <p className="text-sm font-semibold text-foreground">
          Row {row.index + 1}
          {row.raw.business_name ? `: ${row.raw.business_name}` : " (no business name)"}
        </p>
        <p className="text-xs font-medium text-red-700">Could not be scored — validation failed:</p>
        <ul className="list-disc space-y-0.5 pl-5 text-xs text-red-700">
          {Object.entries(row.fieldErrors).map(([field, message]) => (
            <li key={field}>
              <span className="font-medium">{field}:</span> {message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const { input, result } = row;

  return (
    <div
      className={`flex h-full flex-col gap-3 rounded-lg border border-border border-l-4 ${TRAFFIC_LIGHT_LEFT_BORDER[result.overall]} bg-surface p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{input.businessName}</p>
          <p className="text-xs text-muted">RM: {input.rmName}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${TRAFFIC_LIGHT_CHIP_CLASSES[result.overall]}`}
        >
          {result.overall.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {result.factors.map((f) => (
          <span
            key={f.key}
            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${BAND_BADGE_CLASSES[f.band]}`}
            title={f.interpretation}
          >
            {FACTOR_SHORT_LABEL[f.key]}: {f.band}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-1">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="print:hidden rounded text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {expanded ? "Hide full summary" : "View full summary"}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 border-t border-border pt-4">
          <CreditSummary input={input} result={result} meta={row.meta} />
          <CallNotesSection input={input} result={result} />
        </div>
      )}
    </div>
  );
}
