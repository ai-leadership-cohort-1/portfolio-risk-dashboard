# Portfolio Risk Dashboard

A client-side prototype that turns a lending policy PDF and a customer
portfolio CSV into an executive credit-risk dashboard: risk scores, Green /
Amber / Red categorisation, exposure by industry, a portfolio risk trend, and
recommended actions.

All processing happens in the browser. There is no backend, no database, no
authentication, and nothing is uploaded to a server or persisted to storage.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Load Sample Data**
on the Upload page to try it instantly with the bundled sample files, or
upload your own PDF/CSV.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Vercel: **Import Project** → select this GitHub repo → accept the
   defaults (framework auto-detected as Next.js via `vercel.json`) → Deploy.
3. No environment variables are required.

Every subsequent push to `main` redeploys automatically.

## Changing the scoring logic

All scoring weights, credit score bands, repayment status mappings, the
exposure cap, and the Green/Amber/Red thresholds live in one file:

**`src/lib/riskScoring.ts`**

Formula:

```
Risk Score = (Credit Risk Weight × Credit Score Factor)
           + (Repayment Risk Weight × Repayment Status Factor)
           + (Exposure Weight × Loan Balance Factor)
```

Defaults: Credit Risk Weight 0.4, Repayment Risk Weight 0.4, Exposure Weight
0.2 (weights sum to 1). Categories: Green 0–35, Amber 36–65, Red 66–100.

## CSV format

Expected logical columns (header names are matched flexibly, case-insensitive):
`CustomerID`, `CustomerName`, `Industry`, `CreditScore`, `RepaymentStatus`,
`LoanBalance`. Rows with an unparseable credit score, unparseable loan
balance, or missing customer ID are skipped and counted, not fatal to the
whole upload.

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Recharts ·
PapaParse · pdfjs-dist. No external APIs or LLM calls are used for PDF rule
extraction — it's keyword + sentence-splitting heuristics only.

## Out of scope

No real customer data, no authentication, no server-side persistence. A full
page reload clears the current analysis — this is intentional for a
client-only prototype.
