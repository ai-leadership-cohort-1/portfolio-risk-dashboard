import { RiskCategory } from "@/lib/types";

const STYLES: Record<RiskCategory, { bg: string; text: string; dot: string }> = {
  Green: { bg: "bg-green/10", text: "text-green", dot: "bg-green" },
  Amber: { bg: "bg-amber/10", text: "text-amber", dot: "bg-amber" },
  Red: { bg: "bg-red/10", text: "text-red", dot: "bg-red" },
};

export default function RiskBadge({
  category,
  score,
}: {
  category: RiskCategory;
  score?: number;
}) {
  const s = STYLES[category];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {category}
      {score !== undefined && <span className="font-normal opacity-80">· {score.toFixed(0)}</span>}
    </span>
  );
}
