import { TrafficLight as TrafficLightValue } from "@/lib/types";

const BAND_STYLES: Record<
  TrafficLightValue,
  { bg: string; text: string; caption: string }
> = {
  Green: {
    bg: "bg-emerald-600",
    text: "text-white",
    caption: "Low risk across the factors assessed",
  },
  Amber: {
    bg: "bg-amber-500",
    text: "text-black",
    caption: "Mixed risk — review before proceeding",
  },
  Red: {
    bg: "bg-red-600",
    text: "text-white",
    caption: "Higher risk — not recommended to proceed as-is",
  },
};

export default function TrafficLight({ overall }: { overall: TrafficLightValue }) {
  const style = BAND_STYLES[overall];
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        className={`flex h-28 w-28 items-center justify-center rounded-full ${style.bg} ${style.text} shadow-sm`}
      >
        <span className="text-xl font-bold tracking-wide">{overall.toUpperCase()}</span>
      </div>
      <p className="max-w-[10rem] text-xs text-muted">{style.caption}</p>
    </div>
  );
}
