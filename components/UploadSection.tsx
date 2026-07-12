"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "./AppDataProvider";
import { extractPolicyFromPdf } from "@/lib/pdfRules";
import { parsePortfolioCsv, CSV_TEMPLATE } from "@/lib/csv";

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "portfolio-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function UploadSection() {
  const { policy, portfolio, setPolicy, setPortfolio, loadSampleData, hasData } = useAppData();
  const router = useRouter();

  const [pdfError, setPdfError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [csvBusy, setCsvBusy] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  async function handlePdf(file: File) {
    setPdfError(null);
    setPdfBusy(true);
    try {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        throw new Error("Please upload a .pdf file.");
      }
      const doc = await extractPolicyFromPdf(file);
      setPolicy(doc);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Could not read this PDF.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleCsv(file: File) {
    setCsvError(null);
    setCsvBusy(true);
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Please upload a .csv file.");
      }
      const text = await file.text();
      const dataset = parsePortfolioCsv(text, file.name);
      if (dataset.customers.length === 0) {
        throw new Error(
          "No valid customer rows found. Check that your CSV has credit_score, repayment_status and loan_balance columns."
        );
      }
      setPortfolio(dataset);
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "Could not read this CSV.");
    } finally {
      setCsvBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Portfolio Risk Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          Upload a lending policy PDF and a customer portfolio CSV to generate a
          risk-scored executive dashboard and board-ready summary. Everything runs
          in your browser — no file is uploaded to a server, and nothing is
          persisted after you close this tab.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* PDF upload */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                1. Lending policy (PDF)
              </h2>
              <p className="mt-1 text-xs text-muted">
                Optional context — key risk rules are extracted and shown
                alongside the dashboard. Scoring itself only needs the CSV.
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handlePdf(file);
            }}
          >
            <p className="text-xs text-muted">Drag a PDF here, or</p>
            <button
              onClick={() => pdfInputRef.current?.click()}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
              disabled={pdfBusy}
            >
              {pdfBusy ? "Reading…" : "Choose file"}
            </button>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdf(file);
                e.target.value = "";
              }}
            />
          </div>

          {pdfError && <p className="mt-2 text-xs text-red">{pdfError}</p>}
          {policy && (
            <p className="mt-3 text-xs text-green">
              Loaded &ldquo;{policy.fileName}&rdquo; — {policy.pageCount} page
              {policy.pageCount === 1 ? "" : "s"}, {policy.rules.length} rule
              {policy.rules.length === 1 ? "" : "s"} extracted.
            </p>
          )}
        </div>

        {/* CSV upload */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                2. Customer portfolio (CSV)
              </h2>
              <p className="mt-1 text-xs text-muted">
                Required. Columns: customer_id, customer_name, industry_sector,
                credit_score, repayment_status, loan_balance.
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleCsv(file);
            }}
          >
            <p className="text-xs text-muted">Drag a CSV here, or</p>
            <button
              onClick={() => csvInputRef.current?.click()}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background"
              disabled={csvBusy}
            >
              {csvBusy ? "Reading…" : "Choose file"}
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept="text/csv,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCsv(file);
                e.target.value = "";
              }}
            />
          </div>

          {csvError && <p className="mt-2 text-xs text-red">{csvError}</p>}
          {portfolio && (
            <p className="mt-3 text-xs text-green">
              Loaded &ldquo;{portfolio.fileName}&rdquo; — {portfolio.customers.length}{" "}
              customer{portfolio.customers.length === 1 ? "" : "s"} parsed
              {portfolio.skippedRows > 0 && `, ${portfolio.skippedRows} row(s) skipped`}.
            </p>
          )}
          <button
            onClick={downloadTemplate}
            className="mt-2 text-xs font-medium text-accent underline underline-offset-2 hover:opacity-80"
          >
            Download CSV template
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-xs text-muted">
          Don&rsquo;t have files handy? Load a realistic 40-customer sample
          portfolio and sample policy to explore the dashboard.
        </p>
        <button
          onClick={loadSampleData}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90"
        >
          Load sample data
        </button>
      </div>

      {hasData && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            View executive dashboard →
          </button>
          <button
            onClick={() => router.push("/summary")}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-background"
          >
            View executive summary →
          </button>
        </div>
      )}
    </div>
  );
}
