"use client";

import { Plus, Trash2 } from "lucide-react";
import { addDays, dateInput, daysUntil, money } from "@/lib/format";
import { Button, Input } from "@/components/ui/form";

export interface InstallmentValue {
  dueDate: string;
  amount: string;
  note: string;
}

interface Props {
  value: InstallmentValue[];
  onChange: (next: InstallmentValue[]) => void;
  finalPrice: number;
  enrolledAt: string;
}

export function installmentsTotal(value: InstallmentValue[]): number {
  return Math.round(value.reduce((s, v) => s + (Number(v.amount) || 0), 0) * 100) / 100;
}

/** Promised payment dates. Total should match the final price; collect within 15 days. */
export function InstallmentPlanEditor({ value, onChange, finalPrice, enrolledAt }: Props) {
  const total = installmentsTotal(value);
  const unplanned = Math.round((finalPrice - total) * 100) / 100;
  const over = total > finalPrice;
  const deadline = addDays(enrolledAt || dateInput(), 15);
  const late = value.some((v) => v.dueDate && v.dueDate > deadline);

  const update = (i: number, patch: Partial<InstallmentValue>) => onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = (amount?: number) => {
    const last = value[value.length - 1];
    onChange([...value, { dueDate: last ? addDays(last.dueDate, 4) : dateInput(), amount: amount !== undefined ? String(amount) : String(Math.max(0, unplanned)), note: "" }]);
  };
  const splitIn = (n: number) => {
    if (finalPrice <= 0) return;
    const base = Math.floor((finalPrice / n) * 100) / 100;
    const rows: InstallmentValue[] = [];
    let left = finalPrice;
    for (let i = 0; i < n; i++) {
      const amt = i === n - 1 ? Math.round(left * 100) / 100 : base;
      left = Math.round((left - amt) * 100) / 100;
      rows.push({ dueDate: addDays(enrolledAt || dateInput(), i * (n === 1 ? 0 : Math.floor(14 / (n - 1)))), amount: String(amt), note: "" });
    }
    onChange(rows);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => splitIn(1)} disabled={finalPrice <= 0}>Full amount today</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => splitIn(2)} disabled={finalPrice <= 0}>2 installments</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => splitIn(3)} disabled={finalPrice <= 0}>3 installments</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => add()}><Plus className="h-4 w-4" /> Add date</Button>
      </div>
      {value.length === 0 && <p className="text-sm text-slate-500">No dates yet. The student will show as "no plan" until you add one.</p>}
      <ul className="space-y-2">
        {value.map((v, i) => {
          const d = v.dueDate ? daysUntil(v.dueDate) : 0;
          return (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2 sm:flex-nowrap">
              <span className="w-6 text-center text-xs font-semibold text-slate-400">{i + 1}</span>
              <Input type="date" value={v.dueDate} onChange={(e) => update(i, { dueDate: e.target.value })} className="w-40" />
              <Input type="number" min={0} step="0.01" value={v.amount} onChange={(e) => update(i, { amount: e.target.value })} placeholder="Amount" className="w-32" />
              <Input value={v.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="Note (optional)" className="min-w-[120px] flex-1" />
              <span className={`w-24 shrink-0 text-xs ${v.dueDate && v.dueDate > deadline ? "text-amber-600" : "text-slate-500"}`}>{v.dueDate ? (d === 0 ? "Today" : d > 0 ? `In ${d} days` : `${-d} days ago`) : ""}</span>
              <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove"><Trash2 className="h-4 w-4" /></button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-600">Planned {money(total)} of {money(finalPrice)}</span>
        {over ? (
          <span className="font-medium text-rose-600">Plan exceeds the final price by {money(total - finalPrice)}</span>
        ) : unplanned > 0 ? (
          <span className="font-medium text-amber-700">{money(unplanned)} not scheduled yet</span>
        ) : (
          <span className="font-medium text-emerald-700">Fully scheduled</span>
        )}
      </div>
      {late && <p className="text-xs text-amber-700">Some dates are more than 15 days after enrollment. Courses finish in 30-40 days, so fees should be collected within 15 days.</p>}
    </div>
  );
}
