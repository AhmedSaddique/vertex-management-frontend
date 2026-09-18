"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button, Field, PasswordInput } from "@/components/ui/form";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/display";
import { useToast } from "@/components/ui/toast";
import { TimeSlotsCard } from "@/components/settings/time-slots-card";
import { EmailStatusCard } from "@/components/settings/email-status-card";

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 6;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mismatch || tooShort) return;
    setSaving(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      toast.success("Password updated", "Use the new password next time you sign in.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.error("Could not update password", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Your account and security." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <dl className="divide-y divide-slate-100 text-sm">
            <div className="flex justify-between px-5 py-3"><dt className="text-slate-500">Name</dt><dd className="font-medium text-slate-900">{user?.name}</dd></div>
            <div className="flex justify-between px-5 py-3"><dt className="text-slate-500">Email</dt><dd className="font-medium text-slate-900">{user?.email}</dd></div>
            <div className="flex justify-between px-5 py-3"><dt className="text-slate-500">Role</dt><dd><Badge tone={isAdmin ? "brand" : "info"}>{isAdmin ? "Administrator" : "Teacher"}</Badge></dd></div>
          </dl>
          {!isAdmin && (
            <p className="px-5 pb-5 text-xs text-slate-500">Teachers have view-only access. Ask the administrator to change your details or share percentage.</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Change password" />
          <form onSubmit={submit} className="space-y-4 p-5">
            <Field label="Current password" required>
              <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
            </Field>
            <Field label="New password" required hint="At least 6 characters." error={tooShort ? "Password must be at least 6 characters." : null}>
              <PasswordInput value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password" required error={mismatch ? "Passwords do not match." : null}>
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={saving} disabled={mismatch || tooShort}>Update password</Button>
          </form>
        </Card>
      </div>

      {isAdmin && (
        <div className="mt-6 space-y-6">
          <EmailStatusCard />
          <TimeSlotsCard />
        </div>
      )}
    </div>
  );
}
