"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import { useAuth } from "@/lib/auth-context";
import { initials, money } from "@/lib/format";
import type { Partner, Subject } from "@/lib/types";
import { Button, Field, Input } from "@/components/ui/form";
import { Alert, Badge, Card, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/display";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";

export default function PartnersPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const partners = useFetch(() => api<Partner[]>("/partners"), []);
  const subjects = useFetch(() => api<Subject[]>("/subjects"), []);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isAdmin) return <Alert tone="error">Only administrators can view partners.</Alert>;

  async function addPartner(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/partners", { method: "POST", body: { name, kind: "MANAGEMENT" } });
      toast.success("Partner added", `${name} can now be given a share of student fees.`);
      setAddOpen(false);
      setName("");
      await partners.reload();
    } catch (err) {
      toast.error("Could not add partner", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const totalOwed = (partners.data ?? []).reduce((s, p) => s + p.totals.balance, 0);

  return (
    <div>
      <PageHeader
        title="Partners & shares"
        description="Everyone who receives a share of student fees. Whatever is not given to partners stays with the company."
        actions={<Button variant="outline" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add management partner</Button>}
      />

      <Card className="mb-6">
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Partners</p><p className="mt-1 text-2xl font-semibold text-slate-900">{partners.data?.length ?? "-"}</p></div>
          <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total owed to partners</p><p className="mt-1 text-2xl font-semibold text-brand-700">{money(totalOwed)}</p></div>
          <div className="text-sm text-slate-600">
            <p className="font-medium text-slate-900">Default splits per subject</p>
            {subjects.data?.map((s) => (
              <p key={s.id} className="text-xs text-slate-500">{s.name}: {s.shareDefaults.map((d) => `${d.partner.name} ${d.percent}%`).join(", ") || "not set"} → company {100 - s.shareDefaults.reduce((a, d) => a + d.percent, 0)}%</p>
            ))}
            <Link href="/subjects" className="text-xs font-medium text-brand-700 hover:underline">Change on Subjects page</Link>
          </div>
        </div>
      </Card>

      {partners.loading && !partners.data ? (
        <LoadingBlock />
      ) : partners.error ? (
        <ErrorBlock message={partners.error} onRetry={partners.reload} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {partners.data?.map((p) => (
            <Link key={p.id} href={`/partners/${p.id}`} className="group">
              <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${p.kind === "TEACHER" ? "bg-brand-600" : "bg-slate-800"}`}>{initials(p.name)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{p.name}</p>
                      <Badge tone={p.kind === "TEACHER" ? "brand" : "neutral"}>{p.kind === "TEACHER" ? "Teacher" : "Management"}</Badge>
                      {!p.isActive && <Badge tone="danger">Inactive</Badge>}
                    </div>
                    <p className="truncate text-xs text-slate-500">{p.user?.email ?? "No login linked"}{p.teacher?.subjects.length ? ` · ${p.teacher.subjects.map((s) => s.name).join(", ")}` : ""}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Students</p><p className="mt-0.5 font-semibold text-slate-900">{p.totals.studentCount}</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Earned</p><p className="mt-0.5 font-semibold text-emerald-700">{money(p.totals.earnedShare)}</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Paid out</p><p className="mt-0.5 font-semibold text-slate-900">{money(p.totals.totalPaidOut)}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
                  <span className="text-xs font-medium text-brand-700">Payable balance</span>
                  <span className={`font-semibold ${p.totals.balance < 0 ? "text-rose-600" : "text-brand-700"}`}>{money(p.totals.balance)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add management partner" description="A partner who does not teach but receives a share, e.g. an investor." size="sm"
        footer={<><Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button><Button form="partner-form" type="submit" loading={saving}>Add partner</Button></>}>
        <form id="partner-form" onSubmit={addPartner}>
          <Field label="Name" required><Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus /></Field>
        </form>
      </Dialog>
    </div>
  );
}
