"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Upload" },
  { href: "/dashboard", label: "Executive Dashboard" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <div>
      <div className="h-[3px] w-full bg-[var(--accent)]" />
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-7 w-7 shrink-0 rounded-md bg-[var(--accent)]">
              <div className="absolute inset-[6px] rounded-sm bg-[var(--surface)]" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight text-[var(--foreground)]">
                Portfolio Risk Dashboard
              </div>
              <div className="text-xs leading-tight text-[var(--muted)]">
                Lending &amp; credit risk prototype
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
                      : "rounded-md px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--background)]"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </div>
  );
}
