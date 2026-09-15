"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { date, money, percent } from "@/lib/format";
import type { StudentListResponse, Subject, Teacher } from "@/lib/types";
import { Button, Input, Select } from "@/components/ui/form";
import {
  Card,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  Stat,
  StatusBadge,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/display";

export default function StudentsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const subjects = useFetch(() => api<Subject[]>("/subjects"), []);
  const teachers = useFetch(() => (isAdmin ? api<Teacher[]>("/teachers") : Promise.resolve([] as Teacher[])), [isAdmin]);
  const list = useFetch(
    () => api<StudentListResponse>("/students", { query: { search: debounced, subjectId, teacherId, status } }),
    [debounced, subjectId, teacherId, status],
  );

  const rows = list.data?.students ?? [];
  const summary = list.data?.summary;

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Students" : "My students"}
        description="Every enrolled student with fee, discount, payments and remaining balance."
        actions={
          isAdmin && (
            <Link href="/students/new">
              <Button>
                <Plus className="h-4 w-4" /> Add student
              </Button>
            </Link>
          )
        }
      />

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Students" value={summary.count} />
          <Stat label="Total final price" value={money(summary.totalFinalPrice)} tone="brand" />
          <Stat label="Collected" value={money(summary.totalPaid)} tone="success" />
          <Stat label="Remaining" value={money(summary.totalRemaining)} tone={summary.totalRemaining > 0 ? "warning" : "neutral"} />
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Search by name, father name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="md:w-40">
              <option value="">All subjects</option>
              {subjects.data?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
            {isAdmin && (
              <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="md:w-40">
                <option value="">All teachers</option>
                {teachers.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name}</option>
                ))}
              </Select>
            )}
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-36">
              <option value="">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DROPPED">Dropped</option>
            </Select>
          </div>
        </div>

        {list.loading && !list.data ? (
          <LoadingBlock />
        ) : list.error ? (
          <ErrorBlock message={list.error} onRetry={list.reload} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No students found"
            description={isAdmin ? "Add your first student to start tracking fees and commissions." : "No students are assigned to you yet."}
            action={isAdmin && <Link href="/students/new"><Button size="sm"><Plus className="h-4 w-4" /> Add student</Button></Link>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Student</TH>
                <TH>Subject / Teacher</TH>
                <TH className="text-right">Final price</TH>
                <TH className="text-right">Paid</TH>
                <TH className="text-right">Remaining</TH>
                <TH>Progress</TH>
                <TH>Status</TH>
                <TH>Enrolled</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((s) => {
                const pct = s.finalPrice > 0 ? Math.min(100, Math.round((s.paid / s.finalPrice) * 100)) : 100;
                return (
                  <TR key={s.id} onClick={() => router.push(`/students/${s.id}`)}>
                    <TD>
                      <p className="font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.phone}{s.fatherName ? ` · s/o ${s.fatherName}` : ""}{s.fatherPhone ? ` · father ${s.fatherPhone}` : ""}</p>
                    </TD>
                    <TD>
                      <p className="text-slate-900">{s.subject.name}</p>
                      <p className="text-xs text-slate-500">{s.teacher.user.name} · {percent(s.commissionPercent)}</p>
                    </TD>
                    <TD className="text-right font-medium text-slate-900">{money(s.finalPrice)}</TD>
                    <TD className="text-right text-emerald-700">{money(s.paid)}</TD>
                    <TD className={`text-right ${s.remaining > 0 ? "font-medium text-amber-700" : "text-slate-400"}`}>{money(s.remaining)}</TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </TD>
                    <TD><StatusBadge status={s.status} /></TD>
                    <TD className="whitespace-nowrap text-slate-500">{date(s.enrolledAt)}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
