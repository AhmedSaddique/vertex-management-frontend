"use client";

import { WEEKDAYS, WEEKDAY_LABEL, todayWeekday } from "@/lib/format";
import type { ClassSlot } from "@/lib/types";
import { Badge } from "@/components/ui/display";
import { SlotCard } from "./slot-card";

/** One column per weekday with the classes of that day listed by time. */
export function ScheduleDayColumns({ slots }: { slots: ClassSlot[] }) {
  const today = todayWeekday();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {WEEKDAYS.map((day) => {
        const items = slots.filter((s) => s.days.includes(day));
        const isToday = day === today;
        return (
          <div key={day} className={`rounded-xl border p-3 ${isToday ? "border-brand-300 bg-brand-50/40" : "border-slate-200 bg-slate-50/60"}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${isToday ? "text-brand-700" : "text-slate-700"}`}>{WEEKDAY_LABEL[day]}</h3>
              {isToday ? <Badge tone="brand">Today</Badge> : <span className="text-xs text-slate-400">{items.length}</span>}
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">No classes</p>
              ) : (
                items.map((s) => <SlotCard key={s.id} slot={s} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
