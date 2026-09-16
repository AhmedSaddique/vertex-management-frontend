"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { initials, money } from "@/lib/format";
import type { Subject, Teacher } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { Alert, Badge, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { TeacherFormDialog } from "@/components/teachers/teacher-form-dialog";

export default function TeachersPage() {
  const { isAdmin } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const teachers = useFetch(() => api<Teacher[]>("/teachers"), []);
  const subjects = useFetch(() => api<Subject[]>("/subjects"), []);

  if (!isAdmin) return <Alert tone="error">Only administrators can manage teachers.</Alert>;

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Teacher logins, subjects and classes. Their fee share is tracked on the Partners page."
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add teacher</Button>}
      />

      {teachers.loading && !teachers.data ? (
        <LoadingBlock />
      ) : teachers.error ? (
        <ErrorBlock message={teachers.error} onRetry={teachers.reload} />
      ) : !teachers.data?.length ? (
        <Card><EmptyState title="No teachers yet" action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add teacher</Button>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teachers.data.map((t) => (
            <Link key={t.id} href={`/teachers/${t.id}`} className="group">
              <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{initials(t.user.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{t.user.name}</p>
                      {!t.user.isActive && <Badge tone="danger">Inactive</Badge>}
                    </div>
                    <p className="truncate text-xs text-slate-500">{t.user.email}{t.phone ? ` · ${t.phone}` : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.subjects.map((s) => <Badge key={s.id} tone="brand">{s.name}</Badge>)}
                      {t.subjects.length === 0 && <Badge>No subjects</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Students</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold text-slate-900"><Users className="h-3.5 w-3.5 text-slate-400" /> {t._count.students}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Classes</p>
                    <p className="mt-0.5 flex items-center gap-1 font-semibold text-slate-900"><CalendarClock className="h-3.5 w-3.5 text-slate-400" /> {t._count.classSlots}</p>
                  </div>
                </div>
                {t.totals && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
                    <span className="text-xs font-medium text-brand-700">Share balance payable</span>
                    <span className={`font-semibold ${t.totals.balance < 0 ? "text-rose-600" : "text-brand-700"}`}>{money(t.totals.balance)}</span>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      <TeacherFormDialog open={addOpen} onClose={() => setAddOpen(false)} onSaved={teachers.reload} subjects={subjects.data ?? []} />
    </div>
  );
}
