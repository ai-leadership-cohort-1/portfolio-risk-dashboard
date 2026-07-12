import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";
import { AppDataProvider } from "@/components/AppDataProvider";

export const metadata: Metadata = {
  title: "Portfolio Risk Dashboard | Executive Prototype",
  description:
    "Internal prototype: upload a lending policy PDF and a customer portfolio CSV to generate a risk-scored executive dashboard. Prototype only — not a credit decision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppDataProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border bg-surface px-4 py-4 text-center text-xs text-muted sm:px-6">
            Internal prototype for portfolio risk pre-screening only. Not a credit
            decision. All data stays in your browser session and is never uploaded
            or stored.
          </footer>
        </AppDataProvider>
      </body>
    </html>
  );
}
