"use client";

import Link from "next/link";
import { HandCoins, PiggyBank, Wallet, TrendingUp } from "lucide-react";
import { money, percent } from "@/lib/format";
import type { TeacherSummary } from "@/lib/types";
import { Card, CardHeader, EmptyState, Stat, StatusBadge, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { CHART_COLORS, MonthlyBars } from "@/components/charts/monthly-bars";

export function TeacherEarnings({ summary, own }: { summary: TeacherSummary; own?: boolean }) {
  const t = summary.totals;
  const who = own ? "Your" : `${summary.teacher.user.name}'s`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Payable balance"
          value={money(t.balance)}
          hint={t.balance < 0 ? "Advance taken beyond earnings" : "Earned minus paid out"}
          tone={t.balance < 0 ? "danger" : "brand"}
          icon={<Wallet className="h-5 w-5" />}
        />
        <Stat label="Earned so far" value={money(t.earnedCommission)} hint={`From ${money(t.totalCollected)} collected`} tone="success" icon={<TrendingUp className="h-5 w-5" />} />
        <Stat label="Paid out" value={money(t.totalPaidOut)} hint={`${summary.payouts.length} payout${summary.payouts.length === 1 ? "" : "s"}`} icon={<HandCoins className="h-5 w-5" />} />
        <Stat label="Projected total" value={money(t.projectedCommission)} hint={`${money(t.pendingCommission)} more once all fees are collected`} tone="warning" icon={<PiggyBank className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={`${who} commission by month`} description="Share earned on fee payments received each month, last 6 months." />
          <div className="p-5">
            <MonthlyBars data={summary.monthly} series={[{ key: "teacherShare", label: "Commission earned", color: CHART_COLORS.teacher }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Students overview" />
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ["Assigned students", String(t.studentCount)],
              ["Active students", String(t.activeStudentCount)],
              ["Total fees (final price)", money(t.totalFinalPrice)],
              ["Collected", money(t.totalCollected)],
              ["Still to collect", money(t.totalRemaining)],
              ["Default share", percent(summary.teacher.defaultCommissionPercent)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-5 py-3"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>
            ))}
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader title={own ? "My students" : "Assigned students"} description="Share earned is calculated on payments actually received." />
        {summary.students.length === 0 ? (
          <EmptyState title="No students assigned" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH>Subject</TH>
                <TH className="text-right">Final price</TH>
                <TH className="text-right">Paid</TH>
                <TH className="text-right">Remaining</TH>
                <TH className="text-right">Share %</TH>
                <TH className="text-right">Share earned</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {summary.students.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <Link href={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-700">{s.name}</Link>
                    <p className="text-xs text-slate-500">{s.phone}</p>
                  </TD>
                  <TD>{s.subject.name}</TD>
                  <TD className="text-right">{money(s.finalPrice)}</TD>
                  <TD className="text-right text-emerald-700">{money(s.paid)}</TD>
                  <TD className={`text-right ${s.remaining > 0 ? "text-amber-700" : "text-slate-400"}`}>{money(s.remaining)}</TD>
                  <TD className="text-right">{percent(s.commissionPercent)}</TD>
                  <TD className="text-right font-medium text-brand-700">{money(s.teacherShareEarned)} <span className="text-xs font-normal text-slate-400">/ {money(s.teacherShareProjected)}</span></TD>
                  <TD><StatusBadge status={s.status} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
