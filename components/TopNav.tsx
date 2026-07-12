"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "./AppDataProvider";

const LINKS = [
  { href: "/", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/summary", label: "Executive Summary" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { hasData, reset } = useAppData();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-accent text-sm font-bold text-accent-foreground">
            N
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Portfolio Risk Dashboard
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((link) => {
            const disabled = link.href !== "/" && !hasData;
            const active = pathname === link.href;
            if (disabled) {
              return (
                <span
                  key={link.href}
                  title="Upload portfolio data first"
                  className="cursor-not-allowed rounded-md px-2.5 py-1.5 text-xs font-medium text-muted/50 sm:text-sm"
                >
                  {link.label}
                </span>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/80 hover:bg-background hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {hasData && (
            <button
              onClick={reset}
              className="ml-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-background sm:text-sm"
            >
              Reset
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
