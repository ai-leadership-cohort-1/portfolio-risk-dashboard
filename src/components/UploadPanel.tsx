"use client";

interface UploadPanelProps {
  pdfFileName: string | null;
  csvFileName: string | null;
  onPdfSelected: (file: File | null) => void;
  onCsvSelected: (file: File | null) => void;
}

export default function UploadPanel({ pdfFileName, csvFileName, onPdfSelected, onCsvSelected }: UploadPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--foreground)]">1. Lending Policy &amp; Risk Guidance (PDF)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Used to surface key policy rules and thresholds referenced on the dashboard. Optional, but recommended.
        </p>
        <input
          type="file"
          accept="application/pdf"
          className="mt-4 block w-full text-sm text-[var(--foreground)]"
          onChange={(e) => onPdfSelected(e.target.files?.[0] ?? null)}
        />
        {pdfFileName && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Selected: <span className="font-semibold text-[var(--foreground)]">{pdfFileName}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--foreground)]">2. Customer Portfolio (CSV)</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Expected columns: CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance. Column
          names are matched flexibly.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-4 block w-full text-sm text-[var(--foreground)]"
          onChange={(e) => onCsvSelected(e.target.files?.[0] ?? null)}
        />
        {csvFileName && (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Selected: <span className="font-semibold text-[var(--foreground)]">{csvFileName}</span>
          </p>
        )}
      </div>
    </div>
  );
}
