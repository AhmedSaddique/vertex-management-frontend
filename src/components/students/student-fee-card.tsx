"use client";

import { money, percent } from "@/lib/format";
import { Field, Input } from "@/components/ui/form";
import { Card, CardHeader } from "@/components/ui/display";
import { finalPriceOf, type StudentFormValues } from "./student-form-values";
import { sharesTotal } from "./share-split-editor";

interface Props {
  v: StudentFormValues;
  set: <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => void;
}

export function feeInvalid(v: StudentFormValues) {
  return (Number(v.discount) || 0) > (Number(v.fee) || 0);
}

export function StudentFeeCard({ v, set }: Props) {
  const finalPrice = finalPriceOf(v);
  const partnersPct = sharesTotal(v.shares);
  const partnersAmt = Math.round(((finalPrice * partnersPct) / 100) * 100) / 100;

  return (
    <Card>
      <CardHeader title="Fee" description="Final price = fee minus discount." />
      <div className="space-y-4 p-5">
        <Field label="Course fee" required>
          <Input type="number" min={0} step="0.01" value={v.fee} onChange={(e) => set("fee", e.target.value)} required />
        </Field>
        <Field label="Discount (amount)" hint="Money off the fee, e.g. 5000 or 2000." error={feeInvalid(v) ? "Discount cannot exceed the fee" : null}>
          <Input type="number" min={0} step="0.01" value={v.discount} onChange={(e) => set("discount", e.target.value)} />
        </Field>
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Final price</span>
            <span className="font-semibold text-slate-900">{money(finalPrice)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Partners ({percent(partnersPct)})</span>
            <span className="font-medium text-amber-700">{money(partnersAmt)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Company ({percent(100 - partnersPct)})</span>
            <span className="font-medium text-emerald-700">{money(finalPrice - partnersAmt)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
