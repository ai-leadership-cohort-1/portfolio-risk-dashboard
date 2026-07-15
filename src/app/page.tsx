"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UploadPanel } from "@/components/UploadPanel";
import { useAnalysis } from "@/context/AnalysisContext";
import { parseCsv } from "@/lib/csvParser";
import { parsePdf } from "@/lib/pdfParser";
import {
  DEFAULT_WEIGHTS,
  RISK_THRESHOLDS,
  CREDIT_SCORE_MIN,
  CREDIT_SCORE_MAX,
  EXPOSURE_CAP,
  scoreCustomers,
} from "@/lib/riskScoring";

export default function UploadPage() {
  const router = useRouter();
  const { setResult } = useAnalysis();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isSampleSelected, setIsSampleSelected] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePdfChange(file: File | null) {
    setPdfFile(file);
    setIsSampleSelected(false);
  }

  function handleCsvChange(file: File | null) {
    setCsvFile(file);
    setIsSampleSelected(false);
  }

  async function handleLoadSampleData() {
    setIsLoadingSample(true);
    setError(null);
    try {
      const [csvRes, pdfRes] = await Promise.all([
        fetch("/sample-data/sample-customers.csv"),
        fetch("/sample-data/sample-lending-policy.pdf"),
      ]);
      const csvBlob = await csvRes.blob();
      const pdfBlob = await pdfRes.blob();

      const csvSampleFile = new File([csvBlob], "sample-customers.csv", { type: "text/csv" });
      const pdfSampleFile = new File([pdfBlob], "sample-lending-policy.pdf", {
        type: "application/pdf",
      });

      setCsvFile(csvSampleFile);
      setPdfFile(pdfSampleFile);
      setIsSampleSelected(true);
    } catch {
      setError("Could not load sample data. Please try again or upload files manually.");
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
      const { customers: rawCustomers, rowsSkipped } = parseCsv(csvText);
      void rowsSkipped;

      const scored = scoreCustomers(rawCustomers, DEFAULT_WEIGHTS);

      let rules: { text: string }[] = [];
      let pdfPageCount: number | null = null;
      let pdfParseFailed = false;
      let pdfParseError: string | undefined;

      if (pdfFile) {
        try {
          const pdfResult = await parsePdf(pdfFile);
          rules = pdfResult.rules;
          pdfPageCount = pdfResult.pageCount;
        } catch (e) {
          pdfParseFailed = true;
          pdfParseError = e instanceof Error ? e.message : "Unknown PDF parsing error";
        }
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
        pdfParseFailed,
        pdfParseError,
      });

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while analysing the files.");
    } finally {
      setIsAnalysing(false);
    }
  }

  const creditWeightPct = Math.round(DEFAULT_WEIGHTS.creditRiskWeight * 100);
  const repaymentWeightPct = Math.round(DEFAULT_WEIGHTS.repaymentRiskWeight * 100);
  const exposureWeightPct = Math.round(DEFAULT_WEIGHTS.exposureWeight * 100);

  return (
    <div>
      <h1 className="text-3xl font-semibold">Portfolio Risk Analysis</h1>
      <p className="text-[var(--muted)] mt-2 max-w-2xl">
        Upload your lending policy document and customer portfolio to generate an executive risk
        dashboard. All processing happens in your browser — no files are sent to a server.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        <UploadPanel
          step="1"
          title="Lending Policy & Risk Guidance (PDF)"
          subtext="Used to surface key policy rules and thresholds referenced on the dashboard. Optional, but recommended."
          accept="application/pdf"
          fileName={pdfFile ? pdfFile.name : null}
          onChange={handlePdfChange}
        />
        <UploadPanel
          step="2"
          title="Customer Portfolio (CSV)"
          subtext="Expected columns: CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance. Column names are matched flexibly."
          accept=".csv,text/csv"
          fileName={csvFile ? csvFile.name : null}
          onChange={handleCsvChange}
          required
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-[var(--risk-red)] bg-[var(--risk-red-bg)] text-[var(--risk-red)] text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleRunAnalysis}
          disabled={!csvFile || isAnalysing}
          className="bg-[var(--accent)] text-white text-sm font-medium px-5 py-2.5 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          {isAnalysing ? "Analysing…" : "Run Analysis"}
        </button>
        <button
          onClick={handleLoadSampleData}
          disabled={isLoadingSample}
          className="border border-[var(--border)] text-sm font-medium px-5 py-2.5 rounded-md hover:bg-[var(--surface)] disabled:opacity-40"
        >
          {isLoadingSample ? "Loading…" : "Load Sample Data"}
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm max-w-2xl">
        <h3 className="text-sm font-semibold mb-2">How risk is scored</h3>
        <p className="text-sm text-[var(--muted)] mb-3">
          Risk Score = ({creditWeightPct}% × Credit Score Factor) + ({repaymentWeightPct}% ×
          Repayment Status Factor) + ({exposureWeightPct}% × Loan Balance Factor)
        </p>
        <p className="text-sm text-[var(--muted)] mb-1">
          Credit score band: {CREDIT_SCORE_MIN}–{CREDIT_SCORE_MAX}. Exposure cap: $
          {EXPOSURE_CAP.toLocaleString()}.
        </p>
        <p className="text-sm text-[var(--muted)] mb-3">
          Categories: Green 0–{RISK_THRESHOLDS.greenMax}, Amber {RISK_THRESHOLDS.greenMax + 1}–
          {RISK_THRESHOLDS.amberMax}, Red {RISK_THRESHOLDS.amberMax + 1}–100.
        </p>
        <p className="text-xs text-[var(--muted)]">
          Edit <code className="bg-[var(--background)] px-1.5 py-0.5 rounded">src/lib/riskScoring.ts</code>{" "}
          to change these weights and thresholds.
        </p>
      </div>
    </div>
  );
}
