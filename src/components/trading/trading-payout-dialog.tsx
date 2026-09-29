"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { dateInput, money, percent as pct } from "@/lib/format";
import type { Partner, TradingDefaults, TradingPayout } from "@/lib/types";
import { Button, Field, Input, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ShareSplitEditor, sharesTotal, type ShareValue } from "@/components/students/share-split-editor";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  payout?: TradingPayout | null;
}

/** Record trading income and split it between the members and the company. */
export function TradingPayoutDialog({ open, onClose, onSaved, payout }: Props) {
  const toast = useToast();
  const partners = useFetch(() => (open ? api<Partner[]>("/partners") : Promise.resolve(null)), [open]);
  const defaults = useFetch(() => (open ? api<TradingDefaults>("/trading/defaults") : Promise.resolve(null)), [open]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(dateInput());
  const [note, setNote] = useState("");
  const [shares, setShares] = useState<ShareValue[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(payout?.title ?? "");
    setAmount(payout ? String(payout.amount) : "");
    setOccurredAt(dateInput(payout?.occurredAt));
    setNote(payout?.note ?? "");
    if (payout) setShares(payout.shares.map((s) => ({ partnerId: s.partnerId, percent: String(s.percent) })));
  }, [open, payout]);

  // A new payout starts from the saved default split.
  useEffect(() => {
    if (!open || payout || !defaults.data) return;
    setShares(defaults.data.shares.map((s) => ({ partnerId: s.partnerId, percent: String(s.percent) })));
  }, [open, payout, defaults.data]);

  const amt = Number(amount) || 0;
  const partnerPct = sharesTotal(shares);
  const over = partnerPct > 100;
  const preview = shares
    .map((s) => ({
      name: partners.data?.find((p) => p.id === s.partnerId)?.name ?? "",
      percent: Number(s.percent) || 0,
      amount: Math.round(((amt * (Number(s.percent) || 0)) / 100) * 100) / 100,
    }))
    .filter((p) => p.percent > 0);
  const companyAmount = Math.round((amt - preview.reduce((a, p) => a + p.amount, 0)) * 100) / 100;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amt <= 0 || over) return;
    setSaving(true);
    try {
      const body = {
        title: title || null,
        amount: amt,
        occurredAt: new Date(occurredAt).toISOString(),
        note: note || null,
        shares: shares.map((s) => ({ partnerId: s.partnerId, percent: Number(s.percent) || 0 })).filter((s) => s.percent > 0),
      };
      if (payout) await api(`/trading/${payout.id}`, { method: "PUT", body });
      else await api("/trading", { method: "POST", body });
      toast.success(payout ? "Trading payout updated" : "Trading payout recorded", `${money(amt)} split between the members and the company.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Could not save trading payout", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={payout ? "Edit trading payout" : "Record trading payout"}
      description="Trading income. Each member takes their percentage and the company keeps the rest."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="trading-form" type="submit" loading={saving} disabled={amt <= 0 || over}>{payout ? "Save changes" : "Record payout"}</Button>
        </>
      }
    >
      <form id="trading-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
            <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus required />
          </Field>
          <Field label="Date"><Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} /></Field>
          <Field label="Title" hint="Optional, e.g. Week 39 trading" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Week 39 trading" />
          </Field>
          <Field label="Note" className="sm:col-span-2"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>

        <Field label="Split" hint="Starts from the saved default. Change any member; the remainder stays with the company.">
          <ShareSplitEditor partners={partners.data ?? []} value={shares} onChange={setShares} />
        </Field>

        {amt > 0 && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            {preview.map((p) => (
              <div key={p.name} className="flex justify-between py-0.5">
                <span className="text-slate-500">{p.name} ({pct(p.percent)})</span>
                <span className="font-medium text-amber-700">{money(p.amount)}</span>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-500">Company ({pct(100 - partnerPct)})</span>
              <span className="font-semibold text-emerald-700">{money(companyAmount)}</span>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
