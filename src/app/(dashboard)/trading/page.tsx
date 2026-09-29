"use client";

import { useState } from "react";
import { PieChart, Plus, TrendingUp } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { money, percent } from "@/lib/format";
import type { Dashboard, TradingDefaults, TradingListResponse, TradingPayout } from "@/lib/types";
import { Button, Input } from "@/components/ui/form";
import { Alert, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Stat } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { TradingPayoutDialog } from "@/components/trading/trading-payout-dialog";
import { TradingDefaultsDialog } from "@/components/trading/trading-defaults-dialog";
import { TradingByMember, TradingTable } from "@/components/trading/trading-table";

export default function TradingPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<TradingPayout | "new" | null>(null);
  const [defaultsOpen, setDefaultsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useFetch(() => api<TradingListResponse>("/trading", { query: { from, to } }), [from, to]);
  const defaults = useFetch(() => api<TradingDefaults>("/trading/defaults"), []);
  const overview = useFetch(() => api<Dashboard>("/dashboard"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can view trading payouts.</Alert>;

  const rows = list.data?.payouts ?? [];
  const sum = list.data?.summary;
  const fin = overview.data?.finance;
  const reload = () => {
    void list.reload();
    void defaults.reload();
    void overview.reload();
  };

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/trading/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast.success("Trading payout deleted", "The member and company shares were reversed.");
      reload();
    } catch (err) {
      toast.error("Could not delete", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Trading payouts"
        description="Income the academy earns from trading, split between the members and the company."
        actions={
          <>
            <Button variant="outline" onClick={() => setDefaultsOpen(true)}>
              <PieChart className="h-4 w-4" /> Default split
            </Button>
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Record payout
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Trading income (all time)" value={money(fin?.tradingTotal ?? 0)} hint={`${sum?.count ?? 0} payout${sum?.count === 1 ? "" : "s"} recorded`} tone="brand" icon={<TrendingUp className="h-5 w-5" />} />
        <Stat label="To the members" value={money(fin?.tradingPartnerShare ?? 0)} hint={defaults.data ? `${percent(defaults.data.partnerPercent)} of each payout` : undefined} tone="warning" />
        <Stat label="To the company" value={money(fin?.companyTradingShare ?? 0)} hint={defaults.data ? `${percent(defaults.data.companyPercent)} of each payout` : undefined} tone="success" />
        <Stat label="Company income total" value={money(fin?.companyShare ?? 0)} hint="Course fees plus trading" />
      </div>

      {defaults.data && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-3 p-5 text-sm">
            <span className="font-medium text-slate-900">Default split</span>
            {defaults.data.shares.map((s) => (
              <span key={s.partnerId} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                {s.partner.name} {percent(s.percent)}
              </span>
            ))}
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">Company {percent(defaults.data.companyPercent)}</span>
            <button className="ml-auto text-xs font-medium text-brand-700 hover:underline" onClick={() => setDefaultsOpen(true)}>Change</button>
          </div>
        </Card>
      )}

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
          {sum && <p className="self-center text-sm text-slate-600 lg:col-span-2">Shown: {money(sum.total)} · members {money(sum.partnerShare)} · company {money(sum.companyShare)}</p>}
        </div>

        {list.loading && !list.data ? (
          <LoadingBlock />
        ) : list.error ? (
          <ErrorBlock message={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No trading payouts yet"
            description="Record trading income and it is split automatically."
            action={<Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Record payout</Button>}
          />
        ) : (
          <TradingTable rows={rows} onEdit={(t) => setEditing(t)} onDelete={setDeleteId} />
        )}
      </Card>

      {sum && sum.byPartner.length > 0 && <TradingByMember summary={sum} />}

      <TradingPayoutDialog open={editing !== null} onClose={() => setEditing(null)} onSaved={reload} payout={editing === "new" ? null : editing} />
      <TradingDefaultsDialog open={defaultsOpen} onClose={() => setDefaultsOpen(false)} onSaved={reload} />
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete trading payout?" description="The member and company shares are removed with it." confirmLabel="Delete" danger loading={busy} />
    </div>
  );
}
