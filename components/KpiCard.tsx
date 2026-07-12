const ACCENT_CLASS: Record<string, string> = {
  green: "text-green",
  amber: "text-amber",
  red: "text-red",
  default: "text-foreground",
};

export default function KpiCard({
  label,
  value,
  sublabel,
  accent,
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "green" | "amber" | "red";
}) {
  const accentClass = ACCENT_CLASS[accent ?? "default"];
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight ${accentClass}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-muted">{sublabel}</p>}
    </div>
  );
}
