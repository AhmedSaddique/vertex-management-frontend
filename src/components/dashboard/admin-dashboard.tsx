"use client";

import Link from "next/link";
import { Building2, GraduationCap, HandCoins, Wallet } from "lucide-react";
import { date, money } from "@/lib/format";
import type { Dashboard } from "@/lib/types";
import { Badge, Card, CardHeader, EmptyState, Stat, StatusBadge, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { CHART_COLORS, MonthlyBars } from "@/components/charts/monthly-bars";
import { TodayClasses } from "@/components/schedule/today-classes";
import { FeeDueCard } from "./fee-due-card";
import { SharesCell } from "@/components/students/student-payments-table";

export function AdminDashboard({ data }: { data: Dashboard }) {
  const f = data.finance;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total collected" value={money(f.totalCollected)} hint={`${money(f.totalOutstanding)} still to collect`} tone="brand" icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Company balance" value={money(f.companyBalance)} hint={`${money(f.companyShare)} company share - ${money(f.totalExpenses)} expenses`} tone={f.companyBalance < 0 ? "danger" : "success"} icon={<Building2 className="h-5 w-5" />} />
        <Stat label="Owed to partners" value={money(f.partnerBalanceOwed)} hint={`${money(f.partnerShare)} earned, ${money(f.totalPayouts)} paid`} tone="warning" icon={<HandCoins className="h-5 w-5" />} />
        <Stat label="Students" value={data.students.total} hint={`${data.students.active} active · ${data.students.completed} completed · ${data.students.dropped} dropped`} icon={<GraduationCap className="h-5 w-5" />} />
      </div>

      <FeeDueCard due={data.due} />
      <TodayClasses />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly collections" description="Fee payments received, split into company share and partner shares." action={<Link href="/finance" className="text-xs font-medium text-brand-700 hover:underline">Company account</Link>} />
          <div className="p-5">
            <MonthlyBars data={data.monthly} series={[{ key: "companyShare", label: "Company share", color: CHART_COLORS.company }, { key: "partnerShare", label: "Partner shares", color: CHART_COLORS.partner }]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Partners" action={<Link href="/partners" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>} />
          <div className="divide-y divide-slate-100">
            {data.partners.length === 0 && <EmptyState title="No partners yet" />}
            {data.partners.map((p) => (
              <Link key={p.id} href={`/partners/${p.id}`} className="block px-5 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{p.name} <span className="text-xs font-normal text-slate-400">{p.kind === "TEACHER" ? "teacher" : "management"}</span></p>
                    <p className="truncate text-xs text-slate-500">{money(p.totals.earnedShare)} earned · {money(p.totals.totalPaidOut)} paid</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${p.totals.balance < 0 ? "text-rose-600" : "text-brand-700"}`}>{money(p.totals.balance)}</p>
                    <p className="text-xs text-slate-500">payable</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent payments" action={<Link href="/payments" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>} />
          {data.recentPayments.length === 0 ? <EmptyState title="No payments yet" /> : (
            <Table>
              <THead><TR><TH>Date</TH><TH>Student</TH><TH className="text-right">Amount</TH><TH>Shares</TH></TR></THead>
              <TBody>
                {data.recentPayments.map((p) => (
                  <TR key={p.id}>
                    <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
                    <TD><Link href={`/students/${p.studentId}`} className="font-medium text-slate-900 hover:text-brand-700">{p.student?.name}</Link></TD>
                    <TD className="text-right font-medium">{money(p.amount)}</TD>
                    <TD><SharesCell shares={p.shares} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Recently enrolled" action={<Link href="/students" className="text-xs font-medium text-brand-700 hover:underline">View all</Link>} />
          {data.recentStudents.length === 0 ? <EmptyState title="No students yet" /> : (
            <Table>
              <THead><TR><TH>Student</TH><TH>Subject</TH><TH className="text-right">Final price</TH><TH>Status</TH></TR></THead>
              <TBody>
                {data.recentStudents.map((s) => (
                  <TR key={s.id}>
                    <TD><Link href={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-700">{s.name}</Link><p className="text-xs text-slate-500">{s.teacher.user.name}</p></TD>
                    <TD><Badge tone="brand">{s.subject.name}</Badge></TD>
                    <TD className="text-right font-medium">{money(s.finalPrice)}</TD>
                    <TD><StatusBadge status={s.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
