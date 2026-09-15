"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { time12 } from "@/lib/format";
import type { TimeSlot } from "@/lib/types";
import { Button, Input } from "@/components/ui/form";
import { Card, CardHeader, LoadingBlock } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Admin editor for the fixed class time slots shown on the timetable. */
export function TimeSlotsCard() {
  const toast = useToast();
  const q = useFetch(() => api<{ slots: TimeSlot[] }>("/settings/time-slots"), []);
  const [slots, setSlots] = useState<TimeSlot[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.data && slots === null) setSlots(q.data.slots);
  }, [q.data, slots]);

  const rows = slots ?? [];
  const invalid = rows.some((s) => !s.start || !s.end || s.end <= s.start);

  const update = (i: number, patch: Partial<TimeSlot>) =>
    setSlots((prev) => (prev ?? []).map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => setSlots((prev) => (prev ?? []).filter((_, idx) => idx !== i));
  const add = () => {
    const last = rows[rows.length - 1];
    const start = last ? last.end : "15:00";
    setSlots([...rows, { start, end: addMinutes(start, 90) }]);
  };

  async function save() {
    if (invalid || rows.length === 0) return;
    setSaving(true);
    try {
      const res = await api<{ slots: TimeSlot[] }>("/settings/time-slots", { method: "PUT", body: { slots: rows } });
      setSlots(res.slots);
      toast.success("Time slots saved", `${res.slots.length} slots on the timetable.`);
    } catch (err) {
      toast.error("Could not save time slots", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Class time slots"
        description="Fixed slots used on the timetable grid and when adding a class, e.g. 3:00 PM - 4:30 PM."
        action={<Button size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4" /> Add slot</Button>}
      />
      {slots === null ? (
        <LoadingBlock />
      ) : (
        <div className="p-5">
          <ul className="space-y-2">
            {rows.map((s, i) => {
              const bad = s.end <= s.start;
              return (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2 sm:flex-nowrap">
                  <span className="w-8 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
                  <Input type="time" value={s.start} onChange={(e) => update(i, { start: e.target.value })} className="w-32" />
                  <span className="text-slate-400">to</span>
                  <Input type="time" value={s.end} onChange={(e) => update(i, { end: e.target.value })} className={`w-32 ${bad ? "border-rose-400" : ""}`} />
                  <span className="flex-1 truncate text-sm text-slate-600">{s.start && s.end ? `${time12(s.start)} - ${time12(s.end)}` : ""}{bad && <span className="ml-2 text-xs text-rose-600">End must be after start</span>}</span>
                  <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove slot"><Trash2 className="h-4 w-4" /></button>
                </li>
              );
            })}
            {rows.length === 0 && <li className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No slots. Add at least one.</li>}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} loading={saving} disabled={invalid || rows.length === 0}>Save time slots</Button>
            <span className="text-xs text-slate-500">Existing classes keep their own times; slots only help when adding new classes.</span>
          </div>
        </div>
      )}
    </Card>
  );
}
