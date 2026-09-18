"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { admissionNo, slotKey, slotKeyLabel } from "@/lib/format";
import type { ClassSlot, StudentListResponse } from "@/lib/types";
import { Button, Input } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { Badge, LoadingBlock, StatusBadge } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (slot: ClassSlot) => void;
  slot: ClassSlot;
}

/** Choose which students attend this class. Students free at this time are listed first. */
export function SlotStudentsDialog({ open, onClose, onSaved, slot }: Props) {
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [onlyTeacher, setOnlyTeacher] = useState(true);
  const [onlyFree, setOnlyFree] = useState(false);
  const [saving, setSaving] = useState(false);
  const students = useFetch(() => (open ? api<StudentListResponse>("/students") : Promise.resolve(null)), [open]);
  const key = slotKey(slot.startTime, slot.endTime);

  useEffect(() => {
    if (open) {
      setSelected(slot.students.map((s) => s.id));
      setSearch("");
    }
  }, [open, slot]);

  const rows = useMemo(() => {
    const all = students.data?.students ?? [];
    const q = search.trim().toLowerCase();
    const isFree = (s: { availableSlots?: string[] }) => s.availableSlots?.includes(key) ?? false;
    return all
      .filter((s) => !onlyTeacher || s.teacherId === slot.teacherId || selected.includes(s.id))
      .filter((s) => !onlyFree || isFree(s) || selected.includes(s.id))
      .filter((s) => !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || (s.fatherName ?? "").toLowerCase().includes(q))
      .sort((a, b) => Number(isFree(b)) - Number(isFree(a)) || a.name.localeCompare(b.name));
  }, [students.data, search, onlyTeacher, onlyFree, slot.teacherId, selected, key]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  async function save() {
    setSaving(true);
    try {
      const updated = await api<ClassSlot>(`/schedule/${slot.id}/students`, { method: "PUT", body: { studentIds: selected } });
      toast.success("Students updated", `${selected.length} student${selected.length === 1 ? "" : "s"} in this class.`);
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
      description={`Class time ${slotKeyLabel(key)}. ${selected.length} selected. Students free at this time are listed first.`}
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
          <Input className="pl-9" placeholder="Search name, father name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <p className="py-8 text-center text-sm text-slate-500">No students match.</p>
      ) : (
        <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {rows.map((s) => {
            const on = selected.includes(s.id);
            const free = s.availableSlots?.includes(key);
            return (
              <li key={s.id}>
                <label className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 ${on ? "bg-brand-50/50" : ""}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(s.id)} className="h-4 w-4 rounded border-slate-300" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">{admissionNo(s.admissionNo)} · {s.phone}{s.fatherPhone ? ` · father ${s.fatherPhone}` : ""} · {s.subject.name} · {s.teacher.user.name}</p>
                    {s.availableSlots?.length ? (
                      <p className="mt-0.5 truncate text-[11px] text-slate-400">Available: {s.availableSlots.map(slotKeyLabel).join(", ")}</p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-slate-400">Availability not set</p>
                    )}
                  </div>
                  {free ? <Badge tone="success">Free at this time</Badge> : s.availableSlots?.length ? <Badge tone="warning">Not free</Badge> : null}
                  <StatusBadge status={s.status} />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
