import { RiskCategory } from "@/lib/types";

const STYLES: Record<RiskCategory, string> = {
  Green: "bg-[var(--risk-green-bg)] text-[var(--risk-green)]",
  Amber: "bg-[var(--risk-amber-bg)] text-[var(--risk-amber)]",
  Red: "bg-[var(--risk-red-bg)] text-[var(--risk-red)]",
};

const DOT_STYLES: Record<RiskCategory, string> = {
  Green: "bg-[var(--risk-green)]",
  Amber: "bg-[var(--risk-amber)]",
  Red: "bg-[var(--risk-red)]",
};

export function RiskBadge({ category }: { category: RiskCategory }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${STYLES[category]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_STYLES[category]}`} />
      {category}
    </span>
  );
}

export function RiskDot({ category }: { category: RiskCategory }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${DOT_STYLES[category]}`} />;
}
