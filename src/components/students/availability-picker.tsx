"use client";

import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { slotKey, slotKeyLabel, time12 } from "@/lib/format";
import type { TimeSlot } from "@/lib/types";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`;

/** Pick the fixed time slots a student is free for. Slots come from Settings. */
export function AvailabilityPicker({ value, onChange }: Props) {
  const q = useFetch(() => api<{ slots: TimeSlot[] }>("/settings/time-slots"), []);
  const slots = q.data?.slots ?? [];
  const toggle = (k: string) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  // Keys saved earlier that no longer match a configured slot stay visible so they can be removed.
  const extra = value.filter((k) => !slots.some((s) => slotKey(s.start, s.end) === k));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {slots.map((s) => {
        const k = slotKey(s.start, s.end);
        return (
          <button key={k} type="button" onClick={() => toggle(k)} className={chip(value.includes(k))}>
            {time12(s.start)} - {time12(s.end)}
          </button>
        );
      })}
      {extra.map((k) => (
        <button key={k} type="button" onClick={() => toggle(k)} className={chip(true)} title="Old slot, no longer in Settings">
          {slotKeyLabel(k)}
        </button>
      ))}
      {!q.data && !q.error && <span className="text-sm text-slate-400">Loading time slots...</span>}
      {q.data && slots.length === 0 && <span className="text-sm text-slate-500">No time slots configured yet. Add them in Settings.</span>}
      {value.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="text-xs text-slate-500 hover:text-slate-800">Clear</button>
      )}
    </div>
  );
}
