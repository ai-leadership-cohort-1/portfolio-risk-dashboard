"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Single Assessment" },
  { href: "/batch", label: "Batch Review" },
] as const;

/**
 * Top navigation bar. Hidden on print (the printed page should only ever
 * show the credit summary / call notes, never app chrome).
 */
export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="print:hidden border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Small Business Loan Pre-Screening
          </p>
          <p className="text-xs text-muted">Internal prototype &middot; not a credit decision</p>
        </div>
        <nav className="flex gap-1 rounded-md border border-border bg-background p-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
