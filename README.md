# Portfolio Risk Dashboard (Prototype)

An internal prototype that turns a lending policy document and a customer
portfolio export into a risk-scored executive dashboard and a board-ready
summary — entirely in the browser, with no backend, database, or external
API calls.

> Prototype for internal portfolio pre-screening only. Not a credit
> decision. Full assessment required by the credit committee.

## What it does

1. **Upload** a lending policy PDF (optional) and a customer portfolio CSV
   (required) on the home page — or click **Load sample data** to explore
   the app with a realistic 40-customer sample portfolio.
2. The policy PDF is parsed client-side (pdf.js) and scanned for
   lending/risk-relevant sentences (credit score, LVR, arrears, exposure
   limits, industry concentration, etc.), shown as **Extracted Policy
   Highlights**.
3. Every customer row in the CSV is run through a transparent risk-scoring
   formula (below) and classified **Green / Amber / Red**.
4. The **Executive Dashboard** (`/dashboard`) shows customer counts and
   exposure by risk category, exposure by industry sector, the top 10
   highest-risk customers, an illustrative portfolio risk trend, and a list
   of recommended actions.
5. The **Executive Summary** (`/summary`) is a print-friendly, board/ExCo
   briefing: key findings, largest risk concentrations, estimated exposure,
   recommended actions, and an overall portfolio health rating.

All uploaded data and computed results live only in browser memory for the
current session — nothing is persisted to disk, a database, or a server,
and no file ever leaves the browser.

## Risk scoring methodology

```
Risk Score = (Credit Risk Weight × Credit Score Factor)
           + (Repayment Risk Weight × Repayment Status Factor)
           + (Exposure Weight × Loan Balance Factor)
```

Each factor is normalised to 0–100 before weighting, so the final Risk
Score is always 0–100:

- **Credit Score Factor** — inverse of the customer's credit score (0–1000
  Australian bureau scale; higher score = lower risk).
- **Repayment Status Factor** — a fixed risk-point value per repayment
  status (current, 30/60/90+ days in arrears, default).
- **Loan Balance Factor** — the loan balance scaled against a configurable
  "high exposure" cap.

Default weights are Credit 0.4 / Repayment 0.4 / Exposure 0.2. Category
thresholds: **Green** < 35, **Amber** 35–65, **Red** ≥ 65.

**To change the scoring weights, factor calculations, or category
thresholds, edit `lib/scoring.ts`** — every tunable constant is declared
and documented at the top of that file. No other file needs to change.

## Portfolio CSV format

Required columns (flexible header naming — see `lib/csv.ts` for accepted
aliases): `customer_id`, `customer_name`, `industry_sector`,
`credit_score`, `repayment_status`, `loan_balance`. Optional: `state`,
`loan_type`. A template is available via the **Download CSV template**
button on the upload page.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. `npm run build` produces a production
build; `npm run lint` runs ESLint.

## Deploying to Vercel

1. Push this repository to GitHub (already done for this prototype — see
   commit history).
2. In Vercel: **Import Project** → select the GitHub repo → accept the
   defaults (Next.js is auto-detected; no environment variables are
   required, since the app has no backend).
3. Every push to `main` redeploys automatically.

## Tech stack

Next.js (App Router, TypeScript), React, Tailwind CSS, Recharts (charts),
pdf.js (client-side PDF text extraction), PapaParse (CSV parsing). All
logic runs client-side — no backend, database, external APIs, or
authentication.

## Out of scope (by design)

- No real customer data, no authentication, nothing persisted to storage.
- The "portfolio risk trend" chart is illustrative: this prototype only
  ever sees a single CSV snapshot, so the trailing months are a
  deterministic synthetic walk toward the real current average score.
  Replace with genuine historical snapshots for production use.
- Policy rule extraction is a lightweight keyword heuristic, not NLP/LLM
  based — always confirm extracted highlights against the source PDF.
- Not a substitute for full Credit Committee assessment or a real risk
  engine; scoring weights/thresholds are illustrative starting points.
