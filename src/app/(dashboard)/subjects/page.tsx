"use client";

import { useState } from "react";
import { BookOpen, Pencil, PieChart, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import type { Subject } from "@/lib/types";
import { Button, Field, Input, Textarea } from "@/components/ui/form";
import { Alert, Badge, Card, EmptyState, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { ShareDefaultsDialog } from "@/components/subjects/share-defaults-dialog";

export default function SubjectsPage() {
  const { isAdmin } = useAuth();
  const list = useFetch(() => api<Subject[]>("/subjects"), []);
  const [editing, setEditing] = useState<Subject | null | "new">(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [splitTarget, setSplitTarget] = useState<Subject | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (!isAdmin) return <Alert tone="error">Only administrators can manage subjects.</Alert>;

  function openForm(s: Subject | "new") {
    setEditing(s);
    setName(s === "new" ? "" : s.name);
    setDescription(s === "new" ? "" : s.description ?? "");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { name, description: description || null };
      if (editing === "new") await api("/subjects", { method: "POST", body });
      else if (editing) await api(`/subjects/${editing.id}`, { method: "PUT", body });
      toast.success(editing === "new" ? "Subject added" : "Subject updated");
      setEditing(null);
      await list.reload();
    } catch (err) {
      toast.error("Could not save subject", errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await api(`/subjects/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success("Subject deleted");
      await list.reload();
    } catch (err) {
      toast.error("Could not delete subject", errorMessage(err));
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Subjects"
        description="Courses offered, with the default fee split for new students. Link teachers to subjects from the Teachers page."
        actions={<Button onClick={() => openForm("new")}><Plus className="h-4 w-4" /> Add subject</Button>}
      />

      {list.loading && !list.data ? <LoadingBlock /> : list.error ? <ErrorBlock message={list.error} onRetry={list.reload} /> : !list.data?.length ? (
        <Card><EmptyState title="No subjects yet" action={<Button size="sm" onClick={() => openForm("new")}><Plus className="h-4 w-4" /> Add subject</Button>} /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.data.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><BookOpen className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{s.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{s.description || "No description"}</p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => openForm(s)} title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setDeleteTarget(s)} title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <Badge>{s._count.students} student{s._count.students === 1 ? "" : "s"}</Badge>
                {s.teachers.map((t) => <Badge key={t.id} tone="brand">{t.user.name}</Badge>)}
                {s.teachers.length === 0 && <span className="text-xs text-slate-400">No teacher linked</span>}
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Default fee split</p>
                  <button className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline" onClick={() => setSplitTarget(s)}><PieChart className="h-3.5 w-3.5" /> Edit</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.shareDefaults.map((d) => <Badge key={d.partnerId} tone="warning">{d.partner.name} {d.percent}%</Badge>)}
                  <Badge tone="success">Company {Math.round((100 - s.shareDefaults.reduce((a, d) => a + d.percent, 0)) * 100) / 100}%</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "Add subject" : "Edit subject"}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button form="subject-form" type="submit" loading={busy}>{editing === "new" ? "Create" : "Save"}</Button>
          </>
        }
      >
        <form id="subject-form" onSubmit={save} className="space-y-4">
          <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></Field>
          <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        </form>
      </Dialog>

      <ShareDefaultsDialog open={splitTarget !== null} onClose={() => setSplitTarget(null)} onSaved={list.reload} subject={splitTarget} />

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
        title="Delete subject?"
        description={deleteTarget?._count.students ? "This subject has students enrolled and cannot be deleted. Move the students first." : `Delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={busy}
      />
    </div>
  );
}
