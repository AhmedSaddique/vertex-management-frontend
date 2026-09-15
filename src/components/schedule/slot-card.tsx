"use client";

import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";
import { daysLabel, timeRange } from "@/lib/format";
import type { ClassSlot } from "@/lib/types";
import { Badge } from "@/components/ui/display";

export function slotTitle(slot: { title: string | null; subject: { name: string } }): string {
  return slot.title || `${slot.subject.name} class`;
}

export function SlotCard({ slot, showDays }: { slot: ClassSlot; showDays?: boolean }) {
  return (
    <Link
      href={`/schedule/${slot.id}`}
      className={`block rounded-lg border p-3 transition-shadow hover:shadow-md ${
        slot.isActive ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50 opacity-75"
      }`}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
        <Clock className="h-3.5 w-3.5" />
        {timeRange(slot.startTime, slot.endTime)}
      </p>
      <p className="mt-1 truncate font-medium text-slate-900">{slotTitle(slot)}</p>
      <p className="truncate text-xs text-slate-500">
        {slot.subject.name} · {slot.teacher.user.name}
      </p>
      {showDays && <p className="mt-1 text-xs text-slate-500">{daysLabel(slot.days)}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {slot.students.length} student{slot.students.length === 1 ? "" : "s"}
        </span>
        {slot.location && (
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{slot.location}</span>
          </span>
        )}
        {!slot.isActive && <Badge>Inactive</Badge>}
      </div>
    </Link>
  );
}
