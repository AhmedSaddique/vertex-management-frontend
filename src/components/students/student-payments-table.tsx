"use client";

import { Trash2 } from "lucide-react";
import { METHOD_LABEL, date, money } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { Card, CardHeader, EmptyState, TBody, TD, TH, THead, TR, Table } from "@/components/ui/display";

interface Props {
  payments: Payment[];
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export function SharesCell({ shares }: { shares: Payment["shares"] }) {
  if (shares.length === 0) return <span className="text-slate-400">-</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {shares.map((s) => (
        <span key={s.partnerId} className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800">{s.partnerName} {money(s.amount)}</span>
      ))}
    </div>
  );
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
              <TH>Partner shares</TH>
              <TH className="text-right">Company</TH>
              <TH>Installment</TH>
              {canDelete && <TH />}
            </TR>
          </THead>
          <TBody>
            {payments.map((p) => (
              <TR key={p.id}>
                <TD className="whitespace-nowrap">{date(p.paidAt)}{p.note && <p className="max-w-[160px] truncate text-xs text-slate-400">{p.note}</p>}</TD>
                <TD className="text-right font-medium text-slate-900">{money(p.amount)}</TD>
                <TD>{METHOD_LABEL[p.method] ?? p.method}</TD>
                <TD><SharesCell shares={p.shares} /></TD>
                <TD className="text-right text-emerald-700">{money(p.companyShare)}</TD>
                <TD className="whitespace-nowrap text-slate-500">{p.installment ? `Due ${date(p.installment.dueDate)}` : "-"}</TD>
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
