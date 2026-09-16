"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { HandCoins, Pencil } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { PartnerSummary, Subject, Teacher } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { Badge, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { PartnerEarnings } from "@/components/partners/partner-earnings";
import { PartnerLedgers } from "@/components/partners/partner-ledgers";
import { TeacherFormDialog } from "@/components/teachers/teacher-form-dialog";
import { PayoutDialog } from "@/components/teachers/payout-dialog";

export default function TeacherDetailPage() {
  const params = useParams<{ id: string }>();
  const { isAdmin, user } = useAuth();
  const toast = useToast();
  const teacher = useFetch(() => api<Teacher>(`/teachers/${params.id}`), [params.id]);
  const summary = useFetch(() => api<PartnerSummary>(`/teachers/${params.id}/summary`), [params.id]);
  const subjects = useFetch(() => (isAdmin ? api<Subject[]>("/subjects") : Promise.resolve([] as Subject[])), [isAdmin]);
  const [editOpen, setEditOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [deletePayout, setDeletePayout] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const t = teacher.data;
  const s = summary.data;
  if ((teacher.loading && !t) || (summary.loading && !s)) return <LoadingBlock />;
  if (teacher.error || !t) return <ErrorBlock message={teacher.error ?? "Teacher not found"} onRetry={teacher.reload} />;

  const reloadAll = () => { void teacher.reload(); void summary.reload(); };

  async function removePayout() {
    if (!deletePayout) return;
    setBusy(true);
    try {
      await api(`/payouts/${deletePayout}`, { method: "DELETE" });
      setDeletePayout(null);
      toast.success("Payout deleted");
      reloadAll();
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
        description={`${t.user.email}${t.phone ? ` · ${t.phone}` : ""} · ${t._count.students} students · ${t._count.classSlots} classes`}
        backHref={isAdmin ? "/teachers" : undefined}
        actions={
          <>
            {t.subjects.map((sub) => <Badge key={sub.id} tone="brand">{sub.name}</Badge>)}
            {!t.user.isActive && <Badge tone="danger">Inactive</Badge>}
            {isAdmin && (
              <>
                {s && <Button size="sm" onClick={() => setPayoutOpen(true)}><HandCoins className="h-4 w-4" /> Pay share</Button>}
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
              </>
            )}
          </>
        }
      />

      {s ? (
        <div className="space-y-6">
          <PartnerEarnings summary={s} own={user?.teacherId === t.id} />
          <PartnerLedgers payouts={s.payouts} recentPayments={s.recentPayments} canDelete={isAdmin} onDeletePayout={setDeletePayout} />
        </div>
      ) : (
        <ErrorBlock message={summary.error ?? "No partner account for this teacher"} onRetry={summary.reload} />
      )}

      {isAdmin && (
        <>
          <TeacherFormDialog open={editOpen} onClose={() => setEditOpen(false)} onSaved={reloadAll} subjects={subjects.data ?? []} teacher={t} />
          {s && <PayoutDialog open={payoutOpen} onClose={() => setPayoutOpen(false)} onSaved={reloadAll} partnerId={s.partner.id} partners={[{ id: s.partner.id, name: s.partner.name, balance: s.totals.balance }]} />}
          <ConfirmDialog open={deletePayout !== null} onClose={() => setDeletePayout(null)} onConfirm={removePayout} title="Delete payout?" description="The amount will be added back to the payable balance." confirmLabel="Delete payout" danger loading={busy} />
        </>
      )}
    </div>
  );
}
