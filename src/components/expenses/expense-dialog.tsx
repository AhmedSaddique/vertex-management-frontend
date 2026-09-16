"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { dateInput } from "@/lib/format";
import type { Expense } from "@/lib/types";
import { Button, Field, Input, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  expense?: Expense | null;
  categories: string[];
}

export function ExpenseDialog({ open, onClose, onSaved, expense, categories }: Props) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [spentAt, setSpentAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(expense?.title ?? "");
    setCategory(expense?.category ?? "");
    setAmount(expense ? String(expense.amount) : "");
    setSpentAt(dateInput(expense?.spentAt));
    setNote(expense?.note ?? "");
  }, [open, expense]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { title, category: category || null, amount: Number(amount), spentAt: new Date(spentAt).toISOString(), note: note || null };
      if (expense) await api(`/expenses/${expense.id}`, { method: "PUT", body });
      else await api("/expenses", { method: "POST", body });
      toast.success(expense ? "Expense updated" : "Expense added");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not save expense", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={expense ? "Edit expense" : "Add expense"}
      description="Company running costs. They are deducted from the company share."
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button form="expense-form" type="submit" loading={saving}>{expense ? "Save" : "Add expense"}</Button></>}
    >
      <form id="expense-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required className="sm:col-span-2"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office rent, Internet, Marketing" required autoFocus /></Field>
          <Field label="Amount" required><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
          <Field label="Date"><Input type="date" value={spentAt} onChange={(e) => setSpentAt(e.target.value)} /></Field>
          <Field label="Category" hint="Free text; existing categories are suggested." className="sm:col-span-2">
            <Input list="expense-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Rent, Utilities, Marketing..." />
            <datalist id="expense-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      </form>
    </Dialog>
  );
}
