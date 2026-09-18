"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { INSTALLMENT_LABEL, admissionNo, date, dueLabel, money } from "@/lib/format";
import type { DueList } from "@/lib/types";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/display";

/** Students whose promised fee date is overdue, today, or coming up. */
export function FeeDueCard({ due, days = 7 }: { due: DueList; days?: number }) {
  const s = due.summary;
  return (
    <Card>
      <CardHeader
        title="Fee due"
        description={`${s.overdue} overdue · ${s.dueToday} due today · ${s.upcoming} in the next ${days} days · ${money(s.totalDue)} to collect`}
        action={<Link href="/students" className="text-xs font-medium text-brand-700 hover:underline">All students</Link>}
      />
      {due.items.length === 0 ? (
        <EmptyState title="Nothing due" description="No promised fee dates in this period." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {due.items.map((i) => {
            const overdue = i.status === "OVERDUE";
            const today = dueLabel(i.dueDate) === "Today";
            return (
              <li key={i.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${overdue ? "bg-rose-50/40" : today ? "bg-amber-50/40" : ""}`}>
                <div className="min-w-[120px]">
                  <p className={`text-sm font-semibold ${overdue ? "text-rose-700" : today ? "text-amber-700" : "text-slate-900"}`}>{dueLabel(i.dueDate)}</p>
                  <p className="text-xs text-slate-500">{date(i.dueDate)}</p>
                </div>
                <div className="min-w-[160px] flex-1">
                  {i.student ? (
                    <>
                      <Link href={`/students/${i.student.id}`} className="text-sm font-medium text-slate-900 hover:text-brand-700">{i.student.name}</Link>
                      <p className="text-xs text-slate-500">{admissionNo(i.student.admissionNo)} · {i.student.subject.name} · {i.student.teacher.user.name}</p>
                    </>
                  ) : null}
                </div>
                {i.student && (
                  <div className="flex flex-col text-xs">
                    <a href={`tel:${i.student.phone}`} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"><Phone className="h-3 w-3" />{i.student.phone}</a>
                    {i.student.fatherPhone && <a href={`tel:${i.student.fatherPhone}`} className="text-slate-500 hover:underline">father {i.student.fatherPhone}</a>}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{money(i.remaining)}</p>
                  {i.paidAmount > 0 && <p className="text-xs text-slate-500">of {money(i.amount)}</p>}
                </div>
                <Badge tone={overdue ? "danger" : i.status === "PARTIAL" ? "warning" : "info"}>{INSTALLMENT_LABEL[i.status]}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
