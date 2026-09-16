"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { HandCoins, Pencil } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { PartnerSummary } from "@/lib/types";
import { Button, Field, Input } from "@/components/ui/form";
import { Badge, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { PartnerEarnings } from "@/components/partners/partner-earnings";
import { PartnerLedgers } from "@/components/partners/partner-ledgers";
import { PayoutDialog } from "@/components/teachers/payout-dialog";

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const q = useFetch(() => api<PartnerSummary>(`/partners/${params.id}/summary`), [params.id]);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [deletePayout, setDeletePayout] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const s = q.data;
  if (q.loading && !s) return <LoadingBlock />;
  if (q.error || !s) return <ErrorBlock message={q.error ?? "Partner not found"} onRetry={q.reload} />;
  const p = s.partner;

  async function savePartner(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/partners/${p.id}`, { method: "PUT", body: { name, isActive } });
      toast.success("Partner updated");
      setEditOpen(false);
      await q.reload();
    } catch (err) {
      toast.error("Could not update partner", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function removePayout() {
    if (!deletePayout) return;
    setBusy(true);
    try {
      await api(`/payouts/${deletePayout}`, { method: "DELETE" });
      setDeletePayout(null);
      toast.success("Payout deleted");
      await q.reload();
    } catch (err) {
      toast.error("Could not delete payout", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={p.name}
        description={`${p.kind === "TEACHER" ? "Teacher partner" : "Management partner"}${p.user ? ` · ${p.user.email}` : ""}`}
        backHref={isAdmin ? "/partners" : undefined}
        actions={
          <>
            <Badge tone={p.kind === "TEACHER" ? "brand" : "neutral"}>{p.kind === "TEACHER" ? "Teacher" : "Management"}</Badge>
            {!p.isActive && <Badge tone="danger">Inactive</Badge>}
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => setPayoutOpen(true)}><HandCoins className="h-4 w-4" /> Pay share</Button>
                <Button size="sm" variant="outline" onClick={() => { setName(p.name); setIsActive(p.isActive); setEditOpen(true); }}><Pencil className="h-4 w-4" /> Edit</Button>
              </>
            )}
          </>
        }
      />

      <div className="space-y-6">
        <PartnerEarnings summary={s} own={user?.partnerId === p.id} />
        <PartnerLedgers payouts={s.payouts} recentPayments={s.recentPayments} canDelete={isAdmin} onDeletePayout={setDeletePayout} />
      </div>

      {isAdmin && (
        <>
          <PayoutDialog open={payoutOpen} onClose={() => setPayoutOpen(false)} onSaved={q.reload} partnerId={p.id} partners={[{ id: p.id, name: p.name, balance: s.totals.balance }]} />
          <Dialog open={editOpen} onClose={() => setEditOpen(false)} title="Edit partner" size="sm"
            footer={<><Button variant="outline" onClick={() => setEditOpen(false)} disabled={busy}>Cancel</Button><Button form="edit-partner" type="submit" loading={busy}>Save</Button></>}>
            <form id="edit-partner" onSubmit={savePartner} className="space-y-4">
              <Field label="Display name" required hint={p.kind === "TEACHER" ? "Also changes the teacher's name." : undefined}><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" /> Active (can be given shares on new students)</label>
            </form>
          </Dialog>
          <ConfirmDialog open={deletePayout !== null} onClose={() => setDeletePayout(null)} onConfirm={removePayout} title="Delete payout?" description="The amount will be added back to the payable balance." confirmLabel="Delete payout" danger loading={busy} />
        </>
      )}
    </div>
  );
}
