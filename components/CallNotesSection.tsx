"use client";

import { useState } from "react";
import { AssessmentInput, ScoringResult } from "@/lib/types";
import { generateCallNotes } from "@/lib/callnotes";

function callNotesToPlainText(
  input: AssessmentInput,
  notes: ReturnType<typeof generateCallNotes>
): string {
  return [
    `RM Call Notes — ${input.businessName}`,
    "",
    "Opening line:",
    notes.openingLine,
    "",
    "Talking points:",
    ...notes.talkingPoints.map((t) => `- ${t}`),
    "",
    "Questions to ask:",
    ...notes.questions.map((q) => `- ${q}`),
    "",
    `Suggested next step: ${notes.nextStep}`,
    "",
    notes.disclaimer,
  ].join("\n");
}

export default function CallNotesSection({
  input,
  result,
}: {
  input: AssessmentInput;
  result: ScoringResult;
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const notes = generateCallNotes(input, result);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(callNotesToPlainText(input, notes));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser; fail silently, the
      // text remains visible on screen (and in print) regardless.
    }
  }

  return (
    <section
      id="rm-call-notes"
      aria-label="RM call notes"
      className="mt-6 rounded-lg border border-border bg-surface p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="print:hidden flex items-center gap-2 text-sm font-semibold text-foreground"
          aria-expanded={open}
        >
          <span aria-hidden="true">{open ? "▾" : "▸"}</span>
          RM Call Notes
        </button>
        <h3 className="hidden print:block text-sm font-semibold text-foreground">
          RM Call Notes
        </h3>
        <button
          type="button"
          onClick={handleCopy}
          className="print:hidden rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-border/40"
        >
          {copied ? "Copied" : "Copy to clipboard"}
        </button>
      </div>

      <div className={`${open ? "block" : "hidden"} print:block mt-4 flex flex-col gap-5`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Suggested opening line
          </p>
          <p className="mt-1 text-sm text-foreground">{notes.openingLine}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Talking points
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
            {notes.talkingPoints.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Questions to ask the customer
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
            {notes.questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Suggested next step
          </p>
          <p className="mt-1 text-sm text-foreground">{notes.nextStep}</p>
        </div>

        <p className="border-t border-border pt-3 text-xs italic text-muted">
          {notes.disclaimer}
        </p>
      </div>
    </section>
  );
}
