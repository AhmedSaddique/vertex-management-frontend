"use client";

import Link from "next/link";
import { date, daysLabel, slotKeyLabel, timeRange } from "@/lib/format";
import type { StudentDetail } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/display";

export function StudentInfoCard({ student: s }: { student: StudentDetail }) {
  const slots = s.classSlots ?? [];
  const info: [string, React.ReactNode][] = [
    ["Phone", <a key="p" href={`tel:${s.phone}`} className="text-brand-700 hover:underline">{s.phone}</a>],
    ["Father name", s.fatherName || "-"],
    ["Father phone", s.fatherPhone ? <a key="fp" href={`tel:${s.fatherPhone}`} className="text-brand-700 hover:underline">{s.fatherPhone}</a> : "-"],
    ["Email", s.email || "-"],
    ["Address", s.address || "-"],
    ["Subject", s.subject.name],
    ["Teacher", s.teacher.user.name],
    [
      "Class time",
      slots.length === 0 ? (
        <span className="text-slate-500">Not assigned to a class yet</span>
      ) : (
        <ul className="space-y-1">
          {slots.map((c) => (
            <li key={c.id}>
              <Link href={`/schedule/${c.id}`} className="font-medium text-brand-700 hover:underline">
                {c.title || `${c.subject.name} class`}
              </Link>
              <span className="text-slate-500"> · {daysLabel(c.days)} · {timeRange(c.startTime, c.endTime)}</span>
              {!c.isActive && <span className="ml-1 text-xs text-slate-400">(inactive)</span>}
            </li>
          ))}
        </ul>
      ),
    ],
    [
      "Available slots",
      s.availableSlots?.length ? (
        <span className="flex flex-wrap gap-1">{s.availableSlots.map((k) => <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{slotKeyLabel(k)}</span>)}</span>
      ) : (
        <span className="text-slate-500">Not set</span>
      ),
    ],
    ["Enrolled on", date(s.enrolledAt)],
    ["Notes", s.notes || "-"],
  ];
  return (
    <Card className="lg:col-span-1">
      <CardHeader title="Student information" />
      <dl className="divide-y divide-slate-100 text-sm">
        {info.map(([k, v]) => (
          <div key={k} className="flex gap-4 px-5 py-3">
            <dt className="w-28 shrink-0 text-slate-500">{k}</dt>
            <dd className="min-w-0 break-words text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
