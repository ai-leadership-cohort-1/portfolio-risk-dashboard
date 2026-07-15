# Portfolio Risk Dashboard

A client-side prototype that turns a lending policy PDF and a customer portfolio CSV into an
executive risk dashboard and a Board-ready summary. Everything runs in the browser — there is no
backend, database, or authentication, and no file is ever uploaded to a server.

## What it does

1. **Upload** — attach a lending policy PDF (optional) and a customer portfolio CSV (required),
   or click **Load Sample Data** to try it with the bundled sample files.
2. **Analyse** — the app extracts candidate policy rules from the PDF using keyword heuristics
   (no AI/LLM calls), parses the CSV, and scores every customer.
3. **Executive Dashboard** (`/dashboard`) — risk category KPIs, total exposure, a category
   bar chart paired with an industry exposure pie chart, a portfolio risk trend line, a Top 10
   highest-risk customers table, recommended actions, and the scoring methodology.
4. **Board Summary** (`/board-summary`) — a Board/Executive Committee-ready page with key
   findings, largest risk concentrations, estimated total exposure, recommended actions, and an
   overall portfolio health assessment.

## Risk scoring

```
Risk Score = (Credit Risk Weight × Credit Score Factor)
           + (Repayment Risk Weight × Repayment Status Factor)
           + (Exposure Weight × Loan Balance Factor)
```

Default weights: Credit Risk 40%, Repayment Risk 40%, Exposure 20%. Category thresholds:
Green 0–35, Amber 36–65, Red 66–100.

**To change scoring weights or thresholds, edit `src/lib/riskScoring.ts`** — every UI surface
reads its exported constants, so nothing else needs to change.

## Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from the deployed repo).
2. In Vercel: **Import Project** → select this GitHub repository → accept the default Next.js
   settings → **Deploy**. No environment variables are required.
3. Vercel will auto-deploy on every push to `main`.

## CSV format

Expected columns (names are matched flexibly, case-insensitive):

`CustomerID, CustomerName, Industry, CreditScore, RepaymentStatus, LoanBalance`

## Out of scope (by design)

No backend, API routes, database, or server-side persistence. No authentication. No
`localStorage`/cookies — analysis state lives in memory only and is lost on a full page reload.
No real customer data anywhere in this repository.
