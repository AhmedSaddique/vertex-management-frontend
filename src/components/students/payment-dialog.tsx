"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { addDays, date, dateInput, money, percent } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export interface PaymentDialogStudent {
  id: string;
  name: string;
  remaining: number;
  shares: { partnerName: string; percent: number }[];
}

export interface PaymentDialogInstallment {
  id: string;
  dueDate: string;
  remaining: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  student: PaymentDialogStudent;
  /** When set, the payment is applied to this promised installment. */
  installment?: PaymentDialogInstallment | null;
}

export function PaymentDialog({ open, onClose, onSaved, student, installment }: Props) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidAt, setPaidAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(installment ? String(installment.remaining) : "");
    setMethod("CASH");
    setPaidAt(dateInput());
    setNote("");
    setNextDueDate(addDays(new Date(), 4));
  }, [open, installment]);

  const amt = Number(amount) || 0;
  const over = amt > student.remaining;
  const split = student.shares.map((s) => ({ ...s, amount: Math.round(((amt * s.percent) / 100) * 100) / 100 }));
  const partnerTotal = Math.round(split.reduce((a, s) => a + s.amount, 0) * 100) / 100;
  const shortfall = installment ? Math.round((installment.remaining - amt) * 100) / 100 : 0;
  const partial = !!installment && amt > 0 && shortfall > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amt <= 0 || over) return;
    setSaving(true);
    try {
      await api("/payments", {
        method: "POST",
        body: {
          studentId: student.id,
          amount: amt,
          method,
          note: note || null,
          paidAt: new Date(paidAt).toISOString(),
          installmentId: installment?.id ?? null,
          nextDueDate: partial && nextDueDate ? new Date(nextDueDate).toISOString() : null,
        },
      });
      toast.success(
        "Payment recorded",
        `${money(amt)} received from ${student.name}.${partial && nextDueDate ? ` Remaining ${money(shortfall)} moved to ${date(nextDueDate)}.` : ""}`,
      );
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not record payment", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Record fee payment"
      description={`${student.name} · remaining ${money(student.remaining)}${installment ? ` · installment due ${date(installment.dueDate)} (${money(installment.remaining)})` : ""}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="payment-form" type="submit" loading={saving} disabled={amt <= 0 || over}>Save payment</Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required error={over ? `Cannot exceed remaining ${money(student.remaining)}` : null}>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required />
          </Field>
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="ONLINE">Online</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Payment date"><Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></Field>
          {partial ? (
            <Field label={`Next date for remaining ${money(shortfall)}`} hint="Ask the student when they will pay the rest.">
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </Field>
          ) : (
            <div />
          )}
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional reference or remark" /></Field>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          {split.map((s) => (
            <div key={s.partnerName} className="flex justify-between py-0.5"><span className="text-slate-500">{s.partnerName} ({percent(s.percent)})</span><span className="font-medium text-amber-700">{money(s.amount)}</span></div>
          ))}
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Company</span><span className="font-medium text-emerald-700">{money(amt - partnerTotal)}</span></div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Remaining after payment</span><span className="font-semibold text-slate-900">{money(Math.max(0, student.remaining - amt))}</span></div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAmount(String(student.remaining))}>Pay full remaining ({money(student.remaining)})</Button>
      </form>
    </Dialog>
  );
}
