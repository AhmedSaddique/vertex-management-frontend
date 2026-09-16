"use client";

import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { Dashboard, DueList, PartnerSummary } from "@/lib/types";
import { Alert, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { FeeDueCard } from "@/components/dashboard/fee-due-card";
import { PartnerEarnings } from "@/components/partners/partner-earnings";
import { PartnerLedgers } from "@/components/partners/partner-ledgers";
import { TodayClasses } from "@/components/schedule/today-classes";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  return isAdmin ? <AdminHome /> : <TeacherHome partnerId={user?.partnerId ?? null} name={user?.name ?? ""} />;
}

function AdminHome() {
  const q = useFetch(() => api<Dashboard>("/dashboard"), []);
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error || !q.data) return <ErrorBlock message={q.error ?? "Failed to load"} onRetry={q.reload} />;
  return (
    <div>
      <PageHeader title="Dashboard" description="Company-wide overview: fees due, collections, partner shares and expenses." />
      <AdminDashboard data={q.data} />
    </div>
  );
}

function TeacherHome({ partnerId, name }: { partnerId: string | null; name: string }) {
  const q = useFetch(() => (partnerId ? api<PartnerSummary>(`/partners/${partnerId}/summary`) : Promise.resolve(null)), [partnerId]);
  const due = useFetch(() => api<DueList>("/installments/due", { query: { days: 7 } }), []);
  if (!partnerId) return <Alert tone="error">Your login is not linked to a partner account. Please contact the administrator.</Alert>;
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error || !q.data) return <ErrorBlock message={q.error ?? "Failed to load"} onRetry={q.reload} />;
  return (
    <div>
      <PageHeader title={`Welcome, ${name}`} description="Your students, fee dates, share earned and payouts received." />
      <div className="space-y-6">
        {due.data && <FeeDueCard due={due.data} />}
        <TodayClasses />
        <PartnerEarnings summary={q.data} own />
        <PartnerLedgers payouts={q.data.payouts} recentPayments={q.data.recentPayments} />
      </div>
    </div>
  );
}
