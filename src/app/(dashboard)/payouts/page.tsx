"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { date, money } from "@/lib/format";
import type { Partner, Payout } from "@/lib/types";
import { Button, Select } from "@/components/ui/form";
import { Badge, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Stat, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { PayoutDialog } from "@/components/teachers/payout-dialog";

export default function PayoutsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [partnerId, setPartnerId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const partners = useFetch(() => api<Partner[]>("/partners"), []);
  const list = useFetch(() => api<Payout[]>("/payouts", { query: { partnerId } }), [partnerId]);

  const rows = list.data ?? [];
  const total = rows.reduce((s, p) => s + p.amount, 0);
  const owed = (partners.data ?? []).reduce((s, p) => s + p.totals.balance, 0);
  const earned = (partners.data ?? []).reduce((s, p) => s + p.totals.earnedShare, 0);

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/payouts/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast.success("Payout deleted");
      await Promise.all([list.reload(), partners.reload()]);
    } catch (err) {
      toast.error("Could not delete payout", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Partner payouts" : "My payouts"}
        description={isAdmin ? "Money handed to partners against their earned share." : "Money you have received against your earned share."}
        actions={isAdmin && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Pay partner</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label={isAdmin ? "Total earned by partners" : "Total earned"} value={money(earned)} tone="warning" />
        <Stat label={isAdmin ? "Total paid out" : "Total received"} value={money(total)} tone="success" hint={`${rows.length} payout${rows.length === 1 ? "" : "s"}${partnerId ? " (filtered)" : ""}`} />
        <Stat label={isAdmin ? "Still owed to partners" : "Still payable to you"} value={money(owed)} tone={owed > 0 ? "brand" : "neutral"} />
      </div>

      <Card>
        {isAdmin && (
          <div className="border-b border-slate-100 p-4">
            <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="sm:w-56">
              <option value="">All partners</option>
              {partners.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
        )}
        {list.loading && !list.data ? <LoadingBlock /> : list.error ? <ErrorBlock message={list.error} onRetry={list.reload} /> : rows.length === 0 ? (
          <EmptyState title="No payouts recorded" description={isAdmin ? "Use Pay partner to record money given to a partner." : undefined} />
        ) : (
          <Table>
            <THead><TR><TH>Date</TH><TH>Partner</TH><TH className="text-right">Amount</TH><TH>Note</TH>{isAdmin && <TH />}</TR></THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
                  <TD>
                    {isAdmin ? <Link href={`/partners/${p.partnerId}`} className="font-medium text-slate-900 hover:text-brand-700">{p.partner?.name}</Link> : <span className="font-medium text-slate-900">{p.partner?.name}</span>}
                    {p.partner && <Badge className="ml-2" tone={p.partner.kind === "TEACHER" ? "brand" : "neutral"}>{p.partner.kind === "TEACHER" ? "Teacher" : "Management"}</Badge>}
                  </TD>
                  <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
                  <TD className="max-w-[260px] truncate text-slate-500">{p.note || "-"}</TD>
                  {isAdmin && <TD className="text-right"><button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteId(p.id)} title="Delete"><Trash2 className="h-4 w-4" /></button></TD>}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {isAdmin && (
        <>
          <PayoutDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={() => { void list.reload(); void partners.reload(); }} partners={(partners.data ?? []).filter((p) => p.isActive).map((p) => ({ id: p.id, name: p.name, balance: p.totals.balance }))} />
          <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete payout?" description="The amount will be added back to the partner payable balance." confirmLabel="Delete" danger loading={busy} />
        </>
      )}
    </div>
  );
}
