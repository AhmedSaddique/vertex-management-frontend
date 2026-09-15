"use client";

import { useState } from "react";
import { Columns3, LayoutGrid, Plus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { ClassSlot, StudentListResponse, Subject, Teacher, TimeSlot } from "@/lib/types";
import { Button, Select } from "@/components/ui/form";
import { Card, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { ScheduleDayColumns } from "@/components/schedule/schedule-day-columns";
import { AvailabilityView } from "@/components/schedule/availability-view";
import { SlotFormDialog } from "@/components/schedule/slot-form-dialog";

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState<"grid" | "day" | "avail">("grid");
  const [addOpen, setAddOpen] = useState(false);

  const teachers = useFetch(() => (isAdmin ? api<Teacher[]>("/teachers") : Promise.resolve([] as Teacher[])), [isAdmin]);
  const subjects = useFetch(() => api<Subject[]>("/subjects"), []);
  const presets = useFetch(() => api<{ slots: TimeSlot[] }>("/settings/time-slots"), []);
  const students = useFetch(() => api<StudentListResponse>("/students", { query: { status: "ACTIVE" } }), []);
  const slots = useFetch(
    () => api<ClassSlot[]>("/schedule", { query: { teacherId, subjectId, active: showInactive ? undefined : true } }),
    [teacherId, subjectId, showInactive],
  );

  const all = slots.data ?? [];
  const viewBtn = (v: "grid" | "day" | "avail", label: string, Icon: typeof LayoutGrid) => (
    <button
      type="button"
      onClick={() => setView(v)}
      className={`inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );

  return (
    <div>
      <PageHeader
        title={isAdmin ? "Class schedule" : "My schedule"}
        description="Weekly timetable: which teacher takes which class, at what time, and who attends."
        actions={isAdmin && <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add class</Button>}
      />

      <Card className="mb-6">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          {isAdmin && (
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="lg:w-48">
              <option value="">All teachers</option>
              {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
            </Select>
          )}
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="lg:w-44">
            <option value="">All subjects</option>
            {subjects.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Show inactive
          </label>
          <div className="flex items-center gap-3 lg:ml-auto">
            <span className="text-sm text-slate-500">{all.length} class{all.length === 1 ? "" : "es"}</span>
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {viewBtn("grid", "Time grid", LayoutGrid)}
              {viewBtn("day", "By day", Columns3)}
              {viewBtn("avail", "Availability", Users)}
            </div>
          </div>
        </div>
      </Card>

      {(slots.loading && !slots.data) || (presets.loading && !presets.data) ? (
        <LoadingBlock />
      ) : slots.error ? (
        <ErrorBlock message={slots.error} onRetry={slots.reload} />
      ) : view === "grid" ? (
        <ScheduleGrid slots={all} presets={presets.data?.slots ?? []} />
      ) : view === "day" ? (
        <ScheduleDayColumns slots={all} />
      ) : (
        <AvailabilityView students={students.data?.students ?? []} classes={all} presets={presets.data?.slots ?? []} />
      )}

      {isAdmin && (
        <SlotFormDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onSaved={() => void slots.reload()}
          subjects={subjects.data ?? []}
          teachers={teachers.data ?? []}
          timeSlots={presets.data?.slots ?? []}
        />
      )}
    </div>
  );
}
