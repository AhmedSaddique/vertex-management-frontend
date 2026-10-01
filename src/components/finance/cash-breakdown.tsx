"use client";

import Link from "next/link";
import { money } from "@/lib/format";
import type { CompanyTotals } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/display";

interface Line {
  label: string;
  amount: number;
  href?: string;
  note?: string;
}

/**
 * Where the company's money actually is: what came in, what went out, and what is left.
 * Loans are money that left the company but is still owed back, so they reduce cash
 * without being an expense.
 */
export function CashBreakdown({ f }: { f: CompanyTotals }) {
  const inflow: Line[] = [
    { label: "Student fees collected", amount: f.totalCollected, href: "/payments" },
    { label: "Trading income", amount: f.tradingTotal, href: "/trading" },
  ];
  const outflow: Line[] = [
    { label: "Paid out to partners", amount: f.totalPayouts, href: "/payouts" },
    { label: "Company expenses", amount: f.totalExpenses, href: "/expenses" },
    { label: "Loans still out", amount: f.loansOutstanding, href: "/loans", note: "owed back to the company" },
  ];
  const totalIn = Math.round((f.totalCollected + f.tradingTotal) * 100) / 100;
  const totalOut = Math.round((f.totalPayouts + f.totalExpenses + f.loansOutstanding) * 100) / 100;

  const row = (l: Line, sign: "+" | "-") => (
    <div key={l.label} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
      <span className="text-slate-600">
        {l.href ? (
          <Link href={l.href} className="hover:text-brand-700 hover:underline">{l.label}</Link>
        ) : (
          l.label
        )}
        {l.note && <span className="ml-1 text-xs text-slate-400">({l.note})</span>}
      </span>
      <span className={`font-medium tabular-nums ${sign === "+" ? "text-emerald-700" : "text-rose-700"}`}>
        {sign} {money(l.amount)}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader title="Where the money is" description="Everything that came in, everything that left, and what is actually in hand." />
      <div className="divide-y divide-slate-100">
        <div className="bg-emerald-50/40 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Money in</div>
        {inflow.map((l) => row(l, "+"))}
        <div className="flex justify-between px-5 py-2 text-sm font-semibold text-slate-900">
          <span>Total received</span>
          <span className="tabular-nums">{money(totalIn)}</span>
        </div>

        <div className="bg-rose-50/40 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-rose-800">Money out</div>
        {outflow.map((l) => row(l, "-"))}
        <div className="flex justify-between px-5 py-2 text-sm font-semibold text-slate-900">
          <span>Total out</span>
          <span className="tabular-nums">{money(totalOut)}</span>
        </div>

        <div className="flex items-center justify-between bg-brand-50 px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-brand-900">Cash in hand now</p>
            <p className="text-xs text-brand-700/80">
              {f.loansOutstanding > 0
                ? `${money(f.loansOutstanding)} of this is out on loan and comes back when it is paid`
                : "No loans are outstanding"}
            </p>
          </div>
          <span className="text-xl font-bold tabular-nums text-brand-900">{money(f.netCash)}</span>
        </div>
      </div>
    </Card>
  );
}
