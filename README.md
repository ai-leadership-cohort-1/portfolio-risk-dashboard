# Portfolio Risk Dashboard

A client-side prototype that turns a lending policy PDF and a customer
portfolio CSV into an executive risk dashboard: risk-scored customers,
Green/Amber/Red categorisation, exposure by category and industry, a
portfolio risk trend, a top-10 highest-risk table, and AI-style recommended
actions.

All processing happens in the browser. There is no backend, no database, no
authentication, and no data is ever sent to a server — this is a prototype
for internal review only, and no real customer data should be used with it.

## What it does

1. **Upload** — upload a lending policy PDF (optional) and a customer
   portfolio CSV (required), or click **Load Sample Data** to use the
   bundled sample files.
2. **Analyse** — the CSV is parsed client-side (flexible column matching),
   each customer is scored using the risk formula below, and the PDF (if
   provided) is scanned with keyword heuristics to surface policy rules.
3. **Dashboard** — an executive view shows category KPIs, total exposure,
   exposure by industry, a risk trend, the top 10 highest-risk customers,
   recommended actions, and the scoring methodology.

### Risk scoring

```
Risk Score = (Credit Risk Weight × Credit Score Factor)
           + (Repayment Risk Weight × Repayment Status Factor)
           + (Exposure Weight × Loan Balance Factor)
```

Default weights: Credit Risk 40%, Repayment Risk 40%, Exposure 20%.
Categories: Green 0–35, Amber 36–65, Red 66–100.

**To change the scoring weights or thresholds, edit `src/lib/riskScoring.ts`**
— it is the single file that controls scoring behaviour, with the rationale
for each constant documented inline.

## Running locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from
   the deployed repo).
2. In Vercel: **Import Project** → select this GitHub repository → accept
   the default Next.js settings → **Deploy**.
3. No environment variables are required — the app is fully client-side.

Vercel auto-deploys on every push to `main`.

## Tech stack

Next.js (App Router, TypeScript), React, Tailwind CSS, Recharts (charts),
PapaParse (CSV parsing), pdfjs-dist (client-side PDF text extraction).

## Out of scope (by design)

No backend, API routes, database, or server-side persistence. No
authentication. No `localStorage`/`sessionStorage`/cookies — analysis state
lives in memory only and is lost on a full page reload. No real customer
data anywhere in this repo. No third-party AI/LLM calls for PDF rule
extraction (keyword heuristics only).
