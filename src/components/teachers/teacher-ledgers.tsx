"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { METHOD_LABEL, date, money } from "@/lib/format";
import type { Payment, Payout } from "@/lib/types";
import { Card, CardHeader, EmptyState, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";

interface Props {
  payouts: Payout[];
  recentPayments: Payment[];
  canDelete?: boolean;
  onDeletePayout?: (id: string) => void;
}

export function TeacherLedgers({ payouts, recentPayments, canDelete, onDeletePayout }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Payouts received" description="Money handed to the teacher, deducted from the balance." />
        {payouts.length === 0 ? (
          <EmptyState title="No payouts yet" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH className="text-right">Amount</TH>
                <TH>Note</TH>
                {canDelete && <TH />}
              </TR>
            </THead>
            <TBody>
              {payouts.map((p) => (
                <TR key={p.id}>
                  <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
                  <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
                  <TD className="max-w-[220px] truncate text-slate-500">{p.note || "-"}</TD>
                  {canDelete && (
                    <TD className="text-right">
                      <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onDeletePayout?.(p.id)} title="Delete payout">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent fee payments" description="Latest payments by assigned students and the share earned on each." />
        {recentPayments.length === 0 ? (
          <EmptyState title="No payments yet" />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Student</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right">Share</TH>
                <TH>Method</TH>
              </TR>
            </THead>
            <TBody>
              {recentPayments.map((p) => (
                <TR key={p.id}>
                  <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
                  <TD>
                    {p.student ? (
                      <Link href={`/students/${p.student.id}`} className="font-medium text-slate-900 hover:text-brand-700">{p.student.name}</Link>
                    ) : "-"}
                  </TD>
                  <TD className="text-right">{money(p.amount)}</TD>
                  <TD className="text-right font-medium text-brand-700">{money(p.teacherShare)}</TD>
                  <TD className="text-slate-500">{METHOD_LABEL[p.method] ?? p.method}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
