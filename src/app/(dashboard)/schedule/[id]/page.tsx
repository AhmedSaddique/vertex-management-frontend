"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Phone, Trash2, UserPlus } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { CLASS_MODE_LABEL, CLASS_MODE_TONE, WEEKDAYS, WEEKDAY_SHORT, admissionNo, slotKey, slotKeyLabel, timeRange } from "@/lib/format";
import type { ClassSlot, Subject, Teacher, TimeSlot } from "@/lib/types";
import { Button } from "@/components/ui/form";
import { Badge, Card, CardHeader, EmptyState, ErrorBlock, LoadingBlock, PageHeader, StatusBadge, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { slotTitle } from "@/components/schedule/slot-card";
import { SlotFormDialog } from "@/components/schedule/slot-form-dialog";
import { SlotStudentsDialog } from "@/components/schedule/slot-students-dialog";

export default function ClassDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { isAdmin } = useAuth();
  const q = useFetch(() => api<ClassSlot>(`/schedule/${params.id}`), [params.id]);
  const subjects = useFetch(() => (isAdmin ? api<Subject[]>("/subjects") : Promise.resolve([] as Subject[])), [isAdmin]);
  const teachers = useFetch(() => (isAdmin ? api<Teacher[]>("/teachers") : Promise.resolve([] as Teacher[])), [isAdmin]);
  const presets = useFetch(() => (isAdmin ? api<{ slots: TimeSlot[] }>("/settings/time-slots") : Promise.resolve(null)), [isAdmin]);
  const [editOpen, setEditOpen] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const slot = q.data;
  if (q.loading && !slot) return <LoadingBlock />;
  if (q.error || !slot) return <ErrorBlock message={q.error ?? "Class not found"} onRetry={q.reload} />;

  async function remove() {
    setBusy(true);
    try {
      await api(`/schedule/${slot!.id}`, { method: "DELETE" });
      toast.success("Class deleted");
      router.push("/schedule");
    } catch (err) {
      toast.error("Could not delete class", errorMessage(err));
      setBusy(false);
    }
  }

  const info: [string, React.ReactNode][] = [
    ["Teacher", <span key="t">{slot.teacher.user.name}{slot.teacher.phone && <a href={`tel:${slot.teacher.phone}`} className="ml-2 text-brand-700 hover:underline">{slot.teacher.phone}</a>}</span>],
    ["Subject", slot.subject.name],
    ["Time", timeRange(slot.startTime, slot.endTime)],
    ["Days", <span key="d" className="flex flex-wrap gap-1">{WEEKDAYS.filter((d) => slot.days.includes(d)).map((d) => <Badge key={d} tone="brand">{WEEKDAY_SHORT[d]}</Badge>)}</span>],
    ["Location", slot.location || "-"],
    ["Notes", slot.notes || "-"],
  ];

  return (
    <div>
      <PageHeader
        title={slotTitle(slot)}
        description={`${slot.teacher.user.name} · ${timeRange(slot.startTime, slot.endTime)}`}
        backHref="/schedule"
        actions={
          <>
            {!slot.isActive && <Badge>Inactive</Badge>}
            {isAdmin && (
              <>
                <Button size="sm" onClick={() => setStudentsOpen(true)}><UserPlus className="h-4 w-4" /> Manage students</Button>
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4" /> Edit</Button>
                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Class details" />
          <dl className="divide-y divide-slate-100 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="flex gap-4 px-5 py-3">
                <dt className="w-24 shrink-0 text-slate-500">{k}</dt>
                <dd className="min-w-0 break-words text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Students in this class" description={`${slot.students.length} student${slot.students.length === 1 ? "" : "s"} with contact numbers`} />
          {slot.students.length === 0 ? (
            <EmptyState title="No students assigned yet" description={isAdmin ? "Use Manage students to add them." : undefined} />
          ) : (
            <Table>
              <THead>
                <TR><TH>Adm #</TH><TH>Student</TH><TH>Father name</TH><TH>Phone</TH><TH>Father phone</TH><TH>Mode</TH><TH>Available</TH><TH>Status</TH></TR>
              </THead>
              <TBody>
                {slot.students.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-semibold text-slate-900 tabular-nums">{admissionNo(s.admissionNo)}</TD>
                    <TD>
                      <Link href={`/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-700">{s.name}</Link>
                      {s.teacherId !== slot.teacherId && <p className="text-xs text-amber-600">Assigned to another teacher</p>}
                    </TD>
                    <TD className="text-slate-600">{s.fatherName || "-"}</TD>
                    <TD>
                      <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"><Phone className="h-3.5 w-3.5" />{s.phone}</a>
                    </TD>
                    <TD>{s.fatherPhone ? <a href={`tel:${s.fatherPhone}`} className="text-brand-700 hover:underline">{s.fatherPhone}</a> : <span className="text-slate-400">-</span>}</TD>
                    <TD><Badge tone={CLASS_MODE_TONE[s.classMode]}>{CLASS_MODE_LABEL[s.classMode]}</Badge></TD>
                    <TD className="text-xs text-slate-600">
                      {s.availableSlots?.length ? (
                        s.availableSlots.includes(slotKey(slot.startTime, slot.endTime)) ? <Badge tone="success">Free at this time</Badge> : <span title={s.availableSlots.map(slotKeyLabel).join(", ")}>Other times only</span>
                      ) : <span className="text-slate-400">Not set</span>}
                    </TD>
                    <TD><StatusBadge status={s.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>

      {isAdmin && (
        <>
          <SlotFormDialog open={editOpen} onClose={() => setEditOpen(false)} onSaved={(s) => q.setData(s)} subjects={subjects.data ?? []} teachers={teachers.data ?? []} timeSlots={presets.data?.slots ?? []} slot={slot} />
          <SlotStudentsDialog open={studentsOpen} onClose={() => setStudentsOpen(false)} onSaved={(s) => q.setData(s)} slot={slot} />
          <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={remove} title="Delete class?" description="The class time is removed from the timetable. Students themselves are not deleted." confirmLabel="Delete class" danger loading={busy} />
        </>
      )}
    </div>
  );
}
