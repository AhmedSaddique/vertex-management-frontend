"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import type { Partner, Student, Subject, Teacher } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Alert, Card, CardHeader } from "@/components/ui/display";
import { StudentDetailsCard } from "./student-details-card";
import { StudentFeeCard, feeInvalid } from "./student-fee-card";
import { AvailabilityPicker } from "./availability-picker";
import { ShareSplitEditor, sharesTotal } from "./share-split-editor";
import { InstallmentPlanEditor, installmentsTotal } from "./installment-plan-editor";
import { finalPriceOf, initialValues, type StudentFormValues } from "./student-form-values";

export type { StudentFormValues } from "./student-form-values";

interface Props {
  initial?: Student;
  subjects: Subject[];
  teachers: Teacher[];
  submitting: boolean;
  error?: string | null;
  onSubmit: (values: StudentFormValues) => void;
  onCancel: () => void;
}

export function StudentForm({ initial, subjects, teachers, submitting, error, onSubmit, onCancel }: Props) {
  const [v, setV] = useState<StudentFormValues>(() => initialValues(initial));
  const set = <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const partners = useFetch(() => api<Partner[]>("/partners"), []);

  const activeTeachers = useMemo(() => teachers.filter((t) => t.user.isActive || t.id === initial?.teacherId), [teachers, initial]);
  const teachersForSubject = useMemo(
    () => (v.subjectId ? activeTeachers.filter((t) => t.subjects.some((s) => s.id === v.subjectId)) : []),
    [activeTeachers, v.subjectId],
  );
  const teacherOptions = teachersForSubject.length ? teachersForSubject : activeTeachers;
  const subject = subjects.find((s) => s.id === v.subjectId);

  // Subject change: pick a teacher who teaches it, and (for new students) load the subject's default split.
  useEffect(() => {
    if (!v.subjectId) return;
    const current = activeTeachers.find((t) => t.id === v.teacherId);
    if (!current?.subjects.some((s) => s.id === v.subjectId) && teachersForSubject[0]) set("teacherId", teachersForSubject[0].id);
    if (!initial && subject) set("shares", subject.shareDefaults.map((d) => ({ partnerId: d.partnerId, percent: String(d.percent) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.subjectId]);

  const finalPrice = finalPriceOf(v);
  const sharesOver = sharesTotal(v.shares) > 100;
  const planOver = installmentsTotal(v.installments) > finalPrice;
  const blocked = feeInvalid(v) || sharesOver || planOver;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!blocked) onSubmit(v); }} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <StudentDetailsCard v={v} set={set} admissionNo={initial?.admissionNo} />

        <Card>
          <CardHeader title="Enrollment" description="Subject, assigned teacher, status and when the student can attend." />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Subject" required>
              <Select value={v.subjectId} onChange={(e) => set("subjectId", e.target.value)} required>
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Assigned teacher" required>
              <Select value={v.teacherId} onChange={(e) => set("teacherId", e.target.value)} required>
                <option value="">Select teacher</option>
                {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.user.name} ({t.subjects.map((s) => s.name).join(", ") || "no subjects"})</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={v.status} onChange={(e) => set("status", e.target.value as StudentFormValues["status"])}>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="DROPPED">Dropped</option>
              </Select>
            </Field>
            <Field label="Enrolled on"><Input type="date" value={v.enrolledAt} onChange={(e) => set("enrolledAt", e.target.value)} /></Field>
            <Field label="Available time slots" hint="Tick every slot the student can attend." className="sm:col-span-2">
              <AvailabilityPicker value={v.availableSlots} onChange={(next) => set("availableSlots", next)} />
            </Field>
            <Field label="Notes" className="sm:col-span-2"><Textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
          </div>
        </Card>

        {!initial && (
          <Card>
            <CardHeader title="Fee payment plan" description="Dates the student promised to pay. You can add or change dates later from the student page." />
            <div className="p-5">
              <InstallmentPlanEditor value={v.installments} onChange={(next) => set("installments", next)} finalPrice={finalPrice} enrolledAt={v.enrolledAt} />
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        <StudentFeeCard v={v} set={set} />
        <Card>
          <CardHeader
            title="Fee share split"
            description={subject ? `Defaults for ${subject.name} are filled in. Adjust any partner; the rest stays with the company.` : "Choose a subject to load the default split."}
          />
          <div className="p-5">
            <ShareSplitEditor partners={partners.data ?? []} value={v.shares} onChange={(next) => set("shares", next)} />
          </div>
        </Card>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" loading={submitting} disabled={blocked}>{initial ? "Save changes" : "Add student"}</Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </form>
  );
}
