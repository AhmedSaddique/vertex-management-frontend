"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { money } from "@/lib/format";
import type { StudentDetail } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { ErrorBlock, LoadingBlock, PageHeader, Stat, StatusBadge } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { PaymentDialog } from "@/components/students/payment-dialog";
import { StudentInfoCard } from "@/components/students/student-info-card";
import { StudentPaymentsTable } from "@/components/students/student-payments-table";

export default function StudentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const q = useFetch(() => api<StudentDetail>(`/students/${params.id}`), [params.id]);
  const [payOpen, setPayOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const s = q.data;
  if (q.loading && !s) return <LoadingBlock />;
  if (q.error || !s) return <ErrorBlock message={q.error ?? "Student not found"} onRetry={q.reload} />;

  async function run(fn: () => Promise<unknown>, successTitle: string, after?: () => void) {
    setBusy(true);
    try {
      await fn();
      toast.success(successTitle);
      after?.();
    } catch (err) {
      toast.error("Action failed", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const paidPct = s.finalPrice > 0 ? Math.min(100, Math.round((s.paid / s.finalPrice) * 100)) : 100;

  return (
    <div>
      <PageHeader
        title={s.name}
        description={`${s.subject.name} · ${s.teacher.user.name}`}
        backHref="/students"
        actions={
          <>
            <StatusBadge status={s.status} />
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => setPayOpen(true)} disabled={s.remaining <= 0}>
                  <Plus className="h-4 w-4" /> Record payment
                </Button>
                <Link href={`/students/${s.id}/edit`}>
                  <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button>
                </Link>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Final price" value={money(s.finalPrice)} hint={`Fee ${money(s.fee)} - discount ${money(s.discount)}`} tone="brand" />
        <Stat label="Paid" value={money(s.paid)} hint={`${paidPct}% of final price`} tone="success" />
        <Stat label="Remaining" value={money(s.remaining)} hint={s.remaining > 0 ? "Outstanding balance" : "Fully paid"} tone={s.remaining > 0 ? "warning" : "neutral"} />
        <Stat label={`${s.teacher.user.name} share earned`} value={money(s.teacherShareEarned)} hint={`of ${money(s.teacherShareProjected)} when fully paid`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <StudentInfoCard student={s} />
        <StudentPaymentsTable payments={s.payments} canDelete={isAdmin} onDelete={setDeletePaymentId} />
      </div>

      {isAdmin && (
        <>
          <PaymentDialog
            open={payOpen}
            onClose={() => setPayOpen(false)}
            onSaved={q.reload}
            student={{ id: s.id, name: s.name, remaining: s.remaining, commissionPercent: s.commissionPercent, teacherName: s.teacher.user.name }}
          />
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete student?"
            description={`This removes ${s.name} and all ${s.payments.length} recorded payment(s). This cannot be undone.`}
            confirmLabel="Delete student"
            danger
            loading={busy}
            onConfirm={() => run(() => api(`/students/${s.id}`, { method: "DELETE" }), "Student deleted", () => router.push("/students"))}
          />
          <ConfirmDialog
            open={deletePaymentId !== null}
            onClose={() => setDeletePaymentId(null)}
            title="Delete payment?"
            description="The amount goes back to the remaining balance and is removed from the teacher share."
            confirmLabel="Delete payment"
            danger
            loading={busy}
            onConfirm={() => run(() => api(`/payments/${deletePaymentId}`, { method: "DELETE" }), "Payment deleted", () => { setDeletePaymentId(null); void q.reload(); })}
          />
        </>
      )}
    </div>
  );
}
