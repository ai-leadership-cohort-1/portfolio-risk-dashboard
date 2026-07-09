import { AssessmentInput, AssessmentMeta, ScoringResult } from "@/lib/types";
import { formatAbn } from "@/lib/validation";
import TrafficLight from "@/components/TrafficLight";
import { BAND_BADGE_CLASSES } from "@/components/bandStyles";

export default function CreditSummary({
  input,
  result,
  meta,
}: {
  input: AssessmentInput;
  result: ScoringResult;
  meta: AssessmentMeta;
}) {
  return (
    <section
      id="credit-summary"
      aria-label="Credit summary"
      className="rounded-lg border border-border bg-surface p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Pre-screening credit summary
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            {input.businessName}
          </h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-muted sm:grid-cols-2">
            <div className="flex gap-1">
              <dt className="font-medium text-foreground">ABN:</dt>
              <dd>{formatAbn(input.abn)}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium text-foreground">Relationship manager:</dt>
              <dd>{input.rmName}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium text-foreground">Assessment ID:</dt>
              <dd>{meta.assessmentId}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="font-medium text-foreground">Generated:</dt>
              <dd>{meta.timestamp}</dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-center sm:justify-end">
          <TrafficLight overall={result.overall} />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Factor-by-factor breakdown</h3>
        <div className="mt-3 flex flex-col gap-3">
          {result.factors.map((factor) => (
            <div
              key={factor.key}
              className="flex flex-col gap-1 rounded-md border border-border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              <div className="sm:w-1/3">
                <p className="text-sm font-medium text-foreground">{factor.label}</p>
                <p className="text-xs text-muted">{factor.value}</p>
              </div>
              <div className="sm:w-1/6">
                <span
                  className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${BAND_BADGE_CLASSES[factor.band]}`}
                >
                  {factor.band}
                </span>
              </div>
              <p className="text-xs text-muted sm:w-1/2">{factor.interpretation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Risk flags</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {result.riskFlags.map((flag, i) => (
            <li key={i}>{flag}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground">Recommendation</h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{result.recommendation}</p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
        <p className="text-xs italic text-muted">
          Prototype for internal pre-screening only. Not a credit decision. Full
          assessment required by the credit committee.
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="print:hidden shrink-0 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-border/40"
        >
          Print
        </button>
      </div>
    </section>
  );
}
