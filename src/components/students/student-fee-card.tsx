"use client";

import { money, percent } from "@/lib/format";
import type { Teacher } from "@/lib/types";
import { Field, Input } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/display";
import type { StudentFormValues } from "./student-form-values";

interface Props {
  v: StudentFormValues;
  set: <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => void;
  teacher?: Teacher;
}

export function feeInvalid(v: StudentFormValues) {
  return (Number(v.discount) || 0) > (Number(v.fee) || 0);
}

export function StudentFeeCard({ v, set, teacher }: Props) {
  const fee = Number(v.fee) || 0;
  const discount = Number(v.discount) || 0;
  const pct = Number(v.commissionPercent) || 0;
  const finalPrice = Math.max(0, fee - discount);
  const teacherShare = Math.round(((finalPrice * pct) / 100) * 100) / 100;

  return (
    <Card>
      <CardHeader title="Fee" description="Final price = fee minus discount." />
      <div className="space-y-4 p-5">
        <Field label="Course fee" required>
          <Input type="number" min={0} step="0.01" value={v.fee} onChange={(e) => set("fee", e.target.value)} required />
        </Field>
        <Field label="Discount (amount)" hint="Money off the fee, e.g. 5000 or 2000. Final price = fee - discount." error={feeInvalid(v) ? "Discount cannot exceed the fee" : null}>
          <Input type="number" min={0} step="0.01" value={v.discount} onChange={(e) => set("discount", e.target.value)} />
        </Field>
        <Field label="Teacher share (%)" hint={teacher ? `Default for ${teacher.user.name} is ${percent(teacher.defaultCommissionPercent)}` : undefined}>
          <Input type="number" min={0} max={100} step="0.01" value={v.commissionPercent} onChange={(e) => set("commissionPercent", e.target.value)} />
        </Field>
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Final price</span>
            <span className="font-semibold text-slate-900">{money(finalPrice)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Teacher share ({percent(pct)})</span>
            <span className="font-medium text-brand-700">{money(teacherShare)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Company share</span>
            <span className="font-medium text-emerald-700">{money(finalPrice - teacherShare)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
