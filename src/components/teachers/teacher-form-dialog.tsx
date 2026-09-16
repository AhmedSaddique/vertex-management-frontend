"use client";

import { useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { Subject, Teacher } from "@/lib/types";
import { Button, Field, Input, PasswordInput } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  subjects: Subject[];
  teacher?: Teacher | null;
}

export function TeacherFormDialog({ open, onClose, onSaved, subjects, teacher }: Props) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(teacher?.user.name ?? "");
    setEmail(teacher?.user.email ?? "");
    setPassword("");
    setPhone(teacher?.phone ?? "");
    setSubjectIds(teacher?.subjects.map((s) => s.id) ?? []);
    setIsActive(teacher?.user.isActive ?? true);
  }, [open, teacher]);

  function toggleSubject(id: string) {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name,
        email,
        phone: phone || null,
        subjectIds,
        ...(password ? { password } : {}),
        ...(teacher ? { isActive } : {}),
      };
      if (teacher) await api(`/teachers/${teacher.id}`, { method: "PUT", body });
      else await api("/teachers", { method: "POST", body });
      toast.success(teacher ? "Teacher updated" : "Teacher created", teacher ? `${name} has been saved.` : `${name} can now sign in with ${email}.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(teacher ? "Could not update teacher" : "Could not create teacher", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={teacher ? "Edit teacher" : "Add teacher"}
      description={teacher ? "Update profile and login." : "Creates a teacher login (view-only) and a partner account for their fee share. Default splits are set per subject."}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button form="teacher-form" type="submit" loading={saving}>{teacher ? "Save changes" : "Create teacher"}</Button>
        </>
      }
    >
      <form id="teacher-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Login email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label={teacher ? "New password" : "Password"} required={!teacher} hint={teacher ? "Leave blank to keep the current password." : "At least 6 characters."}>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required={!teacher} minLength={6} autoComplete="new-password" />
          </Field>
          {teacher && (
            <Field label="Account status">
              <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Active (can sign in)
              </label>
            </Field>
          )}
        </div>
        <Field label="Subjects taught">
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const on = subjectIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSubject(s.id)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${on ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                >
                  {s.name}
                </button>
              );
            })}
            {subjects.length === 0 && <span className="text-sm text-slate-500">No subjects yet. Add them from the Subjects page.</span>}
          </div>
        </Field>
      </form>
    </Dialog>
  );
}
