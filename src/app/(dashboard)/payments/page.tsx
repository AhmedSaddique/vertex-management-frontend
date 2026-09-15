"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { METHOD_LABEL, money } from "@/lib/format";
import type { PaymentListResponse, Teacher } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui/form";
import { Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader, Stat } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PaymentsTable } from "@/components/payments/payments-table";
import { RecordPaymentFlow } from "@/components/students/record-payment-flow";

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const [teacherId, setTeacherId] = useState("");
  const [method, setMethod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [recordOpen, setRecordOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const teachers = useFetch(() => (isAdmin ? api<Teacher[]>("/teachers") : Promise.resolve([] as Teacher[])), [isAdmin]);
  const list = useFetch(() => api<PaymentListResponse>("/payments", { query: { teacherId, method, from, to } }), [teacherId, method, from, to]);

  const rows = list.data?.payments ?? [];
  const sum = list.data?.summary;

  async function remove() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await api(`/payments/${deleteId}`, { method: "DELETE" });
      setDeleteId(null);
      toast.success("Payment deleted");
      await list.reload();
    } catch (err) {
      toast.error("Could not delete payment", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Fee payments"
        description="Every fee payment received, split into teacher share and company share."
        actions={isAdmin && <Button onClick={() => setRecordOpen(true)}><Plus className="h-4 w-4" /> Record payment</Button>}
      />
      {sum && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Payments" value={sum.count} />
          <Stat label="Total collected" value={money(sum.total)} tone="brand" />
          <Stat label="Teacher share" value={money(sum.teacherShare)} tone="warning" />
          <Stat label="Company share" value={money(sum.companyShare)} tone="success" />
        </div>
      )}

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {isAdmin && (
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">All teachers</option>
              {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
            </Select>
          )}
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">All methods</option>
            {Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To date" />
        </div>

        {list.loading && !list.data ? (
          <LoadingBlock />
        ) : list.error ? (
          <ErrorBlock message={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState title="No payments found" description="Try changing the filters or record a new payment." />
        ) : (
          <PaymentsTable payments={rows} canDelete={isAdmin} onDelete={setDeleteId} />
        )}
      </Card>

      {isAdmin && (
        <>
          <RecordPaymentFlow open={recordOpen} onClose={() => setRecordOpen(false)} onSaved={list.reload} />
          <ConfirmDialog
            open={deleteId !== null}
            onClose={() => setDeleteId(null)}
            onConfirm={remove}
            title="Delete payment?"
            description="The amount goes back to the student remaining balance and is removed from the teacher share."
            confirmLabel="Delete"
            danger
            loading={busy}
          />
        </>
      )}
    </div>
  );
}
