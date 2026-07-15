"use client";

interface UploadPanelProps {
  title: string;
  description: string;
  accept: string;
  fileName: string | null;
  onFileSelected: (file: File | null) => void;
  optionalLabel: string;
}

export default function UploadPanel({
  title,
  description,
  accept,
  fileName,
  onFileSelected,
  optionalLabel,
}: UploadPanelProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        <span className="text-xs text-[var(--muted)]">{optionalLabel}</span>
      </div>
      <p className="mb-4 text-sm text-[var(--muted)]">{description}</p>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-[var(--foreground)]"
      />
      {fileName && (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Selected: <span className="font-semibold text-[var(--foreground)]">{fileName}</span>
        </p>
      )}
    </div>
  );
}
