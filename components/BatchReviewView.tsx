"use client";

import { useRef, useState } from "react";
import { downloadTextFile, generateCsvTemplate, parseAssessmentCsv } from "@/lib/csv";
import { validateAssessmentRecord } from "@/lib/validation";
import { computeScore } from "@/lib/scoring";
import { generateAssessmentId, formatTimestamp } from "@/lib/id";
import ResultTile, { BatchRow } from "@/components/ResultTile";

export default function BatchReviewView() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDownloadTemplate() {
    downloadTextFile("loan-prescreening-template.csv", generateCsvTemplate());
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseAssessmentCsv(text);
      if (parsed.headerError) {
        setFileError(parsed.headerError);
        setRows([]);
        return;
      }
      setFileError(null);
      const nextRows: BatchRow[] = parsed.records.map((raw, index) => {
        const outcome = validateAssessmentRecord(raw);
        if (!outcome.input) {
          return { index, raw, fieldErrors: outcome.fieldErrors, input: null, result: null, meta: null };
        }
        const result = computeScore(outcome.input);
        const meta = { assessmentId: generateAssessmentId(), timestamp: formatTimestamp(new Date()) };
        return { index, raw, fieldErrors: {}, input: outcome.input, result, meta };
      });
      setRows(nextRows);
    };
    reader.readAsText(file);
    // Allow re-selecting the same file name to re-trigger onChange.
    e.target.value = "";
  }

  const validCount = rows.filter((r) => r.input).length;
  const errorCount = rows.length - validCount;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="print:hidden mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Batch Review</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Download the CSV template, fill it in (or use the sample rows as-is),
          then upload it to pre-screen many applications at once.
        </p>
      </div>

      <div className="print:hidden flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-border/40"
          >
            Download CSV template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:opacity-90"
          >
            Upload CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        {fileName && (
          <p className="text-xs text-muted">
            Loaded <span className="font-medium text-foreground">{fileName}</span>
            {rows.length > 0 && ` — ${validCount} valid, ${errorCount} with errors`}
          </p>
        )}
      </div>

      {fileError && (
        <div className="print:hidden mt-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {fileError}
        </div>
      )}

      {rows.length === 0 && !fileError && (
        <p className="print:hidden mt-6 text-sm text-muted">
          No file uploaded yet. Results will appear here as individual tiles
          once you upload a CSV.
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <ResultTile key={row.index} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
