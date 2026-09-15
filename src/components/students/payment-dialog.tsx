"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { dateInput, money, percent } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  student: { id: string; name: string; remaining: number; commissionPercent: number; teacherName: string };
}

export function PaymentDialog({ open, onClose, onSaved, student }: Props) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidAt, setPaidAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const amt = Number(amount) || 0;
  const teacherShare = Math.round(((amt * student.commissionPercent) / 100) * 100) / 100;
  const over = amt > student.remaining;

  function reset() {
    setAmount("");
    setMethod("CASH");
    setPaidAt(dateInput());
    setNote("");
  }

  function close() {
    reset();
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amt <= 0 || over) return;
    setSaving(true);
    try {
      await api("/payments", {
        method: "POST",
        body: { studentId: student.id, amount: amt, method, note: note || null, paidAt: new Date(paidAt).toISOString() },
      });
      toast.success("Payment recorded", `${money(amt)} received from ${student.name}. ${student.teacherName} share ${money(teacherShare)}.`);
      reset();
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
      onClose={close}
      title="Record fee payment"
      description={`${student.name} · remaining ${money(student.remaining)}`}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={saving}>Cancel</Button>
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
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional reference or remark" /></Field>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between py-1"><span className="text-slate-500">{student.teacherName} share ({percent(student.commissionPercent)})</span><span className="font-medium text-brand-700">{money(teacherShare)}</span></div>
          <div className="flex justify-between py-1"><span className="text-slate-500">Company share</span><span className="font-medium text-emerald-700">{money(amt - teacherShare)}</span></div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Remaining after payment</span><span className="font-semibold text-slate-900">{money(Math.max(0, student.remaining - amt))}</span></div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setAmount(String(student.remaining))}>Pay full remaining ({money(student.remaining)})</Button>
      </form>
    </Dialog>
  );
}
