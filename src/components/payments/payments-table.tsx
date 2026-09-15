"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { METHOD_LABEL, date, money, percent } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";

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
          <TH>Teacher</TH>
          <TH className="text-right">Amount</TH>
          <TH className="text-right">Teacher share</TH>
          <TH className="text-right">Company share</TH>
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
              <p className="text-xs text-slate-500">{p.student?.subject?.name}</p>
            </TD>
            <TD>
              {p.teacher?.user.name} <span className="text-xs text-slate-400">({percent(p.commissionPercent)})</span>
            </TD>
            <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
            <TD className="text-right text-amber-700">{money(p.teacherShare)}</TD>
            <TD className="text-right text-emerald-700">{money(p.companyShare ?? p.amount - p.teacherShare)}</TD>
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
