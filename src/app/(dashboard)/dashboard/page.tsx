"use client";

import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { Dashboard, TeacherSummary } from "@/lib/types";
import { Alert, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { TeacherEarnings } from "@/components/teachers/teacher-earnings";
import { TeacherLedgers } from "@/components/teachers/teacher-ledgers";
import { TodayClasses } from "@/components/schedule/today-classes";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  return isAdmin ? <AdminHome /> : <TeacherHome teacherId={user?.teacherId ?? null} name={user?.name ?? ""} />;
}

function AdminHome() {
  const q = useFetch(() => api<Dashboard>("/dashboard"), []);
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error || !q.data) return <ErrorBlock message={q.error ?? "Failed to load"} onRetry={q.reload} />;
  return (
    <div>
      <PageHeader title="Dashboard" description="Company-wide overview of students, fees and teacher commissions." />
      <AdminDashboard data={q.data} />
    </div>
  );
}

function TeacherHome({ teacherId, name }: { teacherId: string | null; name: string }) {
  const q = useFetch(() => (teacherId ? api<TeacherSummary>(`/teachers/${teacherId}/summary`) : Promise.resolve(null)), [teacherId]);
  if (!teacherId) return <Alert tone="error">Your account is not linked to a teacher profile. Please contact the administrator.</Alert>;
  if (q.loading && !q.data) return <LoadingBlock />;
  if (q.error || !q.data) return <ErrorBlock message={q.error ?? "Failed to load"} onRetry={q.reload} />;
  return (
    <div>
      <PageHeader title={`Welcome, ${name}`} description="Your students, commission earned and payouts received." />
      <div className="space-y-6">
        <TodayClasses />
        <TeacherEarnings summary={q.data} own />
        <TeacherLedgers payouts={q.data.payouts} recentPayments={q.data.recentPayments} />
      </div>
    </div>
  );
}
