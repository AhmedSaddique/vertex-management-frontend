"use client";

import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/use-fetch";
import type { MailStatus } from "@/lib/types";
import { Card, CardHeader, LoadingBlock } from "@/components/ui/display";

interface Health {
  mail?: MailStatus;
  database?: string;
  accounts?: string;
}

/** Shows whether enrollment and payment emails are set up on the server. */
export function EmailStatusCard() {
  const q = useFetch(() => api<Health>("/health"), []);
  const mail = q.data?.mail;

  return (
    <Card>
      <CardHeader
        title="Email notifications"
        description="Sent to the student and the team when a student enrolls and whenever a payment is recorded."
      />
      {q.loading && !q.data ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            {mail?.configured ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">
                {mail?.configured ? "Active" : "Not configured"}
                {mail?.driver === "json" && " (test mode: emails are built but not delivered)"}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                {mail?.configured
                  ? `Team copies go to ${mail.recipients} address${mail.recipients === 1 ? "" : "es"}. Students receive their copy when their record has an email address.`
                  : "Set SMTP_HOST, SMTP_USER and SMTP_PASS on the backend, then restart it. Until then, enrolments and payments are saved without sending email."}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="mb-2 flex items-center gap-2 font-medium text-slate-900">
              <Mail className="h-4 w-4" /> What gets sent
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>On enrollment: admission number, course, teacher, mode of class, fee and the agreed payment dates.</li>
              <li>On every payment: amount received, total fee, paid so far, remaining balance and the next due date.</li>
              <li>The team copy also shows how the payment was split. The student copy never does.</li>
            </ul>
            <p className="mt-2 text-xs text-slate-500">Recipients are set with NOTIFY_EMAILS on the backend (comma separated).</p>
          </div>
        </div>
      )}
    </Card>
  );
}
