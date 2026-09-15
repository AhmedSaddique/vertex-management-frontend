"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { HandCoins, Pencil } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { Subject, TeacherSummary } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { Badge, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/dialog";
import { TeacherEarnings } from "@/components/teachers/teacher-earnings";
import { TeacherLedgers } from "@/components/teachers/teacher-ledgers";
import { TeacherFormDialog } from "@/components/teachers/teacher-form-dialog";
import { PayoutDialog } from "@/components/teachers/payout-dialog";

export default function TeacherDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const q = useFetch(() => api<TeacherSummary>(`/teachers/${params.id}/summary`), [params.id]);
  const subjects = useFetch(() => (isAdmin ? api<Subject[]>("/subjects") : Promise.resolve([] as Subject[])), [isAdmin]);
  const [editOpen, setEditOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [deletePayout, setDeletePayout] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const s = q.data;
  if (q.loading && !s) return <LoadingBlock />;
  if (q.error || !s) return <ErrorBlock message={q.error ?? "Teacher not found"} onRetry={q.reload} />;

  const t = s.teacher;
  const own = user?.teacherId === t.id;

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
        title={t.user.name}
        description={`${t.user.email}${t.phone ? ` · ${t.phone}` : ""}`}
        backHref={isAdmin ? "/teachers" : undefined}
        actions={
          <>
            {t.subjects.map((sub) => <Badge key={sub.id} tone="brand">{sub.name}</Badge>)}
            {!t.user.isActive && <Badge tone="danger">Inactive</Badge>}
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => setPayoutOpen(true)}><HandCoins className="h-4 w-4" /> Pay teacher</Button>
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
              </>
            )}
          </>
        }
      />

      <div className="space-y-6">
        <TeacherEarnings summary={s} own={own} />
        <TeacherLedgers payouts={s.payouts} recentPayments={s.recentPayments} canDelete={isAdmin} onDeletePayout={setDeletePayout} />
      </div>

      {isAdmin && (
        <>
          <TeacherFormDialog open={editOpen} onClose={() => setEditOpen(false)} onSaved={q.reload} subjects={subjects.data ?? []} teacher={t} />
          <PayoutDialog open={payoutOpen} onClose={() => setPayoutOpen(false)} onSaved={q.reload} teacherId={t.id} teachers={[{ id: t.id, name: t.user.name, balance: s.totals.balance }]} />
          <ConfirmDialog
            open={deletePayout !== null}
            onClose={() => setDeletePayout(null)}
            onConfirm={removePayout}
            title="Delete payout?"
            description="The amount will be added back to the teacher payable balance."
            confirmLabel="Delete payout"
            danger
            loading={busy}
          />
        </>
      )}
    </div>
  );
}
