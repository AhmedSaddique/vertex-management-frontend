"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { money } from "@/lib/format";
import type { Dashboard } from "@/lib/types";
import { Alert, Card, CardHeader, ErrorBlock, LoadingBlock, PageHeader, Stat, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { CHART_COLORS, MonthlyBars } from "@/components/charts/monthly-bars";

export default function FinancePage() {
  const { isAdmin } = useAuth();
  const q = useFetch(() => api<Dashboard>("/dashboard"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can view the company account.</Alert>;
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error || !q.data) return <ErrorBlock message={q.error ?? "Failed to load"} onRetry={q.reload} />;

  const d = q.data;
  const f = d.finance;
  const collectedPct = f.totalFinalPrice > 0 ? Math.round((f.totalCollected / f.totalFinalPrice) * 100) : 0;

  return (
    <div>
      <PageHeader title="Company account" description="Where every rupee collected has gone: partner shares, payouts, expenses and what stays with the company." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total fees (final price)" value={money(f.totalFinalPrice)} hint={`${d.students.total} students enrolled`} />
        <Stat label="Collected" value={money(f.totalCollected)} hint={`${collectedPct}% of total fees`} tone="brand" />
        <Stat label="Outstanding receivable" value={money(f.totalOutstanding)} hint="Fees not yet paid by students" tone="warning" />
        <Stat label="Cash in hand" value={money(f.netCash)} hint="Collected - payouts - expenses" tone="success" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Company share" value={money(f.companyShare)} hint="Collected minus partner shares" tone="success" />
        <Stat label="Expenses" value={money(f.totalExpenses)} hint="Company running costs" tone="danger" />
        <Stat label="Company balance" value={money(f.companyBalance)} hint="Company share minus expenses" tone={f.companyBalance < 0 ? "danger" : "brand"} />
        <Stat label="Owed to partners" value={money(f.partnerBalanceOwed)} hint={`${money(f.partnerShare)} earned - ${money(f.totalPayouts)} paid`} tone={f.partnerBalanceOwed > 0 ? "warning" : "neutral"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly breakdown" description="Collections split into company and partner shares, last 6 months." action={<Link href="/expenses" className="text-xs font-medium text-brand-700 hover:underline">Expenses</Link>} />
          <div className="p-5">
            <MonthlyBars data={d.monthly} series={[{ key: "companyShare", label: "Company share", color: CHART_COLORS.company }, { key: "partnerShare", label: "Partner shares", color: CHART_COLORS.partner }]} />
          </div>
          <Table>
            <THead><TR><TH>Month</TH><TH className="text-right">Collected</TH><TH className="text-right">Company</TH><TH className="text-right">Partners</TH><TH className="text-right">Payouts</TH><TH className="text-right">Expenses</TH></TR></THead>
            <TBody>
              {d.monthly.map((m) => (
                <TR key={m.month}>
                  <TD className="font-medium text-slate-900">{m.label}</TD>
                  <TD className="text-right">{money(m.collected)}</TD>
                  <TD className="text-right text-emerald-700">{money(m.companyShare)}</TD>
                  <TD className="text-right text-amber-700">{money(m.partnerShare)}</TD>
                  <TD className="text-right">{money(m.payouts)}</TD>
                  <TD className="text-right text-rose-700">{money(m.expenses)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="By subject" />
          <Table>
            <THead><TR><TH>Subject</TH><TH className="text-right">Students</TH><TH className="text-right">Collected</TH></TR></THead>
            <TBody>
              {d.bySubject.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium text-slate-900">{s.name}</TD>
                  <TD className="text-right">{s.students}</TD>
                  <TD className="text-right">{money(s.collected)}<p className="text-xs text-slate-400">of {money(s.finalPrice)}</p></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Partner accounts" description="Share earned on collected fees, payouts made and the balance still payable." />
        <Table>
          <THead><TR><TH>Partner</TH><TH>Type</TH><TH className="text-right">Students</TH><TH className="text-right">Fees collected</TH><TH className="text-right">Earned</TH><TH className="text-right">Paid out</TH><TH className="text-right">Payable</TH><TH className="text-right">Full share</TH></TR></THead>
          <TBody>
            {d.partners.map((p) => (
              <TR key={p.id}>
                <TD><Link href={`/partners/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">{p.name}</Link>{p.subjects.length > 0 && <p className="text-xs text-slate-500">{p.subjects.join(", ")}</p>}</TD>
                <TD className="text-slate-500">{p.kind === "TEACHER" ? "Teacher" : "Management"}</TD>
                <TD className="text-right">{p.totals.studentCount}</TD>
                <TD className="text-right">{money(p.totals.totalCollected)}</TD>
                <TD className="text-right text-amber-700">{money(p.totals.earnedShare)}</TD>
                <TD className="text-right">{money(p.totals.totalPaidOut)}</TD>
                <TD className={`text-right font-semibold ${p.totals.balance < 0 ? "text-rose-600" : "text-brand-700"}`}>{money(p.totals.balance)}</TD>
                <TD className="text-right text-slate-500">{money(p.totals.projectedShare)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
