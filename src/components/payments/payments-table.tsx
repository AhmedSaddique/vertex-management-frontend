"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { METHOD_LABEL, date, money } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";
import { SharesCell } from "@/components/students/student-payments-table";

interface Props {
  payments: Payment[];
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export function PaymentsTable({ payments, canDelete, onDelete }: Props) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Date</TH>
          <TH>Student</TH>
          <TH className="text-right">Amount</TH>
          <TH>Partner shares</TH>
          <TH className="text-right">Company</TH>
          <TH>Method</TH>
          <TH>Note</TH>
          {canDelete && <TH />}
        </TR>
      </THead>
      <TBody>
        {payments.map((p) => (
          <TR key={p.id}>
            <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
            <TD>
              <Link href={`/students/${p.studentId}`} className="font-medium text-slate-900 hover:text-brand-700">{p.student?.name}</Link>
              <p className="text-xs text-slate-500">{p.student?.subject?.name} · {p.teacher?.user.name}</p>
            </TD>
            <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
            <TD><SharesCell shares={p.shares} /></TD>
            <TD className="text-right text-emerald-700">{money(p.companyShare)}</TD>
            <TD className="text-slate-500">{METHOD_LABEL[p.method] ?? p.method}</TD>
            <TD className="max-w-[180px] truncate text-slate-500">{p.note || "-"}</TD>
            {canDelete && (
              <TD className="text-right">
                <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onDelete(p.id)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </TD>
            )}
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
