import { RecommendedAction } from "@/lib/aggregate";

const PRIORITY_STYLE: Record<RecommendedAction["priority"], string> = {
  High: "bg-red/10 text-red",
  Medium: "bg-amber/10 text-amber",
  Low: "bg-green/10 text-green",
};

export default function RecommendedActionsList({ actions }: { actions: RecommendedAction[] }) {
  return (
    <ul className="space-y-3">
      {actions.map((action) => (
        <li key={action.id} className="flex items-start gap-3">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[action.priority]}`}
          >
            {action.priority}
          </span>
          <p className="text-sm text-foreground/90">{action.text}</p>
        </li>
      ))}
    </ul>
  );
}
