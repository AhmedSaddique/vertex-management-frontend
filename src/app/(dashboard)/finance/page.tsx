"use client";

import Link from "next/link";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { money, percent } from "@/lib/format";
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
      <PageHeader title="Company account" description="Where every rupee collected has gone: teacher commissions, payouts and what stays with the company." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total fees (final price)" value={money(f.totalFinalPrice)} hint={`${d.students.total} students enrolled`} />
        <Stat label="Collected" value={money(f.totalCollected)} hint={`${collectedPct}% of total fees`} tone="brand" />
        <Stat label="Outstanding receivable" value={money(f.totalOutstanding)} hint="Fees not yet paid by students" tone="warning" />
        <Stat label="Net cash in hand" value={money(f.netCash)} hint="Collected minus payouts to teachers" tone="success" />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Company share" value={money(f.companyShare)} hint="Belongs to the company" tone="success" />
        <Stat label="Teacher share earned" value={money(f.teacherShare)} hint="Commission on collected fees" tone="warning" />
        <Stat label="Paid to teachers" value={money(f.totalPayouts)} hint="Payouts recorded" />
        <Stat label="Owed to teachers" value={money(f.teacherBalanceOwed)} hint="Earned minus paid out" tone={f.teacherBalanceOwed > 0 ? "danger" : "neutral"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly breakdown" description="Collections split into company and teacher share, last 6 months." />
          <div className="p-5">
            <MonthlyBars data={d.monthly} series={[{ key: "companyShare", label: "Company share", color: CHART_COLORS.company }, { key: "teacherShare", label: "Teacher share", color: CHART_COLORS.teacher }]} />
          </div>
          <Table>
            <THead><TR><TH>Month</TH><TH className="text-right">Collected</TH><TH className="text-right">Company share</TH><TH className="text-right">Teacher share</TH><TH className="text-right">Payouts</TH></TR></THead>
            <TBody>
              {d.monthly.map((m) => (
                <TR key={m.month}>
                  <TD className="font-medium text-slate-900">{m.label}</TD>
                  <TD className="text-right">{money(m.collected)}</TD>
                  <TD className="text-right text-emerald-700">{money(m.companyShare)}</TD>
                  <TD className="text-right text-amber-700">{money(m.teacherShare)}</TD>
                  <TD className="text-right">{money(m.payouts)}</TD>
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
        <CardHeader title="Teacher accounts" description="Commission earned on collected fees, payouts made and the balance still payable." />
        <Table>
          <THead>
            <TR><TH>Teacher</TH><TH>Subjects</TH><TH className="text-right">Students</TH><TH className="text-right">Fees collected</TH><TH className="text-right">Earned</TH><TH className="text-right">Paid out</TH><TH className="text-right">Payable</TH><TH className="text-right">Projected</TH></TR>
          </THead>
          <TBody>
            {d.teachers.map((t) => (
              <TR key={t.id}>
                <TD><Link href={`/teachers/${t.id}`} className="font-medium text-slate-900 hover:text-brand-700">{t.name}</Link><p className="text-xs text-slate-500">{percent(t.defaultCommissionPercent)} default</p></TD>
                <TD className="text-slate-500">{t.subjects.join(", ") || "-"}</TD>
                <TD className="text-right">{t.totals.studentCount}</TD>
                <TD className="text-right">{money(t.totals.totalCollected)}</TD>
                <TD className="text-right text-amber-700">{money(t.totals.earnedCommission)}</TD>
                <TD className="text-right">{money(t.totals.totalPaidOut)}</TD>
                <TD className={`text-right font-semibold ${t.totals.balance < 0 ? "text-rose-600" : "text-brand-700"}`}>{money(t.totals.balance)}</TD>
                <TD className="text-right text-slate-500">{money(t.totals.projectedCommission)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
