"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadPanel from "@/components/UploadPanel";
import { useAnalysis } from "@/context/AnalysisContext";
import { parseCustomerCsv } from "@/lib/csvParser";
import { parsePolicyPdf } from "@/lib/pdfParser";
import { scoreCustomers, DEFAULT_WEIGHTS, RISK_THRESHOLDS, CREDIT_SCORE_MIN, CREDIT_SCORE_MAX, EXPOSURE_CAP } from "@/lib/riskScoring";

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
      const csv = new File([csvBlob], "sample-customers.csv", { type: "text/csv" });
      const pdf = new File([pdfBlob], "sample-lending-policy.pdf", { type: "application/pdf" });
      setCsvFile(csv);
      setPdfFile(pdf);
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
        setError(
          `No valid customer rows found${rowsSkipped > 0 ? ` (${rowsSkipped} row(s) skipped)` : ""}. Please check your CSV file.`
        );
        setIsAnalysing(false);
        return;
      }

      const customers = scoreCustomers(rawCustomers, DEFAULT_WEIGHTS);

      let rules: { text: string }[] = [];
      let pdfPageCount: number | null = null;
      let pdfParseFailed = false;

      if (pdfFile) {
        try {
          const pdfResult = await parsePolicyPdf(pdfFile);
          rules = pdfResult.rules;
          pdfPageCount = pdfResult.pageCount;
        } catch {
          pdfParseFailed = true;
        }
      }

      setResult({
        customers,
        rules,
        weights: DEFAULT_WEIGHTS,
        csvFileName: csvFile.name,
        pdfFileName: pdfFile ? pdfFile.name : null,
        pdfPageCount,
        analysedAt: new Date(),
        isSampleData: isSampleSelected,
        pdfParseFailed,
      });

      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while analysing your files.");
    } finally {
      setIsAnalysing(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Portfolio Risk Analysis</h1>
      <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--muted)" }}>
        Upload your lending policy document and customer portfolio to generate an executive risk dashboard. All
        processing happens in your browser — no files are sent to a server.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <UploadPanel
          step="1"
          title="Lending Policy & Risk Guidance (PDF)"
          subtext="Used to surface key policy rules and thresholds referenced on the dashboard. Optional, but recommended."
          accept="application/pdf"
          required={false}
          fileName={pdfFile?.name ?? null}
          onFileSelected={handlePdfChange}
          inputId="pdf-upload"
        />
        <UploadPanel
          step="2"
          title="Customer Portfolio (CSV)"
          subtext="Expected columns: CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance. Column names are matched flexibly."
          accept=".csv,text/csv"
          required
          fileName={csvFile?.name ?? null}
          onFileSelected={handleCsvChange}
          inputId="csv-upload"
        />
      </div>

      {error && (
        <div
          className="mt-4 rounded-md border p-3 text-sm"
          style={{ borderColor: "var(--risk-red)", backgroundColor: "var(--risk-red-bg)", color: "var(--risk-red)" }}
        >
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={handleRunAnalysis}
          disabled={!csvFile || isAnalysing}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {isAnalysing ? "Analysing…" : "Run Analysis"}
        </button>
        <button
          onClick={handleLoadSampleData}
          disabled={isLoadingSample}
          className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {isLoadingSample ? "Loading…" : "Load Sample Data"}
        </button>
      </div>

      <div className="mt-8 rounded-xl border bg-[var(--surface)] p-5 shadow-sm" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold">How risk is scored</h3>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight × Repayment Status
          Factor) + (Exposure Weight × Loan Balance Factor)
        </p>
        <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--muted)" }}>
          <li>Credit Risk Weight: {Math.round(DEFAULT_WEIGHTS.creditRiskWeight * 100)}%</li>
          <li>Repayment Risk Weight: {Math.round(DEFAULT_WEIGHTS.repaymentRiskWeight * 100)}%</li>
          <li>Exposure Weight: {Math.round(DEFAULT_WEIGHTS.exposureWeight * 100)}%</li>
          <li>
            Credit Score Factor is based on a {CREDIT_SCORE_MIN}–{CREDIT_SCORE_MAX} band; Exposure Factor is capped
            at ${EXPOSURE_CAP.toLocaleString()}.
          </li>
          <li>
            Categories: Green 0–{RISK_THRESHOLDS.greenMax}, Amber {RISK_THRESHOLDS.greenMax + 1}–
            {RISK_THRESHOLDS.amberMax}, Red {RISK_THRESHOLDS.amberMax + 1}–100.
          </li>
        </ul>
        <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
          To change these weights or thresholds, edit <code>src/lib/riskScoring.ts</code>.
        </p>
      </div>
    </div>
  );
}
