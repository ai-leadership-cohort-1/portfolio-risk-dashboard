# Portfolio Risk Dashboard

A client-side prototype that analyses a customer loan portfolio against a
lending policy document and produces an executive risk dashboard — customer
risk scores, Green/Amber/Red categorisation, exposure breakdowns, and
recommended actions.

Everything runs in the browser. There is no backend, no database, and no
data is ever sent to a server — files are parsed and scored entirely
client-side.

## What it does

1. **Upload** a lending policy PDF (optional) and a customer portfolio CSV
   (required) on the Upload page, or click **Load Sample Data** to try it
   with bundled example files.
2. **Run Analysis** parses the CSV, scores every customer, and (if a PDF was
   provided) extracts key policy rules using keyword heuristics.
3. The **Executive Dashboard** shows KPIs by risk category, total exposure,
   a category/exposure chart, an industry exposure breakdown, an
   illustrative portfolio risk trend, a Top 10 highest-risk customer table,
   recommended actions, and the scoring methodology.

## Risk scoring

```
Risk Score = (Credit Risk Weight × Credit Score Factor)
           + (Repayment Risk Weight × Repayment Status Factor)
           + (Exposure Weight × Loan Balance Factor)
```

Default weights: Credit Risk 40%, Repayment Risk 40%, Exposure 20%.
Categories: Green 0–35, Amber 36–65, Red 66–100.

**To change these weights or thresholds, edit `src/lib/riskScoring.ts`** —
it's the single file that controls scoring behaviour, and its header
comment documents every constant.

## CSV format

Required columns (header names are matched flexibly, case-insensitive):

| Column | Accepted aliases |
|---|---|
| CustomerID | customer_id, id, account_id, account number |
| CustomerName | customer_name, name, client name, customer |
| Industry | industry_sector, sector |
| CreditScore | credit_score, score, bureau_score |
| RepaymentStatus | repayment_status, status, arrears_status, delinquency_status |
| LoanBalance | loan_balance, balance, exposure, outstanding_balance |

Rows with an unparseable credit score, unparseable loan balance, or empty
customer ID are skipped and counted, not treated as a fatal error.

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from
   the deployed repo).
2. In Vercel: **Import Project** → select this GitHub repository → accept
   the default Next.js settings → **Deploy**. No environment variables are
   required.

## Tech stack

Next.js (App Router, TypeScript), Tailwind CSS, Recharts for charts,
PapaParse for CSV parsing, pdfjs-dist for client-side PDF text extraction.

## Out of scope (by design)

No authentication, no backend/API routes, no database, no persistence of
uploaded data (a page reload clears the current analysis — this is
intentional), and no real customer data anywhere in this repository.
