"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Upload" },
  { href: "/dashboard", label: "Executive Dashboard" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <div>
      <div className="h-[3px] w-full" style={{ backgroundColor: "var(--accent)" }} />
      <header className="border-b bg-[var(--surface)]" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div
              className="relative h-7 w-7 shrink-0 rounded-md"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <div
                className="absolute inset-[6px] rounded-sm"
                style={{ backgroundColor: "var(--surface)" }}
              />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">Portfolio Risk Dashboard</div>
              <div className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
                Lending &amp; credit risk prototype
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    active
                      ? "rounded-md px-3 py-1.5 text-sm font-medium text-white"
                      : "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-[var(--background)]"
                  }
                  style={active ? { backgroundColor: "var(--accent)" } : { color: "var(--foreground)" }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    </div>
  );
}
