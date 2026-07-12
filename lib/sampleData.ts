import { Customer, RepaymentStatus } from "./types";

// Deterministic PRNG (mulberry32) so the "Load sample data" demo is stable
// across reloads instead of reshuffling every time.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SECTORS = [
  { name: "Construction", weight: 6, riskTilt: 0.7 },
  { name: "Retail Trade", weight: 6, riskTilt: 0.4 },
  { name: "Hospitality", weight: 5, riskTilt: 0.65 },
  { name: "Professional Services", weight: 5, riskTilt: 0.15 },
  { name: "Manufacturing", weight: 4, riskTilt: 0.35 },
  { name: "Agriculture", weight: 4, riskTilt: 0.5 },
  { name: "Transport & Logistics", weight: 3, riskTilt: 0.45 },
  { name: "Health Care", weight: 3, riskTilt: 0.1 },
  { name: "Wholesale Trade", weight: 2, riskTilt: 0.3 },
  { name: "Accommodation & Food Services", weight: 2, riskTilt: 0.55 },
];

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const NAME_PREFIXES = [
  "Summit", "Harbour", "Ridgeline", "Coastal", "Ironbark", "Meridian", "Outback",
  "Bluegum", "Riverside", "Northgate", "Southern Cross", "Golden Acre", "Redwood",
  "Silverline", "Anchor", "Firstlight", "Everview", "Greenfield", "Cobalt", "Union",
  "Parkside", "Wattle", "Highland", "Sundown", "Fairway", "Truewest", "Kestrel",
  "Amber", "Vantage", "Cedar", "Marlin", "Basecamp", "Corsair", "Hillcrest",
  "Lantern", "Boldwood", "Pinnacle", "Estuary", "Windward", "Overland",
];

const NAME_SUFFIXES = [
  "Pty Ltd", "Group", "& Co", "Trading", "Holdings", "Services", "Co-op",
];

function pickWeighted<T extends { weight: number }>(items: T[], rnd: () => number): T {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rnd() * total;
  for (const item of items) {
    if (r < item.weight) return item;
    r -= item.weight;
  }
  return items[items.length - 1];
}

function repaymentStatusFor(riskTilt: number, rnd: () => number): RepaymentStatus {
  const r = rnd();
  const t = riskTilt; // 0 (low risk sector) - 1 (high risk sector)
  if (r < 0.72 - 0.3 * t) return "current";
  if (r < 0.86 - 0.15 * t) return "30_days";
  if (r < 0.94 - 0.05 * t) return "60_days";
  if (r < 0.98) return "90_plus_days";
  return "default";
}

export function generateSampleCustomers(count = 40): Customer[] {
  const rnd = mulberry32(42);
  const customers: Customer[] = [];

  for (let i = 0; i < count; i++) {
    const sector = pickWeighted(SECTORS, rnd);
    const status = repaymentStatusFor(sector.riskTilt, rnd);

    // Credit score correlates loosely with repayment status and sector risk tilt.
    const statusPenalty: Record<RepaymentStatus, number> = {
      current: 0,
      "30_days": 60,
      "60_days": 130,
      "90_plus_days": 220,
      default: 300,
    };
    const baseScore = 880 - sector.riskTilt * 180 - statusPenalty[status];
    const creditScore = Math.max(300, Math.min(980, Math.round(baseScore + (rnd() - 0.5) * 120)));

    // Loan balance: mostly modest small-business facilities with a long tail
    // of larger exposures (a handful of construction/agri names get big).
    const sizeRoll = rnd();
    let loanBalance: number;
    if (sizeRoll > 0.93) {
      loanBalance = Math.round((650_000 + rnd() * 700_000) / 1000) * 1000;
    } else if (sizeRoll > 0.7) {
      loanBalance = Math.round((250_000 + rnd() * 350_000) / 1000) * 1000;
    } else {
      loanBalance = Math.round((20_000 + rnd() * 200_000) / 1000) * 1000;
    }

    const prefix = NAME_PREFIXES[i % NAME_PREFIXES.length];
    const suffix = NAME_SUFFIXES[Math.floor(rnd() * NAME_SUFFIXES.length)];

    customers.push({
      id: `CUST-${String(i + 1).padStart(3, "0")}`,
      name: `${prefix} ${suffix}`,
      industrySector: sector.name,
      state: STATES[Math.floor(rnd() * STATES.length)],
      creditScore,
      repaymentStatus: status,
      loanBalance,
      loanType: rnd() > 0.5 ? "Term Loan" : "Overdraft",
    });
  }

  return customers;
}

export const SAMPLE_CUSTOMERS = generateSampleCustomers();
