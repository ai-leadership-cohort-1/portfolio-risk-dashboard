import { ScoredCustomer } from "@/lib/types";
import { formatAud } from "@/lib/aggregate";
import { REPAYMENT_STATUS_LABELS } from "@/lib/types";
import RiskBadge from "./RiskBadge";

export default function TopRiskTable({ customers }: { customers: ScoredCustomer[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pr-3 font-medium">Customer</th>
            <th className="py-2 pr-3 font-medium">Sector</th>
            <th className="py-2 pr-3 font-medium">Credit score</th>
            <th className="py-2 pr-3 font-medium">Repayment status</th>
            <th className="py-2 pr-3 font-medium">Exposure</th>
            <th className="py-2 pr-3 font-medium">Risk</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => (
            <tr key={c.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5 pr-3">
                <span className="mr-2 text-xs text-muted">{i + 1}</span>
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="ml-1 text-xs text-muted">{c.id}</span>
              </td>
              <td className="py-2.5 pr-3 text-muted">{c.industrySector}</td>
              <td className="py-2.5 pr-3 text-muted">{c.creditScore}</td>
              <td className="py-2.5 pr-3 text-muted">{REPAYMENT_STATUS_LABELS[c.repaymentStatus]}</td>
              <td className="py-2.5 pr-3 text-muted">{formatAud(c.loanBalance)}</td>
              <td className="py-2.5 pr-3">
                <RiskBadge category={c.riskCategory} score={c.riskScore} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
