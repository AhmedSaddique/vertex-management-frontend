"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { dateInput, money } from "@/lib/format";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export interface PayoutPartnerOption {
  id: string;
  name: string;
  balance: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  partners: PayoutPartnerOption[];
  /** Lock the dialog to one partner (e.g. on the partner page). */
  partnerId?: string;
}

export function PayoutDialog({ open, onClose, onSaved, partners, partnerId }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState(partnerId ?? "");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(partnerId ?? partners[0]?.id ?? "");
    setAmount("");
    setPaidAt(dateInput());
    setNote("");
  }, [open, partnerId, partners]);

  const partner = partners.find((p) => p.id === selected);
  const amt = Number(amount) || 0;
  const exceeds = partner ? amt > partner.balance : false;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || amt <= 0) return;
    setSaving(true);
    try {
      await api("/payouts", { method: "POST", body: { partnerId: selected, amount: amt, note: note || null, paidAt: new Date(paidAt).toISOString() } });
      toast.success("Payout recorded", `${money(amt)} paid to ${partner?.name ?? "partner"}.`);
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
      title="Pay partner"
      description="Record money handed to a partner. It is deducted from their payable balance."
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button form="payout-form" type="submit" loading={saving} disabled={!selected || amt <= 0}>Save payout</Button></>}
    >
      <form id="payout-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Partner" required className="sm:col-span-2">
            <Select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={!!partnerId} required>
              <option value="">Select partner</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name} · balance {money(p.balance)}</option>)}
            </Select>
          </Field>
          <Field label="Amount" required><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required /></Field>
          <Field label="Date"><Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></Field>
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. September share, advance" /></Field>
        </div>
        {partner && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between py-1"><span className="text-slate-500">Current payable balance</span><span className="font-medium text-slate-900">{money(partner.balance)}</span></div>
            <div className="flex justify-between py-1"><span className="text-slate-500">Balance after payout</span><span className={`font-semibold ${exceeds ? "text-rose-600" : "text-slate-900"}`}>{money(partner.balance - amt)}</span></div>
            {exceeds && <p className="mt-2 text-xs text-amber-700">More than earned so far. It will be recorded as an advance (negative balance).</p>}
            {partner.balance > 0 && <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setAmount(String(partner.balance))}>Pay full balance ({money(partner.balance)})</Button>}
          </div>
        )}
      </form>
    </Dialog>
  );
}
