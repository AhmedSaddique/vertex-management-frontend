"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { dateInput, money } from "@/lib/format";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export interface PayoutTeacherOption {
  id: string;
  name: string;
  balance: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teachers: PayoutTeacherOption[];
  /** Lock the dialog to one teacher (e.g. on the teacher detail page). */
  teacherId?: string;
}

export function PayoutDialog({ open, onClose, onSaved, teachers, teacherId }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState(teacherId ?? "");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(teacherId ?? teachers[0]?.id ?? "");
    setAmount("");
    setPaidAt(dateInput());
    setNote("");
  }, [open, teacherId, teachers]);

  const teacher = teachers.find((t) => t.id === selected);
  const amt = Number(amount) || 0;
  const exceeds = teacher ? amt > teacher.balance : false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || amt <= 0) return;
    setSaving(true);
    try {
      await api("/payouts", {
        method: "POST",
        body: { teacherId: selected, amount: amt, note: note || null, paidAt: new Date(paidAt).toISOString() },
      });
      toast.success("Payout recorded", `${money(amt)} paid to ${teacher?.name ?? "teacher"}.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not record payout", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Pay teacher"
      description="Record money handed to a teacher. It is deducted from their payable balance."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="payout-form" type="submit" loading={saving} disabled={!selected || amt <= 0}>Save payout</Button>
        </>
      }
    >
      <form id="payout-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teacher" required className="sm:col-span-2">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={!!teacherId} required>
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} · balance {money(t.balance)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Amount" required>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required />
          </Field>
          <Field label="Date"><Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></Field>
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. August salary, advance" /></Field>
        </div>
        {teacher && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between py-1"><span className="text-slate-500">Current payable balance</span><span className="font-medium text-slate-900">{money(teacher.balance)}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500">Balance after payout</span><span className={`font-semibold ${exceeds ? "text-rose-600" : "text-slate-900"}`}>{money(teacher.balance - amt)}</span></div>
            {exceeds && <p className="mt-2 text-xs text-amber-700">This is more than the teacher has earned so far. It will be recorded as an advance (negative balance).</p>}
            {teacher.balance > 0 && (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setAmount(String(teacher.balance))}>Pay full balance ({money(teacher.balance)})</Button>
            )}
          </div>
        )}
      </form>
    </Dialog>
  );
}
