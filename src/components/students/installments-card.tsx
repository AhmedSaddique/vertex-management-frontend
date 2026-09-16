"use client";

import { useState } from "react";
import { CalendarPlus, Pencil, Trash2, Wallet } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { INSTALLMENT_LABEL, date, dateInput, dueLabel, money } from "@/lib/format";
import type { Installment, StudentDetail } from "@/lib/types";
import { Button, Field, Input } from "@/components/ui/form";
import { Badge, Card, CardHeader, EmptyState } from "@/components/ui/display";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Props {
  student: StudentDetail;
  isAdmin: boolean;
  onChanged: () => void;
  onPay: (installment: Installment) => void;
}

export function statusTone(status: Installment["status"]): "success" | "warning" | "danger" | "info" {
  return status === "PAID" ? "success" : status === "OVERDUE" ? "danger" : status === "PARTIAL" ? "warning" : "info";
}

/** Promised fee dates for one student, with add / edit / delete and "Collect". */
export function InstallmentsCard({ student: s, isAdmin, onChanged, onPay }: Props) {
  const toast = useToast();
  const [editing, setEditing] = useState<Installment | "new" | null>(null);
  const [dueDate, setDueDate] = useState(dateInput());
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const planned = s.installments.reduce((a, i) => a + i.amount, 0);
  const unplanned = Math.round((s.finalPrice - planned) * 100) / 100;

  function openForm(target: Installment | "new") {
    setEditing(target);
    setDueDate(target === "new" ? dateInput() : dateInput(target.dueDate));
    setAmount(target === "new" ? String(Math.max(0, unplanned)) : String(target.amount));
    setNote(target === "new" ? "" : target.note ?? "");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { dueDate: new Date(dueDate).toISOString(), amount: Number(amount), note: note || null };
      if (editing === "new") await api("/installments", { method: "POST", body: { ...body, studentId: s.id } });
      else if (editing) await api(`/installments/${editing.id}`, { method: "PUT", body });
      toast.success(editing === "new" ? "Due date added" : "Due date updated");
      setEditing(null);
      onChanged();
    } catch (err) {
      toast.error("Could not save due date", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/installments/${deleteId}`, { method: "DELETE" });
      toast.success("Due date removed");
      setDeleteId(null);
      onChanged();
    } catch (err) {
      toast.error("Could not remove due date", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Fee due dates"
        description={unplanned > 0 ? `${money(unplanned)} of the fee has no date yet.` : s.installments.length ? "Whole fee is scheduled." : "No payment plan yet."}
        action={isAdmin ? <Button size="sm" variant="outline" onClick={() => openForm("new")}><CalendarPlus className="h-4 w-4" /> Add date</Button> : undefined}
      />
      {s.installments.length === 0 ? (
        <EmptyState title="No due dates" description={isAdmin ? "Add the dates the student promised to pay on." : undefined} />
      ) : (
        <ul className="divide-y divide-slate-100">
          {s.installments.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-[130px]">
                <p className="text-sm font-medium text-slate-900">{date(i.dueDate)}</p>
                <p className={`text-xs ${i.status === "OVERDUE" ? "text-rose-600" : "text-slate-500"}`}>{i.status === "PAID" ? "Paid" : dueLabel(i.dueDate)}</p>
              </div>
              <div className="min-w-[120px] flex-1">
                <p className="text-sm text-slate-900">
                  {money(i.amount)}
                  {i.paidAmount > 0 && i.status !== "PAID" && <span className="text-xs text-slate-500"> · paid {money(i.paidAmount)}</span>}
                </p>
                {i.note && <p className="truncate text-xs text-slate-400">{i.note}</p>}
              </div>
              <Badge tone={statusTone(i.status)}>{INSTALLMENT_LABEL[i.status]}{i.status !== "PAID" && i.remaining !== i.amount ? ` · ${money(i.remaining)} left` : ""}</Badge>
              {isAdmin && i.status !== "PAID" && (
                <Button size="sm" onClick={() => onPay(i)} disabled={s.remaining <= 0}><Wallet className="h-4 w-4" /> Collect</Button>
              )}
              {isAdmin && (
                <div className="flex gap-1">
                  <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => openForm(i)} title="Edit"><Pencil className="h-4 w-4" /></button>
                  {i.paidAmount === 0 && (
                    <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteId(i.id)} title="Remove"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add due date" : "Edit due date"}
        size="sm"
        footer={<><Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button form="inst-form" type="submit" loading={busy}>{editing === "new" ? "Add" : "Save"}</Button></>}
      >
        <form id="inst-form" onSubmit={save} className="space-y-4">
          <Field label="Due date" required><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required /></Field>
          <Field label="Amount" required hint={`Remaining fee ${money(s.remaining)}`}><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></Field>
          <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
        </form>
      </Dialog>
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={remove} title="Remove due date?" description="Only the promised date is removed. Payments are not affected." confirmLabel="Remove" danger loading={busy} />
    </Card>
  );
}
