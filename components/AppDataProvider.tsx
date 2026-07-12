"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { PolicyDocument, PortfolioDataset, ScoredCustomer } from "@/lib/types";
import { scorePortfolio } from "@/lib/scoring";
import { SAMPLE_CUSTOMERS } from "@/lib/sampleData";
import { SAMPLE_POLICY_TEXT, extractRulesFromText } from "@/lib/pdfRules";

interface AppDataContextValue {
  policy: PolicyDocument | null;
  portfolio: PortfolioDataset | null;
  scored: ScoredCustomer[];
  setPolicy: (policy: PolicyDocument | null) => void;
  setPortfolio: (portfolio: PortfolioDataset | null) => void;
  loadSampleData: () => void;
  reset: () => void;
  hasData: boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioDataset | null>(null);

  const scored = useMemo(
    () => (portfolio ? scorePortfolio(portfolio.customers) : []),
    [portfolio]
  );

  const loadSampleData = () => {
    setPolicy({
      fileName: "sample-lending-policy.txt",
      pageCount: 1,
      rawText: SAMPLE_POLICY_TEXT,
      rules: extractRulesFromText(SAMPLE_POLICY_TEXT),
    });
    setPortfolio({
      fileName: "sample-portfolio.csv",
      customers: SAMPLE_CUSTOMERS,
      unrecognisedColumns: [],
      skippedRows: 0,
    });
  };

  const reset = () => {
    setPolicy(null);
    setPortfolio(null);
  };

  return (
    <AppDataContext.Provider
      value={{
        policy,
        portfolio,
        scored,
        setPolicy,
        setPortfolio,
        loadSampleData,
        reset,
        hasData: !!portfolio && portfolio.customers.length > 0,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
