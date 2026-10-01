"use client";

import { useState } from "react";
import { HandCoins, Plus, Wallet } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { money } from "@/lib/format";
import type { CompanyLoan, Dashboard, LoanListResponse, Partner } from "@/lib/types";
import { Button, Select } from "@/components/ui/form";
import { Alert, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Stat } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { LoanDialog } from "@/components/loans/loan-dialog";
import { RepaymentDialog } from "@/components/loans/repayment-dialog";
import { LoansByBorrower, LoansTable } from "@/components/loans/loans-table";

export default function LoansPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [editing, setEditing] = useState<CompanyLoan | "new" | null>(null);
  const [repaying, setRepaying] = useState<CompanyLoan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useFetch(() => api<LoanListResponse>("/loans", { query: { status, partnerId } }), [status, partnerId]);
  const partners = useFetch(() => api<Partner[]>("/partners"), []);
  const overview = useFetch(() => api<Dashboard>("/dashboard"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can view company loans.</Alert>;

  const rows = list.data?.loans ?? [];
  const sum = list.data?.summary;
  const fin = overview.data?.finance;
  const reload = () => {
    void list.reload();
    void overview.reload();
  };

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/loans/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast.success("Loan deleted", "Its repayments were removed with it.");
      reload();
    } catch (err) {
      toast.error("Could not delete the loan", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Company loans"
        description="Money taken out of the company for a while. It is not an expense: it lowers cash in hand until it is paid back."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Take money</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Still owed to the company" value={money(sum?.outstanding ?? 0)} hint={`${sum?.openCount ?? 0} loan${sum?.openCount === 1 ? "" : "s"} not cleared`} tone={(sum?.outstanding ?? 0) > 0 ? "danger" : "success"} icon={<HandCoins className="h-5 w-5" />} />
        <Stat label="Total taken" value={money(sum?.taken ?? 0)} hint={`${sum?.count ?? 0} loan${sum?.count === 1 ? "" : "s"} recorded`} />
        <Stat label="Paid back" value={money(sum?.repaid ?? 0)} tone="success" />
        <Stat label="Cash in hand" value={money(fin?.netCash ?? 0)} hint={`After payouts, expenses and ${money(fin?.loansOutstanding ?? 0)} on loan`} tone="brand" icon={<Wallet className="h-5 w-5" />} />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All loans</option>
            <option value="OPEN">Not paid back</option>
            <option value="PARTIAL">Partly paid back</option>
            <option value="CLEARED">Cleared</option>
          </Select>
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            <option value="">Everyone</option>
            {partners.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>

        {list.loading && !list.data ? (
          <LoadingBlock />
        ) : list.error ? (
          <ErrorBlock message={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No loans recorded"
            description="When someone needs money from the company, record it here and clear it when they pay it back."
            action={<Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Take money</Button>}
          />
        ) : (
          <LoansTable rows={rows} onRepay={setRepaying} onEdit={(l) => setEditing(l)} onDelete={setDeleteId} />
        )}
      </Card>

      {sum && sum.byBorrower.length > 0 && <LoansByBorrower summary={sum} />}

      <LoanDialog open={editing !== null} onClose={() => setEditing(null)} onSaved={reload} loan={editing === "new" ? null : editing} />
      {repaying && <RepaymentDialog open onClose={() => setRepaying(null)} onSaved={reload} loan={repaying} />}
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete this loan?" description="The loan and every repayment against it are removed. Cash in hand goes back to what it was." confirmLabel="Delete" danger loading={busy} />
    </div>
  );
}
