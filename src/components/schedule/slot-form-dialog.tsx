"use client";

import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { WEEKDAYS, WEEKDAY_SHORT } from "@/lib/format";
import type { ClassSlot, Subject, Teacher, TimeSlot, Weekday } from "@/lib/types";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { TimeSlotFields } from "./time-slot-fields";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (slot: ClassSlot) => void;
  subjects: Subject[];
  teachers: Teacher[];
  timeSlots: TimeSlot[];
  slot?: ClassSlot | null;
}

export function SlotFormDialog({ open, onClose, onSaved, subjects, teachers, timeSlots, slot }: Props) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [days, setDays] = useState<Weekday[]>([]);
  const [startTime, setStartTime] = useState("15:00");
  const [endTime, setEndTime] = useState("16:30");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const first = timeSlots[0];
    setTitle(slot?.title ?? "");
    setSubjectId(slot?.subjectId ?? subjects[0]?.id ?? "");
    setTeacherId(slot?.teacherId ?? "");
    setDays(slot?.days ?? []);
    setStartTime(slot?.startTime ?? first?.start ?? "15:00");
    setEndTime(slot?.endTime ?? first?.end ?? "16:30");
    setLocation(slot?.location ?? "");
    setNotes(slot?.notes ?? "");
    setIsActive(slot?.isActive ?? true);
  }, [open, slot, subjects, timeSlots]);

  const activeTeachers = useMemo(() => teachers.filter((t) => t.user.isActive || t.id === slot?.teacherId), [teachers, slot]);
  const forSubject = useMemo(
    () => (subjectId ? activeTeachers.filter((t) => t.subjects.some((s) => s.id === subjectId)) : []),
    [activeTeachers, subjectId],
  );
  const teacherOptions = forSubject.length ? forSubject : activeTeachers;

  useEffect(() => {
    if (!subjectId) return;
    const current = activeTeachers.find((t) => t.id === teacherId);
    if (!current?.subjects.some((s) => s.id === subjectId) && forSubject[0]) setTeacherId(forSubject[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  const toggleDay = (d: Weekday) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const timeInvalid = !!startTime && !!endTime && endTime <= startTime;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (days.length === 0) {
      toast.error("Pick at least one day");
      return;
    }
    if (timeInvalid) return;
    setSaving(true);
    try {
      const body = { title: title || null, subjectId, teacherId, days, startTime, endTime, location: location || null, notes: notes || null, isActive };
      const saved = slot
        ? await api<ClassSlot>(`/schedule/${slot.id}`, { method: "PUT", body })
        : await api<ClassSlot>("/schedule", { method: "POST", body });
      toast.success(slot ? "Class updated" : "Class added", `${saved.title || `${saved.subject.name} class`} saved.`);
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(slot ? "Could not update class" : "Could not add class", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={slot ? "Edit class" : "Add class"}
      description="A recurring class time for one teacher. Students are assigned from the class page."
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="slot-form" type="submit" loading={saving} disabled={timeInvalid}>{slot ? "Save changes" : "Add class"}</Button>
        </>
      }
    >
      <form id="slot-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class name" hint="Optional, e.g. Forex Batch A" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Forex evening batch" />
          </Field>
          <Field label="Subject" required>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Teacher" required>
            <Select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
              <option value="">Select teacher</option>
              {teacherOptions.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
            </Select>
          </Field>
          <TimeSlotFields
            slots={timeSlots}
            start={startTime}
            end={endTime}
            onChange={(s, e) => { setStartTime(s); setEndTime(e); }}
            endError={timeInvalid ? "End time must be after start time" : null}
          />
          <Field label="Location" hint="Room, branch or online link" className="sm:col-span-2">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>
        <Field label="Days" required>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const on = days.includes(d);
              return (
                <button key={d} type="button" onClick={() => toggleDay(d)} className={`rounded-full border px-3 py-1 text-sm transition-colors ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                  {WEEKDAY_SHORT[d]}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {slot && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Active (shown on the timetable)
          </label>
        )}
      </form>
    </Dialog>
  );
}
