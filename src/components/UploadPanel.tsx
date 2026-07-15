"use client";

import { ChangeEvent } from "react";

interface UploadPanelProps {
  step: string;
  title: string;
  subtext: string;
  accept: string;
  fileName: string | null;
  onChange: (file: File | null) => void;
  required?: boolean;
}

export function UploadPanel({
  step,
  title,
  subtext,
  accept,
  fileName,
  onChange,
  required,
}: UploadPanelProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    onChange(file);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h3 className="text-sm font-semibold">
        {step}. {title}
        {required && <span className="text-[var(--risk-red)]"> *</span>}
      </h3>
      <p className="text-xs text-[var(--muted)] mt-1 mb-3">{subtext}</p>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="block w-full text-sm text-[var(--foreground)] file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#171a1f] file:text-white hover:file:opacity-90 cursor-pointer"
      />
      {fileName && (
        <p className="text-xs text-[var(--muted)] mt-2">
          Selected: <span className="font-bold text-[var(--foreground)]">{fileName}</span>
        </p>
      )}
    </div>
  );
}
