/**
 * Generates a short, human-scannable assessment ID for display purposes only
 * (e.g. "ASM-7F3K9Q"). Not persisted anywhere, not a database key — purely
 * cosmetic so a printed summary looks like it belongs to a real system.
 */
export function generateAssessmentId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid ambiguity
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `ASM-${suffix}`;
}

/** Formats an ISO-ish timestamp for the credit summary header. */
export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
