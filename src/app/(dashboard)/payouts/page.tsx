"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { date, money } from "@/lib/format";
import type { Payout, Teacher } from "@/lib/types";
import { Button, Select } from "@/components/ui/form";
import { Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Stat, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PayoutDialog } from "@/components/teachers/payout-dialog";

export default function PayoutsPage() {
  const { isAdmin } = useAuth();
  const [teacherId, setTeacherId] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const teachers = useFetch(() => api<Teacher[]>("/teachers"), []);
  const list = useFetch(() => api<Payout[]>("/payouts", { query: { teacherId } }), [teacherId]);

  const rows = list.data ?? [];
  const total = rows.reduce((s, p) => s + p.amount, 0);
  const owed = (teachers.data ?? []).reduce((s, t) => s + t.totals.balance, 0);
  const earned = (teachers.data ?? []).reduce((s, t) => s + t.totals.earnedCommission, 0);

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/payouts/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast.success("Payout deleted");
      await Promise.all([list.reload(), teachers.reload()]);
    } catch (err) {
      toast.error("Could not delete payout", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Teacher payouts" : "My payouts"}
        description={isAdmin ? "Money handed to teachers against their earned commission." : "Money you have received against your earned commission."}
        actions={isAdmin && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Pay teacher</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label={isAdmin ? "Total earned by teachers" : "Total earned"} value={money(earned)} tone="warning" />
        <Stat label={isAdmin ? "Total paid out" : "Total received"} value={money(total)} tone="success" hint={`${rows.length} payout${rows.length === 1 ? "" : "s"}${teacherId ? " (filtered)" : ""}`} />
        <Stat label={isAdmin ? "Still owed to teachers" : "Still payable to you"} value={money(owed)} tone={owed > 0 ? "brand" : "neutral"} />
      </div>

      <Card>
        {isAdmin && (
          <div className="border-b border-slate-100 p-4">
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="sm:w-56">
              <option value="">All teachers</option>
              {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
            </Select>
          </div>
        )}
        {list.loading && !list.data ? <LoadingBlock /> : list.error ? <ErrorBlock message={list.error} onRetry={list.reload} /> : rows.length === 0 ? (
          <EmptyState title="No payouts recorded" description={isAdmin ? "Use Pay teacher to record money given to a teacher." : undefined} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Teacher</TH>
                <TH className="text-right">Amount</TH>
                <TH>Note</TH>
                {isAdmin && <TH />}
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
                  <TD>
                    {isAdmin ? <Link href={`/teachers/${p.teacherId}`} className="font-medium text-slate-900 hover:text-brand-700">{p.teacher?.user.name}</Link> : <span className="font-medium text-slate-900">{p.teacher?.user.name}</span>}
                  </TD>
                  <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
                  <TD className="max-w-[260px] truncate text-slate-500">{p.note || "-"}</TD>
                  {isAdmin && (
                    <TD className="text-right">
                      <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteId(p.id)} title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {isAdmin && (
        <>
          <PayoutDialog
            open={addOpen}
            onClose={() => setAddOpen(false)}
            onSaved={() => { void list.reload(); void teachers.reload(); }}
            teachers={(teachers.data ?? []).filter((t) => t.user.isActive).map((t) => ({ id: t.id, name: t.user.name, balance: t.totals.balance }))}
          />
          <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete payout?" description="The amount will be added back to the teacher payable balance." confirmLabel="Delete" danger loading={busy} />
        </>
      )}
    </div>
  );
}
