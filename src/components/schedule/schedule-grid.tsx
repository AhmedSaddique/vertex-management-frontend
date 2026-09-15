"use client";

import Link from "next/link";
import { WEEKDAYS, WEEKDAY_LABEL, timeRange, todayWeekday } from "@/lib/format";
import type { ClassSlot, TimeSlot } from "@/lib/types";
import { Badge } from "@/components/ui/display";
import { slotTitle } from "./slot-card";

interface Props {
  slots: ClassSlot[];
  presets: TimeSlot[];
}

/** Timetable grid: one row per fixed time slot, one column per weekday. */
export function ScheduleGrid({ slots, presets }: Props) {
  const today = todayWeekday();
  const matches = (c: ClassSlot, p: TimeSlot) => c.startTime === p.start && c.endTime === p.end;
  const others = slots.filter((c) => !presets.some((p) => matches(c, p)));
  const rows = [
    ...presets.map((p) => ({ key: `${p.start}-${p.end}`, label: timeRange(p.start, p.end), items: slots.filter((c) => matches(c, p)), other: false })),
    ...(others.length ? [{ key: "other", label: "Other times", items: others, other: true }] : []),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[960px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-40 border-b border-r border-slate-200 px-3 py-3 text-left">Time</th>
            {WEEKDAYS.map((d) => (
              <th key={d} className={`border-b border-slate-200 px-2 py-3 text-left ${d === today ? "bg-brand-50 text-brand-700" : ""}`}>
                <span className="flex items-center gap-2">{WEEKDAY_LABEL[d]}{d === today && <Badge tone="brand">Today</Badge>}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-slate-100 last:border-0">
              <th scope="row" className="border-r border-slate-200 bg-slate-50/60 px-3 py-2 text-left align-top text-xs font-semibold text-slate-700">
                {r.label}
              </th>
              {WEEKDAYS.map((d) => {
                const cell = r.items.filter((c) => c.days.includes(d));
                return (
                  <td key={d} className={`p-1.5 align-top ${d === today ? "bg-brand-50/30" : ""}`}>
                    {cell.length === 0 ? (
                      <div className="min-h-[60px] rounded-md border border-dashed border-slate-100" />
                    ) : (
                      cell.map((c) => (
                        <Link
                          key={c.id}
                          href={`/schedule/${c.id}`}
                          className={`mb-1.5 block rounded-md border px-2 py-1.5 last:mb-0 ${
                            c.isActive ? "border-brand-200 bg-brand-50 hover:bg-brand-100" : "border-slate-200 bg-slate-50 opacity-70"
                          }`}
                        >
                          <p className="truncate text-xs font-semibold text-brand-800">{c.teacher.user.name}</p>
                          <p className="truncate text-xs text-slate-700">{slotTitle(c)}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {c.students.length} student{c.students.length === 1 ? "" : "s"}
                            {r.other ? ` · ${timeRange(c.startTime, c.endTime)}` : ""}
                            {c.location ? ` · ${c.location}` : ""}
                          </p>
                        </Link>
                      ))
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
