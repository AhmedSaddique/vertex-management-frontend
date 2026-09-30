"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { dateInput, money } from "@/lib/format";
import type { CompanyLoan, Partner } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  loan?: CompanyLoan | null;
}

const OTHER = "__other__";

/** Record money someone takes out of the company, to be paid back later. */
export function LoanDialog({ open, onClose, onSaved, loan }: Props) {
  const toast = useToast();
  const partners = useFetch(() => (open ? api<Partner[]>("/partners") : Promise.resolve(null)), [open]);
  const [who, setWho] = useState("");
  const [otherName, setOtherName] = useState("");
  const [amount, setAmount] = useState("");
  const [takenAt, setTakenAt] = useState(dateInput());
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWho(loan?.partnerId ?? (loan ? OTHER : ""));
    setOtherName(loan && !loan.partnerId ? loan.borrowerName : "");
    setAmount(loan ? String(loan.amount) : "");
    setTakenAt(dateInput(loan?.takenAt));
    setReason(loan?.reason ?? "");
    setNote(loan?.note ?? "");
  }, [open, loan]);

  const amt = Number(amount) || 0;
  const isOther = who === OTHER;
  const tooLow = loan ? amt < loan.repaid : false;
  const valid = amt > 0 && !tooLow && (isOther ? otherName.trim().length > 0 : who.length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const body = {
        partnerId: isOther ? null : who,
        borrowerName: isOther ? otherName.trim() : undefined,
        amount: amt,
        takenAt: new Date(takenAt).toISOString(),
        reason: reason || null,
        note: note || null,
      };
      if (loan) await api(`/loans/${loan.id}`, { method: "PUT", body });
      else await api("/loans", { method: "POST", body });
      toast.success(loan ? "Loan updated" : "Loan recorded", `${money(amt)} taken from the company.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not save the loan", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={loan ? "Edit loan" : "Take money from the company"}
      description="Recorded as money owed back to the company. It lowers cash in hand until it is paid back, and is not an expense."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="loan-form" type="submit" loading={saving} disabled={!valid}>{loan ? "Save changes" : "Record loan"}</Button>
        </>
      }
    >
      <form id="loan-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Who is taking it" required className={isOther ? undefined : "sm:col-span-2"}>
            <Select value={who} onChange={(e) => setWho(e.target.value)} required>
              <option value="">Select</option>
              {partners.data?.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.kind === "TEACHER" ? "teacher" : "management"})</option>
              ))}
              <option value={OTHER}>Someone else</option>
            </Select>
          </Field>
          {isOther && (
            <Field label="Name" required>
              <Input value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Full name" required />
            </Field>
          )}
          <Field label="Amount" required error={tooLow ? `Cannot be less than the ${money(loan?.repaid ?? 0)} already paid back` : null}>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          <Field label="Date taken"><Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} /></Field>
          <Field label="Reason" hint="Optional, e.g. personal need, emergency" className="sm:col-span-2">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
      </form>
    </Dialog>
  );
}
