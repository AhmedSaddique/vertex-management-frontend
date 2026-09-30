"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { date, dateInput, money } from "@/lib/format";
import type { CompanyLoan } from "@/lib/types";
import { Button, Field, Input, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  loan: CompanyLoan;
}

/** Record money paid back into the company, or clear the whole balance at once. */
export function RepaymentDialog({ open, onClose, onSaved, loan }: Props) {
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount(String(loan.outstanding));
    setPaidAt(dateInput());
    setNote("");
  }, [open, loan]);

  const amt = Number(amount) || 0;
  const over = amt > loan.outstanding;
  const clears = amt >= loan.outstanding && loan.outstanding > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amt <= 0 || over) return;
    setSaving(true);
    try {
      await api(`/loans/${loan.id}/repayments`, {
        method: "POST",
        body: { amount: amt, paidAt: new Date(paidAt).toISOString(), note: note || null },
      });
      toast.success(clears ? "Loan cleared" : "Repayment recorded", clears ? `${loan.borrowerName} has paid everything back.` : `${money(amt)} returned, ${money(loan.outstanding - amt)} still outstanding.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not record the repayment", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeRepayment(id: string) {
    try {
      await api(`/loans/repayments/${id}`, { method: "DELETE" });
      toast.success("Repayment removed");
      onSaved();
    } catch (err) {
      toast.error("Could not remove the repayment", errorMessage(err));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Money paid back"
      description={`${loan.borrowerName} took ${money(loan.amount)} and has ${money(loan.outstanding)} still to pay back.`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="repay-form" type="submit" loading={saving} disabled={amt <= 0 || over}>{clears ? "Clear the loan" : "Record repayment"}</Button>
        </>
      }
    >
      <form id="repay-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount returned" required error={over ? `More than the ${money(loan.outstanding)} outstanding` : null}>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required />
          </Field>
          <Field label="Date"><Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></Field>
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>

        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Taken</span><span className="font-medium text-slate-900">{money(loan.amount)}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Paid back so far</span><span className="font-medium text-emerald-700">{money(loan.repaid)}</span></div>
          <div className="mt-1 flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500">Outstanding after this</span>
            <span className="font-semibold text-slate-900">{money(Math.max(0, loan.outstanding - amt))}</span>
          </div>
        </div>

        {loan.repayments.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-900">Earlier repayments</p>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {loan.repayments.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="w-28 text-slate-500">{date(r.paidAt)}</span>
                  <span className="font-medium text-slate-900">{money(r.amount)}</span>
                  <span className="flex-1 truncate text-xs text-slate-400">{r.note ?? ""}</span>
                  <button type="button" onClick={() => void removeRepayment(r.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Dialog>
  );
}
