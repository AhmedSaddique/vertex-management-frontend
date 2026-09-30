"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { CLASS_MODE_LABEL, admissionNo, slotKey, slotKeyLabel } from "@/lib/format";
import type { ClassSlot, StudentListResponse } from "@/lib/types";
import { Button, Input } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { Badge, LoadingBlock } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (slot: ClassSlot) => void;
  slot: ClassSlot;
}

/**
 * Choose who attends this class. Only students who are still studying are offered, and by
 * default only those whose availability covers this class time.
 */
export function SlotStudentsDialog({ open, onClose, onSaved, slot }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [onlyTeacher, setOnlyTeacher] = useState(true);
  const [onlyFree, setOnlyFree] = useState(true);
  const [saving, setSaving] = useState(false);
  // Completed and dropped students are never part of a class.
  const students = useFetch(
    () => (open ? api<StudentListResponse>("/students", { query: { status: "ACTIVE" } }) : Promise.resolve(null)),
    [open],
  );
  const key = slotKey(slot.startTime, slot.endTime);

  useEffect(() => {
    if (open) {
      setSelected(slot.students.map((s) => s.id));
      setSearch("");
      setOnlyFree(true);
      setOnlyTeacher(true);
    }
  }, [open, slot]);

  const all = students.data?.students ?? [];
  const isFree = (s: { availableSlots?: string[] }) => s.availableSlots?.includes(key) ?? false;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter((s) => !onlyTeacher || s.teacherId === slot.teacherId || selected.includes(s.id))
      .filter((s) => !onlyFree || isFree(s) || selected.includes(s.id))
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          String(s.admissionNo).includes(q) ||
          (s.fatherName ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => Number(isFree(b)) - Number(isFree(a)) || a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, search, onlyTeacher, onlyFree, slot.teacherId, selected, key]);

  // How many active students the availability filter is keeping out of the list.
  const hiddenByAvailability = useMemo(
    () =>
      onlyFree
        ? all.filter((s) => (!onlyTeacher || s.teacherId === slot.teacherId) && !isFree(s) && !selected.includes(s.id)).length
        : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [all, onlyFree, onlyTeacher, slot.teacherId, selected, key],
  );

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function save() {
    setSaving(true);
    try {
      const updated = await api<ClassSlot>(`/schedule/${slot.id}/students`, { method: "PUT", body: { studentIds: selected } });
      toast.success("Students updated", `${updated.students.length} student${updated.students.length === 1 ? "" : "s"} in this class.`);
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error("Could not update students", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Class students"
      description={`Class time ${slotKeyLabel(key)}. ${selected.length} selected. Only students free at this time are shown.`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} loading={saving}>Save students</Button>
        </>
      }
    >
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search admission number, name, father name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyTeacher} onChange={(e) => setOnlyTeacher(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Only {slot.teacher.user.name}&apos;s students
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Only free at this time
        </label>
      </div>

      {students.loading && !students.data ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No student is free at {slotKeyLabel(key)}
          {onlyTeacher ? ` among ${slot.teacher.user.name}'s students` : ""}. Set a student&apos;s available time slots on their page, or untick the filters.
        </p>
      ) : (
        <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {rows.map((s) => {
            const on = selected.includes(s.id);
            const free = isFree(s);
            return (
              <li key={s.id}>
                <label className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 ${on ? "bg-brand-50/50" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="h-4 w-4 rounded border-slate-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {admissionNo(s.admissionNo)} · {s.phone}
                      {s.fatherPhone ? ` · father ${s.fatherPhone}` : ""} · {s.subject.name} · {CLASS_MODE_LABEL[s.classMode]}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {s.availableSlots?.length ? `Available: ${s.availableSlots.map(slotKeyLabel).join(", ")}` : "No available time set"}
                    </p>
                  </div>
                  {free ? <Badge tone="success">Free at this time</Badge> : <Badge tone="warning">Not free</Badge>}
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {hiddenByAvailability > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {hiddenByAvailability} active student{hiddenByAvailability === 1 ? "" : "s"} hidden because this class time is not in their available slots. Untick
          &quot;Only free at this time&quot; to see them.
        </p>
      )}
    </Dialog>
  );
}
