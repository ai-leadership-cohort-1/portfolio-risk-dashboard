"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/context/AnalysisContext";
import { parseCustomerCsv } from "@/lib/csvParser";
import { parseLendingPolicyPdf } from "@/lib/pdfParser";
import { scoreCustomers, DEFAULT_WEIGHTS, RISK_THRESHOLDS } from "@/lib/riskScoring";

export default function UploadPanel() {
  const router = useRouter();
  const { setResult } = useAnalysis();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSampleSelected, setIsSampleSelected] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLoadSampleData() {
    setIsLoadingSample(true);
    setError(null);
    try {
      const [csvResp, pdfResp] = await Promise.all([
        fetch("/sample-data/sample-customers.csv"),
        fetch("/sample-data/sample-lending-policy.pdf"),
      ]);
      const csvBlob = await csvResp.blob();
      const pdfBlob = await pdfResp.blob();

      setCsvFile(new File([csvBlob], "sample-customers.csv", { type: "text/csv" }));
      setPdfFile(new File([pdfBlob], "sample-lending-policy.pdf", { type: "application/pdf" }));
      setIsSampleSelected(true);
    } catch {
      setError("Could not load sample data. Please try again.");
    } finally {
      setIsLoadingSample(false);
    }
  }

  async function handleRunAnalysis() {
    if (!csvFile) return;
    setIsAnalysing(true);
    setError(null);
    try {
      const csvText = await csvFile.text();
      const { customers: rawCustomers, rowsSkipped } = parseCustomerCsv(csvText);

      if (rawCustomers.length === 0) {
        throw new Error("No valid customer rows were found in the CSV after validation.");
      }

      const scored = scoreCustomers(rawCustomers, DEFAULT_WEIGHTS);

      let rules: { text: string }[] = [];
      let pdfPageCount: number | null = null;
      if (pdfFile) {
        const pdfResult = await parseLendingPolicyPdf(pdfFile);
        rules = pdfResult.rules;
        pdfPageCount = pdfResult.pageCount;
      }

      if (rowsSkipped > 0) {
        console.warn(`${rowsSkipped} row(s) were skipped due to missing/unparseable required fields.`);
      }

      setResult({
        customers: scored,
        rules,
        weights: DEFAULT_WEIGHTS,
        csvFileName: csvFile.name,
        pdfFileName: pdfFile ? pdfFile.name : null,
        pdfPageCount,
        analysedAt: new Date(),
        isSampleData: isSampleSelected,
      });

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while analysing the files.");
    } finally {
      setIsAnalysing(false);
    }
  }

  const fileButtonClass =
    "file:mr-4 file:rounded-md file:border-0 file:bg-[#171a1f] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:opacity-90 text-sm text-[var(--muted)]";

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            1. Lending Policy &amp; Risk Guidance (PDF)
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Used to surface key policy rules and thresholds referenced on the dashboard.
            Optional, but recommended.
          </p>
          <input
            type="file"
            accept="application/pdf"
            className={`mt-4 block w-full ${fileButtonClass}`}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setPdfFile(f);
              setIsSampleSelected(false);
            }}
          />
          {pdfFile && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Selected: <span className="font-semibold text-[var(--foreground)]">{pdfFile.name}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            2. Customer Portfolio (CSV)
          </h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Expected columns: CustomerID, CustomerName, Industry, CreditScore,
            RepaymentStatus, LoanBalance. Column names are matched flexibly.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            className={`mt-4 block w-full ${fileButtonClass}`}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setCsvFile(f);
              setIsSampleSelected(false);
            }}
          />
          {csvFile && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Selected: <span className="font-semibold text-[var(--foreground)]">{csvFile.name}</span>
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-[var(--risk-red)] bg-[var(--risk-red-bg)] px-4 py-2 text-sm text-[var(--risk-red)]">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={handleRunAnalysis}
          disabled={!csvFile || isAnalysing}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAnalysing ? "Analysing…" : "Run Analysis"}
        </button>
        <button
          onClick={handleLoadSampleData}
          disabled={isLoadingSample}
          className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoadingSample ? "Loading…" : "Load Sample Data"}
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">How risk is scored</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Risk Score = ({DEFAULT_WEIGHTS.creditRiskWeight * 100}% × Credit Score Factor) + (
          {DEFAULT_WEIGHTS.repaymentRiskWeight * 100}% × Repayment Status Factor) + (
          {DEFAULT_WEIGHTS.exposureWeight * 100}% × Exposure Factor)
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Categories: Green 0–{RISK_THRESHOLDS.greenMax}, Amber {RISK_THRESHOLDS.greenMax + 1}–
          {RISK_THRESHOLDS.amberMax}, Red {RISK_THRESHOLDS.amberMax + 1}–100.
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Edit <code className="rounded bg-[var(--background)] px-1 py-0.5">src/lib/riskScoring.ts</code> to
          change weights or thresholds.
        </p>
      </div>
    </div>
  );
}
