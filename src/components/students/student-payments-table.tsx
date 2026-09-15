"use client";

import { Trash2 } from "lucide-react";
import { METHOD_LABEL, date, money, percent } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { Card, CardHeader, EmptyState, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";

interface Props {
  payments: Payment[];
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export function StudentPaymentsTable({ payments, canDelete, onDelete }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Fee payments" description={`${payments.length} payment${payments.length === 1 ? "" : "s"} recorded`} />
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description={canDelete ? "Record the first payment to start tracking the balance." : undefined} />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Date</TH>
              <TH className="text-right">Amount</TH>
              <TH>Method</TH>
              <TH className="text-right">Teacher share</TH>
              <TH className="text-right">Company share</TH>
              <TH>Note</TH>
              {canDelete && <TH />}
            </TR>
          </THead>
          <TBody>
            {payments.map((p) => (
              <TR key={p.id}>
                <TD className="whitespace-nowrap">{date(p.paidAt)}</TD>
                <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
                <TD>{METHOD_LABEL[p.method] ?? p.method}</TD>
                <TD className="text-right text-amber-700">
                  {money(p.teacherShare)} <span className="text-xs text-slate-400">({percent(p.commissionPercent)})</span>
                </TD>
                <TD className="text-right text-emerald-700">{money(p.companyShare ?? p.amount - p.teacherShare)}</TD>
                <TD className="max-w-[200px] truncate text-slate-500">{p.note || "-"}</TD>
                {canDelete && (
                  <TD className="text-right">
                    <button className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => onDelete(p.id)} title="Delete payment">
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
  );
}
