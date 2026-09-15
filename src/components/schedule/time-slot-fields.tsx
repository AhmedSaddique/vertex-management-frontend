"use client";

import { useState } from "react";
import { time12 } from "@/lib/format";
import type { TimeSlot } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/form";

interface Props {
  slots: TimeSlot[];
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  endError?: string | null;
}

/** Pick one of the fixed time slots, or switch to a custom start/end time. */
export function TimeSlotFields({ slots, start, end, onChange, endError }: Props) {
  const [custom, setCustom] = useState(false);
  const matchIdx = slots.findIndex((s) => s.start === start && s.end === end);
  const value = custom || matchIdx < 0 ? "custom" : String(matchIdx);

  return (
    <>
      <Field label="Time slot" required className="sm:col-span-2" hint="Fixed slots come from Settings. Choose Custom to type any time.">
        <Select
          value={value}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setCustom(true);
              return;
            }
            setCustom(false);
            const s = slots[Number(e.target.value)];
            if (s) onChange(s.start, s.end);
          }}
        >
          {slots.map((s, i) => (
            <option key={`${s.start}-${s.end}`} value={i}>{time12(s.start)} - {time12(s.end)}</option>
          ))}
          <option value="custom">Custom time</option>
        </Select>
      </Field>
      <Field label="Start time" required>
        <Input type="time" value={start} onChange={(e) => onChange(e.target.value, end)} required />
      </Field>
      <Field label="End time" required error={endError}>
        <Input type="time" value={end} onChange={(e) => onChange(start, e.target.value)} required />
      </Field>
    </>
  );
}
