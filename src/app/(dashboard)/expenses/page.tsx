"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { date, money } from "@/lib/format";
import type { Dashboard, Expense, ExpenseListResponse } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui/form";
import { Alert, Badge, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Stat, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ExpenseDialog } from "@/components/expenses/expense-dialog";

export default function ExpensesPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useFetch(() => api<ExpenseListResponse>("/expenses", { query: { search, category, from, to } }), [search, category, from, to]);
  const overview = useFetch(() => api<Dashboard>("/dashboard"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can view company expenses.</Alert>;

  const rows = list.data?.expenses ?? [];
  const sum = list.data?.summary;
  const fin = overview.data?.finance;

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/expenses/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast.success("Expense deleted");
      void overview.reload();
      await list.reload();
    } catch (err) {
      toast.error("Could not delete expense", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const reload = () => { void list.reload(); void overview.reload(); };

  return (
    <div>
      <PageHeader
        title="Company expenses"
        description="Rent, maintenance, marketing and other running costs. They come out of the company share."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add expense</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Company share (all time)" value={money(fin?.companyShare ?? 0)} hint="Collected fees minus partner shares" tone="success" />
        <Stat label="Total expenses" value={money(sum?.total ?? 0)} hint={`${money(sum?.thisMonth ?? 0)} this month`} tone="warning" />
        <Stat label="Company balance" value={money(fin?.companyBalance ?? 0)} hint="Company share minus expenses" tone={(fin?.companyBalance ?? 0) < 0 ? "danger" : "brand"} />
        <Stat label="Cash in hand" value={money(fin?.netCash ?? 0)} hint="Collected minus payouts and expenses" />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Search title or note" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {list.data?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To" />
        </div>
        {list.loading && !list.data ? <LoadingBlock /> : list.error ? <ErrorBlock message={list.error} onRetry={list.reload} /> : rows.length === 0 ? (
          <EmptyState title="No expenses recorded" description="Add rent, bills, marketing or any other company cost." action={<Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Add expense</Button>} />
        ) : (
          <Table>
            <THead><TR><TH>Date</TH><TH>Expense</TH><TH>Category</TH><TH className="text-right">Amount</TH><TH>Note</TH><TH /></TR></THead>
            <TBody>
              {rows.map((e) => (
                <TR key={e.id}>
                  <TD className="whitespace-nowrap">{date(e.spentAt)}</TD>
                  <TD className="font-medium text-slate-900">{e.title}</TD>
                  <TD>{e.category ? <Badge>{e.category}</Badge> : <span className="text-slate-400">-</span>}</TD>
                  <TD className="text-right font-medium text-rose-700">{money(e.amount)}</TD>
                  <TD className="max-w-[240px] truncate text-slate-500">{e.note || "-"}</TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setEditing(e)} title="Edit"><Pencil className="h-4 w-4" /></button>
                      <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteId(e.id)} title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        {sum && rows.length > 0 && <p className="border-t border-slate-100 px-4 py-3 text-right text-sm text-slate-600">Shown: {sum.count} expense{sum.count === 1 ? "" : "s"} · {money(sum.filteredTotal)}</p>}
      </Card>

      <ExpenseDialog open={editing !== null} onClose={() => setEditing(null)} onSaved={reload} expense={editing === "new" ? null : editing} categories={list.data?.categories ?? []} />
      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={remove} title="Delete expense?" description="The amount goes back into the company balance." confirmLabel="Delete" danger loading={busy} />
    </div>
  );
}
