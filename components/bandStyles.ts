import { Band, TrafficLight } from "@/lib/types";

/** Shared visual styles for factor bands and traffic-light states, reused
 * across the full credit summary and the compact batch result tiles so the
 * two views stay visually consistent. */

export const BAND_BADGE_CLASSES: Record<Band, string> = {
  strong: "bg-emerald-100 text-emerald-800 border-emerald-300",
  moderate: "bg-amber-100 text-amber-800 border-amber-300",
  weak: "bg-red-100 text-red-800 border-red-300",
};

export const TRAFFIC_LIGHT_LEFT_BORDER: Record<TrafficLight, string> = {
  Green: "border-l-emerald-600",
  Amber: "border-l-amber-500",
  Red: "border-l-red-600",
};

export const TRAFFIC_LIGHT_CHIP_CLASSES: Record<TrafficLight, string> = {
  Green: "bg-emerald-600 text-white",
  Amber: "bg-amber-500 text-black",
  Red: "bg-red-600 text-white",
};

export const FACTOR_SHORT_LABEL: Record<string, string> = {
  leverage: "Leverage",
  coverage: "Coverage",
  vintage: "Vintage",
  industryRisk: "Industry",
  purposeRisk: "Purpose",
};
