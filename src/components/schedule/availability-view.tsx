"use client";

import Link from "next/link";
import { slotKey, timeRange } from "@/lib/format";
import type { ClassSlot, Student, TimeSlot } from "@/lib/types";
import { Badge, Card, CardHeader } from "@/components/ui/display";

interface Props {
  students: Student[];
  classes: ClassSlot[];
  presets: TimeSlot[];
}

/** Which students are free at each time slot, and who is already placed in a class then. */
export function AvailabilityView({ students, classes, presets }: Props) {
  const placedAt = new Map<string, Set<string>>();
  for (const c of classes) {
    const k = slotKey(c.startTime, c.endTime);
    const set = placedAt.get(k) ?? new Set<string>();
    c.students.forEach((s) => set.add(s.id));
    placedAt.set(k, set);
  }
  const active = students.filter((s) => s.status === "ACTIVE");
  const noAvailability = active.filter((s) => !s.availableSlots?.length);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Student availability by time slot"
          description="Active students who can attend each slot. Free = not yet in a class at that time, Placed = already in one."
        />
        <div className="divide-y divide-slate-100">
          {presets.map((p) => {
            const k = slotKey(p.start, p.end);
            const list = active.filter((s) => s.availableSlots?.includes(k));
            const placed = placedAt.get(k) ?? new Set<string>();
            const freeCount = list.filter((s) => !placed.has(s.id)).length;
            return (
              <div key={k} className="flex flex-col gap-3 px-5 py-4 sm:flex-row">
                <div className="w-48 shrink-0">
                  <p className="text-sm font-semibold text-slate-900">{timeRange(p.start, p.end)}</p>
                  <p className="text-xs text-slate-500">{list.length} available · {freeCount} free · {list.length - freeCount} placed</p>
                </div>
                <div className="flex flex-1 flex-wrap gap-2">
                  {list.length === 0 && <span className="text-sm text-slate-400">No students available</span>}
                  {list.map((s) => {
                    const isPlaced = placed.has(s.id);
                    return (
                      <Link
                        key={s.id}
                        href={`/students/${s.id}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs hover:shadow-sm ${isPlaced ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                      >
                        <span className="font-medium text-slate-900">{s.name}</span>
                        <span className="text-slate-500">{s.phone} · {s.subject.name}</span>
                        <Badge tone={isPlaced ? "success" : "warning"}>{isPlaced ? "Placed" : "Free"}</Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {presets.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No time slots configured. Add them in Settings.</p>}
        </div>
      </Card>

      {noAvailability.length > 0 && (
        <Card>
          <CardHeader
            title={`${noAvailability.length} active student${noAvailability.length === 1 ? "" : "s"} without availability`}
            description="Open the student and tick the time slots they can attend."
          />
          <div className="flex flex-wrap gap-2 p-5">
            {noAvailability.map((s) => (
              <Link key={s.id} href={`/students/${s.id}/edit`} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                {s.name} · {s.phone}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
