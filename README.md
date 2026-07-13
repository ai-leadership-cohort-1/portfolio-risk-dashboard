# Portfolio Risk Dashboard

A client-side prototype that turns a lending policy PDF and a customer
portfolio CSV into an executive risk dashboard — customer risk scoring,
Green/Amber/Red categorisation, exposure breakdowns, a portfolio risk trend,
and recommended actions.

Everything runs in the browser. There is no backend, no database, no
authentication, and no server-side persistence — uploaded files are parsed
client-side and the resulting analysis lives only in memory for the current
session.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Use **Load Sample Data** on the Upload page
to try it instantly with the bundled sample CSV/PDF, or upload your own files.

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from
   the deployed repo).
2. In Vercel: **Import Project** → select this GitHub repo → accept the
   defaults (Next.js is auto-detected via `vercel.json`) → **Deploy**.
3. No environment variables are required.

## How risk scoring works

```
Risk Score = (Credit Risk Weight × Credit Score Factor)
           + (Repayment Risk Weight × Repayment Status Factor)
           + (Exposure Weight × Loan Balance Factor)
```

Default weights: Credit Risk 40%, Repayment Risk 40%, Exposure 20%. Customers
are categorised Green (0–35), Amber (36–65), or Red (66–100).

**To change scoring weights or thresholds, edit `src/lib/riskScoring.ts`** —
every number shown on the Upload and Dashboard pages is read from that one
file, so nothing else needs to change.

## CSV format

Expected logical columns (header names are matched flexibly, case-insensitive):
`CustomerID`, `CustomerName`, `Industry`, `CreditScore`, `RepaymentStatus`,
`LoanBalance`.

## Out of scope (by design)

No real customer data, no authentication, no server-side storage. This is a
prototype for internal review only.
