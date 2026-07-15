"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import { useAnalysis } from "@/context/AnalysisContext";
import { parseCustomerCsv } from "@/lib/csvParser";
import { parsePolicyPdf } from "@/lib/pdfParser";
import {
  DEFAULT_WEIGHTS,
  RISK_THRESHOLDS,
} from "@/lib/riskScoring";
import { scoreCustomers } from "@/lib/riskScoring";

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
      const [csvResp, pdfResp] = await Promise.all([
        fetch("/sample-data/sample-customers.csv"),
        fetch("/sample-data/sample-lending-policy.pdf"),
      ]);
      const csvBlob = await csvResp.blob();
      const pdfBlob = await pdfResp.blob();
      const sampleCsvFile = new File([csvBlob], "sample-customers.csv", { type: "text/csv" });
      const samplePdfFile = new File([pdfBlob], "sample-lending-policy.pdf", {
        type: "application/pdf",
      });
      setCsvFile(sampleCsvFile);
      setPdfFile(samplePdfFile);
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
      const scored = scoreCustomers(rawCustomers, DEFAULT_WEIGHTS);

      let rules: { text: string }[] = [];
      let pdfPageCount: number | null = null;
      let pdfParseFailed = false;
      let pdfParseErrorMessage: string | undefined;

      if (pdfFile) {
        try {
          const pdfResult = await parsePolicyPdf(pdfFile);
          rules = pdfResult.rules;
          pdfPageCount = pdfResult.pageCount;
        } catch (err) {
          pdfParseFailed = true;
          pdfParseErrorMessage =
            err instanceof Error ? err.message : "Unknown error extracting text from PDF.";
        }
      }

      if (rowsSkipped > 0) {
        console.warn(`${rowsSkipped} row(s) skipped due to missing/unparseable data.`);
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
        pdfParseErrorMessage,
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong analysing the files.");
    } finally {
      setIsAnalysing(false);
    }
  }

  const creditPct = Math.round(DEFAULT_WEIGHTS.creditRiskWeight * 100);
  const repaymentPct = Math.round(DEFAULT_WEIGHTS.repaymentRiskWeight * 100);
  const exposurePct = Math.round(DEFAULT_WEIGHTS.exposureWeight * 100);

  return (
    <div>
      <h1 className="text-3xl font-semibold text-[var(--foreground)]">Portfolio Risk Analysis</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Upload your lending policy document and customer portfolio to generate an executive risk
        dashboard. All processing happens in your browser — no files are sent to a server.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <UploadPanel
          title="1. Lending Policy & Risk Guidance (PDF)"
          description="Used to surface key policy rules and thresholds referenced on the dashboard. Optional, but recommended."
          accept="application/pdf"
          fileName={pdfFile?.name ?? null}
          onFileSelected={handlePdfChange}
          optionalLabel="Optional"
        />
        <UploadPanel
          title="2. Customer Portfolio (CSV)"
          description="Expected columns: CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance. Column names are matched flexibly."
          accept=".csv,text/csv"
          fileName={csvFile?.name ?? null}
          onFileSelected={handleCsvChange}
          optionalLabel="Required"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-[var(--risk-red)] bg-[var(--risk-red-bg)] p-3 text-sm text-[var(--risk-red)]">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={handleRunAnalysis}
          disabled={!csvFile || isAnalysing}
          className="rounded-md bg-[var(--button)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAnalysing ? "Analysing…" : "Run Analysis"}
        </button>
        <button
          onClick={handleLoadSampleData}
          disabled={isLoadingSample}
          className="rounded-md border border-[var(--button)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--button)] transition-colors hover:bg-[var(--risk-green-bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoadingSample ? "Loading…" : "Load Sample Data"}
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">How risk is scored</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight ×
          Repayment Status Factor) + (Exposure Weight × Loan Balance Factor)
        </p>
        <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
          <li>Credit Risk Weight: {creditPct}%</li>
          <li>Repayment Risk Weight: {repaymentPct}%</li>
          <li>Exposure Weight: {exposurePct}%</li>
          <li>
            Category thresholds: Green 0–{RISK_THRESHOLDS.greenMax}, Amber{" "}
            {RISK_THRESHOLDS.greenMax + 1}–{RISK_THRESHOLDS.amberMax}, Red{" "}
            {RISK_THRESHOLDS.amberMax + 1}–100
          </li>
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Edit <code className="rounded bg-[var(--background)] px-1.5 py-0.5">src/lib/riskScoring.ts</code>{" "}
          to change these weights or thresholds.
        </p>
      </div>
    </div>
  );
}
