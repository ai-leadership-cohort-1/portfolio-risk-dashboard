"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = pathname === href;
    return active
      ? "px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-sm font-medium"
      : "px-3 py-1.5 rounded-md text-sm text-[var(--foreground)] hover:bg-[var(--background)]";
  };

  return (
    <div>
      <div className="h-[3px] w-full bg-[var(--accent)]" />
      <header className="w-full bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-[var(--surface)]" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Portfolio Risk Dashboard</div>
              <div className="text-xs text-[var(--muted)] leading-tight">
                Lending &amp; credit risk prototype
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/" className={linkClass("/")}>
              Upload
            </Link>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              Executive Dashboard
            </Link>
          </nav>
        </div>
      </header>
    </div>
  );
}
