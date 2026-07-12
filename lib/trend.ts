import { ScoredCustomer } from "./types";

export interface TrendPoint {
  label: string;
  avgRiskScore: number;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * This prototype only ever sees a single portfolio snapshot (one CSV
 * upload), so there is no real historical time series to chart. Rather than
 * omit the "portfolio risk trend" requirement, we generate a deterministic,
 * clearly-labelled illustrative trend that walks toward the current
 * portfolio's actual average risk score. In production this should be
 * replaced with real month-over-month snapshots.
 */
export function buildIllustrativeTrend(scored: ScoredCustomer[]): TrendPoint[] {
  const currentAvg =
    scored.length === 0
      ? 0
      : scored.reduce((sum, c) => sum + c.riskScore, 0) / scored.length;

  const rnd = mulberry32(Math.round(currentAvg * 1000) + scored.length);
  const months = ["6 mo ago", "5 mo ago", "4 mo ago", "3 mo ago", "2 mo ago", "1 mo ago", "Current"];

  // Walk backwards from the current average so the series ends exactly on
  // the real, current figure.
  const points: number[] = [currentAvg];
  let value = currentAvg;
  for (let i = 1; i < months.length; i++) {
    const drift = (rnd() - 0.55) * 6; // slight long-run upward drift into "current"
    value = Math.max(0, Math.min(100, value + drift));
    points.push(value);
  }
  points.reverse();

  return months.map((label, i) => ({
    label,
    avgRiskScore: Math.round(points[i] * 10) / 10,
  }));
}
